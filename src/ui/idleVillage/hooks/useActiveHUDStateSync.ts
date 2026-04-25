/**
 * Shared selectors and mutators for ActiveHUD ↔ Map state synchronization.
 * Provides a single source of truth for activity data across HUD, Map, and Theater.
 */

import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ScheduledActivityState } from '../useActivityScheduler';
import type { 
  ActiveHUDActivityViewModel
} from './useActiveHUDState';

/**
 * Shared selectors for activity data
 */
export const ActiveHUDSelectors = {
  /**
   * Get all active activities from village state
   */
  getActiveActivities: (
    villageState: VillageState,
    config: IdleVillageConfig,
    currentTime: number,
    secondsPerTimeUnit: number,
    getActivityState: (slotId: string, residentId: string) => ScheduledActivityState | null
  ): ActiveHUDActivityViewModel[] => {
    const activities: ActiveHUDActivityViewModel[] = [];

    Object.values(villageState.activities).forEach((scheduled) => {
      if (scheduled.status !== 'running') return;

      const activityDef = config.activities[scheduled.activityId];
      if (!activityDef) return;

      const residentId = scheduled.characterIds[0];
      if (!residentId) return;

      const resident = villageState.residents[residentId];
      if (!resident) return;

      const state = getActivityState(scheduled.slotId, residentId);
      if (!state) return;

      const elapsed = currentTime - scheduled.startTime;
      const duration = scheduled.endTime - scheduled.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / duration));
      const remainingTimeUnits = Math.max(0, scheduled.endTime - currentTime);
      const remainingSeconds = remainingTimeUnits * secondsPerTimeUnit;

      activities.push({
        key: `${scheduled.id}-${residentId}`,
        activityType: getActivityType(activityDef.tags),
        label: activityDef.label,
        icon: (activityDef.metadata as { icon?: string })?.icon ?? '⚙️',
        residentId,
        residentName: resident.displayName ?? residentId,
        progress,
        remainingSeconds,
        status: state.status,
        visualVariant: deriveVisualVariant(activityDef.tags),
        scheduledId: scheduled.id,
        activityId: scheduled.activityId,
      });
    });

    return activities.sort((a, b) => a.remainingSeconds - b.remainingSeconds);
  },

  /**
   * Get activity counts by type
   */
  getActivityCounts: (activities: ActiveHUDActivityViewModel[]) => {
    const jobs = activities.filter(a => a.activityType === 'job').length;
    const quests = activities.filter(a => a.activityType === 'quest').length;
    const maintenance = activities.filter(a => a.activityType === 'maintenance').length;
    return {
      jobs,
      quests,
      maintenance,
      total: activities.length,
    };
  },

  /**
   * Get activity by ID
   */
  getActivityById: (
    activities: ActiveHUDActivityViewModel[],
    activityId: string
  ): ActiveHUDActivityViewModel | undefined => {
    return activities.find(a => a.activityId === activityId);
  },

  /**
   * Get activities by resident
   */
  getActivitiesByResident: (
    activities: ActiveHUDActivityViewModel[],
    residentId: string
  ): ActiveHUDActivityViewModel[] => {
    return activities.filter(a => a.residentId === residentId);
  },
};

/**
 * Shared mutators for state updates
 */
export const ActiveHUDMutators = {
  /**
   * Update activity progress
   */
  updateActivityProgress: (
    activities: ActiveHUDActivityViewModel[],
    activityId: string,
    progress: number,
    remainingSeconds: number
  ): ActiveHUDActivityViewModel[] => {
    return activities.map(activity =>
      activity.activityId === activityId
        ? { ...activity, progress, remainingSeconds }
        : activity
    );
  },

  /**
   * Remove completed activity
   */
  removeCompletedActivity: (
    activities: ActiveHUDActivityViewModel[],
    activityId: string
  ): ActiveHUDActivityViewModel[] => {
    return activities.filter(a => a.activityId !== activityId);
  },

  /**
   * Add new activity
   */
  addActivity: (
    activities: ActiveHUDActivityViewModel[],
    newActivity: ActiveHUDActivityViewModel
  ): ActiveHUDActivityViewModel[] => {
    return [...activities, newActivity].sort((a, b) => a.remainingSeconds - b.remainingSeconds);
  },
};

/**
 * Helper functions
 */
function deriveVisualVariant(tags: string[]): ActiveHUDActivityViewModel['visualVariant'] {
  if (tags.includes('quest')) return 'ember';
  if (tags.includes('job')) return 'azure';
  if (tags.includes('maintenance')) return 'jade';
  if (tags.includes('training')) return 'amethyst';
  return 'solar';
}

function getActivityType(tags: string[]): 'job' | 'quest' | 'maintenance' {
  if (tags.includes('quest')) return 'quest';
  if (tags.includes('maintenance')) return 'maintenance';
  return 'job';
}

/**
 * Telemetry helper for state sync
 */
export const ActiveHUDTelemetry = {
  /**
   * Emit state sync event
   */
  emitStateSync: (source: 'hud' | 'map' | 'theater', activityCount: number) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('active_hud_state_sync', {
        source,
        activityCount,
        timestamp: Date.now(),
      });
    }
  },
};
