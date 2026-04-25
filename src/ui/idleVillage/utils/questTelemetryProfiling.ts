/**
 * Quest Telemetry Performance Profiling
 * 
 * Performance profiling utilities for quest telemetry operations.
 * Provides Performance.mark based profiling and benchmarking tools
 * for measuring the impact of telemetry views and optimizations.
 * 
 * @since IV-QuestTelemetry-performance
 * @author Atlas-Perf
 */

/**
 * Performance measurement interface
 */
export interface PerformanceMeasurement {
  /** Measurement name */
  name: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Benchmark result interface
 */
export interface BenchmarkResult {
  /** Benchmark name */
  name: string;
  /** Number of iterations */
  iterations: number;
  /** Total duration in milliseconds */
  totalDuration: number;
  /** Average duration per iteration */
  averageDuration: number;
  /** Minimum duration */
  minDuration: number;
  /** Maximum duration */
  maxDuration: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Operations per second */
  opsPerSecond: number;
  /** Memory usage before benchmark */
  memoryBefore?: number;
  /** Memory usage after benchmark */
  memoryAfter?: number;
}

/**
 * Performance profiler class
 */
export class QuestTelemetryProfiler {
  private measurements: PerformanceMeasurement[] = [];
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled && typeof performance !== 'undefined';
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string, metadata?: Record<string, unknown>): string {
    if (!this.enabled) return '';
    
    const markName = `quest-telemetry-${name}-${Date.now()}`;
    const startTime = performance.now();
    
    performance.mark(`${markName}-start`);
    
    const measurement: PerformanceMeasurement = {
      name,
      startTime,
      endTime: 0,
      duration: 0,
      metadata,
    };
    
    this.measurements.push(measurement);
    return markName;
  }

