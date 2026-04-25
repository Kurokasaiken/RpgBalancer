/**
 * Archetype Generator for Stress Testing
 * Creates single-stat and pair-stat archetypes for marginal utility analysis
 */

import type { BalancerConfig } from '../config/types';
import type { SingleStatArchetype, PairStatArchetype } from './types';
import { SeededRandomFactory } from './LCG';

/**
 * Configuration for archetype generation.
 */
export interface ArchetypeGeneratorConfig {
  /** Base multiplier for stat augmentation (default: 25) */
  augmentationMultiplier: number;
  /** Whether to weight augmentation by stat weights */
  useWeightedAugmentation: boolean;
  /** Minimum stat value for augmentation */
  minStatValue: number;
  /** Maximum stat value for augmentation */
  maxStatValue: number;
  /** Random seed for deterministic generation */
  seed: number;
}

/**
 * Generated archetypes collection.
 */
export interface GeneratedArchetypes {
  /** Single stat archetypes */
  singleStats: SingleStatArchetype[];
  /** Pair stat archetypes */
  pairStats: PairStatArchetype[];
  /** Total number of archetypes generated */
  totalCount: number;
  /** Generation metadata */
  metadata: {
    seed: number;
    timestamp: number;
    config: ArchetypeGeneratorConfig;
    baselineConfig: BalancerConfig;
  };
}

/**
 * Generates archetypes for stress testing with deterministic results.
 */
export class ArchetypeGenerator {
  private config: ArchetypeGeneratorConfig;
  private rngFactory: SeededRandomFactory;

  /**
   * Creates a new archetype generator.
   * 
   * @param config - Generation configuration
   * @param baselineConfig - Base balancer configuration
   */
  constructor(config: Partial<ArchetypeGeneratorConfig> = {}) {
    this.config = {
      augmentationMultiplier: 25,
      useWeightedAugmentation: true,
      minStatValue: 1,
      maxStatValue: 1000,
      seed: Date.now(),
      ...config,
    };

    this.rngFactory = new SeededRandomFactory(this.config.seed);
  }

  /**
   * Generates all archetypes from a balancer configuration.
   * 
   * @param baselineConfig - Base configuration to generate from
   * @returns Generated archetypes
   */
  generateArchetypes(baselineConfig: BalancerConfig): GeneratedArchetypes {
    const stats = Object.values(baselineConfig.stats);
    const nonDerivedStats = stats.filter(stat => !stat.isDerived && !stat.isCore);

    // Generate single stat archetypes
    const singleStats = this.generateSingleStatArchetypes(nonDerivedStats);

    // Generate pair stat archetypes
    const pairStats = this.generatePairStatArchetypes(nonDerivedStats);

    return {
      singleStats,
      pairStats,
      totalCount: singleStats.length + pairStats.length,
      metadata: {
        seed: this.config.seed,
        timestamp: Date.now(),
        config: this.config,
        baselineConfig,
      },
    };
  }

  /**
   * Generates single stat archetypes.
   * 
   * @param stats - Stats to generate archetypes for
   * @returns Single stat archetypes
   */
  private generateSingleStatArchetypes(
    stats: BalancerConfig['stats']
  ): SingleStatArchetype[] {
    return stats.map(stat => {
      const baselineValue = stat.defaultValue;
      const weight = stat.weight;
      
      // Calculate augmentation based on configuration
      let augmentedValue: number;
      if (this.config.useWeightedAugmentation) {
        augmentedValue = baselineValue + (weight * this.config.augmentationMultiplier);
      } else {
        augmentedValue = baselineValue + this.config.augmentationMultiplier;
      }

      // Clamp to valid range
      augmentedValue = Math.max(
        this.config.minStatValue,
        Math.min(this.config.maxStatValue, augmentedValue)
      );

      return {
        statId: stat.id,
        baselineValue,
        augmentedValue,
        weight,
        description: `${stat.label} (${baselineValue} → ${augmentedValue})`,
      };
    });
  }

  /**
   * Generates pair stat archetypes.
   * 
   * @param stats - Stats to generate pairs for
   * @returns Pair stat archetypes
   */
  private generatePairStatArchetypes(
    stats: BalancerConfig['stats']
  ): PairStatArchetype[] {
    const pairs: PairStatArchetype[] = [];

    // Generate all C(n,2) combinations
    for (let i = 0; i < stats.length; i++) {
      for (let j = i + 1; j < stats.length; j++) {
        const stat1 = stats[i];
        const stat2 = stats[j];

        const baseline1Value = stat1.defaultValue;
        const baseline2Value = stat2.defaultValue;
        const weight1 = stat1.weight;
        const weight2 = stat2.weight;

        // Calculate augmentations
        let augmented1Value: number;
        let augmented2Value: number;

        if (this.config.useWeightedAugmentation) {
          augmented1Value = baseline1Value + (weight1 * this.config.augmentationMultiplier);
          augmented2Value = baseline2Value + (weight2 * this.config.augmentationMultiplier);
        } else {
          augmented1Value = baseline1Value + this.config.augmentationMultiplier;
          augmented2Value = baseline2Value + this.config.augmentationMultiplier;
        }

        // Clamp to valid ranges
        augmented1Value = Math.max(
          this.config.minStatValue,
          Math.min(this.config.maxStatValue, augmented1Value)
        );
        augmented2Value = Math.max(
          this.config.minStatValue,
          Math.min(this.config.maxStatValue, augmented2Value)
        );

        pairs.push({
          stat1Id: stat1.id,
          stat2Id: stat2.id,
          baseline1Value,
          baseline2Value,
          augmented1Value,
          augmented2Value,
          weight1,
          weight2,
          description: `${stat1.label}+${stat2.label} (${baseline1Value}→${augmented1Value}, ${baseline2Value}→${augmented2Value})`,
        });
      }
    }

    return pairs;
  }

