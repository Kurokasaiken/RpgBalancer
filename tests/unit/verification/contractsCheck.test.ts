import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkContractsGate,
  exceptionRecordHash,
  type CoverageException,
} from '../../../scripts/verification/contractsCheck';
import { canonicalFileHash } from '../../../scripts/verification/gateCore';
import {
  approvedKeys,
  checkAntiGlob,
  diffSurfaceMaps,
  functionalKey,
  globMatch,
  parseSurfaceMap,
  type SurfaceMap,
} from '../../../scripts/verification/surfaceMap';

const SMALL_MAP: SurfaceMap = {
  schema_version: 1,
  anti_glob: { max_files_per_entry: 5, forbid_root_glob: true },
  surfaces: [
    {
      id: 'game',
      globs: ['src/game/**'],
      expected_checks: ['CTR-1'],
    },
    {
      id: 'docs',
      globs: ['*.md'],
      expected_checks: [],
      anti_glob_confirmed: true,
    },
  ],
};

describe('globMatch', () => {
  it('matcha ** su profondità arbitraria', () => {
    expect(globMatch('src/game/**', 'src/game/a/b/c.ts')).toBe(true);
    expect(globMatch('src/game/**', 'src/other/c.ts')).toBe(false);
  });
  it('matcha * dentro un segmento', () => {
    expect(globMatch('src/pages/game-*.tsx', 'src/pages/game-frame.tsx')).toBe(true);
    expect(globMatch('src/pages/game-*.tsx', 'src/pages/sub/game-frame.tsx')).toBe(false);
  });
  it('fallback basename per glob senza slash', () => {
    expect(globMatch('*.md', 'README.md')).toBe(true);
    expect(globMatch('*.md', 'deep/nested/doc.md')).toBe(true);
    expect(globMatch('*.md', 'a.txt')).toBe(false);
  });
});

describe('functionalKey / diffSurfaceMaps', () => {
  it('ignora i campi audit nel confronto', () => {
    const a = { id: 'x', globs: ['a/**'], expected_checks: [] };
    const b = { ...a, proposed_by: 'me', approved_at: 'now' };
    expect(functionalKey(a)).toBe(functionalKey(b));
  });
  it('rivela added/changed/removed', () => {
    const base = parseSurfaceMap(
      JSON.stringify({ ...SMALL_MAP, surfaces: [SMALL_MAP.surfaces[0]] }),
    );
    const diff = diffSurfaceMaps(base, SMALL_MAP);
    expect(diff.added.map((s) => s.id)).toEqual(['docs']);
    expect(diff.changed).toEqual([]);
    const diff2 = diffSurfaceMaps(SMALL_MAP, { ...SMALL_MAP, surfaces: [SMALL_MAP.surfaces[1]] });
    expect(diff2.removedIds).toEqual(['game']);
  });
});

describe('checkAntiGlob', () => {
  it('flagga entry >K file senza conferma', () => {
    const files = Array.from({ length: 7 }, (_, i) => `src/game/f${i}.ts`);
    const issues = checkAntiGlob(SMALL_MAP, files);
    expect(issues.some((i) => i.surface_id === 'game')).toBe(true);
    expect(issues.some((i) => i.surface_id === 'docs')).toBe(false); // confirmed
  });
  it('flagga glob root-level senza conferma', () => {
    const map: SurfaceMap = {
      ...SMALL_MAP,
      surfaces: [{ id: 'r', globs: ['*.ts'], expected_checks: [] }],
    };
    const issues = checkAntiGlob(map, ['a.ts']);
    expect(issues.some((i) => i.reason.includes('directory root'))).toBe(true);
  });
});

