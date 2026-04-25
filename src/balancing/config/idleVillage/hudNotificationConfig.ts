/**
 * Configuration for Active HUD Notification Layer
 *
 * Defines notification types, styling, timing, and behavior for Phase 12 HUD notifications.
 * Config-first design following RPG Balancer philosophy.
 */

export interface HUDNotificationConfig {
  /** Maximum number of concurrent notifications */
  maxConcurrent: number;

  /** Default duration for notifications (ms) */
  defaultDurationMs: number;

  /** Animation settings */
  animation: {
    enterDurationMs: number;
    exitDurationMs: number;
    staggerDelayMs: number;
    easing: string;
  };

  /** Position and layout */
  layout: {
    position: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
    maxWidthPx: number;
    gapPx: number;
    marginPx: number;
  };

  /** Notification type configurations */
  types: Record<HUDNotificationType, HUDNotificationTypeConfig>;
}

export interface HUDNotificationTypeConfig {
  /** Display priority (higher = more important) */
  priority: number;

  /** Custom duration override (null = use default) */
  durationMs: number | null;

  /** Visual styling */
  style: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    icon: string;
    borderRadius: string;
    boxShadow: string;
  };

  /** Sound/animation settings */
  feedback: {
    showIcon: boolean;
    animate: boolean;
    soundEnabled: boolean;
  };

  /** Dismiss behavior */
  dismiss: {
    autoDismiss: boolean;
    clickToDismiss: boolean;
    hoverToPause: boolean;
  };
}

export type HUDNotificationType =
  | 'activity_started'
  | 'activity_completed'
  | 'activity_failed'
  | 'activity_cancelled'
  | 'resident_injured'
  | 'resident_killed'
  | 'resource_low'
  | 'resource_critical'
  | 'quest_available'
  | 'quest_completed'
  | 'day_transition'
  | 'system_message';

/**
 * Default configuration for HUD notifications
 * Follows Gilded Observatory theme with config-first design
 */
export const DEFAULT_HUD_NOTIFICATION_CONFIG: HUDNotificationConfig = {
  maxConcurrent: 5,
  defaultDurationMs: 4000,
  animation: {
    enterDurationMs: 300,
    exitDurationMs: 200,
    staggerDelayMs: 100,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  layout: {
    position: 'top-right',
    maxWidthPx: 320,
    gapPx: 8,
    marginPx: 16,
  },
  types: {
    activity_started: {
      priority: 2,
      durationMs: 2000,
      style: {
        backgroundColor: 'rgba(34, 197, 94, 0.95)', // green-500
        borderColor: 'rgb(34, 197, 94)',
        textColor: 'rgb(220, 252, 231)', // green-50
        icon: '▶️',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    activity_completed: {
      priority: 3,
      durationMs: 3000,
      style: {
        backgroundColor: 'rgba(34, 197, 94, 0.95)', // green-500
        borderColor: 'rgb(34, 197, 94)',
        textColor: 'rgb(220, 252, 231)', // green-50
        icon: '✅',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    activity_failed: {
      priority: 4,
      durationMs: 5000,
      style: {
        backgroundColor: 'rgba(239, 68, 68, 0.95)', // red-500
        borderColor: 'rgb(239, 68, 68)',
        textColor: 'rgb(254, 226, 226)', // red-50
        icon: '❌',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    activity_cancelled: {
      priority: 2,
      durationMs: 2500,
      style: {
        backgroundColor: 'rgba(156, 163, 175, 0.95)', // gray-500
        borderColor: 'rgb(156, 163, 175)',
        textColor: 'rgb(249, 250, 251)', // gray-50
        icon: '⏹️',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(156, 163, 175, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    resident_injured: {
      priority: 5,
      durationMs: 6000,
      style: {
        backgroundColor: 'rgba(245, 158, 11, 0.95)', // amber-500
        borderColor: 'rgb(245, 158, 11)',
        textColor: 'rgb(255, 251, 235)', // amber-50
        icon: '🤕',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    resident_killed: {
      priority: 6,
      durationMs: null, // Never auto-dismiss critical notifications
      style: {
        backgroundColor: 'rgba(239, 68, 68, 0.95)', // red-500
        borderColor: 'rgb(239, 68, 68)',
        textColor: 'rgb(254, 226, 226)', // red-50
        icon: '💀',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: false,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    resource_low: {
      priority: 2,
      durationMs: 4000,
      style: {
        backgroundColor: 'rgba(245, 158, 11, 0.95)', // amber-500
        borderColor: 'rgb(245, 158, 11)',
        textColor: 'rgb(255, 251, 235)', // amber-50
        icon: '⚠️',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    resource_critical: {
      priority: 5,
      durationMs: 6000,
      style: {
        backgroundColor: 'rgba(239, 68, 68, 0.95)', // red-500
        borderColor: 'rgb(239, 68, 68)',
        textColor: 'rgb(254, 226, 226)', // red-50
        icon: '🚨',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    quest_available: {
      priority: 3,
      durationMs: 3500,
      style: {
        backgroundColor: 'rgba(139, 92, 246, 0.95)', // violet-500
        borderColor: 'rgb(139, 92, 246)',
        textColor: 'rgb(245, 243, 255)', // violet-50
        icon: '🎯',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    quest_completed: {
      priority: 4,
      durationMs: 5000,
      style: {
        backgroundColor: 'rgba(34, 197, 94, 0.95)', // green-500
        borderColor: 'rgb(34, 197, 94)',
        textColor: 'rgb(220, 252, 231)', // green-50
        icon: '🏆',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    day_transition: {
      priority: 1,
      durationMs: 3000,
      style: {
        backgroundColor: 'rgba(6, 182, 212, 0.95)', // cyan-500
        borderColor: 'rgb(6, 182, 212)',
        textColor: 'rgb(236, 254, 255)', // cyan-50
        icon: '🌅',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
    system_message: {
      priority: 1,
      durationMs: 4000,
      style: {
        backgroundColor: 'rgba(75, 85, 99, 0.95)', // gray-600
        borderColor: 'rgb(75, 85, 99)',
        textColor: 'rgb(243, 244, 246)', // gray-100
        icon: 'ℹ️',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(75, 85, 99, 0.3)',
      },
      feedback: {
        showIcon: true,
        animate: true,
        soundEnabled: false,
      },
      dismiss: {
        autoDismiss: true,
        clickToDismiss: true,
        hoverToPause: true,
      },
    },
  },
};

/**
 * Test mode configuration with reduced durations and disabled animations
 */
export const TEST_HUD_NOTIFICATION_CONFIG: HUDNotificationConfig = {
  ...DEFAULT_HUD_NOTIFICATION_CONFIG,
  defaultDurationMs: 1000,
  animation: {
    ...DEFAULT_HUD_NOTIFICATION_CONFIG.animation,
    enterDurationMs: 0,
    exitDurationMs: 0,
  },
  types: Object.fromEntries(
    Object.entries(DEFAULT_HUD_NOTIFICATION_CONFIG.types).map(([key, config]) => [
      key,
      {
        ...config,
        durationMs: config.durationMs ? Math.min(config.durationMs, 1000) : null,
        feedback: {
          ...config.feedback,
          animate: false,
        },
      },
    ])
  ),
};
