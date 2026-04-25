import { defaultDemoConfig, type DemoConfig, type StyleLabPillar } from '../config/demoConfig';
import { PHYSICS_DEFAULTS, type PhysicsConfig } from '../config/physicsDefaults';
import { presetMetadata, type PresetId } from './index';
import { applyMinimalFrontierPreset } from './minimalFrontier';
import { applyObsidianVaultPreset } from './obsidianVault';
import { applyBlizzardRiftPreset } from './blizzardRift';
import { applyWanderlustPreset } from './wanderlustDemoPreset';

export type { StyleLabPillar };

export interface ResolvedStyleLabPreset {
  id: PresetId;
  label: string;
  pillar: StyleLabPillar;
  demoConfig: DemoConfig;
  physicsConfig: PhysicsConfig;
}

const PRESET_APPLIERS: Record<PresetId, (base: DemoConfig) => DemoConfig> = {
  minimalFrontier: applyMinimalFrontierPreset,
  obsidianVault: applyObsidianVaultPreset,
  blizzardRift: applyBlizzardRiftPreset,
  wanderlust: applyWanderlustPreset,
};

export const PRESET_PILLARS: Record<PresetId, StyleLabPillar> = {
  minimalFrontier: 'frontier',
  obsidianVault: 'empire',
  blizzardRift: 'wilderness',
  wanderlust: 'wilderness',
};

const PHYSICS_OVERRIDES: Record<PresetId, Partial<PhysicsConfig>> = {
  minimalFrontier: {},
  obsidianVault: {
    liftScale: 1.02,
    springStiffness: 240,
    springDamping: 32,
    mass: 1.8,
    tiltIntensity: 6,
    buttonSquash: 0.9,
    buttonLift: 1.01,
    slotGlowIntensity: 0.78,
  },
  blizzardRift: {
    liftScale: 1.15,
    springStiffness: 140,
    springDamping: 16,
    mass: 0.9,
    tiltIntensity: 12,
    buttonSquash: 0.96,
    buttonLift: 1.04,
    slotGlowIntensity: 0.55,
  },
  wanderlust: {
    liftScale: 1.1,
    springStiffness: 200,
    springDamping: 20,
    mass: 1.4,
    tiltIntensity: 9,
    buttonSquash: 0.92,
    buttonLift: 1.03,
    slotGlowIntensity: 0.65,
  },
};

const PRESET_PHYSICS: Record<PresetId, PhysicsConfig> = Object.entries(PHYSICS_OVERRIDES).reduce(
  (acc, [presetId, overrides]) => {
    acc[presetId as PresetId] = {
      ...PHYSICS_DEFAULTS,
      ...overrides,
    };
    return acc;
  },
  {} as Record<PresetId, PhysicsConfig>,
);

export function resolveDemoPreset(presetId: PresetId): ResolvedStyleLabPreset {
  const applyPreset = PRESET_APPLIERS[presetId];
  const demoConfig = applyPreset(defaultDemoConfig);
  const label = presetMetadata[presetId].label;
  const pillar = PRESET_PILLARS[presetId];

  return {
    id: presetId,
    label,
    pillar,
    demoConfig: {
      ...demoConfig,
      meta: {
        ...demoConfig.meta,
        presetId,
        presetLabel: label,
        pillar,
        sourceId: presetId,
        isCustom: false,
      },
    },
    physicsConfig: PRESET_PHYSICS[presetId],
  };
}

export function isBuiltInPresetId(value: string): value is PresetId {
  return Object.prototype.hasOwnProperty.call(presetMetadata, value);
}

/**
 * Get pillar-specific tokens for ActionCardFeel
 */
export function getActionCardFeelTokens(presetId: PresetId, pillar?: StyleLabPillar) {
  const _targetPillar = pillar ?? PRESET_PILLARS[presetId];
  // This will be populated by preset-specific appliers in WL-STY-003
  // For now, return frontier defaults as fallback
  return {
    frameColor: 'rgb(71, 85, 105)',
    frameGlow: 'rgba(71, 85, 105, 0.4)',
    backgroundColor: 'rgb(30, 41, 59)',
    rimLightIntensity: 0.2,
  };
}

/**
 * Get pillar-specific tokens for MapHaloFeel
 */
export function getMapHaloFeelTokens(presetId: PresetId, pillar?: StyleLabPillar) {
  const _targetPillar = pillar ?? PRESET_PILLARS[presetId];
  // This will be populated by preset-specific appliers in WL-STY-003
  // For now, return frontier defaults as fallback
  return {
    haloColor: 'rgb(71, 85, 105)',
    haloGlow: 'rgba(71, 85, 105, 0.6)',
    pulseIntensity: 0.4,
    pulseSpeed: 2.2,
    shadowBlur: 10,
    interaction: {
      transitionMs: 180,
      hoverScale: 1.05,
      activeScale: 0.98,
    },
  };
}

/**
 * Get pillar-specific tokens for HaloShader
 */
export function getHaloShaderTokens(presetId: PresetId, pillar?: StyleLabPillar) {
  const _targetPillar = pillar ?? PRESET_PILLARS[presetId];
  // This will be populated by preset-specific appliers in WL-STY-003
  // For now, return frontier defaults as fallback
  return {
    gradientStops: [
      { offset: 0, color: 'rgba(71, 85, 105, 0.8)', opacity: 0.8 },
      { offset: 0.5, color: 'rgba(71, 85, 105, 0.4)', opacity: 0.4 },
      { offset: 1, color: 'rgba(71, 85, 105, 0)', opacity: 0 },
    ],
  };
}
