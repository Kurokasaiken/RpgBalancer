/**
 * WL-STY-010: ActivityCapsule Skin Presets and Themes (TS-Series Integration)
 * 
 * Comprehensive collection of ActivityCapsule skin presets and themes with
 * full TS-Series integration. Includes minimal, wanderlust, arcane-tech, and
 * gilded-observatory themes with pillar-specific variants and motion levels.
 * 
 * Dependencies: TS-001 (SkinSchema), ActivityCapsuleSkinSchema
 * Integration: Style Lab tokens, motion levels, pillar system
 */

import { 
  ActivityCapsuleSkinConfig,
  DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG,
  mergeActivityCapsuleSkinConfig,
  getActivityCapsuleSkinConfig,
} from './ActivityCapsuleSkinSchema';
import type { 
  StyleLabPillar, 
  SkinPresetId,
  MotionLevel
} from '../SkinSchema';

// ============================================================================
// PRESET CONFIGURATION TYPES
// ============================================================================

export interface ActivityCapsuleSkinPreset {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'themed' | 'experimental' | 'legacy';
  version: string;
  author: string;
  tags: string[];
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  config: Partial<ActivityCapsuleSkinConfig>;
  preview?: {
    thumbnail?: string;
    screenshot?: string;
    demo?: string;
  };
  metadata?: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedLoadTime: number;
    dependencies?: string[];
    compatibility?: string[];
  };
}

export interface ActivityCapsuleSkinTheme {
  id: string;
  name: string;
  description: string;
  presets: Record<SkinPresetId, ActivityCapsuleSkinPreset>;
  baseConfig: Partial<ActivityCapsuleSkinConfig>;
  pillarVariants: Record<StyleLabPillar, Partial<ActivityCapsuleSkinConfig>>;
  motionAdaptations: Record<MotionLevel, Partial<ActivityCapsuleSkinConfig>>;
}

// ============================================================================
// MINIMAL PRESETS
// ============================================================================

export const MINIMAL_FRONTIER_PRESET: ActivityCapsuleSkinPreset = {
  id: 'minimal-frontier',
  name: 'Minimal Frontier',
  description: 'Clean, minimal design with frontier blue accents',
  category: 'minimal',
  version: '1.0.0',
  author: 'TS-Series System',
  tags: ['minimal', 'clean', 'frontier', 'blue'],
  supportedPillars: ['frontier', 'wilderness', 'empire'],
  supportedMotionLevels: ['minimal', 'reduced', 'full'],
  config: {
    frame: {
      frameBorder: 'rgba(59, 130, 246, 0.2)',
      frameBackground: 'rgba(15, 23, 42, 0.95)',
      frameBorderRadius: '8px',
      framePadding: '12px',
      frameMinHeight: '60px',
      frameBoxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      slotGridColumns: 3,
      slotGap: '6px',
      slotSize: '40px',
      slotBorderRadius: '4px',
      slotBorder: '1px solid rgba(59, 130, 246, 0.2)',
      slotBackground: 'rgba(30, 58, 138, 0.4)',
      mobileSlotColumns: 2,
      compactSlotSize: '32px',
    },
    progress: {
      progressBackground: 'rgba(15, 23, 42, 0.6)',
      progressFill: 'rgba(59, 130, 246, 0.8)',
      progressBorder: '1px solid rgba(59, 130, 246, 0.3)',
      progressHeight: '3px',
      progressBorderRadius: '2px',
      progressTransition: 'width 0.2s ease',
      liquidGoldGradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
      liquidGoldGlow: 'none',
      liquidGoldShimmer: false,
      shimmerAnimationDuration: '2s',
      shimmerIntensity: 0.5,
      timerFont: 'system-ui, sans-serif',
      timerColor: '#94a3b8',
      timerFontSize: '10px',
      timerFontWeight: '400',
      progressPulseEnabled: false,
      progressPulseIntensity: 0,
      progressPulseDuration: '2s',
    },
    cta: {
      ctaBackground: 'rgba(59, 130, 246, 0.8)',
      ctaBorderColor: 'rgba(59, 130, 246, 0.6)',
      ctaTextColor: '#ffffff',
      ctaBorderRadius: '4px',
      ctaPadding: '4px 8px',
      ctaFontSize: '10px',
      ctaFontWeight: '500',
      ctaFontFamily: 'system-ui, sans-serif',
      ctaHoverBackground: 'rgba(59, 130, 246, 0.9)',
      ctaHoverBorderColor: 'rgba(59, 130, 246, 0.8)',
      ctaActiveScale: 0.98,
      ctaTransition: 'all 0.15s ease',
      ctaDisabledBackground: 'rgba(71, 85, 105, 0.3)',
      ctaDisabledTextColor: 'rgba(148, 163, 184, 0.5)',
      ctaDisabledOpacity: 0.5,
    },
    animation: {
      entryAnimation: 'fade',
      entryDuration: '0.2s',
      entryEasing: 'ease-out',
      slotHoverScale: 1.02,
      slotHoverGlow: 'none',
      slotHoverTransition: 'transform 0.15s ease',
      progressAnimationEnabled: false,
      progressAnimationType: 'smooth',
      progressAnimationDuration: '0.2s',
      collectFeedbackAnimation: 'none',
      collectFeedbackDuration: '0.3s',
      motionLevel: 'minimal',
      reducedMotionConfig: {
        entryAnimation: 'none',
        slotHoverScale: 1,
        collectFeedbackAnimation: 'none',
        progressPulseEnabled: false,
      },
    },
    typography: {
      titleFont: 'system-ui, sans-serif',
      titleFontSize: '12px',
      titleFontWeight: '500',
      titleColor: '#e2e8f0',
      titleLineHeight: '1.3',
      subtitleFont: 'system-ui, sans-serif',
      subtitleFontSize: '10px',
      subtitleFontWeight: '400',
      subtitleColor: '#94a3b8',
      subtitleLineHeight: '1.2',
      helperFont: 'system-ui, sans-serif',
      helperFontSize: '9px',
      helperFontWeight: '400',
      helperColor: '#64748b',
      helperOpacity: 0.7,
      slotInitialsFont: 'system-ui, sans-serif',
      slotInitialsFontSize: '8px',
      slotInitialsFontWeight: '500',
      slotInitialsColor: '#e2e8f0',
    },
    status: {
      idle: {
        frameOpacity: 0.8,
        progressOpacity: 0.6,
        ctaOpacity: 0.7,
        statusColor: '#64748b',
      },
      inProgress: {
        frameGlow: 'none',
        progressGlow: 'none',
        statusColor: '#3b82f6',
        pulseEnabled: false,
      },
      completed: {
        frameGlow: 'none',
        progressGlow: 'none',
        statusColor: '#10b981',
        celebrationEnabled: false,
      },
      blocked: {
        frameOpacity: 0.6,
        progressOpacity: 0.4,
        ctaOpacity: 0.5,
        statusColor: '#ef4444',
      },
    },
    accessibility: {
      enableAriaLive: false,
      enableAriaLabels: true,
      enableAriaDescribedBy: false,
      enableKeyboardNavigation: true,
      enableFocusIndicators: true,
      focusIndicatorStyle: '1px solid #3b82f6',
      highContrastMode: false,
      enableReducedMotion: true,
      reducedMotionFallbacks: {
        entryAnimation: 'fade',
        slotHoverScale: 1,
        collectFeedbackAnimation: 'none',
      },
    },
  },
  metadata: {
    difficulty: 'beginner',
    estimatedLoadTime: 100,
  },
};

