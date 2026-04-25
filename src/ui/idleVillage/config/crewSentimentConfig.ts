/**
 * Idle Village Crew Sentiment Configuration
 * 
 * Configuration for crew sentiment tracking, diff calculation, and visualization.
 * Includes metrics definitions, thresholds, and display preferences.
 */

import { z } from 'zod';

/**
 * Crew sentiment metrics
 */
export const CrewSentimentMetricSchema = z.enum(['stress', 'morale', 'satisfaction', 'productivity']);

export type CrewSentimentMetric = z.infer<typeof CrewSentimentMetricSchema>;

/**
 * Sentiment value range and validation
 */
export const SentimentValueSchema = z.number().min(0).max(1);

export type SentimentValue = z.infer<typeof SentimentValueSchema>;

/**
 * Sentiment data point
 */
export interface SentimentDataPoint {
  /** Timestamp of the measurement */
  timestamp: number;
  /** Crew member ID */
  crewId: string;
  /** Turn number */
  turn: number;
  /** Session ID */
  sessionId: string;
  /** Sentiment metrics values */
  metrics: Record<CrewSentimentMetric, SentimentValue>;
  /** Additional context */
  context: {
    activity: string;
    location: string;
    crewSize: number;
    workload: number;
    environment: string;
  };
}

/**
 * Sentiment diff calculation result
 */
