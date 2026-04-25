import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMultiVillageController } from '../useMultiVillageController';
import {
  DEFAULT_VILLAGE_CONFIGS,
  DEFAULT_GLOBAL_RESOURCES,
  VillageRegistry,
  type VillageConfig,
  type VillageSummary,
  type GlobalResources,
  type TradeRoute,
  type TradeResult,
  type MigrationRequest,
} from '@/ui/idleVillage/state/VillageRegistry';

// Mock VillageRegistry for testing
vi.mock('@/ui/idleVillage/state/VillageRegistry');

// Mock data for testing
const mockVillageConfigs: VillageConfig[] = [
  {
    id: 'village-alpha',
    name: 'Alpha Village',
    description: 'Primary village with abundant resources',
    initialResources: { gold: 1000, food: 500, wood: 300 },
    initialPopulation: 50,
    activitySlots: ['slot-1', 'slot-2', 'slot-3'],
    traits: ['resource-rich', 'trade-hub'],
  },
  {
    id: 'village-beta',
    name: 'Beta Village',
    description: 'Secondary village with specialized production',
    initialResources: { gold: 500, food: 800, stone: 600 },
    initialPopulation: 30,
    activitySlots: ['slot-1', 'slot-2'],
    traits: ['production-focused'],
  },
  {
    id: 'village-gamma',
    name: 'Gamma Village',
    description: 'Remote village with unique resources',
    initialResources: { gold: 300, food: 400, herbs: 200 },
    initialPopulation: 20,
    activitySlots: ['slot-1'],
    traits: ['remote', 'herbalist'],
  },
];

const mockGlobalResources: GlobalResources = {
  gold: 1800,
  pools: { potions: 10, artifacts: 5 },
  migrationCosts: { gold: 100, food: 50 },
};

// Mock VillageRegistry implementation
const mockVillageRegistry = {
  getVillageConfigs: () => mockVillageConfigs,
  getGlobalResources: () => mockGlobalResources,
  validateVillageConfig: (config: VillageConfig) => {
    return config.id && config.name && config.initialResources && config.initialPopulation > 0;
  },
  validateTradeRoute: (route: TradeRoute) => {
    return route.id && route.fromVillageId && route.toVillageId && route.duration > 0;
  },
  calculateTradeResult: (route: TradeRoute): TradeResult => {
    const success = Math.random() > route.risk;
    return {
      success,
      routeId: route.id,
      executedAt: Date.now(),
      resourcesSent: route.sendResources,
      resourcesReceived: route.receiveResources,
      riskEvent: !success ? 'Trade route failed due to risk event' : undefined,
    };
  },
  createMigrationRequest: (residentId: string, fromVillageId: string, toVillageId: string): MigrationRequest => {
    return {
      id: `migration-${Date.now()}`,
      residentId,
      fromVillageId,
      toVillageId,
      timeRemaining: 5,
      costPaid: { gold: 50 },
    };
  },
};

// Setup mocks
vi.mocked(VillageRegistry).mockImplementation(mockVillageRegistry);

