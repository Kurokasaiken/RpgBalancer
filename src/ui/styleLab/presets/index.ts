/**
 * Style Lab Presets
 * 
 * Centralized exports for all Style Lab Demo presets.
 * Each preset provides a distinct visual and interaction feel.
 */

export { 
  minimalFrontierPreset, 
  applyMinimalFrontierPreset 
} from './minimalFrontier';

export { 
  obsidianVaultPreset, 
  applyObsidianVaultPreset 
} from './obsidianVault';

export { 
  blizzardRiftPreset, 
  applyBlizzardRiftPreset 
} from './blizzardRift';

export {
  wanderlustPreset,
  applyWanderlustPreset,
} from './wanderlustDemoPreset';

export {
  WANDERLUST_PRESETS,
  createWanderlustPreset,
  applyWanderlustPreset as applyWanderlustStyleLabPreset,
  getWanderlustTokens,
  createWanderlustActionCardDemo,
  type WanderlustPillar,
  type WanderlustTokens,
  type WanderlustPresetConfig,
} from './wanderlust';

/**
 * Available preset IDs
 */
export type PresetId = 'minimalFrontier' | 'obsidianVault' | 'blizzardRift' | 'wanderlust' | 'wanderlust-wilderness' | 'wanderlust-empire';

/**
 * Preset metadata for UI display
 */
export const presetMetadata = {
  minimalFrontier: {
    label: 'Minimal Frontier',
    description: 'Clean, balanced feel with subtle animations',
    icon: '🌅',
  },
  obsidianVault: {
    label: 'Obsidian Vault',
    description: 'Heavy, dense feel with deep visual effects',
    icon: '🗿',
  },
  blizzardRift: {
    label: 'Blizzard Rift',
    description: 'Ultra-responsive, light feel with fast animations',
    icon: '❄️',
  },
  wanderlust: {
    label: 'Wanderlust',
    description: 'Warm-black bronze aesthetic with weighted physics',
    icon: '🗺',
  },
  'wanderlust-wilderness': {
    label: 'Wanderlust Wilderness',
    description: 'Organic natural tones with green accents',
    icon: '🌲',
  },
  'wanderlust-empire': {
    label: 'Wanderlust Empire',
    description: 'Imperial refined tones with gold accents',
    icon: '👑',
  },
} as const;
