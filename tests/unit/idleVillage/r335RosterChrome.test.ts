/**
 * R-335 (2026-11-14) — two regressions the Director saw live on /game:
 *
 * 1. The roster's filter/sort pills painted the native <select> text
 *    («testo invece delle icone») because the roster never sat inside
 *    `.skin-scope`, so `skinScope.css`'s select-hiding rule
 *    (INV:drag-test-container-v2.INV-1) could not match. /gameOld wraps the
 *    whole subtree in <SkinScope> via GameFrame; on /game the roster panel
 *    carries the `skin-scope` class on its own mount.
 *
 *    R-336 (2026-11-14): the class must stay on the roster panel, NOT on the
 *    page root — a root-wide scope makes the base button plate rule
 *    (`.skin-scope :where(button…)`, specificity 0,3,0) win over the signed
 *    HUD surfaces' own scoped CSS (0,1,1), bronze-plating every transparent
 *    button of HudRealTime (pause/speeds) and HudRealNav (voices, recenter
 *    medallion, lock badges).
 * 2. The C1 medallion mounted `ring-fused.webp` — a row-module piece whose
 *    left gem band is cut at the image edge («l'immagine mozzata»). The
 *    standalone signed asset is `ring.webp` (same ornament complete, its own
 *    measured C1_GEOMETRY mount), the same file the roster columns use.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '../../../', p), 'utf8');

describe('R-335/R-336 — /game roster lives inside skin-scope (icon pills, not select text)', () => {
  it('the roster panel carries skin-scope…', () => {
    const src = read('src/pages/game-mappa2.tsx');
    expect(src).toMatch(/data-panel="roster"[^>]*className="skin-scope"/);
  });

  it('…and the page root does NOT (R-336: root scope bronze-plates the signed HUD buttons)', () => {
    const src = read('src/pages/game-mappa2.tsx');
    expect(src).toMatch(/className="game-frame"/);
    expect(src).not.toMatch(/className="game-frame skin-scope"/);
  });

  it('the select-hiding rule is still only reachable inside .skin-scope', () => {
    const css = read('src/ui/idleVillage/skins/skinScope.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.skin-scope \[data-hud-controls\] label select\s*\{[^}]*opacity:\s*0/);
  });
});

describe('R-335 — C1Medallion mounts the complete ring, not the mozzata', () => {
  // INV:c1-medallion.INV-1 — C1Medallion mounts the signed standalone ring
  // (`ring.webp` + `C1_GEOMETRY`), never the row-module `ring-fused.webp`
  // whose left gem band is cut at the image edge.
  it('uses ring.webp (complete left gem band), never ring-fused.webp (cut at x=0)', () => {
    const src = read('src/ui/idleVillage/components/C1Medallion.tsx');
    expect(src).toMatch(/C1_RING\s*=\s*'\/assets\/ui\/hud-real\/C1\/ring\.webp'/);
    expect(src).not.toMatch(/C1_RING\s*=\s*'[^']*ring-fused/);
  });

  it('mounts on C1_GEOMETRY (the standalone ring mount), not the row-module geometry', () => {
    const src = read('src/ui/idleVillage/components/C1Medallion.tsx');
    expect(src).toMatch(/C1_GEOMETRY\.ring/);
    expect(src).not.toMatch(/C1_ROWMOD\.ring/);
  });
});
