/**
 * Archetype Comparison Configuration
 * 
 * Config-first configuration for archetype comparison matrix visualization.
 * Defines comparison metrics, delta thresholds, color coding, and UI settings.
 * 
 * @since NP-134 – Config Balancer: Archetype Comparison Matrix
 */

import { z } from 'zod';
import type { BalancerConfig } from '../types';

/**
 * Comparison metric types
 */
export const COMPARISON_METRICS = [
  'balance-score',
  'total-stats',
  'core-stats',
  'derived-stats',
  'penalty-stats',
  'budget-efficiency',
  'synergy-score',
  'power-level',
] as const;

export type ComparisonMetric = typeof COMPARISON_METRICS[number];

/**
 * Delta threshold levels
 */
export const DELTA_THRESHOLDS = [
  'insignificant',
  'minor',
  'moderate',
  'significant',
  'major',
] as const;

export type DeltaThreshold = typeof DELTA_THRESHOLDS[number];

/**
 * Color scheme types
 */
export const COLOR_SCHEMES = [
  'default',
  'accessible',
  'high-contrast',
  'colorblind-friendly',
] as const;

export type ColorScheme = typeof COLOR_SCHEMES[number];

/**
 * Sort direction types
 */
export const SORT_DIRECTIONS = [
  'asc',
  'desc',
] as const;

export type SortDirection = typeof SORT_DIRECTIONS[number];

/**
 * Comparison result schema
 */
export const ArchetypeComparisonResultSchema = z.object({
  archetypeId: z.string(),
  archetypeName: z.string(),
  metrics: z.record(z.number()),
  deltas: z.record(z.number()),
  balanceScore: z.number(),
  powerLevel: z.number(),
  rank: z.number(),
  percentile: z.number(),
  outliers: z.array(z.string()),
});

/**
 * Comparison configuration schema
 */
export const ComparisonConfigSchema = z.object({
  metrics: z.array(z.object({
    id: z.enum(COMPARISON_METRICS),
    name: z.string(),
    description: z.string(),
    weight: z.number().min(0).max(1),
    format: z.enum(['number', 'percentage', 'score']),
    higherIsBetter: z.boolean(),
  })),
  thresholds: z.object({
    insignificant: z.number().min(0).max(1),
    minor: z.number().min(0).max(1),
    moderate: z.number().min(0).max(1),
    significant: z.number().min(0).max(1),
    major: z.number().min(0).max(1),
  }),
  colorScheme: z.enum(COLOR_SCHEMES),
  maxArchetypes: z.number().min(2).max(100),
  defaultSort: z.object({
    metric: z.enum(COMPARISON_METRICS),
    direction: z.enum(SORT_DIRECTIONS),
  }),
  ui: z.object({
    showDeltaIndicators: z.boolean().default(true),
    showOutlierHighlights: z.boolean().default(true),
    enableColumnSorting: z.boolean().default(true),
    enableRowHover: z.boolean().default(true),
    compactMode: z.boolean().default(false),
    animationDuration: z.number().min(0).max(1000).default(300),
  }),
});

export type ArchetypeComparisonResult = z.infer<typeof ArchetypeComparisonResultSchema>;
export type ComparisonConfig = z.infer<typeof ComparisonConfigSchema>;

/**
 * Default comparison configuration
 */
export const DEFAULT_COMPARISON_CONFIG: ComparisonConfig = {
  metrics: [
    {
      id: 'balance-score',
      name: 'Balance Score',
      description: 'Overall balance score calculated from weighted metrics',
      weight: 0.3,
      format: 'score',
      higherIsBetter: true,
    },
    {
      id: 'total-stats',
      name: 'Total Stats',
      description: 'Sum of all stat values',
      weight: 0.2,
      format: 'number',
      higherIsBetter: true,
    },
    {
      id: 'core-stats',
      name: 'Core Stats',
      description: 'Sum of core stat values',
      weight: 0.15,
      format: 'number',
      higherIsBetter: true,
    },
    {
      id: 'derived-stats',
      name: 'Derived Stats',
      description: 'Sum of derived stat values',
      weight: 0.1,
      format: 'number',
      higherIsBetter: true,
    },
    {
      id: 'penalty-stats',
      name: 'Penalty Stats',
      description: 'Sum of penalty stat values (lower is better)',
      weight: 0.1,
      format: 'number',
      higherIsBetter: false,
    },
    {
      id: 'budget-efficiency',
      name: 'Budget Efficiency',
      description: 'Stat points per budget point',
      weight: 0.1,
      format: 'percentage',
      higherIsBetter: true,
    },
    {
      id: 'synergy-score',
      name: 'Synergy Score',
      description: 'Calculated synergy between stats',
      weight: 0.05,
      format: 'score',
      higherIsBetter: true,
    },
    {
      id: 'power-level',
      name: 'Power Level',
      description: 'Estimated power level (1-10)',
      weight: 0.1,
      format: 'score',
      higherIsBetter: true,
    },
  ],
  thresholds: {
    insignificant: 0.05,
    minor: 0.15,
    moderate: 0.25,
    significant: 0.4,
    major: 0.6,
  },
  colorScheme: 'default',
  maxArchetypes: 50,
  defaultSort: {
    metric: 'balance-score',
    direction: 'desc',
  },
  ui: {
    showDeltaIndicators: true,
    showOutlierHighlights: true,
    enableColumnSorting: true,
    enableRowHover: true,
    compactMode: false,
    animationDuration: 300,
  },
};

