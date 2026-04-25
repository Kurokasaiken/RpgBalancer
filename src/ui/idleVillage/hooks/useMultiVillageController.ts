/**
 * React hook for multi-village architecture control.
 * Provides APIs for village selection, resource management, and migration.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  VillageRegistry,
  type VillageConfig,
  type VillageSummary,
  type GlobalResources,
  type TradeRoute,
  type TradeResult,
  type MigrationRequest,
  DEFAULT_VILLAGE_CONFIGS,
  DEFAULT_GLOBAL_RESOURCES,
} from '@/ui/idleVillage/state/VillageRegistry';

/**
 * Props for the multi-village controller hook.
 */
interface UseMultiVillageControllerProps {
  /** Initial village configurations */
  initialVillages?: VillageConfig[];
  /** Initial global resources */
  initialGlobalResources?: GlobalResources;
}

/**
 * Return type for the multi-village controller hook.
 */
interface MultiVillageController {
  /** Select a village as active */
  selectVillage: (villageId: string) => boolean;
  /** Get summary of all villages */
  getVillageSummaries: () => VillageSummary[];
  /** Transfer resources between villages */
  transferResource: (fromVillageId: string, toVillageId: string, resourceId: string, amount: number) => boolean;
  /** Get currently active village ID */
  getActiveVillageId: () => string | null;
  /** Get global resources */
  getGlobalResources: () => GlobalResources;
  /** Add a new village */
  addVillage: (village: VillageConfig) => boolean;
  /** Remove a village */
  removeVillage: (villageId: string) => boolean;
  /** Create a trade route */
  createTradeRoute: (route: TradeRoute) => boolean;
  /** Execute a trade route */
  executeTradeRoute: (routeId: string) => boolean;
  /** Queue a migration */
  queueMigration: (residentId: string, fromVillageId: string, toVillageId: string) => boolean;
  /** Process migration tick */
  processMigrationTick: () => MigrationRequest[];
  /** Get all trade routes */
  getTradeRoutes: () => TradeRoute[];
  /** Get migration queue */
  getMigrationQueue: () => MigrationRequest[];
  /** Get last executed trade result */
  getLastTradeResult: () => TradeResult | null;
  /** Seed trade routes for testing */
  seedTradeRoutes: (routes: TradeRoute[], lastResult?: TradeResult) => void;
  /** Seed migration queue for testing */
  seedMigrationQueue: (requests: MigrationRequest[]) => void;
}

/**
 * Hook for managing multi-village state and operations.
 * Uses config-first VillageRegistry for village management.
 */
