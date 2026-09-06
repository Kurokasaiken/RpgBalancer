import { z } from 'zod';

/**
 * Material tokens for PoiMatericV3_6 — V3.6 interior upgraded to V4 style.
 * The outer ring follows V3.6 sculpted bronze; the inner field now uses
 * type-aware deep green-shadow gradients instead of a flat black.
 * Icons rendered as V4 composite marks: arms + rings + boss.
 */

/** One heraldic mark, built by rotating a single arm. */
const iconSchema = z.object({
  arm: z.string(),
  steps: z.array(z.number()).min(1),
  armShort: z.string().optional(),
  stepsShort: z.array(z.number()).optional(),
  boss: z.number(),
  rings: z.array(z.object({ r: z.number(), w: z.number() })),
});

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
    aoWidth: z.number(),
    rimLightOpacity: z.number(),
    rimLightWidth: z.number(),
    rimLightThinOpacity: z.number(),
    rimLightThinWidth: z.number(),
    glazeStartOpacity: z.number(),
    glazeMidOpacity: z.number(),
    milledOpacity: z.number(),
    bevelCatchOpacity: z.number(),
  }),
  /** Per-type field backgrounds: light and dark stops of deep green shadow. */
  fieldBackgrounds: z.object({
    wilderness: z.tuple([z.string(), z.string()]),
    empire: z.tuple([z.string(), z.string()]),
    obsidian: z.tuple([z.string(), z.string()]),
    celestial: z.tuple([z.string(), z.string()]),
    guild: z.tuple([z.string(), z.string()]),
    quest: z.tuple([z.string(), z.string()]),
    job: z.tuple([z.string(), z.string()]),
    event: z.tuple([z.string(), z.string()]),
    gold: z.tuple([z.string(), z.string()]),
  }),
  icons: z.object({
    quest: iconSchema,
    job: iconSchema,
    event: iconSchema,
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
      baseFrequency: 0.7,
      numOctaves: 4,
      seed: 3,
      opacity: 0.12,
    },
    hammered: {
      baseFrequency: 0.07,
      numOctaves: 2,
      seed: 5,
      scale: 0.35,
    },
    glints: [
      { cx: 28, cy: 19, rx: 3, ry: 1.4, color: '#fff6d8', opacity: 0.9 },
      { cx: 56, cy: 26, rx: 2, ry: 1, color: '#e8dcc0', opacity: 0.7 },
      { cx: 44, cy: 12, rx: 1.6, ry: 0.8, color: '#fff6d8', opacity: 0.55 },
    ],
    aoOpacity: 0.28,
    aoWidth: 1,
    rimLightOpacity: 0.22,
    rimLightWidth: 1.1,
    rimLightThinOpacity: 0.28,
    rimLightThinWidth: 0.4,
    glazeStartOpacity: 0.35,
    glazeMidOpacity: 0.18,
    milledOpacity: 0.55,
    bevelCatchOpacity: 0.08,
  },
  /** Field backgrounds aligned with V1 ember palette. */
  fieldBackgrounds: {
    wilderness: ['#12202a', '#04080c'],
    empire: ['#1a1015', '#050303'],
    obsidian: ['#0f0f14', '#020205'],
    celestial: ['#0a0f1a', '#030508'],
    guild: ['#1a1510', '#050402'],
    quest: ['#1a1208', '#050302'],
    job: ['#0a1f1a', '#020808'],
    event: ['#2a0a0a', '#0f0202'],
    gold: ['#1a1810', '#050402'],
  },
  icons: {
    quest: {
      arm: 'M-3 -5 L-3 -17 L-6.4 -21 L-3.4 -22.2 L0 -18.4 L3.4 -22.2 L6.4 -21 L3 -17 L3 -5 Z',
      steps: [0, 90, 180, 270],
      boss: 4,
      rings: [],
    },
    /* V1 anvil for job — reads as work. */
    job: {
      arm: 'M-19 -13 L19 -13 L19 -7.5 L10 -7.5 L6.5 -1 L10 3.5 L10 7 L-10 7 L-10 3.5 L-6.5 -1 L-15.5 -7.5 L-19 -7.5 Z M-11.5 7 L11.5 7 L14.5 14 L-14.5 14 Z',
      steps: [0],
      boss: 0,
      rings: [],
    },
    event: {
      arm: 'M0 -22 L2.7 -6.5 L0 -3.6 L-2.7 -6.5 Z',
      steps: [0, 90, 180, 270],
      armShort: 'M0 -13.5 L1.9 -5.4 L0 -3.2 L-1.9 -5.4 Z',
      stepsShort: [45, 135, 225, 315],
      boss: 3.6,
      rings: [],
    },
  },
});
