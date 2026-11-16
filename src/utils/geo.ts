import type { Station } from '../types';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDegrees(a: [number, number], b: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const toDeg = (value: number) => (value * 180) / Math.PI;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function interpolate(
  a: [number, number],
  b: [number, number],
  progress: number
): [number, number] {
  const t = Math.max(0, Math.min(1, progress));
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export interface Point {
  x: number;
  y: number;
}

export interface ProjectedNetwork {
  points: Record<string, Point>;
  project: (coordinates: [number, number]) => Point;
  width: number;
  height: number;
}

/** True-shape projection: longitude scaled by latitude, fitted inside the box. */
export function projectNetwork(
  stations: Station[],
  width: number,
  height: number,
  padding: number,
  paddingBottom = padding
): ProjectedNetwork {
  const meanLat =
    stations.reduce((sum, station) => sum + station.coordinates[1], 0) / stations.length;
  const cosLat = Math.cos((meanLat * Math.PI) / 180);
  const xs = stations.map((station) => station.coordinates[0] * cosLat);
  const ys = stations.map((station) => -station.coordinates[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(Math.max(...xs) - minX, 0.0001);
  const spanY = Math.max(Math.max(...ys) - minY, 0.0001);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding - paddingBottom) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = padding + (height - padding - paddingBottom - spanY * scale) / 2;

  const project = ([lng, lat]: [number, number]): Point => ({
    x: offsetX + (lng * cosLat - minX) * scale,
    y: offsetY + (-lat - minY) * scale,
  });

  const points: Record<string, Point> = {};
  for (const station of stations) points[station.id] = project(station.coordinates);
  return { points, project, width, height };
}

function controls(points: Point[], i: number): [Point, Point] {
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  return [
    { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
  ];
}

/** Catmull-Rom spline through every point, from point `start` to point `end`. */
export function curvePath(points: Point[], start = 0, end = points.length - 1): string {
  if (points.length < 2 || end <= start) return '';
  const parts = [`M ${points[start].x.toFixed(2)} ${points[start].y.toFixed(2)}`];
  for (let i = start; i < end; i += 1) {
    const [c1, c2] = controls(points, i);
    const p = points[i + 1];
    parts.push(
      `C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    );
  }
  return parts.join(' ');
}

/** Point and tangent angle (deg) at progress t of segment i, exactly on curvePath. */
export function curveAt(points: Point[], i: number, t: number): { point: Point; angle: number } {
  const [c1, c2] = controls(points, i);
  const a = points[i];
  const b = points[i + 1];
  const u = 1 - t;
  const point = {
    x: u ** 3 * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * b.x,
    y: u ** 3 * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * b.y,
  };
  const dx = 3 * u * u * (c1.x - a.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (b.x - c2.x);
  const dy = 3 * u * u * (c1.y - a.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (b.y - c2.y);
  return { point, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}
