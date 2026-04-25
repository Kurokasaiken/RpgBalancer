/**
 * Quest Decision Heatmap Data Aggregator - NP-022
 * 
 * Data aggregation and performance optimization utilities for the
 * quest decision heatmap. Provides spatial clustering, temporal
 * aggregation, and performance monitoring capabilities.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type QuestDecisionData,
  type HeatmapCell,
  type QuestCoordinates,
  QuestDecisionType,
  QuestPriority,
  QuestCategory,
  calculateIntensity,
  getDominantDecisionType,
  getDominantCategory,
  calculateSuccessRate,
} from '../config/questDecisionHeatmapConfig';

const diagnostics = createSandboxDiagnostics('QuestDecisionHeatmapAggregator', 'aggregator');

/**
 * Aggregation strategies
 */
export enum AggregationStrategy {
  NONE = 'none',
  TEMPORAL = 'temporal',
  SPATIAL = 'spatial',
  CATEGORICAL = 'categorical',
  HYBRID = 'hybrid',
}

/**
 * Clustering algorithms
 */
export enum ClusteringAlgorithm {
  KMEANS = 'kmeans',
  DBSCAN = 'dbscan',
  GRID = 'grid',
  HIERARCHICAL = 'hierarchical',
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  dataPoints: number;
  processingTime: number;
  memoryUsage: number;
  renderTime: number;
  fps: number;
  aggregationTime: number;
  clusteringTime: number;
}

/**
 * Aggregated data point
 */
export interface AggregatedDataPoint {
  id: string;
  coordinates: QuestCoordinates;
  decisions: QuestDecisionData[];
  count: number;
  intensity: number;
  dominantDecision: QuestDecisionType;
  dominantCategory: QuestCategory;
  averagePriority: number;
  successRate: number;
  timeRange: {
    start: number;
    end: number;
  };
  metadata: {
    aggregationStrategy: AggregationStrategy;
    clusterId?: string;
    aggregatedAt: number;
    originalCount: number;
  };
}

/**
 * Cluster information
 */
export interface Cluster {
  id: string;
  center: QuestCoordinates;
  points: QuestDecisionData[];
  radius: number;
  density: number;
  characteristics: {
    dominantDecision: QuestDecisionType;
    dominantCategory: QuestCategory;
    averagePriority: number;
    successRate: number;
  };
}

/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  strategy: AggregationStrategy;
  clustering: {
    enabled: boolean;
    algorithm: ClusteringAlgorithm;
    maxClusters: number;
    minClusterSize: number;
    clusterRadius: number;
  };
  temporal: {
    enabled: boolean;
    windowSize: number; // in milliseconds
    overlap: number; // overlap percentage
  };
  spatial: {
    enabled: boolean;
    gridSize: number;
    maxPointsPerCell: number;
  };
  performance: {
    maxDataPoints: number;
    batchSize: number;
    enableWorker: boolean;
    enableCache: boolean;
    cacheSize: number;
  };
}

/**
 * Data aggregator for quest decisions
 */
export class QuestDecisionHeatmapAggregator {
  private config: AggregationConfig;
  private cache: Map<string, AggregatedDataPoint> = new Map();
  private clusters: Map<string, Cluster> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private aggregationStartTime: number = 0;

  constructor(config?: Partial<AggregationConfig>) {
    this.config = {
      strategy: AggregationStrategy.NONE,
      clustering: {
        enabled: false,
        algorithm: ClusteringAlgorithm.KMEANS,
        maxClusters: 50,
        minClusterSize: 3,
        clusterRadius: 100,
      },
      temporal: {
        enabled: false,
        windowSize: 3600000, // 1 hour
        overlap: 0.1, // 10%
      },
      spatial: {
        enabled: false,
        gridSize: 50,
        maxPointsPerCell: 100,
      },
      performance: {
        maxDataPoints: 10000,
        batchSize: 1000,
        enableWorker: false,
        enableCache: true,
        cacheSize: 1000,
      },
      ...config,
    };

    this.performanceMetrics = {
      dataPoints: 0,
      processingTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      fps: 0,
      aggregationTime: 0,
      clusteringTime: 0,
    };
  }

