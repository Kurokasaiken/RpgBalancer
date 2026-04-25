import type { ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';

/**
 * Unique reasons returned by {@link validateResidentAssignment}.
 */
export type AssignmentFailureReason =
    | 'RESIDENT_NOT_FOUND'
    | 'RESIDENT_UNAVAILABLE'
    | 'FATIGUE_THRESHOLD'
    | 'VALIDATION_FAILED'
    | 'SCHEDULER_REJECTED';

/**
 * Detailed validation failure information for better debugging and UI feedback.
 */
export interface ValidationFailureDetails {
    missingAllOf?: string[];
    anyOfMatched?: boolean;
    blockedBy?: string[];
    requirementDescription?: string;
}

/**
 * Validator Logic for Resident Slots
 * Extracted to ensure purity and testability independent of React hooks.
 */

export interface ResidentValidatorContext {
    residentId: string;
    activity: ActivityDefinition;
    scheduler?: {
        canAssignResident?: (residentId: string, activityId: string) => boolean;
    };
    slotRequirement?: StatRequirement;
    residents: Record<string, ResidentState>;
    maxFatigueBeforeExhausted?: number;
}

export type AssignmentValidationResult =
    | { success: true }
    | { success: false; reason: AssignmentFailureReason; details?: string; validationDetails?: ValidationFailureDetails };

/**
 * Validates if a resident can be assigned to a specific activity slot.
 *
 * @param context - Domain data required to evaluate a potential assignment.
 * @returns Outcome describing success or the failure reason.
 */
export function validateResidentAssignment(context: ResidentValidatorContext): AssignmentValidationResult {
    const { residentId, activity, scheduler, slotRequirement, residents, maxFatigueBeforeExhausted } = context;
    const resident = residents[residentId];

    if (!resident) {
        return { success: false, reason: 'RESIDENT_NOT_FOUND' };
    }

    if (resident.status !== 'available') {
        return { success: false, reason: 'RESIDENT_UNAVAILABLE', details: 'Resident is not available.' };
    }

    const fatigueCap = Number.isFinite(maxFatigueBeforeExhausted) ? (maxFatigueBeforeExhausted as number) : Infinity;
    // Correct logic: fatigue starts at 0 (rested) and increases towards cap (exhausted)
    // Block assignment if fatigue has reached or exceeded the exhaustion cap
    if (resident.fatigue >= fatigueCap) {
        return {
            success: false,
            reason: 'FATIGUE_THRESHOLD',
            details: `Fatigue ${resident.fatigue}/${fatigueCap} - resident exhausted`,
        };
    }

    // 1. Scheduler Check (Availability, unique assignment etc.)
    if (scheduler?.canAssignResident && !scheduler.canAssignResident(residentId, activity.id)) {
        return { success: false, reason: 'SCHEDULER_REJECTED', details: 'Resident is not available or already assigned.' };
    }

    // 2. Stat Requirement Check
    const requirement = slotRequirement ?? activity.statRequirement;
    const result = evaluateStatRequirement(resident, requirement);
    if (!result.matches) {
        const validationDetails: ValidationFailureDetails = {
            missingAllOf: result.missingAllOf.length > 0 ? result.missingAllOf : undefined,
            anyOfMatched: result.anyOfMatched,
            blockedBy: result.blockedBy.length > 0 ? result.blockedBy : undefined,
            requirementDescription: requirement?.label || 'Stat requirement',
        };
        
        return { 
            success: false, 
            reason: 'VALIDATION_FAILED', 
            details: `Missing stat requirement: ${validationDetails.missingAllOf?.join(', ') || 'incompatible stats'}`,
            validationDetails 
        };
    }

    return { success: true };
}

/**
 * Computes the visual drop state for a slot.
 *
 * @param residentId - Dragging resident identifier.
 * @param activity - Target activity definition.
 * @param scheduler - Optional scheduler adapter.
 * @param slotRequirement - Optional override for stat requirement.
 * @param residents - Resident map.
 * @param options - Additional validation options.
 * @returns Drop state recognized by the UI.
 */
export function computeDropStateForResident(
    residentId: string | null | undefined,
    activity: ActivityDefinition,
    scheduler: ResidentValidatorContext['scheduler'],
    slotRequirement: StatRequirement | undefined,
    residents: Record<string, ResidentState>,
    options?: { maxFatigueBeforeExhausted?: number }
): DropState {
    if (!residentId) return 'idle';

    const validation = validateResidentAssignment({
        residentId,
        activity,
        scheduler,
        slotRequirement,
        residents,
        maxFatigueBeforeExhausted: options?.maxFatigueBeforeExhausted,
    });

    return validation.success ? 'valid' : 'invalid';
}
