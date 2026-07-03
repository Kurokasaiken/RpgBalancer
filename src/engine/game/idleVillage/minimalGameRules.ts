/**
 * Minimal Game Rules – Logic Core
 *
 * Pure functions for the Minimal Gameplay loop. No React, no side effects.
 * All calculations are deterministic and depend only on the config and input state.
 * This is the single source of truth for game math; UI must call these functions.
 */

import type {
  MinimalConfig,
  MinimalActivity,
  MinimalGlobalRules,
} from '@/balancing/config/idleVillage/minimalConfig';
import { MinimalGameplayReasonCode } from '@/balancing/config/idleVillage/minimalConfig';
import type { VillageEvent } from './TimeEngine';
import {
  ensureMinimalRngState,
  nextRandomValue,
  type MinimalRngState,
} from './RandomHelper';

/**
 * Represents a single tick result.
 */
export interface TickResult {
  goldDelta: number;
  foodDelta: number;
  woodDelta: number;  // Added for vertical slice
  xpDelta: number;    // Added for vertical slice
  fatigueDelta: number;
  events: VillageEvent[];
  injuries: string[];
  rngState: MinimalRngState;
}

/**
 * Resident snapshot used inside Minimal Gameplay calculations.
 */
export interface ResidentState {
  id: string;
  name: string;
  level: number;
  stats: Record<string, number>;
  fatigue: number;
  isInjured: boolean;
  isWorking: boolean;
}

/**
 * Represents the current game state for calculations.
 */
export interface GameState {
  gold: number;
  food: number;
  maxFood: number;
  wood: number;    // Added for vertical slice
  xp: number;      // Added for vertical slice
  residents: ResidentState[];
  activeActivities: Array<{
    activityId: string;
    residentId: string;
    ticksRemaining: number;
  }>;
  currentDay: number;
  isPaused: boolean;
  speedMultiplier: number;
  rngState?: MinimalRngState;
}

export interface ActivityValidationResult {
  canStart: boolean;
  reason?: string;
  reasonCode?: MinimalGameplayReasonCode;
}

export class MinimalGameplayActionError extends Error {
  public readonly reasonCode: MinimalGameplayReasonCode;

  constructor(reasonCode: MinimalGameplayReasonCode, message?: string) {
    super(message ?? `MinimalGameplayActionError: ${reasonCode}`);
    this.name = 'MinimalGameplayActionError';
    this.reasonCode = reasonCode;
  }
}

/**
 * Calculates the result of a single tick for the game state.
 */
