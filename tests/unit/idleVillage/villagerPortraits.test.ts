/**
 * R-268 — villager portrait wiring regression test.
 *
 * Contract: the three canonical villagers resolve a real trade portrait
 * (never the placeholder), the medallion square exists for every portrait
 * (file-stem match through `getMedalPortraitUrl`), and the profile exposes
 * a full figure for the character sheet.
 */

import { describe, it, expect } from 'vitest';
import placeholderPortrait from '@/assets/portraits/placeholder.svg';
import { TEST_ROSTER_VILLAGERS } from '@/balancing/config/idleVillage/testRosterResidents';
import { savedCharacterToResident } from '@/engine/game/idleVillage/characterImport';
import { resolveResidentPortrait } from '@/engine/game/idleVillage/residentVisualResolver';
import { getMedalPortraitUrl } from '@/balancing/config/idleVillage/medalPortraitAssets';

const VILLAGER_DISPLAY_NAMES = ['Bertoldo', 'Lisetta', 'Manno'];

describe('villager portraits — R-268', () => {
  const residents = TEST_ROSTER_VILLAGERS.map((c) => savedCharacterToResident(c));

  it('keeps the three canonical villager ids with popolani display names', () => {
    expect(TEST_ROSTER_VILLAGERS.map((c) => c.name)).toEqual(VILLAGER_DISPLAY_NAMES);
    expect(TEST_ROSTER_VILLAGERS.map((c) => c.id)).toEqual([
      'villager-mastro-beppe',
      'villager-lisetta',
      'villager-baldassarre',
    ]);
  });

  it('each villager resolves a real portrait — never the placeholder', () => {
    for (const resident of residents) {
      const resolved = resolveResidentPortrait(resident);
      expect(resolved.portraitUrl).toBeTruthy();
      expect(resolved.portraitUrl).not.toBe(placeholderPortrait);
      expect(resolved.portraitUrl).not.toContain('placeholder');
    }
  });

  it('each villager profile exposes a full figure for the character sheet', () => {
    for (const resident of residents) {
      const resolved = resolveResidentPortrait(resident);
      expect(resolved.fullFigureUrl).toBeTruthy();
      expect(resolved.fullFigureUrl).not.toContain('placeholder');
    }
  });

  it('each villager portrait maps to a generated medallion square by stem', () => {
    for (const resident of residents) {
      const medal = getMedalPortraitUrl(resident.portraitUrl ?? '');
      // No medal square → getMedalPortraitUrl returns the full URL unchanged.
      expect(medal).not.toBe(resident.portraitUrl);
      expect(medal).toContain('medal');
      expect(medal).toMatch(/\.webp($|\?)/);
    }
  });
});
