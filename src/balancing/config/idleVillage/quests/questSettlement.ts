/**
 * questSettlement — config-first settlement rules (PLAN-019-S2.5 T-2).
 *
 * Maps a terminal `QuestRunState` onto village consequences. Values here are
 * the only source: no thresholds or durations hardcoded in the service.
 */
import { z } from 'zod';

/** Severity palette for the village event-log lines a settlement writes. */
const logSeveritySchema = z.enum(['info', 'success', 'warning', 'error']);

const questSettlementSchema = z
  .object({
    /**
     * Recovery length for a quest wound, in caller ticks (the run tick —
     * `globalRules.dayLengthInTimeUnits` is the day length; 1 day = 5 ticks
     * in the current config). A wounded member comes home `injured` until
     * `settleTick + woundRecoveryTicks`.
     */
    woundRecoveryTicks: z.number().int().positive(),
    /**
     * Severities for the event-log lines written by `applyPlanToState`
     * (PLAN-019-S4 T-1). `outcome` is keyed by `run.outcome`; a run outcome
     * missing from the record falls back to `outcomeFallback`.
     */
    logSeverity: z.object({
      outcome: z.record(z.string(), logSeveritySchema),
      outcomeFallback: logSeveritySchema,
      residentDead: logSeveritySchema,
      residentWounded: logSeveritySchema,
      villageGold: logSeveritySchema,
      villageXp: logSeveritySchema,
    }),
  })
  .strict();

export type QuestSettlementConfig = z.infer<typeof questSettlementSchema>;

export const QUEST_SETTLEMENT: QuestSettlementConfig = questSettlementSchema.parse({
  woundRecoveryTicks: 5,
  logSeverity: {
    outcome: {
      reward: 'success',
      survived: 'info',
      fled: 'warning',
      wipe: 'error',
    },
    outcomeFallback: 'info',
    residentDead: 'error',
    residentWounded: 'warning',
    villageGold: 'success',
    villageXp: 'success',
  },
});
