/**
 * Railway Track Processor
 * Processes GeoJSON railway data and builds the railway network graph
 */

import { RailwayGraph, type RailwayNode, type RailwayEdge, type Coordinate } from './railwayGraph';
import type { Station } from '../types';

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id?: number;
    name?: string;
    railway?: string;
    electrified?: string;
    gauge?: string;
    maxspeed?: string;
    usage?: string;
    [key: string]: any;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ProcessingOptions {
  connectionTolerance: number; // Tolerance in meters for connecting track endpoints
  minSegmentLength: number;    // Minimum segment length in meters
  simplifyGeometry: boolean;   // Whether to simplify track geometry
  maxSpeed: number;           // Default maximum speed in km/h
}

export class TrackProcessor {
  private graph: RailwayGraph;
  private options: ProcessingOptions;
  private nodeCounter = 0;
  private edgeCounter = 0;

  constructor(graph: RailwayGraph, options: Partial<ProcessingOptions> = {}) {
    this.graph = graph;
    this.options = {
      connectionTolerance: 10, // 10 meters
      minSegmentLength: 5,     // 5 meters
      simplifyGeometry: false,
      maxSpeed: 80,           // 80 km/h default
      ...options
    };
  }

  /**
   * Process GeoJSON track data and build the railway network
   */
  async processTrackData(geoJsonData: GeoJSONFeatureCollection, stations?: Station[]): Promise<void> {
    console.log(`🔄 Processing ${geoJsonData.features.length} track features`);
    
    const startTime = Date.now();
    
    // Step 1: Create edges and collect potential node coordinates
    const nodeCoordinates = new Map<string, Coordinate>();
    const edges: RailwayEdge[] = [];

    for (const feature of geoJsonData.features) {
      if (feature.geometry.type !== 'LineString') continue;
      
      const edge = this.createEdgeFromFeature(feature, nodeCoordinates);
      if (edge) {
        edges.push(edge);
      }
    }

    console.log(`📍 Created ${edges.length} edges with ${nodeCoordinates.size} potential nodes`);

    if (edges.length === 0) {
      console.error('❌ No edges created - check GeoJSON data format');
      return;
    }

    // Step 2: Create nodes from unique coordinates
    const nodeMap = new Map<string, RailwayNode>();
    for (const [nodeId, coordinate] of nodeCoordinates) {
      const node: RailwayNode = {
        id: nodeId,
        coordinate,
        type: 'endpoint', // Will be updated based on connections
        connectedEdges: []
      };
      nodeMap.set(nodeId, node);
      this.graph.addNode(node);
    }

    // Step 3: Add edges to graph and update node connections
    for (const edge of edges) {
      this.graph.addEdge(edge);
    }

    // Step 4: Classify nodes based on connections
    this.classifyNodes(nodeMap);

    // Step 5: Integrate station data if provided
    if (stations) {
      this.integrateStations(stations, nodeMap);
    }

    // Step 6: Optimize network connectivity
    await this.optimizeConnections();

    const processingTime = Date.now() - startTime;
    const stats = this.graph.getNetworkStats();
    
    console.log(`✅ Track processing completed in ${processingTime}ms`);
    console.log(`📊 Network: ${stats.totalNodes} nodes, ${stats.totalEdges} edges, ${stats.totalLength.toFixed(1)}km`);
    console.log(`🚉 Stations: ${stats.stationNodes}, Junctions: ${stats.junctionNodes}`);
  }

