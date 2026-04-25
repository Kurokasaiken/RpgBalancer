import type { BalancerConfig, StatDefinition } from '@/balancing/config/types';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { TestRNG } from '@/balancing/utils/TestRNG';
import type { StressTestArchetype } from './types';
import { getArchetypeConfig } from '@/balancing/config/stressTesting';
import { areStatsIncompatible, getSynergyMultiplier } from '@/balancing/config/stressTesting/archetypeSeeds';

/**
 * Generator for stress testing archetypes based on balancer config.
 */
export class StressTestArchetypeGenerator {
  private config: BalancerConfig;
  public statDefinitions: Record<string, StatDefinition>;
  public statWeights: Record<string, number>;
  private rng: TestRNG;

  constructor(config: BalancerConfig, seed?: number) {
    this.config = config;
    this.statDefinitions = this.collectStatDefinitions();
    this.statWeights = this.collectStatWeights();
    
    // Use seed from config if not provided
    const configSeed = seed ?? 42; // Will be replaced by async call
    this.rng = new TestRNG(configSeed);
    console.log(`[StressTestArchetypeGenerator] Initialized with seed ${configSeed}`);
  }

  /**
   * Async constructor that loads configuration from the centralized config loader
   */
  static async create(seed?: number): Promise<StressTestArchetypeGenerator> {
    const config = await BalancerConfigStore.load();
    const archetypeConfig = await getArchetypeConfig();
    
    const generator = new StressTestArchetypeGenerator(config, seed ?? archetypeConfig.defaultSeed);
    
    // Update RNG with config seed if not provided
    if (!seed) {
      generator.rng = new TestRNG(archetypeConfig.defaultSeed);
    }
    
    return generator;
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
   * Generates baseline archetype from config defaults.
   */
  generateBaselineArchetype(): StressTestArchetype {
    const stats: Record<string, number> = {};

    Object.values(this.statDefinitions).forEach(stat => {
      stats[stat.id] = stat.defaultValue ?? 0;
    });

    console.log(`[StressTestArchetypeGenerator] Generated baseline archetype with ${Object.keys(stats).length} stats`);
    const archetype: StressTestArchetype = {
      id: 'baseline',
      name: 'Baseline',
      description: 'Baseline archetype with default stats',
      stats,
      testedStats: [],
      pointsPerStat: 0,
      seed: this.rng.getSeed(),
      type: 'baseline',
    };
    return archetype;
  }

  /**
   * Generates single-stat stress test archetypes.
   * For each stat, creates archetype with + (weight * pointsPerWeight) points in that stat.
   */
  async generateSingleStatArchetypes(): Promise<StressTestArchetype[]> {
    const baseline = this.generateBaselineArchetype();
    const archetypes: StressTestArchetype[] = [];
    const archetypeConfig = await getArchetypeConfig();

    console.log(`[StressTestArchetypeGenerator] Generating single-stat archetypes for ${Object.keys(this.statWeights).length} stats`);

    Object.entries(this.statWeights).forEach(([statId, weight]) => {
      if (this.statDefinitions[statId]?.isDerived && archetypeConfig.excludeDerived) {
        console.log(`[StressTestArchetypeGenerator] Skipping derived stat: ${statId}`);
        return;
      }

      if (weight < archetypeConfig.minWeight) {
        console.log(`[StressTestArchetypeGenerator] Skipping low-weight stat: ${statId} (${weight})`);
        return;
      }

      const boostAmount = Math.round(weight * archetypeConfig.pointsPerWeight);
      const stats = { ...baseline.stats };
      stats[statId] = (stats[statId] ?? 0) + boostAmount;

      const archetype: StressTestArchetype = {
        id: `single_${statId}`,
        name: `${this.statDefinitions[statId]?.label ?? statId} +${boostAmount}`,
        description: `Single stat archetype with ${statId} boosted by ${boostAmount}`,
        stats,
        testedStats: [statId],
        pointsPerStat: boostAmount,
        seed: this.rng.getSeed(),
        type: 'single',
      };

      archetypes.push(archetype);
      console.log(`[StressTestArchetypeGenerator] Generated single-stat archetype: ${archetype.id} (${archetype.name})`);
    });

    console.log(`[StressTestArchetypeGenerator] Generated ${archetypes.length} single-stat archetypes`);
    return archetypes;
  }

  /**
   * Generates pair-stat stress test archetypes.
   * For all C(n,2) combinations, creates archetypes with +pointsPerWeight points in each of the two stats.
   * Respects incompatible stat pairs and can use synergy multipliers for intelligent selection.
   */
  async generatePairStatArchetypes(): Promise<StressTestArchetype[]> {
    const baseline = this.generateBaselineArchetype();
    const archetypes: StressTestArchetype[] = [];
    const archetypeConfig = await getArchetypeConfig();
    
    // Filter stats based on configuration
    const statIds = Object.keys(this.statWeights)
      .filter(statId => !this.statDefinitions[statId]?.isDerived || !archetypeConfig.excludeDerived)
      .filter(statId => this.statWeights[statId] >= archetypeConfig.minWeight);

    console.log(`[StressTestArchetypeGenerator] Generating pair-stat archetypes from ${statIds.length} base stats (${Math.round(statIds.length * (statIds.length - 1) / 2)} potential combinations)`);

    let combinationsGenerated = 0;
    let combinationsSkipped = 0;
    
    for (let i = 0; i < statIds.length; i++) {
      for (let j = i + 1; j < statIds.length; j++) {
        // Check if we've hit the maximum number of pairs
        if (archetypeConfig.maxPairs && combinationsGenerated >= archetypeConfig.maxPairs) {
          console.log(`[StressTestArchetypeGenerator] Reached maximum pair limit: ${archetypeConfig.maxPairs}`);
          break;
        }

        const statId1 = statIds[i];
        const statId2 = statIds[j];

        // Skip incompatible stat pairs if configured
        if (archetypeConfig.excludeIncompatiblePairs && areStatsIncompatible(statId1, statId2)) {
          console.log(`[StressTestArchetypeGenerator] Skipping incompatible pair: ${statId1} + ${statId2}`);
          combinationsSkipped++;
          continue;
        }

        // Check synergy threshold if using multipliers
        if (archetypeConfig.useSynergyMultipliers) {
          const synergyMultiplier = getSynergyMultiplier(statId1, statId2);
          if (synergyMultiplier < archetypeConfig.minSynergyThreshold) {
            console.log(`[StressTestArchetypeGenerator] Skipping low-synergy pair: ${statId1} + ${statId2} (synergy: ${synergyMultiplier})`);
            combinationsSkipped++;
            continue;
          }
        }

        const boostAmount1 = Math.round(this.statWeights[statId1] * archetypeConfig.pointsPerWeight);
        const boostAmount2 = Math.round(this.statWeights[statId2] * archetypeConfig.pointsPerWeight);

        const stats = { ...baseline.stats };
        stats[statId1] = (stats[statId1] ?? 0) + boostAmount1;
        stats[statId2] = (stats[statId2] ?? 0) + boostAmount2;

        const label1 = this.statDefinitions[statId1]?.label ?? statId1;
        const label2 = this.statDefinitions[statId2]?.label ?? statId2;

        const archetype: StressTestArchetype = {
          id: `pair_${statId1}_${statId2}`,
          name: `${label1} +${boostAmount1} & ${label2} +${boostAmount2}`,
          description: `Pair stat archetype with ${statId1} (+${boostAmount1}) and ${statId2} (+${boostAmount2})`,
          stats,
          testedStats: [statId1, statId2],
          pointsPerStat: archetypeConfig.pointsPerWeight,
          seed: this.rng.getSeed(),
          type: 'pair',
        };

        archetypes.push(archetype);
        console.log(`[StressTestArchetypeGenerator] Generated pair-stat archetype: ${archetype.id} (${archetype.name})`);
        combinationsGenerated++;
      }
      
      // Break outer loop if we hit the limit
      if (archetypeConfig.maxPairs && combinationsGenerated >= archetypeConfig.maxPairs) {
        break;
      }
    }

    console.log(`[StressTestArchetypeGenerator] Generated ${archetypes.length} pair-stat archetypes (${combinationsSkipped} combinations skipped)`);
    return archetypes;
  }

  /**
   * Generates all stress test archetypes.
   */
  async generateAllStressTestArchetypes(): Promise<StressTestArchetype[]> {
    const baseline = this.generateBaselineArchetype();
    const singleStats = await this.generateSingleStatArchetypes();
    const pairStats = await this.generatePairStatArchetypes();

    console.log(`[StressTestArchetypeGenerator] Total archetypes generated: ${1 + singleStats.length + pairStats.length}`);
    return [baseline, ...singleStats, ...pairStats];
  }
}

/**
 * Convenience function to generate all stress test archetypes from config.
 */
export async function generateStressTestArchetypes(seed?: number): Promise<StressTestArchetype[]> {
  const generator = await StressTestArchetypeGenerator.create(seed);
  return generator.generateAllStressTestArchetypes();
}
