import { routeById, routes } from '../data/routes';
import { interStationTimes } from '../data/interStationTimes';
import { interchanges, isEstimated, lineById, stationById, stationGroup, walkSeconds } from '../data/network';
import type {
  Arrival,
  Direction,
  DirectionPlan,
  JourneyLeg,
  JourneyOption,
  Route,
  RoutePlan,
  ScheduledDeparture,
  TrainPosition,
} from '../types';
import { bearingDegrees, haversineKm, interpolate } from './geo';
import {
  addDays,
  atIstanbulTime,
  dayKey,
  dayType,
  formatTime,
  hasLateNight,
  istanbulMidnight,
} from './time';

const MINUTE_MS = 60_000;
const CHANGE_MS = 60_000;
const JOURNEY_HORIZON_MS = 8 * 60 * MINUTE_MS;
const MAX_TRANSFER_WAIT_MS = 60 * MINUTE_MS;
const ALTERNATIVE_SLACK_MS = 25 * MINUTE_MS;

export { stationById };

const TRAIN_PREFIX: Record<string, string> = {
  'marmaray-full': 'M',
  'marmaray-short': 'S',
  'marmaray-evening': 'E',
};

const runTimes = new Map(
  interStationTimes.map((entry) => [`${entry.fromStationId}>${entry.toStationId}`, entry.time])
);

function segmentTime(fromStationId: string, toStationId: string): number {
  return (
    runTimes.get(`${fromStationId}>${toStationId}`) ??
    runTimes.get(`${toStationId}>${fromStationId}`) ??
    120
  );
}

function buildDirectionPlan(route: Route, direction: Direction): DirectionPlan {
  const stationIds = direction === 'forward' ? route.stations : [...route.stations].reverse();
  const segments: DirectionPlan['segments'] = [];
  const offsets = [0];
  let totalTime = 0;

  for (let index = 0; index < stationIds.length - 1; index += 1) {
    const fromStationId = stationIds[index];
    const toStationId = stationIds[index + 1];
    const from = stationById.get(fromStationId);
    const to = stationById.get(toStationId);
    const travelTime = segmentTime(fromStationId, toStationId);
    const distance = from && to ? haversineKm(from.coordinates, to.coordinates) : 0;

    segments.push({ fromStationId, toStationId, travelTime, distance });
    totalTime += travelTime;
    offsets.push(totalTime);
  }

  return { stationIds, segments, offsets, totalTime };
}

const planCache = new Map<string, RoutePlan>();

export function getRoutePlan(routeId: string): RoutePlan | null {
  const cached = planCache.get(routeId);
  if (cached) return cached;

  const route = routeById.get(routeId);
  if (!route) return null;

  const plan: RoutePlan = {
    route,
    forward: buildDirectionPlan(route, 'forward'),
    backward: route.service.backward ? buildDirectionPlan(route, 'backward') : null,
  };
  planCache.set(routeId, plan);
  return plan;
}

export function getRouteDirections(route: Route): Direction[] {
  return route.service.backward ? ['forward', 'backward'] : ['forward'];
}

const departureCache = new Map<string, ScheduledDeparture[]>();

export function getDeparturesForDay(
  route: Route,
  direction: Direction,
  day: Date
): ScheduledDeparture[] {
  const cacheKey = `${route.id}|${direction}|${dayKey(day)}`;
  const cached = departureCache.get(cacheKey);
  if (cached) return cached;

  const service = direction === 'forward' ? route.service.forward : route.service.backward;
  if (!service) return [];

  let times: number[];
  if (service.kind === 'headway') {
    const window = hasLateNight(day) ? service.lateNight : service.standard;
    const start = atIstanbulTime(day, window.firstDeparture).getTime();
    const end = atIstanbulTime(day, window.lastDeparture).getTime();
    times = [];
    for (let time = start; time <= end; time += service.frequency * MINUTE_MS) times.push(time);
    if (times[times.length - 1] !== end) times.push(end);
  } else {
    times = service.departures[dayType(day)].map((seconds) => day.getTime() + seconds * 1000);
  }

  const departures = times.map((time) => ({
    key: `${route.id}|${direction}|${time}`,
    routeId: route.id,
    direction,
    departureTime: new Date(time),
  }));

  departureCache.set(cacheKey, departures);
  return departures;
}

