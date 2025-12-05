import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import type { BalancerConfig } from '../config/types';
import { runRoundRobinTests, runAllTiersRoundRobin } from '../testing/runRoundRobinTests';

function getNonDerivedStatIds(config: BalancerConfig): string[] {
  return Object.values(config.stats)
    .filter((s) => !s.isDerived && !s.formula && !s.isHidden)
    .map((s) => s.id);
}

describe('RoundRobinRunner / runRoundRobinTests', () => {
  const config = DEFAULT_CONFIG;

  it('produces an NxN matchup matrix consistent with non-derived stats', async () => {
    const tier = 25;
    const iterations = 10;
    const seed = 123;

    const statIds = getNonDerivedStatIds(config);
    const expectedArchetypes = statIds.length;
    const expectedMatchups = (expectedArchetypes * (expectedArchetypes - 1)) / 2;

    const results = await runRoundRobinTests(config, tier, iterations, seed);

    expect(results.efficiencies.length).toBe(expectedArchetypes);
    expect(results.matchups.length).toBe(expectedMatchups);

    const seen = new Set<string>();
    for (const m of results.matchups) {
      seen.add(m.statA);
      seen.add(m.statB);
    }

    expect(seen.size).toBe(expectedArchetypes);
    expect(Array.from(seen).sort()).toEqual([...statIds].sort());
  });

  it('is deterministic for a fixed seed and config', async () => {
    const tier = 25;
    const iterations = 20;
    const seed = 42;

    const first = await runRoundRobinTests(config, tier, iterations, seed);
    const second = await runRoundRobinTests(config, tier, iterations, seed);

    expect(first.tier).toBe(second.tier);
    expect(first.iterations).toBe(second.iterations);

    expect(first.efficiencies).toEqual(second.efficiencies);
    expect(first.matchups).toEqual(second.matchups);
  });
});

describe('RoundRobinRunner / runAllTiersRoundRobin', () => {
  const config = DEFAULT_CONFIG;

  it('aggregates efficiencies across tiers and is seed-stable', async () => {
    const iterations = 10;
    const seed = 111;

    const first = await runAllTiersRoundRobin(config, iterations, seed);
    const second = await runAllTiersRoundRobin(config, iterations, seed);

    expect(first.tiers.length).toBeGreaterThan(0);
    expect(Object.keys(first.byTier).length).toBe(first.tiers.length);
    expect(first.aggregatedEfficiencies.length).toBeGreaterThan(0);

    expect(second.tiers).toEqual(first.tiers);

    for (const tier of first.tiers) {
      const a = first.byTier[tier];
      const b = second.byTier[tier];

      expect(b.tier).toBe(a.tier);
      expect(b.iterations).toBe(a.iterations);
      expect(b.matchups).toEqual(a.matchups);
      expect(b.efficiencies).toEqual(a.efficiencies);
    }

    expect(second.aggregatedEfficiencies).toEqual(first.aggregatedEfficiencies);
  });
});
