/**
 * Location drop validators for Idle Village drag-and-drop system.
 * Provides validation logic for resident drops on location areas.
 * All functions are pure and config-first.
 */

import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { UseActivitySchedulerReturn } from './useActivityScheduler';

/**
 * Result of location drop state analysis.
 */
export interface LocationDropState {
  /** The current drop state: idle, valid, invalid, or locked */
  state: 'idle' | 'valid' | 'invalid' | 'locked';
  /** Optional message explaining the drop state */
  message?: string;
  /** Whether the drop is allowed */
  canDrop: boolean;
}

/**
 * Parameters for location drop state analysis.
 */
export interface LocationDropAnalysisParams {
  /** ID of the resident being dragged */
  residentId: string;
  /** Current village state */
  villageState: VillageState;
  /** Activity scheduler for checking conflicts */
  activityScheduler: UseActivitySchedulerReturn;
  /** IDs of slots in this location */
  locationSlotIds: string[];
  /** Maximum fatigue before resident is exhausted */
  maxFatigueBeforeExhausted?: number;
  /** Whether current phase is day (affects availability) */
  isDayPhase: boolean;
}

/**
 * Analyzes the drop state for a resident being dropped on a location area.
 * Returns detailed analysis of whether the drop is valid, invalid, or locked.
 *
 * @param params - Parameters for the drop analysis
 * @returns Analysis result with state and metadata
 */
export function deriveLocationDropState(params: LocationDropAnalysisParams): LocationDropState {
  const {
    residentId,
    villageState,
    activityScheduler,
    locationSlotIds,
    maxFatigueBeforeExhausted = 100,
    isDayPhase,
  } = params;

  // Check if resident exists
  const resident = villageState.residents[residentId];
  if (!resident) {
    return {
      state: 'invalid',
      message: 'Resident not found',
      canDrop: false,
    };
  }

  // Check if it's day phase
  if (!isDayPhase) {
    return {
      state: 'locked',
      message: 'Night phase - residents cannot be assigned',
      canDrop: false,
    };
  }

  // Check resident status
  if (resident.status === 'dead' || resident.isInjured) {
    return {
      state: 'invalid',
      message: 'Resident is injured or deceased',
      canDrop: false,
    };
  }

  if (resident.status === 'away') {
    return {
      state: 'invalid',
      message: 'Resident is already assigned elsewhere',
      canDrop: false,
    };
  }

  // Check fatigue
  if (resident.fatigue >= maxFatigueBeforeExhausted) {
    return {
      state: 'invalid',
      message: 'Resident is too fatigued',
      canDrop: false,
    };
  }

  // Check if resident is already assigned to a slot in this location
  const scheduledActivities = activityScheduler.scheduledActivities;
  const isAssignedHere = Array.from(scheduledActivities.values()).some((activity: { assignedResidentId?: string; slotId?: string }) =>
    activity.assignedResidentId === residentId &&
    locationSlotIds.includes(activity.slotId || '')
  );

  if (isAssignedHere) {
    return {
      state: 'invalid',
      message: 'Resident is already assigned to this location',
      canDrop: false,
    };
  }

  // Check if there are available slots in this location
  const hasAvailableSlots = locationSlotIds.some(slotId => {
    // Check if slot exists and has capacity
    // This is a simplified check - in real implementation would check slot capacity
    return !Array.from(scheduledActivities.values()).some((activity: { slotId?: string }) => activity.slotId === slotId);
  });

  if (!hasAvailableSlots) {
    return {
      state: 'locked',
      message: 'No available slots in this location',
      canDrop: false,
    };
  }

  // All checks passed - drop is valid
  return {
    state: 'valid',
    message: 'Drop allowed',
    canDrop: true,
  };
}

/**
 * Legacy alias for deriveLocationDropState.
 * @deprecated Use deriveLocationDropState instead
 */
export const deriveLocationDropAnalysis = deriveLocationDropState;