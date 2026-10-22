/**
 * PLAN-077 T-005 — linearized queue tick: watermark isolation, cap,
 * conflicts, deps, dedup (suspect_fixed), priority, FIFO starvation,
 * verification slots ≠ execution slots, unique assignment ids,
 * atomic journaled assignment. Permanent regression (R-247).
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appendRecord, initLedger, validateJournal } from '../../../scripts/ledger/ledgerCore';
import { deriveState } from '../../../scripts/ledger/workItem';
import { openLedger } from '../../../scripts/ledger/dispatcher';
import { computeTick, runTick } from '../../../scripts/ledger/queue';

let dir: string;
let root: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'mw-q-'));
  root = mkdtempSync(path.join(tmpdir(), 'mw-qr-'));
  initLedger(dir);
  mkdirSync(path.join(root, 'src'), { recursive: true });
  writeFileSync(path.join(root, 'src/a.ts'), 'a');
  writeFileSync(path.join(root, 'src/b.ts'), 'b');
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });
});

const CAP2 = { execution_cap: 2, verification_cap: 1 };

function ev(t: string, p: unknown) {
  return appendRecord(t, p, dir);
}
function readyItem(id: string, files: string[], extra: Record<string, unknown> = {}): void {
  ev('item_ingested', { item_id: id, kind: 'defect', title: id, expected_files: files, surfaces: [], ...extra });
  ev('item_ready', { item_id: id });
}
function tick(opts = CAP2) {
  const { records } = validateJournal(dir);
  return computeTick(deriveState(records), records, opts);
}

describe('select + cap + conflicts', { timeout: 30000 }, () => {
  it('assigns eligible READY items up to the static cap', () => {
    readyItem('B1', ['src/a.ts']);
    readyItem('B2', ['src/b.ts']);
    const r = tick(CAP2);
    expect(r.assignments.map((a) => a.item_id).sort()).toEqual(['B1', 'B2']);
    expect(r.assignments[0]!.assignment_id).not.toBe(r.assignments[1]!.assignment_id);
  });

  it('execution cap holds: third eligible item skipped, not force-started', () => {
    readyItem('B1', ['src/a.ts']);
    readyItem('B2', ['src/b.ts']);
    readyItem('B3', ['src/c.ts']);
    const r = tick({ execution_cap: 1, verification_cap: 1 });
    expect(r.assignments).toHaveLength(1);
    expect(r.skipped.filter((s) => s.reason === 'execution_cap')).toHaveLength(2);
  });

  it('two items on the same surface conflict inside one tick', () => {
    readyItem('B1', ['src/a.ts']);
    readyItem('B2', ['src/a.ts']);
    const r = tick(CAP2);
    expect(r.assignments.map((a) => a.item_id)).toEqual(['B1']);
    expect(r.skipped.find((s) => s.item_id === 'B2')?.reason).toBe('surface_conflict');
  });

  it('a lock held by a RUNNING item blocks a same-surface READY item', () => {
    readyItem('B1', ['src/a.ts']);
    const r1 = runTick(openLedger(dir), CAP2); // B1 → RUNNING with lock
    expect(r1.journaled.every((j) => j.ok)).toBe(true);
    readyItem('B2', ['src/a.ts']);
    const r2 = tick(CAP2);
    expect(r2.assignments).toHaveLength(0);
    expect(r2.skipped.find((s) => s.item_id === 'B2')?.reason).toBe('surface_conflict');
  });
});

describe('ordering: priority then FIFO', { timeout: 30000 }, () => {
  it('item_prioritized jumps the queue; otherwise oldest ingest first', () => {
    readyItem('B1', ['src/a.ts']);
    readyItem('B2', ['src/b.ts']);
    readyItem('B3', ['src/c.ts']);
    ev('item_prioritized', { item_id: 'B3', reason: 'director' });
    const r = tick({ execution_cap: 1, verification_cap: 1 });
    expect(r.assignments[0]!.item_id).toBe('B3');
    // Actually consume B3 (tick is pure — an unapplied decision changes nothing)
    const L = openLedger(dir);
    runTick(L, { execution_cap: 1, verification_cap: 1 });
    const r2 = tick(CAP2);
    // B3 RUNNING occupies 1 of 2 exec slots → only B1 fits; B2 waits (FIFO order kept).
    expect(r2.assignments.map((a) => a.item_id)).toEqual(['B1']);
    expect(r2.skipped.find((s) => s.item_id === 'B2')?.reason).toBe('execution_cap');
  });
});

describe('deps + dedup', { timeout: 30000 }, () => {
  /** Drive B1 on src/a.ts to CLOSED without a Director confirmation. */
  function closeB1(): void {
    ev('item_ingested', { item_id: 'B1', kind: 'defect', expected_files: ['src/a.ts'], surfaces: [], requires_director_confirmation: false });
    ev('item_ready', { item_id: 'B1' });
    ev('attempt_started', { item_id: 'B1', attempt_id: 'a1', attempt_token: 't1' });
    ev('attempt_finished', { item_id: 'B1', attempt_id: 'a1', attempt_token: 't1', surface_manifest_hash: 'h1' });
    ev('verification_receipt', { item_id: 'B1', attempt_id: 'a1', classification: 'pass' });
    ev('final_gate_passed', { item_id: 'B1' });
  }

  it('depends_on an OPEN item → dep_open; once CLOSED → eligible', () => {
    closeB1();
    // B1 is already CLOSED here — use a second dep test with an open dep:
    ev('item_ingested', { item_id: 'B0', kind: 'defect', expected_files: ['src/c.ts'], surfaces: [] });
    readyItem('B2', ['src/b.ts'], { depends_on: ['B0'] });
    expect(tick(CAP2).skipped.find((s) => s.item_id === 'B2')?.reason).toBe('dep_open');
    // close B0 (via withdraw → reopen path is long; B0 stays OPEN is enough to prove dep_open)
  });

  it('dep satisfied: item whose deps are CLOSED is assignable', () => {
    closeB1();
    readyItem('B2', ['src/b.ts'], { depends_on: ['B1'] });
    const r = tick(CAP2);
    expect(r.assignments.map((a) => a.item_id)).toEqual(['B2']);
  });

  it('suspect_fixed_by: open defect fully covered by a CLOSED surface is flagged, not closed', () => {
    closeB1();
    expect(deriveState(validateJournal(dir).records).items.get('B1')!.status).toBe('CLOSED');
    readyItem('B2', ['src/a.ts']); // same file — covered by B1's closed surface
    const r = tick(CAP2);
    expect(r.suspect_fixed.find((s) => s.item_id === 'B2')?.suspect_fixed_by).toBe('B1');
    expect(deriveState(validateJournal(dir).records).items.get('B2')!.status).toBe('READY');
  });
});

