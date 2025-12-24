import { create } from 'zustand';
import { IdleVillageConfigSchema } from './schemas';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from './defaultConfig';
import { loadFinalConfigFromDisk, persistConfigToDisk } from './PersistenceService';
import type { IdleVillageConfig, IdleVillageConfigSnapshot } from './types';

/** Maximum amount of historical snapshots retained for undo. */
const HISTORY_LIMIT = 10;
/** Debounce delay (ms) before persisting a config change to disk. */
const SAVE_DEBOUNCE_MS = 1000;

/**
 * Deep-clones a plain JSON-serializable value through stringify/parse.
 */
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

let pendingPersist: IdleVillageConfig | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedules an async write of the provided config, applying debounce semantics.
 */
const enqueuePersist = (config: IdleVillageConfig) => {
  pendingPersist = clone(config);
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    const payload = pendingPersist;
    pendingPersist = null;
    persistTimer = null;
    if (!payload) return;
    void persistConfigToDisk(payload).catch((error) => {
      console.warn('[IdleVillageConfigStore] Failed to persist config:', error);
    });
  }, SAVE_DEBOUNCE_MS);
};

/**
 * Result object returned by config mutations when validation occurs.
 */
export interface IdleVillageValidationResult {
  success: boolean;
  error?: string;
}

/**
 * Zustand store shape for the Idle Village configuration editor.
 */
interface IdleVillageConfigStoreState {
  config: IdleVillageConfig;
  history: IdleVillageConfigSnapshot[];
  initialized: boolean;
  isInitializing: boolean;
  initialConfig?: IdleVillageConfig;
  error?: string;
  initializeConfig: () => Promise<void>;
  saveConfig: (next: IdleVillageConfig, description: string) => IdleVillageValidationResult;
  updateConfig: (updates: Partial<IdleVillageConfig>) => IdleVillageValidationResult;
  importConfig: (json: string, description?: string) => IdleVillageValidationResult;
  exportConfig: () => string;
  resetConfig: () => IdleVillageValidationResult;
  resetToInitialConfig: () => IdleVillageValidationResult;
  undo: () => void;
}

/**
 * Captures the current config snapshot and pushes it onto the history stack.
 */
const pushHistory = (
  state: IdleVillageConfigStoreState,
  description: string,
): IdleVillageConfigSnapshot[] => {
  const snapshot: IdleVillageConfigSnapshot = {
    timestamp: Date.now(),
    config: clone(state.config),
    description,
  };
  return [snapshot, ...state.history].slice(0, HISTORY_LIMIT);
};

/**
 * Parses and validates the given config via the Zod schema, throwing on error.
 */
const validateConfig = (config: IdleVillageConfig) => {
  const result = IdleVillageConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
};

/**
 * Primary Zustand hook powering the Idle Village config UI/editor flows.
 */
export const useIdleVillageConfigStore = create<IdleVillageConfigStoreState>((set, get) => ({
  config: clone(DEFAULT_IDLE_VILLAGE_CONFIG),
  history: [],
  initialized: false,
  isInitializing: false,
  error: undefined,

  /**
   * Lazily loads the config from disk (or defaults) and seeds the store state.
   */
  async initializeConfig() {
    const { initialized, isInitializing } = get();
    if (initialized || isInitializing) return;
    set({ isInitializing: true, error: undefined });
    try {
      const loaded = await loadFinalConfigFromDisk();
      set({
        config: clone(loaded),
        history: [],
        initialized: true,
        isInitializing: false,
        initialConfig: clone(loaded),
      });
    } catch (error) {
      console.warn('[IdleVillageConfigStore] Failed to load config from disk, using defaults.', error);
      const fallback = clone(DEFAULT_IDLE_VILLAGE_CONFIG);
      set({
        config: fallback,
        history: [],
        initialized: true,
        isInitializing: false,
        initialConfig: fallback,
        error: (error as Error)?.message ?? 'Unable to load config from disk',
      });
    }
  },

  /**
   * Validates and persists the provided config snapshot, recording history.
   */
  saveConfig(next, description) {
    try {
      const validated = validateConfig(next);
      set((state) => ({
        config: clone(validated),
        history: pushHistory(state, description),
      }));
      enqueuePersist(validated);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Shallow-merges partial updates into the current config via saveConfig.
   */
  updateConfig(updates) {
    const { config } = get();
    const merged = { ...config, ...updates } as IdleVillageConfig;
    return get().saveConfig(merged, 'UI update');
  },

  /**
   * Imports a JSON string payload and attempts to persist it as the new config.
   */
  importConfig(json, description = 'Imported IdleVillageConfig') {
    try {
      const parsed = JSON.parse(json) as IdleVillageConfig;
      return get().saveConfig(parsed, description);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Serializes the current config for clipboard/export operations.
   */
  exportConfig() {
    return JSON.stringify(get().config, null, 2);
  },

  /**
   * Restores the config to DEFAULT_IDLE_VILLAGE_CONFIG and updates snapshots.
   */
  resetConfig() {
    const defaults = clone(DEFAULT_IDLE_VILLAGE_CONFIG);
    const result = get().saveConfig(defaults, 'Reset IdleVillageConfig to defaults');
    if (result.success) {
      set({ initialConfig: clone(defaults) });
    }
    return result;
  },

  /**
   * Restores the config to the first loaded snapshot captured on initialization.
   */
  resetToInitialConfig() {
    const { initialConfig } = get();
    if (!initialConfig) {
      return { success: false, error: 'Initial config snapshot not available.' };
    }
    return get().saveConfig(clone(initialConfig), 'Reset IdleVillageConfig to initial snapshot');
  },

  /**
   * Reverts the config to the most recent history entry and persists it.
   */
  undo() {
    const { history } = get();
    if (history.length === 0) return;
    const [previous, ...rest] = history;
    set({ config: clone(previous.config), history: rest });
    enqueuePersist(previous.config);
  },
}));
