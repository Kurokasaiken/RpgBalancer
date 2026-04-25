/**
 * Permitted drop states shared between slot validators and map UI.
 */
export type LocationDropState = 'idle' | 'valid' | 'invalid';

/**
 * Adapter used by validators so they can depend exclusively on `canAssignResident`.
 */
export interface LocationDropScheduler {
    canAssignResident?: (residentId: string, slotId: string) => boolean;
}

/**
 * Resolves whether a resident can be dropped onto the provided slot id.
 */
export function validateLocationDropIntent(
    slotId: string | null | undefined,
    residentId: string | null | undefined,
    scheduler?: LocationDropScheduler | null,
): LocationDropState {
    if (!residentId || !slotId) {
        return 'idle';
    }

    if (!scheduler?.canAssignResident) {
        return 'invalid';
    }

    return scheduler.canAssignResident(residentId, slotId) ? 'valid' : 'invalid';
}

/**
 * Aggregates the drop state for a list of location slots, matching the LocationCard bloom logic.
 */
export function deriveLocationDropState(
    slotIds: readonly string[] | null | undefined,
    residentId: string | null | undefined,
    scheduler?: LocationDropScheduler | null,
): LocationDropState {
    if (!residentId) {
        return 'idle';
    }
    if (!slotIds || slotIds.length === 0) {
        return 'invalid';
    }
    return slotIds.some((slotId) => validateLocationDropIntent(slotId, residentId, scheduler) === 'valid')
        ? 'valid'
        : 'invalid';
}

/**
 * Helper used by drag controllers to find the first slot that would accept the resident.
 */
export function findAcceptingLocationSlotId(
    slotIds: readonly string[],
    residentId: string | null | undefined,
    scheduler?: LocationDropScheduler | null,
): string | null {
    if (!residentId) {
        return null;
    }
    for (const slotId of slotIds) {
        if (validateLocationDropIntent(slotId, residentId, scheduler) === 'valid') {
            return slotId;
        }
    }
    return null;
}
