/** Unit tests for intentGate — PLAN-045 T-005b (P5). */
import { describe, expect, it } from 'vitest';
import { itemState, checkIntentGate } from '../../../scripts/verification/intentGate';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

describe('itemState — tabella totale default-deny', () => {
  const cases: Array<[Record<string, unknown>, string]> = [
    [{ verdict: 'covered' }, 'satisfies'],
    [{ verdict: 'waived' }, 'satisfies'],
    [{ verdict: 'waived-infra' }, 'satisfies'],
    [{ verdict: 'skipped-trivial' }, 'satisfies'],
    [{ verdict: 'not-applicable' }, 'satisfies'],
    [{ verdict: 'gap' }, 'blocks'],
    [{ verdict: 'unverifiable' }, 'blocks'],
    [{ verdict: 'class-dispute' }, 'blocks'],
    [{ verdict: 'unconfirmed' }, 'blocks'],
    [{ verdict: 'cap-exhausted' }, 'blocks'],
    [{ verdict: 'integrity-cap-exhausted' }, 'blocks'],
    [{ verdict: 'global-ceiling-exhausted' }, 'blocks'],
    [{ verdict: 'ambiguous' }, 'blocks'],
    [{ verdict: 'illegitimate' }, 'blocks'],
    [{ verdict: 'contested' }, 'blocks'],
    [{ verdict: 'quorum-short' }, 'non-terminal'],
    [{ verdict: 'awaiting_director' }, 'non-terminal'],
    [{ verdict: 'pending' }, 'non-terminal'],
    [{ verdict: 'open' }, 'non-terminal'],
    [{ verdict: 'open', plan_waived: true }, 'non-terminal'],
    [{ verdict: 'stato-inventato' }, 'blocks'], // default-deny
  ];
  it.each(cases)('%j → %s', (rec, want) => {
    expect(itemState(rec as never)).toBe(want);
  });

  it('human-eye richiede signoff; not-applicable riattivato blocca', () => {
    expect(itemState({ verdict: 'human-eye' } as never)).toBe('non-terminal');
    expect(itemState({ verdict: 'human-eye' } as never, { hasValidSignoff: true })).toBe('satisfies');
    expect(itemState({ verdict: 'not-applicable' } as never, { reactivated: true })).toBe('blocks');
  });
});

// ------------------------------------------------------------------ gate

function makeGitRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'intentgate-'));
  execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: dir });
  writeFileSync(path.join(dir, 'RICHIESTE.md'), '# R\n');
  mkdirSync(path.join(dir, '.mw'), { recursive: true });
  writeFileSync(
    path.join(dir, '.mw', 'surface-map.json'),
    JSON.stringify({ schema_version: 1, anti_glob: { max_files_per_entry: 999 },
      surfaces: [{ id: 'bv-gate', globs: ['scripts/**'], expected_checks: [] }] }),
  );
  execSync('git add -A && git commit -qm init', { cwd: dir });
  return dir;
}

function seedRun(dir: string, items: Record<string, unknown>, opts: { mutateLedger?: boolean } = {}): string {
  const runDir = path.join(dir, '.mw', 'runs', 't');
  mkdirSync(runDir, { recursive: true });
  const ledger = [
    '# intent ledger — task t run t',
    '## epoch-1 seed',
    'plan_hash_semantico: ph',
    'manifest_plan:',
    '  - a.ts | full | OB-1',
    ...Object.keys(items).map((i) => `- ${i} | intent-check | s | abcdef01`),
    '',
  ].join('\n');
  writeFileSync(path.join(runDir, 'intent.md'), ledger);
  const ledgerSha = require('node:crypto').createHash('sha256').update(ledger).digest('hex');
  writeFileSync(path.join(runDir, 'intent.json'), JSON.stringify({
    task_id: 't', run_id: 't', epoch: 1,
    ledger_sha256: opts.mutateLedger ? 'deadbeef' : ledgerSha,
    manifest_closure: [['a.ts', 'full', 'OB-1']],
    items,
  }));
  return runDir;
}

describe('checkIntentGate', () => {
  it('intent.json assente → preflight rosso', () => {
    const dir = makeGitRepo();
    const runDir = path.join(dir, '.mw', 'runs', 'empty');
    mkdirSync(runDir, { recursive: true });
    const r = checkIntentGate(runDir, dir, { changedFiles: [] });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('intent.json assente');
  });

  it('tutto covered → PASS', () => {
    const dir = makeGitRepo();
    const runDir = seedRun(dir, { 'v33.item-1': { verdict: 'covered' } });
    const r = checkIntentGate(runDir, dir, { changedFiles: [] });
    expect(r.ok).toBe(true);
    expect(r.status).toBe('PASS');
  });

  it('gap → BLOCKED, ledger mutato → rosso integrità', () => {
    const dir = makeGitRepo();
    const runDir = seedRun(dir, { 'v33.item-1': { verdict: 'gap' } }, { mutateLedger: true });
    const r = checkIntentGate(runDir, dir, { changedFiles: [] });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toContain('ledger_sha256');
    expect(r.errors.join(' ')).toContain('BLOCKED');
  });

  it('pending → NOT_CLOSABLE', () => {
    const dir = makeGitRepo();
    const runDir = seedRun(dir, { 'v33.item-1': { verdict: 'covered' }, 'v33.item-2': { verdict: 'pending' } });
    const r = checkIntentGate(runDir, dir, { changedFiles: [] });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('NOT_CLOSABLE');
  });

  it('waived → status WAIVED ammesso', () => {
    const dir = makeGitRepo();
    const runDir = seedRun(dir, { 'v33.item-1': { verdict: 'waived' } });
    const r = checkIntentGate(runDir, dir, { changedFiles: [] });
    expect(r.status).toBe('WAIVED');
    expect(r.ok).toBe(true);
  });

  it('required seed non ⊆ manifest_closure → rosso', () => {
    const dir = makeGitRepo();
    const runDir = seedRun(dir, { 'v33.item-1': { verdict: 'covered' } });
    const intent = JSON.parse(
      require('node:fs').readFileSync(path.join(runDir, 'intent.json'), 'utf8'));
    intent.manifest_closure = []; // svuotato
    writeFileSync(path.join(runDir, 'intent.json'), JSON.stringify(intent));
    const r = checkIntentGate(runDir, dir, { changedFiles: [] });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toContain('manifest_closure');
  });
});
