/**
 * Haptic Feedback Configuration
 * Config-first haptic feedback system with pattern library
 * 
 * @see NP-212 – Haptic Feedback System
 */

import { z } from 'zod';

/**
 * Haptic pattern types
 */
export const HapticPattern = {
  TAP: 'tap',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  IMPACT_LIGHT: 'impact_light',
  IMPACT_MEDIUM: 'impact_medium',
  IMPACT_HEAVY: 'impact_heavy',
  SELECTION: 'selection',
  NOTIFICATION: 'notification',
} as const;

export type HapticPattern = typeof HapticPattern[keyof typeof HapticPattern];

/**
 * Haptic pattern definition
 */
export interface HapticPatternDefinition {
  /** Pattern name */
  name: HapticPattern;
  /** Vibration pattern (duration in ms, pause in ms) */
  pattern: number[];
  /** Description */
  description: string;
  /** Intensity (0-1) */
  intensity?: number;
}

/**
 * Haptic configuration
 */
export interface HapticConfig {
  /** Enable haptic feedback */
  enabled: boolean;
  /** Enable on mobile only */
  mobileOnly: boolean;
  /** Pattern library */
  patterns: {
    [key in HapticPattern]: HapticPatternDefinition;
  };
  /** User preferences */
  preferences: {
    /** Enable haptic feedback */
    enabled: boolean;
    /** Intensity multiplier (0-1) */
    intensity: number;
    /** Enable for specific patterns */
    enabledPatterns: HapticPattern[];
  };
  /** Fallback for unsupported devices */
  fallback: {
    /** Show visual feedback */
    showVisualFeedback: boolean;
    /** Show console log */
    showConsoleLog: boolean;
  };
}

/**
 * Zod schema for haptic config
 */
export const HapticConfigSchema = z.object({
  enabled: z.boolean(),
  mobileOnly: z.boolean(),
  patterns: z.record(z.object({
    name: z.enum(['tap', 'success', 'error', 'warning', 'impact_light', 'impact_medium', 'impact_heavy', 'selection', 'notification']),
    pattern: z.array(z.number()),
    description: z.string(),
    intensity: z.number().min(0).max(1).optional(),
  })),
  preferences: z.object({
    enabled: z.boolean(),
    intensity: z.number().min(0).max(1),
    enabledPatterns: z.array(z.enum(['tap', 'success', 'error', 'warning', 'impact_light', 'impact_medium', 'impact_heavy', 'selection', 'notification'])),
  }),
  fallback: z.object({
    showVisualFeedback: z.boolean(),
    showConsoleLog: z.boolean(),
  }),
});

/**
 * Default haptic configuration
 */
export const DEFAULT_HAPTIC_CONFIG: HapticConfig = {
  enabled: true,
  mobileOnly: true,
  patterns: {
    tap: {
      name: 'tap',
      pattern: [10],
      description: 'Light tap feedback',
      intensity: 0.3,
    },
    success: {
      name: 'success',
      pattern: [10, 50, 10],
      description: 'Success confirmation',
      intensity: 0.5,
    },
    error: {
      name: 'error',
      pattern: [20, 50, 20, 50, 20],
      description: 'Error indication',
      intensity: 0.7,
    },
    warning: {
      name: 'warning',
      pattern: [15, 30, 15],
      description: 'Warning notification',
      intensity: 0.6,
    },
    impact_light: {
      name: 'impact_light',
      pattern: [5],
      description: 'Light impact',
      intensity: 0.2,
    },
    impact_medium: {
      name: 'impact_medium',
      pattern: [15],
      description: 'Medium impact',
      intensity: 0.5,
    },
    impact_heavy: {
      name: 'impact_heavy',
      pattern: [30],
      description: 'Heavy impact',
      intensity: 0.8,
    },
    selection: {
      name: 'selection',
      pattern: [5, 20, 5],
      description: 'Selection feedback',
      intensity: 0.4,
    },
    notification: {
      name: 'notification',
      pattern: [10, 30, 10, 30, 10],
      description: 'Notification alert',
      intensity: 0.6,
    },
  },
  preferences: {
    enabled: true,
    intensity: 1.0,
    enabledPatterns: [
      'tap',
      'success',
      'error',
      'warning',
      'impact_light',
      'impact_medium',
      'impact_heavy',
      'selection',
      'notification',
    ],
  },
  fallback: {
    showVisualFeedback: false,
    showConsoleLog: false,
  },
};

/**
 * Check if device supports haptic feedback
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Validate haptic configuration
 */
export function validateHapticConfig(config: unknown): HapticConfig {
  return HapticConfigSchema.parse(config);
}

/**
 * Get pattern by name
 */
export function getPattern(
  name: HapticPattern,
  config: HapticConfig = DEFAULT_HAPTIC_CONFIG
): HapticPatternDefinition {
  return config.patterns[name];
}

/**
 * Apply intensity multiplier to pattern
 */
export function applyIntensity(
  pattern: number[],
  intensity: number
): number[] {
  return pattern.map(duration => Math.round(duration * intensity));
}
