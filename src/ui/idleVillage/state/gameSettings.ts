/**
 * gameSettings — the player's settings that have no store of their own
 * (PLAN-076 T-4): audio levels and reduced motion. Language and interface size
 * keep their existing stores (`useLocalization`, `useHudScale`).
 *
 * Levels are 0..1 and sanitised on every write and read; the record persists
 * through PersistenceService. Reduced motion lives on `<html data-reduced-motion>`,
 * which `reducedMotion.css` answers to; with no stored choice it follows the OS.
 */
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import './reducedMotion.css';

export const GAME_SETTINGS_KEY = 'wanderlust_settings_v1';

export interface GameSettings {
  master: number;
  effects: number;
  /** In the model and the record, but /game has no music source yet: the panel shows no row for it. */
  music: number;
  reducedMotion: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = { master: 1, effects: 1, music: 1, reducedMotion: false };

export interface SettingsIO {
  read: (key: string) => Promise<unknown | null>;
  write: (key: string, value: unknown) => Promise<void>;
}
const defaultIO: SettingsIO = { read: (key) => loadData<unknown | null>(key, null), write: (key, value) => saveData(key, value) };

const LEVELS = ['master', 'effects', 'music'] as const;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const osPrefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Merges `patch` into `base`; a field that is not a valid value keeps what `base` had. */
function sanitize(base: GameSettings, patch: unknown): GameSettings {
  const next = { ...base };
  if (typeof patch !== 'object' || patch === null) return next;
  const source = patch as Record<string, unknown>;
  for (const key of LEVELS) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) next[key] = clamp01(value);
  }
  if (typeof source.reducedMotion === 'boolean') next.reducedMotion = source.reducedMotion;
  return next;
}

let current: GameSettings = { ...DEFAULT_GAME_SETTINGS };
const listeners = new Set<() => void>();

function apply(next: GameSettings): void {
  current = next;
  if (typeof document !== 'undefined') {
    if (next.reducedMotion) document.documentElement.dataset.reducedMotion = 'true';
    else delete document.documentElement.dataset.reducedMotion;
  }
  listeners.forEach((fn) => fn());
}

const same = (a: GameSettings, b: GameSettings) => a.master === b.master && a.effects === b.effects && a.music === b.music && a.reducedMotion === b.reducedMotion;

export const getGameSettings = (): GameSettings => current;

export function subscribeGameSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Changes settings, applies them at once and persists. */
export function setGameSettings(patch: Partial<GameSettings>, io: SettingsIO = defaultIO): void {
  const next = sanitize(current, patch);
  if (same(next, current)) return;
  apply(next);
  void io.write(GAME_SETTINGS_KEY, next).catch((error) => console.warn('[gameSettings] persist failed:', error));
}

/** Back to the defaults (reduced motion follows the OS preference when persisting a reset). */
export function resetGameSettings(io: SettingsIO = defaultIO, persist = false): void {
  const next = { ...DEFAULT_GAME_SETTINGS, reducedMotion: persist ? osPrefersReducedMotion() : false };
  apply(next);
  if (persist) void io.write(GAME_SETTINGS_KEY, next).catch((error) => console.warn('[gameSettings] persist failed:', error));
}

/** Loads the stored record at boot. No record: defaults, with reduced motion following the OS. */
export async function hydrateGameSettings(io: SettingsIO = defaultIO): Promise<void> {
  let stored: unknown = null;
  try {
    stored = await io.read(GAME_SETTINGS_KEY);
  } catch (error) {
    console.warn('[gameSettings] load failed:', error);
  }
  const base = { ...DEFAULT_GAME_SETTINGS, reducedMotion: osPrefersReducedMotion() };
  apply(stored === null ? base : sanitize(base, stored));
}
