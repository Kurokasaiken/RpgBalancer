import { useEffect, useRef } from 'react';
import type { HudPanelId } from './hudPanelRegistry';

/**
 * Keeps a HUD panel on screen for as long as `open` is true, and gives it
 * back the way it was found (R-184): a panel that was already open stays open
 * afterwards, one the hook opened is closed again when `open` ends.
 *
 * Used by `/game` so that a POI detail (the quest planner) always has the
 * roster next to it — the planner is useless without the PG cards to drag —
 * without leaving the player's HUD rearranged once the detail is gone.
 *
 * `set` is `useHudPanels().set` (stable). Only the `open` edge matters: a
 * panel the player toggles by hand mid-detail is not fought over, and if the
 * hook opened it, the final close is idempotent.
 */
export function usePanelWhileOpen(
  panels: { visible: Record<HudPanelId, boolean>; set: (id: HudPanelId, value: boolean) => void },
  id: HudPanelId,
  open: boolean,
): void {
  const openedByUsRef = useRef(false);
  const visibleRef = useRef(panels.visible[id]);
  visibleRef.current = panels.visible[id];
  const { set } = panels;
  useEffect(() => {
    if (open) {
      if (!visibleRef.current) {
        openedByUsRef.current = true;
        set(id, true);
      }
    } else if (openedByUsRef.current) {
      openedByUsRef.current = false;
      set(id, false);
    }
  }, [open, id, set]);
}
