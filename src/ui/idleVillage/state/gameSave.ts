/**
 * gameSave — the whole-game save package (PLAN-076 T-1, DN-7).
 *
 * The game's progress is spread over several persistence keys (gameplay clock
 * and roster, village stash, invasion, consumed POIs, one run per quest, the
 * per-day expedition drafts — see `gameProgressKeys()`). A save is ONE value
 * holding all of them, stamped with a schema version and a checksum, so a slot
 * can be written and restored as a unit: restoring either puts back the whole
 * world or leaves the previous one untouched.
 *
 * Preferences (HUD layout, skin, UI scale, language, audio) are not progress
 * and never travel with a save.
 */
import { clearData, listPersistedKeys, loadData, saveData } from '@/shared/persistence/PersistenceService';
import {
  EXPEDITION_DRAFT_PREFIX,
  gameProgressKeys,
} from '@/ui/idleVillage/components/gameFrame/questInitialState';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';

export const GAME_SAVE_SCHEMA = 1;

/** One autosave slot (never overwritten by a manual save) and three manual ones (Director, O-1). */
export const SAVE_SLOTS = ['auto', 'slot-1', 'slot-2', 'slot-3'] as const;
export type SaveSlotId = (typeof SAVE_SLOTS)[number];

/** Persistence key of a slot. Not part of `gameProgressKeys()`, so a restore never touches the slots. */
export const saveSlotKey = (slot: SaveSlotId) => `wanderlust_save_${slot}`;

/** Storage the save talks to; injected so the package can be tested without a disk. */
export interface SaveIO {
  read: (key: string) => Promise<unknown | null>;
  write: (key: string, value: unknown) => Promise<void>;
  clear: (key: string) => Promise<void>;
  listKeys: () => Promise<string[]>;
}

export const defaultSaveIO: SaveIO = {
  read: (key) => loadData<unknown | null>(key, null),
  write: (key, value) => saveData(key, value),
  clear: (key) => clearData(key),
  listKeys: () => listPersistedKeys(),
};

/** What a slot row shows. Derived from the save itself, never stored separately. */
export interface GameSaveMeta {
  day: number;
  gold: number;
  /** Names of the living heroes in the roster. */
  heroes: string[];
  /** Quest runs started and not yet ended. */
  activeExpeditions: number;
  /** Game-clock tick of the gameplay snapshot: what "progress since the last save" is measured against. */
  tick: number;
}

export interface GameSave {
  schemaVersion: number;
  savedAt: number;
  meta: GameSaveMeta;
  entries: Record<string, unknown>;
  /** Hash of `entries` only. */
  checksum: string;
  /** Optional preview (data URL). Outside the checksum: a missing or stale thumbnail never invalidates a save. */
  thumbnail?: string;
}

