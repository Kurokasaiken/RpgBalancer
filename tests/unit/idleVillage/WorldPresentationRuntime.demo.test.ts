import { describe, it, expect } from 'vitest';
import { WorldPresentationRuntime } from '@/engine/world/presentation/WorldPresentationRuntime';
import { buildWorldPresentationModel } from '@/engine/world/presentation/buildWorldPresentationModel';
import { createThreatPresenceEffect } from '@/engine/world/presentation/effects/ThreatPresenceEffect';
import type { PresentationManifest, PresentationRules, WorldEvent } from '@/engine/world/presentation/types';

const TEST_MANIFEST: PresentationManifest = {
  visualStates: [
    { id: 'default', base: true },
    { id: 'threat_manifesting' },
    { id: 'threatened' },
  ],
  surfaceLayers: [{ id: 'terrain' }, { id: 'vignette' }],
  camera: { defaultZoom: 1 },
};

const TEST_RULES: PresentationRules = {
  version: '1.0.0',
  visualStateMappings: [
    { stateKey: 'threat.active', condition: 'truthy', visualStateId: 'threatened', priority: 10 },
  ],
  defaultVisualStateId: 'default',
};

const ACTIVE_THREAT_EVENT: WorldEvent = {
  id: 'goblin-threat-north',
  type: 'goblin_invasion',
  category: 'threat',
  lifecycle: { state: 'active', startAt: 0, endAt: 300 },
  data: { origin: 'north' },
};

function createRuntime(events: WorldEvent[] = [ACTIVE_THREAT_EVENT]) {
  const worldState = {
    threat: { active: true },
    events,
  };
  const model = buildWorldPresentationModel(worldState, TEST_RULES);
  const runtime = new WorldPresentationRuntime({ model, manifest: TEST_MANIFEST });
  runtime.register(createThreatPresenceEffect());
  return runtime;
}

describe('WorldPresentationRuntime ThreatPresenceEffect demo', () => {
  it('remains in the safe visual state for ticks 0..4', () => {
    const runtime = createRuntime();
    const output = runtime.update(0, 12345);
    expect(output.activeVisualStateId).toBe('default');
    expect(output.runtimeObjects).toHaveLength(0);
    expect(output.visualStateOverrides).toHaveLength(0);
  });

  it('switches to threat_manifesting with partial marker at tick 5', () => {
    const runtime = createRuntime();
    const output = runtime.update(5, 12345);
    expect(output.activeVisualStateId).toBe('threat_manifesting');
    expect(output.runtimeObjects).toHaveLength(1);
    expect(output.runtimeObjects[0].location).toEqual({ mode: 'dynamic', x: 624, y: 120 });
    expect(output.visualStateOverrides).toHaveLength(2);
    expect(output.visualStateOverrides[1].type).toBe('set_opacity');
    if (output.visualStateOverrides[1].type === 'set_opacity') {
      expect(output.visualStateOverrides[1].opacity).toBe(0.45);
    }
  });

  it('reaches persistent threatened state with full marker at tick 15', () => {
    const runtime = createRuntime();
    const output = runtime.update(15, 12345);
    expect(output.activeVisualStateId).toBe('threatened');
    expect(output.runtimeObjects).toHaveLength(1);
    expect(output.visualStateOverrides).toHaveLength(2);
    if (output.visualStateOverrides[1].type === 'set_opacity') {
      expect(output.visualStateOverrides[1].opacity).toBe(0.85);
    }
  });

  it('stays threatened at later ticks', () => {
    const runtime = createRuntime();
    const output = runtime.update(30, 12345);
    expect(output.activeVisualStateId).toBe('threatened');
    expect(output.runtimeObjects).toHaveLength(1);
  });

  it('is deterministic across fresh runtime instances', () => {
    const run1 = createRuntime().update(15, 777);
    const run2 = createRuntime().update(15, 777);
    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  it('falls back to rule-driven threatened state when no active threat event is present', () => {
    const runtime = createRuntime([
      { ...ACTIVE_THREAT_EVENT, lifecycle: { state: 'pending' } },
    ]);
    const output = runtime.update(15, 12345);
    expect(output.activeVisualStateId).toBe('threatened');
    expect(output.runtimeObjects).toHaveLength(0);
  });
});
