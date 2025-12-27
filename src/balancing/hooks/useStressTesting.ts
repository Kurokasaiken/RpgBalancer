import { useMemo } from 'react';
import type { Archetype } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import type { BalancerConfig } from '@/balancing/config/types';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import {
  MarginalUtilityCalculator,
  type MarginalUtilityResult,
  type SynergyResult,
  type CombatSimulator,
} from '@/balancing/stressTesting/MarginalUtilityCalculator';

/**
 * Simple combat simulator for stress testing
 * Calculates score as weighted sum of stat values
 */
const createSimpleCombatSimulator = (config: BalancerConfig): CombatSimulator => {
  const generator = new StressTestArchetypeGenerator(config);
  const statWeights = generator.statWeights;

  return (archetype: Archetype): number => {
    return Object.entries(archetype.stats).reduce((sum, [statId, value]) => {
      const weight = statWeights[statId] || 1;
      return sum + (value as number) * weight;
    }, 0);
  };
};

export interface StressTestingResults {
  archetypes: Archetype[];
  marginalUtilities: MarginalUtilityResult[];
  synergies: SynergyResult[];
  isLoading: boolean;
  error: string | null;
}

export function useStressTesting(config: BalancerConfig): StressTestingResults {
  const results = useMemo(() => {
    try {
      const generator = new StressTestArchetypeGenerator(config);
      const archetypes = generator.generateAllStressTestArchetypes();

      const simulator = createSimpleCombatSimulator(config);
      const calculator = new MarginalUtilityCalculator(simulator, 1000); // reduced for performance, can be 10000

      const { marginalUtilities, synergies } = calculator.runFullAnalysis(archetypes);

      return {
        archetypes,
        marginalUtilities,
        synergies,
        isLoading: false,
        error: null,
      };
    } catch (err) {
      return {
        archetypes: [],
        marginalUtilities: [],
        synergies: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }, [config]);

  return results;
}
