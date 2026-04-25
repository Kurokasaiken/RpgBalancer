/**
 * Stat Stress Telemetry Dashboard Config - NP-035
 * 
 * Config-first design for stat stress testing telemetry dashboard with
 * chart configurations, filters, refresh rates, and visualization settings.
 * 
 * @since 2026-01-24
 * @author Helios-Balancer
 */

import { z } from 'zod';

/**
 * Chart type
 */
export const ChartTypeSchema = z.enum([
  'heatmap',
  'bar',
  'line',
  'scatter',
  'radar',
  'table',
]);

export type ChartType = z.infer<typeof ChartTypeSchema>;

/**
 * Chart configuration schema
 */
export const ChartConfigSchema = z.object({
  /** Chart ID */
  id: z.string(),
  /** Chart title */
  title: z.string(),
  /** Chart type */
  type: ChartTypeSchema,
  /** Chart description */
  description: z.string(),
  /** Whether chart is enabled */
  enabled: z.boolean(),
  /** Chart height in pixels */
  height: z.number().min(200).max(1000),
  /** Chart width (auto if not specified) */
  width: z.number().optional(),
  /** Color scheme */
  colorScheme: z.object({
    primary: z.string(),
    secondary: z.string(),
    positive: z.string(),
    negative: z.string(),
    neutral: z.string(),
  }),
  /** Thresholds for visualization */
  thresholds: z.object({
    synergy: z.number(),
    antisynergy: z.number(),
    significant: z.number(),
  }),
});

export type ChartConfig = z.infer<typeof ChartConfigSchema>;

/**
 * Filter configuration schema
 */
export const FilterConfigSchema = z.object({
  /** Filter ID */
  id: z.string(),
  /** Filter label */
  label: z.string(),
  /** Filter type */
  type: z.enum(['select', 'multiselect', 'range', 'toggle', 'search']),
  /** Default value */
  defaultValue: z.any(),
  /** Available options (for select/multiselect) */
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  /** Min/max for range */
  range: z.object({
    min: z.number(),
    max: z.number(),
    step: z.number(),
  }).optional(),
  /** Whether filter is enabled */
  enabled: z.boolean(),
});

export type FilterConfig = z.infer<typeof FilterConfigSchema>;

/**
 * Dashboard configuration schema
 */
export const StatStressTelemetryConfigSchema = z.object({
  /** Config version */
  version: z.string(),
  /** Dashboard title */
  title: z.string(),
  /** Dashboard description */
  description: z.string(),
  /** Chart configurations */
  charts: z.array(ChartConfigSchema),
  /** Filter configurations */
  filters: z.array(FilterConfigSchema),
  /** Refresh rate in milliseconds */
  refreshRate: z.number().min(1000).max(60000),
  /** Auto-refresh enabled */
  autoRefresh: z.boolean(),
  /** Max data points to display */
  maxDataPoints: z.number().min(10).max(10000),
  /** Simulated latency for data loading (ms) to mimic async fetch */
  dataLoadLatencyMs: z.number().min(0).max(5000),
  /** Performance settings */
  performance: z.object({
    /** Enable virtualization for large datasets */
    enableVirtualization: z.boolean(),
    /** Debounce delay for filters in ms */
    debounceDelay: z.number(),
    /** Max render time in ms */
    maxRenderTime: z.number(),
  }),
  /** Telemetry settings */
  telemetry: z.object({
    /** Enable telemetry */
    enabled: z.boolean(),
    /** Track interactions */
    trackInteractions: z.boolean(),
    /** Track performance */
    trackPerformance: z.boolean(),
  }),
});

export type StatStressTelemetryConfig = z.infer<typeof StatStressTelemetryConfigSchema>;

/**
 * Default stat stress telemetry config
 */
