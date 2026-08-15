import type {
  ActivityDefinition,
  GlobalRules,
  IdleVillageConfig,
  QuestTypeDefinition,
  ResourceRateDefinition,
} from './types';
import { DEFAULT_QUEST_TIME_SCALE } from './quests/questTimeScale';
import { DEFAULT_QUEST_SKILL_CHECK_CONFIG } from './quests/questSkillCheckConfig';

const clone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const normalizeQuestTypes = (
  questTypes?: Record<string, QuestTypeDefinition>,
): Record<string, QuestTypeDefinition> => {
  const normalizedEntries = Object.entries(questTypes ?? {}).reduce<Record<string, QuestTypeDefinition>>(
    (acc, [id, definition]) => {
      acc[id] = {
        ...definition,
        id: definition.id ?? id,
        matchers: definition.matchers ?? [],
      };
      return acc;
    },
    {},
  );

  const hasFallback = Object.values(normalizedEntries).some((definition) => definition.isFallback);

  if (!hasFallback) {
    normalizedEntries.mixed = normalizedEntries.mixed ?? {
      id: 'mixed',
      label: 'Mixed Quest',
      description: 'Default fallback quest type when no matcher is satisfied.',
      icon: '∞',
      colorClass: 'bg-slate-500',
      isFallback: true,
      priority: Number.MAX_SAFE_INTEGER,
    };
  }

  return normalizedEntries;
};

/**
 * Returns a copy of the provided config, ensuring newly introduced fields always have safe defaults.
 * This keeps backwards compatibility for JSON exports/imports that predate recent schema additions.
 */
export function applyIdleVillageConfigDefaults(config: IdleVillageConfig): IdleVillageConfig {
  const normalized = clone(config);

  const nextActivities: Record<string, ActivityDefinition> = {};
  Object.entries(normalized.activities ?? {}).forEach(([id, activity]) => {
    nextActivities[id] = normalizeActivity(activity);
  });
  normalized.activities = nextActivities;
  normalized.questTypes = normalizeQuestTypes(normalized.questTypes);
  normalized.globalRules = normalizeGlobalRules(normalized.globalRules);
  normalized.questTimeScale = normalized.questTimeScale ?? clone(DEFAULT_QUEST_TIME_SCALE);
  normalized.questSkillCheckConfig =
    normalized.questSkillCheckConfig ?? clone(DEFAULT_QUEST_SKILL_CHECK_CONFIG);

  return normalized;
}

const normalizeActivity = (activity: ActivityDefinition): ActivityDefinition => {
  const normalized: ActivityDefinition = {
    ...activity,
    supportsPartialResolution: Boolean(activity.supportsPartialResolution),
    continuousJob: Boolean(activity.continuousJob),
    supportsAutoRepeat: Boolean(activity.supportsAutoRepeat),
    dailyFatigueCost: activity.dailyFatigueCost ?? 0,
    dailyRewardProfile: normalizeRateProfile(activity.dailyRewardProfile),
    perTickCostProfile: normalizeRateProfile(activity.perTickCostProfile),
  };

  return normalized;
};

const normalizeRateProfile = (profile?: ResourceRateDefinition[]): ResourceRateDefinition[] => {
  if (!Array.isArray(profile) || profile.length === 0) {
    return [];
  }
  return profile.map((entry) => ({
    resourceId: entry.resourceId,
    amountPerDay: typeof entry.amountPerDay === 'number' && Number.isFinite(entry.amountPerDay) ? entry.amountPerDay : 0,
  }));
};

const normalizeGlobalRules = (rules: GlobalRules): GlobalRules => {
  const ticksPerDay = rules.ticksPerDay ?? rules.dayLengthInTimeUnits;
  const nightUnits = rules.dayNightCycle?.nightTimeUnits ?? rules.dayLengthInTimeUnits;
  const ticksPerNight = rules.ticksPerNight ?? nightUnits;
  const safeTicksPerNight = ticksPerNight > 0 ? ticksPerNight : nightUnits > 0 ? nightUnits : 1;
  const fatigueRecoveryPerNightTick =
    rules.fatigueRecoveryPerNightTick ?? rules.fatigueRecoveryPerDay / safeTicksPerNight;
  const productionHaltFatigueThreshold = rules.productionHaltFatigueThreshold ?? 1;

  return {
    ...rules,
    ticksPerDay,
    ticksPerNight: safeTicksPerNight,
    fatigueRecoveryPerNightTick,
    productionHaltFatigueThreshold,
  };
};
