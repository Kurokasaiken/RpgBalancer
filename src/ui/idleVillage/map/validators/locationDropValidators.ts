import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import { validateResidentAssignment } from '@/ui/idleVillage/slots/residentSlotValidators';
import { resolveMaxCrewSize } from '@/ui/idleVillage/drag/resolveSlotRequirements';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';

type SchedulerAdapter = {
    canAssignResident?: (residentId: string, slotId: string) => boolean;
} | null;

/**
 * Visual states supported by {@link LocationCard} while a drag interaction is active.
 */
export type LocationDropState = 'idle' | 'valid' | 'invalid' | 'locked';
export type DropRejectionReason =
    | 'night_phase'
    | 'missing_resident'
    | 'slot_locked'
    | 'stat_requirement_allOf'
    | 'stat_requirement_anyOf'
    | 'stat_requirement_noneOf'
    | 'fatigue_threshold'
    | 'crew_capacity'
    | 'scheduler_rejected';

export interface DropValidationMeta {
    slotId?: string;
    activityId?: string;
    missingAllOf?: string[];
    missingAnyOf?: string[];
    blockedTags?: string[];
    fatigue?: {
        current: number;
        threshold: number;
    };
    crew?: {
        capacity: number;
        occupied: number;
    };
}

export interface LocationDropAnalysis {
    state: LocationDropState;
    reason: DropRejectionReason | null;
    meta?: DropValidationMeta;
}

/**
 * Input contract required to evaluate whether the location accepts the current drag payload.
 */
export interface LocationDropValidationParams {
    residentId: string | null;
    slotIds: readonly string[];
    slots: Record<string, ActivitySlotData>;
    slotAssignments: Record<string, string | null>;
    residents: Record<string, ResidentState>;
    scheduler?: SchedulerAdapter;
    maxFatigueBeforeExhausted?: number;
    isDayPhase: boolean;
}

/**
 * Returns the drop analysis consumed by the LocationCard bloom. Mirrors the assignment rules
 * enforced by {@link validateResidentAssignment} and crew capacity while surfacing rejection metadata.
 */
export function deriveLocationDropAnalysis(params: LocationDropValidationParams): LocationDropAnalysis {
    const {
        residentId,
        slotIds,
        slots,
        slotAssignments,
        residents,
        scheduler,
        maxFatigueBeforeExhausted,
        isDayPhase,
    } = params;
    if (!isDayPhase) {
        return { state: 'locked', reason: 'night_phase' };
    }
    if (!residentId) {
        return { state: 'idle', reason: null };
    }
    if (!slotIds || slotIds.length === 0) {
        return {
            state: 'invalid',
            reason: 'slot_locked',
        };
    }

    for (const slotId of slotIds) {
        const validation = evaluateSlot({
            slotId,
            residentId,
            slots,
            slotAssignments,
            residents,
            scheduler,
            maxFatigueBeforeExhausted,
        });
        if (validation.state === 'valid') {
            return validation;
        }
    }

    return evaluateSlot({
        slotId: slotIds[0],
        residentId,
        slots,
        slotAssignments,
        residents,
        scheduler,
        maxFatigueBeforeExhausted,
    });
}

export function deriveLocationDropState(params: LocationDropValidationParams): LocationDropState {
    return deriveLocationDropAnalysis(params).state;
}

interface SlotValidationContext extends Omit<LocationDropValidationParams, 'slotIds' | 'isDayPhase'> {
    slotId: string;
}

