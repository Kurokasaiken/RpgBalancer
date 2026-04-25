/**
 * Active HUD Performance Profiler Configuration
 * 
 * Config-first performance monitoring settings for Idle Village Active HUD.
 * Defines metrics, sampling rates, thresholds, and export formats.
 * 
 * @since NP-104 – Idle Village Active HUD Performance Profiler
 * @dependencies Phase 12 Active HUD
 */

import { z } from 'zod';

/**
 * Performance metric types that can be tracked
 */
export type PerformanceMetricType = 
  | 'fps'                    // Frames per second
  | 'render_time'           // React render time
  | 'commit_time'           // React commit time
  | 'drop_latency'          // Drag/drop operation latency
  | 'memory_usage'          // Memory consumption
  | 'component_mounts'      // Component mount/unmount frequency
  | 'state_updates'         // State update frequency
  | 'interaction_latency';  // User interaction response time

/**
 * Performance threshold levels
 */
export type PerformanceThreshold = 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';

/**
 * Performance metric configuration
 */
export interface PerformanceMetricConfig {
  /** Metric identifier */
  id: PerformanceMetricType;
  /** Human-readable name */
  name: string;
  /** Description of what this metric measures */
  description: string;
  /** Unit of measurement */
  unit: 'fps' | 'ms' | 'mb' | 'count' | 'bytes' | 'hz';
  /** Sampling rate (0-1) */
  samplingRate: number;
  /** Whether this metric is enabled by default */
  enabled: boolean;
  /** Performance thresholds for different quality levels */
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
    critical: number;
  };
  /** Collection method configuration */
  collection: {
    /** Collection interval in milliseconds */
    interval: number;
    /** Maximum samples to keep in memory */
    maxSamples: number;
    /** Whether to use high-precision timing */
    highPrecision: boolean;
  };
}

/**
 * Export format configuration
 */
export interface ExportFormatConfig {
  /** Export format identifier */
  id: 'json' | 'csv' | 'markdown' | 'png';
  /** Format name */
  name: string;
  /** File extension */
  extension: string;
  /** MIME type */
  mimeType: string;
  /** Whether this format is available */
  available: boolean;
  /** Export-specific options */
  options: {
    /** Include raw data points */
    includeRawData: boolean;
    /** Include aggregated statistics */
    includeAggregates: boolean;
    /** Include performance graphs */
    includeGraphs: boolean;
    /** Include metadata */
    includeMetadata: boolean;
  };
}

/**
 * Profiler configuration schema
 */
export const ActiveHUDProfilerConfigSchema = z.object({
  /** Overall profiler settings */
  profiler: z.object({
    /** Whether profiling is enabled */
    enabled: z.boolean().default(false),
    /** Auto-start profiling on HUD mount */
    autoStart: z.boolean().default(false),
    /** Maximum profiling duration in milliseconds */
    maxDuration: z.number().default(300000), // 5 minutes
    /** Performance impact mitigation */
    performanceImpact: z.object({
      /** Maximum CPU usage percentage allowed */
      maxCpuUsage: z.number().default(5),
      /** Maximum memory overhead in MB */
      maxMemoryOverhead: z.number().default(10),
      /** Adaptive sampling enabled */
      adaptiveSampling: z.boolean().default(true),
    }),
  }),
  /** Metrics configuration */
  metrics: z.array(z.object({
    id: z.enum(['fps', 'render_time', 'commit_time', 'drop_latency', 'memory_usage', 'component_mounts', 'state_updates', 'interaction_latency']),
    name: z.string(),
    description: z.string(),
    unit: z.enum(['fps', 'ms', 'mb', 'count', 'bytes', 'hz']),
    samplingRate: z.number().min(0).max(1),
    enabled: z.boolean(),
    thresholds: z.object({
      excellent: z.number(),
      good: z.number(),
      acceptable: z.number(),
      poor: z.number(),
      critical: z.number(),
    }),
    collection: z.object({
      interval: z.number().positive(),
      maxSamples: z.number().positive(),
      highPrecision: z.boolean(),
    }),
  })),
  /** Export formats configuration */
  exports: z.array(z.object({
    id: z.enum(['json', 'csv', 'markdown', 'png']),
    name: z.string(),
    extension: z.string(),
    mimeType: z.string(),
    available: z.boolean(),
    options: z.object({
      includeRawData: z.boolean(),
      includeAggregates: z.boolean(),
      includeGraphs: z.boolean(),
      includeMetadata: z.boolean(),
    }),
  })),
  /** UI configuration */
  ui: z.object({
    /** Panel visibility */
    panelVisible: z.boolean().default(false),
    /** Panel position */
    panelPosition: z.enum(['top-right', 'top-left', 'bottom-right', 'bottom-left']).default('top-right'),
    /** Compact mode */
    compactMode: z.boolean().default(false),
    /** Real-time updates */
    realTimeUpdates: z.boolean().default(true),
    /** Update interval for UI */
    updateInterval: z.number().default(100), // 100ms
    /** Color scheme */
    colorScheme: z.object({
      excellent: z.string().default('#10b981'), // green-500
      good: z.string().default('#3b82f6'), // blue-500
      acceptable: z.string().default('#f59e0b'), // amber-500
      poor: z.string().default('#ef4444'), // red-500
      critical: z.string().default('#991b1b'), // red-800
    }),
  }),
  /** Telemetry configuration */
  telemetry: z.object({
    /** Enable telemetry emission */
    enabled: z.boolean().default(true),
    /** Telemetry event name */
    eventName: z.string().default('iv_active_hud_profiled'),
    /** Sampling rate for telemetry events */
    samplingRate: z.number().default(0.1), // 10% sampling
    /** Include sensitive data in telemetry */
    includeSensitiveData: z.boolean().default(false),
  }),
});

