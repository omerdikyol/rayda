import type { Train, Route, Station } from '../types';
import { routes } from '../data/routes';
import { stations } from '../data/stations';
import { interStationTimes } from '../data/interStationTimes';

export interface TrainPosition {
  trainId: string;
  routeId: string;
  coordinates: [number, number]; // [longitude, latitude]
  progress: number; // 0-1 progress between current segment
  currentSegment: {
    fromStationId: string;
    toStationId: string;
    fromStation: Station;
    toStation: Station;
  };
  direction: 'forward' | 'backward';
  nextArrivalTime?: Date;
  delay: number; // in seconds
}

export class TrainSimulationEngine {
  private trains: Train[] = [];

  constructor() {
    this.initializeTrains();
  }

  private initializeTrains(): void {
    // Initialize trains for each route based on frequency
    routes.forEach(route => {
      this.createTrainsForRoute(route);
    });
  }

  private createTrainsForRoute(route: Route): void {
    const now = new Date();
    
    // Define service hours for each route type
    let serviceStart: Date;
    let serviceEnd: Date;
    
    if (route.id === 'marmaray-evening') {
      // Evening service: 20:50 - 23:30 (last train departure)
      serviceStart = new Date(now);
      serviceStart.setHours(20, 50, 0, 0);
      serviceEnd = new Date(now);
      serviceEnd.setHours(23, 30, 0, 0);
    } else {
      // Regular services: 6:00 AM - 22:30 (last train departure)
      serviceStart = new Date(now);
      serviceStart.setHours(6, 0, 0, 0);
      serviceEnd = new Date(now);
      serviceEnd.setHours(22, 30, 0, 0);
    }

    // Skip if outside service hours
    if (now < serviceStart || now > serviceEnd) {
      return;
    }

    // Calculate how many trains should be running based on frequency
    const minutesSinceStart = Math.floor((now.getTime() - serviceStart.getTime()) / (1000 * 60));
    const trainCount = Math.ceil(minutesSinceStart / route.frequency);

    // Create trains in both directions
    for (let i = 0; i < trainCount; i++) {
      // Forward direction train
      const forwardDepartureTime = new Date(serviceStart);
      forwardDepartureTime.setMinutes(forwardDepartureTime.getMinutes() + (i * route.frequency));
      
      if (forwardDepartureTime <= now) {
        this.trains.push(this.createTrain(
          `${route.id}-forward-${i}`,
          route.id,
          'forward',
          forwardDepartureTime
        ));
      }

      // Backward direction train (offset by half frequency for better spacing)
      const backwardDepartureTime = new Date(serviceStart);
      backwardDepartureTime.setMinutes(
        backwardDepartureTime.getMinutes() + (i * route.frequency) + Math.floor(route.frequency / 2)
      );
      
      if (backwardDepartureTime <= now) {
        this.trains.push(this.createTrain(
          `${route.id}-backward-${i}`,
          route.id,
          'backward',
          backwardDepartureTime
        ));
      }
    }
  }

  private createTrain(
    trainId: string,
    routeId: string,
    direction: 'forward' | 'backward',
    departureTime: Date
  ): Train {
    const route = routes.find(r => r.id === routeId)!;
    const startStationId = direction === 'forward' ? route.termini[0] : route.termini[1];
    const endStationId = direction === 'forward' ? route.termini[1] : route.termini[0];
    
    return {
      id: trainId,
      routeId,
      direction,
      departureTime,
      currentPosition: {
        fromStationId: startStationId,
        toStationId: endStationId,
        progress: 0,
        coordinates: this.getStationCoordinates(startStationId)
      }
    };
  }

  private getStationCoordinates(stationId: string): [number, number] {
    const station = stations.find(s => s.id === stationId);
    return station ? station.coordinates : [29.0, 41.0]; // Default to Istanbul center
  }

  public calculateTrainPositions(currentTime: Date = new Date()): TrainPosition[] {
    const positions: TrainPosition[] = [];

    for (const train of this.trains) {
      const position = this.calculateSingleTrainPosition(train, currentTime);
      if (position) {
        positions.push(position);
      }
    }

    return positions;
  }

  private calculateSingleTrainPosition(train: Train, currentTime: Date): TrainPosition | null {
    const route = routes.find(r => r.id === train.routeId);
    if (!route) return null;

    const elapsedTime = Math.floor((currentTime.getTime() - train.departureTime.getTime()) / 1000);
    
    // If train hasn't departed yet
    if (elapsedTime < 0) return null;

    // Get ordered stations for this direction
    const orderedStations = train.direction === 'forward' 
      ? route.stations 
      : [...route.stations].reverse();

    // Calculate position along the route
    let totalTime = 0;
    let currentSegmentIndex = 0;

    // Find which segment the train is currently in
    for (let i = 0; i < orderedStations.length - 1; i++) {
      const fromStationId = orderedStations[i];
      const toStationId = orderedStations[i + 1];
      const segmentTime = this.getInterStationTime(fromStationId, toStationId);

      if (elapsedTime < totalTime + segmentTime) {
        // Train is in this segment
        currentSegmentIndex = i;
        break;
      }

      totalTime += segmentTime;
      currentSegmentIndex = i + 1;
    }

    // If train has completed the route, remove it (in real app, might turn around)
    if (currentSegmentIndex >= orderedStations.length - 1) {
      return null;
    }

    const fromStationId = orderedStations[currentSegmentIndex];
    const toStationId = orderedStations[currentSegmentIndex + 1];
    const fromStation = stations.find(s => s.id === fromStationId)!;
    const toStation = stations.find(s => s.id === toStationId)!;
    
    const segmentTime = this.getInterStationTime(fromStationId, toStationId);
    const timeInCurrentSegment = elapsedTime - totalTime;
    const progress = Math.max(0, Math.min(timeInCurrentSegment / segmentTime, 1));

    // Interpolate coordinates between stations
    const coordinates = this.interpolateCoordinates(
      fromStation.coordinates,
      toStation.coordinates,
      progress
    );

    return {
      trainId: train.id,
      routeId: train.routeId,
      coordinates,
      progress,
      currentSegment: {
        fromStationId,
        toStationId,
        fromStation,
        toStation
      },
      direction: train.direction,
      delay: 0 // No delay simulation for now
    };
  }

  private getInterStationTime(fromStationId: string, toStationId: string): number {
    const timeData = interStationTimes.find(
      t => t.fromStationId === fromStationId && t.toStationId === toStationId
    );
    return timeData ? timeData.time : 120; // Default 2 minutes if not found
  }

  private interpolateCoordinates(
    from: [number, number],
    to: [number, number],
    progress: number
  ): [number, number] {
    const lng = from[0] + (to[0] - from[0]) * progress;
    const lat = from[1] + (to[1] - from[1]) * progress;
    return [lng, lat];
  }

  // Method to add real-time updates
  public updateTrainPositions(currentTime: Date = new Date()): TrainPosition[] {
    // In a real implementation, this might fetch from an API
    return this.calculateTrainPositions(currentTime);
  }

  // Get trains for a specific route
  public getTrainsForRoute(routeId: string, currentTime: Date = new Date()): TrainPosition[] {
    return this.calculateTrainPositions(currentTime).filter(pos => pos.routeId === routeId);
  }

  // Clean up old trains that have completed their journey
  public cleanup(currentTime: Date = new Date()): void {
    const maxJourneyTime = 120 * 60; // 2 hours max journey time
    this.trains = this.trains.filter(train => {
      const elapsedTime = Math.floor((currentTime.getTime() - train.departureTime.getTime()) / 1000);
      return elapsedTime < maxJourneyTime;
    });
  }
}