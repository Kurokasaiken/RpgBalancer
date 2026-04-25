import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import { evaluateActivityDuration, type VillageState } from '@/engine/game/idleVillage/TimeEngine';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import type { UseActivitySchedulerReturn } from './useActivityScheduler';
import {
    type AssignmentFailureReason,
    type AssignmentValidationResult,
    validateResidentAssignment,
} from '@/ui/idleVillage/slots/residentSlotValidators';
import { createSandboxDiagnostics, type ValidatorDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { SlotCompatibilityDiagnosticsEntry } from '@/ui/idleVillage/types/compatibility';
import { recordAssignmentInteractionEvent } from '@/ui/idleVillage/utils/workerPickerTelemetry';
<<<<<<< Updated upstream
import { deriveLocationDropState, type LocationDropState } from '@/ui/idleVillage/map/validators/locationDropValidators';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import type { DragErrorEvent, DragDropErrorCode } from '@/ui/idleVillage/hooks/useDragErrorRecovery';
=======
import { deriveLocationDropState, type LocationDropState } from '@/ui/idleVillage/hooks/locationDropValidators';
>>>>>>> Stashed changes

export type DropState = LocationDropState;

const IS_DEV_ENV = typeof import.meta !== 'undefined' && import.meta.env?.MODE !== 'production';
type DragOverrideState = string | null | undefined;
type ResidentStatus = 'available' | 'away' | 'exhausted' | 'injured' | 'dead';

const TEST_DRAG_OVERRIDE_EVENT = '__idleVillageTestDragOverrideEvent';

declare global {
    interface Window {
        __idleVillageTestDragOverride?: string | null;
    }
}

const readTestDragOverride = (): DragOverrideState => {
    if (typeof window === 'undefined') {
        return undefined;
    }
    const hasOverride = Object.prototype.hasOwnProperty.call(window, '__idleVillageTestDragOverride');
    if (!hasOverride) {
        return undefined;
    }
    return window.__idleVillageTestDragOverride ?? null;
};

const ASSIGNMENT_REASON_TO_ERROR_CODE: Record<AssignmentFailureReason, DragDropErrorCode> = {
    RESIDENT_NOT_FOUND: 'resident_not_found',
    RESIDENT_UNAVAILABLE: 'resident_unavailable',
    FATIGUE_THRESHOLD: 'fatigue_threshold',
    VALIDATION_FAILED: 'validation_failed',
    SCHEDULER_REJECTED: 'scheduler_rejection',
};

const ASSIGNMENT_REASON_TO_SOURCE: Record<AssignmentFailureReason, DragErrorEvent['source']> = {
    RESIDENT_NOT_FOUND: 'validation',
    RESIDENT_UNAVAILABLE: 'validation',
    FATIGUE_THRESHOLD: 'validation',
    VALIDATION_FAILED: 'validation',
    SCHEDULER_REJECTED: 'scheduler',
};

const mapAssignmentFailureToErrorCode = (reason: AssignmentFailureReason): DragDropErrorCode =>
    ASSIGNMENT_REASON_TO_ERROR_CODE[reason] ?? 'validation_failed';

const mapAssignmentFailureToSource = (reason: AssignmentFailureReason): DragErrorEvent['source'] =>
    ASSIGNMENT_REASON_TO_SOURCE[reason] ?? 'validation';

/**
 * Hook parameters for useSandboxDragController.
 */
interface UseSandboxDragControllerParams {
    villageState: VillageState;
    activityScheduler: UseActivitySchedulerReturn;
    secondsPerTimeUnit: number;
    slots: ActivitySlotData[];
    slotAssignments: Record<string, string | null>;
    setSlotAssignments: (assignments: Record<string, string | null>) => void;
    setAssignmentFeedback: (feedback: string | null, source?: string) => void;
    setIsCyclePlaying: (playing: boolean) => void;
    updateState: (updater: (prev: VillageState) => VillageState, message: string) => void;
    dragContext: { activeId: string | null; setActiveId: (id: string | null) => void };
    locationSlotIds: string[];
    maxFatigueBeforeExhausted?: number;
    isDayPhase: boolean;
    onDragError?: (event: DragErrorEvent) => void;
}

/**
 * Hook return type for useSandboxDragController.
 */
export interface UseSandboxDragControllerReturn {
    draggingResidentId: string | null;
    slotDropStates: Record<string, DropState>;
    handleWorkerDrop: (activityId: string, residentId: string | null, options?: { autoStart?: boolean }) => void;
    handleDragOver: (slotId: string) => void;
    handleLocationResidentDrop: (residentId: string, targetSlotId?: string) => void;
    locationDropState: DropState;
    startSlotActivity: (
        slotId: string,
        residentOverride?: string | null,
        options?: { pendingFeedback?: string | null },
    ) => boolean;
    setActiveId: (id: string | null) => void;
    canSlotAcceptDrop: (slotId: string) => boolean;
    replayLastAssignmentFeedback: () => void;
    getSlotCompatibilityDiagnostics: (slotId: string) => SlotCompatibilityDiagnosticsEntry[];
    /** Deterministic metadata for test hooks compatibility */
    metadata: {
        seed: string | null;
        phase: 'day' | 'night';
        virtualizationEnabled: boolean;
        residentStatus: Record<string, ResidentStatus>;
    };
}

const SLOT_DELIMITER = '-slot-';

/**
 * Helper to get primary slot id from activity id.
 */
function getPrimarySlotId(activityId: string): string {
    const index = activityId.indexOf(SLOT_DELIMITER);
    return index === -1 ? activityId : activityId.slice(0, index);
}

/**
 * Custom hook to centralize drag & drop logic for the Village Sandbox.
 * Manages slot drop states, worker drops, location interactions, and theater opening.
 *
 * @param params - The parameters required for drag controller logic.
 * @returns The drag controller API.
 */
export function useSandboxDragController({
    villageState,
    activityScheduler,
    secondsPerTimeUnit,
    slots,
    slotAssignments,
    setSlotAssignments,
    setAssignmentFeedback,
    setIsCyclePlaying,
    updateState,
    dragContext,
    locationSlotIds,
    maxFatigueBeforeExhausted,
    isDayPhase,
    onDragError,
}: UseSandboxDragControllerParams): UseSandboxDragControllerReturn {
    const sandboxDiagnostics = useMemo(
        () => createSandboxDiagnostics<ValidatorDiagnosticsPayload>('useSandboxDragController', 'drag-controller'),
        [],
    );
    const { activeId: draggingResidentId, setActiveId } = dragContext;
    const [testDraggingOverride, setTestDraggingOverride] = useState<DragOverrideState>(() => readTestDragOverride());
    const lastAssignmentFeedbackRef = useRef<string | null>(null);
    const [isTestMode, setIsTestMode] = useState(false);
    const [overrideUpdateCounter, setOverrideUpdateCounter] = useState(0);
    const reportDragError = useCallback(
        (event: Omit<DragErrorEvent, 'source'>, reason: AssignmentFailureReason) => {
            onDragError?.({
                ...event,
                source: mapAssignmentFailureToSource(reason),
                code: mapAssignmentFailureToErrorCode(reason),
                validationRule: reason === 'VALIDATION_FAILED' ? event.validationRule : undefined,
            });
        },
        [onDragError],
    );
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const checkTestMode = () => {
            const current = typeof window !== 'undefined' && Boolean(window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS);
            setIsTestMode(current);
        };
        checkTestMode();
        const intervalId = window.setInterval(checkTestMode, 100);
        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        
        // Direct state injection for tests - bypass event mechanism
        if (window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS) {
            (window as Window & { __setTestDraggingOverride?: (id: string | null) => void }).__setTestDraggingOverride = (id: string | null) => {
                // Update both React state AND window property for useMemo to read
                if (id === null) {
                    delete window.__idleVillageTestDragOverride;
                    setTestDraggingOverride(undefined);
                } else {
                    window.__idleVillageTestDragOverride = id;
                    setTestDraggingOverride(id);
                }
                setOverrideUpdateCounter(prev => prev + 1);
            };
        }
        
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as Window & { __setTestDraggingOverride?: (id: string | null) => void }).__setTestDraggingOverride;
            }
        };
    }, []);

    const clearTestDraggingOverride = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }
        if (Object.prototype.hasOwnProperty.call(window, '__idleVillageTestDragOverride')) {
            delete window.__idleVillageTestDragOverride;
            window.dispatchEvent(new CustomEvent(TEST_DRAG_OVERRIDE_EVENT));
        }
    }, []);

    const setActiveIdSafe = useCallback(
        (residentId: string | null) => {
            setActiveId(residentId);
            if (residentId === null) {
                clearTestDraggingOverride();
            }
        },
        [clearTestDraggingOverride, setActiveId],
    );

    const effectiveDraggingResidentId =
        testDraggingOverride !== undefined ? testDraggingOverride : draggingResidentId;

    const reportAssignmentFeedback = useCallback(
        (message: string | null, source: string) => {
            lastAssignmentFeedbackRef.current = message;
            setAssignmentFeedback(message, source);
        },
        [setAssignmentFeedback],
    );

    const slotMap = useMemo(
        () =>
            slots.reduce<Record<string, ActivitySlotData>>((acc, slot) => {
                acc[slot.slotId] = slot;
                return acc;
            }, {}),
        [slots],
    );

    const playableSlots = useMemo(
        () => slots.filter((slot) => slot.slotId !== 'day-night-cycle'),
        [slots],
    );

    const playableSlotMap = useMemo(() => {
        return playableSlots.reduce<Record<string, ActivitySlotData>>((acc, slot) => {
            acc[slot.slotId] = slot;
            return acc;
        }, {});
    }, [playableSlots]);
    const previousSlotDropStatesRef = useRef<Record<string, DropState>>({});
    const previousLocationDropStateRef = useRef<DropState>('idle');

    /**
     * Resolves assignment validation metadata for a given resident/slot combination.
     */
    const evaluateAssignmentForSlot = useCallback(
        (residentId: string, slotId: string): { slot: ActivitySlotData | null; validation: AssignmentValidationResult } => {
            const normalizedSlotId = getPrimarySlotId(slotId);
            const slot = playableSlotMap[normalizedSlotId] ?? playableSlotMap[slotId] ?? null;
            if (!slot) {
                return {
                    slot: null,
                    validation: {
                        success: false,
                        reason: 'VALIDATION_FAILED',
                        details: 'Attività non trovata.',
                    },
                };
            }
            const validation = validateResidentAssignment({
                residentId,
                activity: slot.activity,
                scheduler: {
                    canAssignResident: (resId: string) => activityScheduler.canAssignResident(resId, slot.slotId),
                },
                slotRequirement: slot.activity.statRequirement,
                residents: villageState.residents,
                maxFatigueBeforeExhausted: maxFatigueBeforeExhausted,
            });
            return { slot, validation };
        },
        [activityScheduler, playableSlotMap, villageState.residents, maxFatigueBeforeExhausted],
    );

    const buildValidationFailureMessage = useCallback(
        (
            result: AssignmentValidationResult,
            residentLabel: string | null,
            activityLabel: string,
        ): string => {
            const label = residentLabel ?? 'Il residente';
            if (result.success) {
                return `${label} non può essere assegnato a ${activityLabel}.`;
            }
            switch (result.reason) {
                case 'RESIDENT_NOT_FOUND':
                    return 'Residente non trovato.';
                case 'RESIDENT_UNAVAILABLE':
                    return `${label} non è disponibile.`;
                case 'FATIGUE_THRESHOLD':
                    return `${label} è troppo stanco${result.details ? ` (${result.details})` : ''}.`;
                case 'VALIDATION_FAILED':
                    return result.details
                        ? `${label} non soddisfa i requisiti: ${result.details}`
                        : `${label} non soddisfa i requisiti.`;
                case 'SCHEDULER_REJECTED':
                    return result.details
                        ? `${label} non può essere assegnato a ${activityLabel}: ${result.details}`
                        : `${label} non può essere assegnato a ${activityLabel}.`;
                default:
                    return `${label} non può essere assegnato a ${activityLabel}.`;
            }
        },
        [],
    );

    const [dragOverStates, setDragOverStates] = useState<Record<string, DropState>>({});

    // Slot drop states
    const slotDropStates = useMemo<Record<string, DropState>>(() => {
        if (!effectiveDraggingResidentId) {
            return {};
        }

        const states = playableSlots.reduce<Record<string, DropState>>((acc, slot) => {
            if (slot.assignedWorkerId === effectiveDraggingResidentId) {
                acc[slot.slotId] = 'idle';
                return acc;
            }

            const { validation } = evaluateAssignmentForSlot(effectiveDraggingResidentId, slot.slotId);
            acc[slot.slotId] = validation.success ? 'valid' : 'invalid';
            return acc;
        }, {});

        return { ...states, ...dragOverStates };
    }, [effectiveDraggingResidentId, evaluateAssignmentForSlot, playableSlots, dragOverStates]);

    const handleDragOver = useCallback((slotId: string) => {
        const currentId = effectiveDraggingResidentId;
        if (!currentId) {
            return;
        }
        const canAssign = activityScheduler.canAssignResident(currentId, slotId);
        setDragOverStates(prev => ({ ...prev, [slotId]: canAssign ? 'valid' : 'invalid' }));
    }, [activityScheduler, effectiveDraggingResidentId, setDragOverStates]);

    // Location drop state
    const locationDropState = useMemo<DropState>(() => {
        // Read test override directly from window to ensure we always have the latest value
        const currentTestOverride = readTestDragOverride();
        const effectiveResidentId = currentTestOverride !== undefined ? currentTestOverride : draggingResidentId;
        const result = deriveLocationDropState({
            residentId: effectiveResidentId ?? null,
            slotIds: locationSlotIds,
            slots: slotMap,
            slotAssignments,
            residents: villageState.residents,
            scheduler: activityScheduler
                ? { canAssignResident: (residentId, slotId) => activityScheduler.canAssignResident(residentId, slotId) }
                : undefined,
            maxFatigueBeforeExhausted,
            isDayPhase,
        });

        // Log validator diagnostics (always log in test mode to debug)
        if (isTestMode) {
            sandboxDiagnostics.info('location_drop_state_calculated', {
                residentId: effectiveResidentId,
                testDraggingOverride,
                draggingResidentId,
                result,
                slotIds: locationSlotIds,
                slotIdsLength: locationSlotIds.length,
                isDayPhase,
                maxFatigueBeforeExhausted,
                hasScheduler: !!activityScheduler,
                seed: (window as Window & { __TEST_SEED?: number }).__TEST_SEED || null,
                phase: isDayPhase ? 'day' : 'night',
            } as Record<string, unknown>);
        }

        return result;
    }, [
        activityScheduler,
        testDraggingOverride,
        draggingResidentId,
        isDayPhase,
        isTestMode,
        locationSlotIds,
        maxFatigueBeforeExhausted,
        slotAssignments,
        slotMap,
        villageState.residents,
        sandboxDiagnostics,
        overrideUpdateCounter,
    ]);

    // Start slot activity
    const startSlotActivity = useCallback(
        (slotId: string, residentOverride?: string | null, options?: { pendingFeedback?: string | null }) => {
            const primarySlotId = getPrimarySlotId(slotId);
            const slotAssignmentKey = Object.prototype.hasOwnProperty.call(slotAssignments, primarySlotId)
                ? primarySlotId
                : slotId;

            let effectiveAssignments = slotAssignments;
            if (residentOverride && slotAssignments[slotAssignmentKey] !== residentOverride) {
                const nextAssignments: Record<string, string | null> = {};
                Object.entries(slotAssignments).forEach(([key, current]) => {
                    nextAssignments[key] = current === residentOverride ? null : current;
                });
                nextAssignments[slotAssignmentKey] = residentOverride;
                setSlotAssignments(nextAssignments);
                effectiveAssignments = nextAssignments;
            }

            const assignedResidentId = residentOverride ?? effectiveAssignments[slotAssignmentKey] ?? null;
            if (!assignedResidentId) {
                reportAssignmentFeedback('Assegna un residente prima di iniziare l\'attività.', 'startSlotActivity:missingResident');
                return false;
            }
            const residentName = assignedResidentId ? formatResidentLabel(villageState.residents[assignedResidentId]) : null;
            if (!residentName) {
                reportAssignmentFeedback('Assegna un residente prima di iniziare l\'attività.', 'startSlotActivity:missingResidentName');
                return false;
            }
            const slot = playableSlotMap[primarySlotId] ?? playableSlotMap[slotId];
            const activity = slot?.activity;
            const durationUnits = activity ? evaluateActivityDuration(activity) : 0;
            const duration = durationUnits > 0 ? durationUnits * secondsPerTimeUnit : 90;
            const success = activityScheduler.startActivity(slotAssignmentKey, assignedResidentId, duration);
            if (success) {
                const defaultMessage = `${residentName} assegnato a ${activity?.label ?? slotId}.`;
                const previousFeedback = lastAssignmentFeedbackRef.current;
                const resolvedMessage = options?.pendingFeedback ?? previousFeedback ?? defaultMessage;
                reportAssignmentFeedback(resolvedMessage, 'startSlotActivity:success');
                setIsCyclePlaying(true);
                return true;
            }
            if (IS_DEV_ENV) {
                const diagnostics = activityScheduler.getAssignmentDiagnostics?.();
                if (diagnostics) {
                    sandboxDiagnostics.warn('[startSlotActivity] scheduler diagnostics', diagnostics as unknown as Record<string, unknown>);
                }
            }
            reportAssignmentFeedback(`Impossibile iniziare ${activity?.label ?? slotId}.`, 'startSlotActivity:failure');
            return false;
        },
        [
            slotAssignments,
            setSlotAssignments,
            activityScheduler,
            villageState.residents,
            secondsPerTimeUnit,
            reportAssignmentFeedback,
            playableSlotMap,
            setIsCyclePlaying,
            sandboxDiagnostics,
        ],
    );

    // Handle worker drop
    const handleWorkerDrop = useCallback(
        (activityId: string, residentId: string | null, options?: { autoStart?: boolean }) => {
            const isTestMode = typeof window !== 'undefined' && window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS;
            const autoStart = options?.autoStart ?? !isTestMode;
            const primarySlotId = getPrimarySlotId(activityId);
            const baseSlot = playableSlotMap[primarySlotId] ?? playableSlotMap[activityId] ?? null;
            const baseActivityLabel = baseSlot?.activity.label ?? primarySlotId;

            // Log worker drop start
            sandboxDiagnostics.info('handleWorkerDrop', {
                activityId,
                residentId,
                primarySlotId,
                autoStart,
                timestamp: Date.now(),
                location: 'useSandboxDragController',
                payload: {
                    activityId,
                    residentId,
                    primarySlotId,
                    autoStart,
                    isTestMode,
                },
            }, ['drag', 'drop', 'worker']);

            if (!residentId) {
                // Unassign resident - set their status back to available
                const currentAssignedId = slotAssignments[primarySlotId];
                if (currentAssignedId) {
                    updateState((prev: VillageState) => ({
                        ...prev,
                        residents: {
                            ...prev.residents,
                            [currentAssignedId]: {
                                ...prev.residents[currentAssignedId],
                                status: 'available' as const,
                            },
                        },
                    }), 'Unassigned resident from slot');
                }

                const nextAssignments = { ...slotAssignments };
                nextAssignments[primarySlotId] = null;
                setSlotAssignments(nextAssignments);
                reportAssignmentFeedback(`Slot ${baseActivityLabel} liberato.`, 'handleWorkerDrop:unassign');
                setActiveId(null);
                return;
            }

            const { slot: resolvedSlot, validation } = evaluateAssignmentForSlot(residentId, primarySlotId);
            if (!validation.success) {
                const residentLabel = formatResidentLabel(villageState.residents[residentId]);
                const activityLabel = resolvedSlot?.activity.label ?? primarySlotId;
                reportAssignmentFeedback(
                    buildValidationFailureMessage(validation, residentLabel, activityLabel),
                    'handleWorkerDrop:invalid',
                );
                reportDragError(
                    {
                        residentId,
                        activityId: primarySlotId,
                        message: buildValidationFailureMessage(validation, residentLabel, activityLabel),
                        context: { validationDetails: (validation as AssignmentValidationResult & { validationDetails?: unknown }).validationDetails },
                    },
                    (validation as AssignmentValidationResult & { reason: AssignmentFailureReason }).reason,
                );
                return;
            }

            const slotData = resolvedSlot ?? playableSlotMap[primarySlotId];
            const activity = slotData?.activity;

            const nextAssignments: Record<string, string | null> = {};
            Object.entries(slotAssignments).forEach(([slotId, current]) => {
                nextAssignments[slotId] = current === residentId ? null : current;
            });
            nextAssignments[primarySlotId] = residentId;
            setSlotAssignments(nextAssignments);

            recordAssignmentInteractionEvent({
                method: 'drag',
                slotId: primarySlotId,
                residentId,
                timestamp: Date.now(),
            });

            const residentLabel = formatResidentLabel(villageState.residents[residentId]);
            const activityLabel = activity?.label ?? baseActivityLabel;
            const setResidentAway = () =>
                updateState((prev: VillageState) => ({
                    ...prev,
                    residents: {
                        ...prev.residents,
                        [residentId]: {
                            ...prev.residents[residentId],
                            status: 'away' as const,
                        },
                    },
                }), 'Assigned resident to slot, status set to away');

            if (autoStart) {
                const assignmentMessage = `${residentLabel} assegnato a ${activityLabel}.`;
                const started = startSlotActivity(primarySlotId, residentId, { pendingFeedback: assignmentMessage });
                if (started) {
                    void setResidentAway();
                    setIsCyclePlaying(true);
                }
            } else {
                void setResidentAway();
                reportAssignmentFeedback(
                    `${residentLabel} è pronto per ${activityLabel}. Premi Start per avviare.`,
                    'handleWorkerDrop:queued',
                );
            }

            setActiveIdSafe(null);
        },
        [
            villageState.residents,
            startSlotActivity,
            setActiveIdSafe,
            reportAssignmentFeedback,
            setSlotAssignments,
            setIsCyclePlaying,
            updateState,
            slotAssignments,
            playableSlotMap,
            evaluateAssignmentForSlot,
            buildValidationFailureMessage,
            setActiveId,
            sandboxDiagnostics,
            reportDragError,
        ],
    );

    // Handle location resident drop - ONLY assign when dropped on specific slot
    const handleLocationResidentDrop = useCallback(
        (residentId: string, targetSlotId?: string) => {
            // Log location resident drop start
            sandboxDiagnostics.info('handleLocationResidentDrop', {
                residentId,
                targetSlotId,
                locationSlotIds,
                timestamp: Date.now(),
                location: 'useSandboxDragController',
                payload: {
                    residentId,
                    targetSlotId,
                    locationSlotIds,
                },
            }, ['drag', 'drop', 'location']);

            // If no specific target slot provided, this is a drop on empty area
            // Do NOT automatically find a compatible slot
            if (!targetSlotId) {
                sandboxDiagnostics.info('handleLocationResidentDrop:noTargetSlot', {
                    residentId,
                    locationSlotIds,
                    timestamp: Date.now(),
                    location: 'useSandboxDragController',
                    payload: {
                        residentId,
                        locationSlotIds,
                        reason: 'no_specific_target_slot',
                    },
                }, ['drag', 'drop', 'location']);
                
                reportAssignmentFeedback('Trascina il residente su uno slot specifico per assegnarlo.', 'handleLocationResidentDrop:noTargetSlot');
                return;
            }

            // Verify the target slot exists and is in the current location
            if (!locationSlotIds.includes(targetSlotId)) {
                sandboxDiagnostics.warn('handleLocationResidentDrop:invalidTarget', {
                    residentId,
                    targetSlotId,
                    locationSlotIds,
                    timestamp: Date.now(),
                    location: 'useSandboxDragController',
                    payload: {
                        residentId,
                        targetSlotId,
                        locationSlotIds,
                        reason: 'target_slot_not_in_location',
                    },
                }, ['drag', 'drop', 'location', 'warning']);
                
                reportAssignmentFeedback('Slot non valido in questa posizione.', 'handleLocationResidentDrop:invalidTarget');
                reportDragError(
                    {
                        residentId,
                        message: 'Slot non valido in questa posizione.',
                        context: { targetSlotId, locationSlotIds, reason: 'target_slot_not_in_location' },
                    },
                    'VALIDATION_FAILED',
                );
                return;
            }

            // Validate the specific target slot
            const validation = evaluateAssignmentForSlot(residentId, targetSlotId);
            if (!validation.validation.success) {
                sandboxDiagnostics.warn('handleLocationResidentDrop:validationFailed', {
                    residentId,
                    targetSlotId,
                    validation,
                    timestamp: Date.now(),
                    location: 'useSandboxDragController',
                    payload: {
                        residentId,
                        targetSlotId,
                        reason: validation.validation.reason,
                        details: validation.validation.details,
                    },
                }, ['drag', 'drop', 'location', 'warning']);
                
                reportAssignmentFeedback(
                    validation.validation.details ?? 'Residente non compatibile con questo slot.',
                    'handleLocationResidentDrop:validationFailed'
                );
                reportDragError(
                    {
                        residentId,
                        message: validation.validation.details ?? 'Residente non compatibile con questo slot.',
                        context: { targetSlotId, reason: validation.validation.reason },
                    },
                    validation.validation.reason,
                );
                return;
            }

            // Assign to the specific target slot
            handleWorkerDrop(targetSlotId, residentId);
        },
        [evaluateAssignmentForSlot, handleWorkerDrop, locationSlotIds, reportAssignmentFeedback, sandboxDiagnostics, reportDragError],
    );

    // Can slot accept drop
    const canSlotAcceptDrop = useCallback(
        (slotId: string): boolean => {
            if (!effectiveDraggingResidentId) return false;
            const result = evaluateAssignmentForSlot(effectiveDraggingResidentId, slotId);
            return result.validation.success;
        },
        [effectiveDraggingResidentId, evaluateAssignmentForSlot],
    );

    const replayLastAssignmentFeedback = useCallback(() => {
        if (!lastAssignmentFeedbackRef.current) {
            return;
        }
        setAssignmentFeedback(lastAssignmentFeedbackRef.current, 'replayAssignmentFeedback');
    }, [setAssignmentFeedback]);

    const getSlotCompatibilityDiagnostics = useCallback(
        (slotId: string): SlotCompatibilityDiagnosticsEntry[] => {
            const residentEntries = Object.keys(villageState.residents ?? {});
            if (residentEntries.length === 0) {
                return [];
            }
            const entries = residentEntries.map<SlotCompatibilityDiagnosticsEntry>((residentId) => {
                const { validation } = evaluateAssignmentForSlot(residentId, slotId);
                if (validation.success) {
                    return {
                        residentId,
                        reason: 'valid',
                        score: 1,
                        details: null,
                    };
                }
                return {
                    residentId,
                    reason: (validation as AssignmentValidationResult & { reason: AssignmentFailureReason }).reason,
                    score: 0,
                    details: (validation as AssignmentValidationResult & { details?: string }).details ?? null,
                };
            });
            return entries.sort((a, b) => b.score - a.score);
        },
        [evaluateAssignmentForSlot, villageState.residents],
    );

    useEffect(() => {
        const previousSlotStates = previousSlotDropStatesRef.current;
        const previousLocationState = previousLocationDropStateRef.current;
        const slotStatesChanged =
            Object.keys(previousSlotStates).length !== Object.keys(slotDropStates).length ||
            Object.entries(slotDropStates).some(([slotId, state]) => previousSlotStates[slotId] !== state);
        const locationChanged = previousLocationState !== locationDropState;
        if (isTestMode && (slotStatesChanged || locationChanged)) {
            sandboxDiagnostics.info('drop_state_update', {
                draggingResidentId: effectiveDraggingResidentId ?? null,
                slotDropStates,
                locationDropState,
                seed: (window as Window & { __TEST_SEED?: number }).__TEST_SEED || null,
                phase: isDayPhase ? 'day' : 'night',
            } as Record<string, unknown>);
        }
        previousSlotDropStatesRef.current = slotDropStates;
        previousLocationDropStateRef.current = locationDropState;
    }, [slotDropStates, locationDropState, effectiveDraggingResidentId, sandboxDiagnostics, isDayPhase, isTestMode]);

    /**
<<<<<<< Updated upstream
     * Deterministic metadata for test hooks compatibility and component exposure
     */
    const metadata = useMemo(() => {
        const dragConfig = getCurrentDragConfig();
        return {
            seed: (typeof window !== 'undefined' && (window as Window & { __TEST_SEED?: number }).__TEST_SEED?.toString()) || null,
            phase: isDayPhase ? ('day' as const) : ('night' as const),
            virtualizationEnabled: slots.length > dragConfig.thresholds.virtualizationThreshold,
            residentStatus: Object.fromEntries(
                Object.entries(villageState.residents).map(([id, resident]) => [id, resident.status])
            ),
        };
    }, [isDayPhase, slots.length, villageState.residents]);

    // Log deterministic metadata on mount and when dependencies change
    useEffect(() => {
        const dragConfig = getCurrentDragConfig();
        sandboxDiagnostics.info('metadata_updated', {
            metadata,
            timestamp: Date.now(),
            location: 'useSandboxDragController',
            payload: {
                seed: metadata.seed,
                phase: metadata.phase,
                virtualizationEnabled: metadata.virtualizationEnabled,
                residentCount: Object.keys(metadata.residentStatus).length,
                dragConfigThresholds: dragConfig.thresholds,
            },
        }, ['drag', 'metadata']);
    }, [metadata, sandboxDiagnostics]);
=======
     * Deterministic metadata for test hooks compatibility
     */
    const metadata = useMemo(() => ({
        seed: (typeof window !== 'undefined' && (window as any).__TEST_SEED) || null,
        phase: isDayPhase ? 'day' : 'night',
        virtualizationEnabled: slots.length > 30,
        residentStatus: Object.fromEntries(
            Object.entries(villageState.residents).map(([id, resident]) => [id, resident.status])
        ),
    }), [isDayPhase, slots.length, villageState.residents]);
>>>>>>> Stashed changes

    return {
        draggingResidentId,
        slotDropStates,
        handleWorkerDrop,
        handleDragOver,
        handleLocationResidentDrop,
        locationDropState,
        startSlotActivity,
        setActiveId,
        canSlotAcceptDrop,
        replayLastAssignmentFeedback,
        getSlotCompatibilityDiagnostics,
        metadata,
    };
};
