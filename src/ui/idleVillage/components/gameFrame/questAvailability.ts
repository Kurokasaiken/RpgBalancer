import type { PoiState } from '@/ui/idleVillage/components/poi/PoiMarker';

export interface QuestAvailability {
  /** 1 = the opportunity just appeared, 0 = it is gone. */
  progress: number;
  state: Extract<PoiState, 'available' | 'expiring' | 'expired'>;
}

/** Below this share of its window left, an opportunity reads as "expiring". */
export const EXPIRING_BELOW = 0.25;

/**
 * How much of a quest opportunity's window is left, on the game clock. Ticks, not wall time:
 * it stops when the game is paused and runs faster at ×2/×4, like everything else.
 */
export function questAvailability(
  currentTick: number,
  appearedTick: number,
  dayLengthTicks: number,
  availableDays: number,
): QuestAvailability {
  const windowTicks = Math.max(1, availableDays * dayLengthTicks);
  const progress = Math.min(1, Math.max(0, 1 - (currentTick - appearedTick) / windowTicks));
  return { progress, state: progress <= 0 ? 'expired' : progress < EXPIRING_BELOW ? 'expiring' : 'available' };
}
