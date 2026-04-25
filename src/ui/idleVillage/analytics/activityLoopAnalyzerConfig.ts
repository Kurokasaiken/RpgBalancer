/**
 * Idle Village Activity Loop Bottleneck Analyzer Configuration
 * 
 * Configuration for activity loop bottleneck analysis, KPI tracking,
 * and severity assessment for activity throughput analysis.
 */

import { z } from 'zod';

/**
 * Activity loop event types
 */
export const ActivityLoopEventTypeSchema = z.enum([
  'activityStarted',
  'activityCompleted',
  'activityFailed',
  'activityCancelled',
  'activityPaused',
  'activityResumed',
]);

export type ActivityLoopEventType = z.infer<typeof ActivityLoopEventTypeSchema>;

/**
 * Activity loop event data
 */
export interface ActivityLoopEvent {
  /** Unique event identifier */
  id: string;
  /** Event type */
  type: ActivityLoopEventType;
  /** Timestamp when event occurred */
  timestamp: number;
  /** Activity ID */
  activityId: string;
  /** Activity type */
  activityType: 'job' | 'quest' | 'maintenance' | 'exploration';
  /** Crew member ID */
  crewId: string;
  /** Session ID */
  sessionId: string;
  /** Event duration in seconds */
  duration?: number;
  /** Additional metadata */
  metadata: Record<string, unknown>;
  /** Queue position at event time */
  queuePosition?: number;
  /** Current backlog size */
  backlogSize?: number;
}

/**
 * Activity loop metrics
 */
export interface ActivityLoopMetrics {
  /** Total activities started */
  totalStarted: number;
  /** Total activities completed */
  totalCompleted: number;
  /** Total activities failed */
  totalFailed: number;
  /** Total activities cancelled */
  totalCancelled: number;
  /** Current backlog size */
  currentBacklog: number;
  /** Average backlog size */
  averageBacklog: number;
  /** Maximum backlog size */
  maxBacklog: number;
  /** Throughput rate (activities per hour) */
  throughputRate: number;
  /** Average completion time */
  averageCompletionTime: number;
  /** Failure rate percentage */
  failureRate: number;
  /** Cancellation rate percentage */
  cancellationRate: number;
  /** Queue wait time average */
  averageQueueWait: number;
}

/**
 * Bottleneck severity levels
 */
export const BottleneckSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export type BottleneckSeverity = z.infer<typeof BottleneckSeveritySchema>;

/**
 * Activity bottleneck analysis result
 */
export interface ActivityBottleneck {
  /** Activity ID */
  activityId: string;
  /** Activity type */
  activityType: string;
  /** Severity level */
  severity: BottleneckSeverity;
  /** Bottleneck type */
  bottleneckType: 'queue' | 'completion' | 'failure' | 'resource';
  /** Current metrics */
  currentMetrics: ActivityLoopMetrics;
  /** Target metrics */
  targetMetrics: ActivityLoopMetrics;
  /** Deviation percentage */
  deviationPercentage: number;
  /** Impact score */
  impactScore: number;
  /** Recommended actions */
  recommendations: string[];
  /** Time window of analysis */
  timeWindow: {
    start: number;
    end: number;
    duration: number;
  };
}

/**
 * Activity loop analysis configuration
 */
