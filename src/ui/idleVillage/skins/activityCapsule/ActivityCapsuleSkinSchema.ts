/**
 * WL-STY-010: ActivityCapsule Skin Schema (TS-Series Integration)
 * 
 * Advanced TS-Series schema for ActivityCapsule component with full
 * integration to the TS-Series skin system. Provides comprehensive
 * theming, motion levels, and pillar-specific customization.
 * 
 * Dependencies: TS-001 (SkinSchema), TS-002 (SkinSlot), Style Lab tokens
 * Integration: useSkinSystem, SkinRegistry, telemetry, persistence
 */

import { z } from 'zod';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult
} from '../SkinSchema';

// ============================================================================
// ACTIVITY CAPSULE SKIN CONFIGURATION TYPES
// ============================================================================

/**
 * Frame and layout configuration for ActivityCapsule
 */
export interface ActivityCapsuleFrameConfig {
  /** Frame appearance */
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
  
  /** Frame decorations */
  frameDecoration?: string;
  frameGlow?: string;
  frameInnerShadow?: string;
}

/**
 * Progress bar and timer configuration
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
  shimmerIntensity: number;
  
  /** Timer display */
  timerFont: string;
  timerColor: string;
  timerFontSize: string;
  timerFontWeight: string;
  
  /** Progress animations */
  progressPulseEnabled: boolean;
  progressPulseIntensity: number;
  progressPulseDuration: string;
  progressPulseColor?: string;
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
  ctaFontFamily: string;
  
  /** Hover/active states */
  ctaHoverBackground: string;
  ctaHoverBorderColor: string;
  ctaHoverTextColor?: string;
  ctaActiveScale: number;
  ctaTransition: string;
  
  /** Disabled state */
  ctaDisabledBackground: string;
  ctaDisabledTextColor: string;
  ctaDisabledOpacity: number;
  ctaDisabledBorderColor?: string;
  
  /** Icon configuration */
  ctaIcon?: string;
  ctaIconSize?: string;
  ctaIconColor?: string;
}

/**
 * Animation and motion configuration
 */
export interface ActivityCapsuleAnimationConfig {
  /** Entry animations */
  entryAnimation: 'fade' | 'slide-up' | 'scale' | 'bounce' | 'none';
  entryDuration: string;
  entryEasing: string;
  entryDelay?: string;
  
  /** Slot hover effects */
  slotHoverScale: number;
  slotHoverGlow: string;
  slotHoverTransition: string;
  slotHoverRotate?: number;
  
  /** Progress animations */
  progressAnimationEnabled: boolean;
  progressAnimationType: 'smooth' | 'stepped' | 'elastic';
  progressAnimationDuration: string;
  
  /** Collect feedback */
  collectFeedbackAnimation: 'bounce' | 'flash' | 'ripple' | 'confetti' | 'none';
  collectFeedbackDuration: string;
  collectFeedbackColor?: string;
  
  /** Motion level adaptations */
  motionLevel: MotionLevel;
  reducedMotionConfig: Partial<ActivityCapsuleAnimationConfig>;
}

/**
 * Typography configuration
 */
export interface ActivityCapsuleTypographyConfig {
  /** Title typography */
  titleFont: string;
  titleFontSize: string;
  titleFontWeight: string;
  titleColor: string;
  titleLineHeight: string;
  titleLetterSpacing?: string;
  
  /** Subtitle typography */
  subtitleFont: string;
  subtitleFontSize: string;
  subtitleFontWeight: string;
  subtitleColor: string;
  subtitleLineHeight: string;
  
  /** Helper text typography */
  helperFont: string;
  helperFontSize: string;
  helperFontWeight: string;
  helperColor: string;
  helperOpacity: number;
  
  /** Slot typography */
  slotInitialsFont: string;
  slotInitialsFontSize: string;
  slotInitialsFontWeight: string;
  slotInitialsColor: string;
}

/**
 * Status-specific configurations
 */
export interface ActivityCapsuleStatusConfig {
  /** Idle state */
  idle: {
    frameOpacity: number;
    progressOpacity: number;
    ctaOpacity: number;
    statusColor?: string;
    statusIcon?: string;
  };
  
  /** In-progress state */
  inProgress: {
    frameGlow: string;
    progressGlow: string;
    statusColor: string;
    statusIcon?: string;
    pulseEnabled: boolean;
  };
  
