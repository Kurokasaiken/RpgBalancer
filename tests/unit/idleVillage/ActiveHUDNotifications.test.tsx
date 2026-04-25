/**
 * ActiveHUDNotifications Component Tests
 *
 * Tests for the Phase 12 Active HUD notification layer component.
 * Focuses on notification generation, state monitoring, and telemetry integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ActiveHUDNotifications } from '../../../ui/idleVillage/components/ActiveHUDNotifications';
import { DEFAULT_HUD_NOTIFICATION_CONFIG } from '../../../balancing/config/idleVillage/hudNotificationConfig';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';

// Mock the useHUDNotifications hook
vi.mock('../../../ui/idleVillage/hooks/useHUDNotifications', () => ({
  useHUDNotifications: vi.fn(),
}));

import { useHUDNotifications } from '../../../ui/idleVillage/hooks/useHUDNotifications';

const mockUseHUDNotifications = vi.mocked(useHUDNotifications);

describe('ActiveHUDNotifications', () => {
  const mockAddNotification = vi.fn();
  const mockClearAllNotifications = vi.fn();
  const mockGetNotificationConfig = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHUDNotifications.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      dismissNotification: vi.fn(),
      clearAllNotifications: mockClearAllNotifications,
      getNotificationConfig: mockGetNotificationConfig,
    });

    // Mock window.reportHUDNotificationEvent
    window.reportHUDNotificationEvent = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without errors', () => {
    render(<ActiveHUDNotifications config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    // Should render without throwing
    expect(screen.queryByTestId('hud-notification-layer')).toBeInTheDocument();
  });

  it('generates notifications from village state', async () => {
    const mockVillageState: Partial<VillageState> = {
      resources: {
        food: 5, // Low resource
        wood: 50, // Normal resource
        stone: 2, // Critical resource
      },
      residents: [
        {
          id: 'resident-1',
          name: 'Alice',
          health: 75, // Injured
        },
        {
          id: 'resident-2',
          name: 'Bob',
          health: 0, // Dead
        },
      ],
    } as VillageState;

    render(
      <ActiveHUDNotifications
        villageState={mockVillageState}
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
      />
    );

    // Wait for state processing
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('resource_critical', expect.any(String), expect.objectContaining({
        resourceType: 'stone',
        currentAmount: 2,
        threshold: 10,
        isCritical: true,
      }));
    });

    expect(mockAddNotification).toHaveBeenCalledWith('resource_low', expect.any(String), expect.objectContaining({
      resourceType: 'food',
      currentAmount: 5,
      threshold: 10,
      isCritical: false,
    }));

    expect(mockAddNotification).toHaveBeenCalledWith('resident_killed', expect.any(String), expect.objectContaining({
      residentId: 'resident-2',
      health: 0,
      isFatal: true,
    }));

    expect(mockAddNotification).toHaveBeenCalledWith('resident_injured', expect.any(String), expect.objectContaining({
      residentId: 'resident-1',
      health: 75,
      severity: 'moderate',
    }));
  });

  it('generates notifications from HUD state', async () => {
    const mockHUDState: Partial<ActiveHUDState> = {
      activities: [
        {
          key: 'activity-1',
          activityType: 'job',
          label: 'Gather Wood',
          residentName: 'Alice',
          residentId: 'resident-1',
          progress: 1.0,
          status: 'completed' as const,
          visualVariant: 'jade' as const,
          scheduledId: 'scheduled-1',
          activityId: 'gather-wood',
          remainingSeconds: 0,
        },
        {
          key: 'activity-2',
          activityType: 'quest',
          label: 'Defend Village',
          residentName: 'Bob',
          residentId: 'resident-2',
          progress: 0.5,
          status: 'failed' as const,
          visualVariant: 'ember' as const,
          scheduledId: 'scheduled-2',
          activityId: 'defend-village',
          remainingSeconds: 30,
        },
      ],
    } as ActiveHUDState;

    render(
      <ActiveHUDNotifications
        hudState={mockHUDState}
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
      />
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('activity_completed', expect.any(String), expect.objectContaining({
        activityKey: 'activity-1',
        residentId: 'resident-1',
        activityType: 'job',
        progress: 1.0,
      }));
    });

    expect(mockAddNotification).toHaveBeenCalledWith('activity_failed', expect.any(String), expect.objectContaining({
      activityKey: 'activity-2',
      residentId: 'resident-2',
      activityType: 'quest',
      failureReason: 'unknown',
    }));
  });

  it('emits telemetry events for notifications', async () => {
    const mockVillageState: Partial<VillageState> = {
      resources: {
        food: 5,
      },
    } as VillageState;

    render(
      <ActiveHUDNotifications
        villageState={mockVillageState}
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
        enableTelemetry={true}
      />
    );

    await waitFor(() => {
      expect(window.reportHUDNotificationEvent).toHaveBeenCalledWith({
        eventType: 'hud_notification_generated',
        data: expect.objectContaining({
          triggerType: 'resource_low',
          severity: 'medium',
          timestamp: expect.any(Number),
        }),
      });
    });
  });

  it('does not emit telemetry when disabled', async () => {
    const mockVillageState: Partial<VillageState> = {
      resources: {
        food: 5,
      },
    } as VillageState;

    render(
      <ActiveHUDNotifications
        villageState={mockVillageState}
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
        enableTelemetry={false}
      />
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalled();
    });

    expect(window.reportHUDNotificationEvent).not.toHaveBeenCalled();
  });

  it('provides test interface in test mode', () => {
    render(
      <ActiveHUDNotifications
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
        testMode={true}
      />
    );

    expect(window.__activeHUDNotificationsTest).toBeDefined();
    expect(typeof window.__activeHUDNotificationsTest?.addNotification).toBe('function');
    expect(typeof window.__activeHUDNotificationsTest?.clearAllNotifications).toBe('function');
    expect(typeof window.__activeHUDNotificationsTest?.generateTestNotification).toBe('function');
  });

  it('uses custom config when provided', () => {
    const customConfig = {
      ...DEFAULT_HUD_NOTIFICATION_CONFIG,
      maxConcurrent: 3,
      defaultDurationMs: 2000,
    };

    render(<ActiveHUDNotifications config={customConfig} />);

    expect(mockUseHUDNotifications).toHaveBeenCalledWith(customConfig);
  });

  it('handles empty state gracefully', () => {
    render(<ActiveHUDNotifications config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    // Should not throw and should not generate notifications
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('clears all notifications when called manually', () => {
    const { rerender } = render(
      <ActiveHUDNotifications config={DEFAULT_HUD_NOTIFICATION_CONFIG} />
    );

    // Simulate having notifications
    mockUseHUDNotifications.mockReturnValue({
      notifications: [
        { id: 'test-1', type: 'activity_completed' as const, message: 'Test', timestamp: Date.now(), isDismissing: false },
      ],
      addNotification: mockAddNotification,
      dismissNotification: vi.fn(),
      clearAllNotifications: mockClearAllNotifications,
      getNotificationConfig: mockGetNotificationConfig,
    });

    rerender(<ActiveHUDNotifications config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    // The component should call clearAllNotifications when state changes
    expect(mockClearAllNotifications).toHaveBeenCalled();
  });

  it('prevents duplicate notifications', async () => {
    const mockVillageState: Partial<VillageState> = {
      resources: {
        food: 5,
      },
    } as VillageState;

    const { rerender } = render(
      <ActiveHUDNotifications
        villageState={mockVillageState}
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
      />
    );

    // First render should generate notification
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });

    // Second render with same state should not generate duplicate
    rerender(
      <ActiveHUDNotifications
        villageState={mockVillageState}
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
      />
    );

    // Should not generate additional notifications
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it('handles malformed state gracefully', () => {
    const malformedState = {
      resources: null,
      residents: 'invalid',
    } as unknown as VillageState;

    render(
      <ActiveHUDNotifications
        villageState={malformedState}
        config={DEFAULT_HUD_NOTIFICATION_CONFIG}
      />
    );

    // Should not throw and should handle gracefully
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  describe('Priority Queue', () => {
    it('respects max concurrent limit', () => {
      const customConfig = {
        ...DEFAULT_HUD_NOTIFICATION_CONFIG,
        maxConcurrent: 2,
      };

      render(<ActiveHUDNotifications config={customConfig} />);

      // The hook should respect the max concurrent limit
      expect(mockUseHUDNotifications).toHaveBeenCalledWith(customConfig);
    });

    it('generates high severity notifications for critical issues', async () => {
      const mockVillageState: Partial<VillageState> = {
        resources: {
          food: 1, // Very low
        },
        residents: [
          {
            id: 'resident-1',
            name: 'Alice',
            health: 0, // Dead
          },
        ],
      } as VillageState;

      render(
        <ActiveHUDNotifications
          villageState={mockVillageState}
          config={DEFAULT_HUD_NOTIFICATION_CONFIG}
        />
      );

      await waitFor(() => {
        // Should generate high severity notifications for critical issues
        expect(mockAddNotification).toHaveBeenCalledWith('resource_critical', expect.any(String), expect.objectContaining({
          severity: 'high',
          isCritical: true,
        }));

        expect(mockAddNotification).toHaveBeenCalledWith('resident_killed', expect.any(String), expect.objectContaining({
          severity: 'high',
          isFatal: true,
        }));
      });
    });
  });

  describe('Accessibility', () => {
    it('provides ARIA attributes through HUDNotificationLayer', () => {
      render(<ActiveHUDNotifications config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

      // The HUDNotificationLayer should provide proper ARIA attributes
      const notificationLayer = screen.getByTestId('hud-notification-layer');
      expect(notificationLayer).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('integrates with both village and HUD state simultaneously', async () => {
      const mockVillageState: Partial<VillageState> = {
        resources: {
          food: 5,
        },
      } as VillageState;

      const mockHUDState: Partial<ActiveHUDState> = {
        activities: [
          {
            key: 'activity-1',
            activityType: 'job',
            label: 'Gather Wood',
            residentName: 'Alice',
            residentId: 'resident-1',
            progress: 1.0,
            status: 'completed' as const,
            visualVariant: 'jade' as const,
            scheduledId: 'scheduled-1',
            activityId: 'gather-wood',
            remainingSeconds: 0,
          },
        ],
      } as ActiveHUDState;

      render(
        <ActiveHUDNotifications
          villageState={mockVillageState}
          hudState={mockHUDState}
          config={DEFAULT_HUD_NOTIFICATION_CONFIG}
        />
      );

      await waitFor(() => {
        // Should generate notifications from both states
        expect(mockAddNotification).toHaveBeenCalledWith('resource_low', expect.any(String), expect.any(Object));
        expect(mockAddNotification).toHaveBeenCalledWith('activity_completed', expect.any(String), expect.any(Object));
      });
    });
  });
});