export type ActiveHUDProfilerConfig = z.infer<typeof ActiveHUDProfilerConfigSchema>;

/**
 * Default performance metrics configuration
 */
export const DEFAULT_PERFORMANCE_METRICS: PerformanceMetricConfig[] = [
  {
    id: 'fps',
    name: 'Frames Per Second',
    description: 'Rendering frame rate of the Active HUD',
    unit: 'fps',
    samplingRate: 1.0, // Always sample FPS
    enabled: true,
    thresholds: {
      excellent: 60,
      good: 45,
      acceptable: 30,
      poor: 20,
      critical: 15,
    },
    collection: {
      interval: 1000, // 1 second
      maxSamples: 60, // 1 minute of data
      highPrecision: true,
    },
  },
  {
    id: 'render_time',
    name: 'Render Time',
    description: 'Time taken for React render phase',
    unit: 'ms',
    samplingRate: 0.5, // 50% sampling
    enabled: true,
    thresholds: {
      excellent: 8,
      good: 16,
      acceptable: 33,
      poor: 50,
      critical: 100,
    },
    collection: {
      interval: 100, // 100ms
      maxSamples: 300, // 30 seconds of data
      highPrecision: true,
    },
  },
  {
    id: 'commit_time',
    name: 'Commit Time',
    description: 'Time taken for React commit phase',
    unit: 'ms',
    samplingRate: 0.3, // 30% sampling
    enabled: true,
    thresholds: {
      excellent: 4,
      good: 8,
      acceptable: 16,
      poor: 25,
      critical: 50,
    },
    collection: {
      interval: 100, // 100ms
      maxSamples: 300, // 30 seconds of data
      highPrecision: true,
    },
  },
  {
    id: 'drop_latency',
    name: 'Drag/Drop Latency',
    description: 'Time from drag start to drop completion',
    unit: 'ms',
    samplingRate: 1.0, // Always sample drop operations
    enabled: true,
    thresholds: {
      excellent: 50,
      good: 100,
      acceptable: 200,
      poor: 400,
      critical: 800,
    },
    collection: {
      interval: 0, // Event-based
      maxSamples: 50, // Last 50 drop operations
      highPrecision: true,
    },
  },
  {
    id: 'memory_usage',
    name: 'Memory Usage',
    description: 'JavaScript heap memory consumption',
    unit: 'mb',
    samplingRate: 0.1, // 10% sampling
    enabled: false, // Disabled by default due to performance impact
    thresholds: {
      excellent: 50,
      good: 100,
      acceptable: 200,
      poor: 400,
      critical: 800,
    },
    collection: {
      interval: 5000, // 5 seconds
      maxSamples: 12, // 1 minute of data
      highPrecision: false,
    },
  },
  {
    id: 'component_mounts',
    name: 'Component Mounts',
    description: 'Frequency of component mount/unmount operations',
    unit: 'hz',
    samplingRate: 0.2, // 20% sampling
    enabled: false, // Disabled by default
    thresholds: {
      excellent: 1,
      good: 5,
      acceptable: 10,
      poor: 20,
      critical: 50,
    },
    collection: {
      interval: 1000, // 1 second
      maxSamples: 60, // 1 minute of data
      highPrecision: false,
    },
  },
  {
    id: 'state_updates',
    name: 'State Updates',
    description: 'Frequency of React state updates',
    unit: 'hz',
    samplingRate: 0.3, // 30% sampling
    enabled: false, // Disabled by default
    thresholds: {
      excellent: 5,
      good: 15,
      acceptable: 30,
      poor: 60,
      critical: 120,
    },
    collection: {
      interval: 1000, // 1 second
      maxSamples: 60, // 1 minute of data
      highPrecision: false,
    },
  },
  {
    id: 'interaction_latency',
    name: 'Interaction Latency',
    description: 'Time from user interaction to UI response',
    unit: 'ms',
    samplingRate: 0.8, // 80% sampling
    enabled: true,
    thresholds: {
      excellent: 16,
      good: 50,
      acceptable: 100,
      poor: 200,
      critical: 400,
    },
    collection: {
      interval: 0, // Event-based
      maxSamples: 100, // Last 100 interactions
      highPrecision: true,
    },
  },
];

