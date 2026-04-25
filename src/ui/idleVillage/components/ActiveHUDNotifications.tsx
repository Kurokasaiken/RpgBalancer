/**
 * Active HUD Notifications Component
 *
 * Phase 12 Active HUD notification layer with config-first design.
 * Integrates with useHUDNotifications hook and provides Gilded Observatory styling.
 * Generates notifications from map state and emits telemetry events.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { HUDNotificationLayer } from './HUDNotificationLayer';
import { useHUDNotifications } from '@/ui/idleVillage/hooks/useHUDNotifications';
import { DEFAULT_HUD_NOTIFICATION_CONFIG } from '@/balancing/config/idleVillage/hudNotificationConfig';
import type { HUDNotificationType } from '@/balancing/config/idleVillage/hudNotificationConfig';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';

/**
 * Props for ActiveHUDNotifications component
 */
export interface ActiveHUDNotificationsProps {
  /** Current village state for generating notifications */
  villageState?: VillageState;
  /** Current HUD state for activity notifications */
  hudState?: ActiveHUDState;
  /** Custom notification config (optional, uses default if not provided) */
  config?: typeof DEFAULT_HUD_NOTIFICATION_CONFIG;
  /** Enable telemetry tracking */
  enableTelemetry?: boolean;
  /** Test mode flag for deterministic behavior */
  testMode?: boolean;
}

/**
 * Map state events to notification types
 */
function mapStateEventToNotificationType(
  eventType: string,
  severity: 'low' | 'medium' | 'high' = 'medium'
): HUDNotificationType {
  switch (eventType) {
    case 'activity_completed':
      return 'activity_completed';
    case 'activity_failed':
      return 'activity_failed';
    case 'activity_cancelled':
      return 'activity_cancelled';
    case 'resident_injured':
      return severity === 'high' ? 'resident_killed' : 'resident_injured';
    case 'resource_low':
      return severity === 'high' ? 'resource_critical' : 'resource_low';
    case 'quest_available':
      return 'quest_available';
    case 'quest_completed':
      return 'quest_completed';
    case 'day_transition':
      return 'day_transition';
    default:
      return 'system_message';
  }
}

/**
 * Generate notifications from village state changes
 */
function generateNotificationsFromState(
  villageState?: VillageState,
  hudState?: ActiveHUDState
): Array<{
  type: HUDNotificationType;
  message: string;
  metadata?: Record<string, any>;
}> {
  const notifications: Array<{
    type: HUDNotificationType;
    message: string;
    metadata?: Record<string, any>;
  }> = [];

  if (!villageState) {
    return notifications;
  }

  // Check for completed activities
  if (hudState?.completedActivities) {
    hudState.completedActivities.forEach((activity) => {
      notifications.push({
        type: 'activity_completed',
        message: `${activity.residentName} completed ${activity.activityName}`,
        metadata: {
          activityKey: activity.key,
          residentId: activity.residentId,
          duration: activity.duration,
          rewards: activity.rewards,
        },
      });
    });
  }

  // Check for failed activities
  if (hudState?.failedActivities) {
    hudState.failedActivities.forEach((activity) => {
      notifications.push({
        type: 'activity_failed',
        message: `${activity.residentName} failed ${activity.activityName}`,
        metadata: {
          activityKey: activity.key,
          residentId: activity.residentId,
          failureReason: activity.failureReason,
        },
      });
    });
  }

  // Check for low resources
  const resources = villageState.getResources?.();
  if (resources) {
    Object.entries(resources).forEach(([resourceType, amount]) => {
      const threshold = villageState.getResourceThreshold?.(resourceType) || 10;
      if (amount <= threshold) {
        const severity = amount <= threshold / 2 ? 'high' : 'medium';
        notifications.push({
          type: mapStateEventToNotificationType('resource_low', severity),
          message: `${resourceType} is running low (${amount}/${threshold})`,
          metadata: {
            resourceType,
            currentAmount: amount,
            threshold,
            severity,
          },
        });
      }
    });
  }

  // Check for injured residents
  const residents = villageState.getResidents?.();
  if (residents) {
    residents.forEach((resident) => {
      if (resident.health && resident.health < 50) {
        const severity = resident.health < 25 ? 'high' : 'medium';
        notifications.push({
          type: mapStateEventToNotificationType('resident_injured', severity),
          message: `${resident.name} is injured (${resident.health}% health)`,
          metadata: {
            residentId: resident.id,
            health: resident.health,
            severity,
          },
        });
      }
    });
  }

  // Check for available quests
  const availableQuests = villageState.getAvailableQuests?.();
  if (availableQuests && availableQuests.length > 0) {
    notifications.push({
      type: 'quest_available',
      message: `${availableQuests.length} new quest${availableQuests.length > 1 ? 's' : ''} available`,
      metadata: {
        questCount: availableQuests.length,
        questIds: availableQuests.map(q => q.id),
      },
    });
  }

  return notifications;
}

