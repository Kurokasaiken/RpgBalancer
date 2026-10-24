/**
 * orchestrator — the pure validation runner (PLAN-029 SP-3 T-8).
 *
 * Contract:
 * - Order: schema → graph → diagnostics in tuple order → async last.
 * - The ONLY short-circuit: a hard-gate content FAIL → every unexecuted
 *   downstream row = NOT_RUN{skipped} (skipped > notImplemented).
 * - Coverage invariant: `opts.gates` filters EXECUTION only — gates not
 *   requested still emit a row, NOT_RUN{skipped}; `runScope.full` is
 *   derived (requested ⊇ hard ∪ tuple).
 * - Abort: checked before each runner → remaining NOT_RUN{aborted}; an
 *   interrupted async runner emits NO partial row; completed rows kept.
 * - Thrown diagnostics → NOT_RUN{skipped}+execution:'threw';
 *   thrown hard → FAIL+execution:'threw'.
 * - Diagnostics never emit content FAIL; hard opt-out declarations are
 *   config errors → the gate STILL runs + a configIssues row appears.
 */

import { DIAGNOSTIC_GATE_IDS, type DiagnosticGateId } from '../generation/diagnosticGates';
import type { GimmickRow } from '../generation/gimmickRegistry';
import {
  resolveGates,
  type GateInput,
  type AsyncGateRunner,
  type GateRunner,
} from './gateRegistry';
import {
  rollup,
  type GateId,
  type GateIssue,
  type GateResult,
  type ValidationReport,
} from './types';

export interface RunValidationOpts {
  readonly signal?: AbortSignal;
  /** Execution filter — report rows cover the full inventory anyway. */
  readonly gates?: readonly GateId[];
  readonly sessionEpoch?: number;
  /** Declared per-row opt-outs (from the gimmick row, if any). */
  readonly declaredOptOuts?: readonly DiagnosticGateId[];
}

const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

function toResult(
  id: GateId,
  kind: 'hard' | 'diagnostic',
  r: Omit<GateResult, 'id' | 'kind'>,
  durationMs: number,
): GateResult {
  return { id, kind, durationMs, ...r };
}

const notRun = (
  id: GateId,
  kind: 'hard' | 'diagnostic',
  reason: NonNullable<GateResult['notRunReason']>,
): GateResult => ({
  id,
  kind,
  status: 'NOT_RUN',
  execution: 'ok',
  notRunReason: reason,
  summaryKey: `${id}.notRun`,
});

/**
 * Run the full gate inventory against a scenario.
 * @param input entry metadata + raw boundary scenario (unknown).
 * @param opts abort/filter/epoch options.
 * @returns the versioned report — always one row per inventory gate.
 */
export async function runValidation(
  input: GateInput,
  opts: RunValidationOpts = {},
): Promise<ValidationReport> {
  const { hard, diagnostics } = resolveGates();
  const configIssues: GateIssue[] = [];
  const requested = new Set<GateId>(opts.gates ?? [
    'schema',
    'graph',
    ...DIAGNOSTIC_GATE_IDS,
  ]);
  const optOuts = new Set(opts.declaredOptOuts ?? []);
  const aborted = () => opts.signal?.aborted === true;
  const results: GateResult[] = [];

  /** Queue bookkeeping: after a hard FAIL, everything pending → skipped. */
  let shortCircuited = false;

  const runSync = (
    id: GateId,
    kind: 'hard' | 'diagnostic',
    runner: GateRunner,
    optOut: boolean,
  ): GateResult => {
    if (aborted()) return notRun(id, kind, 'aborted');
    if (shortCircuited) return notRun(id, kind, 'skipped');
    if (!requested.has(id)) return notRun(id, kind, 'skipped');
    if (optOut) return notRun(id, kind, 'optOut');
    const t0 = now();
    try {
      const out = toResult(id, kind, runner.run(input), now() - t0);
      // hard content FAIL short-circuits downstream rows
      if (kind === 'hard' && out.status === 'FAIL') shortCircuited = true;
      // a diagnostic that returns FAIL is laundered to WARNING (never blocks)
      if (kind === 'diagnostic' && out.status === 'FAIL') {
        return { ...out, status: 'WARNING' };
      }
      return out;
    } catch {
      return kind === 'hard'
        ? toResult(
            id,
            kind,
            { status: 'FAIL', execution: 'threw', summaryKey: `${id}.threw` },
            now() - t0,
          )
        : toResult(
            id,
            kind,
            { status: 'NOT_RUN', execution: 'threw', notRunReason: 'skipped', summaryKey: `${id}.threw` },
            now() - t0,
          );
    }
  };

  // hard gates — opt-out on a hard gate is a config error, gate still runs
  for (const { id, runner } of hard) {
    const hardOptOut = (optOuts as Set<string>).has(id);
    if (hardOptOut) {
      configIssues.push({
        messageKey: 'gates.issues.hardOptOut',
        messageArgs: { id },
      });
    }
    results.push(runSync(id, 'hard', runner, false));
  }

  // sync diagnostics first, async last (execution order, tuple order inside)
  const syncDiags = diagnostics.filter(
    (d) => !(d.runner && (d.runner as AsyncGateRunner).async),
  );
  const asyncDiags = diagnostics.filter(
    (d) => d.runner && (d.runner as AsyncGateRunner).async,
  );

  for (const { id, runner } of syncDiags) {
    if (!runner) {
      results.push(
        requested.has(id) && !shortCircuited
          ? notRun(id, 'diagnostic', 'notImplemented')
          : notRun(id, 'diagnostic', 'skipped'),
      );
      continue;
    }
    results.push(runSync(id, 'diagnostic', runner as GateRunner, optOuts.has(id)));
  }

  for (const { id, runner } of asyncDiags) {
    if (aborted() || shortCircuited || !requested.has(id) || optOuts.has(id)) {
      results.push(
        notRun(
          id,
          'diagnostic',
          aborted() ? 'aborted' : shortCircuited || !requested.has(id) ? 'skipped' : 'optOut',
        ),
      );
      continue;
    }
    const t0 = now();
    try {
      const out = await (runner as AsyncGateRunner).run(input, { signal: opts.signal });
      if (aborted()) {
        results.push(notRun(id, 'diagnostic', 'aborted'));
      } else {
        const r = toResult(id, 'diagnostic', out, now() - t0);
        results.push(r.status === 'FAIL' ? { ...r, status: 'WARNING' } : r);
      }
    } catch {
      results.push(
        aborted()
          ? notRun(id, 'diagnostic', 'aborted')
          : toResult(
              id,
              'diagnostic',
              { status: 'NOT_RUN', execution: 'threw', notRunReason: 'skipped', summaryKey: `${id}.threw` },
              now() - t0,
            ),
      );
    }
  }

  const full = ['schema', 'graph', ...DIAGNOSTIC_GATE_IDS].every((id) =>
    requested.has(id as GateId),
  );

  return {
    reportVersion: 1,
    scenarioHash: (input as { scenarioHash?: string }).scenarioHash ?? '',
    entryId: input.entryId,
    createdAt: new Date().toISOString(),
    gates: results,
    aggregate: rollup(results),
    runScope: { requested: [...requested], full },
    sessionEpoch: opts.sessionEpoch,
    ...(configIssues.length ? { configIssues } : {}),
  };
}

/** Convenience: declared opt-outs from a gimmick row (or none). */
export function optOutsFor(row?: GimmickRow): readonly DiagnosticGateId[] {
  return row?.declaredOptOuts ?? [];
}
