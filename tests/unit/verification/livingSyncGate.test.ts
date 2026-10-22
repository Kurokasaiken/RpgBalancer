/**
 * PLAN-054 T-005 — Living Sync Gate: i 15 casi avversariali dell'
 * acceptance + i 5 flussi legittimi. Le fixture passano per l'estrattore
 * AST reale (`scanInvBlocks`) — mai blocchi finti a mano.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanInvBlocks, type InvBlock } from '../../../scripts/verification/invBlocks';
import {
  checkLivingSync,
  checkManifestBaseSha,
  emitChangedLines,
  emitStripped,
  enforceAmendCap,
  evaluateComponentSync,
  evaluateExecutedCount,
  readSyncSeal,
  type ComponentSyncInput,
} from '../../../scripts/verification/livingSyncGate';
import { evalE2eObligations, e2eCacheKey, lockfileVersions } from '../../../scripts/verification/e2eCache';
import { resolveExecutedCount, type InvCountEntry } from '../../../scripts/verification/invCounts';
import { isFullCoverageAtBase } from '../../../scripts/verification/contractSchema';
import type { ComponentContract } from '../../../scripts/verification/contractSchema';
import type { RedFirstRecord } from '../../../scripts/verification/redFirst';
import { applySyncBug } from '../../../scripts/verification/syncBug';

/* ------------------------------------------------------------------ */
/* Fixture                                                             */
/* ------------------------------------------------------------------ */

const file = (body: string, p = 'tests/unit/demo/c.test.ts') =>
  scanInvBlocks([{ path: p, text: `import { it, expect } from 'vitest';\n${body}` }]).blocks;

/* Il letterale tag non può comparire intatto in questo file —
 * lo scanner WT del gate leggerebbe le fixture come tag reali. */
const ITAG = '// ' + 'INV:';

const INV_BLOCK = (id: string, expects: string, title = `does ${id}`) =>
  `${ITAG}${id}\nit('${title}', () => {\n  ${expects}\n});`;

const COMP: ComponentContract = {
  id: 'demo-comp',
  kind: 'component',
  role: 'ui-component',
  tier: 1,
  root_file: 'src/demo/comp.ts',
  scope_files: ['src/demo/comp.ts'],
  fast_checks: ['tests/unit/demo/c.test.ts'],
  e2e_checks: [],
  e2e_trigger_globs: [],
  invariants: [
    { id: 'demo-comp.INV-1', source: 'plan', source_ref: 'PLAN-054', statement: 'x resta 1', test_refs: ['tests/unit/demo/c.test.ts'] },
  ],
};

const mkInput = (over: Partial<ComponentSyncInput>): ComponentSyncInput => ({
  component: COMP,
  changed: new Set(),
  invIds: ['demo-comp.INV-1'],
  newDirectorBugInvs: [],
  baseInv: new Map(),
  wtInv: new Map(),
  baseStatements: new Map([['demo-comp.INV-1', 'x resta 1']]),
  wtStatements: new Map([['demo-comp.INV-1', 'x resta 1']]),
  contractChanged: false,
  emitIdentical: true,
  touchedNonTs: false,
  closureFiles: new Set(),
  closureTouchedByInv: new Map(),
  snapshotChangedByInv: new Map(),
  records: [],
  sourceRefAtBase: () => true,
  fullCoverageAtBase: true,
  neutralClaimed: false,
  emitDiff: { added: [], removed: [] },
  testRefsPassed: null,
  ...over,
});

const mkRecord = (over: Partial<RedFirstRecord>): RedFirstRecord => ({
  kind: 'record',
  test_file: 'tests/unit/demo/c.test.ts',
  test_sha256: 'a'.repeat(64),
  red_log: '.mw/red-first/l.log',
  exit_code: 1,
  recorded_at: '2026-10-20T00:00:00Z',
  ...over,
});

/* ------------------------------------------------------------------ */
/* Caso 1 — manifest.base_sha ≠ sealed_base → FAIL                     */
/* ------------------------------------------------------------------ */

describe('Pass Globale — manifest.base_sha vs sealed_base', () => {
  it('SHA riscritto → FAIL', () => {
    const err = checkManifestBaseSha('deadbeef'.repeat(5), 'abc123'.repeat(6), 'm.json');
    expect(err).toContain('≠ sealed_base');
  });
  it('SHA identico → PASS', () => {
    const sha = 'a'.repeat(40);
    expect(checkManifestBaseSha(sha, sha)).toBeNull();
  });
  it('alias "HEAD" → PASS (sigillo corrente)', () => {
    expect(checkManifestBaseSha('HEAD', 'b'.repeat(40))).toBeNull();
  });
  it('manifest con base_sha ma nessun seal → fail closed', () => {
    expect(checkManifestBaseSha('x'.repeat(40), null)).toContain('trusted.lock');
  });
});

