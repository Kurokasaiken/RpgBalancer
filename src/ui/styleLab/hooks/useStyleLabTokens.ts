import { useMemo } from 'react';
import {
  DEFAULT_STYLE_LAB_PRESET,
  WANDERLUST_PRESET,
  type ModifierScope,
  type ModifierScopePalette,
  type ModifierStatusPalette,
  type StyleLabPreset,
  type ActionCardFrameTokens,
  type ActionHaloTokens,
} from '../tokens/defaultStyleLabPreset';
import { WANDERLUST_STYLE_LAB_PRESET } from '../tokens/wanderlustStyleLabPreset';
import { WANDERLUST_PRESETS } from '../presets/wanderlust';

const PRESET_TOKEN_OVERRIDES: Record<string, Partial<StyleLabPreset>> = {
  wanderlust: WANDERLUST_STYLE_LAB_PRESET,
  'wanderlust-v8': WANDERLUST_PRESET,
  'wanderlust-wilderness': WANDERLUST_PRESETS.wilderness,
  'wanderlust-empire': WANDERLUST_PRESETS.empire,
};

/**
 * Shape returned by the Style Lab tokens hook.
 */
export interface StyleLabTokens {
  preset: StyleLabPreset;
  /**
   * CSS variables derived from the preset to be applied on Style Lab surfaces.
   */
  cssVars: Record<string, string>;
  /** Palette keyed by registry scopes for quick lookup inside UI components. */
  modifierScopes: Record<ModifierScope, ModifierScopePalette>;
  /** Palette for lifecycle/status badges. */
  modifierStatus: {
    active: ModifierStatusPalette;
    expired: ModifierStatusPalette;
    upcoming: ModifierStatusPalette;
  };
  /** Interaction color tokens surfaced for consumers that cannot import TS modules. */
  interactionColors: StyleLabPreset['interactionColors'];
  /** Physics tokens describing lift, spring, and glow behaviour. */
  interactionPhysics: StyleLabPreset['interactionPhysics'];
  /** Material feel metadata for shader layers. */
  materialFeel: StyleLabPreset['materialFeel'];
  /** Audio + haptic defaults for tactile feedback. */
  audioHaptics: StyleLabPreset['audioHaptics'];
  /** ActionCard frame tokens for base element structure. */
  actionCardFrame: StyleLabPreset['actionCardFrame'];
  /** ActionHalo tokens for map POI glowing effects. */
  actionHalo: StyleLabPreset['actionHalo'];
  /** Progress inlay tokens for progress bars and completion indicators. */
  progressInlay: StyleLabPreset['progressInlay'];
  /** Metadata for preset identification and pillar selection (compatibility layer). */
  meta: {
    presetId: string;
    pillar: 'wilderness' | 'empire' | 'frontier' | string;
  };
  /** PG Card skin configuration (compatibility layer). */
  pgCardSkin: {
    enabled: boolean;
  };
}

export interface UseStyleLabTokensOptions {
  /**
   * Optional preset override. When provided it will be shallow merged over the
   * default preset. This enables future Style Lab UI sliders/toggles to supply
   * customized palettes without rewriting consumers.
   */
  presetOverride?: Partial<StyleLabPreset>;
  /**
   * Identifier of the preset tokens to pull from the registry (e.g. wanderlust).
   */
  presetId?: string;
}

/**
 * Hook exposing Style Lab preset tokens (palette, typography, modifier scopes).
 *
 * TODO(style-lab-flexibility): once the flexibility controls land, wire their
 * persisted state into the `presetOverride` parameter so every Style Lab
 * surface—including StatModifierDisplay—responds to scope palette edits.
 */
