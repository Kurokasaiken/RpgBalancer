/**
 * Trade route types for Idle Village multi-village architecture.
 * Provides type definitions for trade routes, execution results, and related operations.
 */

/**
 * Configuration for a trade route between two villages.
 */
export interface TradeRoute {
  /** Unique identifier for the trade route */
  id: string;
  /** Village that sends resources */
  fromVillageId: string;
  /** Village that receives resources */
  toVillageId: string;
  /** Resources to send (resourceId -> amount) */
  sendResources: Record<string, number>;
  /** Resources to receive (resourceId -> amount) */
  receiveResources: Record<string, number>;
  /** Time units required to complete the trade */
  duration: number;
  /** Risk factor (0-1) affecting success chance */
  risk: number;
}

/**
 * Result of executing a trade route.
 */
export interface TradeResult {
  success: boolean;
  routeId: string;
  executedAt: number; // timestamp
  resourcesSent: Record<string, number>;
  resourcesReceived: Record<string, number>;
  riskEvent?: string; // description if risk triggered
}

/**
 * Trade route controller interface for managing trade operations.
 */
export interface TradeRouteController {
  /** Create a new trade route */
  createTradeRoute: (route: TradeRoute) => boolean;
  /** Execute an existing trade route */
  executeTradeRoute: (routeId: string) => boolean;
  /** Get all trade routes */
  getTradeRoutes: () => TradeRoute[];
  /** Get last trade execution result */
  getLastTradeResult: () => TradeResult | null;
  /** Validate trade route configuration */
  validateTradeRoute: (route: TradeRoute) => { valid: boolean; errors: string[] };
}
