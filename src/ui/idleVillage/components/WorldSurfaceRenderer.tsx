import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WorldSurfaceAtmosphere } from './WorldSurfaceAtmosphere';
import { useTranslation } from 'react-i18next';
import type { RuntimeObject } from '../../../engine/world/model/RuntimeObject';
import type { WaterFieldConfig } from '../config/atmosphereAssets';
import type {
  BlendMode,
  WorldSurfaceAnchor,
  WorldSurfaceLayer,
  WorldSurfaceManifest,
  WorldSurfaceRegion,
  WorldSurfaceVisualState,
  WorldSurfaceVisualStateOverride,
} from '../config/worldSurfaceConfig';
import { clampPan, clampZoom, viewportToWorld } from '../../../engine/world/model/WorldCoordinate';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { eventShroudGradeConfig } from '@/balancing/config/idleVillage/eventShroudGradeTokens';

const WorldSurfaceWaves = lazy(() => import('./WorldSurfaceWaves'));
const WorldSurfaceWaterField = lazy(() => import('./WorldSurfaceWaterField'));
const WorldSurfaceClouds = lazy(() => import('./WorldSurfaceClouds'));
const WorldSurfaceCloudShadows = lazy(() => import('./WorldSurfaceCloudShadows'));
const WorldSurfaceFoam = lazy(() => import('./WorldSurfaceFoam'));
const WorldSurfaceBirds = lazy(() => import('./WorldSurfaceBirds'));
const WorldSurfaceCreatures = lazy(() => import('./WorldSurfaceCreatures'));
const WorldSurfaceEventCard = lazy(() => import('./WorldSurfaceEventCard'));

/**
 * Carved border the world is seen through. Cloud layers paint below it, so
 * nothing drifts over the frame itself.
 */
const FRAME_LAYER_ID = 'frame';

/**
 * Breath specs, keyed by layer id.
 *
 * Deliberately EMPTY. Slice 1 tried to implement the tactical plan's §7 breath
 * (trees ±1.5px transform sway) directly on the shipped layers and the result was
 * unusable: every layer in this world is a full-canvas baked PNG, so translating
 * the "forest" layer does not sway foliage — it slides a rectangular crop of the
 * painted map sideways, detaching trees from their own shadows and exposing bare
 * canvas at the leading edge.
 *
 * The plan's own technique column assumes assets this world does not have:
 * clouds as a sprite-sheet, fog as a gradient overlay, water as texture motion.
 * Those are separable elements. A baked terrain layer is not one.
 *
 * Two viable routes, neither of which is a CSS transform on these files:
 *   1. Author dedicated atmosphere assets (cloud sprite, fog overlay, canopy pass)
 *      and animate only those — matches the plan as written.
 *   2. Deform WITHIN the texture via a WebGL displacement filter, so the quad
 *      never moves and no edge is exposed.
 *
 * Kept as a live seam so route 1 needs one entry per new asset, not a refactor.
 */
interface BreathSpec {
  animationName: string;
  animationDuration: string;
  animationTimingFunction: string;
  animationIterationCount: string;
  animationDirection?: string;
  animationDelay?: string;
  /** Amplitude the player should PERCEIVE, in screen pixels. */
  swayPx: number;
}

const BREATH_MAP: Record<string, BreathSpec> = {};

/**
 * Depth parallax, from the tactical plan section 8.
 *
 * The clouds trail the map as it is dragged, which reads as air between the weather
 * and the ground. Only the clouds: they are the one atmosphere layer that is
 * genuinely above the world. Cloud shadows are cast ON the terrain and the wave
 * marks sit on a painted coastline, so moving either of them relative to the map
 * would detach them from what they belong to.
 *
 * The base map stays at 1.00x and the carved frame is never transformed — the plan
 * warns that a DOM frame with a transform can tear on Tauri/WebView, and the layers
 * are full-canvas bakes that would expose empty edges if they moved at all.
 *
 * This is driven by the camera pan rather than by mouse position. The plan writes it
 * as "mouse move -> offset from centre"; pan is the better trigger here because the
 * motion is something the player performs, so they are already attending to it and
 * expecting a response. Ambient motion at this scale has repeatedly failed to be
 * noticed at all; twelve pixels of lag on a deliberate drag is a different problem.
 *
 * The plan's 5% dead zone is deliberately not implemented: it exists to stop jitter
 * when a pointer rests near the centre, and a drag has no jitter to suppress.
 */
const PARALLAX = {
  /** Fraction of the camera pan the clouds add on top of it. */
  cloudExcess: 0.15,
  /** Ceiling on the visible offset, in SCREEN px. */
  maxOffsetScreenPx: 12,
} as const;

