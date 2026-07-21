import { describe, it, expect } from 'vitest';
import { buildWorldPresentationModel } from '@/engine/world/presentation/buildWorldPresentationModel';
import type { PresentationRules } from '@/engine/world/presentation/types';

const TEST_RULES: PresentationRules = {
  version: '1.0.0',
  visualStateMappings: [
    {
      stateKey: 'threat.active',
      condition: 'truthy',
      visualStateId: 'threatened',
      priority: 10,
    },
    {
      stateKey: 'corruption.active',
      condition: 'truthy',
      visualStateId: 'corrupted',
      priority: 5,
    },
  ],
  defaultVisualStateId: 'default',
};

describe('buildWorldPresentationModel', () => {
  it('maps threat.active to the threatened visual state', () => {
    const model = buildWorldPresentationModel({ threat: { active: true } }, TEST_RULES);
    expect(model.activeStateIds[0]).toBe('threatened');
    expect(model.activeStateIds).toContain('default');
  });

  it('falls back to the default visual state when no mapping matches', () => {
    const model = buildWorldPresentationModel({}, TEST_RULES);
    expect(model.activeStateIds).toEqual(['default']);
  });

  it('preserves runtime objects and events in the model', () => {
    const objects = [
      { id: 'obj-1', location: { mode: 'dynamic' as const, x: 0, y: 0 }, type: 'test' },
    ];
    const events = [
      { id: 'evt-1', type: 'test', category: 'environment' as const },
    ];
    const model = buildWorldPresentationModel({ objects, events }, TEST_RULES);
    expect(model.runtimeObjects).toHaveLength(1);
    expect(model.activeEvents).toHaveLength(1);
  });

  it('does not mutate the input world state', () => {
    const input = { threat: { active: true }, objects: [] };
    const snapshot = JSON.stringify(input);
    buildWorldPresentationModel(input, TEST_RULES);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
