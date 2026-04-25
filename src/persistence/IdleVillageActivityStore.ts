import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { ActivityAnalyticsDataPoint, ActivityAnalyticsMetrics } from '@/ui/idleVillage/hooks/useActivityAnalytics';
import type { IdleVillageAnalytics } from '@/analytics/idleVillage';

/**
 * Telemetry event types for Idle Village activities.
 */
export type IdleVillageActivityEventType =
  | 'job_started'
  | 'job_completed'
  | 'quest_started'
  | 'quest_completed'
  | 'maintenance_alert'
  | 'activity_cancelled';

/**
 * Telemetry event payload for activity tracking.
 */
export interface IdleVillageActivityEvent {
  /** Event type */
  type: IdleVillageActivityEventType;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Activity ID from config */
  activityId: string;
  /** Scheduled activity ID from TimeEngine */
  scheduledId: string;
  /** Assigned resident ID */
  residentId: string;
  /** Optional metadata (rewards, duration, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Snapshot of activity state for analytics.
 */
export interface ActivityStateSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Active crew count */
  crewCount: number;
  /** Average fatigue across active residents */
  averageFatigue: number;
  /** Active jobs count */
  activeJobs: number;
  /** Active quests count */
  activeQuests: number;
  /** Active maintenance count */
  activeMaintenance: number;
}

/**
 * Persisted data structure for Idle Village activity analytics.
 */
export interface IdleVillageActivityData {
  /** Telemetry events log */
  events: IdleVillageActivityEvent[];
  /** State snapshots for trend analysis */
  snapshots: ActivityStateSnapshot[];
  /** Activity analytics data points */
  analyticsDataPoints: ActivityAnalyticsDataPoint[];
  /** Analytics snapshots */
  analyticsSnapshots: ActivityAnalyticsMetrics[];
  /** Village analytics snapshots */
  villageAnalyticsSnapshots: IdleVillageAnalytics[];
  /** Last update timestamp */
  lastUpdate: number;
  /** Version for migration compatibility */
  version: string;
}

/**
 * Storage key for Idle Village activity data.
 */
const STORAGE_KEY = 'idle_village_activity_data';

/**
 * Current data version for migration.
 */
const DATA_VERSION = '1.0.0';

/**
 * Maximum events to keep in memory (prevent unbounded growth).
 */
const MAX_EVENTS = 1000;

/**
 * Maximum snapshots to keep in memory.
 */
const MAX_SNAPSHOTS = 500;

/**
 * Default empty data structure.
 */
const DEFAULT_DATA: IdleVillageActivityData = {
  events: [],
  snapshots: [],
  analyticsDataPoints: [],
  analyticsSnapshots: [],
  villageAnalyticsSnapshots: [],
  lastUpdate: Date.now(),
  version: DATA_VERSION,
};

/**
 * Asynchronous store for Idle Village activity telemetry and analytics.
 * Uses PersistenceService for cross-platform compatibility (Tauri + web).
 * 
 * All operations are async to support filesystem I/O on desktop.
 */
export class IdleVillageActivityStore {
  /**
   * Loads activity data from persistent storage.
   * 
   * @returns Promise resolving to activity data
   */
  static async load(): Promise<IdleVillageActivityData> {
    try {
      const data = await loadData<IdleVillageActivityData>(STORAGE_KEY, DEFAULT_DATA);
      
      // Validate version and migrate if needed
      if (data.version !== DATA_VERSION) {
        console.warn(`[IdleVillageActivityStore] Version mismatch: ${data.version} -> ${DATA_VERSION}`);
        // Future: add migration logic here
        data.version = DATA_VERSION;
      }

      return data;
    } catch (error) {
      console.error('[IdleVillageActivityStore] Failed to load data:', error);
      return DEFAULT_DATA;
    }
  }

  /**
   * Saves activity data to persistent storage.
   * 
   * @param data - Activity data to persist
   */
  static async save(data: IdleVillageActivityData): Promise<void> {
    try {
      // Trim events and snapshots to prevent unbounded growth
      const trimmedData: IdleVillageActivityData = {
        ...data,
        events: data.events.slice(-MAX_EVENTS),
        snapshots: data.snapshots.slice(-MAX_SNAPSHOTS),
        lastUpdate: Date.now(),
      };

      await saveData(STORAGE_KEY, trimmedData);
    } catch (error) {
      console.error('[IdleVillageActivityStore] Failed to save data:', error);
      throw error;
    }
  }

  /**
   * Appends a new activity event to the log.
   * 
   * @param event - Event to append
   */
  static async appendEvent(event: IdleVillageActivityEvent): Promise<void> {
    const data = await this.load();
    data.events.push(event);
    await this.save(data);
  }

  /**
   * Appends a new state snapshot for analytics.
   * 
   * @param snapshot - Snapshot to append
   */
  static async appendSnapshot(snapshot: ActivityStateSnapshot): Promise<void> {
    const data = await this.load();
    data.snapshots.push(snapshot);
    await this.save(data);
  }

