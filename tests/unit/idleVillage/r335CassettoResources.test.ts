/**
 * R-335 (2026-11-14) — «il mockup aveva il componente risorse in alto al suo
 * interno, perché scompare?»
 *
 * The signed cassetto frame paints an empty navy well at its top interior
 * (where the mockup's control band sits). The 2026-11-10 ruling asked for the
 * resources band inside the cassetto's space, but it was only ever mounted as
 * a floating overlay on /hud-compose — while on /game the open drawer covers
 * the page's own resources slot, so the readout visibly "disappears".
 *
 * Fix: `HudRealCassetto` owns a `resourceItems` prop and mounts the real
 * `HudRealResources` inside that navy well; both production mounts
 * (`HudRealCassettoDetail` on /game, `HudRealCassettoHost` on the lab) feed it
 * the same `buildResourceReadoutItems(selectResourceOutlook(...))` pipeline the
 * page's resources slot uses. The external lab overlay is gone — the drawer is
 * the single mount point.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '../../../', p), 'utf8');

describe('R-335 — the cassetto owns the resources band inside its top well', () => {
  it('HudRealCassetto exposes resourceItems and mounts the real HudRealResources in a dedicated zone', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassetto.tsx');
    expect(src).toMatch(/resourceItems\?:\s*ResourceReadoutItem\[\]/);
    expect(src).toMatch(/import\s*\{\s*HudRealResources\s*\}\s*from\s*'\.\/HudRealResources'/);
    expect(src).toMatch(/resources:\s*\{\s*x:\s*\d+,\s*y:\s*\d+,\s*w:\s*\d+,\s*h:\s*\d+\s*\}/);
    expect(src).toMatch(/data-cassetto-resources/);
  });

  it('the bar is fitted to the well (ResizeObserver on RESOURCES_BAR geometry), never left at natural size', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassetto.tsx');
    expect(src).toMatch(/ResizeObserver/);
    expect(src).toMatch(/RESOURCES_BAR\.w/);
    expect(src).toMatch(/RESOURCES_BAR\.h/);
  });
});

describe('R-335 — both mounts feed the REAL readout (no lab fabrication)', () => {
  it('HudRealCassettoDetail (/game) builds items from selectResourceOutlook on the live store', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx');
    expect(src).toMatch(/useMinimalGameplayWithIdleVillageConfig/);
    expect(src).toMatch(/buildResourceReadoutItems\(selectResourceOutlook\(state,\s*config\),\s*t\)/);
    expect(src).toMatch(/resourceItems=\{resourceItems\}/);
  });

  it('HudRealCassettoHost (lab) does the same through the same pipeline', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassettoHost.tsx');
    expect(src).toMatch(/useMinimalGameplayWithIdleVillageConfig/);
    expect(src).toMatch(/buildResourceReadoutItems\(selectResourceOutlook\(gpState,\s*gpConfig\),\s*t\)/);
    expect(src).toMatch(/resourceItems=\{resourceItems\}/);
  });
});

describe('R-335 — no second resources mount floats outside the drawer', () => {
  it('hud-compose?comp=cassetto no longer renders the separate top-right overlay', () => {
    const src = read('src/pages/hud-compose.tsx');
    const cassettoBlock = src.match(/\{params\.get\('comp'\)\s*===\s*'cassetto'\s*&&\s*\(([\s\S]*?)\)\}/);
    expect(cassettoBlock).not.toBeNull();
    expect(cassettoBlock![1]).not.toMatch(/HudRealResources/);
    expect(cassettoBlock![1]).toMatch(/HudRealCassettoHost/);
  });
});