describe('watermark + slots', { timeout: 30000 }, () => {
  it('events after the snapshot watermark are invisible to the tick', () => {
    readyItem('B1', ['src/a.ts']);
    const { records } = validateJournal(dir); // snapshot
    ev('item_ingested', { item_id: 'B2', kind: 'defect', expected_files: ['src/b.ts'], surfaces: [] });
    ev('item_ready', { item_id: 'B2' }); // ingested "during" the tick
    const r = computeTick(deriveState(records), records, CAP2);
    expect(r.assignments.map((a) => a.item_id)).toEqual(['B1']);
    expect(r.assignments.find((a) => a.item_id === 'B2')).toBeUndefined();
  });

  it('VERIFYING items consume verification slots, not execution slots', () => {
    readyItem('B1', ['src/a.ts']);
    const L = openLedger(dir);
    runTick(L, CAP2);
    const st = deriveState(validateJournal(dir).records);
    const att = st.items.get('B1')!.attempts[0]!;
    ev('attempt_finished', { item_id: 'B1', attempt_id: att.attempt_id, attempt_token: att.attempt_token, surface_manifest_hash: 'h' });
    const st2 = deriveState(validateJournal(dir).records);
    expect(st2.items.get('B1')!.status).toBe('VERIFYING');
    readyItem('B2', ['src/b.ts']);
    const r = tick(CAP2);
    expect(r.verifying_now).toBe(1);
    expect(r.running_now).toBe(0);
    expect(r.assignments.map((a) => a.item_id)).toEqual(['B2']); // exec slot free
  });
});

describe('atomic assignment', { timeout: 30000 }, () => {
  it('runTick journals tick_assignment + attempt_started + lock_acquired, item RUNNING', () => {
    readyItem('B1', ['src/a.ts']);
    const L = openLedger(dir);
    const r = runTick(L, CAP2);
    expect(r.journaled).toEqual([expect.objectContaining({ ok: true, item_id: 'B1' })]);
    const recs = validateJournal(dir).records;
    const types = recs.map((x) => x.type);
    expect(types).toContain('tick_assignment');
    const st = deriveState(recs);
    expect(st.items.get('B1')!.status).toBe('RUNNING');
    const a = st.items.get('B1')!.attempts[0]!;
    expect(a.attempt_token.startsWith('tok-B1-')).toBe(true);
  });
});
