import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IdleVillageConfig, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import {
  advanceTime,
  resolveActivities,
  scheduleActivity,
  type ScheduledActivity,
  type ScheduleActivityInput,
  type VillageResources,
  type VillageState,
  type ResolveActivityOutcomeResult,
} from '@/engine/game/idleVillage/TimeEngine';
import { applyFatigueInjuryForActivity } from '@/engine/game/idleVillage/InjuryEngine';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageEngineDeps } from '@/engine/game/idleVillage/IdleVillageEngine';
import { resolveJob } from '@/engine/game/idleVillage/JobResolver';
import { resolveQuest } from '@/engine/game/idleVillage/QuestResolver';

/**
 * Snapshot describing an activity currently tracked by the scheduler.
 */
export interface ScheduledActivityState {
  /** Identifier emitted by the time engine for the scheduled instance. */
  scheduledId: string;
  /** Domain-level activity id (job, quest, etc.). */
  activityId: string;
  /** Resident assigned to the slot. */
  residentId: string;
  /** Start time in seconds. */
  startTime: number;
  /** Total duration in seconds. */
  duration: number;
  /** Elapsed seconds relative to {@link startTime}. */
  elapsed: number;
  /** Normalized progress between 0 and 1. */
  progress: number;
  /** Low-level status emitted by the time engine. */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Result emitted whenever an activity completes.
 */
export interface ActivityResolutionResult {
  activityId: string;
  residentId: string;
  success: boolean;
  rewards: ResourceDeltaDefinition[];
  outcome: ResolveActivityOutcomeResult;
  resourceChanges: VillageResources;
}

/**
 * Diagnostics captured during resident assignment.
 */
export interface AssignmentDiagnostics {
  residentId: string;
  activityId: string;
  canAssign: boolean;
  reason: string;
  metadata?: Record<string, unknown>;
}

/**
 * Telemetry payload recorded for test hooks / diagnostics.
 */
export type SchedulerTelemetryEvent =
  | {
      type: 'activity_complete';
      timestamp: number;
      result: ActivityResolutionResult;
    }
  | {
      type: 'resource_change';
      timestamp: number;
      snapshot: VillageResources;
      changes: ResourceDeltaDefinition[];
    };

const DEFAULT_SECONDS_PER_TIME_UNIT = 60;
const DEFAULT_RNG_SEED = 1337;

const createDeterministicRng = (initialSeed = DEFAULT_RNG_SEED) => {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
};

const enqueueMicrotask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : (cb: () => void) => {
        Promise.resolve().then(cb);
      };

const diffResources = (previous: VillageResources, next: VillageResources): VillageResources => {
  const delta: VillageResources = {};
  const ids = new Set([...Object.keys(previous), ...Object.keys(next)]);
  ids.forEach((resourceId) => {
    const before = previous[resourceId] ?? 0;
    const after = next[resourceId] ?? 0;
    if (after !== before) {
      delta[resourceId] = after - before;
    }
  });
  return delta;
};

const buildResourceDeltaDefinitions = (diff: VillageResources): ResourceDeltaDefinition[] =>
  Object.entries(diff).map(([resourceId, amount]) => ({
    resourceId,
    amountFormula: amount.toString(),
  }));

const computeResidentStatusDiffs = (
  previous: VillageState,
  next: VillageState,
): Array<{ residentId: string; next: Partial<ResidentState> }> => {
  const updates: Array<{ residentId: string; next: Partial<ResidentState> }> = [];
  const residentIds = new Set([...Object.keys(previous.residents), ...Object.keys(next.residents)]);
  residentIds.forEach((residentId) => {
    const prevResident = previous.residents[residentId];
    const nextResident = next.residents[residentId];
    if (!nextResident) {
      return;
    }
    if (!prevResident) {
      updates.push({ residentId, next: nextResident });
      return;
    }
    const diff: Partial<ResidentState> = {};
    if (prevResident.status !== nextResident.status) diff.status = nextResident.status;
    if (prevResident.fatigue !== nextResident.fatigue) diff.fatigue = nextResident.fatigue;
    if (prevResident.currentHp !== nextResident.currentHp) diff.currentHp = nextResident.currentHp;
    if (prevResident.isInjured !== nextResident.isInjured) diff.isInjured = nextResident.isInjured;
    if (prevResident.injuryRecoveryTime !== nextResident.injuryRecoveryTime) {
      diff.injuryRecoveryTime = nextResident.injuryRecoveryTime;
    }
    if (Object.keys(diff).length > 0) {
      updates.push({ residentId, next: diff });
    }
  });
  return updates;
};

const convertRewardsToResourceMap = (rewards: ResourceDeltaDefinition[]): VillageResources =>
  rewards.reduce<VillageResources>((acc, reward) => {
    const parsed = Number(reward.amountFormula);
    if (!Number.isFinite(parsed) || parsed === 0) {
      return acc;
    }
    acc[reward.resourceId] = (acc[reward.resourceId] ?? 0) + parsed;
    return acc;
  }, {});

const createTelemetrySnapshot = (events: SchedulerTelemetryEvent[]) => ({
  events,
});

export interface UseActivitySchedulerProps {
  config: IdleVillageConfig;
  initialVillageState: VillageState;
  isDayPhase?: boolean;
  onActivityComplete?: (result: ActivityResolutionResult) => void;
  onResourcesChange?: (resources: VillageResources, changes: ResourceDeltaDefinition[]) => void;
  onResidentStateChange?: (residentId: string, newState: Partial<VillageState['residents'][string]>) => void;
  onStateUpdate?: (state: VillageState) => void;
  updateState: (updater: (prev: VillageState) => VillageState, message?: string) => Promise<void>;
  villageState: VillageState;
}

/**
 * Main hook powering Punch Club / Idle Village scheduling.
 */
export const useActivityScheduler = ({
  config,
  initialVillageState,
  isDayPhase = true,
  onActivityComplete,
  onResourcesChange,
  onResidentStateChange,
  onStateUpdate,
  updateState,
  villageState: latestStoreState,
}: UseActivitySchedulerProps) => {
  const secondsPerTimeUnit = config.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;

  const stateRef = useRef(initialVillageState);
  const [renderedState, setRenderedState] = useState(initialVillageState);
  const isPausedRef = useRef(false);
  const telemetryRef = useRef<SchedulerTelemetryEvent[]>([]);
  const lastDiagnosticsRef = useRef<AssignmentDiagnostics | null>(null);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (latestStoreState !== stateRef.current) {
      stateRef.current = latestStoreState;
      let cancelled = false;
      enqueueMicrotask(() => {
        if (!cancelled) {
          setRenderedState(latestStoreState);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [latestStoreState]);

  const engineDepsRef = useRef<IdleVillageEngineDeps>({
    config,
    rng: createDeterministicRng(),
  });

  useEffect(() => {
    engineDepsRef.current.config = config;
  }, [config]);

  const pushTelemetry = useCallback((event: SchedulerTelemetryEvent) => {
    telemetryRef.current = [...telemetryRef.current, event];
  }, []);

  const publishState = useCallback(
    (nextState: VillageState, message = 'Activity scheduler update') => {
      stateRef.current = nextState;
      setRenderedState(nextState);
      void updateState(() => nextState, message);
      onStateUpdate?.(nextState);
    },
    [onStateUpdate, updateState],
  );

  const handleResourceChange = useCallback(
    (previous: VillageState, next: VillageState) => {
      const diff = diffResources(previous.resources, next.resources);
      if (Object.keys(diff).length === 0) {
        return;
      }
      const deltas = buildResourceDeltaDefinitions(diff);
      pushTelemetry({
        type: 'resource_change',
        snapshot: next.resources,
        changes: deltas,
        timestamp: next.currentTime,
      });
      onResourcesChange?.(next.resources, deltas);
    },
    [onResourcesChange, pushTelemetry],
  );

  const notifyResidentUpdates = useCallback(
    (previous: VillageState, next: VillageState) => {
      const updates = computeResidentStatusDiffs(previous, next);
      updates.forEach(({ residentId, next: partial }) => {
        onResidentStateChange?.(residentId, partial);
      });
    },
    [onResidentStateChange],
  );

  const emitActivityTelemetry = useCallback(
    (
      timestamp: number,
      scheduledSnapshots: Map<string, ScheduledActivity>,
      outcomes: ResolveActivityOutcomeResult[],
      rewardsMap: Map<string, ResourceDeltaDefinition[]>,
    ) => {
      outcomes.forEach((outcome) => {
        const scheduled = scheduledSnapshots.get(outcome.scheduledId);
        if (!scheduled) return;
        const residentId = scheduled.characterIds[0];
        if (!residentId) return;
        const rewards = rewardsMap.get(outcome.scheduledId) ?? [];
        const resourceChanges = convertRewardsToResourceMap(rewards);
        const result: ActivityResolutionResult = {
          activityId: scheduled.activityId,
          residentId,
          success: outcome.fallen.length === 0,
          rewards,
          outcome,
          resourceChanges,
        };
        onActivityComplete?.(result);
        pushTelemetry({
          type: 'activity_complete',
          timestamp,
          result,
        });
      });
    },
    [onActivityComplete, pushTelemetry],
  );

  const resolveCompletedActivities = useCallback(
    (state: VillageState, completedIds: string[]) => {
      if (completedIds.length === 0) {
        return {
          state,
          scheduledSnapshots: new Map<string, ScheduledActivity>(),
          rewards: new Map<string, ResourceDeltaDefinition[]>(),
          outcomes: [] as ResolveActivityOutcomeResult[],
        };
      }

      let workingState = state;
      const scheduledSnapshots = new Map<string, ScheduledActivity>();
      const rewardsById = new Map<string, ResourceDeltaDefinition[]>();

      completedIds.forEach((scheduledId) => {
        const scheduled = workingState.activities[scheduledId];
        if (!scheduled) {
          return;
        }
        scheduledSnapshots.set(scheduledId, scheduled);
        const activityDef = config.activities[scheduled.activityId];
        if (!activityDef) {
          rewardsById.set(scheduledId, []);
          return;
        }
        if (activityDef.tags?.includes('job')) {
          const jobResult = resolveJob(engineDepsRef.current, workingState, scheduled);
          workingState = { ...workingState, resources: jobResult.updatedResources };
          const rewards =
            (jobResult.events[0]?.payload as { rewards?: ResourceDeltaDefinition[] } | undefined)?.rewards ??
            activityDef.rewards ??
            [];
          rewardsById.set(scheduledId, rewards);
        } else if (activityDef.tags?.includes('quest')) {
          const questResult = resolveQuest(engineDepsRef.current, workingState, scheduled);
          workingState = { ...workingState, resources: questResult.updatedResources };
          const rewards =
            (questResult.events[0]?.payload as { rewards?: ResourceDeltaDefinition[] } | undefined)?.rewards ??
            activityDef.rewards ??
            [];
          rewardsById.set(scheduledId, rewards);
        } else {
          rewardsById.set(scheduledId, activityDef.rewards ?? []);
        }

        const injuryResult = applyFatigueInjuryForActivity(engineDepsRef.current, workingState, scheduled, workingState.currentTime);
        workingState = injuryResult.state;
      });

      const resolution = resolveActivities(engineDepsRef.current, workingState, completedIds);
      return {
        state: resolution.state,
        scheduledSnapshots,
        rewards: rewardsById,
        outcomes: resolution.outcomes,
      };
    },
    [config.activities],
  );

  const advanceTimeUnits = useCallback(
    (deltaUnits: number) => {
      if (!Number.isFinite(deltaUnits) || deltaUnits <= 0) {
        return;
      }
      const previousState = stateRef.current;
      const advanceResult = advanceTime(engineDepsRef.current, previousState, deltaUnits);
      const { state: resolvedState, scheduledSnapshots, rewards, outcomes } = resolveCompletedActivities(
        advanceResult.state,
        advanceResult.completedActivityIds ?? [],
      );

      handleResourceChange(previousState, resolvedState);
      notifyResidentUpdates(previousState, resolvedState);
      emitActivityTelemetry(resolvedState.currentTime, scheduledSnapshots, outcomes, rewards);
      publishState(resolvedState, 'Activity scheduler tick');
    },
    [emitActivityTelemetry, handleResourceChange, notifyResidentUpdates, publishState, resolveCompletedActivities],
  );

  const advanceTimeUnitsDebug = useCallback(
    (deltaUnits: number) => {
      advanceTimeUnits(deltaUnits);
    },
    [advanceTimeUnits],
  );

  const advanceTimeSeconds = useCallback(
    (deltaSeconds: number) => {
      if (isPausedRef.current || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
        return;
      }
      const deltaUnits = deltaSeconds / secondsPerTimeUnit;
      advanceTimeUnits(deltaUnits);
    },
    [advanceTimeUnits, secondsPerTimeUnit],
  );

  const canAssignResident = useCallback(
    (residentId: string, activityId: string): boolean => {
      const diagnostics: AssignmentDiagnostics = {
        residentId,
        activityId,
        canAssign: false,
        reason: '',
      };

      if (!isDayPhase) {
        diagnostics.reason = 'NIGHT_PHASE';
        lastDiagnosticsRef.current = diagnostics;
        return false;
      }

      const resident = stateRef.current.residents[residentId];
      if (!resident) {
        diagnostics.reason = 'RESIDENT_NOT_FOUND';
        lastDiagnosticsRef.current = diagnostics;
        return false;
      }
      if (resident.status !== 'available') {
        diagnostics.reason = 'RESIDENT_UNAVAILABLE';
        lastDiagnosticsRef.current = diagnostics;
        return false;
      }

      const alreadyAssigned = Object.values(stateRef.current.activities).some((activity) => {
        if (activity.status === 'completed' || activity.status === 'cancelled') {
          return false;
        }
        return activity.characterIds.includes(residentId);
      });
      if (alreadyAssigned) {
        diagnostics.reason = 'RESIDENT_ALREADY_ASSIGNED';
        lastDiagnosticsRef.current = diagnostics;
        return false;
      }

      diagnostics.canAssign = true;
      diagnostics.reason = 'OK';
      lastDiagnosticsRef.current = diagnostics;
      return true;
    },
    [isDayPhase],
  );

  /**
   * Starts an activity for the specified resident.
   *
   * **Prerequisites**
   * - {@link isDayPhase} must be `true` (night shifts are rejected with `NIGHT_PHASE`).
   * - `residentId` must resolve to an existing resident whose status is `available`.
   * - The resident must not already appear inside any non-completed scheduled activity (prevents double booking).
   * - `activityId` must exist inside the config and is assumed to map 1‑to‑1 with the slot identifier (same string).
   *
   * Fulfilling these guarantees mirrors what the UI does: drag a resident (keeps them available), then call
   * `startSlotActivity` while the day phase is active. Any hook/test that bypasses the UI must ensure the same
   * conditions (e.g. flip the clock to day before starting, or temporarily mark the resident as available).
   *
   * @param activityId - Domain activity identifier (e.g. `job_punch_training`)
   * @param residentId - Resident to assign
   * @param _durationSeconds - Optional duration override (currently unused)
   * @returns true when `scheduleActivity` succeeds, false otherwise
   */
  const startActivity = useCallback(
    (activityId: string, residentId: string, _durationSeconds?: number) => {
      if (!canAssignResident(residentId, activityId)) {
        return false;
      }

      const scheduleInput: ScheduleActivityInput = {
        activityId,
        slotId: activityId,
        characterIds: [residentId],
        snapshotDeathRisk: 0,
      };
      const scheduleResult = scheduleActivity(engineDepsRef.current, stateRef.current, scheduleInput);
      if (scheduleResult.error) {
        lastDiagnosticsRef.current = {
          residentId,
          activityId,
          canAssign: false,
          reason: scheduleResult.error,
        };
        return false;
      }

      publishState(scheduleResult.state, 'Activity scheduled');
      return true;
    },
    [canAssignResident, publishState],
  );

  const cancelActivity = useCallback(
    (scheduledId: string) => {
      const currentState = stateRef.current;
      const scheduled = currentState.activities[scheduledId];
      if (!scheduled) {
        return;
      }
      const nextActivities = { ...currentState.activities };
      delete nextActivities[scheduledId];
      const nextResidents: Record<string, ResidentState> = { ...currentState.residents };
      scheduled.characterIds.forEach((residentId) => {
        const resident = nextResidents[residentId];
        if (resident) {
          nextResidents[residentId] = { ...resident, status: 'available' };
        }
      });
      publishState(
        {
          ...currentState,
          activities: nextActivities,
          residents: nextResidents,
        },
        'Activity cancelled',
      );
    },
    [publishState],
  );

  const getActivityState = useCallback(
    (slotId: string, residentId: string): ScheduledActivityState | null => {
      const activities = stateRef.current.activities;
      const scheduled = Object.values(activities).find(
        (activity) =>
          activity.slotId === slotId &&
          activity.characterIds.includes(residentId) &&
          activity.status !== 'completed' &&
          activity.status !== 'cancelled',
      );
      if (!scheduled) {
        return null;
      }
      const durationUnits = Math.max(1, scheduled.endTime - scheduled.startTime);
      const elapsedUnits = Math.max(0, stateRef.current.currentTime - scheduled.startTime);
      const progress = Math.min(1, elapsedUnits / durationUnits);
      return {
        scheduledId: scheduled.id,
        activityId: scheduled.activityId,
        residentId,
        startTime: scheduled.startTime * secondsPerTimeUnit,
        duration: durationUnits * secondsPerTimeUnit,
        elapsed: elapsedUnits * secondsPerTimeUnit,
        progress,
        status: scheduled.status,
      };
    },
    [secondsPerTimeUnit],
  );

  const resetScheduler = useCallback(
    (nextState: VillageState) => {
      telemetryRef.current = [];
      isPausedRef.current = false;
      setIsRunning(true);
      publishState(nextState, 'Scheduler reset');
    },
    [publishState],
  );

  const pauseTimer = useCallback(() => {
    isPausedRef.current = true;
    setIsRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    isPausedRef.current = false;
    setIsRunning(true);
  }, []);

  const drainTelemetryEvents = useCallback(() => {
    const events = telemetryRef.current;
    telemetryRef.current = [];
    return events;
  }, []);

  const getSchedulerTelemetry = useCallback(() => createTelemetrySnapshot(telemetryRef.current), []);

  const updateVillageState = useCallback(
    (updater: (prev: VillageState) => VillageState) => {
      const next = updater(stateRef.current);
      publishState(next, 'Scheduler manual update');
    },
    [publishState],
  );

  const scheduledActivities = useMemo(() => {
    const entries = Object.values(renderedState.activities ?? {}).map((activity) => [activity.id, activity] as const);
    return new Map(entries);
  }, [renderedState.activities]);

  const globalTime = renderedState.currentTime ?? 0;

  return {
    villageState: renderedState,
    updateVillageState,
    scheduledActivities,
    globalTime,
    isRunning,
    startActivity,
    cancelActivity,
    canAssignResident,
    getActivityState,
    resetScheduler,
    pauseTimer,
    resumeTimer,
    advanceTimeUnitsDebug,
    advanceTimeSeconds,
    drainTelemetryEvents,
    getSchedulerTelemetry,
    getAssignmentDiagnostics: () => lastDiagnosticsRef.current,
  };
};

export type UseActivitySchedulerReturn = ReturnType<typeof useActivityScheduler>;
