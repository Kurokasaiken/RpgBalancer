// src/engine/game/idleVillage/TimeEngine.ts
// Core time & activity engine for the Idle Village meta-game.
// Pure domain module: no React, no UI, no direct storage access.
// All domain values come from IdleVillageConfig (config-first philosophy).

import type { ActivityDefinition, IdleVillageConfig, TrialOfFireRules } from '@/balancing/config/idleVillage/types';
import type { PortraitCropSettings } from '@/balancing/config/idleVillage/residentVisuals';
import type { StatBlock } from '../../../balancing/types';

const DEFAULT_RESIDENT_MAX_HP = 200;
const DEFAULT_TRIAL_OF_FIRE_THRESHOLD = 0.25;
const RESOURCE_PRECISION = 4;
const IS_DEV_ENV =
  (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
  (typeof window !== 'undefined' && (window as { __DEV__?: boolean }).__DEV__);

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizeResourceValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** RESOURCE_PRECISION;
  return Math.round(value * factor) / factor;
}

/**
 * Computes the fatigue gain applied when an activity completes.
 * Reads the optional fatigue profile from config; otherwise falls back to the global default.
 */
function getActivityFatigueGain(
  config: IdleVillageConfig,
  activityId: string,
  duration: VillageTimeUnit,
): number {
  const activityDef = getActivity(config, activityId);
  const profile = activityDef?.fatigueProfile;
  const baseGain =
    typeof profile?.baseGain === 'number' ? profile.baseGain : config.globalRules.defaultActivityFatigueGain ?? 0;
  const perUnit =
    typeof profile?.perTimeUnitGain === 'number' ? profile.perTimeUnitGain : 0;
  const total = baseGain + perUnit * Math.max(0, duration);
  return total > 0 ? total : 0;
}

export type VillageTimeUnit = number;

export type ResidentStatus =
  | 'available'
  | 'away'
  | 'exhausted'
  | 'injured'
  | 'dead';

export type VillageActivityStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';

export interface ScheduledActivity {
  id: string;
  activityId: string;
  /** Character IDs assigned to this activity */
  characterIds: string[];
  slotId: string;
  startTime: VillageTimeUnit;
  endTime: VillageTimeUnit;
  status: VillageActivityStatus;
  /**
   * Whether this activity should automatically reschedule itself once completed.
   * Typically derived from activity metadata or explicit user toggles.
   */
  isAuto: boolean;
  /**
   * Whether this activity already resolved successfully at least once.
   * Keeps UI/resolvers from reprocessing completion side-effects.
   */
  isCompleted: boolean;
  /**
   * Snapshot of the death risk perceived when the activity was scheduled.
   * Used by Trial of Fire processing to determine survival bonuses.
   */
  snapshotDeathRisk: number;
  /**
   * Tracks how much fatigue has already been applied per resident while the activity runs.
   * Ensures incremental ticks don't over-apply compared to the configured profile.
   */
  fatigueApplied?: Record<string, number>;
}

export interface TrialOfFireSurvivor {
  characterId: string;
  heroized: boolean;
  bonusApplied: boolean;
  hpRatio: number;
}

export interface TrialOfFireFallen {
  characterId: string;
  risk: number;
  roll: number;
}

export interface ResolveActivityOutcomeResult {
  scheduledId: string;
  survivors: TrialOfFireSurvivor[];
  fallen: TrialOfFireFallen[];
  heroizedIds: string[];
  autoRescheduledId?: string | null;
}

export interface CreateVillageStateOptions {
  /**
   * Overrides for starting resources (after config defaults are applied).
   * Useful in tests or when continuing from a saved snapshot.
   */
  initialResourcesOverride?: VillageResources;
  /**
   * Optional residents to seed immediately after state creation.
   * Used by Character Manager integration to import saved characters.
   */
  initialResidents?: ResidentState[];
}

function normalizeStartingResources(config: IdleVillageConfig, overrides?: VillageResources): VillageResources {
  const normalized: VillageResources = {};
  const starting = config.globalRules.startingResources ?? {};
  Object.entries(starting).forEach(([resourceId, value]) => {
    if (typeof value === 'number' && value > 0) {
      normalized[resourceId] = value;
    }
  });

  if (overrides) {
    Object.entries(overrides).forEach(([resourceId, value]) => {
      if (typeof value === 'number' && value >= 0) {
        normalized[resourceId] = value;
      }
    });
  }

  return normalized;
}

/**
 * Resolves the initial fatigue to apply when seeding residents into a new village state.
 * Falls back to the exhaustion cap when no explicit starting value is provided.
 */
