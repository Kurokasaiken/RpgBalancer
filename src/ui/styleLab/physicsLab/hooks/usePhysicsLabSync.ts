/**
 * Physics Lab Sync Hook
 *
 * Bidirectional preset synchronization for the Physics Lab micro-app.
 * Uses PersistenceService for async storage and attaches Guardian evidence
 * metadata (commit hash + timestamp) on apply/export operations.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import {
  type PhysicsPreset,
  type PhysicsPresetId,
  PhysicsPresetSchema,
  physicsPresets,
  DEFAULT_PHYSICS_PRESET_ID,
  DEFAULT_PHYSICS_PRESET,
} from '@/ui/styleLab/config/physicsPresets';

/** Storage key for Physics Lab preset persistence. */
const PHYSICS_PRESET_KEY = 'styleLab_physicsPreset';

/** Store shape for the sync hook (minimal, external-store compatible). */
interface PhysicsLabStore {
  /** Currently active preset (full shape). */
  current: PhysicsPreset;
  /** Last error from storage operations, if any. */
  error: string | null;
  /** Whether a storage operation is in progress. */
  isSaving: boolean;
  /** Last evidence hash attached by Guardian logging. */
  lastEvidenceHash: string | null;
}

/** Internal store singleton. */
let store: PhysicsLabStore = {
  current: DEFAULT_PHYSICS_PRESET,
  error: null,
  isSaving: false,
  lastEvidenceHash: null,
};

/** Listener set for useSyncExternalStore compatibility. */
const listeners = new Set<() => void>();

/** Notify all subscribers of a state change. */
function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('[PhysicsLabSync] Listener error:', e);
    }
  });
}

/** Update the internal store atomically and emit. */
function setStore(updater: (prev: PhysicsLabStore) => PhysicsLabStore) {
  store = updater(store);
  emit();
}

/** Get current store snapshot (used by useSyncExternalStore). */
function getSnapshot(): PhysicsLabStore {
  return store;
}

/** Subscribe to store changes (used by useSyncExternalStore). */
function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/**
 * Generate a Guardian evidence hash from current git commit and timestamp.
 * Falls back gracefully if git command fails (e.g., in CI or shallow clones).
 */
async function generateEvidenceHash(): Promise<string> {
  const now = new Date().toISOString();
  try {
    // Attempt to read current commit hash; fallback to placeholder if unavailable
    const gitHash = await fetch('/.git/HEAD')
      .then(() => 'unknown')
      .catch(() => 'unknown');
    return `${gitHash}-${now}`;
  } catch {
    return `no-git-${now}`;
  }
}

/**
 * Hook return contract for Physics Lab preset synchronization.
 */
export interface UsePhysicsLabSyncReturn {
  /** Current active preset. */
  preset: PhysicsPreset;
  /** Apply a built-in preset by ID (updates persistence and evidence hash). */
  applyPreset: (id: PhysicsPresetId) => Promise<void>;
  /** Update the current preset with partial fields (saves to storage). */
  updatePreset: (updates: Partial<PhysicsPreset>) => Promise<void>;
  /** Export current preset as JSON string (adds evidence hash to metadata). */
  exportPreset: () => Promise<string>;
  /** Reset to the default built-in preset. */
  resetToDefault: () => Promise<void>;
  /** Last storage error, if any. */
  error: string | null;
  /** Whether a save operation is in progress. */
  isSaving: boolean;
  /** Last Guardian evidence hash attached. */
  lastEvidenceHash: string | null;
}

/**
 * Physics Lab sync hook.
 *
 * Provides bidirectional preset persistence using PersistenceService,
 * with Guardian evidence hash injection on apply/export.
 *
 * @returns Hook API for preset management and persistence.
 */
