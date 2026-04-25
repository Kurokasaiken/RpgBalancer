/**
 * Stress Pipeline Latency Profiler
 * 
 * Comprehensive performance monitoring system for Phase 10.5 stress testing pipeline.
 * Tracks latency, throughput, bottlenecks, and performance trends across all pipeline stages.
 */

import type { StressTestArchetype } from './types';
import type { 
  MarginalUtilityAnalysis
} from './MarginalUtilityTypes';
import type { ProfilerConfig } from './LatencyProfilerTypes';
import { DEFAULT_PROFILER_CONFIG } from './LatencyProfilerTypes';
import { TestRNG } from '../utils/TestRNG';
import { saveData } from '@/shared/persistence/PersistenceService';

// Latency profiling types
export interface LatencyMeasurement {
  id: string;
  operation: string;
  stage: 'generation' | 'simulation' | 'analysis' | 'export';
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
  parentId?: string;
  children?: LatencyMeasurement[];
}

export interface LatencyProfile {
  id: string;
  timestamp: number;
  totalDuration: number;
  measurements: LatencyMeasurement[];
  summary: LatencySummary;
  bottlenecks: LatencyBottleneck[];
  trends: LatencyTrend[];
  recommendations: string[];
}

export interface LatencySummary {
  totalOperations: number;
  averageLatency: number;
  medianLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // operations per second
  slowestOperation: LatencyMeasurement;
  fastestOperation: LatencyMeasurement;
  stageBreakdown: Record<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    percentage: number;
  }>;
}

export interface LatencyBottleneck {
  operation: string;
  stage: string;
  averageDuration: number;
  impact: number; // percentage of total time
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface LatencyTrend {
  operation: string;
  timestamp: number;
  duration: number;
  trend: 'improving' | 'degrading' | 'stable';
  changeRate: number; // percentage change over time
}

export interface ProfilerConfig {
  enableDetailedTracing: boolean;
  maxMeasurements: number;
  samplingRate: number; // 0.0 to 1.0
  bottleneckThreshold: number; // percentage threshold for bottleneck detection
  trendWindow: number; // number of measurements for trend analysis
  exportPath: string;
  enableRealtimeMonitoring: boolean;
  alertThresholds: {
    operationLatency: number; // ms
    stageLatency: number; // ms
    throughputDrop: number; // percentage
  };
}

export const DEFAULT_PROFILER_CONFIG: ProfilerConfig = {
  enableDetailedTracing: true,
  maxMeasurements: 10000,
  samplingRate: 1.0,
  bottleneckThreshold: 10.0, // 10% of total time
  trendWindow: 100,
  exportPath: 'test-results/stress-testing/latency-profiles',
  enableRealtimeMonitoring: true,
  alertThresholds: {
    operationLatency: 1000, // 1 second
    stageLatency: 5000, // 5 seconds
    throughputDrop: 20.0, // 20% drop
  },
};

/**
 * Latency profiler for stress testing pipeline
 */
export class LatencyProfiler {
  private config: ProfilerConfig;
  private measurements: LatencyMeasurement[] = [];
  private activeOperations: Map<string, LatencyMeasurement> = new Map();
  private historicalData: LatencyProfile[] = [];
  private alerts: string[] = [];
  private startTime: number = 0;

  constructor(config: Partial<ProfilerConfig> = {}) {
    this.config = { ...DEFAULT_PROFILER_CONFIG, ...config };
    this.startTime = Date.now();
  }

