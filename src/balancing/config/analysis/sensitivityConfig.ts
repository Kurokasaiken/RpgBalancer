/**
 * Stat Weight Sensitivity Analysis Configuration
 * 
 * Config-first configuration for stat weight sensitivity analysis.
 * Defines perturbation ranges, metrics, thresholds, and analysis parameters.
 * 
 * @since NP-144 – Config Balancer: Stat Weight Sensitivity Analyzer
 */

import { z } from 'zod';
import type { BalancerConfig } from '../types';

/**
 * Sensitivity metric types
 */
export const SENSITIVITY_METRICS = [
  'balance-score',
  'win-rate',
  'average-turns',
  'damage-output',
  'survivability',
  'synergy-score',
  'power-level',
  'efficiency',
] as const;

export type SensitivityMetric = typeof SENSITIVITY_METRICS[number];

/**
 * Perturbation range types
 */
export const PERTURBATION_RANGES = [
  'tiny',      // ±1%
  'small',     // ±5%
  'medium',    // ±10%
  'large',     // ±20%
  'extreme',   // ±50%
] as const;

export type PerturbationRange = typeof PERTURBATION_RANGES[number];

/**
 * Sensitivity threshold levels
 */
export const SENSITIVITY_THRESHOLDS = [
  'insensitive',
  'low',
  'moderate',
  'high',
  'critical',
] as const;

export type SensitivityThreshold = typeof SENSITIVITY_THRESHOLDS[number];

/**
 * Analysis scope types
 */
export const ANALYSIS_SCOPES = [
  'single-stat',
  'pairwise',
  'full-system',
  'custom',
] as const;

export type AnalysisScope = typeof ANALYSIS_SCOPES[number];

/**
 * Sensitivity result schema
 */
export const SensitivityResultSchema = z.object({
  statId: z.string(),
  statName: z.string(),
  originalWeight: z.number(),
  perturbations: z.array(z.object({
    perturbation: z.number(), // ±X% change
    newWeight: z.number(),
    metrics: z.record(z.number()),
    sensitivity: z.number(), // 0-1 sensitivity score
    impact: z.number(), // -1 to 1 impact score
    confidence: z.number(), // 0-1 confidence in result
  })),
  overallSensitivity: z.number(),
  criticalThreshold: z.number(),
  recommendations: z.array(z.string()),
  analysisDate: z.string(),
  iterations: z.number(),
});

/**
 * Sensitivity analysis configuration schema
 */
export const SensitivityConfigSchema = z.object({
  metrics: z.array(z.object({
    id: z.enum(SENSITIVITY_METRICS),
    name: z.string(),
    description: z.string(),
    weight: z.number().min(0).max(1),
    higherIsBetter: z.boolean(),
    targetValue: z.number().optional(),
  })),
  perturbationRanges: z.array(z.object({
    id: z.enum(PERTURBATION_RANGES),
    percentage: z.number().min(0).max(1),
    steps: z.number().min(3).max(20),
    description: z.string(),
  })),
  thresholds: z.object({
    insensitive: z.number().min(0).max(1),
    low: z.number().min(0).max(1),
    moderate: z.number().min(0).max(1),
    high: z.number().min(0).max(1),
    critical: z.number().min(0).max(1),
  }),
  analysis: z.object({
    scope: z.enum(ANALYSIS_SCOPES),
    iterations: z.number().min(100).max(10000),
    seed: z.number().int().min(0),
    parallelRuns: z.number().min(1).max(10),
    timeoutMs: z.number().min(5000).max(300000),
    maxPerturbations: z.number().min(5).max(100),
  }),
  monteCarlo: z.object({
    targetTurns: z.number().min(5).max(50),
    scenarioType: z.enum(['1v1', 'boss', 'group', 'swarm']),
    archetypes: z.number().min(2).max(50),
    budgetPoints: z.number().min(50).max(500),
  }),
  ui: z.object({
    showHeatmap: z.boolean().default(true),
    showRecommendations: z.boolean().default(true),
    showCriticalWeights: z.boolean().default(true),
    enableRealTimeAnalysis: z.boolean().default(false),
    animationDuration: z.number().min(0).max(1000).default(300),
  }),
});

