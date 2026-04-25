/**
 * Mock multi-village scheduler for testing useMultiVillageController
 * 
 * Provides mock implementations of scheduler functions for testing
 * without requiring the actual scheduler implementation.
 */

import type { 
  VillageConfig, 
  VillageSummary, 
  GlobalResources, 
  TradeRoute, 
  TradeResult, 
  MigrationRequest 
} from '@/ui/idleVillage/state/VillageRegistry';

/**
 * Mock multi-village scheduler for testing.
 */
export class MockMultiVillageScheduler {
  private villages: Map<string, VillageConfig> = new Map();
  private activeVillageId: string | null = null;
  private globalResources: GlobalResources;
  private tradeRoutes: Map<string, TradeRoute> = new Map();
  private migrationQueue: MigrationRequest[] = [];
  private resourceTransfers: Array<{
    fromVillageId: string;
    toVillageId: string;
    resourceId: string;
    amount: number;
    timestamp: number;
  }> = [];

  constructor(
    initialVillages: VillageConfig[] = [],
    initialGlobalResources: GlobalResources
  ) {
    // Initialize villages
    initialVillages.forEach(village => {
      this.villages.set(village.id, village);
    });
    
    this.globalResources = { ...initialGlobalResources };
  }

  /**
   * Get all village configurations.
   */
  getVillageConfigs(): VillageConfig[] {
    return Array.from(this.villages.values());
  }

  /**
   * Get global resources.
   */
  getGlobalResources(): GlobalResources {
    return { ...this.globalResources };
  }

  /**
   * Set active village.
   */
  setActiveVillage(villageId: string): boolean {
    if (!this.villages.has(villageId)) {
      return false;
    }
    
    this.activeVillageId = villageId;
    return true;
  }

  /**
   * Get active village ID.
   */
  getActiveVillageId(): string | null {
    return this.activeVillageId;
  }

  /**
   * Add a new village.
   */
  addVillage(village: VillageConfig): boolean {
    if (this.villages.has(village.id)) {
      return false;
    }
    
    this.villages.set(village.id, village);
    return true;
  }

  /**
   * Remove a village.
   */
  removeVillage(villageId: string): boolean {
    if (!this.villages.has(villageId)) {
      return false;
    }
    
    if (this.activeVillageId === villageId) {
      this.activeVillageId = null;
    }
    
    this.villages.delete(villageId);
    return true;
  }

  /**
   * Get village summaries.
   */
  getVillageSummaries(): VillageSummary[] {
    return Array.from(this.villages.values()).map(village => ({
      id: village.id,
      name: village.name,
      currentResources: village.initialResources,
      population: village.initialPopulation,
      activeActivities: village.activitySlots.length,
      status: village.id === this.activeVillageId ? 'active' : 'inactive',
    }));
  }

  /**
   * Transfer resources between villages.
   */
  transferResource(
    fromVillageId: string, 
    toVillageId: string, 
    resourceId: string, 
    amount: number
  ): boolean {
    if (!this.villages.has(fromVillageId) || !this.villages.has(toVillageId)) {
      return false;
    }
    
    const fromVillage = this.villages.get(fromVillageId)!;
    const toVillage = this.villages.get(toVillageId)!;
    
    const currentFromAmount = fromVillage.initialResources[resourceId] || 0;
    if (currentFromAmount < amount) {
      return false;
    }
    
    // Update resources
    fromVillage.initialResources[resourceId] = currentFromAmount - amount;
    toVillage.initialResources[resourceId] = (toVillage.initialResources[resourceId] || 0) + amount;
    
    // Record transfer for tracking
    this.resourceTransfers.push({
      fromVillageId,
      toVillageId,
      resourceId,
      amount,
      timestamp: Date.now(),
    });
    
    return true;
  }

  /**
   * Create a trade route.
   */
  createTradeRoute(route: TradeRoute): boolean {
    if (this.tradeRoutes.has(route.id)) {
      return false;
    }
    
    if (!this.villages.has(route.fromVillageId) || !this.villages.has(route.toVillageId)) {
      return false;
    }
    
    this.tradeRoutes.set(route.id, route);
    return true;
  }

  /**
   * Execute a trade route.
   */
  executeTradeRoute(routeId: string): TradeResult | null {
    const route = this.tradeRoutes.get(routeId);
    if (!route) {
      return null;
    }
    
    const success = Math.random() > route.risk;
    const result: TradeResult = {
      success,
      routeId: route.id,
      executedAt: Date.now(),
      resourcesSent: route.sendResources,
      resourcesReceived: route.receiveResources,
      riskEvent: !success ? 'Trade route failed due to risk event' : undefined,
    };
    
    // Update resources if successful
    if (success) {
      const fromVillage = this.villages.get(route.fromVillageId)!;
      const toVillage = this.villages.get(route.toVillageId)!;
      
      // Deduct sent resources
      for (const [resourceId, amount] of Object.entries(route.sendResources)) {
        const current = fromVillage.initialResources[resourceId] || 0;
        fromVillage.initialResources[resourceId] = Math.max(0, current - (amount as number));
      }
      
      // Add received resources
      for (const [resourceId, amount] of Object.entries(route.receiveResources)) {
        const current = toVillage.initialResources[resourceId] || 0;
        toVillage.initialResources[resourceId] = current + amount;
      }
    }
    
    return result;
  }

