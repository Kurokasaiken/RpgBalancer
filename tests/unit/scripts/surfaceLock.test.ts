/**
 * PLAN-077 T-003 — surface locks derived from the journal: acquire,
 * conflicts, fencing tokens, implicit release on supersede, terminal
 * release, force-release, replay determinism. Permanent regression (R-247).
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendRecord,
  initLedger,
  validateJournal,
  type JournalRecord,
} from '../../../scripts/ledger/ledgerCore';
import { deriveState, type LedgerState } from '../../../scripts/ledger/workItem';
import {
  conflictsFor,
  deriveLocks,
  keysFor,
  normalizeKey,
} from '../../../scripts/ledger/surfaceLock';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'mw-lock-'));
  initLedger(dir);
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function ev(type: string, payload: unknown): JournalRecord {
  return appendRecord(type, payload, dir);
}
function locks() {
  const { records } = validateJournal(dir);
  return deriveLocks(records, deriveState(records));
}
function st(): LedgerState {
  const { records } = validateJournal(dir);
  return deriveState(records);
}
const REV = 'a'.repeat(64);

function defectRunning(id: string, attempt: string, token = `tok-${attempt}`): void {
  ev('item_ingested', {
    item_id: id,
    kind: 'defect',
    title: 'x',
    expected_files: ['src/foo.ts'],
    surfaces: ['game-quest'],
  });
  ev('item_ready', { item_id: id });
  ev('attempt_started', { item_id: id, attempt_id: attempt, attempt_token: token });
  ev('lock_acquired', {
    item_id: id,
    attempt_id: attempt,
    attempt_token: token,
    surfaces: ['game-quest'],
    files: ['./src/foo.ts'],
  });
}

describe('acquire + conflicts', { timeout: 30000 }, () => {
  it('acquired keys are live and block other items', () => {
    defectRunning('BUG-1', 'a1');
    const L = locks();
    expect(L.has('surf:game-quest')).toBe(true);
    expect(L.has('file:src/foo.ts')).toBe(true);
    const c = conflictsFor(L, keysFor(['game-quest'], ['src/bar.ts', 'src/foo.ts']), 'BUG-2');
    expect(c.map((x) => x.key).sort()).toEqual(['file:src/foo.ts', 'surf:game-quest']);
    expect(c[0]!.held_by_item).toBe('BUG-1');
  });

  it('normalization: ./x, backslashes and surf/file namespaces', () => {
    expect(normalizeKey('./src/a.ts', 'file')).toBe('file:src/a.ts');
    expect(normalizeKey('src\\a.ts', 'file')).toBe('file:src/a.ts');
    expect(normalizeKey('src//a.ts', 'file')).toBe('file:src/a.ts');
    expect(normalizeKey('game-quest', 'surface')).toBe('surf:game-quest');
    // a file literally named like a surface id never collides with the surface
    expect(normalizeKey('game-quest', 'file')).not.toBe(normalizeKey('game-quest', 'surface'));
  });
});

describe('release paths', { timeout: 30000 }, () => {
  it('explicit lock_released frees the keys', () => {
    defectRunning('BUG-1', 'a1');
    ev('lock_released', {
      item_id: 'BUG-1',
      attempt_id: 'a1',
      attempt_token: 'tok-a1',
      keys: ['src/foo.ts'],
    });
    const L = locks();
    expect(L.has('file:src/foo.ts')).toBe(false);
    expect(L.has('surf:game-quest')).toBe(true); // partial release
  });

  it('a release carrying a foreign token is inert (fencing)', () => {
    defectRunning('BUG-1', 'a1');
    ev('lock_released', {
      item_id: 'BUG-1',
      attempt_id: 'a1',
      attempt_token: 'WRONG',
      keys: ['src/foo.ts'],
    });
    expect(locks().has('file:src/foo.ts')).toBe(true);
  });

  it('a superseded attempt loses its locks without an explicit release', () => {
    defectRunning('BUG-1', 'a1');
    // defect persisted → retry starts a2: a1's holds die
    ev('attempt_finished', { item_id: 'BUG-1', attempt_id: 'a1', attempt_token: 'tok-a1', surface_manifest_hash: REV });
    ev('verification_receipt', { item_id: 'BUG-1', attempt_id: 'a1', classification: 'defect_persisted' });
    expect(st().items.get('BUG-1')!.status).toBe('RETRY_PENDING');
    ev('item_ready', { item_id: 'BUG-1' });
    ev('attempt_started', { item_id: 'BUG-1', attempt_id: 'a2', attempt_token: 'tok-a2' });
    const L = locks();
    expect(L.size).toBe(0);
    // now BUG-2 can take the same surface
    expect(conflictsFor(L, keysFor(['game-quest'], ['src/foo.ts']), 'BUG-2')).toEqual([]);
  });

  it('AWAITING_DIRECTOR keeps the lock; CLOSED releases it', () => {
    defectRunning('BUG-1', 'a1');
    ev('attempt_finished', { item_id: 'BUG-1', attempt_id: 'a1', attempt_token: 'tok-a1', surface_manifest_hash: REV });
    ev('verification_receipt', { item_id: 'BUG-1', attempt_id: 'a1', classification: 'pass' });
    expect(st().items.get('BUG-1')!.status).toBe('AWAITING_DIRECTOR');
    expect(locks().size).toBeGreaterThan(0); // held across the human wait
    ev('confirmation', {
      item_id: 'BUG-1',
      attempt_id: 'a1',
      revision_hash: REV,
      feedback_hash: 'fh',
      session_id: 's1',
      feedback_text: 'ok',
      at: 't',
    });
    ev('final_gate_passed', { item_id: 'BUG-1' });
    expect(st().items.get('BUG-1')!.status).toBe('CLOSED');
    expect(locks().size).toBe(0);
  });

  it('WITHDRAWN and BLOCKED_VERIFY_TERMINAL release too', () => {
    defectRunning('BUG-1', 'a1');
    ev('item_withdrawn', { item_id: 'BUG-1', reason: 'dup' });
    expect(locks().size).toBe(0);

    defectRunning('BUG-2', 'b1');
    for (let i = 1; i <= 3; i += 1) {
      const a = `b${i}`;
      ev('attempt_finished', { item_id: 'BUG-2', attempt_id: a, attempt_token: `tok-${a}`, surface_manifest_hash: REV });
      ev('verification_receipt', { item_id: 'BUG-2', attempt_id: a, classification: 'defect_persisted' });
      if (i < 3) {
        ev('item_ready', { item_id: 'BUG-2' });
        ev('attempt_started', { item_id: 'BUG-2', attempt_id: `b${i + 1}`, attempt_token: `tok-b${i + 1}` });
        ev('lock_acquired', { item_id: 'BUG-2', attempt_id: `b${i + 1}`, attempt_token: `tok-b${i + 1}`, surfaces: ['game-quest'], files: ['src/foo.ts'] });
      }
    }
    expect(st().items.get('BUG-2')!.status).toBe('BLOCKED_VERIFY_TERMINAL');
    expect(locks().size).toBe(0);
  });
});

describe('fencing + acquire validity', { timeout: 30000 }, () => {
  it('a lock_acquired with a wrong token never opens a reservation', () => {
    defectRunning('BUG-1', 'a1');
    ev('lock_acquired', {
      item_id: 'BUG-1',
      attempt_id: 'a1',
      attempt_token: 'forged',
      surfaces: [],
      files: ['src/evil.ts'],
    });
    expect(locks().has('file:src/evil.ts')).toBe(false);
  });

  it('deriveLocks is deterministic across replays', () => {
    defectRunning('BUG-1', 'a1');
    defectRunning('BUG-2', 'b1');
    const { records } = validateJournal(dir);
    const a = deriveLocks(records, deriveState(records));
    const b = deriveLocks(records, deriveState(records));
    expect([...a.entries()]).toEqual([...b.entries()]);
  });
});