/* ------------------------------------------------------------------ */
/* Caso 2 — indebolimento di un'asserzione senza toccare scope_files   */
/* ------------------------------------------------------------------ */

describe('trigger set esteso: test file ospite nel diff', () => {
  it('expect indebolita in file test (scope intatto) → FAIL', () => {
    const base = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const wt = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBeDefined();'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
      }),
    );
    expect(v.triggered).toBe(true);
    expect(v.triggeredBy).toContain('tests/unit/demo/c.test.ts');
    expect(v.errors.join('\n')).toContain('Mode B-amend non autorizzato');
  });
});

/* ------------------------------------------------------------------ */
/* Casi 3/4/5 — Mode C bloccato senza coverage a BASE                  */
/* ------------------------------------------------------------------ */

describe('Mode C — isFullCoverage a BASE', () => {
  const modeCInput = (over: Partial<ComponentSyncInput>) =>
    mkInput({
      changed: new Set(['src/demo/comp.ts']),
      emitIdentical: false,
      emitDiff: { added: ['const y = x + 1;'], removed: ['const y = x;'] },
      neutralClaimed: true,
      testRefsPassed: true,
      fullCoverageAtBase: false,
      ...over,
    });

  it('coverage promossa dopo BASE → FAIL (3)', () => {
    const v = evaluateComponentSync(modeCInput({}));
    expect(v.modes).toContain('mode-c');
    expect(v.errors.join('\n')).toContain('isFullCoverage a BASE');
  });

  it('componente nuovo (assente a BASE) che dichiara Mode C → FAIL (4)', () => {
    const v = evaluateComponentSync(modeCInput({}));
    expect(v.errors.join('\n')).toContain('isFullCoverage a BASE');
  });

  it('director-spec senza source_ref risolvibile a BASE = code-baseline → Mode C bloccata (5)', () => {
    /* isFullCoverageAtBase reale: contratto a BASE con invariant
     * director-spec senza source_ref → non full → gate respinge C. */
    const root = mkdtempSync(path.join(tmpdir(), 'lsg-c5-'));
    mkdirSync(path.join(root, '.mw', 'contracts', 'components'), { recursive: true });
    mkdirSync(path.join(root, 'plans'), { recursive: true });
    mkdirSync(path.join(root, 'tests'), { recursive: true });
    writeFileSync(path.join(root, 'RICHIESTE.md'), '- R-1: init\n');
    writeFileSync(
      path.join(root, '.mw', 'contracts', 'components', 'demo.md'),
      `---\nid: demo\nkind: component\nrole: ui-component\ntier: 1\nroot_file: src/a.ts\nscope_files:\n  - src/a.ts\ninvariants:\n  - id: demo.INV-1\n    source: director-spec\n    statement: regola direttoriale senza ref\n    test_refs:\n      - tests/a.test.ts\n---\n`,
    );
    execSync('git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm base', { cwd: root });
    const base = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
    const fc = isFullCoverageAtBase(root, '.mw/contracts/components/demo.md', base);
    expect(fc.full).toBe(false);
    expect(fc.reasons.join('\n')).toMatch(/provenance|non-baseline/);
  });
});

/* ------------------------------------------------------------------ */
/* Caso 6 — indebolimenti richiedono red:retire                        */
/* ------------------------------------------------------------------ */

