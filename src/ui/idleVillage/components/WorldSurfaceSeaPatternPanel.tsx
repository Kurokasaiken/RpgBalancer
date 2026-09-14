import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useReducedMotion from '../hooks/useReducedMotion';
import type { SeaPatternConfig } from './WorldSurfaceSeaPatternOverlay';

export interface WorldSurfaceSeaPatternPanelProps {
  config: SeaPatternConfig;
  onChange: <K extends keyof SeaPatternConfig>(key: K, value: SeaPatternConfig[K]) => void;
  hidden?: boolean;
  error?: string | null;
}

/**
 * Live-tuning panel for the sea pattern overlay.
 *
 * Deliberately a plain viewport-fixed sibling, not a child of the canvas it
 * controls: the canvas now lives inside the world box so its z-index can sit
 * below the frame/border layers, but the panel must NOT pan or zoom with the
 * map, so the two can no longer share one mount point.
 */
export function WorldSurfaceSeaPatternPanel({ config, onChange, hidden = false, error }: WorldSurfaceSeaPatternPanelProps) {
  const { t } = useTranslation('idleVillage');
  const reducedMotion = useReducedMotion();
  const [panelOpen, setPanelOpen] = useState(true);

  if (hidden) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 110 }}>
      {panelOpen && (
        <div
          style={{ position: 'absolute', top: 12, right: 12, width: 280, pointerEvents: 'auto' }}
          className="rounded border border-amber-700/40 bg-slate-900/95 p-3 text-amber-100 shadow-lg backdrop-blur"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-amber-300">{t('world.debug.seaPatternTitle')}</div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded px-2 py-0.5 text-xs text-amber-200/70 hover:bg-amber-700/20"
            >
              {t('world.debug.seaPatternClose')}
            </button>
          </div>

          {error && (
            <div className="mb-2 rounded border border-red-800 bg-red-950/40 p-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="text-xs italic text-amber-200/70">{t('world.debug.seaPatternLive')}</div>

          <div className="mt-3 space-y-3">
            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternScale')}</span>
              <input
                type="range"
                min={100}
                max={20000}
                step={50}
                value={config.patternScale}
                onChange={(e) => onChange('patternScale', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.patternScale}</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternOpacity')}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={config.lineOpacity}
                onChange={(e) => onChange('lineOpacity', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.lineOpacity.toFixed(2)}</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternColor')}</span>
              <input
                type="color"
                value={config.lineColor}
                onChange={(e) => onChange('lineColor', e.target.value)}
                className="mt-1 h-7 w-full rounded border border-amber-700/40 bg-slate-800"
              />
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternMotion')}</span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={config.motionAmount}
                onChange={(e) => onChange('motionAmount', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.motionAmount.toFixed(1)} wpx</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternPeriod')}</span>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={config.motionPeriod}
                onChange={(e) => onChange('motionPeriod', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.motionPeriod}s</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternAngle')}</span>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={config.motionAngle}
                onChange={(e) => onChange('motionAngle', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.motionAngle}°</span>
            </label>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="sea-pattern-motion"
                type="checkbox"
                checked={config.motionEnabled}
                disabled={reducedMotion}
                onChange={(e) => onChange('motionEnabled', e.target.checked)}
                className="accent-teal-500"
              />
              <label htmlFor="sea-pattern-motion" className="text-xs text-amber-200/90">
                {t('world.debug.seaPatternMotionEnabled')}
                {reducedMotion && (
                  <span className="ml-1 text-amber-200/50">({t('world.debug.reducedMotion')})</span>
                )}
              </label>
            </div>
          </div>
        </div>
      )}
      {!panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'auto' }}
          className="rounded border border-amber-700/40 bg-slate-900/95 px-2 py-1 text-xs text-amber-200/70 hover:bg-amber-700/20"
        >
          {t('world.debug.seaPatternTitle')}
        </button>
      )}
    </div>
  );
}

export default WorldSurfaceSeaPatternPanel;
