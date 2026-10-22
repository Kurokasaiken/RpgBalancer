/**
 * PLAN-054 T-002 — test del sotto-gate living contracts:
 * schema Zod/frontmatter, adozione legacy idempotente, estrattore AST
 * `// INV:<id>` e ratchet asserzioni/strutturale su BASE.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  adoptLegacyCtr,
  fingerprintContract,
  integrationContractSchema,
  inverseCtrIndex,
  legacySource,
  parseContractFile,
  parseLegacyCtr,
  structuralRatchet,
  type IntegrationContract,
} from '../../../scripts/verification/contractSchema';
import {
  assertionRatchet,
  invTagPositions,
  literalFold,
  scanInvBlocks,
  snapshotKeyDiff,
  type InvBlock,
} from '../../../scripts/verification/invBlocks';
import ts from 'typescript';

const mkRepo = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'lc-'));
  mkdirSync(path.join(root, '.mw', 'contracts'), { recursive: true });
  mkdirSync(path.join(root, 'tests'), { recursive: true });
  return root;
};

const git = (root: string, args: string) =>
  execSync(`git ${args}`, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const initRepo = (root: string) => {
  git(root, 'init -q');
  git(root, 'config user.email t@t');
  git(root, 'config user.name t');
};

/* ------------------------------------------------------------------ */
/* Schema Zod / frontmatter                                            */
/* ------------------------------------------------------------------ */

const COMPONENT_FM = `---
id: pixi-world-map
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
scope_files:
  - src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
  - src/ui/idleVillage/pixiSpike/mapFitRuntime.ts
invariants:
  - id: CTR-game-005.INV-1
    source: plan
    source_ref: PLAN-054
    statement: la proiezione land non interseca il chrome fisso
    test_refs:
      - tests/e2e/idleVillage/gameGeometryT01.spec.ts
---
# Corpo markdown
`;

const CTR_FM = `---
id: CTR-game-005
kind: integration
components:
  - game-frame-pixi
  - pixi-world-map
external_dependencies:
  - src/balancing/config/idleVillage/gameFrameConfig.ts
invariants: []
---
# CTR body
`;

