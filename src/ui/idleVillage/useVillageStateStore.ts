import { useCallback, useEffect, useState } from 'react';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import { VillageStateStore, type VillageStateSnapshot } from '@/engine/game/idleVillage/VillageStateStore';

export interface UseVillageStateStoreReturn {
  state: VillageState;
  history: VillageStateSnapshot[];
  saveState: (description?: string) => void;
  updateState: (updater: (prev: VillageState) => VillageState, description?: string) => void;
  undo: () => VillageState | null;
  canUndo: boolean;
  exportState: () => string;
  importState: (json: string, description?: string) => void;
  resetState: (initialFactory: () => VillageState, description?: string) => VillageState;
}

export function useVillageStateStore(initialFactory: () => VillageState): UseVillageStateStoreReturn {
  const [state, setState] = useState<VillageState>(() =>
    VillageStateStore.load(initialFactory),
  );

  const [history, setHistory] = useState<VillageStateSnapshot[]>(() =>
    VillageStateStore.getHistory(),
  );

  const refreshState = useCallback(() => {
    setState(VillageStateStore.load(initialFactory));
    setHistory(VillageStateStore.getHistory());
  }, [initialFactory]);

  // Sync across tabs / imports
  useEffect(() => {
    const handleStorageChange = () => {
      refreshState();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener(VillageStateStore.getUpdateEventName(), handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener(VillageStateStore.getUpdateEventName(), handleStorageChange);
      };
    }
  }, [refreshState]);

  const saveState = useCallback(
    (description = 'Manual save') => {
      VillageStateStore.save(state, description);
      refreshState();
    },
    [state, refreshState],
  );

  const updateState = useCallback(
    (updater: (prev: VillageState) => VillageState, description = 'State update') => {
      const nextState = updater(state);
      VillageStateStore.save(nextState, description);
      refreshState();
    },
    [state, refreshState],
  );

  const undo = useCallback(() => {
    const undone = VillageStateStore.undo();
    if (undone) {
      refreshState();
    }
    return undone;
  }, [refreshState]);

  const canUndo = history.length > 0;

  const exportState = useCallback(() => VillageStateStore.export(), []);

  const importState = useCallback(
    (json: string, description = 'Imported state') => {
      VillageStateStore.import(json, description);
      refreshState();
    },
    [refreshState],
  );

  const resetState = useCallback(
    (initialFactory: () => VillageState, description = 'Reset state') => {
      const fresh = VillageStateStore.reset(initialFactory, description);
      refreshState();
      return fresh;
    },
    [refreshState],
  );

  return {
    state,
    history,
    saveState,
    updateState,
    undo,
    canUndo,
    exportState,
    importState,
    resetState,
  };
}
