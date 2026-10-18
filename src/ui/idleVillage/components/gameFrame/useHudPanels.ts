import { useCallback, useEffect, useRef, useState } from 'react';

import { HUD_PANEL_DEFAULTS, HUD_PANEL_KEY_TO_ID, HUD_PANEL_SHORTCUTS, type HudPanelId } from './hudPanelRegistry';

export { HUD_PANEL_SHORTCUTS };
export type { HudPanelId };
export type HudPanelsApi = ReturnType<typeof useHudPanels>;

const DEFAULT_VISIBILITY = HUD_PANEL_DEFAULTS;

/**
 * Which floating panels are on screen, with a one-key shortcut each so closing a
 * panel is never a one-way door. Deliberately NOT persisted: opening the map
 * always lands on a clean HUD (all panels closed) instead of resurrecting the
 * screens that were open when the game was last saved (PLAN-031 follow-up).
 */
export interface UseHudPanelsOptions {
  enabled?: boolean;
  /**
   * PLAN-032 SP-1: a panel whose transitions live in its own controller (the hero
   * sheet's state machine) registers here. When `interceptToggle` returns true the
   * registry does NOT flip the flag — the controller transitions and then writes
   * the flag back with `set`, which is how the menu stays truthful while the
   * machine remains the single transition owner (no bidirectional sync).
   */
  interceptToggle?: (id: HudPanelId) => boolean;
}

export function useHudPanels({ enabled = true, interceptToggle }: UseHudPanelsOptions = {}) {
  const [visible, setVisible] = useState<Record<HudPanelId, boolean>>(DEFAULT_VISIBILITY);
  const interceptRef = useRef(interceptToggle);
  interceptRef.current = interceptToggle;

  const set = useCallback((id: HudPanelId, value: boolean) => {
    setVisible((current) => ({ ...current, [id]: value }));
  }, []);

  const toggle = useCallback((id: HudPanelId) => {
    if (interceptRef.current?.(id)) return;
    setVisible((current) => ({ ...current, [id]: !current[id] }));
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      const id = HUD_PANEL_KEY_TO_ID[event.key.toLowerCase()];
      if (id) toggle(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, enabled]);

  return { visible, set, toggle };
}
