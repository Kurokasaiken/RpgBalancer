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

import { useCallback, useMemo, useState } from 'react';
import { WorldSurfaceRenderer } from '@/ui/idleVillage/components/WorldSurfaceRenderer';
import { useWorldSurface } from '@/ui/idleVillage/hooks/useWorldSurface';

// Canonical surface — re-exported, never re-implemented.
export { WorldSurfaceRenderer } from '@/ui/idleVillage/components/WorldSurfaceRenderer';
export { useWorldSurface, validateWorldSurfaceManifest } from '@/ui/idleVillage/hooks/useWorldSurface';
export type { UseWorldSurfaceResult } from '@/ui/idleVillage/hooks/useWorldSurface';
export type {
  WorldSurfaceManifest,
  WorldSurfaceLayer,
} from '@/ui/idleVillage/config/worldSurfaceConfig';

/** Canonical Wanderlust base map (full-canvas layers, offset 0/0). */
export const WANDERLUST_BASE_MANIFEST = '/assets/world/wanderlust/base/manifest.json';

/**
 * The kit needs no local provider chain: the renderer only consumes the global
 * i18n provider and the global world store (`useWorldState`, zustand), both of
 * which exist app-wide. Kept as a named constant for parity with other kits.
 */
export const WORLD_SURFACE_PROVIDER_CHAIN = [] as const;

export interface WorldSurfaceStandaloneProps {
  /** Manifest to load. Defaults to the Wanderlust base map. */
  manifestPath?: string;
  /** Initial camera zoom; falls back to the manifest's `defaultZoom`. */
  initialZoom?: number;
  /** Show settlement/landmark anchors. */
  showAnchors?: boolean;
  /** Show region overlays. */
  showRegions?: boolean;
  /** Extra class on the fill container (must have a sized parent). */
  className?: string;
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
  className,
}) => {
  const { isLoading, error, manifest, cameraConfig } = useWorldSurface(manifestPath);

  const [camera, setCamera] = useState<{ panX: number; panY: number; zoom: number } | null>(null);

  // Resolve the initial camera once the manifest (and its defaultZoom) is known.
  const resolvedCamera = useMemo(() => {
    if (camera) return camera;
    const zoom = initialZoom ?? cameraConfig?.defaultZoom ?? 1;
    return { panX: 0, panY: 0, zoom };
  }, [camera, initialZoom, cameraConfig]);

  const handleCameraChange = useCallback(
    (next: { panX: number; panY: number; zoom: number }) => setCamera(next),
    [],
  );

  if (isLoading || !manifest) {
    return <div className={className} aria-busy="true" />;
  }
  if (error) {
    return (
      <div className={className} role="alert">
        {`World surface failed to load: ${error.message}`}
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <WorldSurfaceRenderer
        manifest={manifest}
        camera={resolvedCamera}
        onCameraChange={handleCameraChange}
        showAnchors={showAnchors}
        showRegions={showRegions}
        imageFit={manifest.renderer?.imageFit ?? 'none'}
        autoFit={manifest.renderer?.autoFit}
      />
    </div>
  );
};
