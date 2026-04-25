/**
 * @fileoverview Marginal Utility Calculator for Stress Testing.
 * Runs simulations to calculate empirical marginal utility and synergy metrics.
 */

import type { StressTestArchetype } from './StressTestArchetypeGenerator';
import { MathEngine } from '../1v1/mathEngine';
import type { StatBlock } from '../types';

/**
 * Results of marginal utility analysis for a single archetype.
 */
export interface ArchetypeUtilityResult {
  /** Archetype identifier */
  archetypeId: string;
  /** Raw power metric (e.g., EDPT) */
  powerMetric: number;
  /** Marginal utility relative to baseline */
  marginalUtility: number;
  /** Confidence interval for the metric */
  confidenceInterval: [number, number];
}

/**
 * Synergy analysis result for a pair of stats.
 */
export interface StatSynergyResult {
  /** First stat ID */
  statId1: string;
  /** Second stat ID */
  statId2: string;
  /** Synergy multiplier (pair utility / (single1 + single2)) */
  synergyMultiplier: number;
  /** Whether this is an OP synergy (>1.15x) */
  isOpSynergy: boolean;
  /** Whether this is a weak synergy (<0.95x) */
  isWeakSynergy: boolean;
}

/**
 * Complete marginal utility analysis results.
 */
export interface MarginalUtilityAnalysis {
  /** Baseline archetype results */
  baseline: ArchetypeUtilityResult;
  /** Single-stat archetype results */
  singleStats: ArchetypeUtilityResult[];
  /** Pair-stat archetype results */
  pairStats: ArchetypeUtilityResult[];
  /** Synergy analysis for all stat pairs */
  synergies: StatSynergyResult[];
  /** Summary statistics */
  summary: {
    totalArchetypes: number;
    simulationsPerArchetype: number;
    opSynergies: number;
    weakSynergies: number;
  };
}

/**
 * Configuration for marginal utility calculation.
 */
export interface MarginalUtilityConfig {
  /** Number of simulations per archetype */
  simulationsPerArchetype: number;
  /** OP synergy threshold */
  opSynergyThreshold: number;
  /** Weak synergy threshold */
  weakSynergyThreshold: number;
  /** Confidence level for intervals (0-1) */
  confidenceLevel: number;
  /** Random seed for deterministic results */
  randomSeed: number;
}

/**
 * Calculates marginal utility for all stress test archetypes.
 * Runs simulations to determine empirical power metrics and synergies.
 *
 * @param archetypes Generated archetypes from StressTestArchetypeGenerator
 * @param config Calculation configuration
 * @returns Complete marginal utility analysis
 */
export function calculateMarginalUtility(
  archetypes: StressTestArchetype[],
  config: MarginalUtilityConfig = {
    simulationsPerArchetype: 10000,
    opSynergyThreshold: 1.15,
    weakSynergyThreshold: 0.95,
    confidenceLevel: 0.95,
    randomSeed: 42,
  }
): MarginalUtilityAnalysis {
  // Find baseline archetype
  const baselineArchetype = archetypes.find(a => a.type === 'baseline');
  if (!baselineArchetype) {
    throw new Error('Baseline archetype not found');
  }

  // Calculate power metrics for all archetypes
  const allResults = archetypes.map(archetype =>
    calculateArchetypeUtility(archetype, config)
  );

  // Extract results by type
  const baseline = allResults.find(r => r.archetypeId === 'baseline')!;
  const singleStats = allResults.filter(r => archetypes.find(a => a.id === r.archetypeId)?.type === 'single');
  const pairStats = allResults.filter(r => archetypes.find(a => a.id === r.archetypeId)?.type === 'pair');

  // Calculate synergies
  const synergies = calculateStatSynergies(allResults, archetypes, config);

  return {
    baseline,
    singleStats,
    pairStats,
    synergies,
    summary: {
      totalArchetypes: archetypes.length,
      simulationsPerArchetype: config.simulationsPerArchetype,
      opSynergies: synergies.filter(s => s.isOpSynergy).length,
      weakSynergies: synergies.filter(s => s.isWeakSynergy).length,
    },
  };
}

/**
 * Calculates utility metrics for a single archetype.
 *
 * @param archetype The archetype to analyze
 * @param config Calculation configuration
 * @returns Utility result with power metric and confidence interval
 */
function calculateArchetypeUtility(
  archetype: StressTestArchetype,
  config: MarginalUtilityConfig
): ArchetypeUtilityResult {
  // Convert archetype stat values to StatBlock
  const statBlock = convertArchetypeToStatBlock(archetype);

  // Run simulations
  const metrics = runSimulations(statBlock, config.simulationsPerArchetype, config.randomSeed);

  // Calculate confidence interval
  const confidenceInterval = calculateConfidenceInterval(metrics, config.confidenceLevel);

  return {
    archetypeId: archetype.id,
    powerMetric: metrics.mean,
    marginalUtility: 1.0, // Will be calculated relative to baseline later
    confidenceInterval,
  };
}

