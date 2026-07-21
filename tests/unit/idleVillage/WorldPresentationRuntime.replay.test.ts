import { describe, it, expect } from 'vitest';
import { WorldPresentationRuntime } from '@/engine/world/presentation/WorldPresentationRuntime';
import { buildWorldPresentationModel } from '@/engine/world/presentation/buildWorldPresentationModel';
import type { PresentationContext, PresentationManifest, PresentationRules } from '@/engine/world/presentation/types';

const TEST_MANIFEST: PresentationManifest = {
  visualStates: [
    { id: 'default', base: true },
    { id: 'threatened' },
  ],
  surfaceLayers: [{ id: 'terrain' }, { id: 'sky' }],
  camera: { defaultZoom: 1 },
};

const TEST_RULES: PresentationRules = {
  version: '1.0.0',
  visualStateMappings: [
    { stateKey: 'threat.active', condition: 'truthy', visualStateId: 'threatened', priority: 1 },
  ],
  defaultVisualStateId: 'default',
};

function replay(scenario: Record<string, unknown>, seed: number, tick: number) {
  const model = buildWorldPresentationModel(scenario, TEST_RULES);
  const runtime = new WorldPresentationRuntime({ model, manifest: TEST_MANIFEST });

  // Effect that uses the seeded RNG and tick so output depends deterministically on seed + tick.
  runtime.register({
    update(ctx: PresentationContext) {
      return {
        layerOffsets: {
          sky: {
            x: ctx.tick * 10 + ctx.random.next() * 100,
            y: 0,
          },
        },
      };
    },
  });

  return runtime.update(tick, seed);
}

describe('WorldPresentationRuntime replay determinism', () => {
  it('produces identical output for the same scenario, seed and tick', () => {
    const scenario = { threat: { active: true } };
    const run1 = replay(scenario, 12345, 42);
    const run2 = replay(scenario, 12345, 42);
    expect(run1).toEqual(run2);
  });

  it('produces reproducible JSON output across fresh runtime instances', () => {
    const scenario = { threat: { active: true } };
    const output1 = replay(scenario, 777, 10);
    const output2 = replay(scenario, 777, 10);
    expect(JSON.stringify(output1)).toBe(JSON.stringify(output2));
  });

  it('changes output when the seed changes', () => {
    const scenario = { threat: { active: true } };
    const run1 = replay(scenario, 12345, 42);
    const run2 = replay(scenario, 99999, 42);
    expect(run2.layerOffsets.sky?.x).not.toBe(run1.layerOffsets.sky?.x);
  });

  it('changes output when the tick changes', () => {
    const scenario = { threat: { active: true } };
    const run1 = replay(scenario, 12345, 42);
    const run2 = replay(scenario, 12345, 43);
    expect(run2.layerOffsets.sky?.x).not.toBe(run1.layerOffsets.sky?.x);
  });
});
