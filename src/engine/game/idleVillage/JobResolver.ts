import type {
  ActivityDefinition,
  IdleVillageConfig,
  ResourceDeltaDefinition,
  ResourceRateDefinition,
} from '@/balancing/config/idleVillage/types';
import type { VillageState, ScheduledActivity, VillageResources, VillageEvent } from './TimeEngine';

/**
 * Pure job resolution logic.
 * Reads from IdleVillageConfig; no hardcoded numbers.
 * Now supports continuous jobs, partial resolution, daily profiles, and auto-repeat.
 */

export interface JobResolverDeps {
  config: IdleVillageConfig;
  rng: () => number;
}

export interface JobResolutionResult {
  updatedResources: VillageResources;
  events: VillageEvent[];
  autoRescheduledId?: string;
}

function evaluateRewardAmount(delta: ResourceDeltaDefinition): number {
  const formulaStr = String(delta.amountFormula || '').trim();
  if (!formulaStr) return 0;
  
  // Simple case: if it's just a number, parse it directly
  const parsed = Number.parseFloat(formulaStr);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  
  // TODO: Add formula evaluation logic here if needed
  // For now, just return 0 if it's not a simple number
  console.warn(`Could not evaluate formula: ${formulaStr}`);
  return 0;
}

/**
 * Resolve a completed job activity.
 * For regular jobs: applies deterministic rewards from activity definition.
 * For continuous jobs: accumulates final rewards and handles auto-repeat.
 */
export function resolveJob(deps: JobResolverDeps, villageState: VillageState, scheduled: ScheduledActivity): JobResolutionResult {
  const activity = deps.config.activities[scheduled.activityId];
  if (!activity || !activity.tags.includes('job')) {
    throw new Error(`resolveJob: activity ${scheduled.activityId} is not a job or does not exist`);
  }

  const updatedResources = { ...villageState.resources };
  const events: VillageEvent[] = [];

  if (activity.continuousJob) {
    // For continuous jobs, rewards are applied incrementally per tick
    // At completion, we may need to apply any remaining rewards or handle finalization
    // For now, continuous jobs handle their own rewards per tick in TimeEngine

    // Apply any final completion bonuses if needed
    if (activity.rewards && activity.rewards.length > 0) {
      for (const delta of activity.rewards) {
        const current = updatedResources[delta.resourceId] ?? 0;
        const amount = evaluateRewardAmount(delta);
        updatedResources[delta.resourceId] = current + amount;
      }
    }

    events.push({
      time: villageState.currentTime,
      type: 'activity_completed',
      payload: {
        scheduledId: scheduled.id,
        activityId: scheduled.activityId,
        rewards: activity.rewards ?? [],
        continuousJob: true,
      },
    });
  } else {
    // Regular job: apply deterministic rewards
    const rewards = activity.rewards ?? [];

    for (const delta of rewards) {
      const current = updatedResources[delta.resourceId] ?? 0;
      const amount = evaluateRewardAmount(delta);
      updatedResources[delta.resourceId] = current + amount;
    }

    events.push({
      time: villageState.currentTime,
      type: 'activity_completed',
      payload: {
        scheduledId: scheduled.id,
        activityId: scheduled.activityId,
        rewards,
      },
    });
  }

  // Handle auto-repeat logic
  let autoRescheduledId: string | undefined;

  if (activity.supportsAutoRepeat && scheduled.isAuto) {
    // Check if we should auto-reschedule based on config and state
    const shouldAutoReschedule = checkAutoRescheduleConditions(deps, villageState, scheduled, activity);

    if (shouldAutoReschedule) {
      // Create a new scheduled activity for auto-repeat
      const newScheduledId = `act_auto_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

      // Note: Auto-rescheduling would need to be handled at a higher level
      // For now, we'll just indicate that auto-reschedule should happen
      autoRescheduledId = newScheduledId;

      events.push({
        time: villageState.currentTime,
        type: 'activity_scheduled',
        payload: {
          scheduledId: newScheduledId,
          activityId: scheduled.activityId,
          characterIds: scheduled.characterIds,
          slotId: scheduled.slotId,
          autoRescheduled: true,
        },
      });
    }
  }

  return {
    updatedResources,
    events,
    autoRescheduledId,
  };
}

/**
 * Check if an activity should auto-reschedule based on config conditions.
 */
function checkAutoRescheduleConditions(
  deps: JobResolverDeps,
  villageState: VillageState,
  scheduled: ScheduledActivity,
  activity: ActivityDefinition,
): boolean {
  // Check character availability and fatigue
  const allCharactersAvailable = scheduled.characterIds.every(id => {
    const resident = villageState.residents[id];
    return resident && resident.status === 'available';
  });

  if (!allCharactersAvailable) {
    return false;
  }

  // Check resource requirements if any
  if (activity.perTickCostProfile) {
    for (const cost of activity.perTickCostProfile) {
      const amount = resolveDailyRateAmount(cost);
      const currentAmount = villageState.resources[cost.resourceId] ?? 0;
      if (currentAmount < amount) {
        return false; // Insufficient resources for costs
      }
    }
  }

  // Check daily fatigue cost
  if (activity.dailyFatigueCost) {
    const averageFatigue = scheduled.characterIds.reduce((sum, id) => {
      const resident = villageState.residents[id];
      return sum + (resident?.fatigue ?? 0);
    }, 0) / scheduled.characterIds.length;

    const fatigueCap = deps.config.globalRules.maxFatigueBeforeExhausted ?? 100;
    if (averageFatigue + activity.dailyFatigueCost > fatigueCap) {
      return false; // Would exceed fatigue cap
    }
  }

  return true;
}

function resolveDailyRateAmount(rate: ResourceRateDefinition): number {
  if (typeof rate.amountPerDay === 'number') {
    return rate.amountPerDay;
  }
  const parsed = Number(rate.amountPerDay);
  return Number.isFinite(parsed) ? parsed : 0;
}
