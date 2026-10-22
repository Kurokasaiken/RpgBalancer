import { useCallback, useEffect, useRef, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { HUD_SCALE_KEY, parseHudScaleMode, resolveHudScale, setHudZoomFactor, type HudScaleControl, type HudScaleMode } from './hudScale';

/** Tauri v2 exposes `__TAURI_INTERNALS__` (the older `__TAURI__` only with `withGlobalTauri`). */
const isDesktopApp = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Interface size: stores the player's choice and applies it — natively as the
 * webview zoom in the desktop app, as a CSS `zoom` factor on the HUD chrome
 * layer in a browser (`cssZoom`, PLAN-043 WS-5). The browser path never touches
 * the Pixi canvas (it keeps its own camera scale); coordinate bridges inside
 * the chrome layer convert device px via `getHudZoomFactor()`.
 *
 * Desktop: the logical window size is `innerWidth × zoom`, so it does not move
 * when the zoom changes and the automatic mode cannot oscillate.
 * Browser: `innerWidth` is not affected by CSS zoom — same stability.
 */
export function useHudScale(): HudScaleControl {
  const desktop = isDesktopApp();
  const [mode, setMode] = useState<HudScaleMode>('auto');
  const [loaded, setLoaded] = useState(false);
  const [effective, setEffective] = useState(1);
  const applied = useRef(1);
  const failed = useRef(false);

  useEffect(() => {
    let alive = true;
    void loadData<unknown>(HUD_SCALE_KEY, 'auto').then((stored) => {
      if (!alive) return;
      setMode(parseHudScaleMode(stored));
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* Desktop path — native webview zoom; the chrome layer stays at CSS 1. */
  useEffect(() => {
    if (!desktop || !loaded) return undefined;
    setHudZoomFactor(1);
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

  /* Browser path — the factor is published to the chrome layer + the
   *  coordinate bridges; `innerWidth` ignores CSS zoom so `effective` is
   *  stable. Recomputed on resize and on every mode change. */
  useEffect(() => {
    if (desktop || !loaded) return undefined;
    const apply = () => {
      const target = resolveHudScale(mode, window.innerWidth, window.innerHeight);
      setEffective(target);
      setHudZoomFactor(target);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      setHudZoomFactor(1);
    };
  }, [desktop, loaded, mode]);

  const onChange = useCallback((next: HudScaleMode) => {
    setMode(next);
    void saveData(HUD_SCALE_KEY, next);
  }, []);

  return { mode, effective, onChange, cssZoom: desktop ? 1 : effective };
}
