/**
 * Village Sandbox Persistence Service
 *
 * Async wrapper around the repo-wide PersistenceService for Village Sandbox state.
 * Provides mobile-ready persistence with Tauri FS support and localStorage fallback.
 *
 * Contracts:
 * - saveData: Persist VillageState with history snapshots
 * - loadData: Load VillageState with fallback to initial factory
 * - clearData: Remove all persisted state
 * - exportData: Get raw JSON for export
 * - importData: Restore from exported JSON
 * - getHistory: Access undo/redo snapshots
 */

import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

const STORAGE_KEY = 'idle_village_state';
const HISTORY_KEY = 'idle_village_state_history';
const MAX_HISTORY = 10;

export const DEFAULT_SHELL_PRESET_ID = 'live_config';
export const SHELL_PRESET_STORAGE_KEY = 'idle_village_shell_preset';

declare global {
  interface Window {
    __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const isTestPersistenceBypassed = (): boolean => {
  if (typeof window !== 'undefined' && window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS) {
    return true;
  }
  return typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
};

let inMemoryState: VillageState | null = null;
let inMemoryHistory: VillageStateSnapshot[] = [];
let inMemoryShellPresetId = DEFAULT_SHELL_PRESET_ID;
const ensureInMemoryState = (factory: () => VillageState): VillageState => {
  if (!inMemoryState) {
    inMemoryState = clone(factory());
    recordInMemorySnapshot(inMemoryState, 'Initial test state');
  }
  return inMemoryState;
};
const recordInMemorySnapshot = (state: VillageState, description: string) => {
  inMemoryHistory.unshift({
    timestamp: Date.now(),
    description,
    state: clone(state),
  });
  if (inMemoryHistory.length > MAX_HISTORY) {
    inMemoryHistory.splice(MAX_HISTORY);
  }
};

export interface VillageStateSnapshot {
  timestamp: number;
  description: string;
  state: VillageState;
}

/**
 * Persists VillageState with automatic history management.
 */
export async function saveVillageState(
  state: VillageState,
  description = 'State update'
): Promise<void> {
  if (isTestPersistenceBypassed()) {
    inMemoryState = clone(state);
    recordInMemorySnapshot(inMemoryState, description);
    return;
  }

  const snapshot: VillageStateSnapshot = {
    timestamp: Date.now(),
    description,
    state: clone(state),
  };

  await saveData(STORAGE_KEY, state);

  const history = await loadHistory();
  history.unshift(snapshot);
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }
  await saveData(HISTORY_KEY, history);
}

/**
 * Loads VillageState with fallback to initial factory.
 */
export async function loadVillageState(
  initialFactory: () => VillageState
): Promise<VillageState> {
  if (isTestPersistenceBypassed()) {
    return clone(ensureInMemoryState(initialFactory));
  }
  try {
    const defaultState = initialFactory();
    const loaded = await loadData<VillageState>(STORAGE_KEY, defaultState);
    if (loaded && loaded.residents && Object.keys(loaded.residents).length > 0) {
      return loaded;
    }
  } catch (error) {
    console.warn('[VillagePersistence] Failed to load state, using fallback:', error);
  }

  // Fallback to initial factory
  const fresh = initialFactory();
  await saveVillageState(fresh, 'Initial state');
  return fresh;
}

/**
 * Clears all persisted VillageState data.
 */
export async function clearVillageState(): Promise<void> {
  if (isTestPersistenceBypassed()) {
    inMemoryState = null;
    inMemoryHistory = [];
    return;
  }
  await clearData(STORAGE_KEY);
  await clearData(HISTORY_KEY);
}

/**
 * Exports current state as JSON string.
 */
export async function exportVillageState(): Promise<string> {
  if (isTestPersistenceBypassed()) {
    return JSON.stringify(inMemoryState ?? null, null, 2);
  }
  const defaultState = initialFactoryFallback();
  const state = await loadData<VillageState>(STORAGE_KEY, defaultState);
  return JSON.stringify(state, null, 2);
}

const initialFactoryFallback = (): VillageState => ({
  currentTime: 0,
  residents: {},
  resources: {},
  activities: {},
  eventLog: [],
  questOffers: {},
});

/**
 * Imports state from JSON string.
 */
export async function importVillageState(
  json: string,
  description = 'Imported state'
): Promise<void> {
  const parsed = JSON.parse(json) as VillageState;
  await saveVillageState(parsed, description);
}

/**
 * Resets to initial state from factory.
 */
export async function resetVillageState(
  initialFactory: () => VillageState,
  description = 'Reset state'
): Promise<VillageState> {
  if (isTestPersistenceBypassed()) {
    inMemoryState = clone(initialFactory());
    recordInMemorySnapshot(inMemoryState, description);
    return clone(inMemoryState);
  }
  const fresh = clone(initialFactory());
  await saveVillageState(fresh, description);
  return fresh;
}

/**
 * Loads history snapshots for undo functionality.
 */
export async function loadHistory(): Promise<VillageStateSnapshot[]> {
  if (isTestPersistenceBypassed()) {
    return clone(inMemoryHistory);
  }
  try {
    return await loadData<VillageStateSnapshot[]>(HISTORY_KEY, []);
  } catch (error) {
    console.warn('[VillagePersistence] Failed to load history:', error);
    return [];
  }
}

/**
 * Performs undo operation if history available.
 */
export async function undoVillageState(): Promise<VillageState | null> {
  if (isTestPersistenceBypassed()) {
    if (inMemoryHistory.length === 0) {
      return null;
    }
    const [latest, ...rest] = inMemoryHistory;
    inMemoryHistory = rest;
    inMemoryState = clone(latest.state);
    return clone(latest.state);
  }
  const history = await loadHistory();
  if (history.length === 0) return null;

  const [latest, ...rest] = history;
  await saveData(HISTORY_KEY, rest);
  await saveData(STORAGE_KEY, latest.state);
  return latest.state;
}

/**
 * Loads the persisted shell preset identifier used by the Idle Village shell.
 *
 * Falls back to {@link DEFAULT_SHELL_PRESET_ID} when no value is available.
 */
export async function loadShellPresetId(
  defaultId: string = DEFAULT_SHELL_PRESET_ID,
): Promise<string> {
  if (isTestPersistenceBypassed()) {
    return inMemoryShellPresetId;
  }
  try {
    const loaded = await loadData<string>(SHELL_PRESET_STORAGE_KEY, defaultId);
    return typeof loaded === 'string' && loaded.length > 0 ? loaded : defaultId;
  } catch (error) {
    console.warn('[VillagePersistence] Failed to load shell preset id, using default:', error);
    return defaultId;
  }
}

/**
 * Persists the shell preset identifier selected by the Idle Village shell.
 */
export async function saveShellPresetId(presetId: string): Promise<void> {
  const normalized = typeof presetId === 'string' && presetId.length > 0 ? presetId : DEFAULT_SHELL_PRESET_ID;
  if (isTestPersistenceBypassed()) {
    inMemoryShellPresetId = normalized;
    return;
  }
  await saveData(SHELL_PRESET_STORAGE_KEY, normalized);
}
