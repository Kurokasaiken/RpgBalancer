/**
 * Tests for ActiveHUD state synchronization
 */

import { renderHook, act } from '@testing-library/react';
import { ActiveHUDSelectors, ActiveHUDMutators, ActiveHUDTelemetry } from './useActiveHUDStateSync';
import type { ActiveHUDActivityViewModel } from './useActiveHUDState';

// Mock analytics
const mockAnalytics = {
  track: vi.fn(),
};

// Mock window
Object.defineProperty(window, 'analytics', {
  value: mockAnalytics,
  writable: true,
});

describe('ActiveHUDStateSync', () => {
  const mockConfig = {
    activities: {
      'forest-work': {
        label: 'Forest Work',
        tags: ['job'],
        metadata: { icon: '🌲' },
      },
      'quest-1': {
        label: 'Test Quest',
        tags: ['quest'],
        metadata: { icon: '⚔️' },
      },
      'maintenance-1': {
        label: 'Tool Maintenance',
        tags: ['maintenance'],
        metadata: { icon: '🔧' },
      },
    },
  } as any;

  const mockVillageState = {
    activities: {
      'scheduled-1': {
        id: 'scheduled-1',
        activityId: 'forest-work',
        slotId: 'forest',
        characterIds: ['resident-1'],
        startTime: 1000,
        endTime: 2000,
        status: 'running',
      },
      'scheduled-2': {
        id: 'scheduled-2',
        activityId: 'quest-1',
        slotId: 'quest-board',
        characterIds: ['resident-2'],
        startTime: 1500,
        endTime: 2500,
        status: 'running',
      },
    },
    residents: {
      'resident-1': {
        displayName: 'Alice',
      },
      'resident-2': {
        displayName: 'Bob',
      },
    },
  } as any;

  const mockGetActivityState = vi.fn(() => ({
    status: 'running',
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ActiveHUDSelectors', () => {
    describe('getActiveActivities', () => {
      it('should extract active activities from village state', () => {
        const activities = ActiveHUDSelectors.getActiveActivities(
          mockVillageState,
          mockConfig,
          1800, // currentTime
          60, // secondsPerTimeUnit
          mockGetActivityState
        );

        expect(activities).toHaveLength(2);
        expect(activities[0]).toMatchObject({
          key: 'scheduled-2-resident-2',
          activityType: 'quest',
          label: 'Test Quest',
          icon: '⚔️',
          residentId: 'resident-2',
          residentName: 'Bob',
          status: 'running',
          visualVariant: 'ember',
          activityId: 'quest-1',
        });
        expect(activities[1]).toMatchObject({
          key: 'scheduled-1-resident-1',
          activityType: 'job',
          label: 'Forest Work',
          icon: '🌲',
          residentId: 'resident-1',
          residentName: 'Alice',
          status: 'running',
          visualVariant: 'azure',
          activityId: 'forest-work',
        });
      });

      it('should sort activities by remaining time', () => {
        const activities = ActiveHUDSelectors.getActiveActivities(
          mockVillageState,
          mockConfig,
          1800,
          60,
          mockGetActivityState
        );

        // Quest activity (remaining: 700s) should come before job (remaining: 1200s)
        expect(activities[0].activityId).toBe('quest-1');
        expect(activities[1].activityId).toBe('forest-work');
      });

      it('should filter out non-running activities', () => {
        const villageStateWithCompleted = {
          ...mockVillageState,
          activities: {
            ...mockVillageState.activities,
            'scheduled-3': {
              id: 'scheduled-3',
              activityId: 'maintenance-1',
              slotId: 'workshop',
              characterIds: ['resident-3'],
              startTime: 500,
              endTime: 1000,
              status: 'completed',
            },
          },
        };

        const activities = ActiveHUDSelectors.getActiveActivities(
          villageStateWithCompleted,
          mockConfig,
          1800,
          60,
          mockGetActivityState
        );

        expect(activities).toHaveLength(2); // Only running activities
        expect(activities.find(a => a.activityId === 'maintenance-1')).toBeUndefined();
      });
    });

    describe('getActivityCounts', () => {
      it('should count activities by type', () => {
        const activities: ActiveHUDActivityViewModel[] = [
          { activityType: 'job' } as any,
          { activityType: 'quest' } as any,
          { activityType: 'job' } as any,
          { activityType: 'maintenance' } as any,
        ];

        const counts = ActiveHUDSelectors.getActivityCounts(activities);

        expect(counts).toEqual({
          jobs: 2,
          quests: 1,
          maintenance: 1,
          total: 4,
        });
      });
    });

    describe('getActivityById', () => {
      it('should find activity by ID', () => {
        const activities: ActiveHUDActivityViewModel[] = [
          { activityId: 'activity-1' } as any,
          { activityId: 'activity-2' } as any,
        ];

        const activity = ActiveHUDSelectors.getActivityById(activities, 'activity-2');
        expect(activity?.activityId).toBe('activity-2');
      });

      it('should return undefined for unknown ID', () => {
        const activities: ActiveHUDActivityViewModel[] = [
          { activityId: 'activity-1' } as any,
        ];

        const activity = ActiveHUDSelectors.getActivityById(activities, 'unknown');
        expect(activity).toBeUndefined();
      });
    });

    describe('getActivitiesByResident', () => {
      it('should filter activities by resident', () => {
        const activities: ActiveHUDActivityViewModel[] = [
          { residentId: 'resident-1' } as any,
          { residentId: 'resident-2' } as any,
          { residentId: 'resident-1' } as any,
        ];

        const residentActivities = ActiveHUDSelectors.getActivitiesByResident(activities, 'resident-1');
        expect(residentActivities).toHaveLength(2);
        expect(residentActivities.every(a => a.residentId === 'resident-1')).toBe(true);
      });
    });
  });

  describe('ActiveHUDMutators', () => {
    describe('updateActivityProgress', () => {
      it('should update activity progress', () => {
        const activities: ActiveHUDActivityViewModel[] = [
          { activityId: 'activity-1', progress: 0.5, remainingSeconds: 120 } as any,
          { activityId: 'activity-2', progress: 0.3, remainingSeconds: 180 } as any,
        ];

        const updated = ActiveHUDMutators.updateActivityProgress(
          activities,
          'activity-1',
          0.8,
          60
        );

        expect(updated[0]).toMatchObject({
          activityId: 'activity-1',
          progress: 0.8,
          remainingSeconds: 60,
        });
        expect(updated[1]).toMatchObject({
          activityId: 'activity-2',
          progress: 0.3,
          remainingSeconds: 180,
        });
      });
    });

    describe('removeCompletedActivity', () => {
      it('should remove completed activity', () => {
        const activities: ActiveHUDActivityViewModel[] = [
          { activityId: 'activity-1' } as any,
          { activityId: 'activity-2' } as any,
          { activityId: 'activity-3' } as any,
        ];

        const updated = ActiveHUDMutators.removeCompletedActivity(activities, 'activity-2');

        expect(updated).toHaveLength(2);
        expect(updated.map(a => a.activityId)).toEqual(['activity-1', 'activity-3']);
      });
    });

    describe('addActivity', () => {
      it('should add new activity and sort by remaining time', () => {
        const activities: ActiveHUDActivityViewModel[] = [
          { activityId: 'activity-1', remainingSeconds: 120 } as any,
          { activityId: 'activity-2', remainingSeconds: 180 } as any,
        ];

        const newActivity: ActiveHUDActivityViewModel = {
          activityId: 'activity-3',
          remainingSeconds: 60,
        } as any;

        const updated = ActiveHUDMutators.addActivity(activities, newActivity);

        expect(updated).toHaveLength(3);
        // Should be sorted by remaining time: 60, 120, 180
        expect(updated.map(a => a.activityId)).toEqual(['activity-3', 'activity-1', 'activity-2']);
      });
    });
  });

  describe('ActiveHUDTelemetry', () => {
    describe('emitStateSync', () => {
      it('should emit telemetry event', () => {
        ActiveHUDTelemetry.emitStateSync('hud', 5);

        expect(mockAnalytics.track).toHaveBeenCalledWith('active_hud_state_sync', {
          source: 'hud',
          activityCount: 5,
          timestamp: expect.any(Number),
        });
      });

      it('should handle missing analytics gracefully', () => {
        // @ts-expect-error - Testing without analytics
        delete window.analytics;

        expect(() => {
          ActiveHUDTelemetry.emitStateSync('map', 3);
        }).not.toThrow();
      });
    });
  });
});
