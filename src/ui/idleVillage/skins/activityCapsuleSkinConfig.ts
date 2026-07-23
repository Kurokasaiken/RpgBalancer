/**
 * ActivityCapsule Skin Configuration – Plan §5.5
 * 
 * Config-first tokens for ActivityCapsule component layout, slot display,
 * progress bar styling, and pillar-specific visual variants.
 * 
 * Dependencies: NP-SM-010 (skin registry), Style Lab tokens
 * Integration: useSkinPreferences, PresetManager, telemetry
 */

import { z } from 'zod';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

/**
 * Layout configuration for capsule frame and slot arrangement
 */
export interface ActivityCapsuleLayoutConfig {
  /** Frame border color and glow intensity */
  frameBorder: string;
  frameBackground: string;
  frameBorderRadius: string;
  framePadding: string;
  frameMinHeight: string;
  frameBoxShadow: string;
  
  /** Slot grid layout */
  slotGridColumns: number;
  slotGap: string;
  slotSize: string;
  slotBorderRadius: string;
  slotBorder: string;
  slotBackground: string;
  
  /** Responsive breakpoints */
  mobileSlotColumns: number;
  compactSlotSize: string;
}

const mergePartialSection = <T>(baseSection: Partial<T> | undefined, overrideSection?: Partial<T>): Partial<T> => ({
  ...(baseSection ?? {}),
  ...(overrideSection ?? {}),
});

const mergePillarConfig = (
  base: ActivityCapsulePillarConfig,
  overrides?: ActivityCapsulePillarConfig,
): ActivityCapsulePillarConfig => ({
  layout: mergePartialSection<ActivityCapsuleLayoutConfig>(base.layout, overrides?.layout),
  progress: mergePartialSection<ActivityCapsuleProgressConfig>(base.progress, overrides?.progress),
  cta: mergePartialSection<ActivityCapsuleCTAConfig>(base.cta, overrides?.cta),
  animation: mergePartialSection<ActivityCapsuleAnimationConfig>(base.animation, overrides?.animation),
});

/**
 * Deep-merge helper used for pillar overrides and named presets.
 */
export function mergeActivityCapsuleConfig(
  base: ActivityCapsuleSkinConfig,
  overrides?: Partial<ActivityCapsuleSkinConfig>,
): ActivityCapsuleSkinConfig {
  return {
    layout: { ...base.layout, ...(overrides?.layout ?? {}) },
    progress: { ...base.progress, ...(overrides?.progress ?? {}) },
    cta: { ...base.cta, ...(overrides?.cta ?? {}) },
    animation: { ...base.animation, ...(overrides?.animation ?? {}) },
    wilderness: mergePillarConfig(base.wilderness, overrides?.wilderness),
    empire: mergePillarConfig(base.empire, overrides?.empire),
    enableAriaLive: overrides?.enableAriaLive ?? base.enableAriaLive,
    enableTelemetry: overrides?.enableTelemetry ?? base.enableTelemetry,
    enableReducedMotion: overrides?.enableReducedMotion ?? base.enableReducedMotion,
  };
}

/**
 * Progress bar visual configuration
 */
export interface ActivityCapsuleProgressConfig {
  /** Progress bar appearance */
  progressBackground: string;
  progressFill: string;
  progressBorder: string;
  progressHeight: string;
  progressBorderRadius: string;
  progressTransition: string;
  
  /** Liquid gold effect */
  liquidGoldGradient: string;
  liquidGoldGlow: string;
  liquidGoldShimmer: boolean;
  shimmerAnimationDuration: string;
  
  /** Timer display */
  timerFont: string;
  timerColor: string;
  timerFontSize: string;
}

/**
 * CTA (Collect) button configuration
 */
export interface ActivityCapsuleCTAConfig {
  /** Button appearance */
  ctaBackground: string;
  ctaBorderColor: string;
  ctaTextColor: string;
  ctaBorderRadius: string;
  ctaPadding: string;
  ctaFontSize: string;
  ctaFontWeight: string;
  
  /** Hover/active states */
  ctaHoverBackground: string;
  ctaHoverBorderColor: string;
  ctaActiveScale: number;
  ctaTransition: string;
  
  /** Disabled state */
  ctaDisabledBackground: string;
  ctaDisabledTextColor: string;
  ctaDisabledOpacity: number;
}

/**
 * Animation and motion configuration
 */
export interface ActivityCapsuleAnimationConfig {
  /** Entry animations */
  entryAnimation: 'fade' | 'slide-up' | 'scale' | 'none';
  entryDuration: string;
  entryEasing: string;
  
