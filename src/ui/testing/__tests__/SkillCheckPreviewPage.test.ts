import { describe, expect, it } from 'vitest';

import type { StatDefinition } from '@/balancing/config/types';
import type { StatRow } from '../types';
import { deriveCardinalAxisMeta, getAxisAssignment } from '../SkillCheckPreviewPage';

describe('SkillCheckPreviewPage helpers', () => {
  describe('getAxisAssignment', () => {
    it('returns the canonical patterns for 1-5 stats', () => {
      expect(getAxisAssignment(1)).toEqual([0, 0, 0, 0, 0]);
      expect(getAxisAssignment(2)).toEqual([0, 0, 0, 1, 1]);
      expect(getAxisAssignment(3)).toEqual([0, 0, 1, 1, 2]);
      expect(getAxisAssignment(4)).toEqual([0, 0, 1, 2, 3]);
      expect(getAxisAssignment(5)).toEqual([0, 1, 2, 3, 4]);
    });

    it('clamps values above 5 to the 5-axis template', () => {
      expect(getAxisAssignment(12)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('deriveCardinalAxisMeta', () => {
    const defs: Record<string, StatDefinition> = {
      hp: {
        id: 'hp',
        label: 'Hit Points',
        type: 'number',
        min: 0,
        max: 999,
        step: 1,
        defaultValue: 50,
        weight: 1,
        isCore: true,
        isDerived: false,
        icon: '❤',
      },
      dmg: {
        id: 'dmg',
        label: 'Damage',
        type: 'number',
        min: 0,
        max: 999,
        step: 1,
        defaultValue: 20,
        weight: 1,
        isCore: true,
        isDerived: false,
      },
    };

    const buildStat = (overrides: Partial<StatRow>): StatRow => ({
      id: 'hp',
      name: 'HP',
      questValue: 60,
      heroValue: 60,
      isDetrimental: false,
      ...overrides,
    });

    it('distributes stats according to the assignment pattern and uses config icons', () => {
      const rows: StatRow[] = [
        buildStat({ id: 'hp', name: 'HP' }),
        buildStat({ id: 'dmg', name: 'Damage' }),
      ];

      const axisMeta = deriveCardinalAxisMeta(rows, defs);
      expect(axisMeta).toHaveLength(5);
      expect(axisMeta[0]).toEqual({ name: 'HP', icon: '❤' });
      expect(axisMeta[3]).toEqual({ name: 'Damage', icon: '◆' });
    });

    it('falls back to glyphs when no definition icon exists', () => {
      const rows: StatRow[] = [buildStat({ id: undefined, name: 'Wildcard' })];
      const axisMeta = deriveCardinalAxisMeta(rows, defs);
      expect(axisMeta[0]).toEqual({ name: 'Wildcard', icon: '◆' });
    });

    it('returns an empty array if no stats are active', () => {
      const rows: StatRow[] = [buildStat({ questValue: 0, heroValue: 0 })];
      expect(deriveCardinalAxisMeta(rows, defs)).toEqual([]);
    });
  });
});
