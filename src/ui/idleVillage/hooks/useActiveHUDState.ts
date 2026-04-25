import { useMemo, useState, useEffect, useCallback } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ScheduledActivityState } from './useActivityScheduler';
import { ActiveHUDSelectors, ActiveHUDTelemetry } from './useActiveHUDStateSync';
import {
  loadHUDState,
  saveHUDState,
  type HUDPersistenceState,
  DEFAULT_HUD_PERSISTENCE_STATE,
  createDebouncedHUDSave,
} from '../utils/hudPersistence';

/**
 * Performance profiling helper
 */
const startProfiling = (id: string) => {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
    window.performance.mark(`${id}-start`);
  }
};

const endProfiling = (id: string) => {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark && window.performance.measure) {
    window.performance.mark(`${id}-end`);
    window.performance.measure(id, `${id}-start`, `${id}-end`);
  }
};

/**
 * View model for a single activity displayed in the Active HUD.
 * Config-first: all data derived from config and scheduler state.
 */
export interface ActiveHUDActivityViewModel {
  /** Unique identifier for React key */
  key: string;
  /** Activity type tag (job, quest, maintenance) */
  activityType: 'job' | 'quest' | 'maintenance';
  /** Display label from config */
  label: string;
  /** Icon from config */
  icon: string;
  /** Assigned resident ID */
  residentId: string;
  /** Resident display name */
  residentName: string;
  /** Progress fraction [0-1] */
  progress: number;
  /** Remaining time in seconds */
  remainingSeconds: number;
  /** Activity status */
  status: ScheduledActivityState['status'];
  /** Visual variant for styling */
  visualVariant: 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';
  /** Scheduled activity ID for telemetry */
  scheduledId: string;
  /** Activity definition ID */
  activityId: string;
}

/**
 * Aggregated state for the Active HUD component.
 */
export interface ActiveHUDState {
  /** All active activities (jobs, quests, maintenance) */
  activities: ActiveHUDActivityViewModel[];
  /** Count by type for summary */
  counts: {
    jobs: number;
    quests: number;
    maintenance: number;
    total: number;
  };
  /** Whether any activities are running */
  hasActiveActivities: boolean;
  /** Persisted HUD preferences and UI state */
  persistence: HUDPersistenceState;
}

/**
 * Return type for useActiveHUDState hook
 */
export interface UseActiveHUDStateReturn extends ActiveHUDState {
  /** Update HUD preferences */
  updatePreferences: (preferences: Partial<HUDPersistenceState['preferences']>) => void;
  /** Update UI state */
  updateUIState: (uiState: Partial<HUDPersistenceState['uiState']>) => void;
  /** Reset to default preferences */
  resetPreferences: () => void;
  /** Force save current state */
  saveState: () => Promise<void>;
}

/**
 * Props for useActiveHUDState hook.
 */
export interface UseActiveHUDStateProps {
  /** Idle Village configuration (config-first source) */
  config: IdleVillageConfig;
  /** Current village state from scheduler */
  villageState: VillageState;
  /** Seconds per time unit from config */
  secondsPerTimeUnit: number;
  /** Current global time */
  currentTime: number;
  /** Function to get activity state from scheduler */
  getActivityState: (slotId: string, residentId: string) => ScheduledActivityState | null;
}


/**
 * Config-first hook that aggregates all active activities (jobs, quests, maintenance)
 * for display in the Active HUD Phase 12.
 *
 * Includes offline persistence for HUD preferences and UI state.
 *
 * @param props - Configuration and state dependencies
 * @returns Aggregated HUD state with persistence controls
 */
export function useActiveHUDState(props: UseActiveHUDStateProps): UseActiveHUDStateReturn {
  const { config, villageState, secondsPerTimeUnit, currentTime, getActivityState } = props;
  const profilingId = 'useActiveHUDState';
  startProfiling(profilingId);

  // Load persisted HUD state
  const [persistenceState, setPersistenceState] = useState<HUDPersistenceState>(DEFAULT_HUD_PERSISTENCE_STATE);

  // Create debounced save function
  const debouncedSave = useMemo(() => createDebouncedHUDSave(1000), []);

  // Load persistence state on mount
  useEffect(() => {
    let mounted = true;

    loadHUDState().then((loadedState) => {
      if (mounted) {
        setPersistenceState(loadedState);
      }
    }).catch((error) => {
      console.warn('Failed to load HUD persistence state:', error);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Save state when it changes
  useEffect(() => {
    debouncedSave(persistenceState);
  }, [persistenceState, debouncedSave]);

  // Update preferences
  const updatePreferences = useCallback((preferences: Partial<HUDPersistenceState['preferences']>) => {
    setPersistenceState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...preferences,
      },
    }));
  }, []);

  // Update UI state
  const updateUIState = useCallback((uiState: Partial<HUDPersistenceState['uiState']>) => {
    setPersistenceState(prev => ({
      ...prev,
      uiState: {
        ...prev.uiState,
        ...uiState,
      },
    }));
  }, []);

  // Reset preferences
  const resetPreferences = useCallback(() => {
    setPersistenceState(DEFAULT_HUD_PERSISTENCE_STATE);
  }, []);

  // Force immediate save
  const saveState = useCallback(async () => {
    await saveHUDState(persistenceState);
  }, [persistenceState]);

  const activities = useMemo<ActiveHUDActivityViewModel[]>(() => {
    const activitiesProfilingId = 'activities-computation';
    startProfiling(activitiesProfilingId);
    
    // Use shared selector for consistent data across HUD, Map, and Theater
    const rawActivities = ActiveHUDSelectors.getActiveActivities(
      villageState,
      config,
      currentTime,
      secondsPerTimeUnit,
      getActivityState
    );

    // Apply user preference sorting
    const sortBy = persistenceState.preferences.sortBy;
    let sortedViewModels;
    switch (sortBy) {
      case 'activity-type':
        sortedViewModels = rawActivities.sort((a, b) => {
          const typeOrder = { quest: 0, maintenance: 1, job: 2 };
          return typeOrder[a.activityType] - typeOrder[b.activityType];
        });
        break;
      case 'progress':
        sortedViewModels = rawActivities.sort((a, b) => b.progress - a.progress);
        break;
      case 'remaining-time':
      default:
        sortedViewModels = rawActivities.sort((a, b) => a.remainingSeconds - b.remainingSeconds);
        break;
    }
    
    endProfiling(activitiesProfilingId);
    return sortedViewModels;
  }, [config, villageState, secondsPerTimeUnit, currentTime, getActivityState, persistenceState.preferences.sortBy]);

  // Calculate counts using shared selector
  const counts = useMemo(() => {
    return ActiveHUDSelectors.getActivityCounts(activities);
  }, [activities]);

  // Apply max visible limit from preferences
  const visibleActivities = useMemo(() => {
    const maxVisible = persistenceState.preferences.maxVisible;
    return activities.slice(0, maxVisible);
  }, [activities, persistenceState.preferences.maxVisible]);

  // Emit telemetry for state sync
  useEffect(() => {
    ActiveHUDTelemetry.emitStateSync('hud', activities.length);
  }, [activities.length]);

  const result = {
    activities: visibleActivities,
    counts,
    hasActiveActivities: activities.length > 0,
    persistence: persistenceState,
    updatePreferences,
    updateUIState,
    resetPreferences,
    saveState,
  };
  
  endProfiling(profilingId);
  return result;
}
