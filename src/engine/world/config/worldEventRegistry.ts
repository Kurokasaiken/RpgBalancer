import type { WorldEvent, WorldEventCategory, WorldEventEffect } from '../model/WorldEvent';

export interface WorldEventTemplate {
  id: string;
  label: string;
  category: WorldEventCategory;
  effects: WorldEventEffect[];
}

/**
 * Built-in world event templates.
 * Each template describes the visual and region effects an event applies
 * while active. The {@link useWorldState} store consumes these effects
 * through active event lifecycles.
 */
export const worldEventRegistry: Record<string, WorldEventTemplate> = {
  weather: {
    id: 'weather',
    label: 'weather',
    category: 'environment',
    effects: [
      { type: 'apply_visual_state', stateId: 'weather' },
      { type: 'tint_region', regionId: 'world', tint: 'rgba(200,210,255,0.3)' },
    ],
  },
  threat: {
    id: 'threat',
    label: 'threat',
    category: 'threat',
    effects: [
      { type: 'apply_visual_state', stateId: 'threat' },
      { type: 'tint_region', regionId: 'world', tint: 'rgba(180,60,60,0.3)' },
    ],
  },
  resource: {
    id: 'resource',
    label: 'resource',
    category: 'economy',
    effects: [
      { type: 'apply_visual_state', stateId: 'resource' },
      { type: 'tint_region', regionId: 'world', tint: 'rgba(60,150,60,0.3)' },
    ],
  },
};

/**
 * Instantiate a concrete {@link WorldEvent} from a registry template.
 */
export function createWorldEventFromTemplate(
  id: string,
  overrides?: { startAt?: number; endAt?: number; data?: Record<string, unknown> },
): WorldEvent {
  const template = worldEventRegistry[id];
  if (!template) {
    throw new Error(`Unknown world event template: ${id}`);
  }
  return {
    id,
    type: template.id,
    category: template.category,
    effects: template.effects,
    lifecycle: {
      state: 'pending',
      startAt: overrides?.startAt,
      endAt: overrides?.endAt,
    },
    data: overrides?.data ?? {},
  };
}

export default worldEventRegistry;
