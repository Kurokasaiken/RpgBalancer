/**
 * Crew Scheduler HUD Configuration - NP-017
 * 
 * Configuration for crew scheduler HUD integration with Active HUD.
 * Defines badges, thresholds, colors, and visual settings for crew status cards.
 * Follows config-first design with Zod schema validation.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Crew status levels for HUD display
 */
export const CREW_STATUS_LEVELS = {
  AVAILABLE: 'available',
  WORKING: 'working', 
  RESTING: 'resting',
  INJURED: 'injured',
  EXHAUSTED: 'exhausted',
} as const;

const crewStatusLevelEnum = z.enum([
  CREW_STATUS_LEVELS.AVAILABLE,
  CREW_STATUS_LEVELS.WORKING,
  CREW_STATUS_LEVELS.RESTING,
  CREW_STATUS_LEVELS.INJURED,
  CREW_STATUS_LEVELS.EXHAUSTED,
]);

export type CrewStatusLevel = z.infer<typeof crewStatusLevelEnum>;

/**
 * Alert severity levels for crew notifications
 */
export const CREW_ALERT_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type CrewAlertLevel = typeof CREW_ALERT_LEVELS[keyof typeof CREW_ALERT_LEVELS];

/**
 * Visual configuration for crew status badges
 */
export const CrewBadgeConfigSchema = z.object({
  /** Badge background color */
  backgroundColor: z.string(),
  /** Badge text color */
  textColor: z.string(),
  /** Badge border color */
  borderColor: z.string(),
  /** Badge size in pixels */
  size: z.number().min(12).max(24),
  /** Whether to show icon */
  showIcon: z.boolean(),
  /** Icon character or emoji */
  icon: z.string().optional(),
});

export type CrewBadgeConfig = z.infer<typeof CrewBadgeConfigSchema>;

/**
 * Thresholds for crew status and alerts
 */
export const CrewThresholdsConfigSchema = z.object({
  /** Fatigue threshold for exhaustion alert (0-1) */
  fatigueExhausted: z.number().min(0).max(1),
  /** Fatigue threshold for tired warning (0-1) */
  fatigueTired: z.number().min(0).max(1),
  /** Queue size threshold for high alert */
  queueHighThreshold: z.number().min(1),
  /** Queue size threshold for medium alert */
  queueMediumThreshold: z.number().min(1),
  /** Priority score threshold for urgent tasks */
  urgentPriorityThreshold: z.number().min(0),
  /** Response time threshold in seconds */
  responseTimeThreshold: z.number().min(1),
});

export type CrewThresholdsConfig = z.infer<typeof CrewThresholdsConfigSchema>;

/**
 * Color palette for crew HUD elements
 */
export const CrewColorsConfigSchema = z.object({
  /** Status level colors */
  status: z.record(z.enum(['available', 'working', 'resting', 'injured', 'exhausted']), z.string()),
  /** Alert level colors */
  alerts: z.record(z.enum(['none', 'low', 'medium', 'high', 'critical']), z.string()),
  /** Progress bar colors */
  progress: z.object({
    fill: z.string(),
    background: z.string(),
    border: z.string(),
  }),
  /** Control button colors */
  controls: z.object({
    primary: z.string(),
    secondary: z.string(),
    disabled: z.string(),
    hover: z.string(),
  }),
  /** Text colors */
  text: z.object({
    primary: z.string(),
    secondary: z.string(),
    muted: z.string(),
    inverse: z.string(),
  }),
});

export type CrewColorsConfig = z.infer<typeof CrewColorsConfigSchema>;

/**
 * Animation and interaction settings
 */
export const CrewAnimationConfigSchema = z.object({
  /** Enable animations */
  enabled: z.boolean(),
  /** Animation duration in milliseconds */
  duration: z.number().min(100).max(2000),
  /** Animation easing */
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']),
  /** Enable hover effects */
  enableHover: z.boolean(),
  /** Enable pulse animations for alerts */
  enableAlertPulse: z.boolean(),
  /** Pulse animation interval in milliseconds */
  alertPulseInterval: z.number().min(500).max(5000),
});

export type CrewAnimationConfig = z.infer<typeof CrewAnimationConfigSchema>;

/**
 * Layout configuration for crew HUD cards
 */
