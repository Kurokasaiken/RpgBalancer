/**
 * Wanderlust Style Lab Preset
 * 
 * Single module preset implementing dual pillar Wilderness/Empire themes
 * for ActionCard frame, ActionHalo, and detail card styling.
 * 
 * This preset extends the base Style Lab token system with Wanderlust-specific
 * visual tokens aligned with the art direction (Dark Luxury + basalt/oro).
 */
import type { StyleLabPreset } from '../tokens/defaultStyleLabPreset';

/**
 * Wanderlust pillar identifiers for theme switching
 */
export type WanderlustPillar = 'wilderness' | 'empire';

/**
 * Wanderlust-specific token extensions for map halo and detail card styling
 */
export interface WanderlustTokens {
  /** Map halo tokens for POI indicators (Cultist Simulator style) */
  mapHalo: {
    baseColor: string;
    glowColor: string;
    pulseIntensity: number;
    ringWidth: number;
    shadowBlur: number;
    transitionDuration: string;
  };
  /** Detail card tokens for ActionCard close-up views (Dark Luxury style) */
  detailCard: {
    frameGradient: string;
    borderGlow: string;
    backgroundTexture: string;
    metallicAccent: string;
    shadowDepth: string;
    cornerRadius: string;
  };
}

/**
 * Wanderlust preset configuration with pillar-specific variants
 */
export interface WanderlustPresetConfig {
  pillar: WanderlustPillar;
  tokens: WanderlustTokens;
}

/**
 * Wilderness pillar tokens - organic, natural tones
 */
const WILDERNESS_TOKENS: WanderlustTokens = {
  mapHalo: {
    baseColor: 'rgba(58, 215, 80, 0.7)', // Green glow
    glowColor: 'rgba(168, 200, 168, 0.4)',
    pulseIntensity: 0.6,
    ringWidth: 2,
    shadowBlur: 8,
    transitionDuration: '2.5s',
  },
  detailCard: {
    frameGradient: 'linear-gradient(135deg, #2a1810 0%, #5a3c28 50%, #7a5438 100%)',
    borderGlow: 'rgba(58, 215, 80, 0.3)',
    backgroundTexture: 'linear-gradient(45deg, rgba(44,116,66,0.1) 25%, transparent 25%, transparent 75%, rgba(44,116,66,0.1) 75%)',
    metallicAccent: 'linear-gradient(120deg, #d8ffd8 0%, #72ee82 40%, #1a7830 100%)',
    shadowDepth: '0 12px 32px rgba(26, 39, 30, 0.6)',
    cornerRadius: '14px',
  },
};

/**
 * Empire pillar tokens - imperial, refined tones
 */
const EMPIRE_TOKENS: WanderlustTokens = {
  mapHalo: {
    baseColor: 'rgba(216, 144, 64, 0.7)', // Gold glow
    glowColor: 'rgba(255, 238, 148, 0.4)',
    pulseIntensity: 0.8,
    ringWidth: 3,
    shadowBlur: 12,
    transitionDuration: '2s',
  },
  detailCard: {
    frameGradient: 'linear-gradient(135deg, #0a0402 0%, #3a1c08 50%, #5a2c18 100%)',
    borderGlow: 'rgba(216, 144, 64, 0.4)',
    backgroundTexture: 'linear-gradient(45deg, rgba(192,112,40,0.1) 25%, transparent 25%, transparent 75%, rgba(192,112,40,0.1) 75%)',
    metallicAccent: 'linear-gradient(120deg, #fce890 0%, #e4b048 16%, #a05c18 52%, #602c08 76%, #341604 100%)',
    shadowDepth: '0 16px 40px rgba(10, 4, 2, 0.7)',
    cornerRadius: '12px',
  },
};

/**
 * Base Wanderlust preset configuration
 */