export const MINIMAL_WILDERNESS_PRESET: ActivityCapsuleSkinPreset = {
  ...MINIMAL_FRONTIER_PRESET,
  id: 'minimal-wilderness',
  name: 'Minimal Wilderness',
  description: 'Clean, minimal design with wilderness green accents',
  tags: ['minimal', 'clean', 'wilderness', 'green'],
  config: {
    frame: {
      frameBorder: 'rgba(34, 197, 94, 0.2)',
      frameBackground: 'rgba(6, 78, 59, 0.95)',
      slotBorder: '1px solid rgba(34, 197, 94, 0.2)',
      slotBackground: 'rgba(6, 78, 59, 0.4)',
    },
    progress: {
      progressFill: 'rgba(34, 197, 94, 0.8)',
      progressBorder: '1px solid rgba(34, 197, 94, 0.3)',
      liquidGoldGradient: 'linear-gradient(90deg, #22c55e, #10b981)',
      timerColor: '#86efac',
    },
    cta: {
      ctaBackground: 'rgba(34, 197, 94, 0.8)',
      ctaBorderColor: 'rgba(34, 197, 94, 0.6)',
      ctaHoverBackground: 'rgba(34, 197, 94, 0.9)',
      ctaHoverBorderColor: 'rgba(34, 197, 94, 0.8)',
    },
    status: {
      inProgress: {
        statusColor: '#22c55e',
      },
      completed: {
        statusColor: '#10b981',
      },
    },
  },
};

export const MINIMAL_EMPIRE_PRESET: ActivityCapsuleSkinPreset = {
  ...MINIMAL_FRONTIER_PRESET,
  id: 'minimal-empire',
  name: 'Minimal Empire',
  description: 'Clean, minimal design with empire bronze accents',
  tags: ['minimal', 'clean', 'empire', 'bronze'],
  config: {
    frame: {
      frameBorder: 'rgba(217, 119, 6, 0.2)',
      frameBackground: 'rgba(38, 38, 38, 0.95)',
      slotBorder: '1px solid rgba(217, 119, 6, 0.2)',
      slotBackground: 'rgba(38, 38, 38, 0.4)',
    },
    progress: {
      progressFill: 'rgba(217, 119, 6, 0.8)',
      progressBorder: '1px solid rgba(217, 119, 6, 0.3)',
      liquidGoldGradient: 'linear-gradient(90deg, #d97706, #f59e0b)',
      timerColor: '#fbbf24',
    },
    cta: {
      ctaBackground: 'rgba(217, 119, 6, 0.8)',
      ctaBorderColor: 'rgba(217, 119, 6, 0.6)',
      ctaHoverBackground: 'rgba(217, 119, 6, 0.9)',
      ctaHoverBorderColor: 'rgba(217, 119, 6, 0.8)',
    },
    status: {
      inProgress: {
        statusColor: '#d97706',
      },
      completed: {
        statusColor: '#f59e0b',
      },
    },
  },
};

// ============================================================================
// THEMED PRESETS
// ============================================================================

