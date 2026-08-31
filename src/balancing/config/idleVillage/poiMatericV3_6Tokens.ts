import { z } from 'zod';

/**
 * Material tokens for PoiMatericV3_6 — sculpted bronze outer ring.
 * These values drive the multi-stop metal ramp, micro-texture, milled edge,
 * and specular glints that distinguish V3.6 from V3.5.
 */
export const poiMatericV3_6TokensSchema = z.object({
  /** Outer ring material ramp and detail colors. */
  ring: z.object({
    dark: z.string(),
    mid: z.string(),
    light: z.string(),
    catch: z.string(),
    occluso: z.string(),
    milledHi: z.string(),
    milledLo: z.string(),
    grain: z.object({
      baseFrequency: z.number(),
      numOctaves: z.number(),
      seed: z.number(),
      opacity: z.number(),
    }),
    hammered: z.object({
      baseFrequency: z.number(),
      numOctaves: z.number(),
      seed: z.number(),
      scale: z.number(),
    }),
    glints: z.array(
      z.object({
        cx: z.number(),
        cy: z.number(),
        rx: z.number(),
        ry: z.number(),
        color: z.string(),
        opacity: z.number(),
      })
    ),
    aoOpacity: z.number(),
    rimLightOpacity: z.number(),
  }),
});

export type PoiMatericV3_6Tokens = z.infer<typeof poiMatericV3_6TokensSchema>;

export const POI_MATERIC_V3_6_TOKENS = poiMatericV3_6TokensSchema.parse({
  ring: {
    dark: '#2a1a0e',
    mid: '#6b4e2d',
    light: '#9f7a3e',
    catch: '#fff6d8',
    occluso: '#1a0f08',
    milledHi: '#cfae68',
    milledLo: '#7a5f2c',
    grain: {
      baseFrequency: 0.18,
      numOctaves: 4,
      seed: 3,
      opacity: 0.12,
    },
    hammered: {
      baseFrequency: 0.07,
      numOctaves: 2,
      seed: 5,
      scale: 2.5,
    },
    glints: [
      { cx: 28, cy: 19, rx: 3, ry: 1.4, color: '#fff6d8', opacity: 0.9 },
      { cx: 56, cy: 26, rx: 2, ry: 1, color: '#e8dcc0', opacity: 0.7 },
      { cx: 44, cy: 12, rx: 1.6, ry: 0.8, color: '#fff6d8', opacity: 0.55 },
    ],
    aoOpacity: 0.55,
    rimLightOpacity: 0.68,
  },
});
