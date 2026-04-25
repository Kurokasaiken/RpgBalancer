import type {
  ActivityDefinition,
  ActivityRollCategory,
  ActivityVarianceConfig,
  IdleVillageConfig,
} from '@/balancing/config/idleVillage/types';

export interface QuestIndicatorResult {
  difficulty?: ActivityRollCategory;
  reward?: ActivityRollCategory;
}

const pickCategory = (
  allowedIds: string[] | undefined,
  categories: ActivityVarianceConfig['difficultyCategories'] | ActivityVarianceConfig['rewardCategories'],
): ActivityRollCategory | undefined => {
  if (!categories || Object.keys(categories).length === 0) {
    return undefined;
  }

  if (allowedIds && allowedIds.length > 0) {
    for (const id of allowedIds) {
      const match = categories[id];
      if (match) {
        return match;
      }
    }
  }

  const firstEntry = Object.values(categories)[0];
  return firstEntry ?? undefined;
};

export const getQuestIndicators = (
  activity: ActivityDefinition | null | undefined,
  config: IdleVillageConfig | null | undefined,
): QuestIndicatorResult => {
  if (!activity || !config?.variance) {
    return {};
  }

  const difficulty = pickCategory(activity.allowedDifficultyCategoryIds, config.variance.difficultyCategories);
  const reward = pickCategory(activity.allowedRewardCategoryIds, config.variance.rewardCategories);

  return {
    difficulty,
    reward,
  };
};

export const formatSeconds = (seconds?: number): string => {
  if (!Number.isFinite(seconds ?? NaN)) return '--';
  const whole = Math.max(0, Math.round(seconds ?? 0));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};
