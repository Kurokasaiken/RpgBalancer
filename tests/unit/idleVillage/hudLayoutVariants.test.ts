// PLAN-112 F1.5: the three variants of blueprint B obey the same contract.
import { describe, expect, it } from 'vitest';
import { M, frameFor, resolveSlots, resolveAll, overlaps, coveragePct, allowedSteps, fits, TOP_ROW_H, isDeclaredOverlap, type Variant } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';

const VIEWPORTS: Array<[number, number]> = [[1280, 720], [1440, 810], [1920, 1080], [2400, 1000], [3440, 1440]];
const VARIANTS: Variant[] = ['B1', 'B2', 'B3'];

describe('blueprint B variants', () => {
  for (const v of VARIANTS) for (const [w, h] of VIEWPORTS) for (const step of [1, 1.25, 1.5, 2]) {
    const f = frameFor(w, h, step);
    if (!fits(f, v)) continue;
    const { slots } = resolveSlots(f, v);
    const r = resolveAll(slots, f);
    const tag = `${v} ${w}x${h} @${Math.round(step * 100)}%`;
    it(`${tag}: one right margin, no overlap, inside the window, budget`, () => {
      expect(r.resources.x + r.resources.w).toBeCloseTo(f.W - M, 6);
      expect(r.panel.x + r.panel.w).toBeCloseTo(f.W - M, 6);
      expect(r.commands.x + r.commands.w).toBeCloseTo(f.W - M, 6);
      const ids = Object.keys(r);
      for (const id of ids) { expect(r[id].x, id).toBeGreaterThanOrEqual(0); expect(r[id].y, id).toBeGreaterThanOrEqual(0); expect(r[id].x + r[id].w, id).toBeLessThanOrEqual(f.W + 1e-6); expect(r[id].y + r[id].h, id).toBeLessThanOrEqual(f.H + 1e-6); }
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (!isDeclaredOverlap(ids[i], ids[j])) expect(overlaps(r[ids[i]], r[ids[j]]), `${ids[i]} x ${ids[j]}`).toBe(false);
      expect(coveragePct(slots, f, (s) => s.mode === 'persistent', v)).toBeLessThanOrEqual(24);
    });
  }
  it('B2 keeps the top centre free and the two top modules on one centre line', () => {
    const f = frameFor(1440, 810);
    const r = resolveAll(resolveSlots(f, 'B2').slots, f);
    expect(r.time.y + r.time.h / 2).toBe(r.resources.y + r.resources.h / 2);
    expect(r.time.h).toBe(TOP_ROW_H);
    const freeFrom = r.roster.x + r.roster.w;
    const freeTo = r.time.x;
    expect(freeTo - freeFrom).toBeGreaterThan(400); // free top-centre span, design px; 400 from the roster with plaques (268 px), Director 2026-11-05: 416 accepted
  });
  it('B3 frees the top-left corner and centres the roster on the left edge', () => {
    const f = frameFor(1440, 810);
    const r = resolveAll(resolveSlots(f, 'B3').slots, f);
    expect(r.roster.y).toBeGreaterThan(r.time.y + r.time.h);
    expect(r.roster.y + r.roster.h / 2).toBeCloseTo(f.H / 2, 6);
  });
  it('prints the interface steps each variant offers', () => {
    const lines = VARIANTS.map((v) => `${v}: ` + VIEWPORTS.map(([w, h]) => `${w}x${h}=${allowedSteps(w, h, [1, 1.25, 1.5, 2], v).join('/')}`).join('  '));
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));
    for (const v of VARIANTS) for (const [w, h] of VIEWPORTS) expect(allowedSteps(w, h, [1, 1.25, 1.5], v), `${v} ${w}x${h}`).toContain(1);
  });
});
