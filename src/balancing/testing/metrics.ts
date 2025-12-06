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

/**
 * Entry for a synergy factor table S(A,B) derived from PairSynergyMetrics.
 *
 * This is purely a measurement layer: it exposes deltas and ratios that can
 * later be converted into point adjustments by higher-level cost functions.
 */
export interface SynergyFactorEntry {
  statA: string;
  statB: string;
  pointsPerStat: number;

  combinedWinRate: number;
  expectedWinRate: number;

  /** Absolute delta vs expectation (ΔWR(A+B) - expectedDelta). */
  synergyDelta: number;

  /** Relative multiplier vs expectation (same as PairSynergyMetrics.synergyRatio). */
  synergyRatio: number;
}

/**
 * Convenience structure for looking up synergy information for any ordered
 * pair (A,B). The table is symmetric: S[A][B] = S[B][A].
 */
export type SynergyFactorTable = Record<string, Record<string, SynergyFactorEntry>>;

/**
 * Build a synergy factor table S(A,B) from raw PairSynergyMetrics.
 *
 * For each unordered pair {A,B}, we keep only the entry with the highest
 * pointsPerStat, mirroring the behaviour of the SynergyHeatmap UI which
 * focuses on the top tier per pair.
 */
export function buildSynergyFactorTable(metrics: PairSynergyMetrics[]): SynergyFactorTable {
  const table: SynergyFactorTable = {};

  for (const m of metrics) {
    const { statA, statB } = m;
    if (!table[statA]) table[statA] = {};
    if (!table[statB]) table[statB] = {};

    const existing = table[statA][statB];

    if (!existing || m.pointsPerStat > existing.pointsPerStat) {
      const entry: SynergyFactorEntry = {
        statA,
        statB,
        pointsPerStat: m.pointsPerStat,
        combinedWinRate: m.combinedWinRate,
        expectedWinRate: m.expectedWinRate,
        synergyDelta: m.combinedWinRate - m.expectedWinRate,
        synergyRatio: m.synergyRatio,
      };

      table[statA][statB] = entry;
      table[statB][statA] = entry;
    }
  }

  return table;
}
