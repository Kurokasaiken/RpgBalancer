/**
 * Map selectors for Idle Village drag-and-drop system.
 * Provides selector functions for activity data and slot prioritization.
 * All functions are pure and config-first.
 */

import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';

/**
 * Result of location activity summary.
 */
export interface LocationActivitySummary {
  /** Activity ID */
  activityId: string;
  /** Activity name */
  name: string;
  /** Number of assigned slots */
  assignedCount: number;
  /** Total capacity */
  totalCapacity: number;
  /** Utilization percentage (0-1) */
  utilization: number;
  /** Whether activity is currently running */
  isRunning: boolean;
}

/**
 * Featured activity data for location cards.
 */
export interface LocationFeaturedActivity {
  /** Activity ID */
  id: string;
  /** Activity name */
  name: string;
  /** Activity description */
  description?: string;
  /** Current utilization */
  utilization: number;
  /** Whether activity is available */
  isAvailable: boolean;
}

/**
 * Resolves featured activity data for a location card.
 * Returns the most relevant activity data for display.
 *
 * @param slots - Available activity slots
 * @param slotAssignments - Current slot assignments
 * @param _residentStatuses - Status of all residents (unused for now)
 * @returns Featured activity data or null if no slots
 */
export function resolveFeaturedActivity(
  slots: ActivitySlotData[],
  slotAssignments: Record<string, string | null>,
  _residentStatuses?: Record<string, unknown>
): LocationFeaturedActivity | null {
  if (!slots.length) {
    return null;
  }

  // Find the slot with the highest utilization (assigned slots)
  let bestSlot: ActivitySlotData | null = null;
  let bestUtilization = 0;

  for (const slot of slots) {
    const isAssigned = slotAssignments[slot.slotId] != null;
    const utilization = isAssigned ? 1 : 0;

    if (utilization > bestUtilization) {
      bestUtilization = utilization;
      bestSlot = slot;
    }
  }

  if (!bestSlot) {
    // Return first slot if no assignments
    bestSlot = slots[0];
    bestUtilization = 0;
  }

  return {
    id: bestSlot.activity.id,
    name: bestSlot.activity.label,
    description: bestSlot.activity.description,
    utilization: bestUtilization,
    isAvailable: true, // Simplified - could check requirements
  };
}

/**
 * Selects the primary slot for assignment based on prioritization rules.
 * Prefers empty slots, then slots with lower utilization.
 *
 * @param slots - Available activity slots
 * @param slotAssignments - Current assignments
 * @returns ID of the selected primary slot
 */
export function selectPrimarySlot(
  slots: ActivitySlotData[],
  slotAssignments: Record<string, string | null>
): string {
  if (!slots.length) {
    throw new Error('No slots available for selection');
  }

  // Find empty slots first (highest priority)
  const emptySlots = slots.filter(slot => !slotAssignments[slot.slotId]);
  if (emptySlots.length > 0) {
    return emptySlots[0].slotId; // Return first empty slot
  }

  // If no empty slots, return first slot (could be enhanced with more complex logic)
  return slots[0].slotId;
}

/**
 * Builds activity summary for a location.
 * Provides utilization metrics for all activities in a location.
 *
 * @param slots - Activity slots in the location
 * @param slotAssignments - Current slot assignments
 * @param _residentStatuses - Status of all residents (unused for now)
 * @returns Array of activity summaries
 */
export function buildLocationActivitySummary(
  slots: ActivitySlotData[],
  slotAssignments: Record<string, string | null>,
  _residentStatuses?: Record<string, unknown>
): LocationActivitySummary[] {
  // Group slots by activity
  const activityMap = new Map<string, ActivitySlotData[]>();

  for (const slot of slots) {
    const activityId = slot.activity.id;
    if (!activityMap.has(activityId)) {
      activityMap.set(activityId, []);
    }
    activityMap.get(activityId)!.push(slot);
  }

  return Array.from(activityMap.entries()).map(([activityId, activitySlots]) => {
    const assignedCount = activitySlots.filter(slot =>
      slotAssignments[slot.slotId] != null
    ).length;

    const totalCapacity = activitySlots.length;
    const utilization = totalCapacity > 0 ? assignedCount / totalCapacity : 0;

    // Simplified running check - could be enhanced
    const isRunning = assignedCount > 0;

    return {
      activityId,
      name: activitySlots[0].activity.label,
      assignedCount,
      totalCapacity,
      utilization,
      isRunning,
    };
  });
}