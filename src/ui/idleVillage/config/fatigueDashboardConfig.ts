/**
 * Idle Village Crew Fatigue Dashboard Configuration - NP-011
 * 
 * Configuration schema for the Crew Fatigue Dashboard with palette, thresholds,
 * smoothing settings, and visual styling. Follows config-first design principles.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Fatigue level categories for crew members
 */
export const FatigueLevel = {
  RESTED: 'rested',
  NORMAL: 'normal',
  TIRED: 'tired',
  EXHAUSTED: 'exhausted',
  CRITICAL: 'critical',
} as const;

export type FatigueLevel = typeof FatigueLevel[keyof typeof FatigueLevel];

/**
 * Chart types for fatigue visualization
 */
export const FatigueChartType = {
  SPARKLINE: 'sparkline',
  STACKED_BAR: 'stacked_bar',
  AREA_CHART: 'area_chart',
  HEATMAP: 'heatmap',
} as const;

export type FatigueChartType = typeof FatigueChartType[keyof typeof FatigueChartType];

/**
 * Smoothing algorithms for fatigue data
 */
export const SmoothingAlgorithm = {
  NONE: 'none',
  MOVING_AVERAGE: 'moving_average',
  EXPONENTIAL: 'exponential',
  WEIGHTED: 'weighted',
} as const;

export type SmoothingAlgorithm = typeof SmoothingAlgorithm[keyof typeof SmoothingAlgorithm];

/**
 * Color palette configuration for fatigue levels
 */
export const FatiguePaletteSchema = z.object({
  /** Color for rested crew (0-0.2 fatigue) */
  rested: z.string().default('#10b981'), // green-500
  /** Color for normal crew (0.2-0.4 fatigue) */
  normal: z.string().default('#3b82f6'), // blue-500
  /** Color for tired crew (0.4-0.6 fatigue) */
  tired: z.string().default('#f59e0b'), // amber-500
  /** Color for exhausted crew (0.6-0.8 fatigue) */
  exhausted: z.string().default('#f97316'), // orange-500
  /** Color for critical crew (0.8-1.0 fatigue) */
  critical: z.string().default('#ef4444'), // red-500
  /** Background color for charts */
  background: z.string().default('#1f2937'), // gray-800
  /** Grid line color */
  grid: z.string().default('#374151'), // gray-700
  /** Text color */
  text: z.string().default('#f3f4f6'), // gray-100
});

/**
 * Fatigue threshold configuration
 */
export const FatigueThresholdsSchema = z.object({
  /** Threshold for rested level (0-1) */
  rested: z.number().min(0).max(1).default(0.2),
  /** Threshold for normal level (0-1) */
  normal: z.number().min(0).max(1).default(0.4),
  /** Threshold for tired level (0-1) */
  tired: z.number().min(0).max(1).default(0.6),
  /** Threshold for exhausted level (0-1) */
  exhausted: z.number().min(0).max(1).default(0.8),
  /** Threshold for critical level (0-1) */
  critical: z.number().min(0).max(1).default(1.0),
  /** Warning threshold for dashboard alerts */
  warningThreshold: z.number().min(0).max(1).default(0.7),
  /** Critical threshold for dashboard alerts */
  criticalAlertThreshold: z.number().min(0).max(1).default(0.9),
});

/**
 * Smoothing configuration for fatigue data
 */
export const SmoothingConfigSchema = z.object({
  /** Smoothing algorithm to apply */
  algorithm: z.nativeEnum(SmoothingAlgorithm).default(SmoothingAlgorithm.EXPONENTIAL),
  /** Window size for moving average (if applicable) */
  windowSize: z.number().min(2).max(20).default(5),
  /** Smoothing factor for exponential smoothing (0-1) */
  smoothingFactor: z.number().min(0).max(1).default(0.3),
  /** Whether to enable adaptive smoothing based on data variance */
  adaptive: z.boolean().default(true),
  /** Minimum variance threshold for adaptive smoothing */
  adaptiveThreshold: z.number().min(0).max(1).default(0.1),
});

/**
 * Chart configuration
 */
export const ChartConfigSchema = z.object({
  /** Default chart type */
  defaultType: z.nativeEnum(FatigueChartType).default(FatigueChartType.SPARKLINE),
  /** Chart height in pixels */
  height: z.number().min(100).max(500).default(200),
  /** Chart width in pixels */
  width: z.number().min(200).max(800).default(400),
  /** Whether to show grid lines */
  showGrid: z.boolean().default(true),
  /** Whether to show tooltips */
  showTooltips: z.boolean().default(true),
  /** Whether to show legend */
  showLegend: z.boolean().default(false),
  /** Animation duration in milliseconds */
  animationDuration: z.number().min(0).max(2000).default(300),
  /** Whether to enable real-time updates */
  realTimeUpdates: z.boolean().default(true),
  /** Update interval in milliseconds */
  updateInterval: z.number().min(100).max(10000).default(1000),
});

/**
 * Dashboard layout configuration
 */
export const DashboardLayoutSchema = z.object({
  /** Number of crew members per row */
  crewPerRow: z.number().min(1).max(10).default(4),
  /** Whether to show summary statistics */
  showSummary: z.boolean().default(true),
  /** Whether to show fatigue distribution chart */
  showDistribution: z.boolean().default(true),
  /** Whether to show trend indicators */
  showTrends: z.boolean().default(true),
  /** Whether to show alerts */
  showAlerts: z.boolean().default(true),
  /** Maximum number of alerts to show */
  maxAlerts: z.number().min(1).max(20).default(5),
  /** Whether to enable compact mode */
  compactMode: z.boolean().default(false),
});