interface WorldSurfaceRendererProps {
  manifest: WorldSurfaceManifest;
  camera: { panX: number; panY: number; zoom: number };
  onCameraChange: (camera: { panX: number; panY: number; zoom: number }) => void;
  activeVisualStateId?: string;
  visualStateOverrides?: WorldSurfaceVisualStateOverride[];
  visibleLayerIds?: Set<string> | string[];
  layerScales?: Record<string, number>;
  layerOffsets?: Record<string, { x: number; y: number }>;
  cloudScales?: { far: number; mid: number; near: number };
  surfaceLayerOrder?: string[];
  onMouseWorldChange?: (point: { x: number; y: number } | null) => void;
  showAnchors?: boolean;
  showRegions?: boolean;
  runtimeObjects?: RuntimeObject[];
  renderObjects?: boolean;
  imageFit?: 'fill' | 'cover' | 'contain' | 'none';
  autoFit?: boolean;
  autoFitTrigger?: number;
  breathEnabled?: boolean;
  /** When true, an opaque parchment shroud covers the map for an event transition. */
  eventCovered?: boolean;
  /** When true, the event card is visible at the peak of the shroud. */
  showEventCard?: boolean;
  /** Called when the event card sequence completes and the shroud should open. */
  onEventCardComplete?: () => void;
  /** Called when the event card is ready to be unmounted. */
  onEventCardClose?: () => void;
  /** When true, the water field micro-detail overlay is rendered on the sea. */
  showWaterField?: boolean;
  /** Optional override for the water field configuration (used by the lab page). */
  waterFieldConfig?: WaterFieldConfig;
  /** When true, the ambient light-ray and dust layer is rendered. */
  showAtmosphere?: boolean;
  children?: React.ReactNode;
}

interface EffectiveLayer extends WorldSurfaceLayer {
  visible: boolean;
  grayscale: boolean;
  tint?: string;
  tintBlendMode: React.CSSProperties['mixBlendMode'];
}

const BLEND_MODE_CSS: Record<BlendMode, React.CSSProperties['mixBlendMode']> = {
  normal: 'normal',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  additive: 'screen', // additive is not a standard CSS value; fall back to screen
};

/**
 * Apply visual state overrides on top of the base layer properties.
 */
function applyOverrides(
  layer: WorldSurfaceLayer,
  overrides: WorldSurfaceVisualStateOverride[],
): EffectiveLayer {
  const effective: EffectiveLayer = {
    ...layer,
    visible: true,
    grayscale: false,
    tint: undefined,
    tintBlendMode: 'multiply',
  };

  for (const override of overrides) {
    if (override.layerId !== layer.id) continue;

    switch (override.type) {
      case 'apply_condition': {
        const condition = layer.conditions?.[override.conditionId];
        if (!condition) continue;

        if (condition.hidden !== undefined) {
          effective.visible = !condition.hidden;
        }
        if (condition.opacity !== undefined) {
          effective.opacity = condition.opacity;
        }
        if (condition.grayscale !== undefined) {
          effective.grayscale = condition.grayscale;
        }
        if (condition.tint !== undefined) {
          effective.tint = condition.tint;
          if (condition.blendMode !== undefined) {
            effective.tintBlendMode = BLEND_MODE_CSS[condition.blendMode];
          }
        } else if (condition.blendMode !== undefined) {
          effective.blendMode = condition.blendMode;
        }
        break;
      }
      case 'set_visibility': {
        effective.visible = override.visible;
        break;
      }
      case 'set_opacity': {
        effective.opacity = override.opacity;
        break;
      }
      case 'tint_layer': {
        effective.tint = override.tint;
        break;
      }
      case 'set_animation': {
        effective.animation = override.animation;
        break;
      }
      default:
        break;
    }
  }

  return effective;
}

/**
 * DOM renderer for a World Surface manifest.
 *
 * Renders layers with parallax, optional tint overlays, CSS wave animation,
 * anchors and region overlays. Pan and zoom are controlled by the parent
 * through `camera` / `onCameraChange`.
 */
