import { WorldSurfaceManifestSchema, type WorldSurfaceManifest } from './worldSurfaceConfig';
import baseManifest from './wanderlustBaseManifest.json';
import { type PresentationRules } from '../../../engine/world/presentation/types';
import { getPresentationRules } from '../../../engine/world/presentation/config/presentationRulesRegistry';

/**
 * Static manifest preset for the presentation director.
 *
 * Mirrors the public Wanderlust manifest but adds a `threatened` visual state
 * so the runtime can demonstrate state translation without fetching a file.
 */
const parsedBase = WorldSurfaceManifestSchema.parse(baseManifest);

export const WANDERLUST_PRESENTATION_MANIFEST = WorldSurfaceManifestSchema.parse({
  ...parsedBase,
  variant: 'presentation',
  assetPolicy: { resolution: 'runtime_only' as const },
  renderer: {
    ...(parsedBase.renderer ?? {}),
    imageFit: 'contain' as const,
    autoFit: true,
  },
  camera: {
    ...parsedBase.camera,
    minZoom: 0.1,
    defaultZoom: 1,
    bounds: parsedBase.camera.bounds,
  },
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
        { type: 'tint_layer' as const, layerId: 'frame', tint: '#6a1a1a' },
        { type: 'set_opacity' as const, layerId: 'frame', opacity: 0.45 },
      ],
    },
    {
      id: 'threatened',
      labelKey: 'world.states.threatened',
      overrides: [
        { type: 'tint_layer' as const, layerId: 'frame', tint: '#4a0a0a' },
        { type: 'set_opacity' as const, layerId: 'frame', opacity: 0.85 },
      ],
    },
    {
      id: 'corrupted',
      labelKey: 'world.states.corrupted',
      overrides: [
        { type: 'tint_layer' as const, layerId: 'frame', tint: '#2b0a0a' },
        { type: 'set_opacity' as const, layerId: 'frame', opacity: 0.85 },
      ],
    },
  ],
  anchors: [
    {
      id: 'village_01',
      x: 2120,
      y: 1414,
      type: 'settlement',
      targetId: 'idle_village',
      labelKey: 'world.anchors.village_01',
    },
  ],
  tags: [...parsedBase.tags, 'presentation'],
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
