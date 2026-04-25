/**
 * NP-050 – Analytics Memory Leak Telemetry Guard
 * 
 * Sentinel-Analytics – Leak Guard for monitoring memory footprint
 * of telemetry pipelines and detecting leaks via trend analysis.
 * 
 * @since 2026-01-20
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Configuration schema for memory leak detection.
 */
export const MemoryLeakGuardConfigSchema = z.object({
  /** Memory threshold in MB for leak detection */
  thresholdMB: z.number().min(10).max(1024).default(100),
  /** Sampling interval in milliseconds */
  samplingIntervalMs: z.number().min(1000).max(300000).default(5000),
  /** Duration in milliseconds for trend analysis */
  trendDurationMs: z.number().min(30000).max(3600000).default(300000),
  /** Number of samples to maintain for analysis */
  maxSamples: z.number().min(10).max(1000).default(100),
  /** Growth rate threshold (percentage increase) */
  growthRateThreshold: z.number().min(0.1).max(5.0).default(0.5),
  /** Enable automatic baseline establishment */
  enableBaseline: z.boolean().default(true),
  /** Baseline stabilization duration in milliseconds */
  baselineDurationMs: z.number().min(10000).max(300000).default(30000),
  /** Alert cooldown period in milliseconds */
  alertCooldownMs: z.number().min(60000).max(3600000).default(300000),
  /** Enable detailed logging */
  verbose: z.boolean().default(false),
  /** Storage key for persistence */
  storageKey: z.string().default('memory-leak-guard-data'),
});

export type MemoryLeakGuardConfig = z.infer<typeof MemoryLeakGuardConfigSchema>;

/**
 * Memory snapshot data structure.
 */
export interface MemorySnapshot {
  /** Timestamp when snapshot was taken */
  timestamp: number;
  /** Memory usage in MB */
  memoryMB: number;
  /** Heap size in MB */
  heapSizeMB: number;
  /** Number of heap objects */
  heapObjects: number;
  /** Available memory in MB */
  availableMB: number;
  /** Process ID */
  pid: number;
  /** Node.js version */
  nodeVersion: string;
  /** Platform information */
  platform: string;
}

/**
 * Memory trend analysis result.
 */
export interface MemoryTrend {
  /** Current memory usage */
  current: MemorySnapshot;
  /** Baseline memory usage */
  baseline: MemorySnapshot;
  /** Growth rate (percentage) */
  growthRate: number;
  /** Trend direction */
  direction: 'increasing' | 'decreasing' | 'stable';
  /** Time elapsed since baseline */
  elapsedMs: number;
  /** Sample count used for analysis */
  sampleCount: number;
  /** Linear regression slope (MB per second) */
  slope: number;
  /** R-squared value for trend quality */
  rSquared: number;
}

/**
 * Memory leak detection result.
 */
export interface MemoryLeakDetection {
  /** Whether a leak was detected */
  detected: boolean;
  /** Current trend analysis */
  trend: MemoryTrend;
  /** Alert level */
  alertLevel: 'none' | 'warning' | 'critical';
  /** Detection timestamp */
  timestamp: number;
  /** Detection reason */
  reason: string;
  /** Recommendations */
  recommendations: string[];
  /** Previous detections (for pattern analysis) */
  previousDetections: number[];
  /** Growth rate for quick access */
  growthRate: number;
}

/**
 * Memory leak guard state.
 */
export interface MemoryLeakGuardState {
  /** Current configuration */
  config: MemoryLeakGuardConfig;
  /** Memory snapshots history */
  snapshots: MemorySnapshot[];
  /** Baseline snapshot */
  baseline: MemorySnapshot | null;
  /** Last detection result */
  lastDetection: MemoryLeakDetection | null;
  /** Last alert timestamp */
  lastAlertTimestamp: number;
  /** Guard is active */
  active: boolean;
  /** Start timestamp */
  startTimestamp: number;
  /** Total samples collected */
  totalSamples: number;
  /** Detection history */
  detectionHistory: MemoryLeakDetection[];
}

/**
 * Memory leak telemetry event payload.
 */
