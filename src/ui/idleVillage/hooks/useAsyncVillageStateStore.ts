/**
 * Async Village State Store Hook
 *
 * Async version of useVillageStateStore that uses the PersistenceService
 * for mobile-ready persistence with Tauri FS support and localStorage fallback.
 */

import { useCallback, useEffect, useState } from 'react';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import {
  saveVillageState,
  loadVillageState,
  clearVillageState,
  exportVillageState,
  importVillageState,
  resetVillageState,
  loadHistory,
  undoVillageState,
  type VillageStateSnapshot,
} from '../state/PersistenceService';

export interface UseVillageStateStoreReturn {
  state: VillageState;
  history: VillageStateSnapshot[];
  isLoading: boolean;
  error: string | null;
  saveState: (description?: string) => Promise<void>;
  updateState: (updater: (prev: VillageState) => VillageState, description?: string) => void;
  undo: () => Promise<VillageState | null>;
  canUndo: boolean;
  exportState: () => Promise<string>;
  importState: (json: string, description?: string) => Promise<void>;
  resetState: (initialFactory: () => VillageState, description?: string) => Promise<VillageState>;
  clearState: () => Promise<void>;
}

export function useAsyncVillageStateStore(initialFactory: () => VillageState): UseVillageStateStoreReturn {
  const [state, setState] = useState<VillageState | null>(null);
  const [history, setHistory] = useState<VillageStateSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state on mount
  useEffect(() => {
    const initializeState = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedState = await loadVillageState(initialFactory);
        const loadedHistory = await loadHistory();
        setState(loadedState);
        setHistory(loadedHistory);
      } catch (err) {
        console.error('[useAsyncVillageStateStore] Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to load state');
        // Fallback to initial state
        const fallback = initialFactory();
        setState(fallback);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeState();
  }, [initialFactory]);

  const refreshState = useCallback(async () => {
    if (!state) return;
    try {
      const loadedHistory = await loadHistory();
      setHistory(loadedHistory);
    } catch (err) {
      console.warn('[useAsyncVillageStateStore] Failed to refresh history:', err);
    }
  }, [state]);

  const saveState = useCallback(
    async (description = 'Manual save') => {
      if (!state) return;
      try {
        setError(null);
        await saveVillageState(state, description);
        await refreshState();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to save state';
        console.error('[useAsyncVillageStateStore] Save failed:', err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [state, refreshState],
  );

  const updateState = useCallback(
    (updater: (prev: VillageState) => VillageState, _description = 'State update') => {
      const currentState = state || initialFactory();
      const nextState = updater(currentState);
      setState(nextState);
      // persistToDiskIfNeeded(nextState, _description);
    },
    [state, initialFactory],
  );

  const undo = useCallback(async () => {
    try {
      setError(null);
      const undone = await undoVillageState();
      if (undone) {
        setState(undone);
        await refreshState();
      }
      return undone;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to undo';
      console.error('[useAsyncVillageStateStore] Undo failed:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [refreshState]);

  const exportState = useCallback(async () => {
    try {
      setError(null);
      return await exportVillageState();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export state';
      console.error('[useAsyncVillageStateStore] Export failed:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const importState = useCallback(
    async (json: string, description = 'Imported state') => {
      try {
        setError(null);
        await importVillageState(json, description);
        const loadedState = await loadVillageState(initialFactory);
        setState(loadedState);
        await refreshState();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to import state';
        console.error('[useAsyncVillageStateStore] Import failed:', err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [initialFactory, refreshState],
  );

  const resetState = useCallback(
    async (initialFactory: () => VillageState, description = 'Reset state') => {
      try {
        setError(null);
        const fresh = await resetVillageState(initialFactory, description);
        setState(fresh);
        await refreshState();
        return fresh;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to reset state';
        console.error('[useAsyncVillageStateStore] Reset failed:', err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [refreshState],
  );

  const clearState = useCallback(async () => {
    try {
      setError(null);
      await clearVillageState();
      setState(null);
      setHistory([]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear state';
      console.error('[useAsyncVillageStateStore] Clear failed:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const canUndo = history.length > 0;

  return {
    state: state || initialFactory(),
    history,
    isLoading,
    error,
    saveState,
    updateState,
    undo,
    canUndo,
    exportState,
    importState,
    resetState,
    clearState,
  };
}
