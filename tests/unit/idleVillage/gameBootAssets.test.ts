import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import golden from '../../fixtures/gameBootAssets.json';

/**
 * PLAN-126 OB-3 (R-247): permanent guard on the /game boot asset set.
 * (a) every asset the cold-boot preload references must resolve under public/
 *     — a rename/missing file is a 404 on the real boot path;
 * (b) the total byte budget must stay within the recorded baseline + margin —
 *     R-166 mandates the full set, so growth is allowed only inside the margin.
 * The golden set was measured on the production cold boot (HAR, 2026-11-17).
 * To refresh after an intentional asset change: regenerate the fixture from a
 * new HAR and record the new baseline in the same diff.
 */
const MARGIN = 1.1;
const PUB = join(process.cwd(), 'public');

describe('/game boot asset set (PLAN-126 OB-3)', () => {
  it('every referenced boot asset resolves under public/', () => {
    const missing = (golden.paths as string[]).filter((p) => !existsSync(join(PUB, p)));
    expect(missing).toEqual([]);
  });

  it(`total byte budget stays within baseline*${MARGIN}`, () => {
    const total = (golden.paths as string[])
      .filter((p) => existsSync(join(PUB, p)))
      .reduce((s, p) => s + statSync(join(PUB, p)).size, 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(Math.ceil(golden.baselineBytes * MARGIN));
  });
});