export interface MemoryLeakDetectedTelemetryPayload {
  /** Event type */
  eventType: 'analytics_memory_leak_detected';
  /** Timestamp */
  timestamp: number;
  /** Alert level */
  alertLevel: 'warning' | 'critical';
  /** Current memory usage */
  currentMemoryMB: number;
  /** Baseline memory usage */
  baselineMemoryMB: number;
  /** Growth rate */
  growthRate: number;
  /** Trend direction */
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  /** Sample count */
  sampleCount: number;
  /** Process information */
  processInfo: {
    pid: number;
    nodeVersion: string;
    platform: string;
  };
  /** Detection reason */
  reason: string;
  /** Recommendations */
  recommendations: string[];
  /** Guard configuration */
  guardConfig: {
    thresholdMB: number;
    samplingIntervalMs: number;
    trendDurationMs: number;
    growthRateThreshold: number;
  };
}

/**
 * Memory leak guard class for monitoring and detecting memory leaks.
 */
export class MemoryLeakGuard {
  private state: MemoryLeakGuardState;
  private intervalId: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor(config: Partial<MemoryLeakGuardConfig> = {}) {
    this.state = {
      config: MemoryLeakGuardConfigSchema.parse(config),
      snapshots: [],
      baseline: null,
      lastDetection: null,
      lastAlertTimestamp: 0,
      active: false,
      startTimestamp: Date.now(),
      totalSamples: 0,
      detectionHistory: [],
    };
  }

