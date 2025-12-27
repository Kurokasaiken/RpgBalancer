import type { BalancerConfig, StatDefinition } from '@/balancing/config/types';

/**
 * Represents an archetype for stress testing with stat values
 */
export interface Archetype {
  id: string;
  name: string;
  stats: Record<string, number>;
}

/**
 * Generates stress-test archetypes for marginal utility analysis.
 * Creates single-stat boosts and pair-stat combinations based on current balancer config.
 */
export class StressTestArchetypeGenerator {
  private config: BalancerConfig;
  private statDefinitions: Record<string, StatDefinition>;
  public statWeights: Record<string, number>;

  constructor(config: BalancerConfig) {
    this.config = config;
    this.statDefinitions = this.collectStatDefinitions();
    this.statWeights = this.collectStatWeights();
  }

  private collectStatDefinitions(): Record<string, StatDefinition> {
    return this.config.stats;
  }

  private collectStatWeights(): Record<string, number> {
    const weights: Record<string, number> = {};
    Object.values(this.statDefinitions).forEach(stat => {
      weights[stat.id] = stat.weight;
    });
    return weights;
  }

  /**
   * Generates baseline archetype from config defaults
   */
  generateBaselineArchetype(): Archetype {
    const stats: Record<string, number> = {};

    Object.values(this.statDefinitions).forEach(stat => {
      stats[stat.id] = stat.defaultValue ?? 0;
    });

    return {
      id: 'baseline',
      name: 'Baseline Archetype',
      stats,
    };
  }

  /**
   * Generates single-stat stress test archetypes.
   * For each stat, creates archetype with + (weight * 25) points in that stat.
   */
  generateSingleStatArchetypes(): Archetype[] {
    const baseline = this.generateBaselineArchetype();
    const archetypes: Archetype[] = [];

    Object.entries(this.statWeights).forEach(([statId, weight]) => {
      const boostAmount = Math.round(weight * 25);
      const stats = { ...baseline.stats };
      stats[statId] = (stats[statId] ?? 0) + boostAmount;

      archetypes.push({
        id: `single_${statId}`,
        name: `${this.statDefinitions[statId]?.label ?? statId} +${boostAmount}`,
        stats,
      });
    });

    return archetypes;
  }

  /**
   * Generates pair-stat stress test archetypes.
   * For all C(n,2) combinations, creates archetypes with +25 points in each of the two stats.
   */
  generatePairStatArchetypes(): Archetype[] {
    const baseline = this.generateBaselineArchetype();
    const archetypes: Archetype[] = [];
    const statIds = Object.keys(this.statWeights);

    for (let i = 0; i < statIds.length; i++) {
      for (let j = i + 1; j < statIds.length; j++) {
        const statId1 = statIds[i];
        const statId2 = statIds[j];
        const boostAmount1 = Math.round(this.statWeights[statId1] * 25);
        const boostAmount2 = Math.round(this.statWeights[statId2] * 25);

        const stats = { ...baseline.stats };
        stats[statId1] = (stats[statId1] ?? 0) + boostAmount1;
        stats[statId2] = (stats[statId2] ?? 0) + boostAmount2;

        const label1 = this.statDefinitions[statId1]?.label ?? statId1;
        const label2 = this.statDefinitions[statId2]?.label ?? statId2;

        archetypes.push({
          id: `pair_${statId1}_${statId2}`,
          name: `${label1} +${boostAmount1} & ${label2} +${boostAmount2}`,
          stats,
        });
      }
    }

    return archetypes;
  }

  /**
   * Generates all stress test archetypes
   */
  generateAllStressTestArchetypes(): Archetype[] {
    const baseline = this.generateBaselineArchetype();
    const singleStats = this.generateSingleStatArchetypes();
    const pairStats = this.generatePairStatArchetypes();

    return [baseline, ...singleStats, ...pairStats];
  }
}

/**
 * Convenience function to generate all stress test archetypes from config
 */
export function generateStressTestArchetypes(config: BalancerConfig): Archetype[] {
  const generator = new StressTestArchetypeGenerator(config);
  return generator.generateAllStressTestArchetypes();
}
