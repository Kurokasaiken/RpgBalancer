import { describe, it, expect } from 'vitest';
import { composeOutput } from '@/engine/world/presentation/OutputComposer';
import { createEmptyPresentationOutput } from '@/engine/world/presentation/PresentationOutput';

describe('OutputComposer', () => {
  it('returns the base output when no overrides are provided', () => {
    const base = createEmptyPresentationOutput();
    expect(composeOutput(base, [])).toEqual(base);
  });

  it('overrides activeVisualStateId and camera in order', () => {
    const base = createEmptyPresentationOutput();
    const result = composeOutput(base, [
      { activeVisualStateId: 'threatened' },
      { camera: { panX: 10, panY: 20, zoom: 1.5 } },
    ]);
    expect(result.activeVisualStateId).toBe('threatened');
    expect(result.camera).toEqual({ panX: 10, panY: 20, zoom: 1.5 });
  });

  it('concatenates visualStateOverrides and runtimeObjects', () => {
    const base = createEmptyPresentationOutput();
    const result = composeOutput(base, [
      {
        visualStateOverrides: [
          { type: 'tint_layer' as const, layerId: 'sky', tint: '#ff0000' },
        ],
      },
      {
        runtimeObjects: [
          { id: 'obj-1', location: { mode: 'dynamic' as const, x: 0, y: 0 }, type: 'test' },
        ],
      },
    ]);
    expect(result.visualStateOverrides).toHaveLength(1);
    expect(result.runtimeObjects).toHaveLength(1);
  });

  it('merges layerScales and layerOffsets by key', () => {
    const base = createEmptyPresentationOutput();
    base.layerScales = { terrain: 1 };
    base.layerOffsets = { terrain: { x: 0, y: 0 } };

    const result = composeOutput(base, [
      {
        layerScales: { sky: 1.2 },
        layerOffsets: { sky: { x: 10, y: 0 } },
      },
    ]);

    expect(result.layerScales).toEqual({ terrain: 1, sky: 1.2 });
    expect(result.layerOffsets).toEqual({
      terrain: { x: 0, y: 0 },
      sky: { x: 10, y: 0 },
    });
  });
});
