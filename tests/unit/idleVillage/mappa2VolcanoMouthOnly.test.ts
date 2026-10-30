import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Director ruling 2026-10-30: the volcano is ONLY the red crater mouth (+ smoke), never lava running down the slope.
 * Source guard (the overlay needs a WebGL/Canvas renderer to mount): the lava-vein drawing must not come back.
 */
describe('mappa2 volcano: crater mouth only', () => {
  const src = readFileSync('src/ui/idleVillage/pixiSpike/regionalWeatherOverlay.ts', 'utf8');

  it('has no lava veins / slope trails', () => {
    expect(src).not.toMatch(/\bveins\b/);
    expect(src).not.toMatch(/lava veins|veins\.|stroke\(\{ width: 7/);
  });

  it('bakes the crater as a painted patch with an additive lava sprite', () => {
    expect(src).toMatch(/lavaSp\.blendMode = 'add'/);
    for (const name of ['craterSp', 'lavaSp', 'haloSp']) expect(src).toContain(name);
  });
});
