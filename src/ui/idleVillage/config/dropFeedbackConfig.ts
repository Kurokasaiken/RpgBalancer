/**
 * Drop Feedback Configuration for Idle Village Phase E
 * 
 * Config-first settings for visual feedback during drag-and-drop operations.
 * Defines colors, animations, messages, and timing for different validation states.
 * 
 * @since IV-PhaseE-drop-feedback
 */

/**
 * Visual feedback types for drop operations.
 */
export type DropFeedbackType = 
  | 'valid'
  | 'invalid'
  | 'warning'
  | 'blocked';

/**
 * Drop feedback configuration for visual states.
 */
export interface DropFeedbackConfig {
  /** Visual styling for each feedback type */
  visual: {
    valid: {
      /** Border color for valid drops */
      borderColor: string;
      /** Background color overlay */
      backgroundColor: string;
      /** Box shadow for valid drops */
      boxShadow: string;
      /** Animation class or keyframe */
      animation: string;
    };
    invalid: {
      /** Border color for invalid drops */
      borderColor: string;
      /** Background color overlay */
      backgroundColor: string;
      /** Box shadow for invalid drops */
      boxShadow: string;
      /** Animation class or keyframe */
      animation: string;
    };
    warning: {
      /** Border color for warning drops */
      borderColor: string;
      /** Background color overlay */
      backgroundColor: string;
      /** Box shadow for warning drops */
      boxShadow: string;
      /** Animation class or keyframe */
      animation: string;
    };
    blocked: {
      /** Border color for blocked drops */
      borderColor: string;
      /** Background color overlay */
      backgroundColor: string;
      /** Box shadow for blocked drops */
      boxShadow: string;
      /** Animation class or keyframe */
      animation: string;
    };
  };
  
  /** Animation timing and easing */
  animation: {
    /** Duration of feedback animations in milliseconds */
    durationMs: number;
    /** Easing function for animations */
    easing: string;
    /** Delay before showing feedback */
    delayMs: number;
    /** Whether to enable hover animations */
    enableHoverAnimations: boolean;
  };
  
  /** Message configuration for feedback */
  messages: {
    /** Whether to show tooltip messages */
    showTooltips: boolean;
    /** Maximum message length before truncation */
    maxMessageLength: number;
    /** Whether to show icons with messages */
    showIcons: boolean;
    /** Message display duration in milliseconds */
    displayDurationMs: number;
    /** Custom message overrides by validation rule */
    customMessages?: Record<string, string>;
  };
  
  /** Sound configuration (future extension) */
  sound?: {
    /** Whether to enable sound feedback */
    enabled: boolean;
    /** Volume level (0-1) */
    volume: number;
    /** Sound file paths for different feedback types */
    soundFiles?: {
      valid?: string;
      invalid?: string;
      warning?: string;
      blocked?: string;
    };
  };
  
  /** Haptic feedback configuration (mobile) */
  haptic?: {
    /** Whether to enable haptic feedback */
    enabled: boolean;
    /** Haptic pattern for different feedback types */
    patterns?: {
      valid?: number[];
      invalid?: number[];
      warning?: number[];
      blocked?: number[];
    };
  };
}

/**
 * Default drop feedback configuration optimized for Gilded Observatory theme.
 * 
 * Design rationale:
 * - Valid drops use green colors with subtle glow
 * - Invalid drops use red colors with shake animation
 * - Warning drops use amber colors with pulse animation
 * - Blocked drops use gray colors with disabled state
 * - Animations are smooth but not distracting
 */
export const DEFAULT_DROP_FEEDBACK_CONFIG: DropFeedbackConfig = {
  visual: {
    valid: {
      borderColor: 'rgb(34, 197, 94)', // green-500
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      boxShadow: '0 0 0 2px rgb(34, 197, 94), 0 0 20px rgba(34, 197, 94, 0.3)',
      animation: 'drop-valid-pulse 1s ease-in-out infinite',
    },
    invalid: {
      borderColor: 'rgb(239, 68, 68)', // red-500
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      boxShadow: '0 0 0 2px rgb(239, 68, 68), 0 0 20px rgba(239, 68, 68, 0.3)',
      animation: 'drop-invalid-shake 0.3s ease-in-out',
    },
    warning: {
      borderColor: 'rgb(251, 191, 36)', // amber-400
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      boxShadow: '0 0 0 2px rgb(251, 191, 36), 0 0 20px rgba(251, 191, 36, 0.3)',
      animation: 'drop-warning-pulse 1.5s ease-in-out infinite',
    },
    blocked: {
      borderColor: 'rgb(107, 114, 128)', // gray-500
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      boxShadow: '0 0 0 2px rgb(107, 114, 128)',
      animation: 'drop-blocked-fade 0.2s ease-in-out',
    },
  },
  
  animation: {
    durationMs: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delayMs: 100,
    enableHoverAnimations: true,
  },
  
  messages: {
    showTooltips: true,
    maxMessageLength: 80,
    showIcons: true,
    displayDurationMs: 2000,
    customMessages: {
      stat_requirement_allOf: '❌ Missing required stats',
      stat_requirement_anyOf: '⚠️ Needs at least one of these stats',
      stat_requirement_noneOf: '❌ Has incompatible stats',
      fatigue_threshold: '😴 Too exhausted to work',
      crew_capacity: '👥 Activity is full',
      resident_availability: '🚫 Resident not available',
      slot_locked: '🔒 Slot is locked',
      scheduler_rejection: '⏰ Cannot schedule right now',
    },
  },
  
  sound: {
    enabled: false, // Disabled by default for web
    volume: 0.3,
    soundFiles: {
      valid: '/sounds/drop-valid.mp3',
      invalid: '/sounds/drop-invalid.mp3',
      warning: '/sounds/drop-warning.mp3',
      blocked: '/sounds/drop-blocked.mp3',
    },
  },
  
  haptic: {
    enabled: false, // Disabled by default for desktop
    patterns: {
      valid: [10, 50], // Light vibration
      invalid: [100, 50, 100], // Double vibration
      warning: [50, 30, 50], // Triple light vibration
      blocked: [200], // Strong vibration
    },
  },
};

