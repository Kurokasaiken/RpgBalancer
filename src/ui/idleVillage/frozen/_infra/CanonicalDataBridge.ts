/**
 * CanonicalDataBridge
 *
 * Single surface through which every frozen kit accesses canonical data hooks
 * and resolvers. Re-exports are deliberate — they pin the imports each kit
 * relies on to the canonical, production-shared sources. Mock fixtures are
 * NEVER added here: the bridge enforces "no mocks" by construction.
 *
 * Rules (Plan v2 §S1):
 * 1. This file only re-exports from `@/balancing/config/...`,
 *    `@/ui/idleVillage/...`, or `@/engine/...`. No inline arrays, no inline
 *    portrait URLs, no inline status enums.
 * 2. New canonical hooks added to the codebase that a kit needs MUST be
 *    re-exported here first, so the kit imports always go through this bridge.
 * 3. Kits never import directly from `@/balancing/config` or
 *    `@/ui/idleVillage/roster` — they go through CanonicalDataBridge so that a
 *    refactor of the upstream module can be absorbed in one place.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

// ----------------------------------------------------------------------------
// Roster data — re-exported from the canonical bundle used by TestRosterPage
// ----------------------------------------------------------------------------

export {
  canonicalResidentData,
  useCanonicalRosterData,
  useCanonicalRosterBundle,
  createResidentsById,
  type CanonicalRosterBundle,
} from '@/ui/idleVillage/roster/CanonicalRosterBundle';

/**
 * Hook alias used by kits to make consumer code semantically clear.
 *
 * Example:
 * ```ts
 * import { useRosterData } from '.../CanonicalDataBridge';
 * const { residents } = useRosterData();
 * ```
 */
export { useCanonicalRosterBundle as useRosterData } from '@/ui/idleVillage/roster/CanonicalRosterBundle';

// ----------------------------------------------------------------------------
// Visual resolvers — canonical portrait URL & visual profile
// ----------------------------------------------------------------------------

export {
  resolveResidentPortrait,
  getResidentPortraitUrl,
  type ResidentPortraitSource,
  type ResolvedResidentPortrait,
} from '@/engine/game/idleVillage/residentVisualResolver';

/**
 * Hook-flavored visual resolver. Kits use this to avoid importing the engine
 * module directly. Returns a stable function reference suitable for memoized
 * children that need to compute portrait URLs from resident state.
 */
import { useCallback } from 'react';
import {
  getResidentPortraitUrl as _getResidentPortraitUrl,
} from '@/engine/game/idleVillage/residentVisualResolver';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

export function useResidentVisualResolver(): (resident?: ResidentState | null) => string {
  // Identity wrapper today; future caching/instrumentation goes here without
  // touching kit consumers.
  return useCallback((resident?: ResidentState | null): string => {
    return _getResidentPortraitUrl(resident);
  }, []);
}

// ----------------------------------------------------------------------------
// Canonical configuration — re-export commonly needed config bundles
// ----------------------------------------------------------------------------

export { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
export { DEFAULT_MINIMAL_CONFIG, type MinimalUIConfig } from '@/balancing/config/idleVillage/minimalConfig';
export { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';
export { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
export { TEST_RESIDENTS } from '@/balancing/config/idleVillage/testResidents';
export {
  DEFAULT_TEST_HARNESS_CONFIG as SLOT_LAB_CONFIG,
  type SlotLabPoiConfig,
} from '@/balancing/config/idleVillage/testHarnessConfig';

// ----------------------------------------------------------------------------
// Canonical engine types — surfaced for kits that need to type props strictly
// ----------------------------------------------------------------------------

export type {
  ResidentState,
  VillageState,
  ScheduledActivity,
} from '@/engine/game/idleVillage/TimeEngine';
