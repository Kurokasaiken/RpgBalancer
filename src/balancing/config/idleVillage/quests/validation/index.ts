/**
 * validation/index — registers the v1 gate runners and re-exports the
 * orchestrator surface (PLAN-029 SP-3). Import this module (not the
 * pieces) so the registry is populated before `resolveGates` runs.
 */

import { registerDiagnosticRunner, registerHardGate } from './gateRegistry';
import {
  copyGate,
  graphGate,
  hookCoverageGate,
  journeyDagGate,
  schemaGate,
  vocabCoherenceGate,
} from './gates';
import { mcDiagnosticRunner } from './mcGate';
import { validationConfig } from './validationConfig';

registerHardGate('schema', schemaGate);
registerHardGate('graph', graphGate);
registerDiagnosticRunner('hookCoverage', hookCoverageGate(validationConfig));
registerDiagnosticRunner('vocabCoherence', vocabCoherenceGate);
registerDiagnosticRunner('copyGate', copyGate);
registerDiagnosticRunner('journeyDag', journeyDagGate);
/* mcDiagnostic: real async runner registered by SP-4 — zero
 * orchestrator edits, the registry slot worked as designed. */
registerDiagnosticRunner('mcDiagnostic', mcDiagnosticRunner);
/* graphCoverage: no runner yet → NOT_RUN{notImplemented} row. */

export { runValidation, optOutsFor } from './orchestrator';
export type { GateInput, GateRunner, AsyncGateRunner } from './gateRegistry';
export { registerDiagnosticRunner } from './gateRegistry';
export type {
  GateId,
  GateIssue,
  GateResult,
  GateStatus,
  ValidationReport,
} from './types';
export { rollup } from './types';
export { validationConfig } from './validationConfig';
