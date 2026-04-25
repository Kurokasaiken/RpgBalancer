import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { useActivityScheduler } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';

/**
 * Minimal scheduler contract required by {@link useSandboxSlotModels}.
 */
type ActivitySchedulerLike = Pick<ReturnType<typeof useActivityScheduler>, 'getActivityState'>;

/**
 * Configuration object for {@link useSandboxSlotModels}.
 */
export interface UseSandboxSlotModelsParams {
    /** Idle Village configuration providing activities and map slot metadata. */
    config: IdleVillageConfig;
    /** Cycle label displayed by the synthetic day/night slot. */
    cyclePhaseLabel: string;
    /** Cycle icon displayed by the synthetic day/night slot. */
    cyclePhaseIcon: string;
    /** Whether the sandbox clock is currently playing. */
    isCyclePlaying: boolean;
    /** Total number of seconds for the full day/night cycle. */
    totalCycleSeconds: number;
    /** Visual variant used by the synthetic day/night slot. */
    cycleVariant: VerbVisualVariant;
    /** Scheduler instance used to resolve active slots. */
    activityScheduler: ActivitySchedulerLike;
}

export type SlotAssignments = Record<string, string | null>;

/**
 * Structured result returned by {@link useSandboxSlotModels}.
 */
export interface UseSandboxSlotModelsResult {
    /** Ordered list of managed activities exposed by the sandbox. */
    managedActivities: ActivityDefinition[];
    /** Optional quest showcase activity highlighted in the UI. */
    questShowcaseActivity: ActivityDefinition | null;
    /** Current worker assignments keyed by activity id. */
    slotAssignments: SlotAssignments;
    /** Setter mirroring {@link slotAssignments}. */
    setSlotAssignments: Dispatch<SetStateAction<Record<string, string | null>>>;
    /** Full slot list (including the synthetic day/night slot). */
    slots: ActivitySlotData[];
    /** Subset of slots currently running with associated scheduler state. */
    activeSlots: { slot: ActivitySlotData; state: ScheduledActivityState }[];
    /** Slots eligible for the location/theater preview lane. */
    locationSlots: ActivitySlotData[];
    /** Convenience array of location slot identifiers. */
    locationSlotIds: string[];
}

/**
 * Helper that builds an empty assignment map for the provided activities.
 */
export function createEmptySlotAssignmentMap(activities: ActivityDefinition[]): Record<string, string | null> {
    return activities.reduce<Record<string, string | null>>((acc, activity) => {
        acc[activity.id] = null;
        return acc;
    }, {});
}

/**
 * Aligns an assignment map with the provided activity list, ensuring every managed activity
 * has an entry (defaulting to `null`) while preserving existing assignments when possible.
 */
function alignAssignmentsToActivities(
    source: Record<string, string | null>,
    activities: ActivityDefinition[],
): Record<string, string | null> {
    return activities.reduce<Record<string, string | null>>((acc, activity) => {
        acc[activity.id] = Object.prototype.hasOwnProperty.call(source, activity.id) ? source[activity.id] : null;
        return acc;
    }, {});
}

/**
 * Deduce the appropriate visual variant for the supplied activity based on its tags.
 */
function deriveVisualVariant(activity: ActivityDefinition): VerbVisualVariant {
    if (activity.tags?.includes('combat')) return 'ember';
    if (activity.tags?.includes('magic')) return 'amethyst';
    if (activity.tags?.includes('gathering')) return 'jade';
    if (activity.tags?.includes('social')) return 'solar';
    return 'azure';
}

/**
 * Centralized derivation of managed activities and their slot view-models.
 * Keeps {@link useMapContext} lean by encapsulating the sandbox-specific heuristics that decide
 * which activities to showcase, how to build slot cards, and which slots power the HUD overlays.
 */
