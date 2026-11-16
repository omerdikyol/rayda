import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ArrowRight, Minus, Plus, RotateCcw, Route as RouteIcon, X } from 'lucide-react';
import LineFilter from './LineFilter';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransit } from '../contexts/TransitContext';
import { useAppStore } from '../stores/appStore';
import {
  ENDPOINT_STATION_IDS,
  MAJOR_STATION_IDS,
  SECTION_LABEL_KEY,
  getStationSection,
  interchanges,
  lineById,
  lines,
  orderedStations,
  representativeId,
  stationById,
} from '../data/network';
import { curveAt, curvePath, projectNetwork, type ProjectedNetwork } from '../utils/geo';
import { getActiveTrains, planJourney } from '../utils/schedule';
import { useClock } from '../hooks/useClock';
import { formatMinutesAway } from '../utils/format';
import { routeName } from '../utils/labels';
import { formatDuration } from '../utils/format';
import { formatTime } from '../utils/time';

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DEFAULT_SIZE = { width: 1200, height: 700 };
const MAX_ZOOM = 12;
const LANE_OFFSET = 3.5;
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const INTERCHANGE_IDS = new Set(interchanges.flatMap((entry) => entry.stationIds));
const HUB_STATION_IDS = new Set([...ENDPOINT_STATION_IDS, ...INTERCHANGE_IDS, '18996', '19007', '282']);

/** Each station's line and position on it, for placing trains on the right curve. */
const stationPlace = new Map(
  lines.flatMap((line) => line.stationIds.map((id, index) => [id, { lineId: line.id, index }] as const))
);

const SIDE_LABELS: { key: string; at: [number, number] }[] = [
  { key: 'map.europe', at: [28.86, 41.045] },
  { key: 'map.asia', at: [29.2, 41.0] },
];

interface JourneyPath {
  kind: 'ride' | 'walk';
  d: string;
  color: string;
  reverse: boolean;
  seconds: number;
}

interface LabelInfo {
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  show: boolean;
}

/** Greedy label placement in view units; `k` converts screen px to view units. */
function computeLabels(
  network: ProjectedNetwork,
  compact: boolean,
  k: number,
  zoom: number,
  hidden: Set<string>,
  forced: Set<string>
): Record<string, LabelInfo> {
  const placed: { x: number; y: number; halfW: number }[] = [];
  const labels: Record<string, LabelInfo> = {};
  const halfH = 7 * k;

  const collides = (x: number, y: number, halfW: number) =>
    placed.some(
      (entry) => Math.abs(entry.x - x) < entry.halfW + halfW + 4 * k && Math.abs(entry.y - y) < halfH * 2 + 2 * k
    ) ||
    orderedStations.some((station) => {
      if (hidden.has(station.lineId)) return false;
      const point = network.points[station.id];
      return Math.abs(point.x - x) < halfW && Math.abs(point.y - y) < halfH;
    });

  const priority = (id: string) =>
    forced.has(id) ? -1 : ENDPOINT_STATION_IDS.has(id) ? 0 : INTERCHANGE_IDS.has(id) ? 1 : MAJOR_STATION_IDS.has(id) ? 2 : 3;
  const candidates = orderedStations
    .filter((station) => !hidden.has(station.lineId))
    .sort((a, b) => priority(a.id) - priority(b.id));

  for (const station of candidates) {
    const point = network.points[station.id];
    if (representativeId(station.id) !== station.id && !forced.has(station.id)) {
      labels[station.id] = { x: point.x, y: point.y, anchor: 'start', show: false };
      continue;
    }
    const rank = priority(station.id);
    const eligible =
      rank < 0 || (forced.size === 0 && (compact ? HUB_STATION_IDS.has(station.id) || zoom > 2.5 : rank < 3 || zoom > 1.8)) ||
      (forced.size > 0 && zoom > 2.5);
    const halfW = ((station.name.length * 6.1) / 2 + 4) * k;
    const options: LabelInfo[] = [
      { x: point.x + 9 * k, y: point.y + 4 * k, anchor: 'start', show: true },
      { x: point.x - 9 * k, y: point.y + 4 * k, anchor: 'end', show: true },
      { x: point.x, y: point.y - 10 * k, anchor: 'middle', show: true },
      { x: point.x, y: point.y + 17 * k, anchor: 'middle', show: true },
    ];
    const centerOf = (option: LabelInfo) =>
      option.anchor === 'start' ? option.x + halfW : option.anchor === 'end' ? option.x - halfW : option.x;

    const inside = (option: LabelInfo) =>
      centerOf(option) - halfW > 4 * k && centerOf(option) + halfW < network.width - 4 * k;
    const fit = eligible
      ? options.find((option) => inside(option) && !collides(centerOf(option), option.y - 4 * k, halfW))
      : undefined;
    if (fit) {
      placed.push({ x: centerOf(fit), y: fit.y - 4 * k, halfW });
      labels[station.id] = fit;
    } else {
      labels[station.id] = { ...options[0], show: rank < 0 };
    }
  }

  return labels;
}

