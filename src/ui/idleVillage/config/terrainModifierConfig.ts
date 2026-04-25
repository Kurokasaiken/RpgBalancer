/**
 * Terrain modifier configuration definitions for Idle Village map tooling.
 *
 * Encapsulates config-first schema, defaults, and helpers used by the
 * TerrainModifierTool and related hooks. All domain values (effect types,
 * default colors, stacking layers) live here to avoid hardcoding inside UI.
 *
 * @module TerrainModifierConfig
 * @since 2026-01-13
 */

import { z } from 'zod';

/**
 * Supported impact types exposed to designers.
 */
export const TERRAIN_IMPACT_TYPES = ['production', 'risk', 'safety', 'mobility'] as const;

/**
 * Visual patterns available for overlays.
 */
export const TERRAIN_PATTERN_TYPES = ['solid', 'diagonal', 'grid', 'dots'] as const;

/**
 * Definition of a single terrain modifier entry.
 */
export interface TerrainModifierDefinition {
  /** Unique identifier */
  id: string;
  /** Designer facing label */
  label: string;
  /** Optional descriptive text */
  description?: string;
  /** Target slot identifiers */
  slotIds: string[];
  /** Effect type to aggregate inside previews */
  effectType: (typeof TERRAIN_IMPACT_TYPES)[number];
  /** Magnitude expressed as percentage delta (-1.0 to 1.0 => -100% to +100%) */
  magnitude: number;
  /** Optional emoji/icon for list cards */
  icon?: string;
  /** CSS color used for overlay when pattern === solid */
  color: string;
  /** Overlay opacity/intensity (0-1) */
  intensity: number;
  /** Stacking layer identifier */
  layerId: string;
  /** Optional overlay pattern */
  pattern?: (typeof TERRAIN_PATTERN_TYPES)[number];
  /** Enable/disable without deleting */
  isEnabled: boolean;
}

/**
 * Layer metadata controlling stacking order and toggles.
 */
export interface TerrainModifierLayerConfig {
  id: string;
  name: string;
  description?: string;
  /** Higher order renders above */
  order: number;
  /** Default visibility */
  defaultVisible: boolean;
  /** Style hint used inside UI toggles */
  colorHint: string;
}

/**
 * Runtime layer state persisted alongside modifiers.
 */
export interface TerrainModifierLayerState extends TerrainModifierLayerConfig {
  visible: boolean;
}

/**
 * Zod schema for validation/parsing.
 */
export const TerrainModifierSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  slotIds: z.array(z.string().min(1)).min(1),
  effectType: z.enum(TERRAIN_IMPACT_TYPES),
  magnitude: z.number().min(-1).max(1),
  icon: z.string().optional(),
  color: z.string().min(1),
  intensity: z.number().min(0).max(1),
  layerId: z.string().min(1),
  pattern: z.enum(TERRAIN_PATTERN_TYPES).optional(),
  isEnabled: z.boolean().default(true),
});

/**
 * Default stacking layers used by the editor.
 */
export const DEFAULT_TERRAIN_LAYERS: TerrainModifierLayerConfig[] = [
  {
    id: 'environment',
    name: 'Environment',
    description: 'Static biomes (forest, marsh, cliff).',
    order: 10,
    defaultVisible: true,
    colorHint: '#4c956c',
  },
  {
    id: 'structures',
    name: 'Structures',
    description: 'Player built structures and upgrades.',
    order: 20,
    defaultVisible: true,
    colorHint: '#c9a227',
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Temporary quest/encounter modifiers.',
    order: 30,
    defaultVisible: true,
    colorHint: '#e76f51',
  },
];

/**
 * Default modifier seed data.
 */
export const DEFAULT_TERRAIN_MODIFIERS: TerrainModifierDefinition[] = [
  {
    id: 'forest_barrier',
    label: 'Forest Barrier',
    description: 'Dense trees slow down patrols but reduce incoming risk.',
    slotIds: ['village_gate'],
    effectType: 'risk',
    magnitude: -0.15,
    icon: '🌲',
    color: 'rgba(34, 197, 94, 0.6)',
    intensity: 0.65,
    layerId: 'environment',
    pattern: 'diagonal',
    isEnabled: true,
  },
  {
    id: 'market_firepit',
    label: 'Market Fire Pit',
    description: 'Comfort aura boosts production in the market.',
    slotIds: ['village_market'],
    effectType: 'production',
    magnitude: 0.2,
    icon: '🔥',
    color: 'rgba(201, 162, 39, 0.7)',
    intensity: 0.7,
    layerId: 'structures',
    pattern: 'dots',
    isEnabled: true,
  },
  {
    id: 'trial_scar',
    label: 'Trial Scar',
    description: 'Recent Trial of Fire left the square unstable (risk↑, mobility↓).',
    slotIds: ['village_square'],
    effectType: 'risk',
    magnitude: 0.25,
    icon: '⚠️',
    color: 'rgba(239, 68, 68, 0.65)',
    intensity: 0.8,
    layerId: 'events',
    pattern: 'solid',
    isEnabled: true,
  },
];

/**
 * Helper to convert base layers into persisted state.
 */
export function createDefaultLayerState(
  layers: TerrainModifierLayerConfig[] = DEFAULT_TERRAIN_LAYERS,
): TerrainModifierLayerState[] {
  return layers
    .map((layer) => ({
      ...layer,
      visible: layer.defaultVisible,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Utility to create a blank modifier template.
 */
export function createTerrainModifierTemplate(slotId: string): TerrainModifierDefinition {
  return {
    id: `terrain_${Date.now().toString(36)}`,
    label: 'New Modifier',
    description: '',
    slotIds: [slotId],
    effectType: 'production',
    magnitude: 0.1,
    icon: '✨',
    color: 'rgba(141, 179, 165, 0.65)',
    intensity: 0.6,
    layerId: DEFAULT_TERRAIN_LAYERS[0]?.id ?? 'environment',
    pattern: 'solid',
    isEnabled: true,
  };
}

/**
 * Persistence payload version used by the hook.
 */
export const TERRAIN_MODIFIER_PERSISTENCE_VERSION = 1;

export const TerrainModifierPersistenceSchema = z.object({
  version: z.literal(TERRAIN_MODIFIER_PERSISTENCE_VERSION),
  modifiers: z.array(TerrainModifierSchema),
  layers: z.array(
    z.object({
      id: z.string().min(1),
      visible: z.boolean(),
      order: z.number(),
    }),
  ),
});

export type TerrainModifierPersistence = z.infer<typeof TerrainModifierPersistenceSchema>;

export const DEFAULT_TERRAIN_MODIFIER_PERSISTENCE: TerrainModifierPersistence = {
  version: TERRAIN_MODIFIER_PERSISTENCE_VERSION,
  modifiers: DEFAULT_TERRAIN_MODIFIERS,
  layers: createDefaultLayerState().map((layer) => ({
    id: layer.id,
    visible: layer.visible,
    order: layer.order,
  })),
};
