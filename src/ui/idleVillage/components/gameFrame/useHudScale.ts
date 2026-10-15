import { useCallback, useEffect, useRef, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { HUD_SCALE_KEY, parseHudScaleMode, resolveHudScale, type HudScaleControl, type HudScaleMode } from './hudScale';

/** Tauri v2 exposes `__TAURI_INTERNALS__` (the older `__TAURI__` only with `withGlobalTauri`). */
const isDesktopApp = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Interface size for the desktop app: stores the player's choice and applies it as the native webview zoom.
 * Returns `undefined` in a browser (the menu hides the row; the browser's own zoom does the job).
 *
 * The logical window size is `innerWidth × zoom`, so it does not move when the zoom changes and the automatic
 * mode cannot oscillate.
 */
export function useHudScale(): HudScaleControl | undefined {
  const desktop = isDesktopApp();
  const [mode, setMode] = useState<HudScaleMode>('auto');
  const [loaded, setLoaded] = useState(false);
  const [effective, setEffective] = useState(1);
  const applied = useRef(1);
  const failed = useRef(false);

  useEffect(() => {
    if (!desktop) return undefined;
    let alive = true;
    void loadData<unknown>(HUD_SCALE_KEY, 'auto').then((stored) => {
      if (!alive) return;
      setMode(parseHudScaleMode(stored));
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [desktop]);

  useEffect(() => {
    if (!desktop || !loaded) return undefined;
    const apply = async () => {
      if (failed.current) return;
      const target = resolveHudScale(mode, window.innerWidth * applied.current, window.innerHeight * applied.current);
      if (Math.abs(target - applied.current) < 0.001) return;
      try {
        const { getCurrentWebview } = await import('@tauri-apps/api/webview');
        await getCurrentWebview().setZoom(target);
        applied.current = target;
        setEffective(target);
      } catch (error) {
        failed.current = true; // missing permission or no webview: stay at 1 and stop retrying
        console.warn('[useHudScale] could not set the webview zoom:', error);
      }
    };
    void apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [desktop, loaded, mode]);

  const onChange = useCallback((next: HudScaleMode) => {
    setMode(next);
    void saveData(HUD_SCALE_KEY, next);
  }, []);

  return desktop ? { mode, effective, onChange } : undefined;
}
