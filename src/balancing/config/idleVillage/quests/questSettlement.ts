/**
 * questSettlement — config-first settlement rules (PLAN-019-S2.5 T-2).
 *
 * Maps a terminal `QuestRunState` onto village consequences. Values here are
 * the only source: no thresholds or durations hardcoded in the service.
 */
import { z } from 'zod';

const questSettlementSchema = z
  .object({
    /**
     * Recovery length for a quest wound, in caller ticks (the run tick —
     * `globalRules.dayLengthInTimeUnits` is the day length; 1 day = 5 ticks
     * in the current config). A wounded member comes home `injured` until
     * `settleTick + woundRecoveryTicks`.
     */
    woundRecoveryTicks: z.number().int().positive(),
  })
  .strict();

export type QuestSettlementConfig = z.infer<typeof questSettlementSchema>;

export const QUEST_SETTLEMENT: QuestSettlementConfig = questSettlementSchema.parse({
  woundRecoveryTicks: 5,
});
