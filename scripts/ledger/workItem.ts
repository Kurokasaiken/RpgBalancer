/**
 * workItem — item model + FSM for the closure queue (PLAN-077 T-002).
 *
 * Pure reducer over journal records (T-001): the item state is a derived,
 * deterministic fold — `deriveState(records)` replayed twice yields the
 * same view. All domain invariants live here:
 *
 *  - states: OPEN → READY → RUNNING → VERIFYING → AWAITING_DIRECTOR →
 *    DIRECTOR_CONFIRMED → CLOSED, plus NEEDS_PLAN, RETRY_PENDING,
 *    BLOCKED_VERIFY, BLOCKED_VERIFY_TERMINAL (never re-picked), and
 *    CLOSED → OPEN on explicit reopen.
 *  - kinds: defect | change | feature. A feature enters as NEEDS_PLAN and
 *    may only leave via `plan_approved` — never straight to RUNNING.
 *  - attempts are immutable; a new attempt supersedes the previous one —
 *    confirmations bound to a superseded attempt are journaled stale and
 *    have no closure effect (but the item exits AWAITING_DIRECTOR: the
 *    supersession itself is the exit signal, the lock follows the new
 *    attempt).
 *  - confirmation dedup: sha256(item|attempt|revision|feedback|session);
 *    a duplicate receipt is journaled `duplicate_confirmation` — never a
 *    second close, task, or execution.
 *  - retries: same item, never a duplicate card; `max_fix_attempts`
 *    (default 3, baptized) exhausted → BLOCKED_VERIFY_TERMINAL.
 *  - infra failures never auto-blame the attempt: `verification_receipt`
 *    with `classification: 'infra'` routes to BLOCKED_VERIFY, not retry.
 *  - `quota_exhausted` is a recoverable infra class (`next_action:
 *    retry_after_quota`) — does not consume fix attempts.
 */

import { createHash } from 'node:crypto';
import type { JournalRecord } from './ledgerCore';
import { canonicalize } from './ledgerCore';

export type ItemKind = 'defect' | 'change' | 'feature';
export type ItemStatus =
  | 'NEEDS_PLAN'
  | 'OPEN'
  | 'READY'
  | 'RUNNING'
  | 'VERIFYING'
  | 'AWAITING_DIRECTOR'
  | 'DIRECTOR_CONFIRMED'
  | 'RETRY_PENDING'
  | 'BLOCKED_VERIFY'
  | 'BLOCKED_VERIFY_TERMINAL'
  | 'CLOSED'
  | 'WITHDRAWN';

export type BlockedReason =
  | 'env_invalid'
  | 'verification_incomplete'
  | 'unrelated_infra_regression'
  | 'contract_invalid'
  | 'quota_exhausted'
  | 'missing_mandatory_check'
  | 'verification_unreliable';

export type NextAction =
  | 'retry_after_env_fix'
  | 'retry_after_quota'
  | 'escalate_director'
  | 'wait_human'
  | 'none';

export interface Attempt {
  attempt_id: string;
  attempt_token: string;
  agent: string;
  started_seq: number;
  finished_seq?: number;
  surface_manifest_hash?: string;
  superseded: boolean;
}

export interface Confirmation {
  idempotency_key: string;
  attempt_id: string;
  revision_hash: string;
  feedback_hash: string;
  feedback_text: string;
  session_id: string;
  at: string;
  active: boolean;
}

export interface WorkItem {
  item_id: string;
  kind: ItemKind;
  title: string;
  status: ItemStatus;
  contract: {
    expected_files: string[];
    surfaces: string[];
    depends_on: string[];
    allow_empty_surface?: boolean;
    empty_surface_reason?: string;
    requires_director_confirmation: boolean;
    max_fix_attempts: number;
    max_infra_retries: number;
    contract_hash: string;
  };
  attempts: Attempt[];
  active_confirmation: Confirmation | null;
  fix_attempts_used: number;
  infra_retries_used: number;
  blocked_reason?: BlockedReason;
  next_action?: NextAction;
  awaiting?: { attempt_id: string; since_seq: number; since_at?: string };
  closed_at_seq?: number;
  close_cause?: string;
}

