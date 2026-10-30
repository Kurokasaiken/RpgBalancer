import { z } from 'zod';

/**
 * PLAN-098 (v1 mist+embers): strict Zod schema for `weather-anchors.json` —
 * the leaf contract for regional atmospheric accents on `/mappa2-lab`.
 * Dedicated leaf module (PLAN-095 pattern): zero hunk on worldSurfaceConfig.ts.
 * PLAN-099 re-key: `biome` field, never region.
 */

const WeatherTypeSchema = z.enum(['mist', 'ember', 'dust', 'glint', 'volcano', 'orographic']);

const AnchorSchema = z
  .object({
    id: z.string().regex(/^(mist|ember|dust|glint|volcano|orographic)_\d{2}$/),
    type: WeatherTypeSchema,
    x: z.number().finite().min(0).max(2752),
    y: z.number().finite().min(0).max(1536),
    radius: z.number().positive(),
    reach: z.number().positive(),
    weight: z.number().min(0).max(1),
    phase: z.number().min(0).max(1),
  })
  .strict()
  .refine((a) => a.id.startsWith(`${a.type}_`), {
    message: 'anchor id prefix must match type',
  });

export const Mappa2RegionalWeatherSchema = z
  .object({
    schemaVersion: z.literal(1),
    seed: z.number().int(),
    canvas: z.object({ width: z.literal(2752), height: z.literal(1536) }).strict(),
    caps: z
      .object({
        mist: z.number().int().min(0).max(32),
        embers: z.number().int().min(0).max(16),
        dust: z.number().int().min(0).max(16),
        glints: z.number().int().min(0).max(16),
        volcano: z.number().int().min(0).max(24),
        orographic: z.number().int().min(0).max(24),
      })
      .strict()
      .refine((c) => c.mist + c.embers + c.dust + c.glints + c.volcano + c.orographic <= 60, {
        message: 'sum(caps) must be <= 60',
      }),
    thresholds: z
      .object({
        minReach: z.record(WeatherTypeSchema, z.number().positive()),
        minSpacing: z.record(WeatherTypeSchema, z.number().positive()),
        shorelineMargin: z.number().positive(),
        driftMax: z.record(WeatherTypeSchema, z.number().min(0)), // 0 legit: glints twinkle in place
      })
      .strict(),
    generatedFrom: z
      .object({ sourceSha256: z.string().regex(/^[0-9a-f]{64}$/), artifact: z.string().min(1) })
      .strict(),
    anchors: z.array(AnchorSchema),
  })
  .strict()
  .refine((d) => new Set(d.anchors.map((a) => a.id)).size === d.anchors.length, {
    message: 'anchor ids must be unique',
  })
  .refine(
    (d) =>
      d.anchors.every((a) => {
        const drift = d.thresholds.driftMax[a.type] ?? Number.POSITIVE_INFINITY;
        return a.radius + drift <= a.reach + 1e-6;
      }),
    { message: 'every anchor must satisfy radius + driftMax <= reach' },
  );

export type Mappa2RegionalWeather = z.infer<typeof Mappa2RegionalWeatherSchema>;
export type WeatherAnchor = Mappa2RegionalWeather['anchors'][number];

/**
 * Module-level live config ref — the lab writes here, the overlay reads
 * every tick. Module singleton (not a prop) so PixiWorldMap.tsx stays
 * within the <=4-line diff budget (T-13).
 */
export const regionalWeatherConfigRef: { current: RegionalWeatherLiveConfig } = {
  current: { enabled: true, mist: 1, embers: 0, volcano: 1, orographic: 1, dust: 0, glints: 0, river: 1, speed: 1, opacity: 0.6 },
};

/** Live lab-driven config (same ref pattern as ambient/secondaryWater). */
export interface RegionalWeatherLiveConfig {
  enabled: boolean;
  mist: number;   // 0..1 → visible count fraction of cap
  embers: number; // reserved (v1: volcano supersedes the dot-embers family)
  volcano: number; // 0..1 → plume density fraction of cap
  orographic: number; // 0..1 → cloud-bank density fraction of cap
  dust: number;   // reserved (cap 0 in v1)
  glints: number; // removed 2026-10-30: always 0, no UI
  river: number;  // 0..1 north water chain (snow-melt -> small fall -> lake)
  speed: number;  // 0.25..3
  opacity: number; // 0..1 global multiplier
}