describe('Mode B-amend — autorizzazione richiesta', () => {
  const base = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1); expect(y).toBe(2);'))[0];

  it.each([
    ['asserzione indebolita', `expect(x).toBe(1); expect(y).toBeDefined();`],
    ['asserzione rimossa', `expect(x).toBe(1);`],
  ])('%s senza red:retire → FAIL', (_w, wtExpects) => {
    const wt = file(INV_BLOCK('demo-comp.INV-1', wtExpects))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
      }),
    );
    expect(v.errors.join('\n')).toContain('Mode B-amend non autorizzato');
    expect(v.modes).not.toContain('mode-b-amend');
  });

  it('dataset test.each mutato senza red:retire → FAIL', () => {
    const b = file(
      `${ITAG}demo-comp.INV-1\nit.each([1, 2])('n %i', (n) => {\n  expect(n).toBeGreaterThan(0);\n});`,
    )[0];
    const w = file(
      `${ITAG}demo-comp.INV-1\nit.each([1, 3])('n %i', (n) => {\n  expect(n).toBeGreaterThan(0);\n});`,
    )[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[b.id, b]]),
        wtInv: new Map([[w.id, w]]),
      }),
    );
    expect(v.errors.join('\n')).toContain('Mode B-amend non autorizzato');
  });

  it('helper di import-closure modificato senza red:retire → FAIL', () => {
    const wt = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const b = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/helpers/demoFix.ts']),
        baseInv: new Map([[b.id, b]]),
        wtInv: new Map([[wt.id, wt]]),
        closureFiles: new Set(['tests/helpers/demoFix.ts']),
        closureTouchedByInv: new Map([['demo-comp.INV-1', ['tests/helpers/demoFix.ts']]]),
      }),
    );
    expect(v.triggered).toBe(true);
    expect(v.errors.join('\n')).toContain('Mode B-amend non autorizzato');
    expect(v.errors.join('\n')).toContain('demoFix.ts');
  });

  it('stesso indebolimento CON red:retire + R-NNN a BASE → PASS (amend autorizzato)', () => {
    const wt = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const rec = mkRecord({ kind: 'retire', invariant: 'demo-comp.INV-1', reason: 'R-42: asserzione sostituita da check strutturale' });
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
        records: [rec],
        sourceRefAtBase: (r) => r === 'R-42',
      }),
    );
    expect(v.errors).toHaveLength(0);
    expect(v.modes).toContain('mode-b-amend');
    expect(v.amendedInvs).toEqual(['demo-comp.INV-1']);
  });
});

/* ------------------------------------------------------------------ */
/* Caso 7 — expect mantenuto ma irraggiungibile (executedCount)        */
/* ------------------------------------------------------------------ */

describe('executedCount — expect reso irraggiungibile', () => {
  const base = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1); expect(y).toBe(2);'))[0];
  const variants: [string, string][] = [
    ['if (false)', `if (false) { expect(x).toBe(1); expect(y).toBe(2); }`],
    ['early return', `return; expect(x).toBe(1); expect(y).toBe(2);`],
    ['callback mai invocata', `const f = () => { expect(x).toBe(1); expect(y).toBe(2); }; void f;`],
  ];

  it.each(variants)('irraggiungibile via %s — solo test nel diff → FAIL', (_w, wtBody) => {
    const wt = file(INV_BLOCK('demo-comp.INV-1', wtBody))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
      }),
    );
    /* Statico: il blocco è mutato → amend richiesto. Runtime: count<WBASE. */
    expect(v.errors.join('\n')).toMatch(/non autorizzato|non classificabile/);
    const ec = evaluateExecutedCount({ id: base.id, affected: true, isNew: false, baseCount: 2, wtCount: 0 });
    expect(ec.error).toContain('irraggiungibile');
  });

  it.each(variants)('irraggiungibile via %s — anche scope toccato → FAIL', (_w, wtBody) => {
    const wt = file(INV_BLOCK('demo-comp.INV-1', wtBody))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts', 'src/demo/comp.ts']),
        emitIdentical: false,
        emitDiff: { added: ['x++'], removed: [] },
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
      }),
    );
    expect(v.errors.join('\n')).toMatch(/non autorizzato|non classificabile/);
  });

  it('count(WT) ≥ count(BASE) → enforced, nessun errore', () => {
    const ec = evaluateExecutedCount({ id: 'x', affected: true, isNew: false, baseCount: 2, wtCount: 3 });
    expect(ec.status).toBe('enforced');
    expect(ec.error).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Casi 8/9 — red:retire con R-NNN assente a BASE → FAIL               */
/* ------------------------------------------------------------------ */

describe('red:retire — provenance R-NNN verificata a BASE', () => {
  const base = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1); expect(y).toBe(2);'))[0];
  const wt = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];

  it('R-NNN creato nello stesso diff (assente a BASE) → FAIL (8)', () => {
    const rec = mkRecord({ kind: 'retire', invariant: 'demo-comp.INV-1', reason: 'R-99: superato' });
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
        records: [rec],
        sourceRefAtBase: (r) => r !== 'R-99',
      }),
    );
    expect(v.errors.join('\n')).toContain('non esiste a BASE');
  });

  it('retire senza R-NNN nella reason → FAIL (9)', () => {
    const rec = mkRecord({ kind: 'retire', invariant: 'demo-comp.INV-1', reason: 'non serve più' });
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
        records: [rec],
      }),
    );
    expect(v.errors.join('\n')).toContain('retire senza R-NNN');
  });
});

