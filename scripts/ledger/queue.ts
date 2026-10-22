/**
 * queue — tick linearizzato + selezione + assegnazione (PLAN-077 T-005).
 *
 * La coda è una VISTA derivata: `computeTick` è una funzione pura sullo
 * snapshot del journal al watermark — gli eventi ingeriti mentre il tick
 * gira non entrano nel calcolo (si vedono al tick successivo).
 *
 * Ordine interno del tick (artifact-r012):
 *   release → recompute → dedup → select
 *
 *  - release: implicito — `deriveLocks` ha già fatto cadere i lock morti;
 *  - recompute: eligible = READY con dipendenze chiuse e superficie libera;
 *  - dedup: un defect ancora aperto la cui intera superficie è coperta da
 *    un item appena CLOSED viene flaggato `suspect_fixed_by` (conservativo:
 *    mai chiuso, solo segnalato per review);
 *  - select: ordinamento stabile — priorità Director (`item_prioritized`,
 *    seq più recente vince) poi FIFO per seq di ingest (anti-starvation);
 *    cap esecuzione statico da config (pilota: 1), slot verifica separati
 *    dagli slot esecuzione (VERIFYING non occupa uno slot executor);
 *    `assignment_id` univoco = `asg-<tick>-<item>-<attempt>`.
 *
 * `runTick` applica le assegnazioni via dispatcher (validate-before-journal):
 * `attempt_started` + `lock_acquired` journaled in coppia — la prima
 * failure ferma il tick (mai assegnazione a metà senza il suo lock).
 */

import type { JournalRecord } from './ledgerCore';
import type { LedgerHandle } from './dispatcher';
import { deriveState, type LedgerState, type WorkItem } from './workItem';
import { conflictsFor, deriveLocks, keysFor, type SurfaceLock } from './surfaceLock';

export interface TickOptions {
  execution_cap: number; // static load controller (pilot: 4 — Director ruling R-262)
  verification_cap: number; // verify slots are NOT execution slots
}

export const PILOT_TICK: TickOptions = { execution_cap: 4, verification_cap: 2 };

export interface Assignment {
  assignment_id: string;
  item_id: string;
  attempt_id: string;
  attempt_token: string;
  keys: string[];
}

export type SkipReason = 'execution_cap' | 'surface_conflict' | 'dep_open' | 'not_eligible';

export interface TickResult {
  tick_id: number; // watermark the tick was computed on
  watermark: number;
  running_now: number;
  verifying_now: number;
  assignments: Assignment[];
  skipped: { item_id: string; reason: SkipReason; detail?: string }[];
  suspect_fixed: { item_id: string; suspect_fixed_by: string }[];
}

/** Last seq of `item_prioritized` per item — the Director's boost. */
function priorityOf(records: JournalRecord[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of records) {
    if (r.type === 'item_prioritized') m.set((r.payload as { item_id: string }).item_id, r.seq);
  }
  return m;
}

/** First seq at which each item was ingested — FIFO / anti-starvation. */
function ingestedAt(records: JournalRecord[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of records) {
    if (r.type === 'item_ingested') {
      const id = (r.payload as { item_id: string }).item_id;
      if (!m.has(id)) m.set(id, r.seq);
    }
  }
  return m;
}

function keysOf(it: WorkItem): string[] {
  return keysFor(it.contract.surfaces, it.contract.expected_files);
}

/**
 * Pure tick computation on a journal snapshot. `records` MUST be the
 * prefix up to the chosen watermark — linearization is by construction.
 */