interface Run {
  route: Route;
  plan: DirectionPlan;
  direction: Direction;
  departure: ScheduledDeparture;
}

function* runsNear(now: Date, daysBack: number, daysForward: number): Generator<Run> {
  const midnight = istanbulMidnight(now);
  for (let offset = -daysBack; offset <= daysForward; offset += 1) {
    const day = addDays(midnight, offset);
    for (const route of routes) {
      const routePlan = getRoutePlan(route.id);
      if (!routePlan) continue;
      for (const direction of getRouteDirections(route)) {
        const plan = direction === 'forward' ? routePlan.forward : routePlan.backward;
        if (!plan) continue;
        for (const departure of getDeparturesForDay(route, direction, day)) {
          yield { route, plan, direction, departure };
        }
      }
    }
  }
}

function isRunLive(run: Run, now: number): boolean {
  const start = run.departure.departureTime.getTime();
  return now >= start && now < start + run.plan.totalTime * 1000;
}

function positionForRun(run: Run, now: Date): TrainPosition | null {
  const { plan, departure, route } = run;
  const elapsed = (now.getTime() - departure.departureTime.getTime()) / 1000;
  if (elapsed < 0 || elapsed >= plan.totalTime) return null;

  let segmentIndex = 0;
  while (segmentIndex < plan.segments.length - 1 && elapsed >= plan.offsets[segmentIndex + 1]) {
    segmentIndex += 1;
  }

  const segment = plan.segments[segmentIndex];
  const segmentStart = plan.offsets[segmentIndex];
  const segmentProgress =
    segment.travelTime > 0
      ? Math.max(0, Math.min(1, (elapsed - segmentStart) / segment.travelTime))
      : 0;

  const from = stationById.get(segment.fromStationId);
  const to = stationById.get(segment.toStationId);
  if (!from || !to) return null;

  const destinationStationId = plan.stationIds[plan.stationIds.length - 1];
  const prefix = TRAIN_PREFIX[route.id] ?? lineById.get(route.lineId)?.code ?? 'T';

  return {
    id: departure.key,
    routeId: route.id,
    lineId: route.lineId,
    routeColor: route.color,
    direction: run.direction,
    departureTime: departure.departureTime,
    originStationId: plan.stationIds[0],
    destinationStationId,
    destinationName: stationById.get(destinationStationId)?.name ?? '',
    displayName: `${prefix} ${formatTime(departure.departureTime)}`,
    coordinates: interpolate(from.coordinates, to.coordinates, segmentProgress),
    segmentIndex,
    segmentProgress,
    routeProgress: elapsed / plan.totalTime,
    bearing: bearingDegrees(from.coordinates, to.coordinates),
    fromStationId: segment.fromStationId,
    toStationId: segment.toStationId,
    nextStationId: segment.toStationId,
    nextStationEtaSeconds: Math.max(0, segment.travelTime - (elapsed - segmentStart)),
  };
}

/** All trains currently between their origin and destination. Stateless. */
export function getActiveTrains(now: Date): TrainPosition[] {
  const trains: TrainPosition[] = [];
  for (const run of runsNear(now, 1, 0)) {
    if (isEstimated(run.route.lineId)) continue;
    const position = positionForRun(run, now);
    if (position) trains.push(position);
  }
  return trains.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
}

