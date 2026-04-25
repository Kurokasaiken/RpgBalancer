import { useCallback, useMemo } from 'react';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState, VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { UseActivitySchedulerReturn } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { useSandboxDragController, type DropState } from './useSandboxDragController';
import type { DragErrorEvent } from '@/ui/idleVillage/hooks/useDragErrorRecovery';
import { useActionDetailHarness } from './useActionDetailHarness';
import * as verbSummaries from '@/ui/idleVillage/verbSummaries';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';

export interface UseSandboxCoreParams {
    villageState: VillageState;
    activityScheduler: UseActivitySchedulerReturn;
    secondsPerTimeUnit: number;
    slots: ActivitySlotData[];
    slotAssignments: Record<string, string | null>;
    setSlotAssignments: (assignments: Record<string, string | null>) => void;
    setAssignmentFeedback: (message: string | null, source?: string) => void;
    setIsCyclePlaying: (playing: boolean) => void;
    updateState: (updater: (prev: VillageState) => VillageState, message: string) => void;
    dragContext: { activeId: string | null; setActiveId: (id: string | null) => void };
    locationSlotIds: string[];
    managedActivities: ActivityDefinition[];
    residentsById: Record<string, ResidentState>;
    config: IdleVillageConfig;
    maxFatigueBeforeExhausted?: number;
    formatCycleSeconds: (value: number) => string;
    isDayPhase: boolean;
    onDragError?: (event: DragErrorEvent) => void;
}

export interface UseSandboxCoreReturn {
    slotDropStates: Record<string, DropState>;
    locationDropState: DropState;
    draggingResidentId: string | null;
    handleWorkerDrop: ReturnType<typeof useSandboxDragController>['handleWorkerDrop'];
    actionDetailHarnessState: ReturnType<typeof useActionDetailHarness>['actionDetailHarnessState'];
    getActionDetailHarnessSnapshot: ReturnType<typeof useActionDetailHarness>['getActionDetailHarnessSnapshot'];
    handleAssignResidentToJob: ReturnType<typeof useActionDetailHarness>['handleAssignResidentToJob'];
    handleJobDropzoneDragOver: ReturnType<typeof useActionDetailHarness>['handleJobDropzoneDragOver'];
    handleJobDropzoneDrop: ReturnType<typeof useActionDetailHarness>['handleJobDropzoneDrop'];
    metadata: ReturnType<typeof useSandboxDragController>['metadata'];
}

/**
 * Minimal hook exposing only the drag/drop and ActionDetailHarness contract required by the
 * Village Sandbox refactor. Legacy consumers can continue to rely on useMapContext while new
 * code paths consume this lean surface.
 */
