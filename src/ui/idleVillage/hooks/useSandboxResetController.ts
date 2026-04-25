import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { createEmptySlotAssignmentMap } from './useSandboxSlotModels';

/**
 * Optional subset of the demo panel handlers used for reset operations.
 */
export interface DemoPanelResetApi {
    /** Clears all demo assignments when the sandbox reset is triggered. */
    onRemoveAll?: () => void;
}

/**
 * Parameters accepted by {@link useSandboxResetController}.
 */
export interface UseSandboxResetControllerOptions {
    /** Clock-level reset helper coming from {@link useSandboxClock}. */
    clockReset: () => Promise<VillageState>;
    /** Managed activities managed by the sandbox board. */
    managedActivities: ActivityDefinition[];
    /** Setter for slot assignments derived from {@link useSandboxSlotModels}. */
    setSlotAssignments: (updater: SetStateAction<Record<string, string | null>>) => void;
    /** Setter that controls the selected resident card. */
    setSelectedResidentId: Dispatch<SetStateAction<string | null>>;
    /** Async VillageState updater sourced from the persistence store. */
    updateState: (updater: (prev: VillageState) => VillageState, description?: string) => void;
    /** Feedback setter used by the roster panel. */
    setAssignmentFeedback: (message: string | null) => void;
    /** Callback that closes the theater overlay. */
    closeTheater: () => void;
    /** Optional demo panel handlers (only `onRemoveAll` is used). */
    demoPanelResetApi?: DemoPanelResetApi;
}

/**
 * Return signature of {@link useSandboxResetController}.
 */
export interface UseSandboxResetControllerReturn {
    /** Ordered list of slot ids with an open detail panel. */
    detailPanelSlotIds: string[];
    /** Setter exposed for advanced controls/tests. */
    setDetailPanelSlotIds: Dispatch<SetStateAction<string[]>>;
    /** Opens (or toggles) a specific detail panel slot. */
    openDetailPanel: (slotId: string) => void;
    /** Closes a specific detail panel slot. */
    closeDetailPanel: (slotId: string) => void;
    /** Hover helper that schedules an automatic open after a delay. */
    handleSlotResidentDragEnter: (slotId: string, residentId: string | null) => void;
    /** Cancels any pending open timer on hover leave. */
    handleSlotResidentDragLeave: () => void;
    /** Resets the entire sandbox state (clock + assignments + UI). */
    handleResetSandboxState: () => Promise<void>;
    /** Marks every resident as available and surfaces feedback. */
    handleResetResidents: () => Promise<void>;
}

/**
 * Central controller for sandbox reset routines and detail panel orchestration.
 * By colocating these helpers we keep {@link useMapContext} focused on data wiring
 * while ensuring resets always clear every dependent surface (assignments, demo panel,
 * theater overlay, resident selection, etc.).
 */
export function useSandboxResetController({
    clockReset,
    managedActivities,
    setSlotAssignments,
    setSelectedResidentId,
    updateState,
    setAssignmentFeedback,
    closeTheater,
    demoPanelResetApi,
}: UseSandboxResetControllerOptions): UseSandboxResetControllerReturn {
    const [detailPanelSlotIds, setDetailPanelSlotIds] = useState<string[]>([]);
    const detailOpenTimerRef = useRef<NodeJS.Timeout | null>(null);

    const openDetailPanel = useCallback((slotId: string) => {
        setDetailPanelSlotIds((prev) => {
            if (prev.includes(slotId)) {
                return [...prev.filter((id) => id !== slotId), slotId];
            }
            return [...prev, slotId];
        });
    }, []);

    const closeDetailPanel = useCallback((slotId: string) => {
        setDetailPanelSlotIds((prev) => prev.filter((id) => id !== slotId));
    }, []);

    const handleSlotResidentDragEnter = useCallback(
        (slotId: string, residentId: string | null) => {
            if (!residentId || detailPanelSlotIds.includes(slotId)) {
                return;
            }
            if (detailOpenTimerRef.current) {
                globalThis.clearTimeout(detailOpenTimerRef.current);
                detailOpenTimerRef.current = null;
            }
            detailOpenTimerRef.current = globalThis.setTimeout(() => {
                openDetailPanel(slotId);
                detailOpenTimerRef.current = null;
            }, 600);
        },
        [detailPanelSlotIds, openDetailPanel],
    );

    const handleSlotResidentDragLeave = useCallback(() => {
        if (detailOpenTimerRef.current) {
            globalThis.clearTimeout(detailOpenTimerRef.current);
            detailOpenTimerRef.current = null;
        }
    }, []);

    useEffect(
        () => () => {
            if (detailOpenTimerRef.current) {
                globalThis.clearTimeout(detailOpenTimerRef.current);
                detailOpenTimerRef.current = null;
            }
        },
        [],
    );

    const handleResetSandboxState = useCallback(async () => {
        await clockReset();
        setSlotAssignments(() => createEmptySlotAssignmentMap(managedActivities));
        setSelectedResidentId(null);
        setDetailPanelSlotIds([]);
        closeTheater();
        demoPanelResetApi?.onRemoveAll?.();
        setAssignmentFeedback('Sandbox resettato: roster e attività riportati allo stato iniziale.');
    }, [
        clockReset,
        closeTheater,
        demoPanelResetApi,
        managedActivities,
        setAssignmentFeedback,
        setSelectedResidentId,
        setSlotAssignments,
    ]);

    const handleResetResidents = useCallback(async () => {
        await updateState(
            (prev: VillageState) => ({
                ...prev,
                residents: Object.fromEntries(
                    Object.entries(prev.residents).map(([id, resident]) => [
                        id,
                        {
                            ...resident,
                            status: 'available' as const,
                        },
                    ]),
                ),
            }),
            'Reset all residents to available status',
        );
        setAssignmentFeedback('Tutti i residenti sono stati resettati allo stato disponibile');
    }, [setAssignmentFeedback, updateState]);

    return {
        detailPanelSlotIds,
        setDetailPanelSlotIds,
        openDetailPanel,
        closeDetailPanel,
        handleSlotResidentDragEnter,
        handleSlotResidentDragLeave,
        handleResetSandboxState,
        handleResetResidents,
    };
}