export const WorldSurfaceRenderer: React.FC<WorldSurfaceRendererProps> = ({
  manifest,
  camera,
  onCameraChange,
  activeVisualStateId,
  visualStateOverrides = [],
  visibleLayerIds,
  layerScales,
  layerOffsets,
  cloudScales = { far: 1, mid: 1, near: 1 },
  surfaceLayerOrder,
  onMouseWorldChange,
  showAnchors = true,
  showRegions = true,
  runtimeObjects = [],
  renderObjects = true,
  imageFit: imageFitProp,
  autoFit: autoFitProp,
  autoFitTrigger = 1,
  breathEnabled = false,
  showWaterField = false,
  showAtmosphere = false,
  waterFieldConfig,
  eventCovered = false,
  showEventCard = false,
  onEventCardComplete,
  onEventCardClose,
  children,
}) => {
  const { t } = useTranslation('idleVillage');
  const translate = useCallback(
    (key: string) => String(t(key as never)),
    [t],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  /**
   * Camera pan at the moment the current drag began, or null when not dragging.
   *
   * The parallax is measured from here rather than from the camera's absolute pan.
   * Against absolute pan the offset hits its 12px ceiling after about a hundred
   * world px and stays pinned there, so it becomes a fixed displacement instead of
   * motion — the clouds sit slightly off and never appear to move. Measured per
   * drag it starts at zero every time the hand goes down, grows as the map is
   * pulled, and eases back when it is released: the band trails the ground and
   * catches up, which is what depth feels like.
   */
  const [dragOriginPan, setDragOriginPan] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const hasAutoFitted = useRef(false);
  const prevAutoFitTrigger = useRef(autoFitTrigger);

  const resolvedImageFit = imageFitProp ?? manifest.renderer?.imageFit ?? 'fill';
  const resolvedAutoFit = autoFitProp ?? manifest.renderer?.autoFit ?? false;

  const { width, height } = manifest.coordinateSystem.canvas;
  const bounds = useMemo(
    () => manifest.camera.bounds ?? { minX: 0, maxX: width, minY: 0, maxY: height },
    [manifest.camera.bounds, width, height],
  );

  const visualStateMap = useMemo(() => {
    const map = new Map<string, WorldSurfaceVisualState>();
    for (const state of manifest.visualStates) {
      map.set(state.id, state);
    }
    return map;
  }, [manifest.visualStates]);

  const resolvedActiveStateId = useMemo(() => {
    if (activeVisualStateId && visualStateMap.has(activeVisualStateId)) {
      return activeVisualStateId;
    }
    const base = manifest.visualStates.find((s) => s.base);
    return base?.id ?? (manifest.visualStates[0]?.id || 'default');
  }, [activeVisualStateId, manifest.visualStates, visualStateMap]);

  const activeOverrides = useMemo(() => {
    const stateOverrides = visualStateMap.get(resolvedActiveStateId)?.overrides ?? [];
    // Runtime overrides are applied after state overrides so effects can refine
    // the active visual state without editing the manifest.
    return visualStateOverrides.length > 0
      ? [...stateOverrides, ...visualStateOverrides]
      : stateOverrides;
  }, [resolvedActiveStateId, visualStateMap, visualStateOverrides]);

  const effectiveLayers = useMemo<EffectiveLayer[]>(() => {
    const visibleSet =
      visibleLayerIds instanceof Set
        ? visibleLayerIds
        : new Set(visibleLayerIds ?? manifest.surfaceLayers.concat(manifest.atmosphereLayers).map((l) => l.id));

    const orderIndex = new Map<string, number>();
    if (surfaceLayerOrder) {
      surfaceLayerOrder.forEach((id, index) => orderIndex.set(id, index));
    }

    const sortByOrder = (a: WorldSurfaceLayer, b: WorldSurfaceLayer) => {
      const aOrder = orderIndex.get(a.id);
      const bOrder = orderIndex.get(b.id);
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.zIndex - b.zIndex;
    };

    return [...manifest.surfaceLayers, ...manifest.atmosphereLayers]
      .sort(sortByOrder)
      .map((layer) => applyOverrides(layer, activeOverrides))
      .filter((layer) => visibleSet.has(layer.id));
  }, [manifest, activeOverrides, visibleLayerIds, surfaceLayerOrder]);

  // Terrain layers paint at their own z-index, so the atmosphere has to be given
  // one above the highest of them rather than relying on DOM order.
  //
  // The carved frame is the exception: it is the window the world is seen through,
  // so weather has to pass UNDER it. Sitting above every layer put the clouds on
  // top of the frame, drifting over the border decoration.
  /**
   * Extra cloud offset in WORLD px.
   *
   * The world box translates by `-pan * zoom` in screen px and then scales, so a
   * child offset of `d` world px lands as `d * zoom` on screen. Getting the clouds
   * to 1.20x therefore needs `d = -excess * pan`, and the screen-space ceiling
   * becomes `max / zoom` in world units.
   */
  const cloudParallax = useMemo(() => {
    if (!dragOriginPan) return { x: 0, y: 0 };
    const limit = PARALLAX.maxOffsetScreenPx / Math.max(camera.zoom, 0.01);
    const clamp = (v: number) => Math.max(-limit, Math.min(limit, v));
    return {
      x: clamp(-PARALLAX.cloudExcess * (camera.panX - dragOriginPan.x)),
      y: clamp(-PARALLAX.cloudExcess * (camera.panY - dragOriginPan.y)),
    };
  }, [camera.panX, camera.panY, camera.zoom, dragOriginPan]);

  const cloudZIndex = useMemo(() => {
    const cloudsIndex = effectiveLayers.findIndex((layer) => layer.id === 'clouds');
    if (cloudsIndex === -1) {
      const top = effectiveLayers.reduce((max, layer) => Math.max(max, layer.zIndex), 0);
      const frame = effectiveLayers.find((layer) => layer.id === FRAME_LAYER_ID);
      return frame ? frame.zIndex - 1 : top + 10;
    }
    // Position the atmosphere immediately below the next layer in the ordered stack,
    // so dragging clouds in the debug panel actually changes its render order.
    const nextLayer = effectiveLayers[cloudsIndex + 1];
    if (nextLayer) return Math.max(0, nextLayer.zIndex - 1);
    const frame = effectiveLayers.find((layer) => layer.id === FRAME_LAYER_ID);
    return frame ? frame.zIndex - 1 : 1000;
  }, [effectiveLayers]);

  const atmosphereZIndex = useMemo(() => cloudZIndex - 0.5, [cloudZIndex]);

  const containerSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      containerSize.current = { width: el.clientWidth, height: el.clientHeight };
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (autoFitTrigger !== prevAutoFitTrigger.current) {
      prevAutoFitTrigger.current = autoFitTrigger;
      hasAutoFitted.current = false;
    }

    if (!resolvedAutoFit || hasAutoFitted.current || !containerRef.current || !onCameraChange) {
      return;
    }

    // Defer to next animation frame so the container has been laid out and has a non-zero size.
    const raf = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // imageFit:'none' means world div IS the canvas — use cover formula so the map
      // fills the viewport with no dark bg edges on initial load.
      const useCover = resolvedImageFit === 'cover' || resolvedImageFit === 'none';
      const rawFitZoom = useCover
        ? Math.max(rect.width / width, rect.height / height)
        : Math.min(rect.width / width, rect.height / height);
      const fitZoom = useCover ? rawFitZoom : Math.min(1, rawFitZoom);
      const clampedZoom = clampZoom(fitZoom, manifest.camera.minZoom, manifest.camera.maxZoom);

      onCameraChange({ panX: 0, panY: 0, zoom: clampedZoom });
      hasAutoFitted.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, [
    resolvedAutoFit,
    autoFitTrigger,
    resolvedImageFit,
    width,
    height,
    manifest.camera.minZoom,
    manifest.camera.maxZoom,
    onCameraChange,
  ]);

  const reportMouseWorld = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !onMouseWorldChange) return;
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      const world = viewportToWorld({ x: screenX, y: screenY }, camera);
      onMouseWorldChange(world);
    },
    [camera, onMouseWorldChange],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!manifest.camera.panEnabled) return;
      event.preventDefault();
      setIsDragging(true);
      setDragOriginPan({ x: camera.panX, y: camera.panY });
      dragStart.current = {
        x: event.clientX,
        y: event.clientY,
        panX: camera.panX,
        panY: camera.panY,
      };
    },
    [camera.panX, camera.panY, manifest.camera.panEnabled],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      reportMouseWorld(event.clientX, event.clientY);

      if (!isDragging || !dragStart.current || !manifest.camera.panEnabled) return;

      // Grab semantics: the map follows the hand. `panX` is the world point at the
      // viewport origin, so dragging the pointer LEFT has to INCREASE it — hence
      // start-minus-current, not current-minus-start. The inverted form scrolled the
      // map away from the cursor, which contradicts the grab/grabbing cursor.
      const dx = (dragStart.current.x - event.clientX) / camera.zoom;
      const dy = (dragStart.current.y - event.clientY) / camera.zoom;

      const nextPanX = dragStart.current.panX + dx;
      const nextPanY = dragStart.current.panY + dy;

      const clamped = clampPan(
        nextPanX,
        nextPanY,
        camera.zoom,
        containerSize.current,
        bounds,
      );

      onCameraChange({ ...camera, ...clamped });
    },
    [isDragging, camera, bounds, onCameraChange, reportMouseWorld, manifest.camera.panEnabled],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragOriginPan(null);
    dragStart.current = null;
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!manifest.camera.zoomEnabled) return;
      event.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;

      const worldX = screenX / camera.zoom + camera.panX;
      const worldY = screenY / camera.zoom + camera.panY;

      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      const nextZoom = clampZoom(
        camera.zoom * factor,
        manifest.camera.minZoom,
        manifest.camera.maxZoom,
      );

      const nextPanX = worldX - screenX / nextZoom;
      const nextPanY = worldY - screenY / nextZoom;

      const clamped = clampPan(nextPanX, nextPanY, nextZoom, containerSize.current, bounds);
      onCameraChange({ panX: clamped.panX, panY: clamped.panY, zoom: nextZoom });
    },
    [camera, bounds, manifest.camera, onCameraChange],
  );

  const worldStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    transformOrigin: 'top left',
    // `translateZ(0)` promotes the whole world-box to a single GPU compositing
    // layer, so every child layer is rasterized in the SAME space and rounds
    // subpixels identically during fractional zoom — no per-layer drift.
    // Requires: all layers full-canvas at offset 0/0, scale 1 (see worldSurfaceKit).
    transform: `translate(${-camera.panX * camera.zoom}px, ${-camera.panY * camera.zoom}px) scale(${camera.zoom}) translateZ(0)`,
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  };

  const worldCenter = useMemo(() => ({
    x: manifest.coordinateSystem.canvas.width / 2,
    y: manifest.coordinateSystem.canvas.height / 2,
  }), [manifest.coordinateSystem.canvas.width, manifest.coordinateSystem.canvas.height]);

  // Alpha centroids of the two painted layers, expressed as canvas fractions so
  // they survive a re-export at a different resolution:
  //  - forest_1_top_left ("Foresta 1 Alto Sin"): where the goblin sticker lands;
  //  - the village ("Villaggio"): what it slowly marches toward.
  const fallTarget = useMemo(() => {
    const canvas = manifest.coordinateSystem.canvas;
    return {
      x: Math.round(canvas.width * 0.239),
      y: Math.round(canvas.height * 0.417),
    };
  }, [manifest.coordinateSystem.canvas]);

  const marchTarget = useMemo(() => {
    const canvas = manifest.coordinateSystem.canvas;
    return {
      x: Math.round(canvas.width * 0.486),
      y: Math.round(canvas.height * 0.554),
    };
  }, [manifest.coordinateSystem.canvas]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative h-full w-full cursor-grab overflow-hidden bg-slate-950 active:cursor-grabbing"
      data-testid="world-surface-renderer"
      role="img"
      aria-label={translate('world.title')}
    >
      <style>{`
        @keyframes worldSurfaceWaveX {
          0% { transform: translateX(calc(var(--wave-amplitude, 0px) * -1)); }
          100% { transform: translateX(var(--wave-amplitude, 0px)); }
        }
        @keyframes worldSurfaceWaveY {
          0% { transform: translateY(calc(var(--wave-amplitude, 0px) * -1)); }
          100% { transform: translateY(var(--wave-amplitude, 0px)); }
        }
        @keyframes wsBreathSway {
          from { transform: translateX(calc(var(--sway-px, 3px) * -1)); }
          to   { transform: translateX(var(--sway-px, 3px)); }
        }
        @keyframes wsBreathShimmer {
          0%, 100% { opacity: var(--shimmer-lo, 0.88); }
          50%       { opacity: var(--shimmer-hi, 1); }
        }
      `}</style>

      {/*
        Gradient map for the event shroud. `feColorMatrix type="luminanceToAlpha"`
        is not what we want here: we need the parchment's own luminance re-mapped
        onto a teal ramp, so we desaturate first and then run each channel through
        a table transfer. The ink linework lands in the dark end of the ramp and
        goes deep teal; the cream highlights stay bright. Ramp values are config.
      */}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
      >
        <filter id={eventShroudGradeConfig.filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={eventShroudGradeConfig.ramp.red.join(' ')} />
            <feFuncG type="table" tableValues={eventShroudGradeConfig.ramp.green.join(' ')} />
            <feFuncB type="table" tableValues={eventShroudGradeConfig.ramp.blue.join(' ')} />
          </feComponentTransfer>
        </filter>
      </svg>

      <div style={worldStyle}>
        {effectiveLayers
          .filter((layer) => layer.id !== 'clouds')
          .map((layer) => (
            <LayerView
              key={layer.id}
              layer={layer}
            worldName={manifest.world}
            imageFit={resolvedImageFit}
            breathEnabled={breathEnabled}
            zoom={camera.zoom}
            canvasSize={manifest.coordinateSystem.canvas}
            scale={layerScales?.[layer.id] ?? layer.scale ?? 1}
            offset={
              layerOffsets?.[layer.id] ??
              (layer.id === 'event_shroud_left'
                ? { x: -manifest.coordinateSystem.canvas.width, y: 0 }
                : layer.id === 'event_shroud_right'
                  ? { x: manifest.coordinateSystem.canvas.width, y: 0 }
                  : {
                      x: layer.offsetX ?? 0,
                      y: layer.offsetY ?? 0,
                    })
            }
          />
        ))}

        {showRegions &&
          manifest.regions.map((region) => (
            <RegionOverlay key={region.id} region={region} t={translate} />
          ))}

        {showAnchors &&
          manifest.anchors.map((anchor) => (
            <AnchorMarker key={anchor.id} anchor={anchor} zoom={camera.zoom} t={translate} />
          ))}

        {renderObjects &&
          runtimeObjects.map((object) => (
            <RuntimeObjectMarker key={object.id} object={object} anchors={manifest.anchors} zoom={camera.zoom} />
          ))}

        {/*
          Clouds render ABOVE the terrain: the map is seen from above, so weather
          passes between the camera and the ground. Under the layers they would be
          invisible anyway — every terrain layer is an opaque full-canvas painting.
        */}
        <Suspense fallback={null}>
          {visibleLayerIds?.has('clouds') && !eventCovered && (
            <WorldSurfaceClouds
              canvasSize={manifest.coordinateSystem.canvas}
              zIndex={cloudZIndex}
              scales={cloudScales}
              parallaxOffset={cloudParallax}
            />
          )}
          {showAtmosphere && !eventCovered && (
            <WorldSurfaceAtmosphere
              canvasSize={manifest.coordinateSystem.canvas}
              zIndex={atmosphereZIndex}
            />
          )}
          {/* Birds fly under the weather but over the ground. */}
          <WorldSurfaceBirds
            canvasSize={manifest.coordinateSystem.canvas}
            zIndex={cloudZIndex - 1}
            enabled={!eventCovered}
          />
          {/* Sea creatures lurk in the water, below birds but above shadows. */}
          <WorldSurfaceCreatures
            creatures={runtimeObjects}
            zoom={camera.zoom}
            zIndex={cloudZIndex - 2}
            enabled={!eventCovered}
          />
          {/* Foam sits on the ground, so it goes below the birds. */}
          <WorldSurfaceFoam
            canvasSize={manifest.coordinateSystem.canvas}
            zIndex={cloudZIndex - 3}
          />
          {/* Wave marks break on the shoreline, at the bottom of the atmosphere
              stack: they belong to the water surface, not to the sky. */}
          <WorldSurfaceWaves zIndex={cloudZIndex - 4} />
          {/* Water field: broad light pools and drifting micro-detail over the sea. */}
          {showWaterField && (
            <WorldSurfaceWaterField
              canvasSize={manifest.coordinateSystem.canvas}
              zIndex={cloudZIndex - 6}
              config={waterFieldConfig}
            />
          )}
          {/*
            Water field: NOT mounted, deliberately.

            Two drifting detail tiles plus twelve broad light pools over the sea,
            built to answer "the map does not breathe". Both halves work and cost
            nothing measurable — 60fps unchanged — and neither is visible enough on
            the real artwork at the map's default 0.23 zoom to be worth the layers.
            The Director saw no difference.

            The measurements that said otherwise were wrong three separate ways: a
            5s sampling gap, which reads accumulated drift rather than the rate the
            eye responds to; too short a settle after seeking a paused animation; and
            a colour-keyed sea test that counts clouds crossing the water as the
            water itself changing.

            Left in the tree because the components and the tile generator are sound
            and the analysis written into them is worth keeping. Re-mounting is this
            one element. See RICHIESTE.md R-056.
          */}
          {/* Cloud shadows drift across the land, below the weather. */}
          <WorldSurfaceCloudShadows
            canvasSize={manifest.coordinateSystem.canvas}
            zIndex={cloudZIndex - 5}
            parallaxOffset={cloudParallax}
          />
          {/* Event announcement lives in the map, not the UI, so it pans and zooms
              with the world. */}
          <WorldSurfaceEventCard
            visible={showEventCard}
            zIndex={cloudZIndex + 1}
            onComplete={onEventCardComplete}
            onClose={onEventCardClose}
            fallTarget={fallTarget}
            marchTarget={marchTarget}
            worldCenter={worldCenter}
            canvasSize={manifest.coordinateSystem.canvas}
            camera={camera}
          />
        </Suspense>
        {children}
      </div>

      {/*
        Vignette. Sits OUTSIDE the world box on purpose: it is a property of how the
        map is lit and looked at, not an object in it, so it must not pan or zoom.
        Static, so it is rasterised once and costs nothing per frame — and flat,
        even lighting across the whole canvas is one of the main reasons a painted
        map reads as a flat scan rather than as a lit object.
      */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 500,
          background:
            'radial-gradient(120% 95% at 50% 45%, rgba(0,0,0,0) 52%, rgba(10,8,18,0.20) 78%, rgba(8,6,16,0.42) 100%)',
        }}
      />
    </div>
  );
};