export function getStartingResidentFatigue(config: IdleVillageConfig, fatigueCapOverride?: number): number {
  const fatigueCap =
    typeof fatigueCapOverride === 'number'
      ? fatigueCapOverride
      : typeof config.globalRules?.maxFatigueBeforeExhausted === 'number'
        ? Math.max(0, config.globalRules.maxFatigueBeforeExhausted)
        : 0;
  const starting = config.globalRules.startingResidentFatigue;
  if (typeof starting === 'number' && Number.isFinite(starting)) {
    return Math.max(0, Math.min(fatigueCap, starting));
  }
  return fatigueCap;
}

export function createVillageStateFromConfig(options: { config: IdleVillageConfig } & CreateVillageStateOptions): VillageState {
  const { config, initialResourcesOverride, initialResidents } = options;
  const initialResources = normalizeStartingResources(config, initialResourcesOverride);
  const state = createInitialVillageState(initialResources);
  const fatigueCap =
    typeof config.globalRules?.maxFatigueBeforeExhausted === 'number'
      ? Math.max(0, config.globalRules.maxFatigueBeforeExhausted)
      : 0;
  const defaultStartingFatigue = getStartingResidentFatigue(config, fatigueCap);

  if (initialResidents?.length) {
    const residentRecord: Record<string, ResidentState> = { ...state.residents };
    initialResidents.forEach((resident) => {
      if (!resident?.id) return;
      const maxHp =
        typeof resident.maxHp === 'number' && Number.isFinite(resident.maxHp) && resident.maxHp > 0
          ? resident.maxHp
          : DEFAULT_RESIDENT_MAX_HP;
      const currentHp =
        typeof resident.currentHp === 'number' && Number.isFinite(resident.currentHp)
          ? Math.max(0, Math.min(maxHp, resident.currentHp))
          : maxHp;
      const normalizedFatigue =
        typeof resident.fatigue === 'number' && Number.isFinite(resident.fatigue)
          ? Math.max(0, Math.min(fatigueCap, resident.fatigue))
          : defaultStartingFatigue;
      residentRecord[resident.id] = {
        ...resident,
        maxHp,
        currentHp,
        fatigue: normalizedFatigue,
        statTags: resident.statTags ? [...resident.statTags] : [],
        statSnapshot: resident.statSnapshot ? { ...resident.statSnapshot } : undefined,
        status: resident.status ?? 'available',
        isHero: Boolean(resident.isHero),
        isInjured: Boolean(resident.isInjured),
        survivalCount: resident.survivalCount ?? 0,
        survivalScore: resident.survivalScore ?? 0,
      };
    });
    state.residents = residentRecord;
  }

  if (IS_DEV_ENV) {
    const residentCount = Object.keys(state.residents).length;
    console.debug('[TimeEngine] createVillageStateFromConfig', {
      residentCount,
    });
  }

  return state;
}

export interface VillageResources {
  [resourceId: string]: number;
}

export interface ResidentState {
  id: string; // SavedCharacter / Entity ID
  displayName?: string;
  homeId?: string; // building / house reference (string-based)
  status: ResidentStatus;
  fatigue: number;
  /** If injured, time when the resident becomes available again. */
  injuryRecoveryTime?: VillageTimeUnit;
  /**
   * Optional reference to a stat preset coming from the Balancer config/presets.
   * Enables config-first linkage between Idle Village residents and Balancer archetypes.
   */
  statProfileId?: string;
  /**
   * Identifier referencing a ResidentVisualProfileDefinition entry.
   * Lets UI/renderers resolve portraits without duplicating mapping logic.
   */
  visualProfileId?: string;
  /**
   * Direct portrait override (e.g. bespoke NPC art). Falls back to visual profile assets when omitted.
   */
  portraitUrl?: string;
  /**
   * Optional full-figure illustration used by Theater view or cinematic layouts.
   */
  fullFigureUrl?: string;
  /**
   * Optional portrait crop override controlling badge focus/zoom.
   */
  portraitCrop?: PortraitCropSettings;
  /**
   * Snapshot of the resident's stats (partial to avoid forcing every field).
   * Populated via Balancer exports to avoid recomputing during Idle Village runtime.
   */
  statSnapshot?: Partial<StatBlock>;
  /**
   * Cached tags/labels that describe the resident's strongest stats (e.g. ['reason','lantern']).
   * Used by assignment UIs to match slot requirements without recalculating against the full StatBlock.
   */
  statTags?: string[];
  currentHp: number;
  maxHp: number;
  isHero: boolean;
  isInjured: boolean;
  survivalCount: number;
  /**
   * Aggregate score tracking the quality of Trial of Fire survivals.
   * Used for hero ranking and unlock thresholds.
   */
  survivalScore: number;
}

export interface QuestOffer {
  id: string;
  /** ID of the quest ActivityDefinition this offer refers to */
  activityId: string;
  /** Map slot where this quest is currently offered */
  slotId: string;
  createdAtTime: VillageTimeUnit;
  /** Optional expiration time for the offer (in VillageTimeUnits) */
  expiresAtTime?: VillageTimeUnit;
}

