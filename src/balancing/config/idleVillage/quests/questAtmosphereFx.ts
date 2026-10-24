/**
 * questAtmosphereFx — the atmosphere overlay kit registry (PLAN-050 T-013,
 * realizing PLAN-046 §6).
 *
 * Distinct from `AmbientLayer`: ambient FX are procedural particles drawn
 * on a 2D canvas; atmosphere overlays are DOM elements that ride the same
 * camera window as the artwork (parallax-weighted) plus their own authored
 * drift — every frame a pure function of the shared camera clock.
 *
 * Two kit kinds (Director OB-8 pass 3/4 — "nebbia, non foschia", "non una
 * striscia bianca"):
 * - `sprite`: a painted asset under `public/assets/atmosphere/**` as an
 *   `<img>` (cloud shadows, bird strips — discrete objects that SHOULD
 *   read as objects).
 * - `fog`: N full-width veils masked by a baked tileable fractal-noise
 *   texture (`scripts/bake-fog-noise.py`), each scrolling the texture at
 *   a different speed/direction — fibrous matter with holes, not a soft
 *   ellipse. Gradient veils were rejected perceptually (R-228).
 *
 * A manifest scene lists kit ids in `sceneManifest.atmosphere`; all the
 * numbers live here — config-first, Zod-validated at module load.
 * `reduced-motion` mounts nothing (PLAN-046 invariant).
 */

import { z } from 'zod';

/** CSS blend modes supported by the overlay compositor. */
export const AtmosphereBlendSchema = z.enum(['normal', 'screen', 'overlay', 'soft-light', 'multiply']);
export type AtmosphereBlend = z.infer<typeof AtmosphereBlendSchema>;

/** Fields every overlay shares — sprite or procedural. */
const AtmosphereKitBase = z.object({
  /** Vertical band (img-fraction y-range) the element is pinned to. */
  band: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  /** Base horizontal drift. Sprites: img-fractions/sec (slow crossing).
   *  Fog veils: noise-tile widths/sec — ~0.18 ≈ 30px/s, visibly living. */
  speed: z.number().min(-0.5).max(0.5),
  /** Camera coupling: 0 = view-fixed layer, 1 = glued to the artwork. */
  parallax: z.number().min(0).max(1),
  /** Per-veil opacity — fog layers are near-transparent on purpose
   *  (0.05–0.12 each); sprites can go higher. */
  alpha: z.number().min(0).max(1),
  blend: AtmosphereBlendSchema.default('normal'),
  /** Img-fraction x of the element's LEFT edge at cycle start. For sprites
   *  it is negative/off-screen so the element covers or crosses the frame.
   *  For fog veils it is instead the strip CENTRE offset from 0.5 — fog
   *  strips are always centred so they cover edge-to-edge (R-228). */
  anchorLeft: z.number().min(-3).max(1),
  /** How far the left edge drifts before wrapping, in img-fractions. */
  travel: z.number().positive().max(4),
  /** Per-kit kill switch — a manifest may list a kit that is off. */
  enabled: z.boolean().default(true),
});

/**
 * Sprite overlay: a painted asset from `public/assets/atmosphere/**`
 * composited as a DOM `<img>` (cloud shadows, bird strips — things that
 * should read as discrete objects in the scene).
 */
export const AtmosphereSpriteKitSchema = AtmosphereKitBase.extend({
  kind: z.literal('sprite'),
  /** Sprite path under public/ — a painted asset, not procedural. */
  asset: z.string().regex(/^\/assets\/atmosphere\/.+\.(webp|png)$/),
  /** Source pixel size — the layer sizes the sprite from its aspect. */
  widthPx: z.number().int().positive(),
  heightPx: z.number().int().positive(),
  /** Img-fraction width of the sprite on the artwork plane. */
  width: z.number().positive().max(3),
  /** CSS blur on the sprite — dissolves the contour into the scene. */
  blurPx: z.number().min(0).max(64).default(0),
  /** Render the sprite as a dark silhouette of itself (`brightness(0)`)
   *  — required for `multiply` shadows, since the shadow sprites are
   *  painted light and would otherwise multiply to nothing. */
  silhouette: z.boolean().default(false),
});
export type AtmosphereSpriteKit = z.infer<typeof AtmosphereSpriteKitSchema>;

/**
 * Fog kit: NOT a sprite and NOT a gradient. `layers` full-width strips
 * overlapping in the band; each is tinted `color` and masked by the baked
 * tileable noise `texture`, scrolling the mask at its own speed/direction
 * with a slow alpha breath — the moving fractal matter is what reads as
 * fog (R-228). The texture is horizontally seamless, so scrolling loops.
 */