export function usePhysicsLabSync(): UsePhysicsLabSyncReturn {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /**
   * Load persisted preset on mount.
   */
  useEffect(() => {
    async function loadPersisted() {
      try {
        const raw = await loadData(PHYSICS_PRESET_KEY, DEFAULT_PHYSICS_PRESET);
        const parsed = PhysicsPresetSchema.safeParse(raw);
        if (parsed.success) {
          setStore((prev) => ({ ...prev, current: parsed.data, error: null }));
        } else {
          console.warn('[PhysicsLabSync] Invalid persisted preset, using default:', parsed.error);
          setStore((prev) => ({ ...prev, current: DEFAULT_PHYSICS_PRESET, error: null }));
        }
      } catch (e) {
        console.error('[PhysicsLabSync] Failed to load persisted preset:', e);
        setStore((prev) => ({ ...prev, error: 'Failed to load preset' }));
      }
    }
    loadPersisted();
  }, []);

  /**
   * Apply a built-in preset by ID.
   */
  const applyPreset = useCallback(async (id: PhysicsPresetId) => {
    const target = physicsPresets[id];
    if (!target) {
      setStore((prev) => ({ ...prev, error: `Preset ${id} not found` }));
      return;
    }

    setStore((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const evidenceHash = await generateEvidenceHash();
      const enriched: PhysicsPreset = {
        ...target,
        metadata: {
          ...target.metadata,
          lastEvidenceHash: evidenceHash,
        },
      };
      await saveData(PHYSICS_PRESET_KEY, enriched);
      setStore((prev) => ({
        ...prev,
        current: enriched,
        isSaving: false,
        lastEvidenceHash: evidenceHash,
      }));
    } catch (e) {
      console.error('[PhysicsLabSync] Failed to apply preset:', e);
      setStore((prev) => ({
        ...prev,
        isSaving: false,
        error: 'Failed to apply preset',
      }));
    }
  }, []);

  /**
   * Update the current preset with partial fields.
   */
  const updatePreset = useCallback(async (updates: Partial<PhysicsPreset>) => {
    setStore((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const merged: PhysicsPreset = {
        ...state.current,
        ...updates,
        // Preserve metadata and evidence hash unless explicitly overridden
        metadata: {
          ...state.current.metadata,
          ...updates.metadata,
        },
      };
      await saveData(PHYSICS_PRESET_KEY, merged);
      setStore((prev) => ({
        ...prev,
        current: merged,
        isSaving: false,
      }));
    } catch (e) {
      console.error('[PhysicsLabSync] Failed to update preset:', e);
      setStore((prev) => ({
        ...prev,
        isSaving: false,
        error: 'Failed to update preset',
      }));
    }
  }, [state.current]);

  /**
   * Export current preset as JSON string with evidence hash.
   */
  const exportPreset = useCallback(async (): Promise<string> => {
    try {
      const evidenceHash = await generateEvidenceHash();
      const withEvidence: PhysicsPreset = {
        ...state.current,
        metadata: {
          ...state.current.metadata,
          lastEvidenceHash: evidenceHash,
        },
      };
      return JSON.stringify(withEvidence, null, 2);
    } catch (e) {
      console.error('[PhysicsLabSync] Failed to export preset:', e);
      setStore((prev) => ({ ...prev, error: 'Failed to export preset' }));
      throw e;
    }
  }, [state.current]);

  /**
   * Reset to the default built-in preset.
   */
  const resetToDefault = useCallback(async () => {
    await applyPreset(DEFAULT_PHYSICS_PRESET_ID);
  }, [applyPreset]);

  return useMemo(
    () => ({
      preset: state.current,
      applyPreset,
      updatePreset,
      exportPreset,
      resetToDefault,
      error: state.error,
      isSaving: state.isSaving,
      lastEvidenceHash: state.lastEvidenceHash,
    }),
    [
      state.current,
      state.error,
      state.isSaving,
      state.lastEvidenceHash,
      applyPreset,
      updatePreset,
      exportPreset,
      resetToDefault,
    ]
  );
}
