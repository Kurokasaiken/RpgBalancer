/**
 * Types for Marginal Utility Calculator
 * 
 * Extended type definitions for Phase 10.5 marginal utility analysis
 * including simulation results, analysis metrics, and configuration.
 */

import type { MarginalUtilityConfig } from '../config/stressTesting/marginalUtilityConfig';

/**
 * Individual simulation result for a single matchup
 */
export interface SimulationResult {
  /** Unique identifier for this simulation */
  id: string;
  /** Archetype A in this matchup */
  archetypeA: string;
  /** Archetype B in this matchup */
  archetypeB: string;
  /** Whether archetype A won (true) or lost (false) */
  winnerA: boolean;
  /** Number of turns the simulation took */
  turns: number;
  /** HP remaining for winner */
  hpRemaining: number;
  /** Total damage dealt by winner */
  damageDealt: number;
  /** Seed used for this simulation */
  seed: number;
  /** Timestamp when simulation completed */
  timestamp: number;
}

/**
 * Complete simulation batch results for an archetype pair
 */
export interface SimulationBatch {
  /** Pair identifier */
  pairId: string;
  /** Stat IDs in this pair */
  statIds: [string, string];
  /** All simulation results */
  results: SimulationResult[];
  /** Total simulations run */
  totalSimulations: number;
  /** Win rate for archetype A */
  winRateA: number;
  /** Average turns across all simulations */
  avgTurns: number;
  /** Average HP remaining for winners */
  avgHpRemaining: number;
  /** Average damage dealt by winners */
  avgDamageDealt: number;
  /** Standard deviation of win rates */
  winRateStdDev: number;
  /** Runtime in milliseconds */
  runtimeMs: number;
}

/**
 * Marginal utility analysis metrics
 */
export interface MarginalUtilityMetrics {
  /** Stat identifier */
  statId: string;
  /** Average win rate against all other stats */
  avgWinRate: number;
  /** Standard deviation of win rates */
  stdDeviation: number;
  /** Number of matchups analyzed */
  matchupCount: number;
  /** Best performing matchup */
  bestMatchup: {
    opponentStat: string;
    winRate: number;
  };
  /** Worst performing matchup */
  worstMatchup: {
    opponentStat: string;
    winRate: number;
  };
  /** Overall performance ranking */
  ranking: number;
  /** Confidence interval (95%) */
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

/**
 * Synergy analysis result for stat pair combinations
 */
export interface SynergyAnalysis {
  /** Pair identifier */
  pairId: string;
  /** Stat IDs in this pair */
  statIds: [string, string];
  /** Observed win rate for this pair */
  observedWinRate: number;
  /** Expected win rate based on individual stats */
  expectedWinRate: number;
  /** Synergy multiplier (observed / expected) */
  synergyMultiplier: number;
  /** Whether this is an OP synergy */
  isOpSynergy: boolean;
  /** Whether this is a weak synergy */
  isWeakSynergy: boolean;
  /** Statistical significance */
  isSignificant: boolean;
  /** P-value for statistical significance */
  pValue: number;
  /** Effect size */
  effectSize: number;
}

/**
 * Complete marginal utility analysis results
 */
export interface MarginalUtilityAnalysis {
  /** Analysis identifier */
  id: string;
  /** Configuration used for analysis */
  config: {
    simulationCount: number;
    seed: number;
    thresholds: {
      opThreshold: number;
      weakThreshold: number;
    };
  };
  /** Individual stat metrics */
  statMetrics: MarginalUtilityMetrics[];
  /** Pair synergy analyses */
  synergyAnalyses: SynergyAnalysis[];
  /** Overall statistics */
  summary: {
    totalSimulations: number;
    totalRuntimeMs: number;
    avgSimulationsPerSecond: number;
    opSynergiesCount: number;
    weakSynergiesCount: number;
    significantSynergiesCount: number;
  };
  /** Analysis timestamp */
  timestamp: number;
}

/**
 * Progress tracking for long-running analysis
 */
export interface AnalysisProgress {
  /** Total pairs to analyze */
  totalPairs: number;
  /** Completed pairs */
  completedPairs: number;
  /** Current pair being processed */
  currentPair?: string;
  /** Estimated remaining time (ms) */
  estimatedTimeRemaining: number;
  /** Overall progress percentage */
  progressPercentage: number;
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv' | 'markdown';

/**
 * Export data structure
 */
export interface ExportData {
  /** Export format */
  format: ExportFormat;
  /** Export timestamp */
  exportedAt: string;
  /** Analysis results */
  analysis: MarginalUtilityAnalysis;
  /** Export metadata */
  metadata: {
    version: string;
    config: MarginalUtilityConfig;
    exportPath: string;
  };
}