export interface VillageEvent {
  time: VillageTimeUnit;
  type:
    | 'activity_scheduled'
    | 'activity_started'
    | 'activity_completed'
    | 'activity_cancelled'
    | 'fatigue_changed'
    | 'injury_applied'
    | 'food_consumed_daily'
    | 'trial_of_fire';
  payload: Record<string, unknown>;
}

export interface VillageState {
  currentTime: VillageTimeUnit;
  resources: VillageResources;
  residents: Record<string, ResidentState>;
  activities: Record<string, ScheduledActivity>;
  eventLog: VillageEvent[];
  /** Config-driven quest offers available to be accepted/scheduled by the player */
  questOffers: Record<string, QuestOffer>;
}

export interface ScheduleActivityInput {
  activityId: string;
  characterIds: string[];
  slotId: string;
  // Optional explicit start time; defaults to state.currentTime
  startTime?: VillageTimeUnit;
  /**
   * Whether the activity should auto-reschedule after completion.
   * Overrides metadata-derived defaults when provided.
   */
  isAuto?: boolean;
  /**
   * Snapshot of death risk captured at scheduling time for Trial of Fire tracking.
   */
  snapshotDeathRisk?: number;
}

export interface ScheduleActivityResult {
  state: VillageState;
  scheduledActivity?: ScheduledActivity;
  error?: string;
}

export interface AdvanceTimeResult {
  state: VillageState;
  /** IDs of activities that completed during this advance */
  completedActivityIds: string[];
}

export interface TimeEngineDeps {
  /** Config should be an already-loaded IdleVillageConfig */
  config: IdleVillageConfig;
  /** Deterministic RNG dependency injection */
  rng: () => number;
}

export function createInitialVillageState(initialResources: VillageResources = {}): VillageState {
  return {
    currentTime: 0,
    resources: { ...initialResources },
    residents: {},
    activities: {},
    eventLog: [],
    questOffers: {},
  };
}

/**
 * Helper to look up an activity definition from config.
 */
function getActivity(config: IdleVillageConfig, activityId: string): ActivityDefinition | undefined {
  return config.activities[activityId];
}

export function evaluateActivityDuration(activityDef: ActivityDefinition): VillageTimeUnit {
  // For the vertical slice, support simple numeric duration formulas (e.g. "3").
  // More complex expressions will be delegated to the shared FormulaEngine later.
  const formula = activityDef.durationFormula;
  if (!formula) {
    return 1;
  }

  const trimmed = formula.trim();
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric as VillageTimeUnit;
  }

  // Fallback to a minimal non-zero duration so activities visibly progress.
  return 1;
}

export const evaluateResourceAmount = (delta: { resourceId: string; amountFormula?: string }): number => {
  const formula = delta.amountFormula;
  if (!formula) {
    return 0;
  }

  const trimmed = formula.trim();
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return 0;
};

/**
 * Basic check to see if characters can be assigned to a new activity.
 * Does not perform any cost/resource validation yet (that belongs to higher-level resolvers).
 */
export function canScheduleActivity(state: VillageState, input: ScheduleActivityInput): boolean {
  const { characterIds } = input;
  if (characterIds.length === 0) return false;

  return characterIds.every((id) => {
    const r = state.residents[id];
    return r && r.status === 'available';
  });
}

