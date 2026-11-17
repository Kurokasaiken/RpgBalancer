/**
 * useExpeditionDrawer — UI state of the docked right expedition drawer
 * (R-339 / PLAN-119 T2, mw-debate artifact-r004).
 *
 * The drawer's fold contract (T5 shape — kept after the left Roster|Stash
 * rail was reverted; Director ruling 2026-11-15: roster e stash restano
 * superfici sempre separate): while a quest is selected its only folded
 * form is a slim chip docked on the right edge — expanding restores the
 * signed column with the session state untouched (the fold is visual, the
 * planner detail stays open). The no-quest resting form is NOTHING — the
 * old `ExpeditionEdgeTab` was deleted (R-351, Director ruling 2026-11-15):
 * with no quest selected the page mounts no expedition surface at all.
 *
 * Zustand (not Context): the drawer mounts deep inside the session's
 * `wrapDetail`, while sibling surfaces (the future T8 sheet) may need to
 * steer the fold from outside. `expanded` survives detail remounts —
 * folding is user intent, preserved across a quest switch.
 */
import { create } from 'zustand';

interface ExpeditionDrawerState {
  /** True = the signed column is on screen; false = the right-edge chip. */
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

export const useExpeditionDrawer = create<ExpeditionDrawerState>((set) => ({
  expanded: true,
  setExpanded: (expanded) => set({ expanded }),
}));
