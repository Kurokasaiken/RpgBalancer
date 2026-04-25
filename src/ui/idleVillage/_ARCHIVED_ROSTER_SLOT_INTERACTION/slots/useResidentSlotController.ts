import { useMemo, useCallback, useEffect } from 'react';
import type { ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type {
  ResidentSlotAssignResult,
  AssignmentFailureReason,
} from './types';
import {
  computeDropStateForResident,
  validateResidentAssignment,
} from './residentSlotValidators';
import {
  type ResidentSlotBlueprint,
  type ResidentSlotControllerOptions,
  type ResidentSlotControllerResult,
  type ResidentSlotTelemetryPayload,
  type ResidentSlotViewModel,
  type ResidentSlotWarning,
  type SlotBloomState,
  type ResidentSlotStatus,
  type ActivitySlotModifier,
} from './types';

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

  const slots = Array.from(blueprintMap.values()).sort((a, b) => a.index - b.index);

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
    const emptySlotCount = slots.filter((slot) => !assignments[slot.id]).length;
    const placeholdersNeeded = Math.max(0, 1 - emptySlotCount);
    if (placeholdersNeeded > 0) {
      const baseIndex = slots.length;
      for (let i = 0; i < placeholdersNeeded; i += 1) {
        const virtualIndex = baseIndex + i;
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
  }

  return slots;
};

const dropPriority: DropState[] = ['valid', 'locked', 'invalid', 'idle'];

// TODO(style-lab-flexibility): allow Style Lab interactionPhysics.mass/damping to
// influence bloom easing (overshoot) instead of static mapping once the new tokens land.
const mapDropStateToBloom = (dropState: DropState): SlotBloomState => {
  switch (dropState) {
    case 'valid':
      return 'valid';
    case 'invalid':
      return 'idle'; // Invalid drops should not bloom, just fade to alpha
    case 'locked':
      return 'blocked';
    default:
      return 'idle';
  }
};

const deriveTelemetryTags = (
  slot: ResidentSlotBlueprint & { index: number },
  activity: ActivityDefinition,
): string[] => {
  const tags = [`activity:${activity.id}`, `slot:${slot.index}`];
  if (slot.required) tags.push('required');
  if (slot.requirement?.label) tags.push(`requirement:${slot.requirement.label}`);
  if (slot.modifiers?.fatigueMult) tags.push(`fatigue:${slot.modifiers.fatigueMult}`);
  if (slot.modifiers?.riskMult) tags.push(`risk:${slot.modifiers.riskMult}`);
  if (slot.modifiers?.yieldMult) tags.push(`yield:${slot.modifiers.yieldMult}`);
  return tags;
};

const deriveControllerDropState = (slots: ResidentSlotViewModel[]): DropState => {
  for (const state of dropPriority) {
    if (slots.some((slot) => slot.dropState === state)) {
      return state;
    }
  }
  return 'idle';
};

const resolveSlotStatus = (slot: { isVirtual?: boolean }, assignedResidentId: string | null): ResidentSlotStatus => {
  if (assignedResidentId) return 'assigned';
  if (slot.isVirtual) return 'placeholder';
  return 'empty';
};

/**
 * Hook that normalizes resident slots for an activity (board, Theater, Verb detail).
 * Handles infinite placeholders, drop validation, and activity scheduler bridging.
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
  maxFatigueBeforeExhausted,
  onDuplicatePlaceholder,
  customValidator,
}: ResidentSlotControllerOptions): ResidentSlotControllerResult => {
  const slotViewModels = useMemo(() => {
    const rawSlots = deriveSlotBlueprints(activity, slotBlueprints, assignments);

    return rawSlots.map<ResidentSlotViewModel>((slot) => {
      const assignedResidentId = assignments[slot.id] ?? null;
      const assignedResident = assignedResidentId ? residents[assignedResidentId] : undefined;
      const dropState = computeDropStateForResident(
        hoveredResidentId,
        activity,
        scheduler,
        slot.requirement,
        residents,
        { maxFatigueBeforeExhausted }
      );

      // TODO(style-lab-flexibility): pipe bloomState transitions + interactionPhysics.audioProfile
      // into telemetry/audio/haptic adapters so heavy presets trigger deeper cues.
      const bloomState = mapDropStateToBloom(dropState);
      const status = resolveSlotStatus(slot, assignedResidentId);
      const telemetryTags = deriveTelemetryTags(slot, activity);

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
        bloomState,
        status,
        telemetryTags,
      };
    });
  }, [activity, assignments, hoveredResidentId, residents, scheduler, slotBlueprints, maxFatigueBeforeExhausted]);

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

  const assignResidentToSlot = useCallback<ResidentSlotControllerResult['assignResidentToSlot']>(
    (residentId, slotId) => {
      // If no specific slotId provided, do NOT auto-assign to any available slot
      // This prevents automatic assignment when dropping on empty areas
      if (!slotId) {
        return { success: false, reason: 'VALIDATION_FAILED', details: 'No specific slot provided. Please drop on a specific slot.' };
      }

      const targetSlot = slotViewModels.find((slot) => slot.id === slotId);

      if (!targetSlot) {
        return { success: false, reason: 'VALIDATION_FAILED', details: 'No suitable slot found.' };
      }

      // 1. CUSTOM VALIDATION (Scenario-specific rules) - Highest priority gatekeeper
      // If customValidator is provided and returns an error, block immediately
      if (customValidator) {
        const customResult = customValidator(residentId, targetSlot.id);
        console.log('🔍 [Controller] customValidator result:', customResult);
        if (customResult && !customResult.success) {
          console.log('🔍 [Controller] Blocking assignment due to custom validation');
          return customResult;
        }
      }

      // 2. NATIVE VALIDATION (Standard game rules: HP, fatigue, scheduler, etc.)
      const validation = validateResidentAssignment({
        residentId,
        activity,
        scheduler,
        residents,
        slotRequirement: targetSlot.requirement,
        maxFatigueBeforeExhausted,
      });

      if (!validation.success) {
        return validation;
      }

      // 3. EXECUTE ASSIGNMENT
      onAssign?.(targetSlot.id, residentId);
      return { success: true, slotId: targetSlot.id };
    },
    [activity, onAssign, residents, scheduler, slotViewModels, maxFatigueBeforeExhausted, customValidator],
  );

  const clearSlot = useCallback<ResidentSlotControllerResult['clearSlot']>(
    (slotId) => {
      if (!slotId) return;
      onClear?.(slotId);
    },
    [onClear],
  );

  const getSlotProgress = useCallback<ResidentSlotControllerResult['getSlotProgress']>(
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

  const getBloomState = useCallback<ResidentSlotControllerResult['getBloomState']>(
    (slotId) => slotViewModels.find((slot) => slot.id === slotId)?.bloomState ?? 'idle',
    [slotViewModels],
  );

  const duplicatePlaceholder = useCallback<ResidentSlotControllerResult['duplicatePlaceholder']>(
    (slotId) => {
      if (activity.maxSlots !== 'infinite') {
        return false;
      }
      if (onDuplicatePlaceholder) {
        onDuplicatePlaceholder(slotId);
        return true;
      }
      return false;
    },
    [activity.maxSlots, onDuplicatePlaceholder],
  );

  const isSlotFull = useCallback<ResidentSlotControllerResult['isSlotFull']>(
    () => {
      if (typeof activity.maxSlots !== 'number') {
        return false;
      }
      return !slotViewModels.some((slot) => !slot.assignedResidentId && !slot.isPlaceholder);
    },
    [activity.maxSlots, slotViewModels],
  );

  const aggregateDrop = useMemo(() => deriveControllerDropState(slotViewModels), [slotViewModels]);

  return {
    slots: slotViewModels,
    assignResidentToSlot,
    clearSlot,
    getSlotProgress,
    getBloomState,
    duplicatePlaceholder,
    isSlotFull,
    dropState: aggregateDrop,
    warnings,
  };
};

/**
 * Builds a canonical telemetry payload for a resident slot event.
 */
export const createResidentSlotTelemetryPayload = (
  slot: ResidentSlotViewModel,
  activityId: string,
): ResidentSlotTelemetryPayload => ({
  activityId,
  slotId: slot.id,
  slotIndex: slot.index,
  assignedResidentId: slot.assignedResidentId,
  requirementLabel: slot.statHint ?? slot.requirement?.label,
  required: Boolean(slot.required),
  bloomState: slot.bloomState,
  dropState: slot.dropState,
  modifiers: slot.modifiers,
  tags: slot.telemetryTags,
});
