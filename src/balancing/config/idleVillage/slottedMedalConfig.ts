/**
 * Slotted Medal Configuration
 * 
 * Centralized configuration for medal types, behavior, and telemetry.
 * All medal parameters are config-first - no hardcoded values in components.
 */

import { z } from 'zod';

/**
 * Reference to Style Lab tokens for dynamic color binding.
 */
export interface StyleLabTokenRef {
  /** Token path in Style Lab (e.g., 'metallic.gold.primary') */
  token: string;
  /** Fallback color if token not found */
  fallback: string;
}

/**
 * Medal type definition with visual and behavioral properties.
 */
export const MedalTypeSchema = z.object({
  /** Glyph/character displayed on the medal */
  glyph: z.string(),
  /** Halo effect configuration */
  halo: z.object({
    /** Width when medal is idle */
    idleWidth: z.number().min(0).max(20),
    /** Width when medal is active/animating */
    activeWidth: z.number().min(0).max(30),
    /** Color tokens for different states */
    colors: z.array(z.object({
      token: z.string(),
      fallback: z.string(),
    })),
  }),
  /** Drop shadow CSS string */
  dropShadow: z.string(),
});

/**
 * Medal behavior parameters for physics and animations.
 */
export const MedalBehaviorSchema = z.object({
  /** Resistance duration before allowing detach (milliseconds) */
  resistDurationMs: z.number().min(100).max(5000),
  /** Spring stiffness for animations */
  springStiffness: z.number().min(100).max(1000),
  /** Spring damping for animations */
  springDamping: z.number().min(0.1).max(1),
  /** Magnetic pull behavior when near slots */
  magneticPull: z.object({
    /** Enable magnetic attraction to slots */
    enabled: z.boolean(),
    /** Elasticity factor for magnetic pull */
    elasticity: z.number().min(0.1).max(2),
  }),
});

/**
 * Telemetry event configuration for medal interactions.
 */
export const MedalTelemetrySchema = z.object({
  /** Event name for successful drop */
  dropEvent: z.string(),
  /** Event name for medal detach */
  detachEvent: z.string(),
  /** Event name for activity completion */
  completeEvent: z.string(),
});

/**
 * Complete slotted medal configuration schema.
 */
export const SlottedMedalConfigSchema = z.object({
  /** Registry of medal types by ID */
  medalTypes: z.record(MedalTypeSchema),
  /** Global behavior settings */
  behavior: MedalBehaviorSchema,
  /** Telemetry event configuration */
  telemetry: MedalTelemetrySchema,
});

export type MedalType = z.infer<typeof MedalTypeSchema>;
export type MedalBehavior = z.infer<typeof MedalBehaviorSchema>;
export type MedalTelemetry = z.infer<typeof MedalTelemetrySchema>;
export type SlottedMedalConfig = z.infer<typeof SlottedMedalConfigSchema>;

/**
 * Default slotted medal configuration.
 * Uses Style Lab Minimal Frontier metallic tokens for colors.
 */
export const DEFAULT_SLOTTED_MEDAL_CONFIG: SlottedMedalConfig = {
  medalTypes: {
    bronze: {
      glyph: '🥉',
      halo: {
        idleWidth: 2,
        activeWidth: 8,
        colors: [
          { token: 'metallic.bronze.primary', fallback: '#CD7F32' },
          { token: 'metallic.bronze.secondary', fallback: '#B87333' },
        ],
      },
      dropShadow: '0 4px 12px rgba(205, 127, 50, 0.3)',
    },
    silver: {
      glyph: '🥈',
      halo: {
        idleWidth: 2,
        activeWidth: 10,
        colors: [
          { token: 'metallic.silver.primary', fallback: '#C0C0C0' },
          { token: 'metallic.silver.secondary', fallback: '#B8B8B8' },
        ],
      },
      dropShadow: '0 4px 12px rgba(192, 192, 192, 0.3)',
    },
    gold: {
      glyph: '🥇',
      halo: {
        idleWidth: 3,
        activeWidth: 12,
        colors: [
          { token: 'metallic.gold.primary', fallback: '#FFD700' },
          { token: 'metallic.gold.secondary', fallback: '#FFA500' },
        ],
      },
      dropShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
    },
    platinum: {
      glyph: '💎',
      halo: {
        idleWidth: 4,
        activeWidth: 15,
        colors: [
          { token: 'metallic.platinum.primary', fallback: '#E5E4E2' },
          { token: 'metallic.platinum.secondary', fallback: '#CCCCCC' },
        ],
      },
      dropShadow: '0 4px 12px rgba(229, 228, 226, 0.3)',
    },
  },
  behavior: {
    resistDurationMs: 1500,
    springStiffness: 400,
    springDamping: 0.8,
    magneticPull: {
      enabled: true,
      elasticity: 1.2,
    },
  },
  telemetry: {
    dropEvent: 'slot_medal_dropped',
    detachEvent: 'slot_medal_detached',
    completeEvent: 'slot_medal_completed',
  },
};