export function computeTick(
  state: LedgerState,
  records: JournalRecord[],
  opts: TickOptions,
): TickResult {
  const watermark = records.length ? records[records.length - 1]!.seq : -1;
  const locks = deriveLocks(records, state);
  const prio = priorityOf(records);
  const born = ingestedAt(records);

  const running_now = [...state.items.values()].filter((i) => i.status === 'RUNNING').length;
  const verifying_now = [...state.items.values()].filter((i) => i.status === 'VERIFYING').length;

  // dedup: a still-open defect whose surface keys are a subset of the keys
  // a CLOSED item covered is suspect — flagged, never auto-closed.
  const closedKeys = new Map<string, string[]>(); // closed item → its keys
  for (const it of state.items.values()) {
    if (it.status === 'CLOSED') closedKeys.set(it.item_id, keysOf(it));
  }
  const suspect_fixed: TickResult['suspect_fixed'] = [];
  for (const it of state.items.values()) {
    if (it.kind !== 'defect' || !['OPEN', 'READY', 'RETRY_PENDING'].includes(it.status)) continue;
    const ks = keysOf(it);
    for (const [cid, cks] of closedKeys) {
      if (ks.length > 0 && ks.every((k) => cks.includes(k))) {
        suspect_fixed.push({ item_id: it.item_id, suspect_fixed_by: cid });
        break;
      }
    }
  }

  // select: eligible READY items, priority-desc then FIFO.
  const ready = [...state.items.values()]
    .filter((i) => i.status === 'READY')
    .sort((a, b) => (prio.get(b.item_id) ?? -1) - (prio.get(a.item_id) ?? -1)
      || (born.get(a.item_id) ?? 0) - (born.get(b.item_id) ?? 0));

  const assignments: Assignment[] = [];
  const skipped: TickResult['skipped'] = [];
  let execFree = Math.max(0, opts.execution_cap - running_now);
  // Track keys tentatively assigned INSIDE this tick (the journal doesn't
  // know them yet — two items can't race on the same surface in one tick).
  const taken = new Set<string>();

  for (const it of ready) {
    const ks = keysOf(it);
    const open = it.contract.depends_on.filter((d) => state.items.get(d)?.status !== 'CLOSED');
    if (open.length > 0) {
      skipped.push({ item_id: it.item_id, reason: 'dep_open', detail: open.join(',') });
      continue;
    }
    const conflicts = [
      ...conflictsFor(locks, ks, it.item_id).map((c) => c.key),
      ...ks.filter((k) => taken.has(k)),
    ];
    if (conflicts.length > 0) {
      skipped.push({ item_id: it.item_id, reason: 'surface_conflict', detail: [...new Set(conflicts)].join(',') });
      continue;
    }
    if (execFree === 0) {
      skipped.push({ item_id: it.item_id, reason: 'execution_cap' });
      continue;
    }
    execFree -= 1;
    const n = it.attempts.length + 1;
    const attempt_id = `att-${it.item_id}-${n}`;
    const attempt_token = `tok-${it.item_id}-a${n}-t${watermark}`;
    assignments.push({
      assignment_id: `asg-${watermark}-${it.item_id}-${attempt_id}`,
      item_id: it.item_id,
      attempt_id,
      attempt_token,
      keys: ks,
    });
    for (const k of ks) taken.add(k);
  }

  return { tick_id: watermark, watermark, running_now, verifying_now, assignments, skipped, suspect_fixed };
}

export interface TickRunResult extends TickResult {
  journaled: { assignment_id: string; item_id: string; ok: boolean; error?: string }[];
}

/**
 * Compute + apply a tick through the dispatcher. Journals, per assignment,
 * `tick_assignment` (the atomic record of the decision), `attempt_started`,
 * `lock_acquired` — first failure stops the tick (never half-assignments).
 */
export function runTick(L: LedgerHandle, opts: TickOptions = PILOT_TICK): TickRunResult {
  const v = L.validate();
  if (!v.ok || !v.history_complete) {
    return {
      tick_id: -1, watermark: -1, running_now: 0, verifying_now: 0,
      assignments: [], skipped: [], suspect_fixed: [],
      journaled: [],
    };
  }
  // State folded from the SAME snapshot — linearization by construction.
  const result = computeTick(deriveState(v.records), v.records, opts);
  const journaled: TickRunResult['journaled'] = [];

  for (const a of result.assignments) {
    const step = L.apply('tick_assignment', {
      tick_id: result.tick_id,
      assignment_id: a.assignment_id,
      item_id: a.item_id,
      attempt_id: a.attempt_id,
      watermark: result.watermark,
    });
    if (!step.applied) { journaled.push({ assignment_id: a.assignment_id, item_id: a.item_id, ok: false, error: step.error }); break; }
    const started = L.apply('attempt_started', {
      item_id: a.item_id, attempt_id: a.attempt_id, attempt_token: a.attempt_token,
      agent: 'dispatcher-tick', assignment_id: a.assignment_id,
    });
    if (!started.applied) { journaled.push({ assignment_id: a.assignment_id, item_id: a.item_id, ok: false, error: started.error }); break; }
    const locked = L.apply('lock_acquired', {
      item_id: a.item_id, attempt_id: a.attempt_id, attempt_token: a.attempt_token,
      surfaces: a.keys.filter((k) => k.startsWith('surf:')).map((k) => k.slice(5)),
      files: a.keys.filter((k) => k.startsWith('file:')).map((k) => k.slice(5)),
      assignment_id: a.assignment_id,
    });
    journaled.push({ assignment_id: a.assignment_id, item_id: a.item_id, ok: locked.applied, error: locked.error });
    if (!locked.applied) break;
  }
  return { ...result, journaled };
}

/** Rebuild live locks — exported for callers that need the raw map. */
export function locksOf(records: JournalRecord[], state: LedgerState): Map<string, SurfaceLock> {
  return deriveLocks(records, state);
}