  /** Progress pulse */
  progressPulseEnabled: boolean;
  progressPulseIntensity: number;
  progressPulseDuration: string;
  
  /** Slot hover effects */
  slotHoverScale: number;
  slotHoverGlow: string;
  slotHoverTransition: string;
  
  /** Collect feedback */
  collectFeedbackAnimation: 'bounce' | 'flash' | 'ripple' | 'none';
  collectFeedbackDuration: string;
}

/**
 * Pillar-specific overrides for Wilderness/Empire variants
 */
export interface ActivityCapsulePillarConfig {
  layout: Partial<ActivityCapsuleLayoutConfig>;
  progress: Partial<ActivityCapsuleProgressConfig>;
  cta: Partial<ActivityCapsuleCTAConfig>;
  animation: Partial<ActivityCapsuleAnimationConfig>;
}

/**
 * Complete ActivityCapsule skin configuration
 */
export interface ActivityCapsuleSkinConfig {
  /** Base configuration */
  layout: ActivityCapsuleLayoutConfig;
  progress: ActivityCapsuleProgressConfig;
  cta: ActivityCapsuleCTAConfig;
  animation: ActivityCapsuleAnimationConfig;
  
  /** Pillar-specific overrides */
  wilderness: ActivityCapsulePillarConfig;
  empire: ActivityCapsulePillarConfig;
  
  /** Accessibility and telemetry flags */
  enableAriaLive: boolean;
  enableTelemetry: boolean;
  enableReducedMotion: boolean;
}

// Zod schemas for runtime validation
export const ActivityCapsuleLayoutConfigSchema = z.object({
  frameBorder: z.string(),
  frameBackground: z.string(),
  frameBorderRadius: z.string(),
  framePadding: z.string(),
  frameMinHeight: z.string(),
  frameBoxShadow: z.string(),
  slotGridColumns: z.number().min(1).max(8),
  slotGap: z.string(),
  slotSize: z.string(),
  slotBorderRadius: z.string(),
  slotBorder: z.string(),
  slotBackground: z.string(),
  mobileSlotColumns: z.number().min(1).max(4),
  compactSlotSize: z.string(),
});

export const ActivityCapsuleProgressConfigSchema = z.object({
  progressBackground: z.string(),
  progressFill: z.string(),
  progressBorder: z.string(),
  progressHeight: z.string(),
  progressBorderRadius: z.string(),
  progressTransition: z.string(),
  liquidGoldGradient: z.string(),
  liquidGoldGlow: z.string(),
  liquidGoldShimmer: z.boolean(),
  shimmerAnimationDuration: z.string(),
  timerFont: z.string(),
  timerColor: z.string(),
  timerFontSize: z.string(),
});

export const ActivityCapsuleCTAConfigSchema = z.object({
  ctaBackground: z.string(),
  ctaBorderColor: z.string(),
  ctaTextColor: z.string(),
  ctaBorderRadius: z.string(),
  ctaPadding: z.string(),
  ctaFontSize: z.string(),
  ctaFontWeight: z.string(),
  ctaHoverBackground: z.string(),
  ctaHoverBorderColor: z.string(),
  ctaActiveScale: z.number().min(0.8).max(1.2),
  ctaTransition: z.string(),
  ctaDisabledBackground: z.string(),
  ctaDisabledTextColor: z.string(),
  ctaDisabledOpacity: z.number().min(0).max(1),
});

export const ActivityCapsuleAnimationConfigSchema = z.object({
  entryAnimation: z.enum(['fade', 'slide-up', 'scale', 'none']),
  entryDuration: z.string(),
  entryEasing: z.string(),
  progressPulseEnabled: z.boolean(),
  progressPulseIntensity: z.number().min(0).max(1),
  progressPulseDuration: z.string(),
  slotHoverScale: z.number().min(0.9).max(1.2),
  slotHoverGlow: z.string(),
  slotHoverTransition: z.string(),
  collectFeedbackAnimation: z.enum(['bounce', 'flash', 'ripple', 'none']),
  collectFeedbackDuration: z.string(),
});

export const ActivityCapsulePillarConfigSchema = z.object({
  layout: ActivityCapsuleLayoutConfigSchema.partial(),
  progress: ActivityCapsuleProgressConfigSchema.partial(),
  cta: ActivityCapsuleCTAConfigSchema.partial(),
  animation: ActivityCapsuleAnimationConfigSchema.partial(),
});

