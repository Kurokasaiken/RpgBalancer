import type { CSSProperties } from 'react';
import { PHYSICS_DEFAULTS } from '../config/physicsDefaults';

/**
 * Modifier scope identifiers aligned with Gameplay Modifier Registry scopes.
 * These scopes map 1:1 with GM-REG buckets and are used by UI badges.
 */
export type ModifierScope = 'GLOBAL' | 'SESSION' | 'LOCATION' | 'QUEST' | 'RESIDENT';

/**
 * Visual tokens for a modifier scope badge or surface treatment.
 * Consumers use these values to render badges, glows, and borders.
 */
export interface ModifierScopePalette {
  background: string;
  border: string;
  foreground: string;
  glow: string;
}

/**
 * Visual tokens for modifier lifecycle status indicators (active/expired/etc.).
 */
export interface ModifierStatusPalette {
  background: string;
  border: string;
  foreground: string;
}

/**
 * Interaction color tokens exposed to UI components for stateful surfaces.
 */
export interface InteractionColorTokens {
  accentPrimary: string;
  accentSecondary: string;
  success: string;
  warning: string;
  danger: string;
  focusRing: string;
}

/**
 * Physics tokens describing how interactive surfaces should feel.
 */
export interface InteractionPhysicsTokens {
  liftScale: number;
  springStiffness: number;
  springDamping: number;
  mass: number;
  tiltIntensity: number;
  buttonSquash: number;
  buttonLift: number;
  slotGlowIntensity: number;
}

/**
 * Material feel metadata used by shaders/FX layers.
 */
export interface MaterialFeelTokens {
  surfaceSheen: string;
  edgeTreatment: string;
  grain: string;
  shadowDepth: string;
  highlightSheen: string;
  density: 'light' | 'medium' | 'heavy';
  /** Frame treatment flag for V8 Skin Architecture (e.g., 'chiseled-bronze-frame') */
  frameTreatment?: string;
  /** Detail-level material feel for ActionCard surfaces and close-up views. */
  detail: {
    microTexture: string;
    edgeGlow: string;
    surfaceReflection: string;
    depthLayers: string;
    metallicFlakes: string;
  };
}

/**
 * Audio + haptic defaults for the preset.
 */
export interface AudioHapticsTokens {
  audioProfileId: string;
  masterVolume: number;
  effectVolume: number;
  reverbPreset: string;
  hapticPreset: string;
  vibrationIntensity: number;
  responseDelayMs: number;
}

/**
 * Tokens defining the visual frame and structure of ActionCard components.
 * Used by ActionCardBase and wrapper components.
 */
export interface ActionCardFrameTokens {
  frameBorder: string;
  frameBackground: string;
  frameBorderRadius: string;
  frameBoxShadow: string;
  framePadding: string;
  frameMinHeight: string;
  frameTransition: string;
}

/**
 * Tokens for ActionHalo components displayed on map POI.
 * Defines the glowing ring effect and animation parameters.
 */
export interface ActionHaloTokens {
  haloColor: string;
  haloGlowIntensity: number;
  haloSize: string;
  haloBorderWidth: string;
  haloPulseDuration: string;
  haloPulseEasing: string;
  haloShadowBlur: string;
  haloShadowColor: string;
}

/**
 * Tokens for progress inlay elements within ActionCards.
 * Defines the appearance of progress bars and completion indicators.
 */
export interface ProgressInlayTokens {
  progressBackground: string;
  progressFill: string;
  progressBorder: string;
  progressBorderRadius: string;
  progressHeight: string;
  progressTransition: string;
  progressGlowColor: string;
  progressGlowIntensity: number;
}

/**
 * Generic typography tokens for all components.
 * Defines font families, sizes, weights, and spacing for text hierarchy.
 */