export interface LedgerState {
  items: Map<string, WorkItem>;
  confirmations: Map<string, string>; // idempotency_key → item_id
}

export const DEFAULT_MAX_FIX_ATTEMPTS = 3;
export const DEFAULT_MAX_INFRA_RETRIES = 3;
/** Baptized Director TTL for AWAITING_DIRECTOR — wall-clock 48h. */
export const AWAIT_TTL_MS = 48 * 3600 * 1000;

export function confirmationKey(itemId: string, attemptId: string, revisionHash: string, feedbackHash: string, sessionId: string): string {
  return createHash('sha256')
    .update(canonicalize([itemId, attemptId, revisionHash, feedbackHash, sessionId]))
    .digest('hex');
}

function contractHashOf(c: WorkItem['contract']): string {
  const { contract_hash: _omit, ...rest } = c;
  return createHash('sha256').update(canonicalize(rest)).digest('hex');
}

const TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  NEEDS_PLAN: ['OPEN', 'WITHDRAWN'],
  OPEN: ['READY', 'WITHDRAWN'],
  READY: ['RUNNING', 'OPEN', 'WITHDRAWN'],
  RUNNING: ['VERIFYING', 'OPEN', 'WITHDRAWN'],
  VERIFYING: ['AWAITING_DIRECTOR', 'DIRECTOR_CONFIRMED', 'RETRY_PENDING', 'BLOCKED_VERIFY'],
  AWAITING_DIRECTOR: ['DIRECTOR_CONFIRMED', 'READY', 'BLOCKED_VERIFY', 'WITHDRAWN'],
  DIRECTOR_CONFIRMED: ['CLOSED', 'BLOCKED_VERIFY'],
  RETRY_PENDING: ['READY', 'BLOCKED_VERIFY_TERMINAL', 'WITHDRAWN'],
  BLOCKED_VERIFY: ['RETRY_PENDING', 'READY', 'BLOCKED_VERIFY_TERMINAL', 'WITHDRAWN'],
  BLOCKED_VERIFY_TERMINAL: [],
  CLOSED: ['OPEN'],
  WITHDRAWN: ['OPEN'],
};

function transition(item: WorkItem, to: ItemStatus, seq: number, cause: string): void {
  const allowed = TRANSITIONS[item.status];
  if (!allowed.includes(to)) {
    throw new Error(`illegal transition ${item.status}→${to} for ${item.item_id} @seq ${seq}`);
  }
  item.status = to;
  if (to === 'CLOSED') {
    item.closed_at_seq = seq;
    item.close_cause = cause;
  }
}

function itemOf(state: LedgerState, id: string, seq: number): WorkItem {
  const it = state.items.get(id);
  if (!it) throw new Error(`unknown item ${id} @seq ${seq}`);
  return it;
}

function latestAttempt(item: WorkItem): Attempt | undefined {
  return item.attempts.filter((a) => !a.superseded).at(-1);
}

/* ------------------------------------------------------------------ */
/* Reducer — one record at a time, deterministic                        */
/* ------------------------------------------------------------------ */