  /**
   * Start monitoring memory usage.
   */
  start(): void {
    if (this.state.active) {
      if (this.state.config.verbose) {
        console.warn('Memory leak guard is already active');
      }
      return;
    }

    this.state.active = true;
    this.state.startTimestamp = Date.now();

    // Set up periodic sampling
    this.intervalId = setInterval(() => {
      this.collectSnapshot();
    }, this.state.config.samplingIntervalMs);

    // Set up performance observer for heap snapshots
    if (typeof performance !== 'undefined' && (performance as any).observe) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('memory')) {
            this.collectSnapshot();
          }
        });
      });
      this.performanceObserver.observe({ entryTypes: ['measure'] } as any);
    }

    if (this.state.config.verbose) {
      console.log('Memory leak guard started', {
        config: this.state.config,
        timestamp: this.state.startTimestamp,
      });
    }
  }

  /**
   * Stop monitoring memory usage.
   */
  stop(): void {
    if (!this.state.active) {
      return;
    }

    this.state.active = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    if (this.state.config.verbose) {
      console.log('Memory leak guard stopped', {
        duration: Date.now() - this.state.startTimestamp,
        totalSamples: this.state.totalSamples,
        detectionCount: this.state.detectionHistory.length,
      });
    }
  }

  /**
   * Collect a memory snapshot.
   */
  private collectSnapshot(): void {
    const snapshot = this.createMemorySnapshot();
    this.state.snapshots.push(snapshot);
    this.state.totalSamples++;

    // Maintain maximum sample count
    if (this.state.snapshots.length > this.state.config.maxSamples) {
      this.state.snapshots.shift();
    }

    // Establish baseline if enabled and not set
    if (this.state.config.enableBaseline && !this.state.baseline) {
      const elapsed = Date.now() - this.state.startTimestamp;
      if (elapsed >= this.state.config.baselineDurationMs) {
        this.establishBaseline();
      }
    }

    // Analyze for leaks if baseline is established
    if (this.state.baseline) {
      const detection = this.analyzeMemoryTrend();
      if (detection.detected) {
        this.handleDetection(detection);
      }
    }

    if (this.state.config.verbose && this.state.totalSamples % 20 === 0) {
      console.log('Memory snapshot collected', {
        timestamp: snapshot.timestamp,
        memoryMB: snapshot.memoryMB,
        heapSizeMB: snapshot.heapSizeMB,
        totalSamples: this.state.totalSamples,
      });
    }
  }

  /**
   * Create a memory snapshot from current process state.
   */
  private createMemorySnapshot(): MemorySnapshot {
    const now = Date.now();
    const memoryUsage = process.memoryUsage();
    const pid = process.pid;

    return {
      timestamp: now,
      memoryMB: memoryUsage.rss / 1024 / 1024,
      heapSizeMB: memoryUsage.heapUsed / 1024 / 1024,
      heapObjects: memoryUsage.heapTotal / 1024,
      availableMB: (memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024,
      pid,
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * Establish baseline memory usage.
   */
  private establishBaseline(): void {
    if (this.state.snapshots.length === 0) {
      return;
    }

    // Calculate average of recent snapshots for baseline
    const recentSnapshots = this.state.snapshots.slice(-10);
    const baseline: MemorySnapshot = {
      timestamp: Date.now(),
      memoryMB: recentSnapshots.reduce((sum, s) => sum + s.memoryMB, 0) / recentSnapshots.length,
      heapSizeMB: recentSnapshots.reduce((sum, s) => sum + s.heapSizeMB, 0) / recentSnapshots.length,
      heapObjects: recentSnapshots.reduce((sum, s) => sum + s.heapObjects, 0) / recentSnapshots.length,
      availableMB: recentSnapshots.reduce((sum, s) => sum + s.availableMB, 0) / recentSnapshots.length,
      pid: recentSnapshots[0].pid,
      nodeVersion: recentSnapshots[0].nodeVersion,
      platform: recentSnapshots[0].platform,
    };

    this.state.baseline = baseline;

    if (this.state.config.verbose) {
      console.log('Memory baseline established', {
        baseline: {
          memoryMB: baseline.memoryMB,
          heapSizeMB: baseline.heapSizeMB,
          timestamp: baseline.timestamp,
        },
        sampleCount: recentSnapshots.length,
      });
    }
  }

  /**
   * Analyze memory trend for leak detection.
   */
  private analyzeMemoryTrend(): MemoryLeakDetection {
    if (!this.state.baseline || this.state.snapshots.length < 2) {
      return {
        detected: false,
        trend: this.createEmptyTrend(),
        alertLevel: 'none',
        timestamp: Date.now(),
        reason: 'Insufficient data for analysis',
        recommendations: ['Wait for more samples to establish baseline'],
        previousDetections: [],
        growthRate: 0,
      };
    }

    const current = this.state.snapshots[this.state.snapshots.length - 1];
    const trend = this.calculateTrend(current, this.state.baseline);
    
    let detected = false;
    let alertLevel: 'warning' | 'critical' = 'warning';
    let reason = '';
    const recommendations: string[] = [];

    // Check absolute threshold
    if (current.memoryMB > this.state.config.thresholdMB) {
      detected = true;
      alertLevel = 'critical';
      reason = `Memory usage (${current.memoryMB.toFixed(2)}MB) exceeds threshold (${this.state.config.thresholdMB}MB)`;
      recommendations.push('Investigate potential memory leaks');
      recommendations.push('Consider increasing threshold if this is expected');
    }

    // Check growth rate
    if (trend.growthRate > this.state.config.growthRateThreshold) {
      detected = true;
      if (alertLevel !== 'critical') {
        alertLevel = 'warning';
      }
      if (!reason) {
        reason = `Memory growth rate (${(trend.growthRate * 100).toFixed(2)}%) exceeds threshold (${(this.state.config.growthRateThreshold * 100).toFixed(2)}%)`;
      }
      recommendations.push('Monitor for sustained growth patterns');
      recommendations.push('Check for memory leaks in event listeners or caches');
    }

    // Check trend direction and slope
    if (trend.direction === 'increasing' && trend.slope > 1) {
      detected = true;
      if (alertLevel !== 'critical') {
        alertLevel = 'warning';
      }
      if (!reason) {
        reason = `Consistent memory increase detected (${trend.slope.toFixed(2)}MB/sec)`;
      }
      recommendations.push('Analyze memory allocation patterns');
      recommendations.push('Review object lifecycle management');
    }

    const previousDetections = this.state.detectionHistory.map(d => d.timestamp);

    return {
      detected,
      trend,
      alertLevel: detected ? alertLevel : 'none',
      timestamp: Date.now(),
      reason,
      recommendations,
      previousDetections,
      growthRate: trend.growthRate,
    };
  }

  /**
   * Calculate memory trend statistics.
   */
  private calculateTrend(current: MemorySnapshot, baseline: MemorySnapshot): MemoryTrend {
    const elapsedMs = current.timestamp - baseline.timestamp;
    const growthRate = (current.memoryMB - baseline.memoryMB) / baseline.memoryMB;
    
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (growthRate > 0.05) direction = 'increasing';
    else if (growthRate < -0.05) direction = 'decreasing';

    // Simple linear regression for slope
    const recentSnapshots = this.state.snapshots.slice(-20);
    let slope = 0;
    let rSquared = 0;

    if (recentSnapshots.length >= 2) {
      const n = recentSnapshots.length;
      const sumX = recentSnapshots.reduce((sum, s, i) => sum + i, 0);
      const sumY = recentSnapshots.reduce((sum, s) => sum + s.memoryMB, 0);
      const sumXY = recentSnapshots.reduce((sum, s, i) => sum + i * s.memoryMB, 0);
      const sumXX = recentSnapshots.reduce((sum, s, i) => sum + i * i, 0);

      slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      
      // Calculate R-squared (simplified)
      const meanY = sumY / n;
      const ssTotal = recentSnapshots.reduce((sum, s) => sum + Math.pow(s.memoryMB - meanY, 2), 0);
      const ssResidual = recentSnapshots.reduce((sum, s, i) => {
        const predicted = (sumY - slope * sumX) / n + slope * i;
        return sum + Math.pow(s.memoryMB - predicted, 2);
      }, 0);
      rSquared = 1 - (ssResidual / ssTotal);
    }

    return {
      current,
      baseline,
      growthRate,
      direction,
      elapsedMs,
      sampleCount: this.state.snapshots.length,
      slope: slope * 1000, // Convert to MB per second
      rSquared: Math.max(0, Math.min(1, rSquared)),
    };
  }

  /**
   * Create empty trend for insufficient data cases.
   */
  private createEmptyTrend(): MemoryTrend {
    const now = Date.now();
    const emptySnapshot: MemorySnapshot = {
      timestamp: now,
      memoryMB: 0,
      heapSizeMB: 0,
      heapObjects: 0,
      availableMB: 0,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    };

    return {
      current: emptySnapshot,
      baseline: emptySnapshot,
      growthRate: 0,
      direction: 'stable',
      elapsedMs: 0,
      sampleCount: 0,
      slope: 0,
      rSquared: 0,
    };
  }

  /**
   * Handle memory leak detection.
   */
  private handleDetection(detection: MemoryLeakDetection): void {
    const now = Date.now();
    
    // Check alert cooldown
    if (now - this.state.lastAlertTimestamp < this.state.config.alertCooldownMs) {
      return;
    }

    this.state.lastDetection = detection;
    this.state.lastAlertTimestamp = now;
    this.state.detectionHistory.push(detection);

    // Maintain detection history
    if (this.state.detectionHistory.length > 50) {
      this.state.detectionHistory.shift();
    }

    // Send telemetry event
    this.sendTelemetryEvent(detection);

    if (this.state.config.verbose) {
      console.warn('Memory leak detected', {
        alertLevel: detection.alertLevel,
        reason: detection.reason,
        currentMemoryMB: detection.trend.current.memoryMB,
        baselineMemoryMB: detection.trend.baseline.memoryMB,
        growthRate: detection.growthRate,
        recommendations: detection.recommendations,
      });
    }
  }

  /**
   * Send telemetry event for memory leak detection.
   */
  private sendTelemetryEvent(detection: MemoryLeakDetection): void {
    if (detection.alertLevel === 'none') {
      return;
    }

    const payload: MemoryLeakDetectedTelemetryPayload = {
      eventType: 'analytics_memory_leak_detected',
      timestamp: detection.timestamp,
      alertLevel: detection.alertLevel,
      currentMemoryMB: detection.trend.current.memoryMB,
      baselineMemoryMB: detection.trend.baseline.memoryMB,
      growthRate: detection.growthRate,
      trendDirection: detection.trend.direction,
      sampleCount: detection.trend.sampleCount,
      processInfo: {
        pid: detection.trend.current.pid,
        nodeVersion: detection.trend.current.nodeVersion,
        platform: detection.trend.current.platform,
      },
      reason: detection.reason,
      recommendations: detection.recommendations,
      guardConfig: {
        thresholdMB: this.state.config.thresholdMB,
        samplingIntervalMs: this.state.config.samplingIntervalMs,
        trendDurationMs: this.state.config.trendDurationMs,
        growthRateThreshold: this.state.config.growthRateThreshold,
      },
    };

    // Import and send telemetry event
    import('@/analytics/telemetry/telemetryProvider').then(({ trackTelemetryEvent }) => {
      trackTelemetryEvent('analytics_memory_leak_detected', payload as unknown as Record<string, unknown>);
    }).catch((error) => {
      console.error('Failed to send memory leak telemetry:', error);
    });
  }

  /**
   * Get current guard state.
   */
  getState(): MemoryLeakGuardState {
    return { ...this.state };
  }

  /**
   * Get current memory snapshot.
   */
  getCurrentSnapshot(): MemorySnapshot | null {
    return this.state.snapshots.length > 0 
      ? this.state.snapshots[this.state.snapshots.length - 1] 
      : null;
  }

  /**
   * Get memory trend analysis.
   */
  getTrendAnalysis(): MemoryTrend | null {
    if (!this.state.baseline || this.state.snapshots.length === 0) {
      return null;
    }

    const current = this.state.snapshots[this.state.snapshots.length - 1];
    return this.calculateTrend(current, this.state.baseline);
  }

  /**
   * Get detection history.
   */
  getDetectionHistory(): MemoryLeakDetection[] {
    return [...this.state.detectionHistory];
  }

  /**
   * Reset guard state.
   */
  reset(): void {
    const wasActive = this.state.active;
    
    if (wasActive) {
      this.stop();
    }

    this.state.snapshots = [];
    this.state.baseline = null;
    this.state.lastDetection = null;
    this.state.lastAlertTimestamp = 0;
    this.state.totalSamples = 0;
    this.state.detectionHistory = [];

    if (wasActive) {
      this.start();
    }
  }

  /**
   * Update configuration.
   */
  updateConfig(newConfig: Partial<MemoryLeakGuardConfig>): void {
    this.state.config = MemoryLeakGuardConfigSchema.parse({
      ...this.state.config,
      ...newConfig,
    });

    if (this.state.config.verbose) {
      console.log('Memory leak guard configuration updated', this.state.config);
    }
  }

  /**
   * Export guard data for persistence.
   */
  exportData(): {
    state: MemoryLeakGuardState;
    exportTimestamp: number;
    version: string;
  } {
    return {
      state: this.state,
      exportTimestamp: Date.now(),
      version: '1.0.0',
    };
  }

  /**
   * Import guard data from persistence.
   */
  importData(data: {
    state: MemoryLeakGuardState;
    exportTimestamp: number;
    version: string;
  }): void {
    if (data.version !== '1.0.0') {
      throw new Error(`Unsupported data version: ${data.version}`);
    }

    // Validate imported state
    const validatedState = {
      ...data.state,
      config: MemoryLeakGuardConfigSchema.parse(data.state.config),
    };

    // Stop current monitoring before importing
    const wasActive = this.state.active;
    if (wasActive) {
      this.stop();
    }

    // Import state
    this.state = validatedState;

    // Restart monitoring if it was active
    if (wasActive) {
      this.start();
    }

    if (this.state.config.verbose) {
      console.log('Memory leak guard data imported', {
        exportTimestamp: data.exportTimestamp,
        snapshotCount: this.state.snapshots.length,
        detectionCount: this.state.detectionHistory.length,
      });
    }
  }
}

/**
 * Default memory leak guard instance.
 */
export const defaultMemoryLeakGuard = new MemoryLeakGuard();

/**
 * Utility function to create a memory leak guard with custom config.
 */
export function createMemoryLeakGuard(config: Partial<MemoryLeakGuardConfig> = {}): MemoryLeakGuard {
  return new MemoryLeakGuard(config);
}
