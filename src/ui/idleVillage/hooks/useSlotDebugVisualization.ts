import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import {
  SLOT_DEBUG_VISUALIZATION_CONFIG,
  type SlotDebugVisualizationSettings,
} from '@/balancing/config/idleVillage/slotDebugVisualizationConfig';

interface PersistedSlotDebugState {
  enabled: boolean;
}

const DEFAULT_STATE: PersistedSlotDebugState = {
  enabled: SLOT_DEBUG_VISUALIZATION_CONFIG.enabledByDefault,
};

export interface UseSlotDebugVisualizationResult {
  /** Flag pronto all'uso dopo l'hydration da storage */
  isHydrated: boolean;
  /** Stato attuale della modalità di debug */
  settings: SlotDebugVisualizationSettings;
  /** Abilita la modalità senza passare per toggle */
  setEnabled: (value: boolean) => Promise<void>;
  /** Comodo shortcut per invertire lo stato */
  toggleEnabled: () => Promise<void>;
}

/**
 * Gestisce la persistenza della modalità di debug degli slot residenti
 * sfruttando il PersistenceService e i valori configurati lato balancing.
 */
export const useSlotDebugVisualization = (): UseSlotDebugVisualizationResult => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isEnabled, setIsEnabled] = useState(SLOT_DEBUG_VISUALIZATION_CONFIG.enabledByDefault);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await loadData<PersistedSlotDebugState>(
          SLOT_DEBUG_VISUALIZATION_CONFIG.persistenceKey,
          DEFAULT_STATE,
        );
        if (!isMounted) return;
        setIsEnabled(Boolean(stored?.enabled));
      } catch (error) {
        console.warn('[useSlotDebugVisualization] Failed to load stored settings', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const persist = useCallback(async (next: boolean) => {
    setIsEnabled(next);
    try {
      await saveData<PersistedSlotDebugState>(SLOT_DEBUG_VISUALIZATION_CONFIG.persistenceKey, {
        enabled: next,
      });
    } catch (error) {
      console.warn('[useSlotDebugVisualization] Failed to persist settings', error);
    }
  }, []);

  const setEnabled = useCallback(async (value: boolean) => {
    await persist(value);
  }, [persist]);

  const toggleEnabled = useCallback(async () => {
    await persist(!isEnabled);
  }, [isEnabled, persist]);

  const settings = useMemo<SlotDebugVisualizationSettings>(() => ({
    enabled: isEnabled,
    showLabels: SLOT_DEBUG_VISUALIZATION_CONFIG.showLabels,
    colors: SLOT_DEBUG_VISUALIZATION_CONFIG.colors,
  }), [isEnabled]);

  return {
    isHydrated,
    settings,
    setEnabled,
    toggleEnabled,
  };
};
