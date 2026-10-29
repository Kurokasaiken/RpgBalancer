/**
 * exportEnvelope — the versioned candidate export contract (PLAN-029
 * SP-6). An envelope carries everything needed to reproduce the
 * generation: provenance inputs (gimmick/kit/tuning), the generation
 * receipt, an advisory validation snapshot, and the scenario itself.
 *
 * Import is STAGED: the payload is re-parsed (Zod) and the scenario is
 * re-validated before the candidate is staged — validation snapshots
 * travel as historical/advisory, never as fresh certification.
 */

import { z } from 'zod';
import {
  ENGINE_VERSION,
  SCHEMA_VERSION,
} from '@/balancing/config/idleVillage/quests/generation/versions';
import { gimmickRow, type GimmickId } from '@/balancing/config/idleVillage/quests/generation/gimmickRegistry';
import { QuestScenarioSchema } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { ValidationReport } from '@/balancing/config/idleVillage/quests/validation/types';
import type { LabCandidate } from './candidate';

export const EXPORT_ENVELOPE_VERSION = 'qgl-export-v1';

/** The versioned export envelope — one candidate, fully reproducible. */
export interface ExportEnvelope {
  readonly envelopeVersion: typeof EXPORT_ENVELOPE_VERSION;
  readonly schemaVersion: string;
  readonly generatorVersion: string;
  readonly engineVersion: string;
  readonly gimmickId: string;
  readonly kit: unknown;
  readonly tuning: unknown;
  readonly generationReceipt: {
    readonly scenarioHash: string;
    readonly kitHash: string;
    readonly generatedAt: string;
    readonly provenance: 'generated' | 'imported' | 'edited';
  };
  /** Historical/advisory snapshot — stale detection is by hash, not trust. */
  readonly validationSnapshot?: ValidationReport;
  readonly scenario: unknown;
}

export const ExportEnvelopeSchema = z
  .object({
    envelopeVersion: z.literal(EXPORT_ENVELOPE_VERSION),
    schemaVersion: z.string().min(1),
    generatorVersion: z.string().min(1),
    engineVersion: z.string().min(1),
    gimmickId: z.string().min(1),
    kit: z.unknown(),
    tuning: z.unknown(),
    generationReceipt: z.object({
      scenarioHash: z.string().min(1),
      kitHash: z.string().min(1),
      generatedAt: z.string().min(1),
      provenance: z.enum(['generated', 'imported', 'edited']),
    }),
    validationSnapshot: z.unknown().optional(),
    scenario: z.unknown(),
  })
  .passthrough();

/** Build an envelope from a live candidate. */
export function buildExportEnvelope(
  candidate: LabCandidate,
  opts: { validationSnapshot?: ValidationReport } = {},
): ExportEnvelope {
  const row = gimmickRow(candidate.provenance.gimmickId as GimmickId);
  return {
    envelopeVersion: EXPORT_ENVELOPE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    generatorVersion: row?.generatorVersion ?? 'unknown',
    engineVersion: ENGINE_VERSION,
    gimmickId: candidate.provenance.gimmickId,
    kit: candidate.provenance.effectiveKit,
    tuning: candidate.provenance.effectiveTuning,
    generationReceipt: {
      scenarioHash: candidate.scenarioHash,
      kitHash: candidate.provenance.kitHash,
      generatedAt: new Date().toISOString(),
      provenance: 'generated',
    },
    ...(opts.validationSnapshot ? { validationSnapshot: opts.validationSnapshot } : {}),
    scenario: candidate.scenario,
  };
}

/** Parse + re-validate an imported payload; null on any rejection. */
export function parseExportEnvelope(raw: unknown): ExportEnvelope | null {
  const env = ExportEnvelopeSchema.safeParse(raw);
  if (!env.success) return null;
  if (QuestScenarioSchema.safeParse(env.data.scenario).success === false) return null;
  return env.data as ExportEnvelope;
}