export function useSandboxSlotModels({
    config,
    cyclePhaseLabel,
    cyclePhaseIcon,
    isCyclePlaying,
    totalCycleSeconds,
    cycleVariant,
    activityScheduler,
}: UseSandboxSlotModelsParams): UseSandboxSlotModelsResult {
    const activities = useMemo<ActivityDefinition[]>(() => {
        const configActivities = Object.values(config.activities ?? {});
        if (configActivities.length > 0) {
            return configActivities;
        }
        return Object.values(DEFAULT_IDLE_VILLAGE_CONFIG.activities ?? {});
    }, [config.activities]);

    const showcaseActivities = useMemo<ActivityDefinition[]>(() => {
        const sorted = [...activities].sort((a, b) => (a.label ?? a.id).localeCompare(b.label ?? b.id));
        return sorted.slice(0, 3);
    }, [activities]);

    const primaryJobActivity = useMemo<ActivityDefinition | null>(() => {
        return activities.find((activity) => activity.tags?.includes('job')) ?? null;
    }, [activities]);

    const questShowcaseActivity = useMemo<ActivityDefinition | null>(() => {
        return activities.find((activity) => activity.tags?.includes('quest')) ?? null;
    }, [activities]);

    const managedActivities = useMemo<ActivityDefinition[]>(() => {
        const map = new Map<string, ActivityDefinition>();
        showcaseActivities.forEach((activity) => map.set(activity.id, activity));
        if (questShowcaseActivity) {
            map.set(questShowcaseActivity.id, questShowcaseActivity);
        }
        if (primaryJobActivity) {
            map.set(primaryJobActivity.id, primaryJobActivity);
        }
        return Array.from(map.values());
    }, [showcaseActivities, questShowcaseActivity, primaryJobActivity]);

    const [rawAssignments, setRawAssignments] = useState<Record<string, string | null>>(() =>
        alignAssignmentsToActivities({}, managedActivities),
    );

    const slotAssignments = useMemo(
        () => alignAssignmentsToActivities(rawAssignments, managedActivities),
        [rawAssignments, managedActivities],
    );

    const setSlotAssignments = useCallback(
        (updater: SetStateAction<Record<string, string | null>>) => {
            setRawAssignments((prevRaw) => {
                const currentAligned = alignAssignmentsToActivities(prevRaw, managedActivities);
                const nextAligned = typeof updater === 'function' ? updater(currentAligned) : updater;
                return nextAligned;
            });
        },
        [managedActivities],
    );

    const dayNightSlot: ActivitySlotData = useMemo(
        () => ({
            slotId: 'day-night-cycle',
            label: `${cyclePhaseLabel} · ${isCyclePlaying ? 'In esecuzione' : 'In pausa'}`,
            iconName: isCyclePlaying ? cyclePhaseIcon : '⏸️',
            assignedWorkerId: null,
            activity: {
                id: 'day-night-cycle',
                label: cyclePhaseLabel,
                description: 'Ciclo giorno/notte',
                tags: ['system'],
                slotTags: [],
                resolutionEngineId: 'system',
                durationFormula: String(totalCycleSeconds),
                metadata: {},
                rewards: [],
            },
            visualVariant: cycleVariant,
        }),
        [cyclePhaseLabel, cyclePhaseIcon, isCyclePlaying, totalCycleSeconds, cycleVariant],
    );

    const slots = useMemo<ActivitySlotData[]>(() => {
        const resolvedMapSlots = config.mapSlots ?? DEFAULT_IDLE_VILLAGE_CONFIG.mapSlots ?? {};

        const activitySlots = managedActivities.map((activity) => {
            const meta = (activity.metadata ?? {}) as { icon?: string; mapSlotId?: string } | undefined;
            const mapSlot = meta?.mapSlotId ? resolvedMapSlots?.[meta.mapSlotId] : undefined;
            const derivedIcon = activity.id === questShowcaseActivity?.id ? '⚔️' : meta?.icon ?? mapSlot?.icon ?? '☆';

            return {
                slotId: activity.id,
                label: activity.label ?? activity.id,
                iconName: derivedIcon,
                assignedWorkerId: slotAssignments[activity.id] ?? null,
                activity,
                mapSlotLabel: mapSlot?.label,
                visualVariant: deriveVisualVariant(activity),
            };
        });

        return [dayNightSlot, ...activitySlots];
    }, [managedActivities, questShowcaseActivity?.id, slotAssignments, config.mapSlots, dayNightSlot]);

    const activeSlots = useMemo(() => {
        return slots
            .map((slot) => {
                if (slot.slotId === 'day-night-cycle') return null;
                if (!slot.assignedWorkerId) return null;
                const state = activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId);
                if (!state || state.progress <= 0) return null;
                return { slot, state };
            })
            .filter((entry): entry is { slot: ActivitySlotData; state: ScheduledActivityState } => entry !== null);
    }, [slots, activityScheduler]);

    const playableSlots = useMemo(() => slots.filter((slot) => slot.slotId !== 'day-night-cycle'), [slots]);

    const locationSlots = useMemo<ActivitySlotData[]>(() => {
        if (playableSlots.length >= 3) return playableSlots.slice(0, 3);
        return playableSlots;
    }, [playableSlots]);

    const locationSlotIds = useMemo(() => playableSlots.map((slot) => slot.slotId), [playableSlots]);

    return {
        managedActivities,
        questShowcaseActivity,
        slotAssignments,
        setSlotAssignments,
        slots,
        activeSlots,
        locationSlots,
        locationSlotIds,
    };
}