  /**
   * Aggregate quest decision data
   */
  public aggregate(data: QuestDecisionData[]): AggregatedDataPoint[] {
    this.aggregationStartTime = performance.now();
    this.performanceMetrics.dataPoints = data.length;

    try {
      let aggregatedData: AggregatedDataPoint[] = [];

      switch (this.config.strategy) {
        case AggregationStrategy.TEMPORAL:
          aggregatedData = this.aggregateTemporal(data);
          break;
        case AggregationStrategy.SPATIAL:
          aggregatedData = this.aggregateSpatial(data);
          break;
        case AggregationStrategy.CATEGORICAL:
          aggregatedData = this.aggregateCategorical(data);
          break;
        case AggregationStrategy.HYBRID:
          aggregatedData = this.aggregateHybrid(data);
          break;
        case AggregationStrategy.NONE:
        default:
          aggregatedData = this.aggregateNone(data);
          break;
      }

      // Apply clustering if enabled
      if (this.config.clustering.enabled) {
        aggregatedData = this.applyClustering(aggregatedData);
      }

      // Update performance metrics
      const endTime = performance.now();
      this.performanceMetrics.processingTime = endTime - this.aggregationStartTime;
      this.performanceMetrics.aggregationTime = endTime - this.aggregationStartTime;
      this.performanceMetrics.memoryUsage = this.estimateMemoryUsage(aggregatedData);

      diagnostics.info('Data aggregation completed', {
        strategy: this.config.strategy,
        originalPoints: data.length,
        aggregatedPoints: aggregatedData.length,
        processingTime: this.performanceMetrics.processingTime,
      });

      return aggregatedData;

    } catch (error) {
      diagnostics.error('Data aggregation failed', { error });
      throw error;
    }
  }

  /**
   * No aggregation - return original data as aggregated points
   */
  private aggregateNone(data: QuestDecisionData[]): AggregatedDataPoint[] {
    return data.map(decision => ({
      id: decision.id,
      coordinates: decision.coordinates,
      decisions: [decision],
      count: 1,
      intensity: calculateIntensity([decision]),
      dominantDecision: decision.decisionType,
      dominantCategory: decision.category,
      averagePriority: this.getPriorityNumeric(decision.priority),
      successRate: decision.outcome ? (decision.outcome === 'success' ? 1 : 0) : 0,
      timeRange: {
        start: decision.timestamp,
        end: decision.timestamp,
      },
      metadata: {
        aggregationStrategy: AggregationStrategy.NONE,
        aggregatedAt: Date.now(),
        originalCount: 1,
      },
    }));
  }

  /**
   * Temporal aggregation
   */
  private aggregateTemporal(data: QuestDecisionData[]): AggregatedDataPoint[] {
    if (!this.config.temporal.enabled) {
      return this.aggregateNone(data);
    }

    const { windowSize, overlap } = this.config.temporal;
    const windowOverlap = windowSize * overlap;
    const aggregatedPoints: AggregatedDataPoint[] = [];

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    if (sortedData.length === 0) return aggregatedPoints;

    let windowStart = sortedData[0].timestamp;
    let windowEnd = windowStart + windowSize;

    while (windowStart <= sortedData[sortedData.length - 1].timestamp) {
      // Get data points in current window
      const windowData = sortedData.filter(
        decision => decision.timestamp >= windowStart && decision.timestamp < windowEnd
      );

      if (windowData.length > 0) {
        // Aggregate points in window
        const aggregatedPoint = this.createAggregatedPoint(
          windowData,
          windowStart,
          windowEnd,
          AggregationStrategy.TEMPORAL
        );
        aggregatedPoints.push(aggregatedPoint);
      }

      // Move to next window
      windowStart = windowEnd - windowOverlap;
      windowEnd = windowStart + windowSize;
    }

    return aggregatedPoints;
  }

