import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { regionalWeatherConfigRef } from '@/ui/idleVillage/config/mappa2RegionalWeatherConfig';

/** Director ruling 2026-10-30: the snow glints twinkled off the snow and flickered: removed for good. */
describe('mappa2: no snow glints, no old sea wonders in the lab', () => {
  it('weather overlay builds no glint sprites and the lab has no glint slider', () => {
    const overlay = readFileSync('src/ui/idleVillage/pixiSpike/regionalWeatherOverlay.ts', 'utf8');
    expect(overlay).not.toMatch(/mkSlots\('glint'/);
    expect(overlay).not.toMatch(/snow_glint\.webp/);
    expect(readFileSync('src/pages/regional-atmosphere-controls.tsx', 'utf8')).not.toMatch(/snow glints/);
  });

  it('defaults to zero glints', () => {
    expect(regionalWeatherConfigRef.current.glints).toBe(0);
  });

  it('lab ships with the old sea wonders off and no wonder controls', () => {
    const lab = readFileSync('src/pages/mappa2-lab.tsx', 'utf8');
    expect(lab).toMatch(/wonders: false/);
    expect(lab).not.toMatch(/wonder cadence/);
    expect(lab).not.toMatch(/Trigger rare sea event/);
  });
});
