import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveIO, SaveSlotInfo } from '@/ui/idleVillage/state/gameSave';
import { listSaves, readSlot } from '@/ui/idleVillage/state/gameSave';
import {
  getLastSaved,
  hasUnsavedProgress,
  loadGameFromSlot,
  pickManualSlot,
  resetLastSaved,
  saveGameToSlot,
  saveNowToManualSlot,
} from '@/ui/idleVillage/state/gameSaveService';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';
import { INVASION_KEY, questRunSaveKey } from '@/ui/idleVillage/components/gameFrame/questInitialState';

function memoryIO(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]));
  const io: SaveIO = {
    read: async (k) => (store.has(k) ? JSON.parse(JSON.stringify(store.get(k))) : null),
    write: async (k, v) => void store.set(k, JSON.parse(JSON.stringify(v))),
    clear: async (k) => void store.delete(k),
    listKeys: async () => [...store.keys()],
  };
  return { io, store };
}
const gameplay = (tick: number) => ({ metadata: { summary: { currentDay: 4, gold: 9 } }, data: { currentTime: tick, residents: [] } });
const world = (tick = 100) => ({
  [GAMEPLAY_STORE_KEY]: gameplay(tick),
  [INVASION_KEY]: { stage: 2 },
  [questRunSaveKey('goblin')]: { run: { ended: false } },
});
const row = (slot: SaveSlotInfo['slot'], state: SaveSlotInfo['state'], savedAt?: number): SaveSlotInfo => ({ slot, state, savedAt });

describe('gameSaveService', () => {
  beforeEach(() => resetLastSaved());

  // INV:game-save.INV-6 — "Salva ora" saves the whole game (quest runs, invasion, stash), not the gameplay store alone, after flushing the live state
  it('saves the whole package into the slot after flushing the live state', async () => {
    const { io, store } = memoryIO(world());
    const flush = vi.fn(async () => {
      store.set(GAMEPLAY_STORE_KEY, gameplay(250)); // the in-memory state reaches its key only on flush
      return true;
    });
    expect(await saveGameToSlot('slot-2', { io, flush, now: () => 7 })).toBe(true);
    expect(flush).toHaveBeenCalledOnce();
    const save = await readSlot('slot-2', io);
    expect(save?.meta.tick).toBe(250);
    expect(save?.entries).toHaveProperty([INVASION_KEY]);
    expect(save?.entries).toHaveProperty([questRunSaveKey('goblin')]);
  });

  it('reports failure and writes no slot when the flush fails', async () => {
    const { io } = memoryIO(world());
    expect(await saveGameToSlot('slot-1', { io, flush: async () => false })).toBe(false);
    expect((await listSaves(io)).every((r) => r.state === 'empty')).toBe(true);
  });

  // INV:game-save.INV-7 — «Salva ora» targets the slot in use, else the first empty, else the oldest; never the autosave slot
  it('picks the manual slot for «Salva ora»', () => {
    const full = [row('auto', 'ok', 1), row('slot-1', 'ok', 30), row('slot-2', 'ok', 10), row('slot-3', 'ok', 20)];
    expect(pickManualSlot(full, 'slot-3')).toBe('slot-3');
    expect(pickManualSlot(full, 'auto')).toBe('slot-2'); // auto is never a target → oldest manual
    expect(pickManualSlot([row('auto', 'empty'), row('slot-1', 'ok', 5), row('slot-2', 'empty'), row('slot-3', 'empty')])).toBe('slot-2');
  });

  it('«Salva ora» without a slot in use fills the first empty one, then remembers it', async () => {
    const { io } = memoryIO(world());
    await saveNowToManualSlot({ io });
    expect(getLastSaved()?.slot).toBe('slot-1');
    await saveNowToManualSlot({ io });
    expect(getLastSaved()?.slot).toBe('slot-1');
  });

  // INV:game-save.INV-8 — loading a slot restores the saved world and becomes the baseline for "unsaved progress"
  it('loads a slot and uses it as the unsaved-progress baseline', async () => {
    const { io, store } = memoryIO(world(100));
    await saveGameToSlot('slot-1', { io, now: () => 1 });
    store.set(GAMEPLAY_STORE_KEY, gameplay(900));
    store.set(INVASION_KEY, { stage: 9 });
    expect(await loadGameFromSlot('slot-1', io)).toEqual({ ok: true });
    expect(store.get(INVASION_KEY)).toEqual({ stage: 2 });
    expect(hasUnsavedProgress(100)).toBe(false);
    expect(hasUnsavedProgress(101)).toBe(true);
    expect(await loadGameFromSlot('slot-3', io)).toEqual({ ok: false, reason: 'empty' });
  });

  it('counts a world with no save as unsaved once the clock has run', () => {
    expect(hasUnsavedProgress(0)).toBe(false);
    expect(hasUnsavedProgress(5)).toBe(true);
  });
});