/** Departures from a stop, including every platform of an interchange. */
export function getStationArrivals(stationId: string, now: Date, limit = 10): Arrival[] {
  const platforms = stationGroup(stationId);
  const arrivals: Arrival[] = [];
  const earliest = now.getTime() - 30_000;

  for (const run of runsNear(now, 1, 1)) {
    const { plan, route, departure } = run;
    const destinationStationId = plan.stationIds[plan.stationIds.length - 1];

    for (const platform of platforms) {
      const stationIndex = plan.stationIds.indexOf(platform);
      if (stationIndex === -1 || destinationStationId === platform) continue;

      const arrivalTime = new Date(
        departure.departureTime.getTime() + plan.offsets[stationIndex] * 1000
      );
      if (arrivalTime.getTime() < earliest) continue;

      arrivals.push({
        id: departure.key,
        routeId: route.id,
        lineId: route.lineId,
        stationId: platform,
        routeColor: route.color,
        direction: run.direction,
        originStationId: plan.stationIds[0],
        destinationStationId,
        destinationName: stationById.get(destinationStationId)?.name ?? '',
        arrivalTime,
        minutesAway: Math.max(0, Math.ceil((arrivalTime.getTime() - now.getTime()) / MINUTE_MS)),
        isLive: isRunLive(run, now.getTime()),
      });
    }
  }

  return arrivals
    .sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())
    .slice(0, limit);
}

export interface NetworkStatus {
  isLive: boolean;
  activeTrains: number;
  nextDeparture: Date | null;
}

export function getNetworkStatus(now: Date, trains: TrainPosition[]): NetworkStatus {
  if (trains.length > 0) {
    return { isLive: true, activeTrains: trains.length, nextDeparture: null };
  }

  let nextDeparture: Date | null = null;
  for (const { departure, route } of runsNear(now, 0, 1)) {
    if (isEstimated(route.lineId)) continue;
    const time = departure.departureTime.getTime();
    if (time <= now.getTime()) continue;
    if (!nextDeparture || time < nextDeparture.getTime()) nextDeparture = departure.departureTime;
  }

  return { isLive: false, activeTrains: 0, nextDeparture };
}

export interface LineSummary {
  firstDeparture: Date | null;
  lastDeparture: Date | null;
  headway: [number, number] | null; // typical minutes between trains, low and high
}

/** Today's span and typical headway of a line, from its longest pattern. */
export function getLineSummary(lineId: string, now: Date): LineSummary {
  const day = istanbulMidnight(now);
  const lineRoutes = routes.filter((route) => route.lineId === lineId);
  const starts = lineRoutes
    .flatMap((route) => getDeparturesForDay(route, 'forward', day))
    .map((departure) => departure.departureTime.getTime());
  if (starts.length === 0) return { firstDeparture: null, lastDeparture: null, headway: null };

  const main = lineRoutes.reduce((a, b) => (b.stations.length > a.stations.length ? b : a));
  const mainStarts = getDeparturesForDay(main, 'forward', day).map((d) => d.departureTime.getTime());
  const gaps = mainStarts
    .slice(1)
    .map((time, index) => Math.round((time - mainStarts[index]) / MINUTE_MS))
    .filter((gap) => gap > 0 && gap <= 30)
    .sort((a, b) => a - b);
  const pick = (q: number) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];

  return {
    firstDeparture: new Date(Math.min(...starts)),
    lastDeparture: new Date(Math.max(...starts)),
    headway: gaps.length ? [pick(0.1), pick(0.9)] : null,
  };
}

interface Connection {
  dep: number;
  arr: number;
  from: string;
  to: string;
  index: number; // segment index within the run
  run: Run;
}

let connectionCache: { key: number; connections: Connection[] } | null = null;

/** Every train hop between adjacent stops departing in the next few hours, by time. */
function connectionsFrom(now: Date): Connection[] {
  const key = Math.floor(now.getTime() / MINUTE_MS);
  if (connectionCache?.key === key) return connectionCache.connections;

  const start = key * MINUTE_MS - MINUTE_MS;
  const end = start + JOURNEY_HORIZON_MS;
  const connections: Connection[] = [];

  for (const run of runsNear(now, 1, 1)) {
    const base = run.departure.departureTime.getTime();
    if (base > end || base + run.plan.totalTime * 1000 < start) continue;
    run.plan.segments.forEach((segment, index) => {
      const dep = base + run.plan.offsets[index] * 1000;
      if (dep < start || dep > end) return;
      connections.push({
        dep,
        arr: base + run.plan.offsets[index + 1] * 1000,
        from: segment.fromStationId,
        to: segment.toStationId,
        index,
        run,
      });
    });
  }

  connections.sort((a, b) => a.dep - b.dep || a.arr - b.arr);
  connectionCache = { key, connections };
  return connections;
}

