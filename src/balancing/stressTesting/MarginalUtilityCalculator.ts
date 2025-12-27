import type { Archetype } from '@/balancing/stressTesting/StressTestArchetypeGenerator';

/**
 * Results of marginal utility analysis for a single archetype
 */
export interface MarginalUtilityResult {
  archetype: Archetype;
  averageScore: number;
  marginalUtility: number; // (score / baseline - 1) * 100 as percentage
  standardDeviation: number;
  simulationCount: number;
}

/**
 * Synergy analysis for pair archetypes
 */
export interface SynergyResult {
  pairArchetype: Archetype;
  statIds: [string, string];
  pairScore: number;
  expectedScore: number; // average of individual boosts
  synergyMultiplier: number; // pairScore / expectedScore
  isOpSynergy: boolean; // > 1.15x
  isWeakSynergy: boolean; // < 0.95x
}

/**
 * Combat simulation function signature
 * Should return a score for the given archetype
 */
export type CombatSimulator = (archetype: Archetype) => number;

/**
 * Calculates marginal utility metrics via Monte Carlo simulation
 */
export class MarginalUtilityCalculator {
  private simulator: CombatSimulator;
  private simulationCount: number;

  constructor(simulator: CombatSimulator, simulationCount = 10000) {
    this.simulator = simulator;
    this.simulationCount = simulationCount;
  }

  /**
   * Runs simulations for a single archetype and calculates stats
   */
  private analyzeArchetype(archetype: Archetype): MarginalUtilityResult {
    const scores: number[] = [];

    for (let i = 0; i < this.simulationCount; i++) {
      const score = this.simulator(archetype);
      scores.push(score);
    }

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      archetype,
      averageScore,
      marginalUtility: 0, // will be calculated relative to baseline
      standardDeviation,
      simulationCount: this.simulationCount,
    };
  }

  /**
   * Analyzes all archetypes and computes marginal utilities
   */
  analyzeArchetypes(archetypes: Archetype[]): MarginalUtilityResult[] {
    const results = archetypes.map(archetype => this.analyzeArchetype(archetype));

    // Find baseline
    const baselineResult = results.find(r => r.archetype.id === 'baseline');
    if (!baselineResult) {
      throw new Error('Baseline archetype not found');
    }

    // Calculate marginal utilities
    results.forEach(result => {
      result.marginalUtility = (result.averageScore / baselineResult.averageScore - 1) * 100;
    });

    return results;
  }

  /**
   * Analyzes synergy for pair archetypes
   */
  analyzeSynergies(
    pairArchetypes: Archetype[],
    singleResults: MarginalUtilityResult[]
  ): SynergyResult[] {
    const singleScoreMap = new Map<string, number>();
    singleResults.forEach(result => {
      if (result.archetype.id.startsWith('single_')) {
        const statId = result.archetype.id.replace('single_', '');
        singleScoreMap.set(statId, result.averageScore);
      }
    });

    return pairArchetypes.map(pairArchetype => {
      const idParts = pairArchetype.id.split('_');
      if (idParts.length < 3 || idParts[0] !== 'pair') {
        throw new Error(`Invalid pair archetype ID: ${pairArchetype.id}`);
      }

      const statId1 = idParts[1];
      const statId2 = idParts[2];
      const score1 = singleScoreMap.get(statId1);
      const score2 = singleScoreMap.get(statId2);

      if (score1 === undefined || score2 === undefined) {
        throw new Error(`Missing single stat results for ${statId1} or ${statId2}`);
      }

      const pairScore = this.analyzeArchetype(pairArchetype).averageScore;
      const expectedScore = (score1 + score2) / 2;
      const synergyMultiplier = pairScore / expectedScore;

      return {
        pairArchetype,
        statIds: [statId1, statId2],
        pairScore,
        expectedScore,
        synergyMultiplier,
        isOpSynergy: synergyMultiplier > 1.15,
        isWeakSynergy: synergyMultiplier < 0.95,
      };
    });
  }

  /**
   * Runs full analysis on stress test archetypes
   */
  runFullAnalysis(archetypes: Archetype[]): {
    marginalUtilities: MarginalUtilityResult[];
    synergies: SynergyResult[];
  } {
    const marginalUtilities = this.analyzeArchetypes(archetypes);

    const pairArchetypes = archetypes.filter(a => a.id.startsWith('pair_'));
    const synergies = this.analyzeSynergies(pairArchetypes, marginalUtilities);

    return {
      marginalUtilities,
      synergies,
    };
  }
}

/**
 * Convenience function for full stress testing analysis
 */
export function runStressTestAnalysis(
  archetypes: Archetype[],
  simulator: CombatSimulator,
  simulationCount = 10000
): {
  marginalUtilities: MarginalUtilityResult[];
  synergies: SynergyResult[];
} {
  const calculator = new MarginalUtilityCalculator(simulator, simulationCount);
  return calculator.runFullAnalysis(archetypes);
}
