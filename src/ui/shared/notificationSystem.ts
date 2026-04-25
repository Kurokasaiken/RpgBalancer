/**
 * Unified Notification System for RPG Balancer
 * 
 * Provides a centralized notification management system with:
 * - Queue management with priority levels
 * - Persistence via PersistenceService
 * - Telemetry integration
 * - Multiple notification types (toast, modal, alert, progress)
 * - Configurable behavior and styling
 */

import { z } from 'zod';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';

/**
 * Notification types
 */
export type NotificationType = 'toast' | 'modal' | 'alert' | 'progress' | 'system';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Base notification interface
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Type of notification */
  type: NotificationType;
  /** Severity level */
  severity: NotificationSeverity;
  /** Priority level */
  priority: NotificationPriority;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Optional action buttons */
  actions?: NotificationAction[];
  /** Auto-dismiss timeout in milliseconds (0 = no auto-dismiss) */
  autoDismiss?: number;
  /** Whether notification is persistent across sessions */
  persistent?: boolean;
  /** Timestamp when notification was created */
  createdAt: number;
  /** Timestamp when notification expires (optional) */
  expiresAt?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Notification action button
 */
export interface NotificationAction {
  /** Action identifier */
  id: string;
  /** Button label */
  label: string;
  /** Action type */
  type: 'primary' | 'secondary' | 'danger';
  /** Action handler */
  handler: () => void | Promise<void>;
}

/**
 * Notification queue state
 */
export interface NotificationQueueState {
  /** Active notifications */
  active: Notification[];
  /** Dismissed notifications (for history) */
  dismissed: Notification[];
  /** Queue settings */
  settings: NotificationSettings;
}

/**
 * Notification system settings
 */
export interface NotificationSettings {
  /** Maximum active notifications */
  maxActive: number;
  /** Default auto-dismiss timeout by type */
  defaultTimeout: Record<NotificationType, number>;
  /** Enable sound effects */
  enableSound: boolean;
  /** Enable vibration */
  enableVibration: boolean;
  /** Position of toast notifications */
  toastPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Enable persistence */
  enablePersistence: boolean;
  /** Enable telemetry */
  enableTelemetry: boolean;
}

/**
 * Zod schema for notification validation
 */
