/**
 * Types for Latency Profiler
 */

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
