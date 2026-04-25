import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SKIN_PRESET_ID,
  SKIN_CONFIG_REGISTRY,
  getSkinPresetConfig,
  getSupportedPillars,
  isPillarSupported,
  type SkinPresetId,
} from '../../../src/ui/idleVillage/skins/skinConfigRegistry';
import { SkinRegistrySchema } from '../../../src/ui/idleVillage/skins/skinSchemas';

describe('SkinConfigRegistry', () => {
  it('matches SkinRegistry schema', () => {
    expect(() => SkinRegistrySchema.parse(SKIN_CONFIG_REGISTRY)).not.toThrow();
  });

  it('returns default config when preset is unknown', () => {
    const config = getSkinPresetConfig('unknown' as SkinPresetId);
    expect(config.id).toBe(DEFAULT_SKIN_PRESET_ID);
  });

  it('returns explicit config when preset exists', () => {
    const config = getSkinPresetConfig('wanderlust');
    expect(config.id).toBe('wanderlust');
    expect(config.supportedPillars).toContain('wilderness');
  });

  it('exposes supported pillars for preset', () => {
    const pillars = getSupportedPillars('minimal_frontier');
    expect(pillars).toEqual(['frontier']);
  });

  it('validates pillar support correctly', () => {
    expect(isPillarSupported('wanderlust', 'empire')).toBe(true);
    expect(isPillarSupported('minimal_frontier', 'empire')).toBe(false);
  });
});
