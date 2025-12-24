// src/shared/storage/createJsonConfigStore.ts
// Generic helper to persist JSON configs inside localStorage
// with optional history tracking and schema validation.

import type { ZodType } from 'zod';

export interface JsonConfigSnapshot<T> {
  timestamp: number;
  config: T;
  description: string;
}

export interface JsonConfigStore<T> {
  load(): T;
  save(config: T, description?: string): void;
  reset(description?: string): T;
  getHistory(): JsonConfigSnapshot<T>[];
  undo(): T | null;
  export(): string;
  import(json: string, description?: string): T;
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

const getLocalStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
};

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

  const persistHistory = () => {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.setItem(historyKey, JSON.stringify(history));
  };

  const addToHistory = (description: string) => {
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
    persistHistory();
  };

  const loadHistory = () => {
    const storage = getLocalStorage();
    if (!storage) {
      history = [];
      return;
    }
    try {
      const raw = storage.getItem(historyKey);
      history = raw ? (JSON.parse(raw) as JsonConfigSnapshot<T>[]) : [];
    } catch {
      history = [];
    }
  };

  const readFromStorage = (): T => {
    const storage = getLocalStorage();
    if (!storage) {
      return clone(defaultValue);
    }

    try {
      const raw = storage.getItem(storageKey);
      if (!raw) {
        const fallback = clone(defaultValue);
        storage.setItem(storageKey, JSON.stringify(fallback));
        return fallback;
      }
      const parsed = JSON.parse(raw);
      const validated = schema.parse(parsed);
      return mergeWithDefaults ? mergeWithDefaults(validated) : validated;
    } catch (error) {
      console.warn(`Failed to load config for key ${storageKey}, using defaults:`, error);
      const fallback = clone(defaultValue);
      try {
        storage.setItem(storageKey, JSON.stringify(fallback));
      } catch {
        // Ignore write errors
      }
      return fallback;
    }
  };

  const writeToStorage = (config: T) => {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.setItem(storageKey, JSON.stringify(config));
  };

  const ensureLoaded = (): T => {
    if (!cachedConfig) {
      cachedConfig = readFromStorage();
      loadHistory();
    }
    return cachedConfig;
  };

  return {
    load(): T {
      return ensureLoaded();
    },
    save(config: T, description = 'Manual save'): void {
      const result = schema.safeParse(config);
      if (!result.success) {
        throw new Error(`Invalid config: ${result.error.message}`);
      }
      addToHistory(description);
      cachedConfig = mergeWithDefaults ? mergeWithDefaults(result.data) : result.data;
      writeToStorage(cachedConfig);
      dispatchUpdateEvent();
    },
    reset(description = 'Reset to defaults'): T {
      addToHistory(description);
      cachedConfig = clone(defaultValue);
      writeToStorage(cachedConfig);
      dispatchUpdateEvent();
      return cachedConfig;
    },
    getHistory(): JsonConfigSnapshot<T>[] {
      ensureLoaded();
      return [...history];
    },
    undo(): T | null {
      ensureLoaded();
      if (history.length === 0) return null;
      const previous = history.shift();
      if (!previous) return null;
      cachedConfig = clone(previous.config) as T;
      writeToStorage(cachedConfig);
      persistHistory();
      dispatchUpdateEvent();
      return cachedConfig;
    },
    export(): string {
      const config = ensureLoaded();
      return JSON.stringify(config, null, 2);
    },
    import(json: string, description = 'Imported configuration'): T {
      const parsed = JSON.parse(json);
      const validated = schema.parse(parsed);
      const merged = mergeWithDefaults ? mergeWithDefaults(validated) : validated;
      this.save(merged, description);
      return merged;
    },
  };
}
