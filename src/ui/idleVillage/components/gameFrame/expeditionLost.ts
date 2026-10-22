/**
 * expeditionLost — the model of the defeat report (PLAN-067 T-C2, R-234, EXP = A).
 *
 * A wiped expedition shows the fallen as tombstones (name and the day they fell) and the bag items the
 * party lost as ember tiles. Pure: the report paints it, the settlement already decided it.
 */
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';

export interface LostTomb { id: string; name: string; day: number | null }

export interface LostReportModel {
  tombs: LostTomb[];
}

/**
 * `day` is `null` until the run records the tick of each death: the run keeps only `launchedAtTick`, so the
 * report shows the fallen without a date rather than inventing one. (Open point, see T-C2 notes.)
 */
export function lostReportModel(run: QuestRunState): LostReportModel {
  const tombs = run.party
    .filter((m) => m.dead)
    .map((m) => ({ id: m.id, name: m.name, day: null as number | null }));
  return { tombs };
}