export const AtmosphereFogKitSchema = AtmosphereKitBase.extend({
  kind: z.literal('fog'),
  /** Veil tint (hex) — the strip colour the noise mask reveals. */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Baked noise tile (seamless X, baked vertical fade) used as the mask. */
  texture: z.string().regex(/^\/assets\/atmosphere\/.+\.png$/),
  /** How many veils overlap — the fibrous-ness of the fog. */
  layers: z.number().int().min(2).max(6).default(4),
  /** Img-fraction width of each veil strip — >1 for camera overscan. */
  veilWidth: z.number().positive().max(3).default(1.3),
  /** Img-fraction height of each veil — thinner than the band hugs the ground. */
  veilHeight: z.number().positive().max(1.5).default(0.45),
  /** Per-veil size variation — keeps the bank from resolving into even stripes. */
  sizeVariation: z.number().min(0).max(0.6).default(0.25),
  /** Alpha breathing period in seconds — the fog thickens and thins. */
  breathSec: z.number().positive().max(60).default(9),
  /** Lowest point in the alpha-breath cycle, as a fraction of authored alpha. */
  breathFloor: z.number().min(0).max(1).default(0.72),
  /** Per-layer scroll-speed spread around the authored base speed. */
  speedVariation: z.number().min(0).max(1).default(0.4),
  /** Deterministic phase spacing between adjacent veils. */
  phaseStep: z.number().min(0).max(1).default(0.618),
});
export type AtmosphereFogKit = z.infer<typeof AtmosphereFogKitSchema>;

export const AtmosphereKitSchema = z.discriminatedUnion('kind', [
  AtmosphereSpriteKitSchema,
  AtmosphereFogKitSchema,
]);
export type AtmosphereKit = z.infer<typeof AtmosphereKitSchema>;

/** The shipped overlay kits — validated once at module load. */
export const ATMOSPHERE_KITS: Record<string, AtmosphereKit> = z
  .record(z.string(), AtmosphereKitSchema)
  .parse({
    /* Ground fog: four noise-masked strips across the lower half of the
     * artwork — alternating scroll directions + alpha breath read as
     * living mist, not a moving object. Only authored on scenes where
     * fog belongs (forest) — never on a chase (Director ruling). */
    'fog-low': {
      kind: 'fog',
      color: '#d6ded8',
      texture: '/assets/atmosphere/fog/fog-noise-tile.png',
      layers: 4,
      veilWidth: 1.8,
      veilHeight: 0.38,
      sizeVariation: 0.24,
      band: [0.5, 0.95],
      /* Mask scroll: tile-widths/sec. ~0.05 was ~8px/s — real motion but
       * under the perceptual threshold (Director pass 5: "è statica").
       * 0.18 drifts ~30px/s on the lab frame: visibly living fog. */
      speed: 0.18,
      parallax: 1,
      alpha: 0.28,
      blend: 'normal',
      breathSec: 9,
      /* Deeper breath: the field visibly thickens and thins, not just drifts. */
      breathFloor: 0.55,
      speedVariation: 0.4,
      phaseStep: 0.618,
      anchorLeft: 0,
      travel: 0.6,
      enabled: true,
    },
    /* Gorge still-fog (gola-raider): same pool mechanics, much slower —
     *  fog-low at 0.18 tile/s reads as wind on a dusk gorge (Director
     *  pass: "la nebbia si muove troppo velocemente"). Sentiero keeps
     *  the tuned 0.18. */
    'fog-gorge': {
      kind: 'fog',
      color: '#c9d6cf',
      texture: '/assets/atmosphere/fog/fog-noise-tile.png',
      layers: 4,
      veilWidth: 1.8,
      veilHeight: 0.38,
      sizeVariation: 0.24,
      band: [0.5, 0.95],
      speed: 0.06,
      parallax: 1,
      alpha: 0.24,
      blend: 'normal',
      breathSec: 14,
      breathFloor: 0.6,
      speedVariation: 0.35,
      phaseStep: 0.618,
      anchorLeft: 0,
      travel: 0.6,
      enabled: true,
    },
    /* Canopy shadow drift — a dark silhouette blob sliding over the
     * scene: `brightness(0)` makes the light-painted sprite a real
     * multiply shadow (pass-2 probe: light sprite × multiply = nil). */
    'cloud-shadow': {
      kind: 'sprite',
      asset: '/assets/atmosphere/cloud-shadows/cloud_02_shadow.webp',
      widthPx: 606,
      heightPx: 279,
      width: 0.9,
      band: [0.25, 0.9],
      speed: 0.008,
      parallax: 1,
      alpha: 0.3,
      blend: 'multiply',
      blurPx: 10,
      silhouette: true,
      anchorLeft: -0.95,
      travel: 2.2,
      enabled: true,
    },
    /* Painted cloud in the high sky — registry only (pass 1: a discrete
     * cloud drifting over a mid-ground scene reads wrong). Kept for
     * future sky-heavy art. */
    'cloud-sky': {
      kind: 'sprite',
      asset: '/assets/atmosphere/clouds/cloud_03.webp',
      widthPx: 829,
      heightPx: 315,
      width: 0.7,
      band: [0.0, 0.3],
      /* First live scene (viaggio-andata, Director pass): 0.01/0.22 was
       *  below the perceptual threshold — visible drift or nothing. */
      speed: 0.03,
      parallax: 0.9,
      alpha: 0.32,
      blend: 'screen',
      blurPx: 6,
      anchorLeft: -0.7,
      travel: 1.9,
      enabled: true,
    },
    /* Distant flock strip — registry only (was on 'ritorno', removed
     * pending the PLAN-053 journey-fill design). */
    'birds-far': {
      kind: 'sprite',
      asset: '/assets/atmosphere/birds/bird_strip.webp',
      widthPx: 1024,
      heightPx: 122,
      width: 0.22,
      band: [0.05, 0.22],
      speed: 0.03,
      parallax: 0.85,
      alpha: 0.55,
      blend: 'normal',
      anchorLeft: -0.25,
      travel: 1.5,
      enabled: true,
    },
  });
