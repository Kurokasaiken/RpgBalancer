/**
 * ledgerCore — work-item ledger mechanics (PLAN-077 T-001).
 *
 * The authoritative store for the work-item lifecycle is an append-only
 * NDJSON journal plus an atomic snapshot. This module owns the mechanics:
 *
 *  - records: `{seq, type, payload, prev_checksum, checksum}` — `seq` is a
 *    contiguous counter from 0 (the genesis record); `checksum` is the
 *    sha256 of the canonical serialization of `{seq, type, payload,
 *    prev_checksum}`, so the chain is tamper-evident.
 *  - genesis: `seq 0`, `type 'genesis'`, `prev_checksum null`, and
 *    `payload.history_complete === true`. A journal whose head is not a
 *    valid genesis has undecidable history → callers must fail closed.
 *  - replay: deterministic — the same journal through the same reducer
 *    always yields the same state.
 *  - repair: corruption is never edited in place — the tail is truncated
 *    at the first invalid record and the act is journaled as
 *    `journal_repair` (the repair itself is part of history).
 *  - writers: a single dispatcher writer at a time, fenced by a pid
 *    lockfile; a dead pid's lock is taken over (recorded on stderr).
 */

import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
  fsyncSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const LEDGER_DIR = '.mw/ledger';
export const JOURNAL_FILE = 'journal.ndjson';
export const SNAPSHOT_FILE = 'snapshot.json';
export const WRITER_LOCK = '.writer.lock';
export const SCHEMA = 'workitem-ledger/1';
export const GENESIS_TYPE = 'genesis';
export const REPAIR_TYPE = 'journal_repair';

export interface JournalRecord<P = unknown> {
  seq: number;
  type: string;
  payload: P;
  prev_checksum: string | null;
  checksum: string;
}

export interface JournalValidation {
  ok: boolean;
  records: JournalRecord[];
  history_complete: boolean;
  /** Set when the chain breaks: which record index and why. */
  corrupt?: { seq: number; reason: string };
}

export interface Snapshot<S = unknown> {
  schema: string;
  at_seq: number;
  taken_at: string;
  state: S;
}

/* ------------------------------------------------------------------ */
/* Canonical serialization + checksum                                  */
/* ------------------------------------------------------------------ */

/** Deterministic JSON: object keys sorted recursively, no whitespace. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

export function recordChecksum(rec: Omit<JournalRecord, 'checksum'>): string {
  return createHash('sha256').update(canonicalize(rec)).digest('hex');
}

/* ------------------------------------------------------------------ */
/* Atomic file writes                                                  */
/* ------------------------------------------------------------------ */

/** Write a file atomically: tmp in the same dir, fsync, rename, fsync dir. */
export function atomicWriteFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const fd = openSync(tmp, 'w');
  try {
    writeFileSync(fd, content);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, filePath);
  const dfd = openSync(dir, 'r');
  try {
    fsyncSync(dfd);
  } finally {
    closeSync(dfd);
  }
}

/* ------------------------------------------------------------------ */
/* Writer lock (single dispatcher writer)                              */
/* ------------------------------------------------------------------ */

function lockPath(ledgerDir: string): string {
  return path.join(ledgerDir, WRITER_LOCK);
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Take the writer lock. Throws when another live writer holds it. */
export function acquireWriterLock(ledgerDir: string): () => void {
  const lp = lockPath(ledgerDir);
  if (existsSync(lp)) {
    const held = Number(readFileSync(lp, 'utf8').trim());
    // Any live holder blocks — including our own pid (re-entrant acquire
    // is a programming error, not a takeover).
    if (Number.isInteger(held) && pidAlive(held)) {
      throw new Error(`ledger writer lock held by live pid ${held}`);
    }
    // Stale lock from a dead process — take over.
    process.stderr.write(`[ledger] taking over stale writer lock (pid ${held})\n`);
  }
  atomicWriteFile(lp, `${process.pid}\n`);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (existsSync(lp) && readFileSync(lp, 'utf8').trim() === `${process.pid}`) {
      unlinkSync(lp);
    }
  };
}

