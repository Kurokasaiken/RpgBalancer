import { useEffect, useRef, useCallback } from 'react';
import { IdleVillageActivityStore } from '@/persistence/IdleVillageActivityStore';
import type { IdleVillageActivityEvent, ActivityStateSnapshot } from '@/persistence/IdleVillageActivityStore';
import type { ActiveHUDState } from './useActiveHUDState';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Props for useActivityTelemetry hook.
 */
export interface UseActivityTelemetryProps {
  /** Active HUD state to monitor */
  hudState: ActiveHUDState;
  /** Full village state for snapshot generation */
  villageState: VillageState;
  /** Whether telemetry is enabled */
  enabled?: boolean;
  /** Snapshot interval in milliseconds (default: 60000 = 1 minute) */
  snapshotInterval?: number;
}

/**
 * Hook that integrates IdleVillageActivityStore with Active HUD state,
 * emitting telemetry events and periodic snapshots for analytics.
 * 
 * Events emitted:
 * - `job_started`: When a job activity begins
 * - `job_completed`: When a job activity finishes
 * - `quest_started`: When a quest activity begins
 * - `quest_completed`: When a quest activity finishes
 * - `maintenance_alert`: When maintenance activities are detected
 * - `activity_cancelled`: When an activity is cancelled
 * 
 * @param props - Telemetry configuration
 */
export function useActivityTelemetry(props: UseActivityTelemetryProps): void {
  const { hudState, villageState, enabled = true, snapshotInterval = 60000 } = props;

  // Track previous activity IDs to detect new starts
  const prevActivityIdsRef = useRef<Set<string>>(new Set());
  
  // Track completed activity IDs to avoid duplicate completion events
  const completedActivityIdsRef = useRef<Set<string>>(new Set());

  /**
   * Emits a telemetry event to the store.
   */
  const emitEvent = useCallback(async (event: Omit<IdleVillageActivityEvent, 'timestamp'>) => {
    if (!enabled) return;

    try {
      await IdleVillageActivityStore.appendEvent({
        ...event,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[useActivityTelemetry] Failed to emit event:', error);
    }
  }, [enabled]);

  /**
   * Creates and stores a state snapshot.
   */
  const captureSnapshot = useCallback(async () => {
    if (!enabled) return;

    try {
      // Calculate average fatigue across all residents
      const residents = Object.values(villageState.residents);
      const averageFatigue = residents.length > 0
        ? residents.reduce((sum, r) => sum + (r.fatigue ?? 0), 0) / residents.length
        : 0;

      const snapshot: ActivityStateSnapshot = {
        timestamp: Date.now(),
        crewCount: residents.filter(r => r.status === 'away').length,
        averageFatigue,
        activeJobs: hudState.counts.jobs,
        activeQuests: hudState.counts.quests,
        activeMaintenance: hudState.counts.maintenance,
      };

      await IdleVillageActivityStore.appendSnapshot(snapshot);
    } catch (error) {
      console.error('[useActivityTelemetry] Failed to capture snapshot:', error);
    }
  }, [enabled, villageState, hudState]);

  // Monitor activity changes and emit events
  useEffect(() => {
    if (!enabled) return;

    const currentActivityIds = new Set(hudState.activities.map(a => a.scheduledId));

    // Detect new activities (started)
    hudState.activities.forEach(activity => {
      if (!prevActivityIdsRef.current.has(activity.scheduledId)) {
        // New activity started
        const eventType = activity.activityType === 'job' ? 'job_started' :
                         activity.activityType === 'quest' ? 'quest_started' :
                         'maintenance_alert';

        void emitEvent({
          type: eventType,
          activityId: activity.activityId,
          scheduledId: activity.scheduledId,
          residentId: activity.residentId,
          metadata: {
            label: activity.label,
            visualVariant: activity.visualVariant,
          },
        });
      }
    });

    // Detect completed activities (no longer in active list but were previously)
    prevActivityIdsRef.current.forEach(prevId => {
      if (!currentActivityIds.has(prevId) && !completedActivityIdsRef.current.has(prevId)) {
        // Check if it was in village state as completed
        const scheduledActivity = Object.values(villageState.activities).find(a => a.id === prevId);
        
        if (scheduledActivity?.status === 'completed') {
          const eventType = scheduledActivity.activityId.includes('quest') ? 'quest_completed' : 'job_completed';
          
          void emitEvent({
            type: eventType,
            activityId: scheduledActivity.activityId,
            scheduledId: prevId,
            residentId: scheduledActivity.characterIds[0] ?? 'unknown',
            metadata: {
              duration: scheduledActivity.endTime - scheduledActivity.startTime,
            },
          });

          completedActivityIdsRef.current.add(prevId);
        } else if (scheduledActivity?.status === 'cancelled') {
          void emitEvent({
            type: 'activity_cancelled',
            activityId: scheduledActivity.activityId,
            scheduledId: prevId,
            residentId: scheduledActivity.characterIds[0] ?? 'unknown',
          });

          completedActivityIdsRef.current.add(prevId);
        }
      }
    });

    // Update previous activity IDs
    prevActivityIdsRef.current = currentActivityIds;
  }, [hudState, villageState, enabled, emitEvent]);

  // Periodic snapshot capture
  useEffect(() => {
    if (!enabled) return;

    // Capture initial snapshot
    void captureSnapshot();

    // Note: Using setTimeout recursively for telemetry snapshots.
    // This is OUTSIDE the game loop and does not affect deterministic simulation.
    // Telemetry runs asynchronously and independently of TimeEngine ticks.
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNextSnapshot = () => {
      // eslint-disable-next-line no-restricted-globals
      timeoutId = setTimeout(() => {
        void captureSnapshot();
        scheduleNextSnapshot();
      }, snapshotInterval);
    };

    scheduleNextSnapshot();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, snapshotInterval, captureSnapshot]);

  // Cleanup completed IDs periodically to prevent memory leak
  useEffect(() => {
    if (!enabled) return;

    let cleanupTimeoutId: NodeJS.Timeout;
    
    const scheduleCleanup = () => {
      // eslint-disable-next-line no-restricted-globals
      cleanupTimeoutId = setTimeout(() => {
        // Keep only the last 100 completed IDs
        if (completedActivityIdsRef.current.size > 100) {
          const idsArray = Array.from(completedActivityIdsRef.current);
          completedActivityIdsRef.current = new Set(idsArray.slice(-100));
        }
        scheduleCleanup();
      }, 300000); // Every 5 minutes
    };

    scheduleCleanup();

    return () => {
      clearTimeout(cleanupTimeoutId);
    };
  }, [enabled]);
}
