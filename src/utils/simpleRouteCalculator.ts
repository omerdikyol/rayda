/**
 * Simple Route Calculator - Direct approach using stations and track geometry
 */

import type { Station, Route } from '../types';
import marmarayTrackGeometry from '../data/marmaray-track-geometry.json';
import { interStationTimes } from '../data/interStationTimes';
import { excludedRailwayIds, excludedRailwayNames } from '../data/excludedRailwaySegments';

interface Coordinate {
  lng: number;
  lat: number;
}

interface TrackSegment {
  id: string;
  coordinates: Coordinate[];
  length: number;
}

interface RouteSegment {
  fromStationId: string;
  toStationId: string;
  trackPath: Coordinate[];
  distance: number;
  travelTime: number;
}

interface RouteInfo {
  routeId: string;
  segments: RouteSegment[];
  totalDistance: number;
  totalTravelTime: number;
}

export interface TrainPositionResult {
  coordinate: Coordinate;
  bearing: number;
  progress: number;
  currentSegment: {
    fromStationId: string;
    toStationId: string;
    fromStation: Station;
    toStation: Station;
  };
}

export class SimpleRouteCalculator {
  private trackSegments: TrackSegment[] = [];
  private routeCache = new Map<string, RouteInfo>();
  private stations: Station[] = [];
  private excludedFeatureNames = new Set<string>();


  async initialize(stations: Station[]): Promise<void> {
    console.log('🚂 Initializing Simple Route Calculator...');
    this.stations = stations;
    
    // Add default excluded features by name
    excludedRailwayNames.forEach(name => this.excludedFeatureNames.add(name));
    console.log(`🚫 Auto-excluding ${excludedRailwayNames.length} non-Marmaray features by name`);
    
    // Process track geometry into segments
    this.processTrackGeometry();
    
    console.log(`📍 Processed ${this.trackSegments.length} track segments`);
    console.log(`🚉 Using ${stations.length} stations`);
  }

  private processTrackGeometry(): void {
    const geoData = marmarayTrackGeometry as any;
    
    for (const feature of geoData.features) {
      // Skip excluded features by name
      if (feature.properties.name && this.excludedFeatureNames.has(feature.properties.name)) {
        console.log(`⏭️ Skipping excluded railway feature: "${feature.properties.name}"`);
        continue;
      }
      
      // Skip excluded features by ID
      if (feature.properties.id && excludedRailwayIds.includes(feature.properties.id)) {
        console.log(`⏭️ Skipping excluded railway feature ID: ${feature.properties.id}`);
        continue;
      }
      
      if (feature.geometry.type === 'LineString') {
        const coordinates: Coordinate[] = feature.geometry.coordinates.map((coord: [number, number]) => ({
          lng: coord[0],
          lat: coord[1]
        }));
        
        if (coordinates.length >= 2) {
          const segment: TrackSegment = {
            id: `track_${feature.properties.id || Math.random()}`,
            coordinates,
            length: this.calculatePathLength(coordinates)
          };
          
          this.trackSegments.push(segment);
        }
      }
    }
  }

  calculateRoutePattern(route: Route): RouteInfo | null {
    console.log(`🛤️ Calculating route pattern for ${route.id}`);
    
    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalTravelTime = 0;

    // Build route segments between consecutive stations
    for (let i = 0; i < route.stations.length - 1; i++) {
      const fromStationId = route.stations[i];
      const toStationId = route.stations[i + 1];
      
      const fromStation = this.stations.find(s => s.id === fromStationId);
      const toStation = this.stations.find(s => s.id === toStationId);
      
      if (!fromStation || !toStation) {
        console.warn(`Missing station: ${fromStationId} or ${toStationId}`);
        continue;
      }

      // Find track path between these stations
      const trackPath = this.findTrackPath(fromStation, toStation);
      const distance = this.calculatePathLength(trackPath);
      const travelTime = this.getInterStationTime(fromStationId, toStationId);

      segments.push({
        fromStationId,
        toStationId,
        trackPath,
        distance,
        travelTime
      });

      totalDistance += distance;
      totalTravelTime += travelTime;
    }

    const routeInfo: RouteInfo = {
      routeId: route.id,
      segments,
      totalDistance,
      totalTravelTime
    };

    this.routeCache.set(route.id, routeInfo);
    console.log(`✅ Route ${route.id}: ${segments.length} segments, ${(totalDistance/1000).toFixed(1)}km, ${Math.round(totalTravelTime/60)}min`);
    
    return routeInfo;
  }

