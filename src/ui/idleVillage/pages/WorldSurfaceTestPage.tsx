import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldSurface } from '../hooks/useWorldSurface';
import { seaWonderCatalog, wonderSpawnDefaults } from '../config/seaWonders';
import { atmosphereAssets } from '../config/atmosphereAssets';
import { WorldSurfaceRenderer } from '../components/WorldSurfaceRenderer';
import { WorldSurfaceDebugPanel } from '../components/WorldSurfaceDebugPanel';
import { WorldSurfacePerfHud } from '../components/WorldSurfacePerfHud';
import { WorldSurfaceBreathOverlay } from '../components/WorldSurfaceBreathOverlay';
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
  const [cloudScales, setCloudScales] = useState<{ far: number; mid: number; near: number }>({ far: 1, mid: 1, near: 1 });
  const [surfaceLayerOrder, setSurfaceLayerOrder] = useState<string[] | undefined>(undefined);
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number } | null>(null);
  const [autoFitTrigger, setAutoFitTrigger] = useState(1);
  const [eventCovered, setEventCovered] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [reactionTrigger, setReactionTrigger] = useState<'camera-enter' | 'pointer-dwell'>('camera-enter');
  const [reactionActive, setReactionActive] = useState(false);
  const [wonderAnchors, setWonderAnchors] = useState<{ x: number; y: number }[]>([]);
  const [perfHudVisible, setPerfHudVisible] = useState(true);
  const [breathActive, setBreathActive] = useState(false);
  const [waterActive, setWaterActive] = useState(false);
  const [atmosphereActive, setAtmosphereActive] = useState(false);
  const wonderTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef(objects);
  const wonderAnchorsRef = useRef(wonderAnchors);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    wonderAnchorsRef.current = wonderAnchors;
  }, [wonderAnchors]);

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
      // Event shroud offsets are animation state, not user-saved overrides.
      delete data.offsets.event_shroud_left;
      delete data.offsets.event_shroud_right;
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

  // Where a wonder may surface. The `wonder` anchors are already open water with the
  // carved frame's silhouette subtracted (see scripts/build-terrain-masks.mjs), so the
  // only thing left to exclude here is the swell, which is authored in TypeScript and
  // therefore invisible to the generator.
  //
  // No fallback to the raw point list on an empty result: the `sea` points this used
  // to fall back to are swell marks, every one of which sits under the frame, and
  // silently spawning there is the bug this replaced.
  useEffect(() => {
    fetch('/assets/atmosphere/terrain/points.json')
      .then((res) => res.json())
      .then((data: { wonder?: { x: number; y: number }[] }) => {
        const waveCenters = atmosphereAssets.waves.marks.map((m) => ({
          x: m.x + m.width / 2,
          y: m.y,
        }));
        setWonderAnchors(
          (data.wonder ?? []).filter((p) =>
            waveCenters.every(
              (w) =>
                Math.hypot(p.x - w.x, p.y - w.y) >= wonderSpawnDefaults.minDistanceFromWaveMarks,
            ),
          ),
        );
      })
      .catch(() => setWonderAnchors([]));
  }, []);

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

  // Show the event card once the shroud is fully closed.
  useEffect(() => {
    if (eventCovered) {
      const t = window.setTimeout(() => setCardOpen(true), 700);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [eventCovered]);

  const handleEventCoveredChange = useCallback((covered: boolean) => {
    setEventCovered(covered);
  }, []);

  const handleEventCardComplete = useCallback(() => {
    setEventCovered(false);
  }, []);

  const handleEventCardClose = useCallback(() => {
    setCardOpen(false);
  }, []);

  // Slide the two shroud layers in/out of the world canvas based on the event state.
  useEffect(() => {
    if (!manifest) return;
    const { width } = manifest.coordinateSystem.canvas;
    setLayerOffsets((prev) => ({
      ...prev,
      event_shroud_left: { x: eventCovered ? 0 : -width, y: 0 },
      event_shroud_right: { x: eventCovered ? 0 : width, y: 0 },
    }));
  }, [eventCovered, manifest]);

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

  // Debug: put the whole catalog on the map at once, one wonder per anchor, spread as
  // widely as the anchors allow. Deliberately does not touch the camera — the viewer
  // pans to them.
  const handleToggleWonders = useCallback(() => {
    const anyVisible = objectsRef.current.some((o) => o.type === 'wonder');
    if (anyVisible) {
      for (const object of objectsRef.current) {
        if (object.type === 'wonder') {
          removeObject(object.id);
        }
      }
      return;
    }

    // Farthest-point sampling, not first-fit: each pick after the seed is the anchor
    // furthest from everything already chosen, so the three land in different corners
    // of the map.
    //
    // Taking the first three that merely cleared `minWonderSpacing` picked the three
    // northern anchors: 1797px of longitude between the outermost pair but only 16px
    // of latitude, so at the default camera they sat in a row along the top edge. This
    // spreads the same anchors over 2112x2235px instead.
    const remaining = [...wonderAnchorsRef.current];
    if (remaining.length === 0) return;
    const selected = [remaining.shift() as { x: number; y: number }];

    while (selected.length < seaWonderCatalog.length && remaining.length > 0) {
      let bestIndex = 0;
      let bestDistance = -1;
      remaining.forEach((point, index) => {
        const nearest = Math.min(
          ...selected.map((s) => Math.hypot(s.x - point.x, s.y - point.y)),
        );
        if (nearest > bestDistance) {
          bestDistance = nearest;
          bestIndex = index;
        }
      });
      // Even the most distant candidate left is too close to keep: stop rather than
      // stack two wonders on top of each other.
      if (bestDistance < wonderSpawnDefaults.minWonderSpacing) break;
      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    // Spawn a wonder for each selected point
    for (let i = 0; i < selected.length; i += 1) {
      const wonder = seaWonderCatalog[i];
      const point = selected[i];
      addObject({
        id: crypto.randomUUID(),
        location: { mode: 'dynamic', x: point.x, y: point.y },
        type: 'wonder',
        state: 'active',
        visual: {
          renderMode: 'sprite',
          renderLayer: 'world',
          scale: 1,
          glow: true,
        },
        animation: { mode: 'idle', speed: 1, direction: 'both' },
        data: {
          src: wonder.src,
          width: wonder.width,
          height: wonder.height,
          opacity: wonder.opacity,
          animation: wonder.animation,
          entrance: wonder.entrance,
        },
      });
    }
  }, [addObject, removeObject]);

  useEffect(() => {
    const spawnWonder = () => {
      const points = wonderAnchorsRef.current;
      if (points.length === 0) return;

      const active = objectsRef.current.filter((o) => o.type === 'wonder');
      if (active.length >= wonderSpawnDefaults.maxActiveWonders) return;

      const eligible = points.filter((p) =>
        active.every((a) => Math.hypot(a.location.x - p.x, a.location.y - p.y) >= wonderSpawnDefaults.minWonderSpacing),
      );
      if (eligible.length === 0) return;

      const wonder = seaWonderCatalog[Math.floor(Math.random() * seaWonderCatalog.length)];
      const point = eligible[Math.floor(Math.random() * eligible.length)] ?? { x: 0, y: 0 };
      const id = crypto.randomUUID();
      const jitter = wonderSpawnDefaults.positionJitter;
      addObject({
        id,
        location: {
          mode: 'dynamic',
          x: point.x + (Math.random() - 0.5) * jitter,
          y: point.y + (Math.random() - 0.5) * jitter,
        },
        type: 'wonder',
        state: 'active',
        visual: {
          renderMode: 'sprite',
          renderLayer: 'world',
          scale: 1,
          glow: false,
        },
        animation: { mode: 'idle', speed: 1, direction: 'both' },
        data: {
          src: wonder.src,
          width: wonder.width,
          height: wonder.height,
          opacity: wonder.opacity,
          animation: wonder.animation,
          entrance: wonder.entrance,
        },
      });

      const removeTimeout = setTimeout(() => {
        removeObject(id);
        wonderTimeoutsRef.current.delete(removeTimeout);
      }, wonderSpawnDefaults.wonderLifetimeMs);
      wonderTimeoutsRef.current.add(removeTimeout);
    };

    const interval = setInterval(spawnWonder, wonderSpawnDefaults.spawnIntervalMs);
    return () => {
      clearInterval(interval);
      wonderTimeoutsRef.current.forEach(clearTimeout);
      wonderTimeoutsRef.current.clear();
    };
  }, [addObject, removeObject]);

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
        <div className="flex items-center gap-2">
          <a
            href="/test-hub"
            className="rounded border border-amber-700/40 px-3 py-1 text-xs hover:bg-amber-700/20"
          >
            {translate('world.back')}
          </a>
          <button
            type="button"
            onClick={() => setBreathActive((v) => !v)}
            className={`rounded border border-amber-700/40 px-3 py-1 text-xs hover:bg-amber-700/20 ${breathActive ? 'bg-amber-600 text-amber-950' : ''}`}
          >
            {translate('world.debug.breath')}
          </button>
          <button
            type="button"
            onClick={() => setWaterActive((v) => !v)}
            className={`rounded border border-amber-700/40 px-3 py-1 text-xs hover:bg-amber-700/20 ${waterActive ? 'bg-amber-600 text-amber-950' : ''}`}
          >
            {translate('world.debug.water')}
          </button>
          <button
            type="button"
            onClick={() => setAtmosphereActive((v) => !v)}
            className={`rounded border border-amber-700/40 px-3 py-1 text-xs hover:bg-amber-700/20 ${atmosphereActive ? 'bg-amber-600 text-amber-950' : ''}`}
          >
            {translate('world.debug.atmosphere')}
          </button>
        </div>
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
          cloudScales={cloudScales}
          surfaceLayerOrder={surfaceLayerOrder}
          onMouseWorldChange={setMouseWorld}
          runtimeObjects={objects}
          renderObjects={rendererType !== 'webgl'}
          autoFitTrigger={autoFitTrigger}
          showRegions={false}
          breathEnabled={breathActive}
          showWaterField={waterActive}
          showAtmosphere={atmosphereActive}
          eventCovered={eventCovered}
          showEventCard={cardOpen}
          onEventCardComplete={handleEventCardComplete}
          onEventCardClose={handleEventCardClose}
        >
          {/* WorldSurfaceBreathOverlay disabled: prototype overlay elements (yellow token, discovery stroke, water circle) not needed for breathing demo */}
          {/* {breathActive && (
            <WorldSurfaceBreathOverlay
              canvasSize={manifest.coordinateSystem.canvas}
              mouseWorld={mouseWorld}
            />
          )} */}
        </WorldSurfaceRenderer>

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

        {import.meta.env.DEV && perfHudVisible && (
          <WorldSurfacePerfHud
            containerRef={mainRef}
            visibleLayerCount={visibleLayerIds.size}
            zoom={camera.zoom}
            onClose={() => setPerfHudVisible(false)}
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
          cloudScales={cloudScales}
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
          onSpawnWonders={wonderAnchors.length > 0 ? handleToggleWonders : undefined}
          wondersVisible={objects.some((o) => o.type === 'wonder')}
          onCloudScaleChange={setCloudScales}
          eventCovered={eventCovered}
          onEventCoveredChange={handleEventCoveredChange}
        />
      </main>
    </div>
  );
};
