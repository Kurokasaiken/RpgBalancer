/**
 * useExpeditionDrawer — UI state of the docked right expedition drawer
 * (R-339 / PLAN-119 T2, mw-debate artifact-r004).
 *
 * The drawer mirrors the left rail's fold contract (T5): while a quest is
 * selected its only folded form is a slim chip docked on the right edge —
 * expanding restores the signed column with the session state untouched
 * (the fold is visual, the planner detail stays open). The no-quest resting
 * form is NOT here: that is `ExpeditionEdgeTab`, a different surface mounted
 * by the page when no detail is open.
 *
 * Zustand (not Context) for the same reason as `useExpeditionRail`: the
 * drawer mounts deep inside the session's `wrapDetail`, while sibling
 * surfaces (rail mutex, future T8 sheet) may need to steer the fold from
 * outside. `expanded` survives detail remounts — folding is user intent,
 * preserved across a quest switch the same way the rail remembers its tab.
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