export function calculateTick(state: GameState, config: MinimalConfig): TickResult {
  const result: TickResult = {
    goldDelta: 0,
    foodDelta: 0,
    woodDelta: 0,  // Added for vertical slice
    xpDelta: 0,    // Added for vertical slice
    fatigueDelta: 0,
    events: [],
    injuries: [],
    rngState: ensureMinimalRngState(state.rngState, config.globalRules.rngSeed),
  };

  const eventTime = state.currentDay;
  let workingRngState = result.rngState;

  const pushEvent = (type: VillageEvent['type'], payload: Record<string, unknown>) => {
    result.events.push({
      time: eventTime,
      type,
      payload,
    });
  };

  // Process active activities
  for (const active of state.activeActivities) {
    const activity = config.activities.find((a) => a.id === active.activityId);
    if (!activity) continue;

    if (active.ticksRemaining <= 1) {
      // Activity completes this tick
      result.goldDelta += activity.baseReward.gold;
      result.foodDelta += activity.baseReward.food;
      result.woodDelta += activity.baseReward.wood || 0; // Added for vertical slice
      result.xpDelta += activity.baseReward.xp || 0;     // Added for vertical slice
      result.fatigueDelta += activity.fatiguePerTick;

      const resident = state.residents.find((r) => r.id === active.residentId);
      if (resident) {
        pushEvent('activity_completed', {
          residentId: resident.id,
          activityId: activity.id,
          residentName: resident.name,
          activityName: activity.name,
          rewardGold: activity.baseReward.gold,
          rewardFood: activity.baseReward.food,
          rewardWood: activity.baseReward.wood || 0, // Added for vertical slice
          rewardXp: activity.baseReward.xp || 0,     // Added for vertical slice
        });
      }

      // Check for injury and death based on dangerRating
      if (resident) {
        // Calculate injury probability based on dangerRating (0-10 scale)
        // Base injury chance: 1% per dangerRating point
        const injuryChance = (activity.dangerRating || 0) * 0.01; // 1% per danger point
        
        // Calculate death chance: much lower, only for high danger activities
        // Death chance: 0.1% per dangerRating point above 5
        const deathChance = activity.dangerRating && activity.dangerRating > 5 
          ? (activity.dangerRating - 5) * 0.001 
          : 0;

        // Check for injury
        const injuryRngSample = nextRandomValue(workingRngState);
        workingRngState = injuryRngSample.nextState;
        if (injuryRngSample.value < injuryChance) {
          result.injuries.push(resident.id);
          pushEvent('injury_applied', {
            residentId: resident.id,
            residentName: resident.name,
            activityId: activity.id,
            activityName: activity.name,
            reason: 'activity_risk',
            dangerRating: activity.dangerRating,
            injuryChance: injuryChance,
          });
        }

        // Death handling would require resident system changes
        // For vertical slice, we focus on injury only
      }
    } else {
      // Activity continues, accumulate fatigue
      result.fatigueDelta += activity.fatiguePerTick;
    }
  }

  // Daily food consumption
  const workingResidents = state.residents.filter((r) => r.isWorking && !r.isInjured);
  const dailyConsumption = workingResidents.length * config.globalRules.dailyFoodConsumptionPerResident;
  result.foodDelta -= dailyConsumption;
  if (dailyConsumption > 0) {
    pushEvent('food_consumed_daily', {
      amount: dailyConsumption,
    });
  }

  // Fatigue decay for resting residents
  const restingResidents = state.residents.filter((r) => !r.isWorking && !r.isInjured);
  const fatigueDecay = restingResidents.length * config.globalRules.fatigueDecayPerRestTick;
  result.fatigueDelta -= fatigueDecay;
  if (fatigueDecay > 0) {
    pushEvent('fatigue_changed', {
      fatigueDelta: fatigueDecay,
    });
  }

  return {
    ...result,
    rngState: workingRngState,
  };
}

/**
 * Applies a tick result to the game state, returning a new state.
 */
export function applyTickResult(state: GameState, result: TickResult, config: MinimalConfig): GameState {
  const newState = { ...state };

  // Update resources
  newState.gold = Math.max(0, state.gold + result.goldDelta);
  newState.food = Math.max(0, Math.min(state.maxFood, state.food + result.foodDelta));
  newState.wood = Math.max(0, state.wood + result.woodDelta);   // Added for vertical slice
  newState.xp = Math.max(0, state.xp + result.xpDelta);           // Added for vertical slice

  // Update residents
  newState.residents = state.residents.map((resident) => {
    const updated: ResidentState = { ...resident };
    updated.fatigue = Math.max(0, Math.min(100, resident.fatigue + result.fatigueDelta));
    if (result.injuries.includes(resident.id)) {
      updated.isInjured = true;
      updated.isWorking = false;
    }
    return updated;
  });

  // Update active activities (decrement ticks, remove completed)
  newState.activeActivities = state.activeActivities
    .map((active) => ({
      ...active,
      ticksRemaining: active.ticksRemaining - 1,
    }))
    .filter((active) => active.ticksRemaining > 0);

  // Increment day if not paused
  if (!state.isPaused) {
    newState.currentDay = state.currentDay + 1;
  }

  newState.rngState = result.rngState ?? state.rngState;

  return newState;
}

/**
 * Validates if a resident can start an activity.
 */