  private findTrackPath(fromStation: Station, toStation: Station): Coordinate[] {
    const fromCoord: Coordinate = { lng: fromStation.coordinates[0], lat: fromStation.coordinates[1] };
    const toCoord: Coordinate = { lng: toStation.coordinates[0], lat: toStation.coordinates[1] };

    // Simple approach: find track segments that are roughly in the right direction
    // and close to both stations
    let bestPath: Coordinate[] = [];
    let bestScore = -1;

    for (const segment of this.trackSegments) {
      const startDist = this.calculateDistance(fromCoord, segment.coordinates[0]);
      const endDist = this.calculateDistance(toCoord, segment.coordinates[segment.coordinates.length - 1]);
      
      // Also check reverse direction
      const startDistRev = this.calculateDistance(fromCoord, segment.coordinates[segment.coordinates.length - 1]);
      const endDistRev = this.calculateDistance(toCoord, segment.coordinates[0]);

      // Score based on how well this segment connects the stations
      const score1 = 1.0 / (startDist + endDist + 1);
      const score2 = 1.0 / (startDistRev + endDistRev + 1);

      if (score1 > bestScore) {
        bestScore = score1;
        bestPath = segment.coordinates;
      }
      
      if (score2 > bestScore) {
        bestScore = score2;
        bestPath = [...segment.coordinates].reverse();
      }
    }

    // If no good track found, use straight line
    if (bestPath.length === 0 || bestScore < 0.00001) {
      console.log(`📏 Using straight line for ${fromStation.name} -> ${toStation.name}`);
      return [fromCoord, toCoord];
    }

    return bestPath;
  }

  calculateTrainPosition(
    routeId: string,
    direction: 'forward' | 'backward',
    progress: number,
    stations: Station[]
  ): TrainPositionResult | null {
    const routeInfo = this.routeCache.get(routeId);
    if (!routeInfo) {
      console.warn(`No route info for ${routeId}`);
      return null;
    }

    // For backward direction, reverse both the segments AND their internal track paths
    let segments: RouteSegment[];
    if (direction === 'backward') {
      segments = [...routeInfo.segments].reverse().map(segment => ({
        ...segment,
        // Swap from/to stations for backward direction
        fromStationId: segment.toStationId,
        toStationId: segment.fromStationId,
        // Reverse the track path coordinates
        trackPath: [...segment.trackPath].reverse()
      }));
    } else {
      segments = routeInfo.segments;
    }

    const targetDistance = routeInfo.totalDistance * progress;
    
    let currentDistance = 0;
    
    // Find which segment contains the target position
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (currentDistance + segment.distance >= targetDistance) {
        // Calculate progress within this segment
        const segmentProgress = segment.distance > 0 ? 
          (targetDistance - currentDistance) / segment.distance : 0;
        
        // Interpolate along track path
        const coordinate = this.interpolateAlongPath(segment.trackPath, segmentProgress);
        const bearing = this.calculateBearing(segment.trackPath, segmentProgress);

        // Get station info
        const fromStation = stations.find(s => s.id === segment.fromStationId) || 
          { id: segment.fromStationId, name: segment.fromStationId, coordinates: [0, 0] as [number, number], distanceFromStart: 0 };
        const toStation = stations.find(s => s.id === segment.toStationId) || 
          { id: segment.toStationId, name: segment.toStationId, coordinates: [0, 0] as [number, number], distanceFromStart: 0 };

        return {
          coordinate,
          bearing,
          progress,
          currentSegment: {
            fromStationId: segment.fromStationId,
            toStationId: segment.toStationId,
            fromStation,
            toStation
          }
        };
      }

      currentDistance += segment.distance;
    }

