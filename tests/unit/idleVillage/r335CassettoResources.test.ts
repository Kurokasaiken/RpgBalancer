/**
 * R-335 (2026-11-14) — «il mockup aveva il componente risorse in alto al suo
 * interno, perché scompare?» + «il cassetto dovrebbe essere più largo».
 *
 * The approved fork baseline (R-323 ruling "1 · Dentro la cornice",
 * `.mw/runs/20261110-cassetto-explore/column/fork-*.png`, PLAN-116 F1/F3) has
 * the village readout as TARGHETTE — dark-glass plaques inside the cleaned
 * header band of a 420px-wide recomposed column. The earlier mount of the
 * whole `HudRealResources` bar scaled into the well was the wrong shape: the
 * component is built for the top-right corner slot, and any scale that fits
 * the band makes it unreadable.
 *
 * Fix: `HudRealCassetto` renders the widened column art
 * (`scripts/hud-real/build-cassetto-column.py` → `column-1440/1280.webp` +
 * generated `cassettoColumnGeometry` zones) and mounts one plaque per
 * `resourceItems` entry in the cleaned band. Both production mounts
 * (`HudRealCassettoDetail` on /game, `HudRealCassettoHost` on the lab) feed it
 * the same `buildResourceReadoutItems(selectResourceOutlook(...))` pipeline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '../../../', p), 'utf8');

/* R-357 / PLAN-125 (Mode B-amend, supersedes R-335; re-applied 2026-11-20 after a parallel revert): the Director ruled D-1 —
 * the resources live in the centre top bar and the cassetto carries NO resources band. The drawer is rebuilt in DOM from the golden
 * `mockup-r357-cassetto-largo.png`. */
describe('R-357 — the cassetto has no resources band (D-1, supersedes R-335)', () => {
  // INV:cassetto-no-resources-band
  it('HudRealCassetto renders no resources band and no baked column art', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassetto.tsx');
    expect(src).not.toMatch(/data-cassetto-resources/);
    expect(src).not.toMatch(/data-cassetto-res=/);
    expect(src).not.toMatch(/column-1440|column-1280|cassettoColumnGeometry/);
    expect(src).toMatch(/@deprecated D-1/);
  });

  it('the rebuilt column is DOM + the sliced golden assets, on a 1024-unit design width, with a SUPPLIES block', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassetto.tsx');
    expect(src).toMatch(/slicekit\/cassetto/);
    expect(src).toMatch(/DESIGN_W = 1024/);
    expect(src).toMatch(/data-block="bag-slots"/);
    expect(src).toMatch(/cassetto-supplies-title/);
  });
});

describe('R-357 — the lab column gives the drawer its ruled width', () => {
  it('hud-compose?comp=cassetto sizes the slot wide enough for the 0.5689 aspect', () => {
    const src = read('src/pages/hud-compose.tsx');
    const cassettoBlock = src.match(/\{params\.get\('comp'\)\s*===\s*'cassetto'\s*&&\s*\(([\s\S]*?)\)\}/);
    expect(cassettoBlock).not.toBeNull();
    expect(cassettoBlock![1]).toMatch(/HudRealCassettoHost/);
    expect(cassettoBlock![1]).toMatch(/width:\s*'62vh'/);
  });
});
