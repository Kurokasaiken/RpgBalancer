import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  WorldSurfaceAnchor,
  WorldSurfaceLayer,
  WorldSurfaceManifest,
  WorldSurfaceRegion,
  WorldSurfaceVisualState,
} from '../config/worldSurfaceConfig';

export interface WorldSurfaceDebugPanelProps {
  manifest: WorldSurfaceManifest | null;
  layers: WorldSurfaceLayer[];
  visualStates: WorldSurfaceVisualState[];
  regions: WorldSurfaceRegion[];
  anchors: WorldSurfaceAnchor[];
  camera: { panX: number; panY: number; zoom: number };
  activeVisualStateId: string;
  visibleLayerIds: Set<string>;
  layerScales?: Record<string, number>;
  layerOffsets?: Record<string, { x: number; y: number }>;
  mouseWorld: { x: number; y: number } | null;
  rendererType?: 'dom' | 'webgl';
  objectCount?: number;
  onToggleLayer?: (layerId: string) => void;
  onLayerScaleChange?: (layerId: string, scale: number) => void;
  onLayerOffsetChange?: (layerId: string, offset: { x: number; y: number }) => void;
  onSaveLayerDefaults?: () => Promise<void> | void;
  onSetVisualState?: (stateId: string) => void;
  onResetCamera?: () => void;
  onSpawnObjects?: () => void;
  onClearObjects?: () => void;
}

/**
 * Debug overlay for the World Surface TestHub page.
 *
 * Displays runtime camera state, mouse world coordinates, layers, regions,
 * anchors and lets the user toggle layers and switch visual states.
 */