  /**
   * End a performance measurement
   */
  endMeasurement(markName: string): PerformanceMeasurement | null {
    if (!this.enabled || !markName) return null;
    
    const endTime = performance.now();
    performance.mark(`${markName}-end`);
    
    // Find the measurement
    const measurement = this.measurements.find(m => 
      m.startTime > 0 && m.endTime === 0
    );
    
    if (measurement) {
      measurement.endTime = endTime;
      measurement.duration = endTime - measurement.startTime;
      
      // Create performance entry
      try {
        performance.measure(
          measurement.name,
          `${markName}-start`,
          `${markName}-end`
        );
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
    
    return measurement || null;
  }

  /**
   * Measure a function execution time
   */
  async measureFunction<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<{ result: T; measurement: PerformanceMeasurement | null }> {
    const markName = this.startMeasurement(name, metadata);
    
    try {
      const result = await fn();
      const measurement = this.endMeasurement(markName);
      
      return { result, measurement };
    } catch (error) {
      this.endMeasurement(markName);
      throw error;
    }
  }

  /**
   * Run a benchmark test
   */
  async benchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations = 1000
  ): Promise<BenchmarkResult> {
    if (!this.enabled) {
      return {
        name,
        iterations,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        standardDeviation: 0,
        opsPerSecond: 0,
      };
    }

    const memoryBefore = this.getMemoryUsage();
    const durations: number[] = [];
    
    // Warm up
    for (let i = 0; i < Math.min(10, iterations / 10); i++) {
      await fn();
    }
    
    // Actual benchmark
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      await fn();
      const iterationEnd = performance.now();
      durations.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();
    
    // Calculate statistics
    const totalDuration = endTime - startTime;
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    // Calculate standard deviation
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - averageDuration, 2), 0) / durations.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      name,
      iterations,
      totalDuration,
      averageDuration,
      minDuration,
      maxDuration,
      standardDeviation,
      opsPerSecond: 1000 / averageDuration,
      memoryBefore,
      memoryAfter,
    };
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Get all measurements
   */
  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }

  /**
   * Get measurements by name
   */
  getMeasurementsByName(name: string): PerformanceMeasurement[] {
    return this.measurements.filter(m => m.name === name);
  }

  /**
   * Clear all measurements
   */
  clearMeasurements(): void {
    this.measurements = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const measurements = this.getMeasurements();
    
    if (measurements.length === 0) {
      return 'No performance measurements recorded.';
    }
    
    const report = [
      '# Quest Telemetry Performance Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Measurements Summary',
      '',
    ];
    
    // Group measurements by name
    const grouped = measurements.reduce((groups, measurement) => {
      if (!groups[measurement.name]) {
        groups[measurement.name] = [];
      }
      groups[measurement.name].push(measurement);
      return groups;
    }, {} as Record<string, PerformanceMeasurement[]>);
    
    // Generate statistics for each measurement group
    Object.entries(grouped).forEach(([name, group]) => {
      const durations = group.map(m => m.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      report.push(`### ${name}`);
      report.push(`- Count: ${group.length}`);
      report.push(`- Average: ${avgDuration.toFixed(2)}ms`);
      report.push(`- Min: ${minDuration.toFixed(2)}ms`);
      report.push(`- Max: ${maxDuration.toFixed(2)}ms`);
      report.push('');
    });
    
    // Add slowest measurements
    const slowest = measurements
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    if (slowest.length > 0) {
      report.push('## Slowest Measurements');
      report.push('');
      slowest.forEach((measurement, index) => {
        report.push(`${index + 1}. ${measurement.name}: ${measurement.duration.toFixed(2)}ms`);
      });
      report.push('');
    }
    
    return report.join('\n');
  }

  /**
   * Enable/disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled && typeof performance !== 'undefined';
  }

  /**
   * Check if profiling is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Global profiler instance
 */
export const questTelemetryProfiler = new QuestTelemetryProfiler();

/**
 * Performance profiling hook for React components
 */
export function useQuestTelemetryProfiling() {
  const profiler = questTelemetryProfiler;
  
  return {
    startMeasurement: profiler.startMeasurement.bind(profiler),
    endMeasurement: profiler.endMeasurement.bind(profiler),
    measureFunction: profiler.measureFunction.bind(profiler),
    benchmark: profiler.benchmark.bind(profiler),
    getMeasurements: profiler.getMeasurements.bind(profiler),
    clearMeasurements: profiler.clearMeasurements.bind(profiler),
    generateReport: profiler.generateReport.bind(profiler),
    isEnabled: profiler.isEnabled.bind(profiler),
    setEnabled: profiler.setEnabled.bind(profiler),
  };
}

/**
 * Performance monitoring decorator for functions
 */
export function profileQuestFunction(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const markName = questTelemetryProfiler.startMeasurement(name, {
        className: target.constructor.name,
        methodName: propertyKey,
        argsCount: args.length,
      });
      
      try {
        const result = await originalMethod.apply(this, args);
        questTelemetryProfiler.endMeasurement(markName);
        return result;
      } catch (error) {
        questTelemetryProfiler.endMeasurement(markName);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Performance monitoring utility for common operations
 */
export const QuestTelemetryPerformance = {
  /**
   * Profile telemetry aggregation
   */
  profileAggregation: async (entries: any[], aggregationFn: () => any) => {
    return questTelemetryProfiler.measureFunction(
      'telemetry-aggregation',
      () => aggregationFn(),
      { entryCount: entries.length }
    );
  },

  /**
   * Profile selector execution
   */
  profileSelector: async (selectorName: string, selectorFn: () => any) => {
    return questTelemetryProfiler.measureFunction(
      `selector-${selectorName}`,
      selectorFn,
      { selectorType: 'quest-telemetry' }
    );
  },

  /**
   * Profile data transformation
   */
  profileTransformation: async (transformName: string, transformFn: () => any, dataSize: number) => {
    return questTelemetryProfiler.measureFunction(
      `transform-${transformName}`,
      transformFn,
      { dataSize, transformType: 'quest-telemetry' }
    );
  },

  /**
   * Benchmark common operations
   */
  benchmarks: {
    /**
     * Benchmark telemetry aggregation with 1k entries
     */
    benchmarkAggregation: async (entries: any[], iterations = 1000) => {
      return questTelemetryProfiler.benchmark(
        'aggregation-1k-entries',
        () => {
          // Simulate aggregation work
          entries.reduce((acc, entry) => {
            acc.total += entry.value || 0;
            acc.count += 1;
            return acc;
          }, { total: 0, count: 0 });
        },
        iterations
      );
    },

    /**
     * Benchmark selector filtering
     */
    benchmarkSelectorFiltering: async (entries: any[], iterations = 1000) => {
      return questTelemetryProfiler.benchmark(
        'selector-filtering-1k-entries',
        () => {
          // Simulate selector filtering work
          entries.filter(entry => entry.success && entry.duration > 1000);
        },
        iterations
      );
    },

    /**
     * Benchmark data transformation
     */
    benchmarkDataTransformation: async (entries: any[], iterations = 1000) => {
      return questTelemetryProfiler.benchmark(
        'data-transformation-1k-entries',
        () => {
          // Simulate data transformation work
          entries.map(entry => ({
            ...entry,
            formattedDuration: `${entry.duration}ms`,
            successRate: entry.success ? 1 : 0,
            riskLevel: entry.duration > 5000 ? 'high' : entry.duration > 2000 ? 'medium' : 'low',
          }));
        },
        iterations
      );
    },
  },
};