export const CrewLayoutConfigSchema = z.object({
  /** Maximum number of crew cards to display */
  maxVisibleCards: z.number().min(1).max(10),
  /** Card width in pixels */
  cardWidth: z.number().min(200).max(400),
  /** Card height in pixels */
  cardHeight: z.number().min(100).max(300),
  /** Spacing between cards in pixels */
  cardSpacing: z.number().min(4).max(20),
  /** Border radius in pixels */
  borderRadius: z.number().min(4).max(16),
  /** Padding in pixels */
  padding: z.number().min(8).max(24),
  /** Compact mode for small screens */
  compactMode: z.boolean(),
  /** Show crew avatars */
  showAvatars: z.boolean(),
  /** Avatar size in pixels */
  avatarSize: z.number().min(24).max(64),
});

export type CrewLayoutConfig = z.infer<typeof CrewLayoutConfigSchema>;

/**
 * Control configuration for crew interactions
 */
export const CrewControlsConfigSchema = z.object({
  /** Enable pause/resume controls */
  enablePause: z.boolean(),
  /** Enable priority adjustment */
  enablePriority: z.boolean(),
  /** Enable quick assign */
  enableQuickAssign: z.boolean(),
  /** Enable view details */
  enableViewDetails: z.boolean(),
  /** Show control tooltips */
  showTooltips: z.boolean(),
  /** Tooltip delay in milliseconds */
  tooltipDelay: z.number().min(100).max(2000),
  /** Control size in pixels */
  controlSize: z.number().min(16).max(32),
});

export type CrewControlsConfig = z.infer<typeof CrewControlsConfigSchema>;

/**
 * Main crew HUD configuration schema
 */
export const CrewHUDConfigSchema = z.object({
  /** Badge configuration for different status levels */
  badges: z.record(crewStatusLevelEnum, CrewBadgeConfigSchema),
  /** Thresholds for alerts and status changes */
  thresholds: CrewThresholdsConfigSchema,
  /** Color palette for all visual elements */
  colors: CrewColorsConfigSchema,
  /** Animation and interaction settings */
  animation: CrewAnimationConfigSchema,
  /** Layout and sizing configuration */
  layout: CrewLayoutConfigSchema,
  /** Control and interaction configuration */
  controls: CrewControlsConfigSchema,
  /** Enable telemetry tracking */
  enableTelemetry: z.boolean(),
  /** Refresh rate in milliseconds */
  refreshRate: z.number().min(1000).max(30000),
  /** Maximum history items to keep */
  maxHistoryItems: z.number().min(10).max(100),
});

export type CrewHUDConfig = z.infer<typeof CrewHUDConfigSchema>;

/**
 * Default configuration for crew scheduler HUD
 */
