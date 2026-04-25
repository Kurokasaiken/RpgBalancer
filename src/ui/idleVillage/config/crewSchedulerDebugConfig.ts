/**
 * Crew Scheduler Debug Panel Configuration – NP-106
 * 
 * Config-first settings for the debug panel that visualizes crew scheduler
 * state in real-time with timeline, slot occupancy heatmap, and conflict detection.
 * 
 * @since NP-106
 */

import { z } from 'zod';

/**
 * Refresh rate options for debug panel updates.
 */
export const RefreshRateSchema = z.enum(['realtime', 'fast', 'normal', 'slow', 'manual']);
export type RefreshRate = z.infer<typeof RefreshRateSchema>;

/**
 * Visualization mode for the debug panel.
 */
export const VisualizationModeSchema = z.enum(['timeline', 'heatmap', 'list', 'split']);
export type VisualizationMode = z.infer<typeof VisualizationModeSchema>;

/**
 * Conflict severity levels for visual indicators.
 */
export const ConflictSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type ConflictSeverity = z.infer<typeof ConflictSeveritySchema>;

/**
 * Color scheme for heatmap visualization.
 */
export const HeatmapColorSchemeSchema = z.object({
  /** Color for empty slots */
  empty: z.string(),
  /** Color for low occupancy (1-25%) */
  low: z.string(),
  /** Color for medium occupancy (26-50%) */
  medium: z.string(),
  /** Color for high occupancy (51-75%) */
  high: z.string(),
  /** Color for full occupancy (76-100%) */
  full: z.string(),
  /** Color for conflict indicators */
  conflict: z.string(),
});
export type HeatmapColorScheme = z.infer<typeof HeatmapColorSchemeSchema>;

/**
 * Timeline configuration for scheduler state visualization.
 */
export const TimelineConfigSchema = z.object({
  /** Number of time units to display */
  visibleRange: z.number().int().positive(),
  /** Time unit duration in milliseconds */
  timeUnitMs: z.number().int().positive(),
  /** Whether to auto-scroll to current time */
  autoScroll: z.boolean(),
  /** Show assignment labels on timeline */
  showLabels: z.boolean(),
  /** Compact mode for smaller displays */
  compact: z.boolean(),
});
export type TimelineConfig = z.infer<typeof TimelineConfigSchema>;

/**
 * Metrics to track and display in the debug panel.
 */
export const MetricsConfigSchema = z.object({
  /** Show queue size metric */
  showQueueSize: z.boolean(),
  /** Show average priority metric */
  showAvgPriority: z.boolean(),
  /** Show conflict count metric */
  showConflictCount: z.boolean(),
  /** Show assignment rate metric */
  showAssignmentRate: z.boolean(),
  /** Show fatigue levels metric */
  showFatigueLevels: z.boolean(),
  /** Show specialization matches metric */
  showSpecializationMatches: z.boolean(),
});
export type MetricsConfig = z.infer<typeof MetricsConfigSchema>;

/**
 * Conflict detection thresholds for the debug panel.
 */
export const ConflictThresholdsSchema = z.object({
  /** Queue size threshold for overflow warning */
  queueOverflow: z.number().int().positive(),
  /** Fatigue level threshold for overload warning (0-1) */
  fatigueOverload: z.number().min(0).max(1),
  /** Priority inversion threshold (score difference) */
  priorityInversion: z.number().nonnegative(),
  /** Minimum stat match threshold for skill mismatch warning (0-1) */
  skillMismatch: z.number().min(0).max(1),
});
export type ConflictThresholds = z.infer<typeof ConflictThresholdsSchema>;

/**
 * Complete crew scheduler debug panel configuration.
 */
export const CrewSchedulerDebugConfigSchema = z.object({
  /** Whether debug panel is enabled */
  enabled: z.boolean(),
  /** Refresh rate for panel updates */
  refreshRate: RefreshRateSchema,
  /** Refresh interval in milliseconds (for non-realtime modes) */
  refreshIntervalMs: z.number().int().positive(),
  /** Default visualization mode */
  defaultVisualizationMode: VisualizationModeSchema,
  /** Timeline configuration */
  timeline: TimelineConfigSchema,
  /** Metrics to display */
  metrics: MetricsConfigSchema,
  /** Heatmap color scheme */
  heatmapColors: HeatmapColorSchemeSchema,
  /** Conflict detection thresholds */
  conflictThresholds: ConflictThresholdsSchema,
  /** Maximum number of conflicts to display */
  maxConflictsDisplayed: z.number().int().positive(),
  /** Whether to show detailed diagnostics */
  showDetailedDiagnostics: z.boolean(),
  /** Whether to enable telemetry for debug panel interactions */
  enableTelemetry: z.boolean(),
});
export type CrewSchedulerDebugConfig = z.infer<typeof CrewSchedulerDebugConfigSchema>;

