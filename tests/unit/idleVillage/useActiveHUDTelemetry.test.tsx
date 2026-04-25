import { renderHook, act } from '@testing-library/react';
import { reportActiveHUDEvent, type ActiveHUDTelemetryEventType } from '@/analytics/telemetry/telemetryProvider';
import { useActiveHUDTelemetry, type UseActiveHUDTelemetryProps } from '@/ui/idleVillage/hooks/useActiveHUDTelemetry';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';

// Mock window object for testing
Object.defineProperty(window, '__activeHUDTelemetryEvents', {
  value: [],
  writable: true,
});

Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
  writable: true,
});

describe('useActiveHUDTelemetry', () => {
  beforeEach(() => {
    // Clear telemetry events before each test
    if (window.__activeHUDTelemetryEvents) {
      window.__activeHUDTelemetryEvents.length = 0;
    }
    jest.clearAllMocks();
  });

  const createMockHUDState = (activityCount: number = 3): ActiveHUDState => ({
    activities: Array.from({ length: activityCount }, (_, i) => ({
      key: `activity-${i}`,
      activityType: 'job' as const,
      label: `Job ${i}`,
      icon: '⚒️',
      residentId: `resident-${i}`,
      residentName: `Resident ${i}`,
      progress: 0.5,
      remainingSeconds: 100 - i * 10,
      status: 'running' as const,
      visualVariant: 'azure' as const,
      scheduledId: `scheduled-${i}`,
      activityId: `job-${i}`,
    })),
    counts: {
      jobs: activityCount,
      quests: 0,
      maintenance: 0,
      total: activityCount,
    },
    hasActiveActivities: activityCount > 0,
  });

  const createMockVillageState = (): VillageState => ({
    currentTime: 1000,
    resources: { food: 100, wood: 50 },
    residents: { 'resident-1': { name: 'Test Resident' } },
    activities: {},
    eventLog: [],
    questOffers: {},
  });

  const createMockActiveSlots = (count: number = 2) => 
    Array.from({ length: count }, (_, i) => ({
      slot: {
        slotId: `slot-${i}`,
        iconName: '⚒️',
        label: `Job ${i}`,
      } as ActivitySlotData,
      state: {
        residentId: `resident-${i}`,
        progress: 0.5,
        duration: 100,
        elapsed: 50,
        status: 'running' as const,
      } as ScheduledActivityState,
    }));

  describe('Basic functionality', () => {
    it('should initialize without errors', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: true,
      };

      expect(() => {
        renderHook(() => useActiveHUDTelemetry(props));
      }).not.toThrow();
    });

    it('should not emit events when disabled', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: false,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDTelemetryEvents).toHaveLength(0);
    });
  });

  describe('HUD rendered events', () => {
    it('should emit hud_rendered when activities are present', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(2),
        villageState: createMockVillageState(),
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDTelemetryEvents).toHaveLength(1);
      expect(window.__activeHUDTelemetryEvents[0].event).toBe('hud_rendered');
      expect(window.__activeHUDTelemetryEvents[0].payload.activityCount).toBe(2);
    });

    it('should emit hud_empty_state when no activities', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(0),
        villageState: createMockVillageState(),
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDTelemetryEvents).toHaveLength(1);
      expect(window.__activeHUDTelemetryEvents[0].event).toBe('hud_empty_state');
      expect(window.__activeHUDTelemetryEvents[0].payload.activityCount).toBe(0);
    });

    it('should emit hud_overflow_shown when activities exceed maxVisible', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(5),
        villageState: createMockVillageState(),
        maxVisible: 3,
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDTelemetryEvents).toHaveLength(2);
      expect(window.__activeHUDTelemetryEvents[0].event).toBe('hud_rendered');
      expect(window.__activeHUDTelemetryEvents[1].event).toBe('hud_overflow_shown');
      expect(window.__activeHUDTelemetryEvents[1].payload.hasOverflow).toBe(true);
    });

    it('should work with legacy activeSlots', () => {
      const props: UseActiveHUDTelemetryProps = {
        activeSlots: createMockActiveSlots(3),
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDTelemetryEvents).toHaveLength(1);
      expect(window.__activeHUDTelemetryEvents[0].event).toBe('hud_rendered');
      expect(window.__activeHUDTelemetryEvents[0].payload.activityCount).toBe(3);
    });
  });

  describe('Variant change detection', () => {
    it('should emit hud_variant_changed when variant changes', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        variant: 'default',
        enabled: true,
      };

      const { rerender } = renderHook(
        ({ variant }) => useActiveHUDTelemetry({ ...props, variant }),
        { initialProps: { variant: 'default' } }
      );

      // Clear initial events
      window.__activeHUDTelemetryEvents.length = 0;

      // Change variant
      rerender({ variant: 'compact' });

      expect(window.__activeHUDTelemetryEvents).toHaveLength(1);
      expect(window.__activeHUDTelemetryEvents[0].event).toBe('hud_variant_changed');
      expect(window.__activeHUDTelemetryEvents[0].payload.variant).toBe('compact');
      expect(window.__activeHUDTelemetryEvents[0].payload.metadata?.previousVariant).toBe('default');
    });
  });

  describe('Window handlers', () => {
    it('should attach handlers to window when enabled', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDHandlers).toBeDefined();
      expect(typeof window.__activeHUDHandlers.handleCardSelection).toBe('function');
      expect(typeof window.__activeHUDHandlers.handleNotificationAction).toBe('function');
    });

    it('should not attach handlers when disabled', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: false,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDHandlers).toBeUndefined();
    });

    it('should clean up handlers on unmount', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: true,
      };

      const { unmount } = renderHook(() => useActiveHUDTelemetry(props));

      expect(window.__activeHUDHandlers).toBeDefined();

      unmount();

      expect(window.__activeHUDHandlers).toBeUndefined();
    });
  });

  describe('Card selection handler', () => {
    it('should emit hud_card_selected when handleCardSelection is called', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      // Clear initial events
      window.__activeHUDTelemetryEvents.length = 0;

      // Simulate card selection
      act(() => {
        window.__activeHUDHandlers!.handleCardSelection(
          'activity-1',
          'job',
          'Resident 1'
        );
      });

      expect(window.__activeHUDTelemetryEvents).toHaveLength(1);
      expect(window.__activeHUDTelemetryEvents[0].event).toBe('hud_card_selected');
      expect(window.__activeHUDTelemetryEvents[0].payload.activityKey).toBe('activity-1');
      expect(window.__activeHUDTelemetryEvents[0].payload.activityType).toBe('job');
      expect(window.__activeHUDTelemetryEvents[0].payload.residentName).toBe('Resident 1');
    });
  });

  describe('Notification action handler', () => {
    it('should emit hud_notification_action when handleNotificationAction is called', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      // Clear initial events
      window.__activeHUDTelemetryEvents.length = 0;

      // Simulate notification action
      act(() => {
        window.__activeHUDHandlers!.handleNotificationAction(
          'dismiss',
          { notificationId: 'notif-1' }
        );
      });

      expect(window.__activeHUDTelemetryEvents).toHaveLength(1);
      expect(window.__activeHUDTelemetryEvents[0].event).toBe('hud_notification_action');
      expect(window.__activeHUDTelemetryEvents[0].payload.metadata?.action).toBe('dismiss');
      expect(window.__activeHUDTelemetryEvents[0].payload.metadata?.notificationId).toBe('notif-1');
    });
  });

  describe('Payload validation', () => {
    it('should include correct payload data for hud_rendered', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(3),
        villageState: createMockVillageState(),
        variant: 'compact',
        maxVisible: 5,
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      const event = window.__activeHUDTelemetryEvents[0];
      expect(event.payload).toMatchObject({
        variant: 'compact',
        activityCount: 3,
        maxVisible: 5,
        hasOverflow: false,
      });
      expect(event.payload.timestamp).toBeGreaterThan(0);
    });

    it('should calculate hasOverflow correctly', () => {
      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(10),
        villageState: createMockVillageState(),
        maxVisible: 5,
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      const renderEvent = window.__activeHUDTelemetryEvents.find(e => e.event === 'hud_rendered');
      const overflowEvent = window.__activeHUDTelemetryEvents.find(e => e.event === 'hud_overflow_shown');

      expect(renderEvent?.payload.hasOverflow).toBe(true);
      expect(overflowEvent?.payload.hasOverflow).toBe(true);
      expect(overflowEvent?.payload.activityCount).toBe(10);
      expect(overflowEvent?.payload.maxVisible).toBe(5);
    });
  });

  describe('Event dispatching', () => {
    it('should dispatch custom events for telemetry', () => {
      const mockDispatch = jest.fn();
      window.dispatchEvent = mockDispatch;

      const props: UseActiveHUDTelemetryProps = {
        hudState: createMockHUDState(),
        villageState: createMockVillageState(),
        enabled: true,
      };

      renderHook(() => useActiveHUDTelemetry(props));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'active-hud-telemetry-analytics',
        })
      );
    });
  });
});
