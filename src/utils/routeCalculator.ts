/**
 * High-Level Route Calculator
 * Provides station-to-station routing with train simulation support
 */

import { RailwayGraph, type PathSegment, type Coordinate } from './railwayGraph';
import { PathfindingEngine, type PathfindingOptions } from './pathfinder';
import { TrackProcessor } from './trackProcessor';
import type { Station, Route } from '../types';
import marmarayTrackGeometry from '../data/marmaray-track-geometry.json';

export interface RouteInfo {
  routeId: string;
  stations: string[];
  totalDistance: number;
  totalTravelTime: number;
  segments: PathSegment[];
}

export interface TrainPositionResult {
  coordinate: Coordinate;
  bearing: number;
  progress: number; // 0-1 along entire route
  currentSegment: {
    fromStationId: string;
    toStationId: string;
    fromStation: Station;
    toStation: Station;
  };
}

export class RouteCalculator {
  private graph: RailwayGraph;
  private pathfinder: PathfindingEngine;
  private trackProcessor: TrackProcessor;
  private routeCache = new Map<string, RouteInfo>();
  private isInitialized = false;

  constructor() {
    this.graph = new RailwayGraph();
    this.pathfinder = new PathfindingEngine(this.graph);
    this.trackProcessor = new TrackProcessor(this.graph);
  }

  /**
   * Initialize the route calculator with track data and stations
   */
  async initialize(stations: Station[]): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚂 Initializing Route Calculator...');
    const startTime = Date.now();

    try {
      // Process track geometry data
      console.log(`📍 Processing ${(marmarayTrackGeometry as any).features.length} track features...`);
      await this.trackProcessor.processTrackData(marmarayTrackGeometry as any, stations);

      // Pre-calculate routes for known route patterns
      await this.preCalculateRoutes(stations);

      this.isInitialized = true;
      const initTime = Date.now() - startTime;
      
      console.log(`✅ Route Calculator initialized in ${initTime}ms`);
      const stats = this.graph.getNetworkStats();
      console.log(`📊 Network: ${stats.totalNodes} nodes, ${stats.totalEdges} edges, ${stats.totalLength.toFixed(1)}km`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Route Calculator:', error);
      console.error('Error details:', error);
      throw error;
    }
  }

