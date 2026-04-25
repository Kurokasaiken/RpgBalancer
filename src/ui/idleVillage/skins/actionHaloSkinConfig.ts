/**
 * ActionHalo Skin Configuration – Plan §5.5
 * 
 * Config-first tokens for ActionHalo map POI component with pillar-specific
 * visual variants, pulse animations, and interaction physics.
 * 
 * Dependencies: NP-SM-010 (skin registry), Style Lab tokens
 * Integration: useSkinPreferences, PresetManager, telemetry
 */

import { z } from 'zod';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

/**
 * Halo visual configuration
 */
export interface ActionHaloVisualConfig {
  /** Ring appearance */
  haloColor: string;
  haloGlowIntensity: number;
  haloSize: string;
  haloBorderWidth: string;
  haloBorderRadius: string;
  haloShadowBlur: string;
  haloShadowColor: string;
  
  /** Gradient configuration */
  gradientType: 'radial' | 'conic' | 'linear';
  gradientStops: Array<{
    offset: number;
    color: string;
    opacity: number;
  }>;
  
  /** Background effects */
  backgroundColor: string;
  backgroundOpacity: number;
  backdropBlur: number;
}

/**
 * Animation and motion configuration
 */
export interface ActionHaloAnimationConfig {
  /** Pulse animation */
  pulseEnabled: boolean;
  pulseIntensity: number;
  pulseDuration: string;
  pulseEasing: string;
  pulseDelay: string;
  
  /** Hover/active states */
  hoverScale: number;
  activeScale: number;
  transitionDuration: string;
  transitionEasing: string;
  
  /** Entry animation */
  entryAnimation: 'fade' | 'scale' | 'rotate' | 'none';
  entryDuration: string;
  entryEasing: string;
  
  /** Reduced motion support */
  respectReducedMotion: boolean;
  reducedMotionFallback: 'static' | 'opacity-only';
}

/**
 * Interaction configuration
 */
export interface ActionHaloInteractionConfig {
  /** Click handling */
  clickEnabled: boolean;
  clickScale: number;
  clickDuration: string;
  
  /** Drag and drop */
  dropEnabled: boolean;
  dropActiveScale: number;
  dropGlowBoost: number;
  
  /** Hover feedback */
  hoverEnabled: boolean;
  hoverGlowBoost: number;
  hoverCursor: 'pointer' | 'default';
  
  /** Audio/haptic feedback */
  audioEnabled: boolean;
  audioProfile: 'ethereal' | 'obsidian' | 'bronze' | 'none';
  hapticEnabled: boolean;
  hapticIntensity: number;
}

/**
 * Icon and content configuration
 */
export interface ActionHaloIconConfig {
  /** Icon appearance */
  iconSize: string;
  iconBackground: string;
  iconColor: string;
  iconBorderRadius: string;
  iconFont: string;
  iconFontSize: string;
  iconFontWeight: string;
  
  /** Icon text fallback */
  iconText: string;
  iconTextTransform: 'uppercase' | 'lowercase' | 'none';
  iconLetterSpacing: string;
  
  /** Custom icon support */
  customIconEnabled: boolean;
  customIconMaxSize: string;
}

/**
 * Pillar-specific overrides for Wilderness/Empire variants
 */
export interface ActionHaloPillarConfig {
  visual: Partial<ActionHaloVisualConfig>;
  animation: Partial<ActionHaloAnimationConfig>;
  interaction: Partial<ActionHaloInteractionConfig>;
  icon: Partial<ActionHaloIconConfig>;
}

/**
 * Complete ActionHalo skin configuration
 */
export interface ActionHaloSkinConfig {
  /** Base configuration */
  visual: ActionHaloVisualConfig;
  animation: ActionHaloAnimationConfig;
  interaction: ActionHaloInteractionConfig;
  icon: ActionHaloIconConfig;
  
  /** Pillar-specific overrides */
  wilderness: ActionHaloPillarConfig;
  empire: ActionHaloPillarConfig;
  
  /** Accessibility and telemetry flags */
  enableAriaLabel: boolean;
  enableTelemetry: boolean;
  enableReducedMotion: boolean;
  
  /** Performance optimizations */
  enableGPUAcceleration: boolean;
  enableWillChange: boolean;
}

// Zod schemas for runtime validation
export const ActionHaloVisualConfigSchema = z.object({
  haloColor: z.string(),
  haloGlowIntensity: z.number().min(0).max(2),
  haloSize: z.string(),
  haloBorderWidth: z.string(),
  haloBorderRadius: z.string(),
  haloShadowBlur: z.string(),
  haloShadowColor: z.string(),
  gradientType: z.enum(['radial', 'conic', 'linear']),
  gradientStops: z.array(z.object({
    offset: z.number().min(0).max(1),
    color: z.string(),
    opacity: z.number().min(0).max(1),
  })),
  backgroundColor: z.string(),
  backgroundOpacity: z.number().min(0).max(1),
  backdropBlur: z.number().min(0).max(50),
});

