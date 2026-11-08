// PLAN-112 F1 fit check: every existing game panel must have a place in blueprint B (natural, compressed, scrolling or replacing the side panel).
import { describe, expect, it } from 'vitest';
import { PANEL_FAMILIES, fitPanel, frameFor, fits } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';

const VIEWPORTS: Array<[number, number]> = [[1280, 720], [1366, 768], [1440, 810], [1920, 1080], [2560, 1440]];
describe('panel families fit the blueprint', () => {
  it('prints the fit table', () => {
    const lines: string[] = [];
    for (const [w, h] of VIEWPORTS) for (const step of [1, 1.25, 1.5, 2]) {
      const f = frameFor(w, h, step);
      if (!fits(f)) { lines.push(`${w}x${h} @x${step} | blueprint not offered`); continue; }
      lines.push(`${w}x${h} @x${step} | ` + PANEL_FAMILIES.map((p) => `${p.id}:${fitPanel(p, f)}`).join(' '));
    }
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));
    expect(lines.length).toBe(20);
  });
  it('no panel is left without a place at 100% on any canonical viewport', () => {
    for (const [w, h] of VIEWPORTS) for (const p of PANEL_FAMILIES) expect(fitPanel(p, frameFor(w, h, 1)), `${p.id} ${w}x${h}`).not.toBe('no');
  });
  it('no panel is left without a place at the other zooms the blueprint offers (compression, scroll or replacing the side panel)', () => {
    for (const [w, h] of VIEWPORTS) for (const step of [1.25, 1.5, 2]) { const f = frameFor(w, h, step); if (!fits(f)) continue; for (const p of PANEL_FAMILIES) expect(fitPanel(p, f), `${p.id} ${w}x${h} @${step}`).not.toBe('no'); }
  });
});
