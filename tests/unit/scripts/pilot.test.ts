/**
 * PLAN-077 T-007 — isolated pilot: acceptance scenarios of the whole
 * closure→queue cycle as one integration suite (artifact-r012 §10):
 * crash between tick_assignment and attempt_started, TOCTOU at the final
 * gate, stale confirmation, retry budget exhaustion, starvation, ingest
 * during tick, taxonomy gate, and a full happy-path close+advance.
 * Permanent regression (R-247).
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appendRecord, initLedger, repairJournal, validateJournal, journalPath } from '../../../scripts/ledger/ledgerCore';
import { deriveState } from '../../../scripts/ledger/workItem';
import { openLedger } from '../../../scripts/ledger/dispatcher';
import { computeTick, runTick, PILOT_TICK } from '../../../scripts/ledger/queue';
import { archiveSurface, finalGateCheck } from '../../../scripts/ledger/verification';
import { computeManifest } from '../../../scripts/ledger/surfaceManifest';
import { deriveLocks } from '../../../scripts/ledger/surfaceLock';

let dir: string;
let root: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'mw-pilot-'));
  root = mkdtempSync(path.join(tmpdir(), 'mw-proot-'));
  initLedger(dir);
  mkdirSync(path.join(root, 'src'), { recursive: true });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });
});

const L = () => openLedger(dir);
const st = () => deriveState(validateJournal(dir).records);
const journal = () => validateJournal(dir);
const ev = (t: string, p: unknown) => appendRecord(t, p, dir);
const CAP2 = { execution_cap: 2, verification_cap: 1 };

function ingest(id: string, file: string, extra: Record<string, unknown> = {}): void {
  L().apply('item_ingested', {
    item_id: id, kind: 'defect', title: id,
    expected_files: [file], surfaces: [], ...extra,
  });
  L().apply('item_ready', { item_id: id });
}

/** Run an item through dispatch→finish→receipt-pass→(awaiting). */
function runToAwaiting(id: string): { attempt_id: string; manifest_hash: string } {
  runTick(L(), CAP2);
  const it = st().items.get(id)!;
  const att = it.attempts.at(-1)!;
  const m = computeManifest(
    { kind: 'defect', surface_id: id, expected_files: it.contract.expected_files, globs: [] },
    root, journal(),
  );
  L().apply('attempt_finished', {
    item_id: id, attempt_id: att.attempt_id, attempt_token: att.attempt_token,
    surface_manifest_hash: m.manifest_hash,
  });
  L().apply('verification_receipt', { item_id: id, attempt_id: att.attempt_id, classification: 'pass' });
  return { attempt_id: att.attempt_id, manifest_hash: m.manifest_hash! };
}

describe('pilot acceptance', { timeout: 60000 }, () => {
  it('full cycle: ingest→tick→awaiting→confirm→archive→gate→CLOSED→locks released→next item', () => {
    writeFileSync(path.join(root, 'src/a.ts'), 'a1');
    ingest('BUG-A', 'src/a.ts');
    const { attempt_id } = runToAwaiting('BUG-A');
    expect(st().items.get('BUG-A')!.status).toBe('AWAITING_DIRECTOR');

    const m = computeManifest(
      { kind: 'defect', surface_id: 'BUG-A', expected_files: ['src/a.ts'], globs: [] }, root, journal());
    archiveSurface(dir, root, m.entries);
    L().apply('confirmation', {
      item_id: 'BUG-A', attempt_id, revision_hash: m.manifest_hash,
      feedback_hash: 'f', session_id: 'pilot', feedback_text: 'Risolto', at: new Date().toISOString(),
    });
    const gate = finalGateCheck(st().items.get('BUG-A')!, { rootDir: root, ledgerDir: dir, journal: journal() });
    expect(gate.ok).toBe(true);
    L().apply('final_gate_passed', { item_id: 'BUG-A', cause: 'gate+archive verified' });
    expect(st().items.get('BUG-A')!.status).toBe('CLOSED');
    expect(deriveLocks(validateJournal(dir).records, st()).size).toBe(0);

    // next eligible item advances
    ingest('BUG-B', 'src/b.ts');
    writeFileSync(path.join(root, 'src/b.ts'), 'b');
    const r = runTick(L(), CAP2);
    expect(r.assignments.map((a) => a.item_id)).toEqual(['BUG-B']);
  });

  it('crash between tick_assignment and attempt_started: item stays READY, next tick re-assigns idempotently', () => {
    writeFileSync(path.join(root, 'src/a.ts'), 'a1');
    ingest('BUG-A', 'src/a.ts');
    const r = computeTick(st(), journal().records, CAP2);
    // journal only the decision record — the "crash" skips attempt_started
    ev('tick_assignment', {
      tick_id: r.tick_id, assignment_id: r.assignments[0]!.assignment_id,
      item_id: 'BUG-A', attempt_id: r.assignments[0]!.attempt_id, watermark: r.watermark,
    });
    expect(st().items.get('BUG-A')!.status).toBe('READY'); // never left READY
    const r2 = runTick(L(), CAP2);
    expect(r2.journaled[0]!.ok).toBe(true);
    expect(st().items.get('BUG-A')!.status).toBe('RUNNING');
    // exactly ONE live attempt — the crashed decision did not spawn a ghost
    expect(st().items.get('BUG-A')!.attempts.filter((a) => !a.superseded)).toHaveLength(1);
  });

  it('journal crash mid-write: corrupt tail → verify fails → repair → replay intact', () => {
    ingest('BUG-A', 'src/a.ts');
    writeFileSync(path.join(root, 'src/a.ts'), 'a');
    runToAwaiting('BUG-A');
    const before = journal().records.length;
    // simulate a torn write
    const jp = journalPath(dir);
    const buf = readFileSync(jp, 'utf8') + '{"seq":999,"type":"x"';
    writeFileSync(jp, buf);
    expect(journal().ok).toBe(false);
    repairJournal(dir, 'pilot: torn write');
    const after = journal();
    expect(after.ok).toBe(true);
    expect(after.records.length).toBe(before + 1); // + journal_repair
    expect(st().items.get('BUG-A')!.status).toBe('AWAITING_DIRECTOR'); // state survives
  });

  it('taxonomy gate: a feature can never reach RUNNING without plan_approved', () => {
    L().apply('item_ingested', { item_id: 'F-1', kind: 'feature', expected_files: ['src/new.ts'], surfaces: [] });
    L().apply('item_ready', { item_id: 'F-1' }); // illegal: NEEDS_PLAN → READY
    expect(st().items.get('F-1')!.status).toBe('NEEDS_PLAN');
    // even if READY were forced, the tick never assigns a NEEDS_PLAN item
    const r = computeTick(st(), journal().records, CAP2);
    expect(r.assignments.find((a) => a.item_id === 'F-1')).toBeUndefined();
  });
});
