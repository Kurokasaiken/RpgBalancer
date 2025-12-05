import type { BalancerConfig } from '../config/types';
import { StatsArchetypeGenerator } from './StressTestArchetypeGenerator';
import {
  RoundRobinRunner,
  type RoundRobinResults,
  type AggregatedRoundRobinResults,
} from './RoundRobinRunner';

/**
 * Run round-robin stat efficiency tests for a specific tier.
 *
 * @param config - Live BalancerConfig (from useBalancerConfig)
 * @param tier - Points per stat (25, 50, 75, or 100)
 * @param iterations - Monte Carlo iterations per matchup
 */
export async function runRoundRobinTests(
  config: BalancerConfig,
  tier: number = 25,
  iterations: number = 10000,
  seed?: number
): Promise<RoundRobinResults> {
  const generator = new StatsArchetypeGenerator(config);
  const archetypes = generator.generateSingleStatArchetypes([tier]);

  const runner = new RoundRobinRunner(config);
  const results = await runner.runRoundRobin(archetypes, iterations, seed);

  return results;
}

/**
 * Run round-robin for ALL tiers (25, 50, 75, 100) and aggregate results.
 *
 * @param config - Live BalancerConfig (from useBalancerConfig)
 * @param iterations - Monte Carlo iterations per matchup
 */
export async function runAllTiersRoundRobin(
  config: BalancerConfig,
  iterations: number = 10000,
  seed?: number
): Promise<AggregatedRoundRobinResults> {
  const generator = new StatsArchetypeGenerator(config);
  const runner = new RoundRobinRunner(config);
  const results = await runner.runAllTiers(generator, [25, 50, 75, 100], iterations, seed);

  return results;
}
