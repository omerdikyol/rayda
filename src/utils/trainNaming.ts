import { routes } from '../data/routes';
import { stations } from '../data/stations';

/**
 * Generate a meaningful train name based on route and timing
 */
export function generateTrainName(
  routeId: string, 
  direction: 'forward' | 'backward', 
  departureTime: Date
): string {
  const route = routes.find(r => r.id === routeId);
  if (!route) return 'Unknown Train';

  // Get destination station name
  const destinationId = direction === 'forward' ? route.termini[1] : route.termini[0];
  const destinationStation = stations.find(s => s.id === destinationId);
  const destinationName = destinationStation?.name || 'Unknown';

  // Generate train number based on time and route
  const trainNumber = generateTrainNumber(routeId, departureTime);

  return `${destinationName} ${trainNumber}`;
}

/**
 * Generate a user-friendly train number
 */
function generateTrainNumber(routeId: string, departureTime: Date): string {
  const hour = departureTime.getHours();
  const minute = departureTime.getMinutes();
  
  // Create a readable train number: Route prefix + time-based number
  const routePrefix = getRoutePrefix(routeId);
  const timeNumber = hour * 100 + Math.floor(minute / 10) * 10; // Round to nearest 10 minutes
  
  return `${routePrefix}${timeNumber}`;
}

/**
 * Get route prefix for train numbering
 */
function getRoutePrefix(routeId: string): string {
  switch (routeId) {
    case 'marmaray-full':
      return 'M'; // M for Marmaray Full Line
    case 'marmaray-short':
      return 'S'; // S for Short service
    case 'marmaray-evening':
      return 'E'; // E for Evening service
    default:
      return 'T'; // T for Train (fallback)
  }
}

/**
 * Generate a short display name for the train
 */
export function getTrainDisplayName(trainId: string, routeId: string, _direction: 'forward' | 'backward'): string {
  const route = routes.find(r => r.id === routeId);
  if (!route) return 'Train';


  // Extract train number from ID for simpler display
  const parts = trainId.split('-');
  const sequence = parts[parts.length - 1];
  const routePrefix = getRoutePrefix(routeId);
  
  return `${routePrefix}${sequence.padStart(2, '0')}`;
}

/**
 * Get full train description for popups
 */
export function getTrainDescription(
  trainId: string, 
  routeId: string, 
  direction: 'forward' | 'backward',
  departureTime: Date
): string {
  const route = routes.find(r => r.id === routeId);
  if (!route) return 'Unknown Train';

  const originId = direction === 'forward' ? route.termini[0] : route.termini[1];
  const destinationId = direction === 'forward' ? route.termini[1] : route.termini[0];
  
  const originStation = stations.find(s => s.id === originId);
  const destinationStation = stations.find(s => s.id === destinationId);
  
  const originName = originStation?.name || 'Unknown';
  const destinationName = destinationStation?.name || 'Unknown';
  
  const trainNumber = getTrainDisplayName(trainId, routeId, direction);
  const departureTimeStr = departureTime.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `Train ${trainNumber}: ${originName} → ${destinationName} (Departed: ${departureTimeStr})`;
}

/**
 * Get route display name for timetables (in English for international users)
 */
export function getRouteDisplayName(routeId: string): string {
  switch (routeId) {
    case 'marmaray-full':
      return 'Full Line'; // Tam Hat
    case 'marmaray-short':
      return 'Short Service'; // Kısa Sefer  
    case 'marmaray-evening':
      return 'Evening Service'; // Akşam Seferi
    default:
      return 'Unknown'; // Bilinmeyen
  }
}

/**
 * Get route display name in Turkish for local users
 */
export function getRouteDisplayNameTR(routeId: string): string {
  switch (routeId) {
    case 'marmaray-full':
      return 'Tam Hat'; // Full Line
    case 'marmaray-short':
      return 'Kısa Sefer'; // Short Service
    case 'marmaray-evening':
      return 'Akşam Seferi'; // Evening Service
    default:
      return 'Bilinmeyen'; // Unknown
  }
}

/**
 * Get abbreviated destination name for compact displays
 */
export function getAbbreviatedDestination(stationName: string): string {
  const abbreviations: Record<string, string> = {
    'Halkalı': 'HLK',
    'Gebze': 'GBZ',
    'Ataköy': 'ATK',
    'Pendik': 'PND',
    'Zeytinburnu': 'ZTB',
    'Sirkeci': 'SRK',
    'Üsküdar': 'ÜSK',
    'Yenikapı': 'YKP',
    'Bakırköy': 'BKK',
    'Maltepe': 'MTP',
    'Bostancı': 'BST',
    'Kartal': 'KRT'
  };

  return abbreviations[stationName] || stationName.substring(0, 3).toUpperCase();
}