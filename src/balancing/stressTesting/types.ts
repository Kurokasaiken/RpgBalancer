/**
 * Type definitions for Phase 10.5 Stat Stress Testing system
 * Defines interfaces for archetypes, utility calculations, and synergy analysis
 */

import type { BalancerConfig, StatDefinition } from '../config/types';

/**
 * Stress test archetype with stat modifications for testing
 */
export interface StressTestArchetype {
  id: string;
  name: string;
  description: string;
  stats: Record<string, number>;
  testedStats: string[];
  pointsPerStat: number;
  seed: number;
  type: 'baseline' | 'single' | 'pair';
}

/**
 * Individual stat adjustment for archetype generation
 */
export interface StatAdjustment {
  /** Stat identifier */
  statId: string;
  /** Amount of adjustment (positive for increase, negative for decrease) */
  adjustment: number;
  /** Weight multiplier used for calculation */
  weightMultiplier: number;
}

/**
 * Complete stress testing scenario with configuration and results
 */
export interface StressTestScenario {
  /** Unique scenario identifier */
  id: string;
  /** Human-readable scenario name */
  name: string;
  /** Description of what this scenario tests */
  description: string;
  /** Base configuration used */
  config: BalancerConfig;
  /** Generated archetypes for this scenario */
  archetypes: StressTestArchetype[];
  /** Stat adjustments applied */
  adjustments: StatAdjustment[];
  /** Seed used for deterministic generation */
  seed: number;
  /** Timestamp when scenario was created */
  createdAt: Date;
}

/**
 * Result of marginal utility analysis for a single archetype
 */
export interface MarginalUtilityResult {
  archetype: StressTestArchetype;
  averageScore: number;
  marginalUtility: number;
  standardDeviation: number;
  simulationCount: number;
  runtimeMs: number;
}

/**
 * Synergy analysis result for stat pair combinations
 */
export interface SynergyResult {
  pairArchetype: StressTestArchetype;
  statIds: [string, string];
  pairScore: number;
  expectedScore: number;
  synergyMultiplier: number;
  isOpSynergy: boolean;
  isWeakSynergy: boolean;
  runtimeMs: number;
}

/**
 * Configuration for stress testing parameters
 */
export interface StressTestConfig {
  pointsPerStat: number;
  simulationCount: number;
  opSynergyThreshold: number;
  weakSynergyThreshold: number;
  seed: number;
  includeDerived: boolean;
  includeHidden: boolean;
}

/**
 * Complete stress testing analysis results
 */
export interface StressTestAnalysis {
  archetypes: StressTestArchetype[];
  marginalUtilities: MarginalUtilityResult[];
  synergies: SynergyResult[];
  heatmapData: Record<string, Record<string, number>>;
  config: StressTestConfig;
  timestamp: number;
  totalRuntimeMs: number;
}

/**
 * Stat pair for combination testing
 */
export interface StatPair {
  stat1: string;
  stat2: string;
  weight1: number;
  weight2: number;
}

/**
 * Utility metrics for stat assessment
 */
export interface StatUtilityMetrics {
  statId: string;
  singleStatUtility: number;
  pairSynergies: Record<string, number>;
  overallScore: number;
  assessment: 'OP' | 'strong' | 'balanced' | 'weak' | 'underpowered';
  rank: number;
}

/**
 * LCG (Linear Congruential Generator) for deterministic random numbers
 */
export class TestRNG {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = Math.pow(2, 32);

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  nextInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextInRange(min, max));
  }

  reset(seed: number): void {
    this.seed = seed;
  }

  getSeed(): number {
    return this.seed;
  }
}

/**
 * Extract non-derived stats from BalancerConfig for stress testing
 */
export function extractStressTestStats(config: BalancerConfig): Record<string, StatDefinition> {
  const stats: Record<string, StatDefinition> = {};
  
  Object.entries(config.stats).forEach(([id, stat]) => {
    // Skip derived stats, hidden stats, and stats with formulas
    if (!stat.isDerived && !stat.isHidden && !stat.formula) {
      stats[id] = stat;
    }
  });

  return stats;
}

