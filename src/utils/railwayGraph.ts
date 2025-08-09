/**
 * Advanced Railway Network Graph System
 * Implements a sophisticated graph-based representation of railway infrastructure
 * with support for pathfinding, spatial indexing, and real-time train positioning
 */

export interface Coordinate {
  lng: number;
  lat: number;
}

export interface RailwayNode {
  id: string;
  coordinate: Coordinate;
  type: 'station' | 'junction' | 'endpoint';
  connectedEdges: string[];
  stationId?: string; // If this node represents a station
  metadata?: {
    name?: string;
    platforms?: string[];
    services?: string[];
  };
}

export interface RailwayEdge {
  id: string;
  startNodeId: string;
  endNodeId: string;
  geometry: Coordinate[]; // Full track geometry coordinates
  length: number; // Length in meters
  properties: {
    railway: string; // 'rail', 'light_rail', etc.
    electrified?: string;
    gauge?: string;
    maxSpeed?: number;
    usage?: string; // 'main', 'branch', 'industrial'
    direction?: 'forward' | 'backward' | 'both';
  };
  travelTime: number; // Estimated travel time in seconds
}

export interface PathSegment {
  edgeId: string;
  direction: 'forward' | 'backward';
  startProgress: number; // 0-1 position along edge where segment starts
  endProgress: number;   // 0-1 position along edge where segment ends
  distance: number;      // Distance of this segment in meters
  travelTime: number;    // Time to traverse this segment in seconds
}

export interface RoutePath {
  segments: PathSegment[];
  totalDistance: number;
  totalTravelTime: number;
  startNodeId: string;
  endNodeId: string;
}

export class RailwayGraph {
  private nodes = new Map<string, RailwayNode>();
  private edges = new Map<string, RailwayEdge>();
  private spatialIndex: Map<string, string[]> = new Map(); // Grid-based spatial index
  private readonly GRID_SIZE = 0.001; // Approximately 100m grid cells

  constructor() {
    console.log('🚂 Initializing Railway Graph System');
  }

  /**
   * Add a node to the railway graph
   */
  addNode(node: RailwayNode): void {
    this.nodes.set(node.id, node);
    this.addToSpatialIndex(node.id, node.coordinate);
  }

