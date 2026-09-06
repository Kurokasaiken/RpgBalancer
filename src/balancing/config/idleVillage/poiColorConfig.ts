import { z } from 'zod';

/**
 * Color configuration for Point-of-Interest (POI) visual skins.
 *
 * All POI color values are config-first so pages and components can resolve
 * palette data from a single source instead of hardcoding wilderness/empire/etc.
 * color tuples. The schema is validated with Zod and used by getDefaultPoiColors.
 */

/** Single RGB channel triple used for corona/glow. */
export const poiColorChannelSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});

export type PoiColorChannel = z.infer<typeof poiColorChannelSchema>;

/** Complete POI color bundle: corona, rim, stone and pin tones. */
export const poiColorConfigSchema = z.object({
  coronaCore: poiColorChannelSchema,
  coronaGlow: poiColorChannelSchema,
  rimColors: z.tuple([z.string(), z.string(), z.string()]),
  stoneColors: z.tuple([z.string(), z.string()]),
  stoneAmbient: z.string(),
  pinColor: z.string(),
});

export type PoiColorConfig = z.infer<typeof poiColorConfigSchema>;

const POI_COLOR_CONFIGS: Record<string, PoiColorConfig> = {
  wilderness: {
    coronaCore: { r: 210, g: 138, b: 28 },
    coronaGlow: { r: 180, g: 105, b: 10 },
    rimColors: ['#fce890', '#c09030', '#200e02'],
    stoneColors: ['#1e1608', '#030202'],
    stoneAmbient: 'rgba(255,220,120,.22)',
    pinColor: 'rgba(205,190,148,.72)',
  },
  empire: {
    coronaCore: { r: 180, g: 40, b: 40 },
    coronaGlow: { r: 140, g: 20, b: 20 },
    rimColors: ['#f0d0a0', '#a06050', '#1a0505'],
    stoneColors: ['#2a0a0a', '#120202'],
    stoneAmbient: 'rgba(255,180,150,.22)',
    pinColor: 'rgba(210,170,160,.72)',
  },
  obsidian: {
    coronaCore: { r: 40, g: 40, b: 50 },
    coronaGlow: { r: 30, g: 30, b: 40 },
    rimColors: ['#c0c0d0', '#606070', '#05050a'],
    stoneColors: ['#0f0f14', '#020205'],
    stoneAmbient: 'rgba(180,180,220,.22)',
    pinColor: 'rgba(160,160,180,.72)',
  },
  celestial: {
    coronaCore: { r: 60, g: 120, b: 220 },
    coronaGlow: { r: 40, g: 90, b: 190 },
    rimColors: ['#d0e0ff', '#80a0d0', '#050a20'],
    stoneColors: ['#080c1a', '#02040a'],
    stoneAmbient: 'rgba(150,190,255,.22)',
    pinColor: 'rgba(170,190,230,.72)',
  },
  guild: {
    coronaCore: { r: 120, g: 100, b: 60 },
    coronaGlow: { r: 90, g: 70, b: 40 },
    rimColors: ['#f0e0b0', '#b0a070', '#1a1205'],
    stoneColors: ['#1a150a', '#050402'],
    stoneAmbient: 'rgba(255,230,150,.22)',
    pinColor: 'rgba(220,200,150,.72)',
  },
  quest: {
    coronaCore: { r: 227, g: 169, b: 60 },
    coronaGlow: { r: 200, g: 140, b: 40 },
    rimColors: ['#ffe9b0', '#e3a93c', '#5e3a0f'],
    stoneColors: ['#2a1a0e', '#050302'],
    stoneAmbient: 'rgba(255,220,120,.22)',
    pinColor: 'rgba(255,220,150,.72)',
  },
  job: {
    coronaCore: { r: 95, g: 199, b: 162 },
    coronaGlow: { r: 74, g: 163, b: 132 },
    rimColors: ['#e2f0c6', '#5fc7a2', '#12463a'],
    stoneColors: ['#0a1f1a', '#020808'],
    stoneAmbient: 'rgba(130,255,210,.22)',
    pinColor: 'rgba(120,235,200,.72)',
  },
  event: {
    coronaCore: { r: 217, g: 69, b: 47 },
    coronaGlow: { r: 179, g: 55, b: 36 },
    rimColors: ['#ffb08a', '#d9452f', '#4e120c'],
    stoneColors: ['#2a0a0a', '#0f0202'],
    stoneAmbient: 'rgba(255,140,120,.22)',
    pinColor: 'rgba(255,160,140,.72)',
  },
  gold: {
    coronaCore: { r: 220, g: 180, b: 40 },
    coronaGlow: { r: 190, g: 150, b: 20 },
    rimColors: ['#fff0a0', '#d0b050', '#1a1200'],
    stoneColors: ['#1a1505', '#050400'],
    stoneAmbient: 'rgba(255,240,120,.22)',
    pinColor: 'rgba(230,210,140,.72)',
  },
};

/**
 * Returns the canonical POI color bundle for a given pillar.
 * Falls back to the wilderness palette when the pillar is unknown so the UI
 * never receives an undefined color set.
 *
 * @param pillar - Pillar identifier (e.g. 'wilderness', 'empire').
 * @returns Validated PoiColorConfig for the pillar.
 */
export function getDefaultPoiColors(pillar: string): PoiColorConfig {
  const fallback = POI_COLOR_CONFIGS.wilderness;
  const key = pillar?.toLowerCase() ?? '';
  const config = POI_COLOR_CONFIGS[key];
  return config ? poiColorConfigSchema.parse(config) : fallback;
}
