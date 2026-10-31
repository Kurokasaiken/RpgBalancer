import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseMappa2SecondaryWater } from '@/ui/idleVillage/config/mappa2SecondaryWaterConfig';

/**
 * R-299 (2026-10-31): the painted surf around the west-rim sea arch and stacks is animated by
 * the COAST_FOAM_FRAG shader in PixiWorldMap — it hides the painted foam under the
 * `masks/foam_clean.webp` clean plate and draws live procedural surf (surge/hold/drain cycle,
 * lace breakup) in its place. The painted-pose flipbook was dropped (repaints were temporally
 * incoherent — morphing, not motion). If the clean plate or the JSON contract drifts, the
 * runtime silently renders a static sea again, so the shipped contract is checked here.
 */
const BASE = resolve(__dirname, '../../../public/assets/world/mappa2/base');

const secondaryWater = parseMappa2SecondaryWater(
  JSON.parse(readFileSync(resolve(BASE, 'secondary-water.json'), 'utf-8')),
);

describe('mappa2 live surf (R-299)', () => {
  it('ships the foam clean plate the surf shader hides the painted foam under', () => {
    expect(existsSync(resolve(BASE, 'masks/foam_clean.webp'))).toBe(true);
    expect(existsSync(resolve(BASE, 'masks/coast_distance.webp'))).toBe(true);
  });

  it('has no sea_arch painted-pose patch (superseded by procedural surf)', () => {
    expect(secondaryWater.seaPatches?.find((p) => p.id === 'sea_arch')).toBeUndefined();
  });

  it('ships every declared pose frame on disk (all seaPatches)', () => {
    for (const p of secondaryWater.seaPatches ?? []) {
      for (const frame of p.flowPoses.frames) {
        expect(existsSync(resolve(BASE, frame)), `${p.id}: missing ${frame}`).toBe(true);
      }
    }
  });
});
