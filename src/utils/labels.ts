import { routeById } from '../data/routes';
import { lineById } from '../data/network';

type Translate = (key: string, fallback?: string) => string;

export function routeName(routeId: string, t: Translate): string {
  const route = routeById.get(routeId);
  if (!route) return routeId;
  return route.nameKey ? t(route.nameKey) : (lineById.get(route.lineId)?.name ?? routeId);
}

export function routeShortName(routeId: string, t: Translate): string {
  const route = routeById.get(routeId);
  return route ? t(route.shortNameKey) : routeId;
}

export function routeColor(routeId: string): string {
  return routeById.get(routeId)?.color ?? '#8C99AF';
}
