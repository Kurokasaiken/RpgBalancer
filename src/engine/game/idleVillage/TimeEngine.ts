// src/engine/game/idleVillage/TimeEngine.ts
// Core time & activity engine for the Idle Village meta-game.
// Pure domain module: no React, no UI, no direct storage access.
// All domain values come from IdleVillageConfig (config-first philosophy).

import type {
  ActivityDefinition,
  IdleVillageConfig,
} from '../../../balancing/config/idleVillage/types';

export type VillageTimeUnit = number;

export type VillageActivityStatus = 'pending' | 'running' | 'completed' | 'cancelled';

export interface ScheduledActivity {
  id: string;
  activityId: string;
  /** Character IDs assigned to this activity */
  characterIds: string[];
  slotId: string;
  startTime: VillageTimeUnit;
  endTime: VillageTimeUnit;
  status: VillageActivityStatus;
}

export interface VillageResources {
  [resourceId: string]: number;
}

export type ResidentStatus = 'available' | 'away' | 'exhausted' | 'injured' | 'dead';

export interface ResidentState {
  id: string; // SavedCharacter / Entity ID
  homeId?: string; // building / house reference (string-based)
  status: ResidentStatus;
  fatigue: number;
  /** If injured, time when the resident becomes available again. */
  injuryRecoveryTime?: VillageTimeUnit;
}

export interface VillageEvent {
  time: VillageTimeUnit;
  type:
    | 'activity_scheduled'
    | 'activity_started'
    | 'activity_completed'
    | 'activity_cancelled'
    | 'fatigue_changed'
    | 'injury_applied';
  payload: Record<string, unknown>;
}

export interface VillageState {
  currentTime: VillageTimeUnit;
  resources: VillageResources;
  residents: Record<string, ResidentState>;
  activities: Record<string, ScheduledActivity>;
  eventLog: VillageEvent[];
}

export interface ScheduleActivityInput {
  activityId: string;
  characterIds: string[];
  slotId: string;
  // Optional explicit start time; defaults to state.currentTime
  startTime?: VillageTimeUnit;
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
  };
}

/**
 * Helper to look up an activity definition from config.
 */
function getActivity(config: IdleVillageConfig, activityId: string): ActivityDefinition | undefined {
  return config.activities[activityId];
}

function evaluateActivityDuration(activityDef: ActivityDefinition): VillageTimeUnit {
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
    return { state, error: `Activity "${input.activityId}" not found in config` };
  }

  if (!canScheduleActivity(state, input)) {
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

  return { state: nextState, scheduledActivity: scheduled };
}

export function advanceTime(
  _deps: TimeEngineDeps,
  state: VillageState,
  delta: VillageTimeUnit,
): AdvanceTimeResult {
  const advanceBy = Math.max(0, delta);
  if (advanceBy === 0) {
    return { state, completedActivityIds: [] };
  }

  const targetTime = state.currentTime + advanceBy;

  const updatedActivities: Record<string, ScheduledActivity> = { ...state.activities };
  const updatedResidents: Record<string, ResidentState> = { ...state.residents };
  const updatedResources: VillageResources = { ...state.resources };
  const newEvents: VillageEvent[] = [];
  const completedActivityIds: string[] = [];

  // Process activities
  Object.values(updatedActivities).forEach((activity) => {
    if (activity.status === 'pending' && activity.startTime <= targetTime) {
      activity.status = 'running';
      newEvents.push({
        time: activity.startTime,
        type: 'activity_started',
        payload: { scheduledId: activity.id, activityId: activity.activityId },
      });
    }

    if (activity.status === 'running' && activity.endTime <= targetTime) {
      activity.status = 'completed';
      completedActivityIds.push(activity.id);
      newEvents.push({
        time: activity.endTime,
        type: 'activity_completed',
        payload: { scheduledId: activity.id, activityId: activity.activityId },
      });

      // Activity complete: characters return and gain fatigue
      for (const cid of activity.characterIds) {
        const r = updatedResidents[cid];
        if (r && r.status === 'away') {
          // Simple fixed fatigue gain for now - in future, read from ActivityDefinition
          const fatigueGain = 10; 
          const nextFatigue = Math.min(100, r.fatigue + fatigueGain);
          
          updatedResidents[cid] = { 
            ...r, 
            status: 'available',
            fatigue: nextFatigue
          };

          if (nextFatigue !== r.fatigue) {
            newEvents.push({
              time: activity.endTime,
              type: 'fatigue_changed',
              payload: { residentId: cid, old: r.fatigue, new: nextFatigue, reason: 'activity' }
            });
          }
        }
      }
    }
  });

  // Process passive fatigue recovery for available/exhausted residents
  const {
    fatigueRecoveryPerDay,
    dayLengthInTimeUnits,
    maxFatigueBeforeExhausted,
    foodConsumptionPerResidentPerDay,
  } = _deps.config.globalRules;
  const recoveryRatePerUnit = fatigueRecoveryPerDay / dayLengthInTimeUnits;
  const recoveryAmount = Math.floor(recoveryRatePerUnit * advanceBy);

  if (recoveryAmount > 0) {
    Object.values(updatedResidents).forEach(r => {
      if ((r.status === 'available' || r.status === 'exhausted') && r.fatigue > 0) {
        const nextFatigue = Math.max(0, r.fatigue - recoveryAmount);
        
        let nextStatus = r.status;
        // Recover from exhausted if fatigue drops significantly (e.g. below 50% of threshold)
        // For now, simple rule: if exhausted and fatigue drops to 0, become available
        if (r.status === 'exhausted' && nextFatigue === 0) {
          nextStatus = 'available';
        }

        // Become exhausted if above threshold
        if (r.status === 'available' && nextFatigue >= maxFatigueBeforeExhausted) {
          nextStatus = 'exhausted';
        }

        if (nextFatigue !== r.fatigue || nextStatus !== r.status) {
          updatedResidents[r.id] = { ...r, fatigue: nextFatigue, status: nextStatus };
          // Only log significant changes to avoid spam
          if (nextStatus !== r.status) {
             newEvents.push({
              time: targetTime,
              type: 'fatigue_changed',
              payload: { residentId: r.id, old: r.fatigue, new: nextFatigue, statusChange: nextStatus }
            });
          }
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

  // Daily food consumption: for each in-game day boundary crossed, consume
  // food per non-dead resident. This keeps the pressure similar to Punch Club's
  // early-game loop, but fully config-driven.
  if (dayLengthInTimeUnits > 0 && foodConsumptionPerResidentPerDay > 0) {
    const previousDayIndex = Math.floor(state.currentTime / dayLengthInTimeUnits);
    const newDayIndex = Math.floor(targetTime / dayLengthInTimeUnits);
    const daysElapsed = newDayIndex - previousDayIndex;

    if (daysElapsed > 0) {
      const livingResidents = Object.values(updatedResidents).filter((r) => r.status !== 'dead').length;
      if (livingResidents > 0) {
        const totalConsumption = foodConsumptionPerResidentPerDay * livingResidents * daysElapsed;
        const currentFood = updatedResources.food ?? 0;
        const nextFood = currentFood - totalConsumption;
        updatedResources.food = nextFood < 0 ? 0 : nextFood;
      }
    }
  }

  const nextState: VillageState = {
    ...state,
    currentTime: targetTime,
    activities: updatedActivities,
    residents: updatedResidents,
    resources: updatedResources,
    eventLog: [...state.eventLog, ...newEvents],
  };

  return { state: nextState, completedActivityIds };
}
