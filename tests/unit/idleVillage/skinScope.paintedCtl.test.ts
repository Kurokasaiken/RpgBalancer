/**
 * skinScope.paintedCtl.test.ts — painted `data-ctl` controls must never fall
 * under the generic "button material" state rules.
 *
 * Regression guard for the roster-ring hover bug (Director report 2026-11-21):
 * the generic hover/active/pressed rules set the `background` SHORTHAND, which
 * resets `background-size`/`background-repeat`. On painted `data-ctl` buttons
 * that made the 168px art paint at native size inside the 30px box — the ring
 * vanished and a flat colored square showed instead ("l'anello diventa un
 * quadrato e scompare"). Painted pieces carry their own art-driven states, so
 * every generic state rule must exclude `[data-ctl]`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(
  resolve(process.cwd(), 'src/ui/idleVillage/skins/skinScope.css'),
  'utf8',
);

describe('skinScope painted data-ctl controls (roster ring hover bug)', () => {
  it('excludes painted controls from the generic button hover rule', () => {
    expect(css).toMatch(
      /\[data-skin="close"\]\):not\(\[data-ctl\]\):hover:not\(:disabled\)\s*\{/,
    );
  });

  it('excludes painted controls from the generic button active rule', () => {
    expect(css).toMatch(
      /\[data-skin="close"\]\):not\(\[data-ctl\]\):active:not\(:disabled\)\s*\{/,
    );
  });

  it('excludes painted controls from the hud-controls hover and pressed rules', () => {
    expect(css).toMatch(
      /\[data-hud-controls\] button:not\(\[data-skin="cta"\]\):not\(\[data-ctl\]\):hover:not\(:disabled\),\s*\n\.skin-scope \[data-hud-controls\] label:not\(\[data-ctl\]\):hover/,
    );
    expect(css).toMatch(
      /\[data-hud-controls\] button:not\(\[data-ctl\]\)\[aria-pressed="true"\],\s*\n\.skin-scope \[data-hud-controls\] button:not\(\[data-ctl\]\)\[aria-checked="true"\]/,
    );
  });

  it('keeps the painted round geometry contract (art at display size, no repeat)', () => {
    expect(css).toMatch(
      /\[data-ctl="round"\][^}]*background-size:\s*30px 30px/s,
    );
    expect(css).toMatch(
      /\[data-ctl="round"\][^}]*background-repeat:\s*no-repeat/s,
    );
    expect(css).toMatch(
      /\[data-ctl="round"\][^}]*background-color:\s*transparent/s,
    );
  });

  it('keeps the painted hover/pressed/selected art swap intact', () => {
    expect(css).toMatch(/round-hover\.webp/);
    expect(css).toMatch(/round-pressed\.webp/);
    expect(css).toMatch(/round-selected\.webp/);
  });
});
