import { describe, it, expect } from 'vitest';
import { WorldPresentationRuntime } from '@/engine/world/presentation/WorldPresentationRuntime';
import { buildWorldPresentationModel } from '@/engine/world/presentation/buildWorldPresentationModel';
import type { PresentationManifest, PresentationRules } from '@/engine/world/presentation/types';

const TEST_MANIFEST: PresentationManifest = {
  visualStates: [
    { id: 'default', base: true },
    { id: 'threatened' },
    { id: 'corrupted' },
  ],
  surfaceLayers: [{ id: 'terrain' }, { id: 'sky' }],
  atmosphereLayers: [{ id: 'vignette' }],
  camera: { defaultZoom: 1 },
};

const TEST_RULES: PresentationRules = {
  version: '1.0.0',
  visualStateMappings: [
    { stateKey: 'threat.active', condition: 'truthy', visualStateId: 'threatened', priority: 10 },
    { stateKey: 'corruption.active', condition: 'truthy', visualStateId: 'corrupted', priority: 5 },
  ],
  defaultVisualStateId: 'default',
};

describe('WorldPresentationRuntime translation', () => {
  it('translates threat.active into activeVisualStateId "threatened"', () => {
    const worldState = { threat: { active: true } };
    const model = buildWorldPresentationModel(worldState, TEST_RULES);
    const runtime = new WorldPresentationRuntime({ model, manifest: TEST_MANIFEST });
    const output = runtime.update(0, 12345);
    expect(output.activeVisualStateId).toBe('threatened');
  });

  it('translates corruption.active into activeVisualStateId "corrupted"', () => {
    const worldState = { corruption: { active: true } };
    const model = buildWorldPresentationModel(worldState, TEST_RULES);
    const runtime = new WorldPresentationRuntime({ model, manifest: TEST_MANIFEST });
    const output = runtime.update(0, 12345);
    expect(output.activeVisualStateId).toBe('corrupted');
  });

  it('falls back to the base visual state when no mapping matches', () => {
    const model = buildWorldPresentationModel({}, TEST_RULES);
    const runtime = new WorldPresentationRuntime({ model, manifest: TEST_MANIFEST });
    const output = runtime.update(0, 12345);
    expect(output.activeVisualStateId).toBe('default');
  });

  it('exports all visible layer ids from the manifest', () => {
    const model = buildWorldPresentationModel({}, TEST_RULES);
    const runtime = new WorldPresentationRuntime({ model, manifest: TEST_MANIFEST });
    const output = runtime.update(0, 12345);
    expect(output.visibleLayerIds).toEqual(['terrain', 'sky', 'vignette']);
  });
});
