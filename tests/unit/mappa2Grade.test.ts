import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAPPA2_GRADE,
  GRADE_FILTER_ID,
  PALETTE_MATRIX,
  gradeCssFilter,
  gradeFilterMarkup,
  mountainShadeLive,
  paletteMatrixValues,
  toneTables,
} from '@/pages/mappa2-grade';

const rows = (values: string) => {
  const n = values.trim().split(/\s+/).map(Number);
  return [n.slice(0, 5), n.slice(5, 10), n.slice(10, 15), n.slice(15, 20)];
};

describe('mappa2 look-dev grade', () => {
  it('palette 0 is the identity colour matrix', () => {
    const [r, g, b, a] = rows(paletteMatrixValues(0));
    expect(r).toEqual([1, 0, 0, 0, 0]);
    expect(g).toEqual([0, 1, 0, 0, 0]);
    expect(b).toEqual([0, 0, 1, 0, 0]);
    expect(a).toEqual([0, 0, 0, 1, 0]);
  });

  it('palette 1 reproduces the fitted matrix and keeps neutral greys neutral', () => {
    const m = rows(paletteMatrixValues(1));
    PALETTE_MATRIX.forEach((row, i) => row.slice(0, 3).forEach((v, j) => expect(m[i][j]).toBeCloseTo(v, 3)));
    for (const grey of [0.25, 0.5, 0.75]) {
      const out = [0, 1, 2].map((i) => m[i][0] * grey + m[i][1] * grey + m[i][2] * grey + m[i][4]);
      for (const c of out) expect(Math.abs(c - grey)).toBeLessThan(0.03);
    }
  });

  it('tone curves are identity at 0, warm lights / cool shadows when on, and always within 0..1', () => {
    expect(toneTables(0, 0).r).toBe('0 0.25 0.5 0.75 1');
    const t = toneTables(1, 1);
    const [r, , , , rHi] = t.r.split(' ').map(Number);
    const b = t.b.split(' ').map(Number);
    const rr = t.r.split(' ').map(Number);
    expect(rr[3]).toBeGreaterThan(0.75); // lights get redder
    expect(b[3]).toBeLessThan(0.75); // lights get less blue
    expect(b[1]).toBeGreaterThan(0.25); // shadows get bluer
    expect(r).toBeGreaterThanOrEqual(0);
    expect(rHi).toBeLessThanOrEqual(1);
  });

  it('builds the filter markup and a CSS filter only when enabled', () => {
    expect(gradeFilterMarkup(DEFAULT_MAPPA2_GRADE)).toContain(`id="${GRADE_FILTER_ID}"`);
    expect(gradeCssFilter(DEFAULT_MAPPA2_GRADE)).toContain(`url(#${GRADE_FILTER_ID})`);
    expect(gradeCssFilter({ ...DEFAULT_MAPPA2_GRADE, enabled: false })).toBe('');
  });

  it('hands PixiWorldMap a live mountain-shade object that starts at the default opacity and points at a baked asset', () => {
    expect(mountainShadeLive.opacity).toBe(DEFAULT_MAPPA2_GRADE.mountainShade);
    expect(mountainShadeLive.url).toMatch(/mappa2\/base\/fx\/mountain-shade\.webp$/);
    expect(existsSync('public/assets/world/mappa2/base/fx/mountain-shade.webp')).toBe(true);
  });
});
