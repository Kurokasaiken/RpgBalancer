import { describe, it, expect } from 'vitest';
import {
  GAME_SAVE_SCHEMA,
  SAVE_SLOTS,
  captureGameSave,
  deleteSlot,
  listSaves,
  readSlot,
  restoreGameSave,
  verifyGameSave,
  writeSlot,
  type SaveIO,
} from '@/ui/idleVillage/state/gameSave';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';
import {
  CONSUMED_POIS_KEY,
  EXPEDITION_DRAFT_PREFIX,
  INVASION_KEY,
  VILLAGE_STATE_KEY,
  gameProgressKeys,
  questRunSaveKey,
} from '@/ui/idleVillage/components/gameFrame/questInitialState';

/** In-memory persistence: `failWriteAt` throws on the Nth write (1-based) to exercise the rollback. */
function memoryIO(initial: Record<string, unknown> = {}, failWriteAt = 0) {
  const store = new Map<string, unknown>(Object.entries(initial).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]));
  let writes = 0;
  const io: SaveIO = {
    read: async (key) => (store.has(key) ? JSON.parse(JSON.stringify(store.get(key))) : null),
    write: async (key, value) => {
      writes += 1;
      if (failWriteAt && writes === failWriteAt) throw new Error('disk full');
      store.set(key, JSON.parse(JSON.stringify(value)));
    },
    clear: async (key) => {
      store.delete(key);
    },
    listKeys: async () => [...store.keys()],
  };
  return { io, store, writes: () => writes };
}

const gameplay = (day: number, gold: number) => ({
  metadata: { version: '1.0', createdAt: 1, checksum: 'x', summary: { gold, food: 5, currentDay: day, residentCount: 2 } },
  data: {
    residents: [
      { id: 'h1', name: 'Aldra', isHero: true, isDead: false },
      { id: 'h2', name: 'Bren', isHero: true, isDead: true },
      { id: 'r1', name: 'Villager', isHero: false },
    ],
  },
});

const world = () => ({
  [GAMEPLAY_STORE_KEY]: gameplay(14, 340),
  [VILLAGE_STATE_KEY]: { stash: ['sword'] },
  [INVASION_KEY]: { stage: 2 },
  [CONSUMED_POIS_KEY]: ['poi-a'],
  [questRunSaveKey('goblin')]: { run: { ended: false } },
  [questRunSaveKey('rovine')]: { run: { ended: true } },
  [`${EXPEDITION_DRAFT_PREFIX}14`]: { assignments: {} },
});

describe('gameSave — whole-game save package', () => {
  // INV:game-save.INV-1 — a save holds EVERY progress key (gameplay, village, invasion, POIs, quest runs, drafts), not just the gameplay store
  it('captures every progress key, not only the gameplay store', async () => {
    const { io } = memoryIO(world());
    const save = await captureGameSave(io, () => 1000);
    for (const key of gameProgressKeys()) {
      if (key in world()) expect(save.entries).toHaveProperty([key]);
    }
    expect(save.entries).toHaveProperty([`${EXPEDITION_DRAFT_PREFIX}14`]);
    expect(save.schemaVersion).toBe(GAME_SAVE_SCHEMA);
    expect(save.savedAt).toBe(1000);
  });

  it('derives the slot summary from the save itself', async () => {
    const { io } = memoryIO(world());
    const { meta } = await captureGameSave(io, () => 1);
    expect(meta).toMatchObject({ day: 14, gold: 340, heroes: ['Aldra'], activeExpeditions: 1 });
  });

  // INV:game-save.INV-2 — restoring a save puts back the whole world and removes progress the save does not have
  it('round-trips: restore rebuilds the exact world and clears keys the save lacks', async () => {
    const source = memoryIO(world());
    const save = await captureGameSave(source.io, () => 1);
    const target = memoryIO({ [GAMEPLAY_STORE_KEY]: gameplay(3, 1), [INVASION_KEY]: { stage: 9 }, [`${EXPEDITION_DRAFT_PREFIX}3`]: { old: true }, hud_scale_v1: 'auto' });
    const result = await restoreGameSave(save, target.io);
    expect(result).toEqual({ ok: true });
    const after = Object.fromEntries(target.store);
    expect(after).toMatchObject(world());
    expect(after).not.toHaveProperty([`${EXPEDITION_DRAFT_PREFIX}3`]);
    expect(after.hud_scale_v1).toBe('auto'); // preferences are not progress
  });

  // INV:game-save.INV-3 — a corrupt or newer-version save is refused and nothing is written
  it('refuses a corrupt save without writing anything', async () => {
    const source = memoryIO(world());
    const save = await captureGameSave(source.io, () => 1);
    save.entries[INVASION_KEY] = { stage: 99 };
    expect(verifyGameSave(save)).toEqual({ ok: false, reason: 'corrupt' });
    const target = memoryIO({ [GAMEPLAY_STORE_KEY]: gameplay(3, 1) });
    expect(await restoreGameSave(save, target.io)).toEqual({ ok: false, reason: 'corrupt' });
    expect(target.writes()).toBe(0);
    expect(target.store.get(GAMEPLAY_STORE_KEY)).toEqual(gameplay(3, 1));
  });

  it('refuses a save written by a newer schema', async () => {
    const source = memoryIO(world());
    const save = await captureGameSave(source.io, () => 1);
    const newer = { ...save, schemaVersion: GAME_SAVE_SCHEMA + 1 };
    expect(verifyGameSave(newer)).toEqual({ ok: false, reason: 'newer-version' });
    expect(verifyGameSave({ nonsense: true })).toEqual({ ok: false, reason: 'malformed' });
  });

  // INV:game-save.INV-4 — a write failing halfway leaves the previous world untouched (all or nothing)
  it('rolls back when a write fails halfway', async () => {
    const source = memoryIO(world());
    const save = await captureGameSave(source.io, () => 1);
    const before = { [GAMEPLAY_STORE_KEY]: gameplay(3, 1), [INVASION_KEY]: { stage: 9 } };
    const target = memoryIO(before, 3);
    const result = await restoreGameSave(save, target.io);
    expect(result).toEqual({ ok: false, reason: 'write-failed' });
    expect(Object.fromEntries(target.store)).toEqual(before);
  });

  // INV:game-save.INV-5 — the autosave slot is separate from the manual slots; listing reports empty, valid and corrupt slots
  it('keeps slots separate and lists them', async () => {
    const source = memoryIO(world());
    const save = await captureGameSave(source.io, () => 5);
    expect(SAVE_SLOTS).toEqual(['auto', 'slot-1', 'slot-2', 'slot-3']);
    await writeSlot('slot-1', save, source.io);
    await source.io.write('wanderlust_save_slot-2', { garbage: true });
    const listed = await listSaves(source.io);
    expect(listed.map((s) => [s.slot, s.state])).toEqual([
      ['auto', 'empty'],
      ['slot-1', 'ok'],
      ['slot-2', 'corrupt'],
      ['slot-3', 'empty'],
    ]);
    expect(listed[1].meta?.day).toBe(14);
    expect((await readSlot('slot-1', source.io))?.savedAt).toBe(5);
    await deleteSlot('slot-1', source.io);
    expect(await readSlot('slot-1', source.io)).toBeNull();
    // saving a slot never touches the world keys
    expect(source.store.get(GAMEPLAY_STORE_KEY)).toEqual(gameplay(14, 340));
  });
});
