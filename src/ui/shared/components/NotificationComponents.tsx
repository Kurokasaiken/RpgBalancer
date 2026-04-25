/**
 * Notification UI Components
 * 
 * React components for displaying different types of notifications
 * with consistent styling and animations.
 */

import React from 'react';
import type { Notification, NotificationAction, NotificationType, NotificationSeverity } from '../notificationSystem';

/**
 * Props for NotificationToast component
 */
interface NotificationToastProps {
  /** Notification data */
  notification: Notification;
  /** Callback when notification is dismissed */
  onDismiss: (id: string) => void;
  /** Callback when action is executed */
  onAction: (notificationId: string, actionId: string) => void;
}

/**
 * Toast notification component
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const getSeverityStyles = (severity: NotificationSeverity) => {
    const styles = {
      info: 'bg-blue-900/80 border-blue-500/60 text-blue-200',
      success: 'bg-emerald-900/80 border-emerald-500/60 text-emerald-200',
      warning: 'bg-amber-900/80 border-amber-500/60 text-amber-200',
      error: 'bg-red-900/80 border-red-500/60 text-red-200',
      critical: 'bg-purple-900/80 border-purple-500/60 text-purple-200',
    };
    return styles[severity];
  };

  const getIcon = (severity: NotificationSeverity) => {
    const icons = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✕',
      critical: '🔥',
    };
    return icons[severity];
  };

  return (
    <div
      className={`
        fixed p-4 rounded-lg border shadow-lg z-50
        max-w-sm w-full
        animate-in fade-in slide-in-from-right-4 duration-300
        ${getSeverityStyles(notification.severity)}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold flex-shrink-0">
          {getIcon(notification.severity)}
        </span>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight">
            {notification.title}
          </h4>
          <p className="text-sm opacity-90 mt-1 leading-tight">
            {notification.message}
          </p>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onAction(notification.id, action.id)}
                  className={`
                    px-3 py-1 text-xs font-medium rounded
                    transition-colors duration-200
                    ${
                      action.type === 'primary'
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : action.type === 'secondary'
                        ? 'bg-black/20 hover:bg-black/30 text-white'
                        : 'bg-red-500/20 hover:bg-red-500/30 text-white'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors duration-200"
          aria-label="Dismiss notification"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Props for NotificationModal component
 */
interface NotificationModalProps {
  /** Notification data */
  notification: Notification;
  /** Callback when notification is dismissed */
  onDismiss: (id: string) => void;
  /** Callback when action is executed */
  onAction: (notificationId: string, actionId: string) => void;
}

/**
 * Modal notification component
 */
export const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const getSeverityStyles = (severity: NotificationSeverity) => {
    const styles = {
      info: 'border-blue-500 text-blue-200',
      success: 'border-emerald-500 text-emerald-200',
      warning: 'border-amber-500 text-amber-200',
      error: 'border-red-500 text-red-200',
      critical: 'border-purple-500 text-purple-200',
    };
    return styles[severity];
  };

  const getIcon = (severity: NotificationSeverity) => {
    const icons = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✕',
      critical: '🔥',
    };
    return icons[severity];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
        <div className={`border-l-4 p-6 ${getSeverityStyles(notification.severity)}`}>
          <div className="flex items-start gap-4">
            <span className="text-2xl font-bold flex-shrink-0">
              {getIcon(notification.severity)}
            </span>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                {notification.title}
              </h3>
              <p className="text-sm opacity-90 mb-4">
                {notification.message}
              </p>
              
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex gap-3">
                  {notification.actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => onAction(notification.id, action.id)}
                      className={`
                        px-4 py-2 text-sm font-medium rounded
                        transition-colors duration-200
                        ${
                          action.type === 'primary'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : action.type === 'secondary'
                            ? 'bg-slate-700 hover:bg-slate-600 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }
                      `}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Props for NotificationAlert component
 */
interface NotificationAlertProps {
  /** Notification data */
  notification: Notification;
  /** Callback when notification is dismissed */
  onDismiss: (id: string) => void;
  /** Callback when action is executed */
  onAction: (notificationId: string, actionId: string) => void;
}

/**
 * Alert notification component
 */
