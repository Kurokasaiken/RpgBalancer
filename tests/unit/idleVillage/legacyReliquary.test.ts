/**
 * PLAN-067 T-C4 (R-234, LEG = B) — the legacy reliquary has slots that follow the village's own buildings:
 * warehouse → items, sanctuary → heroes, mage tower → blueprints. A category gets as many slots as its
 * building's level; with no building (or not built) it has none. Presentation only (mock): choices stay in memory.
 */
import { describe, expect, it } from 'vitest';
import { legacySlotsFor, villageBuildingLevel, LEGACY_RELIQUARY_CATEGORIES } from '@/ui/idleVillage/legacy/legacyReliquary';
import { legacyReliquaryConfigSchema, LEGACY_RELIQUARY_CONFIG } from '@/balancing/config/idleVillage/legacyReliquaryConfig';

describe('legacy reliquary slots (R-234, T-C4)', () => {
  // INV:R-234-legacy-slots-from-buildings — slots = the building's level; 0 when not built or absent.
  it('gives each category slots equal to its building level', () => {
    const levels = { warehouse: 2, sanctuary: 0, mageTower: 3 };
    const slots = legacySlotsFor((id) => levels[id as keyof typeof levels] ?? 0);
    expect(slots.items).toBe(2);
    expect(slots.heroes).toBe(0);
    expect(slots.blueprints).toBe(3);
  });

  it('a category with no building has zero slots', () => {
    const slots = legacySlotsFor(() => 0);
    for (const c of LEGACY_RELIQUARY_CATEGORIES) expect(slots[c]).toBe(0);
  });

  it('level 0, I, II and III read as 0, 1, 2 and 3 slots', () => {
    for (const lv of [0, 1, 2, 3]) {
      expect(legacySlotsFor(() => lv).items).toBe(lv);
    }
  });

  it('reads the real village: only built buildings give slots (mage tower is buildable, so none yet)', () => {
    const slots = legacySlotsFor(villageBuildingLevel);
    expect(slots.blueprints).toBe(0);
    expect(slots.heroes).toBe(0);
    expect(slots.items).toBeGreaterThanOrEqual(0);
  });

  it('the config maps the three categories to the three buildings, and validates', () => {
    expect(legacyReliquaryConfigSchema.safeParse(LEGACY_RELIQUARY_CONFIG).success).toBe(true);
    expect(LEGACY_RELIQUARY_CONFIG.categories.map((c) => c.buildingId)).toEqual(['warehouse', 'sanctuary', 'mageTower']);
  });
});
