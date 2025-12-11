// src/balancing/hooks/useIdleVillageConfig.ts
// React hook to read/write IdleVillageConfig via IdleVillageConfigStore.
// Starts minimal (generic save/import/undo API) and can be extended with
// higher-level CRUD helpers as the Idle Village UI evolves.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IdleVillageConfig, IdleVillageConfigSnapshot } from '../config/idleVillage/types';
import { IdleVillageConfigStore } from '../config/idleVillage/IdleVillageConfigStore';

export interface IdleVillageValidationResult {
  success: boolean;
  error?: string;
}

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export interface UseIdleVillageConfigReturn {
  config: IdleVillageConfig;
  history: IdleVillageConfigSnapshot[];

  /** Low-level save helper – higher-level helpers can build on top of this. */
  saveConfig: (next: IdleVillageConfig, description: string) => IdleVillageValidationResult;

  // History
  undo: () => void;
  canUndo: boolean;

  // Export / Import / Reset
  exportConfig: () => string;
  importConfig: (json: string) => IdleVillageValidationResult;
  resetConfig: () => void;
  resetToInitialConfig: () => void;

  // Convenience wrapper for shallow partial updates (UI-friendly)
  updateConfig: (updates: Partial<IdleVillageConfig>) => IdleVillageValidationResult;
}

export function useIdleVillageConfig(): UseIdleVillageConfigReturn {
  const initialConfigRef = useRef<IdleVillageConfig | null>(null);

  const [config, setConfig] = useState<IdleVillageConfig>(() =>
    IdleVillageConfigStore.load(),
  );

  const [history, setHistory] = useState<IdleVillageConfigSnapshot[]>(() =>
    IdleVillageConfigStore.getHistory(),
  );

  const refreshState = useCallback(() => {
    setConfig(IdleVillageConfigStore.load());
    setHistory(IdleVillageConfigStore.getHistory());
  }, []);

  // Capture the first loaded config as "initial" snapshot after mount.
  useEffect(() => {
    if (!initialConfigRef.current) {
      initialConfigRef.current = deepClone(IdleVillageConfigStore.load());
    }
  }, []);

  // Sync across tabs / imports similar to useBalancerConfig
  useEffect(() => {
    const handleStorageChange = () => {
      refreshState();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('idleVillageConfigUpdated', handleStorageChange as EventListener);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('idleVillageConfigUpdated', handleStorageChange as EventListener);
      };
    }
  }, [refreshState]);

  const saveConfig = useCallback(
    (next: IdleVillageConfig, description: string): IdleVillageValidationResult => {
      try {
        IdleVillageConfigStore.save(next, description);
        refreshState();
        return { success: true };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [refreshState],
  );

  const undo = useCallback(() => {
    IdleVillageConfigStore.undo();
    refreshState();
  }, [refreshState]);

  const canUndo = history.length > 0;

  const exportConfig = useCallback(() => IdleVillageConfigStore.export(), []);

  const importConfig = useCallback(
    (json: string): IdleVillageValidationResult => {
      try {
        IdleVillageConfigStore.import(json);
        refreshState();
        return { success: true };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [refreshState],
  );

  const resetConfig = useCallback(() => {
    IdleVillageConfigStore.reset();
    refreshState();
  }, [refreshState]);

  const resetToInitialConfig = useCallback(() => {
    if (!initialConfigRef.current) return;
    IdleVillageConfigStore.save(
      deepClone(initialConfigRef.current),
      'Reset IdleVillageConfig to initial snapshot',
    );
    refreshState();
  }, [refreshState]);

  // Convenience wrapper for shallow partial updates (UI-friendly)
  const updateConfig = useCallback(
    (updates: Partial<IdleVillageConfig>) => {
      const next = { ...config, ...updates };
      return saveConfig(next, 'UI update');
    },
    [config, saveConfig],
  );

  return {
    config,
    history,
    saveConfig,
    undo,
    canUndo,
    exportConfig,
    importConfig,
    resetConfig,
    resetToInitialConfig,
    updateConfig,
  };
}
