/**
 * Advanced Railway Pathfinding Engine
 * Implements A* and Dijkstra algorithms with railway-specific optimizations
 */

import { RailwayGraph, type RailwayNode, type RailwayEdge, type RoutePath, type PathSegment } from './railwayGraph';

export interface PathfindingOptions {
  algorithm: 'astar' | 'dijkstra';
  preferMainTracks: boolean;
  avoidReversals: boolean;
  maxSearchDistance: number; // Maximum search distance in meters
  timeWeight: number;        // Weight for time vs distance (0-1, 0=distance only, 1=time only)
}

interface PathNode {
  nodeId: string;
  gCost: number;      // Actual cost from start
  hCost: number;      // Heuristic cost to goal
  fCost: number;      // Total cost (g + h)
  parent?: PathNode;
  edgeUsed?: RailwayEdge;
  direction?: 'forward' | 'backward';
}

interface PriorityQueue<T> {
  enqueue(item: T, priority: number): void;
  dequeue(): T | undefined;
  isEmpty(): boolean;
  size(): number;
}

class BinaryHeap<T> implements PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.bubbleUp(this.items.length - 1);
  }

  dequeue(): T | undefined {
    if (this.items.length === 0) return undefined;
    if (this.items.length === 1) return this.items.pop()?.item;

    const result = this.items[0].item;
    this.items[0] = this.items.pop()!;
    this.bubbleDown(0);
    return result;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  private bubbleUp(index: number): void {
    if (index === 0) return;

    const parentIndex = Math.floor((index - 1) / 2);
    if (this.items[parentIndex].priority > this.items[index].priority) {
      [this.items[parentIndex], this.items[index]] = [this.items[index], this.items[parentIndex]];
      this.bubbleUp(parentIndex);
    }
  }

  private bubbleDown(index: number): void {
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;
    let smallest = index;

    if (leftChild < this.items.length && 
        this.items[leftChild].priority < this.items[smallest].priority) {
      smallest = leftChild;
    }

    if (rightChild < this.items.length && 
        this.items[rightChild].priority < this.items[smallest].priority) {
      smallest = rightChild;
    }

    if (smallest !== index) {
      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      this.bubbleDown(smallest);
    }
  }
}

export class PathfindingEngine {
  private graph: RailwayGraph;

  constructor(graph: RailwayGraph) {
    this.graph = graph;
  }

  /**
   * Find the optimal path between two nodes
   */
  findPath(
    startNodeId: string,
    endNodeId: string,
    options: Partial<PathfindingOptions> = {}
  ): RoutePath | null {
    const opts: PathfindingOptions = {
      algorithm: 'astar',
      preferMainTracks: true,
      avoidReversals: true,
      maxSearchDistance: 100000, // 100km default
      timeWeight: 0.7, // Prefer time over distance
      ...options
    };

    const startNode = this.graph.getNode(startNodeId);
    const endNode = this.graph.getNode(endNodeId);

    if (!startNode || !endNode) {
      console.warn(`Pathfinding failed: Invalid nodes ${startNodeId} -> ${endNodeId}`);
      return null;
    }

    console.log(`🔍 Finding path from ${startNodeId} to ${endNodeId} using ${opts.algorithm.toUpperCase()}`);

    const startTime = Date.now();
    let result: RoutePath | null = null;

    if (opts.algorithm === 'astar') {
      result = this.aStar(startNode, endNode, opts);
    } else {
      result = this.dijkstra(startNode, endNode, opts);
    }

    const searchTime = Date.now() - startTime;
    
    if (result) {
      console.log(`✅ Path found in ${searchTime}ms: ${result.segments.length} segments, ${(result.totalDistance/1000).toFixed(1)}km, ${Math.round(result.totalTravelTime/60)}min`);
    } else {
      console.warn(`❌ No path found in ${searchTime}ms`);
    }

    return result;
  }

