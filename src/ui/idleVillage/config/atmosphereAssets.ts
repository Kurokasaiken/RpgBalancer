// Partly generated. The interfaces are hand-maintained; the data blocks are owned
// by their importers and are overwritten in place:
//   clouds: scripts/import-clouds.mjs (also bakes the shadow sprites)
//   birds:  scripts/import-birds.mjs
// Edit those blocks by re-running the importer, not by hand.

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

export interface AtmosphereConfig {
  clouds: CloudBand[];
  foam: FoamConfig;
  birds: BirdsConfig;
  waves: WavesConfig;
}

export const atmosphereAssets: AtmosphereConfig = {
  clouds: [
  {
    name: 'far',
    driftSeconds: 1100,
    opacity: 0.5,
    shadowOpacity: 0.05,
    sprites: [
      { src: 'clouds/cloud_01.webp', width: 700, y: 299, delaySeconds: 45, shadowSrc: 'cloud-shadows/cloud_01_shadow.webp' },
      { src: 'clouds/cloud_02.webp', width: 700, y: 1662, delaySeconds: 725, shadowSrc: 'cloud-shadows/cloud_02_shadow.webp' },
      { src: 'clouds/cloud_03.webp', width: 700, y: 820, delaySeconds: 304, shadowSrc: 'cloud-shadows/cloud_03_shadow.webp' },
    ],
  },
  {
    name: 'mid',
    driftSeconds: 780,
    opacity: 0.62,
    shadowOpacity: 0.08,
    sprites: [
      { src: 'clouds/cloud_04.webp', width: 1080, y: 1093, delaySeconds: 136, shadowSrc: 'cloud-shadows/cloud_04_shadow.webp' },
      { src: 'clouds/cloud_05.webp', width: 1080, y: 251, delaySeconds: 618, shadowSrc: 'cloud-shadows/cloud_05_shadow.webp' },
      { src: 'clouds/cloud_06.webp', width: 1080, y: 1614, delaySeconds: 320, shadowSrc: 'cloud-shadows/cloud_06_shadow.webp' },
    ],
  },
  {
    name: 'near',
    driftSeconds: 520,
    opacity: 0.74,
    shadowOpacity: 0.11,
    sprites: [
      { src: 'clouds/cloud_01.webp', width: 1520, y: 1799, delaySeconds: 152, shadowSrc: 'cloud-shadows/cloud_01_shadow.webp' },
      { src: 'clouds/cloud_02.webp', width: 1520, y: 957, delaySeconds: 473, shadowSrc: 'cloud-shadows/cloud_02_shadow.webp' },
    ],
  },
  ],
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
    cycleSeconds: 46,
    visibleFraction: 0.16,
    opacity: 0.46,
    bobWorldPx: 3,
    marks: [
    { src: 'waves/wave_01.webp', x: -132, y: -59, width: 280, height: 117, delaySeconds: 0.0, flip: false },
    { src: 'waves/wave_02.webp', x: 3976, y: 1813, width: 280, height: 117, delaySeconds: 77.0, flip: false },
    { src: 'waves/wave_03.webp', x: 1235, y: 239, width: 280, height: 117, delaySeconds: 54.0, flip: false },
    { src: 'waves/wave_01.webp', x: 514, y: 2591, width: 280, height: 117, delaySeconds: 31.0, flip: true },
    { src: 'waves/wave_02.webp', x: 3934, y: 902, width: 280, height: 117, delaySeconds: 8.0, flip: true },
    { src: 'waves/wave_03.webp', x: 1875, y: 45, width: 340, height: 142, delaySeconds: 85.0, flip: true },
    { src: 'waves/wave_01.webp', x: 3283, y: 2239, width: 340, height: 142, delaySeconds: 62.0, flip: false },
    { src: 'waves/wave_02.webp', x: 2563, y: 2687, width: 340, height: 142, delaySeconds: 39.0, flip: false },
    { src: 'waves/wave_03.webp', x: -170, y: 1469, width: 340, height: 142, delaySeconds: 16.0, flip: true },
    { src: 'waves/wave_01.webp', x: 3938, y: 153, width: 340, height: 142, delaySeconds: 93.0, flip: true },
    { src: 'waves/wave_02.webp', x: -137, y: 2496, width: 340, height: 142, delaySeconds: 70.0, flip: true },
    { src: 'waves/wave_03.webp', x: 534, y: 583, width: 340, height: 142, delaySeconds: 47.0, flip: false },
    { src: 'waves/wave_01.webp', x: 368, y: -21, width: 340, height: 142, delaySeconds: 24.0, flip: false },
    { src: 'waves/wave_02.webp', x: 2364, y: 269, width: 340, height: 142, delaySeconds: 1.0, flip: false },
    { src: 'waves/wave_03.webp', x: 1056, y: 2620, width: 340, height: 142, delaySeconds: 78.0, flip: true },
    { src: 'waves/wave_01.webp', x: 3830, y: 2347, width: 340, height: 142, delaySeconds: 55.0, flip: true },
    { src: 'waves/wave_02.webp', x: 45, y: 426, width: 340, height: 142, delaySeconds: 32.0, flip: false },
    { src: 'waves/wave_03.webp', x: 3118, y: 2728, width: 340, height: 142, delaySeconds: 9.0, flip: false },
    ],
  },
};