describe('parseContractFile (schema Zod)', () => {
  it('parsa un contratto componente valido', () => {
    const p = parseContractFile('pixi-world-map.md', COMPONENT_FM);
    expect(p.errors).toEqual([]);
    expect(p.contract?.kind).toBe('component');
    if (p.contract?.kind === 'component') {
      expect(p.contract.data.scope_files).toHaveLength(2);
      expect(p.contract.data.invariants[0].id).toBe('CTR-game-005.INV-1');
    }
  });
  it('parsa un CTR valido con external_dependencies', () => {
    const p = parseContractFile('CTR-game-005.md', CTR_FM);
    expect(p.errors).toEqual([]);
    expect(p.contract?.kind).toBe('integration');
  });
  it('fallisce su frontmatter malformato', () => {
    const p = parseContractFile('x.md', '---\n{non: [yaml\n---\nbody');
    expect(p.errors.length).toBeGreaterThan(0);
  });
  it('fallisce su schema violato (tier 3, scope vuoto)', () => {
    const bad = COMPONENT_FM.replace('tier: 2', 'tier: 3');
    const p = parseContractFile('x.md', bad);
    expect(p.errors.join(' ')).toMatch(/schema non valido/);
  });
  it('legacy CTR senza frontmatter → formato legacy con warning, non errore', () => {
    const p = parseContractFile('CTR-game-001.md', '# CTR-game-001\n**status:** `candidate`');
    expect(p.format).toBe('legacy');
    expect(p.warnings.length).toBe(1);
    expect(p.errors).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Adozione legacy idempotente                                          */
/* ------------------------------------------------------------------ */

const LEGACY_CTR = `# CTR-game-009 — esempio

**status:** \`candidate\`
**components:** \`src/ui/a/A.tsx\`, \`src/ui/b/B.tsx\`, \`src/balancing/config/cfg.ts\`
**source:** \`RICHIESTE.md\` R-225

**invariant:**
1. La prima riga dell'invariant continua
   su una seconda riga non numerata.
2. Secondo invariant semplice.

**checks:** nessuno
`;

describe('adozione legacy (CTR-001..004 schema)', () => {
  const resolve = (f: string) => (f === 'src/ui/a/A.tsx' ? 'comp-a' : f === 'src/ui/b/B.tsx' ? 'comp-b' : null);

  it('unisce le righe di continuazione negli invariant numerati', () => {
    const legacy = parseLegacyCtr('CTR-game-009.md', LEGACY_CTR);
    expect(legacy.invariantTexts).toHaveLength(2);
    expect(legacy.invariantTexts[0]).toContain('seconda riga');
  });
  it('mappa source R-NNN → director-bug', () => {
    expect(legacySource('`RICHIESTE.md` R-225')).toEqual({ source: 'director-bug', source_ref: 'R-225' });
    expect(legacySource('PLAN-012')).toEqual({ source: 'plan', source_ref: 'PLAN-012' });
  });
  it('file fuori STRICT_FILES → external_dependencies, non errore', () => {
    const { content, errors } = adoptLegacyCtr('CTR-game-009.md', LEGACY_CTR, resolve);
    expect(errors).toEqual([]);
    const parsed = integrationContractSchema.parse(
      (parseContractFile('CTR-game-009.md', content).contract as { data: IntegrationContract }).data,
    );
    expect(parsed.components.sort()).toEqual(['comp-a', 'comp-b']);
    expect(parsed.external_dependencies).toEqual(['src/balancing/config/cfg.ts']);
  });
  it('idempotente: adozione di un file già adottato produce gli stessi byte', () => {
    const once = adoptLegacyCtr('CTR-game-009.md', LEGACY_CTR, resolve).content;
    const twice = adoptLegacyCtr('CTR-game-009.md', once, resolve).content;
    expect(twice).toBe(once);
  });
  it('indice inverso: component → CTR derivato', () => {
    const ctr: IntegrationContract = {
      id: 'CTR-game-005',
      kind: 'integration',
      components: ['a', 'b'],
      external_dependencies: [],
      fast_checks: [],
      e2e_checks: [],
      e2e_trigger_globs: [],
      invariants: [],
    };
    expect(inverseCtrIndex([ctr])).toEqual({ a: ['CTR-game-005'], b: ['CTR-game-005'] });
  });
});

/* ------------------------------------------------------------------ */
/* literalFold + estrattore INV                                         */
/* ------------------------------------------------------------------ */

const expr = (src: string) => {
  const sf = ts.createSourceFile('t.ts', `const x = ${src};`, ts.ScriptTarget.Latest, true);
  let out: ts.Expression | null = null;
  const visit = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && n.initializer) out = n.initializer;
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out!;
};

describe('literalFold', () => {
  it('folda letterali e aritmetica su foldable', () => {
    expect(literalFold(expr('2 + 3 * 4'))).toEqual({ ok: true, value: 14 });
    expect(literalFold(expr('`a${1 + 1}b`'))).toEqual({ ok: true, value: 'a2b' });
    expect(literalFold(expr('[1, { k: true }]'))).toEqual({ ok: true, value: [1, { k: true }] });
  });
  it('non folda identificatori o chiamate (fail-closed)', () => {
    expect(literalFold(expr('CFG.w')).ok).toBe(false);
    expect(literalFold(expr('mk()')).ok).toBe(false);
    expect(literalFold(expr('[x]')).ok).toBe(false);
  });
});

/* Fixture tags are composed, never literal: this file is itself scanned by the
 * extractor, so a source-level `// INV:` comment would be read as a real tag. */
const tag = (id: string) => '// INV' + `:${id}\n`;

const TEST_FILE = `import { describe, it, expect, beforeEach } from 'vitest';
describe('outer', () => {
  beforeEach(() => { setup(); });
  describe('inner', () => {
    beforeEach(() => { inner(); });
    ${tag('CTR-game-001.INV-1')}    it('fa qualcosa', () => {
      const x = compute();
      expect(x).toBe(1);
      expect(x).not.toBeNull();
    });
    it('non taggato', () => { expect(1).toBe(1); });
  });
});
describe('other', () => {
  ${tag('CTR-game-001.INV-2')}  it.each([[1, 2], [2 + 1, 4]])('ds %i', (a, b) => {
    expect(a + b).toBe(3);
  });
});
describe('skipped', () => {
  ${tag('CTR-game-001.INV-3')}  it.skip('skipped', () => { expect(1).toBe(1); });
});
describe('helper-only', () => {
  ${tag('CTR-game-001.INV-4')}  it('usa solo helper', () => { assertViaHelper(); });
});
`;

describe('scanInvBlocks', () => {
  const scan = (text: string) => scanInvBlocks([{ path: 't.spec.ts', text }]);

  it('estrae blocco con tag + hooks del describe più interno', () => {
    const { blocks } = scan(TEST_FILE);
    const b = blocks.find((x) => x.id === 'CTR-game-001.INV-1')!;
    expect(b.extractable).toBe(true);
    expect(b.describePath).toEqual(["'outer'", "'inner'"]);
    expect(b.assertions.length).toBe(2);
    expect(b.assertions).toContain('expect(x)|toBe(1)');
    expect(b.assertions).toContain('expect(x)|not.toBeNull()');
  });
  it('dataset test.each foldato per valore → datasetHash', () => {
    const { blocks } = scan(TEST_FILE);
    const b = blocks.find((x) => x.id === 'CTR-game-001.INV-2')!;
    expect(b.datasetHash).toBeTruthy();
  });
  it('dataset non foldable → extractable false (fail-closed)', () => {
    const text = tag('X') + `it.each(DATA)('x', () => { expect(1).toBe(1); });`;
    const { blocks } = scan(text);
    expect(blocks[0].extractable).toBe(false);
    expect(blocks[0].notExtractableReason).toMatch(/literal-foldable/);
  });
  it('test senza expect diretto → extractable false', () => {
    const { blocks } = scan(TEST_FILE);
    const b = blocks.find((x) => x.id === 'CTR-game-001.INV-4')!;
    expect(b.extractable).toBe(false);
    expect(b.notExtractableReason).toMatch(/expect/);
  });
  it('test skipped flaggato', () => {
    const { blocks } = scan(TEST_FILE);
    expect(blocks.find((x) => x.id === 'CTR-game-001.INV-3')!.skipped).toBe(true);
  });
  it('stesso id su due test dello stesso file → merge asserzioni', () => {
    const text = tag('M') + `it('a', () => { expect(1).toBe(1); });\n` + tag('M') + `it('b', () => { expect(2).toBe(2); });`;
    const { blocks } = scan(text);
    expect(blocks.filter((b) => b.id === 'M')).toHaveLength(1);
    expect(blocks[0].assertions).toHaveLength(2);
  });
  it('stesso id in due file → duplicates con entrambi i path', () => {
    const r = scanInvBlocks([
      { path: 'a.spec.ts', text: tag('D') + `it('x', () => { expect(1).toBe(1); });` },
      { path: 'b.spec.ts', text: tag('D') + `it('y', () => { expect(1).toBe(1); });` },
    ]);
    expect(r.duplicates['D']).toEqual(['a.spec.ts', 'b.spec.ts']);
  });
  it('invTagPositions ignora prosa senza marker //', () => {
    expect(invTagPositions('/* tag INV:X nel testo */')).toEqual([]);
    expect(invTagPositions(tag('X') + 'it()')).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* Ratchet asserzioni + strutturale                                     */
/* ------------------------------------------------------------------ */

const blk = (id: string, assertions: string[], over: Partial<InvBlock> = {}): InvBlock => ({
  id,
  file: 't.spec.ts',
  describePath: [],
  blockHash: 'h-' + id,
  assertions: assertions.sort(),
  datasetHash: null,
  extractable: true,
  usesSnapshot: false,
  skipped: false,
  ...over,
});

describe('assertionRatchet (BASE ⊆ WT)', () => {
  it('asserzione rimossa → errore', () => {
    const r = assertionRatchet([blk('A', ['expect(x)|toBe(1)', 'expect(y)|toBe(2)'])], [blk('A', ['expect(x)|toBe(1)'])]);
    expect(r.errors.join(' ')).toMatch(/asserzione BASE rimossa/);
  });
  it('asserzione aggiunta → ok (B-add nel test, non nel contratto)', () => {
    const r = assertionRatchet([blk('A', ['expect(x)|toBe(1)'])], [blk('A', ['expect(x)|toBe(1)', 'expect(z)|toBe(3)'])]);
    expect(r.errors).toEqual([]);
  });
  it('INV rimosso → errore con red:retire hint', () => {
    const r = assertionRatchet([blk('A', ['e(1)'])], []);
    expect(r.errors.join(' ')).toMatch(/red:retire/);
  });
  it('dataset mutato → errore', () => {
    const r = assertionRatchet(
      [blk('A', ['e(1)'], { datasetHash: 'old' })],
      [blk('A', ['e(1)'], { datasetHash: 'new' })],
    );
    expect(r.errors.join(' ')).toMatch(/dataset test\.each modificato/);
  });
  it('INV nuovo → esente (added), non errore', () => {
    const r = assertionRatchet([], [blk('B', ['e(1)'])]);
    expect(r.errors).toEqual([]);
    expect(r.added).toEqual(['B']);
  });
  it('non estraibile a WT → errore fail-closed', () => {
    const r = assertionRatchet(
      [blk('A', ['e(1)'])],
      [blk('A', [], { extractable: false, notExtractableReason: 'helper non estraibile' })],
    );
    expect(r.errors.join(' ')).toMatch(/non estraibile/);
  });
});

describe('structuralRatchet su BASE (git)', () => {
  it('rimozione membro dal contratto a BASE → errore', { timeout: 30000 }, () => {
    const root = mkRepo();
    initRepo(root);
    const ctr = `---
id: CTR-game-005
kind: integration
components: [a, b, c]
external_dependencies: []
invariants:
  - { id: CTR-game-005.INV-1, source: plan, statement: s1 }
---
# body`;
    writeFileSync(path.join(root, '.mw/contracts/CTR-game-005.md'), ctr);
    git(root, 'add -A && git commit -qm init');
    /* WT: rimuove 'c' e muta lo statement. */
    writeFileSync(
      path.join(root, '.mw/contracts/CTR-game-005.md'),
      ctr.replace('components: [a, b, c]', 'components: [a, b]').replace('statement: s1', 'statement: s2'),
    );
    const { errors } = structuralRatchet(root, 'HEAD', () => null);
    expect(errors.join('\n')).toMatch(/membro rimosso.*c/);
    expect(errors.join('\n')).toMatch(/statement di CTR-game-005\.INV-1 mutato/);
  });
  it('legacy→adottato è ratchet-neutrale', { timeout: 30000 }, () => {
    const root = mkRepo();
    initRepo(root);
    const resolve = (f: string) => ({ 'src/ui/a/A.tsx': 'comp-a', 'src/ui/b/B.tsx': 'comp-b' })[f] ?? null;
    writeFileSync(path.join(root, '.mw/contracts/CTR-game-009.md'), LEGACY_CTR);
    git(root, 'add -A && git commit -qm init');
    const adopted = adoptLegacyCtr('CTR-game-009.md', readFileSync(path.join(root, '.mw/contracts/CTR-game-009.md'), 'utf8'), resolve).content;
    writeFileSync(path.join(root, '.mw/contracts/CTR-game-009.md'), adopted);
    const { errors } = structuralRatchet(root, 'HEAD', resolve);
    expect(errors).toEqual([]);
  });
});

describe('snapshotKeyDiff', () => {
  it('rileva chiave rimossa/modificata keyed sul proprietario', () => {
    const base = 'exports[`a 1`] = `x`;\nexports[`b 1`] = `y`;\n';
    const wt = 'exports[`a 1`] = `x`;\nexports[`b 1`] = `CHANGED`;\n';
    expect(snapshotKeyDiff(base, wt).removedOrChanged).toEqual(['b 1']);
  });
});

describe('fingerprintContract', () => {
  it('statement whitespace-normalizzato', () => {
    const p = parseContractFile('x.md', COMPONENT_FM).contract!;
    const fp = fingerprintContract(p);
    expect(fp.statements['CTR-game-005.INV-1']).not.toMatch(/\n/);
  });
});