function getRuntimeObjectWorldPosition(
  object: RuntimeObject,
  anchors: WorldSurfaceAnchor[],
): { x: number; y: number } {
  const { location } = object;

  if (location.mode === 'dynamic') {
    return { x: location.x, y: location.y };
  }

  if (location.mode === 'anchor') {
    const { anchorId } = location;
    const anchor = anchors.find((a) => a.id === anchorId);
    if (anchor) return { x: anchor.x, y: anchor.y };
  }

  if (location.mode === 'path') {
    const { pathId } = location;
    const anchor = anchors.find((a) => a.id === pathId);
    if (anchor) return { x: anchor.x, y: anchor.y };
  }

  return { x: 0, y: 0 };
}

interface RuntimeObjectMarkerProps {
  object: RuntimeObject;
  anchors: WorldSurfaceAnchor[];
  zoom: number;
}

const RuntimeObjectMarker: React.FC<RuntimeObjectMarkerProps> = ({ object, anchors, zoom }) => {
  const position = useMemo(() => getRuntimeObjectWorldPosition(object, anchors), [object, anchors]);
  const { renderMode, scale, tint, glow } = object.visual;

  // Sea wonders and creatures have dedicated visual components (WorldSurfaceCreatures)
  // and should not also render as a generic runtime marker.
  if (object.type === 'wonder' || object.type === 'sea_creature') {
    return null;
  }

  const visualScale = scale > 0 ? scale : 1;
  const size = renderMode === 'particle' ? 6 : 16;
  const pixelSize = size * visualScale;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    transform: `translate(-50%, -50%) scale(${1 / zoom})`,
    transformOrigin: 'center',
    color: tint ?? '#fbbf24',
    textShadow: glow ? `0 0 ${4 / zoom}px currentColor` : undefined,
  };

  if (renderMode === 'text') {
    return (
      <div style={style} aria-hidden="true">
        {object.visual.iconKey || '●'}
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        width: pixelSize,
        height: pixelSize,
        borderRadius: '50%',
        backgroundColor: tint ?? '#fbbf24',
        boxShadow: glow ? `0 0 ${6 / zoom}px ${tint ?? '#fbbf24'}` : undefined,
      }}
      aria-hidden="true"
    />
  );
};