/* ------------------------------------------------------------------ */
/* Caso 10 — cap amend/retire senza approvazione Director → FAIL       */
/* ------------------------------------------------------------------ */

describe('cap amend/retire per BASE..WT', () => {
  it('4 amend distinti > cap 3 senza approvazione → FAIL', () => {
    const err = enforceAmendCap(['a.1', 'a.2', 'b.1', 'c.1'], [], 3);
    expect(err).toContain('> cap 3');
    expect(err).toContain('approvazione Director');
  });
  it('4 amend con approvazione Director che li copre → PASS', () => {
    expect(enforceAmendCap(['a.1', 'a.2', 'b.1', 'c.1'], ['a.1', 'a.2', 'b.1', 'c.1'], 3)).toBeNull();
  });
  it('retire + amend sullo stesso INV contano una sola volta', () => {
    expect(enforceAmendCap(['a.1', 'a.1', 'b.1', 'c.1'], [], 3)).toBeNull();
  });
  it('approvazione parziale → FAIL sui non coperti', () => {
    const err = enforceAmendCap(['a.1', 'a.2', 'b.1', 'c.1'], ['a.1'], 3);
    expect(err).toContain('a.2');
  });
});

/* ------------------------------------------------------------------ */
/* Caso 11 — duplicati del tag INV → FAIL con entrambi i file          */
/* ------------------------------------------------------------------ */

