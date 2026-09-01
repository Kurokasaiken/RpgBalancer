// Partly generated. The interfaces are hand-maintained; the data blocks are owned
// by their importers and are overwritten in place:
//   clouds: scripts/scatter-clouds.mjs (also bakes the shadow sprites)
//   birds:  scripts/import-birds.mjs
// Edit those blocks by re-running the importer, not by hand.
import { cloudBands } from './generatedClouds';

/** One drifting cloud instance, positioned in world coordinates. */
export interface CloudSprite {
  src: string;
  /** On-screen width in world px; height follows the sprite's aspect ratio. */
  width: number;
  /** Vertical position in world px. */
  y: number;
  /** Negative animation offset, so the band does not start as a single clump. */
  delaySeconds: number;
  /** Shadow sprite path (direction C: shadow-only on terrain). */
  shadowSrc: string;
}

export interface CloudShadow {
  src: string;
  width: number;
  y: number;
  delaySeconds: number;
}

/** A depth layer: same drift speed and opacity for every sprite in it. */
export interface CloudBand {
  name: 'far' | 'mid' | 'near';
  /** Time for one full crossing of the world. */
  driftSeconds: number;
  opacity: number;
  /**
   * Opacity of the cast shadow. Independent of the cloud's own: a high, faint cloud
   * still throws a soft mark on the ground, and tying the two together made the
   * shadows darken every time the clouds were made more solid.
   */
  shadowOpacity: number;
  /** Scale multiplier for every sprite in the band. */
  scale: number;
  sprites: CloudSprite[];
}

export interface FoamConfig {
  texture: string;
  /** Edge of one texture tile, in world px. */
  tileWorldPx: number;
  /** Time to scroll exactly one tile, so the loop is seamless. */
  driftSeconds: number;
  opacityMin: number;
  opacityMax: number;
  pulsePeriod: number;
}

/** One bird's place in the formation, relative to the flock's take-off point. */
export interface BirdSprite {
  /** On-screen size in world px. */
  width: number;
  height: number;
  /** Position within the formation, in world px from the origin. */
  offsetX: number;
  offsetY: number;
  /** Share of the flight this bird lifts off late, so the group unfolds. */
  delayFraction: number;
}

/**
 * A single take-off: a flock leaves the ground, climbs away diagonally, and is gone.
 *
 * `DESIGN_PILLARS.md` puts ambient life at "80% calma, 15% comunicazione ambientale,
 * 5% sorprese rare" and lists "stormo" among the rare ones. So this is an event with
 * a beginning and an end, not a loop: roughly a second of flight per minute of
 * empty sky.
 */
export interface BirdFlight {
  name: string;
  /** Take-off point in world px, sampled from the landmass. */
  originX: number;
  originY: number;
  /** Travel over the flight, in world px. Negative dy climbs. */
  dx: number;
  dy: number;
  /** Seconds the flock is airborne and visible. */
  flightSeconds: number;
  /** Offsets this flight within its cycle, so the flights do not all fire at once. */
  startDelaySeconds: number;
  /** Full period; everything beyond `flightSeconds` is empty sky. */
  cycleSeconds: number;
  /** Time for one complete wing-flap cycle. */
  flapSeconds: number;
  opacity: number;
  /** Mirrors the sprite, for flights heading left. */
  flip: boolean;
  birds: BirdSprite[];
}

export interface BirdsConfig {
  /** Horizontal sprite strip: frameCount cells of equal width. */
  strip: string;
  frameCount: number;
  flights: BirdFlight[];
}

/** One wave hatch, placed on a sampled shoreline point in world px. */
export interface WaveMark {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Negative animation offset, so the coast does not blink in unison. */
  delaySeconds: number;
  /** Mirrors the mark, so the same three shapes do not read as a repeating pattern. */
  flip: boolean;
}

export interface WavesConfig {
  /** Full period of one mark, most of which it is invisible. */
  cycleSeconds: number;
  /** Share of the cycle the mark is on screen. */
  visibleFraction: number;
  opacity: number;
  /** Vertical travel while visible, in world px. The plan budgets water at ±4px. */
  bobWorldPx: number;
  marks: WaveMark[];
}