function evaluateSlot(context: SlotValidationContext): LocationDropAnalysis {
    const { slotId, residentId, slots, slotAssignments, residents, scheduler, maxFatigueBeforeExhausted } = context;
    if (!residentId) {
        return { state: 'idle', reason: null };
    }
    const slot = slots[slotId];
    if (!slot || !slot.activity) {
        return { state: 'invalid', reason: 'slot_locked' };
    }

    const resident = residents[residentId];
    if (!resident) {
        return { state: 'invalid', reason: 'missing_resident' };
    }

    const assignmentResult = validateResidentAssignment({
        residentId,
        activity: slot.activity,
        scheduler: scheduler ?? undefined,
        slotRequirement: slot.activity.statRequirement,
        residents,
        maxFatigueBeforeExhausted,
    });

    if (!assignmentResult.success) {
        return buildFailureAnalysis(slotId, slot.activity.id, assignmentResult.reason, {
            resident,
            requirement: slot.activity.statRequirement,
            maxFatigueBeforeExhausted,
        });
    }

    const capacity = resolveMaxCrewSize(slot.activity);
    if (capacity <= 0) {
        return {
            state: 'invalid',
            reason: 'crew_capacity',
            meta: { slotId, activityId: slot.activity.id, crew: { capacity: 0, occupied: 0 } },
        };
    }

    const assignedCount = countAssignedResidentsForSlot(slotId, slotAssignments, residentId);
    if (assignedCount >= capacity) {
        return {
            state: 'invalid',
            reason: 'crew_capacity',
            meta: { slotId, activityId: slot.activity.id, crew: { capacity, occupied: assignedCount } },
        };
    }

    return { state: 'valid', reason: null, meta: { slotId, activityId: slot.activity.id } };
}

type AssignmentFailureReason =
    | 'RESIDENT_NOT_FOUND'
    | 'RESIDENT_UNAVAILABLE'
    | 'FATIGUE_THRESHOLD'
    | 'VALIDATION_FAILED'
    | 'SCHEDULER_REJECTED';

function buildFailureAnalysis(
    slotId: string,
    activityId: string,
    reason: AssignmentFailureReason,
    options: { resident: ResidentState; requirement?: ActivitySlotData['activity']['statRequirement']; maxFatigueBeforeExhausted?: number },
): LocationDropAnalysis {
    if (reason === 'FATIGUE_THRESHOLD') {
        const threshold = Number.isFinite(options.maxFatigueBeforeExhausted)
            ? (options.maxFatigueBeforeExhausted as number)
            : options.resident.fatigue;
        return {
            state: 'invalid',
            reason: 'fatigue_threshold',
            meta: {
                slotId,
                activityId,
                fatigue: {
                    current: options.resident.fatigue ?? 0,
                    threshold,
                },
            },
        };
    }

    if (reason === 'SCHEDULER_REJECTED') {
        return {
            state: 'invalid',
            reason: 'scheduler_rejected',
            meta: {
                slotId,
                activityId,
            },
        };
    }

    if (reason === 'VALIDATION_FAILED' && options.requirement) {
        const matchResult = evaluateStatRequirement(options.resident, options.requirement);
        if (matchResult.missingAllOf.length > 0) {
            return {
                state: 'invalid',
                reason: 'stat_requirement_allOf',
                meta: {
                    slotId,
                    activityId,
                    missingAllOf: matchResult.missingAllOf,
                },
            };
        }
        if (!matchResult.anyOfMatched && (options.requirement.anyOf?.length ?? 0) > 0) {
            return {
                state: 'invalid',
                reason: 'stat_requirement_anyOf',
                meta: {
                    slotId,
                    activityId,
                    missingAnyOf: options.requirement.anyOf,
                },
            };
        }
        if (matchResult.blockedBy.length > 0) {
            return {
                state: 'invalid',
                reason: 'stat_requirement_noneOf',
                meta: {
                    slotId,
                    activityId,
                    blockedTags: matchResult.blockedBy,
                },
            };
        }
    }

    if (reason === 'RESIDENT_NOT_FOUND') {
        return { state: 'invalid', reason: 'missing_resident' };
    }

    return {
        state: 'invalid',
        reason: 'slot_locked',
        meta: {
            slotId,
            activityId,
        },
    };
}

function getPrimarySlotId(slotId: string): string {
    const marker = '-slot-';
    const markerIndex = slotId.indexOf(marker);
    if (markerIndex === -1) {
        return slotId;
    }
    return slotId.slice(0, markerIndex);
}

function countAssignedResidentsForSlot(
    slotId: string,
    slotAssignments: Record<string, string | null>,
    ignoredResidentId?: string | null,
): number {
    const normalizedTarget = getPrimarySlotId(slotId);
    return Object.entries(slotAssignments).reduce((count, [assignedSlotId, assignedResidentId]) => {
        if (!assignedResidentId || (ignoredResidentId && assignedResidentId === ignoredResidentId)) {
            return count;
        }
        const normalizedAssignedSlot = getPrimarySlotId(assignedSlotId);
        if (normalizedAssignedSlot !== normalizedTarget) {
            return count;
        }
        return count + 1;
    }, 0);
}