export function useStyleLabTokens(options?: UseStyleLabTokensOptions): StyleLabTokens {
  return useMemo(() => {
    const presetById = options?.presetId ? PRESET_TOKEN_OVERRIDES[options.presetId] : undefined;
    const mergedPreset: StyleLabPreset = {
      ...DEFAULT_STYLE_LAB_PRESET,
      ...presetById,
      ...options?.presetOverride,
      surfaces: {
        ...DEFAULT_STYLE_LAB_PRESET.surfaces,
        ...presetById?.surfaces,
        ...options?.presetOverride?.surfaces,
      },
      typography: {
        ...DEFAULT_STYLE_LAB_PRESET.typography,
        ...presetById?.typography,
        ...options?.presetOverride?.typography,
      },
      modifierScopes: {
        ...DEFAULT_STYLE_LAB_PRESET.modifierScopes,
        ...presetById?.modifierScopes,
        ...options?.presetOverride?.modifierScopes,
      },
      modifierStatus: {
        ...DEFAULT_STYLE_LAB_PRESET.modifierStatus,
        ...presetById?.modifierStatus,
        ...options?.presetOverride?.modifierStatus,
      },
      interactionColors: {
        ...DEFAULT_STYLE_LAB_PRESET.interactionColors,
        ...presetById?.interactionColors,
        ...options?.presetOverride?.interactionColors,
      },
      interactionPhysics: {
        ...DEFAULT_STYLE_LAB_PRESET.interactionPhysics,
        ...presetById?.interactionPhysics,
        ...options?.presetOverride?.interactionPhysics,
      },
      materialFeel: {
        ...DEFAULT_STYLE_LAB_PRESET.materialFeel,
        ...presetById?.materialFeel,
        ...options?.presetOverride?.materialFeel,
      },
      audioHaptics: {
        ...DEFAULT_STYLE_LAB_PRESET.audioHaptics,
        ...presetById?.audioHaptics,
        ...options?.presetOverride?.audioHaptics,
      },
      actionCardFrame: {
        ...DEFAULT_STYLE_LAB_PRESET.actionCardFrame,
        ...presetById?.actionCardFrame,
        ...options?.presetOverride?.actionCardFrame,
      },
      actionHalo: {
        ...DEFAULT_STYLE_LAB_PRESET.actionHalo,
        ...presetById?.actionHalo,
        ...options?.presetOverride?.actionHalo,
      },
      progressInlay: {
        ...DEFAULT_STYLE_LAB_PRESET.progressInlay,
        ...presetById?.progressInlay,
        ...options?.presetOverride?.progressInlay,
      },
    };

    const cssVars: Record<string, string> = {
      '--stylelab-heading-font': mergedPreset.typography.headingFont,
      '--stylelab-body-font': mergedPreset.typography.bodyFont,
      '--stylelab-panel-border': String(mergedPreset.surfaces.panel.borderColor ?? ''),
      '--stylelab-panel-background': String(mergedPreset.surfaces.panel.background ?? ''),
      '--stylelab-card-border': String(mergedPreset.surfaces.card.borderColor ?? ''),
      '--stylelab-card-background': String(mergedPreset.surfaces.card.background ?? ''),
      '--stylelab-accent-primary': mergedPreset.interactionColors.accentPrimary,
      '--stylelab-accent-secondary': mergedPreset.interactionColors.accentSecondary,
      '--stylelab-focus-ring': mergedPreset.interactionColors.focusRing,
      '--stylelab-success': mergedPreset.interactionColors.success,
      '--stylelab-success-soft': mergedPreset.interactionColors.success.replace('0.55', '0.30').replace('1)', '0.30)'),
      '--stylelab-warning': mergedPreset.interactionColors.warning,
      '--stylelab-danger': mergedPreset.interactionColors.danger,
      '--stylelab-shadow-depth-token': mergedPreset.materialFeel.shadowDepth,
      '--stylelab-highlight-sheen': mergedPreset.materialFeel.highlightSheen,
      '--stylelab-surface-sheen': mergedPreset.materialFeel.surfaceSheen,
      '--stylelab-material-grain': mergedPreset.materialFeel.grain,
      '--stylelab-material-edge-treatment': mergedPreset.materialFeel.edgeTreatment,
      '--stylelab-base-obsidian': String(mergedPreset.surfaces.panel.background ?? '#03030d'),
      '--stylelab-accent-primary-light': mergedPreset.interactionColors.accentPrimary === '#a05c18' ? '#e4b048' : mergedPreset.interactionColors.accentPrimary,
      '--stylelab-accent-primary-dark': mergedPreset.interactionColors.accentPrimary === '#a05c18' ? '#602c08' : mergedPreset.interactionColors.accentPrimary,
      '--stylelab-physics-lift-scale': String(mergedPreset.interactionPhysics.liftScale),
      '--stylelab-physics-glow': String(mergedPreset.interactionPhysics.slotGlowIntensity),
      // ActionCard frame tokens
      '--stylelab-action-card-border': mergedPreset.actionCardFrame.frameBorder,
      '--stylelab-action-card-bg': mergedPreset.actionCardFrame.frameBackground,
      '--stylelab-action-card-radius': mergedPreset.actionCardFrame.frameBorderRadius,
      '--stylelab-action-card-shadow': mergedPreset.actionCardFrame.frameBoxShadow,
      '--stylelab-action-card-padding': mergedPreset.actionCardFrame.framePadding,
      '--stylelab-action-card-min-height': mergedPreset.actionCardFrame.frameMinHeight,
      '--stylelab-action-card-transition': mergedPreset.actionCardFrame.frameTransition,
      // ActionHalo tokens
      '--stylelab-action-halo-color': mergedPreset.actionHalo.haloColor,
      '--stylelab-action-halo-glow-intensity': String(mergedPreset.actionHalo.haloGlowIntensity),
      '--stylelab-action-halo-size': mergedPreset.actionHalo.haloSize,
      '--stylelab-action-halo-border-width': mergedPreset.actionHalo.haloBorderWidth,
      '--stylelab-action-halo-pulse-duration': mergedPreset.actionHalo.haloPulseDuration,
      '--stylelab-action-halo-pulse-easing': mergedPreset.actionHalo.haloPulseEasing,
      '--stylelab-action-halo-shadow-blur': mergedPreset.actionHalo.haloShadowBlur,
      '--stylelab-action-halo-shadow-color': mergedPreset.actionHalo.haloShadowColor,
      // Progress inlay tokens
      '--stylelab-progress-bg': mergedPreset.progressInlay.progressBackground,
      '--stylelab-progress-fill': mergedPreset.progressInlay.progressFill,
      '--stylelab-progress-border': mergedPreset.progressInlay.progressBorder,
      '--stylelab-progress-radius': mergedPreset.progressInlay.progressBorderRadius,
      '--stylelab-progress-height': mergedPreset.progressInlay.progressHeight,
      '--stylelab-progress-transition': mergedPreset.progressInlay.progressTransition,
      '--stylelab-progress-glow': mergedPreset.progressInlay.progressGlowColor,
      '--stylelab-progress-glow-intensity': String(mergedPreset.progressInlay.progressGlowIntensity),
      // Material feel detail tokens
      '--stylelab-detail-texture': mergedPreset.materialFeel.detail.microTexture,
      '--stylelab-detail-edge-glow': mergedPreset.materialFeel.detail.edgeGlow,
      '--stylelab-detail-surface-reflection': mergedPreset.materialFeel.detail.surfaceReflection,
      '--stylelab-detail-depth-layers': mergedPreset.materialFeel.detail.depthLayers,
      '--stylelab-detail-metallic-flakes': mergedPreset.materialFeel.detail.metallicFlakes,
    };

    return {
      preset: mergedPreset,
      cssVars,
      modifierScopes: mergedPreset.modifierScopes,
      modifierStatus: mergedPreset.modifierStatus,
      interactionColors: mergedPreset.interactionColors,
      interactionPhysics: mergedPreset.interactionPhysics,
      materialFeel: mergedPreset.materialFeel,
      audioHaptics: mergedPreset.audioHaptics,
      actionCardFrame: mergedPreset.actionCardFrame,
      actionHalo: mergedPreset.actionHalo,
      progressInlay: mergedPreset.progressInlay,
      meta: {
        presetId: options?.presetId || 'default',
        pillar: 'wilderness', // Default pillar for compatibility
      },
      pgCardSkin: {
        enabled: true, // Default enabled for compatibility
      },
    };
  }, [options?.presetId, options?.presetOverride]);
}