/**
 * One drifting sheet of sea micro-detail.
 *
 * The step/period pairs are precomputed rather than derived from a speed and an
 * angle at runtime, because a tiled background is only exactly seamless when it
 * translates by a whole tile: `stepX` and `stepY` must stay whole multiples of
 * `tilePx`. Storing the speed instead would invite someone to tune it to a value
 * that puts a visible seam through the sea every few minutes.
 */
export interface WaterDetailLayer {
  name: string;
  src: string;
  /** Edge of one texture tile, in world px. */
  tilePx: number;
  /** Horizontal travel per loop. A whole tile, signed for direction. */
  stepX: number;
  /** Time to travel `stepX`. Derived from the layer's speed and heading. */
  periodXSeconds: number;
  /** Vertical travel per loop. A whole tile, signed for direction. */
  stepY: number;
  periodYSeconds: number;
  /**
   * NOT the "0.03-ish" of a solid overlay texture — read this before tuning it.
   *
   * The amplitude that matters is the change in the final on-screen pixel, which
   * wants to land around 8-15 RGB points: inside the sea painting's own p25-p75
   * luminance spread of 120-142, so the detail reads as the water's surface rather
   * than as a film over it.
   *
   * These tiles carry the pattern in their alpha channel and are mostly
   * transparent (mean alpha 16/255 for A, 26/255 for B), so the sparseness is
   * already baked in. The final amplitude is `opacity * alpha * 12` — attenuating
   * again here with a 0.03 would put the peak change at 0.4 RGB points, which is
   * below the threshold of visibility and measures as no motion at all.
   *
   * So: peak alpha 1.0 * 0.75 * 12 tint points ~= 9 points of change at the
   * pattern's brightest, fading to nothing across most of the tile.
   */
  opacity: number;
}

/**
 * One broad, soft pool of light drifting over the water.
 *
 * These carry most of the effect, and they exist because of what the reference
 * footage actually does. Blurring two frames of it a second apart with sigma 12 —
 * destroying every trace of fine detail — still leaves 52% of pixels changed by 3
 * RGB points or more, down only a quarter from the unblurred 68%. So roughly three
 * quarters of the motion in water that reads as real is broad tonal change across
 * large regions: the surface being re-lit, not texture being slid.
 *
 * Scrolling detail supplies the other quarter, which is why the tiles alone read as
 * so little for so much amplitude, and why pushing their opacity up to compensate
 * muddied the painting instead of animating it.
 *
 * Each pool is enormous and very soft, so it never resolves as a shape. It reads as
 * light because that is the only thing it could be.
 */
export interface WaterLightPool {
  name: string;
  /** Diameter in world px. Thousands, not hundreds — a small one reads as a stain. */
  sizePx: number;
  /** Resting centre in world px. */
  x: number;
  y: number;
  /** Travel over one drift cycle, in world px. */
  dx: number;
  dy: number;
  driftSeconds: number;
  /** Luminance offset from the sea mean; negative for a shaded pool. */
  tintDelta: number;
  opacityMin: number;
  opacityMax: number;
  /**
   * Brightening and drifting run on separate, mutually prime-ish periods. Pools that
   * pulse together read as one effect switching on and off.
   */
  pulseSeconds: number;
}

export interface WaterFieldConfig {
  layers: WaterDetailLayer[];
  lightPools: WaterLightPool[];
}

export interface RiverGlint {
  /** SVG path data (`d` attribute) following a river. */
  d: string;
  /** Tint of the glint, with alpha baked in. */
  color: string;
  /** Stroke width in world px. */
  width: number;
  /** Dash length in world px. */
  dash: number;
  /** Gap between dashes in world px. */
  gap: number;
  /** Duration of one full cycle, in seconds. */
  durationSeconds: number;
  /** Base opacity of the glint. */
  opacity: number;
  /** Optional delay before the cycle starts. */
  delaySeconds?: number;
}

