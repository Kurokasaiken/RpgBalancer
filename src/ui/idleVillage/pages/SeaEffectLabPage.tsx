import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldSurface } from '../hooks/useWorldSurface';
import { WorldSurfaceRenderer } from '../components/WorldSurfaceRenderer';
import { atmosphereAssets } from '../config/atmosphereAssets';
import type { WaterFieldConfig } from '../config/atmosphereAssets';

const MANIFEST_PATH = '/assets/world/wanderlust/base/manifest.json';

/**
 * Intensified water-field config used for the right-hand lab panel.
 *
 * The global `atmosphereAssets.waterField` was deliberately tuned to be
 * sub-perceptual at the default map zoom. In the lab we boost opacities and
 * tint deltas so the Director can judge whether the *technique* works before
 * deciding on the final perceptual target.
 */
const INTENSE_WATER_FIELD: WaterFieldConfig = {
  layers: atmosphereAssets.waterField.layers.map((layer) => ({
    ...layer,
    opacity: Math.min(1, layer.opacity * 1.8),
  })),
  lightPools: atmosphereAssets.waterField.lightPools.map((pool) => ({
    ...pool,
    opacityMin: Math.min(1, pool.opacityMin * 1.2),
    opacityMax: Math.min(1, pool.opacityMax * 1.5),
    tintDelta: pool.tintDelta * 1.2,
  })),
};

interface SeaPanel {
  id: 'baseline' | 'waterField';
  labelKey: string;
  showWaterField: boolean;
  config?: WaterFieldConfig;
  camera: { panX: number; panY: number; zoom: number };
  setCamera: (camera: { panX: number; panY: number; zoom: number }) => void;
}

/**
 * Side-by-side water effect lab for the painted sea.
 *
 * Left panel: the current baseline (clouds, shadows, waves, no water field).
 * Right panel: the existing `WorldSurfaceWaterField` with an intensified config,
 * so the effect is visible enough to judge the technique.
 */
export const SeaEffectLabPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const translate = useCallback((key: string) => String(t(key as never)), [t]);

  const { isLoading, error, manifest, layers } = useWorldSurface(MANIFEST_PATH);

  const [cameraA, setCameraA] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [cameraB, setCameraB] = useState({ panX: 0, panY: 0, zoom: 1 });

  const visibleLayerIds = useMemo(() => {
    if (!layers) return new Set<string>();
    return new Set(layers.map((l) => l.id));
  }, [layers]);

  const activeVisualStateId = useMemo(() => {
    if (!manifest) return 'default';
    const base = manifest.visualStates.find((s) => s.base);
    return base?.id ?? manifest.visualStates[0]?.id ?? 'default';
  }, [manifest]);

  const panels: SeaPanel[] = useMemo(() => [
    { id: 'baseline', labelKey: 'world.lab.baseline', showWaterField: false, camera: cameraA, setCamera: setCameraA },
    { id: 'waterField', labelKey: 'world.lab.waterField', showWaterField: true, config: INTENSE_WATER_FIELD, camera: cameraB, setCamera: setCameraB },
  ], [cameraA, cameraB]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-amber-200">
        <div className="text-sm">{translate('world.loading')}</div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4 text-amber-200">
        <div className="rounded border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          {translate('world.title')}: {error?.message ?? translate('world.error')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-amber-100">
      <header className="flex items-center justify-between border-b border-amber-700/30 bg-slate-900 px-4 py-2">
        <h1 className="text-lg font-semibold text-amber-300">{translate('world.lab.title')}</h1>
        <a
          href="/test-hub"
          className="rounded border border-amber-700/40 px-3 py-1 text-xs hover:bg-amber-700/20"
        >
          {translate('world.lab.back')}
        </a>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {panels.map((panel) => (
          <div
            key={panel.id}
            className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-r border-slate-800 last:border-r-0"
          >
            <div className="z-10 border-b border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-amber-200">
              {translate(panel.labelKey)}
            </div>
            <div className="relative flex-1 overflow-hidden">
              <WorldSurfaceRenderer
                manifest={manifest}
                camera={panel.camera}
                onCameraChange={panel.setCamera}
                activeVisualStateId={activeVisualStateId}
                visibleLayerIds={visibleLayerIds}
                showRegions={false}
                showAnchors={false}
                renderObjects={false}
                runtimeObjects={[]}
                autoFit
                autoFitTrigger={1}
                showWaterField={panel.showWaterField}
                waterFieldConfig={panel.config}
              />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default SeaEffectLabPage;
