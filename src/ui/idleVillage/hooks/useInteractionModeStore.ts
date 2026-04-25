/**
 * Idle Village Interaction Mode Store
 * 
 * Zustand store for managing interaction mode preferences and persistence.
 * Provides centralized state management for desktop/mobile interaction modes
 * with PersistenceService integration for data persistence.
 * 
 * @since NP-062 – Idle Village Interaction Mode Picker
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { InteractionMode } from './useSandboxInteractionMode';

/**
 * Interaction mode preference interface
 */
export interface InteractionModePreference {
  /** User's preferred interaction mode */
  preferredMode: InteractionMode;
  /** Whether to auto-detect mode based on device */
  autoDetect: boolean;
  /** Last updated timestamp */
  lastUpdated: number;
  /** Session statistics */
  sessionStats: {
    /** Total sessions */
    totalSessions: number;
    /** Desktop sessions */
    desktopSessions: number;
    /** Mobile sessions */
    mobileSessions: number;
    /** Average session duration (seconds) */
    averageSessionDuration: number;
  };
  /** UI preferences */
  uiPreferences: {
    /** Show mode switcher in UI */
    showModeSwitcher: boolean;
    /** Enable haptic feedback on mobile */
    enableHapticFeedback: boolean;
    /** Animation speed multiplier */
    animationSpeedMultiplier: number;
    /** Touch target size multiplier */
    touchTargetSizeMultiplier: number;
  };
}

/**
 * Zod schema for InteractionModePreference
 */
const InteractionModePreferenceSchema = z.object({
  preferredMode: z.enum(['desktop', 'mobile']),
  autoDetect: z.boolean(),
  lastUpdated: z.number(),
  sessionStats: z.object({
    totalSessions: z.number().min(0),
    desktopSessions: z.number().min(0),
    mobileSessions: z.number().min(0),
    averageSessionDuration: z.number().min(0),
  }),
  uiPreferences: z.object({
    showModeSwitcher: z.boolean(),
    enableHapticFeedback: z.boolean(),
    animationSpeedMultiplier: z.number().min(0.1).max(3.0),
    touchTargetSizeMultiplier: z.number().min(0.8).max(2.0),
  }),
});

/**
 * Default interaction mode preference
 */
const DEFAULT_PREFERENCE: InteractionModePreference = {
  preferredMode: 'desktop',
  autoDetect: true,
  lastUpdated: Date.now(),
  sessionStats: {
    totalSessions: 0,
    desktopSessions: 0,
    mobileSessions: 0,
    averageSessionDuration: 0,
  },
  uiPreferences: {
    showModeSwitcher: true,
    enableHapticFeedback: true,
    animationSpeedMultiplier: 1.0,
    touchTargetSizeMultiplier: 1.0,
  },
};

/**
 * Persistence storage key for interaction mode preferences
 */
const PERSISTENCE_KEY = 'idleVillage_interactionModePreferences';

/**
 * Custom storage adapter for Zustand using PersistenceService
 */
const zustandStorage = {
  getItem: async (_name: string): Promise<string | null> => {
    try {
      const data = await loadData(PERSISTENCE_KEY, null);
      return data ? JSON.stringify(data) : null;
    } catch (error) {
      console.warn('Failed to load interaction mode preferences:', error);
      return null;
    }
  },
  setItem: async (_name: string, value: string): Promise<void> => {
    try {
      const data = JSON.parse(value);
      await saveData(PERSISTENCE_KEY, data);
    } catch (error) {
      console.warn('Failed to save interaction mode preferences:', error);
    }
  },
  removeItem: async (_name: string): Promise<void> => {
    try {
      await clearData(PERSISTENCE_KEY);
    } catch (error) {
      console.warn('Failed to remove interaction mode preferences:', error);
    }
  },
};

/**
 * Interaction mode store interface
 */
export interface InteractionModeStore {
  /** Current preference state */
  preference: InteractionModePreference;
  /** Actions */
  setPreferredMode: (mode: InteractionMode) => void;
  setAutoDetect: (autoDetect: boolean) => void;
  updateSessionStats: (mode: InteractionMode, sessionDuration: number) => void;
  updateUIPreferences: (preferences: Partial<InteractionModePreference['uiPreferences']>) => void;
  resetPreferences: () => void;
  /** Selectors */
  getCurrentMode: (autoDetectedMode?: InteractionMode) => InteractionMode;
  getEffectiveMode: (autoDetectedMode?: InteractionMode) => InteractionMode;
  isMobilePreferred: () => boolean;
  getSessionStats: () => InteractionModePreference['sessionStats'];
  /** Validation */
  validatePreference: (preference: unknown) => preference is InteractionModePreference;
}

/**
 * Zustand store for interaction mode preferences
 */
