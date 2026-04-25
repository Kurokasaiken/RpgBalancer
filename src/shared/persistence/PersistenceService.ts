/**
 * General asynchronous persistence service for the RPG Balancer.
 * Handles all data persistence operations using Tauri filesystem when available,
 * with localStorage fallback for web/mobile environments.
 *
 * All persistence operations are asynchronous to support filesystem I/O.
 */

import { isTauriRuntime } from './runtime';
import { withStorageTelemetry } from '@/analytics/balancerStorageTelemetry';
import {
  serializeSnapshot,
  deserializeSnapshot,
  type MinimalSnapshot,
  type MinimalGameState,
} from '@/engine/game/idleVillage/minimalSnapshotSerializer';

type PathModule = typeof import('@tauri-apps/api/path');
type PathHelpers = Pick<PathModule, 'appDataDir'>;
type FsModule = typeof import('@tauri-apps/plugin-fs');
type FsHelpers = Pick<
  FsModule,
  'exists' | 'mkdir' | 'writeTextFile' | 'readTextFile' | 'remove' | 'readDir'
>;

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_IPC__?: unknown;
  }
}

const isPlaywrightRuntime = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'playwright';
const inMemoryStore = new Map<string, string>();

const getPlaywrightStorage = () => {
  if (!isPlaywrightRuntime) return null;
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage;
};

/**
 * Saves a Minimal Gameplay snapshot with metadata (version/checksum) using the canonical serializer.
 */
export async function saveMinimalGameplaySnapshot(
  key: string,
  gameState: MinimalGameState
): Promise<MinimalSnapshot> {
  const snapshot = serializeSnapshot(gameState);
  await saveData(key, snapshot);
  return snapshot;
}

/**
 * Loads and validates a Minimal Gameplay snapshot, returning parsed data or null if unavailable.
 */
export async function loadMinimalGameplaySnapshotData(key: string): Promise<MinimalGameState | null> {
  const snapshot = await loadData<MinimalSnapshot | null>(key, null);
  if (!snapshot) {
    return null;
  }

  try {
    return deserializeSnapshot(snapshot);
  } catch (error) {
    console.warn('[PersistenceService] Failed to deserialize Minimal Gameplay snapshot:', error);
    return null;
  }
}

/**
 * Lazy-loaded module references to avoid repeated dynamic imports.
 */
let pathHelpersPromise: Promise<PathHelpers> | null = null;
let fsHelpersPromise: Promise<FsHelpers> | null = null;

async function getPathHelpers(): Promise<PathHelpers> {
  if (!pathHelpersPromise) {
    pathHelpersPromise = import('@tauri-apps/api/path').then((mod) => {
      const module = mod as unknown as PathHelpers;
      return { appDataDir: module.appDataDir };
    });
  }
  return pathHelpersPromise;
}

async function getFsHelpers(): Promise<FsHelpers> {
  if (!fsHelpersPromise) {
    fsHelpersPromise = import('@tauri-apps/plugin-fs').then((mod) => {
      const module = mod as unknown as FsHelpers;
      return {
        exists: module.exists,
        mkdir: module.mkdir,
        writeTextFile: module.writeTextFile,
        readTextFile: module.readTextFile,
        remove: module.remove,
        readDir: module.readDir,
      };
    });
  }
  return fsHelpersPromise;
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
    const { appDataDir } = await getPathHelpers();
    const { exists, mkdir } = await getFsHelpers();

    const dir = await appDataDir();
    const fullPath = `${dir}/rpg-balancer-data`;

    // Check if directory exists
    const dirExists = await exists(fullPath);
    if (!dirExists) {
      await mkdir(fullPath, { recursive: true });
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

  const playwrightStore = getPlaywrightStorage();
  if (playwrightStore) {
    playwrightStore.setItem(key, serialized);
    return;
  }

  if (isPlaywrightRuntime && !playwrightStore) {
    inMemoryStore.set(key, serialized);
    return;
  }

  if (isTauriRuntime()) {
    return withStorageTelemetry('save', key, async () => {
      const { writeTextFile } = await getFsHelpers();
      const appDataDir = await resolveAppDataDir();
      if (!appDataDir) {
        throw new Error('Could not resolve app data directory');
      }
      const filename = keyToFilename(key);
      const filepath = `${appDataDir}/${filename}`;
      await writeTextFile(filepath, serialized);
    }, 'tauri').catch(async (error) => {
      console.warn(`[PersistenceService] Failed to save ${key} to FS, falling back to localStorage:`, error);
      // Fallback to localStorage with telemetry
      return withStorageTelemetry('save', key, async () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, serialized);
        } else {
          throw new Error('localStorage not available');
        }
      }, 'localStorage');
    });
  } else {
    // Web/mobile fallback: use localStorage
    return withStorageTelemetry('save', key, async () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, serialized);
      } else {
        throw new Error('localStorage not available');
      }
    }, 'localStorage');
  }
}

/**
 * Loads data asynchronously.
 * Uses Tauri FS in Tauri runtime, localStorage as fallback.
 */
export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  const playwrightStore = getPlaywrightStorage();
  if (playwrightStore) {
    const raw = playwrightStore.getItem(key);
    if (!raw || raw.trim().length === 0) {
      return JSON.parse(JSON.stringify(defaultValue)) as T;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return JSON.parse(JSON.stringify(defaultValue)) as T;
    }
  }

  if (isPlaywrightRuntime && !playwrightStore) {
    if (inMemoryStore.has(key)) {
      return JSON.parse(inMemoryStore.get(key) ?? 'null') ?? JSON.parse(JSON.stringify(defaultValue));
    }
    return JSON.parse(JSON.stringify(defaultValue)) as T;
  }

  if (isTauriRuntime()) {
    return withStorageTelemetry('load', key, async () => {
      const { readTextFile, exists } = await getFsHelpers();
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
    }, 'tauri').catch(async (error) => {
      console.warn(`[PersistenceService] Failed to load ${key} from FS, falling back to localStorage:`, error);
      // Fallback to localStorage with telemetry
      return withStorageTelemetry('load', key, async () => loadFromLocalStorage(key, defaultValue), 'localStorage');
    });
  } else {
    // Web/mobile fallback: use localStorage
    return withStorageTelemetry('load', key, async () => loadFromLocalStorage(key, defaultValue), 'localStorage');
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
  const playwrightStore = getPlaywrightStorage();
  if (playwrightStore) {
    playwrightStore.removeItem(key);
    return;
  }

  if (isPlaywrightRuntime && !playwrightStore) {
    inMemoryStore.delete(key);
    return;
  }

  if (isTauriRuntime()) {
    return withStorageTelemetry('clear', key, async () => {
      const { remove, exists } = await getFsHelpers();
      const appDataDir = await resolveAppDataDir();
      if (!appDataDir) return;
      const filename = keyToFilename(key);
      const filepath = `${appDataDir}/${filename}`;

      // Check if exists before removing
      if (await exists(filepath)) {
        await remove(filepath);
      }
    }, 'tauri').catch((error) => {
      console.warn(`[PersistenceService] Failed to remove ${key} from FS:`, error);
      // Still clear localStorage for consistency
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    });
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
      const { readDir } = await getFsHelpers();
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
