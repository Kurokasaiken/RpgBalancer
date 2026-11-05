import { z } from 'zod';

/**
 * PLAN-108 (r002): strict Zod schema for `fauna.json` — the stormo flock
 * contract for `/mappa2-lab` (fauna slice 1a of PLAN-097).
 *
 * Dedicated leaf module, same shape as `mappa2AmbientDirectorConfig.ts`:
 * imported only when `manifest.world === 'mappa2'`, so `/game` and the
 * contract closure stay byte-identical.
 *
 * The stormo cadence (slotSec/probability/cooldowns) lives HERE, not in
 * `ambient-director.json` — that file stays shoal-only (debate r002).
 */

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);

const AtlasSchema = z.object({
  file: z.string().min(1),
  cellPx: z.number().positive(),
  frames: z.number().int().positive(),
  sha256: Sha256Schema,
});

export const StormoConfigSchema = z.object({
  /** Kill switch: false → no birds on mappa2, never legacy fallback. */
  enabled: z.boolean(),
  slotSec: z.number().positive(),
  probability: z.number().min(0).max(1),
  cooldownSec: z.number().nonnegative(),
  biomeCooldownSec: z.number().nonnegative(),
  /** Max concurrent FLOCKS (admissions), not birds. */
  maxActive: z.number().int().positive(),
  sizeWorldPx: z.number().positive(),
  flockCount: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  formation: z.enum(['v', 'cluster']),
  lifeSec: z.tuple([z.number().positive(), z.number().positive()]),
  speedPxS: z.tuple([z.number().positive(), z.number().positive()]),
  flapHz: z.number().positive(),
  opacity: z.number().min(0).max(1),
  /** Upward screen-y drift (px) over the first ~25% of life — the "rising" read. */
  climbPx: z.number().nonnegative(),
  /** Slight scale-in factor during climb (0..1 start scale). */
  climbScaleIn: z.number().min(0.1).max(1),
});

const TakeoffSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  biome: z.string().min(1),
  /** Resolved biome index from biomes.json — pinned at authoring time. */
  biomeIndex: z.number().int().positive(),
  heading: z.tuple([z.number(), z.number()]),
  weight: z.number().positive(),
});

const ExclusionSchema = z.object({
  type: z.literal('rect'),
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

export const Mappa2FaunaSchema = z
  .object({
    version: z.literal(1),
    canvas: z.tuple([z.number(), z.number()]),
    atlas: AtlasSchema,
    stormo: StormoConfigSchema,
    takeoffs: z.array(TakeoffSchema).min(1),
    exclusions: z.array(ExclusionSchema).default([]),
  })
  .strict();

export type Mappa2Fauna = z.infer<typeof Mappa2FaunaSchema>;
export type Mappa2StormoConfig = z.infer<typeof StormoConfigSchema>;
export type Mappa2Takeoff = z.infer<typeof TakeoffSchema>;

/** Validate a raw `fauna.json` payload. Throws ZodError on contract violation. */
export function parseMappa2Fauna(raw: unknown): Mappa2Fauna {
  return Mappa2FaunaSchema.parse(raw);
}
