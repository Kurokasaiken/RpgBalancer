import { z } from 'zod';
import { RuntimeObjectSchema } from '../model/RuntimeObject';
import { WorldEventSchema } from '../model/WorldEvent';

/**
 * Snapshot of world truth read by the presentation layer.
 * The presentation runtime must never write back to this snapshot.
 */
export const WorldStateSnapshotSchema = z.record(z.string(), z.unknown()).default({});

export type WorldStateSnapshot = z.infer<typeof WorldStateSnapshotSchema>;

/**
 * A single rule mapping a piece of world truth to a visual state id.
 */
export const VisualStateMappingSchema = z.object({
  stateKey: z.string(),
  condition: z.enum(['truthy', 'falsy', 'equals', 'contains']).default('truthy'),
  value: z.unknown().optional(),
  visualStateId: z.string(),
  priority: z.number().int().default(0),
});

export type VisualStateMapping = z.infer<typeof VisualStateMappingSchema>;

/**
 * Config-driven rules that define how world truth is translated into
 * visual presentation.  All values are read from config modules.
 */
export const PresentationRulesSchema = z.object({
  version: z.string().default('1.0.0'),
  visualStateMappings: z.array(VisualStateMappingSchema).default([]),
  defaultVisualStateId: z.string().optional(),
});

export type PresentationRules = z.infer<typeof PresentationRulesSchema>;

/**
 * A read-only projection of world truth into a presentation-friendly model.
 */
export const WorldPresentationModelSchema = z.object({
  stateSnapshot: WorldStateSnapshotSchema,
  activeStateIds: z.array(z.string()).default([]),
  activeEvents: z.array(WorldEventSchema).default([]),
  runtimeObjects: z.array(RuntimeObjectSchema).default([]),
});

export type WorldPresentationModel = z.infer<typeof WorldPresentationModelSchema>;

/**
 * Input accepted by `buildWorldPresentationModel`.
 * Supports the existing `WorldState` store shape plus arbitrary extra keys.
 */
export interface BuildWorldPresentationModelInput {
  objects?: unknown[];
  events?: unknown[];
  [key: string]: unknown;
}

/**
 * Camera output consumed by `WorldSurfaceRenderer`.
 */
export const CameraSchema = z.object({
  panX: z.number().default(0),
  panY: z.number().default(0),
  zoom: z.number().positive().default(1),
});

export type Camera = z.infer<typeof CameraSchema>;

/**
 * Layer offset output consumed by `WorldSurfaceRenderer`.
 */
export const LayerOffsetSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
});

export type LayerOffset = z.infer<typeof LayerOffsetSchema>;

/**
 * A single visual-state override.  Shape matches `WorldSurfaceVisualStateOverride`
 * so the renderer can consume it via structural typing.
 */
export const PresentationVisualStateOverrideSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('apply_condition'),
    layerId: z.string(),
    conditionId: z.string(),
  }),
  z.object({
    type: z.literal('set_visibility'),
    layerId: z.string(),
    visible: z.boolean(),
  }),
  z.object({
    type: z.literal('set_opacity'),
    layerId: z.string(),
    opacity: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('tint_layer'),
    layerId: z.string(),
    tint: z.string(),
  }),
  z.object({
    type: z.literal('set_animation'),
    layerId: z.string(),
    animation: z.object({
      mode: z.enum(['none', 'wave', 'pulse', 'drift']).default('none'),
      implementation: z.enum(['css', 'transform', 'shader']).default('transform'),
      direction: z.enum(['left', 'right', 'up', 'down', 'both']).default('left'),
      speed: z.number().nonnegative().default(0),
      amplitude: z.number().nonnegative().default(0),
    }),
  }),
]);

export type PresentationVisualStateOverride = z.infer<typeof PresentationVisualStateOverrideSchema>;

/**
 * The serializable output produced by the presentation runtime.
 * Contains no DOM references, no class instances, and no functions.
 */
export const PresentationOutputSchema = z.object({
  activeVisualStateId: z.string().optional(),
  visualStateOverrides: z.array(PresentationVisualStateOverrideSchema).default([]),
  runtimeObjects: z.array(RuntimeObjectSchema).default([]),
  camera: CameraSchema.default({ panX: 0, panY: 0, zoom: 1 }),
  visibleLayerIds: z.array(z.string()).optional(),
  layerScales: z.record(z.string(), z.number()).default({}),
  layerOffsets: z.record(z.string(), LayerOffsetSchema).default({}),
});

export type PresentationOutput = z.infer<typeof PresentationOutputSchema>;

/**
 * Minimal manifest contract used by the presentation runtime.
 * `WorldSurfaceManifest` is structurally compatible and can be passed in.
 */
export interface PresentationManifest {
  visualStates: Array<{ id: string; base?: boolean }>;
  surfaceLayers?: Array<{ id: string }>;
  atmosphereLayers?: Array<{ id: string }>;
  camera?: { defaultZoom?: number };
}

/**
 * Context passed to each `PresentationEffect` during `update`.
 */
export interface PresentationContext {
  model: WorldPresentationModel;
  manifest: PresentationManifest;
  tick: number;
  deltaTick: number;
  interpolation: number;
  random: {
    next: () => number;
    fork: (namespace: string, counter?: number) => { next: () => number };
  };
}

/**
 * An effect translates presentation context into a partial output override.
 * Effects are pure and must never mutate `WorldState`.
 */
export interface PresentationEffect {
  id?: string;
  enabled?: (ctx: PresentationContext) => boolean;
  update(ctx: PresentationContext): Partial<PresentationOutput>;
}

/**
 * A sequence declares an intent to run one or more effects over a tick window.
 */
export interface PresentationSequence {
  id: string;
  effectIds: string[];
  startTick?: number;
  endTick?: number;
  repeat?: boolean;
}