export function reduceRecord(state: LedgerState, rec: JournalRecord): LedgerState {
  const p = (rec.payload ?? {}) as Record<string, unknown>;
  const seq = rec.seq;

  switch (rec.type) {
    case 'genesis':
    case 'journal_repair':
      return state; // mechanics, not domain

    case 'item_ingested': {
      const item: WorkItem = {
        item_id: p.item_id as string,
        kind: p.kind as ItemKind,
        title: (p.title as string) ?? (p.item_id as string),
        status: 'OPEN',
        contract: {
          expected_files: (p.expected_files as string[]) ?? [],
          surfaces: (p.surfaces as string[]) ?? [],
          depends_on: (p.depends_on as string[]) ?? [],
          allow_empty_surface: p.allow_empty_surface as boolean | undefined,
          empty_surface_reason: p.empty_surface_reason as string | undefined,
          requires_director_confirmation: (p.requires_director_confirmation as boolean) ?? true,
          max_fix_attempts: (p.max_fix_attempts as number) ?? DEFAULT_MAX_FIX_ATTEMPTS,
          max_infra_retries: (p.max_infra_retries as number) ?? DEFAULT_MAX_INFRA_RETRIES,
          contract_hash: '',
        },
        attempts: [],
        active_confirmation: null,
        fix_attempts_used: 0,
        infra_retries_used: 0,
      };
      item.contract.contract_hash = contractHashOf(item.contract);
      // feature gate: no approved intent → NEEDS_PLAN, never RUNNING.
      if (item.kind === 'feature' && !p.plan_approved) item.status = 'NEEDS_PLAN';
      // defect/change never allow an empty surface (artifact r012).
      if (item.contract.allow_empty_surface && item.kind !== 'feature') {
        item.status = 'BLOCKED_VERIFY';
        item.blocked_reason = 'contract_invalid';
        item.next_action = 'escalate_director';
      }
      state.items.set(item.item_id, item);
      return state;
    }

    case 'plan_approved': {
      const it = itemOf(state, p.item_id as string, seq);
      if (it.status === 'NEEDS_PLAN') transition(it, 'OPEN', seq, 'plan_approved');
      return state;
    }

    case 'item_ready': {
      const it = itemOf(state, p.item_id as string, seq);
      transition(it, 'READY', seq, 'ready');
      return state;
    }

    case 'attempt_started': {
      const it = itemOf(state, p.item_id as string, seq);
      const prev = latestAttempt(it);
      if (prev) {
        // Supersede the previous attempt: stale confirmations on it are
        // journaled but have no closure effect (below).
        prev.superseded = true;
        if (it.active_confirmation?.attempt_id === prev.attempt_id) {
          it.active_confirmation.active = false;
        }
      }
      it.attempts.push({
        attempt_id: p.attempt_id as string,
        attempt_token: p.attempt_token as string,
        agent: (p.agent as string) ?? 'unknown',
        started_seq: seq,
        superseded: false,
      });
      // From any resumable state, a new attempt puts the item back in
      // RUNNING — the lock follows the new attempt.
      if (it.status === 'READY' || it.status === 'RETRY_PENDING' || it.status === 'AWAITING_DIRECTOR' || it.status === 'BLOCKED_VERIFY') {
        it.status = 'RUNNING';
        it.awaiting = undefined;
        it.blocked_reason = undefined;
        it.next_action = undefined;
      } else if (it.status !== 'RUNNING') {
        transition(it, 'RUNNING', seq, 'attempt_started');
      }
      return state;
    }

    case 'attempt_finished': {
      const it = itemOf(state, p.item_id as string, seq);
      const a = it.attempts.find((x) => x.attempt_id === p.attempt_id);
      if (!a || a.attempt_token !== p.attempt_token) return state; // stale output: journaled separately
      a.finished_seq = seq;
      a.surface_manifest_hash = p.surface_manifest_hash as string;
      if (it.status === 'RUNNING') transition(it, 'VERIFYING', seq, 'attempt_finished');
      return state;
    }

    case 'stale_attempt_output': {
      // Fencing: output from a superseded/revoked token — journaled, no
      // state effect (the artifact lives for forensics only).
      return state;
    }

    case 'verification_receipt': {
      const it = itemOf(state, p.item_id as string, seq);
      if (it.status !== 'VERIFYING') return state;
      const cls = p.classification as 'defect_persisted' | 'infra' | 'pass';
      if (cls === 'pass') {
        const needs = it.contract.requires_director_confirmation;
        transition(it, needs ? 'AWAITING_DIRECTOR' : 'DIRECTOR_CONFIRMED', seq, 'checks_pass');
        if (needs) it.awaiting = { attempt_id: p.attempt_id as string, since_seq: seq, since_at: rec.at };
      } else if (cls === 'defect_persisted') {
        it.fix_attempts_used += 1;
        if (it.fix_attempts_used >= it.contract.max_fix_attempts) {
          it.status = 'BLOCKED_VERIFY_TERMINAL';
          it.next_action = 'escalate_director';
        } else {
          transition(it, 'RETRY_PENDING', seq, 'defect_persisted');
        }
      } else {
        // infra: never auto-blame the attempt; doesn't consume fix budget.
        it.infra_retries_used += 1;
        it.status = 'BLOCKED_VERIFY';
        it.blocked_reason = (p.reason as BlockedReason) ?? 'env_invalid';
        it.next_action =
          it.blocked_reason === 'quota_exhausted'
            ? 'retry_after_quota'
            : it.infra_retries_used >= it.contract.max_infra_retries
              ? 'escalate_director'
              : 'retry_after_env_fix';
      }
      return state;
    }

    case 'confirmation': {
      const key = confirmationKey(
        p.item_id as string,
        p.attempt_id as string,
        p.revision_hash as string,
        p.feedback_hash as string,
        p.session_id as string,
      );
      if (state.confirmations.has(key)) return state; // dedup: never twice
      state.confirmations.set(key, p.item_id as string);

      const it = itemOf(state, p.item_id as string, seq);
      const conf: Confirmation = {
        idempotency_key: key,
        attempt_id: p.attempt_id as string,
        revision_hash: p.revision_hash as string,
        feedback_hash: p.feedback_hash as string,
        feedback_text: (p.feedback_text as string) ?? '',
        session_id: p.session_id as string,
        at: (p.at as string) ?? '',
        active: false,
      };
      const awaited = it.awaiting;
      // Only binds to the awaited, non-superseded attempt at the exact
      // revision inspected — never transfers to a later revision.
      if (
        it.status === 'AWAITING_DIRECTOR' &&
        awaited?.attempt_id === conf.attempt_id &&
        awaited.attempt_id === latestAttempt(it)?.attempt_id &&
        conf.revision_hash === it.attempts.find((a) => a.attempt_id === conf.attempt_id)?.surface_manifest_hash
      ) {
        conf.active = true;
        it.active_confirmation = conf;
        transition(it, 'DIRECTOR_CONFIRMED', seq, 'confirmation');
        it.awaiting = undefined;
      }
      // otherwise: stale receipt — journaled history, no closure effect.
      return state;
    }

    case 'duplicate_confirmation':
      return state; // marker only

    case 'confirmation_invalidated': {
      const it = itemOf(state, p.item_id as string, seq);
      const ac = it.active_confirmation;
      if (ac && ac.attempt_id === p.attempt_id) {
        ac.active = false;
        if (it.status === 'DIRECTOR_CONFIRMED') {
          // Back to awaiting: the inspected revision drifted under the
          // confirmation — a new review is required.
          it.status = 'AWAITING_DIRECTOR';
          it.awaiting = { attempt_id: p.attempt_id as string, since_seq: seq, since_at: rec.at };
        }
      }
      return state;
    }

    case 'contract_amended': {
      const it = itemOf(state, p.item_id as string, seq);
      Object.assign(it.contract, p.patch as object);
      it.contract.contract_hash = contractHashOf(it.contract);
      // A changed contract invalidates pending confirmations: the intent
      // being confirmed is no longer what was inspected.
      if (it.active_confirmation) it.active_confirmation.active = false;
      if (it.status === 'DIRECTOR_CONFIRMED') {
        it.status = 'AWAITING_DIRECTOR';
        it.awaiting = { attempt_id: latestAttempt(it)?.attempt_id ?? '', since_seq: seq, since_at: rec.at };
      }
      return state;
    }

    case 'final_gate_passed': {
      const it = itemOf(state, p.item_id as string, seq);
      // Confirmed = an active confirmation OR a contract that waived it.
      const confirmedOk = it.active_confirmation?.active || !it.contract.requires_director_confirmation;
      if (it.status === 'DIRECTOR_CONFIRMED' && confirmedOk) {
        transition(it, 'CLOSED', seq, (p.cause as string) ?? 'all_conditions_passed');
      }
      return state;
    }

    case 'final_gate_failed': {
      const it = itemOf(state, p.item_id as string, seq);
      if (it.status === 'DIRECTOR_CONFIRMED') {
        it.status = 'BLOCKED_VERIFY';
        it.blocked_reason = 'missing_mandatory_check';
        it.next_action = 'retry_after_env_fix';
      }
      return state;
    }

    case 'item_reopened': {
      const it = itemOf(state, p.item_id as string, seq);
      if (it.status === 'CLOSED' || it.status === 'WITHDRAWN') {
        transition(it, 'OPEN', seq, (p.reason as string) ?? 'reopened');
      }
      return state;
    }

    case 'item_withdrawn': {
      const it = itemOf(state, p.item_id as string, seq);
      it.status = 'WITHDRAWN';
      it.awaiting = undefined;
      return state;
    }

    case 'item_prioritized': {
      itemOf(state, p.item_id as string, seq); // validates existence
      return state; // ordering is a queue-view concern (T-005), not state
    }

    /* PLAN-078 T-004 — Sentinel evidence channel: attach proof to an
     * existing item without changing its status, EXCEPT the guarded
     * reopen: a CLOSED/WITHDRAWN item whose payload carries a changed
     * `surface_manifest_hash` reopens (the surface it was verified on
     * has drifted). */
    case 'evidence_attached': {
      const it = itemOf(state, p.item_id as string, seq);
      const priorHash = (p.prior_manifest_hash as string) ?? null;
      const nextHash = (p.surface_manifest_hash as string) ?? null;
      const drifted = priorHash !== null && nextHash !== null && priorHash !== nextHash;
      if ((it.status === 'CLOSED' || it.status === 'WITHDRAWN') && drifted) {
        transition(it, 'OPEN', seq, 'evidence_attached:surface-manifest-changed');
      }
      return state;
    }

    case 'lock_acquired':
    case 'lock_released':
      return state; // surface locks are reconstructed by the lock module (T-003)

    default:
      return state; // forward-compatible: unknown events are journaled, ignored
  }
}

