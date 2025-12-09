import type { IdleVillageConfig, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { VillageState, ScheduledActivity, VillageResources } from './TimeEngine';

/**
 * Pure job resolution logic.
 * Reads from IdleVillageConfig; no hardcoded numbers.
 * In the future, this could be extended to read from ActivityDefinition.metadata
 * for per-job fatigue/reward multipliers.
 */

export interface JobResolverDeps {
  config: IdleVillageConfig;
  rng: () => number;
}

export interface JobResolutionResult {
  updatedResources: VillageResources;
  events: {
    type: 'job_completed';
    payload: {
      scheduledId: string;
      activityId: string;
      rewards: ResourceDeltaDefinition[];
    };
  }[];
}

function evaluateRewardAmount(delta: ResourceDeltaDefinition): number {
  const raw = (delta as ResourceDeltaDefinition).amountFormula?.toString().trim?.() ?? '';
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Resolve a completed job activity.
 * For now, uses simple deterministic rewards from the activity definition.
 * In the future, variance and building bonuses can be applied here.
 */
export function resolveJob(deps: JobResolverDeps, villageState: VillageState, scheduled: ScheduledActivity): JobResolutionResult {
  const activity = deps.config.activities[scheduled.activityId];
  if (!activity || !activity.tags.includes('job')) {
    throw new Error(`resolveJob: activity ${scheduled.activityId} is not a job or does not exist`);
  }

  // Simple deterministic rewards: just apply the resource deltas from the activity definition
  // In a more advanced version, we could apply variance, building bonuses, character skills, etc.
  const rewards = activity.rewards ?? [];

  // Apply rewards to village resources, evaluating amountFormula as a simple integer
  const updatedResources = { ...villageState.resources };
  for (const delta of rewards) {
    const current = updatedResources[delta.resourceId] ?? 0;
    const amount = evaluateRewardAmount(delta);
    updatedResources[delta.resourceId] = current + amount;
  }

  return {
    updatedResources,
    events: [
      {
        type: 'job_completed',
        payload: {
          scheduledId: scheduled.id,
          activityId: scheduled.activityId,
          rewards,
        },
      },
    ],
  };
}
