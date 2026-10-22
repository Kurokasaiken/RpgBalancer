import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { SaveIO } from '@/ui/idleVillage/state/gameSave';
import { readSlot } from '@/ui/idleVillage/state/gameSave';
import { useGameAutosave } from '@/ui/idleVillage/state/useGameAutosave';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';

function memoryIO(initial: Record<string, unknown>) {
  const store = new Map<string, unknown>(Object.entries(initial));
  const io: SaveIO = {
    read: async (k) => (store.has(k) ? JSON.parse(JSON.stringify(store.get(k))) : null),
    write: async (k, v) => void store.set(k, JSON.parse(JSON.stringify(v))),
    clear: async (k) => void store.delete(k),
    listKeys: async () => [...store.keys()],
  };
  return { io, store };
}
const gameplay = (tick: number) => ({ metadata: { summary: { currentDay: 1, gold: 1 } }, data: { currentTime: tick, residents: [] } });

describe('useGameAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // INV:game-save.INV-9 — the autosave refreshes only the auto slot, on the interval, and only when the clock has moved
  it('writes the auto slot on the interval, only when the tick advanced, never a manual slot', async () => {
    const { io, store } = memoryIO({ [GAMEPLAY_STORE_KEY]: gameplay(10) });
    let tick = 10;
    renderHook(() => useGameAutosave({ intervalMs: 30_000, getTick: () => tick, flush: () => true, io }));
    await vi.advanceTimersByTimeAsync(30_000);
    expect((await readSlot('auto', io))?.meta.tick).toBe(10);

    store.set(GAMEPLAY_STORE_KEY, gameplay(10));
    store.delete('wanderlust_save_auto');
    await vi.advanceTimersByTimeAsync(30_000); // same tick as the last save → nothing written
    expect(await readSlot('auto', io)).toBeNull();

    tick = 40;
    store.set(GAMEPLAY_STORE_KEY, gameplay(40));
    await vi.advanceTimersByTimeAsync(30_000);
    expect((await readSlot('auto', io))?.meta.tick).toBe(40);
    for (const slot of ['slot-1', 'slot-2', 'slot-3'] as const) expect(await readSlot(slot, io)).toBeNull();
  });

  it('does nothing when disabled', async () => {
    const { io } = memoryIO({ [GAMEPLAY_STORE_KEY]: gameplay(10) });
    renderHook(() => useGameAutosave({ intervalMs: 1000, getTick: () => 10, flush: () => true, io, enabled: false }));
    await vi.advanceTimersByTimeAsync(5000);
    expect(await readSlot('auto', io)).toBeNull();
  });
});
