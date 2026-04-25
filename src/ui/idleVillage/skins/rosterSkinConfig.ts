import type { StyleLabPillar } from './skinSchemas';
import { getSkinPresetConfig } from './skinConfigRegistry';

/**
 * Configuration interface for VillageRosterSection skin wrapper
 */
export interface RosterSkinConfig {
  /** Skin preset identifier */
  skinPresetId: string;
  /** Style Lab pillar for variant styling */
  pillar: StyleLabPillar;
  /** Component theme identifier from registry */
  componentTheme: string;
  /** Frame styling configuration */
  frame: {
    /** Border token key */
    borderToken: string;
    /** Background token key */
    backgroundToken: string;
    /** Optional shadow token */
    shadowToken?: string;
    /** Border radius token */
    radiusToken: string;
  };
  /** Typography configuration */
  typography: {
    /** Heading font token */
    headingToken: string;
    /** Body font token */
    bodyToken: string;
    /** Caption font token */
    captionToken: string;
  };
  /** Spacing configuration */
  spacing: {
    /** Container padding token */
    containerPadding: string;
    /** Section spacing token */
    sectionSpacing: string;
    /** Item spacing token */
    itemSpacing: string;
  };
  /** Visual effects configuration */
  effects: {
    /** Glow effect when active */
    glowToken?: string;
    /** Hover state token */
    hoverToken?: string;
    /** Focus ring token */
    focusToken?: string;
  };
}

/**
 * Default roster skin configuration based on Minimal Frontier preset
 */
export const DEFAULT_ROSTER_SKIN_CONFIG: RosterSkinConfig = {
  skinPresetId: 'minimal_frontier',
  pillar: 'frontier',
  componentTheme: 'minimalFrontier.roster.clean-panel',
  frame: {
    borderToken: 'colors.border.default',
    backgroundToken: 'colors.background.primary',
    shadowToken: 'shadows.panel.soft',
    radiusToken: 'borderRadius.panel.default',
  },
  typography: {
    headingToken: 'typography.heading.panel',
    bodyToken: 'typography.body.primary',
    captionToken: 'typography.caption.secondary',
  },
  spacing: {
    containerPadding: 'spacing.panel.padding',
    sectionSpacing: 'spacing.panel.section',
    itemSpacing: 'spacing.panel.item',
  },
  effects: {
    glowToken: 'effects.glow.subtle',
    hoverToken: 'effects.hover.panel',
    focusToken: 'effects.focus.default',
  },
};

/**
 * Creates roster skin configuration from preset and pillar
 */
export function createRosterSkinConfig(
  skinPresetId: string,
  pillar: StyleLabPillar
): RosterSkinConfig {
  const preset = getSkinPresetConfig(skinPresetId);
  const componentTheme = preset.componentThemes.roster;

  // Extract tokens from preset based on pillar
  const palette = preset.palette;

  return {
    skinPresetId,
    pillar,
    componentTheme,
    frame: {
      borderToken: palette.primary, // Use primary color for border
      backgroundToken: palette.background,
      shadowToken: palette.glow, // Use glow for shadow effect
      radiusToken: 'borderRadius.panel.default', // Default radius token
    },
    typography: {
      headingToken: 'typography.heading.panel', // Default heading token
      bodyToken: 'typography.body.primary', // Default body token
      captionToken: 'typography.caption.secondary', // Default caption token
    },
    spacing: {
      containerPadding: 'spacing.panel.padding', // Default container padding
      sectionSpacing: 'spacing.panel.section', // Default section spacing
      itemSpacing: 'spacing.panel.item', // Default item spacing
    },
    effects: {
      glowToken: palette.glow, // Use glow color
      hoverToken: 'effects.hover.panel', // Default hover effect
      focusToken: 'effects.focus.default', // Default focus effect
    },
  };
}

/**
 * Validates roster skin configuration
 */
export function validateRosterSkinConfig(config: RosterSkinConfig): boolean {
  return (
    !!config.skinPresetId &&
    !!config.pillar &&
    !!config.componentTheme &&
    !!config.frame.borderToken &&
    !!config.frame.backgroundToken &&
    !!config.typography.headingToken &&
    !!config.typography.bodyToken &&
    !!config.spacing.containerPadding
  );
}