/**
 * Helper function to get ActionCard frame tokens for a specific preset.
 * 
 * @param presetId - Optional preset identifier (e.g., 'wanderlust')
 * @param overrides - Optional token overrides for the frame
 * @returns ActionCardFrameTokens merged from preset and overrides
 */
export function getActionCardFeel(
  presetId?: string,
  overrides?: Partial<ActionCardFrameTokens>
): ActionCardFrameTokens {
  const presetById = presetId ? PRESET_TOKEN_OVERRIDES[presetId] : undefined;
  const presetFrame = presetById?.actionCardFrame ?? DEFAULT_STYLE_LAB_PRESET.actionCardFrame;
  
  return {
    ...presetFrame,
    ...overrides,
  };
}

/**
 * Helper function to get ActionHalo tokens for a specific preset.
 * 
 * @param presetId - Optional preset identifier (e.g., 'wanderlust')
 * @param overrides - Optional token overrides for the halo
 * @returns ActionHaloTokens merged from preset and overrides
 */
export function getActionHaloTokens(
  presetId?: string,
  overrides?: Partial<ActionHaloTokens>
): ActionHaloTokens {
  const presetById = presetId ? PRESET_TOKEN_OVERRIDES[presetId] : undefined;
  const presetHalo = presetById?.actionHalo ?? DEFAULT_STYLE_LAB_PRESET.actionHalo;
  
  return {
    ...presetHalo,
    ...overrides,
  };
}
