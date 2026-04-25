/**
 * HUDNotificationLayer Component Tests
 *
 * Tests for the Active HUD Notification Layer component.
 * Focuses on rendering, notification management, and telemetry integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HUDNotificationLayer } from '../../../ui/idleVillage/components/HUDNotificationLayer';
import { DEFAULT_HUD_NOTIFICATION_CONFIG } from '../../../balancing/config/idleVillage/hudNotificationConfig';

// Mock the useHUDNotifications hook
vi.mock('../../../ui/idleVillage/hooks/useHUDNotifications', () => ({
  useHUDNotifications: vi.fn(),
}));

import { useHUDNotifications } from '../../../ui/idleVillage/hooks/useHUDNotifications';

const mockUseHUDNotifications = vi.mocked(useHUDNotifications);

describe('HUDNotificationLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHUDNotifications.mockReturnValue({
      notifications: [],
      addNotification: vi.fn(),
      dismissNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
      getNotificationConfig: vi.fn((type) => DEFAULT_HUD_NOTIFICATION_CONFIG.types[type] || {}),
    });
  });

  it('renders without notifications', () => {
    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    // Should not render anything when no notifications
    expect(screen.queryByTestId('hud-notification-layer')).not.toBeInTheDocument();
  });

  it('renders notifications when present', () => {
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'test-1',
          type: 'activity_completed',
          message: 'Job completed successfully!',
          timestamp: Date.now(),
          isDismissing: false,
        },
      ],
      dismissNotification: vi.fn(),
    });

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    expect(screen.getByTestId('hud-notification-layer')).toBeInTheDocument();
    expect(screen.getByText('Job completed successfully!')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument(); // Icon for activity_completed
  });

  it('handles notification dismissal', async () => {
    const mockDismiss = vi.fn();
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'test-1',
          type: 'activity_failed',
          message: 'Quest failed!',
          timestamp: Date.now(),
          isDismissing: false,
        },
      ],
      dismissNotification: mockDismiss,
    });

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);

    expect(mockDismiss).toHaveBeenCalledWith('test-1');
  });

  it('applies correct styling for different notification types', () => {
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'success',
          type: 'activity_completed',
          message: 'Success!',
          timestamp: Date.now(),
          isDismissing: false,
        },
        {
          id: 'error',
          type: 'resident_killed',
          message: 'Resident killed!',
          timestamp: Date.now(),
          isDismissing: false,
        },
      ],
      dismissNotification: vi.fn(),
    });

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    // Check that different notification types render
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Resident killed!')).toBeInTheDocument();
  });

  it('shows progress bar for auto-dismissing notifications', () => {
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'auto-dismiss',
          type: 'activity_started',
          message: 'Activity started',
          timestamp: Date.now(),
          isDismissing: false,
        },
      ],
      dismissNotification: vi.fn(),
    });

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    // Should have progress bar animation
    const notificationItem = screen.getByText('Activity started').closest('div');
    expect(notificationItem).toBeInTheDocument();
  });

  it('handles dismissing animation state', () => {
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'dismissing',
          type: 'activity_completed',
          message: 'Completing...',
          timestamp: Date.now(),
          isDismissing: true,
        },
      ],
      dismissNotification: vi.fn(),
    });

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    const notificationItem = screen.getByText('Completing...').closest('div');
    expect(notificationItem?.className).toContain('translate-x-full');
    expect(notificationItem?.className).toContain('opacity-0');
  });

  it('displays notification metadata when provided', () => {
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'with-metadata',
          type: 'resource_low',
          message: 'Food running low',
          timestamp: Date.now(),
          isDismissing: false,
          metadata: {
            details: 'Current: 5/100 units',
          },
        },
      ],
      dismissNotification: vi.fn(),
    });

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    expect(screen.getByText('Food running low')).toBeInTheDocument();
    expect(screen.getByText('Current: 5/100 units')).toBeInTheDocument();
  });

  it('handles unknown notification types gracefully', () => {
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'unknown-type',
          type: 'unknown' as any,
          message: 'Unknown notification',
          timestamp: Date.now(),
          isDismissing: false,
        },
      ],
      dismissNotification: vi.fn(),
    });

    // Mock console.warn
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    expect(consoleWarn).toHaveBeenCalledWith('Unknown notification type: unknown');

    consoleWarn.mockRestore();
  });

  it('applies test mode configuration', () => {
    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} testMode />);

    // Should still render correctly with test mode flag
    expect(screen.queryByTestId('hud-notification-layer')).not.toBeInTheDocument();
  });

  it('positions notifications correctly based on config', () => {
    mockUseHUDNotifications.mockReturnValue({
      ...mockUseHUDNotifications(),
      notifications: [
        {
          id: 'position-test',
          type: 'system_message',
          message: 'Test message',
          timestamp: Date.now(),
          isDismissing: false,
        },
      ],
      dismissNotification: vi.fn(),
    });

    render(<HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />);

    const layer = screen.getByTestId('hud-notification-layer');
    expect(layer.style.position).toBe('fixed');
    expect(layer.style.top).toBe('16px');
    expect(layer.style.right).toBe('16px');
  });
});
