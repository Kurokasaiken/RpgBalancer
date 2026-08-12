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
    flocks: [
      {
        name: 'high',
        cycleSeconds: 132,
        crossFraction: 0.1,
        riseWorldPx: -140,
        flapSeconds: 0.9,
        opacity: 0.8,
        birds: [
          { width: 58, height: 55, y: 532, delaySeconds: 12 },
          { width: 58, height: 55, y: 1580, delaySeconds: 94 },
        ],
      },
      {
        name: 'low',
        cycleSeconds: 96,
        crossFraction: 0.13,
        riseWorldPx: 110,
        flapSeconds: 0.72,
        opacity: 0.92,
        birds: [
          { width: 92, height: 88, y: 1176, delaySeconds: 24 },
          { width: 92, height: 88, y: 528, delaySeconds: 83 },
          { width: 92, height: 88, y: 1577, delaySeconds: 47 },
        ],
      },
    ],
  },
  waves: {
    cycleSeconds: 17,
    visibleFraction: 0.3,
    opacity: 0.32,
    bobWorldPx: 6,
    marks: [
    { src: 'waves/wave_01.webp', x: 1805, y: 266, width: 150, height: 63, delaySeconds: 77.0, flip: false },
    { src: 'waves/wave_02.webp', x: 1419, y: 2206, width: 260, height: 109, delaySeconds: 38.8, flip: true },
    { src: 'waves/wave_03.webp', x: 480, y: 1076, width: 200, height: 84, delaySeconds: 0.6, flip: false },
    { src: 'waves/wave_01.webp', x: 3039, y: 2502, width: 150, height: 63, delaySeconds: 62.4, flip: false },
    { src: 'waves/wave_02.webp', x: 143, y: 1999, width: 260, height: 109, delaySeconds: 24.2, flip: true },
    { src: 'waves/wave_03.webp', x: 1896, y: 2335, width: 200, height: 84, delaySeconds: 86.0, flip: false },
    { src: 'waves/wave_01.webp', x: 3759, y: 1566, width: 150, height: 63, delaySeconds: 47.8, flip: true },
    { src: 'waves/wave_02.webp', x: 2608, y: 2567, width: 200, height: 84, delaySeconds: 9.6, flip: true },
    { src: 'waves/wave_03.webp', x: 3834, y: 2436, width: 150, height: 63, delaySeconds: 71.4, flip: false },
    { src: 'waves/wave_01.webp', x: 897, y: 516, width: 260, height: 109, delaySeconds: 33.2, flip: true },
    { src: 'waves/wave_02.webp', x: 703, y: 1962, width: 200, height: 84, delaySeconds: 95.0, flip: false },
    { src: 'waves/wave_03.webp', x: 803, y: 2560, width: 150, height: 63, delaySeconds: 56.8, flip: true },
    { src: 'waves/wave_01.webp', x: 3621, y: 641, width: 260, height: 109, delaySeconds: 18.6, flip: true },
    { src: 'waves/wave_02.webp', x: 3569, y: 2095, width: 200, height: 84, delaySeconds: 80.4, flip: false },
    { src: 'waves/wave_03.webp', x: 2826, y: 318, width: 260, height: 109, delaySeconds: 42.2, flip: true },
    { src: 'waves/wave_01.webp', x: 1407, y: 380, width: 200, height: 84, delaySeconds: 4.1, flip: false },
    { src: 'waves/wave_02.webp', x: 2285, y: 283, width: 150, height: 63, delaySeconds: 65.9, flip: false },
    { src: 'waves/wave_03.webp', x: 3787, y: 1080, width: 260, height: 109, delaySeconds: 27.7, flip: true },
    { src: 'waves/wave_01.webp', x: 289, y: 1589, width: 200, height: 84, delaySeconds: 89.5, flip: false },
    { src: 'waves/wave_02.webp', x: 1623, y: 2601, width: 150, height: 63, delaySeconds: 51.3, flip: true },
    { src: 'waves/wave_03.webp', x: 3398, y: 2520, width: 260, height: 109, delaySeconds: 13.1, flip: true },
    { src: 'waves/wave_01.webp', x: 3246, y: 490, width: 150, height: 63, delaySeconds: 74.9, flip: false },
    { src: 'waves/wave_02.webp', x: 417, y: 2322, width: 260, height: 109, delaySeconds: 36.7, flip: true },
    { src: 'waves/wave_03.webp', x: 563, y: 687, width: 200, height: 84, delaySeconds: 98.5, flip: false },
    { src: 'waves/wave_01.webp', x: 1035, y: 2220, width: 150, height: 63, delaySeconds: 60.3, flip: false },
    ],
  },
};