export const DEFAULT_STAT_STRESS_TELEMETRY_CONFIG: StatStressTelemetryConfig = {
  version: '1.0.0',
  title: 'Stat Stress Testing Dashboard',
  description: 'Interactive dashboard for analyzing stat stress testing results and marginal utility',
  charts: [
    {
      id: 'synergy-heatmap',
      title: 'Stat Synergy Heatmap',
      type: 'heatmap',
      description: 'Visualizes synergy multipliers between stat pairs',
      enabled: true,
      height: 600,
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        positive: '#10b981',
        negative: '#ef4444',
        neutral: '#6b7280',
      },
      thresholds: {
        synergy: 1.15,
        antisynergy: 0.95,
        significant: 0.05,
      },
    },
    {
      id: 'marginal-utility-bar',
      title: 'Marginal Utility by Stat',
      type: 'bar',
      description: 'Shows marginal utility value for each stat',
      enabled: true,
      height: 400,
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        positive: '#10b981',
        negative: '#ef4444',
        neutral: '#6b7280',
      },
      thresholds: {
        synergy: 1.15,
        antisynergy: 0.95,
        significant: 0.05,
      },
    },
    {
      id: 'win-rate-scatter',
      title: 'Win Rate vs Stat Value',
      type: 'scatter',
      description: 'Scatter plot of win rates against stat values',
      enabled: true,
      height: 400,
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        positive: '#10b981',
        negative: '#ef4444',
        neutral: '#6b7280',
      },
      thresholds: {
        synergy: 1.15,
        antisynergy: 0.95,
        significant: 0.05,
      },
    },
    {
      id: 'stat-profile-radar',
      title: 'Stat Profile Radar',
      type: 'radar',
      description: 'Radar chart showing stat distribution for selected archetype',
      enabled: true,
      height: 400,
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        positive: '#10b981',
        negative: '#ef4444',
        neutral: '#6b7280',
      },
      thresholds: {
        synergy: 1.15,
        antisynergy: 0.95,
        significant: 0.05,
      },
    },
    {
      id: 'results-table',
      title: 'Detailed Results Table',
      type: 'table',
      description: 'Sortable table with all stress test results',
      enabled: true,
      height: 600,
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        positive: '#10b981',
        negative: '#ef4444',
        neutral: '#6b7280',
      },
      thresholds: {
        synergy: 1.15,
        antisynergy: 0.95,
        significant: 0.05,
      },
    },
  ],
  filters: [
    {
      id: 'stat-filter',
      label: 'Filter by Stat',
      type: 'multiselect',
      defaultValue: [],
      options: [], // Will be populated dynamically
      enabled: true,
    },
    {
      id: 'archetype-type',
      label: 'Archetype Type',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'single', label: 'Single Stat' },
        { value: 'pair', label: 'Stat Pairs' },
      ],
      enabled: true,
    },
    {
      id: 'win-rate-range',
      label: 'Win Rate Range',
      type: 'range',
      defaultValue: [0, 100],
      range: {
        min: 0,
        max: 100,
        step: 5,
      },
      enabled: true,
    },
    {
      id: 'show-synergies',
      label: 'Show Only Synergies',
      type: 'toggle',
      defaultValue: false,
      enabled: true,
    },
    {
      id: 'show-antisynergies',
      label: 'Show Only Anti-synergies',
      type: 'toggle',
      defaultValue: false,
      enabled: true,
    },
    {
      id: 'search',
      label: 'Search Archetypes',
      type: 'search',
      defaultValue: '',
      enabled: true,
    },
  ],
  refreshRate: 5000,
  autoRefresh: false,
  maxDataPoints: 1000,
  dataLoadLatencyMs: 25,
  performance: {
    enableVirtualization: true,
    debounceDelay: 300,
    maxRenderTime: 16,
  },
  telemetry: {
    enabled: true,
    trackInteractions: true,
    trackPerformance: true,
  },
};

/**
 * Validate stat stress telemetry config
 */
export function validateStatStressTelemetryConfig(
  config: unknown
): StatStressTelemetryConfig {
  return StatStressTelemetryConfigSchema.parse(config);
}

/**
 * Get chart config by ID
 */
export function getChartConfig(
  config: StatStressTelemetryConfig,
  chartId: string
): ChartConfig | undefined {
  return config.charts.find(c => c.id === chartId);
}

/**
 * Get filter config by ID
 */
export function getFilterConfig(
  config: StatStressTelemetryConfig,
  filterId: string
): FilterConfig | undefined {
  return config.filters.find(f => f.id === filterId);
}

/**
 * Get enabled charts
 */
export function getEnabledCharts(
  config: StatStressTelemetryConfig
): ChartConfig[] {
  return config.charts.filter(c => c.enabled);
}

/**
 * Get enabled filters
 */
export function getEnabledFilters(
  config: StatStressTelemetryConfig
): FilterConfig[] {
  return config.filters.filter(f => f.enabled);
}

/**
 * Check if value exceeds synergy threshold
 */
export function isSynergy(
  value: number,
  config: ChartConfig
): boolean {
  return value >= config.thresholds.synergy;
}

/**
 * Check if value is below antisynergy threshold
 */
export function isAntisynergy(
  value: number,
  config: ChartConfig
): boolean {
  return value <= config.thresholds.antisynergy;
}

/**
 * Check if difference is significant
 */
export function isSignificant(
  difference: number,
  config: ChartConfig
): boolean {
  return Math.abs(difference) >= config.thresholds.significant;
}

/**
 * Get color for synergy value
 */
export function getSynergyColor(
  value: number,
  config: ChartConfig
): string {
  if (isSynergy(value, config)) {
    return config.colorScheme.positive;
  } else if (isAntisynergy(value, config)) {
    return config.colorScheme.negative;
  } else {
    return config.colorScheme.neutral;
  }
}
