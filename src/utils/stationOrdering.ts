import { stations } from '../data/stations';
import { routes } from '../data/routes';
import type { Station } from '../types';

/**
 * Get all stations in the order they appear along the Marmaray line
 * Uses the full route (Halkalı to Gebze) as the canonical ordering
 */
export function getStationsInRouteOrder(): Station[] {
  // Use the full route as it contains all stations in correct order
  const fullRoute = routes.find(r => r.id === 'marmaray-full');
  
  if (!fullRoute) {
    // Fallback to alphabetical if route not found
    return [...stations].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }

  // Map station IDs to station objects in route order
  const orderedStations: Station[] = [];
  
  for (const stationId of fullRoute.stations) {
    const station = stations.find(s => s.id === stationId);
    if (station) {
      orderedStations.push(station);
    }
  }
  
  // Add any missing stations at the end (shouldn't happen with complete data)
  const includedIds = new Set(orderedStations.map(s => s.id));
  const missingStations = stations.filter(s => !includedIds.has(s.id));
  
  return [...orderedStations, ...missingStations];
}

/**
 * Get stations in route order with filtering capability
 */
export function getFilteredStationsInOrder(
  searchQuery: string = '', 
  excludeStationId?: string
): Station[] {
  const orderedStations = getStationsInRouteOrder();
  
  return orderedStations.filter(station => {
    // Filter by search query
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Exclude specific station (used for preventing same from/to selection)
    const isNotExcluded = !excludeStationId || station.id !== excludeStationId;
    
    return matchesSearch && isNotExcluded;
  });
}

/**
 * Get station position in the route (0-based index)
 * Useful for determining direction and calculating distances
 */
export function getStationRoutePosition(stationId: string): number {
  const fullRoute = routes.find(r => r.id === 'marmaray-full');
  if (!fullRoute) return -1;
  
  return fullRoute.stations.indexOf(stationId);
}

/**
 * Check if station A comes before station B in the route
 */
export function isStationBefore(stationAId: string, stationBId: string): boolean {
  const positionA = getStationRoutePosition(stationAId);
  const positionB = getStationRoutePosition(stationBId);
  
  if (positionA === -1 || positionB === -1) return false;
  
  return positionA < positionB;
}

/**
 * Get the section name for a station (European side, Tunnel, Asian side)
 */
export function getStationSection(stationId: string, t?: (key: string) => string): string {
  const position = getStationRoutePosition(stationId);
  
  if (position === -1) return t ? t('unknown') : 'Unknown';
  
  // Based on the route structure in routes.ts
  if (position <= 12) return t ? t('europeanSide') : 'European Side'; // Halkalı to Yenikapı
  if (position <= 15) return t ? t('tunnelSection') : 'Tunnel Section'; // Sirkeci to Ayrılıkçeşme  
  return t ? t('asianSide') : 'Asian Side'; // Söğütlüçeşme to Gebze
}

/**
 * Group stations by section for display purposes
 */
export function getStationsGroupedBySection(t?: (key: string) => string): {
  section: string;
  stations: Station[];
}[] {
  const orderedStations = getStationsInRouteOrder();
  
  const europeanSideText = t ? t('europeanSide') : 'European Side';
  const tunnelSectionText = t ? t('tunnelSection') : 'Tunnel Section';
  const asianSideText = t ? t('asianSide') : 'Asian Side';
  
  return [
    {
      section: europeanSideText,
      stations: orderedStations.filter(s => {
        const position = getStationRoutePosition(s.id);
        if (position === -1) return false;
        return position <= 12; // European Side: Halkalı to Yenikapı
      })
    },
    {
      section: tunnelSectionText, 
      stations: orderedStations.filter(s => {
        const position = getStationRoutePosition(s.id);
        if (position === -1) return false;
        return position > 12 && position <= 15; // Tunnel Section: Sirkeci to Ayrılıkçeşme
      })
    },
    {
      section: asianSideText,
      stations: orderedStations.filter(s => {
        const position = getStationRoutePosition(s.id);
        if (position === -1) return false;
        return position > 15; // Asian Side: Söğütlüçeşme to Gebze
      })
    }
  ].filter(group => group.stations.length > 0);
}