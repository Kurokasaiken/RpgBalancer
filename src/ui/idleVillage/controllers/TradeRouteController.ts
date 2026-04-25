/**
 * Trade route controller implementation for Idle Village.
 * Provides APIs for creating, executing, and managing trade routes between villages.
 */

import type { TradeRoute, TradeResult, TradeRouteController } from '../types/trade';
import type { VillageConfig } from '../state/VillageRegistry';

/**
 * Mock implementation of trade route controller for development/testing.
 * In production, this would integrate with the actual village registry and resource management.
 */
export class MockTradeRouteController implements TradeRouteController {
  private tradeRoutes: Map<string, TradeRoute> = new Map();
  private lastTradeResult: TradeResult | null = null;
  private villageConfigs: Map<string, VillageConfig>;

  constructor(villageConfigs: VillageConfig[] = []) {
    this.villageConfigs = new Map(villageConfigs.map(v => [v.id, v]));
  }

  /**
   * Creates a new trade route between villages.
   */
  createTradeRoute(route: TradeRoute): boolean {
    const validation = this.validateTradeRoute(route);
    if (!validation.valid) {
      console.error('Trade route validation failed:', validation.errors);
      return false;
    }

    this.tradeRoutes.set(route.id, route);
    return true;
  }

  /**
   * Executes an existing trade route.
   */
  executeTradeRoute(routeId: string): boolean {
    const route = this.tradeRoutes.get(routeId);
    if (!route) {
      console.error('Trade route not found:', routeId);
      return false;
    }

    // Simulate trade execution with risk assessment
    const success = Math.random() > route.risk;
    const riskEvent = success ? undefined : this.generateRiskEvent(route.risk);

    this.lastTradeResult = {
      success,
      routeId,
      executedAt: Date.now(),
      resourcesSent: route.sendResources,
      resourcesReceived: success ? route.receiveResources : {},
      riskEvent,
    };

    return success;
  }

  /**
   * Returns all configured trade routes.
   */
  getTradeRoutes(): TradeRoute[] {
    return Array.from(this.tradeRoutes.values());
  }

  /**
   * Returns the last trade execution result.
   */
  getLastTradeResult(): TradeResult | null {
    return this.lastTradeResult;
  }

  /**
   * Validates a trade route configuration.
   */
  validateTradeRoute(route: TradeRoute): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate village IDs exist
    if (!this.villageConfigs.has(route.fromVillageId)) {
      errors.push(`Source village '${route.fromVillageId}' not found`);
    }
    if (!this.villageConfigs.has(route.toVillageId)) {
      errors.push(`Target village '${route.toVillageId}' not found`);
    }

    // Validate route doesn't connect village to itself
    if (route.fromVillageId === route.toVillageId) {
      errors.push('Cannot create trade route to same village');
    }

    // Validate resources
    if (Object.keys(route.sendResources).length === 0) {
      errors.push('Must specify at least one resource to send');
    }
    if (Object.keys(route.receiveResources).length === 0) {
      errors.push('Must specify at least one resource to receive');
    }

    // Validate numeric values
    if (route.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }
    if (route.risk < 0 || route.risk > 1) {
      errors.push('Risk must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates a risk event description based on risk factor.
   */
  private generateRiskEvent(_risk: number): string {
    const events = [
      'Caravan attacked by bandits',
      'Bad weather delayed the caravan',
      'Roads were impassable',
      'Customs inspection delayed trade',
      'Market prices changed unfavorably',
    ];
    return events[Math.floor(Math.random() * events.length)];
  }
}

/**
 * Factory function to create a trade route controller with village configurations.
 */
export function createTradeRouteController(villageConfigs: VillageConfig[]): TradeRouteController {
  return new MockTradeRouteController(villageConfigs);
}

/**
 * Seed function to create default trade routes for testing.
 */
export function seedTradeRoutes(villageConfigs: VillageConfig[]): TradeRoute[] {
  const routes: TradeRoute[] = [];
  const villageIds = villageConfigs.map(v => v.id);

  // Create sample trade routes between village pairs
  for (let i = 0; i < villageIds.length; i++) {
    for (let j = i + 1; j < villageIds.length; j++) {
      const fromId = villageIds[i];
      const toId = villageIds[j];
      
      routes.push({
        id: `trade-${fromId}-${toId}`,
        fromVillageId: fromId,
        toVillageId: toId,
        sendResources: { gold: 50, food: 25 },
        receiveResources: { wood: 30, stone: 20 },
        duration: 3,
        risk: 0.1,
      });

      routes.push({
        id: `trade-${toId}-${fromId}`,
        fromVillageId: toId,
        toVillageId: fromId,
        sendResources: { wood: 30, stone: 20 },
        receiveResources: { gold: 50, food: 25 },
        duration: 3,
        risk: 0.1,
      });
    }
  }

  return routes;
}
