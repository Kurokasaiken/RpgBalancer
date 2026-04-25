/**
 * Idle Village Activity Analytics Store with PersistenceService integration.
 * Provides caching, aggregation, and telemetry event management for Phase 12 analytics.
 */

import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type { 
  ActivityAnalyticsEvent, 
  ActivityAnalyticsMetrics, 
  AnalyticsRetentionConfig 
} from './activityTelemetryConfig';

/**
 * Store key for analytics data persistence.
 */
const ANALYTICS_STORE_KEY = 'idle-village-activity-analytics';

/**
 * Internal store state interface.
 */
interface IdleVillageActivityStoreState {
  /** All collected analytics events */
  events: ActivityAnalyticsEvent[];
  /** Cached aggregated metrics */
  cachedMetrics: ActivityAnalyticsMetrics | null;
  /** Last metrics calculation timestamp */
  lastMetricsCalculation: number;
  /** Store configuration */
  config: AnalyticsRetentionConfig;
  /** Session identifier for event correlation */
  sessionId: string;
}

/**
 * Default metrics structure for initialization.
 */
function createDefaultMetrics(): ActivityAnalyticsMetrics {
  return {
    eventsByType: {} as Record<string, number>,
    completionRates: {
      job: 0,
      quest: 0,
      maintenance: 0,
    },
    averageCompletionTimes: {
      job: 0,
      quest: 0,
      maintenance: 0,
    },
    failureRates: {
      job: 0,
      quest: 0,
      maintenance: 0,
    },
    residentPerformance: {},
    hourlyActivityPattern: new Array(24).fill(0),
    riskMetrics: {
      highRiskActivities: 0,
      averageRiskScore: 0,
      riskByActivityType: {
        job: 0,
        quest: 0,
        maintenance: 0,
      },
    },
    fatigueMetrics: {
      fatigueRelatedFailures: 0,
      averageFatigueOnFailure: 0,
      fatigueImpactByActivityType: {
        job: 0,
        quest: 0,
        maintenance: 0,
      },
    },
  };
}

/**
 * Generates a unique session identifier.
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Idle Village Activity Analytics Store.
 * 
 * Provides persistent storage and aggregation for activity telemetry events.
 * Uses PersistenceService for async storage with Tauri/web fallbacks.
 */
export class IdleVillageActivityStore {
  private state: IdleVillageActivityStoreState;
  private isInitialized = false;

  /**
   * Creates a new activity analytics store instance.
   * 
   * @param config - Retention and cleanup configuration
   */
  constructor(config: AnalyticsRetentionConfig) {
    this.state = {
      events: [],
      cachedMetrics: null,
      lastMetricsCalculation: 0,
      config,
      sessionId: generateSessionId(),
    };
  }

  /**
   * Initializes the store by loading persisted data.
   * Must be called before using the store.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const persistedState = await loadData<IdleVillageActivityStoreState>(
        ANALYTICS_STORE_KEY,
        {
          events: [],
          cachedMetrics: null,
          lastMetricsCalculation: 0,
          config: this.state.config,
          sessionId: generateSessionId(),
        }
      );

      this.state = {
        ...persistedState,
        config: this.state.config, // Preserve constructor config
      };

      // Start cleanup timer if enabled
      if (this.state.config.enableAutoCleanup) {
        // Note: Automatic cleanup disabled to comply with sandbox timer rules
        // Cleanup will be performed manually during addEvent operations
        console.log('[IdleVillageActivityStore] Automatic cleanup disabled - using manual cleanup');
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('[IdleVillageActivityStore] Failed to initialize:', error);
      // Continue with empty state
      this.isInitialized = true;
    }
  }

  /**
   * Adds a new analytics event to the store.
   * 
   * @param event - Analytics event to add
   */
  async addEvent(event: Omit<ActivityAnalyticsEvent, 'id' | 'sessionId' | 'timestamp'>): Promise<void> {
    this.ensureInitialized();

    const fullEvent: ActivityAnalyticsEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.state.sessionId,
      timestamp: Date.now(),
    };

    this.state.events.push(fullEvent);
    
    // Invalidate cached metrics
    this.state.cachedMetrics = null;

    // Trigger async save
    this.saveState().catch(error => {
      console.warn('[IdleVillageActivityStore] Failed to save after addEvent:', error);
    });

