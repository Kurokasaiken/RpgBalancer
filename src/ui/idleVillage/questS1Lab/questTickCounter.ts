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

/**
 * R-239 — the run window's time-bar label as an i18n key + params, in
 * player-facing terms: days while marching (`durationTicks` is an estimate
 * that can grow → `~{total}`), a named awaiting state when the bar
 * saturates (`pieno-in-attesa` — full bar, run not landed), the resolved
 * outcome once ended. Raw tick counts stay on lab surfaces.
 */
export function questRunTimeLabel(
  halo: QuestHaloProgress,
  run: { ended: boolean; outcome?: string },
  dayLengthTicks: number,
): { key: string; params?: Record<string, number> } {
  if (run.ended) {
    return { key: run.outcome === 'wipe' ? 'gameFrame.questWindow.noneReturned' : 'gameFrame.questWindow.returned' };
  }
  if (halo.status === 'pieno-in-attesa') {
    return { key: 'gameFrame.questWindow.awaiting' };
  }
  return {
    key: 'gameFrame.questWindow.dayEstimate',
    params: {
      day: Math.floor(Math.max(0, halo.elapsedTicks) / Math.max(1, dayLengthTicks)) + 1,
      total: Math.max(1, Math.ceil(halo.durationTicks / Math.max(1, dayLengthTicks))),
    },
  };
}
