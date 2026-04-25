/**
 * Config-first village registry for multi-village architecture.
 * Manages village configurations, active village selection, and shared resources.
 */

/**
 * Configuration for a single village.
 */
export interface VillageConfig {
  /** Unique identifier for the village */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Initial resources (gold, food, etc.) */
  initialResources: Record<string, number>;
  /** Initial resident population */
  initialPopulation: number;
  /** Available activity slots */
  activitySlots: string[];
  /** Special village traits or bonuses */
  traits: string[];
}

/**
 * Trade route configuration between two villages.
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
 * Migration request in the queue.
 */
export interface MigrationRequest {
  /** Unique identifier */
  id: string;
  /** Resident ID migrating */
  residentId: string;
  /** Source village ID */
  fromVillageId: string;
  /** Target village ID */
  toVillageId: string;
  /** Time units remaining until migration completes */
  timeRemaining: number;
  /** Migration cost paid */
  costPaid: Record<string, number>;
}

/**
 * Shared global resources across all villages.
 */
export interface GlobalResources {
  /** Total gold across all villages */
  gold: number;
  /** Global resource pools (potions, artifacts, etc.) */
  pools: Record<string, number>;
  /** Migration costs and bonuses */
  migrationCosts: Record<string, number>;
}

/**
 * Summary of a village's current state.
 */
export interface VillageSummary {
  id: string;
  name: string;
  currentResources: Record<string, number>;
  population: number;
  activeActivities: number;
  status: 'active' | 'inactive' | 'locked';
}

/**
 * Village registry managing multiple villages and global state.
 */
export class VillageRegistry {
  private villages: Map<string, VillageConfig> = new Map();
  private globalResources: GlobalResources;
  private activeVillageId: string | null = null;
  private tradeRoutes: Map<string, TradeRoute> = new Map();
  private migrationQueue: MigrationRequest[] = [];
  private lastTradeResult: TradeResult | null = null;

  constructor(initialVillages: VillageConfig[], initialGlobalResources: GlobalResources) {
    for (const village of initialVillages) {
      this.villages.set(village.id, village);
    }
    this.globalResources = { ...initialGlobalResources };
  }

  /**
   * Get all available village configurations.
   */
  getAllVillages(): VillageConfig[] {
    return Array.from(this.villages.values());
  }

  /**
   * Get a specific village configuration by ID.
   */
  getVillageConfig(villageId: string): VillageConfig | undefined {
    return this.villages.get(villageId);
  }

  /**
   * Set the currently active village.
   */
  setActiveVillage(villageId: string): boolean {
    if (this.villages.has(villageId)) {
      this.activeVillageId = villageId;
      return true;
    }
    return false;
  }

  /**
   * Get the currently active village ID.
   */
  getActiveVillageId(): string | null {
    return this.activeVillageId;
  }

  /**
   * Get global resources.
   */
  getGlobalResources(): GlobalResources {
    return { ...this.globalResources };
  }

  /**
   * Transfer resources between villages (through global pool).
   */
  transferResource(fromVillageId: string, toVillageId: string, _resourceId: string, amount: number): boolean {
    const fromVillage = this.villages.get(fromVillageId);
    const toVillage = this.villages.get(toVillageId);

    if (!fromVillage || !toVillage || amount <= 0) return false;

    // In a real implementation, this would check village-specific resources
    // For spike, just validate the transfer is possible
    return true;
  }

  /**
   * Get summary of all villages.
   */
  getVillageSummaries(): VillageSummary[] {
    return this.getAllVillages().map(village => ({
      id: village.id,
      name: village.name,
      currentResources: { ...village.initialResources }, // In real impl, would be current state
      population: village.initialPopulation,
      activeActivities: village.activitySlots.length,
      status: village.id === this.activeVillageId ? 'active' : 'inactive' as const,
    }));
  }

  /**
   * Add a new village to the registry.
   */
  addVillage(village: VillageConfig): boolean {
    if (this.villages.has(village.id)) return false;
    this.villages.set(village.id, village);
    return true;
  }

  /**
   * Remove a village from the registry.
   */
  removeVillage(villageId: string): boolean {
    if (villageId === this.activeVillageId) return false; // Can't remove active village
    return this.villages.delete(villageId);
  }

  /**
   * Create a new trade route between villages.
   */
  createTradeRoute(route: TradeRoute): boolean {
    const fromVillage = this.villages.get(route.fromVillageId);
    const toVillage = this.villages.get(route.toVillageId);

    if (!fromVillage || !toVillage || this.tradeRoutes.has(route.id)) {
      return false;
    }

    this.tradeRoutes.set(route.id, route);
    return true;
  }

