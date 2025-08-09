import type { Train, Route, Station } from '../types';
import { routes } from '../data/routes';
import { stations } from '../data/stations';
import { interStationTimes } from '../data/interStationTimes';
import { SimpleRouteCalculator } from './simpleRouteCalculator';

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
  bearing: number; // Track direction in degrees
  nextArrivalTime?: Date;
  delay: number; // in seconds
}

export class TrainSimulationEngine {
  private trains: Train[] = [];
  private routeCalculator: SimpleRouteCalculator;
  private isInitialized = false;

  constructor() {
    this.routeCalculator = new SimpleRouteCalculator();
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    try {
      console.log('🚂 Initializing Train Simulation Engine...');
      await this.routeCalculator.initialize(stations);
      
      console.log('📊 Pre-calculating route patterns...');
      // Pre-calculate all route patterns
      for (const route of routes) {
        const routeInfo = this.routeCalculator.calculateRoutePattern(route);
        if (routeInfo) {
          console.log(`✅ Route ${route.id}: ${(routeInfo.totalDistance/1000).toFixed(1)}km, ${Math.round(routeInfo.totalTravelTime/60)}min`);
        } else {
          console.warn(`❌ Failed to calculate route pattern for ${route.id}`);
        }
      }
      
      this.isInitialized = true;
      this.initializeTrains();
      
      const stats = this.routeCalculator.getNetworkStats();
      console.log(`✅ Train Simulation Engine initialized: ${stats.totalNodes} nodes, ${stats.totalEdges} edges, ${stats.totalLength.toFixed(1)}km network`);
    } catch (error) {
      console.error('❌ Failed to initialize Train Simulation Engine:', error);
      // Fall back to simple mode
      this.isInitialized = false;
      this.initializeTrains();
    }
  }

  private initializeTrains(): void {
    // Clear existing trains
    this.trains = [];
    
    console.log(`🚂 Creating trains (system initialized: ${this.isInitialized})`);
    
    // Initialize trains for each route based on frequency
    routes.forEach(route => {
      this.createTrainsForRoute(route);
    });
    
    console.log(`🚂 Created ${this.trains.length} trains total`);
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
        const train = this.createTrain(
          `${route.id}-forward-${i}`,
          route.id,
          'forward',
          forwardDepartureTime
        );
        this.trains.push(train);
      }

      // Backward direction train (offset by half frequency for better spacing)
      const backwardDepartureTime = new Date(serviceStart);
      backwardDepartureTime.setMinutes(
        backwardDepartureTime.getMinutes() + (i * route.frequency) + Math.floor(route.frequency / 2)
      );
      
      if (backwardDepartureTime <= now) {
        const train = this.createTrain(
          `${route.id}-backward-${i}`,
          route.id,
          'backward',
          backwardDepartureTime
        );
        this.trains.push(train);
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
    if (!this.isInitialized) {
      return []; // Return empty array until initialized
    }

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
    if (!route) {
      return null;
    }

    const elapsedTime = Math.floor((currentTime.getTime() - train.departureTime.getTime()) / 1000);
    
    // If train hasn't departed yet
    if (elapsedTime < 0) {
      return null;
    }

    // Get the route information from the route calculator
    const routeInfo = this.routeCalculator.getRouteInfo(train.routeId);
    if (!routeInfo) {
      // Fallback to simple station-to-station interpolation
      return this.calculateTrainPositionFallback(train, currentTime, route, elapsedTime);
    }

    // Use the route's pre-calculated travel time or fall back to station-based calculation
    const totalJourneyTime = routeInfo.totalTravelTime || this.calculateJourneyTime(route, train.direction);

    // If train has completed the journey, remove it
    if (elapsedTime >= totalJourneyTime) {
      return null;
    }

    // Calculate progress along the entire route (0-1)
    const routeProgress = Math.max(0, Math.min(elapsedTime / totalJourneyTime, 1));

    // Use the new route calculator system
    const positionResult = this.routeCalculator.calculateTrainPosition(
      train.routeId,
      train.direction,
      routeProgress,
      stations
    );

    if (!positionResult) {
      return null;
    }

    const coordinates: [number, number] = [positionResult.coordinate.lng, positionResult.coordinate.lat];
    const bearing = positionResult.bearing;
    const currentSegment = positionResult.currentSegment;

    return {
      trainId: train.id,
      routeId: train.routeId,
      coordinates,
      progress: routeProgress,
      currentSegment,
      direction: train.direction,
      bearing: bearing,
      delay: 0 // No delay simulation for now
    };
  }

