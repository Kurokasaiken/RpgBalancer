/**
 * taskClose — chiusura meccanica della contabilità (PLAN-059 T-002).
 * Test su funzioni pure + findPassBundle su repo sintetico.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  closePlanIndex,
  closeRichiesta,
  entityAliases,
  findPassBundle,
  prependHandoff,
} from '../../../scripts/taskClose';

const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'taskclose-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

describe('findPassBundle', () => {
  it('trova il bundle PASS del run dir dell\'entità', () => {
    const root = mkTmp();
    const run = path.join(root, '.mw/runs/plan052-x');
    mkdirSync(run, { recursive: true });
    writeFileSync(
      path.join(run, 'bundle.json'),
      JSON.stringify({ verdict: 'PASS', produced_at: '2026-10-19T10:00:00Z' }),
    );
    expect(findPassBundle(root, 'PLAN-052')).toBe('.mw/runs/plan052-x/bundle.json');
  });
  it('rifiuta run con verdict diverso o entità diversa', () => {
    const root = mkTmp();
    for (const [dir, v] of [
      ['plan052-x', 'BLOCKED'],
      ['plan099-y', 'PASS'],
    ] as const) {
      const run = path.join(root, '.mw/runs', dir);
      mkdirSync(run, { recursive: true });
      writeFileSync(path.join(run, 'bundle.json'), JSON.stringify({ verdict: v }));
    }
    expect(findPassBundle(root, 'PLAN-052')).toBeNull();
  });
  it('entityAliases normalizza PLAN-052 → plan-052/plan052', () => {
    expect(entityAliases('PLAN-052')).toEqual(['plan-052', 'plan052']);
    expect(entityAliases('R-230')).toEqual(['r-230', 'r230']);
  });
});

describe('closeRichiesta', () => {
  const doc =
    '## R-229 — altra\n\n**Stato:** `fatta` (2026-10-19)\n\n---\n\n' +
    '## R-230 — questa\n\n**Data:** 2026-10-19\n**Stato:** `in corso`\n**Contesto:** x\n\n---\n\n' +
    '## R-231 — dopo\n\n**Stato:** `in corso`\n';
  it('chiude solo la sezione dell\'entità, non le altre', () => {
    const out = closeRichiesta(doc, 'R-230', '.mw/runs/r230-x/bundle.json', '2026-10-19')!;
    expect(out).toContain('**Stato:** `fatta` (2026-10-19) — bundle: `.mw/runs/r230-x/bundle.json` PASS');
    expect(out).toContain('## R-231 — dopo\n\n**Stato:** `in corso`');
    expect(out).toContain('## R-229 — altra\n\n**Stato:** `fatta` (2026-10-19)');
  });
  it('null se già fatta o senza sezione', () => {
    expect(closeRichiesta(doc, 'R-229', 'b', '2026-10-19')).toBeNull();
    expect(closeRichiesta(doc, 'R-999', 'b', '2026-10-19')).toBeNull();
  });
});

describe('closePlanIndex', () => {
  const idx =
    '| plan | desc | status | P1 | date | tasks | refs |\n' +
    '| [PLAN-052](PLAN-052-x.md) | foo | baptized | P1 | d | t | r |\n' +
    '| [PLAN-051](PLAN-051-y.md) | bar | in corso | P1 | d | t | r |\n';
  it('aggiorna la colonna stato della riga giusta', () => {
    const out = closePlanIndex(idx, 'PLAN-052')!;
    expect(out).toContain('| [PLAN-052](PLAN-052-x.md) | foo | completato | P1');
    expect(out).toContain('| [PLAN-051](PLAN-051-y.md) | bar | in corso |');
  });
  it('null se già completato', () => {
    const done = idx.replace('baptized', 'completato');
    expect(closePlanIndex(done, 'PLAN-052')).toBeNull();
  });
});

describe('prependHandoff', () => {
  it('inserisce la riga dopo il titolo, prima delle entry esistenti', () => {
    const out = prependHandoff('# Session Handoff\n\n## 2026-10-18 — vecchia\n', 'R-230', '2026-10-19', 'b.json');
    expect(out.indexOf('R-230 chiuso')).toBeLessThan(out.indexOf('vecchia'));
    expect(out).toContain('b.json');
  });
});
