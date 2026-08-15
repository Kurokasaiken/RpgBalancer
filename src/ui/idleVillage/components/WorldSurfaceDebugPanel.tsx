import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
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
  surfaceLayerOrder?: string[];
  onToggleLayer?: (layerId: string) => void;
  onLayerScaleChange?: (layerId: string, scale: number) => void;
  onLayerOffsetChange?: (layerId: string, offset: { x: number; y: number }) => void;
  onLayerOrderChange?: (orderedLayerIds: string[]) => void;
  onSaveLayerDefaults?: () => Promise<void> | void;
  onSetVisualState?: (stateId: string) => void;
  onResetCamera?: () => void;
  onSpawnObjects?: () => void;
  onClearObjects?: () => void;
  onSpawnWonders?: () => void;
  wondersVisible?: boolean;
  mouseWorld: { x: number; y: number } | null;
  rendererType?: 'dom' | 'webgl';
  objectCount?: number;
  cloudScales?: { far: number; mid: number; near: number };
  onCloudScaleChange?: (scales: { far: number; mid: number; near: number }) => void;
  eventCovered?: boolean;
  onEventCoveredChange?: (v: boolean) => void;
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
  surfaceLayerOrder,
  onToggleLayer,
  onLayerScaleChange,
  onLayerOffsetChange,
  onLayerOrderChange,
  onSaveLayerDefaults,
  onSetVisualState,
  onResetCamera,
  onSpawnObjects,
  onClearObjects,
  onSpawnWonders,
  wondersVisible = false,
  mouseWorld,
  rendererType,
  objectCount = 0,
  cloudScales = { far: 1, mid: 1, near: 1 },
  onCloudScaleChange,
  eventCovered = false,
  onEventCoveredChange,
}) => {
  const { t } = useTranslation('idleVillage');
  const translate = useCallback(
    (key: string) => String(t(key as never)),
    [t],
  );
  const [layersCollapsed, setLayersCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const orderIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (surfaceLayerOrder) {
      surfaceLayerOrder.forEach((id, index) => map.set(id, index));
    }
    return map;
  }, [surfaceLayerOrder]);

  const orderedLayers = useMemo(() => {
    return [...layers].sort((a, b) => {
      const aOrder = orderIndex.get(a.id);
      const bOrder = orderIndex.get(b.id);
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.zIndex - b.zIndex;
    });
  }, [layers, orderIndex]);

  // For the virtual atmosphere layer, the effective z-index follows its drag
  // position: it sits immediately below the next layer in the stack.
  const effectiveZMap = useMemo(() => {
    const map = new Map<string, number>();
    const frame = layers.find((l) => l.id === 'frame');
    for (let i = 0; i < orderedLayers.length; i += 1) {
      const layer = orderedLayers[i];
      if (layer.id === 'clouds') {
        const next = orderedLayers[i + 1];
        map.set(
          layer.id,
          next ? Math.max(0, next.zIndex - 1) : frame ? frame.zIndex - 1 : 1000,
        );
      } else {
        map.set(layer.id, layer.zIndex);
      }
    }
    return map;
  }, [orderedLayers, layers]);

  const orderedLayerIds = useMemo(() => orderedLayers.map((l) => l.id), [orderedLayers]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onLayerOrderChange) return;

      const oldIndex = orderedLayerIds.indexOf(String(active.id));
      const newIndex = orderedLayerIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...orderedLayerIds];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      onLayerOrderChange(reordered);
    },
    [orderedLayerIds, onLayerOrderChange],
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


      {onCloudScaleChange && (
        <div className="mt-2 space-y-2 border-t border-amber-700/30 pt-2">
          <div className="text-[10px] uppercase tracking-wider text-amber-400/60">
            {t('world.clouds.scales')}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-amber-200/80">
              <span>{t('world.clouds.far')}</span>
              <span>{cloudScales.far.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={3}
              step={0.1}
              value={cloudScales.far}
              onChange={(e) =>
                onCloudScaleChange({ ...cloudScales, far: Number(e.target.value), mid: cloudScales.far, near: cloudScales.far })
              }
              className="h-1 w-full cursor-pointer appearance-none rounded bg-amber-700/40 accent-amber-500"
              aria-label={`${t('world.clouds.far')} ${t('world.clouds.scale')}`}
            />
          </div>
        </div>
      )}

      {onEventCoveredChange && (
        <button
          type="button"
          onClick={() => onEventCoveredChange(!eventCovered)}
          className={`mt-2 w-full rounded px-2 py-1 text-amber-100 ${eventCovered ? 'bg-amber-500 hover:bg-amber-400' : 'bg-amber-700/30 hover:bg-amber-700/50'}`}
        >
          {eventCovered ? '☁️ Event shroud ON' : '☁️ Event shroud OFF'}
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

      {onSpawnWonders && (
        <button
          type="button"
          onClick={onSpawnWonders}
          className="mt-2 w-full rounded bg-amber-700/30 px-2 py-1 text-amber-100 hover:bg-amber-700/50"
        >
          {wondersVisible ? translate('world.debug.despawnWonders') : translate('world.debug.spawnWonders')}
        </button>
      )}


      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="font-semibold text-amber-300">{translate('world.layers.title')}</h4>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setLayersCollapsed(!layersCollapsed)}
              className="rounded bg-amber-700/30 px-2 py-1 text-amber-100 hover:bg-amber-700/50"
            >
              {layersCollapsed ? '▶' : '▼'}
            </button>
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
        </div>
        {!layersCollapsed && (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedLayerIds} strategy={verticalListSortingStrategy}>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {orderedLayers.map((layer) => (
                  <SortableLayerRow
                    key={layer.id}
                    layer={layer}
                    zIndex={effectiveZMap.get(layer.id) ?? layer.zIndex}
                    scale={layerScales[layer.id] ?? layer.scale ?? 1}
                    offset={layerOffsets[layer.id] ?? { x: layer.offsetX ?? 0, y: layer.offsetY ?? 0 }}
                    visible={visibleLayerIds.has(layer.id)}
                    translate={translate}
                    onToggle={() => onToggleLayer?.(layer.id)}
                    onScaleChange={(value) => onLayerScaleChange?.(layer.id, value)}
                    onOffsetChange={(value) => onLayerOffsetChange?.(layer.id, value)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
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

interface SortableLayerRowProps {
  layer: WorldSurfaceLayer;
  zIndex: number;
  scale: number;
  offset: { x: number; y: number };
  visible: boolean;
  translate: (key: string) => string;
  onToggle: () => void;
  onScaleChange: (value: number) => void;
  onOffsetChange: (value: { x: number; y: number }) => void;
}

/**
 * Sortable layer row for the debug panel.
 */
const SortableLayerRow: React.FC<SortableLayerRowProps> = ({
  layer,
  zIndex,
  scale,
  offset,
  visible,
  translate,
  onToggle,
  onScaleChange,
  onOffsetChange,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleOffsetChange = (axis: 'x' | 'y', value: number) => {
    onOffsetChange({ ...offset, [axis]: value });
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded px-1 hover:bg-amber-700/20">
      <div className="flex cursor-pointer items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-amber-400/60 hover:text-amber-300"
          aria-label={translate('world.layers.dragHandle')}
        >
          <GripVertical size={14} />
        </button>
        <label className="flex flex-1 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={visible}
            onChange={onToggle}
            className="h-3 w-3 accent-amber-500"
          />
          <span className="flex-1 truncate">{layer.id}</span>
          <span className="text-amber-400/60">z{zIndex}</span>
        </label>
      </div>
      <div className="mt-1 flex items-center gap-2 pl-5">
        <span className="w-10 text-right text-amber-400/80">{scale.toFixed(1)}x</span>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.1}
          value={scale}
          aria-label={`${layer.id} ${translate('world.layers.scale')}`}
          onChange={(e) => onScaleChange(Number(e.target.value))}
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
};
