import type {
  LoreDrop,
  LoreDropEntity,
  LoreDropAssignment,
  LoreDropState,
} from '@/balancing/config/lore/loreDropTypes';

/**
 * Returns candidates from the pool that can be assigned to the given entity,
 * excluding drops that have already been assigned elsewhere.
 */
export function getAssignableCandidates(
  pool: LoreDrop[],
  entity: LoreDropEntity,
  usedIds: Set<string>,
): LoreDrop[] {
  return pool.filter(
    (drop) =>
      drop.assignableTo.includes(entity.type) &&
      !usedIds.has(drop.id) &&
      (!drop.tags || drop.tags.length === 0 || drop.tags.some((tag) => entity.tags?.includes(tag))),
  );
}

/**
 * Weighted random pick from a list of candidates.
 */
export function pickLoreDrop(
  candidates: LoreDrop[],
  rng: () => number = Math.random,
): LoreDrop | null {
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, drop) => sum + (drop.weight ?? 1), 0);
  let roll = rng() * totalWeight;

  for (const drop of candidates) {
    roll -= drop.weight ?? 1;
    if (roll <= 0) return drop;
  }

  // Fallback for floating point edge cases
  return candidates[candidates.length - 1];
}

/**
 * Assigns a lore drop to an entity if not already assigned.
 * Returns the assignment and the updated state.
 */
export function assignLoreDrop(
  pool: LoreDrop[],
  entity: LoreDropEntity,
  state: LoreDropState,
  rng: () => number = Math.random,
): { assignment: LoreDropAssignment | null; state: LoreDropState } {
  const existing = state.assigned[entity.id];
  if (existing) {
    return { assignment: existing, state };
  }

  const usedIds = new Set(Object.values(state.assigned).map((a) => a.loreDropId));
  const candidates = getAssignableCandidates(pool, entity, usedIds);
  const drop = pickLoreDrop(candidates, rng);

  if (!drop) {
    return { assignment: null, state };
  }

  const assignment: LoreDropAssignment = {
    loreDropId: drop.id,
    entityId: entity.id,
    entityType: entity.type,
    assignedAt: Date.now(),
    discovered: false,
  };

  return {
    assignment,
    state: {
      ...state,
      assigned: { ...state.assigned, [entity.id]: assignment },
    },
  };
}

/**
 * Marks a previously assigned drop as discovered.
 */
export function discoverLoreDrop(
  state: LoreDropState,
  entityId: string,
  discoveredAt: number = Date.now(),
): LoreDropState {
  const assignment = state.assigned[entityId];
  if (!assignment || assignment.discovered) return state;

  const updated: LoreDropAssignment = {
    ...assignment,
    discovered: true,
    discoveredAt,
  };

  return {
    ...state,
    assigned: { ...state.assigned, [entityId]: updated },
    discoveredIds: state.discoveredIds.includes(assignment.loreDropId)
      ? state.discoveredIds
      : [...state.discoveredIds, assignment.loreDropId],
  };
}

/**
 * Looks up a single drop by id.
 */
export function getLoreDropById(pool: LoreDrop[], id: string): LoreDrop | undefined {
  return pool.find((drop) => drop.id === id);
}

/**
 * Returns the assigned lore drop for a given entity, or null if none.
 */
export function getLoreDropForEntity(
  pool: LoreDrop[],
  state: LoreDropState,
  entityId: string,
): LoreDrop | null {
  const assignment = state.assigned[entityId];
  if (!assignment) return null;
  return getLoreDropById(pool, assignment.loreDropId) ?? null;
}

/**
 * Returns all discovered drops in order of discovery.
 */
export function getDiscoveredLoreDrops(
  pool: LoreDrop[],
  state: LoreDropState,
): LoreDrop[] {
  return state.discoveredIds
    .map((id) => getLoreDropById(pool, id))
    .filter((drop): drop is LoreDrop => Boolean(drop));
}

/**
 * Returns all currently assigned lore drop ids.
 */
export function getAssignedLoreDropIds(state: LoreDropState): string[] {
  return Object.values(state.assigned).map((assignment) => assignment.loreDropId);
}