export function scheduleActivity(
  deps: TimeEngineDeps,
  state: VillageState,
  input: ScheduleActivityInput,
): ScheduleActivityResult {
  const { config } = deps;
  const activityDef = getActivity(config, input.activityId);
  if (!activityDef) {
    if (IS_DEV_ENV) {
      console.warn('[TimeEngine] scheduleActivity missing activity', input.activityId);
    }
    return { state, error: `Activity "${input.activityId}" not found in config` };
  }

  if (!canScheduleActivity(state, input)) {
    if (IS_DEV_ENV) {
      console.warn('[TimeEngine] scheduleActivity failed availability check', input);
    }
    return { state, error: 'One or more characters are not available' };
  }

  const startTime =
    typeof input.startTime === 'number' && input.startTime >= state.currentTime
      ? input.startTime
      : state.currentTime;

  const baseDuration = evaluateActivityDuration(activityDef);
  const endTime = startTime + baseDuration;

  const id = `act_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  const scheduled: ScheduledActivity = {
    id,
    activityId: input.activityId,
    characterIds: [...input.characterIds],
    slotId: input.slotId,
    startTime,
    endTime,
    status: 'pending',
    isAuto: Boolean(input.isAuto),
    isCompleted: false,
    snapshotDeathRisk: typeof input.snapshotDeathRisk === 'number' ? input.snapshotDeathRisk : 0,
    fatigueApplied: Object.fromEntries(input.characterIds.map((cid) => [cid, 0])),
  };

  const nextResidents: Record<string, ResidentState> = { ...state.residents };
  for (const cid of input.characterIds) {
    const existing = nextResidents[cid];
    if (existing) {
      nextResidents[cid] = { ...existing, status: 'away' };
    }
  }

  const nextActivities: Record<string, ScheduledActivity> = {
    ...state.activities,
    [scheduled.id]: scheduled,
  };

  const event: VillageEvent = {
    time: startTime,
    type: 'activity_scheduled',
    payload: {
      activityId: scheduled.activityId,
      scheduledId: scheduled.id,
      characterIds: scheduled.characterIds,
      slotId: scheduled.slotId,
    },
  };

  const nextState: VillageState = {
    ...state,
    residents: nextResidents,
    activities: nextActivities,
    eventLog: [...state.eventLog, event],
  };

  if (IS_DEV_ENV) {
    console.debug('[TimeEngine] scheduleActivity success', {
      scheduledId: scheduled.id,
      slotId: scheduled.slotId,
      characterIds: scheduled.characterIds,
    });
  }

  return { state: nextState, scheduledActivity: scheduled };
}

export function advanceTime(
  deps: TimeEngineDeps,
  state: VillageState,
  delta: VillageTimeUnit,
): AdvanceTimeResult {
  const advanceBy = Math.max(0, delta);
  if (advanceBy === 0) {
    return { state, completedActivityIds: [] };
  }

  const targetTime = state.currentTime + advanceBy;
  const windowStart = state.currentTime;
  const windowEnd = targetTime;

  const updatedActivities: Record<string, ScheduledActivity> = { ...state.activities };
  const updatedResidents: Record<string, ResidentState> = { ...state.residents };
  const updatedResources: VillageResources = { ...state.resources };
  const newEvents: VillageEvent[] = [];
  const completedActivityIds: string[] = [];
  let foodDepletedOnThisAdvance = false;

  // Get tick-based day/night configuration
  const globalRules = deps.config.globalRules;
  const dayNightCycle = globalRules.dayNightCycle ?? { dayTimeUnits: globalRules.dayLengthInTimeUnits, nightTimeUnits: globalRules.dayLengthInTimeUnits };
  const ticksPerDay = globalRules.ticksPerDay ?? globalRules.dayLengthInTimeUnits;
  const ticksPerNight = globalRules.ticksPerNight ?? dayNightCycle.nightTimeUnits;
  const totalCycleTime = dayNightCycle.dayTimeUnits + dayNightCycle.nightTimeUnits;
  const fatigueRecoveryPerNightTick = globalRules.fatigueRecoveryPerNightTick ?? (globalRules.fatigueRecoveryPerDay / ticksPerNight);

  // Helper to determine if a time is during day or night
  const isDaytime = (time: VillageTimeUnit): boolean => {
    const cyclePosition = time % totalCycleTime;
    return cyclePosition < dayNightCycle.dayTimeUnits;
  };

  // Process time in tick increments for better granularity
  let currentTickTime = windowStart;
  while (currentTickTime < windowEnd) {
    const nextTickTime = currentTickTime + 1; // Advance by 1 tick
    const tickEnd = Math.min(nextTickTime, windowEnd);

    // Handle night-time fatigue recovery per tick
    if (!isDaytime(currentTickTime)) {
      Object.values(updatedResidents).forEach((resident) => {
        if (resident.status !== 'dead' && resident.status !== 'injured') {
          const recoveredFatigue = Math.max(0, resident.fatigue - fatigueRecoveryPerNightTick);
          if (recoveredFatigue !== resident.fatigue) {
            updatedResidents[resident.id] = {
              ...resident,
              fatigue: recoveredFatigue,
            };
            newEvents.push({
              time: tickEnd,
              type: 'fatigue_changed',
              payload: {
                residentId: resident.id,
                old: resident.fatigue,
                new: recoveredFatigue,
                reason: 'night_recovery',
              },
            });
          }
        }
      });
    }

    // Process injury recovery
    Object.values(updatedResidents).forEach(r => {
      if (r.status === 'injured' && typeof r.injuryRecoveryTime === 'number' && r.injuryRecoveryTime <= targetTime) {
        updatedResidents[r.id] = { ...r, status: 'available', injuryRecoveryTime: undefined };
      }
    });

    // Tick-based food consumption: consume food gradually during daytime ticks
  const { foodConsumptionPerResidentPerDay } = deps.config.globalRules;
  if (foodConsumptionPerResidentPerDay > 0) {
    // Count daytime ticks in the advance window
    for (let t = Math.floor(windowStart); t < Math.floor(windowEnd); t++) {
      if (isDaytime(t)) {
        const livingResidents = Object.values(updatedResidents).filter((r) => r.status !== 'dead').length;
        if (livingResidents > 0) {
          const consumptionPerTick = foodConsumptionPerResidentPerDay / ticksPerDay;
          const totalConsumption = consumptionPerTick * livingResidents;
          const currentFood = updatedResources.food ?? 0;
          const nextFood = currentFood - totalConsumption;
          const clampedNextFood = nextFood < 0 ? 0 : nextFood;
          const normalizedNextFood = normalizeResourceValue(clampedNextFood);
          updatedResources.food = normalizedNextFood;
          if (!foodDepletedOnThisAdvance && normalizedNextFood < 1) {
            foodDepletedOnThisAdvance = true;
          }

          if (totalConsumption > 0) {
            newEvents.push({
              time: t + 1,
              type: 'food_consumed_daily',
              payload: {
                livingResidents,
                amount: totalConsumption,
                previousFood: currentFood,
                newFood: normalizedNextFood,
              },
            });
          }
        }
      }
    }
  }

  if (foodDepletedOnThisAdvance) {
    console.warn('[TimeEngine] GAME OVER – villagers have starved (food < 1).');
  }

    // Process activities with tick-based logic
    Object.values(updatedActivities).forEach((activity) => {
      if (activity.status === 'pending' && activity.startTime <= tickEnd) {
        activity.status = 'running';
        newEvents.push({
          time: activity.startTime,
          type: 'activity_started',
          payload: { scheduledId: activity.id, activityId: activity.activityId },
        });
      }

      if (activity.status === 'running') {
        // For continuous jobs, apply per-tick logic
        const activityDef = deps.config.activities[activity.activityId];
        if (activityDef?.continuousJob) {
          // Apply per-tick cost and partial rewards for continuous jobs
          applyContinuousJobTick(deps, activity, updatedResources, tickEnd, newEvents);
        } else {
          // Apply progressive fatigue for regular jobs
          applyActivityFatigueProgress(activity, currentTickTime, tickEnd, deps.config);
        }
      }

      if (activity.status === 'running' && activity.endTime <= tickEnd) {
        activity.status = 'completed';
        activity.isCompleted = true;
        completedActivityIds.push(activity.id);
        newEvents.push({
          time: activity.endTime,
          type: 'activity_completed',
          payload: { scheduledId: activity.id, activityId: activity.activityId },
        });

        // Activity complete: characters return and update status based on final fatigue
        for (const cid of activity.characterIds) {
          const resident = updatedResidents[cid];
          if (!resident) continue;
          const fatigueCap = deps.config.globalRules.maxFatigueBeforeExhausted ?? 100;
          const nextStatus = resident.fatigue >= fatigueCap ? 'exhausted' : 'available';
          updatedResidents[cid] = {
            ...resident,
            status: nextStatus,
          };
        }
      }
    });

    currentTickTime = nextTickTime;
  }

  // Helper to stream fatigue ticks while activities run.
  // NOTE: declared as a hoisted function (not a const arrow) so it can be
  // safely invoked from the tick loop above without a temporal-dead-zone error.
  function applyActivityFatigueProgress(
    activity: ScheduledActivity,
    advanceStart: VillageTimeUnit,
    advanceEnd: VillageTimeUnit,
    config: IdleVillageConfig,
  ) {
    const activityDuration = Math.max(1, activity.endTime - activity.startTime);
    if (activityDuration <= 0) {
      return;
    }
    const progressStart = Math.max(activity.startTime, advanceStart);
    const progressEnd = Math.min(activity.endTime, advanceEnd);
    if (progressEnd <= progressStart) {
      return;
    }
    const totalGain = getActivityFatigueGain(config, activity.activityId, activityDuration);
    if (totalGain <= 0) {
      return;
    }
    const windowFraction = (progressEnd - progressStart) / activityDuration;
    if (windowFraction <= 0) {
      return;
    }
    const fatigueCap = config.globalRules.maxFatigueBeforeExhausted ?? 100;
    const increment = totalGain * windowFraction;

    activity.fatigueApplied ??= {};

    for (const cid of activity.characterIds) {
      const resident = updatedResidents[cid];
      if (!resident) continue;
      const appliedSoFar = activity.fatigueApplied[cid] ?? 0;
      const nextApplied = Math.min(totalGain, appliedSoFar + increment);
      const deltaGain = Math.max(0, nextApplied - appliedSoFar);
      if (deltaGain <= 0) continue;
      const nextFatigue = Math.min(fatigueCap, resident.fatigue + deltaGain);
      updatedResidents[cid] = {
        ...resident,
        fatigue: nextFatigue,
      };
      newEvents.push({
        time: progressEnd,
        type: 'fatigue_changed',
        payload: {
          residentId: cid,
          old: resident.fatigue,
          new: nextFatigue,
          reason: 'activity_progress',
        },
      });
    }
  }

  // Helper for continuous job per-tick logic.
  // NOTE: declared as a hoisted function (not a const arrow) so it can be
  // safely invoked from the tick loop above without a temporal-dead-zone error.
  function applyContinuousJobTick(
    deps: TimeEngineDeps,
    activity: ScheduledActivity,
    resources: VillageResources,
    tickTime: VillageTimeUnit,
    events: VillageEvent[],
  ) {
    const activityDef = deps.config.activities[activity.activityId];
    if (!activityDef?.continuousJob) return;

    // Apply per-tick costs
    if (activityDef.perTickCostProfile) {
      for (const cost of activityDef.perTickCostProfile) {
        const amount = evaluateResourceAmount(cost);
        const currentAmount = resources[cost.resourceId] ?? 0;
        resources[cost.resourceId] = Math.max(0, currentAmount - amount);
        if (amount > 0) {
          events.push({
            time: tickTime,
            type: 'fatigue_changed',
            payload: {
              resourceId: cost.resourceId,
              amount: -amount,
              reason: 'continuous_job_cost',
            },
          });
        }
      }
    }

    // Apply partial rewards (scaled by tick fraction)
    const totalDuration = activity.endTime - activity.startTime;
    const elapsed = tickTime - activity.startTime;
    const progressFraction = Math.min(1, elapsed / totalDuration);

    if (activityDef.dailyRewardProfile && progressFraction > 0) {
      for (const reward of activityDef.dailyRewardProfile) {
        const totalAmount = evaluateResourceAmount(reward);
        const tickAmount = totalAmount * progressFraction;
        const currentAmount = resources[reward.resourceId] ?? 0;
        resources[reward.resourceId] = currentAmount + tickAmount;
        if (tickAmount > 0) {
          events.push({
            time: tickTime,
            type: 'fatigue_changed',
            payload: {
              resourceId: reward.resourceId,
              amount: tickAmount,
              reason: 'continuous_job_reward',
            },
          });
        }
      }
    }

    // Check production halt threshold
    const productionHaltThreshold = deps.config.globalRules.productionHaltFatigueThreshold ?? 1;
    const averageFatigue = activity.characterIds.reduce((sum, cid) => {
      const resident = updatedResidents[cid];
      return sum + (resident?.fatigue ?? 0);
    }, 0) / activity.characterIds.length;

    const fatigueRatio = (deps.config.globalRules.maxFatigueBeforeExhausted ?? 100) > 0
      ? averageFatigue / (deps.config.globalRules.maxFatigueBeforeExhausted ?? 100)
      : 0;

    if (fatigueRatio >= productionHaltThreshold) {
      // Halt production for this tick
      return;
    }
  }

  const baseNextState: VillageState = {
    ...state,
    currentTime: targetTime,
    activities: updatedActivities,
    residents: updatedResidents,
    resources: updatedResources,
    eventLog: [...state.eventLog, ...newEvents],
    questOffers: state.questOffers ?? {},
  };

  const finalState = spawnQuestOffersIfNeeded(deps, baseNextState, state.currentTime, targetTime);

  return { state: finalState, completedActivityIds };
}

/**
 * Placeholder for future time-skip support. The vertical slice does not
 * execute accelerated time jumps yet, so this mock intentionally returns the
 * incoming state unchanged. Keep this function so UI layers can call it
 * without needing conditional guards until the real implementation lands.
 */
export function performTimeSkipMock(state: VillageState, _delta: VillageTimeUnit): VillageState {
  return state;
}

function applyTrialOfFireStatBonus(
  statSnapshot: Partial<StatBlock> | undefined,
  risk: number,
  trialRules?: TrialOfFireRules,
): { snapshot: Partial<StatBlock> | undefined; bonusApplied: boolean } {
  if (!statSnapshot) {
    return { snapshot: statSnapshot, bonusApplied: false };
  }

  const highRiskThreshold = clamp01(trialRules?.highRiskThreshold ?? DEFAULT_TRIAL_OF_FIRE_THRESHOLD);
  const statBonusMultiplier = trialRules?.statBonusMultiplier ?? 0;
  if (statBonusMultiplier <= 0 || risk < highRiskThreshold) {
    return { snapshot: statSnapshot, bonusApplied: false };
  }

  const multiplier = 1 + clamp01(risk) * statBonusMultiplier;
  const workingSnapshot: Record<string, unknown> = {};
  Object.keys(statSnapshot).forEach((key) => {
    const value = (statSnapshot as Record<string, unknown>)[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      workingSnapshot[key] = Number((value * multiplier).toFixed(3));
    } else {
      workingSnapshot[key] = value;
    }
  });
  return { snapshot: workingSnapshot as Partial<StatBlock>, bonusApplied: true };
}

export function resolveActivityOutcome(
  deps: TimeEngineDeps,
  state: VillageState,
  scheduledId: string,
): { state: VillageState; outcome: ResolveActivityOutcomeResult } {
  const scheduled = state.activities[scheduledId];
  if (!scheduled || scheduled.status !== 'completed') {
    return {
      state,
      outcome: {
        scheduledId,
        survivors: [],
        fallen: [],
        heroizedIds: [],
        autoRescheduledId: null,
      },
    };
  }

  const risk = clamp01(scheduled.snapshotDeathRisk ?? 0);
  const trialRules = deps.config.globalRules.trialOfFire;
  const heroRiskThreshold = clamp01(trialRules?.highRiskThreshold ?? DEFAULT_TRIAL_OF_FIRE_THRESHOLD);
  const heroSurvivalThreshold =
    typeof trialRules?.heroSurvivalThreshold === 'number' ? trialRules.heroSurvivalThreshold : null;
  const updatedResidents: Record<string, ResidentState> = { ...state.residents };
  const survivors: TrialOfFireSurvivor[] = [];
  const fallen: TrialOfFireFallen[] = [];
  const heroizedIds: string[] = [];
  const hpRecoveryPercent = clamp01(trialRules?.hpRecoveryPercent ?? 0);

  for (const characterId of scheduled.characterIds) {
    const resident = updatedResidents[characterId];
    if (!resident) {
      continue;
    }

    const roll = deps.rng();
    if (roll < risk) {
      fallen.push({ characterId, risk, roll });
      delete updatedResidents[characterId];
      continue;
    }

    const { snapshot: nextSnapshot, bonusApplied } = applyTrialOfFireStatBonus(
      resident.statSnapshot,
      risk,
      trialRules,
    );
    const survivalCount = (resident.survivalCount ?? 0) + 1;
    const qualifiesByRisk = risk >= heroRiskThreshold;
    const qualifiesByCount = heroSurvivalThreshold !== null && survivalCount >= heroSurvivalThreshold;
    const heroized = !resident.isHero && (qualifiesByRisk || qualifiesByCount);
    const hpRatio = resident.maxHp > 0 ? resident.currentHp / resident.maxHp : 0;

    const recoveredHp =
      hpRecoveryPercent > 0 ? Math.min(resident.maxHp, resident.currentHp + resident.maxHp * hpRecoveryPercent) : resident.currentHp;

    updatedResidents[characterId] = {
      ...resident,
      isHero: resident.isHero || heroized,
      survivalCount,
      survivalScore: (resident.survivalScore ?? 0) + Math.round(risk * 100),
      statSnapshot: nextSnapshot,
      currentHp: recoveredHp,
    };

    if (heroized) {
      heroizedIds.push(characterId);
    }

    survivors.push({
      characterId,
      heroized,
      bonusApplied,
      hpRatio,
    });
  }

  const remainingActivities = { ...state.activities };
  delete remainingActivities[scheduledId];

  let nextState: VillageState = state;
  let autoRescheduledId: string | null = null;

  if (
    scheduled.isAuto &&
    survivors.length > 0 &&
    survivors.every((survivor) => survivor.hpRatio > DEFAULT_TRIAL_OF_FIRE_THRESHOLD)
  ) {
    const rescheduleInput: ScheduleActivityInput = {
      activityId: scheduled.activityId,
      characterIds: survivors.map((survivor) => survivor.characterId),
      slotId: scheduled.slotId,
      isAuto: true,
      snapshotDeathRisk: scheduled.snapshotDeathRisk,
    };

    const rescheduleResult = scheduleActivity(deps, state, rescheduleInput);
    nextState = rescheduleResult.state;
    autoRescheduledId = rescheduleResult.scheduledActivity?.id ?? null;
  }

  return {
    state: nextState,
    outcome: {
      scheduledId,
      survivors,
      fallen,
      heroizedIds,
      autoRescheduledId,
    },
  };
}

export function resolveActivities(
  deps: TimeEngineDeps,
  state: VillageState,
  scheduledIds: string[],
): { state: VillageState; outcomes: ResolveActivityOutcomeResult[] } {
  let nextState = state;
  const outcomes: ResolveActivityOutcomeResult[] = [];
  for (const scheduledId of scheduledIds) {
    const resolution = resolveActivityOutcome(deps, nextState, scheduledId);
    nextState = resolution.state;
    outcomes.push(resolution.outcome);
  }
  return { state: nextState, outcomes };
}

export function spawnQuestOffersIfNeeded(
  deps: TimeEngineDeps,
  state: VillageState,
  previousTime: VillageTimeUnit,
  targetTime: VillageTimeUnit,
): VillageState {
  const { config, rng } = deps;
  const {
    globalRules: {
      dayLengthInTimeUnits,
      questSpawnEveryNDays,
      maxGlobalQuestOffers,
      maxQuestOffersPerSlot,
    },
  } = config;

  if (!dayLengthInTimeUnits || dayLengthInTimeUnits <= 0) return state;
  if (!questSpawnEveryNDays || questSpawnEveryNDays <= 0) return state;
  if (maxGlobalQuestOffers <= 0) return state;
  if (maxQuestOffersPerSlot <= 0) return state;

  const previousDayIndex = Math.floor(previousTime / dayLengthInTimeUnits);
  const newDayIndex = Math.floor(targetTime / dayLengthInTimeUnits);
  if (newDayIndex <= previousDayIndex) {
    // No new in-game day has started; do not spawn new offers.
    return state;
  }

  const dayNumber = newDayIndex + 1; // 1-based day counter for config readability
  if (dayNumber % questSpawnEveryNDays !== 0) {
    return state;
  }

  const existingOffers = state.questOffers ?? {};
  const existingCount = Object.keys(existingOffers).length;
  if (existingCount >= maxGlobalQuestOffers) {
    return state;
  }

  const activities = Object.values(config.activities ?? {});
  if (activities.length === 0) {
    return state;
  }

  const allSlots = Object.values(config.mapSlots ?? {});
  if (allSlots.length === 0) {
    return state;
  }

  const offersBySlot = new Map<string, number>();
  Object.values(existingOffers).forEach((offer) => {
    const current = offersBySlot.get(offer.slotId) ?? 0;
    offersBySlot.set(offer.slotId, current + 1);
  });

  type QuestSpawnMeta = {
    questSpawnEnabled?: unknown;
    questSpawnWeight?: unknown;
    questMinDay?: unknown;
    questMaxDay?: unknown;
    questMaxConcurrent?: unknown;
    questAllowedSlotTags?: unknown;
  };

  const questCandidates: { activity: ActivityDefinition; weight: number; allowedSlotTags: string[] }[] = [];

  for (const activity of activities) {
    if (!activity.tags?.includes('quest')) continue;

    const meta = (activity.metadata ?? {}) as QuestSpawnMeta;
    const enabled = meta.questSpawnEnabled === true;
    if (!enabled) continue;

    const minDay = typeof meta.questMinDay === 'number' && meta.questMinDay > 0
      ? meta.questMinDay
      : undefined;
    if (typeof minDay === 'number' && dayNumber < minDay) continue;

    const maxDay = typeof meta.questMaxDay === 'number' && meta.questMaxDay > 0
      ? meta.questMaxDay
      : undefined;
    if (typeof maxDay === 'number' && dayNumber > maxDay) continue;

    const perQuestMaxConcurrent =
      typeof meta.questMaxConcurrent === 'number' && meta.questMaxConcurrent >= 0
        ? meta.questMaxConcurrent
        : undefined;
    if (typeof perQuestMaxConcurrent === 'number') {
      const concurrentCount = Object.values(existingOffers).filter(
        (offer) => offer.activityId === activity.id,
      ).length;
      if (concurrentCount >= perQuestMaxConcurrent) continue;
    }

    let allowedSlotTags: string[] = [];
    if (Array.isArray(meta.questAllowedSlotTags)) {
      allowedSlotTags = meta.questAllowedSlotTags.filter(
        (t): t is string => typeof t === 'string' && t.trim().length > 0,
      );
    }
    if (allowedSlotTags.length === 0) {
      allowedSlotTags = activity.slotTags ?? [];
    }
    if (allowedSlotTags.length === 0) continue;

    const weight =
      typeof meta.questSpawnWeight === 'number' && meta.questSpawnWeight > 0
        ? meta.questSpawnWeight
        : 1;

    questCandidates.push({ activity, weight, allowedSlotTags });
  }

  if (questCandidates.length === 0) {
    return state;
  }

  const totalWeight = questCandidates.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) {
    return state;
  }

  let roll = rng() * totalWeight;
  let chosen: { activity: ActivityDefinition; weight: number; allowedSlotTags: string[] } | null = null;
  for (const candidate of questCandidates) {
    if (roll < candidate.weight) {
      chosen = candidate;
      break;
    }
    roll -= candidate.weight;
  }
  if (!chosen) {
    chosen = questCandidates[questCandidates.length - 1];
  }

  const eligibleSlots = allSlots.filter((slot) => {
    if (!slot.isInitiallyUnlocked) return false;
    if (!Array.isArray(slot.slotTags) || slot.slotTags.length === 0) return false;
    const matchesTag = slot.slotTags.some((tag) => chosen!.allowedSlotTags.includes(tag));
    if (!matchesTag) return false;
    const countForSlot = offersBySlot.get(slot.id) ?? 0;
    if (countForSlot >= maxQuestOffersPerSlot) return false;
    return true;
  });

  if (eligibleSlots.length === 0) {
    return state;
  }

  const slotIndex = Math.floor(rng() * eligibleSlots.length);
  const selectedSlot = eligibleSlots[slotIndex];

  const newId = `quest_offer_${targetTime}_${Math.floor(rng() * 1_000_000)}`;
  const nextOffers: Record<string, QuestOffer> = {
    ...existingOffers,
    [newId]: {
      id: newId,
      activityId: chosen.activity.id,
      slotId: selectedSlot.id,
      createdAtTime: targetTime,
    },
  };

  return {
    ...state,
    questOffers: nextOffers,
  };
}