export interface ActivityLoopConfig {
  /** KPI targets */
  kpiTargets: {
    /** Target throughput rate (activities per hour) */
    targetThroughputRate: number;
    /** Maximum acceptable backlog size */
    maxBacklog: number;
    /** Maximum acceptable failure rate (percentage) */
    maxFailureRate: number;
    /** Maximum acceptable cancellation rate (percentage) */
    maxCancellationRate: number;
    /** Maximum acceptable average completion time (seconds) */
    maxAverageCompletionTime: number;
    /** Maximum acceptable queue wait time (seconds) */
    maxAverageQueueWait: number;
  };
  /** Alert thresholds */
  alertThresholds: {
    /** Low severity threshold */
    low: number;
    /** Medium severity threshold */
    medium: number;
    /** High severity threshold */
    high: number;
    /** Critical severity threshold */
    critical: number;
  };
  /** Analysis settings */
  analysis: {
    /** Time window for analysis (in hours) */
    timeWindowHours: number;
    /** Minimum data points for reliable analysis */
    minDataPoints: number;
    /** Smoothing factor for trend calculation */
    smoothingFactor: number;
    /** Enable trend analysis */
    enableTrendAnalysis: boolean;
    /** Enable predictive analysis */
    enablePredictiveAnalysis: boolean;
  };
  /** Display settings */
  display: {
    /** Show severity badges */
    showSeverityBadges: boolean;
    /** Show trend indicators */
    showTrendIndicators: boolean;
    /** Show recommendations */
    showRecommendations: boolean;
    /** Show detailed metrics */
    showDetailedMetrics: boolean;
    /** Chart refresh interval (seconds) */
    chartRefreshInterval: number;
    /** Maximum chart data points */
    maxChartDataPoints: number;
  };
}

/**
 * Color palette configuration
 */
export const ActivityLoopColorPaletteSchema = z.object({
  /** Low severity color */
  low: z.string().describe('Color for low severity bottlenecks'),
  /** Medium severity color */
  medium: z.string().describe('Color for medium severity bottlenecks'),
  /** High severity color */
  high: z.string().describe('Color for high severity bottlenecks'),
  /** Critical severity color */
  critical: z.string().describe('Color for critical severity bottlenecks'),
  /** Background color */
  background: z.string().describe('Background color for dashboard'),
  /** Text color */
  text: z.string().describe('Text color for dashboard'),
  /** Grid color */
  grid: z.string().describe('Grid color for charts'),
  /** Chart colors */
  charts: z.object({
    throughput: z.string().describe('Color for throughput chart'),
    backlog: z.string().describe('Color for backlog chart'),
    failure: z.string().describe('Color for failure rate chart'),
    queue: z.string().describe('Color for queue wait chart'),
  }),
});

export type ActivityLoopColorPalette = z.infer<typeof ActivityLoopColorPaletteSchema>;

/**
 * Complete activity loop configuration
 */
export const ActivityLoopAnalyzerConfigSchema = z.object({
  config: ActivityLoopConfig,
  palette: ActivityLoopColorPaletteSchema,
});

export type ActivityLoopAnalyzerConfig = z.infer<typeof ActivityLoopAnalyzerConfigSchema>;

/**
 * Default configuration
 */
export const DEFAULT_ACTIVITY_LOOP_CONFIG: ActivityLoopConfig = {
  kpiTargets: {
    targetThroughputRate: 10.0, // 10 activities per hour
    maxBacklog: 50,
    maxFailureRate: 5.0, // 5%
    maxCancellationRate: 2.0, // 2%
    maxAverageCompletionTime: 300, // 5 minutes
    maxAverageQueueWait: 60, // 1 minute
  },
  alertThresholds: {
    low: 10,
    medium: 25,
    high: 50,
    critical: 75,
  },
  analysis: {
    timeWindowHours: 24, // 24 hours
    minDataPoints: 10,
    smoothingFactor: 0.3,
    enableTrendAnalysis: true,
    enablePredictiveAnalysis: false,
  },
  display: {
    showSeverityBadges: true,
    showTrendIndicators: true,
    showRecommendations: true,
    showDetailedMetrics: true,
    chartRefreshInterval: 30, // 30 seconds
    maxChartDataPoints: 100,
  },
};

/**
 * Default color palette
 */
export const DEFAULT_ACTIVITY_LOOP_PALETTE: ActivityLoopColorPalette = {
  low: '#10b981', // green-500
  medium: '#f59e0b', // amber-500
  high: '#ef4444', // red-500
  critical: '#dc2626', // red-600
  background: '#1f2937', // gray-800
  text: '#f3f4f6', // gray-100
  grid: '#374151', // gray-700
  charts: {
    throughput: '#3b82f6', // blue-500
    backlog: '#f59e0b', // amber-500
    failure: '#ef4444', // red-500
    queue: '#8b5cf6', // violet-500
  },
};

