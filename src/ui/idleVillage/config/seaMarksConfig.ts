import { z } from 'zod';

/**
 * One hand-painted water mark placed on the sea or near the coast.
 */
export const SeaMarkSchema = z.object({
  src: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  /** Negative animation offset so marks do not fade in unison. */
  delaySeconds: z.number(),
  /** Mirrors the mark to break left/right repetition. */
  flip: z.boolean(),
  /** Optional drift vector in world px; kept tiny to stay inside the painted sea. */
  driftX: z.number().default(0),
  driftY: z.number().default(0),
});

export type SeaMark = z.infer<typeof SeaMarkSchema>;

export const SeaMarksConfigSchema = z.object({
  enabled: z.boolean(),
  /** Full period of one mark; most of the cycle it is invisible. */
  cycleSeconds: z.number().positive(),
  /** Share of the cycle the mark is on screen. */
  visibleFraction: z.number().min(0).max(1),
  /** Peak opacity of one mark. */
  opacity: z.number().min(0).max(1),
  /** Mask that clips all marks to the painted sea. */
  mask: z.string(),
  marks: z.array(SeaMarkSchema),
});

export type SeaMarksConfig = z.infer<typeof SeaMarksConfigSchema>;

const WAVE_FAMILIES = [
  { src: 'waves/onda1.webp', width: 280, height: 117 },
  { src: 'waves/onda2.webp', width: 340, height: 142 },
  { src: 'waves/ondine1.webp', width: 280, height: 117 },
  { src: 'waves/schiuma1.webp', width: 340, height: 142 },
];

const COAST_POINTS = [
  { x: 1880, y: 298 },
  { x: 1549, y: 2261 },
  { x: 580, y: 1118 },
  { x: 3114, y: 2534 },
  { x: 273, y: 2054 },
  { x: 1996, y: 2377 },
  { x: 3834, y: 1598 },
  { x: 2708, y: 2609 },
  { x: 3909, y: 2468 },
  { x: 1027, y: 571 },
  { x: 803, y: 2004 },
  { x: 878, y: 2592 },
  { x: 3751, y: 696 },
  { x: 3669, y: 2137 },
  { x: 2956, y: 373 },
  { x: 1507, y: 422 },
  { x: 2360, y: 315 },
  { x: 3917, y: 1135 },
  { x: 389, y: 1631 },
  { x: 1698, y: 2633 },
  { x: 3528, y: 2575 },
  { x: 3321, y: 522 },
  { x: 547, y: 2377 },
  { x: 663, y: 729 },
];

const OPEN_POINTS = [
  { x: 50, y: 99 },
  { x: 3992, y: 1408 },
  { x: 2840, y: 257 },
  { x: 754, y: 2675 },
  { x: 166, y: 596 },
  { x: 1482, y: 157 },
  { x: 3925, y: 2012 },
  { x: 1673, y: 2749 },
  { x: 4025, y: 2575 },
  { x: 3569, y: 472 },
];

function hashMulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildMarksFromPoints(
  points: { x: number; y: number }[],
  seed: number,
): SeaMark[] {
  const rnd = hashMulberry32(seed);
  return points.map((p, i) => {
    const family = WAVE_FAMILIES[i % WAVE_FAMILIES.length];
    const flip = rnd() > 0.5;
    const delaySeconds = rnd() * 24;
    const driftX = Math.round((rnd() * 2 - 1) * 4);
    const driftY = Math.round((rnd() * 2 - 1) * 3);
    return {
      src: family.src,
      x: p.x,
      y: p.y,
      width: family.width,
      height: family.height,
      delaySeconds,
      flip,
      driftX,
      driftY,
    };
  });
}

export const defaultSeaMarksConfig: SeaMarksConfig = SeaMarksConfigSchema.parse({
  enabled: true,
  cycleSeconds: 24,
  visibleFraction: 0.45,
  opacity: 0.75,
  mask: '/assets/atmosphere/terrain/sea_mask.webp',
  marks: buildMarksFromPoints([...COAST_POINTS, ...OPEN_POINTS], 0x9e3779b9),
});

export const coastOnlySeaMarksConfig: SeaMarksConfig = SeaMarksConfigSchema.parse({
  ...defaultSeaMarksConfig,
  marks: buildMarksFromPoints(COAST_POINTS, 0x9e3779b9),
});

export const openOnlySeaMarksConfig: SeaMarksConfig = SeaMarksConfigSchema.parse({
  ...defaultSeaMarksConfig,
  marks: buildMarksFromPoints(OPEN_POINTS, 0x9e3779b9),
});
