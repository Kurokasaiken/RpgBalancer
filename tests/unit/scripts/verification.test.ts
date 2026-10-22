/**
 * PLAN-077 T-004 — verification receipts, final gate (anti-TOCTOU),
 * content-addressed blob archive. Permanent regression (R-247).
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appendRecord, initLedger, validateJournal } from '../../../scripts/ledger/ledgerCore';
import { deriveState, type LedgerState } from '../../../scripts/ledger/workItem';
import { openLedger } from '../../../scripts/ledger/dispatcher';
import {
  archiveSurface,
  classifyChecks,
  finalGateCheck,
  verifyArchive,
} from '../../../scripts/ledger/verification';
import { computeManifest } from '../../../scripts/ledger/surfaceManifest';

let dir: string; // ledger
let root: string; // fake worktree
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'mw-ver-'));
  root = mkdtempSync(path.join(tmpdir(), 'mw-root-'));
  initLedger(dir);
  mkdirSync(path.join(root, 'src'), { recursive: true });
  writeFileSync(path.join(root, 'src/foo.ts'), 'v1\n');
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });
});

function ev(t: string, p: unknown) {
  return appendRecord(t, p, dir);
}
function st(): LedgerState {
  const { records } = validateJournal(dir);
  return deriveState(records);
}
const journal = () => validateJournal(dir);

const CONF = { item_id: 'B', attempt_id: 'a1', feedback_hash: 'fh', session_id: 's', feedback_text: 'ok', at: 't' };

/** ingest a defect on src/foo.ts, run it, pass verification, confirm. */
function toConfirmed(): string {
  ev('item_ingested', {
    item_id: 'B', kind: 'defect', title: 'x',
    expected_files: ['src/foo.ts'], surfaces: [],
    requires_director_confirmation: true,
  });
  ev('item_ready', { item_id: 'B' });
  ev('attempt_started', { item_id: 'B', attempt_id: 'a1', attempt_token: 't1' });
  const m = computeManifest(
    { kind: 'defect', surface_id: 'B', expected_files: ['src/foo.ts'], globs: [] },
    root, journal(),
  );
  ev('attempt_finished', { item_id: 'B', attempt_id: 'a1', attempt_token: 't1', surface_manifest_hash: m.manifest_hash });
  ev('verification_receipt', { item_id: 'B', attempt_id: 'a1', classification: 'pass' });
  ev('confirmation', { ...CONF, revision_hash: m.manifest_hash });
  return m.manifest_hash!;
}

describe('classifyChecks', { timeout: 30000 }, () => {
  it('not_run/unreliable → infra verification_unreliable (never counts as pass)', () => {
    expect(classifyChecks([{ id: 'c', kind: 'build', result: 'not_run' }]).blocked_reason).toBe('verification_unreliable');
    expect(classifyChecks([{ id: 'c', kind: 'visual', result: 'unreliable' }]).classification).toBe('infra');
  });
  it('infra-scoped or environment failure → infra env_invalid, never defect', () => {
    expect(classifyChecks([{ id: 'c', kind: 'build', result: 'fail', scope: 'infra' }])).toMatchObject({ classification: 'infra', blocked_reason: 'env_invalid' });
    expect(classifyChecks([{ id: 'c', kind: 'environment', result: 'fail' }]).classification).toBe('infra');
  });
  it('target failure → defect_persisted; all pass → pass', () => {
    expect(classifyChecks([{ id: 'c', kind: 'targeted_regression', result: 'fail' }]).classification).toBe('defect_persisted');
    expect(classifyChecks([{ id: 'c', kind: 'targeted_regression', result: 'pass' }, { id: 'b', kind: 'build', result: 'pass' }]).classification).toBe('pass');
  });
});

