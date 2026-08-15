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

export interface AtmosphereConfig {
  clouds: CloudBand[];
  foam: FoamConfig;
  birds: BirdsConfig;
  waves: WavesConfig;
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
};
