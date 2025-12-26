import { useState, useEffect, useCallback, useRef } from 'react';
import type { IdleVillageConfig, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { VillageState, ScheduledActivity, VillageResources, ResolveActivityOutcomeResult } from '@/engine/game/idleVillage/TimeEngine';
import { createVillageStateFromConfig, advanceTime, resolveActivities } from '@/engine/game/idleVillage/TimeEngine';
import { resolveJob } from '@/engine/game/idleVillage/JobResolver';
import { resolveQuest } from '@/engine/game/idleVillage/QuestResolver';

/**
 * Activity scheduler hook for managing running activities and global timer.
 * Handles countdown, progress tracking, and resolution completion.
 */
export interface ScheduledActivityState {
  activityId: string;
  residentId: string;
  startTime: number; // timestamp in ms
  duration: number; // duration in seconds
  elapsed: number; // elapsed seconds
  progress: number; // 0 to 1
  status: 'running' | 'completed' | 'failed';
}

export interface ActivityResolutionResult {
  activityId: string;
  residentId: string;
  success: boolean;
  rewards: ResourceDeltaDefinition[];
  outcome: ResolveActivityOutcomeResult;
  resourceChanges: VillageResources;
}

export interface UseActivitySchedulerProps {
  config: IdleVillageConfig;
  initialVillageState: VillageState;
  onActivityComplete?: (result: ActivityResolutionResult) => void;
  onResourcesChange?: (resources: VillageResources, changes: ResourceDeltaDefinition[]) => void;
  onResidentStateChange?: (residentId: string, newState: Partial<VillageState['residents'][string]>) => void;
  onStateUpdate?: (state: VillageState) => void;
}

/**
 * Hook for managing activity scheduling, timer, and resolution.
 * Provides a global timer that advances all activities simultaneously.
 */
export const useActivityScheduler = ({
  config,
  initialVillageState,
  onActivityComplete,
  onResourcesChange,
  onResidentStateChange,
  onStateUpdate,
}: UseActivitySchedulerProps) => {
  const [villageState, setVillageState] = useState<VillageState>(initialVillageState);
  const [scheduledActivities, setScheduledActivities] = useState<Map<string, ScheduledActivityState>>(new Map());
  const [globalTime, setGlobalTime] = useState(0); // Global game time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Simple RNG for deterministic behavior
  const rng = useCallback(() => {
    const seed = 12345; // Fixed seed for consistency
    return (Math.sin(seed) * 0.5 + 0.5);
  }, []);

  /**
   * Start a new activity for a resident.
   */
  const startActivity = useCallback((
    activityId: string,
    residentId: string,
    duration?: number
  ) => {
    const activity = config.activities[activityId];
    if (!activity) {
      console.error(`Activity ${activityId} not found`);
      return false;
    }

    const resident = villageState.residents[residentId];
    if (!resident) {
      console.error(`Resident ${residentId} not found`);
      return false;
    }

    // Check if resident is already working
    const isAlreadyWorking = Array.from(scheduledActivities.values())
      .some(scheduled => scheduled.residentId === residentId && scheduled.status === 'running');
    
    if (isAlreadyWorking) {
      console.warn(`Resident ${residentId} is already working`);
      return false;
    }

    const activityDuration = duration ?? (Number(activity.durationFormula) || 90);
    const scheduledId = `${activityId}_${residentId}_${Date.now()}`;
    
    const newScheduled: ScheduledActivityState = {
      activityId,
      residentId,
      startTime: Date.now(),
      duration: activityDuration,
      elapsed: 0,
      progress: 0,
      status: 'running',
    };

    setScheduledActivities(prev => new Map(prev).set(scheduledId, newScheduled));
    
    // Update resident status to working
    const updatedResident = {
      ...resident,
      status: 'working' as const,
    };
    
    setVillageState(prev => ({
      ...prev,
      residents: {
        ...prev.residents,
        [residentId]: updatedResident,
      },
    }));

    onResidentStateChange?.(residentId, { status: 'working' });

    // Start global timer if not running
    if (!isRunning) {
      lastTickRef.current = Date.now();
      setIsRunning(true);
    }

    return true;
  }, [config.activities, villageState.residents, scheduledActivities, isRunning, onResidentStateChange]);

  /**
   * Cancel a running activity.
   */
  const cancelActivity = useCallback((scheduledId: string) => {
    const scheduled = scheduledActivities.get(scheduledId);
    if (!scheduled || scheduled.status !== 'running') {
      return false;
    }

    // Reset resident status
    const resident = villageState.residents[scheduled.residentId];
    if (resident) {
      const updatedResident = {
        ...resident,
        status: 'available' as const,
      };
      
      setVillageState(prev => ({
        ...prev,
        residents: {
          ...prev.residents,
          [scheduled.residentId]: updatedResident,
        },
      }));

      onResidentStateChange?.(scheduled.residentId, { status: 'available' });
    }

    setScheduledActivities(prev => {
      const next = new Map(prev);
      next.delete(scheduledId);
      return next;
    });

    return true;
  }, [scheduledActivities, villageState.residents, onResidentStateChange]);

  /**
   * Main timer tick - advances all activities and resolves completed ones.
   */
  const tick = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastTickRef.current) / 1000; // Convert to seconds
    lastTickRef.current = now;

    setGlobalTime(prev => prev + deltaTime);

    setScheduledActivities(prev => {
      const next = new Map(prev);
      const completedActivities: ScheduledActivityState[] = [];

      // Update all running activities
      for (const [scheduledId, scheduled] of next) {
        if (scheduled.status !== 'running') continue;

        const newElapsed = scheduled.elapsed + deltaTime;
        const newProgress = Math.min(1, newElapsed / scheduled.duration);

        const updatedScheduled = {
          ...scheduled,
          elapsed: newElapsed,
          progress: newProgress,
          status: newProgress >= 1 ? 'completed' : 'running' as const,
        };

        next.set(scheduledId, updatedScheduled);

        if (updatedScheduled.status === 'completed') {
          completedActivities.push(updatedScheduled);
        }
      }

      // Resolve completed activities
      if (completedActivities.length > 0) {
        // Create scheduled activities for TimeEngine
        const timeEngineScheduled: ScheduledActivity[] = completedActivities.map(comp => ({
          id: comp.activityId,
          activityId: comp.activityId,
          characterIds: [comp.residentId],
          startTime: globalTime,
          duration: comp.duration,
          status: 'completed' as const,
          completionTime: globalTime + comp.elapsed,
        }));

        // Resolve activities using TimeEngine
        const resolutionResult = resolveActivities(
          { config, rng },
          villageState,
          timeEngineScheduled.map(s => s.id)
        );

        // Process each resolution
        completedActivities.forEach((completed, index) => {
          const outcome = resolutionResult.outcomes[index];
          const activity = config.activities[completed.activityId];
          
          // Calculate resource changes
          let resourceChanges: ResourceDeltaDefinition[] = [];
          let updatedResources = villageState.resources;

          if (activity.tags?.includes('job')) {
            const jobResult = resolveJob(
              { config, rng },
              resolutionResult.state,
              timeEngineScheduled[index]
            );
            resourceChanges = jobResult.events[0]?.payload.rewards ?? [];
            updatedResources = jobResult.updatedResources;
          } else if (activity.tags?.includes('quest')) {
            const questResult = resolveQuest(
              { config, rng },
              resolutionResult.state,
              timeEngineScheduled[index]
            );
            resourceChanges = questResult.events[0]?.payload.rewards ?? [];
            updatedResources = questResult.updatedResources;
          }

          // Update resident state based on outcome
          const updatedResident = resolutionResult.state.residents[completed.residentId];
          if (updatedResident) {
            onResidentStateChange?.(completed.residentId, updatedResident);
          }

          // Notify about completion
          const result: ActivityResolutionResult = {
            activityId: completed.activityId,
            residentId: completed.residentId,
            success: outcome.fallen.length === 0,
            rewards: resourceChanges,
            outcome,
            resourceChanges: updatedResources,
          };

          onActivityComplete?.(result);
        });

        // Update village state with resolution results
        setVillageState(resolutionResult.state);
        onStateUpdate?.(resolutionResult.state);
        onResourcesChange?.(resolutionResult.state.resources, []);

        // Remove completed activities
        completedActivities.forEach(comp => {
          next.delete(`${comp.activityId}_${comp.residentId}_${comp.startTime}`);
        });
      }

      return next;
    });
  }, [globalTime, villageState, config, rng, onActivityComplete, onResourcesChange, onResidentStateChange]);

  // Global timer effect
  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 100); // Update every 100ms for smooth progress
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  // Stop timer when no activities are running
  useEffect(() => {
    const hasRunningActivities = Array.from(scheduledActivities.values())
      .some(scheduled => scheduled.status === 'running');
    
    if (!hasRunningActivities && isRunning) {
      setIsRunning(false);
    }
  }, [scheduledActivities, isRunning]);

  /**
   * Get activity state for a specific slot.
   */
  const getActivityState = useCallback((activityId: string, residentId: string) => {
    for (const scheduled of scheduledActivities.values()) {
      if (scheduled.activityId === activityId && scheduled.residentId === residentId && scheduled.status === 'running') {
        return scheduled;
      }
    }
    return null;
  }, [scheduledActivities]);

  /**
   * Check if a resident can be assigned to an activity.
   */
  const canAssignResident = useCallback((residentId: string, activityId: string) => {
    console.log('canAssignResident check:', { residentId, activityId });
    
    const resident = villageState.residents[residentId];
    console.log('Resident found:', resident);
    
    if (!resident) {
      console.log('Resident not found');
      return false;
    }

    // Check if resident is available
    if (resident.status !== 'available' && resident.status !== 'exhausted') {
      console.log('Resident not available, status:', resident.status);
      return false;
    }

    // Check if resident is already working
    const isAlreadyWorking = Array.from(scheduledActivities.values())
      .some(scheduled => scheduled.residentId === residentId && scheduled.status === 'running');
    
    if (isAlreadyWorking) {
      console.log('Resident already working');
      return false;
    }

    // Check activity requirements
    const activity = config.activities[activityId];
    console.log('Activity found:', activity);
    
    if (!activity) {
      console.log('Activity not found');
      return false;
    }

    console.log('Can assign resident: YES');
    return true;
  }, [villageState.residents, scheduledActivities, config.activities]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    lastTickRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const resetScheduler = useCallback((nextState: VillageState) => {
    setVillageState(nextState);
    setScheduledActivities(new Map());
    setGlobalTime(0);
    setIsRunning(false);
    lastTickRef.current = Date.now();
  }, []);

  return {
    // State
    villageState,
    scheduledActivities,
    globalTime,
    isRunning,
    
    // Actions
    startActivity,
    cancelActivity,
    getActivityState,
    canAssignResident,
    
    // Timer control
    pauseTimer,
    resumeTimer,
    resetScheduler,
  };
};
