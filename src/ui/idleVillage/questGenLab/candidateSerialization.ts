/**
 * candidateSerialization — the SP-6 seam (PLAN-029 SP-2 T-2).
 *
 * Serialization boundary, not a live store interface: SP-6 wires
 * PersistenceService to `serializeCandidates`/`hydrateCandidates`;
 * components never see persistence. Hydration is all-or-nothing: any
 * malformed candidate → `null` (the caller treats it as "nothing to
 * restore"), never a partial list.
 */

import { z } from 'zod';
import type { JsonValue } from '@/balancing/config/idleVillage/quests/generation/canonicalize';
import { QuestScenarioSchema } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { LabCandidate } from './candidate';

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

const CandidateProvenanceSchema = z
  .object({
    gimmickId: z.enum(['race', 'flood-vault']),
    kitId: z.string().min(1),
    kitHash: z.string().min(1),
    effectiveKit: JsonValueSchema,
    effectiveTuning: JsonValueSchema,
  })
  .strict();

/** The persisted shape of a LabCandidate — the SP-6 storage contract. */
export const LabCandidateSchema: z.ZodType<LabCandidate> = z
  .object({
    id: z.string().min(1),
    scenario: QuestScenarioSchema,
    scenarioHash: z.string().min(1),
    provenance: CandidateProvenanceSchema,
    supersedes: z.string().min(1).optional(),
  })
  .strict();

/**
 * Serialize the candidate list for persistence.
 * @param cs the candidate list (order preserved).
 */
export function serializeCandidates(cs: readonly LabCandidate[]): JsonValue {
  return cs.map((c) => ({
    id: c.id,
    scenario: c.scenario as unknown as JsonValue,
    scenarioHash: c.scenarioHash,
    provenance: { ...c.provenance },
    ...(c.supersedes ? { supersedes: c.supersedes } : {}),
  }));
}

/**
 * Parse a persisted payload back into candidates. All-or-nothing.
 * @param raw unknown persisted payload.
 * @returns the candidate list, or null if the payload is malformed.
 */
export function hydrateCandidates(raw: unknown): LabCandidate[] | null {
  const parsed = z.array(LabCandidateSchema).safeParse(raw);
  return parsed.success ? parsed.data : null;
}