export type SensitivityResult = z.infer<typeof SensitivityResultSchema>;
export type SensitivityConfig = z.infer<typeof SensitivityConfigSchema>;

/**
 * Default sensitivity analysis configuration
 */
export const DEFAULT_SENSITIVITY_CONFIG: SensitivityConfig = {
  metrics: [
    {
      id: 'balance-score',
      name: 'Balance Score',
      description: 'Overall balance score calculated from weighted metrics',
      weight: 0.3,
      higherIsBetter: true,
    },
    {
      id: 'win-rate',
      name: 'Win Rate',
      description: 'Percentage of victories in simulations',
      weight: 0.25,
      higherIsBetter: true,
      targetValue: 0.5,
    },
    {
      id: 'average-turns',
      name: 'Average Turns',
      description: 'Average number of turns to complete scenario',
      weight: 0.15,
      higherIsBetter: false,
      targetValue: 15,
    },
    {
      id: 'damage-output',
      name: 'Damage Output',
      description: 'Average damage dealt per turn',
      weight: 0.1,
      higherIsBetter: true,
    },
    {
      id: 'survivability',
      name: 'Survivability',
      description: 'HP remaining and damage mitigation',
      weight: 0.1,
      higherIsBetter: true,
    },
    {
      id: 'synergy-score',
      name: 'Synergy Score',
      description: 'Calculated synergy between stats',
      weight: 0.05,
      higherIsBetter: true,
    },
    {
      id: 'power-level',
      name: 'Power Level',
      description: 'Estimated power level (1-10)',
      weight: 0.05,
      higherIsBetter: true,
    },
    {
      id: 'efficiency',
      name: 'Efficiency',
      description: 'Resource efficiency and optimization',
      weight: 0.05,
      higherIsBetter: true,
    },
  ],
  perturbationRanges: [
    {
      id: 'tiny',
      percentage: 0.01, // ±1%
      steps: 5,
      description: 'Tiny perturbations for fine-grained analysis',
    },
    {
      id: 'small',
      percentage: 0.05, // ±5%
      steps: 7,
      description: 'Small perturbations for minor adjustments',
    },
    {
      id: 'medium',
      percentage: 0.10, // ±10%
      steps: 9,
      description: 'Medium perturbations for standard analysis',
    },
    {
      id: 'large',
      percentage: 0.20, // ±20%
      steps: 11,
      description: 'Large perturbations for significant changes',
    },
    {
      id: 'extreme',
      percentage: 0.50, // ±50%
      steps: 13,
      description: 'Extreme perturbations for stress testing',
    },
  ],
  thresholds: {
    insensitive: 0.05,
    low: 0.15,
    moderate: 0.25,
    high: 0.40,
    critical: 0.60,
  },
  analysis: {
    scope: 'full-system',
    iterations: 1000,
    seed: 42,
    parallelRuns: 4,
    timeoutMs: 60000,
    maxPerturbations: 25,
  },
  monteCarlo: {
    targetTurns: 15,
    scenarioType: '1v1',
    archetypes: 10,
    budgetPoints: 100,
  },
  ui: {
    showHeatmap: true,
    showRecommendations: true,
    showCriticalWeights: true,
    enableRealTimeAnalysis: false,
    animationDuration: 300,
  },
};

/**
 * Perturbation range definitions
 */
export const PERTURBATION_RANGE_DEFINITIONS = {
  tiny: {
    label: 'Tiny',
    description: '±1% weight changes for fine-grained analysis',
    range: 0.01,
    steps: 5,
    color: '#e5e7eb',
  },
  small: {
    label: 'Small',
    description: '±5% weight changes for minor adjustments',
    range: 0.05,
    steps: 7,
    color: '#d1d5db',
  },
  medium: {
    label: 'Medium',
    description: '±10% weight changes for standard analysis',
    range: 0.10,
    steps: 9,
    color: '#9ca3af',
  },
  large: {
    label: 'Large',
    description: '±20% weight changes for significant adjustments',
    range: 0.20,
    steps: 11,
    color: '#6b7280',
  },
  extreme: {
    label: 'Extreme',
    description: '±50% weight changes for stress testing',
    range: 0.50,
    steps: 13,
    color: '#4b5563',
  },
} as const;