describe('unicità globale dei tag', () => {
  it('stesso id in due file → duplicates nomina entrambi', () => {
    const scan = scanInvBlocks([
      { path: 'tests/a.test.ts', text: `import {it, expect} from 'vitest';\n${INV_BLOCK('dup.INV-1', 'expect(1).toBe(1);')}` },
      { path: 'tests/b.test.ts', text: `import {it, expect} from 'vitest';\n${INV_BLOCK('dup.INV-1', 'expect(2).toBe(2);')}` },
    ]);
    expect(scan.duplicates['dup.INV-1']).toEqual(['tests/a.test.ts', 'tests/b.test.ts']);
  });
  it('stesso id due volte nello stesso file → non duplicato (merge ammesso)', () => {
    const scan = scanInvBlocks([
      {
        path: 'tests/a.test.ts',
        text: `import {it, expect} from 'vitest';\n${INV_BLOCK('same.INV-1', 'expect(1).toBe(1);', 't1')}\n${INV_BLOCK('same.INV-1', 'expect(2).toBe(2);', 't2')}`,
      },
    ]);
    expect(scan.duplicates['same.INV-1']).toBeUndefined();
    expect(scan.blocks[0].assertions).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/* Caso 12 — edit del solo commento tag / file non-JS in Auto-Neutral  */
/* ------------------------------------------------------------------ */

describe('Auto-Neutral — confini', () => {
  it('rinominare l\'id del tag INV → rimozione senza retire → FAIL', () => {
    const base = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const wt = file(INV_BLOCK('demo-comp.INV-9', 'expect(x).toBe(1);'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        invIds: ['demo-comp.INV-1', 'demo-comp.INV-9'],
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
      }),
    );
    expect(v.errors.join('\n')).toContain('rimosso/rinominato');
  });

  it.each([['styles.css'], ['data.json']])('toccato %s in scope → Auto-Neutral impossibile → FAIL', (f) => {
    const comp = { ...COMP, scope_files: ['src/demo/comp.ts', `src/demo/${f}`] };
    const b = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const v = evaluateComponentSync(
      mkInput({
        component: comp,
        changed: new Set([`src/demo/${f}`]),
        touchedNonTs: true,
        emitIdentical: true,
        baseInv: new Map([[b.id, b]]),
        wtInv: new Map([[b.id, b]]),
      }),
    );
    expect(v.errors.join('\n')).toContain('Auto-Neutral impossibile');
  });
});

/* ------------------------------------------------------------------ */
/* Caso 13 — matrice obblighi E2E {skipped,failed,passed}×{dep ±}      */
/* ------------------------------------------------------------------ */

describe('E2E dependency closure — SKIPPED_CACHE non attesta', () => {
  const sealed = { 'tests/e2e/x.spec.ts': 'h1', 'tests/helpers/fx.ts': 'h2' };
  const cur = { 'tests/e2e/x.spec.ts': 'h1', 'tests/helpers/fx.ts': 'h9' }; // fx cambiato

  it.each([
    ['skipped_cache', 'dipendenza modificata', 'SKIPPED_CACHE'],
    ['failed', 'run fallita', 'dipendenza modificata'],
  ] as const)('dep-changed + %s → FAIL', (status, _r, frag) => {
    const { errors } = evalE2eObligations({
      checks: [{ id: 'chk-1', sealedDeps: sealed }],
      changedFiles: ['tests/helpers/fx.ts'],
      report: [{ check_id: 'chk-1', status, deps_hash: 'x' }],
      currentDepHash: () => cur,
    });
    expect(errors.join('\n')).toContain(frag === 'SKIPPED_CACHE' ? 'dipendenza modificata' : 'dipendenza modificata');
    expect(errors.join('\n')).not.toContain('satisfied');
  });

  it('dep-changed + passed su closure corrente → PASS', () => {
    const { verdicts, errors } = evalE2eObligations({
      checks: [{ id: 'chk-1', sealedDeps: sealed }],
      changedFiles: ['tests/helpers/fx.ts'],
      report: [{ check_id: 'chk-1', status: 'passed' }],
      currentDepHash: () => cur,
    });
    expect(errors).toHaveLength(0);
    expect(verdicts[0].satisfied).toBe(true);
  });

  it('dep-unchanged + skipped_cache → PASS (cache legit)', () => {
    const { verdicts, errors } = evalE2eObligations({
      checks: [{ id: 'chk-1', sealedDeps: sealed }],
      changedFiles: ['README.md'],
      report: [{ check_id: 'chk-1', status: 'skipped_cache' }],
      currentDepHash: () => ({ ...sealed }),
    });
    expect(errors).toHaveLength(0);
    expect(verdicts[0].satisfied).toBe(true);
  });

  it('dep-unchanged + failed → FAIL', () => {
    const { errors } = evalE2eObligations({
      checks: [{ id: 'chk-1', sealedDeps: sealed }],
      changedFiles: [],
      report: [{ check_id: 'chk-1', status: 'failed' }],
      currentDepHash: () => ({ ...sealed }),
    });
    expect(errors.join('\n')).toContain('dipendenze invariate');
  });

  it('closure non enumerabile → fail closed', () => {
    const { errors } = evalE2eObligations({
      checks: [{ id: 'chk-1', sealedDeps: {} }],
      changedFiles: [],
      report: [],
      currentDepHash: () => null,
    });
    expect(errors.join('\n')).toContain('fail closed');
  });
});

/* ------------------------------------------------------------------ */
/* Caso 14 — expect.poll/toPass: conteggio del tentativo finale        */
/* ------------------------------------------------------------------ */

describe('executedCount — poll/toPass non cumulano', () => {
  it('blocco con expect.poll → floor statico, non il cumulato del runner', () => {
    const pollBlock = file(
      `${ITAG}demo-comp.INV-1\nit('polls', async () => {\n  await expect.poll(() => tick, { timeout: 1000 }).toBe(5);\n});`,
    )[0];
    expect(pollBlock.usesPoll).toBe(true);
    /* Il runner riporterebbe N tentativi interni (es. 17): il gate usa
     * il floor statico = asserzioni dirette (1). */
    const entries: InvCountEntry[] = [{ file: 'tests/unit/demo/c.test.ts', title: 'polls', assertionCalls: 17, status: 'passed' }];
    expect(resolveExecutedCount(pollBlock, entries)).toBe(1);
  });

  it('poll dentro test.each → conteggio per istanza tabellare', () => {
    const b = file(
      `${ITAG}demo-comp.INV-1\nit.each([[1],[2]])('row %i', async ([n]) => {\n  await expect.poll(() => n).toBe(n);\n  expect(n).toBeGreaterThan(0);\n});`,
    )[0];
    expect(b.usesPoll).toBe(true);
    /* floor statico = 2 asserzioni dirette (poll + expect) per riga */
    expect(resolveExecutedCount(b, [])).toBe(2);
  });

  it('count runtime cumulativo per poll → FAIL al confronto con floor', () => {
    /* Se il gate prendesse il cumulato (17) un baseline di 1 passerebbe
     * falsamente "≥"; il floor statico lo impedisce. */
    const ec = evaluateExecutedCount({ id: 'x', affected: true, isNew: false, baseCount: 1, wtCount: 17 });
    expect(ec.error).toBeUndefined(); // wt≥base passa a runtime normale…
    /* …ma per un blocco poll il count usato è il floor → 1 vs 1. */
    const pollBlock = file(`${ITAG}x\nit('p', async () => { await expect.poll(() => t).toBe(1); });`)[0];
    expect(resolveExecutedCount(pollBlock, [{ file: 'tests/unit/demo/c.test.ts', title: 'p', assertionCalls: 17, status: 'passed' }])).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* Caso 15 — baseline unknown: cattura una tantum o fail closed        */
/* ------------------------------------------------------------------ */

describe('baseline unknown — cattura una tantum', () => {
  it('baseline non catturabile → fail closed', () => {
    const ec = evaluateExecutedCount({ id: 'x', affected: true, isNew: false, baseCount: 'unknown', wtCount: 2, capture: () => null });
    expect(ec.error).toContain('fail closed');
    expect(ec.captured).toBe(false);
  });
  it('cattura a BASE + WT sotto baseline → FAIL', () => {
    const ec = evaluateExecutedCount({ id: 'x', affected: true, isNew: false, baseCount: 'unknown', wtCount: 1, capture: () => 2 });
    expect(ec.captured).toBe(true);
    expect(ec.error).toContain('regredito 1 < 2');
  });
  it('cattura a BASE + WT ≥ baseline → PASS', () => {
    const ec = evaluateExecutedCount({ id: 'x', affected: true, isNew: false, baseCount: 'unknown', wtCount: 2, capture: () => 2 });
    expect(ec.error).toBeUndefined();
    expect(ec.captured).toBe(true);
    expect(ec.status).toBe('enforced');
  });
  it('INV non affetto con baseline unknown → not_applicable_unknown_baseline', () => {
    const ec = evaluateExecutedCount({ id: 'x', affected: false, isNew: false, baseCount: 'unknown', wtCount: null });
    expect(ec.status).toBe('not_applicable_unknown_baseline');
    expect(ec.error).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Caso 16 — i 5 flussi legittimi devono passare                       */
/* ------------------------------------------------------------------ */

describe('flussi legittimi', () => {
  it('Auto-Neutral: emit strip identico, zero test/contratto toccati → PASS', () => {
    const b = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['src/demo/comp.ts']),
        emitIdentical: true,
        baseInv: new Map([[b.id, b]]),
        wtInv: new Map([[b.id, b]]),
      }),
    );
    expect(v.errors).toHaveLength(0);
    expect(v.modes).toContain('auto-neutral');
  });

  it('Mode A: record red-first + INV director-bug + source_ref a BASE → PASS', () => {
    const existing = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const wt = file(INV_BLOCK('demo-comp.INV-2', 'expect(bug()).toBe(false);', 'regression'))[0];
    const rec = mkRecord({ component: 'demo-comp', invariant: 'demo-comp.INV-2', source_ref: 'R-7', exit_code: 1 });
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['src/demo/comp.ts', 'tests/unit/demo/c.test.ts']),
        invIds: ['demo-comp.INV-1', 'demo-comp.INV-2'],
        newDirectorBugInvs: ['demo-comp.INV-2'],
        emitIdentical: false,
        emitDiff: { added: ['fix'], removed: [] },
        baseInv: new Map([[existing.id, existing]]),
        wtInv: new Map([[existing.id, existing], [wt.id, wt]]),
        records: [rec],
        sourceRefAtBase: (r) => r === 'R-7',
      }),
    );
    expect(v.errors).toHaveLength(0);
    expect(v.modes).toContain('mode-a');
    expect(v.modes).toContain('mode-b-add');
  });

  it('Mode B-add: nuovo INV estraibile → PASS', () => {
    const existing = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const added = file(INV_BLOCK('demo-comp.INV-2', 'expect(z).toBe(3);', 'new invariant'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        invIds: ['demo-comp.INV-1', 'demo-comp.INV-2'],
        baseInv: new Map([[existing.id, existing]]),
        wtInv: new Map([[existing.id, existing], [added.id, added]]),
      }),
    );
    expect(v.errors).toHaveLength(0);
    expect(v.modes).toContain('mode-b-add');
  });

  it('Mode B-amend valido: red:retire + R-NNN a BASE → PASS', () => {
    const base = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1); expect(y).toBe(2);'))[0];
    const wt = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['tests/unit/demo/c.test.ts']),
        baseInv: new Map([[base.id, base]]),
        wtInv: new Map([[wt.id, wt]]),
        records: [mkRecord({ kind: 'retire', invariant: 'demo-comp.INV-1', reason: 'R-5: sostituita da INV-3' })],
        sourceRefAtBase: (r) => r === 'R-5',
      }),
    );
    expect(v.errors).toHaveLength(0);
    expect(v.modes).toContain('mode-b-amend');
  });

  it('Mode C: emit diverso, coverage piena a BASE, claim, test verdi → PASS', () => {
    const b = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['src/demo/comp.ts']),
        emitIdentical: false,
        emitDiff: { added: ['const y = f(x) + 1;'], removed: ['const y = f(x);'] },
        baseInv: new Map([[b.id, b]]),
        wtInv: new Map([[b.id, b]]),
        fullCoverageAtBase: true,
        neutralClaimed: true,
        testRefsPassed: true,
      }),
    );
    expect(v.errors).toHaveLength(0);
    expect(v.modes).toContain('mode-c');
  });

  it('Mode C con token ad alto rischio nel diff emit → FAIL', () => {
    const b = file(INV_BLOCK('demo-comp.INV-1', 'expect(x).toBe(1);'))[0];
    const v = evaluateComponentSync(
      mkInput({
        changed: new Set(['src/demo/comp.ts']),
        emitIdentical: false,
        emitDiff: { added: ['const t = el.getAttribute("data-testid")'], removed: [] },
        baseInv: new Map([[b.id, b]]),
        wtInv: new Map([[b.id, b]]),
        fullCoverageAtBase: true,
        neutralClaimed: true,
        testRefsPassed: true,
      }),
    );
    expect(v.errors.join('\n')).toContain('token ad alto rischio');
  });
});