/** Fold the full journal into the authoritative item view. */
export function deriveState(records: JournalRecord[]): LedgerState {
  const state: LedgerState = { items: new Map(), confirmations: new Map() };
  for (const rec of records) reduceRecord(state, rec);
  return state;
}

/* ------------------------------------------------------------------ */
/* Derived queue view — the queue is never a second copy (artifact r012) */
/* ------------------------------------------------------------------ */

export type QueueClass = 'closed' | 'blocked' | 'awaiting_director' | 'awaiting_stale' | 'running' | 'needs_correction' | 'needs_plan' | 'eligible';

export function classify(it: WorkItem, nowSeq: number, awaitTtlSeq = 0): QueueClass {
  if (it.status === 'CLOSED') return 'closed';
  if (it.status === 'BLOCKED_VERIFY' || it.status === 'BLOCKED_VERIFY_TERMINAL') return 'blocked';
  if (it.status === 'NEEDS_PLAN') return 'needs_plan';
  if (it.status === 'AWAITING_DIRECTOR') {
    if (awaitTtlSeq > 0 && it.awaiting && nowSeq - it.awaiting.since_seq > awaitTtlSeq) return 'awaiting_stale';
    return 'awaiting_director';
  }
  if (it.status === 'RUNNING' || it.status === 'VERIFYING' || it.status === 'DIRECTOR_CONFIRMED') return 'running';
  if (it.status === 'RETRY_PENDING' || it.status === 'OPEN') return 'needs_correction';
  return 'eligible'; // READY
}

/** Human-readable report: closed / blocked / awaiting / needs correction. */
export function queueReport(state: LedgerState, nowSeq: number, awaitTtlSeq = 0): Record<QueueClass, string[]> {
  const out: Record<QueueClass, string[]> = {
    closed: [], blocked: [], awaiting_director: [], awaiting_stale: [], running: [], needs_correction: [], needs_plan: [], eligible: [],
  };
  for (const it of state.items.values()) {
    out[classify(it, nowSeq, awaitTtlSeq)].push(it.item_id);
  }
  return out;
}
