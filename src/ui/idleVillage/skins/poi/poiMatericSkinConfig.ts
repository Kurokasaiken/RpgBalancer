import { z } from 'zod';
import type { GenericPoiSkinProps } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';

/**
 * Config module for the POI Materic (stone/bronze) medallion preview skin.
 *
 * This is a V2 aesthetic variant of GenericPoiSkin using cooler stone tones
 * and subdued bronze rim accents. It is consumed by the /poi-visual-preview
 * A/B page and does not modify canonical POI components.
 */

export const ColorTupleSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
});

export const PoiMatericSkinConfigSchema = z.object({
  id: z.literal('poi_materic_stone_bronze'),
  name: z.string(),
  shape: z.literal('stone'),
  coronaCore: ColorTupleSchema,
  coronaGlow: ColorTupleSchema,
  rimColors: z.tuple([z.string(), z.string(), z.string()]),
  stoneColors: z.tuple([z.string(), z.string()]),
  stoneAmbient: z.string(),
  pinColor: z.string(),
  icon: z.string(),
  size: z.number().default(96),
});

export type PoiMatericSkinConfig = z.infer<typeof PoiMatericSkinConfigSchema>;

export const POI_MATERIC_SKIN_CONFIG = PoiMatericSkinConfigSchema.parse({
  id: 'poi_materic_stone_bronze',
  name: 'Materic Stone / Bronze',
  shape: 'stone',
  coronaCore: { r: 130, g: 100, b: 70 },
  coronaGlow: { r: 160, g: 120, b: 80 },
  rimColors: ['#b8a896', '#7a6b5a', '#2a2420'],
  stoneColors: ['#4a453e', '#2b2824'],
  stoneAmbient: 'rgba(140,123,104,.22)',
  pinColor: 'rgba(166,145,120,.72)',
  icon: '🗿',
  size: 96,
});

/**
 * Convert the validated skin config into props compatible with GenericPoiSkin.
 */
export function getPoiMatericSkinProps(
  overrides?: Partial<PoiMatericSkinConfig> & Pick<GenericPoiSkinProps, 'icon' | 'label' | 'progress' | 'size'>,
): GenericPoiSkinProps {
  const config = { ...POI_MATERIC_SKIN_CONFIG, ...overrides };
  const { id: _id, name: _name, ...props } = config;
  return props;
}