export const ActivityCapsuleSkinConfigSchema = z.object({
  layout: ActivityCapsuleLayoutConfigSchema,
  progress: ActivityCapsuleProgressConfigSchema,
  cta: ActivityCapsuleCTAConfigSchema,
  animation: ActivityCapsuleAnimationConfigSchema,
  wilderness: ActivityCapsulePillarConfigSchema,
  empire: ActivityCapsulePillarConfigSchema,
  enableAriaLive: z.boolean(),
  enableTelemetry: z.boolean(),
  enableReducedMotion: z.boolean(),
});

/**
 * Default ActivityCapsule skin configuration
 * Follows Wanderlust art direction with Wilderness/Empire pillars
 */
export const DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG: ActivityCapsuleSkinConfig = {
  layout: {
    frameBorder: 'rgba(71, 85, 105, 0.4)',
    frameBackground: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
    frameBorderRadius: '12px',
    framePadding: '16px',
    frameMinHeight: '80px',
    frameBoxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(71, 85, 105, 0.2)',
    slotGridColumns: 3,
    slotGap: '8px',
    slotSize: '48px',
    slotBorderRadius: '6px',
    slotBorder: '1px solid rgba(71, 85, 105, 0.3)',
    slotBackground: 'rgba(30, 41, 59, 0.6)',
    mobileSlotColumns: 2,
    compactSlotSize: '40px',
  },
  progress: {
    progressBackground: 'rgba(15, 23, 42, 0.8)',
    progressFill: 'linear-gradient(90deg, #c8a030 0%, #f4e4c1 50%, #c8a030 100%)',
    progressBorder: '1px solid rgba(200, 160, 48, 0.4)',
    progressHeight: '4px',
    progressBorderRadius: '2px',
    progressTransition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    liquidGoldGradient: 'linear-gradient(90deg, #c8a030, #f4e4c1, #d4af37, #f4e4c1)',
    liquidGoldGlow: '0 0 12px rgba(200, 160, 48, 0.6)',
    liquidGoldShimmer: true,
    shimmerAnimationDuration: '3s',
    timerFont: 'Cinzel, serif',
    timerColor: '#f4e4c1',
    timerFontSize: '11px',
  },
  cta: {
    ctaBackground: 'linear-gradient(135deg, #c8a030 0%, #d4af37 100%)',
    ctaBorderColor: '#f4e4c1',
    ctaTextColor: '#0f172a',
    ctaBorderRadius: '6px',
    ctaPadding: '6px 12px',
    ctaFontSize: '11px',
    ctaFontWeight: '600',
    ctaHoverBackground: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 100%)',
    ctaHoverBorderColor: '#f4e4c1',
    ctaActiveScale: 0.95,
    ctaTransition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ctaDisabledBackground: 'rgba(71, 85, 105, 0.3)',
    ctaDisabledTextColor: 'rgba(148, 163, 184, 0.6)',
    ctaDisabledOpacity: 0.6,
  },
  animation: {
    entryAnimation: 'fade',
    entryDuration: '0.3s',
    entryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    progressPulseEnabled: true,
    progressPulseIntensity: 0.3,
    progressPulseDuration: '2s',
    slotHoverScale: 1.05,
    slotHoverGlow: '0 0 16px rgba(71, 85, 105, 0.4)',
    slotHoverTransition: 'transform 0.2s ease, box-shadow 0.2s ease',
    collectFeedbackAnimation: 'bounce',
    collectFeedbackDuration: '0.6s',
  },
  wilderness: {
    // Wilderness: natural, organic, lighter materials
    layout: {
      frameBorder: 'rgba(44, 116, 66, 0.4)',
      frameBackground: 'linear-gradient(135deg, rgba(6, 78, 59, 0.92) 0%, rgba(20, 83, 45, 0.95) 100%)',
      slotBackground: 'rgba(6, 78, 59, 0.5)',
    },
    progress: {
      progressFill: 'linear-gradient(90deg, #2d9a55 0%, #44c470 50%, #2d9a55 100%)',
      liquidGoldGradient: 'linear-gradient(90deg, #2d9a55, #44c470, #1f6e3c, #44c470)',
      liquidGoldGlow: '0 0 12px rgba(45, 154, 85, 0.6)',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #2d9a55 0%, #1f6e3c 100%)',
      ctaBorderColor: '#44c470',
      ctaHoverBackground: 'linear-gradient(135deg, #44c470 0%, #2d9a55 100%)',
    },
    animation: {
      entryAnimation: 'slide-up',
      progressPulseIntensity: 0.4,
      slotHoverGlow: '0 0 16px rgba(45, 154, 85, 0.4)',
    },
  },
  empire: {
    // Empire: monumental, heavy, bronze/basalt materials
    layout: {
      frameBorder: 'rgba(205, 127, 50, 0.5)',
      frameBackground: 'linear-gradient(135deg, rgba(38, 38, 38, 0.96) 0%, rgba(55, 48, 38, 0.98) 100%)',
      slotBackground: 'rgba(38, 38, 38, 0.6)',
    },
    progress: {
      progressFill: 'linear-gradient(90deg, #c06030 0%, #d88050 50%, #c06030 100%)',
      liquidGoldGradient: 'linear-gradient(90deg, #c06030, #d88050, #9a461a, #d88050)',
      liquidGoldGlow: '0 0 16px rgba(192, 96, 48, 0.7)',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #c06030 0%, #9a461a 100%)',
      ctaBorderColor: '#d88050',
      ctaHoverBackground: 'linear-gradient(135deg, #d88050 0%, #c06030 100%)',
    },
    animation: {
      entryAnimation: 'scale',
      progressPulseIntensity: 0.5,
      slotHoverGlow: '0 0 20px rgba(192, 96, 48, 0.5)',
      collectFeedbackAnimation: 'flash',
    },
  },
  enableAriaLive: true,
  enableTelemetry: true,
  enableReducedMotion: false,
};

