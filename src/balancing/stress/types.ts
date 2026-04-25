/**
 * Types for Marginal Utility Calculator and Synergy Analysis
 * Config-first design with deterministic simulation support
 */

import type { BalancerConfig, StatDefinition } from '../config/types';

/**
 * Configuration for marginal utility simulations.
 */
export interface MarginalUtilityConfig {
  /** Number of simulations per archetype (default: 10000) */
  simulationsPerArchetype: number;
  /** Random seed for deterministic results */
  seed: number;
  /** Whether to use web workers for parallel processing */
  useWebWorkers: boolean;
  /** Maximum number of concurrent workers */
  maxWorkers: number;
  /** Cache results for performance */
  enableCache: boolean;
  /** Export formats to generate */
  exportFormats: Array<'json' | 'csv' | 'markdown'>;
}

/**
 * Single stat archetype for stress testing.
 */
export interface SingleStatArchetype {
  statId: string;
  baselineValue: number;
  augmentedValue: number;
  weight: number;
  description: string;
}

/**
 * Pair stat archetype for synergy testing.
 */
export interface PairStatArchetype {
  stat1Id: string;
  stat2Id: string;
  baseline1Value: number;
  baseline2Value: number;
  augmented1Value: number;
  augmented2Value: number;
  weight1: number;
  weight2: number;
  description: string;
}

/**
 * Results from a single archetype simulation.
 */
export interface ArchetypeResult {
  archetypeId: string;
  description: string;
  wins: number;
  totalSimulations: number;
  winRate: number;
  averageDamage: number;
  averageSurvivalTime: number;
  executionTime: number;
}

/**
 * Synergy analysis result for a stat pair.
 */
export interface SynergyResult {
  stat1Id: string;
  stat2Id: string;
  pairScore: number;
  expectedScore: number;
  synergyMultiplier: number;
  isOpSynergy: boolean;
  isWeakSynergy: boolean;
  confidence: number;
  sampleSize: number;
}

/**
 * Complete marginal utility analysis results.
 */
export interface MarginalUtilityResults {
  /** Configuration used for the analysis */
  config: MarginalUtilityConfig;
  /** Timestamp when analysis was performed */
  timestamp: number;
  /** Baseline configuration used */
  baselineConfig: BalancerConfig;
  /** Single stat archetype results */
  singleStatResults: ArchetypeResult[];
  /** Pair stat archetype results */
  pairStatResults: ArchetypeResult[];
  /** Synergy analysis matrix */
  synergyMatrix: SynergyResult[];
  /** Performance metrics */
  performance: {
    totalExecutionTime: number;
    simulationsPerSecond: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  /** Export data in various formats */
  exports: {
    json?: string;
    csv?: string;
    markdown?: string;
  };
}

/**
 * Progress callback for long-running simulations.
 */
export type ProgressCallback = (progress: {
  current: number;
  total: number;
  percentage: number;
  currentArchetype?: string;
  estimatedTimeRemaining?: number;
}) => void;

/**
 * Simulation options for marginal utility calculator.
 */
export interface SimulationOptions {
  /** Progress callback for UI updates */
  onProgress?: ProgressCallback;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
  /** Whether to include detailed metrics */
  includeDetailedMetrics?: boolean;
  /** Custom baseline configuration (overrides default) */
  baselineConfig?: BalancerConfig;
}

/**
 * Cache entry for simulation results.
 */
export interface CacheEntry {
  results: MarginalUtilityResults;
  timestamp: number;
  configHash: string;
  expiresAt: number;
}

/**
 * Export format configuration.
 */
export interface ExportConfig {
  /** Include raw simulation data */
  includeRawData: boolean;
  /** Include performance metrics */
  includePerformance: boolean;
  /** Format timestamps as ISO strings */
  isoTimestamps: boolean;
  /** Decimal places for numeric values */
  decimalPlaces: number;
  /** Custom headers for CSV export */
  csvHeaders?: Record<string, string>;
}

/**
 * Default configuration values.
 */
export const DEFAULT_MARGINAL_UTILITY_CONFIG: MarginalUtilityConfig = {
  simulationsPerArchetype: 10000,
  seed: Date.now(),
  useWebWorkers: true,
  maxWorkers: 4,
  enableCache: true,
  exportFormats: ['json', 'csv', 'markdown'],
};

/**
 * Synergy thresholds (config-driven).
 */
export const SYNERGY_THRESHOLDS = {
  /** Multiplier above which synergy is considered OP */
  opThreshold: 1.15,
  /** Multiplier below which synergy is considered weak */
  weakThreshold: 0.95,
  /** Minimum sample size for reliable results */
  minSampleSize: 1000,
  /** Confidence threshold for statistical significance */
  confidenceThreshold: 0.95,
} as const;

/**
 * Validation result for configuration.
 */
export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Statistical metrics for simulation quality.
 */
export interface StatisticalMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  sampleSize: number;
  confidenceInterval: [number, number];
  pValue?: number;
}

/**
 * Heatmap data point for visualization.
 */
export interface HeatmapDataPoint {
  row: string;
  column: string;
  value: number;
  intensity: number; // 0-1 for color intensity
  label: string;
  tooltip: string;
}

/**
 * Dashboard configuration for stress testing UI.
 */
export interface StressTestDashboardConfig {
  /** Maximum number of archetypes to display */
  maxArchetypes: number;
  /** Color scheme for heatmap */
  heatmapColors: {
    op: string;
    weak: string;
    neutral: string;
    background: string;
  };
  /** Chart configuration */
  charts: {
    showRadarChart: boolean;
    showBarChart: boolean;
    showScatterPlot: boolean;
  };
  /** Export options */
  exportOptions: {
    allowCSV: boolean;
    allowJSON: boolean;
    allowMarkdown: boolean;
  };
}