/**
 * Default export formats configuration
 */
export const DEFAULT_EXPORT_FORMATS: ExportFormatConfig[] = [
  {
    id: 'json',
    name: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
    available: true,
    options: {
      includeRawData: true,
      includeAggregates: true,
      includeGraphs: false,
      includeMetadata: true,
    },
  },
  {
    id: 'csv',
    name: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
    available: true,
    options: {
      includeRawData: true,
      includeAggregates: true,
      includeGraphs: false,
      includeMetadata: false,
    },
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extension: 'md',
    mimeType: 'text/markdown',
    available: true,
    options: {
      includeRawData: false,
      includeAggregates: true,
      includeGraphs: true,
      includeMetadata: true,
    },
  },
  {
    id: 'png',
    name: 'PNG Chart',
    extension: 'png',
    mimeType: 'image/png',
    available: false, // Requires chart library integration
    options: {
      includeRawData: false,
      includeAggregates: true,
      includeGraphs: true,
      includeMetadata: false,
    },
  },
];

/**
 * Default Active HUD profiler configuration
 */
export const DEFAULT_ACTIVE_HUD_PROFILER_CONFIG: ActiveHUDProfilerConfig = {
  profiler: {
    enabled: false,
    autoStart: false,
    maxDuration: 300000, // 5 minutes
    performanceImpact: {
      maxCpuUsage: 5,
      maxMemoryOverhead: 10,
      adaptiveSampling: true,
    },
  },
  metrics: DEFAULT_PERFORMANCE_METRICS,
  exports: DEFAULT_EXPORT_FORMATS,
  ui: {
    panelVisible: false,
    panelPosition: 'top-right',
    compactMode: false,
    realTimeUpdates: true,
    updateInterval: 100,
    colorScheme: {
      excellent: '#10b981',
      good: '#3b82f6',
      acceptable: '#f59e0b',
      poor: '#ef4444',
      critical: '#991b1b',
    },
  },
  telemetry: {
    enabled: true,
    eventName: 'iv_active_hud_profiled',
    samplingRate: 0.1,
    includeSensitiveData: false,
  },
};

/**
 * Get performance threshold for a given metric value
 */
export function getPerformanceThreshold(
  metric: PerformanceMetricConfig,
  value: number
): PerformanceThreshold {
  if (value >= metric.thresholds.excellent) return 'excellent';
  if (value >= metric.thresholds.good) return 'good';
  if (value >= metric.thresholds.acceptable) return 'acceptable';
  if (value >= metric.thresholds.poor) return 'poor';
  return 'critical';
}

/**
 * Get color for performance threshold
 */
export function getPerformanceColor(
  config: ActiveHUDProfilerConfig,
  threshold: PerformanceThreshold
): string {
  return config.ui.colorScheme[threshold];
}

/**
 * Validate profiler configuration
 */
export function validateProfilerConfig(
  config: Partial<ActiveHUDProfilerConfig>
): { valid: boolean; errors: string[] } {
  const result = ActiveHUDProfilerConfigSchema.safeParse(config);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
  };
}

export default DEFAULT_ACTIVE_HUD_PROFILER_CONFIG;
