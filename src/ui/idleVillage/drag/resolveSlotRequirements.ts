import type {
  ActivityDefinition,
  IdleVillageConfig,
  MapSlotDefinition,
  StatRequirement,
} from '@/balancing/config/idleVillage/types';

/**
 * Describes the config-driven requirements that a specific activity imposes when hosted in a slot.
 */
export interface SlotActivityRequirement {
  activityId: string;
  label: string;
  statRequirement?: StatRequirement;
  maxCrewSize: number;
  /**
   * Raw metadata bag from the activity definition (config-first single source of truth).
   */
  metadata: Record<string, unknown>;
  slotTags: string[];
}

/**
 * Aggregate requirement summary for a map slot, including all compatible activities.
 */
export interface SlotRequirementSummary {
  slotId: string;
  label: string;
  description?: string;
  isUnlocked: boolean;
  fatigueLimit: number;
  activities: SlotActivityRequirement[];
}

export type SlotRequirementMap = Record<string, SlotRequirementSummary>;

interface ResolveSlotRequirementsParams {
  config: IdleVillageConfig;
  /**
   * Optional whitelist to limit the resolution to specific slot identifiers.
   */
  slotFilter?: string[];
}

/**
 * Computes a map of slot identifiers to their config-derived requirements.
 * The helper remains pure so UI layers can reuse it for drag feedback, tooltips, or testing.
 */
export function resolveSlotRequirements(params: ResolveSlotRequirementsParams): SlotRequirementMap {
  const { config, slotFilter } = params;
  const slotsRecord = config.mapSlots ?? {};
  const activities = Object.values(config.activities ?? {});
  const fatigueLimit = config.globalRules.maxFatigueBeforeExhausted ?? 0;
  const slotWhitelist = slotFilter ? new Set(slotFilter) : null;

  const summaries: SlotRequirementMap = {};

  Object.values(slotsRecord).forEach((slot) => {
    if (slotWhitelist && !slotWhitelist.has(slot.id)) {
      return;
    }

    summaries[slot.id] = {
      slotId: slot.id,
      label: slot.label,
      description: slot.description,
      isUnlocked: Boolean(slot.isInitiallyUnlocked),
      fatigueLimit,
      activities: [],
    };
  });

  activities.forEach((activity) => {
    const slotId = resolveSlotForActivity(activity, slotsRecord);
    if (!slotId) return;
    if (slotWhitelist && !slotWhitelist.has(slotId)) return;

    const summary = summaries[slotId];
    if (!summary) return;

    summary.activities.push({
      activityId: activity.id,
      label: activity.label ?? activity.id,
      statRequirement: activity.statRequirement,
      maxCrewSize: resolveMaxCrewSize(activity),
      metadata: (activity.metadata ?? {}) as Record<string, unknown>,
      slotTags: activity.slotTags ?? [],
    });
  });

  Object.values(summaries).forEach((summary) => {
    summary.activities.sort((a, b) => a.activityId.localeCompare(b.activityId));
  });

  return summaries;
}

/**
 * Determines which map slot should host the activity by checking explicit metadata
 * and falling back to slot tag matching.
 */
export function resolveSlotForActivity(
  activity: ActivityDefinition,
  mapSlotsRecord: Record<string, MapSlotDefinition>,
): string | null {
  const metadata = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
  if (metadata?.mapSlotId && mapSlotsRecord[metadata.mapSlotId]) {
    return metadata.mapSlotId;
  }

  if (activity.slotTags?.length) {
    const match = Object.values(mapSlotsRecord).find((slot) =>
      slot.slotTags?.some((tag) => activity.slotTags?.includes(tag)),
    );
    if (match) return match.id;
  }

  return null;
}

const DEFAULT_CREW_FALLBACK = 1;

/**
 * Resolves the crew size limit for an activity using metadata or maxSlots fallbacks.
 */
export function resolveMaxCrewSize(activity: ActivityDefinition): number {
  const metadataCrew = ((activity.metadata ?? {}) as { maxCrewSize?: number }).maxCrewSize;
  if (typeof metadataCrew === 'number' && metadataCrew > 0) {
    return metadataCrew;
  }

  if (typeof activity.maxSlots === 'number' && activity.maxSlots > 0) {
    return activity.maxSlots;
  }

  if (Array.isArray(activity.slotTags) && activity.slotTags.length > 0) {
    return activity.slotTags.length;
  }

  return DEFAULT_CREW_FALLBACK;
}
