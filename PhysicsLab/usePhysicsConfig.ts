/**
 * usePhysicsConfig.ts
 * Stato centralizzato della fisica + persistenza via PersistenceService.
 * Debounce 500ms per non saturare il localStorage ad ogni frame slider.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { PHYSICS_DEFAULTS, type PhysicsConfig } from '../config/physicsDefaults';
import { saveData, loadData } from '../../../shared/persistence/PersistenceService';

const STORAGE_KEY = 'wl_physics_config';

export interface UsePhysicsConfigReturn {
  cfg: PhysicsConfig;
  setCfg: (patch: Partial<PhysicsConfig>) => void;
  reset: () => void;
  exportJson: () => string;
}

export function usePhysicsConfig(): UsePhysicsConfigReturn {
  const [cfg, setCfgState] = useState<PhysicsConfig>(PHYSICS_DEFAULTS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from persistence on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadData<PhysicsConfig>(STORAGE_KEY, PHYSICS_DEFAULTS);
        if (saved) setCfgState(saved);
      } catch {
        // silently fallback to defaults
      }
    })();
  }, []);

  const setCfg = useCallback((patch: Partial<PhysicsConfig>) => {
    setCfgState(prev => {
      const next = { ...prev, ...patch };
      // Debounced persist
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveData(STORAGE_KEY, next).catch(() => {});
      }, 500);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setCfgState(PHYSICS_DEFAULTS);
    saveData(STORAGE_KEY, PHYSICS_DEFAULTS).catch(() => {});
  }, []);

  const exportJson = useCallback(() => {
    return JSON.stringify(
      {
        _comment: 'Wanderlust PhysicsConfig — incolla in designSystem.ts',
        ...cfg,
      },
      null,
      2,
    );
  }, [cfg]);

  return { cfg, setCfg, reset, exportJson };
}