export const WANDERLUST_PRESET: ActivityCapsuleSkinPreset = {
  id: 'wanderlust',
  name: 'Wanderlust',
  description: 'Adventure-themed design with natural materials and earthy tones',
  category: 'themed',
  version: '1.0.0',
  author: 'TS-Series System',
  tags: ['adventure', 'natural', 'earthy', 'wanderlust'],
  supportedPillars: ['wilderness', 'frontier'],
  supportedMotionLevels: ['reduced', 'full'],
  config: {
    frame: {
      frameBorder: 'rgba(134, 239, 172, 0.4)',
      frameBackground: 'linear-gradient(135deg, rgba(6, 95, 70, 0.92) 0%, rgba(20, 83, 45, 0.95) 100%)',
      frameBorderRadius: '16px',
      framePadding: '20px',
      frameMinHeight: '100px',
      frameBoxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(134, 239, 172, 0.2)',
      frameDecoration: 'linear-gradient(45deg, transparent 30%, rgba(134, 239, 172, 0.1) 50%, transparent 70%)',
      frameGlow: '0 0 24px rgba(134, 239, 172, 0.2)',
      slotGridColumns: 4,
      slotGap: '10px',
      slotSize: '52px',
      slotBorderRadius: '50%',
      slotBorder: '2px solid rgba(134, 239, 172, 0.3)',
      slotBackground: 'radial-gradient(circle at 30% 30%, rgba(134, 239, 172, 0.3), rgba(6, 95, 70, 0.6))',
      mobileSlotColumns: 2,
      compactSlotSize: '44px',
    },
    progress: {
      progressBackground: 'rgba(6, 95, 70, 0.8)',
      progressFill: 'linear-gradient(90deg, #10b981 0%, #86efac 30%, #34d399 70%, #10b981 100%)',
      progressBorder: '2px solid rgba(134, 239, 172, 0.5)',
      progressHeight: '6px',
      progressBorderRadius: '3px',
      progressTransition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      liquidGoldGradient: 'linear-gradient(90deg, #86efac, #34d399, #10b981, #6ee7b7)',
      liquidGoldGlow: '0 0 20px rgba(134, 239, 172, 0.6)',
      liquidGoldShimmer: true,
      shimmerAnimationDuration: '2.5s',
      shimmerIntensity: 0.8,
      timerFont: 'Cinzel, serif',
      timerColor: '#86efac',
      timerFontSize: '12px',
      timerFontWeight: '600',
      progressPulseEnabled: true,
      progressPulseIntensity: 0.4,
      progressPulseDuration: '2.5s',
      progressPulseColor: 'rgba(134, 239, 172, 0.3)',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      ctaBorderColor: '#86efac',
      ctaTextColor: '#ffffff',
      ctaBorderRadius: '12px',
      ctaPadding: '8px 16px',
      ctaFontSize: '12px',
      ctaFontWeight: '600',
      ctaFontFamily: 'Cinzel, serif',
      ctaHoverBackground: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      ctaHoverBorderColor: '#34d399',
      ctaActiveScale: 0.95,
      ctaTransition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ctaDisabledBackground: 'rgba(6, 95, 70, 0.4)',
      ctaDisabledTextColor: 'rgba(134, 239, 172, 0.5)',
      ctaDisabledOpacity: 0.6,
      ctaIcon: '🌿',
      ctaIconSize: '12px',
    },
    animation: {
      entryAnimation: 'slide-up',
      entryDuration: '0.4s',
      entryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      entryDelay: '0.1s',
      slotHoverScale: 1.08,
      slotHoverGlow: '0 0 24px rgba(134, 239, 172, 0.5)',
      slotHoverTransition: 'transform 0.3s ease, box-shadow 0.3s ease',
      slotHoverRotate: 2,
      progressAnimationEnabled: true,
      progressAnimationType: 'elastic',
      progressAnimationDuration: '0.4s',
      collectFeedbackAnimation: 'bounce',
      collectFeedbackDuration: '0.8s',
      collectFeedbackColor: '#86efac',
      motionLevel: 'full',
      reducedMotionConfig: {
        entryAnimation: 'fade',
        slotHoverScale: 1.02,
        slotHoverRotate: 0,
        collectFeedbackAnimation: 'flash',
        progressPulseEnabled: false,
      },
    },
    typography: {
      titleFont: 'Cinzel, serif',
      titleFontSize: '16px',
      titleFontWeight: '600',
      titleColor: '#d1fae5',
      titleLineHeight: '1.4',
      titleLetterSpacing: '0.02em',
      subtitleFont: 'Cinzel, serif',
      subtitleFontSize: '13px',
      subtitleFontWeight: '400',
      subtitleColor: '#a7f3d0',
      subtitleLineHeight: '1.3',
      helperFont: 'system-ui, sans-serif',
      helperFontSize: '11px',
      helperFontWeight: '400',
      helperColor: '#6ee7b7',
      helperOpacity: 0.8,
      slotInitialsFont: 'Cinzel, serif',
      slotInitialsFontSize: '11px',
      slotInitialsFontWeight: '600',
      slotInitialsColor: '#d1fae5',
    },
    status: {
      idle: {
        frameOpacity: 0.9,
        progressOpacity: 0.7,
        ctaOpacity: 0.8,
        statusColor: '#6ee7b7',
        statusIcon: '🌱',
      },
      inProgress: {
        frameGlow: '0 0 32px rgba(134, 239, 172, 0.4)',
        progressGlow: '0 0 24px rgba(134, 239, 172, 0.7)',
        statusColor: '#10b981',
        statusIcon: '🌿',
        pulseEnabled: true,
      },
      completed: {
        frameGlow: '0 0 36px rgba(34, 197, 94, 0.5)',
        progressGlow: '0 0 28px rgba(34, 197, 94, 0.8)',
        statusColor: '#22c55e',
        statusIcon: '🌳',
        celebrationEnabled: true,
      },
      blocked: {
        frameOpacity: 0.7,
        progressOpacity: 0.5,
        ctaOpacity: 0.6,
        statusColor: '#dc2626',
        statusIcon: '🚫',
        blockedPattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(220, 38, 38, 0.1) 3px, rgba(220, 38, 38, 0.1) 6px)',
      },
    },
    accessibility: {
      enableAriaLive: true,
      enableAriaLabels: true,
      enableAriaDescribedBy: true,
      enableKeyboardNavigation: true,
      enableFocusIndicators: true,
      focusIndicatorStyle: '2px solid #10b981',
      highContrastMode: false,
      enableReducedMotion: false,
      reducedMotionFallbacks: {
        entryAnimation: 'fade',
        slotHoverScale: 1.02,
        slotHoverRotate: 0,
        collectFeedbackAnimation: 'flash',
      },
    },
  },
  metadata: {
    difficulty: 'intermediate',
    estimatedLoadTime: 200,
  },
};