describe('checkContractsGate (git temp repo)', { timeout: 30000 }, () => {
  function makeRepo(): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'cc-gate-'));
    const g = (a: string) => execSync(`git ${a}`, { cwd: dir });
    g('init -q');
    g('config user.email t@t');
    g('config user.name t');
    writeFileSync(path.join(dir, 'README.md'), '# x');
    g('add -A');
    g('commit -qm init');
    return dir;
  }
  const put = (root: string, rel: string, content: string) => {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  };

  it('file non mappato senza disposition → errore', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/game/a.ts', 'x');
    const rep = checkContractsGate(root);
    // surface-map.json stesso non è mappato → rosso anche lui
    expect(rep.unmapped).toContain('.mw/surface-map.json');
    expect(rep.errors.some((e) => e.includes('src/game/a.ts') || e.includes('surface-map'))).toBe(true);
  });

  it('file mappato a superficie + mappa approvata → verde', () => {
    const root = makeRepo();
    const map: SurfaceMap = {
      ...SMALL_MAP,
      surfaces: [
        ...SMALL_MAP.surfaces,
        { id: 'gate', globs: ['.mw/surface-map.json'], expected_checks: [] },
      ],
    };
    put(root, '.mw/surface-map.json', JSON.stringify(map));
    // proposal + approval del batch
    const diff = diffSurfaceMaps(null, map);
    const propDir = path.join(root, '.mw/mapping-proposals');
    mkdirSync(propDir, { recursive: true });
    const propFile = path.join(propDir, 'p1.json');
    writeFileSync(
      propFile,
      JSON.stringify({ created_at: 'x', created_by: 't', entries: [...diff.added, ...diff.changed], removed_ids: [] }),
    );
    const fileSha = createHash('sha256').update(readFileSync(propFile)).digest('hex');
    appendFileSync(
      path.join(root, '.mw/mapping-approvals.jsonl'),
      JSON.stringify({ batch_sha256: fileSha, approved_at: 'x', approved_by: 'director' }) + '\n',
    );
    put(root, 'src/game/a.ts', 'x');
    const rep = checkContractsGate(root);
    expect(rep.errors).toEqual([]);
    expect(rep.mapped.map((m) => m.file)).toContain('src/game/a.ts');
    expect(rep.required_checks).toContain('CTR-1');
  });

  it('coverage_exception copre file non mappato', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    appendFileSync(
      path.join(root, '.mw/coverage-exceptions.jsonl'),
      JSON.stringify({ glob: 'src/game/**', reason: 'verificato a mano', created_at: 'x' }) + '\n' +
        JSON.stringify({ glob: '.mw/surface-map.json', reason: 'seed map', created_at: 'x' }) + '\n',
    );
    put(root, 'src/game/a.ts', 'x');
    const rep = checkContractsGate(root);
    expect(rep.unmapped).toEqual([]);
    expect(rep.dispositioned.length).toBeGreaterThan(0);
  });

  it('mappa modificata senza batch approvato → errore', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('senza batch approvato') || e.includes('surface-map'))).toBe(true);
  });

  it('entry modificata dopo approvazione → non attiva', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    const propDir = path.join(root, '.mw/mapping-proposals');
    mkdirSync(propDir, { recursive: true });
    const propFile = path.join(propDir, 'p1.json');
    writeFileSync(
      propFile,
      JSON.stringify({ created_at: 'x', created_by: 't', entries: SMALL_MAP.surfaces, removed_ids: [] }),
    );
    const fileSha = createHash('sha256').update(readFileSync(propFile)).digest('hex');
    appendFileSync(
      path.join(root, '.mw/mapping-approvals.jsonl'),
      JSON.stringify({ batch_sha256: fileSha, approved_at: 'x', approved_by: 'director' }) + '\n',
    );
    // modifica post-approvazione: cambia i glob della superficie 'game'
    const tampered: SurfaceMap = {
      ...SMALL_MAP,
      surfaces: [{ ...SMALL_MAP.surfaces[0], globs: ['src/game/**', 'src/other/**'] }, SMALL_MAP.surfaces[1]],
    };
    put(root, '.mw/surface-map.json', JSON.stringify(tampered));
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('"game"'))).toBe(true);
  });
});

describe('approvedKeys', () => {
  it('indicizza entry e removed per chiave funzionale', () => {
    const keys = approvedKeys({
      created_at: 'x',
      created_by: 't',
      entries: SMALL_MAP.surfaces,
      removed_ids: ['old'],
    });
    expect(keys.entries.has(functionalKey(SMALL_MAP.surfaces[0]))).toBe(true);
    expect(keys.removed.has('old')).toBe(true);
  });
});