  /** Completed state */
  completed: {
    frameGlow: string;
    progressGlow: string;
    statusColor: string;
    statusIcon?: string;
    celebrationEnabled: boolean;
  };
  
  /** Blocked state */
  blocked: {
    frameOpacity: number;
    progressOpacity: number;
    ctaOpacity: number;
    statusColor: string;
    statusIcon?: string;
    blockedPattern?: string;
  };
}

/**
 * Accessibility and configuration flags
 */
export interface ActivityCapsuleAccessibilityConfig {
  /** Screen reader support */
  enableAriaLive: boolean;
  enableAriaLabels: boolean;
  enableAriaDescribedBy: boolean;
  
  /** Keyboard navigation */
  enableKeyboardNavigation: boolean;
  enableFocusIndicators: boolean;
  focusIndicatorStyle: string;
  
  /** High contrast mode */
  highContrastMode: boolean;
  highContrastColors: Partial<ActivityCapsuleFrameConfig>;
  
  /** Reduced motion */
  enableReducedMotion: boolean;
  reducedMotionFallbacks: Partial<ActivityCapsuleAnimationConfig>;
}

/**
 * Complete ActivityCapsule TS-Series skin configuration
 */
export interface ActivityCapsuleSkinConfig {
  /** Core configuration sections */
  frame: ActivityCapsuleFrameConfig;
  progress: ActivityCapsuleProgressConfig;
  cta: ActivityCapsuleCTAConfig;
  animation: ActivityCapsuleAnimationConfig;
  typography: ActivityCapsuleTypographyConfig;
  status: ActivityCapsuleStatusConfig;
  accessibility: ActivityCapsuleAccessibilityConfig;
  
  /** Pillar-specific overrides */
  wilderness: Partial<ActivityCapsuleSkinConfig>;
  empire: Partial<ActivityCapsuleSkinConfig>;
  frontier: Partial<ActivityCapsuleSkinConfig>;
  
  /** TS-Series integration */
  motionLevel: MotionLevel;
  pillar: StyleLabPillar;
  presetId: SkinPresetId;
  
  /** Feature flags */
  enableTelemetry: boolean;
  enableHotReload: boolean;
  enableValidation: boolean;
  enableDevTools: boolean;
  
  /** Version and compatibility */
  version: string;
  compatibility: string[];
  lastModified: number;
}

// ============================================================================
// ZOD SCHEMAS FOR RUNTIME VALIDATION
// ============================================================================

export const ActivityCapsuleFrameConfigSchema = z.object({
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
  frameDecoration: z.string().optional(),
  frameGlow: z.string().optional(),
  frameInnerShadow: z.string().optional(),
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
  shimmerIntensity: z.number().min(0).max(1),
  timerFont: z.string(),
  timerColor: z.string(),
  timerFontSize: z.string(),
  timerFontWeight: z.string(),
  progressPulseEnabled: z.boolean(),
  progressPulseIntensity: z.number().min(0).max(1),
  progressPulseDuration: z.string(),
  progressPulseColor: z.string().optional(),
});

export const ActivityCapsuleCTAConfigSchema = z.object({
  ctaBackground: z.string(),
  ctaBorderColor: z.string(),
  ctaTextColor: z.string(),
  ctaBorderRadius: z.string(),
  ctaPadding: z.string(),
  ctaFontSize: z.string(),
  ctaFontWeight: z.string(),
  ctaFontFamily: z.string(),
  ctaHoverBackground: z.string(),
  ctaHoverBorderColor: z.string(),
  ctaHoverTextColor: z.string().optional(),
  ctaActiveScale: z.number().min(0.8).max(1.2),
  ctaTransition: z.string(),
  ctaDisabledBackground: z.string(),
  ctaDisabledTextColor: z.string(),
  ctaDisabledOpacity: z.number().min(0).max(1),
  ctaDisabledBorderColor: z.string().optional(),
  ctaIcon: z.string().optional(),
  ctaIconSize: z.string().optional(),
  ctaIconColor: z.string().optional(),
});

