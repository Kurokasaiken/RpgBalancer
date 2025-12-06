import { describe, it, expect } from 'vitest';
import { solveConfigChange } from '../ConfigSolver';
import { BalancerConfigStore } from '../BalancerConfigStore';
import type { BalancerConfig, StatDefinition } from '../types';

const BASE_CONFIG: BalancerConfig = BalancerConfigStore.load();

function freshConfig(): BalancerConfig {
  // Deep clone to avoid mutating the in-memory store across tests
  return JSON.parse(JSON.stringify(BASE_CONFIG)) as BalancerConfig;
}

function buildValues(config: BalancerConfig): Record<string, number> {
  const values: Record<string, number> = {};
  Object.values(config.stats).forEach((stat: StatDefinition) => {
    values[stat.id] = stat.defaultValue;
  });
  return values;
}

function expectClose(actual: number, expected: number, eps = 1e-3): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(eps);
}

describe('ConfigSolver – core hp/damage/htk scenarios', () => {
  it('Scenario 1: changing base hp updates derived htk according to formula hp / damage', () => {
    const config = freshConfig();
    const values = buildValues(config);

    const hpBefore = values.hp;
    const damageBefore = values.damage;
    expect(hpBefore).toBeGreaterThan(0);
    expect(damageBefore).toBeGreaterThan(0);

    const targetHp = hpBefore + 50;

    const result = solveConfigChange(config, values, 'hp', targetHp);
    expect(result.error).toBeUndefined();

    const next = result.values;

    expect(next.hp).toBe(targetHp);
    expect(next.damage).toBe(damageBefore);

    const expectedHtk = next.hp / next.damage;
    expectClose(next.htk, expectedHtk, 1e-2);
  });

  it('Scenario 2: editing derived htk with hp locked adjusts damage to satisfy hp / damage = htk', () => {
    const config = freshConfig();
    // Lock hp so the solver must adjust damage when htk is edited
    config.stats.hp.isLocked = true;

    const values = buildValues(config);
    const originalHp = values.hp;
    const originalHtk = values.htk;

    const targetHtk = originalHtk + 1;

    const result = solveConfigChange(config, values, 'htk', targetHtk);
    expect(result.error).toBeUndefined();

    const next = result.values;

    // hp must stay locked
    expect(next.hp).toBe(originalHp);

    const expectedDamage = originalHp / targetHtk;
    expectClose(next.damage, expectedDamage, 1e-2);
    // htk should be close to the requested target
    expectClose(next.htk, targetHtk, 1e-2);
  });

  it('Scenario 3: editing derived htk with hp and damage locked is rejected', () => {
    const config = freshConfig();
    config.stats.hp.isLocked = true;
    config.stats.damage.isLocked = true;

    const values = buildValues(config);
    const originalHp = values.hp;
    const originalDamage = values.damage;
    const originalHtk = values.htk;

    const result = solveConfigChange(config, values, 'htk', originalHtk + 1);

    expect(result.error).toBeDefined();
    expect(result.changed).toEqual([]);

    // Values must remain unchanged
    const next = result.values;
    expect(next.hp).toBe(originalHp);
    expect(next.damage).toBe(originalDamage);
    expect(next.htk).toBe(originalHtk);
  });

  it('Scenario 4: changing base hp with htk locked adjusts damage to keep original htk', () => {
    const config = freshConfig();
    // Lock htk so that base edits must preserve its value by adjusting an input
    config.stats.htk.isLocked = true;

    const values = buildValues(config);
    const originalHp = values.hp;
    const originalDamage = values.damage;
    const originalHtk = values.htk;

    // Sanity: defaults should already roughly satisfy the formula
    expectClose(originalHtk, originalHp / originalDamage, 1e-2);

    const newHp = originalHp + 50;

    const result = solveConfigChange(config, values, 'hp', newHp);
    expect(result.error).toBeUndefined();

    const next = result.values;

    // hp should reflect the requested change
    expect(next.hp).toBe(newHp);
    // htk should remain close to the original locked value
    expectClose(next.htk, originalHtk, 1e-2);

    const expectedDamage = newHp / originalHtk;
    expectClose(next.damage, expectedDamage, 1e-2);
  });

  it('Scenario 5: changing hp with htk locked and all its inputs effectively locked is rejected', () => {
    const config = freshConfig();
    // Locked derived
    config.stats.htk.isLocked = true;
    // Lock one of the inputs; the other will be the changed stat
    config.stats.damage.isLocked = true;

    const values = buildValues(config);
    const originalHp = values.hp;
    const originalDamage = values.damage;
    const originalHtk = values.htk;

    const result = solveConfigChange(config, values, 'hp', originalHp + 50);

    expect(result.error).toBeDefined();
    // We expect the error to mention the locked derived and at least one locked input
    const blocking = result.error?.blockingStats ?? [];
    expect(blocking).toContain('htk');
    expect(blocking).toContain('damage');

    // No changes should be applied
    const next = result.values;
    expect(next.hp).toBe(originalHp);
    expect(next.damage).toBe(originalDamage);
    expect(next.htk).toBe(originalHtk);
  });
});
