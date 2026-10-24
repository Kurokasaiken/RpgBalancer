/**
 * validation/types — the report contract for the lab validation
 * orchestrator (PLAN-029 SP-3 T-1; artifact r006).
 *
 * Two independent axes everywhere:
 * - `status` = the CONTENT verdict (PASS/FAIL/WARNING/NOT_RUN);
 * - `execution` = runner health (ok/threw/aborted) — infra defects are
 *   visible but never forge a content verdict. A diagnostic that throws
 *   reports NOT_RUN{skipped}+execution:'threw'; a hard gate that throws
 *   reports FAIL+execution:'threw'.
 */

import type { DiagnosticGateId } from '../generation/diagnosticGates';

export type GateStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_RUN';
export type HardGateId = 'schema' | 'graph';
export type GateId = HardGateId | DiagnosticGateId;
export type NotRunReason =
  | 'optOut'
  | 'aborted'
  | 'skipped'
  | 'notImplemented'
  | 'notApplicable';
export type ExecutionState = 'ok' | 'threw' | 'aborted';
export type GateKind = 'hard' | 'diagnostic';

/** A validation finding — carries keys+args, never resolved strings. */
export interface GateIssue {
  /** i18n key under `questGenLab.gates.issues.*` — the report never
   *  stores resolved copy. */
  readonly messageKey: string;
  readonly messageArgs?: Record<string, string | number>;
  /** DEV-only fallback text — never rendered in prod. */
  readonly message?: string;
}

/** One gate's outcome row — always emitted, one per registered gate. */
export interface GateResult {
  readonly id: GateId;
  readonly kind: GateKind;
  readonly status: GateStatus;
  readonly execution: ExecutionState;
  /** i18n key for the one-line summary (`questGenLab.gates.summary.*`). */
  readonly summaryKey: string;
  readonly issues?: readonly GateIssue[];
  readonly metrics?: Record<string, number | string | null>;
  readonly notRunReason?: NotRunReason;
  readonly durationMs?: number;
}

/** Scope the run was asked to cover — and what "full" would mean. */
export interface RunScope {
  readonly requested: readonly GateId[];
  /** Derived: requested ⊇ {hard} ∪ tuple. */
  readonly full: boolean;
}

/** A versioned validation report bound to the content hash it ran on. */
export interface ValidationReport {
  readonly reportVersion: 1;
  readonly scenarioHash: string;
  readonly entryId: string;
  readonly createdAt: string;
  readonly gates: readonly GateResult[];
  readonly aggregate: GateStatus;
  readonly runScope: RunScope;
  readonly sessionEpoch?: number;
  /** Misconfig rows (e.g. a row declaring an opt-out on a hard gate) —
   *  surface-level, never a gate row. */
  readonly configIssues?: readonly GateIssue[];
}

/** The aggregate verdict — FAIL > WARNING > (all-hard-PASS) PASS > NOT_RUN. */
export function rollup(gates: readonly GateResult[]): GateStatus {
  if (gates.some((g) => g.status === 'FAIL')) return 'FAIL';
  if (gates.some((g) => g.status === 'WARNING')) return 'WARNING';
  const hard = gates.filter((g) => g.kind === 'hard');
  if (hard.length > 0 && hard.every((g) => g.status === 'PASS')) return 'PASS';
  return 'NOT_RUN';
}
