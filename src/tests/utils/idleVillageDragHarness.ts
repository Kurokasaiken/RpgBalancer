import { vi } from 'vitest';
import type { DragEvent } from 'react';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { createVillageStateFromConfig } from '@/engine/game/idleVillage/TimeEngine';

type PerformanceMemoryInfo = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

/**
 * Telemetry event for drag stress testing
 */
export interface DragStressTelemetryEvent {
  type: 'idle_drag_stress_event';
  payload: {
    batchIndex: number;
    operationIndex: number;
    operationType: 'drag_start' | 'drag_over' | 'drop' | 'drag_end';
    timestamp: number;
    duration: number;
    memoryUsage?: number;
    cpuUsage?: number;
    error?: string;
    config: {
      batchSize: number;
      operationsPerBatch: number;
      cooldownMs: number;
    };
  };
}

/**
 * Configuration for drag stress testing
 */
export interface DragStressConfig {
  batchSize: number;
  operationsPerBatch: number;
  cooldownMs: number;
  maxConcurrentDrags: number;
  enableTelemetry: boolean;
  mockTimers: boolean;
  virtualizationThreshold: number;
  performanceThresholds: {
    maxTTI: number; // Time to Interactive (ms)
    maxDropLatency: number; // Drop feedback latency (ms)
    maxMemoryGrowth: number; // MB
    maxCPUUsage: number; // Percentage
  };
}

/**
 * Default stress test configuration
 */
export const DEFAULT_DRAG_STRESS_CONFIG: DragStressConfig = {
  batchSize: 100,
  operationsPerBatch: 1000,
  cooldownMs: 50,
  maxConcurrentDrags: 5,
  enableTelemetry: true,
  mockTimers: true,
  virtualizationThreshold: 50,
  performanceThresholds: {
    maxTTI: 3000,
    maxDropLatency: 100,
    maxMemoryGrowth: 100,
    maxCPUUsage: 80,
  },
};

/**
 * Performance metrics collected during stress testing
 */
export interface StressMetrics {
  batchIndex: number;
  operationIndex: number;
  operationType: 'drag_start' | 'drag_over' | 'drop' | 'drag_end';
  timestamp: number;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  error?: string;
}

/**
 * Harness for executing drag & drop stress tests
 */
export class IdleVillageDragHarness {
  private config: DragStressConfig;
  private metrics: StressMetrics[] = [];
  private villageState: VillageState;
  private mockTimers: ReturnType<typeof vi.useFakeTimers> | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private residentIds: string[] = [];

  constructor(config: Partial<DragStressConfig> = {}) {
    this.config = { ...DEFAULT_DRAG_STRESS_CONFIG, ...config };
    this.villageState = createVillageStateFromConfig({ config: DEFAULT_IDLE_VILLAGE_CONFIG });
    this.setupMockEnvironment();
  }

