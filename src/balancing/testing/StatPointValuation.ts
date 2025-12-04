import type { BalancerConfig, StatDefinition } from '../config/types';
import type { StatBlock } from '../types';
import { DEFAULT_STATS } from '../types';
import { MonteCarloSimulation } from '../simulation/MonteCarloSimulation';
import type { SimulationConfig } from '../simulation/types';
import { BalancerConfigStore } from '../config/BalancerConfigStore';

export interface StatPointCost {
  statId: string;
  /** Raw delta applied to the underlying StatBlock value */
  delta: number;
  /** Win rate of boosted build vs baseline (0–1) */
  winRateBoosted: number;
  /** Win rate delta vs perfectly even 50% */
  deltaWinRate: number;
  /** Sensitivity of win rate per 1 unit of stat (ΔWR / ΔX) */
  sensitivityPerUnit: number;
  /** Normalized point cost per unit, based on a target ΔWR */
  pointsPerUnit: number;
}

// Target winrate change that should correspond roughly to "1 point" of budget
const TARGET_DELTA_WR = 0.05; // +5% win chance for reference delta
const GLOBAL_SCALE_K = 1.0;

function cloneStatBlock(src: StatBlock): StatBlock {
  return JSON.parse(JSON.stringify(src)) as StatBlock;
}

function buildBaselineFromConfig(config: BalancerConfig): StatBlock {
  // Start from DEFAULT_STATS to ensure all required fields exist
  const base = cloneStatBlock(DEFAULT_STATS);

  // Override with current BalancerConfig default values for non-derived stats
  Object.values(config.stats).forEach((stat) => {
    if (stat.isDerived || typeof stat.formula === 'string') return;
    const key = stat.id as keyof StatBlock;
    if (key in base) {
      (base as any)[key] = stat.defaultValue;
    }
  });

  return base;
}

/**
 * Convert a StatBlock to EntityStats for MonteCarloSimulation
 * (mirrors RoundRobinRunner.toEntityStats).
 */
function toEntityStats(stats: StatBlock, name: string) {
  return {
    ...stats,
    name,
    attack: stats.damage,
    defense: stats.armor,
  };
}

function isDerivedOrFormula(stat: StatDefinition): boolean {
  return stat.isDerived === true || typeof stat.formula === 'string';
}

function getDeltaForStat(def: StatDefinition): number {
  // Hand-tuned overrides for core stats
  switch (def.id) {
    case 'hp':
      return 50;
    case 'damage':
      return 5;
    case 'armor':
      return 5;
    case 'critChance':
      return 5;
    case 'evasion':
      return 5;
    case 'txc':
      return 5;
    case 'lifesteal':
      return 5;
    case 'regen':
      return 5;
    case 'ward':
      return 10;
    default:
      break;
  }

  const range = typeof def.max === 'number' && typeof def.min === 'number'
    ? def.max - def.min
    : 0;
  const step = typeof def.step === 'number' && def.step > 0 ? def.step : 1;

  // Fallback: use either 5 steps or ~5% of the range, whichever is larger
  const byStep = step * 5;
  const byRange = range > 0 ? range * 0.05 : step;

  return Math.max(byStep, byRange);
}

/**
 * Core entry point: estimate point costs for each non-derived stat in the config.
 */
export async function estimateStatPointCosts(
  config: BalancerConfig,
  iterations: number = 10000,
): Promise<StatPointCost[]> {
  const baseline = buildBaselineFromConfig(config);

  const results: StatPointCost[] = [];

  for (const def of Object.values(config.stats)) {
    if (isDerivedOrFormula(def) || def.isHidden) continue;

    const key = def.id as keyof StatBlock;
    if (typeof (baseline as any)[key] !== 'number') continue;

    const delta = getDeltaForStat(def);
    if (delta <= 0) continue;

    const boosted = cloneStatBlock(baseline);
    (boosted as any)[key] = ((boosted as any)[key] as number) + delta;

    const simConfig: SimulationConfig = {
      iterations,
      combat: {
        entity1: toEntityStats(baseline, 'baseline'),
        entity2: toEntityStats(boosted, `baseline+${def.id}`),
        turnLimit: 100,
      },
    };

    const simResult = MonteCarloSimulation.run(simConfig);
    const winRateBoosted = simResult.summary.winRates.entity2;
    const deltaWinRate = winRateBoosted - 0.5;

    const sensitivityPerUnit = delta !== 0 ? deltaWinRate / delta : 0;

    // Normalize so that targetDeltaWR corresponds to ~1 point for the chosen delta
    let pointsPerUnit = 0;
    if (delta !== 0) {
      const normalized = deltaWinRate / TARGET_DELTA_WR; // 1.0 => "one point" effect
      pointsPerUnit = (GLOBAL_SCALE_K * normalized) / delta;
    }

    results.push({
      statId: def.id,
      delta,
      winRateBoosted,
      deltaWinRate,
      sensitivityPerUnit,
      pointsPerUnit,
    });
  }

  return results;
}

/**
 * Convenience helper: load current BalancerConfig from the store and run valuation.
 */
export async function estimateStatPointCostsFromStore(
  iterations: number = 10000,
): Promise<StatPointCost[]> {
  const config = BalancerConfigStore.load();
  return estimateStatPointCosts(config, iterations);
}