    // Fallback to end position
    const lastSegment = segments[segments.length - 1];
    return {
      coordinate: lastSegment.trackPath[lastSegment.trackPath.length - 1],
      bearing: 0,
      progress: 1,
      currentSegment: {
        fromStationId: lastSegment.fromStationId,
        toStationId: lastSegment.toStationId,
        fromStation: stations.find(s => s.id === lastSegment.fromStationId)!,
        toStation: stations.find(s => s.id === lastSegment.toStationId)!
      }
    };
  }

  private interpolateAlongPath(path: Coordinate[], progress: number): Coordinate {
    if (path.length === 0) return { lng: 29.0, lat: 41.0 };
    if (path.length === 1) return path[0];
    
    progress = Math.max(0, Math.min(1, progress));
    
    // Calculate cumulative distances
    const distances: number[] = [0];
    let totalLength = 0;
    
    for (let i = 1; i < path.length; i++) {
      const segmentLength = this.calculateDistance(path[i - 1], path[i]);
      totalLength += segmentLength;
      distances.push(totalLength);
    }
    
    if (totalLength === 0) return path[0];
    
    const targetDistance = totalLength * progress;
    
    // Find segment containing target distance
    for (let i = 1; i < distances.length; i++) {
      if (distances[i] >= targetDistance) {
        const segmentProgress = distances[i - 1] < distances[i] ? 
          (targetDistance - distances[i - 1]) / (distances[i] - distances[i - 1]) : 0;
        
        // Linear interpolation between points
        const from = path[i - 1];
        const to = path[i];
        
        return {
          lng: from.lng + (to.lng - from.lng) * segmentProgress,
          lat: from.lat + (to.lat - from.lat) * segmentProgress
        };
      }
    }
    
    return path[path.length - 1];
  }

  private calculateBearing(path: Coordinate[], progress: number): number {
    if (path.length < 2) return 0;
    
    // Get current position and look-ahead position
    const coord1 = this.interpolateAlongPath(path, progress);
    const coord2 = this.interpolateAlongPath(path, Math.min(progress + 0.01, 1));
    
    // Calculate bearing from current to next position
    const deltaLng = coord2.lng - coord1.lng;
    const deltaLat = coord2.lat - coord1.lat;
    
    const angle = Math.atan2(deltaLng, deltaLat);
    let bearing = (angle * 180 / Math.PI + 360) % 360;
    
    // Debug bearing occasionally - disabled to reduce console noise
    // if (Math.random() < 0.001) {
    //   console.log(`🧭 Bearing: ${bearing.toFixed(1)}° from [${coord1.lng.toFixed(4)}, ${coord1.lat.toFixed(4)}] to [${coord2.lng.toFixed(4)}, ${coord2.lat.toFixed(4)}]`);
    // }
    
    return bearing;
  }

  private calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculatePathLength(coordinates: Coordinate[]): number {
    let length = 0;
    for (let i = 1; i < coordinates.length; i++) {
      length += this.calculateDistance(coordinates[i - 1], coordinates[i]);
    }
    return length;
  }

  private getInterStationTime(fromStationId: string, toStationId: string): number {
    const timeData = interStationTimes.find(
      t => t.fromStationId === fromStationId && t.toStationId === toStationId
    );
    return timeData ? timeData.time : 120; // Default 2 minutes if not found
  }

  getRouteInfo(routeId: string): RouteInfo | null {
    return this.routeCache.get(routeId) || null;
  }

  getNetworkStats() {
    return {
      totalNodes: 0,
      totalEdges: this.trackSegments.length,
      totalLength: this.trackSegments.reduce((sum, seg) => sum + seg.length, 0) / 1000,
      stationNodes: this.stations.length,
      junctionNodes: 0
    };
  }

  /**
   * Exclude railway features by name
   */
  excludeFeatures(featureNames: string[]): void {
    featureNames.forEach(name => this.excludedFeatureNames.add(name));
    console.log(`🚫 Excluded ${featureNames.length} railway features: ${featureNames.join(', ')}`);
  }

  /**
   * Reinitialize with current exclusions
   */
  async reinitialize(): Promise<void> {
    // Clear existing data
    this.trackSegments = [];
    this.routeCache.clear();
    
    // Reprocess with exclusions
    this.processTrackGeometry();
    
    console.log(`🔄 Reinitialized with ${this.trackSegments.length} track segments (${this.excludedFeatureNames.size} features excluded)`);
  }

  /**
   * Get list of excluded feature names
   */
  getExcludedFeatures(): string[] {
    return Array.from(this.excludedFeatureNames);
  }
}