export interface AmbientLightRays {
  /** Whether the ray fan is rendered at all. */
  enabled: boolean;
  /** Light origin as a percentage of the canvas. */
  originX: string;
  originY: string;
  /** Starting angle of the ray fan, in degrees. */
  angle: number;
  /** Tint of the rays and halo, with alpha baked in. */
  color: string;
  /** Base opacity of the combined ray layer. */
  opacity: number;
  /** Period of the subtle opacity pulse. */
  speedSeconds: number;
  /** Angular width of one ray, in degrees. */
  width: number;
  /** Angular gap between rays, in degrees. */
  spread: number;
}

export interface AmbientDust {
  /** Whether the dust motes are rendered. */
  enabled: boolean;
  /** Number of motes. Keep small; each is a real DOM node. */
  count: number;
  /** Smallest mote diameter, in world px. */
  sizeMin: number;
  /** Largest mote diameter, in world px. */
  sizeMax: number;
  /** Lowest mote opacity. */
  opacityMin: number;
  /** Highest mote opacity. */
  opacityMax: number;
  /** Tint of every mote. */
  color: string;
  /** Shortest float cycle, in seconds. */
  driftSecondsMin: number;
  /** Longest float cycle, in seconds. */
  driftSecondsMax: number;
}

export interface AmbientConfig {
  lightRays: AmbientLightRays;
  dust: AmbientDust;
}

/** Teca di vetro sopra la mappa: riflessi, caustiche e bordo. */
export interface GlassConfig {
  enabled: boolean;
  /** Base sheen opacity (0-1). */
  sheenOpacity: number;
  /** Reflection diagonal opacity (0-1). */
  reflectionOpacity: number;
  /** Warm caustic opacity (0-1). */
  causticOpacity: number;
  /** Edge response opacity (0-1). */
  edgeOpacity: number;
  /** Base color of the glass. */
  tint: string;
  /** Max highlight offset in viewport pixels. */
  parallaxMaxPx: number;
  /** Reflection blur radius in pixels. */
  reflectionBlurPx: number;
  /** Caustic SVG blur stdDeviation. */
  causticBlurPx: number;
}

export interface AtmosphereConfig {
  clouds: CloudBand[];
  foam: FoamConfig;
  birds: BirdsConfig;
  waves: WavesConfig;
  ambient: AmbientConfig;
  waterField: WaterFieldConfig;
  /** Animated light streaks drawn along rivers. */
  riverGlints: RiverGlint[];
  glass: GlassConfig;
}

