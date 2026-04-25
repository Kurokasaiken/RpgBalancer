/**
 * Crew Scheduler Analytics Dashboard configuration.
 *
 * Centralizes retro dashboard settings so UI components remain config-first.
 *
 * @since IV-WS3-crew-analytics
 */

/**
 * Retro palette aligned with Gilded Observatory theme.
 */
export interface CrewSchedulerAnalyticsPalette {
  /** Color used for safe/normal metrics */
  ok: string;
  /** Color used for warning thresholds */
  warn: string;
  /** Color used for critical thresholds */
  critical: string;
  /** Accent color for retro outlines */
  accent: string;
  /** Background color for dashboard surface */
  background: string;
  /** Border color for ASCII frames */
  border: string;
}

/**
 * Threshold configuration for interpreting scheduler metrics.
 */
export interface CrewSchedulerAnalyticsThresholds {
  /** Queue length above which warnings should be shown */
  queueWarning: number;
  /** Queue length above which critical alerts should be shown */
  queueCritical: number;
  /** Average fatigue threshold for warning */
  fatigueWarning: number;
  /** Average fatigue threshold for critical */
  fatigueCritical: number;
  /** Drop fail rate (0-1) warning threshold */
  dropFailWarning: number;
  /** Drop fail rate (0-1) critical threshold */
  dropFailCritical: number;
  /** Throughput target (decisions per minute) */
  throughputTarget: number;
}

/**
 * Card layout and display options for the retro dashboard.
 */
export interface CrewSchedulerAnalyticsLayoutConfig {
  /** Refresh interval for live metrics in milliseconds */
  refreshIntervalMs: number;
  /** Maximum history length kept by dashboard charts */
  maxHistoryPoints: number;
  /** Whether mini sparklines should be displayed */
  enableSparklines: boolean;
  /** Whether ASCII borders are enabled for panels */
  enableAsciiChrome: boolean;
  /** Whether to show throughput breakdown per activity */
  showActivityBreakdown: boolean;
}

/**
 * Complete dashboard configuration object.
 */
export interface CrewSchedulerAnalyticsConfig {
  palette: CrewSchedulerAnalyticsPalette;
  thresholds: CrewSchedulerAnalyticsThresholds;
  layout: CrewSchedulerAnalyticsLayoutConfig;
}

/**
 * Default retro-styled configuration for the Crew Scheduler dashboard.
 */
export const DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG: CrewSchedulerAnalyticsConfig = {
  palette: {
    ok: '#7CFC00', // retro green
    warn: '#FFD700', // amber
    critical: '#FF4D4F', // alert red
    accent: '#00FFFF', // cyan glow
    background: '#050914',
    border: '#1F2937',
  },
  thresholds: {
    queueWarning: 15,
    queueCritical: 30,
    fatigueWarning: 0.55,
    fatigueCritical: 0.75,
    dropFailWarning: 0.12,
    dropFailCritical: 0.2,
    throughputTarget: 8,
  },
  layout: {
    refreshIntervalMs: 5000,
    maxHistoryPoints: 120,
    enableSparklines: true,
    enableAsciiChrome: true,
    showActivityBreakdown: true,
  },
};

/**
 * Validates a dashboard configuration.
 *
 * @param config - Configuration to validate
 * @returns True if config is safe to use
 */
export function validateCrewSchedulerAnalyticsConfig(config: CrewSchedulerAnalyticsConfig): boolean {
  if (config.layout.refreshIntervalMs <= 0) return false;
  if (config.layout.maxHistoryPoints <= 0) return false;
  if (config.thresholds.queueWarning < 0 || config.thresholds.queueCritical < config.thresholds.queueWarning) {
    return false;
  }
  if (
    config.thresholds.fatigueWarning < 0 ||
    config.thresholds.fatigueCritical < config.thresholds.fatigueWarning ||
    config.thresholds.fatigueCritical > 1
  ) {
    return false;
  }
  if (
    config.thresholds.dropFailWarning < 0 ||
    config.thresholds.dropFailCritical < config.thresholds.dropFailWarning ||
    config.thresholds.dropFailCritical > 1
  ) {
    return false;
  }
  if (config.thresholds.throughputTarget <= 0) return false;
  return true;
}