/**
 * Color scheme definitions
 */
export const COLOR_SCHEME_DEFINITIONS = {
  default: {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    text: '#111827',
    textSecondary: '#6b7280',
    outlier: '#f59e0b',
  },
  accessible: {
    positive: '#059669',
    negative: '#dc2626',
    neutral: '#57534e',
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#e2e8f0',
    text: '#1e293b',
    textSecondary: '#64748b',
    outlier: '#d97706',
  },
  'high-contrast': {
    positive: '#000000',
    negative: '#ffffff',
    neutral: '#808080',
    background: '#ffffff',
    surface: '#f0f0f0',
    border: '#000000',
    text: '#000000',
    textSecondary: '#666666',
    outlier: '#ff0000',
  },
  'colorblind-friendly': {
    positive: '#0072b2',
    negative: '#d73027',
    neutral: '#6c757d',
    background: '#ffffff',
    surface: '#f8f9fa',
    border: '#dee2e6',
    text: '#212529',
    textSecondary: '#6c757d',
    outlier: '#fd7e14',
  },
} as const;

/**
 * Delta threshold level definitions
 */
export const DELTA_THRESHOLD_DEFINITIONS = {
  insignificant: {
    label: 'Insignificant',
    description: 'Minimal difference, within normal variation',
    color: 'neutral',
    icon: '→',
  },
  minor: {
    label: 'Minor',
    description: 'Small but noticeable difference',
    color: 'neutral',
    icon: '↗',
  },
  moderate: {
    label: 'Moderate',
    description: 'Significant difference requiring attention',
    color: 'outlier',
    icon: '⚡',
  },
  significant: {
    label: 'Significant',
    description: 'Major difference impacting balance',
    color: 'outlier',
    icon: '⚠️',
  },
  major: {
    label: 'Major',
    description: 'Critical difference requiring immediate action',
    color: 'negative',
    icon: '🚨',
  },
} as const;

/**
 * Get delta threshold level for a given value
 */
export function getDeltaThreshold(value: number, thresholds: ComparisonConfig['thresholds']): DeltaThreshold {
  const absValue = Math.abs(value);
  
  if (absValue <= thresholds.insignificant) return 'insignificant';
  if (absValue <= thresholds.minor) return 'minor';
  if (absValue <= thresholds.moderate) return 'moderate';
  if (absValue <= thresholds.significant) return 'significant';
  return 'major';
}

/**
 * Get color for delta threshold level
 */
export function getDeltaColor(
  threshold: DeltaThreshold,
  colorScheme: ColorScheme = 'default'
): string {
  const definition = DELTA_THRESHOLD_DEFINITIONS[threshold];
  const colors = COLOR_SCHEME_DEFINITIONS[colorScheme];
  
  return colors[definition.color as keyof typeof colors];
}

/**
 * Get delta icon for threshold level
 */
export function getDeltaIcon(threshold: DeltaThreshold): string {
  return DELTA_THRESHOLD_DEFINITIONS[threshold].icon;
}

/**
 * Format metric value based on format type
 */
export function formatMetricValue(value: number, format: string): string {
  switch (format) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'score':
      return value.toFixed(2);
    case 'number':
    default:
      return value.toFixed(0);
  }
}

/**
 * Calculate balance score for archetype
 */