  /**
   * Calculate route between two stations
   */
  calculateStationRoute(
    fromStationId: string,
    toStationId: string,
    options: Partial<PathfindingOptions> = {}
  ): RouteInfo | null {
    if (!this.isInitialized) {
      console.warn('Route Calculator not initialized');
      return null;
    }

    const cacheKey = `${fromStationId}-${toStationId}-${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)!;
    }

    // Find station nodes
    const fromNode = this.findStationNode(fromStationId);
    const toNode = this.findStationNode(toStationId);

    if (!fromNode || !toNode) {
      console.warn(`Cannot find nodes for stations ${fromStationId} -> ${toStationId}`);
      return null;
    }

    // Find path
    const path = this.pathfinder.findPath(fromNode.id, toNode.id, options);
    if (!path) {
      console.warn(`No path found between stations ${fromStationId} -> ${toStationId}`);
      return null;
    }

    // Convert to route info
    const routeInfo: RouteInfo = {
      routeId: `${fromStationId}-${toStationId}`,
      stations: [fromStationId, toStationId],
      totalDistance: path.totalDistance,
      totalTravelTime: path.totalTravelTime,
      segments: path.segments
    };

    // Cache the result
    this.routeCache.set(cacheKey, routeInfo);
    
    return routeInfo;
  }

  /**
   * Calculate route for predefined route patterns
   */
  calculateRoutePattern(route: Route): RouteInfo | null {
    if (!this.isInitialized || route.stations.length < 2) {
      return null;
    }

    const cacheKey = `pattern-${route.id}`;
    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)!;
    }

    console.log(`🛤️ Calculating route pattern for ${route.id}`);

    const allSegments: PathSegment[] = [];
    let totalDistance = 0;
    let totalTravelTime = 0;

    // Build complete route by connecting consecutive stations
    for (let i = 0; i < route.stations.length - 1; i++) {
      const fromStationId = route.stations[i];
      const toStationId = route.stations[i + 1];

      const segmentRoute = this.calculateStationRoute(fromStationId, toStationId);
      if (!segmentRoute) {
        console.warn(`Failed to calculate segment ${fromStationId} -> ${toStationId} for route ${route.id}`);
        return null;
      }

      allSegments.push(...segmentRoute.segments);
      totalDistance += segmentRoute.totalDistance;
      totalTravelTime += segmentRoute.totalTravelTime;
    }

    const routeInfo: RouteInfo = {
      routeId: route.id,
      stations: route.stations,
      totalDistance,
      totalTravelTime,
      segments: allSegments
    };

    this.routeCache.set(cacheKey, routeInfo);
    console.log(`✅ Route pattern ${route.id}: ${allSegments.length} segments, ${(totalDistance/1000).toFixed(1)}km`);

    return routeInfo;
  }

  /**
   * Calculate train position along a route
   */
  calculateTrainPosition(
    routeId: string,
    direction: 'forward' | 'backward',
    progress: number, // 0-1 along entire route
    stations: Station[]
  ): TrainPositionResult | null {
    const routeInfo = this.routeCache.get(routeId) || this.routeCache.get(`pattern-${routeId}`);
    if (!routeInfo) {
      console.warn(`Route info not found for ${routeId}`);
      return null;
    }

    // Get ordered segments based on direction
    const segments = direction === 'forward' ? 
      routeInfo.segments : 
      [...routeInfo.segments].reverse();

    // Calculate target distance along route
    const targetDistance = routeInfo.totalDistance * progress;
    let currentDistance = 0;

    // Find which segment contains the target position
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (currentDistance + segment.distance >= targetDistance) {
        // Calculate progress within this segment
        const segmentProgress = segment.distance > 0 ? 
          (targetDistance - currentDistance) / segment.distance : 0;
        
        // Get coordinate along edge
        const coordinate = this.graph.interpolateAlongEdge(
          segment.edgeId, 
          segmentProgress, 
          direction === 'forward' ? segment.direction : 
            (segment.direction === 'forward' ? 'backward' : 'forward')
        );

        // Calculate bearing
        const bearing = this.calculateBearingAtPosition(segment, segmentProgress, direction);

        // Find current segment info for stations
        const currentSegment = this.getCurrentSegmentInfo(routeInfo, progress, direction, stations);

        return {
          coordinate,
          bearing,
          progress,
          currentSegment
        };
      }

      currentDistance += segment.distance;
    }

    // Fallback to end position
    const lastSegment = segments[segments.length - 1];
    const coordinate = this.graph.interpolateAlongEdge(lastSegment.edgeId, 1.0, lastSegment.direction);
    const bearing = this.calculateBearingAtPosition(lastSegment, 1.0, direction);
    const currentSegment = this.getCurrentSegmentInfo(routeInfo, 1.0, direction, stations);

    return {
      coordinate,
      bearing,
      progress: 1.0,
      currentSegment
    };
  }

  /**
   * Get bearing along a route path
   */
  getBearingAlongRoute(
    routeId: string,
    direction: 'forward' | 'backward',
    progress: number
  ): number {
    const position = this.calculateTrainPosition(routeId, direction, progress, []);
    return position?.bearing || 0;
  }

  /**
   * Interpolate coordinate along a route path
   */
  interpolateAlongRoute(
    routeId: string,
    direction: 'forward' | 'backward',
    progress: number
  ): Coordinate {
    const position = this.calculateTrainPosition(routeId, direction, progress, []);
    return position?.coordinate || { lng: 29.0, lat: 41.0 };
  }

  /**
   * Get route information
   */
  getRouteInfo(routeId: string): RouteInfo | null {
    // Check both direct route ID and pattern-prefixed keys
    const direct = this.routeCache.get(routeId);
    const pattern = this.routeCache.get(`pattern-${routeId}`);
    
    if (direct) {
      return direct;
    } else if (pattern) {
      return pattern;
    } else {
      // Debug: show available keys
      const availableKeys = Array.from(this.routeCache.keys());
      console.log(`❓ Route ${routeId} not found. Available: ${availableKeys.join(', ')}`);
      return null;
    }
  }

  /**
   * Get all cached routes
   */
  getAllRoutes(): RouteInfo[] {
    return Array.from(this.routeCache.values());
  }

  /**
   * Clear route cache
   */
  clearCache(): void {
    this.routeCache.clear();
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    return this.graph.getNetworkStats();
  }

  // Private helper methods

  private async preCalculateRoutes(_stations: Station[]): Promise<void> {
    // This could be expanded to pre-calculate common station pairs
    console.log('📋 Pre-calculating common routes...');
  }

  private findStationNode(stationId: string) {
    const allNodes = this.graph.getAllNodes();
    return allNodes.find(node => node.stationId === stationId);
  }

  private calculateBearingAtPosition(
    segment: PathSegment, 
    segmentProgress: number, 
    _direction: 'forward' | 'backward'
  ): number {
    const edge = this.graph.getEdge(segment.edgeId);
    if (!edge || edge.geometry.length < 2) return 0;
    
    // Get two points for bearing calculation
    const currentPos = this.graph.interpolateAlongEdge(segment.edgeId, segmentProgress, segment.direction);
    const lookAheadProgress = Math.min(segmentProgress + 0.01, 1.0);
    const lookAheadPos = this.graph.interpolateAlongEdge(segment.edgeId, lookAheadProgress, segment.direction);

    return this.graph.calculateBearing(currentPos, lookAheadPos);
  }

  private getCurrentSegmentInfo(
    routeInfo: RouteInfo,
    progress: number,
    direction: 'forward' | 'backward',
    _stations: Station[]
  ) {
    const orderedStations = direction === 'forward' ? 
      routeInfo.stations : 
      [...routeInfo.stations].reverse();

    // Simple approximation - find which station segment we're in
    const stationCount = orderedStations.length - 1;
    const segmentIndex = Math.min(Math.floor(progress * stationCount), stationCount - 1);
    
    const fromStationId = orderedStations[segmentIndex];
    const toStationId = orderedStations[segmentIndex + 1];
    
    // Create simple default stations - could be enhanced to use actual station data
    const defaultFromStation: Station = { 
      id: fromStationId, 
      name: fromStationId, 
      coordinates: [0, 0] as [number, number],
      distanceFromStart: 0
    };
    
    const defaultToStation: Station = { 
      id: toStationId, 
      name: toStationId, 
      coordinates: [0, 0] as [number, number],
      distanceFromStart: 0
    };

    return {
      fromStationId,
      toStationId,
      fromStation: defaultFromStation,
      toStation: defaultToStation
    };
  }
}