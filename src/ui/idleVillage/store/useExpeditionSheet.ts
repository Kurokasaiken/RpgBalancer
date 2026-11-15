/**
 * useExpeditionSheet — UI state of the mobile expedition bottom sheet
 * (R-339 / PLAN-119 T8, mw-debate artifact-r004 D5).
 *
 * At viewports at or below `bottomSheet.maxWidthPx` the expedition surface
 * exists ONLY as a non-modal bottom sheet — the docked column and its chips
 * never mount (mutual exclusion of the lateral surfaces). The sheet snaps
 * between three detents tokenized in `cassettoLayoutConfig.bottomSheet`:
 * `peek` (the CTA row + safe-area), `half` and `full`.
 *
 * Zustand (not Context): the sheet mounts deep inside the session's
 * `wrapDetail`, and sibling surfaces may need to steer or read the detent
 * from outside — same reason `useExpeditionDrawer` is a store. The detent
 * survives detail remounts: where the player left the sheet is user intent.
 */
import { create } from 'zustand';

/** The three snap points of the sheet — `peek` is the resting detent. */
export type ExpeditionSheetDetent = 'peek' | 'half' | 'full';

interface ExpeditionSheetState {
  /** Current detent — `peek` shows the CTA row only, `half`/`full` the planner body. */
  detent: ExpeditionSheetDetent;
  setDetent: (detent: ExpeditionSheetDetent) => void;
}

export const useExpeditionSheet = create<ExpeditionSheetState>((set) => ({
  detent: 'peek',
  setDetent: (detent) => set({ detent }),
}));
