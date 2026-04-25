/**
 * Trade route seeds for Idle Village testing and development.
 * Provides predefined trade route configurations for different scenarios.
 */

import type { TradeRoute } from '@/ui/idleVillage/types/trade';
import type { VillageConfig } from '@/ui/idleVillage/state/VillageRegistry';

/**
 * Creates basic trade routes between village pairs.
 */
export function seedBasicTradeRoutes(villageConfigs: VillageConfig[]): TradeRoute[] {
  const routes: TradeRoute[] = [];
  const villageIds = villageConfigs.map(v => v.id);

  // Create bidirectional trade routes between all village pairs
  for (let i = 0; i < villageIds.length; i++) {
    for (let j = i + 1; j < villageIds.length; j++) {
      const fromId = villageIds[i];
      const toId = villageIds[j];
      
      // Forward route
      routes.push({
        id: `trade-${fromId}-${toId}`,
        fromVillageId: fromId,
        toVillageId: toId,
        sendResources: { gold: 50, food: 25 },
        receiveResources: { wood: 30, stone: 20 },
        duration: 3,
        risk: 0.1,
      });

      // Reverse route
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

/**
 * Creates advanced trade routes with varied resources and risk levels.
 */
export function seedAdvancedTradeRoutes(villageConfigs: VillageConfig[]): TradeRoute[] {
  const routes: TradeRoute[] = [];
  const villageIds = villageConfigs.map(v => v.id);

  // Create specialized trade routes based on village specializations
  const specializations: Record<string, Record<string, number>> = {
    forest: { wood: 100, herbs: 50 },
    mountain: { stone: 80, iron: 40 },
    plains: { food: 120, gold: 60 },
    river: { fish: 80, water: 100 },
  };

  for (let i = 0; i < villageIds.length; i++) {
    for (let j = i + 1; j < villageIds.length; j++) {
      const fromId = villageIds[i];
      const toId = villageIds[j];
      
      // Determine specializations based on village names
      const fromSpec = getSpecialization(fromId, specializations);
      const toSpec = getSpecialization(toId, specializations);
      
      routes.push({
        id: `advanced-trade-${fromId}-${toId}`,
        fromVillageId: fromId,
        toVillageId: toId,
        sendResources: fromSpec || { gold: 75, food: 40 },
        receiveResources: toSpec || { wood: 50, stone: 30 },
        duration: 4,
        risk: 0.15,
      });
    }
  }

  return routes;
}

/**
 * Creates high-risk, high-reward trade routes.
 */
export function seedHighRiskTradeRoutes(villageConfigs: VillageConfig[]): TradeRoute[] {
  const routes: TradeRoute[] = [];
  const villageIds = villageConfigs.map(v => v.id);

  // Create high-risk routes with better rewards
  for (let i = 0; i < villageIds.length; i++) {
    for (let j = i + 1; j < villageIds.length; j++) {
      const fromId = villageIds[i];
      const toId = villageIds[j];
      
      routes.push({
        id: `high-risk-trade-${fromId}-${toId}`,
        fromVillageId: fromId,
        toVillageId: toId,
        sendResources: { gold: 100, luxury_goods: 25 },
        receiveResources: { rare_materials: 50, artifacts: 10 },
        duration: 6,
        risk: 0.35,
      });
    }
  }

  return routes;
}

/**
 * Creates trade routes for testing scenarios.
 */
export function seedTestTradeRoutes(villageConfigs: VillageConfig[]): TradeRoute[] {
  return [
    // Test route 1: Simple gold-for-food trade
    {
      id: 'test-route-1',
      fromVillageId: villageConfigs[0]?.id || 'village1',
      toVillageId: villageConfigs[1]?.id || 'village2',
      sendResources: { gold: 50 },
      receiveResources: { food: 100 },
      duration: 2,
      risk: 0.05,
    },
    
    // Test route 2: Multi-resource trade
    {
      id: 'test-route-2',
      fromVillageId: villageConfigs[0]?.id || 'village1',
      toVillageId: villageConfigs[1]?.id || 'village2',
      sendResources: { wood: 30, stone: 20 },
      receiveResources: { iron: 15, gold: 40 },
      duration: 3,
      risk: 0.1,
    },
    
    // Test route 3: High-risk trade
    {
      id: 'test-route-3',
      fromVillageId: villageConfigs[0]?.id || 'village1',
      toVillageId: villageConfigs[1]?.id || 'village2',
      sendResources: { luxury_goods: 10 },
      receiveResources: { rare_materials: 5 },
      duration: 5,
      risk: 0.4,
    },
  ];
}

/**
 * Helper function to determine village specialization based on name.
 */
function getSpecialization(villageId: string, specializations: Record<string, Record<string, number>>): Record<string, number> | undefined {
  const name = villageId.toLowerCase();
  
  for (const [key, resources] of Object.entries(specializations)) {
    if (name.includes(key)) {
      return resources;
    }
  }
  
  return undefined;
}

/**
 * Main seed function that creates all types of trade routes.
 */
export function seedTradeRoutes(villageConfigs: VillageConfig[]): TradeRoute[] {
  return [
    ...seedBasicTradeRoutes(villageConfigs),
    ...seedAdvancedTradeRoutes(villageConfigs),
    ...seedHighRiskTradeRoutes(villageConfigs),
  ];
}
