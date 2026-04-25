/**
 * Cursor Presets Configuration
 *
 * Defines cursor avatar presets for Physics Lab FX integration.
 * Includes gauntlet, arcane wand, and sword presets with configurable parameters.
 */

import { z } from 'zod';

/** Available cursor avatar preset types. */
export const CursorPresetTypeSchema = z.enum(['gauntlet', 'arcaneWand', 'sword']);

/** Type inferred from cursor preset schema. */
export type CursorPresetType = z.infer<typeof CursorPresetTypeSchema>;

/** Schema for cursor trail configuration. */
export const CursorTrailConfigSchema = z.object({
  /** Trail length multiplier (0.1 = short, 2.0 = long). */
  trailLength: z.number().min(0.1).max(2.0),
  /** Trail glow intensity (0 = none, 1 = maximum). */
  glowIntensity: z.number().min(0).max(1),
  /** Trail fade speed (0.1 = slow fade, 1.0 = instant). */
  fadeSpeed: z.number().min(0.1).max(1.0),
  /** Trail color in hex format. */
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  /** Whether trail responds to cursor velocity. */
  velocityResponsive: z.boolean(),
  /** Trail particle count. */
  particleCount: z.number().min(1).max(20),
});

/** Schema for cursor easing configuration. */
export const CursorEasingConfigSchema = z.object({
  /** Easing function type for cursor movement. */
  easingType: z.enum(['linear', 'easeOut', 'easeInOut', 'easeOutCubic', 'easeOutBack']),
  /** Movement smoothing factor (0 = none, 1 = maximum smoothing). */
  smoothingFactor: z.number().min(0).max(1),
  /** Cursor acceleration multiplier. */
  acceleration: z.number().min(0.5).max(3.0),
  /** Cursor deceleration multiplier. */
  deceleration: z.number().min(0.5).max(3.0),
});

