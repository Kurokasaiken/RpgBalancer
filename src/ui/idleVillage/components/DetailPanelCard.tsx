import React, { useMemo, useCallback } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateActivityDuration } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/components/ActivitySlot';
import ActivityCardDetail, { type ActivityCardMetric } from '@/ui/idleVillage/components/ActivityCardDetail';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { deriveRisk } from '@/ui/idleVillage/verbSummaries';

// Helper for extracting ID (duplicated logic, should be centralized but kept here for now)
const SLOT_DELIMITER = '-slot-';
const extractActivityIdFromSlot = (slotId: string) => {
    const index = slotId.indexOf(SLOT_DELIMITER);
    return index === -1 ? slotId : slotId.slice(0, index);
};

const getPrimarySlotId = (activityId: string) => activityId;

const deriveAssignmentsForActivity = (
    assignments: Record<string, string | null>,
    activityId: string,
): Record<string, string | null> => {
    const primarySlotId = getPrimarySlotId(activityId);
    const entries = Object.entries(assignments).filter(
        ([slotId]) => extractActivityIdFromSlot(slotId) === activityId,
    );
    if (entries.length === 0) {
        return { [primarySlotId]: assignments[primarySlotId] ?? null };
    }
    return entries.reduce<Record<string, string | null>>((acc, [slotId, residentId]) => {
        acc[slotId] = residentId ?? null;
        return acc;
    }, {});
};

export type ActivitySchedulerBridge = {
    canAssignResident?: (residentId: string, activityId: string) => boolean;
    getActivityState?: (activityId: string, residentId: string) => ScheduledActivityState | null;
};

export interface DetailPanelCardProps {
    slotId: string;
    slot: ActivitySlotData;
    activity: ActivityDefinition;
    slotAssignments: Record<string, string | null>;
    residents: Record<string, ResidentState>;
    secondsPerTimeUnit: number;
    draggingResidentId: string | null;
    scheduler: ActivitySchedulerBridge;
    onWorkerDrop: (activityId: string, residentId: string | null, options?: { autoStart?: boolean }) => void;
    onStart: (slotId: string) => boolean | void;
    onClose: (slotId: string) => void;
}

export const DetailPanelCard: React.FC<DetailPanelCardProps> = ({
    slotId,
    slot,
    activity,
    slotAssignments,
    residents,
    secondsPerTimeUnit,
    draggingResidentId,
    scheduler,
    onWorkerDrop,
    onStart,
    onClose,
}) => {
    const activityAssignments = useMemo(
        () => deriveAssignmentsForActivity(slotAssignments, activity.id),
        [slotAssignments, activity.id],
    );

    const controller = useResidentSlotController({
        activity,
        assignments: activityAssignments,
        residents,
        hoveredResidentId: draggingResidentId,
        scheduler,
        onAssign: (resolvedSlotId, residentId) => {
            onWorkerDrop(extractActivityIdFromSlot(resolvedSlotId), residentId, { autoStart: false });
        },
        onClear: (resolvedSlotId) => {
            onWorkerDrop(extractActivityIdFromSlot(resolvedSlotId), null, { autoStart: false });
        },
    });

    const risk = useMemo(() => deriveRisk(activity), [activity]);
    const metrics = useMemo<ActivityCardMetric[]>(() => {
        return [
            {
                id: 'engine',
                label: 'Engine',
                value: activity.resolutionEngineId ?? '—',
                tone: 'neutral',
            },
            {
                id: 'danger',
                label: 'Danger',
                value: String(activity.dangerRating ?? '—'),
                tone: activity.dangerRating && activity.dangerRating > 2 ? 'warning' : 'neutral',
            },
        ];
    }, [activity]);

    const durationSeconds = useMemo(() => {
        const durationUnits = evaluateActivityDuration(activity);
        return durationUnits * secondsPerTimeUnit;
    }, [activity, secondsPerTimeUnit]);

    const slotProgress = controller.getSlotProgress(slotId);

    const handleDropResident = useCallback(
        (targetSlotId: string, residentId: string | null) => {
            onWorkerDrop(extractActivityIdFromSlot(targetSlotId), residentId, { autoStart: false });
        },
        [onWorkerDrop],
    );

    const handleRemoveResident = useCallback(
        (targetSlotId: string) => {
            onWorkerDrop(extractActivityIdFromSlot(targetSlotId), null, { autoStart: false });
        },
        [onWorkerDrop],
    );

    const handleStart = useCallback(() => onStart(slotId), [onStart, slotId]);
    const handleClose = useCallback(() => onClose(slotId), [onClose, slotId]);
    const isStartDisabled = !controller.slots.some((slotModel) => slotModel.assignedResidentId);

    return (
        <ActivityCardDetail
            activity={activity}
            slotLabel={slot.label ?? activity.label ?? slotId}
            preview={{
                rewards: activity.rewards ?? [],
                injuryPercentage: risk.injury,
                deathPercentage: risk.death,
            }}
            slotViewModels={controller.slots}
            rewards={activity.rewards ?? []}
            metrics={metrics}
            durationSeconds={durationSeconds}
            elapsedSeconds={slotProgress?.elapsedSeconds ?? 0}
            onStart={handleStart}
            onClose={handleClose}
            onDropResident={handleDropResident}
            onRemoveResident={handleRemoveResident}
            isStartDisabled={isStartDisabled}
            draggingResidentId={draggingResidentId}
        />
    );
};

export default DetailPanelCard;
