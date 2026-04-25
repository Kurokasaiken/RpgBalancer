/**
 * Configuration for Active HUD Haptics & Sound System
 *
 * Defines haptic feedback patterns, audio cues, and timing for Phase 12 HUD interactions.
 * Config-first design following RPG Balancer philosophy with Gilded Observatory theme.
 */

export interface HUDHapticsConfig {
  /** Global haptics settings */
  global: {
    /** Whether haptics are enabled globally */
    enabled: boolean;
    /** Vibration intensity (0.0 - 1.0) */
    intensity: number;
    /** Maximum concurrent haptic patterns */
    maxConcurrent: number;
    /** Cooldown between haptic events (ms) */
    cooldownMs: number;
  };

  /** Audio settings */
  audio: {
    /** Whether audio is enabled globally */
    enabled: boolean;
    /** Master volume (0.0 - 1.0) */
    masterVolume: number;
    /** Audio context settings */
    context: {
      sampleRate: number;
      bufferSize: number;
    };
  };

  /** Haptic patterns for different HUD events */
  patterns: Record<HUDHapticEventType, HUDHapticPattern>;
}

export interface HUDHapticPattern {
  /** Pattern priority (higher = more important) */
  priority: number;
  
  /** Haptic sequence definition */
  haptic: {
    /** Whether to use haptic feedback */
    enabled: boolean;
    /** Vibration pattern: array of [duration, intensity] pairs */
    sequence: Array<[number, number]>;
    /** Pattern type */
    type: 'short' | 'long' | 'pulse' | 'double' | 'triple' | 'continuous';
  };

  /** Audio feedback definition */
  audio: {
    /** Whether to play audio */
    enabled: boolean;
    /** Sound frequency (Hz) for synthesized tones */
    frequency?: number;
    /** Sound duration (ms) */
    duration?: number;
    /** Sound type */
    type: 'tone' | 'click' | 'chime' | 'alert' | 'success' | 'warning';
    /** Volume override (null = use master) */
    volume?: number;
  };

  /** Visual feedback coordination */
  visual: {
    /** Whether to coordinate with visual animations */
    coordinated: boolean;
    /** Animation delay relative to haptic (ms) */
    delayMs: number;
    /** Whether to trigger visual emphasis */
    emphasis: boolean;
  };
}

export type HUDHapticEventType =
  | 'card_select'
  | 'card_hover'
  | 'card_click'
  | 'activity_start'
  | 'activity_complete'
  | 'activity_fail'
  | 'progress_milestone'
  | 'notification_show'
  | 'notification_dismiss'
  | 'hud_show'
  | 'hud_hide'
  | 'overflow_warning'
  | 'critical_alert';

/**
 * Default haptics configuration for Active HUD
 * Follows Gilded Observatory theme with subtle, professional feedback
 */
