/**
 * gateRegistry — the gate runner registry (PLAN-029 SP-3 T-2).
 *
 * The orchestrator resolves its runner list from here; SP-4 registers
 * the MC async runner through `registerDiagnosticRunner` with ZERO
 * edits to the orchestrator — the whole point of the registry.
 *
 * Hard gates are a fixed pair registered at module init. Diagnostic
 * runner ids MUST be in `DIAGNOSTIC_GATE_IDS` — unknown ids and
 * duplicate registrations throw at registration time (module init),
 * never mid-run.
 */

import { DIAGNOSTIC_GATE_IDS, type DiagnosticGateId } from '../generation/diagnosticGates';
import type { GateResult, HardGateId } from './types';

/** Input every gate receives — the raw boundary value plus lab context. */
export interface GateInput {
  /** The scenario — UNVALIDATED boundary data (unknown). The schema
   *  gate narrows it; downstream gates run only after schema PASS. */
  readonly scenario: unknown;
  /** The entry id (catalog or candidate) for the report header. */
  readonly entryId: string;
  /** Kit id when known — vocab/purity checks need it. */
  readonly kitId?: string;
  /** The flat kit payload when the entry came from generation. */
  readonly kit?: unknown;
  /** POI journey config when a POI target is declared (journeyDag). */
  readonly poiJourney?: unknown;
}

/** A synchronous gate runner. */
export interface GateRunner {
  readonly id: string;
  run(input: GateInput): Omit<GateResult, 'id' | 'kind'>;
}

/** An async gate runner (MC slot) — signal-aware. */
export interface AsyncGateRunner {
  readonly id: string;
  readonly async: true;
  run(input: GateInput, ctx: { signal?: AbortSignal }): Promise<Omit<GateResult, 'id' | 'kind'>>;
}

const hardRunners = new Map<HardGateId, GateRunner>();
const diagRunners = new Map<DiagnosticGateId, GateRunner | AsyncGateRunner>();

/** Register a hard gate — the fixed pair, no others accepted. */
export function registerHardGate(id: HardGateId, runner: GateRunner): void {
  if (id !== 'schema' && id !== 'graph') {
    throw new Error(`gateRegistry: '${id}' is not a hard gate id`);
  }
  if (hardRunners.has(id)) throw new Error(`gateRegistry: hard gate '${id}' already registered`);
  hardRunners.set(id, runner);
}

/** Register a diagnostic runner (sync or async) — id must be in the tuple. */
export function registerDiagnosticRunner(
  id: DiagnosticGateId,
  runner: GateRunner | AsyncGateRunner,
): void {
  if (!DIAGNOSTIC_GATE_IDS.includes(id)) {
    throw new Error(`gateRegistry: '${id}' is not a ratified diagnostic gate id`);
  }
  if (diagRunners.has(id)) throw new Error(`gateRegistry: diagnostic '${id}' already registered`);
  diagRunners.set(id, runner);
}

/** The resolved runner lists — deterministic order. */
export interface ResolvedGates {
  readonly hard: readonly { id: HardGateId; runner: GateRunner }[];
  readonly diagnostics: readonly {
    id: DiagnosticGateId;
    runner?: GateRunner | AsyncGateRunner;
  }[];
}

/**
 * Resolve gates in execution order: schema → graph → diagnostics in
 * tuple order (sync) → async diagnostics last. Admitted-but-unregistered
 * ids surface as `runner: undefined` → NOT_RUN{notImplemented} rows.
 */
export function resolveGates(): ResolvedGates {
  const hard = (['schema', 'graph'] as const).flatMap((id) => {
    const r = hardRunners.get(id);
    return r ? [{ id, runner: r }] : [];
  });
  const diagnostics = DIAGNOSTIC_GATE_IDS.map((id) => ({
    id,
    runner: diagRunners.get(id),
  }));
  return { hard, diagnostics };
}

/** Test seam — drop every registration (module state reset). */
export function _resetGatesForTests(): void {
  hardRunners.clear();
  diagRunners.clear();
}
