import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BalancerConfig } from '../config/types';
import type { AggregatedRoundRobinResults, StatEfficiency } from '../testing/RoundRobinRunner';

const runAllTiersRoundRobin = vi.fn<
  (config: BalancerConfig, iterations: number, seed?: number) => Promise<AggregatedRoundRobinResults>
>();

vi.mock('../testing/runRoundRobinTests', () => {
  return {
    runAllTiersRoundRobin,
  };
});

import { runAutoBalanceSession } from '../stats/AutoStatBalancer';

function createTestConfig(): BalancerConfig {
  return {
    version: '1.0.0',
    stats: {
      damage: {
        id: 'damage',
        label: 'Damage',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 10,
        weight: 5,
        isCore: true,
        isDerived: false,
      },
      armor: {
        id: 'armor',
        label: 'Armor',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        weight: 3,
        isCore: true,
        isDerived: false,
      },
    },
    cards: {},
    presets: {},
    activePresetId: 'default',
  };
}

function makeEfficiency(
  statId: string,
  efficiency: number,
  assessment: StatEfficiency['assessment'],
): StatEfficiency {
  return {
    statId,
    pointsPerStat: 25,
    efficiency,
    wins: 0,
    losses: 0,
    draws: 0,
    rank: 0,
    assessment,
  };
}

function makeAggregatedResult(effs: StatEfficiency[]): AggregatedRoundRobinResults {
  const now = Date.now();
  return {
    byTier: {},
    aggregatedEfficiencies: effs,
    tiers: [25],
    iterations: 1000,
    timestamp: now,
  };
}

beforeEach(() => {
  runAllTiersRoundRobin.mockReset();
});

describe('AutoStatBalancer', () => {
  it('adjusts weights in the expected direction for OP/underpowered stats', async () => {
    const config = createTestConfig();

    runAllTiersRoundRobin.mockResolvedValue(
      makeAggregatedResult([
        makeEfficiency('damage', 0.7, 'OP'),
        makeEfficiency('armor', 0.3, 'underpowered'),
      ]),
    );

    const result = await runAutoBalanceSession(config, {
      maxIterations: 1,
      iterationsPerTier: 1000,
      seed: 42,
      sessionId: 'test-session',
    });

    const finalConfig = result.finalConfig;

    expect(finalConfig.stats.damage.weight).toBeLessThan(config.stats.damage.weight);
    expect(finalConfig.stats.armor.weight).toBeGreaterThan(config.stats.armor.weight);

    expect(result.session.sessionId).toBe('test-session');
    expect(result.session.runs).toHaveLength(1);
  });

  it('stops early when all suggestions have zero delta', async () => {
    const config = createTestConfig();

    runAllTiersRoundRobin.mockResolvedValue(
      makeAggregatedResult([
        makeEfficiency('damage', 0.5, 'balanced'),
        makeEfficiency('armor', 0.5, 'balanced'),
      ]),
    );

    const result = await runAutoBalanceSession(config, {
      maxIterations: 3,
      iterationsPerTier: 1000,
      seed: 42,
      sessionId: 'balanced-session',
    });

    expect(result.session.runs).toHaveLength(1);
    const finalConfig = result.finalConfig;
    expect(finalConfig.stats.damage.weight).toBe(config.stats.damage.weight);
    expect(finalConfig.stats.armor.weight).toBe(config.stats.armor.weight);
  });
});
