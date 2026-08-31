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
  /** Vertical travel while visible, in world px. */
  bobWorldPx: number;
  /**
   * Horizontal travel while visible, in world px.
   *
   * This is what makes the marks read as water rather than as decals that fade in
   * and out on the spot. It can be modest because contrast does the work, not
   * speed: what registers frame to frame is a high-contrast edge moving, and these
   * are near-white dashes on blue. The near cloud band is visible at 1.4 screen
   * px/s for the same reason, while a low-contrast tonal field moving faster than
   * that measured as nothing at all.
   */
  driftWorldPx: number;
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

export interface AtmosphereConfig {
  clouds: CloudBand[];
  foam: FoamConfig;
  birds: BirdsConfig;
  waves: WavesConfig;
  waterField: WaterFieldConfig;
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
    cycleSeconds: 15,
    visibleFraction: 0.84,
    opacity: 0.92,
    bobWorldPx: 11,
    driftWorldPx: 450,
    marks: [
    { src: 'waves/wave_01.webp', x: 3558, y: 958, width: 230, height: 96, delaySeconds: 14.98, flip: false },
    { src: 'waves/wave_02.webp', x: 1156, y: 1240, width: 230, height: 96, delaySeconds: 0.11, flip: false },
    { src: 'waves/wave_03.webp', x: 2100, y: 296, width: 230, height: 96, delaySeconds: 0.23, flip: false },
    { src: 'waves/wave_01.webp', x: 1943, y: 1666, width: 230, height: 96, delaySeconds: 0.28, flip: true },
    { src: 'waves/wave_02.webp', x: 398, y: 1389, width: 230, height: 96, delaySeconds: 0.40, flip: true },
    { src: 'waves/wave_03.webp', x: 1827, y: 2558, width: 280, height: 117, delaySeconds: 0.53, flip: true },
    { src: 'waves/wave_01.webp', x: 336, y: 326, width: 280, height: 117, delaySeconds: 0.58, flip: false },
    { src: 'waves/wave_02.webp', x: 3152, y: 1846, width: 280, height: 117, delaySeconds: 0.70, flip: false },
    { src: 'waves/wave_03.webp', x: 2141, y: 1643, width: 280, height: 117, delaySeconds: 0.83, flip: true },
    { src: 'waves/wave_01.webp', x: 1309, y: 1436, width: 280, height: 117, delaySeconds: 0.88, flip: true },
    { src: 'waves/wave_02.webp', x: 580, y: 454, width: 280, height: 117, delaySeconds: 1.00, flip: true },
    { src: 'waves/wave_03.webp', x: 564, y: 1908, width: 280, height: 117, delaySeconds: 1.12, flip: false },
    { src: 'waves/wave_01.webp', x: 783, y: 148, width: 280, height: 117, delaySeconds: 1.18, flip: false },
    { src: 'waves/wave_02.webp', x: 1346, y: 1668, width: 280, height: 117, delaySeconds: 1.30, flip: false },
    { src: 'waves/wave_03.webp', x: 2291, y: 210, width: 280, height: 117, delaySeconds: 1.42, flip: true },
    { src: 'waves/wave_01.webp', x: 874, y: 2210, width: 280, height: 117, delaySeconds: 1.48, flip: true },
    { src: 'waves/wave_02.webp', x: 1231, y: 2434, width: 280, height: 117, delaySeconds: 1.60, flip: false },
    { src: 'waves/wave_03.webp', x: 1305, y: 260, width: 280, height: 117, delaySeconds: 1.72, flip: false },
    { src: 'waves/wave_01.webp', x: 651, y: 1682, width: 330, height: 138, delaySeconds: 1.77, flip: false },
    { src: 'waves/wave_02.webp', x: 1276, y: 2001, width: 330, height: 138, delaySeconds: 1.90, flip: true },
    { src: 'waves/wave_03.webp', x: 3326, y: 2370, width: 330, height: 138, delaySeconds: 2.02, flip: true },
    { src: 'waves/wave_01.webp', x: 2626, y: 1778, width: 330, height: 138, delaySeconds: 2.07, flip: true },
    { src: 'waves/wave_02.webp', x: 286, y: 2502, width: 330, height: 138, delaySeconds: 2.20, flip: false },
    { src: 'waves/wave_03.webp', x: 2514, y: 2581, width: 330, height: 138, delaySeconds: 2.32, flip: false },
    { src: 'waves/wave_01.webp', x: 1707, y: 2018, width: 330, height: 138, delaySeconds: 2.37, flip: true },
    { src: 'waves/wave_02.webp', x: 2344, y: 2246, width: 330, height: 138, delaySeconds: 2.49, flip: true },
    { src: 'waves/wave_03.webp', x: 2025, y: 1003, width: 330, height: 138, delaySeconds: 2.62, flip: true },
    { src: 'waves/wave_01.webp', x: 386, y: 825, width: 330, height: 138, delaySeconds: 2.67, flip: false },
    { src: 'waves/wave_02.webp', x: 3620, y: 1550, width: 330, height: 138, delaySeconds: 2.79, flip: false },
    { src: 'waves/wave_03.webp', x: 605, y: 2511, width: 330, height: 138, delaySeconds: 2.92, flip: true },
    { src: 'waves/wave_01.webp', x: 1023, y: 2051, width: 330, height: 138, delaySeconds: 2.97, flip: true },
    { src: 'waves/wave_02.webp', x: 2957, y: 1612, width: 330, height: 138, delaySeconds: 3.09, flip: true },
    { src: 'waves/wave_03.webp', x: 2042, y: 1331, width: 230, height: 96, delaySeconds: 3.21, flip: false },
    { src: 'waves/wave_01.webp', x: 307, y: 2051, width: 230, height: 96, delaySeconds: 3.27, flip: false },
    { src: 'waves/wave_02.webp', x: 1728, y: 378, width: 230, height: 96, delaySeconds: 3.39, flip: false },
    { src: 'waves/wave_03.webp', x: 2680, y: 358, width: 230, height: 96, delaySeconds: 3.51, flip: true },
    { src: 'waves/wave_01.webp', x: 2804, y: 614, width: 230, height: 96, delaySeconds: 3.57, flip: true },
    { src: 'waves/wave_02.webp', x: 883, y: 1215, width: 230, height: 96, delaySeconds: 3.69, flip: false },
    { src: 'waves/wave_03.webp', x: 1723, y: 1438, width: 230, height: 96, delaySeconds: 3.81, flip: false },
    { src: 'waves/wave_01.webp', x: 2465, y: 1687, width: 230, height: 96, delaySeconds: 3.93, flip: false },
    { src: 'waves/wave_02.webp', x: 916, y: 2548, width: 230, height: 96, delaySeconds: 3.99, flip: true },
    { src: 'waves/wave_03.webp', x: 3214, y: 1372, width: 230, height: 96, delaySeconds: 4.11, flip: true },
    { src: 'waves/wave_01.webp', x: 730, y: 1414, width: 230, height: 96, delaySeconds: 4.23, flip: true },
    { src: 'waves/wave_02.webp', x: 2659, y: 2188, width: 230, height: 96, delaySeconds: 4.29, flip: false },
    { src: 'waves/wave_03.webp', x: 3388, y: 1144, width: 230, height: 96, delaySeconds: 4.41, flip: false },
    { src: 'waves/wave_01.webp', x: 1024, y: 991, width: 230, height: 96, delaySeconds: 4.53, flip: true },
    { src: 'waves/wave_02.webp', x: 2758, y: 2409, width: 280, height: 117, delaySeconds: 4.58, flip: true },
    { src: 'waves/wave_03.webp', x: 2891, y: 1312, width: 280, height: 117, delaySeconds: 4.71, flip: true },
    { src: 'waves/wave_01.webp', x: 1483, y: 392, width: 280, height: 117, delaySeconds: 4.83, flip: false },
    { src: 'waves/wave_02.webp', x: 30, y: 1655, width: 280, height: 117, delaySeconds: 4.88, flip: false },
    { src: 'waves/wave_03.webp', x: 1930, y: 657, width: 280, height: 117, delaySeconds: 5.01, flip: false },
    { src: 'waves/wave_01.webp', x: 3922, y: 318, width: 280, height: 117, delaySeconds: 5.13, flip: true },
    { src: 'waves/wave_02.webp', x: 808, y: 823, width: 280, height: 117, delaySeconds: 5.18, flip: true },
    { src: 'waves/wave_03.webp', x: 3015, y: 628, width: 280, height: 117, delaySeconds: 5.30, flip: false },
    { src: 'waves/wave_01.webp', x: 564, y: 2239, width: 280, height: 117, delaySeconds: 5.43, flip: false },
    { src: 'waves/wave_02.webp', x: 2299, y: 583, width: 280, height: 117, delaySeconds: 5.48, flip: false },
    { src: 'waves/wave_03.webp', x: 1425, y: 2558, width: 280, height: 117, delaySeconds: 5.60, flip: true },
    { src: 'waves/wave_01.webp', x: 195, y: 2243, width: 280, height: 117, delaySeconds: 5.73, flip: true },
    { src: 'waves/wave_02.webp', x: 3558, y: 475, width: 280, height: 117, delaySeconds: 5.78, flip: false },
    { src: 'waves/wave_03.webp', x: 3421, y: 1475, width: 330, height: 138, delaySeconds: 5.90, flip: false },
    { src: 'waves/wave_01.webp', x: 2481, y: 184, width: 330, height: 138, delaySeconds: 6.02, flip: false },
    { src: 'waves/wave_02.webp', x: 3665, y: 2171, width: 330, height: 138, delaySeconds: 6.08, flip: true },
    { src: 'waves/wave_03.webp', x: 3259, y: 871, width: 330, height: 138, delaySeconds: 6.20, flip: true },
    { src: 'waves/wave_01.webp', x: 3247, y: 2589, width: 330, height: 138, delaySeconds: 6.32, flip: true },
    { src: 'waves/wave_02.webp', x: 3454, y: 697, width: 330, height: 138, delaySeconds: 6.38, flip: false },
    { src: 'waves/wave_03.webp', x: 71, y: 1281, width: 330, height: 138, delaySeconds: 6.50, flip: false },
    { src: 'waves/wave_01.webp', x: 1297, y: 1045, width: 330, height: 138, delaySeconds: 6.62, flip: true },
    { src: 'waves/wave_02.webp', x: 498, y: 1061, width: 330, height: 138, delaySeconds: 6.67, flip: true },
    { src: 'waves/wave_03.webp', x: 3586, y: 1832, width: 330, height: 138, delaySeconds: 6.80, flip: true },
    { src: 'waves/wave_01.webp', x: 3731, y: 1111, width: 330, height: 138, delaySeconds: 6.92, flip: false },
    { src: 'waves/wave_02.webp', x: 1417, y: 2270, width: 330, height: 138, delaySeconds: 6.97, flip: false },
    { src: 'waves/wave_03.webp', x: 3901, y: 1359, width: 330, height: 138, delaySeconds: 7.09, flip: false },
    { src: 'waves/wave_01.webp', x: 2162, y: 2117, width: 330, height: 138, delaySeconds: 7.22, flip: true },
    { src: 'waves/wave_02.webp', x: 2924, y: 420, width: 230, height: 96, delaySeconds: 7.27, flip: true },
    { src: 'waves/wave_03.webp', x: 3856, y: 2391, width: 230, height: 96, delaySeconds: 7.39, flip: false },
    { src: 'waves/wave_01.webp', x: 3823, y: 511, width: 230, height: 96, delaySeconds: 7.52, flip: false },
    { src: 'waves/wave_02.webp', x: 883, y: 1832, width: 230, height: 96, delaySeconds: 7.57, flip: false },
    { src: 'waves/wave_03.webp', x: 1608, y: 1256, width: 230, height: 96, delaySeconds: 7.69, flip: true },
    { src: 'waves/wave_01.webp', x: 2307, y: 1045, width: 230, height: 96, delaySeconds: 7.81, flip: true },
    { src: 'waves/wave_02.webp', x: 2605, y: 946, width: 230, height: 96, delaySeconds: 7.87, flip: false },
    { src: 'waves/wave_03.webp', x: 1069, y: 1674, width: 230, height: 96, delaySeconds: 7.99, flip: false },
    { src: 'waves/wave_01.webp', x: 2585, y: 1165, width: 230, height: 96, delaySeconds: 8.11, flip: false },
    { src: 'waves/wave_02.webp', x: 3893, y: 1981, width: 230, height: 96, delaySeconds: 8.17, flip: true },
    { src: 'waves/wave_03.webp', x: 1521, y: 784, width: 230, height: 96, delaySeconds: 8.29, flip: true },
    { src: 'waves/wave_01.webp', x: 1040, y: 337, width: 230, height: 96, delaySeconds: 8.41, flip: true },
    { src: 'waves/wave_02.webp', x: 3607, y: 192, width: 230, height: 96, delaySeconds: 8.53, flip: false },
    { src: 'waves/wave_03.webp', x: 1272, y: 806, width: 280, height: 117, delaySeconds: 8.59, flip: false },
    { src: 'waves/wave_01.webp', x: 286, y: 1779, width: 280, height: 117, delaySeconds: 8.71, flip: true },
    { src: 'waves/wave_02.webp', x: 1144, y: 1854, width: 280, height: 117, delaySeconds: 8.83, flip: true },
    { src: 'waves/wave_03.webp', x: 59, y: 2562, width: 280, height: 117, delaySeconds: 8.89, flip: true },
    { src: 'waves/wave_01.webp', x: 2133, y: 2396, width: 280, height: 117, delaySeconds: 9.01, flip: false },
    { src: 'waves/wave_02.webp', x: 59, y: 2003, width: 280, height: 117, delaySeconds: 9.13, flip: false },
    { src: 'waves/wave_03.webp', x: 2879, y: 811, width: 280, height: 117, delaySeconds: 9.18, flip: false },
    { src: 'waves/wave_01.webp', x: 1781, y: 1030, width: 280, height: 117, delaySeconds: 9.31, flip: true },
    { src: 'waves/wave_02.webp', x: 311, y: 558, width: 280, height: 117, delaySeconds: 9.43, flip: true },
    { src: 'waves/wave_03.webp', x: 2469, y: 1444, width: 280, height: 117, delaySeconds: 9.48, flip: false },
    { src: 'waves/wave_01.webp', x: 3620, y: 2492, width: 280, height: 117, delaySeconds: 9.61, flip: false },
    { src: 'waves/wave_02.webp', x: 3280, y: 206, width: 280, height: 117, delaySeconds: 9.73, flip: false },
    { src: 'waves/wave_03.webp', x: 104, y: 728, width: 280, height: 117, delaySeconds: 9.78, flip: true },
    { src: 'waves/wave_01.webp', x: 1657, y: 608, width: 280, height: 117, delaySeconds: 9.90, flip: true },
    { src: 'waves/wave_02.webp', x: 1628, y: 2390, width: 330, height: 138, delaySeconds: 10.03, flip: false },
    { src: 'waves/wave_03.webp', x: 1558, y: 1794, width: 330, height: 138, delaySeconds: 10.08, flip: false },
    { src: 'waves/wave_01.webp', x: 1520, y: 974, width: 330, height: 138, delaySeconds: 10.20, flip: false },
    { src: 'waves/wave_02.webp', x: 3019, y: 2241, width: 330, height: 138, delaySeconds: 10.33, flip: true },
    { src: 'waves/wave_03.webp', x: 2940, y: 2506, width: 330, height: 138, delaySeconds: 10.38, flip: true },
    { src: 'waves/wave_01.webp', x: 42, y: 490, width: 330, height: 138, delaySeconds: 10.50, flip: true },
    { src: 'waves/wave_02.webp', x: 1644, y: 121, width: 330, height: 138, delaySeconds: 10.62, flip: false },
    { src: 'waves/wave_03.webp', x: 1947, y: 1910, width: 330, height: 138, delaySeconds: 10.68, flip: false },
    { src: 'waves/wave_01.webp', x: 1127, y: 606, width: 330, height: 138, delaySeconds: 10.80, flip: true },
    { src: 'waves/wave_02.webp', x: 112, y: 242, width: 330, height: 138, delaySeconds: 10.92, flip: true },
    { src: 'waves/wave_03.webp', x: 2543, y: 593, width: 330, height: 138, delaySeconds: 10.98, flip: true },
    { src: 'waves/wave_01.webp', x: 2982, y: 121, width: 330, height: 138, delaySeconds: 11.10, flip: false },
    { src: 'waves/wave_02.webp', x: 3222, y: 1645, width: 330, height: 138, delaySeconds: 11.22, flip: false },
    { src: 'waves/wave_03.webp', x: 3260, y: 490, width: 230, height: 96, delaySeconds: 11.27, flip: false },
    { src: 'waves/wave_01.webp', x: 2216, y: 846, width: 230, height: 96, delaySeconds: 11.40, flip: true },
    { src: 'waves/wave_02.webp', x: 2862, y: 2089, width: 230, height: 96, delaySeconds: 11.52, flip: true },
    { src: 'waves/wave_03.webp', x: 3827, y: 1737, width: 230, height: 96, delaySeconds: 11.57, flip: false },
    { src: 'waves/wave_01.webp', x: 258, y: 1099, width: 230, height: 96, delaySeconds: 11.70, flip: false },
    { src: 'waves/wave_02.webp', x: 2759, y: 1525, width: 230, height: 96, delaySeconds: 11.82, flip: false },
    { src: 'waves/wave_03.webp', x: 858, y: 614, width: 230, height: 96, delaySeconds: 11.87, flip: true },
    { src: 'waves/wave_01.webp', x: 2295, y: 1314, width: 230, height: 96, delaySeconds: 11.99, flip: true },
    { src: 'waves/wave_02.webp', x: 3877, y: 830, width: 230, height: 96, delaySeconds: 12.12, flip: true },
    { src: 'waves/wave_03.webp', x: 3077, y: 2051, width: 230, height: 96, delaySeconds: 12.17, flip: false },
    { src: 'waves/wave_01.webp', x: 1227, y: 2225, width: 230, height: 96, delaySeconds: 12.29, flip: false },
    { src: 'waves/wave_02.webp', x: 2266, y: 1873, width: 230, height: 96, delaySeconds: 12.42, flip: true },
    { src: 'waves/wave_03.webp', x: 1901, y: 2349, width: 230, height: 96, delaySeconds: 12.47, flip: true },
    { src: 'waves/wave_01.webp', x: 2448, y: 2051, width: 230, height: 96, delaySeconds: 12.59, flip: true },
    { src: 'waves/wave_02.webp', x: 2883, y: 1817, width: 280, height: 117, delaySeconds: 12.71, flip: false },
    { src: 'waves/wave_03.webp', x: 1545, y: 1589, width: 280, height: 117, delaySeconds: 12.77, flip: false },
    { src: 'waves/wave_01.webp', x: 1392, y: 587, width: 280, height: 117, delaySeconds: 12.89, flip: true },
    { src: 'waves/wave_02.webp', x: 1769, y: 802, width: 280, height: 117, delaySeconds: 13.01, flip: true },
    { src: 'waves/wave_03.webp', x: 3094, y: 1063, width: 280, height: 117, delaySeconds: 13.07, flip: true },
    { src: 'waves/wave_01.webp', x: 3396, y: 1842, width: 280, height: 117, delaySeconds: 13.19, flip: false },
    { src: 'waves/wave_02.webp', x: 3649, y: 1312, width: 280, height: 117, delaySeconds: 13.31, flip: false },
    { src: 'waves/wave_03.webp', x: 518, y: 123, width: 280, height: 117, delaySeconds: 13.43, flip: false },
    { src: 'waves/wave_01.webp', x: 1947, y: 2131, width: 280, height: 117, delaySeconds: 13.49, flip: true },
    { src: 'waves/wave_02.webp', x: 3264, y: 2073, width: 280, height: 117, delaySeconds: 13.61, flip: true },
    { src: 'waves/wave_03.webp', x: 1019, y: 1423, width: 280, height: 117, delaySeconds: 13.73, flip: false },
    { src: 'waves/wave_01.webp', x: 2804, y: 1076, width: 280, height: 117, delaySeconds: 13.78, flip: false },
    { src: 'waves/wave_02.webp', x: 804, y: 380, width: 280, height: 117, delaySeconds: 13.91, flip: false },
    { src: 'waves/wave_03.webp', x: 2725, y: 138, width: 330, height: 138, delaySeconds: 14.03, flip: true },
    { src: 'waves/wave_01.webp', x: 204, y: 1521, width: 330, height: 138, delaySeconds: 14.08, flip: true },
    { src: 'waves/wave_02.webp', x: 448, y: 1612, width: 330, height: 138, delaySeconds: 14.21, flip: true },
    { src: 'waves/wave_03.webp', x: 3466, y: 2088, width: 330, height: 138, delaySeconds: 14.33, flip: false },
    { src: 'waves/wave_01.webp', x: 9, y: 991, width: 330, height: 138, delaySeconds: 14.38, flip: false },
    { src: 'waves/wave_02.webp', x: 2303, y: 2511, width: 330, height: 138, delaySeconds: 14.50, flip: true },
    { src: 'waves/wave_03.webp', x: 584, y: 738, width: 330, height: 138, delaySeconds: 14.63, flip: true },
    { src: 'waves/wave_01.webp', x: 738, y: 2018, width: 330, height: 138, delaySeconds: 14.68, flip: true },
    { src: 'waves/wave_02.webp', x: 3905, y: 2167, width: 330, height: 138, delaySeconds: 14.80, flip: false },
    { src: 'waves/wave_03.webp', x: 1914, y: 109, width: 330, height: 138, delaySeconds: 14.93, flip: false },
    ],
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
};