const WANDERLUST_BASE_CONFIG: Omit<StyleLabPreset, 'name' | 'description'> = {
  surfaces: {
    panel: {
      borderColor: 'var(--wanderlust-panel-border, rgba(192, 112, 40, 0.3))',
      background: 'var(--wanderlust-panel-bg, linear-gradient(135deg, rgba(10, 4, 2, 0.95) 0%, rgba(26, 12, 6, 0.98) 100%))',
      borderRadius: 'var(--wanderlust-panel-radius, 16px)',
      boxShadow: 'var(--wanderlust-panel-shadow, 0 20px 60px rgba(0, 0, 0, 0.5))',
    },
    card: {
      borderColor: 'var(--wanderlust-card-border, rgba(192, 112, 40, 0.4))',
      background: 'var(--wanderlust-card-bg, linear-gradient(135deg, rgba(15, 8, 4, 0.98) 0%, rgba(30, 16, 8, 0.99) 100%))',
      borderRadius: 'var(--wanderlust-card-radius, 12px)',
      boxShadow: 'var(--wanderlust-card-shadow, 0 12px 32px rgba(0, 0, 0, 0.4))',
    },
  },
  typography: {
    headingFont: 'var(--wanderlust-heading-font, "Cinzel", serif)',
    bodyFont: 'var(--wanderlust-body-font, "Crimson Text", serif)',
  },
  modifierScopes: {
    GLOBAL: {
      background: 'linear-gradient(120deg, rgba(216, 144, 64, 0.2), rgba(216, 144, 64, 0.08))',
      border: 'rgba(255, 238, 148, 0.6)',
      foreground: '#fef3c7',
      glow: 'rgba(255, 238, 148, 0.3)',
    },
    SESSION: {
      background: 'linear-gradient(120deg, rgba(58, 215, 80, 0.18), rgba(58, 215, 80, 0.06))',
      border: 'rgba(168, 200, 168, 0.6)',
      foreground: '#f0fdf4',
      glow: 'rgba(168, 200, 168, 0.25)',
    },
    LOCATION: {
      background: 'linear-gradient(120deg, rgba(139, 92, 56, 0.22), rgba(139, 92, 56, 0.08))',
      border: 'rgba(180, 136, 104, 0.65)',
      foreground: '#fef7ed',
      glow: 'rgba(180, 136, 104, 0.28)',
    },
    QUEST: {
      background: 'linear-gradient(120deg, rgba(192, 112, 40, 0.24), rgba(192, 112, 40, 0.08))',
      border: 'rgba(216, 144, 64, 0.7)',
      foreground: '#fffbeb',
      glow: 'rgba(216, 144, 64, 0.32)',
    },
    RESIDENT: {
      background: 'linear-gradient(120deg, rgba(58, 215, 80, 0.2), rgba(58, 215, 80, 0.08))',
      border: 'rgba(168, 200, 168, 0.65)',
      foreground: '#f0fdf4',
      glow: 'rgba(168, 200, 168, 0.3)',
    },
  },
  modifierStatus: {
    active: {
      background: 'rgba(58, 215, 80, 0.15)',
      border: 'rgba(58, 215, 80, 0.6)',
      foreground: '#dcfce7',
    },
    expired: {
      background: 'rgba(71, 85, 105, 0.25)',
      border: 'rgba(148, 163, 184, 0.45)',
      foreground: '#e2e8f0',
    },
    upcoming: {
      background: 'rgba(216, 144, 64, 0.12)',
      border: 'rgba(216, 144, 64, 0.4)',
      foreground: '#fef3c7',
    },
  },
  interactionColors: {
    accentPrimary: 'var(--wanderlust-accent-primary, #d87706)',
    accentSecondary: 'var(--wanderlust-accent-secondary, #92400e)',
    success: 'var(--wanderlust-success, #16a34a)',
    warning: 'var(--wanderlust-warning, #ea580c)',
    danger: 'var(--wanderlust-danger, #dc2626)',
    focusRing: 'var(--wanderlust-focus, rgba(216, 144, 64, 0.6))',
  },
  interactionPhysics: {
    liftScale: 1.05,
    springStiffness: 180,
    springDamping: 16,
    mass: 1.2,
    tiltIntensity: 0.15,
    buttonSquash: 0.88,
    buttonLift: 8,
    slotGlowIntensity: 0.7,
  },
  materialFeel: {
    surfaceSheen: 'wanderlust-basalt',
    edgeTreatment: 'weathered-bronze',
    grain: 'organic-texture',
    shadowDepth: 'var(--wanderlust-shadow-deep)',
    highlightSheen: 'var(--wanderlust-highlight-gold)',
    density: 'heavy',
    detail: {
      microTexture: 'var(--wanderlust-micro, linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%))',
      edgeGlow: 'var(--wanderlust-edge, rgba(216, 144, 64, 0.2))',
      surfaceReflection: 'var(--wanderlust-reflection, rgba(255, 255, 255, 0.06))',
      depthLayers: 'var(--wanderlust-depth, 4)',
      metallicFlakes: 'var(--wanderlust-flakes, radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 60%))',
    },
  },
  audioHaptics: {
    audioProfileId: 'wanderlust-immersive',
    masterVolume: 0.8,
    effectVolume: 0.9,
    reverbPreset: 'ancient-hall',
    hapticPreset: 'wanderlust-rich',
    vibrationIntensity: 0.7,
    responseDelayMs: 50,
  },
  actionCardFrame: {
    frameBorder: 'var(--wanderlust-frame-border, rgba(192, 112, 40, 0.5))',
    frameBackground: 'var(--wanderlust-frame-bg, linear-gradient(135deg, rgba(10, 4, 2, 0.98) 0%, rgba(26, 12, 6, 0.99) 100%))',
    frameBorderRadius: 'var(--wanderlust-frame-radius, 12px)',
    frameBoxShadow: 'var(--wanderlust-frame-shadow, 0 16px 48px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(216, 144, 64, 0.3))',
    framePadding: 'var(--wanderlust-frame-padding, 20px)',
    frameMinHeight: 'var(--wanderlust-frame-min-height, 100px)',
    frameTransition: 'var(--wanderlust-frame-transition, all 0.4s cubic-bezier(0.4, 0, 0.2, 1))',
  },
  actionHalo: {
    haloColor: 'var(--wanderlust-halo-color, rgba(216, 144, 64, 0.7))',
    haloGlowIntensity: 0.8,
    haloSize: 'var(--wanderlust-halo-size, 56px)',
    haloBorderWidth: 'var(--wanderlust-halo-border-width, 3px)',
    haloPulseDuration: 'var(--wanderlust-halo-pulse-duration, 2.5s)',
    haloPulseEasing: 'var(--wanderlust-halo-pulse-easing, ease-in-out)',
    haloShadowBlur: 'var(--wanderlust-halo-shadow-blur, 16px)',
    haloShadowColor: 'var(--wanderlust-halo-shadow-color, rgba(216, 144, 64, 0.4))',
  },
  progressInlay: {
    progressBackground: 'var(--wanderlust-progress-bg, rgba(26, 12, 6, 0.8))',
    progressFill: 'var(--wanderlust-progress-fill, linear-gradient(90deg, #d87706 0%, #f59e0b 50%, #d87706 100%))',
    progressBorder: 'var(--wanderlust-progress-border, rgba(192, 112, 40, 0.4))',
    progressBorderRadius: 'var(--wanderlust-progress-radius, 8px)',
    progressHeight: 'var(--wanderlust-progress-height, 8px)',
    progressTransition: 'var(--wanderlust-progress-transition, width 0.8s cubic-bezier(0.4, 0, 0.2, 1))',
    progressGlowColor: 'var(--wanderlust-progress-glow, rgba(216, 144, 64, 0.6))',
    progressGlowIntensity: 0.7,
  },
};

