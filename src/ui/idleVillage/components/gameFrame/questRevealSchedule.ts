/**
 * questRevealSchedule — pure timing model of the `/game` quest-offer
 * auto-reveal (R-200, PLAN-037).
 *
 * Once the boot veil is gone, the authored offers mount one at a time on a
 * wall-clock stagger (`gameFrameConfig.questReveal`) and never hide again —
 * reveal is additive, not a toggle. This module owns the schedule math and
 * the reveal predicate so the page stays declarative and the timing is unit
 * testable without a browser.
 */

/** Wall-clock pacing of the offer entrances (reads `gameFrameConfig.questReveal`). */
export interface QuestRevealTiming {
  /** Delay between the veil's exit and the first offer's entrance, ms. */
  initialDelayMs: number;
  /** Gap between consecutive offer entrances, ms. */
  staggerMs: number;
}

/** One scheduled entrance: which offer mounts, after how many ms from the veil's exit. */
export interface QuestRevealEntry {
  poiId: string;
  delayMs: number;
}

/**
 * The stagger schedule in authored order (the `QUEST_POIS` array order:
 * goblin → rovine). Entry `i` mounts at `initialDelayMs + i × staggerMs`
 * after the veil is gone; consumed or expired offers simply mount nothing
 * when their turn comes (the anchor composition filters them as before).
 */
export function questRevealSchedule(
  pois: readonly { id: string }[],
  timing: QuestRevealTiming,
): QuestRevealEntry[] {
  return pois.map((poi, index) => ({
    poiId: poi.id,
    delayMs: timing.initialDelayMs + index * timing.staggerMs,
  }));
}

/**
 * Whether a quest offer's marker mounts right now. Any channel reveals it —
 * the Director's one-way «Show quest», the «POI types» family review, the
 * stagger clock — and a live run always mounts its own POI without waiting
 * for a reveal slot (a restored run can never appear hidden, R-200 D-5).
 * Nothing on this path un-reveals; only the offer's own lifecycle (expired
 * window with no run, consumed one-shot) still takes it off the map, through
 * the ghost exit.
 */
export function isQuestPoiRevealed(
  poiId: string,
  state: { revealAll: boolean; autoRevealedIds: ReadonlySet<string>; hasLiveRun: boolean },
): boolean {
  return state.revealAll || state.autoRevealedIds.has(poiId) || state.hasLiveRun;
}