/* ------------------------------------------------------------------ */
/* Integrazione reale: checkLivingSync su repo temporaneo               */
/* ------------------------------------------------------------------ */

describe('checkLivingSync — repo end-to-end', () => {
  const mkRepo = () => {
    const root = mkdtempSync(path.join(tmpdir(), 'lsg-repo-'));
    mkdirSync(path.join(root, '.mw', 'contracts', 'components'), { recursive: true });
    mkdirSync(path.join(root, 'tests', 'unit'), { recursive: true });
    mkdirSync(path.join(root, 'src', 'demo'), { recursive: true });
    execSync('git init -q', { cwd: root });
    execSync('git config user.email t@t && git config user.name t', { cwd: root });
    return root;
  };
  const CONTRACT = `---
id: demo-comp
kind: component
role: ui-component
tier: 1
root_file: src/demo/comp.ts
scope_files:
  - src/demo/comp.ts
fast_checks:
  - tests/unit/demo/c.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: demo-comp.INV-1
    source: plan
    source_ref: PLAN-1
    statement: x resta 1
    test_refs:
      - tests/unit/demo/c.test.ts
---
# demo
`;
  const TEST = `import { it, expect } from 'vitest';\n${ITAG}demo-comp.INV-1\nit('keeps 1', () => {\n  expect(1).toBe(1);\n});\n`;

  it('diff di soli test che indebolisce un INV → FAIL end-to-end', { timeout: 30000 }, () => {
    const root = mkRepo();
    writeFileSync(path.join(root, '.mw', 'contracts', 'components', 'demo-comp.md'), CONTRACT);
    mkdirSync(path.join(root, 'tests', 'unit', 'demo'), { recursive: true });
    mkdirSync(path.join(root, 'plans'), { recursive: true });
    writeFileSync(path.join(root, 'tests', 'unit', 'demo', 'c.test.ts'), TEST);
    writeFileSync(path.join(root, 'src', 'demo', 'comp.ts'), 'export const x = 1;\n');
    writeFileSync(path.join(root, 'RICHIESTE.md'), '- R-1: init\n');
    writeFileSync(path.join(root, 'plans', 'PLAN-1-x.md'), '# plan\n');
    execSync('git add -A && git commit -qm base', { cwd: root });
    const sha = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
    writeFileSync(path.join(root, '.mw', 'trusted.lock.json'), JSON.stringify({ version: 1, sealed_at: 'x', sealed_by: 't', entries: {}, sealed_base_sha: sha, executed_counts: { 'demo-comp.INV-1': 1 } }));

    /* Indebolisco l'asserzione nel solo file di test. */
    writeFileSync(
      path.join(root, 'tests', 'unit', 'demo', 'c.test.ts'),
      TEST.replace('expect(1).toBe(1)', 'expect(1).toBeDefined()'),
    );

    const rep = checkLivingSync(root, { baseline: sha });
    expect(rep.errors.join('\n')).toContain('Mode B-amend non autorizzato');
  });

  it('manifest.base_sha ≠ sealed → FAIL end-to-end', { timeout: 30000 }, () => {
    const root = mkRepo();
    writeFileSync(path.join(root, '.mw', 'contracts', 'components', 'demo-comp.md'), CONTRACT);
    execSync('git add -A && git commit -qm base', { cwd: root });
    const sha = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
    writeFileSync(path.join(root, '.mw', 'trusted.lock.json'), JSON.stringify({ version: 1, sealed_at: 'x', sealed_by: 't', entries: {}, sealed_base_sha: sha }));
    const rep = checkLivingSync(root, { baseline: sha, manifests: [{ file: 'verification.json', base_sha: 'f'.repeat(40) }] });
    expect(rep.errors.join('\n')).toContain('sealed_base');
    expect(readSyncSeal(root).sealed_base_sha).toBe(sha);
  });
});