  /**
   * Execute a trade route immediately (for instant trades).
   */
  executeTradeRoute(routeId: string): boolean {
    const route = this.tradeRoutes.get(routeId);
    if (!route) return false;

    const fromVillage = this.villages.get(route.fromVillageId);
    const toVillage = this.villages.get(route.toVillageId);
    if (!fromVillage || !toVillage) return false;

    // Simulate risk-based execution
    const success = Math.random() > route.risk;
    const riskEvent = success ? undefined : 'Trade caravan was ambushed by bandits';

    this.lastTradeResult = {
      success,
      routeId,
      executedAt: Date.now(),
      resourcesSent: { ...route.sendResources },
      resourcesReceived: success ? { ...route.receiveResources } : {},
      riskEvent,
    };

    return success;
  }

  /**
   * Queue a migration request.
   */
  queueMigration(residentId: string, fromVillageId: string, toVillageId: string): boolean {
    const fromVillage = this.villages.get(fromVillageId);
    const toVillage = this.villages.get(toVillageId);

    if (!fromVillage || !toVillage || fromVillageId === toVillageId) {
      return false;
    }

    const migrationCost = this.globalResources.migrationCosts.baseCost || 10;
    if (this.globalResources.gold < migrationCost) {
      return false; // Insufficient funds
    }

    // Deduct cost
    this.globalResources.gold -= migrationCost;

    const request: MigrationRequest = {
      id: `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      residentId,
      fromVillageId,
      toVillageId,
      timeRemaining: 5, // 5 time units for migration
      costPaid: { gold: migrationCost },
    };

    this.migrationQueue.push(request);
    return true;
  }

  /**
   * Process one tick of migration progress.
   */
  processMigrationTick(): MigrationRequest[] {
    const completed: MigrationRequest[] = [];

    this.migrationQueue = this.migrationQueue.filter(request => {
      request.timeRemaining -= 1;
      if (request.timeRemaining <= 0) {
        completed.push(request);
        return false;
      }
      return true;
    });

    return completed;
  }

  /**
   * Get all active trade routes.
   */
  getTradeRoutes(): TradeRoute[] {
    return Array.from(this.tradeRoutes.values());
  }

  /**
   * Get current migration queue.
   */
  getMigrationQueue(): MigrationRequest[] {
    return [...this.migrationQueue];
  }

  /**
   * Get the latest trade result, if any.
   */
  getLastTradeResult(): TradeResult | null {
    if (!this.lastTradeResult) {
      return null;
    }
    return {
      ...this.lastTradeResult,
      resourcesSent: { ...this.lastTradeResult.resourcesSent },
      resourcesReceived: { ...this.lastTradeResult.resourcesReceived },
    };
  }

  /**
   * Seed trade routes for testing (deterministic setup).
   */
  seedTradeRoutes(routes: TradeRoute[], lastResult?: TradeResult): void {
    this.tradeRoutes.clear();
    for (const route of routes) {
      this.tradeRoutes.set(route.id, route);
    }
    if (lastResult) {
      this.lastTradeResult = lastResult;
    }
  }

  /**
   * Seed migration queue for testing (deterministic setup).
   */
  seedMigrationQueue(requests: MigrationRequest[]): void {
    this.migrationQueue = [...requests];
  }
}

/**
 * Default village configurations for the spike.
 */
export const DEFAULT_VILLAGE_CONFIGS: VillageConfig[] = [
  {
    id: 'village-alpha',
    name: 'Alpha Village',
    description: 'Starting village with basic resources',
    initialResources: { gold: 100, food: 50 },
    initialPopulation: 5,
    activitySlots: ['job-woodcutting', 'quest-basic'],
    traits: ['starter'],
  },
  {
    id: 'village-beta',
    name: 'Beta Village',
    description: 'Advanced village with special bonuses',
    initialResources: { gold: 200, food: 100 },
    initialPopulation: 8,
    activitySlots: ['job-woodcutting', 'job-farming', 'quest-basic', 'quest-advanced'],
    traits: ['farming_bonus'],
  },
];

/**
 * Default global resources.
 */
export const DEFAULT_GLOBAL_RESOURCES: GlobalResources = {
  gold: 0,
  pools: { potions: 0, artifacts: 0 },
  migrationCosts: { baseCost: 10 },
};
