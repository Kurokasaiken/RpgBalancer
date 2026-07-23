import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { WorldSurfaceRenderer } from '../../../src/ui/idleVillage/components/WorldSurfaceRenderer';
import type { WorldSurfaceManifest, WorldSurfaceLayer } from '../../../src/ui/idleVillage/config/worldSurfaceConfig';

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

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
  ],
  atmosphereLayers: [],
  visualStates: [{ id: 'default', labelKey: 'world.states.default', base: true, overrides: [] }],
  regions: [],
  anchors: [],
  tags: ['world-map', 'idle-village', 'wanderlust'],
};

describe('WorldSurfaceRenderer image error handling', () => {
  it('does not crash when a layer image fails to load and emits telemetry', () => {
    const { container } = render(
      <WorldSurfaceRenderer
        manifest={baseManifest}
        camera={{ panX: 0, panY: 0, zoom: 1 }}
        onCameraChange={vi.fn()}
      />,
    );

    const image = container.querySelector('img') as HTMLImageElement;
    expect(image).toBeTruthy();

    fireEvent.error(image);

    expect(trackTelemetryEvent).toHaveBeenCalledWith('world_surface_image_load_failed', {
      layerId: 'background',
      file: 'Background.png',
      world: 'wanderlust',
      context: 'world-surface-renderer',
    });

    expect(container.querySelector('img')).toBeFalsy();
  });

  it('keeps rendering other layers when one image fails', () => {
    const manifest: WorldSurfaceManifest = {
      ...baseManifest,
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
          id: 'foreground',
          file: 'Missing.png',
          type: 'texture',
          zIndex: 10,
          opacity: 1,
          blendMode: 'normal',
          parallax: { x: 0, y: 0 },
          tags: ['foreground'],
        }),
      ],
    };

    const { container } = render(
      <WorldSurfaceRenderer
        manifest={manifest}
        camera={{ panX: 0, panY: 0, zoom: 1 }}
        onCameraChange={vi.fn()}
      />,
    );

    const images = Array.from(container.querySelectorAll('img'));
    const foreground = images.find((img) => img.src.includes('Missing.png')) as HTMLImageElement;
    expect(foreground).toBeTruthy();

    fireEvent.error(foreground);

    const remainingImages = Array.from(container.querySelectorAll('img'));
    expect(remainingImages.some((img) => img.src.includes('Background.png'))).toBe(true);
    expect(remainingImages.some((img) => img.src.includes('Missing.png'))).toBe(false);
  });
});