export const DEFAULT_CREW_HUD_CONFIG: CrewHUDConfig = {
  badges: {
    [CREW_STATUS_LEVELS.AVAILABLE]: {
      backgroundColor: 'rgb(34, 197, 94)', // green-500
      textColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(22, 163, 74)', // green-600
      size: 16,
      showIcon: true,
      icon: '✓',
    },
    [CREW_STATUS_LEVELS.WORKING]: {
      backgroundColor: 'rgb(59, 130, 246)', // blue-500
      textColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(37, 99, 235)', // blue-600
      size: 16,
      showIcon: true,
      icon: '⚒',
    },
    [CREW_STATUS_LEVELS.RESTING]: {
      backgroundColor: 'rgb(251, 191, 36)', // amber-400
      textColor: 'rgb(0, 0, 0)',
      borderColor: 'rgb(245, 158, 11)', // amber-500
      size: 16,
      showIcon: true,
      icon: '⏸',
    },
    [CREW_STATUS_LEVELS.INJURED]: {
      backgroundColor: 'rgb(239, 68, 68)', // red-500
      textColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(220, 38, 38)', // red-600
      size: 16,
      showIcon: true,
      icon: '⚠',
    },
    [CREW_STATUS_LEVELS.EXHAUSTED]: {
      backgroundColor: 'rgb(127, 29, 29)', // red-800
      textColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(153, 27, 27)', // red-700
      size: 16,
      showIcon: true,
      icon: '⚠',
    },
  },

  thresholds: {
    fatigueExhausted: 0.9,
    fatigueTired: 0.7,
    queueHighThreshold: 5,
    queueMediumThreshold: 3,
    urgentPriorityThreshold: 0.8,
    responseTimeThreshold: 30,
  },

  colors: {
    status: {
      [CREW_STATUS_LEVELS.AVAILABLE]: 'rgb(34, 197, 94)',
      [CREW_STATUS_LEVELS.WORKING]: 'rgb(59, 130, 246)',
      [CREW_STATUS_LEVELS.RESTING]: 'rgb(251, 191, 36)',
      [CREW_STATUS_LEVELS.INJURED]: 'rgb(239, 68, 68)',
      [CREW_STATUS_LEVELS.EXHAUSTED]: 'rgb(127, 29, 29)',
    },
    alerts: {
      [CREW_ALERT_LEVELS.NONE]: 'rgb(156, 163, 175)',
      [CREW_ALERT_LEVELS.LOW]: 'rgb(251, 191, 36)',
      [CREW_ALERT_LEVELS.MEDIUM]: 'rgb(251, 146, 60)',
      [CREW_ALERT_LEVELS.HIGH]: 'rgb(239, 68, 68)',
      [CREW_ALERT_LEVELS.CRITICAL]: 'rgb(127, 29, 29)',
    },
    progress: {
      fill: 'rgb(34, 197, 94)',
      background: 'rgb(31, 41, 55)',
      border: 'rgb(75, 85, 99)',
    },
    controls: {
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(107, 114, 128)',
      disabled: 'rgb(75, 85, 99)',
      hover: 'rgb(37, 99, 235)',
    },
    text: {
      primary: 'rgb(243, 244, 246)',
      secondary: 'rgb(156, 163, 175)',
      muted: 'rgb(107, 114, 128)',
      inverse: 'rgb(17, 24, 39)',
    },
  },

  animation: {
    enabled: true,
    duration: 300,
    easing: 'ease-out',
    enableHover: true,
    enableAlertPulse: true,
    alertPulseInterval: 2000,
  },

  layout: {
    maxVisibleCards: 4,
    cardWidth: 280,
    cardHeight: 160,
    cardSpacing: 12,
    borderRadius: 8,
    padding: 16,
    compactMode: false,
    showAvatars: true,
    avatarSize: 40,
  },

  controls: {
    enablePause: true,
    enablePriority: true,
    enableQuickAssign: true,
    enableViewDetails: true,
    showTooltips: true,
    tooltipDelay: 800,
    controlSize: 24,
  },

  enableTelemetry: true,
  refreshRate: 5000,
  maxHistoryItems: 50,
};

/**
 * Validates and creates a crew HUD configuration
 */
export function createCrewHUDConfig(config: Partial<CrewHUDConfig> = {}): CrewHUDConfig {
  const merged = { ...DEFAULT_CREW_HUD_CONFIG, ...config };
  return CrewHUDConfigSchema.parse(merged);
}

/**
 * Gets crew status level from resident state
 */
export function getCrewStatusLevel(resident: {
  status: string;
  fatigue: number;
}): CrewStatusLevel {
  if (resident.fatigue >= DEFAULT_CREW_HUD_CONFIG.thresholds.fatigueExhausted) {
    return CREW_STATUS_LEVELS.EXHAUSTED;
  }
  
  switch (resident.status) {
    case 'injured':
      return CREW_STATUS_LEVELS.INJURED;
    case 'resting':
      return CREW_STATUS_LEVELS.RESTING;
    case 'working':
      return CREW_STATUS_LEVELS.WORKING;
    case 'available':
    default:
      return CREW_STATUS_LEVELS.AVAILABLE;
  }
}

/**
 * Gets alert level from crew metrics
 */
export function getCrewAlertLevel(metrics: {
  fatigue: number;
  queueSize: number;
  responseTime?: number;
}): CrewAlertLevel {
  const { fatigue, queueSize, responseTime } = metrics;
  const { thresholds } = DEFAULT_CREW_HUD_CONFIG;
  
  // Critical conditions
  if (fatigue >= thresholds.fatigueExhausted || 
      queueSize >= thresholds.queueHighThreshold ||
      (responseTime && responseTime > thresholds.responseTimeThreshold * 2)) {
    return CREW_ALERT_LEVELS.CRITICAL;
  }
  
  // High priority conditions
  if (fatigue >= thresholds.fatigueTired || 
      queueSize >= thresholds.queueMediumThreshold ||
      (responseTime && responseTime > thresholds.responseTimeThreshold)) {
    return CREW_ALERT_LEVELS.HIGH;
  }
  
  // Medium priority
  if (queueSize > 1 || fatigue > 0.5) {
    return CREW_ALERT_LEVELS.MEDIUM;
  }
  
  // Low priority
  if (queueSize > 0 || fatigue > 0.2) {
    return CREW_ALERT_LEVELS.LOW;
  }
  
  return CREW_ALERT_LEVELS.NONE;
}
