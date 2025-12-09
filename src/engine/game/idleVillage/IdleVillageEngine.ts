/**
 * Top-level orchestration engine for Idle Village.
 * Coordinates TimeEngine, JobResolver, QuestResolver, and (future) InjuryEngine.
 * Pure functions only; no side effects.
 */

import type { VillageState, TimeEngineDeps } from './TimeEngine';
import type { JobResolverDeps } from './JobResolver';
import type { QuestResolverDeps } from './QuestResolver';
import { advanceTime } from './TimeEngine';
import { resolveJob } from './JobResolver';
import { resolveQuest } from './QuestResolver';
import { applyFatigueInjuryForActivity } from './InjuryEngine';

export interface IdleVillageEngineDeps extends TimeEngineDeps, JobResolverDeps, QuestResolverDeps {}

export interface IdleVillageTickResult {
  state: VillageState;
  completedJobs: {
    scheduledId: string;
    activityId: string;
    rewards: import('@/balancing/config/idleVillage/types').ResourceDeltaDefinition[];
  }[];
  completedQuests: {
    scheduledId: string;
    activityId: string;
    level: number;
    xpAwarded: number;
    varianceCategory?: string;
    varianceMultiplier?: number;
    rewards: import('@/balancing/config/idleVillage/types').ResourceDeltaDefinition[];
  }[];
}

/**
 * Advance time by a given amount and resolve all completed activities.
 * Delegates to JobResolver for jobs and QuestResolver for quests.
 * In the future, InjuryEngine will be called after quest resolution.
 */
export function tickIdleVillage(deps: IdleVillageEngineDeps, state: VillageState, delta: number): IdleVillageTickResult {
  // 1. Advance time using TimeEngine
  const timeResult = advanceTime(deps, state, delta);
  let nextState = timeResult.state;
  const { completedActivityIds } = timeResult;

  const completedJobs: IdleVillageTickResult['completedJobs'] = [];
  const completedQuests: IdleVillageTickResult['completedQuests'] = [];

  // 2. Resolve each completed activity
  for (const scheduledId of completedActivityIds) {
    const scheduled = nextState.activities[scheduledId];
    if (!scheduled || scheduled.status !== 'completed') continue;

    const activity = deps.config.activities[scheduled.activityId];
    if (!activity) continue;

    if (activity.tags.includes('job')) {
      const jobResult = resolveJob(deps, nextState, scheduled);
      nextState = { ...nextState, resources: jobResult.updatedResources };

      const injuryResult = applyFatigueInjuryForActivity(deps, nextState, scheduled, nextState.currentTime);
      nextState = injuryResult.state;

      completedJobs.push({
        scheduledId,
        activityId: scheduled.activityId,
        rewards: jobResult.events[0]?.payload.rewards ?? [],
      });
    } else if (activity.tags.includes('quest')) {
      const questResult = resolveQuest(deps, nextState, scheduled);
      nextState = { ...nextState, resources: questResult.updatedResources };

      const injuryResult = applyFatigueInjuryForActivity(deps, nextState, scheduled, nextState.currentTime);
      nextState = injuryResult.state;

      const payload = questResult.events[0]?.payload;
      if (payload) {
        completedQuests.push({
          scheduledId,
          activityId: scheduled.activityId,
          level: payload.level,
          xpAwarded: payload.xpAwarded,
          varianceCategory: payload.varianceCategory,
          varianceMultiplier: payload.varianceMultiplier,
          rewards: payload.rewards,
        });
      }
    } else {
      // Unknown activity type: ignore for now
    }
  }

  return { state: nextState, completedJobs, completedQuests };
}