  /**
   * Spatial aggregation using grid-based clustering
   */
  private aggregateSpatial(data: QuestDecisionData[]): AggregatedDataPoint[] {
    if (!this.config.spatial.enabled) {
      return this.aggregateNone(data);
    }

    const { gridSize, maxPointsPerCell } = this.config.spatial;
    const grid = new Map<string, QuestDecisionData[]>();

    // Group points by grid cell
    data.forEach(decision => {
      const gridX = Math.floor(decision.coordinates.x / gridSize);
      const gridY = Math.floor(decision.coordinates.y / gridSize);
      const gridKey = `${gridX},${gridY}`;

      if (!grid.has(gridKey)) {
        grid.set(gridKey, []);
      }

      const cellData = grid.get(gridKey)!;
      
      // Limit points per cell
      if (cellData.length < maxPointsPerCell) {
        cellData.push(decision);
      }
    });

    // Create aggregated points for each grid cell
    const aggregatedPoints: AggregatedDataPoint[] = [];
    grid.forEach((cellData, gridKey) => {
      if (cellData.length > 0) {
        const [gridX, gridY] = gridKey.split(',').map(Number);
        const centerCoordinates = {
          x: gridX * gridSize + gridSize / 2,
          y: gridY * gridSize + gridSize / 2,
        };

        const timeRange = {
          start: Math.min(...cellData.map(d => d.timestamp)),
          end: Math.max(...cellData.map(d => d.timestamp)),
        };

        const aggregatedPoint = this.createAggregatedPoint(
          cellData,
          timeRange.start,
          timeRange.end,
          AggregationStrategy.SPATIAL,
          centerCoordinates
        );
        aggregatedPoints.push(aggregatedPoint);
      }
    });

    return aggregatedPoints;
  }

  /**
   * Categorical aggregation by decision type, priority, and category
   */
  private aggregateCategorical(data: QuestDecisionData[]): AggregatedDataPoint[] {
    const categories = new Map<string, QuestDecisionData[]>();

    // Group by category
    data.forEach(decision => {
      const categoryKey = `${decision.decisionType}-${decision.priority}-${decision.category}`;
      
      if (!categories.has(categoryKey)) {
        categories.set(categoryKey, []);
      }
      
      categories.get(categoryKey)!.push(decision);
    });

    // Create aggregated points for each category
    const aggregatedPoints: AggregatedDataPoint[] = [];
    categories.forEach((categoryData, categoryKey) => {
      if (categoryData.length > 0) {
        // Calculate center point for category
        const centerCoordinates = {
          x: categoryData.reduce((sum, d) => sum + d.coordinates.x, 0) / categoryData.length,
          y: categoryData.reduce((sum, d) => sum + d.coordinates.y, 0) / categoryData.length,
        };

        const timeRange = {
          start: Math.min(...categoryData.map(d => d.timestamp)),
          end: Math.max(...categoryData.map(d => d.timestamp)),
        };

        const aggregatedPoint = this.createAggregatedPoint(
          categoryData,
          timeRange.start,
          timeRange.end,
          AggregationStrategy.CATEGORICAL,
          centerCoordinates
        );
        aggregatedPoints.push(aggregatedPoint);
      }
    });

    return aggregatedPoints;
  }

  /**
   * Hybrid aggregation combining multiple strategies
   */
  private aggregateHybrid(data: QuestDecisionData[]): AggregatedDataPoint[] {
    // First apply spatial aggregation
    const spatiallyAggregated = this.aggregateSpatial(data);
    
    // Then apply temporal aggregation on spatial results
    const temporalConfig = this.config.temporal;
    this.config.temporal.enabled = true;
    const hybridAggregated = this.aggregateTemporal(
      spatiallyAggregated.flatMap(point => point.decisions)
    );
    
    // Restore original config
    this.config.temporal = temporalConfig;

    return hybridAggregated;
  }

