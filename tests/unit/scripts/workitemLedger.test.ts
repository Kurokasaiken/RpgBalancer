/**
 * PLAN-077 T-001 — work-item ledger mechanics: genesis/history_complete,
 * checksum chain, tail repair (journaled), atomic snapshot, deterministic
 * replay, single-writer fencing. Permanent regression suite (R-247).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendRecord,
  acquireWriterLock,
  canonicalize,
  initLedger,
  journalPath,
  loadSnapshot,
  recordChecksum,
  repairJournal,
  replayJournal,
  validateJournal,
  writeSnapshot,
  type JournalRecord,
} from '../../../scripts/ledger/ledgerCore';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'mw-ledger-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function tamper(seq: number, mutate: (r: JournalRecord) => void): void {
  const lines = readFileSync(journalPath(dir), 'utf8').split('\n').filter(Boolean);
  const rec = JSON.parse(lines[seq]) as JournalRecord;
  mutate(rec);
  lines[seq] = JSON.stringify(rec);
  writeFileSync(journalPath(dir), `${lines.join('\n')}\n`);
}

describe('init + genesis', () => {
  it('creates a genesis record marked history_complete', () => {
    const g = initLedger(dir);
    expect(g.seq).toBe(0);
    expect(g.type).toBe('genesis');
    expect((g.payload as { history_complete: boolean }).history_complete).toBe(true);
    const v = validateJournal(dir);
    expect(v.ok).toBe(true);
    expect(v.history_complete).toBe(true);
  });

  it('is idempotent on an already-initialized ledger', () => {
    initLedger(dir);
    appendRecord('ev', { n: 1 }, dir);
    const g = initLedger(dir);
    expect(validateJournal(dir).records.length).toBe(2);
    expect(g.seq).toBe(0);
  });

  it('fails closed on a journal without genesis', () => {
    const rec = { seq: 0, type: 'ev', payload: {}, prev_checksum: null, checksum: 'x' };
    rec.checksum = recordChecksum({ seq: rec.seq, type: rec.type, payload: rec.payload, prev_checksum: rec.prev_checksum });
    writeFileSync(journalPath(dir), `${JSON.stringify(rec)}\n`);
    const v = validateJournal(dir);
    expect(v.ok).toBe(false);
    expect(v.history_complete).toBe(false);
    expect(() => repairJournal(dir, 'test')).toThrow(/fail-closed/);
  });
});

describe('append + chain', () => {
  it('appends contiguous seq with chained checksums', () => {
    initLedger(dir);
    appendRecord('ev', { a: 1 }, dir);
    appendRecord('ev', { a: 2 }, dir);
    const v = validateJournal(dir);
    expect(v.ok).toBe(true);
    expect(v.records.map((r) => r.seq)).toEqual([0, 1, 2]);
    expect(v.records[2].prev_checksum).toBe(v.records[1].checksum);
  });

  it('refuses append on an uninitialized journal', () => {
    expect(() => appendRecord('ev', {}, dir)).toThrow(/not initialized/);
  });
});

describe('tamper detection + repair', () => {
  it('detects a payload tamper via checksum', () => {
    initLedger(dir);
    appendRecord('ev', { a: 1 }, dir);
    appendRecord('ev', { a: 2 }, dir);
    tamper(1, (r) => {
      (r.payload as { a: number }).a = 999;
    });
    const v = validateJournal(dir);
    expect(v.ok).toBe(false);
    expect(v.corrupt?.seq).toBe(1);
    expect(v.corrupt?.reason).toMatch(/checksum/);
  });

  it('detects a seq gap', () => {
    initLedger(dir);
    appendRecord('ev', {}, dir);
    tamper(1, (r) => {
      r.seq = 7;
    });
    expect(validateJournal(dir).corrupt?.reason).toMatch(/seq gap/);
  });

  it('truncates a corrupt tail and journals journal_repair', () => {
    initLedger(dir);
    appendRecord('ev', { a: 1 }, dir);
    appendRecord('ev', { a: 2 }, dir);
    appendRecord('ev', { a: 3 }, dir);
    tamper(2, (r) => {
      (r.payload as { a: number }).a = 999;
    });
    const v = repairJournal(dir, 'test corruption');
    expect(v.ok).toBe(true);
    const types = v.records.map((r) => r.type);
    expect(types[types.length - 1]).toBe('journal_repair');
    expect(v.records.length).toBe(3); // genesis + seq1 + repair
    const repair = v.records[v.records.length - 1];
    expect((repair.payload as { truncated_from_seq: number }).truncated_from_seq).toBe(2);
  });

  it('drops an unparseable garbage tail', () => {
    initLedger(dir);
    appendRecord('ev', {}, dir);
    appendFileSync(journalPath(dir), '{"seq":2,"type":"ev","payload":garbage…\n');
    const v = repairJournal(dir, 'truncated write');
    expect(v.ok).toBe(true);
    expect(v.records.length).toBe(3);
  });
});

describe('replay + snapshot', () => {
  it('replay is deterministic', () => {
    initLedger(dir);
    for (let i = 0; i < 5; i += 1) appendRecord('tick', { n: i }, dir);
    const { records } = validateJournal(dir);
    const reduce = (s: number, r: JournalRecord) => s + (r.type === 'tick' ? (r.payload as { n: number }).n : 0);
    const a = replayJournal(records, 0, reduce);
    const b = replayJournal(records, 0, reduce);
    expect(a).toBe(b);
    expect(a).toBe(10);
  });

  it('snapshot writes atomically and round-trips', () => {
    initLedger(dir);
    appendRecord('ev', {}, dir);
    writeSnapshot({ items: { BUG: 'x' } }, 1, dir);
    const snap = loadSnapshot<{ items: Record<string, string> }>(dir);
    expect(snap?.at_seq).toBe(1);
    expect(snap?.state.items.BUG).toBe('x');
    expect(snap?.schema).toBe('workitem-ledger/1');
  });
});

describe('writer fencing', () => {
  it('a second live writer cannot take the lock', () => {
    initLedger(dir);
    const release = acquireWriterLock(dir);
    // Simulate another live pid by rewriting the lockfile with pid 1
    // (launchd — always alive) is fragile; use our own pid taken twice.
    expect(() => acquireWriterLock(dir)).toThrow();
    release();
    // After release the lock is free again.
    const r2 = acquireWriterLock(dir);
    r2();
  });
});

describe('canonical serialization', () => {
  it('is key-order independent', () => {
    expect(canonicalize({ b: 1, a: { d: [3, 2], c: 'x' } })).toBe(
      canonicalize({ a: { c: 'x', d: [3, 2] }, b: 1 }),
    );
  });
});