/**
 * Sensitivity threshold definitions
 */
export const SENSITIVITY_THRESHOLD_DEFINITIONS = {
  insensitive: {
    label: 'Insensitive',
    description: 'Weight changes have minimal impact on balance',
    color: '#10b981',
    icon: '🛡️',
    recommendation: 'Weight is stable and can be safely adjusted',
  },
  low: {
    label: 'Low Sensitivity',
    description: 'Weight changes have minor impact on balance',
    color: '#84cc16',
    icon: '📉',
    recommendation: 'Weight is relatively stable, monitor for changes',
  },
  moderate: {
    label: 'Moderate Sensitivity',
    description: 'Weight changes have noticeable impact on balance',
    color: '#f59e0b',
    icon: '⚖️',
    recommendation: 'Weight requires careful consideration for changes',
  },
  high: {
    label: 'High Sensitivity',
    description: 'Weight changes have significant impact on balance',
    color: '#ef4444',
    icon: '⚠️',
    recommendation: 'Weight is critical, changes require thorough testing',
  },
  critical: {
    label: 'Critical Sensitivity',
    description: 'Weight changes have dramatic impact on balance',
    color: '#dc2626',
    icon: '🚨',
    recommendation: 'Weight is extremely critical, avoid changes without extensive testing',
  },
} as const;

/**
 * Analysis scope definitions
 */
export const ANALYSIS_SCOPE_DEFINITIONS = {
  'single-stat': {
    label: 'Single Stat Analysis',
    description: 'Analyze sensitivity of individual stats in isolation',
    complexity: 'low',
    duration: 'fast',
    useCase: 'Quick checks on specific stat adjustments',
  },
  'pairwise': {
    label: 'Pairwise Analysis',
    description: 'Analyze sensitivity of stat pairs and interactions',
    complexity: 'medium',
    duration: 'medium',
    useCase: 'Understanding stat interactions and synergies',
  },
  'full-system': {
    label: 'Full System Analysis',
    description: 'Analyze sensitivity of entire stat weight system',
    complexity: 'high',
    duration: 'slow',
    useCase: 'Comprehensive balance analysis and optimization',
  },
  'custom': {
    label: 'Custom Analysis',
    description: 'Custom analysis with user-defined parameters',
    complexity: 'variable',
    duration: 'variable',
    useCase: 'Specialized analysis requirements',
  },
} as const;

/**
 * Get sensitivity threshold level for a given value
 */
export function getSensitivityThreshold(value: number, thresholds: SensitivityConfig['thresholds']): SensitivityThreshold {
  if (value <= thresholds.insensitive) return 'insensitive';
  if (value <= thresholds.low) return 'low';
  if (value <= thresholds.moderate) return 'moderate';
  if (value <= thresholds.high) return 'high';
  return 'critical';
}

/**
 * Get color for sensitivity threshold level
 */
export function getSensitivityColor(threshold: SensitivityThreshold): string {
  return SENSITIVITY_THRESHOLD_DEFINITIONS[threshold].color;
}

/**
 * Get icon for sensitivity threshold level
 */
export function getSensitivityIcon(threshold: SensitivityThreshold): string {
  return SENSITIVITY_THRESHOLD_DEFINITIONS[threshold].icon;
}

/**
 * Get recommendation for sensitivity threshold level
 */
export function getSensitivityRecommendation(threshold: SensitivityThreshold): string {
  return SENSITIVITY_THRESHOLD_DEFINITIONS[threshold].recommendation;
}

/**
 * Generate perturbation values for a given range
 */
export function generatePerturbations(range: PerturbationRange): number[] {
  const definition = PERTURBATION_RANGE_DEFINITIONS[range];
  const perturbations: number[] = [];
  
  for (let i = 0; i < definition.steps; i++) {
    const percentage = definition.range * (i / (definition.steps - 1) - 0.5) * 2;
    perturbations.push(percentage);
  }
  
  return perturbations;
}

/**
 * Calculate sensitivity score from perturbation results
 */