export const ARCANE_TECH_PRESET: ActivityCapsuleSkinPreset = {
  id: 'arcane-tech',
  name: 'Arcane Tech',
  description: 'Futuristic technology theme with digital aesthetics and neon accents',
  category: 'themed',
  version: '1.0.0',
  author: 'TS-Series System',
  tags: ['futuristic', 'tech', 'digital', 'neon'],
  supportedPillars: ['frontier', 'empire'],
  supportedMotionLevels: ['reduced', 'full'],
  config: {
    frame: {
      frameBorder: 'rgba(139, 92, 246, 0.5)',
      frameBackground: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.98) 100%)',
      frameBorderRadius: '12px',
      framePadding: '18px',
      frameMinHeight: '90px',
      frameBoxShadow: '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 48px rgba(139, 92, 246, 0.1)',
      frameDecoration: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent)',
      frameGlow: '0 0 20px rgba(139, 92, 246, 0.3)',
      slotGridColumns: 3,
      slotGap: '8px',
      slotSize: '48px',
      slotBorderRadius: '8px',
      slotBorder: '1px solid rgba(139, 92, 246, 0.4)',
      slotBackground: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
      mobileSlotColumns: 2,
      compactSlotSize: '40px',
    },
    progress: {
      progressBackground: 'rgba(17, 24, 39, 0.8)',
      progressFill: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 25%, #c084fc 50%, #a78bfa 75%, #8b5cf6 100%)',
      progressBorder: '1px solid rgba(139, 92, 246, 0.6)',
      progressHeight: '4px',
      progressBorderRadius: '2px',
      progressTransition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      liquidGoldGradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa, #c084fc, #e9d5ff)',
      liquidGoldGlow: '0 0 16px rgba(139, 92, 246, 0.7)',
      liquidGoldShimmer: true,
      shimmerAnimationDuration: '2s',
      shimmerIntensity: 0.9,
      timerFont: 'JetBrains Mono, monospace',
      timerColor: '#c084fc',
      timerFontSize: '11px',
      timerFontWeight: '500',
      progressPulseEnabled: true,
      progressPulseIntensity: 0.3,
      progressPulseDuration: '2s',
      progressPulseColor: 'rgba(139, 92, 246, 0.4)',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      ctaBorderColor: '#a78bfa',
      ctaTextColor: '#ffffff',
      ctaBorderRadius: '8px',
      ctaPadding: '6px 14px',
      ctaFontSize: '11px',
      ctaFontWeight: '600',
      ctaFontFamily: 'JetBrains Mono, monospace',
      ctaHoverBackground: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
      ctaHoverBorderColor: '#c084fc',
      ctaActiveScale: 0.96,
      ctaTransition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      ctaDisabledBackground: 'rgba(31, 41, 55, 0.5)',
      ctaDisabledTextColor: 'rgba(139, 92, 246, 0.4)',
      ctaDisabledOpacity: 0.5,
      ctaIcon: '⚡',
      ctaIconSize: '10px',
    },
    animation: {
      entryAnimation: 'scale',
      entryDuration: '0.3s',
      entryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      entryDelay: '0s',
      slotHoverScale: 1.06,
      slotHoverGlow: '0 0 20px rgba(139, 92, 246, 0.6)',
      slotHoverTransition: 'transform 0.2s ease, box-shadow 0.2s ease',
      progressAnimationEnabled: true,
      progressAnimationType: 'smooth',
      progressAnimationDuration: '0.3s',
      collectFeedbackAnimation: 'flash',
      collectFeedbackDuration: '0.5s',
      collectFeedbackColor: '#c084fc',
      motionLevel: 'full',
      reducedMotionConfig: {
        entryAnimation: 'fade',
        slotHoverScale: 1.02,
        collectFeedbackAnimation: 'none',
        progressPulseEnabled: false,
      },
    },
    typography: {
      titleFont: 'JetBrains Mono, monospace',
      titleFontSize: '14px',
      titleFontWeight: '600',
      titleColor: '#e9d5ff',
      titleLineHeight: '1.3',
      titleLetterSpacing: '0.01em',
      subtitleFont: 'JetBrains Mono, monospace',
      subtitleFontSize: '11px',
      subtitleFontWeight: '400',
      subtitleColor: '#c084fc',
      subtitleLineHeight: '1.2',
      helperFont: 'JetBrains Mono, monospace',
      helperFontSize: '10px',
      helperFontWeight: '400',
      helperColor: '#a78bfa',
      helperOpacity: 0.8,
      slotInitialsFont: 'JetBrains Mono, monospace',
      slotInitialsFontSize: '9px',
      slotInitialsFontWeight: '600',
      slotInitialsColor: '#e9d5ff',
    },
    status: {
      idle: {
        frameOpacity: 0.85,
        progressOpacity: 0.7,
        ctaOpacity: 0.8,
        statusColor: '#a78bfa',
        statusIcon: '⏸',
      },
      inProgress: {
        frameGlow: '0 0 24px rgba(139, 92, 246, 0.4)',
        progressGlow: '0 0 18px rgba(139, 92, 246, 0.7)',
        statusColor: '#8b5cf6',
        statusIcon: '⚡',
        pulseEnabled: true,
      },
      completed: {
        frameGlow: '0 0 28px rgba(34, 197, 94, 0.4)',
        progressGlow: '0 0 22px rgba(34, 197, 94, 0.7)',
        statusColor: '#22c55e',
        statusIcon: '✓',
        celebrationEnabled: true,
      },
      blocked: {
        frameOpacity: 0.6,
        progressOpacity: 0.4,
        ctaOpacity: 0.5,
        statusColor: '#ef4444',
        statusIcon: '🚫',
        blockedPattern: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(239, 68, 68, 0.1) 2px, rgba(239, 68, 68, 0.1) 4px)',
      },
    },
    accessibility: {
      enableAriaLive: true,
      enableAriaLabels: true,
      enableAriaDescribedBy: true,
      enableKeyboardNavigation: true,
      enableFocusIndicators: true,
      focusIndicatorStyle: '2px solid #8b5cf6',
      highContrastMode: false,
      enableReducedMotion: false,
      reducedMotionFallbacks: {
        entryAnimation: 'fade',
        slotHoverScale: 1.02,
        collectFeedbackAnimation: 'none',
      },
    },
  },
  metadata: {
    difficulty: 'intermediate',
    estimatedLoadTime: 180,
  },
};

