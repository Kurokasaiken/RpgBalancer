import { type RuntimeObject } from '../model/RuntimeObject';
import { type WorldEvent } from '../model/WorldEvent';
import {
  type BuildWorldPresentationModelInput,
  type PresentationRules,
  type VisualStateMapping,
  type WorldPresentationModel,
  WorldPresentationModelSchema,
} from './types';

/**
 * Read a dotted path from an object without mutating it.
 */
function getPathValue(value: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = value;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function evaluateMapping(snapshot: Record<string, unknown>, mapping: VisualStateMapping): boolean {
  const value = getPathValue(snapshot, mapping.stateKey);
  switch (mapping.condition) {
    case 'truthy':
      return Boolean(value);
    case 'falsy':
      return !value;
    case 'equals':
      return value === mapping.value;
    case 'contains':
      return Array.isArray(value) && value.includes(mapping.value);
    default:
      return false;
  }
}

function resolveActiveVisualStateIds(
  snapshot: Record<string, unknown>,
  rules: PresentationRules,
): string[] {
  const active = rules.visualStateMappings
    .filter((mapping) => evaluateMapping(snapshot, mapping))
    .sort((a, b) => b.priority - a.priority)
    .map((mapping) => mapping.visualStateId);

  const unique = new Set(active);
  if (rules.defaultVisualStateId) {
    unique.add(rules.defaultVisualStateId);
  }
  return Array.from(unique);
}

/**
 * Pure function that translates a `WorldState`-compatible snapshot into a
 * `WorldPresentationModel`.  No side effects, no mutations.
 */
export function buildWorldPresentationModel(
  input: BuildWorldPresentationModelInput,
  rules: PresentationRules,
): WorldPresentationModel {
  const snapshot: Record<string, unknown> = {};

  const objects = (input.objects as RuntimeObject[] | undefined) ?? [];
  const events = (input.events as WorldEvent[] | undefined) ?? [];
  const activeEvents = events.filter((event) => event.lifecycle?.state === 'active');

  for (const [key, value] of Object.entries(input)) {
    if (key === 'objects' || key === 'events') continue;
    snapshot[key] = value;
  }

  const activeStateIds = resolveActiveVisualStateIds(snapshot, rules);

  const model: WorldPresentationModel = {
    stateSnapshot: snapshot,
    activeStateIds,
    activeEvents,
    runtimeObjects: objects,
  };

  return WorldPresentationModelSchema.parse(model);
}
