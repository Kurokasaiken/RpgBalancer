import { useCallback, useEffect, useRef, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

import { HUD_PANEL_DEFAULTS, HUD_PANEL_SHORTCUTS, type HudPanelId } from './hudPanelRegistry';

export { HUD_PANEL_SHORTCUTS };
export type { HudPanelId };
export type HudPanelsApi = ReturnType<typeof useHudPanels>;

const STORAGE_KEY = 'hud_panels_v1';
const DEFAULT_VISIBILITY = HUD_PANEL_DEFAULTS;

/**
 * Which floating panels are on screen. Persisted through PersistenceService, with a
 * one-key shortcut each, so closing a panel is never a one-way door.
 */
export function useHudPanels({ enabled = true }: { enabled?: boolean } = {}) {
  const [visible, setVisible] = useState<Record<HudPanelId, boolean>>(DEFAULT_VISIBILITY);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    loadData<Partial<Record<HudPanelId, boolean>>>(STORAGE_KEY, {}).then((stored) => {
      if (cancelled) return;
      loaded.current = true;
      setVisible({ ...DEFAULT_VISIBILITY, ...stored });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const set = useCallback((id: HudPanelId, value: boolean) => {
    setVisible((current) => {
      const next = { ...current, [id]: value };
      void saveData(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const toggle = useCallback((id: HudPanelId) => {
    setVisible((current) => {
      const next = { ...current, [id]: !current[id] };
      void saveData(STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      const id = (Object.keys(HUD_PANEL_SHORTCUTS) as HudPanelId[]).find((key) => HUD_PANEL_SHORTCUTS[key] === event.key.toLowerCase());
      if (id) toggle(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, enabled]);

  return { visible, set, toggle };
}