/* ------------------------------------------------------------------ */
/* Utility: emitStripped / emitChangedLines / e2eCacheKey / syncBug    */
/* ------------------------------------------------------------------ */

describe('emit JS (Auto-Neutral)', () => {
  it('ri-formatto/commenti → emit identico', () => {
    const a = 'export const x: number = 1; // commento\n';
    const b = 'export  const  x:number=1;\n';
    expect(emitStripped(a, false)).toBe(emitStripped(b, false));
  });
  it('cambio di logica → emit diverso + linee nette', () => {
    const d = emitChangedLines(emitStripped('export const x = 1;', false), emitStripped('export const x = 2;', false));
    expect(d.added.length).toBeGreaterThan(0);
    expect(d.removed.length).toBeGreaterThan(0);
  });
});

describe('e2e cache key', () => {
  it('versioni dal testo del lockfile', () => {
    const v = lockfileVersions(JSON.stringify({ packages: { 'node_modules/@playwright/test': { version: '1.56.1' }, 'node_modules/vitest': { version: '4.0.18' } } }));
    expect(v['@playwright/test']).toBe('1.56.1');
  });
  it('chiave sensibile a versioni e dep hash; null se dep non hashabile', () => {
    const k1 = e2eCacheKey({ checkId: 'c', depHashes: ['a', 'b'], versions: { playwright: '1.0' }, contractRev: 'r1', invRevs: {} });
    const k2 = e2eCacheKey({ checkId: 'c', depHashes: ['a', 'b'], versions: { playwright: '1.1' }, contractRev: 'r1', invRevs: {} });
    expect(k1).not.toBe(k2);
    expect(e2eCacheKey({ checkId: 'c', depHashes: ['a', null], versions: {}, contractRev: 'r1', invRevs: {} })).toBeNull();
  });
});