export function useSandboxCore({
    villageState,
    activityScheduler,
    secondsPerTimeUnit,
    slots,
    slotAssignments,
    setSlotAssignments,
    setAssignmentFeedback,
    setIsCyclePlaying,
    updateState,
    dragContext,
    locationSlotIds,
    managedActivities,
    residentsById,
    config,
    maxFatigueBeforeExhausted,
    formatCycleSeconds,
    isDayPhase,
    onDragError,
}: UseSandboxCoreParams): UseSandboxCoreReturn {
    const diagnostics = useMemo(
        () => createSandboxDiagnostics<PickerDiagnosticsPayload>('useSandboxCore', 'picker'),
        [],
    );
    const dragController = useSandboxDragController({
        villageState,
        activityScheduler,
        secondsPerTimeUnit,
        slots,
        slotAssignments,
        setSlotAssignments,
        setAssignmentFeedback,
        setIsCyclePlaying,
        updateState,
        dragContext,
        locationSlotIds,
        maxFatigueBeforeExhausted,
        isDayPhase,
        onDragError,
    });

    const primaryJobActivity = useMemo(() => {
        if (managedActivities.length === 0) {
            return null;
        }
        return managedActivities.find((activity) => activity.tags?.includes('job')) ?? managedActivities[0];
    }, [managedActivities]);

    const primaryJobSlotId = useMemo(() => {
        if (!primaryJobActivity) {
            return null;
        }
        const jobId = primaryJobActivity.id;
        if (Object.prototype.hasOwnProperty.call(slotAssignments, jobId)) {
            return jobId;
        }
        const prefix = `${jobId}-slot-`;
        return Object.keys(slotAssignments ?? {}).find((key) => key.startsWith(prefix)) ?? null;
    }, [primaryJobActivity, slotAssignments]);

    const effectiveJobSlotId = primaryJobSlotId ?? primaryJobActivity?.id ?? null;
    const jobAssignedResidentId = effectiveJobSlotId ? slotAssignments?.[effectiveJobSlotId] ?? null : null;

    const jobState =
        effectiveJobSlotId && jobAssignedResidentId
            ? activityScheduler?.getActivityState?.(effectiveJobSlotId, jobAssignedResidentId) ?? null
            : null;
    const jobProgressFraction = jobState?.progress ?? 0;
    const jobElapsedSeconds = jobState?.elapsed ?? 0;
    const jobIsPlaying = jobState?.status === 'running';
    const jobTotalDurationSeconds =
        jobState?.duration ?? (primaryJobActivity ? Number(primaryJobActivity.durationFormula) || 0 : 0);

    const getResourceLabel = useCallback(
        (resourceId: string) => config?.resources?.[resourceId]?.label ?? resourceId,
        [config.resources],
    );

    const jobHelperText = useMemo(() => {
        if (!primaryJobActivity) {
            return undefined;
        }
        const label = verbSummaries.formatRewardLabel(primaryJobActivity.rewards, getResourceLabel);
        return label ?? undefined;
    }, [primaryJobActivity, getResourceLabel]);

    const jobAssignedResidentName = jobAssignedResidentId
        ? residentsById[jobAssignedResidentId]?.displayName ?? jobAssignedResidentId
        : null;

    const jobRemainingSeconds = useMemo(() => {
        if (!jobTotalDurationSeconds) {
            return 0;
        }
        return Math.max(0, jobTotalDurationSeconds - (jobElapsedSeconds ?? 0));
    }, [jobElapsedSeconds, jobTotalDurationSeconds]);

    const handleHarnessDragOver = useCallback(
        (slotId: string) => {
            if (!effectiveJobSlotId) {
                diagnostics.debug('handleHarnessDragOver:missingSlot', { draggingResidentId: dragController.draggingResidentId });
                return;
            }
            diagnostics.debug('handleHarnessDragOver', {
                slotId: effectiveJobSlotId,
                draggingResidentId: dragController.draggingResidentId,
            });
            dragController.handleDragOver(slotId);
        },
        [diagnostics, dragController, effectiveJobSlotId],
    );

    const {
        actionDetailHarnessState,
        getActionDetailHarnessSnapshot,
        handleAssignResidentToJob,
        handleJobDropzoneDragOver,
        handleJobDropzoneDrop,
    } = useActionDetailHarness({
        primaryJobActivity,
        effectiveJobSlotId,
        jobAssignedResidentId,
        jobAssignedResidentName,
        jobHelperText,
        slotDropStates: dragController.slotDropStates,
        jobIsPlaying,
        jobProgressFraction,
        jobElapsedSeconds,
        jobTotalDurationSeconds,
        jobRemainingSeconds,
        handleWorkerDrop: dragController.handleWorkerDrop,
        handleDragOver: handleHarnessDragOver,
        formatCycleSeconds,
        draggingResidentId: dragController.draggingResidentId,
    });

    return {
        slotDropStates: dragController.slotDropStates,
        locationDropState: dragController.locationDropState,
        draggingResidentId: dragController.draggingResidentId,
        handleWorkerDrop: dragController.handleWorkerDrop,
        actionDetailHarnessState,
        getActionDetailHarnessSnapshot,
        handleAssignResidentToJob,
        handleJobDropzoneDragOver,
        handleJobDropzoneDrop,
        metadata: dragController.metadata,
    };
}