describe('useMultiVillageController', () => {
  let mockRegistry: typeof mockVillageRegistry;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockRegistry = vi.mocked(VillageRegistry).mockImplementation(mockVillageRegistry);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default villages and global resources', () => {
      const { result } = renderHook(() => useMultiVillageController());

      expect(result.current.getVillageSummaries()).toHaveLength(mockVillageConfigs.length);
      expect(result.current.getActiveVillageId()).toBeNull();
      expect(result.current.getGlobalResources()).toEqual(mockGlobalResources);
    });

    it('should initialize with custom villages and resources', () => {
      const customVillages = [mockVillageConfigs[0]];
      const customResources = { gold: 500, pools: {}, migrationCosts: {} };
      
      const { result } = renderHook(() => 
        useMultiVillageController({
          initialVillages: customVillages,
          initialGlobalResources: customResources,
        })
      );

      expect(result.current.getVillageSummaries()).toHaveLength(1);
      expect(result.current.getVillageSummaries()[0].id).toBe('village-alpha');
      expect(result.current.getGlobalResources()).toEqual(customResources);
    });

    it('should provide all required controller methods', () => {
      const { result } = renderHook(() => useMultiVillageController());

      expect(typeof result.current.selectVillage).toBe('function');
      expect(typeof result.current.getVillageSummaries).toBe('function');
      expect(typeof result.current.getActiveVillageId).toBe('function');
      expect(typeof result.current.getGlobalResources).toBe('function');
      expect(typeof result.current.transferResource).toBe('function');
      expect(typeof result.current.addVillage).toBe('function');
      expect(typeof result.current.removeVillage).toBe('function');
      expect(typeof result.current.createTradeRoute).toBe('function');
      expect(typeof result.current.executeTradeRoute).toBe('function');
    });

  it('should transfer resources between villages (spike implementation)', () => {
    const { result } = renderHook(() => useMultiVillageController());

    // In the spike, transferResource always returns true for valid villages
    act(() => {
      const success = result.current.transferResource('village-alpha', 'village-beta', 'gold', 10);
      expect(success).toBe(true);
    });
  });

  it('should return false for transfer with invalid villages', () => {
    const { result } = renderHook(() => useMultiVillageController());

    act(() => {
      const success = result.current.transferResource('invalid-from', 'invalid-to', 'gold', 10);
      expect(success).toBe(false);
    });
  });

  it('should add a new village', () => {
    const { result } = renderHook(() => useMultiVillageController());

    const newVillage = {
      id: 'village-gamma',
      name: 'Gamma Village',
      initialResources: { gold: 150 },
      initialPopulation: 3,
      activitySlots: ['job-basic'],
      traits: ['new'],
    };

    act(() => {
      const success = result.current.addVillage(newVillage);
      expect(success).toBe(true);
    });

    const summaries = result.current.getVillageSummaries();
    expect(summaries).toHaveLength(DEFAULT_VILLAGE_CONFIGS.length + 1);
    expect(summaries.find((s: typeof summaries[0]) => s.id === 'village-gamma')).toBeDefined();
  });

  it('should return false when adding village with existing ID', () => {
    const { result } = renderHook(() => useMultiVillageController());

    const duplicateVillage = {
      ...DEFAULT_VILLAGE_CONFIGS[0],
      name: 'Duplicate Village',
    };

    act(() => {
      const success = result.current.addVillage(duplicateVillage);
      expect(success).toBe(false);
    });
  });

  it('should remove a village', () => {
    const { result } = renderHook(() => useMultiVillageController());

    act(() => {
      const success = result.current.removeVillage('village-beta');
      expect(success).toBe(true);
    });

    const summaries = result.current.getVillageSummaries();
    expect(summaries.find((s: typeof summaries[0]) => s.id === 'village-beta')).toBeUndefined();
    expect(summaries).toHaveLength(DEFAULT_VILLAGE_CONFIGS.length - 1);
  });

  it('should not remove active village', () => {
    const { result } = renderHook(() => useMultiVillageController());

    act(() => {
      result.current.selectVillage('village-alpha');
      const success = result.current.removeVillage('village-alpha');
      expect(success).toBe(false);
    });

    const summaries = result.current.getVillageSummaries();
    expect(summaries.find((s: typeof summaries[0]) => s.id === 'village-alpha')).toBeDefined();
  });

  it('should return false when removing non-existent village', () => {
    const { result } = renderHook(() => useMultiVillageController());

    act(() => {
      const success = result.current.removeVillage('non-existent-village');
      expect(success).toBe(false);
    });
  });

  it('should create a trade route between villages', () => {
    const { result } = renderHook(() => useMultiVillageController());

    const tradeRoute = {
      id: 'trade-alpha-to-beta',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-beta',
      sendResources: { gold: 50 },
      receiveResources: { food: 25 },
      duration: 3,
      risk: 0.1,
    };

    act(() => {
      const success = result.current.createTradeRoute(tradeRoute);
      expect(success).toBe(true);
    });

    const routes = result.current.getTradeRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]).toEqual(tradeRoute);
  });

  it('should return false when creating trade route with invalid villages', () => {
    const { result } = renderHook(() => useMultiVillageController());

    const invalidRoute = {
      id: 'invalid-trade',
      fromVillageId: 'non-existent-from',
      toVillageId: 'village-alpha',
      sendResources: { gold: 10 },
      receiveResources: { food: 5 },
      duration: 2,
      risk: 0.0,
    };

    act(() => {
      const success = result.current.createTradeRoute(invalidRoute);
      expect(success).toBe(false);
    });

    expect(result.current.getTradeRoutes()).toHaveLength(0);
  });

  it('should execute a trade route successfully', () => {
    const { result } = renderHook(() => useMultiVillageController());

    const tradeRoute = {
      id: 'trade-alpha-beta',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-beta',
      sendResources: { gold: 20 },
      receiveResources: { food: 10 },
      duration: 1,
      risk: 0.0, // No risk for guaranteed success
    };

    act(() => {
      result.current.createTradeRoute(tradeRoute);
      const success = result.current.executeTradeRoute('trade-alpha-beta');
      expect(success).toBe(true);
    });

    const lastResult = result.current.getLastTradeResult();
    expect(lastResult).toBeTruthy();
    expect(lastResult?.success).toBe(true);
    expect(lastResult?.routeId).toBe('trade-alpha-beta');
    expect(lastResult?.resourcesSent).toEqual({ gold: 20 });
    expect(lastResult?.resourcesReceived).toEqual({ food: 10 });
  });

  it('should handle trade route failure due to risk', () => {
    const { result } = renderHook(() => useMultiVillageController());

    const riskyRoute = {
      id: 'risky-trade',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-beta',
      sendResources: { gold: 30 },
      receiveResources: { food: 15 },
      duration: 2,
      risk: 1.0, // 100% risk = guaranteed failure
    };

    act(() => {
      result.current.createTradeRoute(riskyRoute);
      const success = result.current.executeTradeRoute('risky-trade');
      expect(success).toBe(false);
    });

    const lastResult = result.current.getLastTradeResult();
    expect(lastResult).toBeTruthy();
    expect(lastResult?.success).toBe(false);
    expect(lastResult?.resourcesReceived).toEqual({});
    expect(lastResult?.riskEvent).toContain('ambushed');
  });

  it('should queue a migration request', () => {
    const { result } = renderHook(() => useMultiVillageController({
      initialGlobalResources: { ...DEFAULT_GLOBAL_RESOURCES, gold: 20 } // Enough for migration
    }));

    act(() => {
      const success = result.current.queueMigration('resident-1', 'village-alpha', 'village-beta');
      expect(success).toBe(true);
    });

    const queue = result.current.getMigrationQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].residentId).toBe('resident-1');
    expect(queue[0].fromVillageId).toBe('village-alpha');
    expect(queue[0].toVillageId).toBe('village-beta');
    expect(queue[0].timeRemaining).toBe(5);
  });

  it('should return false when queueing migration with insufficient funds', () => {
    const { result } = renderHook(() => useMultiVillageController({
      initialGlobalResources: { ...DEFAULT_GLOBAL_RESOURCES, gold: 5 } // Less than migration cost
    }));

    act(() => {
      const success = result.current.queueMigration('resident-1', 'village-alpha', 'village-beta');
      expect(success).toBe(false);
    });

    expect(result.current.getMigrationQueue()).toHaveLength(0);
  });

  it('should process migration tick and complete migrations', () => {
    const { result } = renderHook(() => useMultiVillageController({
      initialGlobalResources: { ...DEFAULT_GLOBAL_RESOURCES, gold: 20 } // Enough for migration
    }));

    act(() => {
      result.current.queueMigration('resident-1', 'village-alpha', 'village-beta');
    });

    // Process 5 ticks to complete migration
    let completed: MigrationRequest[] = [];
    for (let i = 0; i < 5; i++) {
      act(() => {
        completed = result.current.processMigrationTick();
      });
    }

    expect(completed).toHaveLength(1);
    expect(completed[0].residentId).toBe('resident-1');
    expect(result.current.getMigrationQueue()).toHaveLength(0);
  });
});
