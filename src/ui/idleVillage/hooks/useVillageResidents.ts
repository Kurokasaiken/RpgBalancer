/**
 * useVillageResidents Hook
 * 
 * React hook that provides access to the canonical Village Resident Store.
 * Exposes a clean consumption API for pages and components.
 */

import { useEffect } from 'react';
import { useVillageResidentStore } from '@/ui/idleVillage/store/VillageResidentStore';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { BootstrapResidentsOptions } from '@/engine/game/idleVillage/CharacterToResidentBootstrap';

/**
 * Hook return interface
 */
export interface UseVillageResidentsReturn {
  // --- STATE ---
  /** Current residents in the village */
  residents: ResidentState[];
  /** Whether the store is currently loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Whether fallback residents are being used */
  usedFallback: boolean;
  /** Number of characters successfully converted */
  charactersConverted: number;
  /** Last bootstrap timestamp */
  lastBootstrappedAt?: number;

  // --- ACTIONS ---
  /** Bootstrap residents from characters */
  bootstrapResidents: (options?: BootstrapResidentsOptions) => Promise<void>;
  /** Refresh residents */
  refreshResidents: () => Promise<void>;
  /** Clear all residents */
  clearResidents: () => Promise<void>;

  // --- SELECTORS ---
  /** Get resident by ID */
  getResidentById: (id: string) => ResidentState | undefined;
  /** Get all available residents */
  getAvailableResidents: () => ResidentState[];
  /** Get residents by status */
  getResidentsByStatus: (status: ResidentState['status']) => ResidentState[];
}

/**
 * Hook for accessing the canonical Village Resident Store
 * 
 * This hook provides the single entry point for all pages and components
 * to access village-side resident data. It automatically handles config
 * updates and provides convenient selector functions.
 * 
 * @returns Hook interface with state, actions, and selectors
 */
export function useVillageResidents(): UseVillageResidentsReturn {
  // Use Zustand selectors to get stable state values
  const residents = useVillageResidentStore(state => state.residents);
  const isLoading = useVillageResidentStore(state => state.isLoading);
  const error = useVillageResidentStore(state => state.error);
  const usedFallback = useVillageResidentStore(state => state.usedFallback);
  const charactersConverted = useVillageResidentStore(state => state.charactersConverted);
  const lastBootstrappedAt = useVillageResidentStore(state => state.lastBootstrappedAt);
  
  // Get store actions separately
  const bootstrapResidents = useVillageResidentStore(state => state.bootstrapResidents);
  const refreshResidents = useVillageResidentStore(state => state.refreshResidents);
  const clearResidents = useVillageResidentStore(state => state.clearResidents);
  const updateConfig = useVillageResidentStore(state => state.updateConfig);
  const getResidentById = useVillageResidentStore(state => state.getResidentById);
  const getAvailableResidents = useVillageResidentStore(state => state.getAvailableResidents);
  const getResidentsByStatus = useVillageResidentStore(state => state.getResidentsByStatus);
  
  const { config } = useIdleVillageConfig();

  // Update store when config changes
  useEffect(() => {
    if (config) {
      updateConfig(config);
    }
  }, [config, updateConfig]);

  // Auto-bootstrap on first load if no residents exist
  useEffect(() => {
    if (!isLoading && residents.length === 0 && !error && config) {
      bootstrapResidents({ config });
    }
  }, [isLoading, residents.length, error, config, bootstrapResidents]);

  return {
    // State
    residents,
    isLoading,
    error,
    usedFallback,
    charactersConverted,
    lastBootstrappedAt,

    // Actions
    bootstrapResidents,
    refreshResidents,
    clearResidents,

    // Selectors
    getResidentById,
    getAvailableResidents,
    getResidentsByStatus,
  };
}