export function useMultiVillageController({
  initialVillages = DEFAULT_VILLAGE_CONFIGS,
  initialGlobalResources = DEFAULT_GLOBAL_RESOURCES,
}: UseMultiVillageControllerProps = {}): MultiVillageController {
  // Use useRef to persist the registry instance across renders
  const registryRef = useRef<VillageRegistry>(new VillageRegistry(initialVillages, initialGlobalResources));

  const [tradeRoutesState, setTradeRoutesState] = useState<TradeRoute[]>([]);
  const [migrationQueueState, setMigrationQueueState] = useState<MigrationRequest[]>([]);
  const [lastTradeResultState, setLastTradeResultState] = useState<TradeResult | null>(null);

  // Force re-render when registry state changes
  const [, forceUpdate] = useState({});

  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  const syncDerivedState = useCallback(() => {
    setTradeRoutesState(registryRef.current.getTradeRoutes());
    setMigrationQueueState(registryRef.current.getMigrationQueue());
    setLastTradeResultState(registryRef.current.getLastTradeResult());
  }, []);

  useEffect(() => {
    syncDerivedState();
  }, [syncDerivedState]);

  const selectVillage = useCallback((villageId: string): boolean => {
    const success = registryRef.current.setActiveVillage(villageId);
    if (success) triggerUpdate();
    return success;
  }, [triggerUpdate]);

  const getVillageSummaries = useCallback((): VillageSummary[] => {
    return registryRef.current.getVillageSummaries();
  }, []);

  const transferResource = useCallback((
    fromVillageId: string,
    toVillageId: string,
    resourceId: string,
    amount: number
  ): boolean => {
    const success = registryRef.current.transferResource(fromVillageId, toVillageId, resourceId, amount);
    if (success) triggerUpdate();
    return success;
  }, [triggerUpdate]);

  const getActiveVillageId = useCallback((): string | null => {
    return registryRef.current.getActiveVillageId();
  }, []);

  const getGlobalResources = useCallback((): GlobalResources => {
    return registryRef.current.getGlobalResources();
  }, []);

  const addVillage = useCallback((village: VillageConfig): boolean => {
    const success = registryRef.current.addVillage(village);
    if (success) triggerUpdate();
    return success;
  }, [triggerUpdate]);

  const removeVillage = useCallback((villageId: string): boolean => {
    const success = registryRef.current.removeVillage(villageId);
    if (success) triggerUpdate();
    return success;
  }, [triggerUpdate]);

  const createTradeRoute = useCallback(
    (route: TradeRoute): boolean => {
      const success = registryRef.current.createTradeRoute(route);
      if (success) {
        syncDerivedState();
        triggerUpdate();
      }
      return success;
    },
    [syncDerivedState, triggerUpdate],
  );

  const executeTradeRoute = useCallback(
    (routeId: string): boolean => {
      const success = registryRef.current.executeTradeRoute(routeId);
      syncDerivedState();
      triggerUpdate();
      return success;
    },
    [syncDerivedState, triggerUpdate],
  );

  const queueMigration = useCallback(
    (residentId: string, fromVillageId: string, toVillageId: string): boolean => {
      const success = registryRef.current.queueMigration(residentId, fromVillageId, toVillageId);
      if (success) {
        syncDerivedState();
        triggerUpdate();
      }
      return success;
    },
    [syncDerivedState, triggerUpdate],
  );

  const processMigrationTick = useCallback((): MigrationRequest[] => {
    const completed = registryRef.current.processMigrationTick();
    if (completed.length > 0) {
      syncDerivedState();
      triggerUpdate();
    }
    return completed;
  }, [syncDerivedState, triggerUpdate]);

  const getTradeRoutes = useCallback((): TradeRoute[] => {
    return tradeRoutesState;
  }, [tradeRoutesState]);

  const getMigrationQueue = useCallback((): MigrationRequest[] => {
    return migrationQueueState;
  }, [migrationQueueState]);

  const getLastTradeResult = useCallback(() => {
    return lastTradeResultState;
  }, [lastTradeResultState]);

  const seedTradeRoutes = useCallback(
    (routes: TradeRoute[], lastResult?: TradeResult) => {
      registryRef.current.seedTradeRoutes(routes, lastResult);
      syncDerivedState();
      triggerUpdate();
    },
    [syncDerivedState, triggerUpdate],
  );

  const seedMigrationQueue = useCallback(
    (requests: MigrationRequest[]) => {
      registryRef.current.seedMigrationQueue(requests);
      syncDerivedState();
      triggerUpdate();
    },
    [syncDerivedState, triggerUpdate],
  );

  return useMemo(() => ({
    selectVillage,
    getVillageSummaries,
    transferResource,
    getActiveVillageId,
    getGlobalResources,
    addVillage,
    removeVillage,
    createTradeRoute,
    executeTradeRoute,
    queueMigration,
    processMigrationTick,
    getTradeRoutes,
    getMigrationQueue,
    getLastTradeResult,
    seedTradeRoutes,
    seedMigrationQueue,
  }), [
    selectVillage,
    getVillageSummaries,
    transferResource,
    getActiveVillageId,
    getGlobalResources,
    addVillage,
    removeVillage,
    createTradeRoute,
    executeTradeRoute,
    queueMigration,
    processMigrationTick,
    getTradeRoutes,
    getMigrationQueue,
    getLastTradeResult,
    seedTradeRoutes,
    seedMigrationQueue,
  ]);
}