  /**
   * Apply clustering to aggregated data
   */
  private applyClustering(data: AggregatedDataPoint[]): AggregatedDataPoint[] {
    const startTime = performance.now();

    let clusteredData: AggregatedDataPoint[] = [];

    switch (this.config.clustering.algorithm) {
      case ClusteringAlgorithm.KMEANS:
        clusteredData = this.applyKMeansClustering(data);
        break;
      case ClusteringAlgorithm.DBSCAN:
        clusteredData = this.applyDBSCANClustering(data);
        break;
      case ClusteringAlgorithm.GRID:
        clusteredData = this.applyGridClustering(data);
        break;
      case ClusteringAlgorithm.HIERARCHICAL:
        clusteredData = this.applyHierarchicalClustering(data);
        break;
      default:
        clusteredData = data;
    }

    const endTime = performance.now();
    this.performanceMetrics.clusteringTime = endTime - startTime;

    return clusteredData;
  }

  /**
   * K-means clustering implementation
   */
  private applyKMeansClustering(data: AggregatedDataPoint[]): AggregatedDataPoint[] {
    const { maxClusters, minClusterSize } = this.config.clustering;
    
    if (data.length <= maxClusters) {
      return data;
    }

    // Initialize centroids using k-means++
    const centroids = this.initializeCentroids(data, maxClusters);
    const clusters: number[] = new Array(data.length).fill(-1);

    let iterations = 0;
    const maxIterations = 100;
    let converged = false;

    while (!converged && iterations < maxIterations) {
      // Assign points to nearest centroid
      for (let i = 0; i < data.length; i++) {
        let minDistance = Infinity;
        let nearestCentroid = 0;

        for (let j = 0; j < centroids.length; j++) {
          const distance = this.calculateDistance(
            data[i].coordinates,
            centroids[j]
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = j;
          }
        }

        clusters[i] = nearestCentroid;
      }

      // Update centroids
      const newCentroids: QuestCoordinates[] = [];
      
      for (let i = 0; i < centroids.length; i++) {
        const clusterPoints = data.filter((_, index) => clusters[index] === i);
        
        if (clusterPoints.length > 0) {
          const center = {
            x: clusterPoints.reduce((sum, p) => sum + p.coordinates.x, 0) / clusterPoints.length,
            y: clusterPoints.reduce((sum, p) => sum + p.coordinates.y, 0) / clusterPoints.length,
          };
          newCentroids.push(center);
        } else {
          newCentroids.push(centroids[i]);
        }
      }

      // Check for convergence
      converged = centroids.every((centroid, index) => 
        this.calculateDistance(centroid, newCentroids[index]) < 1
      );

      centroids.length = 0;
      centroids.push(...newCentroids);
      iterations++;
    }

    // Filter small clusters
    const validClusters = new Set<number>();
    const clusterCounts = new Array(centroids.length).fill(0);

    clusters.forEach(clusterIndex => {
      clusterCounts[clusterIndex]++;
    });

    clusterCounts.forEach((count, index) => {
      if (count >= minClusterSize) {
        validClusters.add(index);
      }
    });

    // Return clustered data
    return data.filter((_, index) => validClusters.has(clusters[index]));
  }

  /**
   * DBSCAN clustering implementation
   */
  private applyDBSCANClustering(data: AggregatedDataPoint[]): AggregatedDataPoint[] {
    const { minClusterSize, clusterRadius } = this.config.clustering;
    const visited = new Set<number>();
    const clusters: number[] = new Array(data.length).fill(-1);
    let clusterId = 0;

    for (let i = 0; i < data.length; i++) {
      if (visited.has(i)) continue;

      visited.add(i);
      const neighbors = this.findNeighbors(data, i, clusterRadius);

      if (neighbors.length < minClusterSize) {
        clusters[i] = -1; // Noise point
      } else {
        // Expand cluster
        this.expandCluster(data, i, neighbors, clusterId, clusters, visited);
        clusterId++;
      }
    }

    // Return points that belong to valid clusters
    return data.filter((_, index) => clusters[index] >= 0);
  }

