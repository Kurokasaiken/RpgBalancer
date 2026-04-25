import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { deriveVerbTone } from '@/ui/idleVillage/hooks/useTheaterViewModels';
import type { LocationFeaturedActivity } from '@/ui/idleVillage/components/LocationCard';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';

/**
 * Minimal scheduler contract needed for featured activity selectors.
 */
export interface ActivityStateResolver {
    getActivityState: (slotId: string, residentId: string) => ScheduledActivityState | null;
}

/**
 * Input required to resolve the featured activity shown inside {@link LocationCard}.
 */
export interface ResolveFeaturedActivityParams {
    /** Target slot identifier to showcase. */
    slotId: string | null | undefined;
    /** Sandbox slots (typically `locationSlots`) containing assignment metadata. */
    slots: ActivitySlotData[];
    /** Scheduler bridge used to inspect active progress. */
    scheduler: ActivityStateResolver;
    /** Resident dictionary to derive display names. */
    residentsById: Record<string, ResidentState>;
    /** Idle Village config supplying authoritative activity metadata. */
    config?: IdleVillageConfig | null;
}

/**
 * Builds the featured activity summary for a location panel by merging live slot data (assignment +
 * progress) with config metadata (labels, icons, tone). Returns `null` when no resident is
 * currently assigned.
 */
export function resolveFeaturedActivity({
    slotId,
    slots,
    scheduler,
    residentsById,
    config,
}: ResolveFeaturedActivityParams): LocationFeaturedActivity | null {
    if (!slotId) {
        return null;
    }

    const slot = slots.find((candidate) => candidate.slotId === slotId) ?? null;
    const assignedWorkerId = slot?.assignedWorkerId ?? null;
    if (!assignedWorkerId) {
        return null;
    }

    const activityId = extractActivityId(slot?.activity?.id ?? slotId);
    const activityDefinition = resolveActivityDefinition(activityId, config, slot);
    const activityState = scheduler.getActivityState(slotId, assignedWorkerId);
    const progressFraction = activityState?.progress ?? 0;
    const progressLabel = formatProgressLabel(activityState?.progress);
    const residentName = residentsById[assignedWorkerId]?.displayName ?? assignedWorkerId;
    const tone = activityDefinition ? deriveVerbTone(activityDefinition) : 'neutral';

    return {
        slotId,
        icon: resolveActivityIcon(activityDefinition, slot),
        label: activityDefinition?.label ?? slot?.label ?? slotId,
        metaLabel: resolveMetaLabel(activityDefinition, slot),
        assignedNames: residentName ? [residentName] : [],
        progressFraction,
        progressLabel,
        tone,
    };
}

/**
 * Normalizes slot identifiers so helper consumers can pass either slotId or activityId.
 */
function extractActivityId(value: string): string {
    const delimiterIndex = value.indexOf('-slot-');
    return delimiterIndex === -1 ? value : value.slice(0, delimiterIndex);
}

function resolveActivityDefinition(
    activityId: string,
    config: IdleVillageConfig | null | undefined,
    slot: ActivitySlotData | null,
): ActivityDefinition | null {
    if (slot?.activity?.id === activityId) {
        return slot.activity;
    }
    const registry =
        config?.activities ?? DEFAULT_IDLE_VILLAGE_CONFIG.activities ?? DEFAULT_IDLE_VILLAGE_CONFIG.activities;
    return registry?.[activityId] ?? null;
}

function resolveActivityIcon(activity: ActivityDefinition | null, slot: ActivitySlotData | null): string {
    if (slot?.iconName) {
        return slot.iconName;
    }
    const metadata = (activity?.metadata ?? {}) as { icon?: string };
    if (metadata.icon) {
        return metadata.icon;
    }
    return '◎';
}

function resolveMetaLabel(activity: ActivityDefinition | null, slot: ActivitySlotData | null): string | undefined {
    if (slot?.mapSlotLabel) {
        return slot.mapSlotLabel;
    }
    const metadata = (activity?.metadata ?? {}) as { metaLabel?: string };
    return metadata.metaLabel ?? undefined;
}

function formatProgressLabel(progressFraction: number | null | undefined): string | undefined {
    if (typeof progressFraction !== 'number' || Number.isNaN(progressFraction) || progressFraction <= 0) {
        return undefined;
    }
    return `${Math.round(progressFraction * 100)}%`;
}