/**
 * Active HUD Notifications Component
 */
export const ActiveHUDNotifications: React.FC<ActiveHUDNotificationsProps> = ({
  villageState,
  hudState,
  config = DEFAULT_HUD_NOTIFICATION_CONFIG,
  enableTelemetry = true,
  testMode = false,
}) => {
  const { addNotification, clearAllNotifications } = useHUDNotifications(config);

  // Generate notifications from state changes
  const stateNotifications = useMemo(() => {
    if (testMode) {
      return []; // No auto-generated notifications in test mode
    }
    return generateNotificationsFromState(villageState, hudState);
  }, [villageState, hudState, testMode]);

  // Add state-generated notifications
  useEffect(() => {
    stateNotifications.forEach(({ type, message, metadata }) => {
      addNotification(type, message, metadata);
    });
  }, [stateNotifications, addNotification]);

  // Telemetry event emission
  const emitTelemetryEvent = useCallback((
    eventType: string,
    data: Record<string, any>
  ) => {
    if (!enableTelemetry || !window.reportHUDNotificationEvent) {
      return;
    }

    window.reportHUDNotificationEvent({
      eventType,
      data: {
        timestamp: Date.now(),
        ...data,
      },
    });
  }, [enableTelemetry]);

  // Emit telemetry when notifications are generated
  useEffect(() => {
    if (stateNotifications.length > 0) {
      emitTelemetryEvent('hud_notifications_generated', {
        notificationCount: stateNotifications.length,
        types: stateNotifications.map(n => n.type),
        sources: ['village_state', 'hud_state'],
      });
    }
  }, [stateNotifications, emitTelemetryEvent]);

  // Clear all notifications function with telemetry
  const handleClearAll = useCallback(() => {
    const notificationCount = stateNotifications.length;
    clearAllNotifications();
    
    emitTelemetryEvent('hud_notifications_cleared', {
      clearedCount: notificationCount,
      trigger: 'manual_clear',
    });
  }, [clearAllNotifications, stateNotifications.length, emitTelemetryEvent]);

  // In test mode, provide a way to manually trigger notifications
  useEffect(() => {
    if (testMode && window.__activeHUDNotificationsTest) {
      window.__activeHUDNotificationsTest = {
        addNotification,
        clearAllNotifications: handleClearAll,
        generateTestNotification: (type: HUDNotificationType, message: string) => {
          addNotification(type, message, { testMode: true });
        },
      };
    }

    return () => {
      if (window.__activeHUDNotificationsTest) {
        delete window.__activeHUDNotificationsTest;
      }
    };
  }, [addNotification, handleClearAll, testMode]);

  return (
    <HUDNotificationLayer
      config={config}
      testMode={testMode}
    />
  );
};

/**
 * Global test interface declaration
 */
declare global {
  interface Window {
    __activeHUDNotificationsTest?: {
      addNotification: (type: HUDNotificationType, message: string, metadata?: Record<string, any>) => void;
      clearAllNotifications: () => void;
      generateTestNotification: (type: HUDNotificationType, message: string) => void;
    };
  }
}

export default ActiveHUDNotifications;
