/**
 * PLAN-067 T-B1b (R-234) — the star's valleys are decided one by one. With unequal axes the weakest
 * axis used to set the family and the depth of EVERY valley, so a long petal beside a short one
 * tapered into a blade and the figure was neither flower nor star.
 */
import { describe, expect, it } from 'vitest';
import { valleyProfiles, V62_VALLEY_FLOWER } from '@/ui/idleVillage/components/destinyAstrolabeV62/starProfile';

describe('star valleys (R-234)', () => {
  // INV:R-234-astrolabe-valley-per-tip — each valley reads its two neighbours: a valley between
  // two over-wall tips is a star valley even while another axis is still below the wall.
  it('decides family and depth per valley', () => {
    // tips 0,1 beat the wall; tips 2,3,4 do not.
    const p = valleyProfiles([120, 110, 40, 40, 40], [80, 80, 80, 80, 80]);
    expect(p[0].mix).toBe(1);                       // between tips 0 and 1: both over → star
    expect(p[1].mix).toBeLessThan(1);               // tip 1 over, tip 2 under → not a star valley
    expect(p[2].mix).toBe(0);                       // both under → flower
    expect(p[2].depth).toBeCloseTo(V62_VALLEY_FLOWER, 5);
  });

  it('is symmetric: equal axes give equal valleys', () => {
    const p = valleyProfiles([60, 60, 60, 60, 60], [50, 50, 50, 50, 50]);
    p.forEach((v) => expect(v).toEqual(p[0]));
  });

  it('digs the valley deeper only as the tips approach covering the wall', () => {
    const mild = valleyProfiles([100, 100, 100, 100, 100], [50, 50, 50, 50, 50])[0].depth;
    const extreme = valleyProfiles([200, 200, 200, 200, 200], [50, 50, 50, 50, 50])[0].depth;
    expect(extreme).toBeLessThan(mild);
  });
});

describe('engine wiring (R-234)', () => {
  const src = require('node:fs').readFileSync(
    require('node:path').resolve(__dirname, '../../../src/ui/idleVillage/components/destinyAstrolabeV62/engine.ts'), 'utf8') as string;

  // INV:R-234-astrolabe-no-ghost — the engine takes its valleys from `valleyProfiles` (no single
  // global family) and the dashed out-of-arena outline is painted INSIDE the tar mask, so no hollow
  // ghost petal survives where the tar ate the star.
  it('uses the per-valley rule and no global valley depth', () => {
    expect(src).toContain('valleyProfiles(');
    expect(src).not.toMatch(/geo\.valleyF=vStar/);
  });

  it('paints the out-of-arena outline inside the tar mask', () => {
    const clipAt = src.indexOf("ctx.clip(ap,'evenodd')");
    const dashAt = src.indexOf('ctx.setLineDash([9,7])');
    expect(clipAt).toBeGreaterThan(-1);
    expect(dashAt).toBeGreaterThan(clipAt);
  });
});