/**
 * Calculates synergy metrics for all stat pairs.
 *
 * @param results All archetype utility results
 * @param archetypes All archetypes
 * @param config Calculation configuration
 * @returns Array of synergy results
 */
function calculateStatSynergies(
  results: ArchetypeUtilityResult[],
  archetypes: StressTestArchetype[],
  config: MarginalUtilityConfig
): StatSynergyResult[] {
  const synergies: StatSynergyResult[] = [];
  const baselineResult = results.find(r => r.archetypeId === 'baseline')!;

  // Update marginal utilities relative to baseline
  results.forEach(result => {
    result.marginalUtility = result.powerMetric / baselineResult.powerMetric;
  });

  // Calculate synergies for each pair
  const pairArchetypes = archetypes.filter(a => a.type === 'pair');

  for (const pairArchetype of pairArchetypes) {
    const [statId1, statId2] = pairArchetype.boostedStats;

    // Find single-stat archetypes for these stats
    const single1 = archetypes.find(a => a.type === 'single' && a.boostedStats.includes(statId1));
    const single2 = archetypes.find(a => a.type === 'single' && a.boostedStats.includes(statId2));

    if (!single1 || !single2) {
      continue;
    }

    // Get utility results
    const pairResult = results.find(r => r.archetypeId === pairArchetype.id)!;
    const single1Result = results.find(r => r.archetypeId === single1.id)!;
    const single2Result = results.find(r => r.archetypeId === single2.id)!;

    // Calculate synergy: pair utility / (single1 utility + single2 utility - baseline)
    const expectedUtility = single1Result.marginalUtility + single2Result.marginalUtility - 1;
    const synergyMultiplier = pairResult.marginalUtility / expectedUtility;

    synergies.push({
      statId1,
      statId2,
      synergyMultiplier,
      isOpSynergy: synergyMultiplier > config.opSynergyThreshold,
      isWeakSynergy: synergyMultiplier < config.weakSynergyThreshold,
    });
  }

  return synergies;
}

/**
 * Converts archetype stat values to a StatBlock for simulation.
 *
 * @param archetype The archetype to convert
 * @returns StatBlock for simulation
 */
function convertArchetypeToStatBlock(archetype: StressTestArchetype): StatBlock {
  // Assume default StatBlock structure
  const statBlock: StatBlock = {
    hp: archetype.statValues.hp || 100,
    damage: archetype.statValues.damage || 10,
    // Add other stats as needed
  };

  return statBlock;
}

/**
 * Runs simulations to calculate power metrics for a stat block.
 *
 * @param statBlock The stat block to simulate
 * @param numSimulations Number of simulations to run
 * @param seed Random seed for deterministic results
 * @returns Simulation metrics
 */
function runSimulations(
  statBlock: StatBlock,
  numSimulations: number,
  seed: number
): { mean: number; variance: number; samples: number[] } {
  // Use a simple LCG for deterministic randomness
  let rngState = seed;

  function nextRandom(): number {
    rngState = (rngState * 1664525 + 1013904223) % 4294967296;
    return rngState / 4294967296;
  }

  const samples: number[] = [];

  for (let i = 0; i < numSimulations; i++) {
    // Simulate a simple combat metric (EDPT: Effective Damage Per Turn)
    // This is a placeholder - replace with actual simulation logic
    const attacker = statBlock;
    const defender = { hp: 100, damage: 10 }; // Baseline defender

    const randomnessFactor = 0.9 + nextRandom() * 0.2;
    const edpt = MathEngine.calcEDPT(attacker, defender) * randomnessFactor;
    samples.push(edpt);
  }

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / samples.length;

  return { mean, variance, samples };
}

/**
 * Calculates confidence interval for a set of samples.
 *
 * @param metrics Simulation metrics
 * @param confidenceLevel Confidence level (0-1)
 * @returns Confidence interval [lower, upper]
 */
function calculateConfidenceInterval(
  metrics: { mean: number; variance: number; samples: number[] },
  confidenceLevel: number
): [number, number] {
  const n = metrics.samples.length;
  const zScoreMap: Record<number, number> = {
    0.9: 1.64,
    0.95: 1.96,
    0.99: 2.58,
  };
  const z = zScoreMap[confidenceLevel] ?? 1.96;
  const standardError = Math.sqrt(metrics.variance / n);

  const margin = z * standardError;
  return [metrics.mean - margin, metrics.mean + margin];
}
