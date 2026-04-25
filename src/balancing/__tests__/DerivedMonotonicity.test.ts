import { describe, it, expect } from 'vitest';
import type { BalancerConfig } from '../config/types';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { solveConfigChange } from '../config/ConfigSolver';

function buildDefaultValues(config: BalancerConfig): Record<string, number> {
  const values: Record<string, number> = {};
  for (const [id, stat] of Object.entries(config.stats)) {
    values[id] = stat.defaultValue;
  }
  return values;
}

describe('Derived stat monotonicity and invariants', () => {
  const config = DEFAULT_CONFIG;
  const baseValues = buildDefaultValues(config);

  it('increasing damage does not reduce EDPT', () => {
    const baseEdpt = baseValues['edpt'];
    const moreDamage = solveConfigChange(
      config,
      baseValues,
      'damage',
      baseValues['damage'] + 10,
    ).values;

    expect(moreDamage['edpt']).toBeGreaterThanOrEqual(baseEdpt);
  });

  it('increasing hp does not reduce TTK', () => {
    const baseTtk = baseValues['ttk'];
    const moreHp = solveConfigChange(
      config,
      baseValues,
      'hp',
      baseValues['hp'] + 100,
    ).values;

    expect(moreHp['ttk']).toBeGreaterThanOrEqual(baseTtk);
  });

  it('increasing armor reduces effectiveDamage and does not reduce TTK', () => {
    const baseEff = baseValues['effectiveDamage'];
    const baseTtk = baseValues['ttk'];

    const moreArmor = solveConfigChange(
      config,
      baseValues,
      'armor',
      baseValues['armor'] + 20,
    ).values;

    expect(moreArmor['effectiveDamage']).toBeLessThanOrEqual(baseEff);
    expect(moreArmor['ttk']).toBeGreaterThanOrEqual(baseTtk);
  });

  it('increasing ward (flat armor) reduces effectiveDamage', () => {
    const baseEff = baseValues['effectiveDamage'];

    const moreWard = solveConfigChange(
      config,
      baseValues,
      'ward',
      baseValues['ward'] + 50,
    ).values;

    expect(moreWard['effectiveDamage']).toBeLessThanOrEqual(baseEff);
  });
});
