import type { ActivityDefinition, GlobalRules, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type {
  VillageState,
  ScheduledActivity,
  VillageTimeUnit,
  VillageEvent,
  ResidentState,
} from './TimeEngine';

export interface InjuryEngineDeps {
  config: IdleVillageConfig;
  rng: () => number;
}

export interface InjuryEngineResult {
  state: VillageState;
  events: VillageEvent[];
}

function getActivity(config: IdleVillageConfig, activityId: string): ActivityDefinition | undefined {
  return config.activities[activityId];
}

function computeLightInjuryChance(
  rules: GlobalRules,
  activity: ActivityDefinition,
  resident: ResidentState,
): number {
  const { maxFatigueBeforeExhausted, baseLightInjuryChanceAtMaxFatigue, dangerInjuryMultiplierPerPoint } = rules;

  if (resident.status === 'dead') return 0;

  const normalizedFatigue = Math.max(0, Math.min(1, resident.fatigue / maxFatigueBeforeExhausted));
  if (normalizedFatigue <= 0) return 0;

  const dangerRating = activity.dangerRating ?? 0;
  const baseChance = baseLightInjuryChanceAtMaxFatigue * normalizedFatigue;
  const dangerScale = 1 + dangerInjuryMultiplierPerPoint * dangerRating;
  const chance = baseChance * dangerScale;

  return Math.max(0, Math.min(1, chance));
}

export function applyFatigueInjuryForActivity(
  deps: InjuryEngineDeps,
  state: VillageState,
  scheduled: ScheduledActivity,
  now: VillageTimeUnit,
): InjuryEngineResult {
  const activity = getActivity(deps.config, scheduled.activityId);
  if (!activity) return { state, events: [] };

  const rules = deps.config.globalRules;
  const lightInjuryDurationUnits = rules.dayLengthInTimeUnits; // 1 in-game day for now; fully config-driven later

  const updatedResidents: Record<string, ResidentState> = { ...state.residents };
  const events: VillageEvent[] = [];

  for (const cid of scheduled.characterIds) {
    const r = updatedResidents[cid];
    if (!r || r.status === 'dead') continue;

    const chance = computeLightInjuryChance(rules, activity, r);
    if (chance <= 0) continue;

    const roll = deps.rng();
    if (roll < chance) {
      const recoveryTime = now + lightInjuryDurationUnits;
      const nextResident: ResidentState = {
        ...r,
        status: 'injured',
        injuryRecoveryTime: recoveryTime,
      };
      updatedResidents[cid] = nextResident;

      events.push({
        time: now,
        type: 'injury_applied',
        payload: {
          residentId: cid,
          scheduledId: scheduled.id,
          activityId: scheduled.activityId,
          severity: 'light',
          recoveryTime,
          fatigueAtInjury: r.fatigue,
          dangerRating: activity.dangerRating ?? 0,
        },
      });
    }
  }

  if (events.length === 0) {
    return { state, events: [] };
  }

  const nextState: VillageState = {
    ...state,
    residents: updatedResidents,
    eventLog: [...state.eventLog, ...events],
  };

  return { state: nextState, events };
}
