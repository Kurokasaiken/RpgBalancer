import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldSurface } from '../hooks/useWorldSurface';
import { WorldSurfaceRenderer } from '../components/WorldSurfaceRenderer';
import { WorldSurfaceDebugPanel } from '../components/WorldSurfaceDebugPanel';
import { WorldSurfacePerfHud } from '../components/WorldSurfacePerfHud';
import { selectWorldSurfaceRenderer } from '../config/worldSurfaceConfig';
import { isWebGLSupported } from '../utils/webglSupport';
import { useWorldState } from '../../../engine/world/systems/WorldState';
import type { CameraConfig } from '../config/worldSurfaceConfig';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const WorldSurfacePixiOverlay = lazy(() => import('../components/WorldSurfacePixiOverlay'));

const MANIFEST_PATH = '/assets/world/wanderlust/base/manifest.json';
const PERSIST_LAYER_OVERRIDES_KEY = 'worldSurfaceLayerOverrides';
const PERSIST_LAYER_ORDER_KEY = 'worldSurfaceLayerOrder';

// Slice 2 — hidden reaction zone (world-space coords), over the painted village.
// Note: the manifest's `village_01` anchor (624,416) does NOT match where the
// village is actually painted — these coords were measured off the rendered map.
// Hard-coded for now; moves to manifest in Slice 3.
const REACTION_ZONE = { x: 1830, y: 1350, width: 500, height: 400 } as const;

function defaultCamera(config: CameraConfig) {
  return { panX: 0, panY: 0, zoom: config.defaultZoom };
}

/**
 * TestHub page for the World Surface Runtime.
 *
 * Loads the Wanderlust base manifest, renders the multi-layer DOM map,
 * exposes pan/zoom, layer toggles, visual state switching and a debug panel.
 */