/**
 * Default debug panel configuration optimized for development.
 */
export const DEFAULT_CREW_SCHEDULER_DEBUG_CONFIG: CrewSchedulerDebugConfig = {
  enabled: true,
  refreshRate: 'normal',
  refreshIntervalMs: 1000,
  defaultVisualizationMode: 'split',
  timeline: {
    visibleRange: 20,
    timeUnitMs: 1000,
    autoScroll: true,
    showLabels: true,
    compact: false,
  },
  metrics: {
    showQueueSize: true,
    showAvgPriority: true,
    showConflictCount: true,
    showAssignmentRate: true,
    showFatigueLevels: true,
    showSpecializationMatches: true,
  },
  heatmapColors: {
    empty: '#1a1a2e',
    low: '#16213e',
    medium: '#0f3460',
    high: '#533483',
    full: '#e94560',
    conflict: '#ff6b6b',
  },
  conflictThresholds: {
    queueOverflow: 40,
    fatigueOverload: 0.8,
    priorityInversion: 5.0,
    skillMismatch: 0.3,
  },
  maxConflictsDisplayed: 10,
  showDetailedDiagnostics: true,
  enableTelemetry: true,
};

/**
 * Compact debug configuration for mobile/small screens.
 */
export const COMPACT_CREW_SCHEDULER_DEBUG_CONFIG: CrewSchedulerDebugConfig = {
  ...DEFAULT_CREW_SCHEDULER_DEBUG_CONFIG,
  refreshRate: 'slow',
  refreshIntervalMs: 2000,
  defaultVisualizationMode: 'list',
  timeline: {
    ...DEFAULT_CREW_SCHEDULER_DEBUG_CONFIG.timeline,
    visibleRange: 10,
    compact: true,
    showLabels: false,
  },
  metrics: {
    showQueueSize: true,
    showAvgPriority: true,
    showConflictCount: true,
    showAssignmentRate: false,
    showFatigueLevels: false,
    showSpecializationMatches: false,
  },
  maxConflictsDisplayed: 5,
  showDetailedDiagnostics: false,
};

/**
 * Validates a crew scheduler debug configuration.
 * 
 * @param config - Configuration to validate
 * @returns Validation result with parsed config or error
 */
export function validateCrewSchedulerDebugConfig(
  config: unknown
): { success: true; data: CrewSchedulerDebugConfig } | { success: false; error: z.ZodError } {
  const result = CrewSchedulerDebugConfigSchema.safeParse(config);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Refresh interval mapping for different refresh rates.
 */
export const REFRESH_RATE_INTERVALS: Record<RefreshRate, number> = {
  realtime: 100,
  fast: 500,
  normal: 1000,
  slow: 2000,
  manual: 0, // No auto-refresh
};

/**
 * Gets the refresh interval in milliseconds for a given refresh rate.
 * 
 * @param rate - Refresh rate setting
 * @returns Interval in milliseconds (0 for manual)
 */
export function getRefreshInterval(rate: RefreshRate): number {
  return REFRESH_RATE_INTERVALS[rate];
}

/**
 * Determines conflict severity based on threshold violations.
 * 
 * @param value - Current value
 * @param threshold - Threshold value
 * @param type - Type of conflict check
 * @returns Severity level
 */
export function determineConflictSeverity(
  value: number,
  threshold: number,
  type: 'overflow' | 'fatigue' | 'priority' | 'skill'
): ConflictSeverity {
  const ratio = value / threshold;
  
  switch (type) {
    case 'overflow':
      if (ratio >= 1.5) return 'critical';
      if (ratio >= 1.2) return 'high';
      if (ratio >= 1.0) return 'medium';
      return 'low';
      
    case 'fatigue':
      if (value >= 0.95) return 'critical';
      if (value >= threshold) return 'high';
      if (value >= threshold * 0.8) return 'medium';
      return 'low';
      
    case 'priority':
      if (ratio >= 2.0) return 'critical';
      if (ratio >= 1.5) return 'high';
      if (ratio >= 1.0) return 'medium';
      return 'low';
      
    case 'skill':
      if (value <= threshold * 0.5) return 'critical';
      if (value <= threshold) return 'high';
      if (value <= threshold * 1.5) return 'medium';
      return 'low';
      
    default:
      return 'low';
  }
}

/**
 * Gets color for a given severity level.
 * 
 * @param severity - Conflict severity
 * @returns Hex color code
 */
export function getSeverityColor(severity: ConflictSeverity): string {
  const colors: Record<ConflictSeverity, string> = {
    low: '#4ade80',
    medium: '#fbbf24',
    high: '#fb923c',
    critical: '#ef4444',
  };
  
  return colors[severity];
}
