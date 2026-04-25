/**
 * React hook for the Notification System
 * 
 * Provides a convenient way to use the notification system in React components
 * with automatic subscription management and state updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  Notification, 
  NotificationQueueState, 
  NotificationSettings, 
  NotificationType, 
  NotificationSeverity,
  NotificationAction
} from '../notificationSystem';
import { 
  notificationSystem,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showModal,
  showAlert,
  showProgress
} from '../notificationSystem';

/**
 * Hook return type
 */
export interface UseNotificationSystemReturn {
  /** Current notification state */
  state: NotificationQueueState;
  /** Active notifications */
  notifications: Notification[];
  /** Dismissed notifications */
  dismissed: Notification[];
  /** Current settings */
  settings: NotificationSettings;
  /** Add a notification */
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<string>;
  /** Dismiss a notification */
  dismissNotification: (id: string) => Promise<void>;
  /** Execute notification action */
  executeAction: (notificationId: string, actionId: string) => Promise<void>;
  /** Clear all notifications */
  clearAll: () => Promise<void>;
  /** Clear dismissed notifications */
  clearDismissed: () => Promise<void>;
  /** Update settings */
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  /** Get notification statistics */
  getStatistics: () => {
    total: number;
    active: number;
    dismissed: number;
    byType: Record<NotificationType, number>;
    bySeverity: Record<NotificationSeverity, number>;
  };
  /** Convenience methods */
  showSuccess: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => Promise<string>;
  showError: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => Promise<string>;
  showWarning: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => Promise<string>;
  showInfo: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => Promise<string>;
  showModal: (title: string, message: string, actions?: NotificationAction[], options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => Promise<string>;
  showAlert: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => Promise<string>;
  showProgress: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => Promise<string>;
}

/**
 * React hook for the notification system
 * 
 * @param settings - Optional settings to override defaults
 * @returns Hook API with notification management functions
 */
export function useNotificationSystem(settings?: Partial<NotificationSettings>): UseNotificationSystemReturn {
  // Create notification system instance with settings
  const [notificationSystemInstance] = useState(() => {
    return settings ? new (notificationSystem.constructor as any)(settings) : notificationSystem;
  });

  // State for triggering re-renders
  const [, forceUpdate] = useState({});

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = notificationSystemInstance.subscribe(() => {
      // Force re-render when state changes
      forceUpdate({});
    });

    return unsubscribe;
  }, [notificationSystemInstance]);

  // Get current state
  const state = useMemo(() => notificationSystemInstance.getState(), [notificationSystemInstance]);

  // Memoized callback functions
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt'>) => 
      notificationSystemInstance.addNotification(notification),
    [notificationSystemInstance]
  );

  const dismissNotification = useCallback(
    (id: string) => notificationSystemInstance.dismissNotification(id),
    [notificationSystemInstance]
  );

  const executeAction = useCallback(
    (notificationId: string, actionId: string) => 
      notificationSystemInstance.executeAction(notificationId, actionId),
    [notificationSystemInstance]
  );

  const clearAll = useCallback(
    () => notificationSystemInstance.clearAll(),
    [notificationSystemInstance]
  );

  const clearDismissed = useCallback(
    () => notificationSystemInstance.clearDismissed(),
    [notificationSystemInstance]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => 
      notificationSystemInstance.updateSettings(newSettings),
    [notificationSystemInstance]
  );

  const getStatistics = useCallback(
    () => notificationSystemInstance.getStatistics(),
    [notificationSystemInstance]
  );

  // Convenience methods
  const showSuccessCallback = useCallback(
    (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) =>
      showSuccess(title, message, options),
    []
  );

  const showErrorCallback = useCallback(
    (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) =>
      showError(title, message, options),
    []
  );

  const showWarningCallback = useCallback(
    (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) =>
      showWarning(title, message, options),
    []
  );

  const showInfoCallback = useCallback(
    (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) =>
      showInfo(title, message, options),
    []
  );

  const showModalCallback = useCallback(
    (title: string, message: string, actions?: NotificationAction[], options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) =>
      showModal(title, message, actions, options),
    []
  );

  const showAlertCallback = useCallback(
    (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) =>
      showAlert(title, message, options),
    []
  );

  const showProgressCallback = useCallback(
    (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) =>
      showProgress(title, message, options),
    []
  );

  return {
    state,
    notifications: state.active,
    dismissed: state.dismissed,
    settings: state.settings,
    addNotification,
    dismissNotification,
    executeAction,
    clearAll,
    clearDismissed,
    updateSettings,
    getStatistics,
    showSuccess: showSuccessCallback,
    showError: showErrorCallback,
    showWarning: showWarningCallback,
    showInfo: showInfoCallback,
    showModal: showModalCallback,
    showAlert: showAlertCallback,
    showProgress: showProgressCallback,
  };
}

/**
 * Hook for notification statistics
 * 
 * @param notificationSystem - Optional notification system instance
 * @returns Statistics object
 */
export function useNotificationStatistics(notificationSystemInstance = notificationSystem) {
  const [statistics, setStatistics] = useState(() => notificationSystemInstance.getStatistics());

  useEffect(() => {
    const unsubscribe = notificationSystemInstance.subscribe(() => {
      setStatistics(notificationSystemInstance.getStatistics());
    });

    return unsubscribe;
  }, [notificationSystemInstance]);

  return statistics;
}

/**
 * Hook for notifications by type
 * 
 * @param type - Notification type to filter by
 * @param notificationSystem - Optional notification system instance
 * @returns Array of notifications of the specified type
 */
export function useNotificationsByType(
  type: NotificationType, 
  notificationSystemInstance = notificationSystem
) {
  const [notifications, setNotifications] = useState(() => 
    notificationSystemInstance.getNotificationsByType(type)
  );

  useEffect(() => {
    const unsubscribe = notificationSystemInstance.subscribe(() => {
      setNotifications(notificationSystemInstance.getNotificationsByType(type));
    });

    return unsubscribe;
  }, [notificationSystemInstance, type]);

  return notifications;
}

/**
 * Hook for notifications by severity
 * 
 * @param severity - Notification severity to filter by
 * @param notificationSystem - Optional notification system instance
 * @returns Array of notifications of the specified severity
 */
export function useNotificationsBySeverity(
  severity: NotificationSeverity, 
  notificationSystemInstance = notificationSystem
) {
  const [notifications, setNotifications] = useState(() => 
    notificationSystemInstance.getNotificationsBySeverity(severity)
  );

  useEffect(() => {
    const unsubscribe = notificationSystemInstance.subscribe(() => {
      setNotifications(notificationSystemInstance.getNotificationsBySeverity(severity));
    });

    return unsubscribe;
  }, [notificationSystemInstance, severity]);

  return notifications;
}

/**
 * Hook for notification count
 * 
 * @param notificationSystem - Optional notification system instance
 * @returns Object with count information
 */
export function useNotificationCount(notificationSystemInstance = notificationSystem) {
  const statistics = useNotificationStatistics(notificationSystemInstance);
  
  return {
    total: statistics.total,
    active: statistics.active,
    dismissed: statistics.dismissed,
    hasActive: statistics.active > 0,
    hasDismissed: statistics.dismissed > 0,
  };
}

/**
 * Default export
 */
export default useNotificationSystem;