const walkLinks = new Map<string, { to: string; seconds: number }[]>();
for (const interchange of interchanges) {
  for (const from of interchange.stationIds) {
    for (const to of interchange.stationIds) {
      if (from === to) continue;
      const list = walkLinks.get(from) ?? [];
      list.push({ to, seconds: walkSeconds(from, to) });
      walkLinks.set(from, list);
    }
  }
}

type Reached =
  | { kind: 'ride'; enter: Connection; exit: Connection }
  | { kind: 'walk'; from: string; seconds: number };

/**
 * Connection Scan Algorithm: earliest arrival at any platform of the target
 * stop, leaving any platform of the source stop at or after `t0`.
 */
function earliestJourney(
  sources: string[],
  targets: string[],
  t0: number,
  connections: Connection[],
  banned: Set<string> = new Set() // line ids, and platforms where no train may be boarded
): JourneyLeg[] | null {
  const arrival = new Map<string, number>(sources.map((id) => [id, t0]));
  const reached = new Map<string, Reached>();
  const boarded = new Map<string, Connection>();
  const targetSet = new Set(targets);
  let best = Infinity;

  let low = 0;
  let high = connections.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (connections[mid].dep < t0) low = mid + 1;
    else high = mid;
  }

  for (let i = low; i < connections.length; i += 1) {
    const c = connections[i];
    if (c.dep >= best) break;
    const trip = c.run.departure.key;

    if (!boarded.has(trip)) {
      if (banned.has(c.run.route.lineId) || banned.has(c.from)) continue;
      const ready = arrival.get(c.from);
      if (ready === undefined) continue;
      const via = reached.get(c.from);
      const change = via?.kind === 'ride' ? CHANGE_MS : 0;
      if (ready + change > c.dep) continue;
      boarded.set(trip, c);
    }

    if (c.arr >= (arrival.get(c.to) ?? Infinity)) continue;
    arrival.set(c.to, c.arr);
    reached.set(c.to, { kind: 'ride', enter: boarded.get(trip)!, exit: c });
    if (targetSet.has(c.to)) best = Math.min(best, c.arr);

    for (const link of banned.has(c.to) ? [] : (walkLinks.get(c.to) ?? [])) {
      const time = c.arr + link.seconds * 1000;
      if (time < (arrival.get(link.to) ?? Infinity)) {
        arrival.set(link.to, time);
        reached.set(link.to, { kind: 'walk', from: c.to, seconds: link.seconds });
        if (targetSet.has(link.to)) best = Math.min(best, time);
      }
    }
  }

  if (best === Infinity) return null;
  let stop = targets.reduce((a, b) =>
    (arrival.get(b) ?? Infinity) < (arrival.get(a) ?? Infinity) ? b : a
  );

  const legs: JourneyLeg[] = [];
  for (let via = reached.get(stop); via; via = reached.get(stop)) {
    if (via.kind === 'walk') {
      legs.unshift({ kind: 'walk', fromStationId: via.from, toStationId: stop, seconds: via.seconds });
      stop = via.from;
      continue;
    }
    const { run } = via.enter;
    legs.unshift({
      kind: 'ride',
      routeId: run.route.id,
      lineId: run.route.lineId,
      routeColor: run.route.color,
      direction: run.direction,
      fromStationId: via.enter.from,
      toStationId: via.exit.to,
      departureTime: new Date(via.enter.dep),
      arrivalTime: new Date(via.exit.arr),
      stationIds: run.plan.stationIds.slice(via.enter.index, via.exit.index + 2),
      isLive: isRunLive(run, t0),
    });
    stop = via.enter.from;
  }

  while (legs[legs.length - 1]?.kind === 'walk') legs.pop();
  return legs.length ? legs : null;
}

const journeyCache = new Map<string, JourneyOption[]>();