export const GILDED_OBSERVATORY_PRESET: ActivityCapsuleSkinPreset = {
  id: 'gilded-observatory',
  name: 'Gilded Observatory',
  description: 'Luxurious astronomical theme with golden accents and celestial motifs',
  category: 'themed',
  version: '1.0.0',
  author: 'TS-Series System',
  tags: ['luxury', 'astronomical', 'golden', 'celestial'],
  supportedPillars: ['empire', 'frontier'],
  supportedMotionLevels: ['reduced', 'full'],
  config: {
    frame: {
      frameBorder: 'rgba(251, 191, 36, 0.6)',
      frameBackground: 'linear-gradient(135deg, rgba(17, 24, 39, 0.96) 0%, rgba(31, 41, 55, 0.98) 100%)',
      frameBorderRadius: '20px',
      framePadding: '24px',
      frameMinHeight: '110px',
      frameBoxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(251, 191, 36, 0.3), 0 0 32px rgba(251, 191, 36, 0.2)',
      frameDecoration: 'radial-gradient(circle at 20% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
      frameGlow: '0 0 32px rgba(251, 191, 36, 0.3)',
      slotGridColumns: 4,
      slotGap: '12px',
      slotSize: '56px',
      slotBorderRadius: '50%',
      slotBorder: '2px solid rgba(251, 191, 36, 0.4)',
      slotBackground: 'radial-gradient(circle at 35% 35%, rgba(251, 191, 36, 0.2), rgba(17, 24, 39, 0.9))',
      mobileSlotColumns: 2,
      compactSlotSize: '48px',
    },
    progress: {
      progressBackground: 'rgba(17, 24, 39, 0.8)',
      progressFill: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #f59e0b 75%, #fbbf24 100%)',
      progressBorder: '2px solid rgba(251, 191, 36, 0.6)',
      progressHeight: '6px',
      progressBorderRadius: '3px',
      progressTransition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      liquidGoldGradient: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #fcd34d, #fbbf24)',
      liquidGoldGlow: '0 0 24px rgba(251, 191, 36, 0.8)',
      liquidGoldShimmer: true,
      shimmerAnimationDuration: '3s',
      shimmerIntensity: 1,
      timerFont: 'Cinzel, serif',
      timerColor: '#fbbf24',
      timerFontSize: '13px',
      timerFontWeight: '700',
      progressPulseEnabled: true,
      progressPulseIntensity: 0.5,
      progressPulseDuration: '2.5s',
      progressPulseColor: 'rgba(251, 191, 36, 0.4)',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      ctaBorderColor: '#fbbf24',
      ctaTextColor: '#111827',
      ctaBorderRadius: '16px',
      ctaPadding: '10px 20px',
      ctaFontSize: '13px',
      ctaFontWeight: '700',
      ctaFontFamily: 'Cinzel, serif',
      ctaHoverBackground: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      ctaHoverBorderColor: '#fcd34d',
      ctaActiveScale: 0.94,
      ctaTransition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ctaDisabledBackground: 'rgba(31, 41, 55, 0.6)',
      ctaDisabledTextColor: 'rgba(251, 191, 36, 0.4)',
      ctaDisabledOpacity: 0.5,
      ctaIcon: '⭐',
      ctaIconSize: '14px',
    },
    animation: {
      entryAnimation: 'scale',
      entryDuration: '0.5s',
      entryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      entryDelay: '0.1s',
      slotHoverScale: 1.1,
      slotHoverGlow: '0 0 28px rgba(251, 191, 36, 0.7)',
      slotHoverTransition: 'transform 0.3s ease, box-shadow 0.3s ease',
      progressAnimationEnabled: true,
      progressAnimationType: 'elastic',
      progressAnimationDuration: '0.5s',
      collectFeedbackAnimation: 'ripple',
      collectFeedbackDuration: '1s',
      collectFeedbackColor: '#fbbf24',
      motionLevel: 'full',
      reducedMotionConfig: {
        entryAnimation: 'fade',
        slotHoverScale: 1.03,
        collectFeedbackAnimation: 'bounce',
        progressPulseEnabled: false,
      },
    },
    typography: {
      titleFont: 'Cinzel, serif',
      titleFontSize: '18px',
      titleFontWeight: '700',
      titleColor: '#fef3c7',
      titleLineHeight: '1.4',
      titleLetterSpacing: '0.02em',
      subtitleFont: 'Cinzel, serif',
      subtitleFontSize: '14px',
      subtitleFontWeight: '500',
      subtitleColor: '#fde68a',
      subtitleLineHeight: '1.3',
      helperFont: 'system-ui, sans-serif',
      helperFontSize: '12px',
      helperFontWeight: '400',
      helperColor: '#fcd34d',
      helperOpacity: 0.9,
      slotInitialsFont: 'Cinzel, serif',
      slotInitialsFontSize: '12px',
      slotInitialsFontWeight: '700',
      slotInitialsColor: '#fef3c7',
    },
    status: {
      idle: {
        frameOpacity: 0.9,
        progressOpacity: 0.8,
        ctaOpacity: 0.85,
        statusColor: '#fcd34d',
        statusIcon: '⭐',
      },
      inProgress: {
        frameGlow: '0 0 36px rgba(251, 191, 36, 0.5)',
        progressGlow: '0 0 28px rgba(251, 191, 36, 0.8)',
        statusColor: '#f59e0b',
        statusIcon: '✨',
        pulseEnabled: true,
      },
      completed: {
        frameGlow: '0 0 40px rgba(251, 191, 36, 0.6)',
        progressGlow: '0 0 32px rgba(251, 191, 36, 0.9)',
        statusColor: '#fbbf24',
        statusIcon: '🌟',
        celebrationEnabled: true,
      },
      blocked: {
        frameOpacity: 0.7,
        progressOpacity: 0.5,
        ctaOpacity: 0.6,
        statusColor: '#dc2626',
        statusIcon: '🚫',
        blockedPattern: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(220, 38, 38, 0.1) 4px, rgba(220, 38, 38, 0.1) 8px)',
      },
    },
    accessibility: {
      enableAriaLive: true,
      enableAriaLabels: true,
      enableAriaDescribedBy: true,
      enableKeyboardNavigation: true,
      enableFocusIndicators: true,
      focusIndicatorStyle: '2px solid #f59e0b',
      highContrastMode: false,
      enableReducedMotion: false,
      reducedMotionFallbacks: {
        entryAnimation: 'fade',
        slotHoverScale: 1.03,
        collectFeedbackAnimation: 'bounce',
      },
    },
  },
  metadata: {
    difficulty: 'advanced',
    estimatedLoadTime: 250,
  },
};

// ============================================================================
// EXPERIMENTAL PRESETS
// ============================================================================

