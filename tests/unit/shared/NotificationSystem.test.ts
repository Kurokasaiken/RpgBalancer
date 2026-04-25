/**
 * Tests for Notification System
 * 
 * Comprehensive test suite covering all notification system functionality
 * including queue management, persistence, telemetry, and UI components.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  notificationSystem, 
  NotificationSystem,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showModal,
  showAlert,
  showProgress
} from '../../../src/ui/shared/notificationSystem';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock telemetry
vi.mock('@/analytics/__mocks__/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
  },
}));

describe('NotificationSystem', () => {
  let system: NotificationSystem;

  beforeEach(() => {
    system = new NotificationSystem({
      maxActive: 3,
      enablePersistence: false,
      enableTelemetry: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const defaultSystem = new NotificationSystem();
      const state = defaultSystem.getState();
      
      expect(state.settings.maxActive).toBe(5);
      expect(state.settings.enablePersistence).toBe(true);
      expect(state.settings.enableTelemetry).toBe(true);
    });

    it('should initialize with custom settings', () => {
      const customSystem = new NotificationSystem({
        maxActive: 10,
        enablePersistence: false,
        enableTelemetry: false,
      });
      
      const state = customSystem.getState();
      expect(state.settings.maxActive).toBe(10);
      expect(state.settings.enablePersistence).toBe(false);
      expect(state.settings.enableTelemetry).toBe(false);
    });
  });

  describe('Notification Management', () => {
    it('should add notification to queue', async () => {
      const id = await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      
      const state = system.getState();
      expect(state.active).toHaveLength(1);
      expect(state.active[0].id).toBe(id);
      expect(state.active[0].title).toBe('Test');
    });

    it('should dismiss notification', async () => {
      const id = await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
      });

      await system.dismissNotification(id);

      const state = system.getState();
      expect(state.active).toHaveLength(0);
      expect(state.dismissed).toHaveLength(1);
      expect(state.dismissed[0].id).toBe(id);
    });

    it('should respect max active limit', async () => {
      // Add 4 notifications (max is 3)
      const ids = await Promise.all([
        system.addNotification({
          type: 'toast',
          severity: 'info',
          priority: 'low',
          title: 'Test 1',
          message: 'Message 1',
        }),
        system.addNotification({
          type: 'toast',
          severity: 'info',
          priority: 'low',
          title: 'Test 2',
          message: 'Message 2',
        }),
        system.addNotification({
          type: 'toast',
          severity: 'info',
          priority: 'low',
          title: 'Test 3',
          message: 'Message 3',
        }),
        system.addNotification({
          type: 'toast',
          severity: 'info',
          priority: 'low',
          title: 'Test 4',
          message: 'Message 4',
        }),
      ]);

      const state = system.getState();
      expect(state.active).toHaveLength(3);
      expect(state.dismissed).toHaveLength(1);
      
      // The first notification should be dismissed
      expect(state.dismissed[0].id).toBe(ids[0]);
    });

    it('should sort by priority', async () => {
      await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'low',
        title: 'Low Priority',
        message: 'Low priority message',
      });

      await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'urgent',
        title: 'Urgent',
        message: 'Urgent message',
      });

      await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'normal',
        title: 'Normal',
        message: 'Normal message',
      });

      const state = system.getState();
      expect(state.active[0].priority).toBe('urgent');
      expect(state.active[1].priority).toBe('normal');
      expect(state.active[2].priority).toBe('low');
    });

    it('should execute notification actions', async () => {
      const mockHandler = vi.fn();
      
      const id = await system.addNotification({
        type: 'modal',
        severity: 'info',
        priority: 'normal',
        title: 'Action Test',
        message: 'Test message',
        actions: [
          {
            id: 'test-action',
            label: 'Test Action',
            type: 'primary',
            handler: mockHandler,
          },
        ],
      });

      await system.executeAction(id, 'test-action');

      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      const state = system.getState();
      expect(state.active).toHaveLength(0);
      expect(state.dismissed).toHaveLength(1);
    });

    it('should clear all notifications', async () => {
      await Promise.all([
        system.addNotification({
          type: 'toast',
          severity: 'info',
          priority: 'normal',
          title: 'Test 1',
          message: 'Message 1',
        }),
        system.addNotification({
          type: 'toast',
          severity: 'info',
          priority: 'normal',
          title: 'Test 2',
          message: 'Message 2',
        }),
      ]);

      await system.clearAll();

      const state = system.getState();
      expect(state.active).toHaveLength(0);
      expect(state.dismissed).toHaveLength(2);
    });

    it('should clear dismissed notifications', async () => {
      const id = await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
      });

      await system.dismissNotification(id);
      await system.clearDismissed();

      const state = system.getState();
      expect(state.active).toHaveLength(0);
      expect(state.dismissed).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      await Promise.all([
        system.addNotification({
          type: 'toast',
          severity: 'info',
          priority: 'normal',
          title: 'Toast',
          message: 'Toast message',
        }),
        system.addNotification({
          type: 'modal',
          severity: 'error',
          priority: 'high',
          title: 'Modal',
          message: 'Modal message',
        }),
      ]);

      const stats = system.getStatistics();
      
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(2);
      expect(stats.dismissed).toBe(0);
      expect(stats.byType.toast).toBe(1);
      expect(stats.byType.modal).toBe(1);
      expect(stats.bySeverity.info).toBe(1);
      expect(stats.bySeverity.error).toBe(1);
    });
  });

  describe('State Subscription', () => {
    it('should notify subscribers of state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = system.subscribe(listener);

      await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
      });

      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should unsubscribe correctly', async () => {
      const listener = vi.fn();
      const unsubscribe = system.subscribe(listener);

      unsubscribe();
      
      await system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Convenience Functions', () => {
    it('should show success notification', async () => {
      const id = await showSuccess('Success', 'Operation completed');
      
      const notification = notificationSystem.getNotification(id);
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('toast');
      expect(notification?.severity).toBe('success');
      expect(notification?.title).toBe('Success');
      expect(notification?.message).toBe('Operation completed');
    });

    it('should show error notification', async () => {
      const id = await showError('Error', 'Operation failed');
      
      const notification = notificationSystem.getNotification(id);
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('toast');
      expect(notification?.severity).toBe('error');
      expect(notification?.priority).toBe('high');
    });

    it('should show warning notification', async () => {
      const id = await showWarning('Warning', 'Check your input');
      
      const notification = notificationSystem.getNotification(id);
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('toast');
      expect(notification?.severity).toBe('warning');
    });

    it('should show info notification', async () => {
      const id = await showInfo('Info', 'New update available');
      
      const notification = notificationSystem.getNotification(id);
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('toast');
      expect(notification?.severity).toBe('info');
    });

    it('should show modal notification', async () => {
      const id = await showModal('Modal', 'Important message');
      
      const notification = notificationSystem.getNotification(id);
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('modal');
      expect(notification?.severity).toBe('info');
      expect(notification?.priority).toBe('high');
    });

    it('should show alert notification', async () => {
      const id = await showAlert('Alert', 'System warning');
      
      const notification = notificationSystem.getNotification(id);
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('alert');
      expect(notification?.severity).toBe('warning');
      expect(notification?.priority).toBe('urgent');
    });

    it('should show progress notification', async () => {
      const id = await showProgress('Progress', 'Loading...');
      
      const notification = notificationSystem.getNotification(id);
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('progress');
      expect(notification?.severity).toBe('info');
    });
  });
});

describe('Notification System Integration', () => {
  it('should handle complex notification workflows', async () => {
    const system = new NotificationSystem({
      maxActive: 2,
      enablePersistence: false,
      enableTelemetry: false,
    });

    // Add multiple notifications
    const ids = await Promise.all([
      system.addNotification({
        type: 'toast',
        severity: 'info',
        priority: 'low',
        title: 'Background Task',
        message: 'Processing...',
      }),
      system.addNotification({
        type: 'modal',
        severity: 'warning',
        priority: 'high',
        title: 'Warning',
        message: 'Disk space low',
      }),
      system.addNotification({
        type: 'toast',
        severity: 'success',
        priority: 'normal',
        title: 'Complete',
        message: 'Task finished',
      }),
    ]);

    // Check that high priority modal is first
    const state = system.getState();
    expect(state.active[0].type).toBe('modal');
    expect(state.active[0].priority).toBe('high');

    // Execute an action on modal
    const mockAction = vi.fn();
    const modalId = state.active[0].id;
    
    // Update modal with action by finding it first
    const modalNotification = state.active.find(n => n.id === modalId);
    if (modalNotification) {
      modalNotification.actions = [
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'secondary',
          handler: mockAction,
        },
      ];
    }

    await system.executeAction(modalId, 'dismiss');
    expect(mockAction).toHaveBeenCalled();

    // Check final state
    const finalState = system.getState();
    expect(mockAction).toHaveBeenCalled();
    expect(finalState.dismissed).toHaveLength(2); // 2 dismissed (modal + toast)
    expect(finalState.dismissed.some(n => n.id === modalId)).toBe(true); // The modal is in dismissed
  });
});
