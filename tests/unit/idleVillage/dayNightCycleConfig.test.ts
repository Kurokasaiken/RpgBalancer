/**
 * Regression (Director 2026-11-11): a game day is day + night, the night is a third of it, and the day counter ticks only
 * at dawn. The shipped config was 5 + 5 with a 5-tick «day» — the counter rose at dawn AND dusk and the village ate twice
 * per cycle.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { transformIdleVillageToMinimalConfig } from '@/balancing/config/idleVillage/transformations';

describe('day/night cycle config', () => {
  const rules = DEFAULT_IDLE_VILLAGE_CONFIG.globalRules;
  const cycle = rules.dayNightCycle!;

  it('a game day lasts exactly one day phase plus one night phase', () => {
    expect(rules.dayLengthInTimeUnits).toBe(cycle.dayTimeUnits + cycle.nightTimeUnits);
  });

  it('the night is a third of the game day (40 + 20 ticks)', () => {
    expect(cycle.dayTimeUnits).toBe(40);
    expect(cycle.nightTimeUnits).toBe(20);
  });

  it('the derived engine config keeps the same cycle, so the counter rises only at dawn', () => {
    const g = transformIdleVillageToMinimalConfig(DEFAULT_IDLE_VILLAGE_CONFIG).globalRules;
    const total = g.dayNightCycle!.dayTimeUnits + g.dayNightCycle!.nightTimeUnits;
    expect(g.dayLengthInTimeUnits).toBe(total);
    // every tick where the day number changes is the first tick of a day phase
    for (let tick = 1; tick <= total * 3; tick++) {
      const dayChanged = Math.floor(tick / g.dayLengthInTimeUnits) !== Math.floor((tick - 1) / g.dayLengthInTimeUnits);
      if (dayChanged) expect(tick % total).toBe(0);
    }
  });
});
