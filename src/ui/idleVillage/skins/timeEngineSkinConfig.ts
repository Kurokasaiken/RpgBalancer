import type { StyleLabPillar } from './skinSchemas';
import { getSkinPresetConfig } from './skinConfigRegistry';

/**
 * Configuration interface for TimeEngineStrip skin upgrades
 */
export interface TimeEngineSkinConfig {
  /** Skin preset identifier */
  skinPresetId: string;
  /** Style Lab pillar for variant styling */
  pillar: StyleLabPillar;
  /** Component theme identifier from registry */
  componentTheme: string;
  /** Clock styling configuration */
  clockStyle: {
    /** Clock display mode */
    displayMode: 'digital' | 'analog' | 'arcane';
    /** Clock face token */
    faceToken: string;
    /** Clock hands token */
    handsToken: string;
    /** Clock numbers token */
    numbersToken: string;
  };
  /** Accent glow configuration */
  accentGlow: {
    /** Glow color token */
    glowToken: string;
    /** Glow intensity */
    intensity: number;
    /** Glow radius */
    radius: number;
    /** Animation token */
    animationToken: string;
  };
  /** Progress bar styling */
  progressBar: {
    /** Progress bar fill token */
    fillToken: string;
    /** Progress bar background token */
    backgroundToken: string;
    /** Progress bar border token */
    borderToken: string;
    /** Progress bar height */
    height: number;
  };
  /** Typography configuration */
  typography: {
    /** Time display font token */
    timeFont: string;
    /** Label font token */
    labelFont: string;
    /** Caption font token */
    captionFont: string;
  };
  /** Animation configuration */
  animations: {
    /** Tick animation token */
    tickAnimation: string;
    /** Transition animation token */
    transitionAnimation: string;
    /** Pulse animation token */
    pulseAnimation: string;
  };
}

/**
 * Default time engine skin configuration based on Minimal Frontier preset
 */
export const DEFAULT_TIME_ENGINE_SKIN_CONFIG: TimeEngineSkinConfig = {
  skinPresetId: 'minimal_frontier',
  pillar: 'frontier',
  componentTheme: 'minimalFrontier.time.raycast',
  clockStyle: {
    displayMode: 'digital',
    faceToken: 'colors.clock.face',
    handsToken: 'colors.clock.hands',
    numbersToken: 'colors.clock.numbers',
  },
  accentGlow: {
    glowToken: 'effects.glow.accent',
    intensity: 0.5,
    radius: 8,
    animationToken: 'animations.glow.pulse',
  },
  progressBar: {
    fillToken: 'colors.progress.fill',
    backgroundToken: 'colors.progress.background',
    borderToken: 'colors.progress.border',
    height: 4,
  },
  typography: {
    timeFont: 'typography.time.display',
    labelFont: 'typography.label.primary',
    captionFont: 'typography.caption.secondary',
  },
  animations: {
    tickAnimation: 'animations.clock.tick',
    transitionAnimation: 'animations.transition.smooth',
    pulseAnimation: 'animations.pulse.subtle',
  },
};

/**
 * Creates time engine skin configuration from preset and pillar
 */
export function createTimeEngineSkinConfig(
  skinPresetId: string,
  pillar: StyleLabPillar
): TimeEngineSkinConfig {
  const preset = getSkinPresetConfig(skinPresetId);
  const componentTheme = preset.componentThemes.timeStrip;

  // Extract tokens from preset based on pillar
  const palette = preset.palette;
  const interactionPhysics = preset.interactionPhysics;

  return {
    skinPresetId,
    pillar,
    componentTheme,
    clockStyle: {
      displayMode: 'digital', // Default to digital
      faceToken: palette.primary,
      handsToken: palette.secondary,
      numbersToken: palette.text,
    },
    accentGlow: {
      glowToken: palette.glow,
      intensity: interactionPhysics?.bloomIntensity || 1,
      radius: 8,
      animationToken: 'animations.glow.pulse',
    },
    progressBar: {
      fillToken: palette.primary,
      backgroundToken: palette.background,
      borderToken: palette.secondary,
      height: 4,
    },
    typography: {
      timeFont: 'typography.time.display',
      labelFont: 'typography.label.primary',
      captionFont: 'typography.caption.secondary',
    },
    animations: {
      tickAnimation: 'animations.clock.tick',
      transitionAnimation: 'animations.transition.smooth',
      pulseAnimation: 'animations.pulse.subtle',
    },
  };
}

/**
 * Validates time engine skin configuration
 */
export function validateTimeEngineSkinConfig(config: TimeEngineSkinConfig): boolean {
  return (
    !!config.skinPresetId &&
    !!config.pillar &&
    !!config.componentTheme &&
    !!config.clockStyle.faceToken &&
    !!config.accentGlow.glowToken &&
    !!config.progressBar.fillToken &&
    !!config.typography.timeFont
  );
}
