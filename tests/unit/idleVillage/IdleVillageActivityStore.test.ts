/**
 * Test suite for Idle Village Activity Analytics Store.
 * Covers persistence, aggregation, retention, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IdleVillageActivityStore } from '../../../src/ui/idleVillage/analytics/IdleVillageActivityStore';
import type { 
  AnalyticsRetentionConfig 
} from '../../../src/ui/idleVillage/analytics/activityTelemetryConfig';
import { saveData } from '../../../src/shared/persistence/PersistenceService';

// Mock PersistenceService for testing
const mockStorage = new Map<string, string>();

// Mock the PersistenceService functions
vi.mock('../../../src/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(async (key: string, data: unknown) => {
    mockStorage.set(key, JSON.stringify(data));
  }),
  loadData: vi.fn(async (key: string, defaultValue: unknown) => {
    const stored = mockStorage.get(key);
    return stored ? JSON.parse(stored) : defaultValue;
  }),
  clearData: vi.fn(async (key: string) => {
    mockStorage.delete(key);
  }),
}));

describe('IdleVillageActivityStore', () => {
  let store: IdleVillageActivityStore;
  let testConfig: AnalyticsRetentionConfig;

  beforeEach(async () => {
    // Clear mock storage
    mockStorage.clear();
    
    // Create test configuration
    testConfig = {
      maxEventAge: 24 * 60 * 60 * 1000, // 1 day
      maxEventCount: 100,
      aggregationWindowMs: 60 * 60 * 1000, // 1 hour
      cleanupIntervalMs: 60 * 60 * 1000, // 1 hour
      enableAutoCleanup: false, // Disabled for tests
    };

    // Create and initialize store
    store = new IdleVillageActivityStore(testConfig);
    await store.initialize();
  });

  afterEach(() => {
    store.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', async () => {
      const stats = store.getStoreStats();
      expect(stats.eventCount).toBe(0);
      expect(stats.lastEventTimestamp).toBeNull();
      expect(stats.sessionId).toBeDefined();
      expect(stats.cacheAge).toBeGreaterThanOrEqual(0);
    });

    it('should load persisted data on initialization', async () => {
      // Add some data to first store
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'test-activity',
        scheduledId: 'test-scheduled',
        residentId: 'test-resident',
        activityType: 'job',
        metadata: {},
      });

      // Create second store instance
      const store2 = new IdleVillageActivityStore(testConfig);
      await store2.initialize();

      const stats = store2.getStoreStats();
      expect(stats.eventCount).toBe(1);
      
      store2.destroy();
    });

    it('should handle corrupted persisted data gracefully', async () => {
      // Save corrupted data
      mockStorage.set('idle-village-activity-analytics', 'invalid-json');

      // Store should still initialize with empty state
      const store2 = new IdleVillageActivityStore(testConfig);
      await store2.initialize();

      const stats = store2.getStoreStats();
      expect(stats.eventCount).toBe(0);
      
      store2.destroy();
    });
  });

  describe('Event Management', () => {
    it('should add events with generated IDs and timestamps', async () => {
      const event = {
        type: 'jobStarted' as const,
        activityId: 'test-activity',
        scheduledId: 'test-scheduled',
        residentId: 'test-resident',
        activityType: 'job' as const,
        metadata: { test: 'data' },
      };

      await store.addEvent(event);

      const events = store.getEventsByActivityType('job');
      expect(events).toHaveLength(1);
      expect(events[0].id).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
      expect(events[0].sessionId).toBeDefined();
      expect(events[0].type).toBe('jobStarted');
      expect(events[0].activityId).toBe('test-activity');
    });

    it('should retrieve events by activity type', async () => {
      // Add different activity types
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      await store.addEvent({
        type: 'questAccepted',
        activityId: 'quest-1',
        scheduledId: 'scheduled-2',
        residentId: 'resident-1',
        activityType: 'quest',
        metadata: {},
      });

      await store.addEvent({
        type: 'jobCompleted',
        activityId: 'job-2',
        scheduledId: 'scheduled-3',
        residentId: 'resident-2',
        activityType: 'job',
        metadata: {},
      });

      const jobEvents = store.getEventsByActivityType('job');
      const questEvents = store.getEventsByActivityType('quest');
      const maintenanceEvents = store.getEventsByActivityType('maintenance');

      expect(jobEvents).toHaveLength(2);
      expect(questEvents).toHaveLength(1);
      expect(maintenanceEvents).toHaveLength(0);
    });

    it('should retrieve events by time range', async () => {
      const now = Date.now();
      
      // Add events at different times
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      // Mock time travel
      const originalDateNow = Date.now;
      Date.now = () => now + 60 * 60 * 1000; // 1 hour later

      await store.addEvent({
        type: 'jobCompleted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      // Restore original Date.now
      Date.now = originalDateNow;

      const recentEvents = store.getEventsByTimeRange(now, now + 30 * 60 * 1000); // 30 minute window
      const allEvents = store.getEventsByTimeRange(now - 60 * 60 * 1000, now + 2 * 60 * 60 * 1000); // 3 hour window

      expect(recentEvents).toHaveLength(1);
      expect(allEvents).toHaveLength(2);
    });

    it('should retrieve events by resident', async () => {
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      await store.addEvent({
        type: 'questAccepted',
        activityId: 'quest-1',
        scheduledId: 'scheduled-2',
        residentId: 'resident-2',
        activityType: 'quest',
        metadata: {},
      });

      await store.addEvent({
        type: 'maintenanceTriggered',
        activityId: 'maintenance-1',
        scheduledId: 'scheduled-3',
        residentId: 'resident-1',
        activityType: 'maintenance',
        metadata: {},
      });

      const resident1Events = store.getEventsByResident('resident-1');
      const resident2Events = store.getEventsByResident('resident-2');

      expect(resident1Events).toHaveLength(2);
      expect(resident2Events).toHaveLength(1);
    });
  });

  describe('Metrics Calculation', () => {
    beforeEach(async () => {
      // Add test data for metrics calculation
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      await store.addEvent({
        type: 'jobCompleted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        duration: 120, // 2 minutes
        metadata: {},
      });

      await store.addEvent({
        type: 'questAccepted',
        activityId: 'quest-1',
        scheduledId: 'scheduled-2',
        residentId: 'resident-1',
        activityType: 'quest',
        metadata: {},
      });

      await store.addEvent({
        type: 'questFailed',
        activityId: 'quest-1',
        scheduledId: 'scheduled-2',
        residentId: 'resident-1',
        activityType: 'quest',
        metadata: {},
      });
    });

    it('should calculate basic metrics', async () => {
      const metrics = await store.calculateMetrics();

      expect(metrics.eventsByType).toEqual({
        jobStarted: 1,
        jobCompleted: 1,
        questAccepted: 1,
        questFailed: 1,
      });

      expect(metrics.completionRates.job).toBe(1); // 1 completed / 1 started
      expect(metrics.completionRates.quest).toBe(0); // 0 completed / 1 started
      expect(metrics.completionRates.maintenance).toBe(0); // No maintenance events

      expect(metrics.failureRates.job).toBe(0); // 0 failed / 1 started
      expect(metrics.failureRates.quest).toBe(1); // 1 failed / 1 started
    });

    it('should calculate average completion times', async () => {
      const metrics = await store.calculateMetrics();

      expect(metrics.averageCompletionTimes.job).toBe(120); // 2 minutes in seconds
      expect(metrics.averageCompletionTimes.quest).toBe(0); // No completed quests
    });

    it('should calculate resident performance metrics', async () => {
      const metrics = await store.calculateMetrics();

      expect(metrics.residentPerformance['resident-1']).toEqual({
        totalActivities: 4, // 2 job + 2 quest events
        completionRate: 0.5, // 2 successful (jobCompleted, questAccepted) / 4 total
        averageCompletionTime: 120, // Only job has completion time
        preferredActivities: ['job', 'quest'], // Both activity types
      });
    });

    it('should cache metrics results', async () => {
      const metrics1 = await store.calculateMetrics();
      const metrics2 = await store.calculateMetrics();

      // Should return cached result (same object reference)
      expect(metrics1).toBe(metrics2);

      const stats = store.getStoreStats();
      expect(stats.cacheAge).toBeLessThan(1000); // Very fresh cache
    });
  });

  describe('Retention Policies', () => {
    it('should enforce event count limit', async () => {
      // Create store with low event limit
      const limitedStore = new IdleVillageActivityStore({
        ...testConfig,
        maxEventCount: 3,
      });
      await limitedStore.initialize();

      // Add more events than limit
      for (let i = 0; i < 5; i++) {
        await limitedStore.addEvent({
          type: 'jobStarted',
          activityId: `job-${i}`,
          scheduledId: `scheduled-${i}`,
          residentId: `resident-${i}`,
          activityType: 'job',
          metadata: {},
        });
      }

      const stats = limitedStore.getStoreStats();
      expect(stats.eventCount).toBe(3); // Should be limited to 3

      limitedStore.destroy();
    });

    it('should enforce age limit', async () => {
      // Create store with very short age limit
      const shortLivedStore = new IdleVillageActivityStore({
        ...testConfig,
        maxEventAge: 1000, // 1 second
      });
      await shortLivedStore.initialize();

      // Add event
      await shortLivedStore.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      // Wait for event to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Add another event to trigger cleanup
      await shortLivedStore.addEvent({
        type: 'jobCompleted',
        activityId: 'job-2',
        scheduledId: 'scheduled-2',
        residentId: 'resident-2',
        activityType: 'job',
        metadata: {},
      });

      const stats = shortLivedStore.getStoreStats();
      expect(stats.eventCount).toBe(1); // Only the recent event should remain

      shortLivedStore.destroy();
    });
  });

  describe('Data Management', () => {
    it('should clear all data', async () => {
      // Add some data
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      expect(store.getStoreStats().eventCount).toBe(1);

      // Clear data
      await store.clearAllData();

      expect(store.getStoreStats().eventCount).toBe(0);
    });

    it('should persist data changes', async () => {
      // Add event
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      // Create new store instance
      const store2 = new IdleVillageActivityStore(testConfig);
      await store2.initialize();

      // Should have persisted data
      expect(store2.getStoreStats().eventCount).toBe(1);

      store2.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid event data gracefully', async () => {
      // This should not throw
      await expect(store.addEvent({
        type: 'jobStarted',
        activityId: '',
        scheduledId: '',
        residentId: '',
        activityType: 'job',
        metadata: null as any,
      })).resolves.toBeDefined();
    });

    it('should handle storage errors gracefully', async () => {
      // Mock saveData to throw error
      const mockSaveData = vi.mocked(saveData);
      mockSaveData.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw, but should handle error
      await expect(store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      })).resolves.toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should generate unique session IDs', async () => {
      const store1 = new IdleVillageActivityStore(testConfig);
      const store2 = new IdleVillageActivityStore(testConfig);

      await store1.initialize();
      await store2.initialize();

      const session1 = store1.getStoreStats().sessionId;
      const session2 = store2.getStoreStats().sessionId;

      expect(session1).not.toBe(session2);
      expect(session1).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(session2).toMatch(/^session-\d+-[a-z0-9]+$/);

      store1.destroy();
      store2.destroy();
    });

    it('should maintain session ID across reloads', async () => {
      // Get original session ID
      const originalSession = store.getStoreStats().sessionId;

      // Add event
      await store.addEvent({
        type: 'jobStarted',
        activityId: 'job-1',
        scheduledId: 'scheduled-1',
        residentId: 'resident-1',
        activityType: 'job',
        metadata: {},
      });

      // Create new store instance
      const store2 = new IdleVillageActivityStore(testConfig);
      await store2.initialize();

      // Should have same session ID (persisted)
      expect(store2.getStoreStats().sessionId).toBe(originalSession);

      store2.destroy();
    });
  });
});
