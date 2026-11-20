import { useCallback, useMemo } from 'react';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { type SlotAssignments } from '@/ui/idleVillage/hooks/useSandboxSlotModels';
import { useActionDetailHarness } from './useActionDetailHarness';
import { type UseSandboxDragControllerReturn } from './useSandboxDragController';
import * as verbSummaries from '@/ui/idleVillage/verbSummaries';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';

export interface UseSandboxCoreActionDetailParams {
    managedActivities: ActivityDefinition[];
    slotAssignments: SlotAssignments;
    activityScheduler: {
        getActivityState?: (slotId: string, residentId: string) => {
            elapsed?: number;
            progress?: number;
            duration?: number;
            status?: string;
        } | null;
    };
    secondsPerTimeUnit: number;
    residentsById: Record<string, ResidentState>;
    dragController: Pick<UseSandboxDragControllerReturn, 'slotDropStates' | 'handleWorkerDrop' | 'canSlotAcceptDrop'>;
    config: IdleVillageConfig;
    formatCycleSeconds: (seconds: number) => string;
}

export interface UseSandboxCoreActionDetailReturn {
    primaryJobActivity: ActivityDefinition | null;
    effectiveJobSlotId: string | null;
    jobAssignedResidentId: string | null;
    jobAssignedResidentName: string | null;
    jobHelperText?: string;
    jobIsPlaying: boolean;
    jobProgressFraction: number;
    jobElapsedSeconds: number;
    jobTotalDurationSeconds: number;
    jobRemainingSeconds: number;
    actionDetailHarnessState: ReturnType<typeof useActionDetailHarness>['actionDetailHarnessState'];
    getActionDetailHarnessSnapshot: ReturnType<typeof useActionDetailHarness>['getActionDetailHarnessSnapshot'];
    handleAssignResidentToJob: ReturnType<typeof useActionDetailHarness>['handleAssignResidentToJob'];
    handleJobDropzoneDragOver: ReturnType<typeof useActionDetailHarness>['handleJobDropzoneDragOver'];
    handleJobDropzoneDrop: ReturnType<typeof useActionDetailHarness>['handleJobDropzoneDrop'];
}

/**
 * Core helper that derives the primary job slot view-model and wires it to the ActionDetailHarness.
 * Keeps the wiring centralized so legacy consumers can keep their contracts while the new dropState
 * pipeline stays lean.
 */
export function useSandboxCoreActionDetail({
    managedActivities,
    slotAssignments,
    activityScheduler,
    secondsPerTimeUnit: _secondsPerTimeUnit,
    residentsById,
    dragController,
    config,
    formatCycleSeconds,
}: UseSandboxCoreActionDetailParams): UseSandboxCoreActionDetailReturn {
    const diagnostics = useMemo(
        () => createSandboxDiagnostics<PickerDiagnosticsPayload>('useSandboxCoreActionDetail', 'picker'),
        [],
    );
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
        handleDragOver: (_slotId: string) => dragController.canSlotAcceptDrop(_slotId),
        formatCycleSeconds,
        draggingResidentId: null, // Placeholder or derive if possible
    });

    diagnostics.info('dropState snapshot', {
        slotId: actionDetailHarnessState.slotId,
        dropState: actionDetailHarnessState.dropState,
        assignedResident: jobAssignedResidentId,
    });

    return {
        primaryJobActivity,
        effectiveJobSlotId,
        jobAssignedResidentId,
        jobAssignedResidentName,
        jobHelperText,
        jobIsPlaying,
        jobProgressFraction,
        jobElapsedSeconds,
        jobTotalDurationSeconds,
        jobRemainingSeconds,
        actionDetailHarnessState,
        getActionDetailHarnessSnapshot,
        handleAssignResidentToJob,
        handleJobDropzoneDragOver,
        handleJobDropzoneDrop,
    };
}
