/**
 * useExpeditionRail — UI state of the docked left Roster|Stash column
 * (R-339 / PLAN-119 T5, mw-debate artifact-r004 D1/D2).
 *
 * The rail is a shared surface: the page mounts it, the cassetto's empty
 * party seats summon it (`onOpenRoster`), and the mutual-exclusion rule
 * (<1100px: only one side surface expanded) folds it when the drawer takes
 * the screen. That cross-component reach makes it Zustand, not Context.
 *
 * `expanded` defaults to true — D2: the column is persistent (expanded) by
 * default; the collapse chip is its only folded form. `mutexCollapsed`
 * records a fold the user never asked for: when the drawer releases the
 * narrow viewport the rail restores itself (state preserved).
 */
import { create } from 'zustand';

export type ExpeditionRailTab = 'roster' | 'stash';

interface ExpeditionRailState {
  expanded: boolean;
  tab: ExpeditionRailTab;
  /** True when the current collapse was forced by drawer mutual exclusion
   *  (not by the user) — the rail restores when the drawer yields. */
  mutexCollapsed: boolean;
  /** Open the rail on a tab (empty party seat → 'roster'; stash summon → 'stash'). */
  open: (tab: ExpeditionRailTab) => void;
  setTab: (tab: ExpeditionRailTab) => void;
  setExpanded: (expanded: boolean) => void;
  /**
   * Apply/withdraw drawer mutual exclusion. `active` = the right drawer is
   * open inside the narrow band. A user-collapse stays collapsed either way;
   * a mutex-collapse auto-restores when `active` goes false.
   */
  applyDrawerMutex: (active: boolean) => void;
}

export const useExpeditionRail = create<ExpeditionRailState>((set) => ({
  expanded: true,
  tab: 'roster',
  mutexCollapsed: false,
  open: (tab) => set({ expanded: true, tab, mutexCollapsed: false }),
  setTab: (tab) => set({ tab }),
  setExpanded: (expanded) => set({ expanded, mutexCollapsed: false }),
  applyDrawerMutex: (active) =>
    set((s) => {
      if (active && s.expanded) return { expanded: false, mutexCollapsed: true };
      if (!active && s.mutexCollapsed) return { expanded: true, mutexCollapsed: false };
      return s;
    }),
}));
