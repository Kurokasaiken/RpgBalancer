/**
 * HUD State Persistence Helpers
 *
 * Provides offline sync and persistence for HUD state using PersistenceService.
 * Handles rehydration of HUD preferences and display state.
 */

import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import type { ActiveHUDState } from '../useActiveHUDState';

/**
 * Persisted HUD preferences and display state
 */
export interface HUDPersistenceState {
  /** User display preferences */
  preferences: {
    /** Whether HUD is collapsed */
    collapsed: boolean;
    /** Maximum number of activities to display */
    maxVisible: number;
    /** Sort order preference */
    sortBy: 'remaining-time' | 'activity-type' | 'progress';
    /** Show activity type badges */
    showTypeBadges: boolean;
    /** Compact mode for smaller screens */
    compactMode: boolean;
  };
  /** UI state that should persist across sessions */
  uiState: {
    /** Last selected activity type filter */
    selectedTypeFilter: 'all' | 'job' | 'quest' | 'maintenance';
    /** Whether telemetry panel was open */
    telemetryPanelOpen: boolean;
    /** HUD position preferences */
    position: 'top' | 'bottom' | 'floating';
  };
  /** Metadata for persistence management */
  metadata: {
    /** Last save timestamp */
    lastSaved: number;
    /** Version for migration handling */
    version: string;
  };
}

/**
 * Default HUD persistence state
 */
export const DEFAULT_HUD_PERSISTENCE_STATE: HUDPersistenceState = {
  preferences: {
    collapsed: false,
    maxVisible: 10,
    sortBy: 'remaining-time',
    showTypeBadges: true,
    compactMode: false,
  },
  uiState: {
    selectedTypeFilter: 'all',
    telemetryPanelOpen: false,
    position: 'top',
  },
  metadata: {
    lastSaved: Date.now(),
    version: '1.0.0',
  },
};

/**
 * Storage key for HUD persistence
 */
export const HUD_PERSISTENCE_KEY = 'idle-village-hud-state';

/**
 * Load HUD persistence state from storage
 */
export async function loadHUDState(): Promise<HUDPersistenceState> {
  try {
    const saved = await loadData<HUDPersistenceState>(HUD_PERSISTENCE_KEY, DEFAULT_HUD_PERSISTENCE_STATE);

    // Migrate old versions if needed
    if (!saved.metadata || !saved.metadata.version) {
      return {
        ...DEFAULT_HUD_PERSISTENCE_STATE,
        ...saved,
        metadata: {
          ...DEFAULT_HUD_PERSISTENCE_STATE.metadata,
          ...saved.metadata,
        },
      };
    }

    return saved;
  } catch (error) {
    console.warn('Failed to load HUD state, using defaults:', error);
    return DEFAULT_HUD_PERSISTENCE_STATE;
  }
}

/**
 * Save HUD persistence state to storage
 */
export async function saveHUDState(state: HUDPersistenceState): Promise<void> {
  try {
    const stateToSave = {
      ...state,
      metadata: {
        ...state.metadata,
        lastSaved: Date.now(),
      },
    };

    await saveData(HUD_PERSISTENCE_KEY, stateToSave);
  } catch (error) {
    console.error('Failed to save HUD state:', error);
    // Don't throw - persistence failures shouldn't break the UI
  }
}

/**
 * Reset HUD state to defaults
 */
export async function resetHUDState(): Promise<void> {
  try {
    await saveData(HUD_PERSISTENCE_KEY, DEFAULT_HUD_PERSISTENCE_STATE);
  } catch (error) {
    console.error('Failed to reset HUD state:', error);
  }
}

/**
 * Check if HUD state needs migration
 */
export function needsMigration(state: HUDPersistenceState): boolean {
  const currentVersion = DEFAULT_HUD_PERSISTENCE_STATE.metadata.version;
  return state.metadata.version !== currentVersion;
}

/**
 * Migrate HUD state to current version
 */
export function migrateHUDState(state: HUDPersistenceState): HUDPersistenceState {
  const currentVersion = DEFAULT_HUD_PERSISTENCE_STATE.metadata.version;

  if (state.metadata.version === currentVersion) {
    return state;
  }

  // Future migration logic can be added here
  // For now, just update version and merge with defaults
  return {
    ...DEFAULT_HUD_PERSISTENCE_STATE,
    ...state,
    metadata: {
      ...state.metadata,
      version: currentVersion,
    },
  };
}

/**
 * Create a debounced save function for HUD state
 */
export function createDebouncedHUDSave(delayMs: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (state: HUDPersistenceState) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      saveHUDState(state);
    }, delayMs);
  };
}

/**
 * Serialize HUD state for export/debugging
 */
export function serializeHUDState(state: HUDPersistenceState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Deserialize HUD state from string
 */
export function deserializeHUDState(data: string): HUDPersistenceState {
  try {
    const parsed = JSON.parse(data);
    return migrateHUDState(parsed);
  } catch (error) {
    console.error('Failed to deserialize HUD state:', error);
    return DEFAULT_HUD_PERSISTENCE_STATE;
  }
}
