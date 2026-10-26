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
    /** Particle/rise scale vs the default — distant fires need small
     *  sparks (Director: "particelle non proporzionali alle fiamme"). */
    size: z.number().positive().max(3).default(1),
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
  /* PLAN-052 showcase set (R-271) — the "life after the shot" types the
   * authoring contract declares: point twinkle on metal/loot, a wandering
   * swarm in a band, insects orbiting a light anchor, god-ray fans. All
   * img-fraction anchored, all pure functions of the shared clock. */
  z.object({
    type: z.literal('glint'),
    at: z.tuple([z.number(), z.number()]),
    /** Twinkle period in seconds — treasure breathes light slowly. */
    period: z.number().positive().max(20).default(4),
    a: z.number().min(0).max(1).default(0.8),
    /** Radius as a fraction of image height — glints are point-sized. */
    r: z.number().positive().max(0.05).default(0.008),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#fff4d0'),
  }),
  z.object({
    type: z.literal('fireflies'),
    /** Wandering region — img-fraction y band the swarm lives in. */
    band: z.tuple([z.number(), z.number()]),
    /** Horizontal extent of the swarm, img-fraction (full width default). */
    xband: z.tuple([z.number(), z.number()]).default([0, 1]),
    count: z.number().int().min(1).max(16).default(6),
    a: z.number().min(0).max(0.6).default(0.35),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#d8f27a'),
  }),
  z.object({
    type: z.literal('moths'),
    at: z.tuple([z.number(), z.number()]),
    /** Orbit radius as a fraction of image height. */
    r: z.number().positive().max(0.2).default(0.035),
    count: z.number().int().min(1).max(6).default(3),
    /** Orbit speed multiplier — moths are slow, erratic orbiters. */
    speed: z.number().min(0.2).max(4).default(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#e8dcc0'),
  }),
  z.object({
    type: z.literal('shaft'),
    /** Entry point of the light, img-fraction (usually near the top edge). */
    from: z.tuple([z.number(), z.number()]),
    /** Where the fan lands, img-fraction. */
    to: z.tuple([z.number(), z.number()]),
    /** Full fan width at the base, as a fraction of image height. */
    width: z.number().positive().max(0.4).default(0.12),
    /** Parallel rays in the fan. */
    count: z.number().int().min(1).max(6).default(3),
    a: z.number().min(0).max(0.4).default(0.1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#fff2cc'),
  }),
  z.object({
    type: z.literal('leaves'),
    /** Fall window in img-fraction y (top spawn → bottom fade). */
    band: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
    /** Optional x window (defaults to the whole width). */
    xband: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).default([0, 1]),
    count: z.number().int().min(1).max(40).default(12),
    /** Fall speed multiplier — leaves are slow and flutter sideways. */
    speed: z.number().min(0.2).max(3).default(1),
    a: z.number().min(0).max(1).default(0.8),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#c99b46'),
  }),
  z.object({
    type: z.literal('rain'),
    /** Fall window in img-fraction y. */
    band: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
    count: z.number().int().min(4).max(120).default(60),
    /** Slant of the streaks (x drift per fall, img-fraction). */
    lean: z.number().min(-0.3).max(0.3).default(0.08),
    /** Fall speed multiplier. */
    speed: z.number().min(0.3).max(4).default(1),
    a: z.number().min(0).max(0.8).default(0.35),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#b8ccd8'),
  }),
  z.object({
    type: z.literal('plate'),
    /** Horizontal cel strip (webp), generated from a video-model clip. */
    src: z.string().regex(/^\/assets\/plates\/.+\.webp$/),
    /** Number of cels in the strip. */
    frames: z.number().int().min(2).max(24),
    /** Center of the plate, img-fraction. */
    at: z.tuple([z.number(), z.number()]),
    /** Plate width/height, img-fraction. */
    w: z.number().positive().max(0.5),
    h: z.number().positive().max(0.5),
    /** Playback rate — 8-12 reads as painted loop, not video. */
    fps: z.number().min(4).max(18).default(10),
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
  /** PLAN-084 reveal — a hidden affordance the scene springs on click or
   *  after a timer: the region in img-fraction, the trigger, and the FX
   *  burst fired when the secret shows (ambushers revealed, cache found). */
  reveal: z
    .object({
      /** Interactive region [x, y, w, h] in img-fraction coordinates. */
      region: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      /** click = player finds it; timed = it springs on its own. */
      trigger: z.enum(['click', 'timed']),
      /** Timed trigger delay in seconds (ignored for click). */
      afterSeconds: z.number().positive().default(8),
      /** The burst of FX spawned at reveal — the tell becoming visible. */
      burst: z.array(AmbientFxSchema).default([]),
      /** Optional flag pushed into run.flags on reveal. */
      flag: z.string().optional(),
      /* PLAN-084 plate-swap: the revealed-state plate (same composition,
       *  secret shown — goblins risen). Rendered over the base plate,
       *  clipped to the cutout region while the cutout slides away. */
      revealSrc: z.string().optional(),
      /* cutout-slide: the authored occluder (a piece of the hidden plate —
       *  the left rock mass) slides off revealing `revealSrc` beneath.
       *  fade: plain crossfade of the clipped region.
       *  panel-slide (Director 2026-10-24): a full foreground panel covering
       *  ~85% slides left off-frame — the scene was behind it all along.
       *  Variants of what shows on reveal: 'sprites' = extracted goblin
       *  cutouts rise into the scene; 'strips' = the revealed plate arrives
       *  in vertical stripes left→right. */
      revealMode: z.enum(['fade', 'cutout-slide', 'panel-slide', 'parallax-slide']).optional(),
      /** Full-frame foreground panel src — the painted occluder that slides. */
      panelSrc: z.string().optional(),
      /** What the revealed moment does: sprites entering vs stripes arriving. */
      revealFx: z.enum(['sprites', 'strips']).optional(),
      /** Scene-authored reveal sprites — extracted cutouts that rise into
       *  the scene after the panel slides (src + img-fraction home +
       *  delay + rise duration). NEVER hardcoded per-layer. */
      sprites: z
        .array(
          z.object({
            src: z.string(),
            home: z.tuple([z.number(), z.number(), z.number(), z.number()]),
            delay: z.number().min(0).default(0.5),
            rise: z.number().positive().default(0.3),
          }),
        )
        .optional(),
      /** The occluder rect the cutout covers, in img-fraction [x,y,w,h]. */
      cutout: z
        .object({
          region: z.tuple([z.number(), z.number(), z.number(), z.number()]),
          slide: z.enum(['left', 'right', 'down']).default('left'),
          slideSeconds: z.number().positive().default(1.4),
        })
        .optional(),
    })
    .optional(),
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
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    /* discovery — creep onto the amber lights deep in the treeline
     * (v2 2026-10-24: replaced wheel-rut art; the camp is foreshadowed). */
    entrance: 'enter-creep',
    pose: 'pose-watch',
    focusAnchor: [0.6, 0.47],
    /* Forest path — ground fog belongs here (Director: "la nebbia deve
     * essere in sentiero tracce, non in foresta agguato"). Pooled by the
     * scene's depth mask, not a suspended band. */
    atmosphere: ['fog-low'],
    ambient: [
      { type: 'dust', count: 16 },
      { type: 'drift', band: [0.45, 0.62], count: 3, speed: 0.01, a: 0.12, color: '#dfe8e2' },
      /* Painted amber lights deep in the treeline = the camp
       * foreshadowed — glint twinkles on the sources, fireflies in
       * the dark lower band of the left wall. */
      { type: 'glint', at: [0.598, 0.47], period: 5, r: 0.006 },
      { type: 'glint', at: [0.622, 0.45], period: 7, r: 0.005 },
      { type: 'glint', at: [0.655, 0.48], period: 9, r: 0.005 },
      { type: 'fireflies', band: [0.55, 0.75], xband: [0.05, 0.45], count: 5 },
      /* The forest breathes: sparse leaves dropping through the canopy. */
      { type: 'leaves', band: [0.08, 0.85], xband: [0.15, 0.95], count: 9 },
      /* The painted god-ray over the wet print — amplified runtime-owned
       *  (same rule as gola-raider: painted shaft gets a live shaft). */
      { type: 'shaft', from: [0.62, 0.03], to: [0.56, 0.55], width: 0.14, count: 3, a: 0.12, color: '#ffe9b8' },
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
      /* The hidden chest breathes: a brass glint through the foliage. */
      { type: 'glint', at: [0.55, 0.48], period: 7, r: 0.007 },
      { type: 'leaves', band: [0.1, 0.8], xband: [0.1, 0.9], count: 7 },
      { type: 'fireflies', band: [0.5, 0.7], xband: [0.1, 0.5], count: 4 },
    ],
  },
  bottino: {
    depth: '/assets/depth/bottino.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* discovery — the hide-lined pit, the single gold gleam betraying it. */
    entrance: 'enter-creep',
    pose: 'pose-rest',
    focusAnchor: [0.45, 0.58],
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 18 },
      /* The gleam inside the pit pulses — the tell that keeps the eye. */
      { type: 'glint', at: [0.46, 0.58], period: 7, r: 0.008 },
      { type: 'glint', at: [0.5, 0.62], period: 11, r: 0.005 },
      { type: 'drift', band: [0.05, 0.3], count: 2, speed: 0.007, a: 0.11, color: '#e8ecd8' },
      /* Sparse canopy leaves over the litter field. */
      { type: 'leaves', band: [0.1, 0.8], xband: [0.1, 0.9], count: 6 },
      { type: 'moths', at: [0.46, 0.5], count: 2 },
    ],
  },
  incalzare: {
    depth: '/assets/depth/incalzare.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    /* pursuit — the scattered rout into the dark, dropped torch still lit. */
    entrance: 'enter-sweep',
    pose: 'pose-tense',
    focusAnchor: [0.45, 0.55],
    atmosphere: [],
    ambient: [
      /* Re-anchored on the painted flames (Director 2026-10-24): main
       *  fire left at (0.15,0.55), second ember low-left (0.15,0.74),
       *  dropped torch guttering on the moss at (0.58,0.80). */
      /* Main fire: glow sits ON the flame tip above the woodpile —
       *  (0.15,0.48), embers rising from (0.15,0.50), smoke over. */
      { type: 'glow', at: [0.15, 0.48], r: 0.13, color: '#ff8c30', a: 0.55, flicker: 0.5 },
      { type: 'embers', at: [0.15, 0.50], count: 6 },
      { type: 'smoke', at: [0.15, 0.46], count: 4, lean: 0.14 },
      /* Second bonfire bottom-right (Director: era sul goblin a 0.40). */
      { type: 'glow', at: [0.95, 0.85], r: 0.06, color: '#ff9038', a: 0.45, flicker: 0.5 },
      { type: 'embers', at: [0.95, 0.83], count: 3 },
      { type: 'smoke', at: [0.95, 0.8], count: 2, lean: 0.12 },
      { type: 'glow', at: [0.15, 0.74], r: 0.06, color: '#ff9038', a: 0.35, flicker: 0.5 },
      { type: 'embers', at: [0.15, 0.72], count: 3 },
      /* The dropped torch on the moss — panic object, animated flame. */
      { type: 'glow', at: [0.58, 0.80], r: 0.055, color: '#ffa040', a: 0.5, flicker: 0.6 },
      { type: 'embers', at: [0.58, 0.78], count: 4 },
      { type: 'smoke', at: [0.58, 0.76], count: 2, lean: 0.18 },
      /* Dust in the lit corridor + slow drift swallowing the far dark. */
      { type: 'dust', count: 12 },
      { type: 'drift', band: [0.3, 0.7], xband: [0.55, 0.95], count: 3, speed: 0.006, a: 0.12, color: '#2a4a52' },
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
      /* 4 painted fires (re-anchor 2026-10-24 after v2 image): tent
       *  left, big campfire center, cook fire, palisade right. */
      { type: 'glow', at: [0.30, 0.48], r: 0.05, color: '#ff9838', a: 0.4, flicker: 0.5 },
      { type: 'glow', at: [0.43, 0.70], r: 0.12, color: '#ff9838', a: 0.55, flicker: 0.5 },
      { type: 'glow', at: [0.555, 0.63], r: 0.07, color: '#ff9838', a: 0.45, flicker: 0.45 },
      { type: 'glow', at: [0.68, 0.61], r: 0.06, color: '#ff9838', a: 0.4, flicker: 0.5 },
      { type: 'smoke', at: [0.43, 0.65], count: 5, lean: 0.14 },
      { type: 'smoke', at: [0.555, 0.58], count: 3, lean: 0.1 },
      { type: 'smoke', at: [0.68, 0.56], count: 2, lean: 0.12 },
      { type: 'embers', at: [0.43, 0.68], count: 6 },
      { type: 'embers', at: [0.555, 0.61], count: 3 },
      { type: 'embers', at: [0.68, 0.59], count: 3 },
      /* Dusk fireflies over the treeline behind the camp + a dull
       *  twinkle on the hanging cookware by the tripod. */
      { type: 'fireflies', band: [0.3, 0.42], xband: [0.15, 0.85], count: 6 },
      { type: 'glint', at: [0.47, 0.6], period: 8, r: 0.006 },
      { type: 'dust', count: 8 },
    ],
  },
  'agguato-v2': {
    /* f7 ambush (2026-10-26): empty cold-dusk road through the treeline,
     *  pale waypost, right-edge occluder trunk = the corner the player
     *  turns. Tension by composition, nothing shown. */
    depth: '/assets/depth/agguato-v2.webp',
    depthWidth: 512,
    depthHeight: 217,
    imgAspect: 1024 / 434,
    entrance: 'enter-creep',
    pose: 'pose-tense',
    focusAnchor: [0.72, 0.5],
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 10 },
      /* Cold mist drifting across the road. */
      { type: 'drift', band: [0.55, 0.75], count: 3, speed: 0.007, a: 0.08, color: '#cfe4e8' },
      /* Tells in the treeline — faint gleams where shapes could hide. */
      { type: 'glint', at: [0.62, 0.45], period: 6, r: 0.005 },
      { type: 'glint', at: [0.86, 0.42], period: 9, r: 0.005 },
      /* The just-snapped leaves stirring. */
      { type: 'leaves', band: [0.2, 0.6], xband: [0.5, 0.9], count: 4 },
    ],
    /* The ambush springs from behind the right occluder + treeline
     *  gaps — click the treeline to spot them, or the trap reveals
     *  itself on timeout. Same-composition revealed variant swaps in. */
    reveal: {
      region: [0.5, 0.3, 0.48, 0.45],
      trigger: 'click',
      afterSeconds: 8,
      burst: [
        { type: 'glint', at: [0.62, 0.45], period: 3, r: 0.009 },
        { type: 'glint', at: [0.86, 0.42], period: 3, r: 0.008 },
        { type: 'leaves', band: [0.2, 0.6], xband: [0.5, 0.95], count: 9 },
        { type: 'dust', count: 8 },
      ],
      flag: 'revealedAmbush',
      revealSrc: '/assets/scene-library/agguato-v2-revealed.png',
      revealFx: 'sprites',
    },
  },
  'spoglie-v2': {
    /* f6 war spoils (2026-10-26): the same camp minutes later — torn
     *  tents, dying embers, searchable points spread across the
     *  clearing (bodies, unopened tents, scattered metal). */
    depth: '/assets/depth/spoglie-v2.webp',
    depthWidth: 512,
    depthHeight: 217,
    imgAspect: 1024 / 434,
    entrance: 'enter-settle-cover',
    pose: 'pose-watch',
    focusAnchor: [0.5, 0.6],
    atmosphere: [],
    ambient: [
      /* Dying embers + thin smoke + ash motes in the half-light. */
      { type: 'glow', at: [0.25, 0.62], r: 0.07, color: '#ff9838', a: 0.4, flicker: 0.45 },
      { type: 'glow', at: [0.62, 0.6], r: 0.1, color: '#ff9838', a: 0.5, flicker: 0.5 },
      { type: 'smoke', at: [0.25, 0.55], count: 3, lean: 0.1 },
      { type: 'smoke', at: [0.62, 0.52], count: 4, lean: 0.12 },
      { type: 'embers', at: [0.62, 0.58], count: 5 },
      { type: 'glint', at: [0.76, 0.68], period: 11, r: 0.005 },
      { type: 'dust', count: 8 },
    ],
  },
  'incalzare-v2': {
    /* f5 pursuit (2026-10-26): chaotic flee through dense forest — backs
     *  swallowed by the green, no rocks/gorge (Director ruling). */
    depth: '/assets/depth/incalzare-v2.webp',
    depthWidth: 512,
    depthHeight: 217,
    imgAspect: 1024 / 434,
    entrance: 'enter-sweep',
    pose: 'pose-tense',
    focusAnchor: [0.3, 0.5],
    atmosphere: [],
    ambient: [
      /* Ember light spilling from the camp behind — painted, plus runtime. */
      { type: 'glow', at: [0.06, 0.45], r: 0.09, color: '#ff8c30', a: 0.4, flicker: 0.4 },
      { type: 'embers', at: [0.05, 0.5], count: 4 },
      { type: 'dust', count: 9 },
      { type: 'drift', band: [0.2, 0.32], xband: [0.3, 0.7], count: 2, lean: 0.25 },
    ],
  },
  'bottino-v2': {
    /* f2 hidden find (2026-10-26): modest stash in a hide-lined hollow
     *  under set-back undergrowth. Intimate downward look — creep in,
     *  the foreground fronds occlude the reveal. */
    depth: '/assets/depth/bottino-v2.webp',
    depthWidth: 512,
    depthHeight: 217,
    imgAspect: 1024 / 434,
    entrance: 'enter-creep',
    pose: 'pose-watch',
    focusAnchor: [0.5, 0.58],
    atmosphere: [],
    ambient: [
      /* Coin edge inside the bundle — painted glint + runtime twinkle. */
      { type: 'glint', at: [0.5, 0.63], period: 9, r: 0.005 },
      /* Sunlit motes in the shaft + faint mist pooling far back. */
      { type: 'dust', count: 10 },
      { type: 'drift', band: [0.18, 0.3], xband: [0.05, 0.5], count: 2, lean: 0.3 },
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
     * "la nebbia non sta bene in tutte le scene — fuga no"). Same
     * ruling holds the ambient list thin: dust kicked by the run is
     * the only "life" a pursuit wants. */
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 14 },
      /* The rolling dust curtain glows amber where the light rakes it. */
      { type: 'drift', band: [0.45, 0.7], xband: [0.2, 0.7], count: 4, speed: 0.011, a: 0.14, color: '#d8a050' },
      /* A stray torch abandoned on the rocks — the rout's trace. */
      { type: 'glint', at: [0.6, 0.55], period: 6, r: 0.007 },
      { type: 'embers', at: [0.6, 0.53], count: 3 },
    ],
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
      /* The loot talks: coin glints pulsing in the opened chest. */
      { type: 'glint', at: [0.22, 0.66], period: 5, r: 0.007 },
      { type: 'glint', at: [0.27, 0.7], period: 8, r: 0.005 },
      /* Ember-bed still warm under the wreckage + moths on the last light. */
      { type: 'embers', at: [0.68, 0.5], count: 4 },
      { type: 'glow', at: [0.68, 0.52], r: 0.05, color: '#ff8c30', a: 0.3, flicker: 0.5 },
      { type: 'moths', at: [0.68, 0.45], count: 3 },
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
    /* Dawn sky band is wide — but the clouds are PAINTED, so runtime
     *  cloud-sky was pulled (Director ruling: sprite kits cannot
     *  occlude behind near planes; a flat cloud crossing the gate
     *  posts reads as fog on the frame). ampMul halved: wide sky +
     *  near gate posts read too fast at full warp. */
    ampMul: 0.6,
    atmosphere: [],
    ambient: [
      /* Ember lantern still burning on the left gate post. */
      { type: 'glow', at: [0.185, 0.46], r: 0.05, color: '#ffb050', a: 0.4, flicker: 0.45 },
      { type: 'embers', at: [0.185, 0.46], count: 3 },
      { type: 'moths', at: [0.185, 0.46], r: 0.03, count: 3 },
      /* Hinge/chain hardware catching the dawn on the right gate post. */
      { type: 'glint', at: [0.78, 0.47], period: 7, r: 0.007 },
      /* Morning rays spilling through the gate arch onto the road —
       *  alpha raised after Director pass (0.10 was invisible). */
      { type: 'shaft', from: [0.42, 0.06], to: [0.5, 0.5], width: 0.16, count: 4, a: 0.15, color: '#ffe9b8' },
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
    ampMul: 0.65,
    /* Narrative focal: the village below — home, the end of the road. */
    focusAnchor: [0.6, 0.62],
    atmosphere: [],
    ambient: [
      /* Shrine ember on the right frame edge + village chimney smoke. */
      { type: 'glow', at: [0.865, 0.365], r: 0.05, color: '#ffb050', a: 0.4, flicker: 0.3 },
      { type: 'moths', at: [0.865, 0.365], r: 0.03, count: 3 },
      { type: 'glint', at: [0.85, 0.4], period: 6, r: 0.007 },
      /* Sunset fireflies along the pines' dark line, left of the road. */
      { type: 'fireflies', band: [0.42, 0.55], xband: [0.1, 0.4], count: 5 },
      { type: 'smoke', at: [0.55, 0.42], count: 4, lean: 0.1 },
      { type: 'smoke', at: [0.6, 0.44], count: 3, lean: 0.12 },
      { type: 'dust', count: 10 },
    ],
  },
  /* Lab A/B twin of viaggio-ritorno — pre-boost ambient set (Director:
   *  "prima e dopo" on the same painting). */
  'viaggio-ritorno-prev': {
    depth: '/assets/depth/viaggio-ritorno.webp',
    depthWidth: 1584,
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    entrance: 'enter-sweep',
    pose: 'pose-rest',
    focusAnchor: [0.6, 0.62],
    atmosphere: [],
    ambient: [
      { type: 'glow', at: [0.865, 0.365], r: 0.05, color: '#ffb050', a: 0.4, flicker: 0.3 },
      { type: 'smoke', at: [0.55, 0.42], count: 3, lean: 0.1 },
      { type: 'smoke', at: [0.6, 0.44], count: 2, lean: 0.12 },
      { type: 'dust', count: 10 },
    ],
  },
  'agguato-foresta': {
    depth: '/assets/depth/agguato-foresta.webp',
    depthWidth: 1584,
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    /* v2 (2026-10-24): SHOULDER archetype — creep along the left rock
     * mass toward the treeline where the ambushers hide. */
    entrance: 'enter-creep',
    pose: 'pose-tense',
    focusAnchor: [0.76, 0.45],
    ampMul: 0.7,
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 12 },
      /* Low warm haze drifting over the sunlit path (band in img fractions). */
      { type: 'drift', band: [0.62, 0.9], count: 3, speed: 0.008, a: 0.07, color: '#e8d9b0' },
      /* Arrowhead glints in the treeline — the tell that it's alive. */
      { type: 'glint', at: [0.79, 0.44], period: 5, r: 0.006 },
      { type: 'glint', at: [0.86, 0.46], period: 7, r: 0.005 },
      { type: 'glint', at: [0.7, 0.5], period: 11, r: 0.005 },
      /* Leaves stirring over the ambushers — the held breath moves. */
      { type: 'leaves', band: [0.15, 0.7], xband: [0.1, 0.9], count: 5 },
    ],
    /* PLAN-084: the ambushers hide in the right treeline — find them or
     *  they spring themselves. Click the treeline band = discovered;
     *  timer fallback = the trap reveals. */
    reveal: {
      region: [0.55, 0.3, 0.42, 0.4],
      trigger: 'click',
      afterSeconds: 9,
      burst: [
        { type: 'glint', at: [0.79, 0.44], period: 3, r: 0.01 },
        { type: 'glint', at: [0.86, 0.46], period: 3, r: 0.009 },
        { type: 'glint', at: [0.7, 0.5], period: 4, r: 0.008 },
        { type: 'glint', at: [0.76, 0.42], period: 4, r: 0.007 },
        { type: 'leaves', band: [0.2, 0.6], xband: [0.55, 0.95], count: 8 },
        { type: 'dust', count: 8 },
      ],
      flag: 'revealedAmbush',
      revealSrc: '/assets/scene-library/agguato-foresta-revealed.jpg',
      revealMode: 'panel-slide',
      /* Director 2026-10-24: the foreground mass (rock+stairs+tree) covers
       *  ~85% of the frame and slides left — the scene was behind it. */
      panelSrc: '/assets/scene-library/agguato-panel.png',
      revealFx: 'sprites', // default; lab overrides with ?revealfx=
      sprites: [
        { src: '/assets/scene-library/sprites/gob-lunge.png', home: [0.25, 0.15, 0.25, 0.47], delay: 0.4, rise: 0.35 },
        { src: '/assets/scene-library/sprites/gob-archer.png', home: [0.68, 0.25, 0.2, 0.43], delay: 0.7, rise: 0.25 },
        { src: '/assets/scene-library/sprites/gob-charge.png', home: [0.42, 0.3, 0.2, 0.3], delay: 0.55, rise: 0.3 },
      ],
      cutout: { region: [0.0, 0.0, 0.85, 1.0], slide: 'left', slideSeconds: 2.0 },
    },
  },
  /* ---- PLAN-052 flagship candidate: f3-gola-dusk (brief §6b shot
   *  grammar; anchors measured on the baked raster, 2026-10-23). The
   *  maximum-coherent-stack showcase: 11 runtime layers on one painted
   *  funnel — the gorge walls carry the parallax, the far glow is the
   *  push-in target. */
  /* PLAN-087 wide-plate pilot: Rivendell-style sanctuary valley —
   *  one canvas generated ~2x wide; left crop = foreground cover panel
   *  (root-ball + stairs), right crop = the revealed valley scene.
   *  Panel and scene come from the SAME painted plate — coincidence
   *  guaranteed by construction. */
  'santuario-valle': {
    depth: '/assets/depth/santuario-valle.webp',
    depthWidth: 1584,
    depthHeight: 672,
    imgAspect: 3168 / 1344,
    entrance: 'enter-creep',
    camera: 'push-in',
    pose: 'pose-watch',
    focusAnchor: [0.62, 0.5],
    ampMul: 0.85,
    atmosphere: [],
    ambient: [
      /* Waterfall drift at the falls base, banners on the bridge. */
      { type: 'drift', band: [0.45, 0.7], xband: [0.55, 0.8], count: 4, speed: 0.008, a: 0.14, color: '#dff4f8' },
      { type: 'shaft', from: [0.72, 0.02], to: [0.62, 0.55], width: 0.18, count: 4, a: 0.15, color: '#fff4c8' },
      { type: 'dust', count: 12 },
      { type: 'glint', at: [0.66, 0.58], period: 6, r: 0.008 },
      { type: 'glint', at: [0.7, 0.68], period: 8, r: 0.007 },
      { type: 'leaves', band: [0.05, 0.5], xband: [0.1, 0.9], count: 5 },
      { type: 'drift', band: [0.3, 0.45], xband: [0.5, 0.85], count: 3, speed: 0.006, a: 0.1, color: '#a8d88a' },
    ],
    reveal: {
      region: [0.5, 0.3, 0.45, 0.55],
      trigger: 'click',
      afterSeconds: 9,
      burst: [],
      revealMode: 'parallax-slide',
      panelSrc: '/assets/scene-library/santuario-fg.png',
      /* The root-ball mass (alpha-cut sprite) slides left off-frame while
       *  the valley drifts ~1/10th right — parallax, not wipe. */
      cutout: { region: [0.0, 0.0, 0.66, 1.0], slide: 'left', slideSeconds: 4.5 },
    },
  },

  'gola-raider': {
    depth: '/assets/depth/gola-raider.webp',
    depthWidth: 1584,
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    /* shot grammar (brief §6b): discovery entrance converging on the
     * enemy glow, then the push the funnel was composed for. */
    entrance: 'enter-creep',
    camera: 'push-in',
    pose: 'pose-watch',
    /* Narrative focal: the far campfire glow where the gorge bends. */
    focusAnchor: [0.68, 0.6],
    /* Raised 0.55→0.9 (Director 2026-10-24: "animarla meglio e di più") —
     *  the coulisse walls carry the warp; still below 1.0 so the idle
     *  drift reads as breath on the near masses, not swim. */
    ampMul: 0.9,
    atmosphere: ['fog-gorge', 'cloud-shadow'],
    ambient: [
      /* Far campfire — the destination. Small: it's a mile away, and
       *  its sparks must live at the painted flame's own scale. */
      { type: 'glow', at: [0.68, 0.6], r: 0.035, color: '#ffb050', a: 0.55, flicker: 0.5 },
      { type: 'embers', at: [0.68, 0.585], count: 3, size: 0.4 },
      { type: 'smoke', at: [0.68, 0.575], count: 2, lean: 0.08 },
      /* Trail torch on the rocky spur — mid-depth waymark. Anchors
       *  re-measured on the raster (Gemini video pass): the painted
       *  flame's luminous core sits at ~(0.567, 0.505) — a glow pinned
       *  low-left read as a detached halo smudge. */
      { type: 'glow', at: [0.567, 0.508], r: 0.02, color: '#ffcc66', a: 0.6, flicker: 0.55 },
      /* Single ember: on a point emitter the seeded phases can cluster
       *  and the sparks read as one pile (Director pass). */
      { type: 'embers', at: [0.567, 0.5], count: 1, size: 0.55 },
      { type: 'moths', at: [0.567, 0.505], r: 0.025, count: 3 },
      /* Fireflies along the mossy base of the left wall (behind the
       * ledge — v1 anchor moved after the bottom occluder landed). */
      { type: 'fireflies', band: [0.42, 0.58], xband: [0.1, 0.32], count: 6 },
      /* Water glints riding the stream diagonal. */
      { type: 'glint', at: [0.6, 0.82], period: 5, r: 0.009 },
      { type: 'glint', at: [0.52, 0.71], period: 6.5, r: 0.007 },
      { type: 'glint', at: [0.64, 0.65], period: 4, r: 0.006 },
      /* The dusk shaft the generator painted in v1 — now runtime-owned,
       * falling from the sky wedge into the gorge. Alpha raised after
       * the video pass: 0.07 read as a barely-there line, not a beam. */
      { type: 'shaft', from: [0.58, 0.04], to: [0.6, 0.52], width: 0.16, count: 4, a: 0.13, color: '#ffe9b8' },
      { type: 'dust', count: 10 },
      /* Director bundle 2026-10-24: more life in the gorge.
       * Water-skin drift sliding over the river at the bottom. */
      { type: 'drift', band: [0.78, 0.95], xband: [0.3, 0.75], count: 3, speed: 0.01, a: 0.1, color: '#9fd4cc' },
      /* Fine rain threads down the sky wedge — the gorge reads wet. */
      { type: 'rain', band: [0.0, 0.5], count: 20 },
      /* Leaves shearing off the wall rims into the funnel. */
      { type: 'leaves', band: [0.05, 0.5], xband: [0.05, 0.95], count: 6 },
    ],
  },
  /* Showcase "tutto il kit" — bivacco al crepuscolo. Hero motion = il
   * fuoco (glow+embers+smoke su una sorgente = stesso asse, permesso);
   * gli altri subordinati per la regola anti-spam del catalogo. */
  /* f3-intrusi (2026-10-24): SHOULDER specchiato — massa convessa a dx
   * come copertura; sagome in fila sul sentiero sx. Creep lungo la
   * massa verso le sagome; glint sulle punte di lancia = il tell. */
  'intrusi': {
    depth: '/assets/depth/intrusi.webp',
    depthWidth: 1584,
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    entrance: 'enter-creep',
    pose: 'pose-tense',
    focusAnchor: [0.28, 0.56],
    ampMul: 0.7,
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 12 },
      { type: 'drift', band: [0.6, 0.88], count: 3, speed: 0.008, a: 0.07, color: '#e8d9b0' },
      /* spear-tip glints on the infiltrator file (img-fraction, misurati) */
      { type: 'glint', at: [0.28, 0.5], period: 5, r: 0.006 },
      { type: 'glint', at: [0.32, 0.53], period: 7, r: 0.005 },
      /* Distant camp embers in the treeline + dusk fireflies below the ledge. */
      { type: 'embers', at: [0.55, 0.55], count: 3 },
      { type: 'fireflies', band: [0.5, 0.72], xband: [0.1, 0.6], count: 4 },
    ],
    tags: ['quest-goblin', 'f3-intrusi'],
  },
  'bivacco': {
    depth: '/assets/depth/bivacco.webp',
    depthWidth: 1584,
    depthHeight: 660,
    imgAspect: 3168 / 1320,
    entrance: 'enter-creep',
    pose: 'pose-rest',
    focusAnchor: [0.365, 0.62],
    ampMul: 0.6,
    atmosphere: ['fog-low'],
    ambient: [
      /* HERO — the campfire owns the scene: the flame is a generated
       *  cel plate (Grok video → 12 frames), runtime owns the light. */
      { type: 'plate', src: '/assets/plates/bivacco-fuoco.webp', frames: 12, at: [0.393, 0.599], w: 0.14, h: 0.28, fps: 10 },
      { type: 'glow', at: [0.365, 0.615], r: 0.035, color: '#ff9540', a: 0.6, flicker: 0.55 },
      { type: 'embers', at: [0.365, 0.6], count: 4, size: 0.5 },
      { type: 'smoke', at: [0.365, 0.58], count: 3, lean: 0.1 },
      /* The lantern post — a second smaller warm pool + moths + metal. */
      { type: 'glow', at: [0.573, 0.345], r: 0.022, color: '#ffcc66', a: 0.55, flicker: 0.4 },
      { type: 'moths', at: [0.573, 0.345], r: 0.03, count: 3 },
      { type: 'glint', at: [0.573, 0.33], period: 6, r: 0.005 },
      /* The pool — last light glinting on water, two spots. */
      { type: 'glint', at: [0.78, 0.86], period: 5, r: 0.008 },
      { type: 'glint', at: [0.86, 0.84], period: 7, r: 0.006 },
      /* Treeline darkness on the right = fireflies' band. */
      { type: 'fireflies', band: [0.3, 0.75], xband: [0.62, 0.95], count: 5 },
      /* Canopy haze drifting under the overhang. */
      { type: 'drift', band: [0.3, 0.5], count: 3, speed: 0.008, a: 0.09, color: '#8fa8a0' },
      /* Faint cool shaft falling through the treeline gap. */
      { type: 'shaft', from: [0.68, 0.02], to: [0.66, 0.52], width: 0.13, count: 3, a: 0.08, color: '#cfe4e8' },
      /* The dripping branch sheds leaves + a light drizzle. */
      { type: 'leaves', band: [0.06, 0.8], xband: [0.05, 0.5], count: 7 },
      { type: 'rain', band: [0.0, 0.95], count: 45, lean: 0.06, speed: 0.8, a: 0.18 },
      { type: 'dust', count: 8 },
    ],
  },
  'marcia-crinale': {
    /* PLAN-052 wide-plate parallax experiment (2026-10-26): 1024×285
     * painted ridge march — caravan focal lateral-left, road continuing
     * past both edges. Daylight ambient set only (A13: no fireflies in
     * sun); the `traverse` lab param sweeps the camera along the long
     * axis to test true horizontal depth-parallax. */
    depth: '/assets/depth/marcia-crinale.webp',
    depthWidth: 512,
    depthHeight: 142,
    imgAspect: 1024 / 285,
    entrance: 'enter-sweep',
    pose: 'pose-rest',
    /* Narrative focal: the caravan mid-march on the road. */
    focusAnchor: [0.4, 0.6],
    atmosphere: [],
    ambient: [
      { type: 'dust', count: 16 },
      /* Stream sparkle where the deer drink (water glints, day-true). */
      { type: 'glint', at: [0.33, 0.9], period: 6, r: 0.006, color: '#dff4ff' },
      { type: 'glint', at: [0.36, 0.96], period: 8, r: 0.005, color: '#dff4ff' },
      /* High cloud drift — the painted sky already carries the motion
       *  cue; runtime wisps ride the same band, slow. */
      { type: 'drift', band: [0.02, 0.2], count: 4, speed: 0.008, a: 0.06, color: '#f2f6ff' },
      /* The painted sun rakes from the right edge — a subtle warm shaft
       *  down the lit cliff face amplifies it (same rule as painted
       *  god-rays elsewhere: runtime amplifies what the art declares). */
      { type: 'shaft', from: [0.99, 0.03], to: [0.88, 0.5], width: 0.16, count: 3, a: 0.1, color: '#ffefc4' },
    ],
  },
  'marcia-crinale-loop': {
    /* Tileable variant of the ridge plate — depth baked on the healed
     *  layout. Used with the lab `train` param (wrap scroll); ambient
     *  list minimal since train mode filters to view-space dust anyway. */
    depth: '/assets/depth/marcia-crinale-loop.webp',
    depthWidth: 512,
    depthHeight: 142,
    imgAspect: 1024 / 285,
    entrance: 'enter-sweep',
    pose: 'pose-rest',
    focusAnchor: [0.42, 0.6],
    atmosphere: [],
    ambient: [{ type: 'dust', count: 14 }],
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