/* ------------------------------------------------------------------ */
/* Journal init / append / validate                                    */
/* ------------------------------------------------------------------ */

export function journalPath(ledgerDir: string): string {
  return path.join(ledgerDir, JOURNAL_FILE);
}

function genesisRecord(): JournalRecord {
  const rec: Omit<JournalRecord, 'checksum'> = {
    seq: 0,
    type: GENESIS_TYPE,
    payload: { schema: SCHEMA, history_complete: true },
    prev_checksum: null,
  };
  return { ...rec, checksum: recordChecksum(rec) };
}

/** Create the ledger dir and journal with a genesis record. Idempotent. */
export function initLedger(ledgerDir: string = LEDGER_DIR): JournalRecord {
  mkdirSync(ledgerDir, { recursive: true });
  const jp = journalPath(ledgerDir);
  if (existsSync(jp) && statSync(jp).size > 0) {
    const v = validateJournal(ledgerDir);
    if (!v.ok || !v.history_complete) {
      throw new Error(`ledger exists but is not valid/history-complete: ${v.corrupt?.reason ?? 'no genesis'}`);
    }
    return v.records[0];
  }
  const g = genesisRecord();
  atomicWriteFile(jp, `${JSON.stringify(g)}\n`);
  return g;
}

function readTail(ledgerDir: string): { seq: number; checksum: string } | null {
  const jp = journalPath(ledgerDir);
  if (!existsSync(jp)) return null;
  const lines = readFileSync(jp, 'utf8').split('\n').filter(Boolean);
  if (lines.length === 0) return null;
  const last = JSON.parse(lines[lines.length - 1]) as JournalRecord;
  return { seq: last.seq, checksum: last.checksum };
}