/**
 * Helper function to get pillar-specific ActivityCapsule configuration
 */
export function getActivityCapsuleSkinConfig(
  pillar?: StyleLabPillar,
  overrides?: Partial<ActivityCapsuleSkinConfig>,
): ActivityCapsuleSkinConfig {
  const pillarOverrides = pillar
    ? {
        layout: pillar === 'wilderness' ? DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.wilderness.layout : DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.empire.layout,
        progress: pillar === 'wilderness' ? DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.wilderness.progress : DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.empire.progress,
        cta: pillar === 'wilderness' ? DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.wilderness.cta : DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.empire.cta,
        animation: pillar === 'wilderness' ? DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.wilderness.animation : DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.empire.animation,
      }
    : undefined;

  const baseConfig = mergeActivityCapsuleConfig(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG, pillarOverrides);
  return mergeActivityCapsuleConfig(baseConfig, overrides);
}

const RESIDENT_SLOT_RACK_SIGNATURE_ACTIVITY_CAPSULE = mergeActivityCapsuleConfig(
  DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG,
  {
    layout: {
      frameBorder: '1px solid rgba(252, 232, 144, 0.28)',
      frameBackground: 'linear-gradient(165deg, rgba(5,3,2,0.98) 0%, rgba(12,8,4,0.86) 100%)',
      frameBorderRadius: '28px',
      framePadding: '24px 28px',
      frameMinHeight: '120px',
      frameBoxShadow: '0 18px 60px rgba(0,0,0,0.65), inset 0 0 60px rgba(252, 232, 144, 0.08)',
      slotGridColumns: 4,
      slotGap: '12px',
      slotSize: '56px',
      slotBorderRadius: '50%',
      slotBorder: '1px solid rgba(252, 232, 144, 0.45)',
      slotBackground: 'radial-gradient(circle at 35% 30%, rgba(33,20,9,0.78), rgba(5,3,2,0.95))',
      mobileSlotColumns: 2,
      compactSlotSize: '44px',
    },
    progress: {
      progressBackground: 'rgba(5,3,2,0.78)',
      progressFill: 'linear-gradient(90deg, #fcefb4 0%, #f7d58c 40%, #b97810 100%)',
      progressBorder: '1px solid rgba(252, 232, 144, 0.35)',
      progressHeight: '5px',
      progressBorderRadius: '999px',
      progressTransition: 'width 0.35s cubic-bezier(0.25, 0.8, 0.5, 1)',
      liquidGoldGradient: 'linear-gradient(90deg, #fff4ce, #f7d58c, #b97810, #fcefb4)',
      liquidGoldGlow: '0 0 22px rgba(252, 232, 144, 0.65)',
      timerFont: 'Cinzel, serif',
      timerColor: '#fcefb4',
      timerFontSize: '12px',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #f2d492 0%, #b7781f 100%)',
      ctaBorderColor: '#fcefb4',
      ctaTextColor: '#1c0f05',
      ctaBorderRadius: '999px',
      ctaPadding: '8px 18px',
      ctaFontSize: '12px',
      ctaFontWeight: '700',
      ctaHoverBackground: 'linear-gradient(135deg, #ffe6b6 0%, #cf8f33 100%)',
      ctaHoverBorderColor: '#fff2c4',
      ctaActiveScale: 0.97,
      ctaTransition: 'all 0.22s cubic-bezier(0.32, 0, 0.33, 1)',
      ctaDisabledBackground: 'rgba(44, 44, 44, 0.65)',
      ctaDisabledTextColor: 'rgba(255, 255, 255, 0.45)',
      ctaDisabledOpacity: 0.6,
    },
    animation: {
      entryAnimation: 'none',
      progressPulseEnabled: true,
      progressPulseIntensity: 0.45,
      progressPulseDuration: '1.8s',
      slotHoverScale: 1.08,
      slotHoverGlow: '0 0 32px rgba(255, 208, 128, 0.55)',
      slotHoverTransition: 'transform 0.22s ease, box-shadow 0.22s ease',
      collectFeedbackAnimation: 'ripple',
      collectFeedbackDuration: '0.8s',
    },
  },
);