export const NEON_CYBER_PRESET: ActivityCapsuleSkinPreset = {
  id: 'neon-cyber',
  name: 'Neon Cyber',
  description: 'Cyberpunk theme with neon colors and digital glitch effects',
  category: 'experimental',
  version: '1.0.0',
  author: 'TS-Series System',
  tags: ['cyberpunk', 'neon', 'digital', 'glitch'],
  supportedPillars: ['frontier'],
  supportedMotionLevels: ['full'],
  config: {
    frame: {
      frameBorder: 'rgba(236, 72, 153, 0.8)',
      frameBackground: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)',
      frameBorderRadius: '4px',
      framePadding: '16px',
      frameMinHeight: '80px',
      frameBoxShadow: '0 0 32px rgba(236, 72, 153, 0.5), inset 0 0 16px rgba(236, 72, 153, 0.2)',
      frameDecoration: 'linear-gradient(45deg, transparent, rgba(236, 72, 153, 0.1), transparent)',
      frameGlow: '0 0 24px rgba(236, 72, 153, 0.6)',
      slotGridColumns: 3,
      slotGap: '8px',
      slotSize: '48px',
      slotBorderRadius: '2px',
      slotBorder: '1px solid rgba(236, 72, 153, 0.6)',
      slotBackground: 'rgba(0, 0, 0, 0.8)',
      mobileSlotColumns: 2,
      compactSlotSize: '40px',
    },
    progress: {
      progressBackground: 'rgba(0, 0, 0, 0.8)',
      progressFill: 'linear-gradient(90deg, #ec4899 0%, #f472b6 50%, #ec4899 100%)',
      progressBorder: '1px solid rgba(236, 72, 153, 0.8)',
      progressHeight: '4px',
      progressBorderRadius: '1px',
      progressTransition: 'width 0.2s ease',
      liquidGoldGradient: 'linear-gradient(90deg, #ec4899, #f472b6, #f9a8d4, #fbbf24)',
      liquidGoldGlow: '0 0 20px rgba(236, 72, 153, 0.9)',
      liquidGoldShimmer: true,
      shimmerAnimationDuration: '1.5s',
      shimmerIntensity: 1,
      timerFont: 'JetBrains Mono, monospace',
      timerColor: '#f472b6',
      timerFontSize: '10px',
      timerFontWeight: '600',
      progressPulseEnabled: true,
      progressPulseIntensity: 0.6,
      progressPulseDuration: '1s',
      progressPulseColor: 'rgba(236, 72, 153, 0.5)',
    },
    cta: {
      ctaBackground: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      ctaBorderColor: '#f472b6',
      ctaTextColor: '#ffffff',
      ctaBorderRadius: '2px',
      ctaPadding: '6px 12px',
      ctaFontSize: '11px',
      ctaFontWeight: '700',
      ctaFontFamily: 'JetBrains Mono, monospace',
      ctaHoverBackground: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
      ctaHoverBorderColor: '#f9a8d4',
      ctaActiveScale: 0.98,
      ctaTransition: 'all 0.1s ease',
      ctaDisabledBackground: 'rgba(31, 41, 55, 0.6)',
      ctaDisabledTextColor: 'rgba(236, 72, 153, 0.4)',
      ctaDisabledOpacity: 0.4,
      ctaIcon: '⚡',
      ctaIconSize: '10px',
    },
    animation: {
      entryAnimation: 'scale',
      entryDuration: '0.2s',
      entryEasing: 'ease-out',
      entryDelay: '0s',
      slotHoverScale: 1.1,
      slotHoverGlow: '0 0 24px rgba(236, 72, 153, 0.8)',
      slotHoverTransition: 'transform 0.1s ease, box-shadow 0.1s ease',
      progressAnimationEnabled: true,
      progressAnimationType: 'stepped',
      progressAnimationDuration: '0.2s',
      collectFeedbackAnimation: 'flash',
      collectFeedbackDuration: '0.3s',
      collectFeedbackColor: '#f472b6',
      motionLevel: 'full',
      reducedMotionConfig: {
        entryAnimation: 'fade',
        slotHoverScale: 1.05,
        collectFeedbackAnimation: 'none',
        progressPulseEnabled: false,
      },
    },
    typography: {
      titleFont: 'JetBrains Mono, monospace',
      titleFontSize: '13px',
      titleFontWeight: '700',
      titleColor: '#f9a8d4',
      titleLineHeight: '1.2',
      titleLetterSpacing: '0.02em',
      subtitleFont: 'JetBrains Mono, monospace',
      subtitleFontSize: '10px',
      subtitleFontWeight: '400',
      subtitleColor: '#f472b6',
      subtitleLineHeight: '1.1',
      helperFont: 'JetBrains Mono, monospace',
      helperFontSize: '9px',
      helperFontWeight: '400',
      helperColor: '#ec4899',
      helperOpacity: 0.8,
      slotInitialsFont: 'JetBrains Mono, monospace',
      slotInitialsFontSize: '8px',
      slotInitialsFontWeight: '700',
      slotInitialsColor: '#f9a8d4',
    },
    status: {
      idle: {
        frameOpacity: 0.8,
        progressOpacity: 0.6,
        ctaOpacity: 0.7,
        statusColor: '#f472b6',
        statusIcon: '⏸',
      },
      inProgress: {
        frameGlow: '0 0 32px rgba(236, 72, 153, 0.6)',
        progressGlow: '0 0 24px rgba(236, 72, 153, 0.9)',
        statusColor: '#ec4899',
        statusIcon: '⚡',
        pulseEnabled: true,
      },
      completed: {
        frameGlow: '0 0 36px rgba(34, 197, 94, 0.5)',
        progressGlow: '0 0 28px rgba(34, 197, 94, 0.8)',
        statusColor: '#22c55e',
        statusIcon: '✓',
        celebrationEnabled: true,
      },
      blocked: {
        frameOpacity: 0.5,
        progressOpacity: 0.3,
        ctaOpacity: 0.4,
        statusColor: '#ef4444',
        statusIcon: '🚫',
        blockedPattern: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(239, 68, 68, 0.2) 1px, rgba(239, 68, 68, 0.2) 2px)',
      },
    },
    accessibility: {
      enableAriaLive: true,
      enableAriaLabels: true,
      enableAriaDescribedBy: true,
      enableKeyboardNavigation: true,
      enableFocusIndicators: true,
      focusIndicatorStyle: '2px solid #ec4899',
      highContrastMode: false,
      enableReducedMotion: false,
      reducedMotionFallbacks: {
        entryAnimation: 'fade',
        slotHoverScale: 1.05,
        collectFeedbackAnimation: 'none',
      },
    },
  },
  metadata: {
    difficulty: 'advanced',
    estimatedLoadTime: 300,
  },
};