  private getInterStationTime(fromStationId: string, toStationId: string): number {
    const timeData = interStationTimes.find(
      t => t.fromStationId === fromStationId && t.toStationId === toStationId
    );
    return timeData ? timeData.time : 120; // Default 2 minutes if not found
  }

  private calculateJourneyTime(route: Route, direction: 'forward' | 'backward'): number {
    const orderedStations = direction === 'forward' 
      ? route.stations 
      : [...route.stations].reverse();

    let totalJourneyTime = 0;
    for (let i = 0; i < orderedStations.length - 1; i++) {
      const fromStationId = orderedStations[i];
      const toStationId = orderedStations[i + 1];
      totalJourneyTime += this.getInterStationTime(fromStationId, toStationId);
    }
    
    return totalJourneyTime;
  }

  private calculateTrainPositionFallback(
    train: Train, 
    _currentTime: Date, 
    route: Route, 
    elapsedTime: number
  ): TrainPosition | null {
    // Simple fallback using station-to-station linear interpolation
    const orderedStations = train.direction === 'forward' 
      ? route.stations 
      : [...route.stations].reverse();

    // Calculate total journey time
    let totalJourneyTime = 0;
    for (let i = 0; i < orderedStations.length - 1; i++) {
      const fromStationId = orderedStations[i];
      const toStationId = orderedStations[i + 1];
      totalJourneyTime += this.getInterStationTime(fromStationId, toStationId);
    }

    // If train has completed the journey
    if (elapsedTime >= totalJourneyTime) {
      return null;
    }

    // Find which station segment we're in
    let currentSegmentTime = 0;
    for (let i = 0; i < orderedStations.length - 1; i++) {
      const fromStationId = orderedStations[i];
      const toStationId = orderedStations[i + 1];
      const segmentTime = this.getInterStationTime(fromStationId, toStationId);

      if (elapsedTime < currentSegmentTime + segmentTime) {
        // Train is in this segment
        const segmentProgress = (elapsedTime - currentSegmentTime) / segmentTime;
        const fromStation = stations.find(s => s.id === fromStationId)!;
        const toStation = stations.find(s => s.id === toStationId)!;
        
        // Linear interpolation between stations
        const lng = fromStation.coordinates[0] + (toStation.coordinates[0] - fromStation.coordinates[0]) * segmentProgress;
        const lat = fromStation.coordinates[1] + (toStation.coordinates[1] - fromStation.coordinates[1]) * segmentProgress;
        
        // Calculate bearing
        const bearing = this.calculateSimpleBearing(fromStation.coordinates, toStation.coordinates);
        
        return {
          trainId: train.id,
          routeId: train.routeId,
          coordinates: [lng, lat],
          progress: elapsedTime / totalJourneyTime,
          currentSegment: {
            fromStationId,
            toStationId,
            fromStation,
            toStation
          },
          direction: train.direction,
          bearing: bearing,
          delay: 0
        };
      }

      currentSegmentTime += segmentTime;
    }

    return null;
  }

  private calculateSimpleBearing(from: [number, number], to: [number, number]): number {
    const [fromLng, fromLat] = from;
    const [toLng, toLat] = to;
    
    const deltaLng = toLng - fromLng;
    const deltaLat = toLat - fromLat;
    
    // Calculate angle in radians
    const angle = Math.atan2(deltaLng, deltaLat);
    
    // Convert to degrees (0-360) and adjust for Mapbox rotation (0° = North)
    let bearing = (angle * 180 / Math.PI + 360) % 360;
    
    return bearing;
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

  /**
   * Exclude railway features by name and reinitialize
   */
  public async excludeRailwayFeatures(featureNames: string[]): Promise<void> {
    this.routeCalculator.excludeFeatures(featureNames);
    await this.routeCalculator.reinitialize();
    
    // Recalculate all route patterns
    for (const route of routes) {
      this.routeCalculator.calculateRoutePattern(route);
    }
    
    console.log('✅ Railway features excluded and system reinitialized');
  }

  /**
   * Get excluded features
   */
  public getExcludedFeatures(): string[] {
    return this.routeCalculator.getExcludedFeatures();
  }
}