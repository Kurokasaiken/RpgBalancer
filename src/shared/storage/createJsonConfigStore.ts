// src/shared/storage/createJsonConfigStore.ts
// Generic helper to persist JSON configs using async PersistenceService
// with optional history tracking and schema validation.

import type { ZodType } from 'zod';
import { saveData, loadData } from '../persistence/PersistenceService';

export interface JsonConfigSnapshot<T> {
  timestamp: number;
  config: T;
  description: string;
}

export interface JsonConfigStore<T> {
  load(): Promise<T>;
  save(config: T, description?: string): Promise<void>;
  reset(description?: string): Promise<T>;
  getHistory(): Promise<JsonConfigSnapshot<T>[]>;
  undo(): Promise<T | null>;
  export(): Promise<string>;
  import(json: string, description?: string): Promise<T>;
}

export interface JsonConfigStoreOptions<T> {
  storageKey: string;
  historyKey?: string;
  schema: ZodType<T>;
  defaultValue: T;
  maxHistory?: number;
  mergeWithDefaults?: (validatedConfig: T) => T;
  updatedEventName?: string;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function createJsonConfigStore<T>(options: JsonConfigStoreOptions<T>): JsonConfigStore<T> {
  const {
    storageKey,
    historyKey = `${storageKey}_history`,
    schema,
    defaultValue,
    maxHistory = 10,
    mergeWithDefaults,
    updatedEventName,
  } = options;

  let cachedConfig: T | null = null;
  let history: JsonConfigSnapshot<T>[] = [];

  const dispatchUpdateEvent = () => {
    if (!updatedEventName || typeof window === 'undefined') return;
    try {
      window.dispatchEvent(new CustomEvent(updatedEventName));
    } catch {
      // Ignore dispatch errors in non-browser environments
    }
  };

  const persistHistory = async () => {
    await saveData(historyKey, history);
  };

  const addToHistory = async (description: string) => {
    if (!cachedConfig) return;
    const snapshot: JsonConfigSnapshot<T> = {
      timestamp: Date.now(),
      config: clone(cachedConfig),
      description,
    };
    history.unshift(snapshot);
    if (history.length > maxHistory) {
      history = history.slice(0, maxHistory);
    }
    await persistHistory();
  };

  const loadHistory = async () => {
    try {
      history = await loadData<JsonConfigSnapshot<T>[]>(historyKey, []);
    } catch {
      history = [];
    }
  };

  const readFromStorage = async (): Promise<T> => {
    try {
      const parsed = await loadData<T>(storageKey, null);
      if (parsed === null) {
        const fallback = clone(defaultValue);
        await saveData(storageKey, fallback);
        return fallback;
      }
      const validated = schema.parse(parsed);
      return mergeWithDefaults ? mergeWithDefaults(validated) : validated;
    } catch (error) {
      console.warn(`Failed to load config for key ${storageKey}, using defaults:`, error);
      const fallback = clone(defaultValue);
      try {
        await saveData(storageKey, fallback);
      } catch {
        // Ignore write errors
      }
      return fallback;
    }
  };

  const writeToStorage = async (config: T) => {
    await saveData(storageKey, config);
  };

  const ensureLoaded = async (): Promise<T> => {
    if (!cachedConfig) {
      cachedConfig = await readFromStorage();
      await loadHistory();
    }
    return cachedConfig;
  };

  return {
    async load(): Promise<T> {
      return await ensureLoaded();
    },
    async save(config: T, description = 'Manual save'): Promise<void> {
      const result = schema.safeParse(config);
      if (!result.success) {
        throw new Error(`Invalid config: ${result.error.message}`);
      }
      await addToHistory(description);
      cachedConfig = mergeWithDefaults ? mergeWithDefaults(result.data) : result.data;
      await writeToStorage(cachedConfig);
      dispatchUpdateEvent();
    },
    async reset(description = 'Reset to defaults'): Promise<T> {
      await addToHistory(description);
      cachedConfig = clone(defaultValue);
      await writeToStorage(cachedConfig);
      dispatchUpdateEvent();
      return cachedConfig;
    },
    async getHistory(): Promise<JsonConfigSnapshot<T>[]> {
      await ensureLoaded();
      return [...history];
    },
    async undo(): Promise<T | null> {
      await ensureLoaded();
      if (history.length === 0) return null;
      const previous = history.shift();
      if (!previous) return null;
      cachedConfig = clone(previous.config) as T;
      await writeToStorage(cachedConfig);
      await persistHistory();
      dispatchUpdateEvent();
      return cachedConfig;
    },
    async export(): Promise<string> {
      const config = await ensureLoaded();
      return JSON.stringify(config, null, 2);
    },
    async import(json: string, description = 'Imported configuration'): Promise<T> {
      const parsed = JSON.parse(json);
      const validated = schema.parse(parsed);
      const merged = mergeWithDefaults ? mergeWithDefaults(validated) : validated;
      await this.save(merged, description);
      return merged;
    },
  };
}
