import { describe, it, expect } from 'vitest';
import {
  applyLoadoutToResident,
  LoadoutError,
  type ItemCatalog,
} from '@/engine/game/idleVillage/missionPlannerLoadout';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

const resident = (id: string, stats: Record<string, number>): ResidentState =>
  ({ id, statSnapshot: stats } as unknown as ResidentState);

const catalog: ItemCatalog = defaultQuestItems;

describe('applyLoadoutToResident', () => {
  it('raises a carrier stat via equipment statDeltas', () => {
    const { resident: eff, contributions } = applyLoadoutToResident(
      resident('a', { strength: 5 }),
      { weapon: 'quest_weapon_iron_blade' },
      catalog,
    );
    // iron_blade: strength +4, endurance +1
    expect(eff.statSnapshot?.strength).toBe(9);
    expect(eff.statSnapshot?.endurance).toBe(1);
    expect(contributions).toContainEqual({
      itemId: 'quest_weapon_iron_blade',
      slot: 'weapon',
      stat: 'strength',
      delta: 4,
    });
  });

  it('stacks two items on different slots', () => {
    const { resident: eff } = applyLoadoutToResident(
      resident('a', { strength: 5, endurance: 4 }),
      { weapon: 'quest_weapon_iron_blade', armor: 'quest_armor_heavy_plate' },
      catalog,
    );
    expect(eff.statSnapshot?.strength).toBe(9);
    expect(eff.statSnapshot?.endurance).toBe(5);
  });

  it('throws a typed error for an unknown item', () => {
    expect(() =>
      applyLoadoutToResident(resident('a', {}), { weapon: 'nope' }, catalog),
    ).toThrowError(LoadoutError);
    try {
      applyLoadoutToResident(resident('a', {}), { weapon: 'nope' }, catalog);
    } catch (err) {
      expect((err as LoadoutError).code).toBe('UNKNOWN_ITEM');
    }
  });

  it('rejects a consumable assigned to an equipment slot', () => {
    try {
      applyLoadoutToResident(
        resident('a', {}),
        { trinket: 'quest_consumable_lucky_coin' },
        catalog,
      );
      expect.unreachable();
    } catch (err) {
      expect((err as LoadoutError).code).toBe('SLOT_MISMATCH');
    }
  });

  it('rejects the same item on two different slots', () => {
    try {
      applyLoadoutToResident(
        resident('a', {}),
        { weapon: 'quest_weapon_iron_blade', trinket: 'quest_weapon_iron_blade' },
        catalog,
      );
      expect.unreachable();
    } catch (err) {
      expect((err as LoadoutError).code).toBe('SLOT_MISMATCH');
    }
  });

  it('never mutates the input resident or its statSnapshot', () => {
    const input = resident('a', { strength: 5 });
    const snapshotBefore = { ...input.statSnapshot };
    applyLoadoutToResident(input, { weapon: 'quest_weapon_iron_blade' }, catalog);
    expect(input.statSnapshot).toEqual(snapshotBefore);
  });

  it('returns the resident untouched (copy) with an empty loadout', () => {
    const input = resident('a', { strength: 5 });
    const { resident: eff, contributions } = applyLoadoutToResident(input, undefined, catalog);
    expect(eff.statSnapshot).toEqual({ strength: 5 });
    expect(eff).not.toBe(input);
    expect(contributions).toEqual([]);
  });

  it('emits contributions in canonical slot order regardless of insertion order', () => {
    const { contributions } = applyLoadoutToResident(
      resident('a', { strength: 5 }),
      { trinket: 'quest_trinket_guardian_banner', weapon: 'quest_weapon_iron_blade' },
      catalog,
    );
    // weapon slot precedes trinket in QUEST_EQUIP_SLOTS; banner has no statDeltas
    expect(contributions.map((c) => c.slot)).toEqual(['weapon', 'weapon']);
  });

  it('does not apply duration/reward/cover fields to the snapshot', () => {
    const { resident: eff } = applyLoadoutToResident(
      resident('a', { hp: 50 }),
      { mount: 'quest_mount_draft_horse', trinket: 'quest_trinket_guardian_banner' },
      catalog,
    );
    // mount durationMult and banner coverRiskDelta are quest-level — untouched stats
    expect(eff.statSnapshot).toEqual({ hp: 50 });
  });
});
