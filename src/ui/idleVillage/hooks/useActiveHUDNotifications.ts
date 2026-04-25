/**
 * Hook for generating Active HUD notifications from map state
 *
 * Phase 12 hook that monitors village and HUD state changes
 * and generates appropriate notifications with config-first design.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useHUDNotifications } from './useHUDNotifications';
import { DEFAULT_HUD_NOTIFICATION_CONFIG } from '@/balancing/config/idleVillage/hudNotificationConfig';
import type { HUDNotificationType } from '@/balancing/config/idleVillage/hudNotificationConfig';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActiveHUDState } from './useActiveHUDState';

/**
 * Notification trigger event
 */
export interface NotificationTrigger {
  /** Event type */
  type: string;
  /** Event severity */
  severity: 'low' | 'medium' | 'high';
  /** Event message template */
  message: string;
  /** Event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Hook return type
 */
export interface UseActiveHUDNotificationsResult {
  /** Add a notification from state event */
  addStateNotification: (trigger: NotificationTrigger) => void;
  /** Generate notifications from village state */
  generateFromVillageState: (villageState: VillageState) => void;
  /** Generate notifications from HUD state */
  generateFromHUDState: (hudState: ActiveHUDState) => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Get notification queue status */
  getQueueStatus: () => {
    activeCount: number;
    maxConcurrent: number;
  };
}

/**
 * Map event types to notification types
 */
function mapEventToNotificationType(eventType: string): HUDNotificationType {
  switch (eventType) {
    case 'activity_started':
      return 'activity_started';
    case 'activity_completed':
      return 'activity_completed';
    case 'activity_failed':
      return 'activity_failed';
    case 'activity_cancelled':
      return 'activity_cancelled';
    case 'resident_injured':
      return 'resident_injured';
    case 'resident_killed':
      return 'resident_killed';
    case 'resource_low':
      return 'resource_low';
    case 'resource_critical':
      return 'resource_critical';
    case 'quest_available':
      return 'quest_available';
    case 'quest_completed':
      return 'quest_completed';
    case 'day_transition':
      return 'day_transition';
    case 'system_message':
      return 'system_message';
    default:
      return 'system_message';
  }
}

/**
 * Hook for generating Active HUD notifications from map state
 */
export function useActiveHUDNotifications(
  config = DEFAULT_HUD_NOTIFICATION_CONFIG
): UseActiveHUDNotificationsResult {
  const { addNotification, clearAllNotifications, notifications } = useHUDNotifications(config);
  const processedEventsRef = useRef<Set<string>>(new Set());

  /**
   * Add a notification from a state event trigger
   */
  const addStateNotification = useCallback((trigger: NotificationTrigger) => {
    const notificationType = mapEventToNotificationType(trigger.type);
    
    // Create unique event ID to prevent duplicates
    const eventId = `${trigger.type}-${JSON.stringify(trigger.metadata || {})}`;
    
    // Skip if already processed
    if (processedEventsRef.current.has(eventId)) {
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    // Add notification with priority based on severity
    addNotification(notificationType, trigger.message, {
      ...trigger.metadata,
      severity: trigger.severity,
      eventId,
      timestamp: Date.now(),
    });

    // Emit telemetry event
    if (window.reportHUDNotificationEvent) {
      window.reportHUDNotificationEvent({
        eventType: 'hud_notification_generated',
        data: {
          triggerType: trigger.type,
          notificationType,
          severity: trigger.severity,
          message: trigger.message,
          metadata: trigger.metadata,
          timestamp: Date.now(),
        },
      });
    }
  }, [addNotification]);

  /**
   * Generate notifications from village state
   */
  const generateFromVillageState = useCallback((villageState: VillageState) => {
    // Check for resource warnings
    const resources = villageState.resources;
    if (resources) {
      Object.entries(resources).forEach(([resourceType, amount]) => {
        const threshold = 10; // Default threshold since getResourceThreshold doesn't exist
        
        if (typeof amount === 'number' && amount <= threshold / 2) {
          addStateNotification({
            type: 'resource_critical',
            severity: 'high',
            message: `${resourceType} critically low: ${amount}/${threshold}`,
            metadata: {
              resourceType,
              currentAmount: amount,
              threshold,
              isCritical: true,
            },
          });
        } else if (typeof amount === 'number' && amount <= threshold) {
          addStateNotification({
            type: 'resource_low',
            severity: 'medium',
            message: `${resourceType} running low: ${amount}/${threshold}`,
            metadata: {
              resourceType,
              currentAmount: amount,
              threshold,
              isCritical: false,
            },
          });
        }
      });
    }

    // Check for resident health issues
    const residents = villageState.residents;
    if (residents) {
      residents.forEach((resident) => {
        if (resident.health !== undefined && typeof resident.health === 'number') {
          if (resident.health <= 0) {
            addStateNotification({
              type: 'resident_killed',
              severity: 'high',
              message: `${resident.name} has died`,
              metadata: {
                residentId: resident.id,
                health: 0,
                isFatal: true,
              },
            });
          } else if (resident.health < 25) {
            addStateNotification({
              type: 'resident_injured',
              severity: 'high',
              message: `${resident.name} severely injured: ${resident.health}% health`,
              metadata: {
                residentId: resident.id,
                health: resident.health,
                severity: 'severe',
              },
            });
          } else if (resident.health < 50) {
            addStateNotification({
              type: 'resident_injured',
              severity: 'medium',
              message: `${resident.name} injured: ${resident.health}% health`,
              metadata: {
                residentId: resident.id,
                health: resident.health,
                severity: 'moderate',
              },
            });
          }
        }
      });
    }

    // Note: getAvailableQuests doesn't exist, so we'll skip quest notifications for now
    // This would need to be implemented when the quest system is available
  }, [addStateNotification]);

  /**
   * Generate notifications from HUD state
   */
  const generateFromHUDState = useCallback((hudState: ActiveHUDState) => {
    // Check for completed activities
    const completedActivities = hudState.activities.filter(activity => activity.status === 'completed');
    completedActivities.forEach((activity) => {
      addStateNotification({
        type: 'activity_completed',
        severity: 'low',
        message: `${activity.residentName} completed ${activity.label}`,
        metadata: {
          activityKey: activity.key,
          residentId: activity.residentId,
          activityType: activity.activityType,
          progress: activity.progress,
        },
      });
    });

    // Check for failed activities
    const failedActivities = hudState.activities.filter(activity => activity.status === 'failed');
    failedActivities.forEach((activity) => {
      addStateNotification({
        type: 'activity_failed',
        severity: 'medium',
        message: `${activity.residentName} failed ${activity.label}`,
        metadata: {
          activityKey: activity.key,
          residentId: activity.residentId,
          activityType: activity.activityType,
          failureReason: 'unknown', // Would need to be added to the state
        },
      });
    });

    // Note: day transitions would need to be added to the HUD state
    // This is a placeholder for when that functionality is implemented
  }, [addStateNotification]);

  /**
   * Clear all notifications and reset processed events
   */
  const clearAll = useCallback(() => {
    processedEventsRef.current.clear();
    clearAllNotifications();
  }, [clearAllNotifications]);

  /**
   * Get notification queue status
   */
  const getQueueStatus = useCallback(() => ({
    activeCount: notifications.length,
    maxConcurrent: config.maxConcurrent,
  }), [notifications.length, config.maxConcurrent]);

  return {
    addStateNotification,
    generateFromVillageState,
    generateFromHUDState,
    clearAll,
    getQueueStatus,
  };
}

/**
 * Global telemetry function declaration
 */
declare global {
  interface Window {
    reportHUDNotificationEvent?: (event: {
      eventType: string;
      data: Record<string, unknown>;
    }) => void;
  }
}