export function calculateBalanceScore(
  archetype: Record<string, number>,
  metrics: ComparisonConfig['metrics'],
  balancerConfig: BalancerConfig
): number {
  let score = 0;
  let totalWeight = 0;
  
  for (const metric of metrics) {
    let metricValue = 0;
    
    switch (metric.id) {
      case 'balance-score':
        // Calculate weighted balance score
        metricValue = calculateWeightedBalance(archetype, balancerConfig);
        break;
      case 'total-stats':
        metricValue = Object.values(archetype).reduce((sum, val) => sum + val, 0);
        break;
      case 'core-stats':
        metricValue = balancerConfig.stats
          .filter(stat => stat.isCore)
          .reduce((sum, stat) => sum + (archetype[stat.id] || 0), 0);
        break;
      case 'derived-stats':
        metricValue = balancerConfig.stats
          .filter(stat => stat.isDerived)
          .reduce((sum, stat) => sum + (archetype[stat.id] || 0), 0);
        break;
      case 'penalty-stats':
        metricValue = balancerConfig.stats
          .filter(stat => stat.isPenalty)
          .reduce((sum, stat) => sum + (archetype[stat.id] || 0), 0);
        break;
      case 'budget-efficiency':
        const totalStatPoints = Object.values(archetype).reduce((sum, val) => sum + val, 0);
        const budgetPoints = 100; // Default budget
        metricValue = budgetPoints > 0 ? totalStatPoints / budgetPoints : 0;
        break;
      case 'synergy-score':
        metricValue = calculateSynergyScore(archetype, balancerConfig);
        break;
      case 'power-level':
        metricValue = calculatePowerLevel(archetype, balancerConfig);
        break;
    }
    
    // Normalize metric value (0-1 scale) if needed
    const normalizedValue = normalizeMetricValue(metricValue, metric);
    
    // Apply weight and direction
    const weightedValue = metric.higherIsBetter ? normalizedValue : (1 - normalizedValue);
    score += weightedValue * metric.weight;
    totalWeight += metric.weight;
  }
  
  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Calculate weighted balance score
 */
function calculateWeightedBalance(
  archetype: Record<string, number>,
  balancerConfig: BalancerConfig
): number {
  let score = 0;
  let totalWeight = 0;
  
  for (const stat of balancerConfig.stats) {
    const value = archetype[stat.id] || 0;
    const weight = stat.weight;
    
    // Apply penalties for penalty stats
    const adjustedWeight = stat.isPenalty ? -weight : weight;
    const adjustedValue = stat.isPenalty ? -value : value;
    
    score += adjustedValue * adjustedWeight;
    totalWeight += Math.abs(adjustedWeight);
  }
  
  return totalWeight > 0 ? (score + totalWeight) / (2 * totalWeight) : 0;
}

/**
 * Calculate synergy score
 */
function calculateSynergyScore(
  archetype: Record<string, number>,
  balancerConfig: BalancerConfig
): number {
  // Simple synergy calculation - can be enhanced with more complex logic
  const statCount = Object.keys(archetype).length;
  const synergyBonus = Math.min(statCount / 10, 1); // Bonus for diverse stats
  
  return synergyBonus;
}

/**
 * Calculate power level
 */
function calculatePowerLevel(
  archetype: Record<string, number>,
  balancerConfig: BalancerConfig
): number {
  const totalStats = Object.values(archetype).reduce((sum, val) => sum + val, 0);
  const maxPossibleStats = balancerConfig.stats.length * 10; // Assuming max 10 per stat
  
  return Math.min(totalStats / maxPossibleStats, 1) * 10; // Scale to 1-10
}

/**
 * Normalize metric value to 0-1 scale
 */
function normalizeMetricValue(value: number, metric: ComparisonConfig['metrics'][0]): number {
  // Simple normalization - can be enhanced with metric-specific logic
  switch (metric.format) {
    case 'percentage':
      return Math.max(0, Math.min(1, value / 100));
    case 'score':
      return Math.max(0, Math.min(1, value / 10));
    case 'number':
    default:
      // For raw numbers, use a simple scaling based on typical ranges
      return Math.max(0, Math.min(1, value / 100));
  }
}

/**
 * Create safe comparison configuration
 */
export function createSafeComparisonConfig(config: Partial<ComparisonConfig>): ComparisonConfig {
  const result = ComparisonConfigSchema.safeParse(config);
  
  if (result.success) {
    return result.data;
  }
  
  // Return default config with merged valid data
  return {
    ...DEFAULT_COMPARISON_CONFIG,
    ...config,
  };
}

/**
 * Validate comparison configuration
 */
export function validateComparisonConfig(config: Partial<ComparisonConfig>): string[] {
  const result = ComparisonConfigSchema.safeParse(config);
  
  if (result.success) {
    return [];
  }
  
  return result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
}

/**
 * Export configuration for external usage
 */
export const COMPARISON_CONFIG = {
  metrics: COMPARISON_METRICS,
  thresholds: DELTA_THRESHOLDS,
  colorSchemes: COLOR_SCHEMES,
  sortDirections: SORT_DIRECTIONS,
  definitions: {
    deltaThresholds: DELTA_THRESHOLD_DEFINITIONS,
    colorSchemes: COLOR_SCHEME_DEFINITIONS,
  },
  default: DEFAULT_COMPARISON_CONFIG,
  helpers: {
    getDeltaThreshold,
    getDeltaColor,
    getDeltaIcon,
    formatMetricValue,
    calculateBalanceScore,
  },
} as const;
