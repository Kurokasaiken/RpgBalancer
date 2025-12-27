import { useMemo, useCallback, useEffect } from 'react';
import type { ActivityDefinition, ActivitySlotModifier, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';

/** Blueprint describing a resident slot’s metadata before runtime assignment is applied. */
export interface ResidentSlotBlueprint {
  id: string;
  label?: string;
  statHint?: string;
  requirement?: StatRequirement;
  /**
   * Whether this slot must be filled before the activity can start.
   * Controllers will surface a warning if required slots remain empty.
   */
  required?: boolean;
  requirementLabel?: string;
  modifiers?: ActivitySlotModifier;
}

/** Warning surfaced by the slot controller when invariants are not satisfied. */
export interface ResidentSlotWarning {
  type: 'REQUIRED_SLOTS_MISSING';
  slotIds: string[];
  message: string;
}

/** Preferred layout policy for slot racks consuming the controller. */
export type SlotOverflowPolicy = 'wrap' | 'scroll';

/** View-model for a resident slot after merging assignments and runtime state. */
export interface ResidentSlotViewModel {
  id: string;
  index: number;
  label: string;
  statHint?: string;
  required?: boolean;
  assignedResidentId: string | null;
  assignedResident?: ResidentState;
  requirement?: StatRequirement;
  modifiers?: ActivitySlotModifier;
  isPlaceholder: boolean;
  dropState: DropState;
}

/** Result object returned when attempting to assign a resident to a slot. */
export interface ResidentSlotAssignResult {
  success: boolean;
  slotId?: string;
  reason?: 'NO_SLOT_AVAILABLE' | 'RESIDENT_NOT_FOUND' | 'VALIDATION_FAILED';
  details?: string;
}

/** Progress data resolved from the scheduler for UI consumption. */
export interface SlotProgressData {
  slotId: string;
  residentId: string;
  elapsedSeconds: number;
  totalSeconds: number;
  ratio: number;
  state: ScheduledActivityState;
}

/** Options consumed by the resident slot controller hook. */
export interface UseResidentSlotControllerOptions {
  activity: ActivityDefinition;
  assignments: Record<string, string | null>;
  residents: Record<string, ResidentState>;
  hoveredResidentId?: string | null;
  slotBlueprints?: ResidentSlotBlueprint[];
  scheduler?: {
    canAssignResident?: (residentId: string, activityId: string) => boolean;
    getActivityState?: (activityId: string, residentId: string) => ScheduledActivityState | null;
  };
  onAssign?: (slotId: string, residentId: string) => void;
  onClear?: (slotId: string) => void;
  /**
   * Optional callback invoked whenever critical warnings change
   * (e.g. required slots still empty). Useful for disabling Start buttons.
   */
  onWarningsChange?: (warnings: ResidentSlotWarning[]) => void;
}

/** API exposed by the resident slot controller hook. */
export interface ResidentSlotController {
  slots: ResidentSlotViewModel[];
  assignResidentToSlot: (residentId: string, slotId?: string) => ResidentSlotAssignResult;
  clearSlot: (slotId: string) => void;
  getSlotProgress: (slotId: string) => SlotProgressData | null;
  warnings: ResidentSlotWarning[];
}

const DEFAULT_SLOT_LABEL_PREFIX = 'Slot';

/** Creates a fallback slot blueprint used when config does not supply one. */
const buildDefaultBlueprint = (
  activityId: string,
  index: number,
  requirement?: StatRequirement,
  modifiers?: ActivitySlotModifier,
  required = false,
  isVirtual = false,
): ResidentSlotBlueprint & { index: number; isVirtual: boolean } => ({
  id: `${activityId}-slot-${index}`,
  label: `${DEFAULT_SLOT_LABEL_PREFIX} ${index + 1}`,
  requirement,
  modifiers,
  index,
  required,
  isVirtual,
});

/** Resolves the slot modifier for a given index using numeric or string keys. */
const resolveSlotModifier = (
  modifiers: ActivityDefinition['slotModifiers'],
  slotIndex: number,
): ActivitySlotModifier | undefined => {
  if (!modifiers) return undefined;
  const numericMatch = (modifiers as Record<number, ActivitySlotModifier | undefined>)[slotIndex];
  if (numericMatch) {
    return numericMatch;
  }
  return (modifiers as Record<string, ActivitySlotModifier | undefined>)[String(slotIndex)];
};

/** Returns the list of slot blueprints after merging config, assignments and infinite-slot placeholders. */
const deriveSlotBlueprints = (
  activity: ActivityDefinition,
  slotBlueprints: ResidentSlotBlueprint[] | undefined,
  assignments: Record<string, string | null>,
) => {
  const base = (slotBlueprints ?? []).map((slot, index) => ({
    ...slot,
    id: slot.id || `${activity.id}-slot-${index}`,
    index,
    isVirtual: false,
    modifiers: slot.modifiers ?? resolveSlotModifier(activity.slotModifiers, index),
  }));

  const blueprintMap = new Map<string, ReturnType<typeof buildDefaultBlueprint>>();
  base.forEach((slot) => {
    const enriched: ReturnType<typeof buildDefaultBlueprint> = {
      ...slot,
      isVirtual: Boolean((slot as { isVirtual?: boolean }).isVirtual),
    };
    blueprintMap.set(slot.id, enriched);
  });

  Object.keys(assignments).forEach((slotId) => {
    if (!blueprintMap.has(slotId)) {
      const nextIndex = blueprintMap.size;
      blueprintMap.set(
        slotId,
        buildDefaultBlueprint(
          activity.id,
          nextIndex,
          activity.statRequirement,
          resolveSlotModifier(activity.slotModifiers, nextIndex),
          false,
        ),
      );
    }
  });

  let slots = Array.from(blueprintMap.values()).sort((a, b) => a.index - b.index);

  const numericMaxSlots = typeof activity.maxSlots === 'number' ? activity.maxSlots : null;
  if (numericMaxSlots && slots.length < numericMaxSlots) {
    for (let i = slots.length; i < numericMaxSlots; i += 1) {
      slots.push(
        buildDefaultBlueprint(
          activity.id,
          i,
          activity.statRequirement,
          resolveSlotModifier(activity.slotModifiers, i),
          false,
        ),
      );
    }
  }

  const needsVirtual = activity.maxSlots === 'infinite';
  if (needsVirtual) {
    const assignedCount = Object.values(assignments).filter((id) => id !== null).length;
    const virtualCount = assignedCount + 1;
    const currentVirtualCount = slots.filter((slot) => slot.isVirtual).length;
    for (let i = 0; i < virtualCount - currentVirtualCount; i += 1) {
      const virtualIndex = slots.length + i;
      slots.push(
        buildDefaultBlueprint(
          activity.id,
          virtualIndex,
          activity.statRequirement,
          resolveSlotModifier(activity.slotModifiers, virtualIndex),
          false,
          true,
        ),
      );
    }
  }

  return slots;
};

/** Calculates the drop state for a slot given the currently hovered resident. */
const computeDropState = (
  slot: ResidentSlotViewModel,
  hoveredResidentId: string | null | undefined,
  residents: Record<string, ResidentState>,
  activity: ActivityDefinition,
  scheduler?: UseResidentSlotControllerOptions['scheduler'],
): DropState => {
  if (!hoveredResidentId) return 'idle';
  const resident = residents[hoveredResidentId];
  if (!resident) return 'invalid';
  if (scheduler?.canAssignResident && !scheduler.canAssignResident(hoveredResidentId, activity.id)) {
    return 'invalid';
  }

  const requirement = slot.requirement ?? activity.statRequirement;
  const result = evaluateStatRequirement(resident, requirement);
  return result.matches ? 'valid' : 'invalid';
};

/**
 * Hook that normalizza gli slot residenti di un’attività (board, Theater, Verb detail),
 * gestendo placeholder infiniti, validazione drop e bridge con l’activity scheduler.
 */
export const useResidentSlotController = ({
  activity,
  assignments,
  residents,
  hoveredResidentId,
  slotBlueprints,
  scheduler,
  onAssign,
  onClear,
  onWarningsChange,
}: UseResidentSlotControllerOptions): ResidentSlotController => {
  const slotViewModels = useMemo(() => {
    const rawSlots = deriveSlotBlueprints(activity, slotBlueprints, assignments);

    return rawSlots.map<ResidentSlotViewModel>((slot) => {
      const assignedResidentId = assignments[slot.id] ?? null;
      const assignedResident = assignedResidentId ? residents[assignedResidentId] : undefined;
      const dropState = computeDropState(
        {
          id: slot.id,
          index: slot.index,
          label: slot.label ?? `${DEFAULT_SLOT_LABEL_PREFIX} ${slot.index + 1}`,
          statHint: slot.statHint ?? slot.requirementLabel,
          required: slot.required,
          assignedResidentId,
          assignedResident,
          requirement: slot.requirement ?? activity.statRequirement,
          modifiers: slot.modifiers,
          isPlaceholder: Boolean(slot.isVirtual && !assignedResidentId),
          dropState: 'idle',
        },
        hoveredResidentId,
        residents,
        activity,
        scheduler,
      );

      return {
        id: slot.id,
        index: slot.index,
        label: slot.label ?? `${DEFAULT_SLOT_LABEL_PREFIX} ${slot.index + 1}`,
        statHint: slot.statHint ?? slot.requirementLabel,
        required: slot.required,
        assignedResidentId,
        assignedResident,
        requirement: slot.requirement ?? activity.statRequirement,
        modifiers: slot.modifiers,
        isPlaceholder: Boolean(slot.isVirtual && !assignedResidentId),
        dropState,
      };
    });
  }, [activity, assignments, hoveredResidentId, residents, scheduler, slotBlueprints]);

  const warnings = useMemo<ResidentSlotWarning[]>(() => {
    const missingRequired = slotViewModels.filter((slot) => slot.required && !slot.assignedResidentId);
    if (missingRequired.length === 0) {
      return [];
    }
    return [
      {
        type: 'REQUIRED_SLOTS_MISSING',
        slotIds: missingRequired.map((slot) => slot.id),
        message:
          missingRequired.length === 1
            ? `${missingRequired[0].label} is required before starting this activity.`
            : `${missingRequired.length} required slots are still empty.`,
      },
    ];
  }, [slotViewModels]);

  useEffect(() => {
    if (!onWarningsChange) return;
    onWarningsChange(warnings);
  }, [onWarningsChange, warnings]);

  const assignResidentToSlot = useCallback<ResidentSlotController['assignResidentToSlot']>(
    (residentId, slotId) => {
      const resident = residents[residentId];
      if (!resident) {
        return { success: false, reason: 'RESIDENT_NOT_FOUND' };
      }

      const targetSlot = slotId
        ? slotViewModels.find((slot) => slot.id === slotId)
        : slotViewModels.find((slot) => slot.required && !slot.assignedResidentId) ??
          slotViewModels.find((slot) => !slot.assignedResidentId || slot.isPlaceholder);

      if (!targetSlot) {
        return { success: false, reason: 'NO_SLOT_AVAILABLE' };
      }

      if (scheduler?.canAssignResident && !scheduler.canAssignResident(residentId, activity.id)) {
        return { success: false, reason: 'VALIDATION_FAILED', details: 'Scheduler rejected assignment.' };
      }

      const requirement = targetSlot.requirement ?? activity.statRequirement;
      const result = evaluateStatRequirement(resident, requirement);
      if (!result.matches) {
        return { success: false, reason: 'VALIDATION_FAILED', details: 'Resident does not meet slot requirement.' };
      }

      onAssign?.(targetSlot.id, residentId);
      return { success: true, slotId: targetSlot.id };
    },
    [activity.id, activity.statRequirement, onAssign, residents, scheduler, slotViewModels],
  );

  const clearSlot = useCallback<ResidentSlotController['clearSlot']>(
    (slotId) => {
      if (!slotId) return;
      onClear?.(slotId);
    },
    [onClear],
  );

  const getSlotProgress = useCallback<ResidentSlotController['getSlotProgress']>(
    (slotId) => {
      const assignedResidentId = assignments[slotId];
      if (!assignedResidentId || !scheduler?.getActivityState) {
        return null;
      }
      const state = scheduler.getActivityState(activity.id, assignedResidentId);
      if (!state) return null;
      const ratio = state.progress;
      return {
        slotId,
        residentId: assignedResidentId,
        elapsedSeconds: state.elapsed,
        totalSeconds: state.duration,
        ratio,
        state,
      };
    },
    [activity.id, assignments, scheduler],
  );

  return {
    slots: slotViewModels,
    assignResidentToSlot,
    clearSlot,
    getSlotProgress,
    warnings,
  };
};
