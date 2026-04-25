import type { ScheduledActivityState } from '../hooks/useActivityScheduler';
import type { 
  SlotActivityState, 
  SlotActivityUIState, 
  ActivityFailureType 
} from '../slots/types';

/**
 * Maps engine activity status to UI state.
 */
function mapEngineStatusToUIState(
  engineStatus: ScheduledActivityState['status']
): SlotActivityUIState {
  switch (engineStatus) {
    case 'running':
      return 'active';
    case 'completed':
      return 'completing';
    case 'failed':
      return 'failed';
    case 'cancelled':
    case 'pending':
    default:
      return 'idle';
  }
}

/**
 * Determines failure type from activity context and engine state.
 * In a real implementation, this would analyze the activity outcome
 * to determine if it was an injury, death, or mission failure.
 */
function determineFailureType(
  activityState: ScheduledActivityState,
  activityContext?: any
): ActivityFailureType | undefined {
  if (activityState.status !== 'failed') {
    return undefined;
  }

  // Placeholder logic - in real implementation this would:
  // 1. Check activity outcome for injury/death flags
  // 2. Consider resident stats and risk factors
  // 3. Analyze resource changes or combat results
  
  // For now, default to mission_failure
  return 'mission_failure';
}

/**
 * Resolves the complete slot state from engine state and phase lock status.
 * 
 * @param scheduledState - Current activity state from the scheduler
 * @param isLockedByPhase - Whether slot is locked by day/night cycle
 * @param activityContext - Optional activity context for failure analysis
 * @returns Complete slot state for UI consumption
 */
export function resolveSlotState(
  scheduledState: ScheduledActivityState | null,
  isLockedByPhase: boolean,
  activityContext?: any
): SlotActivityState {
  // Phase lock takes precedence over all other states
  if (isLockedByPhase) {
    return {
      state: 'locked',
      progress: 0,
      remainingSeconds: 0,
      isLockedByPhase: true,
      engineState: scheduledState?.status
    };
  }

  // No scheduled activity = idle slot
  if (!scheduledState) {
    return {
      state: 'idle',
      progress: 0,
      remainingSeconds: 0,
      isLockedByPhase: false
    };
  }

  const uiState = mapEngineStatusToUIState(scheduledState.status);
  const failureType = determineFailureType(scheduledState, activityContext);
  
  // Calculate remaining time
  const remainingSeconds = Math.max(
    0, 
    scheduledState.duration - scheduledState.elapsed
  );

  return {
    state: uiState,
    progress: scheduledState.progress,
    remainingSeconds,
    isLockedByPhase: false,
    failureType: uiState === 'failed' ? failureType : undefined,
    engineState: scheduledState.status
  };
}

/**
 * Legacy mapping function for backward compatibility.
 * Maps engine status to simple UI state string.
 * 
 * @deprecated Use resolveSlotState for complete state resolution
 */
export function mapEngineToUIState(
  engineStatus: ScheduledActivityState['status']
): SlotActivityUIState {
  return mapEngineStatusToUIState(engineStatus);
}