  /**
   * Grid clustering implementation
   */
  private applyGridClustering(data: AggregatedDataPoint[]): AggregatedDataPoint[] {
    const { clusterRadius } = this.config.clustering;
    const gridSize = clusterRadius;
    const grid = new Map<string, number[]>();

    // Assign points to grid cells
    data.forEach((point, index) => {
      const gridX = Math.floor(point.coordinates.x / gridSize);
      const gridY = Math.floor(point.coordinates.y / gridSize);
      const gridKey = `${gridX},${gridY}`;

      if (!grid.has(gridKey)) {
        grid.set(gridKey, []);
      }
      grid.get(gridKey)!.push(index);
    });

    // Merge adjacent cells
    const merged = new Set<number>();
    grid.forEach((cellPoints) => {
      if (cellPoints.length >= this.config.clustering.minClusterSize) {
        cellPoints.forEach(index => merged.add(index));
      }
    });

    return data.filter((_, index) => merged.has(index));
  }

  /**
   * Hierarchical clustering implementation
   */
  private applyHierarchicalClustering(data: AggregatedDataPoint[]): AggregatedDataPoint[] {
    // Simple implementation using agglomerative clustering
    const { maxClusters, minClusterSize } = this.config.clustering;
    
    if (data.length <= maxClusters) {
      return data;
    }

    // Create distance matrix
    const distances: number[][] = [];
    for (let i = 0; i < data.length; i++) {
      distances[i] = [];
      for (let j = 0; j < data.length; j++) {
        distances[i][j] = this.calculateDistance(data[i].coordinates, data[j].coordinates);
      }
    }

    // Initialize each point as its own cluster
    const clusters: number[][] = data.map((_, index) => [index]);

    while (clusters.length > maxClusters) {
      // Find closest clusters
      let minDistance = Infinity;
      let mergeI = -1;
      let mergeJ = -1;

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = this.calculateClusterDistance(clusters[i], clusters[j], distances);
          
          if (distance < minDistance) {
            minDistance = distance;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // Merge clusters
      clusters[mergeI] = [...clusters[mergeI], ...clusters[mergeJ]];
      clusters.splice(mergeJ, 1);
    }

    // Filter small clusters
    const validClusters = clusters.filter(cluster => cluster.length >= minClusterSize);
    const validIndices = new Set(validClusters.flat());

    return data.filter((_, index) => validIndices.has(index));
  }

  /**
   * Create aggregated point from multiple decisions
   */
  private createAggregatedPoint(
    decisions: QuestDecisionData[],
    startTime: number,
    endTime: number,
    strategy: AggregationStrategy,
    customCoordinates?: QuestCoordinates
  ): AggregatedDataPoint {
    const coordinates = customCoordinates || {
      x: decisions.reduce((sum, d) => sum + d.coordinates.x, 0) / decisions.length,
      y: decisions.reduce((sum, d) => sum + d.coordinates.y, 0) / decisions.length,
    };

    return {
      id: `aggregated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      coordinates,
      decisions,
      count: decisions.length,
      intensity: calculateIntensity(decisions),
      dominantDecision: getDominantDecisionType(decisions),
      dominantCategory: getDominantCategory(decisions),
      averagePriority: decisions.reduce((sum, d) => 
        sum + this.getPriorityNumeric(d.priority), 0) / decisions.length,
      successRate: calculateSuccessRate(decisions),
      timeRange: { start: startTime, end: endTime },
      metadata: {
        aggregationStrategy: strategy,
        aggregatedAt: Date.now(),
        originalCount: decisions.length,
      },
    };
  }

  /**
   * Initialize centroids for k-means
   */
  private initializeCentroids(data: AggregatedDataPoint[], k: number): QuestCoordinates[] {
    const centroids: QuestCoordinates[] = [];
    
    // Use k-means++ initialization
    centroids.push(data[Math.floor(Math.random() * data.length)].coordinates);

    for (let i = 1; i < k; i++) {
      const distances = data.map(point => {
        const minDistance = Math.min(
          ...centroids.map(centroid => this.calculateDistance(point.coordinates, centroid))
        );
        return minDistance * minDistance;
      });

      const totalDistance = distances.reduce((sum, d) => sum + d, 0);
      let random = Math.random() * totalDistance;

      for (let j = 0; j < data.length; j++) {
        random -= distances[j];
        if (random <= 0) {
          centroids.push(data[j].coordinates);
          break;
        }
      }
    }

    return centroids;
  }

  /**
   * Find neighbors for DBSCAN
   */
  private findNeighbors(data: AggregatedDataPoint[], index: number, radius: number): number[] {
    const neighbors: number[] = [];
    const point = data[index];

    for (let i = 0; i < data.length; i++) {
      if (this.calculateDistance(point.coordinates, data[i].coordinates) <= radius) {
        neighbors.push(i);
      }
    }

    return neighbors;
  }

  /**
   * Expand cluster for DBSCAN
   */
  private expandCluster(
    data: AggregatedDataPoint[],
    index: number,
    neighbors: number[],
    clusterId: number,
    clusters: number[],
    visited: Set<number>
  ): void {
    clusters[index] = clusterId;

    for (let i = 0; i < neighbors.length; i++) {
      const neighborIndex = neighbors[i];

      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        const neighborNeighbors = this.findNeighbors(data, neighborIndex, this.config.clustering.clusterRadius);

        if (neighborNeighbors.length >= this.config.clustering.minClusterSize) {
          neighbors.push(...neighborNeighbors.filter(n => !neighbors.includes(n)));
        }
      }

      if (clusters[neighborIndex] === -1) {
        clusters[neighborIndex] = clusterId;
      }
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(coord1: QuestCoordinates, coord2: QuestCoordinates): number {
    const dx = coord1.x - coord2.x;
    const dy = coord1.y - coord2.y;
    const dz = (coord1.z || 0) - (coord2.z || 0);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate distance between two clusters
   */
  private calculateClusterDistance(
    cluster1: number[],
    cluster2: number[],
    distances: number[][]
  ): number {
    let minDistance = Infinity;

    for (const i of cluster1) {
      for (const j of cluster2) {
        if (distances[i][j] < minDistance) {
          minDistance = distances[i][j];
        }
      }
    }

    return minDistance;
  }

  /**
   * Get numeric priority value
   */
  private getPriorityNumeric(priority: QuestPriority): number {
    switch (priority) {
      case QuestPriority.CRITICAL: return 5;
      case QuestPriority.HIGH: return 4;
      case QuestPriority.MEDIUM: return 3;
      case QuestPriority.LOW: return 2;
      case QuestPriority.TRIVIAL: return 1;
      default: return 1;
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(data: AggregatedDataPoint[]): number {
    // Rough estimation in bytes
    const baseSize = 100; // Base object overhead
    const decisionSize = 200; // Average decision size
    const aggregatedSize = 150; // Average aggregated point size

    return data.length * aggregatedSize + 
           data.reduce((sum, point) => sum + point.decisions.length * decisionSize, 0) +
           baseSize;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.clusters.clear();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AggregationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Clear cache when configuration changes
    if (newConfig.strategy || newConfig.clustering || newConfig.temporal || newConfig.spatial) {
      this.clearCache();
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStatistics(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: this.estimateMemoryUsage(Array.from(this.cache.values())),
    };
  }

  /**
   * Export aggregated data
   */
  public exportData(): {
    aggregatedData: AggregatedDataPoint[];
    clusters: Cluster[];
    performanceMetrics: PerformanceMetrics;
    config: AggregationConfig;
    timestamp: number;
  } {
    return {
      aggregatedData: Array.from(this.cache.values()),
      clusters: Array.from(this.clusters.values()),
      performanceMetrics: this.getPerformanceMetrics(),
      config: this.config,
      timestamp: Date.now(),
    };
  }

  /**
   * Import aggregated data
   */
  public importData(exportedData: {
    aggregatedData: AggregatedDataPoint[];
    clusters: Cluster[];
    config: AggregationConfig;
  }): void {
    this.cache.clear();
    this.clusters.clear();

    exportedData.aggregatedData.forEach(point => {
      this.cache.set(point.id, point);
    });

    exportedData.clusters.forEach(cluster => {
      this.clusters.set(cluster.id, cluster);
    });

    this.updateConfig(exportedData.config);
  }
}
