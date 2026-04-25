/**
 * Hook for managing Active HUD Notification Layer
 *
 * Manages notification queue with priorities, timing, and telemetry.
 * Config-first design for Phase 12 HUD notifications.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  HUDNotificationConfig,
  HUDNotificationType,
  HUDNotificationTypeConfig,
} from '@/balancing/config/idleVillage/hudNotificationConfig';

/**
 * Individual notification data structure
 */
export interface HUDNotification {
  /** Unique ID for the notification */
  id: string;
  /** Notification type */
  type: HUDNotificationType;
  /** Display message */
  message: string;
  /** Creation timestamp */
  timestamp: number;
  /** Auto-dismiss timer ID (if applicable) */
  timerId?: number;
  /** Whether notification is being dismissed */
  isDismissing: boolean;
  /** Additional metadata for telemetry */
  metadata?: Record<string, any>;
}

/**
 * Hook return type
 */
export interface UseHUDNotificationsResult {
  /** Current active notifications */
  notifications: HUDNotification[];
  /** Add a new notification */
  addNotification: (type: HUDNotificationType, message: string, metadata?: Record<string, any>) => void;
  /** Manually dismiss a notification */
  dismissNotification: (id: string) => void;
  /** Clear all notifications */
  clearAllNotifications: () => void;
  /** Get notification config for a type */
  getNotificationConfig: (type: HUDNotificationType) => HUDNotificationTypeConfig;
}

/**
 * Hook for managing HUD notifications with config-driven behavior
 */
export function useHUDNotifications(config: HUDNotificationConfig): UseHUDNotificationsResult {
  const [notifications, setNotifications] = useState<HUDNotification[]>([]);
  const notificationIdRef = useRef(0);
  const timersRef = useRef<Map<string, number>>(new Map());

  /**
   * Get configuration for a notification type
   */
  const getNotificationConfig = useCallback(
    (type: HUDNotificationType): HUDNotificationTypeConfig => {
      return config.types[type];
    },
    [config.types]
  );

  /**
   * Add a new notification to the queue
   */
  const addNotification = useCallback(
    (type: HUDNotificationType, message: string, metadata?: Record<string, any>) => {
      const id = `notification-${++notificationIdRef.current}`;
      const typeConfig = getNotificationConfig(type);
      const duration = typeConfig.durationMs ?? config.defaultDurationMs;

      const notification: HUDNotification = {
        id,
        type,
        message,
        timestamp: Date.now(),
        isDismissing: false,
        metadata,
      };

      // Add to notifications, respecting max concurrent limit
      setNotifications((prev) => {
        const newNotifications = [notification, ...prev];
        // Sort by priority (higher priority first)
        newNotifications.sort((a, b) => {
          const aPriority = getNotificationConfig(a.type).priority;
          const bPriority = getNotificationConfig(b.type).priority;
          return bPriority - aPriority;
        });
        // Limit to max concurrent
        return newNotifications.slice(0, config.maxConcurrent);
      });

      // Set up auto-dismiss timer if enabled
      if (typeConfig.dismiss.autoDismiss && duration > 0) {
        const timerId = window.setTimeout(() => {
          dismissNotification(id);
        }, duration);
        timersRef.current.set(id, timerId);
        notification.timerId = timerId;
      }

      // Emit telemetry event
      if (window.reportHUDNotificationEvent) {
        window.reportHUDNotificationEvent({
          eventType: 'hud_notification_shown',
          data: {
            notificationId: id,
            type,
            message,
            priority: typeConfig.priority,
            duration,
            timestamp: notification.timestamp,
            metadata,
          },
        });
      }
    },
    [config, getNotificationConfig]
  );

  /**
   * Dismiss a notification
   */
  const dismissNotification = useCallback((id: string) => {
    // Clear timer if exists
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }

    // Mark as dismissing for animation
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isDismissing: true } : n))
    );

    // Remove after animation delay
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, config.animation.exitDurationMs);

    // Emit telemetry event
    if (window.reportHUDNotificationEvent) {
      window.reportHUDNotificationEvent({
        eventType: 'hud_notification_dismissed',
        data: {
          notificationId: id,
          timestamp: Date.now(),
        },
      });
    }
  }, [config.animation.exitDurationMs]);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();

    // Mark all as dismissing
    setNotifications((prev) => prev.map((n) => ({ ...n, isDismissing: true })));

    // Clear after animation
    setTimeout(() => {
      setNotifications([]);
    }, config.animation.exitDurationMs);

    // Emit telemetry event
    if (window.reportHUDNotificationEvent) {
      window.reportHUDNotificationEvent({
        eventType: 'hud_notifications_cleared',
        data: {
          clearedCount: notifications.length,
          timestamp: Date.now(),
        },
      });
    }
  }, [config.animation.exitDurationMs, notifications.length]);

  /**
   * Handle pause/resume on hover for notifications that support it
   */
  const handleNotificationHover = useCallback(
    (id: string, isHovering: boolean) => {
      const notification = notifications.find((n) => n.id === id);
      if (!notification) return;

      const typeConfig = getNotificationConfig(notification.type);
      if (!typeConfig.dismiss.hoverToPause) return;

      if (isHovering) {
        // Pause timer
        const timerId = timersRef.current.get(id);
        if (timerId) {
          clearTimeout(timerId);
          timersRef.current.delete(id);
        }
      } else {
        // Resume timer
        const duration = typeConfig.durationMs ?? config.defaultDurationMs;
        if (duration > 0) {
          const remainingTime = duration - (Date.now() - notification.timestamp);
          if (remainingTime > 0) {
            const timerId = window.setTimeout(() => {
              dismissNotification(id);
            }, remainingTime);
            timersRef.current.set(id, timerId);
          } else {
            // Time already expired, dismiss immediately
            dismissNotification(id);
          }
        }
      }
    },
    [notifications, getNotificationConfig, config.defaultDurationMs, dismissNotification]
  );

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    getNotificationConfig,
  };
}

/**
 * Global telemetry function declaration (implemented in telemetry system)
 */
declare global {
  interface Window {
    reportHUDNotificationEvent?: (event: {
      eventType: string;
      data: Record<string, any>;
    }) => void;
  }
}