/** Append a record under the writer lock; returns the journaled record. */
export function appendRecord(
  type: string,
  payload: unknown,
  ledgerDir: string = LEDGER_DIR,
): JournalRecord {
  const release = acquireWriterLock(ledgerDir);
  try {
    const tail = readTail(ledgerDir);
    if (!tail) throw new Error('journal not initialized — run init first');
    const rec: Omit<JournalRecord, 'checksum'> = {
      seq: tail.seq + 1,
      type,
      payload,
      prev_checksum: tail.checksum,
    };
    const full: JournalRecord = { ...rec, checksum: recordChecksum(rec) };
    const jp = journalPath(ledgerDir);
    const fd = openSync(jp, 'a');
    try {
      appendFileSync(fd, `${JSON.stringify(full)}\n`);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    return full;
  } finally {
    release();
  }
}

/**
 * Read and validate the full chain. Never throws — corruption is reported
 * at the first bad record (`ok:false`, `corrupt`), with `records` holding
 * only the valid prefix.
 */
export function validateJournal(ledgerDir: string = LEDGER_DIR): JournalValidation {
  const jp = journalPath(ledgerDir);
  const empty: JournalValidation = { ok: false, records: [], history_complete: false, corrupt: { seq: -1, reason: 'journal missing or empty' } };
  if (!existsSync(jp)) return empty;
  const lines = readFileSync(jp, 'utf8').split('\n').filter(Boolean);
  if (lines.length === 0) return empty;

  const records: JournalRecord[] = [];
  let prevChecksum: string | null = null;
  /** history_complete of the valid prefix — a proper genesis at seq 0. */
  const prefixComplete = (): boolean => {
    const g = records[0];
    return (
      g?.type === GENESIS_TYPE &&
      (g.payload as { history_complete?: boolean })?.history_complete === true
    );
  };
  for (let i = 0; i < lines.length; i += 1) {
    let rec: JournalRecord;
    try {
      rec = JSON.parse(lines[i]) as JournalRecord;
    } catch {
      return { ok: false, records, history_complete: prefixComplete(), corrupt: { seq: i, reason: 'unparseable line' } };
    }
    if (rec.seq !== i) {
      return { ok: false, records, history_complete: prefixComplete(), corrupt: { seq: i, reason: `seq gap: expected ${i}, got ${rec.seq}` } };
    }
    if (rec.prev_checksum !== prevChecksum) {
      return { ok: false, records, history_complete: prefixComplete(), corrupt: { seq: i, reason: 'prev_checksum mismatch' } };
    }
    const { checksum, ...body } = rec;
    if (typeof checksum !== 'string' || recordChecksum(body) !== checksum) {
      return { ok: false, records, history_complete: prefixComplete(), corrupt: { seq: i, reason: 'checksum mismatch' } };
    }
    records.push(rec);
    prevChecksum = checksum;
  }

  if (!prefixComplete()) {
    return { ok: false, records, history_complete: false, corrupt: { seq: 0, reason: 'no valid genesis' } };
  }
  return { ok: true, records, history_complete: true };
}

/* ------------------------------------------------------------------ */
/* Replay + snapshot                                                   */
/* ------------------------------------------------------------------ */

/** Deterministic fold over the validated records. */
export function replayJournal<S>(
  records: JournalRecord[],
  initial: S,
  reducer: (state: S, rec: JournalRecord) => S,
): S {
  return records.reduce(reducer, initial);
}

export function writeSnapshot<S>(state: S, atSeq: number, ledgerDir: string = LEDGER_DIR): void {
  const snap: Snapshot<S> = {
    schema: SCHEMA,
    at_seq: atSeq,
    taken_at: new Date().toISOString(),
    state,
  };
  atomicWriteFile(path.join(ledgerDir, SNAPSHOT_FILE), `${JSON.stringify(snap, null, 2)}\n`);
}

export function loadSnapshot<S>(ledgerDir: string = LEDGER_DIR): Snapshot<S> | null {
  const p = path.join(ledgerDir, SNAPSHOT_FILE);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8')) as Snapshot<S>;
}

/* ------------------------------------------------------------------ */
/* Repair — truncate the corrupt tail, journal the act itself          */
/* ------------------------------------------------------------------ */

/**
 * Truncate the journal back to the valid prefix and append a
 * `journal_repair` record describing the cut. Returns the validation
 * summary of the repaired journal.
 *
 * Fail-closed boundary: repair only handles tail corruption below a
 * history-complete prefix. A missing/broken genesis or an empty valid
 * prefix means the history itself is undecidable — the function throws
 * and the caller must escalate (never silently rewrite history).
 */
export function repairJournal(
  ledgerDir: string,
  reason: string,
): JournalValidation {
  const release = acquireWriterLock(ledgerDir);
  try {
    const v = validateJournal(ledgerDir);
    if (v.ok && v.history_complete) return v;
    if (!v.history_complete || v.records.length === 0) {
      throw new Error(
        `fail-closed: journal history undecidable (${v.corrupt?.reason ?? 'no valid prefix'}) — escalate, do not repair`,
      );
    }
    const jp = journalPath(ledgerDir);
    const kept = v.records.map((r) => `${JSON.stringify(r)}\n`).join('');
    atomicWriteFile(jp, kept);
    const tail = v.records[v.records.length - 1] ?? null;
    const rec: Omit<JournalRecord, 'checksum'> = {
      seq: tail ? tail.seq + 1 : 0,
      type: REPAIR_TYPE,
      payload: {
        reason,
        truncated_from_seq: v.corrupt?.seq ?? 0,
        truncated_at: new Date().toISOString(),
      },
      prev_checksum: tail ? tail.checksum : null,
    };
    const full: JournalRecord = { ...rec, checksum: recordChecksum(rec) };
    const fd = openSync(jp, 'a');
    try {
      appendFileSync(fd, `${JSON.stringify(full)}\n`);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    return validateJournal(ledgerDir);
  } finally {
    release();
  }
}