function clampView(view: ViewBox, base: ViewBox): ViewBox {
  const w = Math.min(Math.max(view.w, base.w / MAX_ZOOM), base.w);
  const h = w * (base.h / base.w);
  const x = Math.min(Math.max(view.x, base.x), base.x + base.w - w);
  const y = Math.min(Math.max(view.y, base.y), base.y + base.h - h);
  return { x, y, w, h };
}

export default function LineMap() {
  const { t, language } = useLanguage();
  const { status, now: minuteNow } = useTransit();
  const now = useClock(250);
  const trains = useMemo(() => getActiveTrains(now), [now]);
  const selectedStationId = useAppStore((state) => state.selectedStationId);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const fromStationId = useAppStore((state) => state.fromStationId);
  const toStationId = useAppStore((state) => state.toStationId);
  const hiddenLineIds = useAppStore((state) => state.hiddenLines);
  const journeyOptionId = useAppStore((state) => state.journeyOptionId);
  const journeyFocus = useAppStore((state) => state.journeyFocus);
  const setJourneyFocus = useAppStore((state) => state.setJourneyFocus);
  const hiddenLines = useMemo(() => new Set(hiddenLineIds), [hiddenLineIds]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: DEFAULT_SIZE.width, h: DEFAULT_SIZE.height });
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<{ clientX: number; clientY: number; view: ViewBox } | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(260, Math.round(rect.height));
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const baseView = useMemo(
    () => ({ x: 0, y: 0, w: size.width, h: size.height }),
    [size.height, size.width]
  );

  useEffect(() => {
    setView(baseView);
  }, [baseView]);

  const compact = size.width < 640;
  const network = useMemo(
    () => projectNetwork(orderedStations, size.width, size.height, compact ? 20 : 48, compact ? 104 : 72),
    [compact, size.height, size.width]
  );

  const zoom = baseView.w / view.w;
  const k = 1 / zoom;
  // Lay labels out at the zoom step at or below the real zoom so they never crowd, and only
  // re-run the layout when a step (×√2) is crossed.
  const labelZoom = Math.SQRT2 ** Math.floor(Math.log(zoom) / Math.log(Math.SQRT2) + 1e-6);

  const linePoints = useMemo(
    () =>
      Object.fromEntries(
        lines.map((line) => [line.id, line.stationIds.map((id) => network.points[id])])
      ),
    [network]
  );

  const journey = useMemo(() => {
    if (!journeyFocus || !fromStationId || !toStationId || fromStationId === toStationId) return null;
    const options = planJourney(fromStationId, toStationId, minuteNow, 6);
    return options.find((option) => option.id === journeyOptionId) ?? options[0] ?? null;
  }, [fromStationId, journeyFocus, journeyOptionId, minuteNow, toStationId]);

  /** Ride legs as curves drawn in travel order, walks as straight links. */
  const journeyLegs = useMemo(() => {
    if (!journey) return [];
    return journey.legs.flatMap((leg): JourneyPath[] => {
      const from = network.points[leg.fromStationId];
      const to = network.points[leg.toStationId];
      if (leg.kind === 'walk') return [{ kind: 'walk', d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`, color: '#E8EAEE', reverse: false, seconds: leg.seconds }];
      const a = stationPlace.get(leg.fromStationId);
      const b = stationPlace.get(leg.toStationId);
      if (!a || !b || a.lineId !== b.lineId) return [];
      return [{
        kind: 'ride',
        d: curvePath(linePoints[a.lineId], Math.min(a.index, b.index), Math.max(a.index, b.index)),
        color: leg.routeColor,
        reverse: a.index > b.index,
        seconds: (leg.arrivalTime.getTime() - leg.departureTime.getTime()) / 1000,
      }];
    });
  }, [journey, linePoints, network]);

  const journeyLineIds = useMemo(
    () => [...new Set(journey?.legs.flatMap((leg) => (leg.kind === 'ride' ? [leg.lineId] : [])) ?? [])],
    [journey]
  );
  const journeyStops = useMemo(
    () => new Set(journey?.legs.flatMap((leg) => [leg.fromStationId, leg.toStationId]) ?? []),
    [journey]
  );
  const journeyLabelIds = useMemo(
    () => new Set([...journeyStops].map(representativeId)),
    [journeyStops]
  );
  const journeyStations = useMemo(
    () => new Set(journey?.legs.flatMap((leg) => (leg.kind === 'ride' ? leg.stationIds : [])) ?? []),
    [journey]
  );

  const labels = useMemo(
    () => computeLabels(network, compact, 1 / labelZoom, labelZoom, hiddenLines, journeyLabelIds),
    [compact, hiddenLines, journeyLabelIds, labelZoom, network]
  );

  const selectedStation = stationById.get(selectedStationId);
  const hoveredStation = hoveredStationId ? stationById.get(hoveredStationId) : null;
  const selectedTrain = selectedTrainId
    ? (trains.find((train) => train.id === selectedTrainId) ?? null)
    : null;
  const selectedGroup = new Set(
    orderedStations.filter((s) => representativeId(s.id) === representativeId(selectedStationId)).map((s) => s.id)
  );

  const zoomBy = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      setView((current) => {
        const nextWidth = Math.min(Math.max(current.w / factor, baseView.w / MAX_ZOOM), baseView.w);
        const nextHeight = nextWidth * (baseView.h / baseView.w);
        let anchorX = current.x + current.w / 2;
        let anchorY = current.y + current.h / 2;

        if (clientX != null && clientY != null && svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          anchorX = current.x + ((clientX - rect.left) / rect.width) * current.w;
          anchorY = current.y + ((clientY - rect.top) / rect.height) * current.h;
        }

        const ratioX = (anchorX - current.x) / current.w;
        const ratioY = (anchorY - current.y) / current.h;
        return clampView(
          { x: anchorX - ratioX * nextWidth, y: anchorY - ratioY * nextHeight, w: nextWidth, h: nextHeight },
          baseView
        );
      });
    },
    [baseView]
  );

  const viewRef = useRef(view);
  viewRef.current = view;
  const flightRef = useRef(0);

  const flyTo = useCallback((target: ViewBox) => {
    cancelAnimationFrame(flightRef.current);
    const from = viewRef.current;
    const start = performance.now();
    const step = (time: number) => {
      const progress = Math.min(1, (time - start) / 650);
      const ease = 1 - (1 - progress) ** 3;
      setView({
        x: from.x + (target.x - from.x) * ease,
        y: from.y + (target.y - from.y) * ease,
        w: from.w + (target.w - from.w) * ease,
        h: from.h + (target.h - from.h) * ease,
      });
      if (progress < 1) flightRef.current = requestAnimationFrame(step);
    };
    flightRef.current = requestAnimationFrame(step);
  }, []);
  const stopFlight = () => cancelAnimationFrame(flightRef.current);

  const journeyStationsRef = useRef(journeyStations);
  journeyStationsRef.current = journeyStations;
  const fitKey = journeyFocus ? `${fromStationId}|${toStationId}|${journeyOptionId}` : '';

  useEffect(() => {
    const ids = [...journeyStationsRef.current];
    if (!fitKey || ids.length === 0) return;
    const xs = ids.map((id) => network.points[id].x);
    const ys = ids.map((id) => network.points[id].y);
    const pad = compact ? 36 : 72;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const boxW = Math.max(...xs) + pad - minX;
    const boxH = Math.max(...ys) + pad + (compact ? 48 : 24) - minY;
    const w = Math.max(boxW, boxH * (baseView.w / baseView.h));
    const h = w * (baseView.h / baseView.w);
    flyTo(clampView({ x: minX + boxW / 2 - w / 2, y: minY + boxH / 2 - h / 2, w, h }, baseView));
  }, [baseView, compact, fitKey, flyTo, network]);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      cancelAnimationFrame(flightRef.current);
      // Scale by how far the wheel moved: a mouse notch (~100 px) is ~20%, a trackpad tick a few
      // percent, and a pinch (ctrlKey) is more sensitive because its deltas are small.
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      const delta = Math.max(-150, Math.min(150, pixels));
      zoomBy(Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0025)), event.clientX, event.clientY);
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [zoomBy]);

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<number | null>(null);

  const startDrag = (clientX: number, clientY: number) => {
    dragRef.current = { clientX, clientY, view };
    setIsPanning(true);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    stopFlight();
    const pointers = pointersRef.current;
    if (pointers.size === 0 && (event.target as Element).closest('[data-interactive]')) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      startDrag(event.clientX, event.clientY);
    } else {
      const [a, b] = [...pointers.values()];
      dragRef.current = null;
      pinchRef.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const pointers = pointersRef.current;
    if (!pointers.has(event.pointerId) || !svgRef.current) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinchRef.current != null && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomBy(distance / pinchRef.current, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinchRef.current = distance;
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const rect = svgRef.current.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.clientX) / rect.width) * drag.view.w;
    const deltaY = ((event.clientY - drag.clientY) / rect.height) * drag.view.h;
    setView(clampView({ ...drag.view, x: drag.view.x - deltaX, y: drag.view.y - deltaY }, baseView));
  };

  const endPan = (event: ReactPointerEvent<SVGSVGElement>) => {
    const pointers = pointersRef.current;
    pointers.delete(event.pointerId);
    pinchRef.current = null;
    const rest = [...pointers.values()][0];
    if (rest) {
      startDrag(rest.x, rest.y);
    } else {
      dragRef.current = null;
      setIsPanning(false);
    }
  };

  const selectNearestStation = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = view.x + ((clientX - rect.left) / rect.width) * view.w;
      const y = view.y + ((clientY - rect.top) / rect.height) * view.h;

      let nearestId: string | null = null;
      let nearestDistance = Infinity;
      for (const station of orderedStations) {
        if (hiddenLines.has(station.lineId)) continue;
        const point = network.points[station.id];
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = station.id;
        }
      }

      if (nearestId && nearestDistance <= 24 * (view.w / baseView.w)) {
        setSelectedStation(representativeId(nearestId));
        setSelectedTrainId(null);
      }
    },
    [baseView.w, hiddenLines, network, setSelectedStation, view]
  );

  const visibleStations = orderedStations.filter((station) => !hiddenLines.has(station.lineId));
  const focused = journeyLegs.length > 0;
  // Trains shrink when zoomed out so ~180 of them don't bury the lines, most on small screens.
  const trainScale = k * Math.min(1, (compact ? 0.5 : 0.75) + 0.2 * (zoom - 1));
  const dim = (on: boolean) => (focused && !on ? 0.2 : 1);
  const marmarayPoints = linePoints.marmaray;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-ink-950">
      <div className="map-grid absolute inset-0 opacity-60" />

      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className={`relative h-full w-full touch-none select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        role="img"
        aria-label={t('map.title')}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onDoubleClick={(event) => zoomBy(event.shiftKey ? 0.5 : 2, event.clientX, event.clientY)}
      >
        {!compact &&
          zoom < 1.2 &&
          SIDE_LABELS.map((label) => {
            const point = network.project(label.at);
            return (
              <text
                key={label.key}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                fontSize={12 * k}
                fontWeight={500}
                fill="#6F7684"
                pointerEvents="none"
              >
                {t(label.key)}
              </text>
            );
          })}

        {lines.map((line) =>
          hiddenLines.has(line.id) ? null : (
            <path
              key={line.id}
              d={curvePath(linePoints[line.id])}
              fill="none"
              stroke={line.color}
              strokeOpacity={dim(journeyLineIds.includes(line.id))}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )
        )}

        {!hiddenLines.has('marmaray') && (
          <path
            d={curvePath(marmarayPoints, 13, 15)}
            fill="none"
            stroke="#E8EAEE"
            strokeWidth={1.5}
            strokeOpacity={0.6}
            strokeLinecap="round"
            strokeDasharray="2 5"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {interchanges.map((interchange) => {
          const ids = interchange.stationIds.filter((id) => !hiddenLines.has(stationById.get(id)?.lineId ?? ''));
          if (ids.length < 2) return null;
          const [a, b] = ids.map((id) => network.points[id]);
          return (
            <line
              key={interchange.stationIds.join('-')}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#E8EAEE"
              strokeWidth={6}
              strokeOpacity={0.35 * dim(ids.some((id) => journeyStations.has(id)))}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {visibleStations.map((station) => {
          const point = network.points[station.id];
          const isSelected = selectedGroup.has(station.id);
          const isHovered = station.id === hoveredStationId;
          const isEndpoint = ENDPOINT_STATION_IDS.has(station.id);
          const isMajor = MAJOR_STATION_IDS.has(station.id) || isEndpoint || INTERCHANGE_IDS.has(station.id);
          const radius = (isEndpoint || INTERCHANGE_IDS.has(station.id) ? 5 : isMajor ? 4 : 3) * k;
          const line = lineById.get(station.lineId);

          return (
            <g
              key={station.id}
              data-interactive
              role="button"
              tabIndex={0}
              aria-label={`${station.name} — ${line?.code ?? ''}`}
              onPointerEnter={() => setHoveredStationId(station.id)}
              onPointerLeave={() => setHoveredStationId((current) => (current === station.id ? null : current))}
              onClick={(event) => {
                event.stopPropagation();
                selectNearestStation(event.clientX, event.clientY);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedStation(representativeId(station.id));
                }
              }}
              className="cursor-pointer outline-none"
              opacity={dim(journeyStations.has(station.id))}
            >
              <circle cx={point.x} cy={point.y} r={12 * k} fill="transparent" />
              {isSelected && (
                <circle cx={point.x} cy={point.y} r={11 * k} fill="none" stroke="#F5F6F8" strokeWidth={1.2 * k} strokeOpacity={0.6} />
              )}
              <circle
                cx={point.x}
                cy={point.y}
                r={radius + (isHovered ? 1.5 * k : 0)}
                fill={isSelected ? '#F5F6F8' : '#0B0C0E'}
                stroke={isSelected ? '#F5F6F8' : (line?.color ?? '#8C93A0')}
                strokeWidth={1.8 * k}
              />
            </g>
          );
        })}

        {focused && (
          <g key={`${journey?.id}-${network.width}`} pointerEvents="none">
            {journeyLegs.map((leg, index) =>
              leg.kind === 'walk' ? (
                <path
                  key={index}
                  d={leg.d}
                  fill="none"
                  stroke="#E8EAEE"
                  strokeWidth={2.5}
                  strokeDasharray="0.5 6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className="journey-fade"
                  style={{ animationDelay: `${index * 0.3}s` }}
                />
              ) : (
                <g key={index}>
                  <path
                    d={leg.d}
                    fill="none"
                    stroke="#0B0C0E"
                    strokeWidth={13 * k}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    className={leg.reverse ? 'journey-draw-rev' : 'journey-draw'}
                    style={{ animationDelay: `${index * 0.3}s` }}
                  />
                  <path
                    d={leg.d}
                    fill="none"
                    stroke={leg.color}
                    strokeWidth={8 * k}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    className={leg.reverse ? 'journey-draw-rev' : 'journey-draw'}
                    style={{ animationDelay: `${index * 0.3}s` }}
                  />
                  {!reducedMotion && (
                    <circle r={3.2 * k} fill="#F5F6F8" opacity={0}>
                      <animate attributeName="opacity" to="0.95" dur="0.3s" begin={`${0.9 + index * 0.3}s`} fill="freeze" />
                      <animateMotion
                        path={leg.d}
                        dur={`${Math.min(7, Math.max(2.5, leg.seconds / 400))}s`}
                        begin={`${0.9 + index * 0.3}s`}
                        repeatCount="indefinite"
                        keyPoints={leg.reverse ? '1;0' : '0;1'}
                        keyTimes="0;1"
                        calcMode="linear"
                      />
                    </circle>
                  )}
                </g>
              )
            )}

            {[...journeyStops].map((id) => {
              const point = network.points[id];
              const isOrigin = id === journey?.fromStationId;
              const isEnd = id === journey?.toStationId;
              return (
                <g key={id} transform={`translate(${point.x} ${point.y}) scale(${k})`}>
                  {isOrigin && !reducedMotion && (
                    <circle r={8} fill="none" stroke="#F5F6F8" strokeWidth={1.5}>
                      <animate attributeName="r" values="8;22" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    r={isOrigin || isEnd ? 7.5 : 5.5}
                    fill={isEnd ? '#F5F6F8' : '#0B0C0E'}
                    stroke="#F5F6F8"
                    strokeWidth={2.5}
                    className="journey-pop"
                  />
                  {isOrigin && <circle r={2.5} fill="#F5F6F8" />}
                </g>
              );
            })}
          </g>
        )}

        {trains.map((train) => {
          if (hiddenLines.has(train.lineId)) return null;
          const from = stationPlace.get(train.fromStationId);
          const to = stationPlace.get(train.toStationId);
          if (!from || !to) return null;
          const reversed = from.index > to.index;
          const { point, angle: lineAngle } = curveAt(
            linePoints[from.lineId],
            Math.min(from.index, to.index),
            reversed ? 1 - train.segmentProgress : train.segmentProgress
          );
          const angle = reversed ? lineAngle + 180 : lineAngle;
          const radians = (lineAngle * Math.PI) / 180;
          const lane = (reversed ? -LANE_OFFSET : LANE_OFFSET) * k;
          const x = point.x - Math.sin(radians) * lane;
          const y = point.y + Math.cos(radians) * lane;
          const isSelected = train.id === selectedTrainId;

          return (
            <g
              key={train.id}
              data-interactive
              role="button"
              tabIndex={0}
              aria-label={`${train.displayName} ${t('map.towards')} ${train.destinationName}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedTrainId((current) => (current === train.id ? null : train.id));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedTrainId(train.id);
                }
              }}
              className="cursor-pointer"
              opacity={dim(journeyLineIds.includes(train.lineId))}
              transform={`translate(${x} ${y}) rotate(${angle}) scale(${trainScale})`}
            >
              {isSelected && <circle r={13} fill="none" stroke="#F5F6F8" strokeWidth={1} opacity={0.6} />}
              <rect
                x={-7}
                y={-4}
                width={14}
                height={8}
                rx={4}
                fill={train.routeColor}
                stroke={isSelected ? '#F5F6F8' : '#0B0C0E'}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              <path d="M -1.5 -2 L 3 0 L -1.5 2 Z" fill="#0B0C0E" opacity={0.85} />
            </g>
          );
        })}

        {visibleStations.map((station) => {
          const label = labels[station.id];
          const isSelected = selectedGroup.has(station.id);
          const isHovered = station.id === hoveredStationId;
          const isPrimary = representativeId(station.id) === station.id;
          if (!(label.show || isHovered || (isSelected && isPrimary))) return null;
          const strong = isSelected || isHovered;
          const major = MAJOR_STATION_IDS.has(station.id) || ENDPOINT_STATION_IDS.has(station.id);
          const scale = labelZoom / zoom;

          return (
            <text
              key={`label-${station.id}`}
              x={network.points[station.id].x + (label.x - network.points[station.id].x) * scale}
              y={network.points[station.id].y + (label.y - network.points[station.id].y) * scale}
              textAnchor={label.anchor}
              fontSize={11 * k}
              fontWeight={strong ? 600 : major ? 500 : 400}
              fill={strong ? '#F5F6F8' : major ? '#D0D4DB' : '#8C93A0'}
              stroke="#0B0C0E"
              strokeWidth={3.5 * k}
              paintOrder="stroke"
              pointerEvents="none"
            >
              {station.name}
            </text>
          );
        })}

        {hoveredStation &&
          (() => {
            const point = network.points[hoveredStation.id];
            const line = lineById.get(hoveredStation.lineId);
            const text = `${line?.code ?? ''} · ${hoveredStation.name}`;
            const width = text.length * 6.4 + 24;
            const boxY = point.y - view.y > 50 * k ? -36 : 14;
            return (
              <g pointerEvents="none" transform={`translate(${point.x} ${point.y}) scale(${k})`}>
                <rect x={-width / 2} y={boxY} width={width} height={24} rx={8} fill="#14171A" stroke="#343942" />
                <text x={0} y={boxY + 16} textAnchor="middle" fontSize={11} fontWeight={500} fill="#E8EAEE">
                  {text}
                </text>
              </g>
            );
          })()}
      </svg>

      {focused && journey ? (
        <div className="glass absolute left-3 right-16 top-3 z-20 flex items-center gap-2 rounded-xl py-1.5 pl-3 pr-1.5 shadow-panel animate-fade-up sm:left-4 sm:right-auto sm:top-4 sm:max-w-[420px]">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px]">
            <span className="truncate font-medium text-mist-50">{stationById.get(journey.fromStationId)?.name}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-mist-500" />
            <span className="truncate font-medium text-mist-50">{stationById.get(journey.toStationId)?.name}</span>
            <span className="shrink-0 font-mono text-[11px] text-mist-400">
              {formatTime(journey.departureTime)} · {formatDuration(journey.durationSeconds, language)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setJourneyFocus(false);
              flyTo(baseView);
            }}
            aria-label={t('map.close')}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-mist-400 hover:bg-ink-800 hover:text-mist-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        fromStationId &&
        toStationId &&
        fromStationId !== toStationId && (
          <button
            type="button"
            onClick={() => setJourneyFocus(true)}
            className="glass absolute left-3 top-3 z-20 flex h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-medium text-mist-300 shadow-panel transition-colors hover:text-mist-50 sm:left-4 sm:top-4"
          >
            <RouteIcon className="h-4 w-4" />
            {t('map.showJourney')}
          </button>
        )
      )}

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => zoomBy(1.35)}
          aria-label={t('map.zoomIn')}
          className="glass grid h-8 w-8 place-items-center rounded-lg text-mist-300 transition-colors hover:text-mist-50"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.74)}
          aria-label={t('map.zoomOut')}
          className="glass grid h-8 w-8 place-items-center rounded-lg text-mist-300 transition-colors hover:text-mist-50"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => flyTo(baseView)}
          aria-label={t('map.reset')}
          className="glass grid h-8 w-8 place-items-center rounded-lg text-mist-400 transition-colors hover:text-mist-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {selectedTrain && (
        <div className="glass absolute right-4 top-40 z-20 w-[248px] rounded-2xl p-3.5 shadow-panel animate-fade-up">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-mist-500">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selectedTrain.routeColor }} />
                {lineById.get(selectedTrain.lineId)?.code} · {routeName(selectedTrain.routeId, t)}
              </div>
              <div className="mt-1 font-mono text-[15px] font-semibold text-mist-50">{selectedTrain.displayName}</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTrainId(null)}
              aria-label={t('map.close')}
              className="grid h-6 w-6 place-items-center rounded-md text-mist-500 hover:bg-ink-800 hover:text-mist-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-mist-500">{t('map.destination')}</span>
              <span className="font-medium text-mist-100">{selectedTrain.destinationName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-mist-500">{t('map.nextStop')}</span>
              <span className="font-medium text-mist-100">{stationById.get(selectedTrain.nextStationId)?.name}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-mist-500">{t('map.eta')}</span>
              <span className="font-mono font-semibold text-mint">
                {formatMinutesAway(Math.max(1, Math.ceil(selectedTrain.nextStationEtaSeconds / 60)), language)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-mist-500">{t('map.departed')}</span>
              <span className="font-mono text-mist-300">{formatTime(selectedTrain.departureTime)}</span>
            </div>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, selectedTrain.routeProgress * 100)}%`,
                backgroundColor: selectedTrain.routeColor,
              }}
            />
          </div>
        </div>
      )}

      {!status.isLive && status.nextDeparture && !focused && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-ink-700/80 bg-ink-900/90 px-3 py-1.5 text-[11px] text-mist-400">
          {t('map.noServiceNow')} ·{' '}
          <span className="font-mono text-mist-200">{formatTime(status.nextDeparture)}</span>
        </div>
      )}

      <LineFilter journeyLineIds={journeyLineIds} />

      {selectedStation && (
        <div className="glass absolute bottom-4 right-4 z-20 max-w-[50%] truncate rounded-full px-3 py-1.5 text-[11px] text-mist-300 shadow-panel sm:hidden">
          <span className="font-medium text-mist-100">{selectedStation.name}</span>
          <span className="mx-1.5 text-mist-600">·</span>
          {t(SECTION_LABEL_KEY[getStationSection(selectedStation.id)])}
        </div>
      )}
    </div>
  );
}
