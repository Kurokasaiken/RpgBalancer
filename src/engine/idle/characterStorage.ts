// src/engine/idle/characterStorage.ts

import { DEFAULT_STATS } from '@/balancing/types';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { isTauriRuntime } from '@/shared/persistence/runtime';
import type { SavedCharacter } from './characterTypes';

const STORAGE_KEY = 'idle_combat_characters';
const STORAGE_UPDATED_EVENT = 'characterStorageUpdated';

const hasWindow = () => typeof window !== 'undefined';
const hasLocalStorage = () => typeof localStorage !== 'undefined';
let hasScheduledHydration = false;

function emitCharacterStorageUpdated(): void {
  if (!hasWindow()) return;
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_UPDATED_EVENT));
  } catch {
    // Ignore CustomEvent failures in non-browser runtimes.
  }
}

export function getCharacterStorageEventName(): string {
  return STORAGE_UPDATED_EVENT;
}

/**
 * Persists the provided snapshot through the async PersistenceService
 * when running inside Tauri. Web runtimes rely on localStorage only.
 */
function persistSnapshotToDisk(characters: SavedCharacter[]): void {
  if (!isTauriRuntime()) return;
  void saveData(STORAGE_KEY, characters).catch((error) => {
    console.warn('[characterStorage] Failed to persist snapshot to disk:', error);
  });
}

/**
 * Schedules a best-effort hydration from the async PersistenceService
 * so localStorage is initialized even if the WebView cache was cleared.
 */
function ensureHydrationScheduled(): void {
  if (hasScheduledHydration || !isTauriRuntime() || !hasLocalStorage()) return;
  hasScheduledHydration = true;
  void hydrateLocalStorageFromDisk();
}

/**
 * Hydrates localStorage with the snapshot stored on disk (Tauri only).
 * This keeps the synchronous APIs working across restarts.
 */
async function hydrateLocalStorageFromDisk(): Promise<void> {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return;
        }
      } catch {
        // Ignore and attempt hydration.
      }
    }
    const persisted = await loadData<SavedCharacter[]>(STORAGE_KEY, []);
    if (!persisted || persisted.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    emitCharacterStorageUpdated();
  } catch (error) {
    console.warn('[characterStorage] Unable to hydrate localStorage from disk:', error);
  }
}

function readLocalSnapshot(): SavedCharacter[] {
    if (!hasLocalStorage()) {
        return [];
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored) as SavedCharacter[];
        return parsed.map((char) => ({
            ...char,
            statBlock: {
                ...DEFAULT_STATS,
                ...char.statBlock,
            },
        }));
    } catch {
        console.warn('[characterStorage] local snapshot corrupted, resetting.');
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
}

function writeLocalSnapshot(characters: SavedCharacter[]): void {
    if (!hasLocalStorage()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

export function saveCharacter(character: SavedCharacter): void {
    ensureHydrationScheduled();
    const characters = readLocalSnapshot();
    const existingIndex = characters.findIndex(c => c.id === character.id);

    if (existingIndex >= 0) {
        characters[existingIndex] = character;
    } else {
        characters.push(character);
    }

    writeLocalSnapshot(characters);
    emitCharacterStorageUpdated();
    persistSnapshotToDisk(characters);
}

export function loadCharacters(): SavedCharacter[] {
    return readLocalSnapshot();
}

export function deleteCharacter(id: string): void {
    ensureHydrationScheduled();
    const characters = readLocalSnapshot().filter(c => c.id !== id);
    writeLocalSnapshot(characters);
    emitCharacterStorageUpdated();
    persistSnapshotToDisk(characters);
}

export function getCharacter(id: string): SavedCharacter | null {
    ensureHydrationScheduled();
    const characters = readLocalSnapshot();
    return characters.find(c => c.id === id) || null;
}

export type { SavedCharacter } from './characterTypes';