  /**
   * Get all trade routes.
   */
  getTradeRoutes(): TradeRoute[] {
    return Array.from(this.tradeRoutes.values());
  }

  /**
   * Create a migration request.
   */
  createMigrationRequest(
    residentId: string,
    fromVillageId: string,
    toVillageId: string
  ): MigrationRequest {
    const request: MigrationRequest = {
      id: `migration-${Date.now()}-${residentId}`,
      residentId,
      fromVillageId,
      toVillageId,
      timeRemaining: 5,
      costPaid: { gold: 50 },
    };
    
    this.migrationQueue.push(request);
    return request;
  }

  /**
   * Get migration queue.
   */
  getMigrationQueue(): MigrationRequest[] {
    return [...this.migrationQueue];
  }

  /**
   * Process migration queue.
   */
  processMigrationQueue(): void {
    this.migrationQueue = this.migrationQueue.filter(request => {
      request.timeRemaining--;
      return request.timeRemaining > 0;
    });
  }

  /**
   * Get resource transfer history.
   */
  getResourceTransferHistory(): Array<{
    fromVillageId: string;
    toVillageId: string;
    resourceId: string;
    amount: number;
    timestamp: number;
  }> {
    return [...this.resourceTransfers];
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.villages.clear();
    this.activeVillageId = null;
    this.tradeRoutes.clear();
    this.migrationQueue = [];
    this.resourceTransfers = [];
  }
}

/**
 * Mock validation functions for testing.
 */
export const mockValidation = {
  validateVillageConfig: (config: VillageConfig): boolean => {
    return !!(
      config.id && 
      config.name && 
      config.initialResources && 
      config.initialPopulation > 0 &&
      config.activitySlots.length > 0
    );
  },

  validateTradeRoute: (route: TradeRoute): boolean => {
    return !!(
      route.id &&
      route.fromVillageId &&
      route.toVillageId &&
      route.duration > 0 &&
      route.risk >= 0 &&
      route.risk <= 1
    );
  },

  validateTradeRouteExecution: (route: TradeRoute): boolean => {
    return mockValidation.validateTradeRoute(route);
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

  createMigrationRequest: (
    residentId: string,
    fromVillageId: string,
    toVillageId: string
  ): MigrationRequest => {
    return {
      id: `migration-${Date.now()}-${residentId}`,
      residentId,
      fromVillageId,
      toVillageId,
      timeRemaining: 5,
      costPaid: { gold: 50 },
    };
  },
};

/**
 * Mock performance monitoring for testing.
 */
export const mockPerformance = {
  getOperationMetrics: () => ({
    totalOperations: 0,
    averageExecutionTime: 0,
    errorRate: 0,
    lastOperationTime: 0,
  }),

  recordOperation: (operation: string, duration: number, success: boolean): void => {
    // Mock implementation would record metrics
    console.log(`Operation: ${operation}, Duration: ${duration}ms, Success: ${success}`);
  },

  resetMetrics: (): void => {
    // Mock implementation would reset metrics
    console.log('Performance metrics reset');
  },
};

/**
 * Mock telemetry for testing.
 */
export const mockTelemetry = {
  emitEvent: (eventName: string, data: unknown): void => {
    // Mock implementation would emit telemetry
    console.log(`Telemetry Event: ${eventName}`, data);
  },

  emitError: (error: Error, context: string): void => {
    // Mock implementation would emit error telemetry
    console.error(`Error in ${context}:`, error);
  },

  emitPerformanceMetric: (metric: string, value: number): void => {
    // Mock implementation would emit performance telemetry
    console.log(`Performance: ${metric}: ${value}`);
  },
};

/**
 * Mock persistence for testing.
 */
export const mockPersistence = {
  saveData: async (key: string, data: unknown): Promise<boolean> => {
    // Mock implementation would save data
    console.log(`Save ${key}:`, data);
    return true;
  },

  loadData: async <T>(key: string, defaultValue: T): Promise<T> => {
    // Mock implementation would load data
    console.log(`Load ${key}:`, defaultValue);
    return defaultValue;
  },

  clearData: async (key: string): Promise<boolean> => {
    // Mock implementation would clear data
    console.log(`Clear ${key}`);
    return true;
  },
};

/**
 * Mock error handling for testing.
 */
export const mockErrorHandler = {
  handleError: (error: Error, context: string): void => {
    console.error(`Error in ${context}:`, error);
  },

  logWarning: (message: string, context: string): void => {
    console.warn(`Warning in ${context}: ${message}`);
  },

  logInfo: (message: string, context: string): void => {
    console.log(`Info in ${context}: ${message}`);
  },
};

/**
 * Mock async operations for testing.
 */
export const mockAsyncOperations = {
  simulateAsyncOperation: async <T>(
    operation: () => Promise<T>,
    delayMs: number = 0
  ): Promise<T> => {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return operation();
  },

  simulateAsyncFailure: async <T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> => {
    await new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), 100);
    });
    return operation();
  },

  simulateConcurrentOperations: async <T>(
    operations: Array<() => Promise<T>>,
    maxConcurrency: number = 3
  ): Promise<T[]> => {
    const results: T[] = [];
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    return results;
  },
};

