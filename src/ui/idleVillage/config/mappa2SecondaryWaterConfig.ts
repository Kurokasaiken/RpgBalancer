import { z } from 'zod';

/**
 * PLAN-095: strict Zod schema for `secondary-water.json` — the authored
 * secondary-water contract for `/mappa2-lab` (rivers, lakes, confluences).
 *
 * Deliberately a dedicated leaf module: it is imported only by the lab map
 * (`manifest.world === 'mappa2'`), so `worldSurfaceConfig.ts` and the `/game`
 * contract closure stay byte-identical (zero `contracts:check` cascade).
 */

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);

const Point2Schema = z.tuple([z.number(), z.number()]);

const GlintPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const PolygonSchema = z.array(Point2Schema).min(3);

const RiverSegmentSchema = z.object({
  cx: z.number(),
  cy: z.number(),
  angleRad: z.number(),
  length: z.number().positive(),
  width: z.number().positive(),
});

/**
 * PLAN-095 v2: painted flow-map poses for one feature (RGBA, alpha = the
 * feature's feathered water mask), cycled by the runtime. Rect in world px.
 */
const FlowPosesSchema = z.object({
  frames: z.array(z.string().regex(/^fx\/water\/[a-z0-9_]+_f\d+\.webp$/)).min(2).max(16),
  rect: z.object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

const RiverFeatureSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i),
  glintPoints: z.array(GlintPointSchema).default([]),
  safePolygons: z.array(PolygonSchema).min(1),
  segments: z.array(RiverSegmentSchema).min(1),
  flowPoses: FlowPosesSchema.optional(),
});

const LakeFeatureSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  safePolygons: z.array(PolygonSchema).min(1),
  glintPoints: z.array(GlintPointSchema).min(1),
  flowPoses: FlowPosesSchema.optional(),
});

const ConfluenceSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  radiusPx: z.number().positive().max(18),
});

export const Mappa2SecondaryWaterSchema = z
  .object({
    generatedFrom: z.string().min(1),
    sourceSha256: Sha256Schema,
    geometrySha256: Sha256Schema,
    waterfallFlowPolygonSha256: Sha256Schema,
    riverFlowTile: z.literal('fx/water/river_flow_tile.webp'),
    riverFlowTileSha256: Sha256Schema,
    riverFlowMask: z.literal('masks/river_flow_mask.webp'),
    lakeShimmerMask: z.literal('masks/lake_shimmer_mask.webp'),
    rivers: z.array(RiverFeatureSchema).min(1).max(8),
    lakes: z.array(LakeFeatureSchema).min(1).max(8),
    confluences: z.array(ConfluenceSchema).min(1).max(8),
    /** Falls basin: outward ripple poses (PLAN-092 v3), optional. */
    basin: z.object({ flowPoses: FlowPosesSchema }).optional(),
    /** Sea water animated with painted poses: bays and river mouths. */
    seaPatches: z.array(z.object({ id: z.string().min(1), flowPoses: FlowPosesSchema })).optional(),
  })
  .superRefine((value, ctx) => {
    const ids = new Set<string>();
    for (const feature of [...value.rivers, ...value.lakes]) {
      if (ids.has(feature.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate feature id ${feature.id}` });
      }
      ids.add(feature.id);
    }
    const totalVerts = [...value.rivers, ...value.lakes].reduce(
      (sum, f) => sum + f.safePolygons.reduce((acc, p) => acc + p.length, 0),
      0,
    );
    if (totalVerts > 400) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `total vertices ${totalVerts} > 400` });
    }
    const totalSegs = value.rivers.reduce((sum, r) => sum + r.segments.length, 0);
    if (totalSegs > 64) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `total segments ${totalSegs} > 64` });
    }
    const totalBbox = value.rivers.reduce(
      (sum, r) => sum + r.segments.reduce((acc, s) => acc + s.length * s.width, 0),
      0,
    );
    if (totalBbox > 150000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `oriented bbox area ${totalBbox} > 150000` });
    }
    const totalGlints =
      value.lakes.reduce((sum, l) => sum + l.glintPoints.length, 0) +
      value.rivers.reduce((sum, r) => sum + r.glintPoints.length, 0);
    if (totalGlints > 40) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `total glints ${totalGlints} > 40` });
    }
    // Anti-uphill: consecutive segments must keep a positive direction dot.
    for (const river of value.rivers) {
      for (let i = 1; i < river.segments.length; i += 1) {
        const prev = river.segments[i - 1];
        const cur = river.segments[i];
        const dot =
          Math.cos(prev.angleRad) * Math.cos(cur.angleRad) +
          Math.sin(prev.angleRad) * Math.sin(cur.angleRad);
        if (dot <= 0.5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${river.id} segment ${i} turns back uphill (dot ${dot.toFixed(2)})`,
          });
        }
      }
    }
  });

/** Parsed secondary-water contract for `/mappa2-lab`. */
export type Mappa2SecondaryWater = z.infer<typeof Mappa2SecondaryWaterSchema>;

/**
 * Validate a raw `secondary-water.json` payload. Throws a ZodError describing
 * every violated gate; callers must treat failure as a hard boot error for
 * the lab (the contract is mandatory for `manifest.world === 'mappa2'`).
 */
export function parseMappa2SecondaryWater(raw: unknown): Mappa2SecondaryWater {
  return Mappa2SecondaryWaterSchema.parse(raw);
}