export const WorldSurfaceDebugPanel: React.FC<WorldSurfaceDebugPanelProps> = ({
  manifest,
  layers,
  visualStates,
  regions,
  anchors,
  camera,
  activeVisualStateId,
  visibleLayerIds,
  layerScales = {},
  layerOffsets = {},
  mouseWorld,
  rendererType,
  objectCount = 0,
  onToggleLayer,
  onLayerScaleChange,
  onLayerOffsetChange,
  onSaveLayerDefaults,
  onSetVisualState,
  onResetCamera,
  onSpawnObjects,
  onClearObjects,
}) => {
  const { t } = useTranslation('idleVillage');
  const translate = useCallback(
    (key: string) => String(t(key as never)),
    [t],
  );

  const activeState = useMemo(
    () => visualStates.find((s) => s.id === activeVisualStateId),
    [visualStates, activeVisualStateId],
  );

  const hoveredRegions = useMemo(() => {
    if (!mouseWorld) return [];
    return regions
      .filter(
        (r) =>
          mouseWorld.x >= r.bounds.x &&
          mouseWorld.x <= r.bounds.x + r.bounds.width &&
          mouseWorld.y >= r.bounds.y &&
          mouseWorld.y <= r.bounds.y + r.bounds.height,
      )
      .map((r) => r.id);
  }, [mouseWorld, regions]);

  if (!manifest) return null;

  return (
    <div className="absolute right-2 top-2 z-50 w-72 rounded border border-amber-700/40 bg-slate-900/90 p-3 text-xs text-amber-100 shadow-lg backdrop-blur">
      <h3 className="mb-2 font-semibold text-amber-300">{translate('world.debug.title')}</h3>

      <div className="space-y-1">
        <div>
          {translate('world.debug.camera')}: pan({camera.panX.toFixed(1)},{' '}
          {camera.panY.toFixed(1)}) zoom({camera.zoom.toFixed(2)})
        </div>
        <div>
          {translate('world.debug.mouseWorld')}:{' '}
          {mouseWorld ? `${mouseWorld.x.toFixed(1)}, ${mouseWorld.y.toFixed(1)}` : '-'}
        </div>
        <div>
          {translate('world.debug.activeState')}:{' '}
          {activeState ? translate(activeState.labelKey) : activeVisualStateId}
        </div>
        <div>
          {translate('world.debug.renderer')}: {rendererType ?? 'dom'}
        </div>
        <div>
          {translate('world.debug.objects')}: {objectCount}
        </div>
        {hoveredRegions.length > 0 && (
          <div>
            {translate('world.debug.regions')}: {hoveredRegions.join(', ')}
          </div>
        )}
      </div>

      {onResetCamera && (
        <button
          type="button"
          onClick={onResetCamera}
          className="mt-3 w-full rounded bg-amber-700/30 px-2 py-1 text-amber-100 hover:bg-amber-700/50"
        >
          {translate('world.camera.reset')}
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onSpawnObjects}
          className="flex-1 rounded bg-amber-700/30 px-2 py-1 text-amber-100 hover:bg-amber-700/50"
        >
          {translate('world.debug.spawnObjects')}
        </button>
        <button
          type="button"
          onClick={onClearObjects}
          className="flex-1 rounded bg-amber-700/30 px-2 py-1 text-amber-100 hover:bg-amber-700/50"
        >
          {translate('world.debug.clearObjects')}
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="font-semibold text-amber-300">{translate('world.layers.title')}</h4>
          {onSaveLayerDefaults && (
            <button
              type="button"
              onClick={onSaveLayerDefaults}
              className="rounded bg-amber-700/30 px-2 py-1 text-amber-100 hover:bg-amber-700/50"
            >
              {translate('world.layers.saveDefaults')}
            </button>
          )}
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {layers.map((layer) => {
            const scale = layerScales[layer.id] ?? layer.scale ?? 1;
            const offset = layerOffsets[layer.id] ?? { x: layer.offsetX ?? 0, y: layer.offsetY ?? 0 };
            const handleOffsetChange = (axis: 'x' | 'y', value: number) => {
              onLayerOffsetChange?.(layer.id, { ...offset, [axis]: value });
            };
            return (
              <div key={layer.id} className="rounded px-1 hover:bg-amber-700/20">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleLayerIds.has(layer.id)}
                    onChange={() => onToggleLayer?.(layer.id)}
                    className="h-3 w-3 accent-amber-500"
                  />
                  <span className="flex-1 truncate">{layer.id}</span>
                  <span className="text-amber-400/60">z{layer.zIndex}</span>
                </label>
                <div className="mt-1 flex items-center gap-2 pl-5">
                  <span className="w-10 text-right text-amber-400/80">{scale.toFixed(1)}x</span>
                  <input
                    type="range"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={scale}
                    aria-label={`${layer.id} ${translate('world.layers.scale')}`}
                    onChange={(e) => onLayerScaleChange?.(layer.id, Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer appearance-none rounded bg-amber-700/40 accent-amber-500"
                  />
                </div>
                <div className="mt-1 flex items-center gap-2 pl-5">
                  <span className="w-6 text-right text-amber-400/80">X</span>
                  <span className="w-8 text-right text-amber-400/80">{offset.x}</span>
                  <input
                    type="range"
                    min={-500}
                    max={500}
                    step={10}
                    value={offset.x}
                    aria-label={`${layer.id} ${translate('world.layers.offsetX')}`}
                    onChange={(e) => handleOffsetChange('x', Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer appearance-none rounded bg-amber-700/40 accent-amber-500"
                  />
                </div>
                <div className="mt-1 flex items-center gap-2 pl-5">
                  <span className="w-6 text-right text-amber-400/80">Y</span>
                  <span className="w-8 text-right text-amber-400/80">{offset.y}</span>
                  <input
                    type="range"
                    min={-500}
                    max={500}
                    step={10}
                    value={offset.y}
                    aria-label={`${layer.id} ${translate('world.layers.offsetY')}`}
                    onChange={(e) => handleOffsetChange('y', Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer appearance-none rounded bg-amber-700/40 accent-amber-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="mb-1 font-semibold text-amber-300">{translate('world.debug.statesTitle')}</h4>
        <div className="flex flex-wrap gap-1">
          {visualStates.map((state) => (
            <button
              key={state.id}
              type="button"
              onClick={() => onSetVisualState?.(state.id)}
              className={`rounded px-2 py-1 ${
                state.id === activeVisualStateId
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-700/30 text-amber-100 hover:bg-amber-700/50'
              }`}
            >
              {translate(state.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h4 className="font-semibold text-amber-300">{translate('world.debug.anchors')}</h4>
        {anchors.map((anchor) => (
          <div key={anchor.id}>
            {anchor.id} ({anchor.type}) → {anchor.x}, {anchor.y}
          </div>
        ))}
      </div>

      <div className="mt-2 text-amber-400/50">
        {manifest.world}/{manifest.variant} v{manifest.version}
      </div>
    </div>
  );
};