  /**
   * Add an edge to the railway graph
   */
  addEdge(edge: RailwayEdge): void {
    this.edges.set(edge.id, edge);
    
    // Update node connections
    const startNode = this.nodes.get(edge.startNodeId);
    const endNode = this.nodes.get(edge.endNodeId);
    
    if (startNode && !startNode.connectedEdges.includes(edge.id)) {
      startNode.connectedEdges.push(edge.id);
    }
    
    if (endNode && !endNode.connectedEdges.includes(edge.id)) {
      endNode.connectedEdges.push(edge.id);
    }
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId: string): RailwayNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get an edge by ID
   */
  getEdge(edgeId: string): RailwayEdge | undefined {
    return this.edges.get(edgeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): RailwayNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getAllEdges(): RailwayEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Find nearest nodes to a coordinate within a given radius
   */
  findNearestNodes(coordinate: Coordinate, radiusKm = 1.0): RailwayNode[] {
    const candidates: RailwayNode[] = [];
    const radiusInDegrees = radiusKm / 111.32; // Approximate conversion

    // Get grid cells within search radius
    const gridCells = this.getGridCellsInRadius(coordinate, radiusInDegrees);
    
    for (const cellKey of gridCells) {
      const nodeIds = this.spatialIndex.get(cellKey) || [];
      for (const nodeId of nodeIds) {
        const node = this.nodes.get(nodeId);
        if (node) {
          const distance = this.calculateDistance(coordinate, node.coordinate);
          if (distance <= radiusKm * 1000) { // Convert to meters
            candidates.push(node);
          }
        }
      }
    }

    // Sort by distance
    return candidates.sort((a, b) => 
      this.calculateDistance(coordinate, a.coordinate) - 
      this.calculateDistance(coordinate, b.coordinate)
    );
  }

  /**
   * Get neighboring nodes of a given node
   */
  getNeighbors(nodeId: string): { node: RailwayNode; edge: RailwayEdge; direction: 'forward' | 'backward' }[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const neighbors: { node: RailwayNode; edge: RailwayEdge; direction: 'forward' | 'backward' }[] = [];

    for (const edgeId of node.connectedEdges) {
      const edge = this.edges.get(edgeId);
      if (!edge) continue;

      let neighborNodeId: string;
      let direction: 'forward' | 'backward';

      if (edge.startNodeId === nodeId) {
        neighborNodeId = edge.endNodeId;
        direction = 'forward';
      } else {
        neighborNodeId = edge.startNodeId;
        direction = 'backward';
      }

      const neighborNode = this.nodes.get(neighborNodeId);
      if (neighborNode) {
        neighbors.push({ node: neighborNode, edge, direction });
      }
    }

    return neighbors;
  }

  /**
   * Calculate Haversine distance between two coordinates
   */
  calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
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

  /**
   * Calculate bearing between two coordinates
   */
  calculateBearing(from: Coordinate, to: Coordinate): number {
    const φ1 = (from.lat * Math.PI) / 180;
    const φ2 = (to.lat * Math.PI) / 180;
    const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360;
  }

  /**
   * Interpolate along an edge geometry
   */
  interpolateAlongEdge(edgeId: string, progress: number, direction: 'forward' | 'backward' = 'forward'): Coordinate {
    const edge = this.edges.get(edgeId);
    if (!edge || edge.geometry.length === 0) {
      return { lng: 29.0, lat: 41.0 }; // Default Istanbul center
    }

    const geometry = direction === 'forward' ? edge.geometry : [...edge.geometry].reverse();
    
    // Clamp progress to valid range
    progress = Math.max(0, Math.min(1, progress));

    if (geometry.length === 1) return geometry[0];
    if (progress === 0) return geometry[0];
    if (progress === 1) return geometry[geometry.length - 1];

    // Calculate target distance along the edge
    let totalLength = 0;
    const segmentLengths: number[] = [];

    for (let i = 1; i < geometry.length; i++) {
      const segmentLength = this.calculateDistance(geometry[i - 1], geometry[i]);
      segmentLengths.push(segmentLength);
      totalLength += segmentLength;
    }

    if (totalLength === 0) return geometry[0];

    const targetDistance = totalLength * progress;
    let currentDistance = 0;

    for (let i = 0; i < segmentLengths.length; i++) {
      if (currentDistance + segmentLengths[i] >= targetDistance) {
        // Interpolate within this segment
        const segmentProgress = segmentLengths[i] > 0 ? 
          (targetDistance - currentDistance) / segmentLengths[i] : 0;
        
        const from = geometry[i];
        const to = geometry[i + 1];
        
        return {
          lng: from.lng + (to.lng - from.lng) * segmentProgress,
          lat: from.lat + (to.lat - from.lat) * segmentProgress
        };
      }
      currentDistance += segmentLengths[i];
    }

    return geometry[geometry.length - 1];
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): {
    totalNodes: number;
    totalEdges: number;
    totalLength: number;
    stationNodes: number;
    junctionNodes: number;
  } {
    let totalLength = 0;
    let stationNodes = 0;
    let junctionNodes = 0;

    for (const edge of this.edges.values()) {
      totalLength += edge.length;
    }

    for (const node of this.nodes.values()) {
      if (node.type === 'station') stationNodes++;
      if (node.type === 'junction') junctionNodes++;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      totalLength: totalLength / 1000, // Convert to kilometers
      stationNodes,
      junctionNodes
    };
  }

  /**
   * Add coordinate to spatial index
   */
  private addToSpatialIndex(nodeId: string, coordinate: Coordinate): void {
    const cellKey = this.getGridCell(coordinate);
    if (!this.spatialIndex.has(cellKey)) {
      this.spatialIndex.set(cellKey, []);
    }
    this.spatialIndex.get(cellKey)!.push(nodeId);
  }

  /**
   * Get grid cell key for a coordinate
   */
  private getGridCell(coordinate: Coordinate): string {
    const x = Math.floor(coordinate.lng / this.GRID_SIZE);
    const y = Math.floor(coordinate.lat / this.GRID_SIZE);
    return `${x},${y}`;
  }

  /**
   * Get grid cells within radius
   */
  private getGridCellsInRadius(center: Coordinate, radius: number): string[] {
    const cells: string[] = [];
    const cellRadius = Math.ceil(radius / this.GRID_SIZE);
    
    const centerX = Math.floor(center.lng / this.GRID_SIZE);
    const centerY = Math.floor(center.lat / this.GRID_SIZE);

    for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
      for (let y = centerY - cellRadius; y <= centerY + cellRadius; y++) {
        cells.push(`${x},${y}`);
      }
    }

    return cells;
  }
}