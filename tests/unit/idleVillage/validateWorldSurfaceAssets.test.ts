import { describe, it, expect, vi } from 'vitest';
import {
  validateWorldSurfaceAssets,
  type WorldSurfaceAssetValidationResult,
} from '@/ui/idleVillage/utils/validateWorldSurfaceAssets';
import type { WorldSurfaceManifest, WorldSurfaceLayer } from '@/ui/idleVillage/config/worldSurfaceConfig';

const defaultAnimation: WorldSurfaceLayer['animation'] = {
  mode: 'none',
  implementation: 'transform',
  direction: 'left',
  speed: 0,
  amplitude: 0,
};

const makeLayer = (partial: Omit<WorldSurfaceLayer, 'scale' | 'offsetX' | 'offsetY' | 'animation' | 'conditions'>): WorldSurfaceLayer => ({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  animation: defaultAnimation,
  conditions: {},
  ...partial,
});

const baseManifest: WorldSurfaceManifest = {
  version: '1.1.1',
  world: 'wanderlust',
  variant: 'base',
  coordinateSystem: {
    space: 'world_pixels',
    origin: 'top_left',
    unit: 'px',
    canvas: { width: 4240, height: 2828 },
  },
  resolutionHint: {
    runtime: { width: 4240, height: 2828 },
  },
  assetPolicy: { resolution: 'prefer_hd' },
  camera: {
    minZoom: 0.5,
    maxZoom: 3,
    defaultZoom: 1,
    panEnabled: true,
    zoomEnabled: true,
  },
  surfaceLayers: [
    makeLayer({
      id: 'background',
      file: 'Background.png',
      type: 'texture',
      zIndex: 5,
      opacity: 1,
      blendMode: 'normal',
      parallax: { x: 0, y: 0 },
      tags: ['background'],
    }),
    makeLayer({
      id: 'village',
      file: 'Villaggio.png',
      type: 'texture',
      zIndex: 95,
      opacity: 1,
      blendMode: 'normal',
      parallax: { x: 0, y: 0 },
      tags: ['settlements', 'landmarks'],
    }),
  ],
  atmosphereLayers: [
    makeLayer({
      id: 'overlay',
      file: 'overlay.png',
      type: 'ui_overlay',
      zIndex: 200,
      opacity: 0.5,
      blendMode: 'normal',
      parallax: { x: 0, y: 0 },
      tags: ['overlay'],
    }),
  ],
  visualStates: [{ id: 'default', labelKey: 'world.states.default', base: true, overrides: [] }],
  regions: [],
  anchors: [],
  tags: ['world-map', 'idle-village', 'wanderlust'],
};

describe('validateWorldSurfaceAssets', () => {
  it('returns valid when all referenced files exist', async () => {
    const fileExists = vi.fn().mockReturnValue(true);

    const result = await validateWorldSurfaceAssets({
      manifest: baseManifest,
      layersDir: 'public/assets/world/wanderlust/base/layers',
      fileExists,
    });

    expect(result.valid).toBe(true);
    expect(result.missingFiles).toHaveLength(0);
    expect(fileExists).toHaveBeenCalledWith(
      'public/assets/world/wanderlust/base/layers/Background.png',
    );
  });

  it('reports missing layer files', async () => {
    const fileExists = vi.fn((path: string) => !path.endsWith('Villaggio.png'));

    const result = await validateWorldSurfaceAssets({
      manifest: baseManifest,
      layersDir: 'public/assets/world/wanderlust/base/layers',
      fileExists,
    });

    expect(result.valid).toBe(false);
    expect(result.missingFiles).toHaveLength(1);
    expect(result.missingFiles[0]).toMatchObject({
      layerId: 'village',
      file: 'Villaggio.png',
      resolvedPath: 'public/assets/world/wanderlust/base/layers/Villaggio.png',
    });
  });

  it('reports schema errors for invalid manifests', async () => {
    const result = await validateWorldSurfaceAssets({
      manifest: { version: 'broken' },
      layersDir: 'public/assets/world/wanderlust/base/layers',
      fileExists: vi.fn().mockReturnValue(true),
    });

    expect(result.valid).toBe(false);
    expect(result.schemaError).toBeDefined();
    expect(result.missingFiles).toHaveLength(0);
  });

  it('supports async fileExists', async () => {
    const fileExists = vi.fn().mockResolvedValue(true);

    const result = await validateWorldSurfaceAssets({
      manifest: baseManifest,
      layersDir: 'public/assets/world/wanderlust/base/layers',
      fileExists,
    });

    expect(result.valid).toBe(true);
    expect(fileExists).toHaveBeenCalledTimes(3);
  });
});
