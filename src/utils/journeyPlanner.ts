import { stations } from '../data/stations';
import { routes } from '../data/routes';
import { interStationTimes } from '../data/interStationTimes';
import type { Station, Route } from '../types';
import type { TrainPosition } from './trainSimulation';
import { calculateStationArrivals } from './timetableCalculations';
import { 
  calculateScheduledDeparture
} from './scheduleCalculator';

export interface JourneyPlan {
  fromStation: Station;
  toStation: Station;
  route: Route;
  direction: 'forward' | 'backward';
  totalTime: number; // in seconds
  totalDistance: number; // in km
  stationCount: number;
  stations: Station[];
  nextDeparture: {
    trainId: string;
    displayName: string;
    departureTime: Date;
    arrivalTime: Date;
    minutesToDeparture: number;
    totalJourneyMinutes: number;
    isScheduled: boolean; // true if based on schedule, false if from live trains
    waitingMinutes?: number; // for scheduled departures
  } | null;
}

export interface JourneyOptions {
  departureTime?: Date; // When user wants to leave (default: now)
  maxWaitTime?: number; // Maximum wait time in minutes (default: 30)
}

/**
 * Calculate the best journey between two stations
 */
export function calculateJourney(
  fromStationId: string,
  toStationId: string,
  trainPositions: TrainPosition[],
  options: JourneyOptions = {}
): JourneyPlan | null {
  const { departureTime = new Date(), maxWaitTime = 30 } = options;

  const fromStation = stations.find(s => s.id === fromStationId);
  const toStation = stations.find(s => s.id === toStationId);

  if (!fromStation || !toStation || fromStation.id === toStation.id) {
    return null;
  }

  // Find which route connects these stations
  const routeInfo = findConnectingRoute(fromStationId, toStationId);
  if (!routeInfo) {
    return null;
  }

  const { route, direction, fromIndex, toIndex } = routeInfo;

  // Calculate journey details
  const journeyStations = getJourneyStations(route, direction, fromIndex, toIndex);
  const totalTime = calculateJourneyTime(journeyStations);
  const totalDistance = calculateJourneyDistance(journeyStations);

  // Find next available train (live or scheduled)
  const nextDeparture = findNextDeparture(
    fromStationId,
    toStationId,
    route.id,
    direction,
    trainPositions,
    departureTime,
    maxWaitTime,
    totalTime
  );

  return {
    fromStation,
    toStation,
    route,
    direction,
    totalTime,
    totalDistance,
    stationCount: journeyStations.length - 1, // Don't count origin
    stations: journeyStations,
    nextDeparture
  };
}

/**
 * Find which route connects two stations and the direction needed
 */
function findConnectingRoute(
  fromStationId: string,
  toStationId: string
): { route: Route; direction: 'forward' | 'backward'; fromIndex: number; toIndex: number } | null {
  for (const route of routes) {
    const fromIndex = route.stations.indexOf(fromStationId);
    const toIndex = route.stations.indexOf(toStationId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const direction = fromIndex < toIndex ? 'forward' : 'backward';
      return { route, direction, fromIndex, toIndex };
    }
  }
  return null;
}

/**
 * Get the list of stations for this journey
 */
function getJourneyStations(
  route: Route,
  direction: 'forward' | 'backward',
  fromIndex: number,
  toIndex: number
): Station[] {
  const journeyStations: Station[] = [];
  
  if (direction === 'forward') {
    for (let i = fromIndex; i <= toIndex; i++) {
      const station = stations.find(s => s.id === route.stations[i]);
      if (station) journeyStations.push(station);
    }
  } else {
    for (let i = fromIndex; i >= toIndex; i--) {
      const station = stations.find(s => s.id === route.stations[i]);
      if (station) journeyStations.push(station);
    }
  }

  return journeyStations;
}

/**
 * Calculate total journey time in seconds
 */
function calculateJourneyTime(journeyStations: Station[]): number {
  let totalTime = 0;
  
  for (let i = 0; i < journeyStations.length - 1; i++) {
    const fromStationId = journeyStations[i].id;
    const toStationId = journeyStations[i + 1].id;
    
    const timeData = interStationTimes.find(
      t => t.fromStationId === fromStationId && t.toStationId === toStationId
    );
    
    totalTime += timeData ? timeData.time : 120; // Default 2 minutes if not found
  }

  return totalTime;
}

/**
 * Calculate total journey distance in km
 */
function calculateJourneyDistance(journeyStations: Station[]): number {
  if (journeyStations.length < 2) return 0;
  
  const firstStation = journeyStations[0];
  const lastStation = journeyStations[journeyStations.length - 1];
  
  return Math.abs(lastStation.distanceFromStart - firstStation.distanceFromStart);
}

/**
 * Find the next available train for this journey (live or scheduled)
 */