/**
 * Creates a Wanderlust preset for the specified pillar
 */
export function createWanderlustPreset(pillar: WanderlustPillar): StyleLabPreset {
  const tokens = pillar === 'wilderness' ? WILDERNESS_TOKENS : EMPIRE_TOKENS;
  
  return {
    name: `Wanderlust ${pillar === 'wilderness' ? 'Wilderness' : 'Empire'}`,
    description: `Wanderlust preset with ${pillar} theme - Dark Luxury styling with ${pillar} accents`,
    ...WANDERLUST_BASE_CONFIG,
    
    // Apply pillar-specific overrides
    actionCardFrame: {
      ...WANDERLUST_BASE_CONFIG.actionCardFrame,
      frameBorder: tokens.detailCard.borderGlow,
      frameBackground: tokens.detailCard.frameGradient,
      frameBoxShadow: `0 16px 48px rgba(0, 0, 0, 0.6), 0 4px 12px ${tokens.detailCard.borderGlow}`,
    },
    actionHalo: {
      ...WANDERLUST_BASE_CONFIG.actionHalo,
      haloColor: tokens.mapHalo.baseColor,
      haloGlowIntensity: tokens.mapHalo.pulseIntensity,
      haloBorderWidth: `${tokens.mapHalo.ringWidth}px`,
      haloPulseDuration: tokens.mapHalo.transitionDuration,
      haloShadowBlur: `${tokens.mapHalo.shadowBlur}px`,
      haloShadowColor: tokens.mapHalo.glowColor,
    },
    progressInlay: {
      ...WANDERLUST_BASE_CONFIG.progressInlay,
      progressFill: tokens.detailCard.metallicAccent,
      progressGlowColor: tokens.mapHalo.baseColor,
    },
    materialFeel: {
      ...WANDERLUST_BASE_CONFIG.materialFeel,
      detail: {
        ...WANDERLUST_BASE_CONFIG.materialFeel.detail,
        microTexture: tokens.detailCard.backgroundTexture,
        edgeGlow: tokens.detailCard.borderGlow,
        metallicFlakes: tokens.detailCard.metallicAccent,
      },
    },
  };
}

