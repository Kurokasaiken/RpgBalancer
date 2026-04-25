import { describe, it, expect } from 'vitest';
import { MonteCarloSimulation } from '../MonteCarloSimulation';
import { BASELINE_STATS } from '../../baseline';
import type { SimulationConfig, RNG } from '../types';

// Simple deterministic RNG (LCG)
class TestRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }
}

function createRng(seed: number): RNG {
  const rng = new TestRNG(seed);
  return () => rng.next();
}

describe('Core stat integration (Monte Carlo)', () => {
  const iterations = 2000;

  function makeEntity(name: string, overrides: Partial<typeof BASELINE_STATS> = {}) {
    const stats = { ...BASELINE_STATS, ...overrides } as typeof BASELINE_STATS;
    return {
      name,
      ...stats,
      attack: stats.damage,
      defense: stats.armor ?? 0,
    };
  }

  it('baseline vs baseline should be approximately fair (winRate ~ 50%)', () => {
    const rng = createRng(123456);

    const entity1 = makeEntity('Baseline A');
    const entity2 = makeEntity('Baseline B');

    const config: SimulationConfig = {
      combat: {
        entity1,
        entity2,
        turnLimit: 100,
      },
      iterations,
      rng,
    };

    const results = MonteCarloSimulation.run(config);
    const win1 = results.summary.winRates.entity1;

    // Allow a generous band because of RNG + initiative asymmetry
    expect(win1).toBeGreaterThan(0.45);
    expect(win1).toBeLessThan(0.55);
  });

  it('increasing txc should increase win rate versus equal baseline', () => {
    const rng = createRng(98765);

    const baseline = makeEntity('Baseline');
    const highTxc = makeEntity('High TxC', { txc: BASELINE_STATS.txc + 20 });

    const config: SimulationConfig = {
      combat: {
        entity1: baseline,
        entity2: highTxc,
        turnLimit: 100,
      },
      iterations,
      rng,
    };

    const results = MonteCarloSimulation.run(config);
    const winHighTxc = results.summary.winRates.entity2;

    // With +20 TxC we expect a clear advantage for entity2
    expect(winHighTxc).toBeGreaterThan(0.55);
  });

  it('increasing HP should increase win rate versus equal baseline', () => {
    const rng = createRng(424242);

    const baseline = makeEntity('Baseline');
    const highHp = makeEntity('High HP', { hp: BASELINE_STATS.hp + 50 });

    const config: SimulationConfig = {
      combat: {
        entity1: baseline,
        entity2: highHp,
        turnLimit: 100,
      },
      iterations,
      rng,
    };

    const results = MonteCarloSimulation.run(config);
    const winHighHp = results.summary.winRates.entity2;

    expect(winHighHp).toBeGreaterThan(0.55);
  });

  it('increasing Damage should increase win rate versus equal baseline', () => {
    const rng = createRng(777777);

    const baseline = makeEntity('Baseline');
    const highDamage = makeEntity('High Damage', { damage: BASELINE_STATS.damage + 10 });

    const config: SimulationConfig = {
      combat: {
        entity1: baseline,
        entity2: highDamage,
        turnLimit: 100,
      },
      iterations,
      rng,
    };

    const results = MonteCarloSimulation.run(config);
    const winHighDamage = results.summary.winRates.entity2;

    expect(winHighDamage).toBeGreaterThan(0.55);
  });

  it('increasing Armor should increase win rate versus equal baseline', () => {
    const rng = createRng(888888);

    const baseline = makeEntity('Baseline');
    const highArmor = makeEntity('High Armor', { armor: BASELINE_STATS.armor + 100 });

    const config: SimulationConfig = {
      combat: {
        entity1: baseline,
        entity2: highArmor,
        turnLimit: 100,
      },
      iterations,
      rng,
    };

    const results = MonteCarloSimulation.run(config);
    const winHighArmor = results.summary.winRates.entity2;

    expect(winHighArmor).toBeGreaterThan(0.55);
  });

  it('increasing Evasion should increase win rate versus equal baseline', () => {
    const rng = createRng(999999);

    const baseline = makeEntity('Baseline');
    const highEvasion = makeEntity('High Evasion', { evasion: BASELINE_STATS.evasion + 20 });

    const config: SimulationConfig = {
      combat: {
        entity1: baseline,
        entity2: highEvasion,
        turnLimit: 100,
      },
      iterations,
      rng,
    };

    const results = MonteCarloSimulation.run(config);
    const winHighEvasion = results.summary.winRates.entity2;

    expect(winHighEvasion).toBeGreaterThan(0.55);
  });
});
