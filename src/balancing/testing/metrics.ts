import type { StatsArchetypeType } from './StressTestArchetypeGenerator';

/**
 * Metrics for a single-stat statsArchetype at a given tier.
 */
export interface MarginalUtilityMetrics {
  /** Stat id (for single-stat configs) */
  statId: string;
  /** Tier of points used (e.g. 25, 50, 75) */
  pointsPerStat: number;
  /** Type of statsArchetype (should be 'single-stat' here) */
  type: StatsArchetypeType;

  // Core outcome vs baseline
  winRate: number;       // 0–1, entity2 (statsArchetype) win rate
  avgTurns: number;      // average number of turns per combat

  // HP trade expressed in percentage terms
  // Positive = statsArchetype usually ends with more %HP than baseline
  hpTradeEfficiency: number; // average(oppHP% - myHP%) or similar normalized measure

  /**
   * Composite score to rank stats at a glance.
   * Around 1.0 ≈ baseline; >1.1 = strong, <0.9 = weak.
   */
  utilityScore: number;

  /** 0–1 confidence based on variance and sample size */
  confidence: number;
}

/**
 * Synergy metrics for a pair-stat statsArchetype vs baseline,
 * using expectations from the individual single-stat results.
 */
export interface PairSynergyMetrics {
  /** Stat ids composing the pair */
  statA: string;
  statB: string;
  /** Tier of points used on each stat (e.g. 25, 50, 75) */
  pointsPerStat: number;

  // Outcomes for the pair statsArchetype vs baseline
  combinedWinRate: number;   // 0–1, pair vs baseline

  // Expected outcome based on individual marginal utilities
  expectedWinRate: number;   // (winRateA + winRateB) / 2

  // Relative synergy indicator
  synergyRatio: number;      // combinedWinRate / expectedWinRate

  /** Qualitative label derived from synergyRatio thresholds */
  assessment: 'OP' | 'synergistic' | 'neutral' | 'weak';
}
