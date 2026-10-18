/**
 * sceneManifest — per-scene cinematic registry (PLAN-046 §6).
 *
 * Keyed by art id (the `NODE_ART` src basename, no extension). Slice 1
 * ships depth entries only; the schema already reserves the fields the
 * later slices need (atmosphere overlays, per-scene camera override,
 * authored foreground cutout) so no migration is required.
 */

import { z } from 'zod';
import { CameraShotIdSchema } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';

/** One scene's cinematic data. All optional beyond `depth`. */
export const SceneCinematicEntrySchema = z.object({
  /** Half-resolution grayscale depth map, baked by scripts/bake-depth.py. */
  depth: z.string().regex(/^\/assets\/depth\/.+\.webp$/),
  /** Depth map pixel size — baked half-res of the source JPG. */
  depthWidth: z.number().int().positive(),
  depthHeight: z.number().int().positive(),
  /** Source image aspect (w/h) — proof input; checked against the file. */
  imgAspect: z.number().positive(),
  /** Per-scene focal override (defaults to the global config focal). */
  focal: z.number().min(0).max(1).optional(),
  /** Per-scene amplitude multiplier — folds into the certified bound. */
  ampMul: z.number().min(0).default(1),
  /** Per-scene shot override for the scene beat (authored direction). */
  camera: CameraShotIdSchema.optional(),
  /** Reserved (later slices): atmosphere overlay kit ids. */
  atmosphere: z.array(z.string()).default([]),
  /** Reserved (later slices): authored foreground cutout descriptor. */
  foregroundCutout: z
    .object({ src: z.string(), depth: z.number().min(0).max(1).optional() })
    .optional(),
});
export type SceneCinematicEntry = z.infer<typeof SceneCinematicEntrySchema>;

export const SceneCinematicManifestSchema = z.record(z.string(), SceneCinematicEntrySchema);

/**
 * The shipped manifest — validated at module load; a bad entry fails the
 * build, not the player's quest.
 */
export const SCENE_CINEMATICS: Record<string, SceneCinematicEntry> = SceneCinematicManifestSchema.parse({
  'agguato-foresta': {
    depth: '/assets/depth/agguato-foresta.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
  },
  'accampamento-raider': {
    depth: '/assets/depth/accampamento-raider.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
  },
});

/** Art id for a NODE_ART src (`/assets/scene-library/x.jpg` → `x`). */
export function artIdFromSrc(src: string): string {
  const base = src.split('/').pop() ?? src;
  return base.replace(/\.[a-z0-9]+$/i, '');
}

/**
 * Manifest entry for a NODE_ART src. Only `cover` assets qualify —
 * `contain` images are letterboxed by definition and the edge proof does
 * not apply; they keep the DOM path (dev warning only).
 */
export function cinematicEntryForSrc(src: string | undefined): SceneCinematicEntry | null {
  if (!src) return null;
  const art = Object.values(NODE_ART).find((a) => a.src === src);
  if (!art || art.fit !== 'cover') return null;
  return SCENE_CINEMATICS[artIdFromSrc(src)] ?? null;
}
