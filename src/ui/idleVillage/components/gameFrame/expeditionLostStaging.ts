/**
 * expeditionLostStaging — the Director «Expedition lost» beat (PLAN-067 T-C2, R-234, EXP = A).
 *
 * Returns a DEFEAT COPY of a run so the report can be shown on demand. The live run, the settlement and the
 * store are never touched: staging is presentation only. The fallen are the members of the copy's party
 * flagged dead; the copy keeps the rest of the run as it is.
 */
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';

export function stageExpeditionLost(run: QuestRunState): QuestRunState {
  const copy = structuredClone(run) as QuestRunState;
  copy.outcome = 'wipe';
  copy.ended = true;
  const fallen = copy.party.find((m) => !m.dead) ?? copy.party[0];
  if (fallen) {
    fallen.dead = true;
    /* T-C2: the staged fall is dated at the run's own clock, so the report shows a day as in a real defeat. */
    fallen.deadAtTick = copy.nowTick ?? copy.launchedAtTick;
  }
  return copy;
}
