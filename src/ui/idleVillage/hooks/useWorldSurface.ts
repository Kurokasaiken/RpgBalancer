import { useEffect, useMemo, useState } from 'react';
import {
  WorldSurfaceManifestSchema,
  type WorldSurfaceLayer,
  type WorldSurfaceManifest,
  type WorldSurfaceVisualState,
  type WorldSurfaceAnchor,
  type WorldSurfaceRegion,
  type CameraConfig,
} from '../config/worldSurfaceConfig';

export interface UseWorldSurfaceResult {
  /** Loading state of the manifest. */
  isLoading: boolean;
  /** Validation or network error. */
  error: Error | null;
  /** Parsed and validated manifest. */
  manifest: WorldSurfaceManifest | null;
  /** All layers sorted by zIndex. */
  layers: WorldSurfaceLayer[];
  /** Available visual states. */
  visualStates: WorldSurfaceVisualState[];
  /** Surface anchors. */
  anchors: WorldSurfaceAnchor[];
  /** Surface regions. */
  regions: WorldSurfaceRegion[];
  /** Camera configuration extracted from the manifest. */
  cameraConfig: CameraConfig | null;
}

/**
 * Fetch, validate and normalize a World Surface manifest.json.
 *
 * The hook returns the manifest together with helper collections already
 * sorted/merged (surface + atmosphere layers by zIndex) so that consumers
 * only need to worry about presentation.
 */
export function useWorldSurface(manifestPath: string): UseWorldSurfaceResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [manifest, setManifest] = useState<WorldSurfaceManifest | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(manifestPath);
        if (!response.ok) {
          throw new Error(
            `Failed to load manifest at ${manifestPath}: ${response.status} ${response.statusText}`,
          );
        }
        const raw = (await response.json()) as unknown;
        const parsed = validateWorldSurfaceManifest(raw);

        if (!cancelled) {
          setManifest(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [manifestPath]);

  const layers = useMemo(() => {
    if (!manifest) return [];
    return [...manifest.surfaceLayers, ...manifest.atmosphereLayers].sort(
      (a, b) => a.zIndex - b.zIndex,
    );
  }, [manifest]);

  const visualStates = useMemo(() => manifest?.visualStates ?? [], [manifest]);
  const anchors = useMemo(() => manifest?.anchors ?? [], [manifest]);
  const regions = useMemo(() => manifest?.regions ?? [], [manifest]);
  const cameraConfig = useMemo(() => manifest?.camera ?? null, [manifest]);

  return {
    isLoading,
    error,
    manifest,
    layers,
    visualStates,
    anchors,
    regions,
    cameraConfig,
  };
}

/**
 * Validate an unknown JSON payload against the WorldSurfaceManifest schema.
 */
export function validateWorldSurfaceManifest(
  data: unknown,
): WorldSurfaceManifest {
  return WorldSurfaceManifestSchema.parse(data);
}