  /**
   * Start profiling an operation
   */
  startOperation(
    operation: string,
    stage: LatencyMeasurement['stage'],
    metadata?: Record<string, unknown>,
    parentId?: string
  ): string {
    if (Math.random() > this.config.samplingRate) {
      return ''; // Skip this measurement based on sampling rate
    }

    const id = `${operation}-${stage}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const measurement: LatencyMeasurement = {
      id,
      operation,
      stage,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      metadata,
      parentId,
      children: [],
    };

    this.activeOperations.set(id, measurement);
    
    if (this.config.enableDetailedTracing) {
      console.log(`[LatencyProfiler] Started: ${operation} (${stage})`);
    }

    return id;
  }

  /**
   * End profiling an operation
   */
  endOperation(id: string, additionalMetadata?: Record<string, unknown>): LatencyMeasurement | null {
    const measurement = this.activeOperations.get(id);
    if (!measurement) {
      console.warn(`[LatencyProfiler] No active operation found for ID: ${id}`);
      return null;
    }

    measurement.endTime = Date.now();
    measurement.duration = measurement.endTime - measurement.startTime;
    
    if (additionalMetadata) {
      measurement.metadata = { ...measurement.metadata, ...additionalMetadata };
    }

    // Add to measurements list
    this.measurements.push(measurement);
    
    // Maintain max measurements limit
    if (this.measurements.length > this.config.maxMeasurements) {
      this.measurements = this.measurements.slice(-this.config.maxMeasurements);
    }

    // Remove from active operations
    this.activeOperations.delete(id);

    // Check for performance alerts
    this.checkPerformanceAlerts(measurement);

    if (this.config.enableDetailedTracing) {
      console.log(`[LatencyProfiler] Completed: ${measurement.operation} (${measurement.stage}) in ${measurement.duration}ms`);
    }

    return measurement;
  }

  /**
   * Profile a function execution
   */
  async profileFunction<T>(
    operation: string,
    stage: LatencyMeasurement['stage'],
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
    parentId?: string
  ): Promise<{ result: T; measurement: LatencyMeasurement }> {
    const id = this.startOperation(operation, stage, metadata, parentId);
    
    try {
      const result = await fn();
      const measurement = this.endOperation(id);
      
      if (!measurement) {
        throw new Error('Failed to end operation measurement');
      }

      return { result, measurement };
    } catch (error) {
      this.endOperation(id, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Profile archetype generation
   */
  async profileArchetypeGeneration(
    generator: () => Promise<StressTestArchetype[]>,
    metadata?: Record<string, unknown>
  ): Promise<{ archetypes: StressTestArchetype[]; measurement: LatencyMeasurement }> {
    return this.profileFunction(
      'archetype-generation',
      'generation',
      generator,
      {
        ...metadata,
        operationType: 'stress-test-archetype-generation',
      }
    );
  }

  /**
   * Profile simulation batch
   */
  async profileSimulationBatch(
    pairArchetype: StressTestArchetype,
    simulationCount: number,
    simulationFn: (seed: number) => Promise<any>,
    metadata?: Record<string, unknown>
  ): Promise<{ result: any; measurement: LatencyMeasurement }> {
    return this.profileFunction(
      `simulation-batch-${pairArchetype.id}`,
      'simulation',
      async () => {
        const results = [];
        const rng = new TestRNG(Date.now());
        
        for (let i = 0; i < simulationCount; i++) {
          const result = await simulationFn(rng.next());
          results.push(result);
          
          // Report progress every 1000 simulations
          if (i % 1000 === 0 && this.config.enableRealtimeMonitoring) {
            const progress = (i / simulationCount) * 100;
            console.log(`[LatencyProfiler] Simulation progress: ${progress.toFixed(1)}%`);
          }
        }
        
        return results;
      },
      {
        ...metadata,
        archetypeId: pairArchetype.id,
        statIds: pairArchetype.testedStats,
        simulationCount,
        operationType: 'stress-test-simulation',
      }
    );
  }

  /**
   * Profile marginal utility analysis
   */
  async profileMarginalUtilityAnalysis(
    archetypes: StressTestArchetype[],
    baseline: StressTestArchetype,
    analysisFn: () => Promise<MarginalUtilityAnalysis>,
    metadata?: Record<string, unknown>
  ): Promise<{ analysis: MarginalUtilityAnalysis; measurement: LatencyMeasurement }> {
    return this.profileFunction(
      'marginal-utility-analysis',
      'analysis',
      analysisFn,
      {
        ...metadata,
        archetypeCount: archetypes.length,
        singleStatCount: archetypes.filter(a => a.type === 'single').length,
        pairStatCount: archetypes.filter(a => a.type === 'pair').length,
        operationType: 'stress-test-analysis',
      }
    );
  }

  /**
   * Profile export operation
   */
  async profileExport(
    format: string,
    exportFn: () => Promise<void>,
    metadata?: Record<string, unknown>
  ): Promise<{ measurement: LatencyMeasurement }> {
    const { measurement } = await this.profileFunction(
      `export-${format}`,
      'export',
      exportFn,
      {
        ...metadata,
        exportFormat: format,
        operationType: 'stress-test-export',
      }
    );

    return { measurement };
  }

  /**
   * Generate comprehensive latency profile
   */
  generateProfile(): LatencyProfile {
    const totalDuration = Date.now() - this.startTime;
    
    // Calculate summary statistics
    const durations = this.measurements.map(m => m.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    
    const summary: LatencySummary = {
      totalOperations: this.measurements.length,
      averageLatency: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
      medianLatency: sortedDurations[Math.floor(sortedDurations.length / 2)] || 0,
      p95Latency: sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0,
      p99Latency: sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0,
      throughput: this.measurements.length / (totalDuration / 1000), // operations per second
      slowestOperation: this.measurements.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest, this.measurements[0] || {} as LatencyMeasurement),
      fastestOperation: this.measurements.reduce((fastest, current) => 
        current.duration < fastest.duration ? current : fastest, this.measurements[0] || {} as LatencyMeasurement),
      stageBreakdown: this.calculateStageBreakdown(),
    };

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(summary);

    // Analyze trends
    const trends = this.analyzeTrends();

    // Generate recommendations
    const recommendations = this.generateRecommendations(bottlenecks, summary);

    const profile: LatencyProfile = {
      id: `latency-profile-${Date.now()}`,
      timestamp: Date.now(),
      totalDuration,
      measurements: [...this.measurements],
      summary,
      bottlenecks,
      trends,
      recommendations,
    };

    return profile;
  }

  /**
   * Calculate stage breakdown statistics
   */
  private calculateStageBreakdown(): Record<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    percentage: number;
  }> {
    const breakdown: Record<string, {
      count: number;
      totalDuration: number;
      averageDuration: number;
      percentage: number;
    }> = {};

    const totalDuration = this.measurements.reduce((sum, m) => sum + m.duration, 0);

    // Group by stage
    const stageGroups = this.measurements.reduce((groups, measurement) => {
      if (!groups[measurement.stage]) {
        groups[measurement.stage] = [];
      }
      groups[measurement.stage].push(measurement);
      return groups;
    }, {} as Record<string, LatencyMeasurement[]>);

    // Calculate statistics for each stage
    Object.entries(stageGroups).forEach(([stage, measurements]) => {
      const stageDuration = measurements.reduce((sum, m) => sum + m.duration, 0);
      
      breakdown[stage] = {
        count: measurements.length,
        totalDuration: stageDuration,
        averageDuration: stageDuration / measurements.length,
        percentage: totalDuration > 0 ? (stageDuration / totalDuration) * 100 : 0,
      };
    });

    return breakdown;
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(summary: LatencySummary): LatencyBottleneck[] {
    const bottlenecks: LatencyBottleneck[] = [];

    // Group measurements by operation
    const operationGroups = this.measurements.reduce((groups, measurement) => {
      const key = `${measurement.operation}-${measurement.stage}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(measurement);
      return groups;
    }, {} as Record<string, LatencyMeasurement[]>);