interface LayerViewProps {
  layer: EffectiveLayer;
  worldName: string;
  imageFit: 'fill' | 'cover' | 'contain' | 'none';
  breathEnabled?: boolean;
  zoom: number;
  /** World canvas size, needed to size the sea ripple canvas. */
  canvasSize: { width: number; height: number };
  scale?: number;
  offset?: { x: number; y: number };
}

const LayerView: React.FC<LayerViewProps> = ({ layer, worldName, imageFit, breathEnabled = true, zoom, canvasSize, scale = 1, offset = { x: 0, y: 0 } }) => {
  // No per-layer parallax counter-translate.
  //
  // The parent worldStyle div already pans the whole map by -panX*zoom. An earlier
  // version additionally translated each layer by +panX*(1 - layer.parallax.x),
  // which left a NET displacement of -panX*zoom*parallax.x — and since every layer
  // in the shipped manifest declares parallax.y = 0 and parallax.x <= 0.19, the map
  // could not be panned vertically at all and moved at most 19% horizontally, while
  // the atmosphere layers (which have no such compensation) moved fully. Dragging
  // therefore appeared to move only the clouds.
  //
  // A depth-parallax map is also incompatible with the frozen World Surface
  // invariant that every layer is one full-canvas 4240x2828 painting at offset 0/0:
  // sliding those against each other exposes seams rather than revealing depth.
  // Keeping layers untransformed also keeps them in the parent's compositing
  // context, so all of them round subpixels identically at fractional zoom.
  const isEventShroud = layer.id.startsWith('event_shroud_');

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: layer.zIndex,
    opacity: layer.opacity,
    pointerEvents: 'none',
    overflow: isEventShroud ? 'hidden' : undefined,
    // The carved frame casts onto the map instead of floating over it. This is a
    // filter, which is expensive on ANIMATED elements — the frame never moves, so
    // it rasterises once and is reused.
    ...(layer.id === FRAME_LAYER_ID
      ? { filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.55))' }
      : {}),
  };

  const waveStyle = useLayerAnimation(layer);
  const breathSpec = breathEnabled ? BREATH_MAP[layer.id] : undefined;
  // `swayPx` is the amplitude the player should PERCEIVE, in screen pixels. The
  // layer lives in world space and is scaled by the camera zoom on the way to the
  // screen, so dividing by zoom keeps the perceived motion constant. Without this
  // the sway vanishes at the default fit zoom (~0.24), where an uncompensated 3px
  // amplitude lands at 0.7px and is simply invisible.
  const breathStyle: React.CSSProperties = {};
  if (breathSpec) {
    const { swayPx, ...cssProps } = breathSpec;
    Object.assign(breathStyle, cssProps);
    (breathStyle as Record<string, string>)['--sway-px'] = `${swayPx / zoom}px`;
  }
  const animationStyle = { ...waveStyle, ...breathStyle };

  const imgStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    border: 0,
    outline: 'none',
    objectFit: isEventShroud ? 'cover' : imageFit,
    objectPosition: isEventShroud
      ? (layer.id.includes('left') ? 'left center' : 'right center')
      : (imageFit === 'none' ? '0 0' : undefined),
    mixBlendMode: BLEND_MODE_CSS[layer.blendMode],
    // The shroud is graded to deep teal as it travels, so the colour arrives WITH
    // the curtains instead of appearing once they have closed. The filter applies
    // to the asset's own pixels, alpha included, so it cannot bleed onto the map
    // through the transparent gaps the way a full-rect overlay would.
    filter: layer.grayscale
      ? 'grayscale(100%)'
      : isEventShroud && eventShroudGradeConfig.enabled
        ? `url(#${eventShroudGradeConfig.filterId})`
        : undefined,
    ...animationStyle,
  };

  const { x: offsetX, y: offsetY } = offset;
  const [hasError, setHasError] = useState(false);

  const handleImageError = useCallback(() => {
    if (hasError) return;
    setHasError(true);
    trackTelemetryEvent('world_surface_image_load_failed', {
      layerId: layer.id,
      file: layer.file,
      world: worldName,
      context: 'world-surface-renderer',
    });
  }, [hasError, layer.id, layer.file, worldName]);

  const hasScaleTransform = scale !== 1 || offsetX !== 0 || offsetY !== 0;
  const scaleStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    ...(hasScaleTransform
      ? { transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, transformOrigin: 'top left' }
      : {}),
    ...(isEventShroud ? { transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)' } : {}),
  };

  return (
    <div style={wrapperStyle}>
      <div style={scaleStyle}>
        {!hasError ? (
          <img
            src={
              layer.file.includes('/')
                ? `/assets/atmosphere/${layer.file.split('/').map(encodeURIComponent).join('/')}`
                : `/assets/world/${worldName}/base/layers/${encodeURIComponent(layer.file)}`
            }
            alt=""
            style={imgStyle}
            draggable={false}
            onError={handleImageError}
          />
        ) : (
          <div style={{ ...imgStyle, opacity: 0 }} aria-hidden="true" />
        )}
        {layer.tint && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: layer.tint,
              mixBlendMode: layer.tintBlendMode,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
};

function useLayerAnimation(layer: EffectiveLayer): React.CSSProperties {
  if (!layer.animation || layer.animation.mode === 'none' || layer.animation.speed <= 0) {
    return {};
  }

  const duration = 1 / layer.animation.speed;
  const isVertical = ['up', 'down'].includes(layer.animation.direction);
  const axis = isVertical ? 'worldSurfaceWaveY' : 'worldSurfaceWaveX';
  const direction =
    layer.animation.direction === 'left' || layer.animation.direction === 'up'
      ? 'alternate-reverse'
      : 'alternate';

  return {
    ['--wave-amplitude' as string]: `${layer.animation.amplitude}px`,
    animation: `${axis} ${duration}s linear infinite ${direction}`,
  };
}

interface RegionOverlayProps {
  region: WorldSurfaceRegion;
  t: (key: string) => string;
}

const RegionOverlay: React.FC<RegionOverlayProps> = ({ region, t }) => {
  const centerX = region.bounds.x + region.bounds.width / 2;
  const centerY = region.bounds.y + region.bounds.height / 2;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: region.bounds.x,
          top: region.bounds.y,
          width: region.bounds.width,
          height: region.bounds.height,
          border: '1px dashed rgba(251, 191, 36, 0.4)',
          backgroundColor: 'rgba(251, 191, 36, 0.05)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: centerX,
          top: centerY,
          transform: 'translate(-50%, -50%)',
          color: 'rgba(251, 191, 36, 0.8)',
          fontSize: 'calc(10px / var(--zoom, 1))',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {t(region.nameKey)}
      </div>
    </>
  );
};

interface AnchorMarkerProps {
  anchor: WorldSurfaceAnchor;
  zoom: number;
  t: (key: string) => string;
}

const AnchorMarker: React.FC<AnchorMarkerProps> = ({ anchor, zoom, t }) => {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: anchor.x,
          top: anchor.y,
          width: `calc(14px / ${zoom})`,
          height: `calc(14px / ${zoom})`,
          backgroundColor: '#fbbf24',
          border: `calc(2px / ${zoom}) solid #1e293b`,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          boxShadow: '0 0 4px rgba(251,191,36,0.6)',
        }}
      />
      {anchor.labelKey && (
        <div
          style={{
            position: 'absolute',
            left: anchor.x,
            top: anchor.y,
            transform: `translate(-50%, calc(-100% - (4px / ${zoom})))`,
            color: '#fbbf24',
            fontSize: `calc(11px / ${zoom})`,
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {t(anchor.labelKey)}
        </div>
      )}
    </>
  );
};
