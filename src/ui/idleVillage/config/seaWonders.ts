import { z } from 'zod';

/**
 * Sea wonder catalog for the World Surface.
 *
 * These are rare, event-grade presences (kraken, whale, ghost ship) that appear
 * briefly on the sea layer and then disappear. The catalog is source-of-truth
 * for their asset, display size and spawn animation.
 *
 * WHERE they may surface is not decided here: the `wonder` anchors in
 * `points.json` are open water with the carved frame's own silhouette subtracted,
 * emitted by `scripts/build-terrain-masks.mjs`. Distance from the coast and from
 * the frame is baked into those anchors, so it deliberately has no counterpart
 * below — a second copy in TypeScript would be a second source of truth that
 * drifts the moment the illustration is re-exported.
 */

export const SeaWonderEntranceSchema = z.object({
  type: z.enum(['rise', 'sail']),
  /** Percent of the sprite height to start below final position (rise only). */
  riseOffset: z.number().nonnegative().optional(),
  /** Initial scale multiplier while rising (1 = full size, 0.5 = half). */
  riseScale: z.number().positive().optional(),
  /** Angle of the ship's bow in degrees; 0 = right, 90 = down, -90 = up. */
  sailAngle: z.number().optional(),
  /** Percent of the sprite width to start behind the bow (sail only). */
  sailDistance: z.number().nonnegative().optional(),
});

export const SeaWonderSchema = z.object({
  id: z.string(),
  src: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  opacity: z.number().min(0).max(1).default(1),
  animation: z.enum(['rise', 'fade']).optional(),
  entrance: SeaWonderEntranceSchema.optional(),
});

export type SeaWonder = z.infer<typeof SeaWonderSchema>;
export type SeaWonderEntrance = z.infer<typeof SeaWonderEntranceSchema>;

export const wonderSpawnDefaults = {
  /** Average cadence for the random ambient wonder spawner. */
  spawnIntervalMs: 16000,
  /** How long a wonder stays on screen before despawning. */
  wonderLifetimeMs: 5000,
  /** Sea-wonders must stay this far from each other (debug + ambient). */
  minWonderSpacing: 500,
  /**
   * Sea-wonders must stay this far from any wave mark center.
   *
   * Still enforced here, and not baked into the anchors, because the wave marks are
   * authored in `atmosphereAssets` rather than derived from the art — the point
   * generator cannot see them.
   */
  minDistanceFromWaveMarks: 300,
  /** Never more than this many ambient wonders on screen at once. */
  maxActiveWonders: 2,
  /** No jitter: spacing is more important than a fake random offset. */
  positionJitter: 0,
  /**
   * Surfacing animation lengths.
   *
   * A rise has to read as a slow break through the surface, so it takes most of the
   * 5s lifetime; a fade is just an arrival and does not need as long.
   */
  riseDurationMs: 2600,
  fadeDurationMs: 1600,
} as const;

export const seaWonderCatalog: SeaWonder[] = [
  {
    id: 'kraken',
    src: 'wonders/kraken1.webp',
    width: 73,
    height: 64,
    opacity: 0.95,
    animation: 'rise',
    entrance: { type: 'rise', riseOffset: 45, riseScale: 0.5 },
  },
  {
    id: 'balena',
    src: 'wonders/balena1.webp',
    width: 60,
    height: 41,
    opacity: 0.95,
    animation: 'fade',
    entrance: { type: 'rise', riseOffset: 30, riseScale: 0.75 },
  },
  {
    id: 'nave-pirata',
    src: 'wonders/nave-pirata1.webp',
    width: 53,
    height: 49,
    opacity: 0.95,
    animation: 'fade',
    entrance: { type: 'sail', sailAngle: 0, sailDistance: 80 },
  },
];
