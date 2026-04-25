/**
 * Unit tests for Trade Routes functionality.
 * Tests trade route creation, execution, validation, and seeding.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TradeRoute } from '@/ui/idleVillage/types/trade';
import type { VillageConfig } from '@/ui/idleVillage/state/VillageRegistry';
import { 
  MockTradeRouteController, 
  createTradeRouteController, 
  seedTradeRoutes 
} from '@/ui/idleVillage/controllers/TradeRouteController';
import { useTradeRoutes } from '@/ui/idleVillage/hooks/useTradeRoutes';
import { renderHook, act } from '@testing-library/react';
import { seedBasicTradeRoutes, seedAdvancedTradeRoutes, seedHighRiskTradeRoutes } from '@/balancing/config/idleVillage/tradeSeeds';

// Mock village configurations for testing
const mockVillageConfigs: VillageConfig[] = [
  {
    id: 'forest-village',
    name: 'Forest Village',
    initialResources: { wood: 100, food: 50 },
    initialPopulation: 10,
    activitySlots: ['lumberjack', 'hunter'],
    traits: ['forest_specialist'],
  },
  {
    id: 'mountain-village',
    name: 'Mountain Village',
    initialResources: { stone: 80, iron: 40 },
    initialPopulation: 8,
    activitySlots: ['miner', 'quarry'],
    traits: ['mountain_specialist'],
  },
];

describe('TradeRouteController', () => {
  let controller: MockTradeRouteController;

  beforeEach(() => {
    controller = createTradeRouteController(mockVillageConfigs) as MockTradeRouteController;
  });

  describe('createTradeRoute', () => {
    it('should create a valid trade route', () => {
      const route: TradeRoute = {
        id: 'test-route-1',
        fromVillageId: 'forest-village',
        toVillageId: 'mountain-village',
        sendResources: { wood: 50 },
        receiveResources: { stone: 30 },
        duration: 3,
        risk: 0.1,
      };

      const result = controller.createTradeRoute(route);
      expect(result).toBe(true);
      
      const routes = controller.getTradeRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]).toEqual(route);
    });

    it('should reject invalid trade route', () => {
      const invalidRoute: TradeRoute = {
        id: 'invalid-route',
        fromVillageId: 'nonexistent-village',
        toVillageId: 'mountain-village',
        sendResources: {},
        receiveResources: { stone: 30 },
        duration: -1,
        risk: 1.5,
      };

      const result = controller.createTradeRoute(invalidRoute);
      expect(result).toBe(false);
      
      const routes = controller.getTradeRoutes();
      expect(routes).toHaveLength(0);
    });

    it('should reject trade route to same village', () => {
      const sameVillageRoute: TradeRoute = {
        id: 'same-village-route',
        fromVillageId: 'forest-village',
        toVillageId: 'forest-village',
        sendResources: { wood: 50 },
        receiveResources: { stone: 30 },
        duration: 3,
        risk: 0.1,
      };

      const result = controller.createTradeRoute(sameVillageRoute);
      expect(result).toBe(false);
    });
  });

  describe('executeTradeRoute', () => {
    beforeEach(() => {
      const route: TradeRoute = {
        id: 'test-route',
        fromVillageId: 'forest-village',
        toVillageId: 'mountain-village',
        sendResources: { wood: 50 },
        receiveResources: { stone: 30 },
        duration: 3,
        risk: 0.1,
      };
      controller.createTradeRoute(route);
    });

    it('should execute existing trade route', () => {
      const result = controller.executeTradeRoute('test-route');
      expect(result).toBe(true);
      
      const lastResult = controller.getLastTradeResult();
      expect(lastResult).toBeTruthy();
      expect(lastResult?.routeId).toBe('test-route');
      expect(lastResult?.success).toBe(true);
      expect(lastResult?.resourcesSent).toEqual({ wood: 50 });
      expect(lastResult?.resourcesReceived).toEqual({ stone: 30 });
    });

    it('should fail to execute nonexistent trade route', () => {
      const result = controller.executeTradeRoute('nonexistent-route');
      expect(result).toBe(false);
      
      const lastResult = controller.getLastTradeResult();
      expect(lastResult).toBeNull();
    });

    it('should handle risk events', () => {
      // Mock Math.random to always trigger risk
      vi.spyOn(Math, 'random').mockReturnValue(0.05);
      
      const result = controller.executeTradeRoute('test-route');
      expect(result).toBe(false);
      
      const lastResult = controller.getLastTradeResult();
      expect(lastResult?.success).toBe(false);
      expect(lastResult?.riskEvent).toBeTruthy();
      expect(lastResult?.resourcesReceived).toEqual({});
      
      vi.restoreAllMocks();
    });
  });

  describe('validateTradeRoute', () => {
    it('should validate correct trade route', () => {
      const route: TradeRoute = {
        id: 'valid-route',
        fromVillageId: 'forest-village',
        toVillageId: 'mountain-village',
        sendResources: { wood: 50 },
        receiveResources: { stone: 30 },
        duration: 3,
        risk: 0.1,
      };

      const validation = controller.validateTradeRoute(route);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect multiple validation errors', () => {
      const invalidRoute: TradeRoute = {
        id: 'invalid-route',
        fromVillageId: 'nonexistent',
        toVillageId: 'forest-village',
        sendResources: {},
        receiveResources: {},
        duration: -1,
        risk: 2,
      };

      const validation = controller.validateTradeRoute(invalidRoute);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(2);
    });
  });
});

describe('useTradeRoutes Hook', () => {
  it('should initialize with empty trade routes', () => {
    const { result } = renderHook(() => 
      useTradeRoutes({ villageConfigs: mockVillageConfigs })
    );

    expect(result.current.tradeRoutes).toHaveLength(0);
    expect(result.current.lastTradeResult).toBeNull();
  });

  it('should seed default routes when enabled', () => {
    const { result } = renderHook(() => 
      useTradeRoutes({ villageConfigs: mockVillageConfigs, seedDefaultRoutes: true })
    );

    expect(result.current.tradeRoutes.length).toBeGreaterThan(0);
  });

  it('should create trade route', () => {
    const { result } = renderHook(() => 
      useTradeRoutes({ villageConfigs: mockVillageConfigs })
    );

    const route: TradeRoute = {
      id: 'hook-test-route',
      fromVillageId: 'forest-village',
      toVillageId: 'mountain-village',
      sendResources: { wood: 50 },
      receiveResources: { stone: 30 },
      duration: 3,
      risk: 0.1,
    };

    act(() => {
      const success = result.current.createTradeRoute(route);
      expect(success).toBe(true);
    });

    expect(result.current.tradeRoutes).toHaveLength(1);
    expect(result.current.tradeRoutes[0]).toEqual(route);
  });

  it('should execute trade route', () => {
    const { result } = renderHook(() => 
      useTradeRoutes({ villageConfigs: mockVillageConfigs })
    );

    const route: TradeRoute = {
      id: 'execute-test-route',
      fromVillageId: 'forest-village',
      toVillageId: 'mountain-village',
      sendResources: { wood: 50 },
      receiveResources: { stone: 30 },
      duration: 3,
      risk: 0.1,
    };

    act(() => {
      result.current.createTradeRoute(route);
    });

    act(() => {
      const success = result.current.executeTradeRoute('execute-test-route');
      expect(success).toBe(true);
    });

    expect(result.current.lastTradeResult).toBeTruthy();
    expect(result.current.lastTradeResult?.routeId).toBe('execute-test-route');
  });

  it('should get trade routes for specific village', () => {
    const { result } = renderHook(() => 
      useTradeRoutes({ villageConfigs: mockVillageConfigs })
    );

    const route1: TradeRoute = {
      id: 'route-1',
      fromVillageId: 'forest-village',
      toVillageId: 'mountain-village',
      sendResources: { wood: 50 },
      receiveResources: { stone: 30 },
      duration: 3,
      risk: 0.1,
    };

    const route2: TradeRoute = {
      id: 'route-2',
      fromVillageId: 'mountain-village',
      toVillageId: 'forest-village',
      sendResources: { stone: 30 },
      receiveResources: { wood: 50 },
      duration: 3,
      risk: 0.1,
    };

    act(() => {
      result.current.createTradeRoute(route1);
      result.current.createTradeRoute(route2);
    });

    const forestRoutes = result.current.getTradeRoutesForVillage('forest-village');
    expect(forestRoutes).toHaveLength(2);
  });
});

describe('Trade Route Seeds', () => {
  it('should create basic trade routes', () => {
    const routes = seedBasicTradeRoutes(mockVillageConfigs);
    expect(routes.length).toBeGreaterThan(0);
    
    // Should have bidirectional routes between villages
    const forestToMountain = routes.find(r => 
      r.fromVillageId === 'forest-village' && r.toVillageId === 'mountain-village'
    );
    const mountainToForest = routes.find(r => 
      r.fromVillageId === 'mountain-village' && r.toVillageId === 'forest-village'
    );
    
    expect(forestToMountain).toBeTruthy();
    expect(mountainToForest).toBeTruthy();
  });

  it('should create advanced trade routes', () => {
    const routes = seedAdvancedTradeRoutes(mockVillageConfigs);
    expect(routes.length).toBeGreaterThan(0);
    
    // Should have specialized resources based on village names
    const forestRoute = routes.find(r => r.fromVillageId === 'forest-village');
    expect(forestRoute?.sendResources).toHaveProperty('wood');
  });

  it('should create high-risk trade routes', () => {
    const routes = seedHighRiskTradeRoutes(mockVillageConfigs);
    expect(routes.length).toBeGreaterThan(0);
    
    // All routes should have high risk
    routes.forEach(route => {
      expect(route.risk).toBeGreaterThan(0.3);
    });
  });

  it('should create all seed types', () => {
    const routes = seedTradeRoutes(mockVillageConfigs);
    expect(routes.length).toBeGreaterThan(0);
    
    // Should contain routes from all seed functions
    const basicRoutes = routes.filter((r: TradeRoute) => r.id.startsWith('trade-'));
    const highRiskRoutes = routes.filter((r: TradeRoute) => r.id.startsWith('high-risk-trade-'));
    
    expect(basicRoutes.length).toBeGreaterThan(0);
    expect(highRiskRoutes.length).toBeGreaterThan(0);
  });
});