export const ActionHaloAnimationConfigSchema = z.object({
  pulseEnabled: z.boolean(),
  pulseIntensity: z.number().min(0).max(1),
  pulseDuration: z.string(),
  pulseEasing: z.string(),
  pulseDelay: z.string(),
  hoverScale: z.number().min(0.8).max(1.3),
  activeScale: z.number().min(0.7).max(1.2),
  transitionDuration: z.string(),
  transitionEasing: z.string(),
  entryAnimation: z.enum(['fade', 'scale', 'rotate', 'none']),
  entryDuration: z.string(),
  entryEasing: z.string(),
  respectReducedMotion: z.boolean(),
  reducedMotionFallback: z.enum(['static', 'opacity-only']),
});

export const ActionHaloInteractionConfigSchema = z.object({
  clickEnabled: z.boolean(),
  clickScale: z.number().min(0.8).max(1.2),
  clickDuration: z.string(),
  dropEnabled: z.boolean(),
  dropActiveScale: z.number().min(0.8).max(1.2),
  dropGlowBoost: z.number().min(0).max(2),
  hoverEnabled: z.boolean(),
  hoverGlowBoost: z.number().min(0).max(2),
  hoverCursor: z.enum(['pointer', 'default']),
  audioEnabled: z.boolean(),
  audioProfile: z.enum(['ethereal', 'obsidian', 'bronze', 'none']),
  hapticEnabled: z.boolean(),
  hapticIntensity: z.number().min(0).max(1),
});

export const ActionHaloIconConfigSchema = z.object({
  iconSize: z.string(),
  iconBackground: z.string(),
  iconColor: z.string(),
  iconBorderRadius: z.string(),
  iconFont: z.string(),
  iconFontSize: z.string(),
  iconFontWeight: z.string(),
  iconText: z.string(),
  iconTextTransform: z.enum(['uppercase', 'lowercase', 'none']),
  iconLetterSpacing: z.string(),
  customIconEnabled: z.boolean(),
  customIconMaxSize: z.string(),
});

export const ActionHaloPillarConfigSchema = z.object({
  visual: ActionHaloVisualConfigSchema.partial(),
  animation: ActionHaloAnimationConfigSchema.partial(),
  interaction: ActionHaloInteractionConfigSchema.partial(),
  icon: ActionHaloIconConfigSchema.partial(),
});

export const ActionHaloSkinConfigSchema = z.object({
  visual: ActionHaloVisualConfigSchema,
  animation: ActionHaloAnimationConfigSchema,
  interaction: ActionHaloInteractionConfigSchema,
  icon: ActionHaloIconConfigSchema,
  wilderness: ActionHaloPillarConfigSchema,
  empire: ActionHaloPillarConfigSchema,
  enableAriaLabel: z.boolean(),
  enableTelemetry: z.boolean(),
  enableReducedMotion: z.boolean(),
  enableGPUAcceleration: z.boolean(),
  enableWillChange: z.boolean(),
});

/**
 * Default ActionHalo skin configuration
 * Follows Wanderlust art direction with Wilderness/Empire pillars
 */
