import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import type { StatDefinition } from '../config/types';
import BALANCER_DEFAULT_JSON from '../config/balancer-default-config.json';

type StatMap = Record<string, StatDefinition>;

const BASE_STAT_IDS = [
  'hp',
  'damage',
  'txc',
  'evasion',
  'baseHitChance',
  'critChance',
  'critMult',
  'critTxCBonus',
];

const EQUIP_OR_BONUS_IDS = ['ward', 'armor', 'resistance', 'armorPen', 'penPercent', 'lifesteal', 'regen'];

const PENALTY_IDS = ['failChance', 'failMult', 'failTxCMalus'];

function getEffectiveBase(stat: StatDefinition): boolean {
  return stat.baseStat ?? (!stat.isDerived && !stat.isPenalty);
}

function getEffectiveDetrimental(stat: StatDefinition): boolean {
  return stat.isDetrimental ?? !!stat.isPenalty;
}

function runAssertions(label: string, stats: StatMap) {
  it(`marks base kit stats for ${label}`, () => {
    BASE_STAT_IDS.forEach((id) => {
      const stat = stats[id];
      expect(stat, `Missing stat ${id}`).toBeTruthy();
      expect(getEffectiveBase(stat)).toBe(true);
      expect(getEffectiveDetrimental(stat)).toBe(false);
    });
  });

  it(`keeps equip/bonus stats out of base kit for ${label}`, () => {
    EQUIP_OR_BONUS_IDS.forEach((id) => {
      const stat = stats[id];
      expect(stat, `Missing stat ${id}`).toBeTruthy();
      expect(getEffectiveBase(stat)).toBe(false);
    });
  });

  it(`marks penalty stats as detrimental for ${label}`, () => {
    PENALTY_IDS.forEach((id) => {
      const stat = stats[id];
      expect(stat, `Missing stat ${id}`).toBeTruthy();
      expect(getEffectiveBase(stat)).toBe(false);
      expect(getEffectiveDetrimental(stat)).toBe(true);
    });
  });

  it(`never treats derived stats as base for ${label}`, () => {
    Object.values(stats)
      .filter((stat) => stat.isDerived)
      .forEach((stat) => {
        expect(getEffectiveBase(stat)).toBe(false);
      });
  });
}

describe('Stat flag defaults consistency', () => {
  runAssertions('TypeScript DEFAULT_CONFIG', DEFAULT_CONFIG.stats);
  runAssertions('JSON default config', (BALANCER_DEFAULT_JSON as { stats: StatMap }).stats);
});
