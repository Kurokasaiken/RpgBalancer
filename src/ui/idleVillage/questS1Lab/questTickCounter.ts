/**
 * questTickCounter — the «elapsed/total ticks» label of the quest window's time bar.
 *
 * The halo projection (`questHaloProgress`, D-J) lets elapsed ticks keep growing while the
 * party waits for orders: a full bar means «waiting», not «finished». Painting that raw number
 * read «315/110 ticks» (audit F4, PLAN-067 T-A16, R-234). The counter never exceeds its total.
 */
import type { QuestHaloProgress } from './questSchedule';

export function tickCounterParams(halo: Pick<QuestHaloProgress, 'elapsedTicks' | 'durationTicks'>): { elapsed: number; total: number } {
  const total = Math.max(0, halo.durationTicks);
  return { elapsed: Math.min(Math.max(0, halo.elapsedTicks), total), total };
}