  /**
   * Find multiple alternative paths
   */
  findAlternativePaths(
    startNodeId: string,
    endNodeId: string,
    maxAlternatives = 3,
    options: Partial<PathfindingOptions> = {}
  ): RoutePath[] {
    const paths: RoutePath[] = [];
    const usedEdges = new Set<string>();

    for (let i = 0; i < maxAlternatives; i++) {
      // Temporarily increase cost for previously used edges
      const originalWeights = new Map<string, number>();
      
      for (const edgeId of usedEdges) {
        const edge = this.graph.getEdge(edgeId);
        if (edge) {
          originalWeights.set(edgeId, edge.travelTime);
          edge.travelTime *= 2; // Double the cost of used edges
        }
      }

      const path = this.findPath(startNodeId, endNodeId, options);
      
      // Restore original weights
      for (const [edgeId, originalWeight] of originalWeights) {
        const edge = this.graph.getEdge(edgeId);
        if (edge) {
          edge.travelTime = originalWeight;
        }
      }

      if (path) {
        paths.push(path);
        // Add used edges to the set
        path.segments.forEach(segment => usedEdges.add(segment.edgeId));
      } else {
        break; // No more paths found
      }
    }

    return paths;
  }

  /**
   * A* pathfinding algorithm with railway-specific heuristics
   */
  private aStar(startNode: RailwayNode, endNode: RailwayNode, options: PathfindingOptions): RoutePath | null {
    const openSet = new BinaryHeap<PathNode>();
    const closedSet = new Set<string>();
    const gScores = new Map<string, number>();
    const pathNodes = new Map<string, PathNode>();

    const startPathNode: PathNode = {
      nodeId: startNode.id,
      gCost: 0,
      hCost: this.calculateHeuristic(startNode, endNode, options),
      fCost: 0
    };
    startPathNode.fCost = startPathNode.gCost + startPathNode.hCost;

    openSet.enqueue(startPathNode, startPathNode.fCost);
    gScores.set(startNode.id, 0);
    pathNodes.set(startNode.id, startPathNode);

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue()!;
      
      if (current.nodeId === endNode.id) {
        return this.reconstructPath(current, pathNodes);
      }

      closedSet.add(current.nodeId);
      const neighbors = this.graph.getNeighbors(current.nodeId);

      for (const { node: neighbor, edge, direction } of neighbors) {
        if (closedSet.has(neighbor.id)) continue;

        // Check if we've exceeded max search distance
        const distanceFromStart = this.graph.calculateDistance(startNode.coordinate, neighbor.coordinate);
        if (distanceFromStart > options.maxSearchDistance) continue;

        const movementCost = this.calculateMovementCost(edge, direction, options);
        const tentativeGScore = (gScores.get(current.nodeId) || 0) + movementCost;
        const currentGScore = gScores.get(neighbor.id) || Infinity;

        if (tentativeGScore < currentGScore) {
          const neighborPathNode: PathNode = {
            nodeId: neighbor.id,
            gCost: tentativeGScore,
            hCost: this.calculateHeuristic(neighbor, endNode, options),
            fCost: 0,
            parent: current,
            edgeUsed: edge,
            direction
          };
          neighborPathNode.fCost = neighborPathNode.gCost + neighborPathNode.hCost;

          gScores.set(neighbor.id, tentativeGScore);
          pathNodes.set(neighbor.id, neighborPathNode);
          openSet.enqueue(neighborPathNode, neighborPathNode.fCost);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Dijkstra's algorithm for guaranteed shortest path
   */
  private dijkstra(startNode: RailwayNode, endNode: RailwayNode, options: PathfindingOptions): RoutePath | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, { node: PathNode; edge: RailwayEdge; direction: 'forward' | 'backward' }>();
    const unvisited = new BinaryHeap<{ nodeId: string; distance: number }>();
    const visited = new Set<string>();

    // Initialize distances
    for (const node of this.graph.getAllNodes()) {
      distances.set(node.id, node.id === startNode.id ? 0 : Infinity);
    }

    unvisited.enqueue({ nodeId: startNode.id, distance: 0 }, 0);

    while (!unvisited.isEmpty()) {
      const current = unvisited.dequeue()!;
      
      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);

      if (current.nodeId === endNode.id) {
        return this.reconstructDijkstraPath(endNode.id, previous, distances);
      }

      const currentDistance = distances.get(current.nodeId) || Infinity;
      const neighbors = this.graph.getNeighbors(current.nodeId);

      for (const { node: neighbor, edge, direction } of neighbors) {
        if (visited.has(neighbor.id)) continue;

        const movementCost = this.calculateMovementCost(edge, direction, options);
        const altDistance = currentDistance + movementCost;

        if (altDistance < (distances.get(neighbor.id) || Infinity)) {
          distances.set(neighbor.id, altDistance);
          previous.set(neighbor.id, {
            node: { nodeId: current.nodeId, gCost: 0, hCost: 0, fCost: 0 },
            edge,
            direction
          });
          unvisited.enqueue({ nodeId: neighbor.id, distance: altDistance }, altDistance);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Calculate heuristic cost for A* algorithm
   */
  private calculateHeuristic(fromNode: RailwayNode, toNode: RailwayNode, options: PathfindingOptions): number {
    const distance = this.graph.calculateDistance(fromNode.coordinate, toNode.coordinate);
    
    // Railway-specific heuristic: use average railway speed
    const averageSpeed = 60; // km/h
    const estimatedTime = (distance / 1000) / averageSpeed * 3600; // Convert to seconds
    
    // Combine distance and time based on weight preference
    return distance * (1 - options.timeWeight) + estimatedTime * options.timeWeight;
  }

  /**
   * Calculate movement cost between nodes
   */
  private calculateMovementCost(edge: RailwayEdge, direction: 'forward' | 'backward', options: PathfindingOptions): number {
    let cost = edge.travelTime * options.timeWeight + edge.length * (1 - options.timeWeight);

    // Apply penalties for railway-specific preferences
    if (options.preferMainTracks && edge.properties.usage !== 'main') {
      cost *= 1.5; // Penalty for non-main tracks
    }

    // Penalty for using track in non-preferred direction
    if (edge.properties.direction && edge.properties.direction !== 'both' && 
        edge.properties.direction !== direction) {
      cost *= 2.0;
    }

    // Bonus for electrified tracks (faster trains)
    if (edge.properties.electrified) {
      cost *= 0.9;
    }

    return cost;
  }

  /**
   * Reconstruct path from A* search
   */
  private reconstructPath(endPathNode: PathNode, _pathNodes: Map<string, PathNode>): RoutePath {
    const segments: PathSegment[] = [];
    let current = endPathNode;
    let totalDistance = 0;
    let totalTravelTime = 0;

    while (current.parent && current.edgeUsed) {
      const segment: PathSegment = {
        edgeId: current.edgeUsed.id,
        direction: current.direction!,
        startProgress: 0,
        endProgress: 1,
        distance: current.edgeUsed.length,
        travelTime: current.edgeUsed.travelTime
      };

      segments.unshift(segment);
      totalDistance += segment.distance;
      totalTravelTime += segment.travelTime;
      
      current = current.parent;
    }

    return {
      segments,
      totalDistance,
      totalTravelTime,
      startNodeId: current.nodeId,
      endNodeId: endPathNode.nodeId
    };
  }

  /**
   * Reconstruct path from Dijkstra search
   */
  private reconstructDijkstraPath(
    endNodeId: string,
    previous: Map<string, { node: PathNode; edge: RailwayEdge; direction: 'forward' | 'backward' }>,
    _distances: Map<string, number>
  ): RoutePath {
    const segments: PathSegment[] = [];
    let currentNodeId = endNodeId;
    let totalDistance = 0;
    let totalTravelTime = 0;
    let startNodeId = '';

    while (previous.has(currentNodeId)) {
      const prev = previous.get(currentNodeId)!;
      
      const segment: PathSegment = {
        edgeId: prev.edge.id,
        direction: prev.direction,
        startProgress: 0,
        endProgress: 1,
        distance: prev.edge.length,
        travelTime: prev.edge.travelTime
      };

      segments.unshift(segment);
      totalDistance += segment.distance;
      totalTravelTime += segment.travelTime;
      
      currentNodeId = prev.node.nodeId;
      startNodeId = currentNodeId;
    }

    return {
      segments,
      totalDistance,
      totalTravelTime,
      startNodeId,
      endNodeId
    };
  }

  /**
   * Get pathfinding statistics
   */
  getStats(): {
    totalNodes: number;
    totalEdges: number;
    averageConnectivity: number;
  } {
    const allNodes = this.graph.getAllNodes();
    const totalConnections = allNodes.reduce((sum, node) => sum + node.connectedEdges.length, 0);
    
    return {
      totalNodes: allNodes.length,
      totalEdges: this.graph.getAllEdges().length,
      averageConnectivity: totalConnections / allNodes.length
    };
  }
}