export function canStartActivity(
  residentId: string,
  activityId: string,
  state: GameState,
  config: MinimalConfig
): ActivityValidationResult {
  const resident = state.residents.find((r) => r.id === residentId);
  const activity = config.activities.find((a) => a.id === activityId);
  const fail = (reasonCode: MinimalGameplayReasonCode, reason?: string): ActivityValidationResult => ({
    canStart: false,
    reason,
    reasonCode,
  });

  if (!resident) {
    return fail(MinimalGameplayReasonCode.ResidentNotFound, 'Resident not found');
  }
  if (!activity) {
    return fail(MinimalGameplayReasonCode.ActivityNotFound, 'Activity not found');
  }
  if (resident.isInjured) {
    return fail(MinimalGameplayReasonCode.ResidentInjured, 'Resident is injured');
  }
  if (resident.isWorking) {
    return fail(MinimalGameplayReasonCode.ResidentBusy, 'Resident is already working');
  }
  if (resident.fatigue >= 100) {
    return fail(MinimalGameplayReasonCode.ResidentExhausted, 'Resident is exhausted');
  }
  if (state.gold < activity.cost.gold || state.food < activity.cost.food) {
    return fail(MinimalGameplayReasonCode.InsufficientResources, 'Insufficient resources');
  }
  const activityBusy = state.activeActivities.some((active) => active.activityId === activityId);
  if (activityBusy) {
    return fail(MinimalGameplayReasonCode.ActivityInProgress, 'Activity already in progress');
  }
  if (activity.statRequirements) {
    for (const [stat, required] of Object.entries(activity.statRequirements)) {
      const residentStat = resident.stats?.[stat] ?? 0;
      if (residentStat < required) {
        return fail(
          MinimalGameplayReasonCode.StatRequirementFailed,
          `Insufficient ${stat}: ${residentStat} < ${required}`
        );
      }
    }
  }

  return { canStart: true };
}

/**
 * Starts an activity for a resident, returning a new state.
 */
export function startActivity(
  residentId: string,
  activityId: string,
  state: GameState,
  config: MinimalConfig
): GameState {
  const validation = canStartActivity(residentId, activityId, state, config);
  if (!validation.canStart) {
    throw new MinimalGameplayActionError(
      validation.reasonCode ?? MinimalGameplayReasonCode.Unknown,
      validation.reason ?? 'Cannot start activity'
    );
  }

  const activity = config.activities.find((a) => a.id === activityId)!;
  const newState = { ...state };

  // Deduct costs
  newState.gold = state.gold - activity.cost.gold;
  newState.food = state.food - activity.cost.food;

  // Mark resident as working
  newState.residents = state.residents.map((resident) =>
    resident.id === residentId ? { ...resident, isWorking: true } : resident
  );

  // Add to active activities
  newState.activeActivities = [
    ...state.activeActivities,
    {
      activityId,
      residentId,
      ticksRemaining: activity.durationTicks,
    },
  ];

  return newState;
}

/**
 * Reward delta produced by a completed activity.
 */
export interface ActivityRewardDelta {
  gold: number;
  food: number;
  wood: number;
  xp: number;
}

/**
 * Record of an activity that completed during a tick batch.
 */
export interface CompletedActivityRecord {
  activityId: string;
  activityName: string;
  residentId: string;
  residentName: string;
  reward: ActivityRewardDelta;
  injured: boolean;
}

/**
 * Result of advancing all active activities by a single tick.
 */
export interface ActivityTickResult {
  state: GameState;
  events: VillageEvent[];
  completed: CompletedActivityRecord[];
}

/**
 * Advances every active activity by exactly one tick.
 *
 * Unlike {@link calculateTick}/{@link applyTickResult}, this helper is scoped to
 * activity progression only: it decrements remaining ticks, accumulates per-tick
 * fatigue on working residents, and applies config-driven `baseReward` + injury
 * rolls when an activity completes. It deliberately does NOT handle daily food
 * consumption or rest fatigue decay, which remain the responsibility of the
 * caller (the gameplay store advances those on day boundaries).
 *
 * Pure and deterministic: identical inputs (including `rngState`) produce
 * identical outputs.
 */
