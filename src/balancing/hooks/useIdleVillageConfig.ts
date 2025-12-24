// src/balancing/hooks/useIdleVillageConfig.ts
// React hook to read/write IdleVillageConfig via the centralized Zustand store.
// Exposes history, undo, import/export and initialization state for UI consumers.

import { useCallback, useMemo } from 'react';
import type { IdleVillageConfig, IdleVillageConfigSnapshot } from '../config/idleVillage/types';
import { useIdleVillageConfigStore, type IdleVillageValidationResult } from '../config/idleVillage/IdleVillageConfigStore';

export interface UseIdleVillageConfigReturn {
  config: IdleVillageConfig;
  history: IdleVillageConfigSnapshot[];
  initialized: boolean;
  isInitializing: boolean;
  error?: string;
  initializeConfig: () => Promise<void>;

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
  const {
    config,
    history,
    initialized,
    isInitializing,
    error,
    initializeConfig,
    saveConfig: saveConfigImpl,
    updateConfig: updateConfigImpl,
    undo,
    exportConfig,
    importConfig,
    resetConfig: resetConfigImpl,
    resetToInitialConfig: resetToInitialConfigImpl,
  } = useIdleVillageConfigStore((state) => ({
    config: state.config,
    history: state.history,
    initialized: state.initialized,
    isInitializing: state.isInitializing,
    error: state.error,
    initializeConfig: state.initializeConfig,
    saveConfig: state.saveConfig,
    updateConfig: state.updateConfig,
    undo: state.undo,
    exportConfig: state.exportConfig,
    importConfig: state.importConfig,
    resetConfig: state.resetConfig,
    resetToInitialConfig: state.resetToInitialConfig,
  }));

  const canUndo = history.length > 0;

  const saveConfig = useCallback(
    (next: IdleVillageConfig, description: string) => saveConfigImpl(next, description),
    [saveConfigImpl],
  );

  const importConfigSafe = useCallback(
    (json: string) => importConfig(json),
    [importConfig],
  );

  const resetConfig = useCallback(() => {
    const result = resetConfigImpl();
    if (!result.success) {
      console.warn('[useIdleVillageConfig] resetConfig failed:', result.error);
    }
  }, [resetConfigImpl]);

  const resetToInitialConfig = useCallback(() => {
    const result = resetToInitialConfigImpl();
    if (!result.success) {
      console.warn('[useIdleVillageConfig] resetToInitialConfig failed:', result.error);
    }
  }, [resetToInitialConfigImpl]);

  const updateConfig = useCallback(
    (updates: Partial<IdleVillageConfig>) => updateConfigImpl(updates),
    [updateConfigImpl],
  );

  const value = useMemo<UseIdleVillageConfigReturn>(
    () => ({
      config,
      history,
      initialized,
      isInitializing,
      error,
      initializeConfig,
      saveConfig,
      undo,
      canUndo,
      exportConfig,
      importConfig: importConfigSafe,
      resetConfig,
      resetToInitialConfig,
      updateConfig,
    }),
    [
      config,
      history,
      initialized,
      isInitializing,
      error,
      initializeConfig,
      saveConfig,
      undo,
      canUndo,
      exportConfig,
      importConfigSafe,
      resetConfig,
      resetToInitialConfig,
      updateConfig,
    ],
  );

  return value;
}