export const useInteractionModeStore = create<InteractionModeStore>()(
  persist(
    (set, get) => ({
      preference: DEFAULT_PREFERENCE,

      /**
       * Set the preferred interaction mode
       */
      setPreferredMode: (mode: InteractionMode) => {
        set((state) => ({
          preference: {
            ...state.preference,
            preferredMode: mode,
            lastUpdated: Date.now(),
          },
        }));
      },

      /**
       * Set auto-detection preference
       */
      setAutoDetect: (autoDetect: boolean) => {
        set((state) => ({
          preference: {
            ...state.preference,
            autoDetect,
            lastUpdated: Date.now(),
          },
        }));
      },

      /**
       * Update session statistics
       */
      updateSessionStats: (mode: InteractionMode, sessionDuration: number) => {
        set((state) => {
          const stats = state.preference.sessionStats;
          const newTotalSessions = stats.totalSessions + 1;
          const newDesktopSessions = stats.desktopSessions + (mode === 'desktop' ? 1 : 0);
          const newMobileSessions = stats.mobileSessions + (mode === 'mobile' ? 1 : 0);
          
          // Calculate new average session duration
          const totalDuration = stats.averageSessionDuration * stats.totalSessions + sessionDuration;
          const newAverageDuration = totalDuration / newTotalSessions;

          return {
            preference: {
              ...state.preference,
              sessionStats: {
                totalSessions: newTotalSessions,
                desktopSessions: newDesktopSessions,
                mobileSessions: newMobileSessions,
                averageSessionDuration: newAverageDuration,
              },
              lastUpdated: Date.now(),
            },
          };
        });
      },

      /**
       * Update UI preferences
       */
      updateUIPreferences: (preferences: Partial<InteractionModePreference['uiPreferences']>) => {
        set((state) => ({
          preference: {
            ...state.preference,
            uiPreferences: {
              ...state.preference.uiPreferences,
              ...preferences,
            },
            lastUpdated: Date.now(),
          },
        }));
      },

      /**
       * Reset preferences to defaults
       */
      resetPreferences: () => {
        set({
          preference: DEFAULT_PREFERENCE,
        });
      },

      /**
       * Get current mode based on preferences
       */
      getCurrentMode: (autoDetectedMode?: InteractionMode): InteractionMode => {
        const { preference } = get();
        
        if (preference.autoDetect && autoDetectedMode) {
          return autoDetectedMode;
        }
        
        return preference.preferredMode;
      },

      /**
       * Get effective mode (considers auto-detection and preferences)
       */
      getEffectiveMode: (autoDetectedMode?: InteractionMode): InteractionMode => {
        const { preference } = get();
        
        // If auto-detect is enabled and we have a detected mode, use it
        if (preference.autoDetect && autoDetectedMode) {
          return autoDetectedMode;
        }
        
        // Otherwise use the preferred mode
        return preference.preferredMode;
      },

      /**
       * Check if mobile is preferred
       */
      isMobilePreferred: (): boolean => {
        const { preference } = get();
        return preference.preferredMode === 'mobile';
      },

      /**
       * Get session statistics
       */
      getSessionStats: (): InteractionModePreference['sessionStats'] => {
        const { preference } = get();
        return preference.sessionStats;
      },

      /**
       * Validate preference object
       */
      validatePreference: (preference: unknown): preference is InteractionModePreference => {
        return InteractionModePreferenceSchema.safeParse(preference).success;
      },
    }),
    {
      name: 'interaction-mode-store',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        // Migration logic for future versions
        if (version === 0) {
          // Migrate from version 0 to 1
          return {
            preference: DEFAULT_PREFERENCE,
          };
        }
        return persistedState as InteractionModeStore;
      },
      onRehydrateStorage: () => (state) => {
        // Validate rehydrated state
        if (state?.preference) {
          const isValid = InteractionModePreferenceSchema.safeParse(state.preference);
          if (!isValid.success) {
            console.warn('Invalid interaction mode preference rehydrated, using defaults:', isValid.error);
            state.preference = DEFAULT_PREFERENCE;
          }
        }
      },
    }
  )
);

/**
 * Hook to get interaction mode store with additional utilities
 */
export const useInteractionModeStoreWithUtils = () => {
  const store = useInteractionModeStore();

  return {
    ...store,
    /**
     * Toggle between desktop and mobile modes
     */
    toggleMode: () => {
      const currentMode = store.getCurrentMode();
      const newMode = currentMode === 'desktop' ? 'mobile' : 'desktop';
      store.setPreferredMode(newMode);
    },

    /**
     * Get mode preference summary
     */
    getModeSummary: () => {
      const { preference } = store;
      return {
        preferredMode: preference.preferredMode,
        autoDetect: preference.autoDetect,
        totalSessions: preference.sessionStats.totalSessions,
        mobileSessionRatio: preference.sessionStats.totalSessions > 0 
          ? (preference.sessionStats.mobileSessions / preference.sessionStats.totalSessions) * 100 
          : 0,
        averageSessionDuration: preference.sessionStats.averageSessionDuration,
        lastUpdated: preference.lastUpdated,
      };
    },

    /**
     * Export preferences for backup
     */
    exportPreferences: () => {
      return {
        preference: store.preference,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    },

    /**
     * Import preferences from backup
     */
    importPreferences: (data: unknown) => {
      if (typeof data === 'object' && data !== null && 'preference' in data) {
        if (store.validatePreference(data.preference)) {
          store.setPreferredMode(data.preference.preferredMode);
          store.setAutoDetect(data.preference.autoDetect);
          store.updateUIPreferences(data.preference.uiPreferences);
          return true;
        }
      }
      return false;
    },
  };
};

/**
 * Default export for convenience
 */
export default useInteractionModeStore;
