/**
 * React hook for managing trade routes in Idle Village.
 * Provides APIs for creating, executing, and monitoring trade routes.
 */

import { useCallback, useState } from 'react';
import type { TradeRoute, TradeResult } from '../types/trade';
import type { VillageConfig } from '../state/VillageRegistry';
import { 
  createTradeRouteController, 
  seedTradeRoutes
} from '../controllers/TradeRouteController';

/**
 * Props for the useTradeRoutes hook.
 */
export interface UseTradeRoutesProps {
  /** Available village configurations */
  villageConfigs: VillageConfig[];
  /** Whether to seed default trade routes on initialization */
  seedDefaultRoutes?: boolean;
}

/**
 * Return type for the useTradeRoutes hook.
 */
export interface UseTradeRoutesReturn {
  /** All trade routes */
  tradeRoutes: TradeRoute[];
  /** Last trade execution result */
  lastTradeResult: TradeResult | null;
  /** Create a new trade route */
  createTradeRoute: (route: TradeRoute) => boolean;
  /** Execute an existing trade route */
  executeTradeRoute: (routeId: string) => boolean;
  /** Validate a trade route configuration */
  validateTradeRoute: (route: TradeRoute) => { valid: boolean; errors: string[] };
  /** Clear all trade routes */
  clearTradeRoutes: () => void;
  /** Get trade routes for a specific village */
  getTradeRoutesForVillage: (villageId: string) => TradeRoute[];
}

/**
 * React hook for managing trade routes between villages.
 */
export function useTradeRoutes({ 
  villageConfigs, 
  seedDefaultRoutes = false 
}: UseTradeRoutesProps): UseTradeRoutesReturn {
  const [controller] = useState(() => createTradeRouteController(villageConfigs));
  const [tradeRoutes, setTradeRoutes] = useState<TradeRoute[]>(() => {
    if (seedDefaultRoutes) {
      return seedTradeRoutes(villageConfigs);
    }
    return [];
  });
  const [lastTradeResult, setLastTradeResult] = useState<TradeResult | null>(null);

  const createTradeRoute = useCallback((route: TradeRoute): boolean => {
    const success = controller.createTradeRoute(route);
    if (success) {
      setTradeRoutes(prev => [...prev, route]);
    }
    return success;
  }, [controller]);

  const executeTradeRoute = useCallback((routeId: string): boolean => {
    const success = controller.executeTradeRoute(routeId);
    const result = controller.getLastTradeResult();
    if (result) {
      setLastTradeResult(result);
    }
    return success;
  }, [controller]);

  const validateTradeRoute = useCallback((route: TradeRoute) => {
    return controller.validateTradeRoute(route);
  }, [controller]);

  const clearTradeRoutes = useCallback(() => {
    setTradeRoutes([]);
    setLastTradeResult(null);
  }, []);

  const getTradeRoutesForVillage = useCallback((villageId: string): TradeRoute[] => {
    return tradeRoutes.filter(
      route => route.fromVillageId === villageId || route.toVillageId === villageId
    );
  }, [tradeRoutes]);

  return {
    tradeRoutes,
    lastTradeResult,
    createTradeRoute,
    executeTradeRoute,
    validateTradeRoute,
    clearTradeRoutes,
    getTradeRoutesForVillage,
  };
}
