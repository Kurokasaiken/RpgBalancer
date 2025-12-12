import type { BalancerConfig, StatDefinition } from '../config/types';

export type StatVector = Record<string, number>;

/**
 * Generic metrics object returned by a stat evaluator.
 * Keys are metric IDs (e.g. 'ttk', 'edpt', 'winRate'), values are numeric scores.
 */
export type StatMetrics = Record<string, number>;

/**
 * Pluggable evaluator used by the stress harness.
 * It receives a complete stat vector and returns metrics for that configuration.
 */
export type StatEvaluator = (stats: StatVector) => Promise<StatMetrics> | StatMetrics;

export interface SingleStatStressResult {
  statId: string;
  /** Actual delta applied to the stat, after clamping to min/max and step. */
  delta: number;
  baseline: StatMetrics;
  variant: StatMetrics;
}

export interface PairStatStressResult {
  statIdA: string;
  statIdB: string;
  deltaA: number;
  deltaB: number;
  baseline: StatMetrics;
  variant: StatMetrics;
}

export interface StatStressReport {
  /** Budget in HP-equivalent points per stat, interpreted via stat.weight. */
  budgetPerStat: number;
  /** IDs of driver stats that were actually tested (non-derived, non-penalty). */
  driverStatIds: string[];
  single: SingleStatStressResult[];
  pairs: PairStatStressResult[];
}

function getDriverStats(config: BalancerConfig): StatDefinition[] {
  return Object.values(config.stats)
    .filter((s) => !s.isDerived && !s.isPenalty)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function buildDefaultStatVector(config: BalancerConfig): StatVector {
  const values: StatVector = {};
  for (const [id, stat] of Object.entries(config.stats)) {
    values[id] = stat.defaultValue;
  }
  return values;
}

function getBaseValue(stat: StatDefinition, base: StatVector): number {
  const v = base[stat.id];
  return typeof v === 'number' ? v : stat.defaultValue;
}

function computeDelta(baseValue: number, stat: StatDefinition, budgetPerStat: number): number {
  if (budgetPerStat <= 0) return 0;
  if (stat.weight <= 0) return 0;

  // Budget interpreted as HP-equivalent cost; weight = HP per +1 stat.
  const rawIncrease = budgetPerStat / stat.weight;
  if (!Number.isFinite(rawIncrease) || rawIncrease <= 0) return 0;

  // Respect stat.step
  const stepped = Math.round(rawIncrease / stat.step) * stat.step;
  if (stepped === 0) return 0;

  const unclamped = baseValue + stepped;
  const clamped = Math.max(stat.min, Math.min(stat.max, unclamped));
  return clamped - baseValue;
}

/**
 * Run a stat stress test over all non-derived, non-penalty stats in the config.
 *
 * - For each driver stat, generates a single-stat variant with +Δstat derived from budgetPerStat and weight.
 * - For each pair of driver stats, generates a pair variant with both deltas applied.
 * - Delegates evaluation to the provided evaluator.
 */
export async function runStatStressTest(
  config: BalancerConfig,
  baseStats: StatVector,
  budgetPerStat: number,
  evaluator: StatEvaluator,
): Promise<StatStressReport> {
  const driverStats = getDriverStats(config);
  const driverStatIds = driverStats.map((s) => s.id);

  const baseline = await Promise.resolve(evaluator(baseStats));

  const single: SingleStatStressResult[] = [];
  const pairs: PairStatStressResult[] = [];

  // Single-stat variants
  for (const stat of driverStats) {
    const baseValue = getBaseValue(stat, baseStats);
    const delta = computeDelta(baseValue, stat, budgetPerStat);
    if (delta <= 0) continue;

    const variantStats: StatVector = { ...baseStats, [stat.id]: baseValue + delta };
    const variantMetrics = await Promise.resolve(evaluator(variantStats));

    single.push({
      statId: stat.id,
      delta,
      baseline: { ...baseline },
      variant: variantMetrics,
    });
  }

  // Pair-stat variants
  for (let i = 0; i < driverStats.length; i++) {
    for (let j = i + 1; j < driverStats.length; j++) {
      const statA = driverStats[i];
      const statB = driverStats[j];

      const baseA = getBaseValue(statA, baseStats);
      const baseB = getBaseValue(statB, baseStats);

      const deltaA = computeDelta(baseA, statA, budgetPerStat);
      const deltaB = computeDelta(baseB, statB, budgetPerStat);

      if (deltaA <= 0 && deltaB <= 0) continue;

      const variantStats: StatVector = { ...baseStats };
      if (deltaA > 0) variantStats[statA.id] = baseA + deltaA;
      if (deltaB > 0) variantStats[statB.id] = baseB + deltaB;

      const variantMetrics = await Promise.resolve(evaluator(variantStats));

      pairs.push({
        statIdA: statA.id,
        statIdB: statB.id,
        deltaA,
        deltaB,
        baseline: { ...baseline },
        variant: variantMetrics,
      });
    }
  }

  return {
    budgetPerStat,
    driverStatIds,
    single,
    pairs,
  };
}
