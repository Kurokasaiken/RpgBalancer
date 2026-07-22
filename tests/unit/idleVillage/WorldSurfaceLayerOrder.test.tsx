import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldSurfaceRenderer } from '../../../src/ui/idleVillage/components/WorldSurfaceRenderer';
import { WorldSurfaceDebugPanel } from '../../../src/ui/idleVillage/components/WorldSurfaceDebugPanel';
import type { WorldSurfaceManifest, WorldSurfaceLayer } from '../../../src/ui/idleVillage/config/worldSurfaceConfig';

const defaultAnimation = { mode: 'none' as const, implementation: 'transform' as const, direction: 'left' as const, speed: 0, amplitude: 0 };

const makeLayer = (partial: Omit<WorldSurfaceLayer, 'scale' | 'offsetX' | 'offsetY' | 'animation' | 'conditions'>): WorldSurfaceLayer => ({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  animation: defaultAnimation,
  conditions: {},
  ...partial,
});

const baseManifest: WorldSurfaceManifest = {
  version: '1.0.2',
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
    source: { width: 4240, height: 2828 },
    scaleTarget: 1,
  },
  assetPolicy: { resolution: 'prefer_hd' },
  camera: {
    minZoom: 0.5,
    maxZoom: 3,
    defaultZoom: 1,
    panEnabled: true,
    zoomEnabled: true,
    bounds: { minX: 0, maxX: 4240, minY: 0, maxY: 2828 },
  },
  renderer: {
    mode: 'dom',
    domObjectThreshold: 50,
    enableForParticles: true,
    enableForShaders: true,
    fallbackToDom: true,
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
      id: 'sea',
      file: 'mare.png',
      type: 'texture',
      zIndex: 10,
      opacity: 1,
      blendMode: 'normal',
      parallax: { x: 0.02, y: 0 },
      tags: ['water'],
    }),
    makeLayer({
      id: 'village',
      file: 'Villaggio.png',
      type: 'texture',
      zIndex: 95,
      opacity: 1,
      blendMode: 'normal',
      parallax: { x: 0.18, y: 0 },
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
  visualStates: [
    { id: 'default', labelKey: 'world.states.default', base: true, overrides: [] },
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
    { id: 'village_01', x: 2120, y: 1414, type: 'settlement', targetId: 'idle_village', labelKey: 'world.anchors.village_01' },
  ],
  tags: ['world-map', 'idle-village', 'wanderlust'],
};

describe('WorldSurfaceRenderer layer ordering', () => {
  it('renders surface layers in zIndex order by default', () => {
    const { container } = render(
      <WorldSurfaceRenderer
        manifest={baseManifest}
        camera={{ panX: 0, panY: 0, zoom: 1 }}
        onCameraChange={vi.fn()}
      />,
    );

    const images = Array.from(container.querySelectorAll('img'));
    const srcs = images.map((img) => (img as HTMLImageElement).src);

    expect(srcs[0]).toContain('Background.png');
    expect(srcs[1]).toContain('mare.png');
    expect(srcs[2]).toContain('Villaggio.png');
    expect(srcs[3]).toContain('overlay.png');
  });

  it('renders surface layers in surfaceLayerOrder when provided', () => {
    const { container } = render(
      <WorldSurfaceRenderer
        manifest={baseManifest}
        camera={{ panX: 0, panY: 0, zoom: 1 }}
        onCameraChange={vi.fn()}
        surfaceLayerOrder={['village', 'background', 'sea']}
      />,
    );

    const images = Array.from(container.querySelectorAll('img'));
    const srcs = images.map((img) => (img as HTMLImageElement).src);

    expect(srcs[0]).toContain('Villaggio.png');
    expect(srcs[1]).toContain('Background.png');
    expect(srcs[2]).toContain('mare.png');
    expect(srcs[3]).toContain('overlay.png');
  });

  it('URL-encodes filenames containing spaces', () => {
    const manifest: WorldSurfaceManifest = {
      ...baseManifest,
      surfaceLayers: [
        makeLayer({
          id: 'forest',
          file: 'Foresta 1 Alto Sin.png',
          type: 'texture',
          zIndex: 5,
          opacity: 1,
          blendMode: 'normal',
          parallax: { x: 0, y: 0 },
          tags: ['forest'],
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

    const image = container.querySelector('img') as HTMLImageElement;
    expect(image.src).toContain('Foresta%201%20Alto%20Sin.png');
  });
});

describe('WorldSurfaceDebugPanel layer ordering', () => {
  it('renders drag handles for each layer row', () => {
    render(
      <WorldSurfaceDebugPanel
        manifest={baseManifest}
        layers={baseManifest.surfaceLayers}
        visualStates={baseManifest.visualStates}
        regions={baseManifest.regions}
        anchors={baseManifest.anchors}
        camera={{ panX: 0, panY: 0, zoom: 1 }}
        activeVisualStateId="default"
        visibleLayerIds={new Set(baseManifest.surfaceLayers.map((l: WorldSurfaceLayer) => l.id))}
        mouseWorld={null}
        surfaceLayerOrder={['village', 'sea', 'background']}
      />,
    );

    const handles = screen.getAllByLabelText('Drag to reorder');
    expect(handles).toHaveLength(3);
  });

  it('orders layer rows by surfaceLayerOrder', () => {
    render(
      <WorldSurfaceDebugPanel
        manifest={baseManifest}
        layers={baseManifest.surfaceLayers}
        visualStates={baseManifest.visualStates}
        regions={baseManifest.regions}
        anchors={baseManifest.anchors}
        camera={{ panX: 0, panY: 0, zoom: 1 }}
        activeVisualStateId="default"
        visibleLayerIds={new Set(baseManifest.surfaceLayers.map((l: WorldSurfaceLayer) => l.id))}
        mouseWorld={null}
        surfaceLayerOrder={['village', 'sea', 'background']}
      />,
    );

    const village = screen.getByText('village');
    const sea = screen.getByText('sea');
    const background = screen.getByText('background');

    expect(village.compareDocumentPosition(sea) & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0);
    expect(sea.compareDocumentPosition(background) & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0);
  });
});
