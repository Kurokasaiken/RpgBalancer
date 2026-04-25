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
};
