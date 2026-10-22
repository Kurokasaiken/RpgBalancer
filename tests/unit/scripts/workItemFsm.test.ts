/**
 * PLAN-077 T-002 — work-item FSM + surface manifest. Lifecycle, stale
 * confirmations, retry/block budgets, dedup, contract_invalid guards,
 * virginity on empty surfaces. Permanent regression (R-247).
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendRecord,
  initLedger,
  validateJournal,
  type JournalRecord,
} from '../../../scripts/ledger/ledgerCore';
import {
  classify,
  deriveState,
  queueReport,
  type LedgerState,
} from '../../../scripts/ledger/workItem';
import {
  computeManifest,
  type ManifestContract,
} from '../../../scripts/ledger/surfaceManifest';
import { openLedger } from '../../../scripts/ledger/dispatcher';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'mw-fsm-'));
  initLedger(dir);
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function ev(type: string, payload: unknown): JournalRecord {
  return appendRecord(type, payload, dir);
}
function state(): LedgerState {
  const { records } = validateJournal(dir);
  return deriveState(records);
}
const REV = 'a'.repeat(64);

function ingestDefect(id = 'BUG-042'): void {
  ev('item_ingested', {
    item_id: id,
    kind: 'defect',
    title: 'x',
    expected_files: ['src/foo.ts'],
    surfaces: ['game-quest'],
    requires_director_confirmation: true,
  });
}
function runAttempt(id = 'BUG-042', attempt = 'a1'): void {
  ev('item_ready', { item_id: id });
  ev('attempt_started', { item_id: id, attempt_id: attempt, attempt_token: `tok-${attempt}`, agent: 'devin' });
  ev('attempt_finished', { item_id: id, attempt_id: attempt, attempt_token: `tok-${attempt}`, surface_manifest_hash: REV });
}

describe('lifecycle happy path', { timeout: 30000 }, () => {
  it('defect: ingest → … → AWAITING → confirmed → CLOSED', () => {
    ingestDefect();
    runAttempt();
    ev('verification_receipt', { item_id: 'BUG-042', attempt_id: 'a1', classification: 'pass' });
    let it = state().items.get('BUG-042')!;
    expect(it.status).toBe('AWAITING_DIRECTOR');
    expect(it.awaiting?.attempt_id).toBe('a1');

    ev('confirmation', {
      item_id: 'BUG-042', attempt_id: 'a1', revision_hash: REV,
      feedback_hash: 'fh1', feedback_text: 'BUG-042 — Risolto', session_id: 's1', at: 't',
    });
    it = state().items.get('BUG-042')!;
    expect(it.status).toBe('DIRECTOR_CONFIRMED');
    expect(it.active_confirmation?.active).toBe(true);
    expect(it.active_confirmation?.feedback_text).toContain('Risolto');

    ev('final_gate_passed', { item_id: 'BUG-042', cause: 'all_conditions_passed' });
    it = state().items.get('BUG-042')!;
    expect(it.status).toBe('CLOSED');
    expect(it.close_cause).toBe('all_conditions_passed');
  });

  it('change skips AWAITING when director confirmation not required', () => {
    ev('item_ingested', { item_id: 'C-1', kind: 'change', requires_director_confirmation: false, expected_files: ['a'] });
    ev('item_ready', { item_id: 'C-1' });
    ev('attempt_started', { item_id: 'C-1', attempt_id: 'a1', attempt_token: 't1' });
    ev('attempt_finished', { item_id: 'C-1', attempt_id: 'a1', attempt_token: 't1', surface_manifest_hash: REV });
    ev('verification_receipt', { item_id: 'C-1', attempt_id: 'a1', classification: 'pass' });
    expect(state().items.get('C-1')!.status).toBe('DIRECTOR_CONFIRMED');
  });
});

describe('feature gate', { timeout: 30000 }, () => {
  it('feature enters NEEDS_PLAN and cannot start attempts', () => {
    const L = openLedger(dir);
    ev('item_ingested', { item_id: 'F-1', kind: 'feature', expected_files: ['new.ts'], surfaces: [] });
    expect(state().items.get('F-1')!.status).toBe('NEEDS_PLAN');
    // The single-writer facade rejects the transition BEFORE journaling —
    // an illegal event never enters history.
    const r = L.apply('attempt_started', { item_id: 'F-1', attempt_id: 'a1', attempt_token: 't' });
    expect(r.applied).toBe(false);
    expect(r.error).toMatch(/illegal transition/);
    expect(validateJournal(dir).records.filter((x) => x.type === 'attempt_started').length).toBe(0);
    ev('plan_approved', { item_id: 'F-1' });
    expect(state().items.get('F-1')!.status).toBe('OPEN');
  });

  it('defect with allow_empty_surface is contract_invalid at ingest', () => {
    ev('item_ingested', { item_id: 'D-BAD', kind: 'defect', allow_empty_surface: true, expected_files: [], surfaces: [] });
    const it = state().items.get('D-BAD')!;
    expect(it.status).toBe('BLOCKED_VERIFY');
    expect(it.blocked_reason).toBe('contract_invalid');
  });
});

describe('retry + block policy', { timeout: 30000 }, () => {
  it('defect_persisted → RETRY_PENDING reusing the same item; budget → TERMINAL', () => {
    ingestDefect();
    for (let i = 1; i <= 3; i += 1) {
      runAttempt('BUG-042', `a${i}`);
      ev('verification_receipt', { item_id: 'BUG-042', attempt_id: `a${i}`, classification: 'defect_persisted' });
    }
    const it = state().items.get('BUG-042')!;
    expect(it.fix_attempts_used).toBe(3);
    expect(it.status).toBe('BLOCKED_VERIFY_TERMINAL');
    expect(it.attempts.length).toBe(3); // retries are same-item attempts
    expect(it.next_action).toBe('escalate_director');
  });

  it('infra failure → BLOCKED_VERIFY, does not consume fix budget', () => {
    ingestDefect();
    runAttempt();
    ev('verification_receipt', { item_id: 'BUG-042', attempt_id: 'a1', classification: 'infra', reason: 'env_invalid' });
    const it = state().items.get('BUG-042')!;
    expect(it.status).toBe('BLOCKED_VERIFY');
    expect(it.fix_attempts_used).toBe(0);
    expect(it.next_action).toBe('retry_after_env_fix');
  });

  it('quota_exhausted → retry_after_quota, recoverable', () => {
    ingestDefect();
    runAttempt();
    ev('verification_receipt', { item_id: 'BUG-042', attempt_id: 'a1', classification: 'infra', reason: 'quota_exhausted' });
    const it = state().items.get('BUG-042')!;
    expect(it.status).toBe('BLOCKED_VERIFY');
    expect(it.blocked_reason).toBe('quota_exhausted');
    expect(it.next_action).toBe('retry_after_quota');
  });
});

describe('confirmation semantics', { timeout: 30000 }, () => {
  function toAwaiting(): void {
    ingestDefect();
    runAttempt();
    ev('verification_receipt', { item_id: 'BUG-042', attempt_id: 'a1', classification: 'pass' });
  }
  const CONF = { item_id: 'BUG-042', attempt_id: 'a1', revision_hash: REV, feedback_hash: 'fh', session_id: 's1', feedback_text: 'ok', at: 't' };

  it('duplicate confirmation has no double effect', () => {
    toAwaiting();
    ev('confirmation', CONF);
    ev('confirmation', CONF);
    ev('final_gate_passed', { item_id: 'BUG-042' });
    const it = state().items.get('BUG-042')!;
    expect(it.status).toBe('CLOSED');
    expect(it.closed_at_seq).toBeDefined();
  });

  it('confirmation for a superseded attempt is stale — no closure', () => {
    toAwaiting();
    // new attempt supersedes a1 → item leaves AWAITING (supersession exits)
    ev('attempt_started', { item_id: 'BUG-042', attempt_id: 'a2', attempt_token: 'tok-a2' });
    ev('confirmation', CONF);
    const it = state().items.get('BUG-042')!;
    expect(it.status).toBe('RUNNING');
    expect(it.active_confirmation).toBeNull();
    expect(it.attempts.find((a) => a.attempt_id === 'a1')!.superseded).toBe(true);
  });

  it('confirmation on a drifted revision does not bind', () => {
    toAwaiting();
    ev('confirmation', { ...CONF, revision_hash: 'b'.repeat(64) });
    expect(state().items.get('BUG-042')!.status).toBe('AWAITING_DIRECTOR');
  });

  it('contract_amended invalidates an active confirmation', () => {
    toAwaiting();
    ev('confirmation', CONF);
    expect(state().items.get('BUG-042')!.status).toBe('DIRECTOR_CONFIRMED');
    ev('contract_amended', { item_id: 'BUG-042', patch: { expected_files: ['src/foo.ts', 'src/bar.ts'] } });
    const it = state().items.get('BUG-042')!;
    expect(it.status).toBe('AWAITING_DIRECTOR');
    expect(it.active_confirmation?.active).toBe(false);
  });

  it('confirmation_invalidated (revision drifted post-confirm) reopens review', () => {
    toAwaiting();
    ev('confirmation', CONF);
    ev('confirmation_invalidated', { item_id: 'BUG-042', attempt_id: 'a1', reason: 'surface drifted after inspection' });
    expect(state().items.get('BUG-042')!.status).toBe('AWAITING_DIRECTOR');
  });
});

describe('reopen + stale output', { timeout: 30000 }, () => {
  it('CLOSED → OPEN on explicit reopen', () => {
    ingestDefect();
    runAttempt();
    ev('verification_receipt', { item_id: 'BUG-042', attempt_id: 'a1', classification: 'pass' });
    ev('confirmation', { item_id: 'BUG-042', attempt_id: 'a1', revision_hash: REV, feedback_hash: 'f', session_id: 's', feedback_text: 'x', at: 't' });
    ev('final_gate_passed', { item_id: 'BUG-042' });
    ev('item_reopened', { item_id: 'BUG-042', reason: 'defect recurred' });
    expect(state().items.get('BUG-042')!.status).toBe('OPEN');
  });

  it('stale_attempt_output is journaled but inert', () => {
    ingestDefect();
    runAttempt();
    ev('stale_attempt_output', { item_id: 'BUG-042', attempt_id: 'a0-ghost', token_mismatch: true });
    expect(state().items.get('BUG-042')!.status).toBe('VERIFYING');
  });
});

describe('replay determinism + queue view', { timeout: 30000 }, () => {
  it('deriveState is deterministic', () => {
    ingestDefect();
    runAttempt();
    const { records } = validateJournal(dir);
    const a = deriveState(records);
    const b = deriveState(records);
    expect(JSON.stringify([...a.items])).toBe(JSON.stringify([...b.items]));
  });

  it('queueReport separates closed/blocked/awaiting/correction', () => {
    ingestDefect('B1');
    ev('item_ingested', { item_id: 'B2', kind: 'defect', expected_files: ['x'], surfaces: [] });
    ev('item_ingested', { item_id: 'F1', kind: 'feature', expected_files: ['y'], surfaces: [] });
    const rep = queueReport(state(), 999);
    expect(rep.needs_correction).toContain('B1');
    expect(rep.needs_plan).toContain('F1');
  });

  it('awaiting over TTL classifies awaiting_stale', () => {
    ingestDefect();
    runAttempt();
    ev('verification_receipt', { item_id: 'BUG-042', attempt_id: 'a1', classification: 'pass' });
    const s = state();
    const it = s.items.get('BUG-042')!;
    expect(classify(it, 100, 10)).toBe('awaiting_stale');
    expect(classify(it, it.awaiting!.since_seq + 5, 10)).toBe('awaiting_director');
  });
});

describe('surface manifest', { timeout: 30000 }, () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'mw-surface-'));
    mkdirSync(path.join(root, 'src'), { recursive: true });
    writeFileSync(path.join(root, 'src/a.ts'), 'const a=1;');
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const base: ManifestContract = {
    kind: 'defect', surface_id: 's1', expected_files: ['src/a.ts'], globs: [],
  };
  const J = { records: [] as JournalRecord[], history_complete: true };

  it('present files hash; declared-missing → absent:true', () => {
    const r = computeManifest({ ...base, expected_files: ['src/a.ts', 'src/gone.ts'] }, root, J);
    expect(r.verdict).toBe('ok');
    expect(r.entries.find((e) => e.path === 'src/gone.ts')?.absent).toBe(true);
    expect(r.manifest_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('glob → 0 files = contract_invalid', () => {
    const r = computeManifest({ ...base, expected_files: [], globs: ['src/nope/**/*.ts'] }, root, J);
    expect(r.verdict).toBe('contract_invalid');
  });

  it('all-absent declared set = contract_invalid', () => {
    const r = computeManifest({ ...base, expected_files: ['src/gone1.ts', 'src/gone2.ts'] }, root, J);
    expect(r.verdict).toBe('contract_invalid');
  });

  it('feature allow_empty_surface on virgin surface → ok', () => {
    const c: ManifestContract = { kind: 'feature', surface_id: 'newfeat', expected_files: [], globs: ['src/empty/**/*.ts'], allow_empty_surface: true, empty_surface_reason: 'new mechanic' };
    const r = computeManifest(c, root, J);
    expect(r.verdict).toBe('ok');
    expect(r.entries.length).toBe(0);
  });

  it('empty surface on defect even with flag → rejected', () => {
    const c: ManifestContract = { kind: 'defect', surface_id: 's1', expected_files: [], globs: ['src/empty/**/*.ts'], allow_empty_surface: true, empty_surface_reason: 'x' };
    expect(computeManifest(c, root, J).verdict).toBe('empty_surface_rejected');
  });

  it('surface with a prior present manifest is not virgin → rejected', () => {
    const records: JournalRecord[] = [
      { seq: 0, type: 'genesis', payload: { history_complete: true }, prev_checksum: null, checksum: 'x' },
      { seq: 1, type: 'attempt_finished', payload: { surface_id: 's1', had_present: true }, prev_checksum: 'x', checksum: 'y' },
    ];
    const c: ManifestContract = { kind: 'feature', surface_id: 's1', expected_files: [], globs: ['src/empty/**/*.ts'], allow_empty_surface: true, empty_surface_reason: 'new' };
    expect(computeManifest(c, root, { records, history_complete: true }).verdict).toBe('empty_surface_rejected');
  });

  it('incomplete history → undecidable → fail closed', () => {
    const c: ManifestContract = { kind: 'feature', surface_id: 's1', expected_files: [], globs: ['src/empty/**/*.ts'], allow_empty_surface: true, empty_surface_reason: 'new' };
    expect(computeManifest(c, root, { records: [], history_complete: false }).verdict).toBe('history_undecidable');
  });
});