export function processActivitiesTick(state: GameState, config: MinimalConfig): ActivityTickResult {
  const events: VillageEvent[] = [];
  const completed: CompletedActivityRecord[] = [];
  const eventTime = state.currentDay;

  let workingRngState = ensureMinimalRngState(state.rngState, config.globalRules.rngSeed);

  const rewardDelta: ActivityRewardDelta = { gold: 0, food: 0, wood: 0, xp: 0 };
  const fatigueByResident: Record<string, number> = {};
  const injuredResidentIds = new Set<string>();
  const nextActiveActivities: GameState['activeActivities'] = [];

  for (const active of state.activeActivities) {
    const activity = config.activities.find((a) => a.id === active.activityId);
    if (!activity) {
      // Drop unknown activities defensively (config changed underneath us).
      continue;
    }

    // Every working resident accrues fatigue for this tick.
    fatigueByResident[active.residentId] =
      (fatigueByResident[active.residentId] ?? 0) + activity.fatiguePerTick;

    const ticksRemaining = active.ticksRemaining - 1;

    if (ticksRemaining > 0) {
      nextActiveActivities.push({ ...active, ticksRemaining });
      continue;
    }

    // Activity completes this tick → apply config-driven rewards.
    const reward: ActivityRewardDelta = {
      gold: activity.baseReward.gold ?? 0,
      food: activity.baseReward.food ?? 0,
      wood: activity.baseReward.wood ?? 0,
      xp: activity.baseReward.xp ?? 0,
    };
    rewardDelta.gold += reward.gold;
    rewardDelta.food += reward.food;
    rewardDelta.wood += reward.wood;
    rewardDelta.xp += reward.xp;

    const resident = state.residents.find((r) => r.id === active.residentId);
    const residentName = resident?.name ?? active.residentId;

    // Injury roll based on dangerRating (1% per danger point), matching calculateTick.
    let injured = false;
    const injuryChance = (activity.dangerRating ?? 0) * 0.01;
    if (injuryChance > 0) {
      const injuryRngSample = nextRandomValue(workingRngState);
      workingRngState = injuryRngSample.nextState;
      if (injuryRngSample.value < injuryChance) {
        injured = true;
        injuredResidentIds.add(active.residentId);
      }
    }

    events.push({
      time: eventTime,
      type: 'activity_completed',
      payload: {
        residentId: active.residentId,
        residentName,
        activityId: activity.id,
        activityName: activity.name,
        rewardGold: reward.gold,
        rewardFood: reward.food,
        rewardWood: reward.wood,
        rewardXp: reward.xp,
      },
    });

    if (injured) {
      events.push({
        time: eventTime,
        type: 'injury_applied',
        payload: {
          residentId: active.residentId,
          residentName,
          activityId: activity.id,
          activityName: activity.name,
          reason: 'activity_risk',
          dangerRating: activity.dangerRating,
          injuryChance,
        },
      });
    }

    completed.push({
      activityId: activity.id,
      activityName: activity.name,
      residentId: active.residentId,
      residentName,
      reward,
      injured,
    });
  }

  const nextState: GameState = {
    ...state,
    gold: Math.max(0, state.gold + rewardDelta.gold),
    food: Math.max(0, Math.min(state.maxFood, state.food + rewardDelta.food)),
    wood: Math.max(0, state.wood + rewardDelta.wood),
    xp: Math.max(0, state.xp + rewardDelta.xp),
    residents: state.residents.map((resident) => {
      const fatigueGain = fatigueByResident[resident.id] ?? 0;
      const isInjured = resident.isInjured || injuredResidentIds.has(resident.id);
      // A resident stops working when their activity completed or they got injured.
      const stillWorking =
        nextActiveActivities.some((a) => a.residentId === resident.id) && !isInjured;
      return {
        ...resident,
        fatigue: Math.max(0, Math.min(100, resident.fatigue + fatigueGain)),
        isInjured,
        isWorking: stillWorking,
      };
    }),
    activeActivities: nextActiveActivities,
    rngState: workingRngState,
  };

  return { state: nextState, events, completed };
}

/**
 * Calculates how many days of food remain.
 */
export function calculateDaysRemaining(state: GameState, config: MinimalConfig): number {
  if (state.food <= 0) return 0;
  const workingResidents = state.residents.filter((r) => r.isWorking && !r.isInjured);
  const dailyConsumption = workingResidents.length * config.globalRules.dailyFoodConsumptionPerResident;
  return dailyConsumption > 0 ? Math.floor(state.food / dailyConsumption) : Infinity;
}

/**
 * Checks if the game is over.
 */
export function isGameOver(state: GameState): { isOver: boolean; reason?: string } {
  if (state.food <= 0) {
    return { isOver: true, reason: 'food_depleted' };
  }
  const healthyResidents = state.residents.filter((r) => !r.isInjured);
  if (healthyResidents.length === 0) {
    return { isOver: true, reason: 'all_injured' };
  }
  return { isOver: false };
}