    // Analyze each operation for bottleneck potential
    Object.entries(operationGroups).forEach(([key, measurements]) => {
      const [operation, stage] = key.split('-').slice(-2);
      const avgDuration = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
      const totalDuration = this.measurements.reduce((sum, m) => sum + m.duration, 0);
      const impact = (avgDuration * measurements.length) / totalDuration * 100;

      if (impact >= this.config.bottleneckThreshold) {
        let severity: LatencyBottleneck['severity'] = 'low';
        
        if (avgDuration > this.config.alertThresholds.operationLatency) {
          severity = 'critical';
        } else if (avgDuration > this.config.alertThresholds.operationLatency * 0.7) {
          severity = 'high';
        } else if (avgDuration > this.config.alertThresholds.operationLatency * 0.4) {
          severity = 'medium';
        }

        bottlenecks.push({
          operation,
          stage,
          averageDuration: avgDuration,
          impact,
          frequency: measurements.length,
          severity,
          recommendation: this.generateBottleneckRecommendation(operation, stage, avgDuration, severity),
        });
      }
    });

    // Sort by impact (descending)
    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): LatencyTrend[] {
    const trends: LatencyTrend[] = [];
    
    // Group measurements by operation
    const operationGroups = this.measurements.reduce((groups, measurement) => {
      if (!groups[measurement.operation]) {
        groups[measurement.operation] = [];
      }
      groups[measurement.operation].push(measurement);
      return groups;
    }, {} as Record<string, LatencyMeasurement[]>);

    // Analyze trends for each operation
    Object.entries(operationGroups).forEach(([operation, measurements]) => {
      if (measurements.length < this.config.trendWindow) return;

      // Sort by timestamp
      const sortedMeasurements = measurements.sort((a, b) => a.startTime - b.startTime);
      
      // Calculate trend over the window
      const recent = sortedMeasurements.slice(-this.config.trendWindow / 2);
      const older = sortedMeasurements.slice(-this.config.trendWindow, -this.config.trendWindow / 2);
      
      if (recent.length === 0 || older.length === 0) return;

      const recentAvg = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.duration, 0) / older.length;
      
      const changeRate = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      let trend: LatencyTrend['trend'] = 'stable';
      if (Math.abs(changeRate) > 5) {
        trend = changeRate > 0 ? 'degrading' : 'improving';
      }

      trends.push({
        operation,
        timestamp: Date.now(),
        duration: recentAvg,
        trend,
        changeRate,
      });
    });

    return trends;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    bottlenecks: LatencyBottleneck[],
    summary: LatencySummary
  ): string[] {
    const recommendations: string[] = [];

    // Bottleneck-specific recommendations
    bottlenecks.forEach(bottleneck => {
      recommendations.push(bottleneck.recommendation);
    });

    // General performance recommendations
    if (summary.p95Latency > this.config.alertThresholds.operationLatency) {
      recommendations.push('Consider optimizing simulation algorithms to reduce P95 latency');
    }

    if (summary.throughput < 10) { // Less than 10 operations per second
      recommendations.push('Low throughput detected. Consider parallel processing or algorithm optimization');
    }

    if (summary.stageBreakdown.simulation?.percentage > 70) {
      recommendations.push('Simulation stage dominates processing time. Consider simulation optimization or reduced simulation count');
    }

    if (summary.stageBreakdown.analysis?.percentage > 20) {
      recommendations.push('Analysis stage taking significant time. Consider optimizing statistical calculations');
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Generate bottleneck-specific recommendation
   */
  private generateBottleneckRecommendation(
    operation: string,
    stage: string,
    avgDuration: number,
    severity: LatencyBottleneck['severity']
  ): string {
    const baseRecommendations = {
      generation: {
        critical: 'Critical bottleneck in archetype generation. Consider caching or pre-generation strategies',
        high: 'High latency in archetype generation. Optimize stat calculation algorithms',
        medium: 'Moderate delay in archetype generation. Consider incremental generation',
        low: 'Minor delay in archetype generation. Monitor for performance degradation',
      },
      simulation: {
        critical: 'Critical simulation bottleneck. Reduce simulation count or optimize combat algorithms',
        high: 'High simulation latency. Consider parallel processing or simplified models',
        medium: 'Moderate simulation delay. Optimize RNG and combat calculations',
        low: 'Minor simulation delay. Monitor for performance trends',
      },
      analysis: {
        critical: 'Critical analysis bottleneck. Optimize statistical calculations and data structures',
        high: 'High analysis latency. Consider streaming analysis or optimized algorithms',
        medium: 'Moderate analysis delay. Optimize metric calculations',
        low: 'Minor analysis delay. Monitor for performance trends',
      },
      export: {
        critical: 'Critical export bottleneck. Optimize serialization and file I/O operations',
        high: 'High export latency. Consider streaming export or compression',
        medium: 'Moderate export delay. Optimize data formatting',
        low: 'Minor export delay. Monitor for performance trends',
      },
    };

    return baseRecommendations[stage]?.[severity] || 
      `${severity} latency detected in ${stage} operation. Consider performance optimization`;
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(measurement: LatencyMeasurement): void {
    const alerts: string[] = [];

    // Operation latency alert
    if (measurement.duration > this.config.alertThresholds.operationLatency) {
      alerts.push(`High latency alert: ${measurement.operation} took ${measurement.duration}ms (threshold: ${this.config.alertThresholds.operationLatency}ms)`);
    }

    // Stage latency alert
    const stageAvg = this.measurements
      .filter(m => m.stage === measurement.stage)
      .reduce((sum, m) => sum + m.duration, 0) / 
      this.measurements.filter(m => m.stage === measurement.stage).length;

    if (stageAvg > this.config.alertThresholds.stageLatency) {
      alerts.push(`Stage latency alert: ${measurement.stage} average is ${stageAvg.toFixed(2)}ms (threshold: ${this.config.alertThresholds.stageLatency}ms)`);
    }

    // Add to alerts list
    this.alerts.push(...alerts);

    // Log alerts if enabled
    if (this.config.enableRealtimeMonitoring && alerts.length > 0) {
      alerts.forEach(alert => console.warn(`[LatencyProfiler] ${alert}`));
    }
  }

  /**
   * Export latency profile
   */
  async exportProfile(format: 'json' | 'csv' | 'markdown' = 'json'): Promise<void> {
    const profile = this.generateProfile();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    let filename: string;
    let content: string;

    switch (format) {
      case 'json':
        filename = `latency-profile-${timestamp}.json`;
        content = JSON.stringify(profile, null, 2);
        break;
        
      case 'csv':
        filename = `latency-profile-${timestamp}.csv`;
        content = this.convertToCSV(profile);
        break;
        
      case 'markdown':
        filename = `latency-profile-${timestamp}.md`;
        content = this.convertToMarkdown(profile);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const exportPath = `${this.config.exportPath}/${filename}`;
    await saveData(exportPath, content);
    
    console.log(`[LatencyProfiler] Exported ${format} profile to ${exportPath}`);
  }

  /**
   * Convert profile to CSV format
   */
  private convertToCSV(profile: LatencyProfile): string {
    const headers = [
      'Operation',
      'Stage',
      'Duration (ms)',
      'Start Time',
      'End Time',
      'Metadata',
    ];

    const rows = profile.measurements.map(measurement => [
      measurement.operation,
      measurement.stage,
      measurement.duration.toString(),
      new Date(measurement.startTime).toISOString(),
      new Date(measurement.endTime).toISOString(),
      JSON.stringify(measurement.metadata || {}),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert profile to Markdown format
   */
  private convertToMarkdown(profile: LatencyProfile): string {
    const lines: string[] = [];
    
    lines.push(`# Latency Profile Report`);
    lines.push(`**ID:** ${profile.id}`);
    lines.push(`**Date:** ${new Date(profile.timestamp).toISOString()}`);
    lines.push(`**Total Duration:** ${profile.totalDuration}ms`);
    lines.push('');
    
    // Summary
    lines.push('## Performance Summary');
    lines.push(`- **Total Operations:** ${profile.summary.totalOperations.toLocaleString()}`);
    lines.push(`- **Average Latency:** ${profile.summary.averageLatency.toFixed(2)}ms`);
    lines.push(`- **Median Latency:** ${profile.summary.medianLatency.toFixed(2)}ms`);
    lines.push(`- **P95 Latency:** ${profile.summary.p95Latency.toFixed(2)}ms`);
    lines.push(`- **P99 Latency:** ${profile.summary.p99Latency.toFixed(2)}ms`);
    lines.push(`- **Throughput:** ${profile.summary.throughput.toFixed(2)} ops/sec`);
    lines.push('');
    
    // Stage Breakdown
    lines.push('## Stage Breakdown');
    lines.push('| Stage | Count | Avg Duration | Total Duration | Percentage |');
    lines.push('|-------|-------|--------------|---------------|------------|');
    
    Object.entries(profile.summary.stageBreakdown).forEach(([stage, stats]) => {
      lines.push(`| ${stage} | ${stats.count} | ${stats.averageDuration.toFixed(2)}ms | ${stats.totalDuration}ms | ${stats.percentage.toFixed(1)}% |`);
    });
    lines.push('');
    
    // Bottlenecks
    if (profile.bottlenecks.length > 0) {
      lines.push('## Performance Bottlenecks');
      lines.push('| Operation | Stage | Avg Duration | Impact | Severity | Recommendation |');
      lines.push('|----------|-------|--------------|--------|----------|----------------|');
      
      profile.bottlenecks.forEach(bottleneck => {
        lines.push(`| ${bottleneck.operation} | ${bottleneck.stage} | ${bottleneck.averageDuration.toFixed(2)}ms | ${bottleneck.impact.toFixed(1)}% | ${bottleneck.severity} | ${bottleneck.recommendation} |`);
      });
      lines.push('');
    }
    
    // Trends
    if (profile.trends.length > 0) {
      lines.push('## Performance Trends');
      lines.push('| Operation | Current Duration | Trend | Change Rate |');
      lines.push('|----------|------------------|-------|-------------|');
      
      profile.trends.forEach(trend => {
        lines.push(`| ${trend.operation} | ${trend.duration.toFixed(2)}ms | ${trend.trend} | ${trend.changeRate.toFixed(1)}% |`);
      });
      lines.push('');
    }
    
    // Recommendations
    if (profile.recommendations.length > 0) {
      lines.push('## Recommendations');
      profile.recommendations.forEach(rec => {
        lines.push(`- ${rec}`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Get current alerts
   */
  getAlerts(): string[] {
    return [...this.alerts];
  }

  /**
   * Clear measurements and reset profiler
   */
  reset(): void {
    this.measurements = [];
    this.activeOperations.clear();
    this.alerts = [];
    this.startTime = Date.now();
    
    console.log('[LatencyProfiler] Reset completed');
  }

  /**
   * Get real-time statistics
   */
  getRealTimeStats(): {
    activeOperations: number;
    totalMeasurements: number;
    averageLatency: number;
    throughput: number;
    recentAlerts: number;
  } {
    const totalDuration = Date.now() - this.startTime;
    const recentAlerts = this.alerts.filter(alert => 
      Date.now() - new Date(alert).getTime() < 60000 // Last minute
    ).length;

    return {
      activeOperations: this.activeOperations.size,
      totalMeasurements: this.measurements.length,
      averageLatency: this.measurements.length > 0 ? 
        this.measurements.reduce((sum, m) => sum + m.duration, 0) / this.measurements.length : 0,
      throughput: totalDuration > 0 ? this.measurements.length / (totalDuration / 1000) : 0,
      recentAlerts,
    };
  }
}

/**
 * Global latency profiler instance
 */
export const latencyProfiler = new LatencyProfiler();

/**
 * Convenience function to profile stress testing pipeline
 */
export async function profileStressTestingPipeline(
  config: Partial<ProfilerConfig> = {}
): Promise<{
  profile: LatencyProfile;
  archetypes: StressTestArchetype[];
  analysis: MarginalUtilityAnalysis;
}> {
  const profiler = new LatencyProfiler(config);
  
  // Profile complete pipeline
  const { result: archetypes, measurement: genMeasurement } = await profiler.profileArchetypeGeneration(
    async () => {
      // This would call the actual archetype generation
      // For now, return mock data
      return [];
    },
    { pipeline: 'stress-testing' }
  );

  const { result: analysis, measurement: analysisMeasurement } = await profiler.profileMarginalUtilityAnalysis(
    archetypes,
    archetypes[0] || {} as StressTestArchetype,
    async () => {
      // This would call the actual marginal utility analysis
      // For now, return mock data
      return {} as MarginalUtilityAnalysis;
    },
    { pipeline: 'stress-testing' }
  );

  const profile = profiler.generateProfile();
  
  // Export profile
  await profiler.exportProfile('json');
  
  return { profile, archetypes, analysis };
}