export const DEFAULT_HUD_HAPTICS_CONFIG: HUDHapticsConfig = {
  global: {
    enabled: true,
    intensity: 0.7,
    maxConcurrent: 3,
    cooldownMs: 100,
  },

  audio: {
    enabled: false, // Disabled by default for privacy
    masterVolume: 0.3,
    context: {
      sampleRate: 44100,
      bufferSize: 256,
    },
  },

  patterns: {
    card_select: {
      priority: 2,
      haptic: {
        enabled: true,
        sequence: [[10, 0.3], [5, 0.1]],
        type: 'short',
      },
      audio: {
        enabled: false,
        frequency: 800,
        duration: 50,
        type: 'click',
        volume: 0.2,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: true,
      },
    },

    card_hover: {
      priority: 1,
      haptic: {
        enabled: true,
        sequence: [[5, 0.1]],
        type: 'short',
      },
      audio: {
        enabled: false,
        frequency: 600,
        duration: 30,
        type: 'tone',
        volume: 0.1,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: false,
      },
    },

    card_click: {
      priority: 3,
      haptic: {
        enabled: true,
        sequence: [[15, 0.5], [10, 0.2]],
        type: 'double',
      },
      audio: {
        enabled: false,
        frequency: 1000,
        duration: 80,
        type: 'click',
        volume: 0.3,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: true,
      },
    },

    activity_start: {
      priority: 4,
      haptic: {
        enabled: true,
        sequence: [[20, 0.6], [10, 0.3], [20, 0.6]],
        type: 'triple',
      },
      audio: {
        enabled: false,
        frequency: 440,
        duration: 150,
        type: 'chime',
        volume: 0.4,
      },
      visual: {
        coordinated: true,
        delayMs: 50,
        emphasis: true,
      },
    },

    activity_complete: {
      priority: 5,
      haptic: {
        enabled: true,
        sequence: [[30, 0.8], [20, 0.4], [10, 0.2]],
        type: 'long',
      },
      audio: {
        enabled: false,
        frequency: 880,
        duration: 200,
        type: 'success',
        volume: 0.5,
      },
      visual: {
        coordinated: true,
        delayMs: 100,
        emphasis: true,
      },
    },

    activity_fail: {
      priority: 6,
      haptic: {
        enabled: true,
        sequence: [[50, 1.0], [30, 0.8], [20, 0.6]],
        type: 'pulse',
      },
      audio: {
        enabled: false,
        frequency: 220,
        duration: 250,
        type: 'warning',
        volume: 0.6,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: true,
      },
    },

    progress_milestone: {
      priority: 2,
      haptic: {
        enabled: true,
        sequence: [[8, 0.2], [4, 0.1]],
        type: 'short',
      },
      audio: {
        enabled: false,
        frequency: 660,
        duration: 40,
        type: 'tone',
        volume: 0.15,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: false,
      },
    },

    notification_show: {
      priority: 3,
      haptic: {
        enabled: true,
        sequence: [[12, 0.4], [8, 0.2]],
        type: 'double',
      },
      audio: {
        enabled: false,
        frequency: 720,
        duration: 100,
        type: 'chime',
        volume: 0.3,
      },
      visual: {
        coordinated: true,
        delayMs: 50,
        emphasis: true,
      },
    },

    notification_dismiss: {
      priority: 2,
      haptic: {
        enabled: true,
        sequence: [[6, 0.2]],
        type: 'short',
      },
      audio: {
        enabled: false,
        frequency: 540,
        duration: 60,
        type: 'click',
        volume: 0.2,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: false,
      },
    },

    hud_show: {
      priority: 1,
      haptic: {
        enabled: true,
        sequence: [[15, 0.3]],
        type: 'short',
      },
      audio: {
        enabled: false,
        frequency: 480,
        duration: 80,
        type: 'tone',
        volume: 0.2,
      },
      visual: {
        coordinated: true,
        delayMs: 100,
        emphasis: false,
      },
    },

    hud_hide: {
      priority: 1,
      haptic: {
        enabled: false, // No haptic for hide to avoid annoyance
        sequence: [],
        type: 'short',
      },
      audio: {
        enabled: false,
        frequency: 400,
        duration: 60,
        type: 'tone',
        volume: 0.1,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: false,
      },
    },

    overflow_warning: {
      priority: 4,
      haptic: {
        enabled: true,
        sequence: [[25, 0.7], [15, 0.5], [25, 0.7]],
        type: 'pulse',
      },
      audio: {
        enabled: false,
        frequency: 360,
        duration: 180,
        type: 'warning',
        volume: 0.5,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: true,
      },
    },

    critical_alert: {
      priority: 7,
      haptic: {
        enabled: true,
        sequence: [[40, 1.0], [20, 0.8], [40, 1.0], [20, 0.8]],
        type: 'continuous',
      },
      audio: {
        enabled: false,
        frequency: 200,
        duration: 300,
        type: 'alert',
        volume: 0.8,
      },
      visual: {
        coordinated: true,
        delayMs: 0,
        emphasis: true,
      },
    },
  },
};

/**
 * Test mode configuration with reduced intensity and disabled audio
 */
export const TEST_HUD_HAPTICS_CONFIG: HUDHapticsConfig = {
  ...DEFAULT_HUD_HAPTICS_CONFIG,
  global: {
    ...DEFAULT_HUD_HAPTICS_CONFIG.global,
    enabled: true,
    intensity: 0.1, // Very low intensity for testing
    cooldownMs: 50,
  },
  audio: {
    ...DEFAULT_HUD_HAPTICS_CONFIG.audio,
    enabled: false, // Always disabled in tests
  },
  patterns: Object.fromEntries(
    Object.entries(DEFAULT_HUD_HAPTICS_CONFIG.patterns).map(([key, pattern]) => [
      key,
      {
        ...pattern,
        haptic: {
          ...pattern.haptic,
          sequence: pattern.haptic.sequence.map(([duration, intensity]) => [
            Math.min(duration, 10), // Cap duration for tests
            intensity * 0.1, // Very low intensity
          ] as [number, number]),
        },
        audio: {
          ...pattern.audio,
          enabled: false, // No audio in tests
        },
      },
    ])
  ),
};

/**
 * Utility function to check if haptics are supported
 */
export function isHapticsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'navigator' in window &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  );
}

/**
 * Utility function to check if Web Audio API is supported
 */
export function isAudioSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'AudioContext' in window ||
    'webkitAudioContext' in window
  );
}

/**
 * Get appropriate config based on environment
 */
export function getHUDHapticsConfig(testMode = false): HUDHapticsConfig {
  return testMode ? TEST_HUD_HAPTICS_CONFIG : DEFAULT_HUD_HAPTICS_CONFIG;
}