export const atmosphereAssets: AtmosphereConfig = {
  clouds: cloudBands,
  foam: {
    texture: 'foam/foam_texture.webp',
    tileWorldPx: 520,
    driftSeconds: 90,
    opacityMin: 0.10,
    opacityMax: 0.22,
    pulsePeriod: 11,
  },
  birds: {
    strip: 'birds/bird_strip.webp',
    frameCount: 8,
    flights: [
      {
        name: 'a',
        originX: 679,
        originY: 969,
        dx: 340,
        dy: -250,
        flightSeconds: 1.2,
        startDelaySeconds: 29,
        cycleSeconds: 54,
        flapSeconds: 0.16,
        opacity: 0.9,
        flip: false,
        birds: [
          { width: 46, height: 44, offsetX: 0, offsetY: 0, delayFraction: 0 },
          { width: 40, height: 38, offsetX: -64, offsetY: 41, delayFraction: 0.05 },
          { width: 39, height: 37, offsetX: -69, offsetY: -37, delayFraction: 0.08 },
          { width: 35, height: 33, offsetX: -133, offsetY: 78, delayFraction: 0.13 },
        ],
      },
      {
        name: 'b',
        originX: 3818,
        originY: 2319,
        dx: -300,
        dy: -230,
        flightSeconds: 1.35,
        startDelaySeconds: 11,
        cycleSeconds: 71,
        flapSeconds: 0.18,
        opacity: 0.85,
        flip: true,
        birds: [
          { width: 52, height: 50, offsetX: 0, offsetY: 0, delayFraction: 0 },
          { width: 46, height: 44, offsetX: -73, offsetY: 47, delayFraction: 0.05 },
          { width: 44, height: 42, offsetX: -78, offsetY: -42, delayFraction: 0.08 },
          { width: 40, height: 38, offsetX: -151, offsetY: 88, delayFraction: 0.13 },
        ],
      },
      {
        name: 'c',
        originX: 2774,
        originY: 2161,
        dx: 280,
        dy: -300,
        flightSeconds: 1.1,
        startDelaySeconds: 70,
        cycleSeconds: 92,
        flapSeconds: 0.15,
        opacity: 0.8,
        flip: false,
        birds: [
          { width: 40, height: 38, offsetX: 0, offsetY: 0, delayFraction: 0 },
          { width: 35, height: 33, offsetX: -56, offsetY: 36, delayFraction: 0.05 },
          { width: 34, height: 32, offsetX: -60, offsetY: -32, delayFraction: 0.08 },
          { width: 30, height: 29, offsetX: -116, offsetY: 68, delayFraction: 0.13 },
        ],
      },
    ],
  },
  waves: {
    cycleSeconds: 30,
    visibleFraction: 0.45,
    opacity: 0.75,
    bobWorldPx: 3,
    marks: [
    { src: 'waves/onda2.webp', x: 3822, y: 1408, width: 340, height: 142, delaySeconds: 0.0, flip: false },
    { src: 'waves/ondine1.webp', x: 75, y: 1499, width: 280, height: 117, delaySeconds: 4.5, flip: true },
    { src: 'waves/schiuma1.webp', x: 1142, y: 157, width: 340, height: 142, delaySeconds: 9.0, flip: false },
    { src: 'waves/onda1.webp', x: 26, y: 596, width: 280, height: 117, delaySeconds: 13.5, flip: true },
    { src: 'waves/onda2.webp', x: 3585, y: 2012, width: 340, height: 142, delaySeconds: 18.0, flip: false },
    { src: 'waves/schiuma1.webp', x: 314, y: 182, width: 340, height: 142, delaySeconds: 22.5, flip: false },
    { src: 'waves/onda2.webp', x: 3229, y: 472, width: 340, height: 142, delaySeconds: 27.0, flip: false }
    ],
  },
  ambient: {
    lightRays: {
      enabled: true,
      // North-west corner, where the world is lit from in the base painting.
      originX: '18%',
      originY: '12%',
      angle: 45,
      // Warm golden rays using `screen` so they read as light, not paint.
      color: 'rgba(255, 220, 140, 0.85)',
      opacity: 0.65,
      speedSeconds: 8,
      width: 12,
      spread: 22,
    },
    dust: {
      enabled: true,
      count: 60,
      sizeMin: 4,
      sizeMax: 8,
      opacityMin: 0.65,
      opacityMax: 0.95,
      color: 'rgba(255, 245, 210, 0.95)',
      driftSecondsMin: 3,
      driftSecondsMax: 7,
    },
  },
  waterField: {
    // Headings are 12° and 108°: diverging, and deliberately not 90° apart. Two
    // sheets crossing at a right angle produce a visible grid where they overlap.
    layers: [
      {
        // 3.0 px/s along 12°. The larger, lighter sheet — broken highlights.
        name: 'a',
        src: 'water/water_detail_a.webp',
        tilePx: 384,
        stepX: 384,
        periodXSeconds: 21.8,
        stepY: 384,
        periodYSeconds: 102.6,
        opacity: 0.60,
      },
      {
        // 1.5 px/s along 108° — half the speed, travelling up and to the left.
        // Finer and darker; it is what keeps sheet A from reading as one moving
        // surface rather than as water.
        name: 'b',
        src: 'water/water_detail_b.webp',
        tilePx: 256,
        stepX: -256,
        periodXSeconds: 92.1,
        stepY: 256,
        periodYSeconds: 29.9,
        opacity: 0.48,
      },
    ],
    // Sizes run from a third of the world to most of it, and the periods share no
    // small common multiple, so the field never visibly repeats or beats.
    // A jittered grid across the whole world, not a handful of hand-placed
    // pools. Twelve of them at these sizes means every stretch of sea sits under
    // at least one, which is the point: the water has to breathe everywhere, not
    // only where someone happened to drop a light. Hand-placed pools also made the
    // measurement swing with the viewport, because which ones covered visible water
    // depended on where the camera had settled.
    lightPools: [
      { name: 'p01', sizePx: 2400, x: 431, y: 318, dx: -343, dy: -268, driftSeconds: 71, tintDelta: 15, opacityMin: 0.08, opacityMax: 0.52, pulseSeconds: 11 },
      { name: 'p02', sizePx: 3000, x: 1342, y: 475, dx: -348, dy: 197, driftSeconds: 79, tintDelta: -12, opacityMin: 0.09, opacityMax: 0.55, pulseSeconds: 12 },
      { name: 'p03', sizePx: 2000, x: 2421, y: 438, dx: -623, dy: -319, driftSeconds: 83, tintDelta: 17, opacityMin: 0.10, opacityMax: 0.58, pulseSeconds: 13 },
      { name: 'p04', sizePx: 2800, x: 3652, y: 681, dx: -498, dy: -250, driftSeconds: 89, tintDelta: -11, opacityMin: 0.11, opacityMax: 0.61, pulseSeconds: 14 },
      { name: 'p05', sizePx: 2200, x: 331, y: 1246, dx: 499, dy: -205, driftSeconds: 97, tintDelta: 16, opacityMin: 0.08, opacityMax: 0.64, pulseSeconds: 16 },
      { name: 'p06', sizePx: 3200, x: 1630, y: 1277, dx: -495, dy: -315, driftSeconds: 101, tintDelta: -13, opacityMin: 0.09, opacityMax: 0.52, pulseSeconds: 17 },
      { name: 'p07', sizePx: 2600, x: 2717, y: 1412, dx: 569, dy: 321, driftSeconds: 103, tintDelta: 15, opacityMin: 0.10, opacityMax: 0.55, pulseSeconds: 19 },
      { name: 'p08', sizePx: 1900, x: 3684, y: 1326, dx: -544, dy: -200, driftSeconds: 107, tintDelta: -12, opacityMin: 0.11, opacityMax: 0.58, pulseSeconds: 21 },
      { name: 'p09', sizePx: 3100, x: 418, y: 2355, dx: 553, dy: 326, driftSeconds: 109, tintDelta: 17, opacityMin: 0.08, opacityMax: 0.61, pulseSeconds: 23 },
      { name: 'p10', sizePx: 2300, x: 1351, y: 2362, dx: -562, dy: -404, driftSeconds: 113, tintDelta: -11, opacityMin: 0.09, opacityMax: 0.64, pulseSeconds: 25 },
      { name: 'p11', sizePx: 2700, x: 2606, y: 2560, dx: -565, dy: 262, driftSeconds: 127, tintDelta: 16, opacityMin: 0.10, opacityMax: 0.52, pulseSeconds: 27 },
      { name: 'p12', sizePx: 2100, x: 3626, y: 2355, dx: 342, dy: -407, driftSeconds: 131, tintDelta: -13, opacityMin: 0.11, opacityMax: 0.55, pulseSeconds: 29 },
    ],
  },
  glass: {
    enabled: true,
    sheenOpacity: 0.10,
    reflectionOpacity: 0.16,
    causticOpacity: 0.05,
    edgeOpacity: 0.28,
    tint: 'rgba(210, 230, 255, 0.025)',
    parallaxMaxPx: 8,
    reflectionBlurPx: 18,
    causticBlurPx: 2.5,
  },
  /** Two animated glints along the main rivers. World coordinates are hand-tuned to the painted map. */
  riverGlints: [
    {
      d: 'M 1420 620 C 1540 980, 1480 1360, 1660 1620 C 1840 1880, 1360 2120, 980 2380',
      color: 'rgba(255, 255, 255, 0.95)',
      width: 36,
      dash: 70,
      gap: 100,
      durationSeconds: 5.2,
      opacity: 0.95,
    },
    {
      d: 'M 2720 520 C 2880 920, 3260 1180, 3100 1640 C 2940 2100, 3420 2280, 3760 2000',
      color: 'rgba(255, 255, 255, 0.90)',
      width: 28,
      dash: 50,
      gap: 80,
      durationSeconds: 4.8,
      opacity: 0.9,
    },
  ],
};
