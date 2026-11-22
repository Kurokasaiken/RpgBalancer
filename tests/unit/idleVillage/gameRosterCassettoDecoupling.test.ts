/**
 * gameRosterCassettoDecoupling.test.ts — Director ruling 2026-11-21:
 * on `/game` opening a POI mounts ONLY the signed cassetto. The roster is an
 * always-separate surface (Director 2026-11-15): it opens on demand — the
 * party-seat › (`onOpenRoster`) or the nav/menu toggle — and closes at will.
 *
 * Regression guard for the page wiring: R-184's `usePanelWhileOpen(panels,
 * 'roster', anyExpeditionDetailOpen)` auto-opened the roster with every
 * planner detail and — because the `panels` api is rebuilt on every stage
 * update — re-opened it immediately after any manual close, so the roster
 * could not be closed while a detail was up.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/pages/game-mappa2.tsx'), 'utf8');

describe('/game roster × cassetto decoupling (Director 2026-11-21)', () => {
  it('never couples roster visibility to the expedition detail state', () => {
    expect(source).not.toMatch(/usePanelWhileOpen\(\s*panels\s*,\s*'roster'/);
    /* The hook must not be called on this page at all (call-site regex: the
     * ruling comment may still name it in backticks). */
    expect(source).not.toMatch(/usePanelWhileOpen\s*\(/);
  });

  it('keeps the on-demand open path: party-seat › opens the roster panel', () => {
    expect(source).toMatch(/onOpenRoster=\{\s*\(\)\s*=>\s*panels\.set\('roster',\s*true\)\s*\}/);
  });

  it('keeps the roster player-closable while the cassetto is open', () => {
    expect(source).toMatch(/onClose=\{\s*\(\)\s*=>\s*panels\.set\('roster',\s*false\)\s*\}/);
    expect(source).toMatch(/StagePanelEscape\s+panelId="roster"\s+onEscape=\{\s*\(\)\s*=>\s*panels\.set\('roster',\s*false\)\s*\}/);
  });
});
