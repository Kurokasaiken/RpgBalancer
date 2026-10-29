/**
 * questEditor/editedCandidate — Save/Approve/Export verbs (PLAN-102 T-9).
 * Candidate = LabCandidate + editedProvenance (non-breaking extension).
 * Export = qgl-export-v1 envelope with preflight refusal (D2/W-04).
 */
import { EXPORT_ENVELOPE_VERSION, type ExportEnvelope } from '@/ui/idleVillage/questGenLab/exportEnvelope';
import { SCHEMA_VERSION, ENGINE_VERSION } from '@/balancing/config/idleVillage/quests/generation/versions';
import { computeScenarioVersion } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { LabCandidate } from '@/ui/idleVillage/questGenLab/candidate';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { ScenarioDiagnostics } from './validation';
import { FORK_FIDELITY_MANIFEST } from './validation';
import type { WorkingCopy } from './workingCopy';
import { derive } from './workingCopy';

export interface EditedProvenance {
  kind: 'edited';
  /** Minimal IT write (W-03): `${nodeId}.${field}` → IT text. */
  overlayEdits?: Record<string, string>;
  parentSource: 'catalog' | 'candidate' | 'authored' | 'envelope';
  parentRef: string;
  parentScenarioHash: string;
  editSummary: { opCount: number; ops: string[] };
  /** Waived fork-fidelity keys — travel in the envelope (W-04). */
  fidelityWaivers: string[];
}

export type EditedCandidate = LabCandidate & { editedProvenance?: EditedProvenance };

/** Fork gate (W-04): authored parent → un-waived manifest items block Approve. */
export function unwaivedFidelityItems(parentSource: string, parentRef: string, waived: ReadonlySet<string>) {
  if (parentSource !== 'authored') return [];
  return (FORK_FIDELITY_MANIFEST[parentRef] ?? []).filter((i) => !waived.has(i.key));
}

/** Build the edited candidate — caller runs the W-04 gate first. */
export function buildEditedCandidate(wc: WorkingCopy, parent: EditedProvenance['parentSource'], parentRef: string, waivers: string[], overlayEdits: Record<string, string> = {}): EditedCandidate {
  const scenario = derive(wc);
  return {
    id: `cand-${computeScenarioVersion(scenario).slice(0, 8)}-edit`,
    scenario,
    scenarioHash: computeScenarioVersion(scenario),
    provenance: { gimmickId: 'edited', kitId: 'edited', kitHash: computeScenarioVersion(scenario), effectiveKit: {}, effectiveTuning: {} },
    editedProvenance: {
      kind: 'edited', parentSource: parent, parentRef,
      parentScenarioHash: computeScenarioVersion(wc.base),
      editSummary: { opCount: wc.ops.length, ops: wc.ops.map((o) => o.kind) },
      fidelityWaivers: waivers,
      overlayEdits,
    },
  };
}

/** Export envelope for an edited candidate — preflight refuses invalid data. */
export function buildEditedExportEnvelope(c: EditedCandidate, diag: ScenarioDiagnostics): ExportEnvelope {
  if (!diag.valid) throw new Error(`export refused — ${diag.schemaErrors.length} schema errors, ${diag.dangling.length} dangling refs`);
  return {
    envelopeVersion: EXPORT_ENVELOPE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    generatorVersion: 'quest-editor',
    engineVersion: ENGINE_VERSION,
    gimmickId: c.editedProvenance ? `edited:${c.editedProvenance.parentRef}` : 'edited',
    kit: {}, tuning: {},
    generationReceipt: { scenarioHash: c.scenarioHash, kitHash: c.scenarioHash, generatedAt: new Date().toISOString(), provenance: 'edited' as ExportEnvelope['generationReceipt']['provenance'] },
    editedProvenance: c.editedProvenance,
    scenario: c.scenario,
  } as ExportEnvelope;
}