/** Key-order independent JSON, so a save re-read from disk hashes like the one that was written. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** cyrb53: a 53-bit string hash. Integrity against truncation and bit-rot, not security. */
function hashString(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

const checksumOf = (entries: Record<string, unknown>) => hashString(stableStringify(entries));

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** The gameplay snapshot is a `MinimalSnapshot` (`metadata.summary` + `data`); older shapes are read defensively. */
function deriveMeta(entries: Record<string, unknown>): GameSaveMeta {
  const gameplay = entries[GAMEPLAY_STORE_KEY];
  const summary = isRecord(gameplay) && isRecord(gameplay.metadata) && isRecord(gameplay.metadata.summary) ? gameplay.metadata.summary : {};
  const data = isRecord(gameplay) && isRecord(gameplay.data) ? gameplay.data : {};
  const residents = Array.isArray(data.residents) ? data.residents : [];
  const heroes = residents
    .filter((r): r is Record<string, unknown> => isRecord(r) && r.isHero === true && r.isDead !== true)
    .map((r) => String(r.name ?? ''))
    .filter(Boolean);
  const activeExpeditions = Object.entries(entries).filter(
    ([key, value]) => key.startsWith('idleVillage.questRun.') && isRecord(value) && isRecord(value.run) && value.run.ended !== true,
  ).length;
  return {
    day: typeof summary.currentDay === 'number' ? summary.currentDay : 0,
    gold: typeof summary.gold === 'number' ? summary.gold : 0,
    heroes,
    activeExpeditions,
    tick: typeof data.currentTime === 'number' ? data.currentTime : 0,
  };
}

const isDraftKey = (key: string) => key.startsWith(EXPEDITION_DRAFT_PREFIX);

/** Keys that hold progress right now: the fixed ones plus whatever expedition drafts exist. */
async function progressKeysNow(io: SaveIO): Promise<string[]> {
  const drafts = (await io.listKeys()).filter(isDraftKey);
  return [...new Set([...gameProgressKeys(), ...drafts])];
}

/** Reads every progress key into one save. Keys with no value are simply absent from `entries`. */
export async function captureGameSave(io: SaveIO = defaultSaveIO, now: () => number = Date.now): Promise<GameSave> {
  const entries: Record<string, unknown> = {};
  for (const key of await progressKeysNow(io)) {
    const value = await io.read(key);
    if (value !== null && value !== undefined) entries[key] = value;
  }
  return { schemaVersion: GAME_SAVE_SCHEMA, savedAt: now(), meta: deriveMeta(entries), entries, checksum: checksumOf(entries) };
}

export type SaveRefusal = 'malformed' | 'corrupt' | 'newer-version';
export type VerifyResult = { ok: true; save: GameSave } | { ok: false; reason: SaveRefusal };

/** Checks shape, schema version and checksum. Never throws on foreign data. */
export function verifyGameSave(candidate: unknown): VerifyResult {
  if (
    !isRecord(candidate) ||
    typeof candidate.schemaVersion !== 'number' ||
    typeof candidate.savedAt !== 'number' ||
    !isRecord(candidate.entries) ||
    typeof candidate.checksum !== 'string'
  ) {
    return { ok: false, reason: 'malformed' };
  }
  if (candidate.schemaVersion > GAME_SAVE_SCHEMA) return { ok: false, reason: 'newer-version' };
  if (checksumOf(candidate.entries) !== candidate.checksum) return { ok: false, reason: 'corrupt' };
  const save = candidate as unknown as GameSave;
  return { ok: true, save: { ...save, meta: deriveMeta(save.entries) } };
}

export type RestoreResult = { ok: true } | { ok: false; reason: SaveRefusal | 'write-failed' };

/**
 * Puts the saved world back. Verified first (nothing is written for a refused
 * save); then every progress key is written or cleared, and any failure rolls
 * the previous values back so the world is never half old, half new.
 */
export async function restoreGameSave(candidate: unknown, io: SaveIO = defaultSaveIO): Promise<RestoreResult> {
  const verdict = verifyGameSave(candidate);
  if (!verdict.ok) return verdict;
  const { entries } = verdict.save;

  const keys = [...new Set([...(await progressKeysNow(io)), ...Object.keys(entries)])];
  const previous = new Map<string, unknown | null>();
  for (const key of keys) previous.set(key, await io.read(key));

  try {
    for (const key of keys) {
      if (key in entries) await io.write(key, entries[key]);
      else await io.clear(key);
    }
    return { ok: true };
  } catch (error) {
    console.warn('[gameSave] restore failed, rolling back:', error);
    for (const [key, value] of previous) {
      try {
        if (value === null || value === undefined) await io.clear(key);
        else await io.write(key, value);
      } catch (rollbackError) {
        console.warn(`[gameSave] rollback of ${key} failed:`, rollbackError);
      }
    }
    return { ok: false, reason: 'write-failed' };
  }
}

export async function writeSlot(slot: SaveSlotId, save: GameSave, io: SaveIO = defaultSaveIO): Promise<void> {
  await io.write(saveSlotKey(slot), save);
}

/** The verified save in a slot, or null when the slot is empty or unreadable. */
export async function readSlot(slot: SaveSlotId, io: SaveIO = defaultSaveIO): Promise<GameSave | null> {
  const verdict = verifyGameSave(await io.read(saveSlotKey(slot)));
  return verdict.ok ? verdict.save : null;
}

export async function deleteSlot(slot: SaveSlotId, io: SaveIO = defaultSaveIO): Promise<void> {
  await io.clear(saveSlotKey(slot));
}

export interface SaveSlotInfo {
  slot: SaveSlotId;
  state: 'empty' | 'ok' | 'corrupt' | 'newer-version';
  savedAt?: number;
  meta?: GameSaveMeta;
  thumbnail?: string;
}

/** One row per slot, in `SAVE_SLOTS` order. */
export async function listSaves(io: SaveIO = defaultSaveIO): Promise<SaveSlotInfo[]> {
  const rows: SaveSlotInfo[] = [];
  for (const slot of SAVE_SLOTS) {
    const raw = await io.read(saveSlotKey(slot));
    if (raw === null || raw === undefined) {
      rows.push({ slot, state: 'empty' });
      continue;
    }
    const verdict = verifyGameSave(raw);
    if (verdict.ok) rows.push({ slot, state: 'ok', savedAt: verdict.save.savedAt, meta: verdict.save.meta, thumbnail: verdict.save.thumbnail });
    else rows.push({ slot, state: verdict.reason === 'newer-version' ? 'newer-version' : 'corrupt' });
  }
  return rows;
}
