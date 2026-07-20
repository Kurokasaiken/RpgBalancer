import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useWorldSurface,
  validateWorldSurfaceManifest,
} from '../../../src/ui/idleVillage/hooks/useWorldSurface';
import {
  worldToViewport,
  viewportToWorld,
  clampPan,
  clampZoom,
} from '../../../src/engine/world/model/WorldCoordinate';

const validManifest = {
  version: '1.0.0',
  world: 'wanderlust',
  variant: 'base',
  coordinateSystem: {
    space: 'world_pixels',
    origin: 'top_left',
    unit: 'px',
    canvas: { width: 1248, height: 832 },
  },
  resolutionHint: {
    runtime: { width: 1248, height: 832 },
    source: { width: 3744, height: 2496 },
    scaleTarget: 3,
  },
  assetPolicy: { resolution: 'runtime_only' },
  camera: {
    minZoom: 0.5,
    maxZoom: 3,
    defaultZoom: 1,
    panEnabled: true,
    zoomEnabled: true,
    bounds: { minX: 0, maxX: 1248, minY: 0, maxY: 832 },
  },
  surfaceLayers: [
    {
      id: 'water',
      file: '05_water.png',
      type: 'animated_texture',
      zIndex: 5,
      opacity: 1,
      blendMode: 'normal',
      parallax: { x: 0.02, y: 0 },
      animation: { mode: 'wave', implementation: 'shader', direction: 'left', speed: 0.2, amplitude: 3 },
      tags: ['water'],
    },
    {
      id: 'terrain',
      file: '10_terrain.png',
      type: 'texture',
      zIndex: 10,
      opacity: 1,
      blendMode: 'normal',
      parallax: { x: 0.05, y: 0 },
      conditions: {
        corrupted: { id: 'corrupted', tint: '#5c1a1a', blendMode: 'multiply', opacity: 0.85 },
      },
      tags: ['terrain'],
    },
  ],
  atmosphereLayers: [
    {
      id: 'vignette',
      file: '90_vignette.png',
      type: 'ui_overlay',
      zIndex: 90,
      opacity: 0.6,
      blendMode: 'multiply',
      parallax: { x: 0, y: 0 },
      tags: ['vignette'],
    },
  ],
  visualStates: [
    { id: 'default', labelKey: 'world.states.default', base: true, overrides: [] },
    {
      id: 'corrupted',
      labelKey: 'world.states.corrupted',
      overrides: [
        { type: 'apply_condition', layerId: 'terrain', conditionId: 'corrupted' },
        { type: 'set_opacity', layerId: 'vignette', opacity: 0.85 },
        { type: 'tint_layer', layerId: 'vignette', tint: '#2b0a0a' },
      ],
    },
  ],
  regions: [
    {
      id: 'enchanted_forest',
      nameKey: 'world.region.enchanted_forest',
      bounds: { x: 200, y: 100, width: 500, height: 400 },
      tags: ['forest'],
    },
  ],
  anchors: [
    { id: 'village_01', x: 624, y: 416, type: 'settlement', targetId: 'idle_village', labelKey: 'world.anchors.village_01' },
  ],
  tags: ['world-map'],
};

describe('useWorldSurface', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and validates the manifest', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => validManifest,
    } as Response);

    const { result } = renderHook(() => useWorldSurface('/assets/world/wanderlust/base/manifest.json'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.manifest).not.toBeNull();
    expect(result.current.manifest?.world).toBe('wanderlust');
    expect(result.current.layers).toHaveLength(3);
    expect(result.current.layers[0].id).toBe('water');
    expect(result.current.layers[2].id).toBe('vignette');
  });

  it('exposes a cameraConfig from the manifest', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => validManifest,
    } as Response);

    const { result } = renderHook(() => useWorldSurface('/manifest.json'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cameraConfig).toEqual(validManifest.camera);
  });

  it('returns an error when fetch fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useWorldSurface('/missing.json'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.manifest).toBeNull();
  });

  it('returns an error when the manifest schema is invalid', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: true }),
    } as Response);

    const { result } = renderHook(() => useWorldSurface('/bad.json'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
  });
});

describe('validateWorldSurfaceManifest', () => {
  it('parses a valid manifest', () => {
    const parsed = validateWorldSurfaceManifest(validManifest);
    expect(parsed.world).toBe('wanderlust');
    expect(parsed.surfaceLayers).toHaveLength(2);
    expect(parsed.atmosphereLayers).toHaveLength(1);
    expect(parsed.visualStates[1].id).toBe('corrupted');
  });

  it('throws on missing required fields', () => {
    expect(() => validateWorldSurfaceManifest({})).toThrow();
  });
});

describe('WorldCoordinate helpers', () => {
  it('converts world to viewport', () => {
    const camera = { panX: 100, panY: 50, zoom: 2 };
    expect(worldToViewport({ x: 150, y: 100 }, camera)).toEqual({ x: 100, y: 100 });
  });

  it('converts viewport to world', () => {
    const camera = { panX: 100, panY: 50, zoom: 2 };
    expect(viewportToWorld({ x: 100, y: 100 }, camera)).toEqual({ x: 150, y: 100 });
  });

  it('round-trips between world and viewport', () => {
    const camera = { panX: 24, panY: 12, zoom: 1.5 };
    const original = { x: 400, y: 300 };
    const viewport = worldToViewport(original, camera);
    expect(viewportToWorld(viewport, camera)).toEqual(original);
  });

  it('clamps zoom', () => {
    expect(clampZoom(0.1, 0.5, 3)).toBe(0.5);
    expect(clampZoom(5, 0.5, 3)).toBe(3);
    expect(clampZoom(1.5, 0.5, 3)).toBe(1.5);
  });

  it('clamps pan inside bounds', () => {
    const clamped = clampPan(
      -100,
      -100,
      1,
      { width: 800, height: 600 },
      { minX: 0, maxX: 1248, minY: 0, maxY: 832 },
    );
    expect(clamped.panX).toBe(0);
    expect(clamped.panY).toBe(0);
  });
});
