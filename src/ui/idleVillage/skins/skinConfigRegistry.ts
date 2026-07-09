import type { SkinRegistry, SkinPresetConfig, StyleLabPillar } from './skinSchemas';

const MINIMAL_FRONTIER_COMPONENT_THEMES = {
  roster: 'minimalFrontier.roster.clean-panel',
  slotRack: 'minimalFrontier.slot.airy-grid',
  timeStrip: 'minimalFrontier.time.raycast',
  hud: 'minimalFrontier.hud.line',
  capsule: 'minimalFrontier.capsule.transparent',
  halo: 'minimalFrontier.halo.soft',
  pgCard: 'minimalFrontier.pgCard.default',
} as const;

const WANDERLUST_COMPONENT_THEMES = {
  roster: 'wanderlust.roster.heavy-frame',
  slotRack: 'wanderlust.slot.floating',
  timeStrip: 'wanderlust.time.mechanical',
  hud: 'wanderlust.hud.glass',
  capsule: 'wanderlust.capsule.ornate',
  halo: 'wanderlust.halo.glowing',
  pgCard: 'wanderlust.pgCard.gilded',
} as const;

const SLOT_RACK_SIGNATURE_COMPONENT_THEMES = {
  roster: 'slotrackSignature.roster.glass-stack',
  slotRack: 'slotrackSignature.slot.ribbon-frame',
  timeStrip: 'slotrackSignature.time.glow-trace',
  hud: 'slotrackSignature.hud.aurora',
  capsule: 'slotrackSignature.capsule.woven',
  halo: 'slotrackSignature.halo.capillary',
  pgCard: 'slotrackSignature.pgCard.ceremonial',
} as const;

const BASE_LAYOUT_PRIMITIVES_COMPONENT_THEMES = {
  roster: 'base.roster.minimal-frame',
  slotRack: 'base.slot.clean-grid',
  timeStrip: 'base.time.simple-strip',
  hud: 'base.hud.minimal-line',
  capsule: 'base.capsule.glass-minimal',
  halo: 'base.halo.azure-glow',
  pgCard: 'base.pgCard.minimal-portrait',
} as const;

const BASE_LAYOUT_PRIMITIVES_CONFIG: SkinPresetConfig = {
  id: 'base',
  label: 'Layout Primitives',
  description: 'Global default: Obsidian base + Azure light + Gold/bronze accents. Clean, minimal aesthetic optimized for information clarity.',
  version: 1,
  defaultPillar: 'frontier',
  supportedPillars: ['frontier', 'wilderness', 'empire'],
  exposure: 'public',
  palette: {
    primary: '#dfb857',
    secondary: '#c9a040',
    accent: '#00e5ff',
    glow: 'rgba(0, 229, 255, 0.35)',
    background: '#060f16',
    text: '#f7f0e3',
  },
  densityMode: 'default',
  motionLevel: 'full',
  typographyScale: 1,
  componentThemes: BASE_LAYOUT_PRIMITIVES_COMPONENT_THEMES,
  interactionPhysics: {
    mass: 1,
    damping: 0.2,
    stiffness: 200,
    shadowDepth: 'medium',
    bloomIntensity: 0.8,
    audioProfile: 'base.minimal',
  },
  styleLabOverrides: {
    palettePreset: 'base.layout-primitives',
    densityMode: 'default',
    motionLevel: 'full',
    typographyScale: 1,
    colorFilters: {
      visionMode: 'standard',
    },
    interactionPhysics: {
      mass: 1,
      damping: 0.2,
      stiffness: 200,
      shadowDepth: 'medium',
      bloomIntensity: 0.8,
      audioProfile: 'base.minimal',
    },
  },
  telemetry: {
    presetChangedEvent: 'skin_preset_changed',
    renderedEvent: 'skin_rendered',
    context: 'idle_village_base_layout_primitives',
  },
  documentation: [
    'Layout Primitives is the global default aesthetic for all skin-aware components.',
  ],
};

const RESIDENT_SLOT_RACK_SIGNATURE_CONFIG: SkinPresetConfig = {
  id: 'resident_slotrack_signature',
  label: 'Resident Slot Signature',
  description: 'Trasposizione 1:1 del medaglione wanderlust/emerald estratto dal prototipo HTML.',
  version: 1,
  defaultPillar: 'frontier',
  supportedPillars: ['frontier'],
  exposure: 'internal',
  palette: {
    primary: '#fce890',
    secondary: '#a05c18',
    accent: '#72ee82',
    glow: 'rgba(58, 215, 80, 0.45)',
    background: '#070713',
    text: '#fdf4ff',
  },
  densityMode: 'cozy',
  motionLevel: 'minimal',
  typographyScale: 1.05,
  componentThemes: SLOT_RACK_SIGNATURE_COMPONENT_THEMES,
  interactionPhysics: {
    mass: 0.9,
    damping: 0.3,
    stiffness: 210,
    shadowDepth: 'medium',
    bloomIntensity: 0.7,
    audioProfile: 'slotrack.signature.satin',
  },
  styleLabOverrides: {
    motionLevel: 'minimal',
    densityMode: 'cozy',
    focusStyle: 'enhanced',
    palettePreset: 'slotrack.signature.medal4',
    interactionPhysics: {
      mass: 0.9,
      damping: 0.3,
      stiffness: 210,
      shadowDepth: 'medium',
      bloomIntensity: 0.7,
      audioProfile: 'slotrack.signature.satin',
    },
    colorFilters: {
      visionMode: 'standard',
    },
  },
  telemetry: {
    presetChangedEvent: 'skin_preset_changed',
    renderedEvent: 'skin_rendered',
    context: 'idle_village_slotrack_signature',
  },
  documentation: [
    'IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md#resident-slotrack-signature',
    '.windsurf/plans/style-lab-flexibility-1a9890.md#slotrack-signature',
    'material-canvas-v2.html#slotrack-signature',
    'src/ui/idleVillage/reference/medal4.html',
  ],
};

