import { describe, it, expect } from 'vitest';
import { SCENARIO_TYPES } from '../contextWeights';
import { calculateScenarioItemPower } from '../expectedValue';

describe('ScenarioExpectedValue', () => {
  it('values sustain stats more in boss fights than in duels and swarms', () => {
    const sustainStats = {
      lifesteal: 5,
      regen: 2,
    };

    const duelPower = calculateScenarioItemPower(
      sustainStats,
      SCENARIO_TYPES.DUEL_1V1,
    );
    const bossPower = calculateScenarioItemPower(
      sustainStats,
      SCENARIO_TYPES.BOSS_1V1_LONG,
    );
    const swarmPower = calculateScenarioItemPower(
      sustainStats,
      SCENARIO_TYPES.SWARM_1VMANY,
    );

    expect(bossPower).toBeGreaterThan(duelPower);
    expect(duelPower).toBeGreaterThan(swarmPower);
  });

  it('values single-target damage less in swarm than in duel', () => {
    const damageStats = {
      damage: 10,
    };

    const duelPower = calculateScenarioItemPower(
      damageStats,
      SCENARIO_TYPES.DUEL_1V1,
    );
    const swarmPower = calculateScenarioItemPower(
      damageStats,
      SCENARIO_TYPES.SWARM_1VMANY,
    );

    expect(duelPower).toBeGreaterThan(swarmPower);
  });
});
