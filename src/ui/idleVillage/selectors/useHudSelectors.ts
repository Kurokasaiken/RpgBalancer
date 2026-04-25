import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import {
  buildScheduledVerbSummary,
  type VerbSummary,
} from '@/ui/idleVillage/verbSummaries';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';

export interface HudEntry {
  scheduled: ScheduledActivity;
  summary: VerbSummary;
  variant: VerbVisualVariant;
}

export interface ActiveActivityHudData {
  hudEntries: HudEntry[];
}

/**
 * Selector to derive ActiveActivityHUD props from scheduler/config data.
 * Config-first approach: reads from config, scheduler state, and residents.
 * Zero hardcoding: all logic derives from provided data.
 */
export function selectActiveActivityHudData(params: {
  activities: ScheduledActivity[];
  config: IdleVillageConfig;
  currentTime: number;
  secondsPerTimeUnit: number;
  dayLength: number;
  residents: Record<string, ResidentState>;
  getResourceLabel: (resourceId: string) => string;
}): ActiveActivityHudData {
  const mapSlots = params.config.mapSlots ?? {};
  const hudEntries = params.activities
    .filter((activity) => activity.status === 'running' || activity.status === 'completed')
    .map<HudEntry | null>((scheduled) => {
      const activityDef = params.config.activities[scheduled.activityId];
      if (!activityDef) return null;
      const slotIcon = scheduled.slotId ? mapSlots[scheduled.slotId]?.icon : undefined;
      const assigneeNames = scheduled.characterIds.map((cid) => params.residents[cid]?.id ?? cid);
      const summary = buildScheduledVerbSummary({
        scheduled,
        activity: activityDef,
        slotIcon,
        resourceLabeler: params.getResourceLabel,
        currentTime: params.currentTime,
        secondsPerTimeUnit: params.secondsPerTimeUnit,
        dayLength: params.dayLength,
        assigneeNames,
      });
      const variant = summary.visualVariant ?? 'azure';
      return { scheduled, summary, variant };
    })
    .filter((entry): entry is HudEntry => Boolean(entry))
    .sort((a, b) => {
      if (a.scheduled.status !== b.scheduled.status) {
        return a.scheduled.status === 'completed' ? -1 : 1;
      }
      return a.scheduled.endTime - b.scheduled.endTime;
    });

  return { hudEntries };
}
