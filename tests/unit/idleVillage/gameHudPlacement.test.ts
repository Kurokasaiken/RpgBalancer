import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_HUD_BARS, placeGameHud, type GameHudPlacement } from '@/ui/idleVillage/hudReal/layout/gameHudPlacement';
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
