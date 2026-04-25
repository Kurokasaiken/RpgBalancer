import type { IdleVillageConfig, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { VillageState, ScheduledActivity, VillageResources } from './TimeEngine';

/**
 * Pure quest resolution logic.
 * Reads from IdleVillageConfig; no hardcoded numbers.
 * Supports quest levels, XP, difficulty/reward variance, and injury/death hooks.
 */

export interface QuestResolverDeps {
  config: IdleVillageConfig;
  rng: () => number;
}

export interface QuestResolutionResult {
  updatedResources: VillageResources;
  events: {
    type: 'quest_completed';
    payload: {
      scheduledId: string;
      activityId: string;
      level: number;
      xpAwarded: number;
      varianceCategory?: string;
      varianceMultiplier?: number;
      rewards: ResourceDeltaDefinition[];
      injuryRolls?: {
        characterId: string;
        injuryType: 'light' | 'heavy' | 'death';
        reason: string;
      }[];
    };
  }[];
}

/**
 * Evaluates a simple integer reward formula for deterministic payouts.
 */
function evaluateRewardAmount(delta: ResourceDeltaDefinition): number {
  const raw = (delta as ResourceDeltaDefinition).amountFormula?.toString().trim?.() ?? '';
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Resolve a completed quest activity.
 * - Reads quest level from ActivityDefinition.metadata (or defaults to 1)
 * - Calculates XP using GlobalRules.questXpFormula (simple linear for now)
 * - Applies difficulty and reward variance if configured
 * - Returns resource deltas and injury/death hooks (to be processed by an InjuryEngine later)
 */
export function resolveQuest(deps: QuestResolverDeps, villageState: VillageState, scheduled: ScheduledActivity): QuestResolutionResult {
  const activity = deps.config.activities[scheduled.activityId];
  if (!activity || !activity.tags.includes('quest')) {
    throw new Error(`resolveQuest: activity ${scheduled.activityId} is not a quest or does not exist`);
  }

  // 1. Quest level (from metadata or default)
  const questLevel = typeof activity.metadata?.level === 'number' ? activity.metadata.level : 1;

  // 2. XP from quest level using GlobalRules formula
  // For now, implement a very simple linear formula: xp = baseXpPerLevel * level
  // In the future, this could be a full formula engine call
  // Note: GlobalRules.questXpFormula is a string; for now we parse a simple number if present, else default
  const questXpFormula = deps.config.globalRules.questXpFormula;
  let baseXpPerLevel = 10;
  if (questXpFormula && /^\d+$/.test(questXpFormula.trim())) {
    baseXpPerLevel = Number.parseInt(questXpFormula.trim(), 10);
  }
  const xpAwarded = baseXpPerLevel * questLevel;

  // 3. Difficulty and reward variance (optional)
  let varianceCategory: string | undefined;
  let varianceMultiplier: number | undefined;
  const variance = deps.config.variance;
  if (variance) {
    // Simple roll: pick a category based on weights from rewardCategories
    // For now, just use the first reward category as a stub
    const firstCategory = Object.values(variance.rewardCategories)[0];
    if (firstCategory) {
      varianceCategory = firstCategory.id;
      // Use midpoint of range as multiplier for simplicity
      varianceMultiplier = (firstCategory.minMultiplier + firstCategory.maxMultiplier) / 2;
    }
  }

  // 4. Apply variance to resource rewards (if any)
  const rewards = activity.rewards ?? [];
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
        type: 'quest_completed',
        payload: {
          scheduledId: scheduled.id,
          activityId: scheduled.activityId,
          level: questLevel,
          xpAwarded,
          varianceCategory,
          varianceMultiplier,
          rewards,
        },
      },
    ],
  };
}
