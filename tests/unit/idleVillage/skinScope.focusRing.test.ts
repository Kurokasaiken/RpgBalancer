/**
 * PLAN-067 T-A14 (R-234) — the keyboard focus ring is the skin's, everywhere in /game.
 * Tabbing through the real HUD showed the browser's blue system ring (`rgb(0,95,204)`) on the POI
 * markers, the time controls and the nav, because the skinned ring only covered `[data-hud-controls]`
 * (audit F3 HUD §5). A zero-specificity rule on the whole scope covers every focusable, and the
 * specific rules (HUD controls, choices) still win. Token-only: no colour literal.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.resolve(__dirname, '../../../src/ui/idleVillage/skins/skinScope.css'), 'utf8');

/** Rules `selector { body }` at the top level, comments stripped. */
const rules = (): Array<{ selector: string; body: string }> => {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: Array<{ selector: string; body: string }> = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(src); m; m = re.exec(src)) out.push({ selector: m[1].trim(), body: m[2] });
  return out;
};

describe('skinScope.css — scope-wide focus ring (R-234)', () => {
  // INV:R-234-focus-ring-skinned — every focusable inside `.skin-scope` (buttons, role=button/radio,
  // links, tabindex targets) gets a token-built outline instead of the system ring on :focus-visible.
  it('has a scope-wide :focus-visible rule built on tokens, with no system outline', () => {
    const rule = rules().find((r) =>
      r.selector.startsWith('.skin-scope :where(') &&
      r.selector.endsWith(':focus-visible') &&
      ['button', '[role="button"]', '[role="radio"]', 'a', '[tabindex]'].every((t) => r.selector.includes(t)),
    );
    expect(rule, 'scope-wide focus rule').toBeTruthy();
    // An outline, not a box-shadow: inline `box-shadow` on the controls would hide a shadow ring.
    expect(rule!.body).toMatch(/outline:\s*\d+px solid var\(--skin-[a-z-]+\)/);
    expect(rule!.body).not.toMatch(/outline:\s*(none|auto)/);
    expect(rule!.body).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});
