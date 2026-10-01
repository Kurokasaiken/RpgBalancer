/**
 * worldSurfaceKit
 *
 * Frozen re-export of the canonical multi-layer World Surface map plus a
 * one-line drop-in (`WorldSurfaceStandalone`) that wires the camera state
 * internally, so any page can mount the pixel-perfect layered map with a
 * single import.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { WorldSurfaceStandalone } from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
 *
 *   <WorldSurfaceStandalone />                       // Wanderlust base map
 *   <WorldSurfaceStandalone manifestPath="/assets/world/xxx/base/manifest.json" />
 *
 * ── FROZEN CONTRACT (do NOT break) ───────────────────────────────────────────
 * The perfect layer alignment depends entirely on the ASSET invariants, not on
 * runtime numbers. Every layer PNG MUST be full-canvas (same size as
 * coordinateSystem.canvas) and every manifest layer MUST have offsetX:0,
 * offsetY:0 and NO scale. Positions are "baked" into the transparent PNGs by
 * the extraction pipeline. See worldSurfaceKit.md for the full rationale and the
 * regeneration procedure. The guard test
 * `tests/unit/frozen/worldSurfaceKit.alignment.test.ts` enforces these invariants.
 *
 * Reference page: src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx (route /world-surface)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WorldSurfaceRenderer } from '@/ui/idleVillage/components/WorldSurfaceRenderer';
import { WorldSurfaceSeaMargin } from '@/ui/idleVillage/components/WorldSurfaceSeaMargin';
import { useWorldSurface } from '@/ui/idleVillage/hooks/useWorldSurface';
import type { WorldSurfaceVisualStateOverride } from '@/ui/idleVillage/config/worldSurfaceConfig';
import type { SeaRippleConfig } from '@/ui/idleVillage/config/atmosphereAssets';

// Canonical surface — re-exported, never re-implemented.
export { WorldSurfaceRenderer } from '@/ui/idleVillage/components/WorldSurfaceRenderer';
export { useWorldSurface, validateWorldSurfaceManifest } from '@/ui/idleVillage/hooks/useWorldSurface';
export type { UseWorldSurfaceResult } from '@/ui/idleVillage/hooks/useWorldSurface';
export type {
  WorldSurfaceManifest,
  WorldSurfaceLayer,
  WorldSurfaceVisualStateOverride,
} from '@/ui/idleVillage/config/worldSurfaceConfig';

/** Canonical Wanderlust base map (full-canvas layers, offset 0/0). */
export const WANDERLUST_BASE_MANIFEST = '/assets/world/wanderlust/base/manifest.json';

/**
 * The kit needs no local provider chain: the renderer only consumes the global
 * i18n provider and the global world store (`useWorldState`, zustand), both of
 * which exist app-wide. Kept as a named constant for parity with other kits.
 */
export const WORLD_SURFACE_PROVIDER_CHAIN = [] as const;

/**
 * Frame the LAND, not the canvas: fit the land's bounding box inside the area the
 * chrome leaves free, and let the camera run past the left/right canvas edge over
 * `seaMarginPx` of placeholder sea (see `WorldSurfaceSeaMargin`). Vertical bounds stay
 * on the canvas.
 */
export interface WorldSurfaceSafeFit {
  /** Bounding box of the land in world px (from the land mask). */
  landBounds: { x0: number; x1: number; y0: number; y1: number };
  /** Screen px the chrome occupies at each edge of the container. */
  insets: { top: number; bottom: number; left?: number; right?: number };
  /** Extra sea each side of the canvas. Must stay below the land's distance from the canvas sides. */
  seaMarginPx: number;
}

export interface WorldSurfaceStandaloneProps {
  /** Manifest to load. Defaults to the Wanderlust base map. */
  manifestPath?: string;
  /** Initial camera zoom; falls back to the manifest's `defaultZoom`. */
  initialZoom?: number;
  /** Show settlement/landmark anchors. */
  showAnchors?: boolean;
  /** Show region overlays. */
  showRegions?: boolean;
  /**
   * Cloud-shadow breathing on the terrain. Defaults to `true`: desiderata v19
   * (`.mw/desiderata.md`) makes this "sempre attivo... non legato a un flag",
   * not an opt-in effect.
   */
  breathEnabled?: boolean;
  /** Ambient life layer (light rays, dust, birds). */
  showAtmosphere?: boolean;
  /**
   * Painted water effects. All three default ON inside `WorldSurfaceRenderer`
   * and were previously not reachable through this kit, so every consumer got
   * them whether or not it wanted them: measured on `/game-frame`, they add
   * 34 wave sprites and a stack of `mix-blend-mode` elements that repaint
   * continuously. Exposed here so a consumer can opt out.
   */
  showSeaMarks?: boolean;
  showWaves?: boolean;
  showSeaRipple?: boolean;
  /** Overrides for the ripple (e.g. `animateFrequency: false` for the cheap variant). */
  seaRippleConfig?: SeaRippleConfig;
  /**
   * Open-sea pattern. Unlike every other water effect this one is a WebGL2
   * shader on its own canvas, kept under the compositing texture ceiling and
   * driven by `setInterval` rather than rAF — the GPU path, not the CPU one.
   */
  showSeaPattern?: boolean;
  /** Older scrolling foam texture (default on, as before). */
  showFoam?: boolean;
  /** Foam that laps the shore: WebGL shader over a baked distance-to-coast field. */
  showCoastFoam?: boolean;
  /**
   * The glass "teca" overlay. Two blurred SVG paths at opacity 0.035-0.05 —
   * measured 369 kpx of filtered surface for something all but invisible.
   */
  showGlass?: boolean;
  /**
   * Visual-state overrides applied on top of the manifest's base layers —
   * `set_visibility`, `set_opacity`, `tint_layer`, `apply_condition`,
   * `set_animation`. Lets a consumer dress the world (hide the baked frame,
   * push a layer's hue) without editing the asset or the manifest.
   */
  visualStateOverrides?: WorldSurfaceVisualStateOverride[];
  /** Extra class on the fill container (must have a sized parent). */
  className?: string;
  /** Bump to discard the viewer's pan/zoom and re-fit the map (e.g. a "re-centre" control). */
  recenterSignal?: number;
  /** Fit the land inside the chrome-free area instead of cover-fitting the canvas. */
  safeFit?: WorldSurfaceSafeFit;
}