    // Enforce retention limits
    await this.enforceRetentionLimits();
  }

  /**
   * Retrieves all events for a specific activity type.
   * 
   * @param activityType - Activity type to filter by
   * @returns Array of analytics events
   */
  getEventsByActivityType(activityType: string): ActivityAnalyticsEvent[] {
    this.ensureInitialized();
    return this.state.events.filter(event => event.activityType === activityType);
  }

  /**
   * Retrieves all events within a time range.
   * 
   * @param startTime - Start timestamp (Unix ms)
   * @param endTime - End timestamp (Unix ms)
   * @returns Array of analytics events
   */
  getEventsByTimeRange(startTime: number, endTime: number): ActivityAnalyticsEvent[] {
    this.ensureInitialized();
    return this.state.events.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Retrieves all events for a specific resident.
   * 
   * @param residentId - Resident identifier
   * @returns Array of analytics events
   */
  getEventsByResident(residentId: string): ActivityAnalyticsEvent[] {
    this.ensureInitialized();
    return this.state.events.filter(event => event.residentId === residentId);
  }

  /**
   * Calculates aggregated metrics from all events.
   * Uses cached metrics if available and fresh.
   * 
   * @returns Aggregated analytics metrics
   */
  async calculateMetrics(): Promise<ActivityAnalyticsMetrics> {
    this.ensureInitialized();

    const now = Date.now();
    const cacheAge = now - this.state.lastMetricsCalculation;
    const aggregationWindow = this.state.config.aggregationWindowMs;

    // Return cached metrics if still fresh
    if (this.state.cachedMetrics && cacheAge < aggregationWindow) {
      return this.state.cachedMetrics;
    }

    // Calculate fresh metrics
    const metrics = createDefaultMetrics();
    const recentEvents = this.getEventsByTimeRange(
      now - this.state.config.maxEventAge,
      now
    );

    // Calculate event counts by type
    for (const event of recentEvents) {
      metrics.eventsByType[event.type] = (metrics.eventsByType[event.type] || 0) + 1;

      // Calculate hourly activity pattern
      const hour = new Date(event.timestamp).getHours();
      metrics.hourlyActivityPattern[hour]++;

      // Calculate resident performance
      if (!metrics.residentPerformance[event.residentId]) {
        metrics.residentPerformance[event.residentId] = {
          totalActivities: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          preferredActivities: [],
        };
      }

      const resident = metrics.residentPerformance[event.residentId];
      resident.totalActivities++;

      // Track preferred activities
      if (!resident.preferredActivities.includes(event.activityType)) {
        resident.preferredActivities.push(event.activityType);
      }
    }

    // Calculate completion rates and times by activity type
    const activityTypes = ['job', 'quest', 'maintenance'] as const;
    
    for (const activityType of activityTypes) {
      const typeEvents = recentEvents.filter(e => e.activityType === activityType);
      const startedEvents = typeEvents.filter(e => e.type.includes('Started') || e.type.includes('Accepted'));
      const completedEvents = typeEvents.filter(e => e.type.includes('Completed'));
      const failedEvents = typeEvents.filter(e => e.type.includes('Failed'));

      // Completion rate
      if (startedEvents.length > 0) {
        metrics.completionRates[activityType] = completedEvents.length / startedEvents.length;
        metrics.failureRates[activityType] = failedEvents.length / startedEvents.length;
      }

      // Average completion time
      const completionTimes = completedEvents
        .filter(e => e.duration !== undefined)
        .map(e => e.duration!);

      if (completionTimes.length > 0) {
        metrics.averageCompletionTimes[activityType] = 
          completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
      }
    }

    // Calculate resident performance details
    for (const residentId of Object.keys(metrics.residentPerformance)) {
      const residentEvents = recentEvents.filter(e => e.residentId === residentId);
      const startedEvents = residentEvents.filter(e => e.type.includes('Started') || e.type.includes('Accepted'));
      const completedEvents = residentEvents.filter(e => e.type.includes('Completed'));
      const completionTimes = completedEvents
        .filter(e => e.duration !== undefined)
        .map(e => e.duration!);

      const resident = metrics.residentPerformance[residentId];
      
      if (startedEvents.length > 0) {
        resident.completionRate = completedEvents.length / startedEvents.length;
      }

      if (completionTimes.length > 0) {
        resident.averageCompletionTime = 
          completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
      }
    }

    // Cache and return metrics
    this.state.cachedMetrics = metrics;
    this.state.lastMetricsCalculation = now;

    // Save metrics cache
    this.saveState().catch(error => {
      console.warn('[IdleVillageActivityStore] Failed to save metrics cache:', error);
    });

    return metrics;
  }

  /**
   * Clears all analytics data from the store.
   */
  async clearAllData(): Promise<void> {
    this.ensureInitialized();

    this.state.events = [];
    this.state.cachedMetrics = null;
    this.state.lastMetricsCalculation = 0;
    this.state.sessionId = generateSessionId();

    await this.saveState();
  }

  /**
   * Gets store statistics for debugging and monitoring.
   * 
   * @returns Store statistics object
   */
  getStoreStats(): {
    eventCount: number;
    lastEventTimestamp: number | null;
    sessionId: string;
    cacheAge: number;
    retentionAge: number;
  } {
    this.ensureInitialized();

    const lastEvent = this.state.events[this.state.events.length - 1];
    const now = Date.now();

    return {
      eventCount: this.state.events.length,
      lastEventTimestamp: lastEvent?.timestamp || null,
      sessionId: this.state.sessionId,
      cacheAge: now - this.state.lastMetricsCalculation,
      retentionAge: this.state.config.maxEventAge,
    };
  }

  /**
   * Ensures the store is initialized before operations.
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('IdleVillageActivityStore must be initialized before use. Call initialize() first.');
    }
  }

  /**
   * Saves the current state to persistent storage.
   */
  private async saveState(): Promise<void> {
    try {
      await saveData(ANALYTICS_STORE_KEY, this.state);
    } catch (error) {
      console.warn('[IdleVillageActivityStore] Failed to save state:', error);
    }
  }

  /**
   * Enforces retention limits by removing old events.
   */
  private async enforceRetentionLimits(): Promise<void> {
    const now = Date.now();
    const cutoffTime = now - this.state.config.maxEventAge;

    // Remove old events
    const originalLength = this.state.events.length;
    this.state.events = this.state.events.filter(event => event.timestamp >= cutoffTime);

    // Enforce count limit
    if (this.state.events.length > this.state.config.maxEventCount) {
      this.state.events = this.state.events.slice(-this.state.config.maxEventCount);
    }

    // Log if events were removed
    const removedCount = originalLength - this.state.events.length;
    if (removedCount > 0) {
      console.log(`[IdleVillageActivityStore] Removed ${removedCount} old events during retention enforcement`);
    }
  }

  /**
   * Cleanup method to call when the store is no longer needed.
   */
  destroy(): void {
    // No timers to clean up - manual cleanup only
    console.log('[IdleVillageActivityStore] Store destroyed');
  }
}
