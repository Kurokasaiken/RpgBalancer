/**
 * Resource Pinball Monitor Config
 *
 * Config-first design for Resource Pinball Monitor component.
 * Manages pinball animation states, stress thresholds, and visual feedback.
 */

import { z } from 'zod';

// Motion tokens for pinball animations (Style Laboratory)
export const RESOURCE_PINBALL_MOTION_TOKENS = {
  // Lane overload animation
  laneOverload: {
    duration: 300,
    easing: 'ease-out',
    scale: 1.1,
    glowIntensity: 0.8,
  },
  // Pause toggle animation
  pauseToggle: {
    duration: 200,
    easing: 'ease-in-out',
    opacity: 0.6,
  },
  // Export click feedback
  exportClick: {
    duration: 150,
    easing: 'ease-out',
    scale: 0.95,
  },
  // Stress indicator pulse
  stressPulse: {
    duration: 800,
    easing: 'ease-in-out',
    intensity: 0.7,
  },
} as const;

// Config schema
export const ResourcePinballMonitorConfigSchema = z.object({
  // Thresholds for stress detection
  stressThresholds: z.object({
    highLoad: z.number().min(0).max(1).default(0.8),
    overload: z.number().min(0).max(1).default(0.95),
  }),

  // Animation settings
  animations: z.object({
    enabled: z.boolean().default(true),
    motionTokens: z.object({
      laneOverload: z.object({
        duration: z.number().positive(),
        easing: z.string(),
        scale: z.number().positive(),
        glowIntensity: z.number().min(0).max(1),
      }),
      pauseToggle: z.object({
        duration: z.number().positive(),
        easing: z.string(),
        opacity: z.number().min(0).max(1),
      }),
      exportClick: z.object({
        duration: z.number().positive(),
        easing: z.string(),
        scale: z.number().positive(),
      }),
      stressPulse: z.object({
        duration: z.number().positive(),
        easing: z.string(),
        intensity: z.number().min(0).max(1),
      }),
    }),
  }),

  // Persistence settings
  persistence: z.object({
    key: z.string().default('resource-pinball-monitor'),
    autoSave: z.boolean().default(true),
    saveIntervalMs: z.number().positive().default(30000),
  }),

  // Diagnostics overlay settings
  diagnostics: z.object({
    enabled: z.boolean().default(false),
    overlayOpacity: z.number().min(0).max(1).default(0.1),
    showMetrics: z.boolean().default(true),
    showStressIndicators: z.boolean().default(true),
  }),

  // Telemetry settings
  telemetry: z.object({
    enabled: z.boolean().default(true),
    events: z.object({
      laneOverload: z.string().default('resource_pinball_lane_overload'),
      pauseToggled: z.string().default('resource_pinball_pause_toggled'),
      exportClicked: z.string().default('resource_pinball_export_clicked'),
    }),
  }),
});

export type ResourcePinballMonitorConfig = z.infer<typeof ResourcePinballMonitorConfigSchema>;

// Default configuration
export const defaultResourcePinballMonitorConfig: ResourcePinballMonitorConfig = {
  stressThresholds: {
    highLoad: 0.8,
    overload: 0.95,
  },
  animations: {
    enabled: true,
    motionTokens: RESOURCE_PINBALL_MOTION_TOKENS,
  },
  persistence: {
    key: 'resource-pinball-monitor',
    autoSave: true,
    saveIntervalMs: 30000,
  },
  diagnostics: {
    enabled: false,
    overlayOpacity: 0.1,
    showMetrics: true,
    showStressIndicators: true,
  },
  telemetry: {
    enabled: true,
    events: {
      laneOverload: 'resource_pinball_lane_overload',
      pauseToggled: 'resource_pinball_pause_toggled',
      exportClicked: 'resource_pinball_export_clicked',
    },
  },
};

// Persistence preferences schema
export const ResourcePinballMonitorPreferencesSchema = z.object({
  paused: z.boolean().default(false),
  diagnosticsEnabled: z.boolean().default(false),
  lastStressLevel: z.number().min(0).max(1).default(0),
  animationEnabled: z.boolean().default(true),
});

export type ResourcePinballMonitorPreferences = z.infer<typeof ResourcePinballMonitorPreferencesSchema>;

export const defaultResourcePinballMonitorPreferences: ResourcePinballMonitorPreferences = {
  paused: false,
  diagnosticsEnabled: false,
  lastStressLevel: 0,
  animationEnabled: true,
};