/**
 * Drop-in variant: the canonical layered map, camera state managed internally.
 * Mount it inside any sized container.
 */
export const WorldSurfaceStandalone: React.FC<WorldSurfaceStandaloneProps> = ({
  manifestPath = WANDERLUST_BASE_MANIFEST,
  initialZoom,
  showAnchors = false,
  showRegions = false,
  breathEnabled = true,
  showAtmosphere = false,
  showSeaMarks = true,
  showWaves = false,
  showSeaRipple = true,
  seaRippleConfig,
  showSeaPattern = false,
  showFoam = true,
  showCoastFoam = false,
  showGlass = true,
  visualStateOverrides,
  className,
  recenterSignal = 0,
  safeFit,
}) => {
  const { isLoading, error, manifest, cameraConfig } = useWorldSurface(manifestPath);

  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<{ panX: number; panY: number; zoom: number } | null>(null);
  // Once the viewer pans/zooms by hand, auto-fit must stop overriding them on
  // every resize — otherwise their own camera would snap back mid-interaction.
  const userHasInteracted = useRef(false);
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);

  /**
   * Cover-fit the canvas into whatever the container measures, centred.
   *
   * `WorldSurfaceRenderer`'s own internal autoFit effect does not reliably
   * apply on first mount (observed: camera stays at pan 0/0, zoom 1 — i.e.
   * `manifest.coordinateSystem.canvas` rendered at native size inside a much
   * smaller container, so only a tiny corner of the map is visible, wildly
   * zoomed in). Passing `autoFit`/`imageFit` through to the renderer is kept
   * below in case that gets fixed, but this kit no longer *depends* on it —
   * it computes and owns a correct initial (and resize-reactive) camera
   * itself, the same responsibility `WanderlustSurface` already gives itself
   * via its own `ResizeObserver`.
   *
   * COVER, not CONTAIN: the renderer clamps `panX`/`panY` to `[0, canvas
   * size]` (`clampPan` in `WorldSurfaceRenderer.tsx`) so the painted quads
   * never scroll into empty space beyond the canvas — by design, per Pillar
   * 1 (no bare canvas edges). A contain-fit (`Math.min`) can ask for a
   * *negative* centring pan on the axis with slack, which the renderer then
   * clamps back to 0 — silently overriding the centring and re-introducing
   * the crop/off-centre bug this effect exists to fix. `Math.max` guarantees
   * the fitted canvas always covers the container on both axes, so the
   * centring pan this computes is never negative and is never clamped away.
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !manifest || !cameraConfig) return;
    // Re-running this effect (manifest change or `recenterSignal` bump) hands the camera back to auto-fit;
    // the ResizeObserver below fires once on observe, which performs the fit.
    userHasInteracted.current = false;

    const canvas = manifest.coordinateSystem.canvas;
    const fit = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      setViewport((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
      if (userHasInteracted.current) return;
      if (safeFit) {
        const { landBounds: land, insets, seaMarginPx } = safeFit;
        const left = insets.left ?? 0;
        const right = insets.right ?? 0;
        const freeW = width - left - right;
        const freeH = height - insets.top - insets.bottom;
        const safeZoom = Math.min(freeW / (land.x1 - land.x0), freeH / (land.y1 - land.y0));
        // Never show more than canvas + margin horizontally, nor more than the canvas vertically.
        const floorZoom = Math.max(width / (canvas.width + 2 * seaMarginPx), height / canvas.height);
        const zoom = Math.min(cameraConfig.maxZoom, Math.max(cameraConfig.minZoom, safeZoom, floorZoom));
        const landCx = (land.x0 + land.x1) / 2;
        const landCy = (land.y0 + land.y1) / 2;
        const panX = landCx - (left + freeW / 2) / zoom;
        const panY = landCy - (insets.top + freeH / 2) / zoom;
        const maxPanX = Math.max(-seaMarginPx, canvas.width + seaMarginPx - width / zoom);
        const maxPanY = Math.max(0, canvas.height - height / zoom);
        setCamera({
          panX: Math.min(Math.max(panX, -seaMarginPx), maxPanX),
          panY: Math.min(Math.max(panY, 0), maxPanY),
          zoom,
        });
        return;
      }
      const rawZoom = Math.max(width / canvas.width, height / canvas.height);
      const zoom = Math.min(cameraConfig.maxZoom, Math.max(cameraConfig.minZoom, rawZoom));
      const panX = (canvas.width - width / zoom) / 2;
      const panY = (canvas.height - height / zoom) / 2;
      setCamera({ panX, panY, zoom });
    };

    // No synchronous `fit(el.clientWidth, el.clientHeight)` kickoff here on
    // purpose: measured live, that raced ahead of layout on first mount (the
    // container reported a smaller, not-yet-settled height, e.g. 683px
    // instead of a final 768px), producing a correct-looking but too-tight
    // cover-fit. `ResizeObserver` fires its own first callback once layout
    // has actually settled, with the real size — waiting for that is the fix.
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      fit(width, height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [manifest, cameraConfig, recenterSignal, safeFit]);

  const rendererManifest = useMemo(() => {
    if (!manifest || !safeFit) return manifest;
    const canvas = manifest.coordinateSystem.canvas;
    const m = safeFit.seaMarginPx;
    const floorZoom = viewport
      ? Math.max(viewport.width / (canvas.width + 2 * m), viewport.height / canvas.height)
      : 0;
    return {
      ...manifest,
      camera: {
        ...manifest.camera,
        bounds: { minX: -m, maxX: canvas.width + m, minY: 0, maxY: canvas.height },
        minZoom: Math.max(manifest.camera.minZoom, floorZoom),
      },
    };
  }, [manifest, safeFit, viewport]);

  const seaMargin = useMemo(() => {
    if (!manifest || !safeFit) return undefined;
    const fileUrl = (id: string) => {
      const layer = manifest.surfaceLayers.find((l) => l.id === id);
      return layer ? `/assets/world/${manifest.world}/base/layers/${encodeURIComponent(layer.file)}` : null;
    };
    const sources = [fileUrl('base_flat') ?? fileUrl('background'), fileUrl('sea')].filter(
      (u): u is string => u !== null,
    );
    return (
      <WorldSurfaceSeaMargin
        canvas={manifest.coordinateSystem.canvas}
        marginPx={safeFit.seaMarginPx}
        sources={sources}
      />
    );
  }, [manifest, safeFit]);

  const resolvedCamera =
    camera ?? { panX: 0, panY: 0, zoom: initialZoom ?? cameraConfig?.defaultZoom ?? 1 };

  const handleCameraChange = useCallback((next: { panX: number; panY: number; zoom: number }) => {
    userHasInteracted.current = true;
    setCamera(next);
  }, []);

  if (isLoading || !manifest) {
    return <div ref={containerRef} className={className} aria-busy="true" />;
  }
  if (error) {
    return (
      <div ref={containerRef} className={className} role="alert">
        {`World surface failed to load: ${error.message}`}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <WorldSurfaceRenderer
        manifest={rendererManifest ?? manifest}
        worldBackdrop={seaMargin}
        camera={resolvedCamera}
        onCameraChange={handleCameraChange}
        showAnchors={showAnchors}
        showRegions={showRegions}
        breathEnabled={breathEnabled}
        showAtmosphere={showAtmosphere}
        showSeaMarks={showSeaMarks}
        showWaves={showWaves}
        showSeaRipple={showSeaRipple}
        seaRippleConfig={seaRippleConfig}
        showSeaPattern={showSeaPattern}
        showFoam={showFoam}
        showCoastFoam={showCoastFoam}
        showGlass={showGlass}
        visualStateOverrides={visualStateOverrides}
        imageFit={manifest.renderer?.imageFit ?? 'none'}
        // Deliberately NOT `manifest.renderer?.autoFit`. This kit computes and owns
        // a correct, resize-reactive camera itself (see the effect above) — passing
        // the manifest's own autoFit through re-enables the renderer's INTERNAL
        // autoFit effect at the same time, and the two raced: the renderer's fired
        // one frame later with its own stale/incorrect fit (a formula bug, now fixed
        // separately in WorldSurfaceRenderer.tsx), called `onCameraChange`, and this
        // kit's `handleCameraChange` treated that as a real user interaction —
        // setting `userHasInteracted.current = true` and permanently locking out
        // every future re-fit on resize. Symptom, reproduced 2026-09-22 on
        // `/game-frame` at a 2000x1024 container: the map letterboxed at ~0.36x
        // zoom instead of covering at ~0.47x, leaving raw background down one edge.
        // Even with the renderer's formula corrected, two independent fit effects
        // racing on mount is fragile — this kit has no reason to run both.
        autoFit={false}
      />
    </div>
  );
};