  /**
   * Generates a specific single stat archetype.
   * 
   * @param statId - Stat ID
   * @param baselineConfig - Base configuration
   * @returns Single stat archetype or null if stat not found
   */
  generateSingleStatArchetype(
    statId: string,
    baselineConfig: BalancerConfig
  ): SingleStatArchetype | null {
    const stat = baselineConfig.stats[statId];
    if (!stat || stat.isDerived || stat.isCore) {
      return null;
    }

    const baselineValue = stat.defaultValue;
    const weight = stat.weight;

    let augmentedValue: number;
    if (this.config.useWeightedAugmentation) {
      augmentedValue = baselineValue + (weight * this.config.augmentationMultiplier);
    } else {
      augmentedValue = baselineValue + this.config.augmentationMultiplier;
    }

    augmentedValue = Math.max(
      this.config.minStatValue,
      Math.min(this.config.maxStatValue, augmentedValue)
    );

    return {
      statId,
      baselineValue,
      augmentedValue,
      weight,
      description: `${stat.label} (${baselineValue} → ${augmentedValue})`,
    };
  }

  /**
   * Generates a specific pair stat archetype.
   * 
   * @param stat1Id - First stat ID
   * @param stat2Id - Second stat ID
   * @param baselineConfig - Base configuration
   * @returns Pair stat archetype or null if stats not found
   */
  generatePairStatArchetype(
    stat1Id: string,
    stat2Id: string,
    baselineConfig: BalancerConfig
  ): PairStatArchetype | null {
    const stat1 = baselineConfig.stats[stat1Id];
    const stat2 = baselineConfig.stats[stat2Id];

    if (!stat1 || !stat2 || stat1.isDerived || stat2.isDerived || stat1.isCore || stat2.isCore) {
      return null;
    }

    const baseline1Value = stat1.defaultValue;
    const baseline2Value = stat2.defaultValue;
    const weight1 = stat1.weight;
    const weight2 = stat2.weight;

    let augmented1Value: number;
    let augmented2Value: number;

    if (this.config.useWeightedAugmentation) {
      augmented1Value = baseline1Value + (weight1 * this.config.augmentationMultiplier);
      augmented2Value = baseline2Value + (weight2 * this.config.augmentationMultiplier);
    } else {
      augmented1Value = baseline1Value + this.config.augmentationMultiplier;
      augmented2Value = baseline2Value + this.config.augmentationMultiplier;
    }

    augmented1Value = Math.max(
      this.config.minStatValue,
      Math.min(this.config.maxStatValue, augmented1Value)
    );
    augmented2Value = Math.max(
      this.config.minStatValue,
      Math.min(this.config.maxStatValue, augmented2Value)
    );

    return {
      stat1Id,
      stat2Id,
      baseline1Value,
      baseline2Value,
      augmented1Value,
      augmented2Value,
      weight1,
      weight2,
      description: `${stat1.label}+${stat2.label} (${baseline1Value}→${augmented1Value}, ${baseline2Value}→${augmented2Value})`,
    };
  }

  /**
   * Gets the current configuration.
   * 
   * @returns Current generator configuration
   */
  getConfig(): ArchetypeGeneratorConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration.
   * 
   * @param newConfig - New configuration values
   */
  updateConfig(newConfig: Partial<ArchetypeGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.seed !== undefined) {
      this.rngFactory = new SeededRandomFactory(this.config.seed);
    }
  }

  /**
   * Validates a configuration.
   * 
   * @param config - Configuration to validate
   * @returns Validation result
   */
  static validateConfig(config: ArchetypeGeneratorConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.augmentationMultiplier <= 0) {
      errors.push('augmentationMultiplier must be positive');
    }

    if (config.minStatValue < 0) {
      errors.push('minStatValue must be non-negative');
    }

    if (config.maxStatValue <= config.minStatValue) {
      errors.push('maxStatValue must be greater than minStatValue');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Default archetype generator configuration.
 */
export const DEFAULT_ARCHETYPE_GENERATOR_CONFIG: ArchetypeGeneratorConfig = {
  augmentationMultiplier: 25,
  useWeightedAugmentation: true,
  minStatValue: 1,
  maxStatValue: 1000,
  seed: Date.now(),
};

/**
 * Creates an archetype generator with default configuration.
 * 
 * @param seed - Optional seed override
 * @returns New archetype generator
 */
export function createArchetypeGenerator(seed?: number): ArchetypeGenerator {
  const config = { ...DEFAULT_ARCHETYPE_GENERATOR_CONFIG };
  if (seed !== undefined) {
    config.seed = seed;
  }
  return new ArchetypeGenerator(config);
}