const MINIMAL_FRONTIER_CONFIG: SkinPresetConfig = {
  id: 'minimal_frontier',
  label: 'Minimal Frontier',
  description: 'Baseline Idle Village surface tuned for clarity and reduced motion.',
  version: 1,
  defaultPillar: 'frontier',
  supportedPillars: ['frontier'],
  exposure: 'public',
  palette: {
    primary: 'var(--minimal-frontier-primary, #f7f2e9)',
    secondary: 'var(--minimal-frontier-secondary, #c6c1b7)',
    accent: 'var(--minimal-frontier-accent, #4a6d82)',
    glow: 'var(--minimal-frontier-glow, rgba(255,255,255,0.45))',
    background: 'var(--minimal-frontier-bg, #101418)',
    text: 'var(--minimal-frontier-text, #fefbf4)',
  },
  densityMode: 'cozy',
  motionLevel: 'reduced',
  typographyScale: 1.0,
  componentThemes: MINIMAL_FRONTIER_COMPONENT_THEMES,
  interactionPhysics: {
    mass: 0.95,
    damping: 0.24,
    stiffness: 180,
    shadowDepth: 'medium',
    bloomIntensity: 0.4,
    audioProfile: 'minimal-frontier.core',
  },
  styleLabOverrides: {
    motionLevel: 'reduced',
    densityMode: 'cozy',
    typographyScale: 1,
    focusStyle: 'enhanced',
    colorFilters: {
      visionMode: 'standard',
    },
  },
  telemetry: {
    presetChangedEvent: 'skin_preset_changed',
    renderedEvent: 'skin_rendered',
    context: 'idle_village_minimal_frontier',
  },
  documentation: [
    'IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md#41-registry--schema',
    '.windsurf/plans/style-lab-flexibility-1a9890.md',
  ],
};

const WANDERLUST_CONFIG: SkinPresetConfig = {
  id: 'wanderlust',
  label: 'Wanderlust Dual-Pillar',
  description: 'Dark luxury treatment spanning Wilderness and Empire pillars.',
  version: 1,
  defaultPillar: 'wilderness',
  supportedPillars: ['wilderness', 'empire'],
  exposure: 'public',
  palette: {
    primary: 'var(--wanderlust-primary, #d87706)',
    secondary: 'var(--wanderlust-secondary, #6b3a1a)',
    accent: 'var(--wanderlust-accent, #3ad750)',
    glow: 'var(--wanderlust-glow, rgba(216, 144, 64, 0.65))',
    background: 'var(--wanderlust-bg, #0a0402)',
    text: 'var(--wanderlust-text, #fffbeb)',
  },
  densityMode: 'compact',
  motionLevel: 'full',
  typographyScale: 1.1,
  componentThemes: WANDERLUST_COMPONENT_THEMES,
  interactionPhysics: {
    mass: 1.2,
    damping: 0.18,
    stiffness: 220,
    shadowDepth: 'deep',
    bloomIntensity: 1.2,
    audioProfile: 'wanderlust.obsidian',
  },
  styleLabOverrides: {
    palettePreset: 'wanderlust.dual-pillar',
    densityMode: 'compact',
    motionLevel: 'full',
    typographyScale: 1.2,
    colorFilters: {
      visionMode: 'standard',
    },
    interactionPhysics: {
      mass: 1.2,
      damping: 0.18,
      stiffness: 220,
      shadowDepth: 'deep',
      bloomIntensity: 1.2,
      audioProfile: 'wanderlust.obsidian',
    },
  },
  telemetry: {
    presetChangedEvent: 'skin_preset_changed',
    renderedEvent: 'skin_rendered',
    context: 'idle_village_wanderlust',
  },
  documentation: [
    '.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md',
    'material-canvas-v2.html',
  ],
};

export const SKIN_CONFIG_REGISTRY: SkinRegistry = {
  [BASE_LAYOUT_PRIMITIVES_CONFIG.id]: BASE_LAYOUT_PRIMITIVES_CONFIG,
  [MINIMAL_FRONTIER_CONFIG.id]: MINIMAL_FRONTIER_CONFIG,
  [WANDERLUST_CONFIG.id]: WANDERLUST_CONFIG,
  [RESIDENT_SLOT_RACK_SIGNATURE_CONFIG.id]: RESIDENT_SLOT_RACK_SIGNATURE_CONFIG,
};

export type SkinPresetId = keyof typeof SKIN_CONFIG_REGISTRY;

// ← VERSIONE DEFAULT: Layout Primitives (base) is now the global default for all components
export const DEFAULT_SKIN_PRESET_ID: SkinPresetId = BASE_LAYOUT_PRIMITIVES_CONFIG.id;

export function getSkinPresetConfig(presetId?: string): SkinPresetConfig {
  const fallback = SKIN_CONFIG_REGISTRY[DEFAULT_SKIN_PRESET_ID];
  if (!presetId) {
    return fallback;
  }
  const resolved = SKIN_CONFIG_REGISTRY[presetId as SkinPresetId];
  return resolved ?? fallback;
}

export function getSupportedPillars(presetId: SkinPresetId): StyleLabPillar[] {
  return getSkinPresetConfig(presetId).supportedPillars;
}

export function isPillarSupported(presetId: SkinPresetId, pillar: StyleLabPillar): boolean {
  return getSkinPresetConfig(presetId).supportedPillars.includes(pillar);
}
