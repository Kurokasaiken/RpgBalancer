import type { BalancerConfig } from '../config/types';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from './metrics';
import { StatsArchetypeGenerator } from './StressTestArchetypeGenerator';
import { MarginalUtilityCalculator } from './MarginalUtilityCalculator';
import type { RNG } from '../simulation/types';

export interface StatStressTestResults {
  singleStats: MarginalUtilityMetrics[];
  pairStats: PairSynergyMetrics[];
}

function createSeededRNG(seed: number): RNG {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Run stat stress tests for a specific BalancerConfig (in-memory).
 * This lets the UI use the live config from the Balancer editor without
 * persisting/reloading from BalancerConfigStore.
 */
export async function runStatStressTestsForConfig(
  config: BalancerConfig,
  iterations: number = 5000,
  seed?: number,
): Promise<StatStressTestResults> {
  const generator = new StatsArchetypeGenerator(config);
  const calculator = new MarginalUtilityCalculator();

  const rng = seed !== undefined ? createSeededRNG(seed) : undefined;

  const pointTiers = [25, 50, 75];

  const singleArchetypes = generator.generateSingleStatArchetypes(pointTiers);
  const pairArchetypes = generator.generatePairStatArchetypes(pointTiers);

  const singleStats: MarginalUtilityMetrics[] = [];

  for (const sa of singleArchetypes) {
    const metrics = await calculator.calculateStatUtility(sa, iterations, rng);
    singleStats.push(metrics);
  }

  const pairStats: PairSynergyMetrics[] = [];

  for (const pa of pairArchetypes) {
    const [statA, statB] = pa.testedStats;

    const map = new Map<string, MarginalUtilityMetrics>();
    const mA = singleStats.find(
      (m) => m.statId === statA && m.pointsPerStat === pa.pointsPerStat,
    );
    const mB = singleStats.find(
      (m) => m.statId === statB && m.pointsPerStat === pa.pointsPerStat,
    );
    if (!mA || !mB) {
      // If we can't find exact tier match, skip this pair for now
      continue;
    }
    map.set(statA, mA);
    map.set(statB, mB);

    const synergy = await calculator.calculatePairSynergy(pa, map, iterations, rng);
    pairStats.push(synergy);
  }

  return { singleStats, pairStats };
}
