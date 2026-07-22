import { z } from 'zod';

/**
 * Runtime objects are dynamic entities rendered on the world surface.
 *
 * Each object carries its location mode, visual rendering contract and optional
 * animation state. Objects are independent from the manifest asset pipeline.
 */

export const LocationModeSchema = z.enum([
  'anchor',
  'dynamic',
  'path',
]);

export const RenderLayerSchema = z.enum([
  'world',
  'midground',
  'foreground',
  'overlay',
]);

export const RenderModeSchema = z.enum([
  'sprite',
  'shape',
  'text',
  'particle',
]);

export const RuntimeObjectVisualSchema = z.object({
  iconKey: z.string().optional(),
  renderLayer: RenderLayerSchema.default('world'),
  renderMode: RenderModeSchema.default('sprite'),
  scale: z.number().positive().default(1),
  tint: z.string().optional(),
  glow: z.boolean().default(false),
});

export const RuntimeObjectAnimationSchema = z.object({
  mode: z.enum(['idle', 'walk', 'float', 'pulse']).default('idle'),
  speed: z.number().nonnegative().default(1),
  direction: z.enum(['left', 'right', 'up', 'down', 'both']).default('both'),
});

const defaultVisual = {
  renderLayer: 'world' as const,
  renderMode: 'sprite' as const,
  scale: 1,
  glow: false,
};

const defaultAnimation = {
  mode: 'idle' as const,
  speed: 1,
  direction: 'both' as const,
};

export const RuntimeObjectSchema = z.object({
  id: z.string(),
  location: z.union([
    z.object({
      mode: z.literal('anchor'),
      anchorId: z.string(),
    }),
    z.object({
      mode: z.literal('dynamic'),
      x: z.number(),
      y: z.number(),
    }),
    z.object({
      mode: z.literal('path'),
      pathId: z.string(),
      progress: z.number().min(0).max(1).default(0),
    }),
  ]),
  type: z.string(),
  state: z.string().default('idle'),
  visual: RuntimeObjectVisualSchema.default(defaultVisual),
  animation: RuntimeObjectAnimationSchema.default(defaultAnimation),
  data: z.record(z.unknown()).default({}),
});

export type LocationMode = z.infer<typeof LocationModeSchema>;
export type RenderLayer = z.infer<typeof RenderLayerSchema>;
export type RenderMode = z.infer<typeof RenderModeSchema>;
export type RuntimeObjectVisual = z.infer<typeof RuntimeObjectVisualSchema>;
export type RuntimeObjectAnimation = z.infer<typeof RuntimeObjectAnimationSchema>;
export type RuntimeObject = z.infer<typeof RuntimeObjectSchema>;

/**
 * Alias for the mutable subset of RuntimeObject.
 * Currently identical to RuntimeObject; kept for future state-only diffs.
 */
export type RuntimeObjectState = RuntimeObject;
