import { z } from 'zod';

/**
 * World events represent time-bound occurrences that mutate the world surface
 * state, spawn runtime objects, or toggle visual states.
 */

export const WorldEventCategorySchema = z.enum([
  'environment',
  'threat',
  'story',
  'economy',
]);

export const WorldEventEffectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('spawn_runtime_object'),
    objectType: z.string(),
    location: z.object({ x: z.number(), y: z.number() }).or(z.object({ anchorId: z.string() })),
  }),
  z.object({
    type: z.literal('apply_visual_state'),
    stateId: z.string(),
  }),
  z.object({
    type: z.literal('tint_region'),
    regionId: z.string(),
    tint: z.string(),
  }),
  z.object({
    type: z.literal('set_runtime_object_state'),
    objectId: z.string(),
    state: z.string(),
  }),
  z.object({
    type: z.literal('unlock_quest'),
    questId: z.string(),
  }),
]);

export const WorldEventLifecycleSchema = z.object({
  state: z.enum(['pending', 'active', 'resolved', 'expired']).default('pending'),
  startAt: z.number().optional(),
  endAt: z.number().optional(),
});

export const WorldEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: WorldEventCategorySchema,
  lifecycle: WorldEventLifecycleSchema.default({ state: 'pending' }),
  effects: z.array(WorldEventEffectSchema).default([]),
  data: z.record(z.string(), z.unknown()).default({}),
});

export type WorldEventCategory = z.infer<typeof WorldEventCategorySchema>;
export type WorldEventEffect = z.infer<typeof WorldEventEffectSchema>;
export type WorldEventLifecycle = z.infer<typeof WorldEventLifecycleSchema>;
export type WorldEvent = z.infer<typeof WorldEventSchema>;
