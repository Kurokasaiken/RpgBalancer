import type { StyleLabPillar } from './skinSchemas';
import { getSkinPresetConfig } from './skinConfigRegistry';

/**
 * Configuration interface for ActiveHUD skin upgrades
 */
export interface ActiveHUDSkinConfig {
  /** Skin preset identifier */
  skinPresetId: string;
  /** Style Lab pillar for variant styling */
  pillar: StyleLabPillar;
  /** Component theme identifier from registry */
  componentTheme: string;
  /** Value change configuration */
  valueChangeConfig: {
    /** Animation type for value changes */
    animationType: 'pulse' | 'slide' | 'glow' | 'none';
    /** Animation duration in milliseconds */
    duration: number;
    /** Animation easing function */
    easing: string;
    /** Color token for positive changes */
    positiveColorToken: string;
    /** Color token for negative changes */
    negativeColorToken: string;
  };
  /** Color tokens for different HUD elements */
  colors: {
    /** Background token */
    backgroundToken: string;
    /** Border token */
    borderToken: string;
    /** Text token */
    textToken: string;
    /** Accent token */
    accentToken: string;
    /** Success token */
    successToken: string;
    /** Warning token */
    warningToken: string;
    /** Error token */
    errorToken: string;
  };
  /** Typography configuration */
  typography: {
    /** HUD title font token */
    titleFont: string;
    /** HUD label font token */
    labelFont: string;
    /** HUD value font token */
    valueFont: string;
    /** HUD caption font token */
    captionFont: string;
  };
  /** Spacing configuration */
  spacing: {
    /** Container padding token */
    containerPadding: string;
    /** Item spacing token */
    itemSpacing: string;
    /** Section spacing token */
    sectionSpacing: string;
  };
  /** Visual effects configuration */
  effects: {
    /** Glow effect token */
    glowToken: string;
    /** Shadow effect token */
    shadowToken: string;
    /** Blur effect token */
    blurToken: string;
  };
}

/**
 * Default ActiveHUD skin configuration based on Minimal Frontier preset
 */
export const DEFAULT_ACTIVE_HUD_SKIN_CONFIG: ActiveHUDSkinConfig = {
  skinPresetId: 'minimal_frontier',
  pillar: 'frontier',
  componentTheme: 'minimalFrontier.hud.line',
  valueChangeConfig: {
    animationType: 'pulse',
    duration: 300,
    easing: 'ease-out',
    positiveColorToken: 'colors.value.positive',
    negativeColorToken: 'colors.value.negative',
  },
  colors: {
    backgroundToken: 'colors.hud.background',
    borderToken: 'colors.hud.border',
    textToken: 'colors.hud.text',
    accentToken: 'colors.hud.accent',
    successToken: 'colors.status.success',
    warningToken: 'colors.status.warning',
    errorToken: 'colors.status.error',
  },
  typography: {
    titleFont: 'typography.hud.title',
    labelFont: 'typography.hud.label',
    valueFont: 'typography.hud.value',
    captionFont: 'typography.hud.caption',
  },
  spacing: {
    containerPadding: 'spacing.hud.container',
    itemSpacing: 'spacing.hud.item',
    sectionSpacing: 'spacing.hud.section',
  },
  effects: {
    glowToken: 'effects.hud.glow',
    shadowToken: 'effects.hud.shadow',
    blurToken: 'effects.hud.blur',
  },
};

/**
 * Creates ActiveHUD skin configuration from preset and pillar
 */
export function createActiveHUDSkinConfig(
  skinPresetId: string,
  pillar: StyleLabPillar
): ActiveHUDSkinConfig {
  const preset = getSkinPresetConfig(skinPresetId);
  const componentTheme = preset.componentThemes.hud;

  // Extract tokens from preset based on pillar
  const palette = preset.palette;
  const interactionPhysics = preset.interactionPhysics;

  return {
    skinPresetId,
    pillar,
    componentTheme,
    valueChangeConfig: {
      animationType: 'pulse', // Default animation
      duration: 300,
      easing: 'ease-out',
      positiveColorToken: palette.accent,
      negativeColorToken: palette.text,
    },
    colors: {
      backgroundToken: palette.background,
      borderToken: palette.primary,
      textToken: palette.text,
      accentToken: palette.accent,
      successToken: palette.accent,
      warningToken: palette.glow,
      errorToken: palette.text,
    },
    typography: {
      titleFont: 'typography.hud.title',
      labelFont: 'typography.hud.label',
      valueFont: 'typography.hud.value',
      captionFont: 'typography.hud.caption',
    },
    spacing: {
      containerPadding: 'spacing.hud.container',
      itemSpacing: 'spacing.hud.item',
      sectionSpacing: 'spacing.hud.section',
    },
    effects: {
      glowToken: palette.glow,
      shadowToken: 'effects.shadow.soft',
      blurToken: 'effects.blur.subtle',
    },
  };
}

/**
 * Validates ActiveHUD skin configuration
 */
export function validateActiveHUDSkinConfig(config: ActiveHUDSkinConfig): boolean {
  return (
    !!config.skinPresetId &&
    !!config.pillar &&
    !!config.componentTheme &&
    !!config.valueChangeConfig.animationType &&
    !!config.colors.backgroundToken &&
    !!config.typography.titleFont &&
    !!config.spacing.containerPadding
  );
}
