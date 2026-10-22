/**
 * legacyReliquary — slots of the legacy reliquary from the village's own buildings (PLAN-067 T-C4, R-234).
 *
 * Pure: `buildingLevelOf` answers the level of a building id, 0 when it is absent or not built. A category's
 * slots are exactly that level, so the reliquary grows as the village is built up.
 */
import { LEGACY_RELIQUARY_CONFIG } from '@/balancing/config/idleVillage/legacyReliquaryConfig';
import { VILLAGE_BUILDINGS_CONFIG } from '@/balancing/config/idleVillage/villageBuildingsConfig';

export const LEGACY_RELIQUARY_CATEGORIES = LEGACY_RELIQUARY_CONFIG.categories.map((c) => c.category);
export type LegacyCategory = (typeof LEGACY_RELIQUARY_CATEGORIES)[number];

export function legacySlotsFor(buildingLevelOf: (buildingId: string) => number): Record<LegacyCategory, number> {
  const out = {} as Record<LegacyCategory, number>;
  for (const { category, buildingId } of LEGACY_RELIQUARY_CONFIG.categories) {
    out[category] = Math.max(0, Math.trunc(buildingLevelOf(buildingId)) || 0);
  }
  return out;
}

/** The level the village shows today for a building: its `initialLevel` when built, 0 otherwise. */
export function villageBuildingLevel(buildingId: string): number {
  const b = VILLAGE_BUILDINGS_CONFIG.buildings.find((x) => x.id === buildingId);
  return b && b.initialState === 'built' ? b.initialLevel : 0;
}
