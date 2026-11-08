// PLAN-112 O-2: the HUD layout contract must hold at every canonical viewport and at every interface-size step it allows.
import { describe, expect, it } from 'vitest';
import {
  SLOTS_B, M, TOP_ROW_H, MIN_W_TOP_ROW, MIN_W_BOTTOM_ROW, frameFor, resolveSlots, resolveAll, overlaps, coveragePct, allowedSteps, fits, budgetFor,
  isDeclaredOverlap, CREST_OVERLAP,
} from '@/ui/idleVillage/hudReal/layout/hudLayoutB';

const VIEWPORTS: Array<[number, number]> = [[1180, 820], [1280, 650], [1280, 720], [1366, 768], [1440, 810], [1920, 1080], [2560, 1440], [3440, 1440]];
const STEPS = [1, 1.25, 1.5, 2]; // the game's HUD zooms (hudScale)

describe('HUD layout contract (blueprint B, with reflow)', () => {
  for (const [w, h] of VIEWPORTS) for (const step of STEPS) {
    const f = frameFor(w, h, step);
    if (!fits(f)) continue; // steps that do not fit are not offered (see the allowedSteps test)
    const { slots, topReflow, bottomReflow } = resolveSlots(f);
    const r = resolveAll(slots, f);
    const tag = `${w}x${h} @${Math.round(step * 100)}%`;
    it(`${tag}: top row is one module (centre line) unless reflowed, and then stacks on the same right edge`, () => {
      if (!topReflow) {
        expect(r.time.y).toBe(r.resources.y);
        expect(r.time.h).toBe(TOP_ROW_H);
        expect(r.resources.h).toBe(TOP_ROW_H);
        // amend G1 #4: the roster hangs under the crest, its top is CREST_BOX - CREST_OVERLAP below the top row's start
        expect(r.roster.y).toBe(r.crest.y + r.crest.h - CREST_OVERLAP);
      } else {
        expect(r.time.x + r.time.w).toBeCloseTo(r.resources.x + r.resources.w, 6);
        expect(r.time.y).toBeGreaterThanOrEqual(r.resources.y + r.resources.h);
      }
    });
    it(`${tag}: right column and bottom row sit on one margin`, () => {
      expect(r.resources.x + r.resources.w).toBeCloseTo(f.W - M, 6);
      expect(r.panel.x + r.panel.w).toBeCloseTo(f.W - M, 6);
      expect(r.commands.x + r.commands.w).toBeCloseTo(f.W - M, 6);
      expect(r.voce.x).toBe(M);
      expect(r.roster.x).toBe(M);
      expect(r.nav.y + r.nav.h).toBeCloseTo(f.H - M, 6);
      expect(r.commands.y + r.commands.h).toBeCloseTo(f.H - M, 6);
      if (!bottomReflow) expect(r.voce.y + r.voce.h).toBeCloseTo(f.H - M, 6);
    });
    it(`${tag}: nothing overlaps with every view switched on, nothing leaves the window`, () => {
      const ids = Object.keys(r);
      for (const id of ids) {
        const q = r[id];
        expect(q.x, id).toBeGreaterThanOrEqual(0);
        expect(q.y, id).toBeGreaterThanOrEqual(0);
        expect(q.x + q.w, id).toBeLessThanOrEqual(f.W + 1e-6);
        expect(q.y + q.h, id).toBeLessThanOrEqual(f.H + 1e-6);
      }
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (!isDeclaredOverlap(ids[i], ids[j])) expect(overlaps(r[ids[i]], r[ids[j]]), `${ids[i]} x ${ids[j]}`).toBe(false);
    });
    it(`${tag}: persistent bounding boxes stay inside the budget (24% at every zoom: ruling B, 2026-11-05)`, () => {
      expect(coveragePct(SLOTS_B, f, (s) => s.mode === 'persistent')).toBeLessThanOrEqual(budgetFor(step));
    });
  }
  it('reflow thresholds are the ones the rules state', () => {
    expect(MIN_W_TOP_ROW).toBeGreaterThan(1100);
    expect(MIN_W_BOTTOM_ROW).toBeGreaterThan(MIN_W_TOP_ROW);
    expect(resolveSlots(frameFor(1440, 810, 1.25)).topReflow).toBe(true);
    expect(resolveSlots(frameFor(1440, 810, 1)).topReflow).toBe(false);
  });
  it('the game zoom 1 is offered on every canonical window, and the offered zooms are reported', () => {
    const rep = VIEWPORTS.map(([w, h]) => `${w}x${h}: ${allowedSteps(w, h).join('/')}`);
    // eslint-disable-next-line no-console
    console.log('allowed zooms\n' + rep.join('\n'));
    for (const [w, h] of VIEWPORTS) expect(allowedSteps(w, h), `${w}x${h}`).toContain(1);
  });
  it('the zoom never goes below the game minimum (1)', () => {
    expect(frameFor(1280, 800, 0.5).scale).toBe(1);
    expect(frameFor(3840, 2160, 3).scale).toBe(2);
  });
});