describe('awaiting_director / director_answer (T-003, git temp repo)', { timeout: 30000 }, () => {
  function makeRepo(): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'cc-aw-'));
    const g = (a: string) => execSync(`git ${a}`, { cwd: dir });
    g('init -q');
    g('config user.email t@t');
    g('config user.name t');
    writeFileSync(path.join(dir, 'README.md'), '# x');
    g('add -A');
    g('commit -qm init');
    return dir;
  }
  const put = (root: string, rel: string, content: string) => {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  };
  const writeExceptions = (root: string, recs: CoverageException[]) =>
    appendFileSync(
      path.join(root, '.mw/coverage-exceptions.jsonl'),
      recs.map((r) => JSON.stringify(r)).join('\n') + '\n',
    );
  const appendAnswers = (root: string, recs: object[]) =>
    appendFileSync(
      path.join(root, '.mw/director-answers.jsonl'),
      recs.map((r) => JSON.stringify(r)).join('\n') + '\n',
    );
  const answerFor = (root: string, exc: CoverageException, files: string[]) => ({
    kind: 'coverage_exception',
    exception_id: exc.id,
    exception_record_sha256: exceptionRecordHash(exc),
    covered: files.map((f) => ({
      file: f,
      sha256_canonical: canonicalFileHash(path.join(root, f)),
    })),
    answer: 'ok',
    answered_at: 'x',
    answered_by: 'director',
    source: 'test',
  });
  const EXC: CoverageException = {
    id: 'EXC-T1',
    glob: 'src/unmapped/**',
    reason: 'comportamento da verificare',
    scope: 'file',
    unverified_behavior: true,
    created_at: 'x',
  };

  it('exception unverified_behavior senza answer → awaiting_director', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/unmapped/x.ts', 'export const x = 1;');
    writeExceptions(root, [EXC]);
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('awaiting_director') && e.includes('src/unmapped/x.ts'))).toBe(true);
  });

  it('exception legacy senza id → non comportamentale → coperta', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/unmapped/x.ts', 'export const x = 1;');
    writeExceptions(root, [{ glob: 'src/unmapped/**', reason: 'docs', created_at: 'x' } as CoverageException]);
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('awaiting_director'))).toBe(false);
    expect(rep.dispositioned.some((d) => d.file === 'src/unmapped/x.ts')).toBe(true);
  });

  it('answer legato a record + canonical hash → coperto', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/unmapped/x.ts', 'export const x = 1;');
    writeExceptions(root, [EXC]);
    appendAnswers(root, [answerFor(root, EXC, ['src/unmapped/x.ts'])]);
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('src/unmapped/x.ts'))).toBe(false);
    expect(rep.dispositioned.some((d) => d.file === 'src/unmapped/x.ts' && d.via.includes('director_answer'))).toBe(true);
  });

  it('modifica sostanziale del file coperto post-answer → ri-approvazione', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/unmapped/x.ts', 'export const x = 1;');
    writeExceptions(root, [EXC]);
    appendAnswers(root, [answerFor(root, EXC, ['src/unmapped/x.ts'])]);
    put(root, 'src/unmapped/x.ts', 'export const x = 2; // cambiato');
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('post-approvazione'))).toBe(true);
  });

  it('tweak benigno (whitespace/EOL) non invalida la risposta', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/unmapped/x.ts', 'export const x = 1;');
    writeExceptions(root, [EXC]);
    appendAnswers(root, [answerFor(root, EXC, ['src/unmapped/x.ts'])]);
    put(root, 'src/unmapped/x.ts', 'export const x = 1;   \n\n\n\n');
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('src/unmapped/x.ts'))).toBe(false);
  });

  it('scope drift: nuovo file matcha il glob dopo la risposta → errore', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/unmapped/x.ts', 'export const x = 1;');
    writeExceptions(root, [EXC]);
    appendAnswers(root, [answerFor(root, EXC, ['src/unmapped/x.ts'])]);
    put(root, 'src/unmapped/y.ts', 'export const y = 1;');
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('scope drift') && e.includes('y.ts'))).toBe(true);
  });

  it('record eccezione modificato dopo la risposta → ri-approvazione', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(SMALL_MAP));
    put(root, 'src/unmapped/x.ts', 'export const x = 1;');
    writeExceptions(root, [EXC]);
    appendAnswers(root, [answerFor(root, EXC, ['src/unmapped/x.ts'])]);
    // riscrive il journal con reason diversa → record hash cambia
    const p = path.join(root, '.mw/coverage-exceptions.jsonl');
    writeFileSync(p, JSON.stringify({ ...EXC, reason: 'altra ragione' }) + '\n');
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('modificato dopo il director_answer'))).toBe(true);
  });
});

