import { useEffect, useState } from 'react';
import { regionalWeatherConfigRef, type RegionalWeatherLiveConfig } from '@/ui/idleVillage/config/mappa2RegionalWeatherConfig';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

/**
 * PLAN-098: sky-tab controls for the regional weather overlay (mist + embers).
 * Live-writes `regionalWeatherConfigRef` (read every tick by the overlay —
 * no Pixi rebuild) and persists through PersistenceService under its own
 * leaf key, so the mappa2-lab hot file keeps its <=2-line diff (T-13).
 */

const STORAGE_KEY = 'mappa2-lab:regionalWeather:v1';
type WeatherPatch = Partial<RegionalWeatherLiveConfig>;

export function RegionalAtmosphereControls() {
  const [, bump] = useState(0);
  useEffect(() => {
    void loadData<WeatherPatch | null>(STORAGE_KEY, null).then((saved) => {
      if (saved && typeof saved === 'object') {
        Object.assign(regionalWeatherConfigRef.current, saved);
        bump((n) => n + 1);
      }
    }).catch(() => undefined);
  }, []);
  const cfg = regionalWeatherConfigRef.current;
  const set = (patch: WeatherPatch) => {
    Object.assign(cfg, patch);
    bump((n) => n + 1);
    void saveData(STORAGE_KEY, { ...cfg }).catch(() => undefined);
  };
  return (
    <div data-testid="regional-atmosphere-controls" style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 6 }}>
      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> regional weather
      </label>
      <label style={{ display: 'block', marginTop: 4 }}>
        mist {Math.round(cfg.mist * 100)}%
        <input type="range" min={0} max={1} step={0.05} value={cfg.mist} onChange={(e) => set({ mist: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>
      <label style={{ display: 'block', marginTop: 4 }}>
        volcano smoke {Math.round((cfg.volcano ?? 0) * 100)}%
        <input type="range" min={0} max={1} step={0.05} value={cfg.volcano ?? 0} onChange={(e) => set({ volcano: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>
      <label style={{ display: 'block', marginTop: 4 }}>
        storm clouds {Math.round((cfg.orographic ?? 0) * 100)}%
        <input type="range" min={0} max={1} step={0.05} value={cfg.orographic ?? 0} onChange={(e) => set({ orographic: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>
      <label style={{ display: 'block', marginTop: 4 }}>
        north river {Math.round((cfg.river ?? 1) * 100)}%
        <input type="range" min={0} max={1} step={0.05} value={cfg.river ?? 1} onChange={(e) => set({ river: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>
      <label style={{ display: 'block', marginTop: 4 }}>
        weather speed {cfg.speed.toFixed(2)}x
        <input type="range" min={0.25} max={3} step={0.05} value={cfg.speed} onChange={(e) => set({ speed: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>
      <label style={{ display: 'block', marginTop: 4 }}>
        weather opacity {Math.round(cfg.opacity * 100)}%
        <input type="range" min={0} max={1} step={0.05} value={cfg.opacity} onChange={(e) => set({ opacity: Number(e.target.value) })} style={{ width: '100%' }} />
      </label>
    </div>
  );
}