  /**
   * Setup mock environment for stress testing
   */
  private setupMockEnvironment(): void {
    if (this.config.mockTimers) {
      this.mockTimers = vi.useFakeTimers();
    }

    // Setup performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.recordMetric({
              batchIndex: 0,
              operationIndex: 0,
              operationType: 'drag_start',
              timestamp: entry.startTime,
              duration: entry.duration,
            });
          }
        });
      });
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Generate test residents for stress testing
   */
  private generateTestResidents(count: number): string[] {
    const residents: string[] = [];
    for (let i = 0; i < count; i++) {
      const residentId = `stress-resident-${i}`;
      this.villageState.residents[residentId] = {
        id: residentId,
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        statTags: [],
        statSnapshot: {
          hp: 100,
          damage: 10 + (i % 10),
          agility: 8 + (i % 8),
          txc: 12 + (i % 6),
        },
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };
      residents.push(residentId);
    }
    return residents;
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: Omit<StressMetrics, 'batchIndex'> & { batchIndex?: number }): void {
    const fullMetric = {
      batchIndex: metric.batchIndex ?? 0,
      ...metric,
    };
    
    this.metrics.push(fullMetric);

    // Emit telemetry if enabled
    if (this.config.enableTelemetry) {
      this.emitTelemetry(fullMetric);
    }
  }

  /**
   * Emit telemetry event for stress testing
   */
  private emitTelemetry(metric: StressMetrics): void {
    const telemetryEvent: DragStressTelemetryEvent = {
      type: 'idle_drag_stress_event',
      payload: {
        batchIndex: metric.batchIndex,
        operationIndex: metric.operationIndex,
        operationType: metric.operationType,
        timestamp: metric.timestamp,
        duration: metric.duration,
        memoryUsage: metric.memoryUsage,
        cpuUsage: metric.cpuUsage,
        error: metric.error,
        config: {
          batchSize: this.config.batchSize,
          operationsPerBatch: this.config.operationsPerBatch,
          cooldownMs: this.config.cooldownMs,
        },
      },
    };

    // Log telemetry event (in real implementation, this would send to analytics service)
    console.log('TELEMETRY:', JSON.stringify(telemetryEvent));
  }

  /**
   * Simulate drag start operation
   */
  private async simulateDragStart(residentId: string, targetElement: HTMLElement): Promise<void> {
    const startTime = performance.now();
    
    try {
      const dragEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });
      
      // Set drag data
      dragEvent.dataTransfer?.setData(RESIDENT_DRAG_MIME, JSON.stringify({
        residentId,
        source: 'roster',
      }));

      targetElement.dispatchEvent(dragEvent);
      
      const duration = performance.now() - startTime;
      this.recordMetric({
        batchIndex: 0,
        operationIndex: 0,
        operationType: 'drag_start',
        timestamp: startTime,
        duration,
      });
    } catch (error) {
      this.recordMetric({
        batchIndex: 0,
        operationIndex: 0,
        operationType: 'drag_start',
        timestamp: startTime,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Simulate drag over operation
   */
  private async simulateDragOver(targetElement: HTMLElement): Promise<void> {
    const startTime = performance.now();
    
    try {
      const dragEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
      });
      
      targetElement.dispatchEvent(dragEvent);
      
      const duration = performance.now() - startTime;
      this.recordMetric({
        batchIndex: 0,
        operationIndex: 0,
        operationType: 'drag_over',
        timestamp: startTime,
        duration,
      });
    } catch (error) {
      this.recordMetric({
        batchIndex: 0,
        operationIndex: 0,
        operationType: 'drag_over',
        timestamp: startTime,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Simulate drop operation
   */
  private async simulateDrop(targetElement: HTMLElement, _activityId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });
      
      targetElement.dispatchEvent(dropEvent);
      
      const duration = performance.now() - startTime;
      this.recordMetric({
        batchIndex: 0,
        operationIndex: 0,
        operationType: 'drop',
        timestamp: startTime,
        duration,
      });
    } catch (error) {
      this.recordMetric({
        batchIndex: 0,
        operationIndex: 0,
        operationType: 'drop',
        timestamp: startTime,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Execute stress test batch
   */
  async executeBatch(batchIndex: number, residentIds: string[], activityIds: string[]): Promise<void> {
    const operations = this.config.operationsPerBatch;
    
    for (let i = 0; i < operations; i++) {
      const residentId = residentIds[i % residentIds.length];
      const activityId = activityIds[i % activityIds.length];
      
      // Find resident element (mock implementation for stress testing)
      const residentElement = document.createElement('div');
      residentElement.setAttribute('data-testid', `resident-${residentId}`);
      
      // Find activity slot element (mock implementation for stress testing)
      const activityElement = document.createElement('div');
      activityElement.setAttribute('data-testid', `activity-slot-${activityId}`);
      
      // Execute drag sequence
      await this.simulateDragStart(residentId, residentElement);
      await this.simulateDragOver(activityElement);
      await this.simulateDrop(activityElement, activityId);
      
      // Apply cooldown
      if (this.config.cooldownMs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.cooldownMs));
      }
      
      // Check performance thresholds
      if (i % 100 === 0) {
        await this.checkPerformanceThresholds();
      }
    }
  }

  /**
   * Check performance thresholds and abort if exceeded
   */
  private async checkPerformanceThresholds(): Promise<void> {
    // Memory usage check
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = performance.memory as PerformanceMemoryInfo;
      const usedMemory = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      if (usedMemory > this.config.performanceThresholds.maxMemoryGrowth) {
        throw new Error(`Memory threshold exceeded: ${usedMemory.toFixed(2)}MB > ${this.config.performanceThresholds.maxMemoryGrowth}MB`);
      }
    }
    
    // CPU usage simulation (simplified)
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length > 0) {
      const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
      if (avgDuration > this.config.performanceThresholds.maxDropLatency) {
        throw new Error(`Latency threshold exceeded: ${avgDuration.toFixed(2)}ms > ${this.config.performanceThresholds.maxDropLatency}ms`);
      }
    }
  }

  /**
   * Execute full stress test suite
   */
  async executeStressTest(): Promise<StressMetrics[]> {
    this.metrics = [];
    
    // Generate test data
    this.residentIds = this.generateTestResidents(this.config.batchSize);
    const activityIds = Object.keys(DEFAULT_IDLE_VILLAGE_CONFIG.activities || {}).slice(0, 10);
    
    if (activityIds.length === 0) {
      throw new Error('No activities found in default config');
    }
    
    const startTime = performance.now();
    
    try {
      // Execute batches
      for (let batchIndex = 0; batchIndex < this.config.batchSize; batchIndex++) {
        await this.executeBatch(batchIndex, this.residentIds, activityIds);
        
        // Log batch completion
        console.log(`Batch ${batchIndex + 1}/${this.config.batchSize} completed`);
      }
      
      const totalDuration = performance.now() - startTime;
      console.log(`Stress test completed in ${totalDuration.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Stress test failed:', error);
      throw error;
    }
    
    return this.metrics;
  }

  /**
   * Calculate performance statistics
   */
  calculateStatistics(): {
    totalOperations: number;
    averageLatency: number;
    maxLatency: number;
    errorRate: number;
    throughput: number; // operations per second
  } {
    const totalOperations = this.metrics.length;
    const errors = this.metrics.filter(m => m.error).length;
    const durations = this.metrics.map(m => m.duration);
    const averageLatency = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxLatency = Math.max(...durations);
    const errorRate = (errors / totalOperations) * 100;
    
    const totalTime = this.metrics[this.metrics.length - 1]?.timestamp - this.metrics[0]?.timestamp || 0;
    const throughput = totalTime > 0 ? (totalOperations / totalTime) * 1000 : 0;
    
    return {
      totalOperations,
      averageLatency,
      maxLatency,
      errorRate,
      throughput,
    };
  }

  /**
   * Export metrics to CSV format
   */
  exportToCSV(): string {
    const headers = [
      'batchIndex',
      'operationIndex',
      'operationType',
      'timestamp',
      'duration',
      'memoryUsage',
      'cpuUsage',
      'error',
    ];
    
    const rows = this.metrics.map(metric => [
      metric.batchIndex,
      metric.operationIndex,
      metric.operationType,
      metric.timestamp,
      metric.duration,
      metric.memoryUsage || '',
      metric.cpuUsage || '',
      metric.error || '',
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.mockTimers) {
      vi.clearAllTimers();
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.metrics = [];
    this.residentIds = [];
  }
}

/**
 * Utility function to run stress test with reporting
 */
export async function runDragStressTest(config?: Partial<DragStressConfig>): Promise<{
  metrics: StressMetrics[];
  statistics: ReturnType<IdleVillageDragHarness['calculateStatistics']>;
  csvReport: string;
}> {
  const harness = new IdleVillageDragHarness(config);
  
  try {
    const metrics = await harness.executeStressTest();
    const statistics = harness.calculateStatistics();
    const csvReport = harness.exportToCSV();
    
    return {
      metrics,
      statistics,
      csvReport,
    };
  } finally {
    harness.cleanup();
  }
}