function findNextDeparture(
  fromStationId: string,
  toStationId: string,
  routeId: string,
  direction: 'forward' | 'backward',
  trainPositions: TrainPosition[],
  departureTime: Date,
  maxWaitTime: number,
  journeyTime: number
): {
  trainId: string;
  displayName: string;
  departureTime: Date;
  arrivalTime: Date;
  minutesToDeparture: number;
  totalJourneyMinutes: number;
  isScheduled: boolean;
  waitingMinutes?: number;
} | null {
  // First try to find live trains
  const arrivals = calculateStationArrivals(fromStationId, trainPositions, 10);
  
  // Filter for trains going in the right direction on the right route
  const suitableTrains = arrivals.filter(arrival => 
    arrival.routeId === routeId && 
    arrival.direction === direction &&
    arrival.minutesAway <= maxWaitTime
  );

  if (suitableTrains.length > 0) {
    // Found live trains - use the first one
    const nextTrain = suitableTrains[0];
    const arrivalTime = new Date(nextTrain.arrivalTime.getTime() + journeyTime * 1000);
    
    return {
      trainId: nextTrain.trainId,
      displayName: nextTrain.displayName,
      departureTime: nextTrain.arrivalTime,
      arrivalTime: arrivalTime,
      minutesToDeparture: nextTrain.minutesAway,
      totalJourneyMinutes: Math.ceil((journeyTime + nextTrain.minutesAway * 60) / 60),
      isScheduled: false
    };
  }

  // No live trains available - try to find scheduled departure
  const scheduledDeparture = calculateScheduledDeparture(
    fromStationId,
    toStationId,
    routeId,
    direction,
    journeyTime,
    departureTime
  );

  if (scheduledDeparture) {
    return {
      trainId: `scheduled-${scheduledDeparture.trainNumber}`,
      displayName: scheduledDeparture.trainNumber,
      departureTime: scheduledDeparture.departureTime,
      arrivalTime: scheduledDeparture.estimatedArrival,
      minutesToDeparture: scheduledDeparture.waitingMinutes,
      totalJourneyMinutes: scheduledDeparture.totalJourneyMinutes,
      isScheduled: true,
      waitingMinutes: scheduledDeparture.waitingMinutes
    };
  }

  return null;
}

/**
 * Get all possible journeys between two stations (for routes with transfers)
 * Currently Marmaray is a single line, but this prepares for future expansions
 */
export function calculateAllJourneys(
  fromStationId: string,
  toStationId: string,
  trainPositions: TrainPosition[],
  options: JourneyOptions = {}
): JourneyPlan[] {
  const directJourney = calculateJourney(fromStationId, toStationId, trainPositions, options);
  
  // For now, return direct journey only since Marmaray is a single line
  // In the future, this could calculate transfer options
  return directJourney ? [directJourney] : [];
}

/**
 * Get journey summary for display
 */
export function getJourneySummary(journey: JourneyPlan, t?: (key: string) => string): string {
  const minutes = Math.ceil(journey.totalTime / 60);
  const stopsText = journey.stationCount === 1 ? (t ? t('stop') : 'stop') : (t ? t('stops') : 'stops');
  
  if (journey.nextDeparture) {
    const waitMinutes = journey.nextDeparture.minutesToDeparture;
    const totalMinutes = journey.nextDeparture.totalJourneyMinutes;
    const isScheduled = journey.nextDeparture.isScheduled;
    
    if (waitMinutes === 0) {
      const minText = t ? t('min') : 'min';
      const totalText = t ? t('total') : 'total';
      const trainDepartingText = t ? t('trainDepartingNow') : 'train departing now';
      return `${totalMinutes} ${minText} ${totalText} (${trainDepartingText}) • ${journey.stationCount} ${stopsText}`;
    } else {
      const waitText = isScheduled ? (t ? t('serviceStarts') : 'service starts') : (t ? t('wait') : 'wait');
      const scheduleNote = isScheduled ? (t ? ` (${t('scheduled').toLowerCase()})` : ' (scheduled)') : '';
      
      if (waitMinutes >= 60) {
        const hours = Math.floor(waitMinutes / 60);
        const remainingMinutes = waitMinutes % 60;
        const hourText = t ? t('h') : 'h';
        const minText = t ? t('min') : 'min';
        const waitDisplay = remainingMinutes > 0 ? `${hours}${hourText} ${remainingMinutes}${minText}` : `${hours}${hourText}`;
        const totalMinText = t ? t('min') : 'min';
        const totalText = t ? t('total') : 'total';
        const journeyMinText = t ? t('min') : 'min';
        const journeyText = t ? t('journey') : 'journey';
        return `${totalMinutes} ${totalMinText} ${totalText} (${waitDisplay} ${waitText} + ${minutes} ${journeyMinText} ${journeyText}) • ${journey.stationCount} ${stopsText}${scheduleNote}`;
      } else {
        const totalMinText = t ? t('min') : 'min';
        const totalText = t ? t('total') : 'total';
        const waitMinText = t ? t('min') : 'min';
        const journeyMinText = t ? t('min') : 'min';
        const journeyText = t ? t('journey') : 'journey';
        return `${totalMinutes} ${totalMinText} ${totalText} (${waitMinutes} ${waitMinText} ${waitText} + ${minutes} ${journeyMinText} ${journeyText}) • ${journey.stationCount} ${stopsText}${scheduleNote}`;
      }
    }
  } else {
    const minText = t ? t('min') : 'min';
    const journeyText = t ? t('journey') : 'journey';
    const noServiceText = t ? t('noServiceAvailable') : 'No service available';
    return `${minutes} ${minText} ${journeyText} • ${journey.stationCount} ${stopsText} • ${noServiceText}`;
  }
}

/**
 * Check if journey is currently possible (within service hours)
 */
export function isJourneyPossible(routeId: string, currentTime: Date = new Date()): boolean {
  const hour = currentTime.getHours();
  
  if (routeId === 'marmaray-evening') {
    // Evening service: 20:50 - 23:30
    return hour >= 20 || hour < 24;
  } else {
    // Regular services: 6:00 AM - 22:30
    return hour >= 6 && hour < 23;
  }
}

/**
 * Format journey time for display
 */
export function formatJourneyTime(seconds: number, t?: (key: string) => string): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    const minText = t ? t('min') : 'min';
    return `${minutes} ${minText}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const hourText = t ? t('h') : 'h';
  const minText = t ? t('min') : 'min';
  return `${hours}${hourText} ${remainingMinutes}${minText}`;
}

/**
 * Get intermediate stops for a journey
 */
export function getIntermediateStops(journey: JourneyPlan): Station[] {
  // Return all stations except the first (origin) and last (destination)
  return journey.stations.slice(1, -1);
}