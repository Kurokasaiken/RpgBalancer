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

/**
 * PLAN-067 T-B3 (R-234, QW-1 = B) — the quest bar is REAL time on a scale that stretches.
 *
 *   progress = elapsed / max(declared, elapsed + remaining)
 *
 * The bar is never full before the run ends (capped just under 1 until `ended`), and a run that
 * outlives its estimate does not jump back: the scale grows with the time still to play. Once the
 * declared estimate is passed, `overrunFrom` is where it sits on the bar — the part beyond it is the
 * overrun, drawn in ember.
 */
export interface TimeBarModel {
  progress: number;
  /** Position (0..1) of the declared estimate on the bar, only once the run has outlived it. */
  overrunFrom?: number;
}
export const TIMEBAR_NOT_FULL = 0.99;
export function timeBarModel(
  halo: Pick<QuestHaloProgress, 'elapsedTicks' | 'durationTicks'>,
  run: { ended: boolean },
  remainingTicks: number,
): TimeBarModel {
  const elapsed = Math.max(0, halo.elapsedTicks);
  const declared = Math.max(1, halo.durationTicks);
  const scale = Math.max(declared, elapsed + Math.max(1, remainingTicks));
  const overrun = elapsed > declared ? { overrunFrom: declared / scale } : {};
  if (run.ended) return { progress: 1, ...overrun };
  return { progress: Math.min(TIMEBAR_NOT_FULL, elapsed / scale), ...overrun };
}