/**
 * Telemetry configuration
 */
export const TelemetryConfigSchema = z.object({
  /** Whether to enable telemetry collection */
  enabled: z.boolean().default(true),
  /** Events to track */
  events: z.object({
    /** Track dashboard view events */
    dashboardViewed: z.boolean().default(true),
    /** Track dashboard export events */
    dashboardExported: z.boolean().default(true),
    /** Track fatigue threshold alerts */
    thresholdAlerts: z.boolean().default(true),
    /** Track user interactions */
    userInteractions: z.boolean().default(true),
  }).default({}),
  /** Sampling rate for telemetry (0-1) */
  samplingRate: z.number().min(0).max(1).default(1.0),
  /** Batch size for telemetry events */
  batchSize: z.number().min(1).max(100).default(10),
});

/**
 * Main fatigue dashboard configuration schema
 */
export const FatigueDashboardConfigSchema = z.object({
  /** Color palette for fatigue levels */
  palette: FatiguePaletteSchema,
  /** Fatigue thresholds */
  thresholds: FatigueThresholdsSchema,
  /** Data smoothing configuration */
  smoothing: SmoothingConfigSchema,
  /** Chart configuration */
  charts: ChartConfigSchema,
  /** Dashboard layout */
  layout: DashboardLayoutSchema,
  /** Telemetry configuration */
  telemetry: TelemetryConfigSchema,
  /** Performance settings */
  performance: z.object({
    /** Maximum number of data points to keep in memory */
    maxDataPoints: z.number().min(100).max(10000).default(1000),
    /** Whether to enable data compression */
    enableCompression: z.boolean().default(true),
    /** Debounce time for updates in milliseconds */
    updateDebounce: z.number().min(0).max(1000).default(100),
  }),
});

/**
 * Type inference from schema
 */
export type FatigueDashboardConfig = z.infer<typeof FatigueDashboardConfigSchema>;
export type FatiguePalette = z.infer<typeof FatiguePaletteSchema>;
export type FatigueThresholds = z.infer<typeof FatigueThresholdsSchema>;
export type SmoothingConfig = z.infer<typeof SmoothingConfigSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;
export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>;

/**
 * Default fatigue dashboard configuration
 */
export const DEFAULT_FATIGUE_DASHBOARD_CONFIG: FatigueDashboardConfig = {
  palette: {
    rested: '#10b981',
    normal: '#3b82f6',
    tired: '#f59e0b',
    exhausted: '#f97316',
    critical: '#ef4444',
    background: '#1f2937',
    grid: '#374151',
    text: '#f3f4f6',
  },
  thresholds: {
    rested: 0.2,
    normal: 0.4,
    tired: 0.6,
    exhausted: 0.8,
    critical: 1.0,
    warningThreshold: 0.7,
    criticalAlertThreshold: 0.9,
  },
  smoothing: {
    algorithm: SmoothingAlgorithm.EXPONENTIAL,
    windowSize: 5,
    smoothingFactor: 0.3,
    adaptive: true,
    adaptiveThreshold: 0.1,
  },
  charts: {
    defaultType: FatigueChartType.SPARKLINE,
    height: 200,
    width: 400,
    showGrid: true,
    showTooltips: true,
    showLegend: false,
    animationDuration: 300,
    realTimeUpdates: true,
    updateInterval: 1000,
  },
  layout: {
    crewPerRow: 4,
    showSummary: true,
    showDistribution: true,
    showTrends: true,
    showAlerts: true,
    maxAlerts: 5,
    compactMode: false,
  },
  telemetry: {
    enabled: true,
    events: {
      dashboardViewed: true,
      dashboardExported: true,
      thresholdAlerts: true,
      userInteractions: true,
    },
    samplingRate: 1.0,
    batchSize: 10,
  },
  performance: {
    maxDataPoints: 1000,
    enableCompression: true,
    updateDebounce: 100,
  },
};

/**
 * Validates a fatigue dashboard configuration
 */
export function validateFatigueDashboardConfig(config: unknown): FatigueDashboardConfig {
  return FatigueDashboardConfigSchema.parse(config);
}

/**
 * Gets fatigue level from fatigue value
 */
export function getFatigueLevel(fatigue: number, thresholds: FatigueThresholds): FatigueLevel {
  if (fatigue <= thresholds.rested) return FatigueLevel.RESTED;
  if (fatigue <= thresholds.normal) return FatigueLevel.NORMAL;
  if (fatigue <= thresholds.tired) return FatigueLevel.TIRED;
  if (fatigue <= thresholds.exhausted) return FatigueLevel.EXHAUSTED;
  return FatigueLevel.CRITICAL;
}

/**
 * Gets color for fatigue level
 */
export function getFatigueColor(level: FatigueLevel, palette: FatiguePalette): string {
  switch (level) {
    case FatigueLevel.RESTED: return palette.rested;
    case FatigueLevel.NORMAL: return palette.normal;
    case FatigueLevel.TIRED: return palette.tired;
    case FatigueLevel.EXHAUSTED: return palette.exhausted;
    case FatigueLevel.CRITICAL: return palette.critical;
    default: return palette.normal;
  }
}