  /**
   * Retrieves all events of a specific type.
   * 
   * @param type - Event type to filter
   * @returns Promise resolving to filtered events
   */
  static async getEventsByType(type: IdleVillageActivityEventType): Promise<IdleVillageActivityEvent[]> {
    const data = await this.load();
    return data.events.filter(event => event.type === type);
  }

  /**
   * Retrieves events within a time range.
   * 
   * @param startTime - Start timestamp (inclusive)
   * @param endTime - End timestamp (inclusive)
   * @returns Promise resolving to filtered events
   */
  static async getEventsByTimeRange(startTime: number, endTime: number): Promise<IdleVillageActivityEvent[]> {
    const data = await this.load();
    return data.events.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
  }

  /**
   * Retrieves the most recent snapshots.
   * 
   * @param count - Number of snapshots to retrieve
   * @returns Promise resolving to recent snapshots
   */
  static async getRecentSnapshots(count: number): Promise<ActivityStateSnapshot[]> {
    const data = await this.load();
    return data.snapshots.slice(-count);
  }

  /**
   * Clears all stored activity data.
   * 
   * @returns Promise resolving when data is cleared
   */
  static async clear(): Promise<void> {
    try {
      await clearData(STORAGE_KEY);
    } catch (error) {
      console.error('[IdleVillageActivityStore] Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Exports activity data as JSON for analysis.
   * 
   * @returns Promise resolving to serialized data
   */
  static async exportJSON(): Promise<string> {
    const data = await this.load();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Gets summary statistics from stored data.
   * 
   * @returns Promise resolving to summary stats
   */
  static async getSummaryStats(): Promise<{
    totalEvents: number;
    totalSnapshots: number;
    totalAnalyticsDataPoints: number;
    totalAnalyticsSnapshots: number;
    totalVillageAnalyticsSnapshots: number;
    eventsByType: Record<IdleVillageActivityEventType, number>;
    lastUpdate: number;
  }> {
    const data = await this.load();
    
    const eventsByType = data.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<IdleVillageActivityEventType, number>);

    return {
      totalEvents: data.events.length,
      totalSnapshots: data.snapshots.length,
      totalAnalyticsDataPoints: data.analyticsDataPoints.length,
      totalAnalyticsSnapshots: data.analyticsSnapshots.length,
      totalVillageAnalyticsSnapshots: data.villageAnalyticsSnapshots.length,
      eventsByType,
      lastUpdate: data.lastUpdate,
    };
  }

  /**
   * Appends a new activity analytics data point.
   * 
   * @param dataPoint - Analytics data point to append
   */
  static async appendAnalyticsDataPoint(dataPoint: ActivityAnalyticsDataPoint): Promise<void> {
    const data = await this.load();
    data.analyticsDataPoints.push(dataPoint);
    await this.save(data);
  }

  /**
   * Appends a new analytics snapshot.
   * 
   * @param analytics - Analytics snapshot to append
   */
  static async appendAnalyticsSnapshot(analytics: ActivityAnalyticsMetrics): Promise<void> {
    const data = await this.load();
    data.analyticsSnapshots.push(analytics);
    await this.save(data);
  }

  /**
   * Appends a new village analytics snapshot.
   * 
   * @param villageAnalytics - Village analytics snapshot to append
   */
  static async appendVillageAnalyticsSnapshot(villageAnalytics: IdleVillageAnalytics): Promise<void> {
    const data = await this.load();
    data.villageAnalyticsSnapshots.push(villageAnalytics);
    await this.save(data);
  }

  /**
   * Retrieves analytics data points within a time range.
   * 
   * @param startTime - Start timestamp (inclusive)
   * @param endTime - End timestamp (inclusive)
   * @returns Promise resolving to filtered data points
   */
  static async getAnalyticsDataPointsByTimeRange(startTime: number, endTime: number): Promise<ActivityAnalyticsDataPoint[]> {
    const data = await this.load();
    return data.analyticsDataPoints.filter(point => point.timestamp >= startTime && point.timestamp <= endTime);
  }

  /**
   * Retrieves the most recent analytics data points.
   * 
   * @param count - Number of data points to retrieve
   * @returns Promise resolving to recent data points
   */
  static async getRecentAnalyticsDataPoints(count: number): Promise<ActivityAnalyticsDataPoint[]> {
    const data = await this.load();
    return data.analyticsDataPoints.slice(-count);
  }

  /**
   * Retrieves the most recent analytics snapshots.
   * 
   * @param count - Number of snapshots to retrieve
   * @returns Promise resolving to recent analytics snapshots
   */
  static async getRecentAnalyticsSnapshots(count: number): Promise<ActivityAnalyticsMetrics[]> {
    const data = await this.load();
    return data.analyticsSnapshots.slice(-count);
  }

  /**
   * Retrieves the most recent village analytics snapshots.
   * 
   * @param count - Number of snapshots to retrieve
   * @returns Promise resolving to recent village analytics snapshots
   */
  static async getRecentVillageAnalyticsSnapshots(count: number): Promise<IdleVillageAnalytics[]> {
    const data = await this.load();
    return data.villageAnalyticsSnapshots.slice(-count);
  }
}