/** Next journeys, with transfers, none of which is beaten by a later one. Cached per minute. */
export function planJourney(
  fromStationId: string,
  toStationId: string,
  now: Date,
  limit = 5
): JourneyOption[] {
  const cacheKey = `${fromStationId}|${toStationId}|${limit}|${Math.floor(now.getTime() / MINUTE_MS)}`;
  const cached = journeyCache.get(cacheKey);
  if (cached) return cached;
  if (journeyCache.size > 32) journeyCache.clear();
  const options = searchJourneys(fromStationId, toStationId, now, limit);
  options.push(...alternativeJourneys(fromStationId, toStationId, now, options));
  journeyCache.set(cacheKey, options);
  return options;
}

function searchJourneys(
  fromStationId: string,
  toStationId: string,
  now: Date,
  limit: number
): JourneyOption[] {
  const sources = stationGroup(fromStationId);
  const targets = stationGroup(toStationId);
  if (sources.some((id) => targets.includes(id))) return [];

  const connections = connectionsFrom(now);
  const options: JourneyOption[] = [];
  let t0 = now.getTime() - 30_000;

  for (let attempt = 0; attempt < limit * 4 && options.length <= limit; attempt += 1) {
    const legs = earliestJourney(sources, targets, t0, connections);
    if (!legs) break;
    const rides = legs.filter((leg) => leg.kind === 'ride');
    const departureTime = rides[0].departureTime;
    const arrivalTime = rides[rides.length - 1].arrivalTime;
    t0 = departureTime.getTime() + 1000;
    const strands = rides.some(
      (ride, index) =>
        index > 0 && ride.departureTime.getTime() - rides[index - 1].arrivalTime.getTime() > MAX_TRANSFER_WAIT_MS
    );
    if (strands) continue;

    while (
      options.length &&
      options[options.length - 1].arrivalTime.getTime() >= arrivalTime.getTime()
    ) {
      options.pop();
    }
    options.push(toOption(legs, now));
  }

  return options.slice(0, limit);
}

function toOption(legs: JourneyLeg[], now: Date, alternative = false): JourneyOption {
  const rides = legs.filter((leg) => leg.kind === 'ride');
  const departureTime = rides[0].departureTime;
  const arrivalTime = rides[rides.length - 1].arrivalTime;
  return {
    id: rides.map((leg) => `${leg.routeId}@${leg.departureTime.getTime()}`).join('+'),
    departureTime,
    arrivalTime,
    waitMinutes: Math.max(0, Math.ceil((departureTime.getTime() - now.getTime()) / MINUTE_MS)),
    durationSeconds: (arrivalTime.getTime() - departureTime.getTime()) / 1000,
    fromStationId: rides[0].fromStationId,
    toStationId: rides[rides.length - 1].toStationId,
    legs,
    transfers: rides.length - 1,
    alternative,
  };
}

const routeSignature = (legs: JourneyLeg[]) =>
  legs.map((leg) => (leg.kind === 'ride' ? `${leg.lineId}:${leg.fromStationId}` : '')).join('|');

/**
 * Other ways to go: plan again with one transfer stop or one line of the best
 * journey ruled out, keeping distinct routes that arrive at most 25 min later
 * with at most one more transfer.
 */
function alternativeJourneys(
  fromStationId: string,
  toStationId: string,
  now: Date,
  options: JourneyOption[]
): JourneyOption[] {
  const best = options[0];
  if (!best) return [];
  const rides = best.legs.filter((leg) => leg.kind === 'ride');
  const bans = [
    ...rides.slice(1).map((ride) => new Set(stationGroup(ride.fromStationId))),
    ...rides.map((ride) => new Set([ride.lineId])),
  ];
  const sources = stationGroup(fromStationId);
  const targets = stationGroup(toStationId);
  const connections = connectionsFrom(now);
  const seen = new Set(options.map((option) => routeSignature(option.legs)));
  const found: JourneyOption[] = [];

  for (const banned of bans) {
    const legs = earliestJourney(sources, targets, now.getTime() - 30_000, connections, banned);
    if (!legs || seen.has(routeSignature(legs))) continue;
    const option = toOption(legs, now, true);
    if (option.arrivalTime.getTime() - best.arrivalTime.getTime() > ALTERNATIVE_SLACK_MS) continue;
    if (option.transfers > best.transfers + 1) continue;
    seen.add(routeSignature(legs));
    found.push(option);
  }
  return found.sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()).slice(0, 3);
}