export function calculateSensitivityScore(
  perturbations: SensitivityResult['perturbations'],
  metric: SensitivityMetric
): number {
  if (perturbations.length === 0) return 0;
  
  // Calculate variance in metric values
  const metricValues = perturbations.map(p => p.metrics[metric] || 0);
  const mean = metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
  const variance = metricValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / metricValues.length;
  
  // Normalize variance to 0-1 scale (higher variance = higher sensitivity)
  const maxVariance = 1.0; // Adjust based on your data
  return Math.min(variance / maxVariance, 1);
}

/**
 * Calculate impact score for a perturbation
 */
export function calculateImpactScore(
  originalMetric: number,
  perturbedMetric: number,
  higherIsBetter: boolean
): number {
  const change = perturbedMetric - originalMetric;
  const relativeChange = originalMetric !== 0 ? change / Math.abs(originalMetric) : 0;
  
  // Normalize to -1 to 1 scale
  const impact = Math.max(-1, Math.min(1, relativeChange));
  
  // Adjust for direction preference
  return higherIsBetter ? impact : -impact;
}

/**
 * Identify critical weights from sensitivity analysis
 */
export function identifyCriticalWeights(
  results: SensitivityResult[],
  thresholds: SensitivityConfig['thresholds']
): string[] {
  const criticalWeights: string[] = [];
  
  for (const result of results) {
    if (result.overallSensitivity >= thresholds.critical) {
      criticalWeights.push(result.statId);
    }
  }
  
  return criticalWeights;
}

/**
 * Generate recommendations based on sensitivity analysis
 */
export function generateRecommendations(
  result: SensitivityResult,
  thresholds: SensitivityConfig['thresholds']
): string[] {
  const recommendations: string[] = [];
  
  const threshold = getSensitivityThreshold(result.overallSensitivity, thresholds);
  recommendations.push(getSensitivityRecommendation(threshold));
  
  // Add specific recommendations based on perturbation patterns
  const highImpactPerturbations = result.perturbations.filter(p => 
    Math.abs(p.impact) >= 0.2
  );
  
  if (highImpactPerturbations.length > 0) {
    recommendations.push(
      `${result.statName} shows high sensitivity to large perturbations (${highImpactPerturbations.length} cases)`
    );
  }
  
  const asymmetricPerturbations = result.perturbations.filter(p => 
    Math.abs(p.perturbation) > 0.1 && Math.abs(p.impact) < 0.05
  );
  
  if (asymmetricPerturbations.length > 0) {
    recommendations.push(
      `${result.statName} shows asymmetric response to perturbations (${asymmetricPerturbations.length} cases)`
    );
  }
  
  return recommendations;
}

/**
 * Create safe sensitivity configuration
 */
export function createSafeSensitivityConfig(config: Partial<SensitivityConfig>): SensitivityConfig {
  const result = SensitivityConfigSchema.safeParse(config);
  
  if (result.success) {
    return result.data;
  }
  
  // Return default config with merged valid data
  return {
    ...DEFAULT_SENSITIVITY_CONFIG,
    ...config,
  };
}

/**
 * Validate sensitivity configuration
 */
export function validateSensitivityConfig(config: Partial<SensitivityConfig>): string[] {
  const result = SensitivityConfigSchema.safeParse(config);
  
  if (result.success) {
    return [];
  }
  
  return result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
}

/**
 * Export configuration for external usage
 */
export const SENSITIVITY_CONFIG = {
  metrics: SENSITIVITY_METRICS,
  perturbationRanges: PERTURBATION_RANGES,
  thresholds: SENSITIVITY_THRESHOLDS,
  analysisScopes: ANALYSIS_SCOPES,
  definitions: {
    perturbationRanges: PERTURBATION_RANGE_DEFINITIONS,
    sensitivityThresholds: SENSITIVITY_THRESHOLD_DEFINITIONS,
    analysisScopes: ANALYSIS_SCOPE_DEFINITIONS,
  },
  default: DEFAULT_SENSITIVITY_CONFIG,
  helpers: {
    getSensitivityThreshold,
    getSensitivityColor,
    getSensitivityIcon,
    getSensitivityRecommendation,
    generatePerturbations,
    calculateSensitivityScore,
    calculateImpactScore,
    identifyCriticalWeights,
    generateRecommendations,
  },
} as const;
