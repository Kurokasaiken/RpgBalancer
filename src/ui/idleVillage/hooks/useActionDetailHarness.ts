import { useCallback, useMemo } from 'react';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import type { DropState } from './useSandboxDragController';

export type ActionDetailHarnessViewModel = {
  title: string;
  slotId: string | null;
  assignedResidentName: string | null;
  helperText?: string;
  dropState: 'idle' | 'valid' | 'invalid';
  isPlaying: boolean;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  elapsedLabel: string;
  remainingLabel: string;
  remainingSeconds: number;
  showBloom: boolean;
};

interface UseActionDetailHarnessProps {
  primaryJobActivity: { label: string } | null;
  effectiveJobSlotId: string | null;
  jobAssignedResidentId: string | null;
  jobAssignedResidentName: string | null;
  jobHelperText?: string;
  slotDropStates: Record<string, DropState>;
  jobIsPlaying: boolean;
  jobProgressFraction: number;
  jobElapsedSeconds: number | null;
  jobTotalDurationSeconds: number;
  jobRemainingSeconds: number;
  handleWorkerDrop: (slotId: string, residentId: string) => void;
  handleDragOver: (slotId: string) => void;
  formatCycleSeconds: (seconds: number) => string;
  draggingResidentId: string | null;
}

export function useActionDetailHarness({
  primaryJobActivity,
  effectiveJobSlotId,
  jobAssignedResidentId,
  jobAssignedResidentName,
  jobHelperText,
  slotDropStates,
  jobIsPlaying,
  jobProgressFraction,
  jobElapsedSeconds,
  jobTotalDurationSeconds,
  jobRemainingSeconds,
  handleWorkerDrop,
  handleDragOver,
  formatCycleSeconds,
}: UseActionDetailHarnessProps) {
  const dropState = useMemo<DropState>(() => {
    if (!effectiveJobSlotId) {
      return 'idle';
    }

    if (slotDropStates[effectiveJobSlotId]) {
      return slotDropStates[effectiveJobSlotId];
    }

    const resolvedEntry = Object.entries(slotDropStates).find(([slotId]) =>
      slotId === effectiveJobSlotId || slotId.startsWith(`${effectiveJobSlotId}-slot-`)
    );
    return resolvedEntry?.[1] ?? 'idle';
  }, [slotDropStates, effectiveJobSlotId]);

  const jobElapsedLabel = useMemo(
    () => formatCycleSeconds(jobElapsedSeconds ?? 0),
    [formatCycleSeconds, jobElapsedSeconds]
  );

  const jobRemainingLabel = useMemo(
    () => formatCycleSeconds(jobRemainingSeconds),
    [formatCycleSeconds, jobRemainingSeconds]
  );

  const jobTotalDurationSafe = Math.max(1, jobTotalDurationSeconds ?? 0);

  const actionDetailHarnessState = useMemo(
    (): ActionDetailHarnessViewModel => ({
      title: primaryJobActivity?.label ?? 'Harness Job',
      slotId: effectiveJobSlotId,
      assignedResidentName: jobAssignedResidentName,
      helperText: jobHelperText,
      dropState: dropState === 'locked' ? 'idle' : dropState,
      isPlaying: Boolean(jobIsPlaying),
      progressFraction: jobProgressFraction,
      elapsedSeconds: jobElapsedSeconds ?? 0,
      totalDurationSeconds: jobTotalDurationSafe,
      elapsedLabel: jobElapsedLabel,
      remainingLabel: jobRemainingLabel,
      remainingSeconds: jobRemainingSeconds,
      showBloom: dropState === 'valid',
    }),
    [
      primaryJobActivity?.label,
      effectiveJobSlotId,
      jobAssignedResidentName,
      jobHelperText,
      dropState,
      jobIsPlaying,
      jobProgressFraction,
      jobElapsedSeconds,
      jobTotalDurationSafe,
      jobElapsedLabel,
      jobRemainingLabel,
      jobRemainingSeconds,
    ]
  );

  const getActionDetailHarnessSnapshot = useCallback(() => {
    if (!actionDetailHarnessState.slotId) {
      return null;
    }
    return {
      ...actionDetailHarnessState,
      assignedResidentId: jobAssignedResidentId,
      remainingSeconds: jobRemainingSeconds,
    };
  }, [actionDetailHarnessState, jobAssignedResidentId, jobRemainingSeconds]);

  const handleAssignResidentToJob = useCallback(
    (residentId: string) => {
      if (!effectiveJobSlotId) {
        return;
      }
      handleWorkerDrop(effectiveJobSlotId, residentId);
    },
    [effectiveJobSlotId, handleWorkerDrop]
  );

  const handleJobDropzoneDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (effectiveJobSlotId) {
        event.dataTransfer.dropEffect = 'move';
        handleDragOver(effectiveJobSlotId);
      }
    },
    [effectiveJobSlotId, handleDragOver]
  );

  const handleJobDropzoneDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!effectiveJobSlotId) {
        return;
      }
      const residentId = event.dataTransfer.getData(RESIDENT_DRAG_MIME);
      if (residentId) {
        handleWorkerDrop(effectiveJobSlotId, residentId);
      }
    },
    [effectiveJobSlotId, handleWorkerDrop]
  );

  return {
    actionDetailHarnessState,
    getActionDetailHarnessSnapshot,
    handleAssignResidentToJob,
    handleJobDropzoneDragOver,
    handleJobDropzoneDrop,
  };
}
