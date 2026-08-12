import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RuntimeObject } from '../../../engine/world/model/RuntimeObject';
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

const WorldSurfaceWaves = lazy(() => import('./WorldSurfaceWaves'));
const WorldSurfaceClouds = lazy(() => import('./WorldSurfaceClouds'));
const WorldSurfaceCloudShadows = lazy(() => import('./WorldSurfaceCloudShadows'));
const WorldSurfaceFoam = lazy(() => import('./WorldSurfaceFoam'));
const WorldSurfaceBirds = lazy(() => import('./WorldSurfaceBirds'));

/** Layer the shallow-water tint is composited onto. */
const SEA_LAYER_ID = 'sea';

/**
 * Carved border the world is seen through. Atmosphere layers paint below it, so
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

interface WorldSurfaceRendererProps {
  manifest: WorldSurfaceManifest;
  camera: { panX: number; panY: number; zoom: number };
  onCameraChange: (camera: { panX: number; panY: number; zoom: number }) => void;
  activeVisualStateId?: string;
  visualStateOverrides?: WorldSurfaceVisualStateOverride[];
  visibleLayerIds?: Set<string> | string[];
  layerScales?: Record<string, number>;
  layerOffsets?: Record<string, { x: number; y: number }>;
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
  surfaceLayerOrder,
  onMouseWorldChange,
  showAnchors = true,
  showRegions = true,
  runtimeObjects = [],
  renderObjects = true,
  imageFit: imageFitProp,
  autoFit: autoFitProp,
  autoFitTrigger = 1,
  breathEnabled = true,
}) => {
  const { t } = useTranslation('idleVillage');
  const translate = useCallback(
    (key: string) => String(t(key as never)),
    [t],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
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
  const cloudZIndex = useMemo(() => {
    const top = effectiveLayers.reduce((max, layer) => Math.max(max, layer.zIndex), 0);
    const frame = effectiveLayers.find((layer) => layer.id === FRAME_LAYER_ID);
    return frame ? frame.zIndex - 1 : top + 10;
  }, [effectiveLayers]);

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

      <div style={worldStyle}>
        {effectiveLayers.map((layer) => (
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
              layerOffsets?.[layer.id] ?? {
                x: layer.offsetX ?? 0,
                y: layer.offsetY ?? 0,
              }
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
          <WorldSurfaceClouds
            canvasSize={manifest.coordinateSystem.canvas}
            zIndex={cloudZIndex}
          />
          {/* Birds fly under the weather but over the ground. */}
          <WorldSurfaceBirds
            canvasSize={manifest.coordinateSystem.canvas}
            zIndex={cloudZIndex - 1}
          />
          {/* Shadows and foam both sit ON the ground, so they go below the birds. */}
          <WorldSurfaceCloudShadows
            canvasSize={manifest.coordinateSystem.canvas}
            zIndex={cloudZIndex - 2}
          />
          <WorldSurfaceFoam
            canvasSize={manifest.coordinateSystem.canvas}
            zIndex={cloudZIndex - 3}
          />
          {/* Wave marks break on the shoreline, at the bottom of the atmosphere
              stack: they belong to the water surface, not to the sky. */}
          <WorldSurfaceWaves zIndex={cloudZIndex - 4} />
        </Suspense>
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
  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: layer.zIndex,
    opacity: layer.opacity,
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
    objectFit: imageFit,
    objectPosition: imageFit === 'none' ? '0 0' : undefined,
    mixBlendMode: BLEND_MODE_CSS[layer.blendMode],
    filter: layer.grayscale ? 'grayscale(100%)' : undefined,
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
  };

  return (
    <div style={wrapperStyle}>
      <div style={scaleStyle}>
        {!hasError ? (
          <img
            src={`/assets/world/${worldName}/base/layers/${encodeURIComponent(layer.file)}`}
            alt=""
            style={imgStyle}
            draggable={false}
            onError={handleImageError}
          />
        ) : (
          <div style={{ ...imgStyle, opacity: 0 }} aria-hidden="true" />
        )}
        {/* Shallow-water tint, over the sea image and under everything on land.
            Derived from the distance to the nearest shore, so coastal water reads
            lighter than open ocean. Baked into a mask at build time: a depth
            gradient computed in a shader would cost a pass to say the same thing,
            and this one costs a static composite. */}
        {!hasError && layer.id === SEA_LAYER_ID && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundColor: 'rgba(196, 214, 205, 0.30)',
              maskImage: 'url(/assets/atmosphere/terrain/shallow_mask.webp)',
              WebkitMaskImage: 'url(/assets/atmosphere/terrain/shallow_mask.webp)',
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
            }}
          />
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