export const DEFAULT_ACTION_HALO_SKIN_CONFIG: ActionHaloSkinConfig = {
  visual: {
    haloColor: 'rgba(71, 85, 105, 0.6)',
    haloGlowIntensity: 0.8,
    haloSize: '48px',
    haloBorderWidth: '3px',
    haloBorderRadius: '50%',
    haloShadowBlur: '12px',
    haloShadowColor: 'rgba(71, 85, 105, 0.4)',
    gradientType: 'radial',
    gradientStops: [
      { offset: 0, color: 'rgba(71, 85, 105, 0.8)', opacity: 0.8 },
      { offset: 0.5, color: 'rgba(71, 85, 105, 0.4)', opacity: 0.4 },
      { offset: 1, color: 'rgba(71, 85, 105, 0)', opacity: 0 },
    ],
    backgroundColor: 'transparent',
    backgroundOpacity: 0,
    backdropBlur: 0,
  },
  animation: {
    pulseEnabled: true,
    pulseIntensity: 0.4,
    pulseDuration: '2s',
    pulseEasing: 'ease-in-out',
    pulseDelay: '0s',
    hoverScale: 1.05,
    activeScale: 0.98,
    transitionDuration: '180ms',
    transitionEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    entryAnimation: 'fade',
    entryDuration: '300ms',
    entryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    respectReducedMotion: true,
    reducedMotionFallback: 'opacity-only',
  },
  interaction: {
    clickEnabled: true,
    clickScale: 0.95,
    clickDuration: '150ms',
    dropEnabled: true,
    dropActiveScale: 0.9,
    dropGlowBoost: 1.5,
    hoverEnabled: true,
    hoverGlowBoost: 1.3,
    hoverCursor: 'pointer',
    audioEnabled: true,
    audioProfile: 'ethereal',
    hapticEnabled: true,
    hapticIntensity: 0.6,
  },
  icon: {
    iconSize: '60%',
    iconBackground: 'rgba(71, 85, 105, 0.8)',
    iconColor: '#ffffff',
    iconBorderRadius: '50%',
    iconFont: 'Cinzel, serif',
    iconFontSize: '11px',
    iconFontWeight: 'bold',
    iconText: 'POI',
    iconTextTransform: 'uppercase',
    iconLetterSpacing: '0.1em',
    customIconEnabled: true,
    customIconMaxSize: '32px',
  },
  wilderness: {
    // Wilderness: natural, organic, green tones
    visual: {
      haloColor: 'rgba(45, 154, 85, 0.7)',
      haloGlowIntensity: 0.9,
      haloShadowColor: 'rgba(45, 154, 85, 0.5)',
      gradientStops: [
        { offset: 0, color: 'rgba(45, 154, 85, 0.9)', opacity: 0.9 },
        { offset: 0.5, color: 'rgba(68, 196, 112, 0.5)', opacity: 0.5 },
        { offset: 1, color: 'rgba(31, 110, 60, 0)', opacity: 0 },
      ],
    },
    animation: {
      pulseIntensity: 0.5,
      pulseDuration: '2.5s',
      hoverScale: 1.08,
      entryAnimation: 'scale',
    },
    interaction: {
      hoverGlowBoost: 1.4,
      audioProfile: 'ethereal',
      hapticIntensity: 0.5,
    },
    icon: {
      iconText: 'WILD',
      iconBackground: 'rgba(45, 154, 85, 0.8)',
    },
  },
  empire: {
    // Empire: monumental, heavy, bronze/basalt tones
    visual: {
      haloColor: 'rgba(192, 96, 48, 0.8)',
      haloGlowIntensity: 1.0,
      haloShadowColor: 'rgba(192, 96, 48, 0.6)',
      gradientStops: [
        { offset: 0, color: 'rgba(192, 96, 48, 0.9)', opacity: 0.9 },
        { offset: 0.5, color: 'rgba(216, 128, 80, 0.6)', opacity: 0.6 },
        { offset: 1, color: 'rgba(154, 70, 26, 0)', opacity: 0 },
      ],
    },
    animation: {
      pulseIntensity: 0.6,
      pulseDuration: '2s',
      hoverScale: 1.03,
      activeScale: 0.97,
      entryAnimation: 'rotate',
    },
    interaction: {
      hoverGlowBoost: 1.6,
      audioProfile: 'bronze',
      hapticIntensity: 0.7,
    },
    icon: {
      iconText: 'EMPIRE',
      iconBackground: 'rgba(192, 96, 48, 0.8)',
    },
  },
  enableAriaLabel: true,
  enableTelemetry: true,
  enableReducedMotion: false,
  enableGPUAcceleration: true,
  enableWillChange: true,
};

/**
 * Helper function to get pillar-specific ActionHalo configuration
 */
export function getActionHaloSkinConfig(
  pillar?: StyleLabPillar,
  overrides?: Partial<ActionHaloSkinConfig>
): ActionHaloSkinConfig {
  const baseConfig = DEFAULT_ACTION_HALO_SKIN_CONFIG;
  const pillarConfig = pillar ? baseConfig[pillar] : {};
  
  return {
    visual: { ...baseConfig.visual, ...pillarConfig.visual, ...overrides?.visual },
    animation: { ...baseConfig.animation, ...pillarConfig.animation, ...overrides?.animation },
    interaction: { ...baseConfig.interaction, ...pillarConfig.interaction, ...overrides?.interaction },
    icon: { ...baseConfig.icon, ...pillarConfig.icon, ...overrides?.icon },
    wilderness: { ...baseConfig.wilderness, ...overrides?.wilderness },
    empire: { ...baseConfig.empire, ...overrides?.empire },
    enableAriaLabel: overrides?.enableAriaLabel ?? baseConfig.enableAriaLabel,
    enableTelemetry: overrides?.enableTelemetry ?? baseConfig.enableTelemetry,
    enableReducedMotion: overrides?.enableReducedMotion ?? baseConfig.enableReducedMotion,
    enableGPUAcceleration: overrides?.enableGPUAcceleration ?? baseConfig.enableGPUAcceleration,
    enableWillChange: overrides?.enableWillChange ?? baseConfig.enableWillChange,
  };
}

/**
 * Type guards and validators
 */
export function isValidActionHaloSkinConfig(config: unknown): config is ActionHaloSkinConfig {
  return ActionHaloSkinConfigSchema.safeParse(config).success;
}

export type ActionHaloSkinConfigType = z.infer<typeof ActionHaloSkinConfigSchema>;