export const NotificationAlert: React.FC<NotificationAlertProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const getSeverityStyles = (severity: NotificationSeverity) => {
    const styles = {
      info: 'bg-blue-500/20 border-blue-500 text-blue-200',
      success: 'bg-emerald-500/20 border-emerald-500 text-emerald-200',
      warning: 'bg-amber-500/20 border-amber-500 text-amber-200',
      error: 'bg-red-500/20 border-red-500 text-red-200',
      critical: 'bg-purple-500/20 border-purple-500 text-purple-200',
    };
    return styles[severity];
  };

  const getIcon = (severity: NotificationSeverity) => {
    const icons = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✕',
      critical: '🔥',
    };
    return icons[severity];
  };

  return (
    <div
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2
        p-4 rounded-lg border shadow-lg z-50
        max-w-2xl w-full
        animate-in fade-in slide-in-from-top-4 duration-300
        ${getSeverityStyles(notification.severity)}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold flex-shrink-0">
          {getIcon(notification.severity)}
        </span>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">
            {notification.title}
          </h4>
          <p className="text-sm opacity-90 mt-1">
            {notification.message}
          </p>
        </div>
        
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors duration-200"
          aria-label="Dismiss notification"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Props for NotificationProgress component
 */
interface NotificationProgressProps {
  /** Notification data */
  notification: Notification;
  /** Callback when notification is dismissed */
  onDismiss: (id: string) => void;
  /** Callback when action is executed */
  onAction: (notificationId: string, actionId: string) => void;
}

/**
 * Progress notification component
 */
export const NotificationProgress: React.FC<NotificationProgressProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50 p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h4 className="font-semibold text-sm text-white">
              {notification.title}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {notification.message}
            </p>
          </div>
        </div>
        
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex gap-2">
            {notification.actions.map((action) => (
              <button
                key={action.id}
                onClick={() => onAction(notification.id, action.id)}
                className={`
                  px-3 py-1 text-xs font-medium rounded
                  transition-colors duration-200
                  ${
                    action.type === 'primary'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : action.type === 'secondary'
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Props for NotificationContainer component
 */
interface NotificationContainerProps {
  /** Array of notifications to display */
  notifications: Notification[];
  /** Position for toast notifications */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Callback when notification is dismissed */
  onDismiss: (id: string) => void;
  /** Callback when action is executed */
  onAction: (notificationId: string, actionId: string) => void;
}

/**
 * Container for rendering multiple notifications
 */
export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  position = 'top-right',
  onDismiss,
  onAction,
}) => {
  const getPositionStyles = () => {
    const styles = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
    };
    return styles[position];
  };

  // Group notifications by type
  const groupedNotifications = notifications.reduce((groups, notification) => {
    if (!groups[notification.type]) {
      groups[notification.type] = [];
    }
    groups[notification.type].push(notification);
    return groups;
  }, {} as Record<NotificationType, Notification[]>);

  return (
    <>
      {/* Toast notifications */}
      {groupedNotifications.toast && (
        <div className={`fixed ${getPositionStyles()} space-y-2 z-50`}>
          {groupedNotifications.toast.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onDismiss={onDismiss}
              onAction={onAction}
            />
          ))}
        </div>
      )}

      {/* Modal notifications (only show the first one) */}
      {groupedNotifications.modal && groupedNotifications.modal.length > 0 && (
        <NotificationModal
          key={groupedNotifications.modal[0].id}
          notification={groupedNotifications.modal[0]}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      )}

      {/* Alert notifications (only show the first one) */}
      {groupedNotifications.alert && groupedNotifications.alert.length > 0 && (
        <NotificationAlert
          key={groupedNotifications.alert[0].id}
          notification={groupedNotifications.alert[0]}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      )}

      {/* Progress notifications (only show the first one) */}
      {groupedNotifications.progress && groupedNotifications.progress.length > 0 && (
        <NotificationProgress
          key={groupedNotifications.progress[0].id}
          notification={groupedNotifications.progress[0]}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      )}

      {/* System notifications */}
      {groupedNotifications.system && (
        <div className={`fixed ${getPositionStyles()} space-y-2 z-50`}>
          {groupedNotifications.system.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onDismiss={onDismiss}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </>
  );
};

/**
 * Default export
 */
export default NotificationContainer;
