import { z } from 'zod';

/**
 * Material tokens for PoiMatericV3_7 — V3.6 fixed with critical visual debt resolved.
 *
 * Changes from V3.6:
 * - Added V4 cast shadow (ground plane, depth)
 * - Field backgrounds BRIGHTENED to be readable (typ-specific colors visible)
 * - Icon metal now type-aware (not hardcoded gold)
 * - Quest field saturated to prevent terrain blend
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

export const poiMatericV3_7TokensSchema = z.object({
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
  /** Per-type field backgrounds: BRIGHTENED to be readable. */
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
  /** Icon metal per type: simplified 2-color gradient (light, dark) for 30% code reduction. */
  iconMetals: z.object({
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
  /** Cast shadow: V4-style ground plane. */
  shadow: z.object({
    rx: z.number(),
    ry: z.number(),
    gap: z.number(),
    dx: z.number(),
    tilt: z.number(),
    blur: z.number(),
    color: z.string(),
    opacity: z.number(),
    blendMode: z.string(),
  }),
  icons: z.object({
    quest: iconSchema,
    job: iconSchema,
    event: iconSchema,
  }),
});

export type PoiMatericV3_7Tokens = z.infer<typeof poiMatericV3_7TokensSchema>;

export const POI_MATERIC_V3_7_TOKENS = poiMatericV3_7TokensSchema.parse({
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
  /** Field backgrounds aligned with V1 ember palette.
   *  GOLD (honey): quest
   *  TEAL (oxidised copper): job
   *  RED (banked forge coal): event
   */
  fieldBackgrounds: {
    /** GOLD family — honey quest */
    quest: ['#1a1208', '#050302'],
    /** COOL family — blue-green celestial */
    celestial: ['#152a38', '#0a1018'],
    /** TEAL family — oxidised copper job */
    job: ['#0a1f1a', '#020808'],
    /** WARM family — orange-brown gold */
    gold: ['#2a2810', '#0a0905'],
    /** WARM family — orange-brown guild */
    guild: ['#2a2210', '#0a0805'],
    /** DARK-COOL family — dark green-grey wilderness */
    wilderness: ['#0a1410', '#050808'],
    /** RED family — forge coal event */
    event: ['#2a0a0a', '#0f0202'],
    /** OBSIDIAN family — pure black */
    obsidian: ['#1a1a20', '#080810'],
    /** EMPIRE family — dark red */
    empire: ['#1a0a0f', '#080505'],
  },
  /** Icon metal per type: aligned with V1 ember colours.
   *  quest = candle-lit honey, job = oxidised copper, event = banked forge coal.
   */
  iconMetals: {
    wilderness: ['#c0b088', '#1a1410'],
    empire: ['#d0a880', '#1a0a0f'],
    obsidian: ['#b0b0c0', '#1a1a20'],
    celestial: ['#c0d8ff', '#0a1828'],
    guild: ['#d0c090', '#1a1410'],
    quest: ['#ffe9b0', '#5e3a0f'],
    job: ['#e2f0c6', '#12463a'],
    event: ['#ffb08a', '#4e120c'],
    gold: ['#e8d878', '#1a1200'],
  },
  shadow: {
    rx: 33,
    ry: 25,
    gap: 2.5,
    dx: 4,
    tilt: 14,
    blur: 3.5,
    color: '#22322f',
    opacity: 0.56,
    blendMode: 'multiply',
  },
  icons: {
    quest: {
      arm: 'M-3 -5 L-3 -17 L-6.4 -21 L-3.4 -22.2 L0 -18.4 L3.4 -22.2 L6.4 -21 L3 -17 L3 -5 Z',
      steps: [0, 90, 180, 270],
      boss: 4,
      rings: [],
    },
    /* V1 anvil: reads as "work" and survives down to 32px. */
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
