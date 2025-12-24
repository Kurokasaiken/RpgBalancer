import { isTauriRuntime } from '@/shared/persistence/runtime';

const CHARACTER_STORAGE_KEY = 'idle_combat_characters';
const CHARACTERS_RELATIVE_PATH = '../src/data/characters.json';
const CHARACTER_STORAGE_UPDATED_EVENT = 'characterStorageUpdated';

let cachedCharacterPath: string | null = null;
let bootstrapPromise: Promise<void> | null = null;

const hasWindow = () => typeof window !== 'undefined';

const getLocalStorage = (): Storage | null => {
  if (!hasWindow() || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

/**
 * Resolves the resource path that points to the characters JSON snapshot.
 */
async function resolveCharactersPath(): Promise<string> {
  if (cachedCharacterPath) return cachedCharacterPath;
  const { resolveResource } = await import('@tauri-apps/api/path');
  cachedCharacterPath = await resolveResource(CHARACTERS_RELATIVE_PATH);
  return cachedCharacterPath;
}

/**
 * Reads the raw JSON string from disk when running inside a Tauri runtime.
 */
async function readCharactersFromDisk(): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  try {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await resolveCharactersPath();
    return await readTextFile(path);
  } catch (error) {
    console.warn('[characterPersistence] Unable to read characters.json', error);
    return null;
  }
}

/**
 * Writes the provided payload to disk when the Tauri runtime is available.
 */
async function writeCharactersToDisk(payload: string): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await resolveCharactersPath();
    await writeTextFile(path, payload);
  } catch (error) {
    console.warn('[characterPersistence] Unable to write characters.json', error);
  }
}

/**
 * Mirrors the latest payload into localStorage (browser fallback).
 */
function writeCharactersToLocalStorage(payload: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(CHARACTER_STORAGE_KEY, payload);
  if (hasWindow()) {
    try {
      window.dispatchEvent(new CustomEvent(CHARACTER_STORAGE_UPDATED_EVENT));
    } catch {
      // Ignore CustomEvent failures (e.g., non-browser contexts).
    }
  }
}

/**
 * Bootstraps the browser storage using the on-disk snapshot (Tauri) or
 * ensures an empty dataset exists when no snapshot is present.
 */
async function bootstrapFromDisk(): Promise<void> {
  if (!isTauriRuntime()) return;
  const snapshot = await readCharactersFromDisk();
  const normalized = snapshot && snapshot.trim().length > 0 ? snapshot : '[]';
  writeCharactersToLocalStorage(normalized);
  if (!snapshot || snapshot.trim().length === 0) {
    await writeCharactersToDisk(normalized);
  }
}

/**
 * Ensures the character persistence layer is initialized before the UI mounts.
 * On web builds this resolves immediately, while on Tauri it synchronizes
 * localStorage with the on-disk JSON file.
 */
export async function initializeCharacterPersistence(): Promise<void> {
  if (!isTauriRuntime()) return;
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapFromDisk().catch((error) => {
      console.warn('[characterPersistence] Bootstrap failed', error);
    });
  }
  await bootstrapPromise;
}

/**
 * Retrieves the raw JSON snapshot from localStorage (if present).
 */
export function readCharacterSnapshot(): string | null {
  const storage = getLocalStorage();
  return storage ? storage.getItem(CHARACTER_STORAGE_KEY) : null;
}

/**
 * Persists the given JSON snapshot to localStorage and, when applicable, to disk.
 */
export function writeCharacterSnapshot(payload: string): void {
  writeCharactersToLocalStorage(payload);
  if (isTauriRuntime()) {
    void writeCharactersToDisk(payload);
  }
}

/**
 * Returns the localStorage key used for character persistence.
 */
export function getCharacterStorageKey(): string {
  return CHARACTER_STORAGE_KEY;
}

/**
 * Returns the DOM event name dispatched whenever the snapshot is updated.
 */
export function getCharacterStorageEventName(): string {
  return CHARACTER_STORAGE_UPDATED_EVENT;
}
