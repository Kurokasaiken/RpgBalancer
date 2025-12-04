import type { BalancerConfig, StatDefinition } from '../config/types';
import type { StatBlock } from '../types';
import { DEFAULT_STATS } from '../types';
import { getStatWeight } from '../statWeights';

export type StatsArchetypeType = 'single-stat' | 'pair-stat';

// NOTE: "StatsArchetype" = low-level stat stress configuration, not a full gameplay archetype.
export interface StatsArchetype {
  id: string;
  name: string;
  type: StatsArchetypeType;
  /**
   * Full stat block used for simulations (baseline + deltas)
   */
  stats: StatBlock;
  /**
   * Stat ids this archetype is explicitly stressing (length 1 or 2)
   */
  testedStats: string[];
  /**
   * Logical "points" allocated per tested stat (e.g. 25)
   */
  pointsPerStat: number;
  /**
   * Map of tested stat → hp-equivalent weight used
   */
  weights: Record<string, number>;
  description: string;
}

function cloneStatBlock(src: StatBlock): StatBlock {
  // Deep-clone to avoid accidental mutation
  return JSON.parse(JSON.stringify(src)) as StatBlock;
}

function buildBaseFromConfig(config: BalancerConfig): StatBlock {
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

function isDerivedOrFormula(stat: StatDefinition): boolean {
  // Exclude both explicit derived stats and any stat backed by a formula expression
  return stat.isDerived === true || typeof stat.formula === 'string';
}

/**
 * Generator for dynamic statsArchetype configurations based on the current BalancerConfig.
 *
 * - Reads stats from BalancerConfig (no hardcoding)
 * - Uses getStatWeight() to convert test points into hp-equivalent deltas
 * - Generates both single-stat and pair-stat archetypes
 */
export class StatsArchetypeGenerator {
  private readonly config: BalancerConfig;
  private readonly nonDerivedStatIds: string[];

  constructor(config: BalancerConfig) {
    this.config = config;
    this.nonDerivedStatIds = Object.values(config.stats)
      .filter((s) => !isDerivedOrFormula(s) && !s.isHidden)
      .map((s) => s.id);
  }

  /**
   * Build a baseline StatBlock for a given tier where each non-derived stat
   * receives an equal allocation of pointsPerStat, based on its weight.
   */
  private buildScaledBaseline(pointsPerStat: number): StatBlock {
    const stats = buildBaseFromConfig(this.config);

    for (const statId of this.nonDerivedStatIds) {
      const def = this.config.stats[statId];
      if (!def) continue;

      const weight = def.weight ?? getStatWeight(statId);
      const delta = weight * pointsPerStat;
      const current = (stats as any)[statId] ?? 0;
      (stats as any)[statId] = current + delta;
    }

    return stats;
  }

  /**
   * Generate archetypes that stress ONE stat at a time.
   *
   * For each stat and for each tier in pointTiers:
   * - Starts from BASELINE_STATS
   * - Adds (getStatWeight(statId) * tier) to that stat
   */
  generateSingleStatArchetypes(pointTiers: number[] = [25, 50, 75]): StatsArchetype[] {
    const result: StatsArchetype[] = [];

    for (const pointsPerStat of pointTiers) {
      // Baseline where every stat has pointsPerStat allocated
      const tierBaseline = this.buildScaledBaseline(pointsPerStat);

      for (const statId of this.nonDerivedStatIds) {
        const def = this.config.stats[statId];
        if (!def) continue;

        const weight = def.weight ?? getStatWeight(statId);
        const extraDelta = weight * pointsPerStat; // extra allocation on top of equal baseline

        const stats = cloneStatBlock(tierBaseline);
        const currentValue = (stats as any)[statId] ?? 0;
        (stats as any)[statId] = currentValue + extraDelta;

        result.push({
          id: `stress-${statId}-${pointsPerStat}`,
          name: `Stress +${pointsPerStat} ${def.label}`,
          type: 'single-stat',
          stats,
          testedStats: [statId],
          pointsPerStat,
          weights: { [statId]: weight },
          description: `Baseline + ${extraDelta.toFixed(2)} (${weight.toFixed(2)} hp/pt × ${pointsPerStat} pt) on ${def.label}`,
        });
      }
    }

    return result;
  }

  /**
   * Generate archetypes that stress PAIRS of stats (all C(n,2) combinations).
   *
   * For each pair and each tier in pointTiers:
   * - Starts from BASELINE_STATS
   * - Adds (getStatWeight(statA) * tier) to statA
   * - Adds (getStatWeight(statB) * tier) to statB
   */
  generatePairStatArchetypes(pointTiers: number[] = [25, 50, 75]): StatsArchetype[] {
    const result: StatsArchetype[] = [];
    const ids = this.nonDerivedStatIds;

    for (const pointsPerStat of pointTiers) {
      const tierBaseline = this.buildScaledBaseline(pointsPerStat);

      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i];
          const b = ids[j];

          const defA = this.config.stats[a];
          const defB = this.config.stats[b];
          if (!defA || !defB) continue;

          const weightA = defA.weight ?? getStatWeight(a);
          const weightB = defB.weight ?? getStatWeight(b);

          const extraDeltaA = weightA * pointsPerStat;
          const extraDeltaB = weightB * pointsPerStat;

          const stats = cloneStatBlock(tierBaseline);

          const currentA = (stats as any)[a] ?? 0;
          const currentB = (stats as any)[b] ?? 0;

          (stats as any)[a] = currentA + extraDeltaA;
          (stats as any)[b] = currentB + extraDeltaB;

          result.push({
            id: `stress-pair-${a}-${b}-${pointsPerStat}`,
            name: `Pair +${pointsPerStat} ${defA.label} & +${pointsPerStat} ${defB.label}`,
            type: 'pair-stat',
            stats,
            testedStats: [a, b],
            pointsPerStat,
            weights: { [a]: weightA, [b]: weightB },
            description: `Baseline + ${extraDeltaA.toFixed(2)} on ${defA.label}, + ${extraDeltaB.toFixed(2)} on ${defB.label}`,
          });
        }
      }
    }

    return result;
  }
}