describe('vocab guard in dispatcher', { timeout: 30000 }, () => {
  it('receipt with unknown classification never enters the journal', () => {
    ev('item_ingested', { item_id: 'B', kind: 'defect', expected_files: ['src/foo.ts'], surfaces: [] });
    ev('item_ready', { item_id: 'B' });
    ev('attempt_started', { item_id: 'B', attempt_id: 'a1', attempt_token: 't1' });
    ev('attempt_finished', { item_id: 'B', attempt_id: 'a1', attempt_token: 't1', surface_manifest_hash: 'x' });
    const L = openLedger(dir);
    const r = L.apply('verification_receipt', { item_id: 'B', attempt_id: 'a1', classification: 'looks_good' });
    expect(r.applied).toBe(false);
    expect(journal().records.filter((x) => x.type === 'verification_receipt')).toHaveLength(0);
  });
});

describe('blob archive', { timeout: 30000 }, () => {
  it('stores present files by sha256 + manifest.json; verify passes', () => {
    const m = computeManifest({ kind: 'defect', surface_id: 'B', expected_files: ['src/foo.ts', 'src/missing.ts'], globs: [] }, root, journal());
    expect(m.manifest_hash).toBeTruthy();
    const { archive_dir } = archiveSurface(dir, root, m.entries);
    const blob = path.join(archive_dir, m.entries.find((e) => e.path === 'src/foo.ts')!.sha256!);
    expect(readFileSync(blob, 'utf8')).toBe('v1\n');
    const v = verifyArchive(dir, m.manifest_hash!, m.entries);
    expect(v).toMatchObject({ exists: true, ok: true });
  });
  it('detects a corrupt blob and a missing archive', () => {
    const m = computeManifest({ kind: 'defect', surface_id: 'B', expected_files: ['src/foo.ts'], globs: [] }, root, journal());
    const { archive_dir } = archiveSurface(dir, root, m.entries);
    writeFileSync(path.join(archive_dir, m.entries[0]!.sha256!), 'tampered');
    expect(verifyArchive(dir, m.manifest_hash!, m.entries).ok).toBe(false);
    expect(verifyArchive(dir, 'f'.repeat(64), m.entries).exists).toBe(false);
  });
});

describe('final gate (anti-TOCTOU)', { timeout: 30000 }, () => {
  it('passes when archived revision = confirmed revision = disk state', () => {
    const hash = toConfirmed();
    const m = computeManifest({ kind: 'defect', surface_id: 'B', expected_files: ['src/foo.ts'], globs: [] }, root, journal());
    archiveSurface(dir, root, m.entries);
    const r = finalGateCheck(st().items.get('B')!, { rootDir: root, ledgerDir: dir, journal: journal() });
    expect(r).toMatchObject({ ok: true, failures: [] });
    expect(hash).toBe(m.manifest_hash);
  });
  it('surface drift after confirmation blocks the gate', () => {
    toConfirmed();
    writeFileSync(path.join(root, 'src/foo.ts'), 'v2 — changed after Director looked\n');
    const m = computeManifest({ kind: 'defect', surface_id: 'B', expected_files: ['src/foo.ts'], globs: [] }, root, journal());
    archiveSurface(dir, root, m.entries); // archiving the drifted revision must not help
    const r = finalGateCheck(st().items.get('B')!, { rootDir: root, ledgerDir: dir, journal: journal() });
    expect(r.ok).toBe(false);
    expect(r.failures).toContain('surface_drifted');
  });
  it('missing archive blocks; wrong status blocks', () => {
    toConfirmed();
    const r = finalGateCheck(st().items.get('B')!, { rootDir: root, ledgerDir: dir, journal: journal() });
    expect(r.failures).toContain('archive_missing');
    ev('item_ingested', { item_id: 'C', kind: 'defect', expected_files: ['src/foo.ts'], surfaces: [] });
    const r2 = finalGateCheck(st().items.get('C')!, { rootDir: root, ledgerDir: dir, journal: journal() });
    expect(r2.failures).toEqual(expect.arrayContaining(['not_director_confirmed', 'no_active_confirmation']));
  });
});