export interface SentimentDiff {
  /** Metric name */
  metric: CrewSentimentMetric;
  /** Current value */
  currentValue: SentimentValue;
  /** Previous value */
  previousValue: SentimentValue;
  /** Absolute difference */
  absoluteDiff: number;
  /** Percentage difference */
  percentageDiff: number;
  /** Diff direction */
  direction: 'up' | 'down' | 'neutral';
  /** Significance level */
  significance: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Aggregated sentiment data for a turn
 */
export interface AggregatedSentiment {
  /** Turn number */
  turn: number;
  /** Timestamp */
  timestamp: number;
  /** Average values for each metric */
  averages: Record<CrewSentimentMetric, SentimentValue>;
  /** Number of data points */
  dataPointCount: number;
  /** Standard deviation for each metric */
  standardDeviations: Record<CrewSentimentMetric, number>;
  /** Min and max values */
  ranges: Record<CrewSentimentMetric, { min: SentimentValue; max: SentimentValue }>;
}

/**
 * Sentiment diff configuration
 */
export interface SentimentDiffConfig {
  /** Smoothing factor for diff calculation */
  smoothingFactor: number;
  /** Minimum data points for reliable diff */
  minDataPoints: number;
  /** Threshold for significant changes */
  significanceThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  /** Metrics to track */
  enabledMetrics: CrewSentimentMetric[];
  /** Time window for comparison (in turns) */
  comparisonWindow: number;
}

/**
 * Color palette configuration for sentiment visualization
 */
export const SentimentColorPaletteSchema = z.object({
  /** Positive change color */
  positive: z.string().describe('Color for positive sentiment changes'),
  /** Negative change color */
  negative: z.string().describe('Color for negative sentiment changes'),
  /** Neutral color */
  neutral: z.string().describe('Color for neutral sentiment changes'),
  /** Background color */
  background: z.string().describe('Background color for sentiment panel'),
  /** Text color */
  text: z.string().describe('Text color for sentiment panel'),
  /** Grid color */
  grid: z.string().describe('Grid color for sentiment panel'),
  /** Tooltip background */
  tooltip: z.object({
    background: z.string().describe('Tooltip background color'),
    text: z.string().describe('Tooltip text color'),
    border: z.string().describe('Tooltip border color'),
  }),
  /** Metric-specific colors */
  metrics: z.record(z.string(), z.string()).describe('Colors for specific metrics'),
});

export type SentimentColorPalette = z.infer<typeof SentimentColorPaletteSchema>;

/**
 * Display configuration
 */
export const SentimentDisplayConfigSchema = z.object({
  /** Show sparkline charts */
  showSparklines: z.boolean().describe('Show sparkline charts for metrics'),
  /** Show percentage badges */
  showPercentageBadges: z.boolean().describe('Show percentage change badges'),
  /** Show significance indicators */
  showSignificanceIndicators: z.boolean().describe('Show significance level indicators'),
  /** Enable animations */
  enableAnimations: z.boolean().describe('Enable smooth animations'),
  /** Animation duration in ms */
  animationDuration: z.number().int().positive().describe('Animation duration in milliseconds'),
  /** Panel height in pixels */
  panelHeight: z.number().int().positive().describe('Panel height in pixels'),
  /** Panel width in pixels */
  panelWidth: z.number().int().positive().describe('Panel width in pixels'),
  /** Compact mode */
  compactMode: z.boolean().describe('Use compact layout'),
  /** Auto-refresh interval in seconds */
  autoRefreshInterval: z.number().int().positive().describe('Auto-refresh interval in seconds'),
});

export type SentimentDisplayConfig = z.infer<typeof SentimentDisplayConfigSchema>;

/**
 * Alert thresholds configuration
 */
export const SentimentAlertThresholdsSchema = z.object({
  /** Critical threshold for any metric */
  critical: z.number().min(0).max(1).describe('Critical threshold for any metric'),
  /** High threshold for any metric */
  high: z.number().min(0).max(1).describe('High threshold for any metric'),
  /** Medium threshold for any metric */
  medium: z.number().min(0).max(1).describe('Medium threshold for any metric'),
  /** Low threshold for any metric */
  low: z.number().min(0).max(1).describe('Low threshold for any metric'),
  /** Metric-specific thresholds */
  metricThresholds: z.record(z.string(), z.object({
    critical: z.number().min(0).max(1),
    high: z.number().min(0).max(1),
    medium: z.number().min(0).max(1),
    low: z.number().min(0).max(1),
  })).describe('Metric-specific thresholds'),
});

export type SentimentAlertThresholds = z.infer<typeof SentimentAlertThresholdsSchema>;

/**
 * Complete crew sentiment configuration
 */
export const CrewSentimentConfigSchema = z.object({
  diff: SentimentDiffConfig,
  palette: SentimentColorPaletteSchema,
  display: SentimentDisplayConfig,
  thresholds: SentimentAlertThresholds,
});

export type CrewSentimentConfig = z.infer<typeof CrewSentimentConfigSchema>;

/**
 * Default crew sentiment configuration
 */
export const DEFAULT_CREW_SENTIMENT_CONFIG: CrewSentimentConfig = {
  diff: {
    smoothingFactor: 0.3,
    minDataPoints: 3,
    significanceThresholds: {
      low: 0.05,
      medium: 0.1,
      high: 0.2,
      critical: 0.3,
    },
    enabledMetrics: ['stress', 'morale', 'satisfaction', 'productivity'],
    comparisonWindow: 1, // Compare with previous turn
  },
  palette: {
    positive: '#10b981', // green-500
    negative: '#ef4444', // red-500
    neutral: '#6b7280', // gray-500
    background: '#1f2937', // gray-800
    text: '#f3f4f6', // gray-100
    grid: '#374151', // gray-700
    tooltip: {
      background: '#1f2937', // gray-800
      text: '#f3f4f6', // gray-100
      border: '#374151', // gray-700
    },
    metrics: {
      stress: '#ef4444', // red-500
      morale: '#3b82f6', // blue-500
      satisfaction: '#10b981', // green-500
      productivity: '#f59e0b', // amber-500
    },
  },
  display: {
    showSparklines: true,
    showPercentageBadges: true,
    showSignificanceIndicators: true,
    enableAnimations: true,
    animationDuration: 300,
    panelHeight: 200,
    panelWidth: 400,
    compactMode: false,
    autoRefreshInterval: 30,
  },
  thresholds: {
    critical: 0.8,
    high: 0.6,
    medium: 0.4,
    low: 0.2,
    metricThresholds: {
      stress: { critical: 0.8, high: 0.6, medium: 0.4, low: 0.2 },
      morale: { critical: 0.2, high: 0.3, medium: 0.5, low: 0.7 },
      satisfaction: { critical: 0.2, high: 0.3, medium: 0.5, low: 0.7 },
      productivity: { critical: 0.2, high: 0.3, medium: 0.5, low: 0.7 },
    },
  },
};

/**
 * Preset configurations for different use cases
 */
export const CREW_SENTIMENT_PRESETS = {
  /** Compact view for minimal space usage */
  compact: {
    ...DEFAULT_CREW_SENTIMENT_CONFIG,
    display: {
      ...DEFAULT_CREW_SENTIMENT_CONFIG.display,
      showSparklines: false,
      panelHeight: 120,
      panelWidth: 300,
      compactMode: true,
    },
  },
  
  /** Detailed view for comprehensive analysis */
  detailed: {
    ...DEFAULT_CREW_SENTIMENT_CONFIG,
    display: {
      ...DEFAULT_CREW_SENTIMENT_CONFIG.display,
      panelHeight: 300,
      panelWidth: 600,
      compactMode: false,
    },
  },
  
  /** Performance optimized view */
  performance: {
    ...DEFAULT_CREW_SENTIMENT_CONFIG,
    display: {
      ...DEFAULT_CREW_SENTIMENT_CONFIG.display,
      enableAnimations: false,
      autoRefreshInterval: 60,
    },
    diff: {
      ...DEFAULT_CREW_SENTIMENT_CONFIG.diff,
      smoothingFactor: 0.5,
    },
  },
  
  /** Alert-focused view */
  alertFocused: {
    ...DEFAULT_CREW_SENTIMENT_CONFIG,
    thresholds: {
      ...DEFAULT_CREW_SENTIMENT_CONFIG.thresholds,
      critical: 0.7,
      high: 0.5,
      medium: 0.3,
      low: 0.1,
    },
    diff: {
      ...DEFAULT_CREW_SENTIMENT_CONFIG.diff,
      significanceThresholds: {
        low: 0.02,
        medium: 0.05,
        high: 0.1,
        critical: 0.15,
      },
    },
  },
} as const;

/**
 * Crew sentiment preset type
 */
export type CrewSentimentPreset = keyof typeof CREW_SENTIMENT_PRESETS;

/**
 * Sentiment analysis metrics
 */
export interface SentimentAnalysisMetrics {
  /** Total number of data points analyzed */
  totalDataPoints: number;
  /** Average sentiment values */
  averageSentiments: Record<CrewSentimentMetric, SentimentValue>;
  /** Sentiment trends (up/down/neutral) */
  trends: Record<CrewSentimentMetric, 'up' | 'down' | 'neutral'>;
  /** Volatility metrics */
  volatility: Record<CrewSentimentMetric, number>;
  /** Alert counts by level */
  alertCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Most significant change */
  mostSignificantChange: {
    metric: CrewSentimentMetric;
    percentageDiff: number;
    significance: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Sentiment panel state
 */
export interface SentimentPanelState {
  /** Current sentiment data */
  currentData: AggregatedSentiment[];
  /** Previous sentiment data for comparison */
  previousData: AggregatedSentiment[];
  /** Calculated diffs */
  diffs: Record<CrewSentimentMetric, SentimentDiff[]>;
  /** Current configuration */
  config: CrewSentimentConfig;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number;
  /** Auto-refresh enabled */
  autoRefreshEnabled: boolean;
}

/**
 * Sentiment filter configuration
 */
export interface SentimentFilters {
  /** Crew ID filter */
  crewIds?: string[];
  /** Turn range filter */
  turnRange?: {
    start: number;
    end: number;
  };
  /** Metric filter */
  metrics?: CrewSentimentMetric[];
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Activity filter */
  activities?: string[];
  /** Location filter */
  locations?: string[];
}

/**
 * Sentiment export configuration
 */
export interface SentimentExportConfig {
  /** Include raw data */
  includeRawData: boolean;
  /** Include aggregated data */
  includeAggregated: boolean;
  /** Include diffs */
  includeDiffs: boolean;
  /** Include analysis metrics */
  includeMetrics: boolean;
  /** Export format */
  format: 'json' | 'csv' | 'markdown';
}