/**
 * Test configuration with disabled animations for reproducible testing.
 */
export const TEST_DROP_FEEDBACK_CONFIG: DropFeedbackConfig = {
  ...DEFAULT_DROP_FEEDBACK_CONFIG,
  animation: {
    durationMs: 0,
    easing: 'linear',
    delayMs: 0,
    enableHoverAnimations: false,
  },
  messages: {
    ...DEFAULT_DROP_FEEDBACK_CONFIG.messages,
    displayDurationMs: 100, // Short display for tests
  },
  sound: {
    enabled: false,
    volume: 0,
  },
  haptic: {
    enabled: false,
  },
};

/**
 * Validates a drop feedback configuration.
 * 
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export function validateDropFeedbackConfig(config: DropFeedbackConfig): boolean {
  const { visual, animation, messages } = config;
  
  // Check visual configuration
  const feedbackTypes = ['valid', 'invalid', 'warning', 'blocked'] as const;
  for (const type of feedbackTypes) {
    const visualConfig = visual[type];
    if (!visualConfig.borderColor || !visualConfig.backgroundColor || !visualConfig.animation) {
      return false;
    }
  }
  
  // Check animation configuration
  if (animation.durationMs < 0 || animation.delayMs < 0) {
    return false;
  }
  
  // Check messages configuration
  if (messages.maxMessageLength <= 0 || messages.displayDurationMs <= 0) {
    return false;
  }
  
  return true;
}

/**
 * Gets visual styling for a specific feedback type.
 * 
 * @param config - Drop feedback configuration
 * @param feedbackType - Type of feedback
 * @returns Visual styling object
 */
export function getFeedbackVisuals(
  config: DropFeedbackConfig,
  feedbackType: DropFeedbackType
) {
  return config.visual[feedbackType];
}

/**
 * Gets a formatted message for a validation result.
 * 
 * @param config - Drop feedback configuration
 * @param validationRule - The validation rule that failed
 * @param customMessage - Optional custom message override
 * @returns Formatted message string
 */
export function getFeedbackMessage(
  config: DropFeedbackConfig,
  validationRule?: string,
  customMessage?: string
): string {
  if (customMessage) {
    return customMessage.length > config.messages.maxMessageLength 
      ? customMessage.substring(0, config.messages.maxMessageLength - 3) + '...'
      : customMessage;
  }
  
  if (validationRule && config.messages.customMessages?.[validationRule]) {
    return config.messages.customMessages[validationRule];
  }
  
  return 'Invalid drop';
}

/**
 * Determines feedback type based on validation result.
 * 
 * @param validationRule - The validation rule that failed (if any)
 * @param severity - Optional severity level (1-3, where 3 is most severe)
 * @returns Drop feedback type
 */
export function getFeedbackType(
  validationRule?: string,
  severity: number = 1
): DropFeedbackType {
  if (!validationRule) {
    return 'valid';
  }
  
  // Map validation rules to feedback types
  const ruleMapping: Record<string, DropFeedbackType> = {
    stat_requirement_allOf: severity >= 2 ? 'blocked' : 'invalid',
    stat_requirement_anyOf: 'warning',
    stat_requirement_noneOf: 'blocked',
    fatigue_threshold: severity >= 2 ? 'blocked' : 'warning',
    crew_capacity: 'blocked',
    resident_availability: 'blocked',
    slot_locked: 'blocked',
    scheduler_rejection: 'warning',
  };
  
  return ruleMapping[validationRule] || 'invalid';
}

/**
 * Type for drop feedback telemetry events.
 */
export interface DropFeedbackTelemetryEvent {
  /** Type of feedback shown */
  feedbackType: DropFeedbackType;
  /** Validation rule that triggered the feedback */
  validationRule?: string;
  /** Resident ID being dragged */
  residentId?: string;
  /** Activity ID being dropped on */
  activityId?: string;
  /** Context of the drop operation */
  context?: string;
  /** Timestamp of the feedback event */
  timestamp: number;
  /** Whether the feedback was interactive (user saw it) */
  interactive: boolean;
}