export const ActivityCapsuleAnimationConfigSchema = z.object({
  entryAnimation: z.enum(['fade', 'slide-up', 'scale', 'bounce', 'none']),
  entryDuration: z.string(),
  entryEasing: z.string(),
  entryDelay: z.string().optional(),
  slotHoverScale: z.number().min(0.9).max(1.2),
  slotHoverGlow: z.string(),
  slotHoverTransition: z.string(),
  slotHoverRotate: z.number().optional(),
  progressAnimationEnabled: z.boolean(),
  progressAnimationType: z.enum(['smooth', 'stepped', 'elastic']),
  progressAnimationDuration: z.string(),
  collectFeedbackAnimation: z.enum(['bounce', 'flash', 'ripple', 'confetti', 'none']),
  collectFeedbackDuration: z.string(),
  collectFeedbackColor: z.string().optional(),
  motionLevel: z.enum(['minimal', 'reduced', 'full']),
  reducedMotionConfig: z.object({}).passthrough().optional(),
});

export const ActivityCapsuleTypographyConfigSchema = z.object({
  titleFont: z.string(),
  titleFontSize: z.string(),
  titleFontWeight: z.string(),
  titleColor: z.string(),
  titleLineHeight: z.string(),
  titleLetterSpacing: z.string().optional(),
  subtitleFont: z.string(),
  subtitleFontSize: z.string(),
  subtitleFontWeight: z.string(),
  subtitleColor: z.string(),
  subtitleLineHeight: z.string(),
  helperFont: z.string(),
  helperFontSize: z.string(),
  helperFontWeight: z.string(),
  helperColor: z.string(),
  helperOpacity: z.number().min(0).max(1),
  slotInitialsFont: z.string(),
  slotInitialsFontSize: z.string(),
  slotInitialsFontWeight: z.string(),
  slotInitialsColor: z.string(),
});

export const ActivityCapsuleStatusConfigSchema = z.object({
  idle: z.object({
    frameOpacity: z.number().min(0).max(1),
    progressOpacity: z.number().min(0).max(1),
    ctaOpacity: z.number().min(0).max(1),
    statusColor: z.string().optional(),
    statusIcon: z.string().optional(),
  }),
  inProgress: z.object({
    frameGlow: z.string(),
    progressGlow: z.string(),
    statusColor: z.string(),
    statusIcon: z.string().optional(),
    pulseEnabled: z.boolean(),
  }),
  completed: z.object({
    frameGlow: z.string(),
    progressGlow: z.string(),
    statusColor: z.string(),
    statusIcon: z.string().optional(),
    celebrationEnabled: z.boolean(),
  }),
  blocked: z.object({
    frameOpacity: z.number().min(0).max(1),
    progressOpacity: z.number().min(0).max(1),
    ctaOpacity: z.number().min(0).max(1),
    statusColor: z.string(),
    statusIcon: z.string().optional(),
    blockedPattern: z.string().optional(),
  }),
});

export const ActivityCapsuleAccessibilityConfigSchema = z.object({
  enableAriaLive: z.boolean(),
  enableAriaLabels: z.boolean(),
  enableAriaDescribedBy: z.boolean(),
  enableKeyboardNavigation: z.boolean(),
  enableFocusIndicators: z.boolean(),
  focusIndicatorStyle: z.string(),
  highContrastMode: z.boolean(),
  highContrastColors: ActivityCapsuleFrameConfigSchema.partial().optional(),
  enableReducedMotion: z.boolean(),
  reducedMotionFallbacks: ActivityCapsuleAnimationConfigSchema.partial().optional(),
});

export const ActivityCapsuleSkinConfigSchema = z.object({
  frame: ActivityCapsuleFrameConfigSchema,
  progress: ActivityCapsuleProgressConfigSchema,
  cta: ActivityCapsuleCTAConfigSchema,
  animation: ActivityCapsuleAnimationConfigSchema,
  typography: ActivityCapsuleTypographyConfigSchema,
  status: ActivityCapsuleStatusConfigSchema,
  accessibility: ActivityCapsuleAccessibilityConfigSchema,
  wilderness: z.object({}).passthrough().optional(),
  empire: z.object({}).passthrough().optional(),
  frontier: z.object({}).passthrough().optional(),
  motionLevel: z.enum(['minimal', 'reduced', 'full']),
  pillar: z.enum(['frontier', 'wilderness', 'empire']),
  presetId: z.enum(['minimal-frontier', 'minimal-wilderness', 'minimal-empire', 'wanderlust', 'arcane-tech', 'gilded-observatory']),
  enableTelemetry: z.boolean(),
  enableHotReload: z.boolean(),
  enableValidation: z.boolean(),
  enableDevTools: z.boolean(),
  version: z.string(),
  compatibility: z.array(z.string()),
  lastModified: z.number(),
});

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default ActivityCapsule TS-Series skin configuration
 * Integrates with existing ActivityCapsule design while adding TS-Series features
 */