export const WorldSurfaceTestPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const translate = useCallback((key: string) => String(t(key as never)), [t]);

  const { isLoading, error, manifest, layers, visualStates, anchors, regions, cameraConfig } =
    useWorldSurface(MANIFEST_PATH);

  const objects = useWorldState((s) => s.objects);
  const addObject = useWorldState((s) => s.addObject);
  const removeObject = useWorldState((s) => s.removeObject);

  const [camera, setCamera] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [activeVisualStateId, setActiveVisualStateId] = useState<string>('default');
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(new Set());
  const [layerScales, setLayerScales] = useState<Record<string, number>>({});
  const [layerOffsets, setLayerOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [surfaceLayerOrder, setSurfaceLayerOrder] = useState<string[] | undefined>(undefined);
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number } | null>(null);
  const [autoFitTrigger, setAutoFitTrigger] = useState(1);
  const [breathEnabled, setBreathEnabled] = useState(true);
  const [reactionTrigger, setReactionTrigger] = useState<'camera-enter' | 'pointer-dwell'>('camera-enter');
  const [reactionActive, setReactionActive] = useState(false);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Initialise local state once the manifest is loaded.
  const overridesLoaded = useRef(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!manifest || !cameraConfig || overridesLoaded.current) return;
    overridesLoaded.current = true;

    const base = manifest.visualStates.find((s) => s.base);
    setActiveVisualStateId(base?.id ?? manifest.visualStates[0]?.id ?? 'default');
    if (!manifest.renderer?.autoFit) {
      setCamera(defaultCamera(cameraConfig));
    }
    setVisibleLayerIds(new Set(layers.map((l) => l.id)));

    const loadOverrides = async () => {
      const data = await loadData<{ scales: Record<string, number>; offsets: Record<string, { x: number; y: number }> }>(
        PERSIST_LAYER_OVERRIDES_KEY,
        { scales: {}, offsets: {} },
      );
      setLayerScales(data.scales);
      setLayerOffsets(data.offsets);

      const order = await loadData<string[]>(PERSIST_LAYER_ORDER_KEY, []);
      if (order.length > 0) {
        setSurfaceLayerOrder(order);
      }
    };
    void loadOverrides();
  }, [manifest, cameraConfig, layers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleToggleLayer = useCallback((layerId: string) => {
    setVisibleLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleLayerScaleChange = useCallback((layerId: string, scale: number) => {
    setLayerScales((prev) => ({ ...prev, [layerId]: scale }));
  }, []);

  const handleLayerOffsetChange = useCallback((layerId: string, offset: { x: number; y: number }) => {
    setLayerOffsets((prev) => ({ ...prev, [layerId]: offset }));
  }, []);

  const handleLayerOrderChange = useCallback((order: string[]) => {
    setSurfaceLayerOrder(order);
  }, []);

  const handleSaveLayerDefaults = useCallback(async () => {
    await saveData(PERSIST_LAYER_OVERRIDES_KEY, { scales: layerScales, offsets: layerOffsets });
    if (surfaceLayerOrder) {
      await saveData(PERSIST_LAYER_ORDER_KEY, surfaceLayerOrder);
    }
  }, [layerScales, layerOffsets, surfaceLayerOrder]);

  // camera-enter: active whenever the reaction zone intersects the current viewport.
  useEffect(() => {
    if (reactionTrigger !== 'camera-enter' || !mainRef.current) return;
    const vw = mainRef.current.clientWidth;
    const vh = mainRef.current.clientHeight;
    const viewRight = camera.panX + vw / camera.zoom;
    const viewBottom = camera.panY + vh / camera.zoom;
    const intersects =
      viewRight > REACTION_ZONE.x &&
      camera.panX < REACTION_ZONE.x + REACTION_ZONE.width &&
      viewBottom > REACTION_ZONE.y &&
      camera.panY < REACTION_ZONE.y + REACTION_ZONE.height;
    setReactionActive(intersects);
  }, [camera, reactionTrigger]);

  // pointer-dwell: fires after 2s continuous hover inside the zone.
  // Stays active once discovered; resets on trigger mode change.
  useEffect(() => {
    if (reactionTrigger !== 'pointer-dwell') return;
    if (!mouseWorld) return;
    const inZone =
      mouseWorld.x >= REACTION_ZONE.x &&
      mouseWorld.x <= REACTION_ZONE.x + REACTION_ZONE.width &&
      mouseWorld.y >= REACTION_ZONE.y &&
      mouseWorld.y <= REACTION_ZONE.y + REACTION_ZONE.height;
    if (inZone) {
      if (!dwellTimerRef.current) {
        dwellTimerRef.current = setTimeout(() => setReactionActive(true), 2000);
      }
    } else {
      if (dwellTimerRef.current) { clearTimeout(dwellTimerRef.current); dwellTimerRef.current = null; }
    }
  }, [mouseWorld, reactionTrigger]);

  // Reset state when switching trigger mode.
  useEffect(() => {
    if (dwellTimerRef.current) { clearTimeout(dwellTimerRef.current); dwellTimerRef.current = null; }
    setReactionActive(false);
  }, [reactionTrigger]);

  const handleResetCamera = useCallback(() => {
    if (!cameraConfig || !manifest) return;
    if (manifest.renderer?.autoFit) {
      setAutoFitTrigger((n) => n + 1);
    } else {
      setCamera(defaultCamera(cameraConfig));
    }
  }, [cameraConfig, manifest]);


  const rendererType = useMemo(() => {
    if (!manifest) return 'dom' as const;

    return selectWorldSurfaceRenderer(manifest.renderer, {
      objectCount: objects.length,
      hasParticleObjects: objects.some((o) => o.visual.renderMode === 'particle'),
      hasParticleLayers: layers.some((l) => l.type === 'particle_system'),
      hasShaderLayers: layers.some((l) => l.animation.implementation === 'shader'),
      webglSupported: isWebGLSupported(),
    });
  }, [manifest, objects, layers]);

  const handleSpawnObjects = useCallback(() => {
    if (!manifest) return;

    const { width, height } = manifest.coordinateSystem.canvas;
    const colors = ['#fbbf24', '#38bdf8', '#f87171', '#a78bfa'];

    for (let i = 0; i < 60; i += 1) {
      addObject({
        id: crypto.randomUUID(),
        location: { mode: 'dynamic', x: Math.random() * width, y: Math.random() * height },
        type: 'particle',
        state: 'active',
        visual: {
          renderMode: 'particle',
          renderLayer: 'world',
          scale: 0.6 + Math.random() * 0.6,
          tint: colors[i % colors.length],
          glow: i % 5 === 0,
        },
        animation: { mode: 'float', speed: 0.5 + Math.random(), direction: 'both' },
        data: {},
      });
    }
  }, [manifest, addObject]);

  const handleClearObjects = useCallback(() => {
    for (const object of objects) {
      removeObject(object.id);
    }
  }, [objects, removeObject]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-amber-200">
        <div className="text-sm">{translate('world.loading')}</div>
      </div>
    );
  }

  if (error || !manifest || !cameraConfig) {
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
        <h1 className="text-lg font-semibold text-amber-300">{translate('world.title')}</h1>
        <a
          href="/test-hub"
          className="rounded border border-amber-700/40 px-3 py-1 text-xs hover:bg-amber-700/20"
        >
          {translate('world.back')}
        </a>
      </header>

      <main
        ref={mainRef}
        className="relative flex-1 overflow-hidden"
      >
        <WorldSurfaceRenderer
          manifest={manifest}
          camera={camera}
          onCameraChange={setCamera}
          activeVisualStateId={activeVisualStateId}
          visibleLayerIds={visibleLayerIds}
          layerScales={layerScales}
          layerOffsets={layerOffsets}
          surfaceLayerOrder={surfaceLayerOrder}
          onMouseWorldChange={setMouseWorld}
          runtimeObjects={objects}
          renderObjects={rendererType !== 'webgl'}
          autoFitTrigger={autoFitTrigger}
          showRegions={false}
          breathEnabled={breathEnabled}
        />

        {rendererType === 'webgl' && (
          <Suspense fallback={null}>
            <WorldSurfacePixiOverlay manifest={manifest} camera={camera} objects={objects} />
          </Suspense>
        )}

        {/* Reaction zone overlay — world-space coords, same transform as the renderer's world div */}
        {manifest && (
          <>
            <style>{`
              @keyframes wsReactionPulse {
                0%, 100% { opacity: 0.55; }
                50% { opacity: 1; }
              }
            `}</style>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: manifest.coordinateSystem.canvas.width,
                height: manifest.coordinateSystem.canvas.height,
                transformOrigin: 'top left',
                transform: `translate(${-camera.panX * camera.zoom}px, ${-camera.panY * camera.zoom}px) scale(${camera.zoom})`,
              }}>
                {/* Zone indicator disabled — removed debug riquadro giallo */}
                {false && (
                  <div style={{
                    position: 'absolute',
                    left: REACTION_ZONE.x,
                    top: REACTION_ZONE.y,
                    width: REACTION_ZONE.width,
                    height: REACTION_ZONE.height,
                    border: '1px dashed rgba(251,191,36,0.25)',
                    pointerEvents: 'none',
                  }} />
                )}
                {false && reactionActive && (
                  <div style={{
                    position: 'absolute',
                    left: REACTION_ZONE.x,
                    top: REACTION_ZONE.y,
                    width: REACTION_ZONE.width,
                    height: REACTION_ZONE.height,
                    border: '2px solid rgba(251,191,36,0.85)',
                    boxShadow: '0 0 28px rgba(251,191,36,0.35), inset 0 0 28px rgba(251,191,36,0.12)',
                    borderRadius: 6,
                    animationName: 'wsReactionPulse',
                    animationDuration: '2.5s',
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: -26,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: '#fbbf24',
                      fontSize: 14,
                      fontWeight: 600,
                      textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.06em',
                    }}>
                      qualcosa si muove...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {import.meta.env.DEV && (
          <WorldSurfacePerfHud
            containerRef={mainRef}
            visibleLayerCount={visibleLayerIds.size}
            zoom={camera.zoom}
          />
        )}

        <WorldSurfaceDebugPanel
          manifest={manifest}
          layers={layers}
          visualStates={visualStates}
          regions={regions}
          anchors={anchors}
          camera={camera}
          activeVisualStateId={activeVisualStateId}
          visibleLayerIds={visibleLayerIds}
          layerScales={layerScales}
          layerOffsets={layerOffsets}
          surfaceLayerOrder={surfaceLayerOrder}
          onToggleLayer={handleToggleLayer}
          onLayerScaleChange={handleLayerScaleChange}
          onLayerOffsetChange={handleLayerOffsetChange}
          onLayerOrderChange={handleLayerOrderChange}
          onSaveLayerDefaults={handleSaveLayerDefaults}
          onSetVisualState={setActiveVisualStateId}
          onResetCamera={handleResetCamera}
          mouseWorld={mouseWorld}
          rendererType={rendererType}
          objectCount={objects.length}
          onSpawnObjects={handleSpawnObjects}
          onClearObjects={handleClearObjects}
          breathEnabled={breathEnabled}
          onBreathEnabledChange={setBreathEnabled}
          reactionTrigger={reactionTrigger}
          reactionActive={reactionActive}
          onReactionTriggerChange={setReactionTrigger}
        />
      </main>
    </div>
  );
};
