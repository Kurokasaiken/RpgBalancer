import type { ResidentStatus, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Configurable baseline segment describing expected fatigue distribution for a resident cohort.
 */
export interface FatigueBaselineSegment {
  /** Unique identifier used by detectors */
  id: string;
  /** Human readable label for analytics */
  label: string;
  /** Expected absolute fatigue value for the cohort */
  expectedFatigue: number;
  /** Allowed absolute delta before anomaly checks kick in */
  tolerance: number;
  /** Absolute delta that should always be treated as critical */
  criticalDeviation: number;
  /** Optional statuses that should map to this segment */
  applicableStatuses?: ResidentStatus[];
}

/**
 * Configurable activity-specific baseline.
 */
export interface ActivityFatigueBaseline {
  activityId: string;
  label: string;
  /** Additional fatigue that the activity is expected to add */
  expectedGain: number;
  /** Allowed absolute delta above the gain */
  tolerance: number;
}

export type FatigueAnomalySeverity = 'info' | 'warning' | 'critical';

/**
 * Alert rule describing when detectors should emit fatigue anomalies.
 */
export interface FatigueAnomalyRule {
  id: string;
  description: string;
  severity: FatigueAnomalySeverity;
  /** Absolute percentage difference threshold (e.g. 20 = 20%) */
  deltaPercent: number;
  /** How many consecutive breaches are required */
  consecutiveReadings: number;
  /** Cooldown in minutes before the same rule can trigger again for a resident */
  cooldownMinutes: number;
}

export interface FatigueAnomalyConfig {
  version: string;
  samplingWindowMinutes: number;
  minSamplesPerResident: number;
  maxFatigueBeforeExhausted: number;
  defaultSegmentId: string;
  residentSegments: Record<string, FatigueBaselineSegment>;
  activityBaselines: Record<string, ActivityFatigueBaseline>;
  alertRules: FatigueAnomalyRule[];
  /** Snooze presets offered by the UI */
  snoozeDurationsMinutes: number[];
}

export const DEFAULT_FATIGUE_ANOMALY_CONFIG: FatigueAnomalyConfig = {
  version: 'phase-e-baseline-v1',
  samplingWindowMinutes: 5,
  minSamplesPerResident: 3,
  maxFatigueBeforeExhausted: 120,
  defaultSegmentId: 'available',
  residentSegments: {
    available: {
      id: 'available',
      label: 'Available Residents',
      expectedFatigue: 45,
      tolerance: 10,
      criticalDeviation: 25,
      applicableStatuses: ['available', 'away'],
    },
    injured: {
      id: 'injured',
      label: 'Injured Crew',
      expectedFatigue: 65,
      tolerance: 8,
      criticalDeviation: 18,
      applicableStatuses: ['injured'],
    },
    exhausted: {
      id: 'exhausted',
      label: 'Exhausted Crew',
      expectedFatigue: 90,
      tolerance: 5,
      criticalDeviation: 10,
      applicableStatuses: ['exhausted'],
    },
  },
  activityBaselines: {
    job_city_rats: {
      activityId: 'job_city_rats',
      label: 'City Rats Job',
      expectedGain: 12,
      tolerance: 6,
    },
    job_training_basics: {
      activityId: 'job_training_basics',
      label: 'Basic Training',
      expectedGain: 6,
      tolerance: 4,
    },
    quest_city_rats: {
      activityId: 'quest_city_rats',
      label: 'Cull Rats Quest',
      expectedGain: 18,
      tolerance: 10,
    },
  },
  alertRules: [
    {
      id: 'warning-delta',
      description: 'Fatigue deviates from baseline by ≥20% for two samples',
      severity: 'warning',
      deltaPercent: 20,
      consecutiveReadings: 2,
      cooldownMinutes: 15,
    },
    {
      id: 'critical-spike',
      description: 'Fatigue deviates by ≥35% for a single sample',
      severity: 'critical',
      deltaPercent: 35,
      consecutiveReadings: 1,
      cooldownMinutes: 30,
    },
  ],
  snoozeDurationsMinutes: [5, 15, 60],
};

export const FATIGUE_ALERT_STORAGE_KEY = 'idle-village-fatigue-alert-preferences';

export interface FatigueAlertPreferences {
  snoozedResidents: Record<string, number>;
}

export const DEFAULT_FATIGUE_ALERT_PREFERENCES: FatigueAlertPreferences = {
  snoozedResidents: {},
};

export function resolveSegmentId(
  status: ResidentStatus | undefined,
  config: FatigueAnomalyConfig,
): string {
  if (!status) {
    return config.defaultSegmentId;
  }

  const match = Object.values(config.residentSegments).find((segment) =>
    segment.applicableStatuses?.includes(status),
  );
  return match?.id ?? config.defaultSegmentId;
}

export function getActivityBaseline(
  activityId: string | undefined,
  config: FatigueAnomalyConfig,
): ActivityFatigueBaseline | undefined {
  if (!activityId) return undefined;
  return config.activityBaselines[activityId];
}

export function findResidentActivity(
  residentId: string,
  activities: Record<string, ScheduledActivity>,
): string | undefined {
  const activity = Object.values(activities).find((scheduled) =>
    scheduled.characterIds?.includes(residentId),
  );
  return activity?.activityId ?? activity?.id;
}