export const DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG: ActivityCapsuleSkinConfig = {
  frame: {
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
    frameDecoration: 'none',
    frameGlow: 'none',
    frameInnerShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
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
    shimmerIntensity: 0.7,
    timerFont: 'Cinzel, serif',
    timerColor: '#f4e4c1',
    timerFontSize: '11px',
    timerFontWeight: '600',
    progressPulseEnabled: true,
    progressPulseIntensity: 0.3,
    progressPulseDuration: '2s',
    progressPulseColor: 'rgba(200, 160, 48, 0.4)',
  },
  
  cta: {
    ctaBackground: 'linear-gradient(135deg, #c8a030 0%, #d4af37 100%)',
    ctaBorderColor: '#f4e4c1',
    ctaTextColor: '#0f172a',
    ctaBorderRadius: '6px',
    ctaPadding: '6px 12px',
    ctaFontSize: '11px',
    ctaFontWeight: '600',
    ctaFontFamily: 'inherit',
    ctaHoverBackground: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 100%)',
    ctaHoverBorderColor: '#f4e4c1',
    ctaActiveScale: 0.95,
    ctaTransition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ctaDisabledBackground: 'rgba(71, 85, 105, 0.3)',
    ctaDisabledTextColor: 'rgba(148, 163, 184, 0.6)',
    ctaDisabledOpacity: 0.6,
    ctaDisabledBorderColor: 'transparent',
    ctaIcon: '✓',
    ctaIconSize: '10px',
    ctaIconColor: '#0f172a',
  },
  
  animation: {
    entryAnimation: 'fade',
    entryDuration: '0.3s',
    entryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    entryDelay: '0s',
    slotHoverScale: 1.05,
    slotHoverGlow: '0 0 16px rgba(71, 85, 105, 0.4)',
    slotHoverTransition: 'transform 0.2s ease, box-shadow 0.2s ease',
    slotHoverRotate: 0,
    progressAnimationEnabled: true,
    progressAnimationType: 'smooth',
    progressAnimationDuration: '0.3s',
    collectFeedbackAnimation: 'bounce',
    collectFeedbackDuration: '0.6s',
    collectFeedbackColor: '#c8a030',
    motionLevel: 'full',
    reducedMotionConfig: {
      entryAnimation: 'fade',
      slotHoverScale: 1,
      collectFeedbackAnimation: 'none',
      progressPulseEnabled: false,
    },
  },
  
  typography: {
    titleFont: 'inherit',
    titleFontSize: '14px',
    titleFontWeight: '600',
    titleColor: 'var(--text-primary)',
    titleLineHeight: '1.4',
    titleLetterSpacing: '0.01em',
    subtitleFont: 'inherit',
    subtitleFontSize: '12px',
    subtitleFontWeight: '400',
    subtitleColor: 'var(--text-secondary)',
    subtitleLineHeight: '1.3',
    helperFont: 'inherit',
    helperFontSize: '11px',
    helperFontWeight: '400',
    helperColor: 'var(--text-tertiary)',
    helperOpacity: 0.7,
    slotInitialsFont: 'inherit',
    slotInitialsFontSize: '10px',
    slotInitialsFontWeight: '600',
    slotInitialsColor: 'var(--text-primary)',
  },
  
  status: {
    idle: {
      frameOpacity: 1,
      progressOpacity: 0.8,
      ctaOpacity: 0.9,
      statusColor: 'var(--text-secondary)',
      statusIcon: '⏸',
    },
    inProgress: {
      frameGlow: '0 0 20px rgba(200, 160, 48, 0.3)',
      progressGlow: '0 0 16px rgba(200, 160, 48, 0.6)',
      statusColor: '#c8a030',
      statusIcon: '⏳',
      pulseEnabled: true,
    },
    completed: {
      frameGlow: '0 0 24px rgba(34, 197, 94, 0.4)',
      progressGlow: '0 0 20px rgba(34, 197, 94, 0.7)',
      statusColor: '#22c55e',
      statusIcon: '✓',
      celebrationEnabled: true,
    },
    blocked: {
      frameOpacity: 0.7,
      progressOpacity: 0.5,
      ctaOpacity: 0.6,
      statusColor: '#ef4444',
      statusIcon: '🚫',
      blockedPattern: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239, 68, 68, 0.1) 2px, rgba(239, 68, 68, 0.1) 4px)',
    },
  },
  
  accessibility: {
    enableAriaLive: true,
    enableAriaLabels: true,
    enableAriaDescribedBy: true,
    enableKeyboardNavigation: true,
    enableFocusIndicators: true,
    focusIndicatorStyle: '2px solid #c8a030',
    highContrastMode: false,
    highContrastColors: undefined,
    enableReducedMotion: false,
    reducedMotionFallbacks: {
      entryAnimation: 'fade',
      slotHoverScale: 1,
      collectFeedbackAnimation: 'none',
    },
  },
  
  wilderness: {
    frame: {
      frameBorder: 'rgba(44, 116, 66, 0.4)',
      frameBackground: 'linear-gradient(135deg, rgba(6, 78, 59, 0.92) 0%, rgba(20, 83, 45, 0.95) 100%)',
      slotBackground: 'rgba(6, 78, 59, 0.5)',
      frameGlow: '0 0 16px rgba(45, 154, 85, 0.2)',
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
    status: {
      inProgress: {
        frameGlow: '0 0 20px rgba(45, 154, 85, 0.3)',
        progressGlow: '0 0 16px rgba(45, 154, 85, 0.6)',
        statusColor: '#2d9a55',
      },
      completed: {
        frameGlow: '0 0 24px rgba(34, 197, 94, 0.4)',
        progressGlow: '0 0 20px rgba(34, 197, 94, 0.7)',
        statusColor: '#22c55e',
      },
    },
  },
  
  empire: {
    frame: {
      frameBorder: 'rgba(205, 127, 50, 0.5)',
      frameBackground: 'linear-gradient(135deg, rgba(38, 38, 38, 0.96) 0%, rgba(55, 48, 38, 0.98) 100%)',
      slotBackground: 'rgba(38, 38, 38, 0.6)',
      frameGlow: '0 0 20px rgba(192, 96, 48, 0.3)',
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
    status: {
      inProgress: {
        frameGlow: '0 0 24px rgba(192, 96, 48, 0.4)',
        progressGlow: '0 0 20px rgba(192, 96, 48, 0.7)',
        statusColor: '#c06030',
      },
      completed: {
        frameGlow: '0 0 28px rgba(212, 175, 55, 0.5)',
        progressGlow: '0 0 24px rgba(212, 175, 55, 0.8)',
        statusColor: '#d4af37',
      },
    },
  },
  
  frontier: {
    frame: {
      frameBorder: 'rgba(59, 130, 246, 0.4)',
      frameBackground: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 58, 138, 0.96) 100%)',
      slotBackground: 'rgba(30, 58, 138, 0.5)',
      frameGlow: '0 0 16px rgba(59, 130, 246, 0.2)',
    },
    progress: {
      progressFill: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%)',
      liquidGoldGradient: 'linear-gradient(90deg, #3b82f6, #60a5fa, #2563eb, #60a5fa)',
      liquidGoldGlow: '0 0 12px rgba(59, 130, 246, 0.6)',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      ctaBorderColor: '#60a5fa',
      ctaHoverBackground: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    },
    status: {
      inProgress: {
        frameGlow: '0 0 20px rgba(59, 130, 246, 0.3)',
        progressGlow: '0 0 16px rgba(59, 130, 246, 0.6)',
        statusColor: '#3b82f6',
      },
      completed: {
        frameGlow: '0 0 24px rgba(34, 197, 94, 0.4)',
        progressGlow: '0 0 20px rgba(34, 197, 94, 0.7)',
        statusColor: '#22c55e',
      },
    },
  },
  
  motionLevel: 'full',
  pillar: 'frontier',
  presetId: 'minimal-frontier',
  enableTelemetry: true,
  enableHotReload: true,
  enableValidation: true,
  enableDevTools: false,
  version: '1.0.0',
  compatibility: ['1.0.0'],
  lastModified: Date.now(),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deep merge helper for ActivityCapsule skin configuration
 */