  /**
   * Create an edge from a GeoJSON feature
   */
  private createEdgeFromFeature(
    feature: GeoJSONFeature, 
    nodeCoordinates: Map<string, Coordinate>
  ): RailwayEdge | null {
    const coordinates = feature.geometry.coordinates;
    if (coordinates.length < 2) {
      console.warn(`Feature ${feature.properties.id} has insufficient coordinates`);
      return null;
    }

    // Convert coordinates and calculate length
    const geometry: Coordinate[] = coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1]
    }));

    const length = this.calculatePathLength(geometry);
    if (length < this.options.minSegmentLength) {
      console.warn(`Feature ${feature.properties.id} too short: ${length.toFixed(1)}m`);
      return null;
    }

    // Create node IDs for start and end points
    const startCoord = geometry[0];
    const endCoord = geometry[geometry.length - 1];
    
    const startNodeId = this.createNodeId(startCoord);
    const endNodeId = this.createNodeId(endCoord);

    // Store node coordinates
    nodeCoordinates.set(startNodeId, startCoord);
    nodeCoordinates.set(endNodeId, endCoord);

    // Parse properties
    const maxSpeed = feature.properties.maxspeed ? 
      parseInt(feature.properties.maxspeed.replace(/\D/g, '')) : this.options.maxSpeed;

    const travelTime = this.calculateTravelTime(length, maxSpeed);

    const edgeId = `edge_${this.edgeCounter++}`;
    
    return {
      id: edgeId,
      startNodeId,
      endNodeId,
      geometry: this.options.simplifyGeometry ? this.simplifyGeometry(geometry) : geometry,
      length,
      properties: {
        railway: feature.properties.railway || 'rail',
        electrified: feature.properties.electrified,
        gauge: feature.properties.gauge || '1435',
        maxSpeed,
        usage: feature.properties.usage || 'main',
        direction: 'both' // Default to bidirectional
      },
      travelTime
    };
  }

  /**
   * Create a unique node ID based on coordinate with tolerance
   */
  private createNodeId(coordinate: Coordinate): string {
    const tolerance = this.options.connectionTolerance / 111320; // Convert meters to degrees
    const roundedLng = Math.round(coordinate.lng / tolerance) * tolerance;
    const roundedLat = Math.round(coordinate.lat / tolerance) * tolerance;
    return `node_${roundedLng.toFixed(6)}_${roundedLat.toFixed(6)}`;
  }

  /**
   * Calculate path length from coordinates
   */
  private calculatePathLength(coordinates: Coordinate[]): number {
    let length = 0;
    for (let i = 1; i < coordinates.length; i++) {
      length += this.graph.calculateDistance(coordinates[i - 1], coordinates[i]);
    }
    return length;
  }

  /**
   * Calculate travel time based on distance and speed
   */
  private calculateTravelTime(distanceMeters: number, maxSpeedKmh: number): number {
    const speedMs = (maxSpeedKmh * 1000) / 3600; // Convert km/h to m/s
    const baseTime = distanceMeters / speedMs;
    
    // Add buffer for acceleration/deceleration (10% additional time)
    return Math.ceil(baseTime * 1.1);
  }

  /**
   * Classify nodes based on their connections
   */
  private classifyNodes(nodeMap: Map<string, RailwayNode>): void {
    for (const node of nodeMap.values()) {
      const connectionCount = node.connectedEdges.length;
      
      if (connectionCount === 1) {
        node.type = 'endpoint';
      } else if (connectionCount === 2) {
        node.type = 'endpoint'; // Simple continuation point
      } else {
        node.type = 'junction'; // Multiple connections = junction
      }
    }
  }

  /**
   * Integrate station data into the network
   */
  private integrateStations(stations: Station[], nodeMap: Map<string, RailwayNode>): void {
    console.log(`🚉 Integrating ${stations.length} stations into network`);
    
    let mappedStations = 0;
    
    for (const station of stations) {
      const stationCoord: Coordinate = {
        lng: station.coordinates[0],
        lat: station.coordinates[1]
      };

      // Find nearest nodes within reasonable distance - try multiple radii
      let nearbyNodes = this.graph.findNearestNodes(stationCoord, 0.5); // 500m radius
      
      if (nearbyNodes.length === 0) {
        // Try larger radius
        nearbyNodes = this.graph.findNearestNodes(stationCoord, 2.0); // 2km radius
        console.log(`🔍 Station ${station.name} (${station.id}): No nodes within 500m, found ${nearbyNodes.length} within 2km`);
      }
      
      if (nearbyNodes.length > 0) {
        const nearestNode = nearbyNodes[0];
        
        // Update the nearest node to be a station node
        nearestNode.type = 'station';
        nearestNode.stationId = station.id;
        nearestNode.metadata = {
          name: station.name,
          services: [] // Could be populated with route information
        };
        
        const distance = this.graph.calculateDistance(stationCoord, nearestNode.coordinate);
        console.log(`📍 Mapped station ${station.name} (${station.id}) to node ${nearestNode.id} (${distance.toFixed(0)}m away)`);
        mappedStations++;
      } else {
        // Create a new station node if no nearby track nodes found
        const stationNodeId = `station_${station.id}`;
        const stationNode: RailwayNode = {
          id: stationNodeId,
          coordinate: stationCoord,
          type: 'station',
          connectedEdges: [],
          stationId: station.id,
          metadata: {
            name: station.name,
            services: []
          }
        };
        
        this.graph.addNode(stationNode);
        nodeMap.set(stationNodeId, stationNode);
        
        console.log(`🆕 Created isolated station node for ${station.name} (${station.id}) - no nearby tracks found`);
        mappedStations++;
      }
    }
    
    console.log(`✅ Station integration: ${mappedStations}/${stations.length} stations processed`);
  }

  /**
   * Optimize network connections by identifying and fixing gaps
   */
  private async optimizeConnections(): Promise<void> {
    console.log('🔧 Optimizing network connections...');
    
    // Find nodes that are very close but not connected
    const allNodes = this.graph.getAllNodes();
    let connectionsMade = 0;

    for (let i = 0; i < allNodes.length; i++) {
      const node1 = allNodes[i];
      
      // Only look for connections for nodes with few connections
      if (node1.connectedEdges.length > 2) continue;
      
      const nearbyNodes = this.graph.findNearestNodes(
        node1.coordinate, 
        this.options.connectionTolerance / 1000
      ).filter(n => n.id !== node1.id);
      
      for (const node2 of nearbyNodes) {
        if (node2.connectedEdges.length > 2) continue;
        
        // Check if they're already connected
        const alreadyConnected = node1.connectedEdges.some(edgeId => {
          const edge = this.graph.getEdge(edgeId);
          return edge && (edge.startNodeId === node2.id || edge.endNodeId === node2.id);
        });
        
        if (!alreadyConnected) {
          // Create a connecting edge
          this.createConnectingEdge(node1, node2);
          connectionsMade++;
        }
      }
    }

    if (connectionsMade > 0) {
      console.log(`🔗 Made ${connectionsMade} additional connections`);
    }
  }

  /**
   * Create a connecting edge between two nearby nodes
   */
  private createConnectingEdge(node1: RailwayNode, node2: RailwayNode): void {
    const distance = this.graph.calculateDistance(node1.coordinate, node2.coordinate);
    const maxSpeed = 30; // Conservative speed for gap-filling connections
    const travelTime = this.calculateTravelTime(distance, maxSpeed);
    
    const edgeId = `connector_${this.edgeCounter++}`;
    
    const connectingEdge: RailwayEdge = {
      id: edgeId,
      startNodeId: node1.id,
      endNodeId: node2.id,
      geometry: [node1.coordinate, node2.coordinate],
      length: distance,
      properties: {
        railway: 'rail',
        maxSpeed,
        usage: 'connector',
        direction: 'both'
      },
      travelTime
    };
    
    this.graph.addEdge(connectingEdge);
  }

  /**
   * Simplify geometry by removing redundant points
   */
  private simplifyGeometry(coordinates: Coordinate[]): Coordinate[] {
    if (coordinates.length <= 2) return coordinates;
    
    const simplified: Coordinate[] = [coordinates[0]];
    const tolerance = 0.00001; // Very small tolerance for railway precision
    
    for (let i = 1; i < coordinates.length - 1; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      const next = coordinates[i + 1];
      
      // Calculate if current point is significant using cross-track error
      const distance = this.pointToLineDistance(curr, prev, next);
      
      if (distance > tolerance) {
        simplified.push(curr);
      }
    }
    
    simplified.push(coordinates[coordinates.length - 1]);
    return simplified;
  }

  /**
   * Calculate distance from point to line segment
   */
  private pointToLineDistance(point: Coordinate, lineStart: Coordinate, lineEnd: Coordinate): number {
    const A = point.lng - lineStart.lng;
    const B = point.lat - lineStart.lat;
    const C = lineEnd.lng - lineStart.lng;
    const D = lineEnd.lat - lineStart.lat;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    let xx: number, yy: number;

    if (param < 0) {
      xx = lineStart.lng;
      yy = lineStart.lat;
    } else if (param > 1) {
      xx = lineEnd.lng;
      yy = lineEnd.lat;
    } else {
      xx = lineStart.lng + param * C;
      yy = lineStart.lat + param * D;
    }

    const dx = point.lng - xx;
    const dy = point.lat - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    nodesCreated: number;
    edgesCreated: number;
    processingOptions: ProcessingOptions;
  } {
    return {
      nodesCreated: this.nodeCounter,
      edgesCreated: this.edgeCounter,
      processingOptions: this.options
    };
  }
}