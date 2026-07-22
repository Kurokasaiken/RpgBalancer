import { describe, expect, it } from 'vitest';
import {
  getPoiMatericSkinProps,
  POI_MATERIC_SKIN_CONFIG,
  PoiMatericSkinConfigSchema,
} from '@/ui/idleVillage/skins/poi/poiMatericSkinConfig';

describe('poiMatericSkinConfig', () => {
  it('validates against the TemporarySkinConfig-like schema', () => {
    expect(() => PoiMatericSkinConfigSchema.parse(POI_MATERIC_SKIN_CONFIG)).not.toThrow();
  });

  it('exports the expected materic palette', () => {
    expect(POI_MATERIC_SKIN_CONFIG.id).toBe('poi_materic_stone_bronze');
    expect(POI_MATERIC_SKIN_CONFIG.shape).toBe('stone');
    expect(POI_MATERIC_SKIN_CONFIG.rimColors).toHaveLength(3);
    expect(POI_MATERIC_SKIN_CONFIG.stoneColors).toHaveLength(2);
    expect(POI_MATERIC_SKIN_CONFIG.icon).toBe('🗿');
  });

  it('converts to GenericPoiSkin props with overrides', () => {
    const props = getPoiMatericSkinProps({ label: 'Test', progress: 0.5, size: 64 });
    expect(props.label).toBe('Test');
    expect(props.progress).toBe(0.5);
    expect(props.size).toBe(64);
    expect(props.shape).toBe('stone');
    expect(props.rimColors).toEqual(['#b8a896', '#7a6b5a', '#2a2420']);
  });
});