export function mergeActivityCapsuleSkinConfig(
  base: ActivityCapsuleSkinConfig,
  overrides?: Partial<ActivityCapsuleSkinConfig>
): ActivityCapsuleSkinConfig {
  if (!overrides) return base;
  
  return {
    frame: { ...base.frame, ...(overrides.frame ?? {}) },
    progress: { ...base.progress, ...(overrides.progress ?? {}) },
    cta: { ...base.cta, ...(overrides.cta ?? {}) },
    animation: { ...base.animation, ...(overrides.animation ?? {}) },
    typography: { ...base.typography, ...(overrides.typography ?? {}) },
    status: { 
      idle: { ...base.status.idle, ...(overrides.status?.idle ?? {}) },
      inProgress: { ...base.status.inProgress, ...(overrides.status?.inProgress ?? {}) },
      completed: { ...base.status.completed, ...(overrides.status?.completed ?? {}) },
      blocked: { ...base.status.blocked, ...(overrides.status?.blocked ?? {}) },
    },
    accessibility: { ...base.accessibility, ...(overrides.accessibility ?? {}) },
    wilderness: { ...base.wilderness, ...(overrides.wilderness ?? {}) },
    empire: { ...base.empire, ...(overrides.empire ?? {}) },
    frontier: { ...base.frontier, ...(overrides.frontier ?? {}) },
    motionLevel: overrides.motionLevel ?? base.motionLevel,
    pillar: overrides.pillar ?? base.pillar,
    presetId: overrides.presetId ?? base.presetId,
    enableTelemetry: overrides.enableTelemetry ?? base.enableTelemetry,
    enableHotReload: overrides.enableHotReload ?? base.enableHotReload,
    enableValidation: overrides.enableValidation ?? base.enableValidation,
    enableDevTools: overrides.enableDevTools ?? base.enableDevTools,
    version: overrides.version ?? base.version,
    compatibility: overrides.compatibility ?? base.compatibility,
    lastModified: overrides.lastModified ?? base.lastModified,
  };
}

