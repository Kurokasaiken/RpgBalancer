/**
 * settlementTally — what the settled runs really paid and completed (PLAN-067 T-C3, R-234, SET = B).
 *
 * The game-over summary used to read the wrong fields (injured for «lost», the 0-based counter for «days», the
 * gold held for «earned», a hard 0 for «quests»). This pure tally is fed by each settlement once per run, and
 * `gameOverStats` reads the live state for the rest. Idempotent: a replayed settlement counts nothing twice.
 */
import type { SettlementPlan } from '@/ui/idleVillage/quests/questSettlement';

export interface SettlementTally {
  goldEarned: number;
  questsCompleted: number;
  settledRunIds: string[];
}

export const EMPTY_TALLY: SettlementTally = { goldEarned: 0, questsCompleted: 0, settledRunIds: [] };

export function tallyPlan(tally: SettlementTally, plan: SettlementPlan): SettlementTally {
  if (tally.settledRunIds.includes(plan.runId)) return tally;
  const gold = plan.effects
    .filter((e) => e.kind === 'village-gold')
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  return {
    goldEarned: tally.goldEarned + gold,
    questsCompleted: tally.questsCompleted + (plan.outcome === 'reward' ? 1 : 0),
    settledRunIds: [...tally.settledRunIds, plan.runId],
  };
}

interface StatsInput {
  currentDay: number;
  residents: ReadonlyArray<{ isDead?: boolean }>;
}

/** Live stats for the summary: the dead, and the day as the player reads it (game days count from 1). */
export function gameOverStats(state: StatsInput): { daysSurvived: number; residentsLost: number } {
  return {
    daysSurvived: state.currentDay + 1,
    residentsLost: state.residents.filter((r) => r.isDead).length,
  };
}