describe('gate-file diffs (T-003, git temp repo)', { timeout: 30000 }, () => {
  function makeRepo(): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'cc-gd-'));
    const g = (a: string) => execSync(`git ${a}`, { cwd: dir });
    g('init -q');
    g('config user.email t@t');
    g('config user.name t');
    writeFileSync(path.join(dir, 'README.md'), '# x');
    g('add -A');
    g('commit -qm init');
    return dir;
  }
  const put = (root: string, rel: string, content: string) => {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  };
  const MAP_WITH_GATE: SurfaceMap = {
    ...SMALL_MAP,
    surfaces: [...SMALL_MAP.surfaces, { id: 'gate', globs: ['scripts/**'], expected_checks: [] }],
  };

  it('gate-file dirty senza gate a HEAD → bootstrap: serve director_answer', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(MAP_WITH_GATE));
    put(root, 'scripts/verification/contractsCheck.ts', '// v2');
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('gate-file') && e.includes('director_answer'))).toBe(true);
    expect(rep.gate_files?.some((g) => g.file === 'scripts/verification/contractsCheck.ts' && g.via === 'unanswered')).toBe(true);
  });

  it('gate-file con director_answer gate-diff → coperto', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(MAP_WITH_GATE));
    put(root, 'scripts/verification/contractsCheck.ts', '// v2');
    appendFileSync(
      path.join(root, '.mw/director-answers.jsonl'),
      JSON.stringify({
        kind: 'gate-diff',
        gate_files: [{ file: 'scripts/verification/contractsCheck.ts', sha256_canonical: canonicalFileHash(path.join(root, 'scripts/verification/contractsCheck.ts')) }],
        answer: 'approvo',
        answered_at: 'x',
        answered_by: 'director',
        source: 'test',
      }) + '\n',
    );
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('gate-file'))).toBe(false);
    expect(rep.gate_files?.[0].via).toBe('director_answer');
  });

  it('gate-file modificato dopo la risposta → ri-approvazione', () => {
    const root = makeRepo();
    put(root, '.mw/surface-map.json', JSON.stringify(MAP_WITH_GATE));
    put(root, 'scripts/verification/contractsCheck.ts', '// v2');
    appendFileSync(
      path.join(root, '.mw/director-answers.jsonl'),
      JSON.stringify({
        kind: 'gate-diff',
        gate_files: [{ file: 'scripts/verification/contractsCheck.ts', sha256_canonical: canonicalFileHash(path.join(root, 'scripts/verification/contractsCheck.ts')) }],
        answer: 'approvo',
        answered_at: 'x',
        answered_by: 'director',
        source: 'test',
      }) + '\n',
    );
    put(root, 'scripts/verification/contractsCheck.ts', '// v3 — modificato dopo');
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('modificato dopo il director_answer'))).toBe(true);
  });

  it('gate a HEAD esiste → la diff gate è valutata dal gate committato (delegation)', () => {
    const root = makeRepo();
    // committata a HEAD una versione stub del gate che marca un errore sentinella
    put(
      root,
      'scripts/verification/contractsCheck.ts',
      "export function checkContractsGate() { return { changed_files: [], exempt_files: [], mapped: [], dispositioned: [], unmapped: [], required_checks: [], errors: ['committed-gate-marker'] }; }\n",
    );
    execSync('git add -A && git commit -qm stub-gate', { cwd: root });
    // working-tree: il gate è "manomesso" (restituirebbe un marker diverso)
    put(
      root,
      'scripts/verification/contractsCheck.ts',
      "export function checkContractsGate() { return { changed_files: [], exempt_files: [], mapped: [], dispositioned: [], unmapped: [], required_checks: [], errors: ['working-tree-marker'] }; }\n",
    );
    const rep = checkContractsGate(root);
    expect(rep.evaluated_by).toBe('head-gate');
    expect(rep.errors).toContain('committed-gate-marker');
    expect(rep.errors).not.toContain('working-tree-marker');
  });

  it('gate a HEAD non eseguibile → fallback bootstrap director_answer', () => {
    const root = makeRepo();
    put(root, 'scripts/verification/contractsCheck.ts', 'throw new Error("boom");\n');
    execSync('git add -A && git commit -qm broken-gate', { cwd: root });
    put(root, '.mw/surface-map.json', JSON.stringify(MAP_WITH_GATE));
    put(root, 'scripts/verification/contractsCheck.ts', '// v2');
    const rep = checkContractsGate(root);
    expect(rep.errors.some((e) => e.includes('gate-file') && e.includes('director_answer'))).toBe(true);
  });
});
