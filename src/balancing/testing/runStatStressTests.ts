import { BalancerConfigStore } from '../config/BalancerConfigStore';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from './metrics';
import { StatsArchetypeGenerator } from './StressTestArchetypeGenerator';
import { MarginalUtilityCalculator } from './MarginalUtilityCalculator';

export interface StatStressTestResults {
  singleStats: MarginalUtilityMetrics[];
  pairStats: PairSynergyMetrics[];
}

/**
 * Run full stat stress test suite for the current balancer config.
 *
 * NOTE: This is a potentially heavy operation (thousands of simulations),
 * so it should be used from a background task / explicit user action.
 */
export async function runStatStressTests(iterations: number = 5000): Promise<StatStressTestResults> {
  const config = BalancerConfigStore.load();

  const generator = new StatsArchetypeGenerator(config);
  const calculator = new MarginalUtilityCalculator();

  const pointTiers = [25, 50, 75];

  const singleArchetypes = generator.generateSingleStatArchetypes(pointTiers);
  const pairArchetypes = generator.generatePairStatArchetypes(pointTiers);

  const singleStats: MarginalUtilityMetrics[] = [];

  for (const sa of singleArchetypes) {
    const metrics = await calculator.calculateStatUtility(sa, iterations);
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

    const synergy = await calculator.calculatePairSynergy(pa, map, iterations);
    pairStats.push(synergy);
  }

  return { singleStats, pairStats };
}
