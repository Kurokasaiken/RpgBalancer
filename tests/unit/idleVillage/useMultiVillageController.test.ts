/**
 * Multi-Village Controller Test Matrix
 * 
 * Comprehensive test suite for useMultiVillageController with deterministic
 * scheduler, drop feedback states, and worker telemetry hooks.
 * 
 * @module useMultiVillageController.test
 * @since 2026-01-12
 * @author Aurora-QA
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiVillageController } from '@/ui/idleVillage/hooks/useMultiVillageController';
import type { VillageConfig, TradeRoute } from '@/ui/idleVillage/state/VillageRegistry';

// Mock VillageRegistry for deterministic testing
vi.mock('@/ui/idleVillage/state/VillageRegistry', () => ({
  VillageRegistry: class {
    private villages: Map<string, any> = new Map();
    private activeVillageId: string | null = null;
    private globalResources: any = {};
    private tradeRoutes: Map<string, any> = new Map();
    private migrationQueue: any[] = [];
    private lastTradeResult: any = null;

    constructor(villages: any[] = [], resources: any = {}) {
      villages.forEach(village => {
        this.villages.set(village.id, { ...village, currentResources: { ...village.initialResources } });
      });
      this.globalResources = { ...resources };
    }

    setActiveVillage(villageId: string): boolean {
      if (this.villages.has(villageId)) {
        this.activeVillageId = villageId;
        return true;
      }
      return false;
    }

    getVillageSummaries() {
      return Array.from(this.villages.values());
    }

    transferResource(fromVillageId: string, toVillageId: string, resourceId: string, amount: number): boolean {
      const fromVillage = this.villages.get(fromVillageId);
      const toVillage = this.villages.get(toVillageId);
      
      if (!fromVillage || !toVillage) return false;
      if ((fromVillage.currentResources[resourceId] || 0) < amount) return false;
      
      fromVillage.currentResources[resourceId] = (fromVillage.currentResources[resourceId] || 0) - amount;
      toVillage.currentResources[resourceId] = (toVillage.currentResources[resourceId] || 0) + amount;
      
      return true;
    }

    getActiveVillageId(): string | null {
      return this.activeVillageId;
    }

    getGlobalResources() {
      return this.globalResources;
    }

    addVillage(village: any): boolean {
      if (this.villages.has(village.id)) return false;
      this.villages.set(village.id, { ...village, currentResources: { ...village.initialResources } });
      return true;
    }

    removeVillage(villageId: string): boolean {
      if (!this.villages.has(villageId)) return false;
      this.villages.delete(villageId);
      if (this.activeVillageId === villageId) {
        this.activeVillageId = null;
      }
      return true;
    }

    createTradeRoute(route: any): boolean {
      if (this.tradeRoutes.has(route.id)) return false;
      this.tradeRoutes.set(route.id, route);
      return true;
    }

    executeTradeRoute(routeId: string): boolean {
      const route = this.tradeRoutes.get(routeId);
      if (!route) return false;
      
      const success = this.transferResource(route.fromVillageId, route.toVillageId, 'gold', 10);
      this.lastTradeResult = { routeId, success, timestamp: Date.now() };
      return success;
    }

    queueMigration(residentId: string, fromVillageId: string, toVillageId: string): boolean {
      const fromVillage = this.villages.get(fromVillageId);
      const toVillage = this.villages.get(toVillageId);
      
      if (!fromVillage || !toVillage) return false;
      
      this.migrationQueue.push({
        id: `migration-${Date.now()}-${Math.random()}`,
        residentId,
        fromVillageId,
        toVillageId,
        timeRemaining: 5,
        costPaid: { gold: 50 }
      });
      return true;
    }

    processMigrationTick(): any[] {
      const completed: any[] = [];
      this.migrationQueue = this.migrationQueue.filter(migration => {
        migration.timeRemaining--;
        if (migration.timeRemaining <= 0) {
          completed.push(migration);
          return false;
        }
        return true;
      });
      return completed;
    }

    getTradeRoutes() {
      return Array.from(this.tradeRoutes.values());
    }

    getMigrationQueue() {
      return [...this.migrationQueue];
    }

    getLastTradeResult() {
      return this.lastTradeResult;
    }

    clear() {
      this.villages.clear();
      this.activeVillageId = null;
      this.globalResources = {};
      this.tradeRoutes.clear();
      this.migrationQueue = [];
      this.lastTradeResult = null;
    }
  },
  DEFAULT_VILLAGE_CONFIGS: [],
  DEFAULT_GLOBAL_RESOURCES: {},
}));

describe('useMultiVillageController - Test Matrix', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Basic Village Operations', () => {
    it('should initialize with default villages and resources', () => {
      const { result } = renderHook(() => useMultiVillageController());

      expect(result.current.getVillageSummaries()).toHaveLength(0);
      expect(result.current.getGlobalResources()).toEqual({});
      expect(result.current.getActiveVillageId()).toBeNull();
    });

    it('should select active village successfully', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.selectVillage('village-alpha');
        expect(success).toBe(true);
      });

      expect(result.current.getActiveVillageId()).toBe('village-alpha');
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'village_selected',
        expect.objectContaining({ villageId: 'village-alpha' })
      );
    });

    it('should fail to select non-existent village', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.selectVillage('non-existent');
        expect(success).toBe(false);
      });

      expect(result.current.getActiveVillageId()).toBeNull();
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'selectVillage'
      );
    });

    it('should add new village successfully', () => {
      const { result } = renderHook(() => useMultiVillageController());
      const newVillage: VillageConfig = {
        id: 'village-delta',
        name: 'Delta Village',
        initialResources: { gold: 50, food: 25 },
        initialPopulation: 2,
        activitySlots: [],
      };

      act(() => {
        const success = result.current.addVillage(newVillage);
        expect(success).toBe(true);
      });

      const summaries = result.current.getVillageSummaries();
      expect(summaries).toHaveLength(4);
      expect(summaries.find(s => s.id === 'village-delta')).toBeDefined();
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'village_added',
        expect.objectContaining({ villageId: 'village-delta' })
      );
    });

    it('should remove village successfully', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.removeVillage('village-gamma');
        expect(success).toBe(true);
      });

      const summaries = result.current.getVillageSummaries();
      expect(summaries).toHaveLength(2);
      expect(summaries.find(s => s.id === 'village-gamma')).toBeUndefined();
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'village_removed',
        expect.objectContaining({ villageId: 'village-gamma' })
      );
    });

    it('should handle removing active village', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.selectVillage('village-alpha');
        result.current.removeVillage('village-alpha');
      });

      expect(result.current.getActiveVillageId()).toBeNull();
    });
  });

  describe('Resource Transfer Operations', () => {
    beforeEach(() => {
      // Set up active village for resource operations
      mockScheduler.setActiveVillage('village-alpha');
    });

    it('should transfer resources between villages successfully', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.transferResource(
          'village-alpha',
          'village-beta',
          'gold',
          20
        );
        expect(success).toBe(true);
      });

      const summaries = result.current.getVillageSummaries();
      const alphaVillage = summaries.find(s => s.id === 'village-alpha');
      const betaVillage = summaries.find(s => s.id === 'village-beta');

      expect(alphaVillage?.currentResources.gold).toBe(80);
      expect(betaVillage?.currentResources.gold).toBe(100);
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'resource_transferred',
        expect.objectContaining({
          fromVillageId: 'village-alpha',
          toVillageId: 'village-beta',
          resourceId: 'gold',
          amount: 20,
        })
      );
    });

    it('should fail transfer with insufficient resources', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.transferResource(
          'village-alpha',
          'village-beta',
          'gold',
          200 // More than available
        );
        expect(success).toBe(false);
      });

      const summaries = result.current.getVillageSummaries();
      const alphaVillage = summaries.find(s => s.id === 'village-alpha');
      expect(alphaVillage?.currentResources.gold).toBe(100); // Unchanged
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'transferResource'
      );
    });

    it('should fail transfer with non-existent villages', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.transferResource(
          'non-existent',
          'village-beta',
          'gold',
          10
        );
        expect(success).toBe(false);
      });

      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'transferResource'
      );
    });
  });

  describe('Trade Route Operations', () => {
    it('should create trade route successfully', () => {
      const { result } = renderHook(() => useMultiVillageController());
      const tradeRoute: TradeRoute = {
        id: 'test-route-1',
        fromVillageId: 'village-alpha',
        toVillageId: 'village-beta',
        sendResources: { gold: 20, food: 10 },
        receiveResources: { stone: 15, wood: 10 },
        duration: 2,
        risk: 0.1,
      };

      act(() => {
        const success = result.current.createTradeRoute(tradeRoute);
        expect(success).toBe(true);
      });

      const routes = result.current.getTradeRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]).toEqual(tradeRoute);
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'trade_route_created',
        expect.objectContaining({ routeId: 'test-route-1' })
      );
    });

    it('should fail to create duplicate trade route', () => {
      const { result } = renderHook(() => useMultiVillageController());
      const tradeRoute: TradeRoute = {
        id: 'test-route-1',
        fromVillageId: 'village-alpha',
        toVillageId: 'village-beta',
        sendResources: { gold: 20 },
        receiveResources: { stone: 15 },
        duration: 2,
        risk: 0.1,
      };

      act(() => {
        result.current.createTradeRoute(tradeRoute);
        const success = result.current.createTradeRoute(tradeRoute);
        expect(success).toBe(false);
      });

      const routes = result.current.getTradeRoutes();
      expect(routes).toHaveLength(1);
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'createTradeRoute'
      );
    });

    it('should execute trade route successfully', () => {
      const { result } = renderHook(() => useMultiVillageController());
      const tradeRoute: TradeRoute = {
        id: 'test-route-1',
        fromVillageId: 'village-alpha',
        toVillageId: 'village-beta',
        sendResources: { gold: 20 },
        receiveResources: { stone: 15 },
        duration: 2,
        risk: 0.1,
      };

      act(() => {
        result.current.createTradeRoute(tradeRoute);
        const success = result.current.executeTradeRoute('test-route-1');
        expect(success).toBe(true);
      });

      const lastResult = result.current.getLastTradeResult();
      expect(lastResult).toBeDefined();
      expect(lastResult?.routeId).toBe('test-route-1');
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'trade_route_executed',
        expect.objectContaining({ routeId: 'test-route-1' })
      );
    });

    it('should fail to execute non-existent trade route', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.executeTradeRoute('non-existent');
        expect(success).toBe(false);
      });

      expect(result.current.getLastTradeResult()).toBeNull();
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'executeTradeRoute'
      );
    });
  });

  describe('Migration Operations', () => {
    it('should queue migration request successfully', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const success = result.current.queueMigration(
          'resident-1',
          'village-alpha',
          'village-beta'
        );
        expect(success).toBe(true);
      });

      const queue = result.current.getMigrationQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        residentId: 'resident-1',
        fromVillageId: 'village-alpha',
        toVillageId: 'village-beta',
      });
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'migration_queued',
        expect.objectContaining({
          residentId: 'resident-1',
          fromVillageId: 'village-alpha',
          toVillageId: 'village-beta',
        })
      );
    });

    it('should process migration tick and remove completed migrations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.queueMigration('resident-1', 'village-alpha', 'village-beta');
        result.current.queueMigration('resident-2', 'village-beta', 'village-gamma');
        
        // Process multiple ticks to complete migrations
        const completed1 = result.current.processMigrationTick();
        const completed2 = result.current.processMigrationTick();
        const completed3 = result.current.processMigrationTick();
        const completed4 = result.current.processMigrationTick();
        const completed5 = result.current.processMigrationTick();
        
        expect(completed1).toHaveLength(0);
        expect(completed2).toHaveLength(0);
        expect(completed3).toHaveLength(0);
        expect(completed4).toHaveLength(0);
        expect(completed5).toHaveLength(2); // Both completed
      });

      const queue = result.current.getMigrationQueue();
      expect(queue).toHaveLength(0);
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'migration_completed',
        expect.objectContaining({ completedCount: 2 })
      );
    });

    it('should handle empty migration queue processing', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        const completed = result.current.processMigrationTick();
        expect(completed).toHaveLength(0);
      });

      const queue = result.current.getMigrationQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('Cross-Village Drag Operations', () => {
    it('should handle drag between villages with valid drop', () => {
      const { result } = renderHook(() => useMultiVillageController());

      // Setup active village
      act(() => {
        result.current.selectVillage('village-alpha');
      });

      // Simulate cross-village drag operation
      act(() => {
        const success = result.current.transferResource(
          'village-alpha',
          'village-beta',
          'food',
          10
        );
        expect(success).toBe(true);
      });

      const summaries = result.current.getVillageSummaries();
      const alphaVillage = summaries.find(s => s.id === 'village-alpha');
      const betaVillage = summaries.find(s => s.id === 'village-beta');

      expect(alphaVillage?.currentResources.food).toBe(40);
      expect(betaVillage?.currentResources.food).toBe(50);
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'cross_village_drag_completed',
        expect.objectContaining({
          fromVillageId: 'village-alpha',
          toVillageId: 'village-beta',
          resourceType: 'food',
          amount: 10,
        })
      );
    });

    it('should handle drag with insufficient resources (blocked drop)', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.selectVillage('village-alpha');
        const success = result.current.transferResource(
          'village-alpha',
          'village-beta',
          'gold',
          150 // More than available
        );
        expect(success).toBe(false);
      });

      const summaries = result.current.getVillageSummaries();
      const alphaVillage = summaries.find(s => s.id === 'village-alpha');
      expect(alphaVillage?.currentResources.gold).toBe(100); // Unchanged
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'cross_village_drag_blocked',
        expect.objectContaining({
          reason: 'insufficient_resources',
          resourceId: 'gold',
          requestedAmount: 150,
          availableAmount: 100,
        })
      );
    });

    it('should handle drag to non-existent village (invalid drop)', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.selectVillage('village-alpha');
        const success = result.current.transferResource(
          'village-alpha',
          'non-existent',
          'food',
          10
        );
        expect(success).toBe(false);
      });

      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'cross_village_drag_invalid',
        expect.objectContaining({
          reason: 'target_village_not_found',
          targetVillageId: 'non-existent',
        })
      );
    });
  });

  describe('Stat Requirement Failures', () => {
    it('should handle village creation with invalid stats', () => {
      const { result } = renderHook(() => useMultiVillageController());
      const invalidVillage: VillageConfig = {
        id: 'invalid-village',
        name: 'Invalid Village',
        initialResources: { gold: -10, food: 0 }, // Invalid resources
        initialPopulation: 0, // Invalid population
        activitySlots: [],
      };

      act(() => {
        const success = result.current.addVillage(invalidVillage);
        expect(success).toBe(false);
      });

      const summaries = result.current.getVillageSummaries();
      expect(summaries.find(s => s.id === 'invalid-village')).toBeUndefined();
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'addVillage'
      );
    });

    it('should handle trade route creation with invalid resource amounts', () => {
      const { result } = renderHook(() => useMultiVillageController());
      const invalidRoute: TradeRoute = {
        id: 'invalid-route',
        fromVillageId: 'village-alpha',
        toVillageId: 'village-beta',
        sendResources: { gold: -5 }, // Negative amount
        receiveResources: { stone: 0 }, // Zero amount
        duration: -1, // Invalid duration
        risk: 1.5, // Invalid risk (> 1)
      };

      act(() => {
        const success = result.current.createTradeRoute(invalidRoute);
        expect(success).toBe(false);
      });

      const routes = result.current.getTradeRoutes();
      expect(routes).toHaveLength(0);
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'createTradeRoute'
      );
    });
  });

  describe('Crew Capacity Limits', () => {
    it('should respect village population limits for migrations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      // Add migrations that would exceed capacity
      act(() => {
        result.current.queueMigration('resident-1', 'village-alpha', 'village-gamma');
        result.current.queueMigration('resident-2', 'village-alpha', 'village-gamma');
        result.current.queueMigration('resident-3', 'village-alpha', 'village-gamma');
        result.current.queueMigration('resident-4', 'village-alpha', 'village-gamma');
        result.current.queueMigration('resident-5', 'village-alpha', 'village-gamma');
      });

      const queue = result.current.getMigrationQueue();
      expect(queue).toHaveLength(5);
      
      // Process migrations - should handle capacity limits
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.processMigrationTick();
        }
      });

      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'crew_capacity_limit_reached',
        expect.objectContaining({
          villageId: 'village-gamma',
          currentPopulation: 3,
          incomingMigrations: 5,
          capacityLimit: expect.any(Number),
        })
      );
    });

    it('should handle activity slot capacity in village summaries', () => {
      const { result } = renderHook(() => useMultiVillageController());
      
      const villageWithActivities: VillageConfig = {
        id: 'village-full',
        name: 'Full Village',
        initialResources: { gold: 100, food: 50 },
        initialPopulation: 5,
        activitySlots: [
          { id: 'slot-1', activityId: 'activity-1' },
          { id: 'slot-2', activityId: 'activity-2' },
          { id: 'slot-3', activityId: 'activity-3' },
          { id: 'slot-4', activityId: 'activity-4' },
          { id: 'slot-5', activityId: 'activity-5' },
        ],
      };

      act(() => {
        result.current.addVillage(villageWithActivities);
      });

      const summaries = result.current.getVillageSummaries();
      const fullVillage = summaries.find(s => s.id === 'village-full');
      expect(fullVillage?.activeActivities).toBe(5);
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'activity_capacity_warning',
        expect.objectContaining({
          villageId: 'village-full',
          activeActivities: 5,
          population: 5,
        })
      );
    });
  });

  describe('Drop Feedback States', () => {
    it('should provide valid drop feedback for successful operations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.selectVillage('village-alpha');
        const success = result.current.transferResource(
          'village-alpha',
          'village-beta',
          'gold',
          10
        );
        expect(success).toBe(true);
      });

      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'drop_feedback_valid',
        expect.objectContaining({
          feedbackType: 'valid',
          message: 'Resource transfer successful',
          sourceVillageId: 'village-alpha',
          targetVillageId: 'village-beta',
        })
      );
    });

    it('should provide invalid drop feedback for failed operations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.selectVillage('village-alpha');
        const success = result.current.transferResource(
          'village-alpha',
          'village-beta',
          'gold',
          200
        );
        expect(success).toBe(false);
      });

      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'drop_feedback_invalid',
        expect.objectContaining({
          feedbackType: 'invalid',
          message: 'Insufficient resources',
          sourceVillageId: 'village-alpha',
          targetVillageId: 'village-beta',
          resourceId: 'gold',
          requestedAmount: 200,
          availableAmount: 100,
        })
      );
    });

    it('should provide warning drop feedback for risky operations', () => {
      const { result } = renderHook(() => useMultiVillageController());
      const riskyRoute: TradeRoute = {
        id: 'risky-route',
        fromVillageId: 'village-alpha',
        toVillageId: 'village-beta',
        sendResources: { gold: 50 },
        receiveResources: { stone: 40 },
        duration: 2,
        risk: 0.8, // High risk
      };

      act(() => {
        result.current.createTradeRoute(riskyRoute);
        result.current.executeTradeRoute('risky-route');
      });

      const lastResult = result.current.getLastTradeResult();
      if (!lastResult?.success) {
        expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
          'drop_feedback_warning',
          expect.objectContaining({
            feedbackType: 'warning',
            message: 'High risk trade route',
            riskLevel: 0.8,
          })
        );
      }
    });

    it('should provide blocked drop feedback for prohibited operations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Try to remove active village while it has resources
        result.current.selectVillage('village-alpha');
        const success = result.current.removeVillage('village-alpha');
        expect(success).toBe(true); // Should succeed but with warning
      });

      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'drop_feedback_blocked',
        expect.objectContaining({
          feedbackType: 'blocked',
          message: 'Cannot remove active village with resources',
          villageId: 'village-alpha',
          resources: expect.any(Object),
        })
      );
    });
  });

  describe('Worker Telemetry Hooks', () => {
    it('should emit telemetry events for all operations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Village operations
        result.current.selectVillage('village-alpha');
        result.current.addVillage({
          id: 'village-new',
          name: 'New Village',
          initialResources: { gold: 50 },
          initialPopulation: 2,
          activitySlots: [],
        });

        // Resource operations
        result.current.transferResource('village-alpha', 'village-beta', 'gold', 10);

        // Trade operations
        result.current.createTradeRoute({
          id: 'new-route',
          fromVillageId: 'village-alpha',
          toVillageId: 'village-beta',
          sendResources: { food: 10 },
          receiveResources: { stone: 8 },
          duration: 1,
          risk: 0.1,
        });

        // Migration operations
        result.current.queueMigration('resident-1', 'village-alpha', 'village-beta');
      });

      // Verify telemetry events were emitted
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith('village_selected', expect.any(Object));
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith('village_added', expect.any(Object));
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith('resource_transferred', expect.any(Object));
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith('trade_route_created', expect.any(Object));
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith('migration_queued', expect.any(Object));
    });

    it('should emit performance metrics for operations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Perform multiple operations to generate performance data
        for (let i = 0; i < 10; i++) {
          result.current.transferResource('village-alpha', 'village-beta', 'gold', 1);
        }
      });

      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'performance_metrics',
        expect.objectContaining({
          operationType: 'resource_transfer',
          operationCount: 10,
          averageExecutionTime: expect.any(Number),
          successRate: expect.any(Number),
        })
      );
    });

    it('should emit error telemetry for failed operations', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Trigger various error conditions
        result.current.selectVillage('non-existent');
        result.current.transferResource('village-alpha', 'village-beta', 'gold', 1000);
        result.current.executeTradeRoute('non-existent');
      });

      expect(mockTelemetry.emitError).toHaveBeenCalledTimes(3);
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'selectVillage'
      );
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'transferResource'
      );
      expect(mockTelemetry.emitError).toHaveBeenCalledWith(
        expect.any(Error),
        'executeTradeRoute'
      );
    });
  });

  describe('Deterministic Scheduler Behavior', () => {
    it('should provide consistent results for identical operations', () => {
      const { result: result1 } = renderHook(() => useMultiVillageController());
      const { result: result2 } = renderHook(() => useMultiVillageController());

      // Perform identical operations
      act(() => {
        result1.current.selectVillage('village-alpha');
        result1.current.transferResource('village-alpha', 'village-beta', 'gold', 10);

        result2.current.selectVillage('village-alpha');
        result2.current.transferResource('village-alpha', 'village-beta', 'gold', 10);
      });

      const summaries1 = result1.current.getVillageSummaries();
      const summaries2 = result2.current.getVillageSummaries();

      expect(summaries1).toEqual(summaries2);
    });

    it('should maintain state consistency across re-renders', () => {
      const { result, rerender } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.selectVillage('village-alpha');
        result.current.addVillage({
          id: 'village-consistency',
          name: 'Consistency Test',
          initialResources: { gold: 75 },
          initialPopulation: 3,
          activitySlots: [],
        });
      });

      // Re-render and verify state is maintained
      rerender();

      expect(result.current.getActiveVillageId()).toBe('village-alpha');
      expect(result.current.getVillageSummaries()).toHaveLength(4);
      expect(result.current.getVillageSummaries().find(s => s.id === 'village-consistency')).toBeDefined();
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large numbers of villages efficiently', () => {
      const { result } = renderHook(() => useMultiVillageController());

      // Add many villages
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addVillage({
            id: `village-${i}`,
            name: `Village ${i}`,
            initialResources: { gold: 100, food: 50 },
            initialPopulation: 5,
            activitySlots: [],
          });
        }
      });

      const summaries = result.current.getVillageSummaries();
      expect(summaries).toHaveLength(53); // 3 initial + 50 added

      // Operations should still be fast
      const startTime = performance.now();
      act(() => {
        result.current.selectVillage('village-25');
        result.current.transferResource('village-25', 'village-26', 'gold', 10);
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle concurrent operations gracefully', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Simulate concurrent operations
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            new Promise<void>((resolve) => {
              act(() => {
                result.current.transferResource(`village-${i % 3}`, `village-${(i + 1) % 3}`, 'gold', 1);
                resolve();
              });
            })
          );
        }
        
        // Wait for all operations to complete
        Promise.all(promises);
      });

      // State should be consistent
      const summaries = result.current.getVillageSummaries();
      expect(summaries).toHaveLength(3);
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'concurrent_operations_completed',
        expect.objectContaining({
          operationCount: 10,
          successCount: expect.any(Number),
        })
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty village list gracefully', () => {
      const { result } = renderHook(() => useMultiVillageController({
        initialVillages: [],
        initialGlobalResources: { gold: 0, food: 0, wood: 0, stone: 0, herbs: 0 },
      }));

      expect(result.current.getVillageSummaries()).toHaveLength(0);
      expect(result.current.getActiveVillageId()).toBeNull();
      expect(result.current.getGlobalResources()).toEqual({ gold: 0, food: 0, wood: 0, stone: 0, herbs: 0 });
    });

    it('should handle malformed input gracefully', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Try various malformed operations
        expect(result.current.selectVillage('')).toBe(false);
        expect(result.current.transferResource('', '', '', -1)).toBe(false);
        expect(result.current.removeVillage('')).toBe(false);
      });

      // Should not crash and should emit appropriate error telemetry
      expect(mockTelemetry.emitError).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid state changes without corruption', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Rapidly change active village
        result.current.selectVillage('village-alpha');
        result.current.selectVillage('village-beta');
        result.current.selectVillage('village-gamma');
        result.current.selectVillage('village-alpha');

        // Rapid resource transfers
        result.current.transferResource('village-alpha', 'village-beta', 'gold', 5);
        result.current.transferResource('village-beta', 'village-gamma', 'gold', 3);
        result.current.transferResource('village-gamma', 'village-alpha', 'gold', 2);
      });

      // State should be consistent
      const summaries = result.current.getVillageSummaries();
      expect(result.current.getActiveVillageId()).toBe('village-alpha');
      expect(summaries).toHaveLength(3);
      
      // Total gold should be conserved
      const totalGold = summaries.reduce((sum, village) => sum + (village.currentResources.gold || 0), 0);
      expect(totalGold).toBe(240); // Initial total should be preserved
    });
  });

  describe('Integration with Other Systems', () => {
    it('should work with persistence layer', async () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        result.current.selectVillage('village-alpha');
        result.current.addVillage({
          id: 'village-persist',
          name: 'Persistence Test',
          initialResources: { gold: 100 },
          initialPopulation: 3,
          activitySlots: [],
        });
      });

      // Simulate persistence save/load
      const state = {
        activeVillageId: result.current.getActiveVillageId(),
        villages: result.current.getVillageSummaries(),
        globalResources: result.current.getGlobalResources(),
        tradeRoutes: result.current.getTradeRoutes(),
        migrationQueue: result.current.getMigrationQueue(),
      };

      expect(state).toBeDefined();
      expect(state.activeVillageId).toBe('village-alpha');
      expect(state.villages).toHaveLength(4);
      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'state_persisted',
        expect.objectContaining({
          villageCount: 4,
          tradeRouteCount: 0,
          migrationQueueCount: 0,
        })
      );
    });

    it('should integrate with crew scheduler', () => {
      const { result } = renderHook(() => useMultiVillageController());

      act(() => {
        // Simulate crew scheduler integration
        result.current.selectVillage('village-alpha');
        
        // Add resident to activity (simulated through resource transfer)
        result.current.transferResource('village-alpha', 'village-beta', 'food', 5);
        
        // Queue migration (crew movement)
        result.current.queueMigration('resident-crew', 'village-alpha', 'village-beta');
      });

      expect(mockTelemetry.emitEvent).toHaveBeenCalledWith(
        'crew_scheduler_integration',
        expect.objectContaining({
          operation: 'resident_assignment',
          sourceVillage: 'village-alpha',
          targetVillage: 'village-beta',
        })
      );
    });
  });
});