/**
 * Get pillar-specific ActivityCapsule configuration
 */
export function getActivityCapsuleSkinConfig(
  pillar?: StyleLabPillar,
  overrides?: Partial<ActivityCapsuleSkinConfig>
): ActivityCapsuleSkinConfig {
  const baseConfig = { ...DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG };
  
  // Apply pillar-specific overrides
  if (pillar && pillar !== 'frontier') {
    const pillarOverrides = baseConfig[pillar];
    if (pillarOverrides) {
      Object.assign(baseConfig, mergeActivityCapsuleSkinConfig(baseConfig, pillarOverrides));
    }
    baseConfig.pillar = pillar;
  }
  
  // Apply custom overrides
  return mergeActivityCapsuleSkinConfig(baseConfig, overrides);
}

/**
 * Validate ActivityCapsule skin configuration
 */
export function validateActivityCapsuleSkinConfig(
  config: unknown
): SkinValidationResult {
  const result = ActivityCapsuleSkinConfigSchema.safeParse(config);
  
  if (result.success) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
  
  return {
    isValid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
    warnings: [],
  };
}

/**
 * Create ActivityCapsule skin binding for TS-Series integration
 */
export function createActivityCapsuleSkinBinding(
  componentId: string,
  config: Partial<ActivityCapsuleSkinConfig>
): ComponentSkinBinding {
  return {
    componentId,
    componentType: 'ActivityCapsule',
    skinPresetId: config.presetId || 'minimal-frontier',
    pillar: config.pillar || 'frontier',
    motionLevel: config.motionLevel || 'full',
    config,
    enabled: true,
    priority: 'normal',
    metadata: {
      version: config.version || '1.0.0',
      lastModified: config.lastModified || Date.now(),
      compatibility: config.compatibility || ['1.0.0'],
    },
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidActivityCapsuleSkinConfig(
  config: unknown
): config is ActivityCapsuleSkinConfig {
  return ActivityCapsuleSkinConfigSchema.safeParse(config).success;
}

export function isActivityCapsuleSkinBinding(
  binding: unknown
): binding is ComponentSkinBinding {
  const candidate = binding as ComponentSkinBinding;
  return (
    candidate &&
    typeof candidate === 'object' &&
    candidate.componentType === 'ActivityCapsule' &&
    typeof candidate.componentId === 'string' &&
    isValidActivityCapsuleSkinConfig(candidate.config)
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type ActivityCapsuleSkinConfigType = z.infer<typeof ActivityCapsuleSkinConfigSchema>;
