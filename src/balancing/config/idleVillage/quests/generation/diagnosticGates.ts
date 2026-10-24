/**
 * diagnosticGates — the ratified inventory of lab diagnostic gates
 * (PLAN-029 SP-1 T-2, Director ruling 2026-10-23).
 *
 * This tuple is the single source both `QUEST_GEN_LAB_CONTRACTS.md` §6
 * (the audit inventory table) and `gimmickRegistry.ts` (per-row
 * `declaredOptOuts`) import. Diagnostics are WARNING-class at most and
 * NEVER block lab run-entry in v1 — hard gates (schema parse, graph
 * integrity via superRefine) are deliberately absent from this tuple:
 * a registry row cannot opt out of a gate it cannot name.
 *
 * Applicability semantics (contract doc §6): each gate declares when it
 * applies; a gate that does not apply reports NOT_APPLICABLE — a status
 * distinct from PASS, never a suppressed pass.
 */

export const DIAGNOSTIC_GATE_IDS = [
  /** Every scenario node/option traversed in exploration (surface:
   *  `exploreScenarioGraph`). */
  'graphCoverage',
  /** Kit copy ↔ DomainVocab (mayInvent/vietati/threat coherence). */
  'vocabCoherence',
  /** ≥75% scenes carrying a hook — counting definition owned by SP-3. */
  'hookCoverage',
  /** MC outcome distribution vs offer band (thresholds in lab config;
   *  surface: `simulateQuestAsync` + `deriveOfferBand`). */
  'mcDiagnostic',
  /** Narrated-kit copy validity (surface: `validateCopy` + arc contract). */
  'copyGate',
  /** Scenario×POI journey legality (`validateQuestJourneyDag`). Applies
   *  ONLY when a POI target is declared — export-seam gate per
   *  AMEND-2(b), optional diagnostic in the lab otherwise. */
  'journeyDag',
] as const;

/** A lab diagnostic gate id — the only ids a gimmick row may opt out of. */
export type DiagnosticGateId = (typeof DIAGNOSTIC_GATE_IDS)[number];