/**
 * Wanderlust preset configurations for both pillars
 */
export const WANDERLUST_PRESETS: Record<WanderlustPillar, StyleLabPreset> = {
  wilderness: createWanderlustPreset('wilderness'),
  empire: createWanderlustPreset('empire'),
};

/**
 * Applies Wanderlust preset configuration to a base config
 * 
 * @param baseConfig - Base configuration to extend
 * @param pillar - Wanderlust pillar (wilderness or empire)
 * @returns Enhanced configuration with Wanderlust styling
 */
export function applyWanderlustPreset<T extends Record<string, unknown>>(
  baseConfig: T,
  pillar: WanderlustPillar
): T & { wanderlust: WanderlustPresetConfig } {
  const tokens = pillar === 'wilderness' ? WILDERNESS_TOKENS : EMPIRE_TOKENS;
  
  return {
    ...baseConfig,
    wanderlust: {
      pillar,
      tokens,
    },
  };
}

/**
 * Get Wanderlust tokens for a specific pillar
 */
export function getWanderlustTokens(pillar: WanderlustPillar): WanderlustTokens {
  return pillar === 'wilderness' ? WILDERNESS_TOKENS : EMPIRE_TOKENS;
}

/**
 * Sample ActionCard configuration for Wanderlust demo
 */
export const createWanderlustActionCardDemo = (pillar: WanderlustPillar) => {
  const tokens = getWanderlustTokens(pillar);
  
  return {
    frame: {
      background: tokens.detailCard.frameGradient,
      border: tokens.detailCard.borderGlow,
      borderRadius: tokens.detailCard.cornerRadius,
      shadow: tokens.detailCard.shadowDepth,
    },
    halo: {
      color: tokens.mapHalo.baseColor,
      glow: tokens.mapHalo.glowColor,
      intensity: tokens.mapHalo.pulseIntensity,
      width: `${tokens.mapHalo.ringWidth}px`,
    },
    progress: {
      fill: tokens.detailCard.metallicAccent,
      glow: tokens.mapHalo.baseColor,
      height: '8px',
      radius: '4px',
    },
  };
};
