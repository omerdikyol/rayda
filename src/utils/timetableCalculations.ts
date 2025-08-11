import type { Route } from '../types';
import type { TrainPosition } from './trainSimulation';
import { stations } from '../data/stations';
import { routes } from '../data/routes';
import { interStationTimes } from '../data/interStationTimes';
import { getRouteDisplayName } from './trainNaming';

export interface ArrivalPrediction {
  trainId: string;
  displayName: string; // Short, user-friendly train name
  arrivalTime: Date;
  minutesAway: number;
  direction: 'forward' | 'backward';
  routeId: string;
  routeName: string;
  finalDestination: string;
  color: string;
  confidence: number; // 0-1 confidence score
}

/**
 * Calculate arrival predictions for a specific station
 */
export function calculateStationArrivals(
  stationId: string, 
  trainPositions: TrainPosition[],
  maxArrivals: number = 4
): ArrivalPrediction[] {
  const station = stations.find(s => s.id === stationId);
  if (!station) return [];

  const arrivals: ArrivalPrediction[] = [];
  const now = new Date();

  for (const trainPos of trainPositions) {
    const route = routes.find(r => r.id === trainPos.routeId);
    if (!route) continue;

    const arrivalPrediction = calculateTrainArrival(stationId, trainPos, route, now);
    if (arrivalPrediction) {
      arrivals.push(arrivalPrediction);
    }
  }

  // Sort by arrival time and return the next arrivals
  return arrivals
    .sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())
    .slice(0, maxArrivals);
}

/**
 * Calculate when a specific train will arrive at a station
 */
function calculateTrainArrival(
  stationId: string,
  trainPos: TrainPosition,
  route: Route,
  currentTime: Date
): ArrivalPrediction | null {
  // Check if this train visits the requested station
  const stationIndex = route.stations.indexOf(stationId);
  if (stationIndex === -1) return null;

  // Get train's current position in the route
  const currentFromIndex = route.stations.indexOf(trainPos.currentSegment.fromStationId);
  const currentToIndex = route.stations.indexOf(trainPos.currentSegment.toStationId);
  
  if (currentFromIndex === -1 || currentToIndex === -1) return null;

  // Calculate travel time to the target station
  const travelTimeResult = calculateTravelTime(
    trainPos, 
    route, 
    currentFromIndex, 
    currentToIndex, 
    stationIndex
  );

  if (!travelTimeResult) return null;

  const { timeToStation, confidence } = travelTimeResult;

  // Skip if arrival time is too far in the future (over 45 minutes)
  if (timeToStation > 2700) return null;

  const arrivalTime = new Date(currentTime.getTime() + timeToStation * 1000);
  const minutesAway = Math.max(0, Math.round(timeToStation / 60));

  // Get final destination
  const finalDestinationId = trainPos.direction === 'forward' 
    ? route.termini[1] 
    : route.termini[0];
  const finalDestination = stations.find(s => s.id === finalDestinationId)?.name || 'Unknown';

  return {
    trainId: trainPos.trainId,
    displayName: trainPos.displayName,
    arrivalTime,
    minutesAway,
    direction: trainPos.direction,
    routeId: trainPos.routeId,
    routeName: getRouteDisplayName(route.id),
    finalDestination,
    color: route.color,
    confidence
  };
}

/**
 * Calculate travel time from current train position to target station
 */
function calculateTravelTime(
  trainPos: TrainPosition,
  route: Route,
  currentFromIndex: number,
  currentToIndex: number,
  targetStationIndex: number
): { timeToStation: number; confidence: number } | null {
  const trainDirection = trainPos.direction === 'forward' ? 1 : -1;
  
  // Check if train is moving toward the target station
  if (trainDirection === 1 && currentFromIndex >= targetStationIndex) return null;
  if (trainDirection === -1 && currentFromIndex <= targetStationIndex) return null;

  let timeToStation = 0;
  let confidence = 0.9; // Start with high confidence

  if (trainDirection === 1) {
    // Forward direction
    const remainingInCurrentSegment = (1 - trainPos.progress) * getInterStationTime(
      route.stations[currentFromIndex], 
      route.stations[currentToIndex]
    );
    
    timeToStation += remainingInCurrentSegment;
    
    // Add time for complete segments between current and target
    for (let i = currentToIndex; i < targetStationIndex; i++) {
      const segmentTime = getInterStationTime(route.stations[i], route.stations[i + 1]);
      timeToStation += segmentTime;
      
      // Reduce confidence for longer predictions
      confidence *= 0.95;
    }
  } else {
    // Backward direction (reverse route)
    const remainingInCurrentSegment = trainPos.progress * getInterStationTime(
      route.stations[currentFromIndex], 
      route.stations[currentToIndex]
    );
    
    timeToStation += remainingInCurrentSegment;
    
    // Add time for complete segments (going backward)
    for (let i = currentFromIndex - 1; i >= targetStationIndex; i--) {
      const segmentTime = getInterStationTime(route.stations[i + 1], route.stations[i]);
      timeToStation += segmentTime;
      
      // Reduce confidence for longer predictions
      confidence *= 0.95;
    }
  }

  return { timeToStation, confidence };
}

/**
 * Get inter-station travel time with fallback
 */
function getInterStationTime(fromStationId: string, toStationId: string): number {
  const timeData = interStationTimes.find(
    t => t.fromStationId === fromStationId && t.toStationId === toStationId
  );
  return timeData ? timeData.time : 120; // Default 2 minutes if not found
}


/**
 * Format arrival time for display
 */
export function formatArrivalTime(arrivalTime: Date): string {
  return arrivalTime.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Format minutes away for display
 */
export function formatMinutesAway(minutesAway: number): string {
  if (minutesAway === 0) return 'Now';
  if (minutesAway === 1) return '1 min';
  return `${minutesAway} min`;
}

/**
 * Get confidence indicator
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

/**
 * Check if a station is served by a specific route
 */
export function isStationServedByRoute(stationId: string, routeId: string): boolean {
  const route = routes.find(r => r.id === routeId);
  return route ? route.stations.includes(stationId) : false;
}

/**
 * Get all routes serving a station
 */
export function getRoutesForStation(stationId: string): Route[] {
  return routes.filter(route => route.stations.includes(stationId));
}

/**
 * Calculate the next arrival time for a station based on route frequency
 * (Used as fallback when no trains are currently simulated)
 */
export function calculateScheduledArrival(
  stationId: string, 
  routeId: string, 
  currentTime: Date
): Date | null {
  const route = routes.find(r => r.id === routeId);
  if (!route || !route.stations.includes(stationId)) return null;

  // Simple calculation based on frequency
  const baseTime = new Date(currentTime);
  baseTime.setSeconds(0, 0); // Round to nearest minute
  
  // Find the next departure time based on frequency
  const minutesSinceHour = baseTime.getMinutes();
  const nextDeparture = minutesSinceHour % route.frequency;
  const minutesToAdd = nextDeparture === 0 ? 0 : route.frequency - nextDeparture;
  
  const scheduledTime = new Date(baseTime);
  scheduledTime.setMinutes(scheduledTime.getMinutes() + minutesToAdd);
  
  return scheduledTime;
}