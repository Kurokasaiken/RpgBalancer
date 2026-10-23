/**
 * R-275 / desiderata v37 — ONE silhouette family per board: flower when the party is at or below
 * the check, star above +10%, lean star above +35%, decided by MAJORITY of the five axes (raw
 * stat/difficulty margins). No mixed board and no half-flower: valley depth is morph-coupled to
 * the tip family, so the prohibited quadrant (deep valley + rounded tip) is unconstructible.
 */
import { describe, expect, it } from 'vitest';
import {
  boardStarProfile,
  V62_FLOWER_VALLEY_MAX,
  V62_FLOWER_VALLEY_MIN,
  V62_LEAN_VALLEY,
  V62_STAR_VALLEY_MAX,
} from '@/ui/idleVillage/components/destinyAstrolabeV62/starProfile';

const fam = (margins: number[]) => boardStarProfile(margins).family;

describe('board family vote (R-275, v37)', () => {
  // INV:destiny-astrolabe-v62.INV-1 — the board picks ONE family by majority over raw
  // stat/difficulty margins; deep valley + rounded tip is unconstructible.
  it('classifies at the 10% / 35% thresholds (strictly above)', () => {
    expect(fam([0.5, 0.5, 0.5, 0.5, 0.5])).toBe('flower');
    expect(fam([1.1, 1.1, 1.1, 1.1, 1.1])).toBe('flower'); // exactly +10% is not above
    expect(fam([1.11, 1.11, 1.11, 1.11, 1.11])).toBe('star');
    expect(fam([1.35, 1.35, 1.35, 1.35, 1.35])).toBe('star'); // exactly +35% is not lean yet
    expect(fam([1.36, 1.36, 1.36, 1.36, 1.36])).toBe('lean');
  });

  it('needs a majority of axes, not a single strong tip', () => {
    expect(fam([1.6, 1.6, 0.5, 0.5, 0.5])).toBe('flower'); // 2 lean votes, 3 weak → flower
    expect(fam([1.6, 1.6, 1.2, 1.2, 0.5])).toBe('star'); // 4 votes ≥ star, only 2 lean → star
    expect(fam([1.6, 1.6, 1.6, 0.4, 0.4])).toBe('lean'); // 3 lean votes → lean
  });

  it('gives every valley the same family — mix is 0 or 1, uniform on mixed boards', () => {
    const flower = boardStarProfile([1.5, 1.4, 0.4, 0.5, 0.3]); // majority weak → flower
    flower.valleys.forEach((v) => expect(v.mix).toBe(0));
    const star = boardStarProfile([1.5, 1.4, 0.4, 1.2, 0.3]); // 3 votes ≥ star → star
    star.valleys.forEach((v) => expect(v.mix).toBe(1));
  });

  // INV:R-275-astrolabe-no-hybrid — the prohibited quadrant is unconstructible:
  // a flower valley (rounded tip) is never deep, a star/lean valley always keeps sharp tips.
  it('never builds deep valleys under rounded tips', () => {
    const margins = [0.3, 0.5, 0.7, 0.9, 1.0, 1.1, 1.2, 1.35, 1.5, 2.0];
    for (const m of margins) {
      const p = boardStarProfile([m, m, m, m, m]);
      if (p.family === 'flower') {
        p.valleys.forEach((v) => {
          expect(v.mix).toBe(0);
          expect(v.depth).toBeGreaterThanOrEqual(V62_FLOWER_VALLEY_MIN);
          expect(v.depth).toBeLessThanOrEqual(V62_FLOWER_VALLEY_MAX);
        });
      } else {
        p.valleys.forEach((v) => {
          expect(v.mix).toBe(1);
          expect(v.depth).toBeLessThanOrEqual(V62_STAR_VALLEY_MAX);
        });
      }
    }
  });

  // INV:R-234-astrolabe-valley-per-tip (amended, R-275): the family is board-uniform now;
  // each valley still reads its two neighbouring axes — but only for DEPTH, inside the
  // family band driven by the weaker neighbour.
  it('lets depth vary per valley inside the family band', () => {
    const p = boardStarProfile([0.4, 0.4, 1.0, 1.0, 0.4]); // flower board, mixed margins
    const depths = new Set(p.valleys.map((v) => v.depth));
    expect(depths.size).toBeGreaterThan(1);
    p.valleys.forEach((v) => {
      expect(v.mix).toBe(0);
      expect(v.depth).toBeGreaterThanOrEqual(V62_FLOWER_VALLEY_MIN);
      expect(v.depth).toBeLessThanOrEqual(V62_FLOWER_VALLEY_MAX);
    });
  });

  it('is symmetric: equal axes give equal valleys', () => {
    const p = boardStarProfile([0.7, 0.7, 0.7, 0.7, 0.7]);
    p.valleys.forEach((v) => expect(v).toEqual(p.valleys[0]));
  });

  // INV:R-275-astrolabe-family-thresholds — the lean star stays in the admissible set:
  // sharpest valley of the three families, still built on straight flanks.
  it('keeps the lean star with the deepest valley and chord flanks', () => {
    const p = boardStarProfile([2.0, 2.0, 2.0, 2.0, 2.0]);
    expect(p.family).toBe('lean');
    p.valleys.forEach((v) => {
      expect(v.mix).toBe(1);
      expect(v.depth).toBeLessThanOrEqual(V62_LEAN_VALLEY);
    });
  });

  it('keeps tips per-axis: the profile only decides family and valley depth', () => {
    // the silhouette lengths come from geo.starTip (engine), so a mixed board under one
    // family still shows asymmetric tips — the profile carries no tip radii at all.
    const p = boardStarProfile([0.4, 1.6, 0.9, 1.3, 0.5]);
    expect(p.valleys).toHaveLength(5);
    expect(Object.keys(p).sort()).toEqual(['family', 'valleys']);
    expect(Object.keys(p.valleys[0]).sort()).toEqual(['depth', 'mix']);
  });
});

describe('engine wiring (R-234, R-275)', () => {
  const src = require('node:fs').readFileSync(
    require('node:path').resolve(__dirname, '../../../src/ui/idleVillage/components/destinyAstrolabeV62/engine.ts'), 'utf8') as string;

  // INV:R-234-astrolabe-no-ghost — the engine takes its valley profile from the board-family
  // rule (no single global family constant) and the dashed out-of-arena outline is painted
  // INSIDE the tar mask, so no hollow ghost petal survives where the tar ate the star.
  it('uses the board-family rule and no global valley depth', () => {
    expect(src).toContain('boardStarProfile(');
    expect(src).not.toMatch(/geo\.valleyF=vStar/);
  });

  it('paints the out-of-arena outline inside the tar mask', () => {
    const clipAt = src.indexOf("ctx.clip(ap,'evenodd')");
    const dashAt = src.indexOf('ctx.setLineDash([9,7])');
    expect(clipAt).toBeGreaterThan(-1);
    expect(dashAt).toBeGreaterThan(clipAt);
  });
});
