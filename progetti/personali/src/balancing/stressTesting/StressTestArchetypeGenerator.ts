/**
 * @fileoverview Stress Test Archetype Generator for Config-Driven Balancer.
 * Generates archetypes with boosted stat values for marginal utility analysis.
 */

import type { BalancerConfig, StatDefinition } from '../config/types';

/**
 * Represents a generated archetype for stress testing.
 */
export interface StressTestArchetype {
  /** Unique identifier for the archetype */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the archetype */
  description: string;
  /** Stat values for this archetype */
  statValues: Record<string, number>;
  /** Type of archetype (single, pair, etc.) */
  type: 'baseline' | 'single' | 'pair';
  /** Stats that were boosted (for single/pair) */
  boostedStats: string[];
}

/**
 * Configuration for archetype generation.
 */
export interface ArchetypeGeneratorConfig {
  /** Boost factor for stat increases */
  boostFactor: number;
  /** Available stats from config */
  availableStats: Record<string, StatDefinition>;
  /** Active preset for baseline values */
  activePresetWeights: Record<string, number>;
}

/**
 * Generates all stress test archetypes from balancer configuration.
 * Creates baseline, single-stat, and pair-stat archetypes.
 *
 * @param config The balancer configuration
 * @param boostFactor Factor to multiply stat weights for boosting (default: 25)
 * @returns Array of generated archetypes
 */
export function generateStressTestArchetypes(
  config: BalancerConfig,
  boostFactor: number = 25
): StressTestArchetype[] {
  const availableStats = config.stats;
  const activePreset = config.presets[config.activePresetId];

  if (!activePreset) {
    throw new Error(`Active preset '${config.activePresetId}' not found`);
  }

  const generatorConfig: ArchetypeGeneratorConfig = {
    boostFactor,
    availableStats,
    activePresetWeights: activePreset.weights,
  };

  const archetypes: StressTestArchetype[] = [];

  // Generate baseline archetype
  archetypes.push(generateBaselineArchetype(generatorConfig));

  // Generate single-stat archetypes
  for (const statId of Object.keys(availableStats)) {
    archetypes.push(generateSingleStatArchetype(statId, generatorConfig));
  }

  // Generate pair-stat archetypes
  const statIds = Object.keys(availableStats);
  for (let i = 0; i < statIds.length; i++) {
    for (let j = i + 1; j < statIds.length; j++) {
      archetypes.push(generatePairStatArchetype([statIds[i], statIds[j]], generatorConfig));
    }
  }

  return archetypes;
}

/**
 * Generates the baseline archetype using default values.
 *
 * @param config Generator configuration
 * @returns Baseline archetype
 */
function generateBaselineArchetype(config: ArchetypeGeneratorConfig): StressTestArchetype {
  const statValues: Record<string, number> = {};

  for (const [statId, stat] of Object.entries(config.availableStats)) {
    statValues[statId] = stat.defaultValue;
  }

  return {
    id: 'baseline',
    name: 'Baseline',
    description: 'Default stat values from configuration',
    statValues,
    type: 'baseline',
    boostedStats: [],
  };
}

/**
 * Generates a single-stat boosted archetype.
 *
 * @param statId The stat to boost
 * @param config Generator configuration
 * @returns Single-stat archetype
 */
function generateSingleStatArchetype(
  statId: string,
  config: ArchetypeGeneratorConfig
): StressTestArchetype {
  const stat = config.availableStats[statId];
  if (!stat) {
    throw new Error(`Stat '${statId}' not found in configuration`);
  }

  const boost = config.activePresetWeights[statId] * config.boostFactor;
  const statValues: Record<string, number> = {};

  for (const [id, s] of Object.entries(config.availableStats)) {
    if (id === statId) {
      // Boost this stat
      statValues[id] = s.defaultValue + boost;
    } else {
      // Keep baseline for others
      statValues[id] = s.defaultValue;
    }
  }

  return {
    id: `single_${statId}`,
    name: `+${config.boostFactor}x ${stat.label}`,
    description: `Boosted ${stat.label} by ${boost.toFixed(1)} points`,
    statValues,
    type: 'single',
    boostedStats: [statId],
  };
}

/**
 * Generates a pair-stat boosted archetype.
 *
 * @param statIds The two stats to boost
 * @param config Generator configuration
 * @returns Pair-stat archetype
 */
function generatePairStatArchetype(
  statIds: [string, string],
  config: ArchetypeGeneratorConfig
): StressTestArchetype {
  const [statId1, statId2] = statIds;
  const stat1 = config.availableStats[statId1];
  const stat2 = config.availableStats[statId2];

  if (!stat1 || !stat2) {
    throw new Error(`Stats '${statId1}' or '${statId2}' not found in configuration`);
  }

  const boost1 = config.activePresetWeights[statId1] * config.boostFactor;
  const boost2 = config.activePresetWeights[statId2] * config.boostFactor;

  const statValues: Record<string, number> = {};

  for (const [id, stat] of Object.entries(config.availableStats)) {
    if (id === statId1) {
      statValues[id] = stat.defaultValue + boost1;
    } else if (id === statId2) {
      statValues[id] = stat.defaultValue + boost2;
    } else {
      statValues[id] = stat.defaultValue;
    }
  }

  return {
    id: `pair_${statId1}_${statId2}`,
    name: `${stat1.label} + ${stat2.label}`,
    description: `Boosted ${stat1.label} by ${boost1.toFixed(1)} and ${stat2.label} by ${boost2.toFixed(1)} points`,
    statValues,
    type: 'pair',
    boostedStats: statIds,
  };
}

/**
 * Validates that generated archetypes are consistent with configuration.
 *
 * @param archetypes Generated archetypes
 * @param config Balancer configuration
 * @throws Error if validation fails
 */
export function validateStressTestArchetypes(
  archetypes: StressTestArchetype[],
  config: BalancerConfig
): void {
  if (archetypes.length === 0) {
    throw new Error('No archetypes generated');
  }

  const baselineArchetype = archetypes.find(a => a.type === 'baseline');
  if (!baselineArchetype) {
    throw new Error('Baseline archetype not found');
  }

  const statIds = Object.keys(config.stats);
  const archetypeStatIds = Object.keys(baselineArchetype.statValues);

  if (statIds.length !== archetypeStatIds.length) {
    throw new Error('Archetype stat count mismatch');
  }

  for (const statId of statIds) {
    if (!archetypeStatIds.includes(statId)) {
      throw new Error(`Stat '${statId}' missing from archetypes`);
    }
  }

  // Validate single-stat archetypes
  const singleArchetypes = archetypes.filter(a => a.type === 'single');
  if (singleArchetypes.length !== statIds.length) {
    throw new Error(`Expected ${statIds.length} single archetypes, got ${singleArchetypes.length}`);
  }

  // Validate pair-stat archetypes
  const expectedPairs = (statIds.length * (statIds.length - 1)) / 2;
  const pairArchetypes = archetypes.filter(a => a.type === 'pair');
  if (pairArchetypes.length !== expectedPairs) {
    throw new Error(`Expected ${expectedPairs} pair archetypes, got ${pairArchetypes.length}`);
  }
}
