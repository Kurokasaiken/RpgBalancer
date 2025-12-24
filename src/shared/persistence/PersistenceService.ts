/**
 * General asynchronous persistence service for the RPG Balancer.
 * Handles all data persistence operations using Tauri filesystem when available,
 * with localStorage fallback for web/mobile environments.
 *
 * All persistence operations are asynchronous to support filesystem I/O.
 */

import { isTauriRuntime } from './runtime';

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_IPC__?: unknown;
  }
}

/**
 * Cache for resolved app data directory path.
 */
let cachedAppDataDir: string | null = null;

/**
 * Resolves the app data directory for persistence.
 * Creates the directory if it doesn't exist.
 */
async function resolveAppDataDir(): Promise<string> {
  if (cachedAppDataDir) return cachedAppDataDir;

  if (!isTauriRuntime()) {
    // Web fallback: no directory needed
    return '';
  }

  try {
    const { appDataDir, createDir } = await import('@tauri-apps/api/path');
    const { exists, createDir: fsCreateDir } = await import('@tauri-apps/plugin-fs');

    const dir = await appDataDir();
    const fullPath = `${dir}/rpg-balancer-data`;

    // Check if directory exists
    const dirExists = await exists(fullPath);
    if (!dirExists) {
      await fsCreateDir(fullPath, { recursive: true });
    }

    cachedAppDataDir = fullPath;
    return fullPath;
  } catch (error) {
    console.warn('[PersistenceService] Failed to resolve app data dir:', error);
    return '';
  }
}

/**
 * Generates a filesystem-safe filename from a key.
 */
function keyToFilename(key: string): string {
  return `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
}

/**
 * Saves data asynchronously.
 * Uses Tauri FS in Tauri runtime, localStorage as fallback.
 */
export async function saveData<T>(key: string, data: T): Promise<void> {
  const serialized = JSON.stringify(data, null, 2);

  if (isTauriRuntime()) {
    try {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const appDataDir = await resolveAppDataDir();
      if (!appDataDir) {
        throw new Error('Could not resolve app data directory');
      }
      const filename = keyToFilename(key);
      const filepath = `${appDataDir}/${filename}`;
      await writeTextFile(filepath, serialized);
    } catch (error) {
      console.warn(`[PersistenceService] Failed to save ${key} to FS, falling back to localStorage:`, error);
      // Fallback to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, serialized);
      }
    }
  } else {
    // Web/mobile fallback: use localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    }
  }
}

/**
 * Loads data asynchronously.
 * Uses Tauri FS in Tauri runtime, localStorage as fallback.
 */
export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  if (isTauriRuntime()) {
    try {
      const { readTextFile, exists } = await import('@tauri-apps/plugin-fs');
      const appDataDir = await resolveAppDataDir();
      if (!appDataDir) {
        throw new Error('Could not resolve app data directory');
      }
      const filename = keyToFilename(key);
      const filepath = `${appDataDir}/${filename}`;

      const fileExists = await exists(filepath);
      if (!fileExists) {
        return JSON.parse(JSON.stringify(defaultValue)) as T;
      }

      const raw = await readTextFile(filepath);
      if (!raw || raw.trim().length === 0) {
        return JSON.parse(JSON.stringify(defaultValue)) as T;
      }

      try {
        return JSON.parse(raw) as T;
      } catch (parseError) {
        console.warn(`[PersistenceService] Failed to parse ${key}, using default:`, parseError);
        return JSON.parse(JSON.stringify(defaultValue)) as T;
      }
    } catch (error) {
      console.warn(`[PersistenceService] Failed to load ${key} from FS, falling back to localStorage:`, error);
      // Fallback to localStorage
      return loadFromLocalStorage(key, defaultValue);
    }
  } else {
    // Web/mobile fallback: use localStorage
    return loadFromLocalStorage(key, defaultValue);
  }
}

/**
 * Helper to load from localStorage with fallback.
 */
function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof localStorage === 'undefined') {
    return JSON.parse(JSON.stringify(defaultValue)) as T;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return JSON.parse(JSON.stringify(defaultValue)) as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (parseError) {
    console.warn(`[PersistenceService] Failed to parse ${key} from localStorage, using default:`, parseError);
    return JSON.parse(JSON.stringify(defaultValue)) as T;
  }
}

/**
 * Clears data for a specific key.
 */
export async function clearData(key: string): Promise<void> {
  if (isTauriRuntime()) {
    try {
      const { remove } = await import('@tauri-apps/plugin-fs');
      const appDataDir = await resolveAppDataDir();
      if (!appDataDir) return;
      const filename = keyToFilename(key);
      const filepath = `${appDataDir}/${filename}`;

      // Check if exists before removing
      const { exists } = await import('@tauri-apps/plugin-fs');
      if (await exists(filepath)) {
        await remove(filepath);
      }
    } catch (error) {
      console.warn(`[PersistenceService] Failed to remove ${key} from FS:`, error);
    }
  }

  // Always clear localStorage as well (for consistency)
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  }
}

/**
 * Lists all persisted keys (for debugging/diagnostics).
 */
export async function listPersistedKeys(): Promise<string[]> {
  if (isTauriRuntime()) {
    try {
      const { readDir } = await import('@tauri-apps/plugin-fs');
      const appDataDir = await resolveAppDataDir();
      if (!appDataDir) return [];

      const entries = await readDir(appDataDir);
      return entries
        .filter(entry => entry.name?.endsWith('.json'))
        .map(entry => entry.name!.replace('.json', '').replace(/_/g, ''));
    } catch (error) {
      console.warn('[PersistenceService] Failed to list persisted keys:', error);
      return [];
    }
  } else {
    // Web fallback: enumerate localStorage keys
    if (typeof localStorage === 'undefined') return [];

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }
}