// ============================================================================
// PRESET REGISTRY
// ============================================================================

export const ACTIVITY_CAPSULE_SKIN_PRESETS: Record<string, ActivityCapsuleSkinPreset> = {
  'minimal-frontier': MINIMAL_FRONTIER_PRESET,
  'minimal-wilderness': MINIMAL_WILDERNESS_PRESET,
  'minimal-empire': MINIMAL_EMPIRE_PRESET,
  'wanderlust': WANDERLUST_PRESET,
  'arcane-tech': ARCANE_TECH_PRESET,
  'gilded-observatory': GILDED_OBSERVATORY_PRESET,
  'neon-cyber': NEON_CYBER_PRESET,
};

// ============================================================================
// THEME COLLECTIONS
// ============================================================================

export const ACTIVITY_CAPSULE_SKIN_THEMES: Record<string, ActivityCapsuleSkinTheme> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal Collection',
    description: 'Clean and minimal designs for optimal performance',
    presets: {
      'minimal-frontier': MINIMAL_FRONTIER_PRESET,
      'minimal-wilderness': MINIMAL_WILDERNESS_PRESET,
      'minimal-empire': MINIMAL_EMPIRE_PRESET,
    },
    baseConfig: {
      animation: {
        motionLevel: 'minimal',
        entryAnimation: 'fade',
        entryDuration: '0.2s',
        slotHoverScale: 1.02,
        collectFeedbackAnimation: 'none',
        progressPulseEnabled: false,
      },
      accessibility: {
        enableReducedMotion: true,
        enableAriaLive: false,
      },
    },
    pillarVariants: {
      frontier: {
        frame: {
          frameBorder: 'rgba(59, 130, 246, 0.2)',
          frameBackground: 'rgba(15, 23, 42, 0.95)',
        },
        progress: {
          progressFill: 'rgba(59, 130, 246, 0.8)',
        },
        cta: {
          ctaBackground: 'rgba(59, 130, 246, 0.8)',
        },
      },
      wilderness: {
        frame: {
          frameBorder: 'rgba(34, 197, 94, 0.2)',
          frameBackground: 'rgba(6, 78, 59, 0.95)',
        },
        progress: {
          progressFill: 'rgba(34, 197, 94, 0.8)',
        },
        cta: {
          ctaBackground: 'rgba(34, 197, 94, 0.8)',
        },
      },
      empire: {
        frame: {
          frameBorder: 'rgba(217, 119, 6, 0.2)',
          frameBackground: 'rgba(38, 38, 38, 0.95)',
        },
        progress: {
          progressFill: 'rgba(217, 119, 6, 0.8)',
        },
        cta: {
          ctaBackground: 'rgba(217, 119, 6, 0.8)',
        },
      },
    },
    motionAdaptations: {
      minimal: {
        animation: {
          entryAnimation: 'none',
          slotHoverScale: 1,
          collectFeedbackAnimation: 'none',
          progressPulseEnabled: false,
        },
      },
      reduced: {
        animation: {
          entryDuration: '0.1s',
          slotHoverScale: 1.01,
          collectFeedbackAnimation: 'none',
          progressPulseEnabled: false,
        },
      },
      full: {
        animation: {
          entryDuration: '0.2s',
          slotHoverScale: 1.02,
          collectFeedbackAnimation: 'none',
          progressPulseEnabled: false,
        },
      },
    },
  },
  
  themed: {
    id: 'themed',
    name: 'Themed Collection',
    description: 'Rich, themed designs with distinctive visual identities',
    presets: {
      'wanderlust': WANDERLUST_PRESET,
      'arcane-tech': ARCANE_TECH_PRESET,
      'gilded-observatory': GILDED_OBSERVATORY_PRESET,
    },
    baseConfig: {
      animation: {
        motionLevel: 'full',
        entryAnimation: 'scale',
        entryDuration: '0.4s',
        slotHoverScale: 1.08,
        collectFeedbackAnimation: 'bounce',
        progressPulseEnabled: true,
      },
      accessibility: {
        enableReducedMotion: false,
        enableAriaLive: true,
      },
    },
    pillarVariants: {
      frontier: {
        frame: {
          frameBorder: 'rgba(59, 130, 246, 0.4)',
          frameBackground: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.98) 100%)',
        },
        progress: {
          progressFill: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%)',
        },
        cta: {
          ctaBackground: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        },
      },
      wilderness: {
        frame: {
          frameBorder: 'rgba(34, 197, 94, 0.4)',
          frameBackground: 'linear-gradient(135deg, rgba(6, 78, 59, 0.92) 0%, rgba(20, 83, 45, 0.95) 100%)',
        },
        progress: {
          progressFill: 'linear-gradient(90deg, #2d9a55 0%, #44c470 50%, #2d9a55 100%)',
        },
        cta: {
          ctaBackground: 'linear-gradient(135deg, #2d9a55 0%, #1f6e3c 100%)',
        },
      },
      empire: {
        frame: {
          frameBorder: 'rgba(205, 127, 50, 0.5)',
          frameBackground: 'linear-gradient(135deg, rgba(38, 38, 38, 0.96) 0%, rgba(55, 48, 38, 0.98) 100%)',
        },
        progress: {
          progressFill: 'linear-gradient(90deg, #c06030 0%, #d88050 50%, #c06030 100%)',
        },
        cta: {
          ctaBackground: 'linear-gradient(135deg, #c06030 0%, #9a461a 100%)',
        },
      },
    },
    motionAdaptations: {
      minimal: {
        animation: {
          entryAnimation: 'fade',
          entryDuration: '0.2s',
          slotHoverScale: 1.02,
          collectFeedbackAnimation: 'none',
          progressPulseEnabled: false,
        },
      },
      reduced: {
        animation: {
          entryDuration: '0.3s',
          slotHoverScale: 1.05,
          collectFeedbackAnimation: 'flash',
          progressPulseEnabled: true,
          progressPulseIntensity: 0.2,
        },
      },
      full: {
        animation: {
          entryDuration: '0.4s',
          slotHoverScale: 1.08,
          collectFeedbackAnimation: 'bounce',
          progressPulseEnabled: true,
          progressPulseIntensity: 0.4,
        },
      },
    },
  },
  
  experimental: {
    id: 'experimental',
    name: 'Experimental Collection',
    description: 'Cutting-edge designs with advanced effects and animations',
    presets: {
      'neon-cyber': NEON_CYBER_PRESET,
    },
    baseConfig: {
      animation: {
        motionLevel: 'full',
        entryAnimation: 'scale',
        entryDuration: '0.2s',
        slotHoverScale: 1.1,
        collectFeedbackAnimation: 'flash',
        progressPulseEnabled: true,
        progressPulseIntensity: 0.6,
      },
      accessibility: {
        enableReducedMotion: false,
        enableAriaLive: true,
      },
    },
    pillarVariants: {
      frontier: {
        frame: {
          frameBorder: 'rgba(236, 72, 153, 0.8)',
          frameBackground: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)',
        },
        progress: {
          progressFill: 'linear-gradient(90deg, #ec4899 0%, #f472b6 50%, #ec4899 100%)',
        },
        cta: {
          ctaBackground: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        },
      },
      wilderness: {
        frame: {
          frameBorder: 'rgba(168, 85, 247, 0.8)',
          frameBackground: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)',
        },
        progress: {
          progressFill: 'linear-gradient(90deg, #a855f7 0%, #c084fc 50%, #a855f7 100%)',
        },
        cta: {
          ctaBackground: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
        },
      },
      empire: {
        frame: {
          frameBorder: 'rgba(239, 68, 68, 0.8)',
          frameBackground: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)',
        },
        progress: {
          progressFill: 'linear-gradient(90deg, #ef4444 0%, #f87171 50%, #ef4444 100%)',
        },
        cta: {
          ctaBackground: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        },
      },
    },
    motionAdaptations: {
      minimal: {
        animation: {
          entryAnimation: 'fade',
          entryDuration: '0.1s',
          slotHoverScale: 1.05,
          collectFeedbackAnimation: 'flash',
          progressPulseEnabled: true,
          progressPulseIntensity: 0.3,
        },
      },
      reduced: {
        animation: {
          entryDuration: '0.15s',
          slotHoverScale: 1.08,
          collectFeedbackAnimation: 'flash',
          progressPulseEnabled: true,
          progressPulseIntensity: 0.5,
        },
      },
      full: {
        animation: {
          entryDuration: '0.2s',
          slotHoverScale: 1.1,
          collectFeedbackAnimation: 'flash',
          progressPulseEnabled: true,
          progressPulseIntensity: 0.6,
        },
      },
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get preset by ID
 */
export function getActivityCapsuleSkinPreset(presetId: string): ActivityCapsuleSkinPreset | null {
  return ACTIVITY_CAPSULE_SKIN_PRESETS[presetId] || null;
}

/**
 * Get all presets by category
 */
export function getActivityCapsuleSkinPresetsByCategory(category: ActivityCapsuleSkinPreset['category']): ActivityCapsuleSkinPreset[] {
  return Object.values(ACTIVITY_CAPSULE_SKIN_PRESETS).filter(preset => preset.category === category);
}

/**
 * Get theme by ID
 */
export function getActivityCapsuleSkinTheme(themeId: string): ActivityCapsuleSkinTheme | null {
  return ACTIVITY_CAPSULE_SKIN_THEMES[themeId] || null;
}

/**
 * Get all themes
 */
export function getAllActivityCapsuleSkinThemes(): ActivityCapsuleSkinTheme[] {
  return Object.values(ACTIVITY_CAPSULE_SKIN_THEMES);
}

/**
 * Get preset configuration for specific pillar and motion level
 */
export function getActivityCapsuleSkinConfigForPreset(
  presetId: string,
  pillar?: StyleLabPillar,
  motionLevel?: MotionLevel
): ActivityCapsuleSkinConfig | null {
  const preset = getActivityCapsuleSkinPreset(presetId);
  if (!preset) return null;
  
  let config = mergeActivityCapsuleSkinConfig(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG, preset.config);
  
  // Apply pillar variant if available
  if (pillar && preset.config[pillar]) {
    config = mergeActivityCapsuleSkinConfig(config, preset.config[pillar]);
  }
  
  // Apply motion level adaptation if available
  if (motionLevel && preset.config.animation?.reducedMotionConfig) {
    const motionConfig = motionLevel === 'minimal' 
      ? preset.config.animation.reducedMotionConfig
      : motionLevel === 'reduced' 
        ? { ...preset.config.animation, motionLevel }
        : { ...preset.config.animation, motionLevel };
    
    config = mergeActivityCapsuleSkinConfig(config, { animation: motionConfig });
  }
  
  return config;
}

/**
 * Search presets by tags
 */
export function searchActivityCapsuleSkinPresets(query: string): ActivityCapsuleSkinPreset[] {
  const searchTerms = query.toLowerCase().split(' ');
  
  return Object.values(ACTIVITY_CAPSULE_SKIN_PRESETS).filter(preset => {
    const searchableText = [
      preset.name,
      preset.description,
      preset.category,
      ...preset.tags,
      preset.author,
    ].join(' ').toLowerCase();
    
    return searchTerms.every(term => searchableText.includes(term));
  });
}

/**
 * Get recommended presets for specific use case
 */
export function getRecommendedActivityCapsuleSkinPresets(useCase: 'performance' | 'accessibility' | 'visual' | 'development'): ActivityCapsuleSkinPreset[] {
  switch (useCase) {
    case 'performance':
      return getActivityCapsuleSkinPresetsByCategory('minimal');
    case 'accessibility':
      return Object.values(ACTIVITY_CAPSULE_SKIN_PRESETS).filter(preset => 
        preset.config.accessibility?.enableReducedMotion !== false
      );
    case 'visual':
      return getActivityCapsuleSkinPresetsByCategory('themed');
    case 'development':
      return getActivityCapsuleSkinPresetsByCategory('experimental');
    default:
      return Object.values(ACTIVITY_CAPSULE_SKIN_PRESETS);
  }
}

export default ACTIVITY_CAPSULE_SKIN_PRESETS;