export interface TypographyTokens {
  fontFamily: {
    display: string;
    heading: string;
    body: string;
    caption: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
  color: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
}

/**
 * Generic spacing tokens for layout.
 * Defines consistent spacing scale for margins, padding, and gaps.
 */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

/**
 * Generic border tokens for all components.
 */
export interface BorderTokens {
  width: {
    thin: string;
    medium: string;
    thick: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  color: {
    default: string;
    subtle: string;
    strong: string;
  };
}

/**
 * Style Lab preset definition used by hooks/components consuming modifier tokens.
 */
export interface StyleLabPreset {
  name: string;
  description: string;
  surfaces: {
    panel: CSSProperties;
    card: CSSProperties;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  modifierScopes: Record<ModifierScope, ModifierScopePalette>;
  modifierStatus: {
    active: ModifierStatusPalette;
    expired: ModifierStatusPalette;
    upcoming: ModifierStatusPalette;
  };
  interactionColors: InteractionColorTokens;
  interactionPhysics: InteractionPhysicsTokens;
  materialFeel: MaterialFeelTokens;
  audioHaptics: AudioHapticsTokens;
  /** ActionCard frame tokens for base element structure. */
  actionCardFrame: ActionCardFrameTokens;
  /** ActionHalo tokens for map POI glowing effects. */
  actionHalo: ActionHaloTokens;
  /** Progress inlay tokens for progress bars and completion indicators. */
  progressInlay: ProgressInlayTokens;
  /** Generic typography tokens for all components. */
  genericTypography: TypographyTokens;
  /** Generic spacing tokens for layout. */
  genericSpacing: SpacingTokens;
  /** Generic border tokens for all components. */
  genericBorder: BorderTokens;
}

const DEFAULT_INTERACTION_COLORS: InteractionColorTokens = {
  accentPrimary: 'var(--glow-emerald, #16a34a)',
  accentSecondary: 'var(--gold-gradient, #c8a030)',
  success: 'rgba(34,197,94,1)',
  warning: 'rgba(251,191,36,1)',
  danger: 'rgba(248,113,113,1)',
  focusRing: 'rgba(59,130,246,0.85)',
};

const DEFAULT_INTERACTION_PHYSICS: InteractionPhysicsTokens = {
  liftScale: PHYSICS_DEFAULTS.liftScale,
  springStiffness: PHYSICS_DEFAULTS.springStiffness,
  springDamping: PHYSICS_DEFAULTS.springDamping,
  mass: PHYSICS_DEFAULTS.mass,
  tiltIntensity: PHYSICS_DEFAULTS.tiltIntensity,
  buttonSquash: PHYSICS_DEFAULTS.buttonSquash,
  buttonLift: PHYSICS_DEFAULTS.buttonLift,
  slotGlowIntensity: PHYSICS_DEFAULTS.slotGlowIntensity,
};

const DEFAULT_MATERIAL_FEEL: MaterialFeelTokens = {
  surfaceSheen: 'obsidian-glass',
  edgeTreatment: 'micro-bevel',
  grain: 'brushed-bronze',
  shadowDepth: 'var(--shadow-deep)',
  highlightSheen: 'var(--acc-glow)',
  density: 'medium',
  frameTreatment: undefined,
  detail: {
    microTexture: 'var(--detail-texture, linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%))',
    edgeGlow: 'rgba(200, 160, 48, 0.3)',
    surfaceReflection: 'rgba(255, 255, 255, 0.08)',
    depthLayers: 'var(--depth-layers, 3)',
    metallicFlakes: 'var(--metallic-flakes, radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%))',
  },
};

const DEFAULT_AUDIO_HAPTICS: AudioHapticsTokens = {
  audioProfileId: 'gilded_observatory',
  masterVolume: 0.75,
  effectVolume: 0.85,
  reverbPreset: 'cathedral-small',
  hapticPreset: 'arcane-medium',
  vibrationIntensity: 0.6,
  responseDelayMs: 45,
};

const DEFAULT_ACTION_CARD_FRAME: ActionCardFrameTokens = {
  frameBorder: 'var(--action-card-border, rgba(200, 160, 48, 0.4))',
  frameBackground: 'var(--action-card-bg, linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%))',
  frameBorderRadius: 'var(--action-card-radius, 12px)',
  frameBoxShadow: 'var(--action-card-shadow, 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(200, 160, 48, 0.2))',
  framePadding: 'var(--action-card-padding, 16px)',
  frameMinHeight: 'var(--action-card-min-height, 80px)',
  frameTransition: 'var(--action-card-transition, all 0.3s cubic-bezier(0.4, 0, 0.2, 1))',
};

const DEFAULT_ACTION_HALO: ActionHaloTokens = {
  haloColor: 'var(--action-halo-color, rgba(200, 160, 48, 0.6))',
  haloGlowIntensity: 0.8,
  haloSize: 'var(--action-halo-size, 48px)',
  haloBorderWidth: 'var(--action-halo-border-width, 3px)',
  haloPulseDuration: 'var(--action-halo-pulse-duration, 2s)',
  haloPulseEasing: 'var(--action-halo-pulse-easing, ease-in-out)',
  haloShadowBlur: 'var(--action-halo-shadow-blur, 12px)',
  haloShadowColor: 'var(--action-halo-shadow-color, rgba(200, 160, 48, 0.4))',
};

const DEFAULT_PROGRESS_INLAY: ProgressInlayTokens = {
  progressBackground: 'var(--progress-bg, rgba(30, 41, 59, 0.8))',
  progressFill: 'var(--progress-fill, linear-gradient(90deg, #c8a030 0%, #fbbf24 50%, #c8a030 100%))',
  progressBorder: 'var(--progress-border, rgba(200, 160, 48, 0.3))',
  progressBorderRadius: 'var(--progress-radius, 6px)',
  progressHeight: 'var(--progress-height, 6px)',
  progressTransition: 'var(--progress-transition, width 0.6s cubic-bezier(0.4, 0, 0.2, 1))',
  progressGlowColor: 'var(--progress-glow, rgba(200, 160, 48, 0.5))',
  progressGlowIntensity: 0.6,
};

const DEFAULT_GENERIC_TYPOGRAPHY: TypographyTokens = {
  fontFamily: {
    display: 'var(--font-display, "Space Grotesk", sans-serif)',
    heading: 'var(--font-heading, "Space Grotesk", sans-serif)',
    body: 'var(--font-body, "Space Grotesk", sans-serif)',
    caption: 'var(--font-caption, "Space Grotesk", sans-serif)',
    mono: 'var(--font-mono, "SF Mono", monospace)',
  },
  fontSize: {
    xs: 'var(--font-size-xs, 11px)',
    sm: 'var(--font-size-sm, 12px)',
    base: 'var(--font-size-base, 14px)',
    lg: 'var(--font-size-lg, 16px)',
    xl: 'var(--font-size-xl, 18px)',
    '2xl': 'var(--font-size-2xl, 24px)',
    '3xl': 'var(--font-size-3xl, 32px)',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
  color: {
    primary: 'var(--text-primary, #e2e8f0)',
    secondary: 'var(--text-secondary, #94a3b8)',
    tertiary: 'var(--text-tertiary, #64748b)',
    inverse: 'var(--text-inverse, #0f172a)',
  },
};

const DEFAULT_GENERIC_SPACING: SpacingTokens = {
  xs: 'var(--spacing-xs, 4px)',
  sm: 'var(--spacing-sm, 8px)',
  md: 'var(--spacing-md, 12px)',
  lg: 'var(--spacing-lg, 16px)',
  xl: 'var(--spacing-xl, 24px)',
  '2xl': 'var(--spacing-2xl, 32px)',
  '3xl': 'var(--spacing-3xl, 48px)',
};

const DEFAULT_GENERIC_BORDER: BorderTokens = {
  width: {
    thin: 'var(--border-width-thin, 1px)',
    medium: 'var(--border-width-medium, 2px)',
    thick: 'var(--border-width-thick, 3px)',
  },
  radius: {
    sm: 'var(--border-radius-sm, 4px)',
    md: 'var(--border-radius-md, 8px)',
    lg: 'var(--border-radius-lg, 12px)',
    xl: 'var(--border-radius-xl, 16px)',
    full: 'var(--border-radius-full, 9999px)',
  },
  color: {
    default: 'var(--border-color-default, rgba(148, 163, 184, 0.2))',
    subtle: 'var(--border-color-subtle, rgba(148, 163, 184, 0.1))',
    strong: 'var(--border-color-strong, rgba(148, 163, 184, 0.4))',
  },
};

/**
 * Default preset anchored to Minimal Gameplay palette and Style Lab tokens.
 */
export const DEFAULT_STYLE_LAB_PRESET: StyleLabPreset = {
  name: 'Minimal Frontier',
  description: 'Preset aligning Idle Village Minimal Gameplay palette with Style Lab tokens.',
  surfaces: {
    panel: {
      borderColor: 'var(--minimal-panel-border)',
      background: 'var(--minimal-panel-surface)',
      borderRadius: 'var(--minimal-card-radius)',
      boxShadow: '0 30px 60px var(--minimal-card-shadow-color)',
    },
    card: {
      borderColor: 'var(--minimal-panel-border)',
      background: 'var(--minimal-card-surface)',
      borderRadius: 'var(--minimal-card-radius)',
      boxShadow: '0 15px 35px var(--minimal-card-shadow-color)',
    },
  },
  typography: {
    headingFont: 'var(--font-heading, "Space Grotesk", sans-serif)',
    bodyFont: 'var(--font-body, "Space Grotesk", sans-serif)',
  },
  modifierScopes: {
    GLOBAL: {
      background: 'linear-gradient(120deg, rgba(59,130,246,0.27), rgba(59,130,246,0.12))',
      border: 'rgba(96,165,250,0.7)',
      foreground: '#dbeafe',
      glow: 'rgba(96,165,250,0.4)',
    },
    SESSION: {
      background: 'linear-gradient(120deg, rgba(16,185,129,0.24), rgba(16,185,129,0.1))',
      border: 'rgba(45,212,191,0.7)',
      foreground: '#ccfbf1',
      glow: 'rgba(45,212,191,0.34)',
    },
    LOCATION: {
      background: 'linear-gradient(120deg, rgba(234,179,8,0.24), rgba(234,179,8,0.08))',
      border: 'rgba(250,204,21,0.65)',
      foreground: '#fef3c7',
      glow: 'rgba(250,204,21,0.32)',
    },
    QUEST: {
      background: 'linear-gradient(120deg, rgba(168,85,247,0.24), rgba(168,85,247,0.08))',
      border: 'rgba(192,132,252,0.65)',
      foreground: '#f3e8ff',
      glow: 'rgba(192,132,252,0.3)',
    },
    RESIDENT: {
      background: 'linear-gradient(120deg, rgba(248,113,113,0.24), rgba(248,113,113,0.08))',
      border: 'rgba(248,113,113,0.65)',
      foreground: '#fee2e2',
      glow: 'rgba(248,113,113,0.3)',
    },
  },
  modifierStatus: {
    active: {
      background: 'rgba(16,185,129,0.15)',
      border: 'rgba(16,185,129,0.6)',
      foreground: '#bbf7d0',
    },
    expired: {
      background: 'rgba(71,85,105,0.25)',
      border: 'rgba(148,163,184,0.45)',
      foreground: '#e2e8f0',
    },
    upcoming: {
      background: 'rgba(59,130,246,0.12)',
      border: 'rgba(59,130,246,0.4)',
      foreground: '#bfdbfe',
    },
  },
  interactionColors: DEFAULT_INTERACTION_COLORS,
  interactionPhysics: DEFAULT_INTERACTION_PHYSICS,
  materialFeel: DEFAULT_MATERIAL_FEEL,
  audioHaptics: DEFAULT_AUDIO_HAPTICS,
  actionCardFrame: DEFAULT_ACTION_CARD_FRAME,
  actionHalo: DEFAULT_ACTION_HALO,
  progressInlay: DEFAULT_PROGRESS_INLAY,
  genericTypography: DEFAULT_GENERIC_TYPOGRAPHY,
  genericSpacing: DEFAULT_GENERIC_SPACING,
  genericBorder: DEFAULT_GENERIC_BORDER,
};

/**
 * Wanderlust preset with V8 Skin Architecture (eroded bronze borders, simmering obsidian layers).
 */
export const WANDERLUST_PRESET: StyleLabPreset = {
  name: 'Wanderlust',
  description: 'V8 Skin Architecture with eroded bronze borders, simmering obsidian layers, and SVG filters.',
  surfaces: {
    panel: {
      background: '#03030d',
      borderRadius: '12px',
    },
    card: {
      background: '#03030d',
      borderRadius: '12px',
    },
  },
  typography: {
    headingFont: 'var(--font-heading, "EB Garamond", Georgia, serif)',
    bodyFont: 'var(--font-body, "EB Garamond", Georgia, serif)',
  },
  modifierScopes: {
    GLOBAL: {
      background: 'linear-gradient(120deg, rgba(59,130,246,0.27), rgba(59,130,246,0.12))',
      border: 'rgba(96,165,250,0.7)',
      foreground: '#dbeafe',
      glow: 'rgba(96,165,250,0.4)',
    },
    SESSION: {
      background: 'linear-gradient(120deg, rgba(16,185,129,0.24), rgba(16,185,129,0.1))',
      border: 'rgba(45,212,191,0.7)',
      foreground: '#ccfbf1',
      glow: 'rgba(45,212,191,0.34)',
    },
    LOCATION: {
      background: 'linear-gradient(120deg, rgba(234,179,8,0.24), rgba(234,179,8,0.08))',
      border: 'rgba(250,204,21,0.65)',
      foreground: '#fef3c7',
      glow: 'rgba(250,204,21,0.32)',
    },
    QUEST: {
      background: 'linear-gradient(120deg, rgba(168,85,247,0.24), rgba(168,85,247,0.08))',
      border: 'rgba(192,132,252,0.65)',
      foreground: '#f3e8ff',
      glow: 'rgba(192,132,252,0.3)',
    },
    RESIDENT: {
      background: 'linear-gradient(120deg, rgba(248,113,113,0.24), rgba(248,113,113,0.08))',
      border: 'rgba(248,113,113,0.65)',
      foreground: '#fee2e2',
      glow: 'rgba(248,113,113,0.3)',
    },
  },
  modifierStatus: {
    active: {
      background: 'rgba(16,185,129,0.15)',
      border: 'rgba(16,185,129,0.6)',
      foreground: '#bbf7d0',
    },
    expired: {
      background: 'rgba(71,85,105,0.25)',
      border: 'rgba(148,163,184,0.45)',
      foreground: '#e2e8f0',
    },
    upcoming: {
      background: 'rgba(59,130,246,0.12)',
      border: 'rgba(59,130,246,0.4)',
      foreground: '#bfdbfe',
    },
  },
  interactionColors: {
    accentPrimary: '#a05c18', // Bronze
    accentSecondary: '#c8a030', // Gold
    success: '#0f735f', // Emerald/Teal shadow
    warning: 'rgba(251,191,36,1)',
    danger: 'rgba(248,113,113,1)',
    focusRing: 'rgba(59,130,246,0.85)',
  },
  interactionPhysics: DEFAULT_INTERACTION_PHYSICS,
  materialFeel: {
    surfaceSheen: 'animate-simmering-obsidian',
    edgeTreatment: 'url(#v8-bronze-grit)',
    grain: 'url(#v8-obsidian-grain)',
    shadowDepth: 'var(--shadow-deep)',
    highlightSheen: 'var(--acc-glow)',
    density: 'heavy',
    frameTreatment: 'chiseled-bronze-frame',
    detail: {
      microTexture: 'var(--detail-texture, linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%))',
      edgeGlow: 'rgba(200, 160, 48, 0.3)',
      surfaceReflection: 'rgba(255, 255, 255, 0.08)',
      depthLayers: 'var(--depth-layers, 3)',
      metallicFlakes: 'var(--metallic-flakes, radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%))',
    },
  },
  audioHaptics: DEFAULT_AUDIO_HAPTICS,
  actionCardFrame: DEFAULT_ACTION_CARD_FRAME,
  actionHalo: DEFAULT_ACTION_HALO,
  progressInlay: DEFAULT_PROGRESS_INLAY,
  genericTypography: DEFAULT_GENERIC_TYPOGRAPHY,
  genericSpacing: DEFAULT_GENERIC_SPACING,
  genericBorder: DEFAULT_GENERIC_BORDER,
};
