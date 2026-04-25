/**
 * NP-039 – Idle Village Scheduler Telemetry Alerting
 *
 * React hooks for alert notification delivery and in-app alert management.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AlertInstance, AlertSeverity } from '../types/telemetryAlertScheduler';
import { getSeverityColor } from '../types/telemetryAlertScheduler';

/**
 * In-app notification item
 */
export interface InAppNotification {
  id: string;
  alertId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

/**
 * Notification hook options
 */
export interface UseAlertNotificationsOptions {
  autoDismissDelay?: number; // Auto-dismiss delay in ms
  maxNotifications?: number; // Maximum number of notifications to keep
  enableToast?: boolean; // Enable toast notifications
  toastDuration?: number; // Toast duration in ms
}

/**
 * Alert notifications hook return type
 */
export interface UseAlertNotificationsReturn {
  notifications: InAppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismiss: (notificationId: string) => void;
  dismissAll: () => void;
  showAlertToast: (alert: AlertInstance) => void;
  clearAll: () => void;
}

/**
 * Hook for managing in-app alert notifications
 */
export function useAlertNotifications(
  alerts: AlertInstance[],
  options: UseAlertNotificationsOptions = {}
): UseAlertNotificationsReturn {
  const {
    autoDismissDelay = 10000, // 10 seconds
    maxNotifications = 50,
    enableToast = true,
    toastDuration = 5000,
  } = options;

  // Initialize permission synchronously
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const dismissTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Convert alerts to notifications using useMemo
  const processedNotifications = useMemo(() => {
    const newNotifications = alerts.map(alert => ({
      id: `notification-${alert.id}`,
      alertId: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.triggeredAt,
      read: false,
      dismissed: false,
    }));

    // Merge with existing notifications
    const merged = [...notifications];

    newNotifications.forEach(newNotif => {
      const existing = merged.find(n => n.alertId === newNotif.alertId);
      if (!existing) {
        merged.push(newNotif);
      }
    });

    // Remove notifications for resolved alerts
    const activeAlertIds = new Set(alerts.map(a => a.id));
    const filtered = merged.filter(n => activeAlertIds.has(n.alertId) || n.dismissed);

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to max notifications
    return filtered.slice(0, maxNotifications);
  }, [alerts, notifications, maxNotifications]);

  // Update notifications when processedNotifications changes
  useEffect(() => {
    setNotifications(processedNotifications);
  }, [processedNotifications]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  /**
   * Dismiss notification
   */
  const dismiss = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, dismissed: true } : n
      )
    );

    // Clear dismiss timeout
    const timeout = dismissTimeoutsRef.current.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      dismissTimeoutsRef.current.delete(notificationId);
    }
  }, []);

  // Handle auto-dismiss
  useEffect(() => {
    if (autoDismissDelay <= 0) return;

    notifications.forEach(notification => {
      if (notification.dismissed || dismissTimeoutsRef.current.has(notification.id)) return;

      const timeout = setTimeout(() => {
        dismiss(notification.id);
      }, autoDismissDelay);

      dismissTimeoutsRef.current.set(notification.id, timeout);
    });

    return () => {
      const currentTimeouts = dismissTimeoutsRef.current;
      currentTimeouts.forEach(timeout => clearTimeout(timeout));
      currentTimeouts.clear();
    };
  }, [notifications, autoDismissDelay, dismiss]);

  /**
   * Dismiss all notifications
   */
  const dismissAll = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, dismissed: true }))
    );

    // Clear all dismiss timeouts
    const currentTimeouts = dismissTimeoutsRef.current;
    currentTimeouts.forEach(timeout => clearTimeout(timeout));
    currentTimeouts.clear();
  }, []);

  /**
   * Show alert as toast notification
   */
  const showAlertToast = useCallback((alert: AlertInstance) => {
    if (!enableToast) return;

    const toastId = `toast-${alert.id}-${Date.now()}`;

    // Create toast element
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
      getSeverityColor(alert.severity) === 'red' ? 'bg-red-50 border-red-500' :
      getSeverityColor(alert.severity) === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
      getSeverityColor(alert.severity) === 'blue' ? 'bg-blue-50 border-blue-500' :
      'bg-gray-50 border-gray-500'
    }`;
    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900">${alert.title}</h4>
          <p class="text-sm text-gray-600 mt-1">${alert.message}</p>
        </div>
        <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove toast
    const timeout = setTimeout(() => {
      const element = document.getElementById(toastId);
      if (element) {
        element.remove();
      }
    }, toastDuration);

    toastTimeoutsRef.current.set(toastId, timeout);
  }, [enableToast, toastDuration]);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    dismissTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    dismissTimeoutsRef.current.clear();
  }, []);

  // Show toast for new alerts
  useEffect(() => {
    alerts.forEach(alert => {
      const existingToast = Array.from(toastTimeoutsRef.current.keys())
        .some(id => id.includes(alert.id));

      if (!existingToast) {
        showAlertToast(alert);
      }
    });
  }, [alerts, showAlertToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentToastTimeouts = toastTimeoutsRef.current;
      currentToastTimeouts.forEach(timeout => clearTimeout(timeout));
      currentToastTimeouts.clear();

      const currentDismissTimeouts = dismissTimeoutsRef.current;
      currentDismissTimeouts.forEach(timeout => clearTimeout(timeout));
      currentDismissTimeouts.clear();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  return {
    notifications: notifications.filter(n => !n.dismissed),
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    showAlertToast,
    clearAll,
  };
}

/**
 * Hook for alert event subscription
 */
export function useAlertEvents(
  onAlertTriggered?: (alert: AlertInstance) => void,
  onAlertResolved?: (alertId: string) => void
) {
  const [alerts, setAlerts] = useState<AlertInstance[]>([]);

  // This would normally connect to a global alert event system
  // For now, it's a placeholder for integration with the scheduler

  useEffect(() => {
    // Placeholder: In a real implementation, this would subscribe to alert events
    // from a global event emitter or WebSocket connection

    // const handleAlertTriggered = (alert: AlertInstance) => {
    //   setAlerts(prev => [...prev, alert]);
    //   onAlertTriggered?.(alert);
    // };

    // const handleAlertResolved = (alertId: string) => {
    //   setAlerts(prev => prev.filter(a => a.id !== alertId));
    //   onAlertResolved?.(alertId);
    // };

    // Placeholder event listeners
    // window.addEventListener('alert:triggered', handleAlertTriggered);
    // window.addEventListener('alert:resolved', handleAlertResolved);

    return () => {
      // Cleanup
      // window.removeEventListener('alert:triggered', handleAlertTriggered);
      // window.removeEventListener('alert:resolved', handleAlertResolved);
    };
  }, [onAlertTriggered, onAlertResolved]);

  return {
    alerts,
    clearAlerts: () => setAlerts([]),
  };
}

/**
 * Hook for alert sound notifications
 */
export function useAlertSounds(
  enabled: boolean = true,
  volume: number = 0.5
) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (enabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported for alert sounds');
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [enabled]);

  const playAlertSound = useCallback((severity: AlertSeverity) => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Configure sound based on severity
      switch (severity) {
        case 'critical':
          oscillator.frequency.setValueAtTime(800, context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.3);
          gainNode.gain.setValueAtTime(volume, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(600, context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.2);
          gainNode.gain.setValueAtTime(volume, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
          break;
        case 'warning':
          oscillator.frequency.setValueAtTime(500, context.currentTime);
          gainNode.gain.setValueAtTime(volume * 0.7, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
          break;
        default:
          oscillator.frequency.setValueAtTime(400, context.currentTime);
          gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      }

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);

    } catch {
      console.warn('Failed to play alert sound');
    }
  }, [enabled, volume]);

  return { playAlertSound };
}

/**
 * Hook for notification permissions
 */
export function useNotificationPermissions() {
  // Initialize permission synchronously
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      console.warn('Failed to request notification permission');
      return false;
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return null;

    try {
      return new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
      return null;
    }
  }, [permission]);

  return {
    permission,
    requestPermission,
    showBrowserNotification,
    supported: 'Notification' in window,
  };
}