/**
 * Generate all possible stat pairs from available stats
 */
export function generateStatPairs(stats: Record<string, StatDefinition>): StatPair[] {
  const statIds = Object.keys(stats);
  const pairs: StatPair[] = [];

  for (let i = 0; i < statIds.length; i++) {
    for (let j = i + 1; j < statIds.length; j++) {
      const stat1Id = statIds[i];
      const stat2Id = statIds[j];
      const stat1 = stats[stat1Id];
      const stat2 = stats[stat2Id];

      pairs.push({
        stat1: stat1Id,
        stat2: stat2Id,
        weight1: stat1.weight,
        weight2: stat2.weight,
      });
    }
  }

  return pairs;
}

/**
 * Calculate stat boost based on weight and points budget
 */
export function calculateStatBoost(weight: number, pointsPerStat: number): number {
  return Math.round(weight * pointsPerStat);
}

/**
 * Create baseline stats from config defaults
 */
export function createBaselineStats(config: BalancerConfig): Record<string, number> {
  const baseline: Record<string, number> = {};
  
  Object.entries(config.stats).forEach(([id, stat]) => {
    baseline[id] = stat.defaultValue;
  });

  return baseline;
}

/**
 * Validate stress test configuration
 */
export function validateStressTestConfig(config: Partial<StressTestConfig>): StressTestConfig {
  const defaultConfig: StressTestConfig = {
    pointsPerStat: 25,
    simulationCount: 10000,
    opSynergyThreshold: 1.15,
    weakSynergyThreshold: 0.95,
    seed: Date.now(),
    includeDerived: false,
    includeHidden: false,
  };

  return { ...defaultConfig, ...config };
}

/**
 * Assessment thresholds for stat evaluation
 */
export const ASSESSMENT_THRESHOLDS = {
  OP: 0.65,
  STRONG: 0.55,
  BALANCED_MIN: 0.45,
  BALANCED_MAX: 0.55,
  WEAK: 0.35,
  UNDERPOWERED: 0.35,
} as const;

/**
 * Get assessment label based on efficiency score
 */
export function getAssessment(efficiency: number): 'OP' | 'strong' | 'balanced' | 'weak' | 'underpowered' {
  if (efficiency > ASSESSMENT_THRESHOLDS.OP) return 'OP';
  if (efficiency > ASSESSMENT_THRESHOLDS.STRONG) return 'strong';
  if (efficiency >= ASSESSMENT_THRESHOLDS.BALANCED_MIN && efficiency <= ASSESSMENT_THRESHOLDS.BALANCED_MAX) return 'balanced';
  if (efficiency > ASSESSMENT_THRESHOLDS.WEAK) return 'weak';
  return 'underpowered';
}

/**
 * Get assessment color for UI display
 */
export function getAssessmentColor(assessment: string): string {
  switch (assessment) {
    case 'OP': return 'text-red-400';
    case 'strong': return 'text-amber-400';
    case 'balanced': return 'text-green-400';
    case 'weak': return 'text-blue-400';
    case 'underpowered': return 'text-purple-400';
    default: return 'text-slate-400';
  }
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with appropriate precision
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Calculate runtime statistics
 */
export interface RuntimeStats {
  totalMs: number;
  averageMs: number;
  minMs: number;
  maxMs: number;
  operationsPerSecond: number;
}

export function calculateRuntimeStats(runtimes: number[]): RuntimeStats {
  const totalMs = runtimes.reduce((sum, time) => sum + time, 0);
  const averageMs = totalMs / runtimes.length;
  const minMs = Math.min(...runtimes);
  const maxMs = Math.max(...runtimes);
  const operationsPerSecond = 1000 / averageMs;

  return {
    totalMs,
    averageMs,
    minMs,
    maxMs,
    operationsPerSecond,
  };
}