/** Schema for cursor avatar visual configuration. */
export const CursorAvatarConfigSchema = z.object({
  /** Avatar size in pixels. */
  size: z.number().min(8).max(64),
  /** Avatar rotation angle in degrees. */
  rotation: z.number().min(0).max(360),
  /** Avatar opacity (0 = transparent, 1 = opaque). */
  opacity: z.number().min(0).max(1),
  /** Whether avatar scales with cursor velocity. */
  velocityScaling: z.boolean(),
  /** Avatar icon/emoji representation. */
  icon: z.string(),
  /** Avatar border color. */
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  /** Avatar fill color. */
  fillColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

/** Complete cursor preset configuration schema. */
export const CursorPresetSchema = z.object({
  /** Unique preset identifier. */
  id: CursorPresetTypeSchema,
  /** Human-readable preset name. */
  name: z.string(),
  /** Preset description. */
  description: z.string(),
  /** Trail configuration. */
  trail: CursorTrailConfigSchema,
  /** Easing configuration. */
  easing: CursorEasingConfigSchema,
  /** Avatar visual configuration. */
  avatar: CursorAvatarConfigSchema,
  /** Whether preset is enabled for selection. */
  enabled: z.boolean(),
  /** Preset priority for sorting. */
  priority: z.number(),
});

/** Type inferred from cursor preset schema. */
export type CursorPreset = z.infer<typeof CursorPresetSchema>;

/** Record schema for cursor preset collections. */
export const CursorPresetMapSchema = z.record(CursorPresetTypeSchema, CursorPresetSchema);

/**
 * Default cursor preset configurations.
 * Each preset defines the visual behavior and feel of cursor interactions.
 */
export const cursorPresets: Record<CursorPresetType, CursorPreset> = {
  gauntlet: {
    id: 'gauntlet',
    name: 'Gauntlet',
    description: 'Heavy metallic gauntlet with golden trail and strong impact feedback.',
    trail: {
      trailLength: 1.2,
      glowIntensity: 0.8,
      fadeSpeed: 0.3,
      color: '#d4aa50',
      velocityResponsive: true,
      particleCount: 8,
    },
    easing: {
      easingType: 'easeOutCubic',
      smoothingFactor: 0.7,
      acceleration: 1.2,
      deceleration: 0.8,
    },
    avatar: {
      size: 32,
      rotation: 0,
      opacity: 0.9,
      velocityScaling: true,
      icon: '👊',
      borderColor: '#c8a030',
      fillColor: '#d4aa50',
    },
    enabled: true,
    priority: 1,
  },

  arcaneWand: {
    id: 'arcaneWand',
    name: 'Arcane Wand',
    description: 'Mystical wand with ethereal purple trail and magical particle effects.',
    trail: {
      trailLength: 1.8,
      glowIntensity: 1.0,
      fadeSpeed: 0.1,
      color: '#9b59b6',
      velocityResponsive: true,
      particleCount: 12,
    },
    easing: {
      easingType: 'easeInOut',
      smoothingFactor: 0.9,
      acceleration: 1.5,
      deceleration: 1.2,
    },
    avatar: {
      size: 24,
      rotation: 45,
      opacity: 0.8,
      velocityScaling: true,
      icon: '🪄',
      borderColor: '#8e44ad',
      fillColor: '#9b59b6',
    },
    enabled: true,
    priority: 2,
  },

  sword: {
    id: 'sword',
    name: 'Sword',
    description: 'Sharp blade with silver trail and precise movement feedback.',
    trail: {
      trailLength: 0.8,
      glowIntensity: 0.6,
      fadeSpeed: 0.5,
      color: '#bdc3c7',
      velocityResponsive: false,
      particleCount: 4,
    },
    easing: {
      easingType: 'linear',
      smoothingFactor: 0.3,
      acceleration: 2.0,
      deceleration: 2.0,
    },
    avatar: {
      size: 28,
      rotation: -45,
      opacity: 1.0,
      velocityScaling: false,
      icon: '⚔️',
      borderColor: '#95a5a6',
      fillColor: '#bdc3c7',
    },
    enabled: true,
    priority: 3,
  },
};

/** Default cursor preset identifier. */
export const DEFAULT_CURSOR_PRESET: CursorPresetType = 'gauntlet';

/** Default cursor preset instance. */
export const DEFAULT_CURSOR_PRESET_CONFIG = cursorPresets[DEFAULT_CURSOR_PRESET];

/**
 * Gets a cursor preset by ID.
 * @param presetId - The preset identifier.
 * @returns The cursor preset configuration.
 */
export const getCursorPreset = (presetId: CursorPresetType): CursorPreset => {
  return cursorPresets[presetId] || DEFAULT_CURSOR_PRESET_CONFIG;
};

/**
 * Gets all enabled cursor presets sorted by priority.
 * @returns Array of enabled cursor presets.
 */
export const getEnabledCursorPresets = (): CursorPreset[] => {
  return Object.values(cursorPresets)
    .filter(preset => preset.enabled)
    .sort((a, b) => a.priority - b.priority);
};

/**
 * Validates cursor preset configuration against schema.
 * @param preset - The preset configuration to validate.
 * @returns True if valid, false otherwise.
 */
export const validateCursorPreset = (preset: unknown): preset is CursorPreset => {
  return CursorPresetSchema.safeParse(preset).success;
};

/**
 * Exports cursor preset configuration as JSON string.
 * @param presetId - The preset identifier to export.
 * @returns JSON string of the preset configuration.
 */
export const exportCursorPreset = (presetId: CursorPresetType): string => {
  const preset = getCursorPreset(presetId);
  return JSON.stringify(preset, null, 2);
};

/**
 * Imports cursor preset configuration from JSON string.
 * @param jsonString - The JSON string to import.
 * @returns The imported cursor preset or null if invalid.
 */
export const importCursorPreset = (jsonString: string): CursorPreset | null => {
  try {
    const parsed = JSON.parse(jsonString);
    return validateCursorPreset(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
