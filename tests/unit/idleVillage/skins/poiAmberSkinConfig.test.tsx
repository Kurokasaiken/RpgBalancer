import { describe, it, expect } from 'vitest';
import { POI_AMBER_SKIN_CONFIG, POI_AMBER_SKIN_ID } from '@/ui/idleVillage/skins/poi/poiAmberSkinConfig';
import { TemporarySkinConfigSchema } from '@/ui/idleVillage/skins/temporary/TemporarySkinConfig';

describe('POI Amber Temporary Skin', () => {
  it('matches TemporarySkinConfig schema', () => {
    expect(() => TemporarySkinConfigSchema.parse(POI_AMBER_SKIN_CONFIG)).not.toThrow();
  });

  it('includes expected component slot bindings', () => {
    const slotConfig = POI_AMBER_SKIN_CONFIG.componentSlots.POIComponent;
    expect(slotConfig).toBeDefined();
    expect(slotConfig.slotBindings).toMatchObject({
      coronaGlow: expect.any(String),
      coronaTurbA: expect.any(String),
      coronaTurbB: expect.any(String),
      coronaReflect: expect.any(String),
      rimCircle: expect.any(String),
      stoneField: expect.any(String),
      pinIcon: expect.any(String),
      particleLayer: expect.any(String),
    });
  });

  it('exposes consistent metadata', () => {
    expect(POI_AMBER_SKIN_CONFIG.id).toBe(POI_AMBER_SKIN_ID);
    expect(POI_AMBER_SKIN_CONFIG.metadata?.pillar).toBe('wilderness');
  });
});
