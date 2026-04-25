import type { StatAllocation } from './types';

export const BASE_STAT_ALLOCATION: StatAllocation = {
  hp: 0,
  damage: 0,
  armor: 0,
  resistance: 0,
  txc: 0,
  hitChance: 0,
  evasion: 0,
  critChance: 0,
  critMult: 0,
  lifesteal: 0,
  regen: 0,
  ward: 0,
  energyShield: 0,
  block: 0,
  armorPen: 0,
  penPercent: 0,
};

/**
 * Ensures every stat allocation contains all StatAllocation keys.
 */
export const withAllocationDefaults = (
  allocation: Partial<StatAllocation>,
): StatAllocation => ({
  ...BASE_STAT_ALLOCATION,
  ...allocation,
});

/**
 * Balanced allocation used by UI previews/opponents.
 */
export const createBalancedAllocation = (): StatAllocation =>
  withAllocationDefaults({
    hp: 15,
    damage: 15,
    armor: 10,
    resistance: 5,
    txc: 10,
    hitChance: 5,
    evasion: 8,
    critChance: 6,
    critMult: 4,
    lifesteal: 5,
    regen: 5,
    ward: 4,
    energyShield: 4,
    block: 2,
    armorPen: 1,
    penPercent: 1,
  });