/**
 * Material Language override (2026-07-19) — POI Detail harmonization proof.
 * Uses this component's OWN override mechanism (no component code touched).
 * Frame/slot reuse the obsidian+bronze family already validated on the
 * Observatory wells (WellBronzeBezel) and the roster card (GOLD_FILET_SOFT):
 * dark obsidian floor, bronze-gold hairline border, circular bronze slots.
 * Progress = AMBER, not gold: per the semantic material matrix, this capsule
 * tracks elapsedSeconds/totalDurationSeconds toward completion — a TIMER, the
 * "tension/countdown" bucket (amber/ember), not the "progress/knowledge"
 * bucket (molten gold) that XP/survey bars use. CTA (Collect) IS a reward
 * claim, so it stays gold — same reasoning as the reward plaque.
 */
const MATERIC_LAB_ACTIVITY_CAPSULE = mergeActivityCapsuleConfig(
  DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG,
  {
    layout: {
      frameBorder: 'rgba(198, 150, 54, 0.4)',
      frameBackground: 'linear-gradient(165deg, #0b1620 0%, #060f16 100%)',
      frameBorderRadius: '10px',
      frameBoxShadow: 'inset 0 1px 0 rgba(224,178,66,0.12), 0 8px 24px rgba(0,0,0,0.45)',
      slotBorderRadius: '50%',
      slotBorder: '1px solid rgba(198, 150, 54, 0.45)',
      slotBackground: 'radial-gradient(circle at 35% 30%, rgba(20,10,4,0.85), rgba(4,2,1,0.95))',
    },
    progress: {
      progressBackground: 'linear-gradient(180deg, #05101c, #02070f)',
      progressBorder: '1px solid rgba(60,110,150,0.12)',
      progressFill: 'linear-gradient(90deg, #8a5410 0%, #c9852e 55%, #ffd98a 100%)',
      liquidGoldGradient: 'linear-gradient(90deg, #8a5410, #c9852e, #ffd98a, #c9852e)',
      liquidGoldGlow: '0 0 12px rgba(255,190,90,0.5)',
      timerColor: '#f0cf6a',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #f2d485 0%, #9c6c22 100%)',
      ctaBorderColor: '#f0cf6a',
      ctaTextColor: '#1c0f05',
      ctaHoverBackground: 'linear-gradient(135deg, #ffe6b6 0%, #d3a63e 100%)',
      ctaHoverBorderColor: '#fff2c4',
    },
    animation: {
      slotHoverGlow: '0 0 16px rgba(255,190,90,0.4)',
    },
  },
);

export const ACTIVITY_CAPSULE_SKIN_OVERRIDES: Record<string, ActivityCapsuleSkinConfig> = {
  resident_slotrack_signature: RESIDENT_SLOT_RACK_SIGNATURE_ACTIVITY_CAPSULE,
  materic_lab: MATERIC_LAB_ACTIVITY_CAPSULE,
};

export function getActivityCapsuleSkinOverrideById(
  overrideId: string,
  overrides?: Partial<ActivityCapsuleSkinConfig>,
): ActivityCapsuleSkinConfig | null {
  const baseOverride = ACTIVITY_CAPSULE_SKIN_OVERRIDES[overrideId];
  if (!baseOverride) return null;
  return mergeActivityCapsuleConfig(baseOverride, overrides);
}

/**
 * Type guards and validators
 */
export function isValidActivityCapsuleSkinConfig(config: unknown): config is ActivityCapsuleSkinConfig {
  return ActivityCapsuleSkinConfigSchema.safeParse(config).success;
}

export type ActivityCapsuleSkinConfigType = z.infer<typeof ActivityCapsuleSkinConfigSchema>;
