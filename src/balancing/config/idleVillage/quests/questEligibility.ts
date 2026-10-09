/**
 * questEligibility — which residents may be assigned to a quest POI slot
 * (PLAN-019-S2.4 T-1).
 *
 * The rules are config, not component code: the trusted roster↔slot stack
 * reads them through `questResidentEligibility` and expresses a failure as
 * `compatibilityState='invalid'` (grayscale, drag suppressed) — the frozen
 * mechanism, not a new guard.
 *
 * Director decisions baked in (2026-10-09):
 * - INJURED residents ARE assignable, with no warning — the penalty lives in
 *   the data (the S2.2 adapter derives reduced HP + stat modifiers, so the
 *   forecast accounts for it automatically).
 * - Dead / away / exhausted are not assignable.
 * - `inExpedition` is DERIVED from the persisted run (`run.party[].id` =
 *   residentId), never written as a separate flag.
 */
import { z } from 'zod';

const ResidentStatusValues = ['available', 'away', 'exhausted', 'injured', 'dead'] as const;

export const QuestEligibilitySchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    /** Statuses a resident may hold and still be assigned to a quest slot.
     *  'injured' is present by Director decision — no warning, the data
     *  carries the penalty. */
    assignableStatuses: z.array(z.enum(ResidentStatusValues)).min(1),
    /** Whether belonging to an unsettled run's party blocks assignment. */
    expeditionLocksResident: z.literal(true),
  })
  .strict();
export type QuestEligibility = z.infer<typeof QuestEligibilitySchema>;

/** Authored v0 — the slice's declared rules. */
export const QUEST_ELIGIBILITY: QuestEligibility = QuestEligibilitySchema.parse({
  schemaVersion: 1,
  assignableStatuses: ['available', 'injured'],
  expeditionLocksResident: true,
});
