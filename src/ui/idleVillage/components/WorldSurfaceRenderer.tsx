import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface WorldSurfaceRendererProps {
  manifest: WorldSurfaceManifest;
  camera: { panX: number; panY: number; zoom: number };
  onCameraChange: (camera: { panX: number; panY: number; zoom: number }) => void;
  activeVisualStateId?: string;
  visualStateOverrides?: WorldSurfaceVisualStateOverride[];
  visibleLayerIds?: Set<string> | string[];
  layerScales?: Record<string, number>;
  layerOffsets?: Record<string, { x: number; y: number }>;
  onMouseWorldChange?: (point: { x: number; y: number } | null) => void;
  showAnchors?: boolean;
  showRegions?: boolean;
  runtimeObjects?: RuntimeObject[];
  renderObjects?: boolean;
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
  onMouseWorldChange,
  showAnchors = true,
  showRegions = true,
  runtimeObjects = [],
  renderObjects = true,
}) => {
  const { t } = useTranslation('idleVillage');
  const translate = useCallback(
    (key: string) => String(t(key as never)),
    [t],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

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

    return manifest.surfaceLayers
      .concat(manifest.atmosphereLayers)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((layer) => applyOverrides(layer, activeOverrides))
      .filter((layer) => visibleSet.has(layer.id));
  }, [manifest, activeOverrides, visibleLayerIds]);

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

      const dx = (event.clientX - dragStart.current.x) / camera.zoom;
      const dy = (event.clientY - dragStart.current.y) / camera.zoom;

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
    transform: `translate(${-camera.panX * camera.zoom}px, ${-camera.panY * camera.zoom}px) scale(${camera.zoom})`,
  };

  const worldPoint = { x: camera.panX, y: camera.panY };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative h-full w-full cursor-grab overflow-hidden bg-slate-950 active:cursor-grabbing"
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
      `}</style>

      <div style={worldStyle}>
        {effectiveLayers.map((layer) => (
          <LayerView
            key={layer.id}
            layer={layer}
            worldPoint={worldPoint}
            worldName={manifest.world}
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
      </div>
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
  worldPoint: { x: number; y: number };
  worldName: string;
  scale?: number;
  offset?: { x: number; y: number };
}

const LayerView: React.FC<LayerViewProps> = ({ layer, worldPoint, worldName, scale = 1, offset = { x: 0, y: 0 } }) => {
  const parallaxX = worldPoint.x * (1 - layer.parallax.x);
  const parallaxY = worldPoint.y * (1 - layer.parallax.y);

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: layer.zIndex,
    opacity: layer.opacity,
    transform: `translate(${parallaxX}px, ${parallaxY}px)`,
    transformOrigin: 'top left',
  };

  const animationStyle = useLayerAnimation(layer);

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'fill',
    mixBlendMode: BLEND_MODE_CSS[layer.blendMode],
    filter: layer.grayscale ? 'grayscale(100%)' : undefined,
    ...animationStyle,
  };

  const { x: offsetX, y: offsetY } = offset;

  const scaleStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
    transformOrigin: 'top left',
  };

  return (
    <div style={wrapperStyle}>
      <div style={scaleStyle}>
        <img
          src={`/assets/world/${worldName}/base/layers/${layer.file}`}
          alt=""
          style={imgStyle}
          draggable={false}
        />
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
