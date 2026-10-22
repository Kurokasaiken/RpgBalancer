/**
 * gameSaveService — what the menu does with the save package (PLAN-076 T-2/T-5).
 *
 * The gameplay store persists its own key on every tick, and the quest/village
 * keys persist as they change, so the world on disk is always "the game in
 * progress". Slots are checkpoints OF that world: the autosave slot is
 * refreshed on a timer, the three manual slots only when the player saves.
 * "Salva ora" used to write the gameplay key alone — a save that left quest
 * runs, the invasion and the stash behind; it now writes the whole package.
 */
import {
  captureGameSave,
  defaultSaveIO,
  listSaves,
  readSlot,
  restoreGameSave,
  writeSlot,
  type RestoreResult,
  type SaveIO,
  type SaveSlotId,
  type SaveSlotInfo,
} from './gameSave';

const MANUAL_SLOTS: readonly SaveSlotId[] = ['slot-1', 'slot-2', 'slot-3'];

/** The slot "Salva ora" writes to: the slot in use, else the first empty one, else the oldest. Never the autosave slot. */
export function pickManualSlot(rows: readonly SaveSlotInfo[], current?: SaveSlotId | null): SaveSlotId {
  const manual = rows.filter((r) => MANUAL_SLOTS.includes(r.slot));
  if (current && MANUAL_SLOTS.includes(current)) return current;
  const empty = manual.find((r) => r.state === 'empty' || r.state === 'corrupt');
  if (empty) return empty.slot;
  const oldest = [...manual].sort((a, b) => (a.savedAt ?? 0) - (b.savedAt ?? 0))[0];
  return oldest?.slot ?? 'slot-1';
}

export interface SaveDeps {
  io?: SaveIO;
  /** Writes the in-memory gameplay state to its key before the capture (the store's `saveNow`). */
  flush?: () => Promise<boolean> | boolean | void;
  now?: () => number;
  thumbnail?: () => Promise<string | undefined> | string | undefined;
}

/** What the player last saved this session: the baseline for "is there anything to lose". */
let lastSaved: { slot: SaveSlotId; at: number; tick: number } | null = null;
export const getLastSaved = () => lastSaved;
export const resetLastSaved = () => {
  lastSaved = null;
};

/** Writes the whole game into a slot. Resolves `false` when the flush or the write failed. */
export async function saveGameToSlot(slot: SaveSlotId, deps: SaveDeps = {}): Promise<boolean> {
  const io = deps.io ?? defaultSaveIO;
  const now = deps.now ?? Date.now;
  try {
    if (deps.flush) {
      const flushed = await deps.flush();
      if (flushed === false) return false;
    }
    const save = await captureGameSave(io, now);
    const thumbnail = await deps.thumbnail?.();
    await writeSlot(slot, thumbnail ? { ...save, thumbnail } : save, io);
    lastSaved = { slot, at: save.savedAt, tick: save.meta.tick };
    return true;
  } catch (error) {
    console.warn('[gameSaveService] save failed:', error);
    return false;
  }
}

/** «Salva ora»: picks the manual slot and saves into it. */
export async function saveNowToManualSlot(deps: SaveDeps = {}): Promise<boolean> {
  const rows = await listSaves(deps.io ?? defaultSaveIO);
  return saveGameToSlot(pickManualSlot(rows, lastSaved?.slot), deps);
}

/** Restores a slot; the caller reloads the page afterwards so no stale state stays in memory. */
export async function loadGameFromSlot(slot: SaveSlotId, io: SaveIO = defaultSaveIO): Promise<RestoreResult | { ok: false; reason: 'empty' }> {
  const save = await readSlot(slot, io);
  if (!save) return { ok: false, reason: 'empty' };
  const result = await restoreGameSave(save, io);
  if (result.ok) lastSaved = { slot, at: save.savedAt, tick: save.meta.tick };
  return result;
}

/**
 * True when the game has moved on since the last save of this session. With no
 * save yet, the world counts as unsaved as soon as the clock has run.
 */
export function hasUnsavedProgress(currentTick: number, baseline: { tick: number } | null = lastSaved): boolean {
  return currentTick > (baseline?.tick ?? 0);
}
