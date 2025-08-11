import { routes } from '../data/routes';
import type { Route } from '../types';

export interface ServiceSchedule {
  routeId: string;
  route: Route;
  serviceStart: Date;
  serviceEnd: Date;
  frequency: number; // minutes
  isActive: boolean;
  nextServiceStart?: Date; // If service is not currently active
}

export interface ScheduledDeparture {
  routeId: string;
  departureTime: Date;
  direction: 'forward' | 'backward';
  trainNumber: string;
  estimatedArrival: Date;
  totalJourneyMinutes: number;
  waitingMinutes: number;
}

/**
 * Get service schedules for all routes at a given time
 */
export function getServiceSchedules(currentTime: Date = new Date()): ServiceSchedule[] {
  return routes.map(route => {
    const schedule = getRouteSchedule(route, currentTime);
    return {
      routeId: route.id,
      route: route,
      ...schedule
    };
  });
}

/**
 * Get service schedule for a specific route
 */
function getRouteSchedule(route: Route, currentTime: Date): {
  serviceStart: Date;
  serviceEnd: Date;
  frequency: number;
  isActive: boolean;
  nextServiceStart?: Date;
} {
  const today = new Date(currentTime);
  today.setSeconds(0, 0); // Reset to start of minute
  
  let serviceStart: Date;
  let serviceEnd: Date;
  
  if (route.id === 'marmaray-evening') {
    // Evening service: 20:50 - 23:30
    serviceStart = new Date(today);
    serviceStart.setHours(20, 50, 0, 0);
    serviceEnd = new Date(today);
    serviceEnd.setHours(23, 30, 0, 0);
  } else {
    // Regular services: 6:00 AM - 22:30
    serviceStart = new Date(today);
    serviceStart.setHours(6, 0, 0, 0);
    serviceEnd = new Date(today);
    serviceEnd.setHours(22, 30, 0, 0);
  }
  
  const isActive = currentTime >= serviceStart && currentTime <= serviceEnd;
  let nextServiceStart: Date | undefined;
  
  if (!isActive) {
    if (currentTime < serviceStart) {
      // Before service starts today
      nextServiceStart = serviceStart;
    } else {
      // After service ends, next service is tomorrow
      nextServiceStart = new Date(serviceStart);
      nextServiceStart.setDate(nextServiceStart.getDate() + 1);
    }
  }
  
  return {
    serviceStart,
    serviceEnd,
    frequency: route.frequency,
    isActive,
    nextServiceStart
  };
}

/**
 * Calculate next scheduled departure for a journey
 */
export function calculateScheduledDeparture(
  fromStationId: string,
  toStationId: string,
  routeId: string,
  direction: 'forward' | 'backward',
  journeyTime: number, // in seconds
  currentTime: Date = new Date()
): ScheduledDeparture | null {
  const route = routes.find(r => r.id === routeId);
  if (!route) return null;

  const schedule = getRouteSchedule(route, currentTime);
  
  let nextDeparture: Date;
  let waitingMinutes: number;
  
  if (schedule.isActive) {
    // Service is running, find next departure based on frequency
    nextDeparture = calculateNextFrequencyDeparture(
      fromStationId,
      route,
      direction,
      schedule.serviceStart,
      schedule.frequency,
      currentTime
    );
    waitingMinutes = Math.max(0, Math.ceil((nextDeparture.getTime() - currentTime.getTime()) / (1000 * 60)));
  } else if (schedule.nextServiceStart) {
    // Service not running, use next service start
    nextDeparture = calculateServiceStartDeparture(
      fromStationId,
      route,
      direction,
      schedule.nextServiceStart
    );
    waitingMinutes = Math.ceil((nextDeparture.getTime() - currentTime.getTime()) / (1000 * 60));
  } else {
    return null;
  }
  
  const estimatedArrival = new Date(nextDeparture.getTime() + journeyTime * 1000);
  const totalJourneyMinutes = Math.ceil((estimatedArrival.getTime() - currentTime.getTime()) / (1000 * 60));
  
  return {
    routeId,
    departureTime: nextDeparture,
    direction,
    trainNumber: generateScheduledTrainNumber(routeId, nextDeparture),
    estimatedArrival,
    totalJourneyMinutes,
    waitingMinutes
  };
}

/**
 * Calculate next departure based on service frequency
 */
function calculateNextFrequencyDeparture(
  fromStationId: string,
  route: Route,
  direction: 'forward' | 'backward',
  serviceStart: Date,
  frequency: number,
  currentTime: Date
): Date {
  // Calculate travel time from route start to the departure station
  const stationOffset = calculateStationOffset(fromStationId, route, direction);
  
  // Find the next scheduled departure
  const minutesSinceStart = Math.floor((currentTime.getTime() - serviceStart.getTime()) / (1000 * 60));
  const nextSlot = Math.ceil(minutesSinceStart / frequency) * frequency;
  
  const nextDeparture = new Date(serviceStart);
  nextDeparture.setMinutes(nextDeparture.getMinutes() + nextSlot + stationOffset);
  
  // If this departure is in the past, get the next one
  if (nextDeparture <= currentTime) {
    nextDeparture.setMinutes(nextDeparture.getMinutes() + frequency);
  }
  
  return nextDeparture;
}

