/**
 * Canonical Roster Runtime Bundle
 * 
 * This bundle extracts the complete, working roster pipeline from TestRosterPage
 * and provides it as a shared runtime for both /test and /minimal-gameplay.
 * 
 * Based on the trusted roster baseline: roster_drag_trusted.md
 * Uses the same data flow as TestRosterPage to ensure functional parity.
 */

import { useMemo } from 'react';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import { savedCharacterToResident } from '@/engine/game/idleVillage/characterImport';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Canonical resident data creation function.
 * This is the exact same function used in TestRosterPage to ensure data integrity.
 * 
 * @param defaultFatigue - Default fatigue value for residents
 * @returns Array of ResidentState with full data integrity
 */
export const canonicalResidentData = (defaultFatigue: number = 0): ResidentState[] => {
  console.log('DEBUG: TEST_ROSTER_HEROES.length:', TEST_ROSTER_HEROES.length);
  console.log('DEBUG: TEST_ROSTER_HEROES:', TEST_ROSTER_HEROES);

  // Prefer seeded heroes with full SavedCharacter schema (config-first)
  if (TEST_ROSTER_HEROES.length > 0) {
    const converted = TEST_ROSTER_HEROES.map((hero) => {
      try {
        const resident = savedCharacterToResident(hero, { defaultFatigue });
        return {
          ...resident,
          portraitUrl: getResidentPortraitUrl(resident),
        };
      } catch (error) {
        console.error(`Failed to convert ${hero.name}, using manual fallback:`, error);
        // Manual fallback for failed conversions - preserves all data
        const hpValue = hero.statBlock?.hp ?? 100;
        const fallbackResident = {
          id: hero.id,
          displayName: hero.name,
          status: hero.status ?? 'available',
          fatigue: defaultFatigue,
          currentHp: hero.currentHp ?? hpValue,
          maxHp: hero.maxHp ?? hpValue,
          isHero: hero.isHero ?? false,
          isInjured: hero.isInjured ?? false,
          statSnapshot: hero.statSnapshot ?? { hp: hpValue, ...hero.statBlock },
          statTags: hero.statTags ?? [],
          portraitUrl: hero.portraitUrl,
          survivalCount: hero.survivalCount ?? 0,
          survivalScore: hero.survivalScore ?? 0,
          statProfileId: hero.statProfileId ?? hero.aiBehavior,
          visualProfileId: hero.visualProfileId,
        } as ResidentState;
        return {
          ...fallbackResident,
          portraitUrl: getResidentPortraitUrl(fallbackResident),
        };
      }
    });

    console.log(`Converted ${converted.length}/${TEST_ROSTER_HEROES.length} heroes successfully`, converted);
    console.log('Available heroes:', TEST_ROSTER_HEROES.map(h => ({ id: h.id, name: h.name, status: h.status })));
    return converted;
  }
  
  // Legacy fallback from MINIMAL_GAMEPLAY_RESIDENTS
  return MINIMAL_GAMEPLAY_RESIDENTS.map((definition, index) => {
    const statSnapshot = { ...definition.stats };
    const fallbackHp = index === 0 ? 250 : 50;
    const fallbackResident = {
      id: definition.id ?? `fallback-resident-${index}`,
      displayName: definition.name ?? `Resident ${index + 1}`,
      status: 'available' as const,
      currentHp: fallbackHp,
      maxHp: fallbackHp,
      fatigue: defaultFatigue,
      statSnapshot: {
        hp: fallbackHp,
        ...statSnapshot,
      },
      isHero: false,
      isInjured: false,
      statTags: [],
      portraitUrl: undefined,
      survivalCount: 0,
      survivalScore: 0,
    } as ResidentState;
    return {
      ...fallbackResident,
      portraitUrl: getResidentPortraitUrl(fallbackResident),
    };
  });
};

/**
 * Hook that provides canonical resident data with memoization.
 * This replaces the store-based transformation in MinimalGameplayPage.
 * 
 * @param defaultFatigue - Default fatigue value for residents
 * @returns Memoized array of ResidentState
 */
export const useCanonicalRosterData = (defaultFatigue: number = 0): ResidentState[] => {
  return useMemo(() => canonicalResidentData(defaultFatigue), [defaultFatigue]);
};

/**
 * Helper function to create residentsById lookup from canonical data.
 * This maintains the same API as MinimalGameplayPage expects.
 * 
 * @param residents - Array of ResidentState
 * @returns Record mapping resident IDs to ResidentState
 */
export const createResidentsById = (residents: ResidentState[]): Record<string, ResidentState> => {
  return residents.reduce<Record<string, ResidentState>>((acc, resident) => {
    acc[resident.id] = resident;
    return acc;
  }, {});
};

/**
 * Complete canonical roster bundle.
 * Provides all the data structures needed for roster functionality.
 */
export interface CanonicalRosterBundle {
  residents: ResidentState[];
  residentsById: Record<string, ResidentState>;
}

/**
 * Hook that provides the complete canonical roster bundle.
 * This is the main entry point for consuming the shared runtime bundle.
 * 
 * @param defaultFatigue - Default fatigue value for residents
 * @returns Complete canonical roster bundle
 */
export const useCanonicalRosterBundle = (defaultFatigue: number = 0): CanonicalRosterBundle => {
  const residents = useCanonicalRosterData(defaultFatigue);
  const residentsById = useMemo(() => createResidentsById(residents), [residents]);
  
  return {
    residents,
    residentsById,
  };
};
