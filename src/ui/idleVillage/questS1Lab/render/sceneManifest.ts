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
import { ATMOSPHERE_KITS } from '@/balancing/config/idleVillage/quests/questAtmosphereFx';
import { JOURNEY_LEG_ART, NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';

/**
 * Ambient FX descriptor — the "life after the shot lands" layer
 * (PLAN-046 ambient slice, 2026-10-18). `at`/`band` are image-fraction
 * coordinates on the artwork: the renderer maps them through the same
 * `shaderUniforms` window math as the camera, so anchored FX ride the
 * parallax (the glow stays on the fire when the camera pans).
 * `dust` is the exception: motes live in the air in front of the lens —
 * view-space, not anchored.
 */
export const AmbientFxSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('dust'),
    count: z.number().int().min(1).max(24).default(14),
  }),
  z.object({
    type: z.literal('glow'),
    at: z.tuple([z.number(), z.number()]),
    /** Radius as a fraction of image height. */
    r: z.number().positive().max(0.5),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    a: z.number().min(0).max(1),
    /** Flicker depth 0..1 — fire breathes; 0 = steady lamp. */
    flicker: z.number().min(0).max(1).default(0.35),
  }),
  z.object({
    type: z.literal('smoke'),
    at: z.tuple([z.number(), z.number()]),
    count: z.number().int().min(1).max(10).default(4),
    /** Column lean in img-fraction per life — wind direction. */
    lean: z.number().min(-0.5).max(0.5).default(0.12),
  }),
  z.object({
    type: z.literal('embers'),
    at: z.tuple([z.number(), z.number()]),
    count: z.number().int().min(1).max(10).default(5),
  }),
  z.object({
    type: z.literal('drift'),
    /** Fog / low-cloud band, img-fraction y-range it travels in. */
    band: z.tuple([z.number(), z.number()]),
    count: z.number().int().min(1).max(8).default(3),
    /** Img-fraction per second — fog is SLOW. */
    speed: z.number().min(-0.05).max(0.05).default(0.01),
    a: z.number().min(0).max(0.3).default(0.08),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#cfe4e0'),
  }),
]);
export type AmbientFx = z.infer<typeof AmbientFxSchema>;

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
  /** PLAN-050 §3: authored entrance personality — fires only when the art
   *  changes (same-art beats never re-enter). */
  entrance: CameraShotIdSchema.optional(),
  /** PLAN-050 §3: authored hold pose — the stance the camera settles into
   *  after the entrance (the pillow-shot tier). */
  pose: CameraShotIdSchema.optional(),
  /** PLAN-050 §3: the narrative focal point in img-fraction coords —
   *  target of `enter-creep` convergence, stat-pull modulation, and the
   *  anchored label layer. */
  focusAnchor: z.tuple([z.number(), z.number()]).optional(),
  /** PLAN-050 T-013 — asset-backed atmosphere overlay kit ids; every id
   *  must exist in `ATMOSPHERE_KITS` (lint fails the manifest otherwise). */
  atmosphere: z
    .array(z.string())
    .default([])
    .refine((ids) => ids.every((id) => id in ATMOSPHERE_KITS), {
      message: 'atmosphere id not in ATMOSPHERE_KITS registry',
    }),
  /** Anchored ambient FX — fires, smoke, fog, dust (PLAN-046 ambient slice). */
  ambient: z.array(AmbientFxSchema).default([]),
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
  /* ---- Sterminio Goblin (PLAN-050): entrance × pose authored per scene;
   *  anchors from visual review of the painted art. */
  'sentiero-tracce': {
    depth: '/assets/depth/sentiero-tracce.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* discovery — creep onto the white rag marker on the right-hand twig. */
    entrance: 'enter-creep',
    pose: 'pose-watch',
    focusAnchor: [0.62, 0.56],
    /* Forest path — ground fog belongs here (Director: "la nebbia deve
     * essere in sentiero tracce, non in foresta agguato"). Pooled by the
     * scene's depth mask, not a suspended band. */
    atmosphere: ['fog-low'],
    ambient: [
      { type: 'dust', count: 16 },
      { type: 'drift', band: [0.45, 0.62], count: 3, speed: 0.01, a: 0.12, color: '#dfe8e2' },
    ],
  },
  'carro-nascosto': {
    depth: '/assets/depth/carro-nascosto.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* discovery — the hidden chest under the god rays. */
    entrance: 'enter-creep',
    pose: 'pose-rest',
    focusAnchor: [0.56, 0.45],
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 20 },
      { type: 'drift', band: [0.1, 0.35], count: 3, speed: 0.009, a: 0.13, color: '#e8ecd8' },
    ],
  },
  'accampamento-raider': {
    depth: '/assets/depth/accampamento-raider.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* observation — spying on the camp from cover. */
    entrance: 'enter-settle-cover',
    pose: 'pose-watch',
    focusAnchor: [0.55, 0.62],
    atmosphere: [],
    ambient: [
      /* Big campfire right-of-center + the pot fire under the tripod. */
      { type: 'glow', at: [0.555, 0.63], r: 0.12, color: '#ff9838', a: 0.5, flicker: 0.45 },
      { type: 'glow', at: [0.44, 0.585], r: 0.06, color: '#ff9838', a: 0.35, flicker: 0.5 },
      { type: 'smoke', at: [0.552, 0.6], count: 5, lean: 0.14 },
      { type: 'smoke', at: [0.44, 0.56], count: 3, lean: 0.1 },
      { type: 'embers', at: [0.555, 0.62], count: 5 },
      { type: 'dust', count: 8 },
    ],
  },
  'assalto-goblin': {
    depth: '/assets/depth/assalto-goblin.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* confrontation — the night assault. */
    entrance: 'enter-direct',
    pose: 'pose-tense',
    focusAnchor: [0.42, 0.6],
    /* Night raid: multiply on an already-dark scene is physically
     * invisible — fog reads better under firelight (pass-2 captures). */
    atmosphere: [],
    ambient: [
      /* Two painted bonfires: center-left + right. */
      { type: 'glow', at: [0.42, 0.62], r: 0.14, color: '#ff8c30', a: 0.55, flicker: 0.5 },
      { type: 'glow', at: [0.69, 0.58], r: 0.12, color: '#ff8c30', a: 0.5, flicker: 0.45 },
      { type: 'smoke', at: [0.42, 0.55], count: 6, lean: 0.1 },
      { type: 'smoke', at: [0.69, 0.52], count: 5, lean: 0.12 },
      { type: 'embers', at: [0.42, 0.58], count: 7 },
      { type: 'embers', at: [0.69, 0.54], count: 5 },
      { type: 'dust', count: 6 },
    ],
  },
  'fuga-goblin': {
    depth: '/assets/depth/fuga-goblin.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* pursuit — the fleeing goblins in the canyon mid-ground. */
    entrance: 'enter-sweep',
    pose: 'pose-tense',
    focusAnchor: [0.5, 0.66],
    /* Canyon chase at speed — no fog, no drifting cloud (Director OB-8:
     * "la nebbia non sta bene in tutte le scene — fuga no"). */
    atmosphere: [],
    ambient: [{ type: 'dust', count: 10 }],
  },
  saccheggio: {
    depth: '/assets/depth/saccheggio.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* discovery — the abandoned loot, sun shafts through the canopy. */
    entrance: 'enter-creep',
    pose: 'pose-rest',
    focusAnchor: [0.3, 0.62],
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 16 },
      /* Painted smoke wisp upper-right — a thin column keeps it alive. */
      { type: 'smoke', at: [0.72, 0.35], count: 2, lean: 0.08 },
    ],
  },
  'viaggio-andata': {
    /* Journey legs (PLAN-053/R-263, prompts .mw/specs/quest-journey-legs):
     * 3168×1320 theatre art — replaces the public-domain `ritorno.jpg`
     * placeholder entry and the contain-fit mountain layer. */
    depth: '/assets/depth/viaggio-andata.webp',
    depthWidth: 1584,
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    /* outbound — the open gate at dawn; the road unspools into the
     * wilderness, so the entrance sweeps along it. */
    entrance: 'enter-sweep',
    pose: 'pose-rest',
    /* Narrative focal: the trail vanishing into the forest wall —
     * the direction of the whole leg. */
    focusAnchor: [0.55, 0.55],
    atmosphere: [],
    ambient: [
      /* Ember lantern still burning on the left gate post. */
      { type: 'glow', at: [0.185, 0.46], r: 0.05, color: '#ffb050', a: 0.4, flicker: 0.45 },
      { type: 'embers', at: [0.185, 0.46], count: 3 },
      { type: 'dust', count: 12 },
      /* High cloud drift over the peaks. */
      { type: 'drift', band: [0.02, 0.28], count: 3, speed: 0.01, a: 0.07, color: '#e8e2d0' },
    ],
  },
  'viaggio-ritorno': {
    depth: '/assets/depth/viaggio-ritorno.webp',
    depthWidth: 1584,
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    /* journey home — the village valley at sunset; same sweep, mirrored. */
    entrance: 'enter-sweep',
    pose: 'pose-rest',
    /* Narrative focal: the village below — home, the end of the road. */
    focusAnchor: [0.6, 0.62],
    atmosphere: [],
    ambient: [
      /* Shrine ember on the right frame edge + village chimney smoke. */
      { type: 'glow', at: [0.865, 0.365], r: 0.05, color: '#ffb050', a: 0.4, flicker: 0.3 },
      { type: 'smoke', at: [0.55, 0.42], count: 3, lean: 0.1 },
      { type: 'smoke', at: [0.6, 0.44], count: 2, lean: 0.12 },
      { type: 'dust', count: 10 },
    ],
  },
  'agguato-foresta': {
    depth: '/assets/depth/agguato-foresta.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* observation/ambush — concealed, watching the sunlit path. */
    entrance: 'enter-settle-cover',
    pose: 'pose-watch',
    focusAnchor: [0.42, 0.5],
    /* Forest ambush — the Director moved the fog to sentiero-tracce;
     * the ambush stays on painted atmosphere + ambient only. */
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 12 },
      /* Low warm haze drifting over the sunlit path (band in img fractions). */
      { type: 'drift', band: [0.62, 0.9], count: 3, speed: 0.008, a: 0.07, color: '#e8d9b0' },
    ],
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
  const art = [...Object.values(NODE_ART), ...Object.values(JOURNEY_LEG_ART)].find((a) => a.src === src);
  if (!art || art.fit !== 'cover') return null;
  return SCENE_CINEMATICS[artIdFromSrc(src)] ?? null;
}