describe('sync:bug CLI', () => {
  it('crea INV director-bug + record sync-bug; source_ref irrisolvibile → errore', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'lsg-bug-'));
    mkdirSync(path.join(root, '.mw', 'contracts', 'components'), { recursive: true });
    mkdirSync(path.join(root, '.mw'), { recursive: true });
    writeFileSync(path.join(root, 'RICHIESTE.md'), '- R-9: bug del bottone\n');
    writeFileSync(
      path.join(root, '.mw', 'contracts', 'components', 'demo-comp.md'),
      `---\nid: demo-comp\nkind: component\nrole: ui-component\ntier: 1\nroot_file: src/demo/comp.ts\nscope_files:\n  - src/demo/comp.ts\ninvariants: []\n---\n# demo\n`,
    );
    const r = applySyncBug(root, { component: 'demo-comp', sourceRef: 'R-9', desc: 'il bottone non risponde', test: 'tests/unit/demo/c.test.ts' });
    expect(r.invId).toBe('demo-comp.INV-1');
    expect(r.created).toBe(true);
    const text = readFileSync(path.join(root, '.mw', 'contracts', 'components', 'demo-comp.md'), 'utf8');
    expect(text).toContain('director-bug');
    expect(text).toContain('R-9');
    const journal = readFileSync(path.join(root, '.mw', 'red-first.jsonl'), 'utf8');
    expect(journal).toContain('"kind":"sync-bug"');
    expect(journal).toContain('demo-comp.INV-1');
    expect(() => applySyncBug(root, { component: 'demo-comp', sourceRef: 'R-404', desc: 'x' })).toThrow('non risolvibile');
    expect(() => applySyncBug(root, { component: 'ghost', sourceRef: 'R-9', desc: 'x' })).toThrow();
  });
});
