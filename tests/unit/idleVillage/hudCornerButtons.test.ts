/**
 * PLAN-067 HUD-3 = P1 (R-234) — the three corner buttons (menu, panels, hide HUD) are bronze: a brass
 * ring around a lit lacquer disc with a gold glyph, not the black pills of the generic HUD controls.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.resolve(__dirname, '../../../src/ui/idleVillage/skins/skinScope.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('corner buttons — bronze (R-234, HUD-3)', () => {
  // INV:R-234-hud-corner-bronze — brass ring + lacquer disc + gold glyph on the three corner buttons.
  it('has a brass-ringed rule for the menu, panels and hide buttons', () => {
    const m = /\.skin-scope \[data-hud-corner\][^{]*hud-menu-trigger[^{]*\{([^}]*)\}/.exec(css);
    expect(m, 'corner button rule').toBeTruthy();
    const body = m![1];
    expect(body).toMatch(/border:\s*1\.5px solid var\(--skin-hud-brass-hi\)/);
    expect(body).toMatch(/radial-gradient/);
    expect(body).toMatch(/color:\s*var\(--skin-title-color\)/);
    expect(/\.skin-scope \[data-hud-corner\][^{]*data-hud-panels-trigger[^{]*\{/.test(css)).toBe(true);
    expect(/\.skin-scope \[data-hud-corner\][^{]*data-hud-hide-toggle[^{]*\{/.test(css)).toBe(true);
  });
});
