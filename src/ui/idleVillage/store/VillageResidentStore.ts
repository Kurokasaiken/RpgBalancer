/**
 * Village Resident Store
 * 
 * Canonical village-side resident store that serves as the single source of truth
 * for all resident data in Idle Village pages and components.
 * 
 * This store wraps the existing CharacterToResidentBootstrap and provides:
 * - Centralized village-side resident state
 * - Async persistence with character sync
 * - Proper error handling and fallback management
 * - Clean consumption API for pages
 */

import { create, type StateCreator } from 'zustand';
import { bootstrapResidentsFromCharacters, type BootstrapResidentsOptions } from '@/engine/game/idleVillage/CharacterToResidentBootstrap';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

const PERSISTENCE_KEY = 'village-resident-store';

/**
 * Store state interface
 */
export interface VillageResidentStoreState {
  // --- STATE ---
  /** Current residents in the village */
  residents: ResidentState[];
  /** Whether the store is currently loading from bootstrap */
  isLoading: boolean;
  /** Any error that occurred during loading/operations */
  error: string | null;
  /** Whether fallback residents are currently being used */
  usedFallback: boolean;
  /** Number of characters successfully converted */
  charactersConverted: number;
  /** Last timestamp when residents were bootstrapped */
  lastBootstrappedAt?: number;
  /** Current config used for bootstrap operations */
  config?: IdleVillageConfig;

  // --- ACTIONS ---
  /** Bootstrap residents from characters using canonical pipeline */
  bootstrapResidents: (options?: BootstrapResidentsOptions) => Promise<void>;
  /** Refresh residents by re-running bootstrap */
  refreshResidents: () => Promise<void>;
  /** Clear all resident data and reset store */
  clearResidents: () => Promise<void>;
  /** Update config used for bootstrap operations */
  updateConfig: (config: IdleVillageConfig) => void;
  /** Get resident by ID */
  getResidentById: (id: string) => ResidentState | undefined;
  /** Get all available residents */
  getAvailableResidents: () => ResidentState[];
  /** Get residents by status */
  getResidentsByStatus: (status: ResidentState['status']) => ResidentState[];
}

/**
 * Store initializer
 */
const villageResidentStoreInitializer: StateCreator<VillageResidentStoreState> = (set, get) => ({
  // --- INITIAL STATE ---
  residents: [],
  isLoading: false,
  error: null,
  usedFallback: false,
  charactersConverted: 0,
  lastBootstrappedAt: undefined,
  config: undefined,

  // --- ACTIONS ---
  bootstrapResidents: async (options = {}) => {
    const { config } = get();
    
    set({ isLoading: true, error: null });
    
    try {
      // Use existing canonical bootstrap with current config
      const bootstrapOptions: BootstrapResidentsOptions = {
        config,
        enableFallback: true,
        startingFatigueOverride: options.startingFatigueOverride,
        ...options,
      };
      
      const result = bootstrapResidentsFromCharacters(bootstrapOptions);
      
      // Update store state with bootstrap results
      set({
        residents: result.residents,
        usedFallback: result.usedFallback,
        charactersConverted: result.charactersConverted,
        error: result.error || null,
        lastBootstrappedAt: Date.now(),
        isLoading: false,
      });

      // Persist to storage
      await persistStoreState({
        residents: result.residents,
        usedFallback: result.usedFallback,
        charactersConverted: result.charactersConverted,
        lastBootstrappedAt: Date.now(),
      });

      trackTelemetryEvent('village_resident_store_bootstrap_success', {
        residentCount: result.residents.length,
        usedFallback: result.usedFallback,
        charactersConverted: result.charactersConverted,
        timestamp: Date.now(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      set({
        error: errorMessage,
        isLoading: false,
      });

      trackTelemetryEvent('village_resident_store_bootstrap_error', {
        error: errorMessage,
        timestamp: Date.now(),
      });
    }
  },

  refreshResidents: async () => {
    const { bootstrapResidents } = get();
    await bootstrapResidents();
  },

  clearResidents: async () => {
    set({
      residents: [],
      usedFallback: false,
      charactersConverted: 0,
      error: null,
      lastBootstrappedAt: undefined,
    });

    await clearData(PERSISTENCE_KEY);
    
    trackTelemetryEvent('village_resident_store_cleared', {
      timestamp: Date.now(),
    });
  },

  updateConfig: (config: IdleVillageConfig) => {
    set({ config });
  },

  getResidentById: (id: string) => {
    const { residents } = get();
    return residents.find(resident => resident.id === id);
  },

  getAvailableResidents: () => {
    const { residents } = get();
    return residents.filter(resident => resident.status === 'available');
  },

  getResidentsByStatus: (status: ResidentState['status']) => {
    const { residents } = get();
    return residents.filter(resident => resident.status === status);
  },
});

/**
 * Persist store state to storage
 */
async function persistStoreState(state: Partial<VillageResidentStoreState>): Promise<void> {
  try {
    await saveData(PERSISTENCE_KEY, {
      ...state,
      savedAt: Date.now(),
    });
  } catch (error) {
    console.warn('[VillageResidentStore] Failed to persist state:', error);
  }
}

/**
 * Hydrate store state from storage
 */
async function hydrateStoreState(): Promise<Partial<VillageResidentStoreState> | null> {
  try {
    const data = await loadData(PERSISTENCE_KEY, null);
    return data as Partial<VillageResidentStoreState> | null;
  } catch (error) {
    console.warn('[VillageResidentStore] Failed to hydrate state:', error);
    return null;
  }
}

/**
 * Create the store with persistence hydration
 */
export const createVillageResidentStore = () => {
  const store = create<VillageResidentStoreState>()(
    villageResidentStoreInitializer
  );

  // Hydrate from storage on creation
  hydrateStoreState().then(persistedState => {
    if (persistedState && persistedState.residents) {
      store.setState({
        residents: persistedState.residents,
        usedFallback: persistedState.usedFallback ?? false,
        charactersConverted: persistedState.charactersConverted ?? 0,
        lastBootstrappedAt: persistedState.lastBootstrappedAt,
        error: null,
        isLoading: false,
      });

      trackTelemetryEvent('village_resident_store_hydrated', {
        residentCount: persistedState.residents.length,
        usedFallback: persistedState.usedFallback,
        timestamp: Date.now(),
      });
    }
  }).catch(error => {
    console.warn('[VillageResidentStore] Hydration failed:', error);
  });

  return store;
};

/**
 * Global store instance
 */
export const useVillageResidentStore = createVillageResidentStore();
