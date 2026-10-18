import { execSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalFileHash, sha256File } from '../../../scripts/verification/gateCore';
import {
  RED_FIRST_REL,
  checkRedFirstGate,
  latestForFile,
  loadRedFirst,
  type RedFirstRecord,
} from '../../../scripts/verification/redFirst';

const put = (root: string, rel: string, content: string) => {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
};

const appendRec = (root: string, rec: RedFirstRecord) =>
  appendFileSync(path.join(root, RED_FIRST_REL), `${JSON.stringify(rec)}\n`);

/** Scrive file test + log rossa coerenti e appende il record. */
const seedRecord = (root: string, testRel = 'tests/x.spec.ts'): RedFirstRecord => {
  put(root, testRel, "it('repro', () => { expect(true).toBe(false); });");
  put(root, '.mw/red-first/x.log', 'FAIL  expected true to be false');
  const rec: RedFirstRecord = {
    kind: 'record',
    test_file: testRel,
    test_sha256: canonicalFileHash(path.join(root, testRel))!,
    red_log: '.mw/red-first/x.log',
    red_log_sha256: sha256File(path.join(root, '.mw/red-first/x.log'))!,
    command: 'vitest run tests/x.spec.ts',
    exit_code: 1,
    recorded_at: 'x',
  };
  appendRec(root, rec);
  return rec;
};

describe('checkRedFirstGate', { timeout: 30000 }, () => {
  const repo = () => mkdtempSync(path.join(tmpdir(), 'rf-gate-'));

  it('record valido + manifest lo richiede → verde', () => {
    const root = repo();
    seedRecord(root);
    const rep = checkRedFirstGate(root, { required: ['tests/x.spec.ts'] });
    expect(rep.errors).toEqual([]);
    expect(rep.checked).toContain('tests/x.spec.ts');
  });

  it('manifest richiede un test senza record → rosso', () => {
    const root = repo();
    const rep = checkRedFirstGate(root, { required: ['tests/never.spec.ts'] });
    expect(rep.errors.some((e) => e.includes('nessun record'))).toBe(true);
  });

  it('file test mutato dopo il record → rosso (hash diverso)', () => {
    const root = repo();
    seedRecord(root);
    put(root, 'tests/x.spec.ts', "it('repro', () => { expect(true).toBe(true); }); // mutato");
    const rep = checkRedFirstGate(root, { required: ['tests/x.spec.ts'] });
    expect(rep.errors.some((e) => e.includes('hash file test diverso'))).toBe(true);
  });

  it('tweak solo whitespace/EOL nel file test → il canonical hash regge', () => {
    const root = repo();
    seedRecord(root);
    put(root, 'tests/x.spec.ts', "it('repro', () => { expect(true).toBe(false); });\n\n");
    const rep = checkRedFirstGate(root, { required: ['tests/x.spec.ts'] });
    expect(rep.errors).toEqual([]);
  });

  it('log run rossa manomesso → rosso', () => {
    const root = repo();
    seedRecord(root);
    put(root, '.mw/red-first/x.log', 'PASS  tutto verde (manomesso)');
    const rep = checkRedFirstGate(root, { required: ['tests/x.spec.ts'] });
    expect(rep.errors.some((e) => e.includes('manomesso'))).toBe(true);
  });

  it('run registrata con exit_code 0 → rosso (non è una riproduzione)', () => {
    const root = repo();
    const rec = seedRecord(root);
    void rec;
    // sovrascrivo il journal con un record exit 0
    put(root, RED_FIRST_REL, '');
    appendRec(root, { ...rec, exit_code: 0 });
    const rep = checkRedFirstGate(root, { required: ['tests/x.spec.ts'] });
    expect(rep.errors.some((e) => e.includes('exit_code'))).toBe(true);
  });

  it('retire chiude il record: non-required ok, required → rosso', () => {
    const root = repo();
    seedRecord(root);
    appendRec(root, {
      kind: 'retire',
      test_file: 'tests/x.spec.ts',
      reason: 'presupposti non più validi',
      recorded_at: 'y',
    });
    expect(checkRedFirstGate(root).errors).toEqual([]);
    const rep = checkRedFirstGate(root, { required: ['tests/x.spec.ts'] });
    expect(rep.errors.some((e) => e.includes('scartato'))).toBe(true);
  });

  it('journal ∩ diff: record attivo su file nella diff mutato → rosso anche senza manifest', () => {
    const root = repo();
    seedRecord(root);
    put(root, 'tests/x.spec.ts', 'mutated');
    const rep = checkRedFirstGate(root, { changedFiles: ['tests/x.spec.ts', 'src/other.ts'] });
    expect(rep.errors.some((e) => e.includes('hash file test diverso'))).toBe(true);
  });

  it('journal ∩ diff: file non nella diff → dormiente, verde', () => {
    const root = repo();
    seedRecord(root);
    put(root, 'tests/x.spec.ts', 'mutated');
    const rep = checkRedFirstGate(root, { changedFiles: ['src/other.ts'] });
    expect(rep.errors).toEqual([]);
  });

  it('latestForFile: vince l’ultimo evento append-only', () => {
    const root = repo();
    seedRecord(root);
    appendRec(root, { kind: 'retire', test_file: 'tests/x.spec.ts', reason: 'r', recorded_at: 'z' });
    const recs = loadRedFirst(root);
    expect(recs).toHaveLength(2);
    expect(latestForFile(recs, 'tests/x.spec.ts')?.kind).toBe('retire');
  });

  it('il CLI record su repo git reale: run rossa → record, run verde → rifiuto', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'rf-cli-'));
    const g = (a: string) => execSync(`git ${a}`, { cwd: root });
    g('init -q');
    g('config user.email t@t');
    g('config user.name t');
    put(root, 'package.json', '{"type":"module"}');
    put(root, 'tests/red.spec.ts', "it('x', () => { throw new Error('boom') });");
    g('add -A');
    g('commit -qm init');
    const tsx = path.join(process.cwd(), 'node_modules/.bin/tsx');
    const cli = path.join(process.cwd(), 'scripts/redFirst.ts');
    // run rossa → record accettato
    execSync(`"${tsx}" "${cli}" record --test tests/red.spec.ts --command "exit 7"`, { cwd: root });
    const recs = loadRedFirst(root);
    expect(recs).toHaveLength(1);
    expect(recs[0].exit_code).toBe(7);
    // run verde → rifiuto
    let failed = false;
    try {
      execSync(`"${tsx}" "${cli}" record --test tests/red.spec.ts --command "exit 0"`, {
        cwd: root,
        stdio: 'pipe',
      });
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
    expect(loadRedFirst(root)).toHaveLength(1);
  });
});