/**
 * Default complete configuration
 */
export const DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG: ActivityLoopAnalyzerConfig = {
  config: DEFAULT_ACTIVITY_LOOP_CONFIG,
  palette: DEFAULT_ACTIVITY_LOOP_PALETTE,
};

/**
 * Preset configurations
 */
export const ACTIVITY_LOOP_PRESETS = {
  /** Real-time monitoring preset */
  realtime: {
    ...DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG,
    config: {
      ...DEFAULT_ACTIVITY_LOOP_CONFIG,
      analysis: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.analysis,
        timeWindowHours: 1, // 1 hour
        minDataPoints: 5,
      },
      display: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.display,
        chartRefreshInterval: 10, // 10 seconds
      },
    },
  },
  
  /** Daily analysis preset */
  daily: {
    ...DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG,
    config: {
      ...DEFAULT_ACTIVITY_LOOP_CONFIG,
      analysis: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.analysis,
        timeWindowHours: 24, // 24 hours
        minDataPoints: 50,
      },
      display: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.display,
        chartRefreshInterval: 60, // 1 minute
      },
    },
  },
  
  /** Weekly analysis preset */
  weekly: {
    ...DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG,
    config: {
      ...DEFAULT_ACTIVITY_LOOP_CONFIG,
      analysis: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.analysis,
        timeWindowHours: 168, // 7 days
        minDataPoints: 100,
      },
      display: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.display,
        chartRefreshInterval: 300, // 5 minutes
      },
    },
  },
  
  /** Performance monitoring preset */
  performance: {
    ...DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG,
    config: {
      ...DEFAULT_ACTIVITY_LOOP_CONFIG,
      kpiTargets: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.kpiTargets,
        targetThroughputRate: 15.0, // Higher target
        maxBacklogSize: 25, // Lower backlog
        maxFailureRate: 2.0, // Lower failure rate
        maxAverageCompletionTime: 180, // Faster completion
      },
      alertThresholds: {
        ...DEFAULT_ACTIVITY_LOOP_CONFIG.alertThresholds,
        low: 5,
        medium: 15,
        high: 30,
        critical: 50,
      },
    },
  },
} as const;

/**
 * Activity loop preset type
 */
export type ActivityLoopPreset = keyof typeof ACTIVITY_LOOP_PRESETS;

/**
 * Export configuration
 */
export interface ActivityLoopExportConfig {
  /** Include raw events */
  includeRawEvents: boolean;
  /** Include bottlenecks */
  includeBottlenecks: boolean;
  /** Include metrics */
  includeMetrics: boolean;
  /** Include recommendations */
  includeRecommendations: boolean;
  /** Export format */
  format: 'json' | 'csv' | 'markdown';
  /** Time range */
  timeRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Activity loop filter configuration
 */
export interface ActivityLoopFilters {
  /** Activity types to include */
  activityTypes?: string[];
  /** Crew IDs to include */
  crewIds?: string[];
  /** Severity levels to include */
  severityLevels?: BottleneckSeverity[];
  /** Bottleneck types to include */
  bottleneckTypes?: string[];
  /** Time range */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** Minimum impact score */
  minImpactScore?: number;
}

/**
 * Activity loop analysis state
 */
export interface ActivityLoopState {
  /** Current events */
  events: ActivityLoopEvent[];
  /** Current bottlenecks */
  bottlenecks: ActivityBottleneck[];
  /** Current metrics */
  metrics: ActivityLoopMetrics;
  /** Current configuration */
  config: ActivityLoopAnalyzerConfig;
  /** Current filters */
  filters: ActivityLoopFilters;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number;
  /** Auto-refresh enabled */
  autoRefreshEnabled: boolean;
}
