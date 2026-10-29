import { z } from 'zod';

/**
 * PLAN-094: strict Zod schema for `ambient-director.json` — the baked
 * shoal-zone + exclusion + maskDigest contract for `/mappa2-lab`.
 *
 * Deliberately a dedicated leaf module: it is imported only by the lab map
 * (`manifest.world === 'mappa2'`), so `worldSurfaceConfig.ts` and the `/game`
 * contract closure stay byte-identical (zero `contracts:check` cascade).
 */

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);

const ShoalZoneSchema = z.object({
  id: z.string().min(1),
  family: z.literal('shoal'),
  biome: z.string().min(1),
  cell: z.number().positive(),
  cells: z.array(z.tuple([z.number(), z.number(), z.number()])).min(1),
  heading: z.tuple([z.number(), z.number()]),
  maxTravelPx: z.number().positive(),
  coastPx: z.number(),
  paintL: z.number(),
  tintRow: z.string().min(1),
  deltaL: z.number(),
});

const ExclusionSchema = z.object({
  type: z.string().min(1),
}).passthrough();

const RouteSchema = z.object({
  id: z.string().min(1),
  family: z.string().min(1),
  kind: z.string().min(1),
  polyline: z.array(z.tuple([z.number(), z.number()])).min(2),
  widthPx: z.number().positive(),
  clearancePx: z.number().nonnegative(),
}).passthrough();

export const Mappa2AmbientDirectorSchema = z
  .object({
    version: z.literal(1),
    canvas: z.tuple([z.number(), z.number()]),
    seed: z.string().min(1),
    maskDigest: Sha256Schema,
    constants: z.object({
      cellPx: z.number().positive(),
      coastPx: z.tuple([z.number(), z.number()]),
      poissonPx: z.number().positive(),
      maxRadiusPx: z.number().positive(),
      maxTravelPx: z.number().positive(),
      alpha: z.number().min(0).max(1),
      deltaLBand: z.tuple([z.number(), z.number()]),
      tintRows: z.array(z.object({ id: z.string().min(1), lStar: z.number() })).min(1),
    }),
    zones: z.array(ShoalZoneSchema),
    exclusions: z.array(ExclusionSchema),
    routes: z.array(RouteSchema).max(0), // schema v0: empty until ships (slice 2)
    generatedFrom: z.object({ sourceSha256: Sha256Schema }).passthrough(),
  })
  .strict();

/** Parsed ambient-director contract for `/mappa2-lab`. */
export type Mappa2AmbientDirector = z.infer<typeof Mappa2AmbientDirectorSchema>;

/**
 * Validate a raw `ambient-director.json` payload. Throws a ZodError describing
 * the offending field when the contract is violated.
 */
export function parseMappa2AmbientDirector(raw: unknown): Mappa2AmbientDirector {
  return Mappa2AmbientDirectorSchema.parse(raw);
}
