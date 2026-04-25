import type { VillageState } from './TimeEngine';

/**
 * Result summary returned by {@link pruneResidentsWithoutRoster}.
 */
export interface PruneResidentsResult {
  /** Potentially mutated VillageState after pruning. */
  state: VillageState;
  /** IDs of residents removed because they lack a backing SavedCharacter. */
  removedResidentIds: string[];
  /** IDs of scheduled activities removed because every participant was pruned. */
  removedActivityIds: string[];
  /** Whether the state actually changed. */
  changed: boolean;
}

/**
 * Removes residents (and any now-empty activities) that reference character IDs
 * no longer present in the Character Manager roster.
 */
export function pruneResidentsWithoutRoster(state: VillageState, allowedIds: Set<string>): PruneResidentsResult {
  if (!state) {
    return { state, removedResidentIds: [], removedActivityIds: [], changed: false };
  }

  let residentsChanged = false;
  let nextResidents = state.residents;
  const removedResidentIds: string[] = [];

  Object.keys(state.residents ?? {}).forEach((residentId) => {
    if (!allowedIds.has(residentId)) {
      if (!residentsChanged) {
        nextResidents = { ...nextResidents };
        residentsChanged = true;
      }
      removedResidentIds.push(residentId);
      delete nextResidents[residentId];
    }
  });

  let activitiesChanged = false;
  let nextActivities = state.activities;
  const removedActivityIds: string[] = [];

  Object.entries(state.activities ?? {}).forEach(([activityId, activity]) => {
    const filteredIds = activity.characterIds.filter((id) => allowedIds.has(id));
    if (filteredIds.length === activity.characterIds.length) return;

    if (!activitiesChanged) {
      nextActivities = { ...nextActivities };
      activitiesChanged = true;
    }

    if (filteredIds.length === 0) {
      delete nextActivities[activityId];
      removedActivityIds.push(activityId);
    } else {
      nextActivities[activityId] = { ...activity, characterIds: filteredIds };
    }
  });

  const changed = residentsChanged || activitiesChanged;
  if (!changed) {
    return { state, removedResidentIds, removedActivityIds, changed };
  }

  return {
    state: {
      ...state,
      residents: residentsChanged ? nextResidents : state.residents,
      activities: activitiesChanged ? nextActivities : state.activities,
    },
    removedResidentIds,
    removedActivityIds,
    changed,
  };
}
