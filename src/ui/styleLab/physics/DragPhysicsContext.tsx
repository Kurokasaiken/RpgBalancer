/**
 * DragPhysicsContext.tsx
 *
 * Provider globale per il preset di fisica attivo.
 * Va messo una volta sola nell'app shell, al di sopra di DndContext.
 *
 * Utilizzo:
 *
 *   // App shell / settings
 *   <DragPhysicsProvider>
 *     <App />
 *   </DragPhysicsProvider>
 *
 *   // Qualsiasi componente
 *   const { config, presetKey, setPreset } = useDragPhysics();
 *
 *   // Settings UI
 *   const { setPreset } = useDragPhysics();
 *   <button onClick={() => setPreset('heavy')}>Pesante</button>
 */

'use client';

import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from 'react';

import {
  DRAG_PHYSICS_PRESETS,
  type DragPhysicsConfig,
  type DragPhysicsPresetKey,
} from './dragPhysicsPresets';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

// ─────────────────────────────────────────────────────────────
// PERSISTENCE KEY
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'wl_drag_physics_preset';

async function loadSavedPreset(): Promise<DragPhysicsPresetKey> {
  try {
    const saved = await loadData<DragPhysicsPresetKey>(STORAGE_KEY, 'default');
    if (saved && saved in DRAG_PHYSICS_PRESETS) {
      return saved;
    }
  } catch {
    // PersistenceService failed, use default
  }
  return 'default';
}

// ─────────────────────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────────────────────
interface DragPhysicsContextValue {
  /** Config del preset attivo — da passare a useDragPhysicsEngine */
  config: DragPhysicsConfig;
  /** Chiave del preset attivo */
  presetKey: DragPhysicsPresetKey;
  /** Cambia preset e lo persiste in localStorage */
  setPreset: (key: DragPhysicsPresetKey) => void;
  /** Tutte le chiavi disponibili */
  availablePresets: DragPhysicsPresetKey[];
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────
const DragPhysicsContext = createContext<DragPhysicsContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────
interface DragPhysicsProviderProps {
  children: React.ReactNode;
  /** Override del preset iniziale — utile per testing */
  initialPreset?: DragPhysicsPresetKey;
}

export function DragPhysicsProvider({
  children,
  _initialPreset, // Unused for now
}: DragPhysicsProviderProps) {
  const [presetKey, setPresetKey] = useState<DragPhysicsPresetKey>('default');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preset on mount
  useEffect(() => {
    let mounted = true;
    
    const loadPreset = async () => {
      try {
        const saved = await loadSavedPreset();
        if (mounted) {
          setPresetKey(saved);
        }
      } catch (error) {
        console.warn('[DragPhysicsProvider] Failed to load preset:', error);
        if (mounted) {
          setPresetKey('default');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreset();

    return () => {
      mounted = false;
    };
  }, []);

  const setPreset = useCallback(async (key: DragPhysicsPresetKey) => {
    setPresetKey(key);
    try {
      await saveData(STORAGE_KEY, key);
    } catch (error) {
      console.warn('[DragPhysicsProvider] Failed to save preset:', error);
      // Continue anyway - the state is updated
    }
  }, []);

  const value = useMemo<DragPhysicsContextValue>(
    () => ({
      config: DRAG_PHYSICS_PRESETS[presetKey],
      presetKey,
      setPreset,
      availablePresets: Object.keys(DRAG_PHYSICS_PRESETS) as DragPhysicsPresetKey[],
    }),
    [presetKey, setPreset],
  );

  if (isLoading) {
    return null; // Or a loading indicator if needed
  }

  return (
    <DragPhysicsContext.Provider value={value}>
      {children}
    </DragPhysicsContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// NOTE: Hook exports moved to useDragPhysicsHooks.ts for fast refresh compliance
// ─────────────────────────────────────────────────────────────

export { DragPhysicsContext };