export const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum(['toast', 'modal', 'alert', 'progress', 'system']),
  severity: z.enum(['info', 'success', 'warning', 'error', 'critical']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  actions: z.array(z.object({
    id: z.string(),
    label: z.string().min(1).max(50),
    type: z.enum(['primary', 'secondary', 'danger']),
    handler: z.function(),
  })).optional(),
  autoDismiss: z.number().nonnegative().optional(),
  persistent: z.boolean().optional(),
  createdAt: z.number(),
  expiresAt: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Zod schema for notification settings
 */
export const NotificationSettingsSchema = z.object({
  maxActive: z.number().min(1).max(50),
  defaultTimeout: z.record(z.enum(['toast', 'modal', 'alert', 'progress', 'system']), z.number().min(0)),
  enableSound: z.boolean(),
  enableVibration: z.boolean(),
  toastPosition: z.enum(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
  enablePersistence: z.boolean(),
  enableTelemetry: z.boolean(),
});

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  maxActive: 5,
  defaultTimeout: {
    toast: 5000,
    modal: 0,
    alert: 10000,
    progress: 0,
    system: 8000,
  },
  enableSound: false,
  enableVibration: false,
  toastPosition: 'top-right',
  enablePersistence: true,
  enableTelemetry: true,
};

/**
 * Notification system class
 */
export class NotificationSystem {
  private queue: Notification[] = [];
  private dismissed: Notification[] = [];
  private settings: NotificationSettings;
  private listeners: Set<(state: NotificationQueueState) => void> = new Set();
  private telemetryEnabled: boolean;
  private readonly STORAGE_KEY = 'rpg_balancer_notifications';

  constructor(settings: Partial<NotificationSettings> = {}) {
    this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
    this.telemetryEnabled = this.settings.enableTelemetry;
    
    // Load persisted state
    this.loadPersistedState();
  }

  /**
   * Add a notification to the queue
   */
  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
    };

    // Validate notification
    const validated = NotificationSchema.parse(fullNotification);

    // Check queue capacity
    if (this.queue.length >= this.settings.maxActive) {
      // Remove oldest low priority notification
      const oldestIndex = this.queue.findIndex(n => n.priority === 'low');
      if (oldestIndex !== -1) {
        const removed = this.queue.splice(oldestIndex, 1)[0];
        this.dismissed.push(removed);
      } else {
        // Remove oldest notification
        const removed = this.queue.shift();
        if (removed) {
          this.dismissed.push(removed);
        }
      }
    }

    // Add to queue
    this.queue.push(validated);
    
    // Sort by priority
    this.queue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));

    // Emit telemetry
    this.emitTelemetry('notification_added', {
      id: validated.id,
      type: validated.type,
      severity: validated.severity,
      priority: validated.priority,
    });

    // Persist state
    if (this.settings.enablePersistence) {
      await this.persistState();
    }

    // Notify listeners
    this.notifyListeners();

    // Schedule auto-dismiss
    if (validated.autoDismiss && validated.autoDismiss > 0) {
      setTimeout(() => {
        this.dismissNotification(validated.id);
      }, validated.autoDismiss);
    }

    return id;
  }

  /**
   * Dismiss a notification
   */
  async dismissNotification(id: string): Promise<void> {
    const index = this.queue.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = this.queue.splice(index, 1)[0];
      this.dismissed.push(notification);

      // Emit telemetry
      this.emitTelemetry('notification_dismissed', {
        id: notification.id,
        type: notification.type,
        duration: Date.now() - notification.createdAt,
      });

      // Persist state
      if (this.settings.enablePersistence) {
        await this.persistState();
      }

      // Notify listeners
      this.notifyListeners();
    }
  }

  /**
   * Execute a notification action
   */
  async executeAction(notificationId: string, actionId: string): Promise<void> {
    const notification = this.queue.find(n => n.id === notificationId);
    if (!notification || !notification.actions) {
      return;
    }

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) {
      return;
    }

    try {
      await action.handler();

      // Emit telemetry
      this.emitTelemetry('notification_action_executed', {
        notificationId: notification.id,
        actionId: action.id,
        actionType: action.type,
      });

      // Dismiss notification after action
      await this.dismissNotification(notificationId);
    } catch (error) {
      console.error('Notification action failed:', error);
      
      // Emit error telemetry
      this.emitTelemetry('notification_action_error', {
        notificationId: notification.id,
        actionId: action.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    const cleared = [...this.queue];
    this.queue = [];
    this.dismissed.push(...cleared);

    // Emit telemetry
    this.emitTelemetry('notifications_cleared', {
      count: cleared.length,
    });

    // Persist state
    if (this.settings.enablePersistence) {
      await this.persistState();
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Clear dismissed notifications
   */
  async clearDismissed(): Promise<void> {
    this.dismissed = [];

    // Persist state
    if (this.settings.enablePersistence) {
      await this.persistState();
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get current queue state
   */
  getState(): NotificationQueueState {
    return {
      active: [...this.queue],
      dismissed: [...this.dismissed],
      settings: { ...this.settings },
    };
  }

  /**
   * Update settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    
    // Validate settings
    NotificationSettingsSchema.parse(this.settings);

    // Persist state
    if (this.settings.enablePersistence) {
      await this.persistState();
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: NotificationQueueState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): Notification | undefined {
    return this.queue.find(n => n.id === id) || this.dismissed.find(n => n.id === id);
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: NotificationType): Notification[] {
    return this.queue.filter(n => n.type === type);
  }

  /**
   * Get notifications by severity
   */
  getNotificationsBySeverity(severity: NotificationSeverity): Notification[] {
    return this.queue.filter(n => n.severity === severity);
  }

  /**
   * Get notification statistics
   */
  getStatistics(): {
    total: number;
    active: number;
    dismissed: number;
    byType: Record<NotificationType, number>;
    bySeverity: Record<NotificationSeverity, number>;
  } {
    const byType = this.queue.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    const bySeverity = this.queue.reduce((acc, n) => {
      acc[n.severity] = (acc[n.severity] || 0) + 1;
      return acc;
    }, {} as Record<NotificationSeverity, number>);

    return {
      total: this.queue.length + this.dismissed.length,
      active: this.queue.length,
      dismissed: this.dismissed.length,
      byType,
      bySeverity,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get priority value for sorting
   */
  private getPriorityValue(priority: NotificationPriority): number {
    const values = {
      low: 0,
      normal: 1,
      high: 2,
      urgent: 3,
    };
    return values[priority];
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetry(event: string, data: Record<string, unknown>): void {
    if (!this.telemetryEnabled) {
      return;
    }

    try {
      // Import telemetry dynamically to avoid circular dependencies
      import('@/analytics/__mocks__/telemetry').then(({ telemetry }) => {
        telemetry.track(event, data);
      }).catch(() => {
        // Silently fail if telemetry is not available
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  /**
   * Persist state to storage
   */
  private async persistState(): Promise<void> {
    try {
      const state = {
        queue: this.queue,
        dismissed: this.dismissed,
        settings: this.settings,
      };
      await saveData(this.STORAGE_KEY, state);
    } catch (error) {
      console.error('Failed to persist notification state:', error);
    }
  }

  /**
   * Load persisted state from storage
   */
  private async loadPersistedState(): Promise<void> {
    if (!this.settings.enablePersistence) {
      return;
    }

    try {
      const persisted = await loadData(this.STORAGE_KEY, {
        queue: [],
        dismissed: [],
        settings: this.settings,
      });
      
      if (persisted) {
        // Validate and restore state
        if (persisted.queue) {
          this.queue = persisted.queue.filter(n => {
            try {
              NotificationSchema.parse(n);
              return true;
            } catch {
              return false;
            }
          });
        }
        
        if (persisted.dismissed) {
          this.dismissed = persisted.dismissed.filter(n => {
            try {
              NotificationSchema.parse(n);
              return true;
            } catch {
              return false;
            }
          });
        }

        if (persisted.settings) {
          try {
            NotificationSettingsSchema.parse(persisted.settings);
            this.settings = { ...this.settings, ...persisted.settings };
          } catch {
            // Use default settings if validation fails
          }
        }

        // Clean expired notifications
        this.cleanExpiredNotifications();
      }
    } catch (error) {
      console.error('Failed to load persisted notification state:', error);
    }
  }

  /**
   * Clean expired notifications
   */
  private cleanExpiredNotifications(): void {
    const now = Date.now();
    
    // Clean active notifications
    this.queue = this.queue.filter(n => {
      if (n.expiresAt && n.expiresAt < now) {
        this.dismissed.push(n);
        return false;
      }
      return true;
    });

    // Clean dismissed notifications
    this.dismissed = this.dismissed.filter(n => {
      return !n.expiresAt || n.expiresAt >= now;
    });
  }
}

/**
 * Global notification system instance
 */
export const notificationSystem = new NotificationSystem();

/**
 * Convenience functions for global access
 */
export const showSuccess = (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => 
  notificationSystem.addNotification({
    type: 'toast',
    severity: 'success',
    priority: 'normal',
    title,
    message,
    ...options,
  });

export const showError = (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => 
  notificationSystem.addNotification({
    type: 'toast',
    severity: 'error',
    priority: 'high',
    title,
    message,
    ...options,
  });

export const showWarning = (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => 
  notificationSystem.addNotification({
    type: 'toast',
    severity: 'warning',
    priority: 'normal',
    title,
    message,
    ...options,
  });

export const showInfo = (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => 
  notificationSystem.addNotification({
    type: 'toast',
    severity: 'info',
    priority: 'normal',
    title,
    message,
    ...options,
  });

export const showModal = (title: string, message: string, actions?: NotificationAction[], options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => 
  notificationSystem.addNotification({
    type: 'modal',
    severity: 'info',
    priority: 'high',
    title,
    message,
    actions,
    ...options,
  });

export const showAlert = (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => 
  notificationSystem.addNotification({
    type: 'alert',
    severity: 'warning',
    priority: 'urgent',
    title,
    message,
    ...options,
  });

export const showProgress = (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'severity'>>) => 
  notificationSystem.addNotification({
    type: 'progress',
    severity: 'info',
    priority: 'normal',
    title,
    message,
    ...options,
  });
