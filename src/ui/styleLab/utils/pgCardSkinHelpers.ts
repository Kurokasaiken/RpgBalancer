/**
 * Helper utilities for PgCard Wanderlust skin integration with Style Lab presets.
 * Provides token extraction and CSS variable generation for pillar variants.
 */

import type { DemoConfig, PgCardSkinConfig } from '../config/demoConfig';

export type StyleLabPillar = 'wilderness' | 'empire' | 'frontier';

/**
 * Extracts PgCard skin tokens from a Style Lab preset configuration.
 * Returns CSS custom properties for the given pillar variant.
 */
export function getPgCardSkinTokens(
  config: DemoConfig | undefined,
  pillar: StyleLabPillar = 'wilderness'
): Record<string, string> {
  const skin = config?.pgCardSkin;
  if (!skin || !skin.enabled) {
    return {};
  }

  const pillarConfig = skin.pillars[pillar];
  const baseTokens = {
    '--pgcard-physics-mass': skin.physics.mass.toString(),
    '--pgcard-physics-damping': skin.physics.damping.toString(),
    '--pgcard-physics-stiffness': skin.physics.stiffness.toString(),
    '--pgcard-metal': skin.visual.metalGradient,
    '--pgcard-gem': skin.visual.gemGradient,
    '--pgcard-shadow-depth': `${skin.visual.shadowDepth}px`,
    '--pgcard-glass-tint': skin.visual.glassTint,
    '--pgcard-patina': pillarConfig.patinaColor,
    '--pgcard-rim-light': pillarConfig.rimLightColor,
    '--pgcard-glow': pillarConfig.glowColor,
    '--pgcard-patina-opacity': skin.visual.patinaOpacity.toString(),
    '--pgcard-rim-intensity': skin.visual.rimLightIntensity.toString(),
    '--pgcard-glow-intensity': skin.visual.glowIntensity.toString(),
  };

  return baseTokens;
}

/**
 * Generates CSS custom properties string for inline styles.
 * Useful for dynamic token injection without CSS files.
 */
export function pgCardSkinCssVars(
  config: DemoConfig | undefined,
  pillar: StyleLabPillar = 'wilderness'
): string {
  const tokens = getPgCardSkinTokens(config, pillar);
  return Object.entries(tokens)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}

/**
 * Checks if PgCard skin is enabled and configured for the given preset.
 */
export function isPgCardSkinAvailable(config: DemoConfig | undefined): boolean {
  return Boolean(config?.pgCardSkin?.enabled);
}

/**
 * Gets audio cue configuration for PgCard interactions.
 */
export function getPgCardAudioCues(config: DemoConfig | undefined) {
  const skin = config?.pgCardSkin;
  if (!skin || !skin.enabled) {
    return {
      pickup: 'pickup',
      drop: 'drop',
      reject: 'reject',
      volume: 70,
    };
  }

  return {
    pickup: skin.audio.pickupCue,
    drop: skin.audio.dropCue,
    reject: skin.audio.rejectCue,
    volume: skin.audio.volume,
  };
}

/**
 * Gets physics configuration for dnd-kit integration.
 */
export function getPgCardPhysics(config: DemoConfig | undefined) {
  const skin = config?.pgCardSkin;
  if (!skin || !skin.enabled) {
    return {
      mass: 1.0,
      damping: 0.2,
      stiffness: 200,
    };
  }

  return {
    mass: skin.physics.mass,
    damping: skin.physics.damping,
    stiffness: skin.physics.stiffness,
  };
}

/**
 * Determines the appropriate pillar based on location or context.
 * This is a placeholder for future pillar selection logic.
 */
export function determinePillarFromContext(context?: {
  locationType?: string;
  residentType?: string;
  scenarioType?: string;
}): StyleLabPillar {
  // Default logic - can be extended based on game state
  if (context?.locationType?.includes('wilderness') || context?.scenarioType?.includes('wilderness')) {
    return 'wilderness';
  }
  if (context?.locationType?.includes('empire') || context?.scenarioType?.includes('empire')) {
    return 'empire';
  }
  return 'wilderness'; // Default fallback
}

/**
 * Validates PgCard skin configuration for required fields.
 */
export function validatePgCardSkinConfig(skin: PgCardSkinConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!skin.enabled) {
    return { isValid: true, errors: [] };
  }

  // Validate physics ranges
  if (skin.physics.mass < 0.5 || skin.physics.mass > 2.0) {
    errors.push('Physics mass must be between 0.5 and 2.0');
  }
  if (skin.physics.damping < 0.1 || skin.physics.damping > 0.5) {
    errors.push('Physics damping must be between 0.1 and 0.5');
  }
  if (skin.physics.stiffness < 100 || skin.physics.stiffness > 500) {
    errors.push('Physics stiffness must be between 100 and 500');
  }

  // Validate visual ranges
  if (skin.visual.shadowDepth < 4 || skin.visual.shadowDepth > 32) {
    errors.push('Shadow depth must be between 4 and 32');
  }
  if (skin.visual.patinaOpacity < 0 || skin.visual.patinaOpacity > 1) {
    errors.push('Patina opacity must be between 0 and 1');
  }
  if (skin.visual.rimLightIntensity < 0 || skin.visual.rimLightIntensity > 1) {
    errors.push('Rim light intensity must be between 0 and 1');
  }
  if (skin.visual.glowIntensity < 0 || skin.visual.glowIntensity > 1) {
    errors.push('Glow intensity must be between 0 and 1');
  }

  // Validate audio ranges
  if (skin.audio.volume < 0 || skin.audio.volume > 100) {
    errors.push('Audio volume must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