/**
 * Calculate departure time when service starts
 */
function calculateServiceStartDeparture(
  fromStationId: string,
  route: Route,
  direction: 'forward' | 'backward',
  serviceStart: Date
): Date {
  const stationOffset = calculateStationOffset(fromStationId, route, direction);
  
  const departure = new Date(serviceStart);
  departure.setMinutes(departure.getMinutes() + stationOffset);
  
  return departure;
}

/**
 * Calculate time offset for a station from route start
 */
function calculateStationOffset(
  stationId: string,
  route: Route,
  direction: 'forward' | 'backward'
): number {
  const stationIndex = route.stations.indexOf(stationId);
  if (stationIndex === -1) return 0;
  
  // For backward direction, trains start from the end
  const startIndex = direction === 'forward' ? 0 : route.stations.length - 1;
  
  if (stationIndex === startIndex) return 0;
  
  // Estimate 2 minutes per station as average inter-station time
  const stationsFromStart = direction === 'forward' 
    ? stationIndex 
    : route.stations.length - 1 - stationIndex;
  
  return stationsFromStart * 2; // 2 minutes per station
}

/**
 * Generate a train number for scheduled departures
 */
function generateScheduledTrainNumber(routeId: string, departureTime: Date): string {
  const hour = departureTime.getHours();
  const minute = departureTime.getMinutes();
  
  let prefix: string;
  switch (routeId) {
    case 'marmaray-full': prefix = 'M'; break;
    case 'marmaray-short': prefix = 'S'; break;
    case 'marmaray-evening': prefix = 'E'; break;
    default: prefix = 'T';
  }
  
  return `${prefix}${hour.toString().padStart(2, '0')}${Math.floor(minute / 10)}0`;
}

/**
 * Check if any service is currently running
 */
export function isAnyServiceActive(currentTime: Date = new Date()): boolean {
  return getServiceSchedules(currentTime).some(schedule => schedule.isActive);
}

/**
 * Get next service start time across all routes
 */
export function getNextServiceStart(currentTime: Date = new Date()): Date | null {
  const schedules = getServiceSchedules(currentTime);
  const nextStarts = schedules
    .filter(s => s.nextServiceStart)
    .map(s => s.nextServiceStart!)
    .sort((a, b) => a.getTime() - b.getTime());
  
  return nextStarts.length > 0 ? nextStarts[0] : null;
}

/**
 * Get time until next service starts
 */
export function getTimeUntilNextService(currentTime: Date = new Date()): {
  nextStart: Date;
  hoursUntil: number;
  minutesUntil: number;
} | null {
  const nextStart = getNextServiceStart(currentTime);
  if (!nextStart) return null;
  
  const msUntil = nextStart.getTime() - currentTime.getTime();
  const totalMinutes = Math.ceil(msUntil / (1000 * 60));
  const hoursUntil = Math.floor(totalMinutes / 60);
  const minutesUntil = totalMinutes % 60;
  
  return {
    nextStart,
    hoursUntil,
    minutesUntil
  };
}

/**
 * Format waiting time for display
 */
export function formatWaitingTime(minutes: number, t?: (key: string) => string): string {
  if (minutes < 60) {
    const minText = t ? t('min') : 'min';
    return `${minutes} ${minText}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const hourText = t ? t('h') : 'h';
  
  if (remainingMinutes === 0) {
    return `${hours}${hourText}`;
  }
  
  const minText = t ? t('min') : 'min';
  return `${hours}${hourText} ${remainingMinutes}${minText}`;
}

/**
 * Get service status description
 */
export function getServiceStatus(currentTime: Date = new Date(), t?: (key: string) => string): string {
  const isActive = isAnyServiceActive(currentTime);
  
  if (isActive) {
    return t ? t('serviceIsCurrentlyRunning') : 'Service is currently running';
  }
  
  const nextService = getTimeUntilNextService(currentTime);
  if (nextService) {
    if (nextService.hoursUntil === 0) {
      const serviceStartsText = t ? t('serviceStartsIn') : 'Service starts in';
      const minutesText = t ? t('minutes') : 'minutes';
      return `${serviceStartsText} ${nextService.minutesUntil} ${minutesText}`;
    } else {
      const serviceStartsText = t ? t('serviceStartsIn') : 'Service starts in';
      return `${serviceStartsText} ${formatWaitingTime(nextService.hoursUntil * 60 + nextService.minutesUntil, t)}`;
    }
  }
  
  return t ? t('serviceInformationUnavailable') : 'Service information unavailable';
}