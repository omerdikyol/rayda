export interface Station {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  distanceFromStart: number; // km from the line's first station
  lineId: string;
}

export interface Line {
  id: string;
  code: string;
  name: string;
  mode: 'rail' | 'metro' | 'tram' | 'funicular' | 'cable' | 'bus';
  color: string;
  estimated?: boolean; // run times are estimates: no vehicles drawn, times shown with ~
  side?: 'europe' | 'asia';
  stationIds: string[]; // first to last terminus
}

/** Platforms of one stop on different lines. */
export interface Interchange {
  stationIds: string[];
}

export type Direction = 'forward' | 'backward';

export interface InterStationTime {
  fromStationId: string;
  toStationId: string;
  time: number; // seconds
}

export interface ServiceWindow {
  firstDeparture: string; // HH:mm Istanbul time from the origin terminus; may exceed 24:00
  lastDeparture: string;
}

export type DayType = 'weekday' | 'saturday' | 'sunday';

/** Fixed headway between two times. `lateNight` applies to Friday and Saturday service days. */
export interface HeadwayService {
  kind: 'headway';
  frequency: number; // minutes between departures
  standard: ServiceWindow;
  lateNight: ServiceWindow;
}

/** Explicit departures from the origin, in seconds after the service-day midnight. */
export interface TimetableService {
  kind: 'timetable';
  departures: Record<DayType, number[]>;
}

export type DirectionService = HeadwayService | TimetableService;

export interface Route {
  id: string;
  lineId: string;
  nameKey: string;
  shortNameKey: string;
  termini: [string, string];
  stations: string[];
  color: string;
  service: {
    forward: DirectionService;
    backward?: DirectionService;
  };
}

export interface RouteSegment {
  fromStationId: string;
  toStationId: string;
  travelTime: number; // seconds
  distance: number; // km
}

export interface DirectionPlan {
  stationIds: string[];
  segments: RouteSegment[];
  offsets: number[]; // cumulative travel time in seconds at each station
  totalTime: number; // seconds
}

export interface RoutePlan {
  route: Route;
  forward: DirectionPlan;
  backward: DirectionPlan | null;
}

export interface ScheduledDeparture {
  key: string;
  routeId: string;
  direction: Direction;
  departureTime: Date; // departure from the origin terminus
}

export interface TrainPosition {
  id: string;
  routeId: string;
  lineId: string;
  routeColor: string;
  direction: Direction;
  departureTime: Date;
  originStationId: string;
  destinationStationId: string;
  destinationName: string;
  displayName: string;
  coordinates: [number, number];
  segmentIndex: number;
  segmentProgress: number; // 0-1 within the current segment
  routeProgress: number; // 0-1 across the whole run
  bearing: number; // degrees, 0 = north
  fromStationId: string;
  toStationId: string;
  nextStationId: string;
  nextStationEtaSeconds: number;
}

export interface Arrival {
  id: string;
  routeId: string;
  lineId: string;
  stationId: string;
  routeColor: string;
  direction: Direction;
  originStationId: string;
  destinationStationId: string;
  destinationName: string;
  arrivalTime: Date;
  minutesAway: number;
  isLive: boolean;
}

export type JourneyLeg =
  | {
      kind: 'ride';
      routeId: string;
      lineId: string;
      routeColor: string;
      direction: Direction;
      fromStationId: string;
      toStationId: string;
      departureTime: Date;
      arrivalTime: Date;
      stationIds: string[]; // every stop from boarding to alighting, inclusive
      isLive: boolean;
    }
  | {
      kind: 'walk';
      fromStationId: string;
      toStationId: string;
      seconds: number;
    };

export interface JourneyOption {
  id: string;
  departureTime: Date;
  arrivalTime: Date;
  waitMinutes: number;
  durationSeconds: number;
  fromStationId: string;
  toStationId: string;
  legs: JourneyLeg[];
  transfers: number;
  alternative: boolean; // a different route, not the next departure of the best one
}
