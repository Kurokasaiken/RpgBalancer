/**
 * worldSurfaceKit.fixture
 *
 * Re-exports of canonical data sources used by the World Surface kit.
 * Per Plan v2 §S1, no inline mock arrays are permitted here — the fixture is
 * the same code path that production uses.
 */

export {
  WANDERLUST_BASE_MANIFEST,
  WORLD_SURFACE_PROVIDER_CHAIN,
  type WorldSurfaceStandaloneProps,
} from './worldSurfaceKit';

export {
  WorldSurfaceRenderer,
  useWorldSurface,
  type UseWorldSurfaceResult,
  type WorldSurfaceManifest,
  type WorldSurfaceLayer,
} from './worldSurfaceKit';
