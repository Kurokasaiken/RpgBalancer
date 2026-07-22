import { WorldSurfaceManifestSchema, type WorldSurfaceManifest } from './worldSurfaceConfig';
import { type PresentationRules } from '../../../engine/world/presentation/types';
import { getPresentationRules } from '../../../engine/world/presentation/config/presentationRulesRegistry';

/**
 * Static manifest preset for the presentation director.
 *
 * Mirrors the public Wanderlust manifest but adds a `threatened` visual state
 * so the runtime can demonstrate state translation without fetching a file.
 */
export const WANDERLUST_PRESENTATION_MANIFEST = WorldSurfaceManifestSchema.parse({
  version: '1.0.0',
  world: 'wanderlust',
  variant: 'presentation',
  coordinateSystem: {
    space: 'world_pixels',
    origin: 'top_left',
    unit: 'px',
    canvas: { width: 1248, height: 832 },
  },
  resolutionHint: {
    runtime: { width: 1248, height: 832 },
    source: { width: 3744, height: 2496 },
    scaleTarget: 3,
  },
  assetPolicy: { resolution: 'runtime_only' as const },
  camera: {
    minZoom: 0.5,
    maxZoom: 3,
    defaultZoom: 1,
    panEnabled: true,
    zoomEnabled: true,
    bounds: { minX: 0, maxX: 1248, minY: 0, maxY: 832 },
  },
  surfaceLayers: [
    {
      id: 'water',
      file: '05_water.png',
      type: 'animated_texture' as const,
      zIndex: 5,
      opacity: 1,
      blendMode: 'normal' as const,
      parallax: { x: 0.02, y: 0 },
      animation: {
        mode: 'wave' as const,
        implementation: 'shader' as const,
        direction: 'left' as const,
        speed: 0.2,
        amplitude: 3,
      },
      tags: ['water'],
    },
    {
      id: 'terrain',
      file: '10_terrain.png',
      type: 'texture' as const,
      zIndex: 10,
      opacity: 1,
      blendMode: 'normal' as const,
      parallax: { x: 0.05, y: 0 },
      conditions: {
        corrupted: {
          id: 'corrupted',
          tint: '#5c1a1a',
          blendMode: 'multiply' as const,
          opacity: 0.85,
        },
      },
      tags: ['terrain'],
    },
    {
      id: 'mountains_back',
      file: '50_mountains_back.png',
      type: 'texture' as const,
      zIndex: 50,
      opacity: 1,
      blendMode: 'normal' as const,
      parallax: { x: 0.08, y: 0 },
      tags: ['mountains'],
    },
    {
      id: 'forest',
      file: '55_forest.png',
      type: 'texture' as const,
      zIndex: 55,
      opacity: 1,
      blendMode: 'normal' as const,
      parallax: { x: 0.1, y: 0 },
      tags: ['forest'],
    },
    {
      id: 'settlements',
      file: '70_settlements.png',
      type: 'texture' as const,
      zIndex: 70,
      opacity: 1,
      blendMode: 'normal' as const,
      parallax: { x: 0.12, y: 0 },
      tags: ['settlements', 'landmarks'],
    },
  ],
  atmosphereLayers: [
    {
      id: 'vignette',
      file: '90_vignette.png',
      type: 'ui_overlay' as const,
      zIndex: 90,
      opacity: 0.6,
      blendMode: 'multiply' as const,
      parallax: { x: 0, y: 0 },
      tags: ['vignette'],
    },
  ],
  visualStates: [
    {
      id: 'default',
      labelKey: 'world.states.default',
      base: true,
      overrides: [],
    },
    {
      id: 'threat_manifesting',
      labelKey: 'world.states.threat_manifesting',
      overrides: [
        { type: 'tint_layer' as const, layerId: 'vignette', tint: '#6a1a1a' },
        { type: 'set_opacity' as const, layerId: 'vignette', opacity: 0.45 },
      ],
    },
    {
      id: 'threatened',
      labelKey: 'world.states.threatened',
      overrides: [
        { type: 'tint_layer' as const, layerId: 'vignette', tint: '#4a0a0a' },
        { type: 'set_opacity' as const, layerId: 'vignette', opacity: 0.85 },
      ],
    },
    {
      id: 'corrupted',
      labelKey: 'world.states.corrupted',
      overrides: [
        { type: 'apply_condition' as const, layerId: 'terrain', conditionId: 'corrupted' },
        { type: 'set_opacity' as const, layerId: 'vignette', opacity: 0.85 },
        { type: 'tint_layer' as const, layerId: 'vignette', tint: '#2b0a0a' },
      ],
    },
  ],
  regions: [
    {
      id: 'enchanted_forest',
      nameKey: 'world.region.enchanted_forest',
      bounds: { x: 200, y: 100, width: 500, height: 400 },
      tags: ['forest'],
    },
  ],
  anchors: [
    {
      id: 'village_01',
      x: 624,
      y: 416,
      type: 'settlement',
      targetId: 'idle_village',
      labelKey: 'world.anchors.village_01',
    },
  ],
  tags: ['world-map', 'idle-village', 'wanderlust', 'presentation'],
});

export interface PresentationScenario {
  id: string;
  labelKey: string;
  worldState: Record<string, unknown>;
  manifest: WorldSurfaceManifest;
  rules: PresentationRules;
  seed: number;
  /** Optional effect ids resolved through the presentation effect registry. */
  effectIds?: string[];
}

export const DEFAULT_PRESENTATION_SEED = 12345;

export const PRESENTATION_SCENARIOS: PresentationScenario[] = [
  {
    id: 'peaceful',
    labelKey: 'presentation.scenarios.peaceful',
    worldState: {},
    manifest: WANDERLUST_PRESENTATION_MANIFEST,
    rules: getPresentationRules('wanderlust_default'),
    seed: DEFAULT_PRESENTATION_SEED,
  },
  {
    id: 'threat',
    labelKey: 'presentation.scenarios.threat',
    worldState: {
      threat: { active: true },
      events: [
        {
          id: 'goblin-threat-north',
          type: 'goblin_invasion',
          category: 'threat',
          lifecycle: { state: 'active', startAt: 0, endAt: 300 },
          data: { origin: 'north', regionId: 'enchanted_forest' },
        },
      ],
    },
    manifest: WANDERLUST_PRESENTATION_MANIFEST,
    rules: getPresentationRules('wanderlust_default'),
    seed: DEFAULT_PRESENTATION_SEED,
    effectIds: ['threat_presence'],
  },
  {
    id: 'corruption',
    labelKey: 'presentation.scenarios.corruption',
    worldState: { corruption: { active: true } },
    manifest: WANDERLUST_PRESENTATION_MANIFEST,
    rules: getPresentationRules('wanderlust_default'),
    seed: DEFAULT_PRESENTATION_SEED,
  },
];

/**
 * Resolve a scenario by id.
 */
export function getPresentationScenario(id: string): PresentationScenario | undefined {
  return PRESENTATION_SCENARIOS.find((scenario) => scenario.id === id);
}