/**
 * Mock state management for testing.
 */
export const mockStateManagement = {
  getSnapshot: (): string => {
    // Mock implementation would return state snapshot
    return JSON.stringify({
      villages: Array.from(mockVillageScheduler.getVillageConfigs()),
      activeVillageId: mockVillageScheduler.getActiveVillageId(),
      globalResources: mockVillageScheduler.getGlobalResources(),
      tradeRoutes: mockVillageScheduler.getTradeRoutes(),
      migrationQueue: mockVillageScheduler.getMigrationQueue(),
      timestamp: Date.now(),
    });
  },

  restoreSnapshot: (snapshot: string): boolean => {
    // Mock implementation would restore state from snapshot
    try {
      const parsedData = JSON.parse(snapshot);
      // Mock implementation would restore state from parsedData
      console.log('State restored from snapshot');
      return true;
    } catch (error) {
      console.error('Failed to restore state from snapshot:', error);
      return false;
    }
  },

  validateState: (): boolean => {
    // Mock implementation would validate state consistency
    return mockVillageScheduler.getVillageConfigs().length > 0;
  },
};

/**
 * Mock village configurations for testing.
 */
export const mockVillageConfigs: VillageConfig[] = [
  {
    id: 'village-alpha',
    name: 'Alpha Village',
    initialResources: { gold: 100, food: 50, wood: 30 },
    initialPopulation: 5,
    activitySlots: [],
  },
  {
    id: 'village-beta',
    name: 'Beta Village',
    initialResources: { gold: 80, food: 40, stone: 25 },
    initialPopulation: 4,
    activitySlots: [],
  },
  {
    id: 'village-gamma',
    name: 'Gamma Village',
    initialResources: { gold: 60, food: 30, herbs: 20 },
    initialPopulation: 3,
    activitySlots: [],
  },
];

/**
 * Mock global resources for testing.
 */
export const mockGlobalResources: GlobalResources = {
  gold: 240,
  food: 120,
  wood: 30,
  stone: 25,
  herbs: 20,
};

// Create a default instance for testing
export const mockVillageScheduler = new MockMultiVillageScheduler(mockVillageConfigs, mockGlobalResources);

/**
 * Mock configuration for testing.
 */
export const mockConfiguration = {
  testVillageConfigs: mockVillageConfigs,
  testGlobalResources: mockGlobalResources,
  testTradeRoutes: [
    {
      id: 'test-route-1',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-beta',
      sendResources: { gold: 50, food: 25 },
      receiveResources: { stone: 30, wood: 15 },
      duration: 2,
      risk: 0.1,
    },
    {
      id: 'test-route-2',
      fromVillageId: 'village-beta',
      toVillageId: 'village-gamma',
      sendResources: { food: 30, herbs: 15 },
      receiveResources: { gold: 20, potions: 10 },
      duration: 3,
      risk: 0.3,
    },
  ],
  testMigrationRequests: [
    {
      id: 'test-migration-1',
      residentId: 'resident-1',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-beta',
      timeRemaining: 5,
      costPaid: { gold: 50 },
    },
    {
      id: 'test-migration-2',
      residentId: 'resident-2',
      fromVillageId: 'village-beta',
      toVillageId: 'village-gamma',
      timeRemaining: 3,
      costPaid: { gold: 75 },
    },
  ],
  testScenarios: {
    singleVillage: {
      name: 'Single Village Operations',
      description: 'Test basic single village operations',
      testCases: ['selectVillage', 'addVillage', 'removeVillage', 'transferResource'],
    },
    multiVillage: {
      name: 'Multi-Village Operations',
      description: 'Test multi-village interactions',
      testCases: ['switchVillage', 'createTradeRoute', 'executeTradeRoute', 'migrationRequest'],
    },
    edgeCases: {
      name: 'Edge Cases',
      description: 'Test edge cases and error conditions',
      testCases: ['emptyVillages', 'invalidOperations', 'concurrentOperations'],
    },
    performance: {
      name: 'Performance Tests',
      description: 'Test performance characteristics',
      testCases: ['largeVillageSet', 'rapidStateChanges', 'resourceDepletion'],
    },
  },
};
