import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_HUD_BARS, placeGameHud, placeHudBlueprint, type GameHudPlacement } from '@/ui/idleVillage/hudReal/layout/gameHudPlacement';
import { hudPx, HUD_TYPE_FLOOR_REAL } from '@/ui/idleVillage/hudReal/hudType';
import { zoomFor } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';

// /game HUD placement (Director 2026-11-10 «Sì, sistema»: phone overlap + small text). Boxes are the bars' ART, not the slots.
type Box = { x0: number; y0: number; x1: number; y1: number };
const art = (p: GameHudPlacement, id: 'time' | 'resources' | 'nav'): Box => {
  const b = p[id]; const s = p.frame.scale; const a = GAME_HUD_BARS[id];
  return { x0: b.left * s, y0: b.top * s, x1: (b.left + a.w * b.scale) * s, y1: (b.top + a.h * b.scale) * s };
};
const overlap = (a: Box, b: Box) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.5 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0.5;
const WINDOWS: Array<[number, number]> = [[390, 844], [412, 915], [600, 960], [820, 1180], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]];
const LANDSCAPE_WINDOWS: Array<[number, number]> = [[844, 390], [667, 375], [932, 430]];

describe('placeGameHud', () => {
  it('below 768 px uses the phone arrangement (D10: the blueprint does not apply), from 768 the signed blueprint', () => {
    expect(placeGameHud(390, 844, 1).mode).toBe('phone');
    expect(placeGameHud(767, 1024, 1).mode).toBe('phone');
    expect(placeGameHud(768, 1024, 1).mode).toBe('blueprint');
    expect(placeGameHud(1280, 800, 1).mode).toBe('blueprint');
  });

  for (const [w, h] of WINDOWS) {
    it(`${w}x${h}: the three bars never overlap and stay inside the window`, () => {
      const p = placeGameHud(w, h, zoomFor('auto', w, h));
      const boxes = (['time', 'resources', 'nav'] as const).map((id) => art(p, id));
      for (const b of boxes) {
        expect(b.x0).toBeGreaterThanOrEqual(-0.5);
        expect(b.y0).toBeGreaterThanOrEqual(-0.5);
        expect(b.x1).toBeLessThanOrEqual(w + 0.5);
        expect(b.y1).toBeLessThanOrEqual(h + 0.5);
      }
      expect(overlap(boxes[0], boxes[1])).toBe(false);
      expect(overlap(boxes[0], boxes[2])).toBe(false);
      expect(overlap(boxes[1], boxes[2])).toBe(false);
    });
  }

  it('text compensation undoes exactly the bar scale, so the designed px reach the real screen (caption floor 12)', () => {
    for (const [w, h] of WINDOWS) {
      const p = placeGameHud(w, h, zoomFor('auto', w, h));
      for (const id of ['time', 'resources', 'nav'] as const) {
        expect(p[id].textK * p[id].scale).toBeCloseTo(1, 9);
        expect(13 * p[id].scale * p[id].textK * p.frame.scale).toBeGreaterThanOrEqual(HUD_TYPE_FLOOR_REAL.caption); // nav labels / resource labels are 13 design px
      }
    }
    expect(hudPx(13)).toBe('calc(13px * var(--hud-text-k, 1))');
  });

  it('when the time bar drops under the resources it starts below the hanging gem, not under the 56 px row', () => {
    const p = placeGameHud(820, 1180, 1);
    expect(p.time.top).toBeGreaterThanOrEqual(p.resources.top + GAME_HUD_BARS.resources.h * p.resources.scale);
  });

  /* R-325 (Director 2026-11-12): the time bar stays page-centred at EVERY blueprint width — the signed reflow
   *  that parked it under the resources on the right does not apply on /game. */
  it('the time bar is horizontally centred at every blueprint width, reflow included', () => {
    for (const w of [768, 820, 1000, 1024, 1150, 1200, 1280, 1440, 1600, 1920, 2560, 3440]) {
      const p = placeGameHud(w, 900, 1);
      expect(p.mode).toBe('blueprint');
      const t = art(p, 'time');
      expect((t.x0 + t.x1) / 2).toBeCloseTo(w / 2, 1);
    }
  });

  /* R-332 (Director 2026-11-14): the game is played in landscape on phones — windows wider than tall and shorter
   *  than 560 px get a miniature of the signed desktop layout: same percentage of window, same mutual proportions. */
  it('landscape windows shorter than 560 px use the miniature layout, taller ones keep the blueprint', () => {
    expect(placeGameHud(844, 390, 1).mode).toBe('landscape');
    expect(placeGameHud(667, 375, 1).mode).toBe('landscape');
    expect(placeGameHud(1024, 768, 1).mode).toBe('blueprint');
    expect(placeGameHud(390, 844, 1).mode).toBe('phone');
  });

  for (const [w, h] of LANDSCAPE_WINDOWS) {
    it(`${w}x${h}: the miniature keeps each bar's desktop share of the window, inside bounds, never overlapping`, () => {
      const p = placeGameHud(w, h, 1);
      const ref = placeHudBlueprint(1920, 1080, 1);
      const bp = placeHudBlueprint(w, h, 1);
      for (const id of ['time', 'resources', 'nav'] as const) {
        // same percentage of window width as the signed blueprint at 1920×1080
        const artW = GAME_HUD_BARS[id].w * p[id].scale;
        const refW = GAME_HUD_BARS[id].w * ref[id].scale;
        expect(artW / w).toBeCloseTo(refW / 1920, 5);
        // same percentage position (nav's top is re-anchored to keep the tip inside the short window)
        if (id !== 'nav') {
          expect(p[id].left / w).toBeCloseTo(ref[id].left / 1920, 5);
          expect(p[id].top / h).toBeCloseTo(ref[id].top / 1080, 5);
        }
        // text keeps the blueprint's own compensation at this window — full 1/scale would overflow the mini bars
        expect(p[id].textK).toBeCloseTo(bp[id].textK, 9);
        expect(p[id].textK).toBeLessThan(1 / p[id].scale);
      }
      const boxes = (['time', 'resources', 'nav'] as const).map((id) => art(p, id));
      for (const b of boxes) {
        expect(b.x0).toBeGreaterThanOrEqual(-0.5);
        expect(b.y0).toBeGreaterThanOrEqual(-0.5);
        expect(b.x1).toBeLessThanOrEqual(w + 0.5);
        expect(b.y1).toBeLessThanOrEqual(h + 0.5); // the nav tip stays inside (Director: «la punta sparisce oltre il bordo»)
      }
      expect(overlap(boxes[0], boxes[1])).toBe(false);
      expect(overlap(boxes[0], boxes[2])).toBe(false);
      expect(overlap(boxes[1], boxes[2])).toBe(false);
      // time and nav stay page-centred like on the desktop layout
      expect((boxes[0].x0 + boxes[0].x1) / 2).toBeCloseTo(w / 2, 1);
      expect((boxes[2].x0 + boxes[2].x1) / 2).toBeCloseTo(w / 2, 1);
      // the corner round buttons shrink with the bars
      expect(p.cornerScale).toBeCloseTo(p.nav.scale, 9);
    });
  }

  it('the corner buttons keep their own size outside the landscape miniature', () => {
    expect(placeGameHud(390, 844, 1).cornerScale).toBe(1);
    expect(placeGameHud(1920, 1080, 1).cornerScale).toBe(1);
  });

  it('the three bars and /game wire the compensation; /hud-compose keeps its rendering (no variable = factor 1)', () => {
    for (const f of ['HudRealTime', 'HudRealResources', 'HudRealNav']) {
      expect(readFileSync(`src/ui/idleVillage/hudReal/${f}.tsx`, 'utf8')).toContain('hudPx(');
    }
    expect(readFileSync('src/ui/idleVillage/hudReal/HudRealNav.tsx', 'utf8')).toContain('labelSpread = 0');
    const page = readFileSync('src/pages/game-mappa2.tsx', 'utf8');
    expect(page).toContain("['--hud-text-k' as string]: String(b.textK)");
    expect(page).toContain('labelSpread={hud.navLabelSpread}');
    expect(readFileSync('src/pages/hud-compose.tsx', 'utf8')).not.toContain('--hud-text-k');
  });
});
