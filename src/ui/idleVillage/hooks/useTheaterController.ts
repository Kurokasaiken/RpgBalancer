import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type MutableRefObject,
    type SetStateAction,
} from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import { ensureTheaterTimers, type IdleVillageUiExtensions } from '@/balancing/config/idleVillage/theaterTimings';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';

type TheaterDragController = {
    handleLocationResidentDrop?: (residentId: string, targetSlotId?: string) => void;
};

type TheaterDragControllerRef = MutableRefObject<TheaterDragController | null>;

type SandboxTimeout = ReturnType<typeof globalThis.setTimeout>;

export interface UseTheaterControllerParams {
    slots: ActivitySlotData[];
    locationSlotIds: string[];
    dragControllerRef: TheaterDragControllerRef;
    config: IdleVillageConfig;
    randomFn: () => number;
}

export interface UseTheaterControllerResult {
    theaterPreviewIds: string[];
    isTheaterOpen: boolean;
    theaterSlotId: string | null;
    theaterCloseTimeout: SandboxTimeout | null;
    selectTheaterPreviewIds: (primarySlotId?: string | null) => string[];
    openTheater: (slotId: string | null) => void;
    handleLocationInspect: () => void;
    handleLocationResidentDragEnter: (residentId: string | null, slotId?: string) => void;
    handleLocationResidentDragLeave: () => void;
    handleLocationResidentDrop: (residentId: string, targetSlotId?: string) => void;
    closeTheater: () => void;
    hoverStart: (slotId: string) => void;
    hoverEnd: () => void;
    setTheaterPreviewIds: Dispatch<SetStateAction<string[]>>;
    setIsTheaterOpen: (open: boolean) => void;
    setTheaterSlotId: (slotId: string | null) => void;
    setTheaterCloseTimeout: (timeout: SandboxTimeout | null) => void;
}

/**
 * Determines the map slot identifier associated with a given activity slot.
 * 
 * @param slot - The activity slot to extract map slot information from.
 * @returns The map slot identifier if present in activity metadata, undefined otherwise.
 */
const getSlotMapSlotId = (slot: ActivitySlotData): string | undefined => {
    const metadata = (slot.activity?.metadata ?? {}) as { mapSlotId?: string };
    return metadata?.mapSlotId;
};

/**
 * Determines the priority of a slot for theater preview selection.
 * Lower numbers indicate higher priority (quest > job > danger > system > other).
 * 
 * @param slot - The activity slot to prioritize.
 * @param config - The idle village configuration containing priority mappings.
 * @returns Priority value (0-based, lower is higher priority).
 */
const getSlotPriority = (slot: ActivitySlotData, config: IdleVillageConfig): number => {
    const tags = slot.activity?.tags ?? [];
    
    // Check config-based priorities first
    const theaterConfig = (config as IdleVillageUiExtensions).ui?.theater;
    if (theaterConfig?.slotPriorities) {
        for (const tag of tags) {
            const priority = theaterConfig.slotPriorities[tag];
            if (typeof priority === 'number') {
                return priority;
            }
        }
    }
    
    // Fallback to hardcoded priorities for backward compatibility
    if (tags.includes('quest')) return 0;
    if (tags.includes('job')) return 1;
    if (tags.includes('danger')) return 2;
    if (tags.includes('system')) return 3;
    return 4;
};

/**
 * Shuffles an array of slots using the Fisher-Yates algorithm with the provided random function.
 * 
 * @param slotsToShuffle - The array of activity slots to shuffle.
 * @param randomFn - A function that returns a random number between 0 and 1.
 * @returns A new array with the slots shuffled in random order.
 */
const shuffleSlots = (slotsToShuffle: ActivitySlotData[], randomFn: () => number): ActivitySlotData[] => {
    const slots = [...slotsToShuffle];
    for (let i = slots.length - 1; i > 0; i -= 1) {
        const j = Math.floor(randomFn() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    return slots;
};

/**
 * Resolves the primary slot for theater preview based on preference and priority.
 * 
 * @param playableSlots - Array of slots that can be displayed in theater.
 * @param preferredSlotId - Optional preferred slot ID to prioritize.
 * @param config - The idle village configuration for priority resolution.
 * @returns The primary slot or null if no slots are available.
 */
const resolvePrimarySlot = (
    playableSlots: ActivitySlotData[],
    preferredSlotId?: string | null,
    config?: IdleVillageConfig,
): ActivitySlotData | null => {
    if (preferredSlotId) {
        const preferred = playableSlots.find((slot) => slot.slotId === preferredSlotId);
        if (preferred) {
            return preferred;
        }
    }
    if (playableSlots.length === 0) {
        return null;
    }
    const sortedByPriority = [...playableSlots].sort((a, b) => 
        config ? getSlotPriority(a, config) - getSlotPriority(b, config) : 0
    );
    return sortedByPriority[0] ?? null;
};

/**
 * Prioritizes and selects slots for theater preview display.
 * 
 * @param params - Configuration object for slot prioritization.
 * @param params.playableSlots - All slots that can be displayed.
 * @param params.primarySlot - The primary slot to prioritize.
 * @param params.maxPreviewCount - Maximum number of slots to include in preview.
 * @param params.randomFn - Function for random selection when needed.
 * @param params.config - The idle village configuration for priority resolution.
 * @returns Array of selected slots for theater preview.
 */
const prioritizePreviewSlots = (params: {
    playableSlots: ActivitySlotData[];
    primarySlot: ActivitySlotData | null;
    maxPreviewCount: number;
    randomFn: () => number;
    config?: IdleVillageConfig;
}): ActivitySlotData[] => {
    const { playableSlots, primarySlot, maxPreviewCount, randomFn, config } = params;
    const selected: ActivitySlotData[] = [];
    const addSlot = (slot: ActivitySlotData | null) => {
        if (!slot) return;
        if (selected.some((entry) => entry.slotId === slot.slotId)) return;
        selected.push(slot);
    };

    addSlot(primarySlot);

    const targetMapSlotId = primarySlot ? getSlotMapSlotId(primarySlot) : undefined;
    if (targetMapSlotId) {
        playableSlots.forEach((slot) => {
            if (getSlotMapSlotId(slot) === targetMapSlotId) {
                addSlot(slot);
            }
        });
    }

    if (selected.length >= maxPreviewCount) {
        return selected.slice(0, maxPreviewCount);
    }

    const remaining = playableSlots.filter((slot) => !selected.some((entry) => entry.slotId === slot.slotId));
    const groupedByPriority = remaining.reduce<Record<number, ActivitySlotData[]>>((acc, slot) => {
        const priority = config ? getSlotPriority(slot, config) : 4;
        if (!acc[priority]) {
            acc[priority] = [];
        }
        acc[priority].push(slot);
        return acc;
    }, {});

    const priorityKeys = Object.keys(groupedByPriority)
        .map(Number)
        .sort((a, b) => a - b);

    for (const priority of priorityKeys) {
        if (selected.length >= maxPreviewCount) {
            break;
        }
        const group = shuffleSlots(groupedByPriority[priority], randomFn);
        for (const slot of group) {
            addSlot(slot);
            if (selected.length >= maxPreviewCount) {
                break;
            }
        }
    }

    return selected.slice(0, maxPreviewCount);
};

/**
 * Main hook for managing theater overlay state and interactions in Idle Village.
 * 
 * This hook provides comprehensive theater functionality including:
 * - Hover-based theater opening with configurable delays
 * - Slot prioritization and preview selection
 * - Drag-and-drop interactions for residents
 * - Configurable behavior through IdleVillageConfig
 * 
 * @param params - Configuration parameters for the theater controller.
 * @param params.slots - All available activity slots in the village.
 * @param params.locationSlotIds - Slot IDs that represent physical locations.
 * @param params.dragControllerRef - Reference to drag controller for drop handling.
 * @param params.config - Idle village configuration for theater behavior.
 * @param params.randomFn - Function for random number generation (configurable for testing).
 * 
 * @returns Object containing theater state and handler functions.
 * @returns returns.theaterPreviewIds - Array of slot IDs currently in preview.
 * @returns returns.isTheaterOpen - Whether the theater overlay is currently open.
 * @returns returns.theaterSlotId - Primary slot ID for the theater.
 * @returns returns.theaterCloseTimeout - Timeout reference for delayed closing.
 * @returns returns.selectTheaterPreviewIds - Function to select preview slots based on primary slot.
 * @returns returns.openTheater - Function to open theater for a specific slot.
 * @returns returns.handleLocationInspect - Function to handle location inspection requests.
 * @returns returns.handleLocationResidentDragEnter - Function to handle resident drag enter events.
 * @returns returns.handleLocationResidentDragLeave - Function to handle resident drag leave events.
 * @returns returns.handleLocationResidentDrop - Function to handle resident drop events.
 * @returns returns.closeTheater - Function to manually close the theater.
 * @returns returns.hoverStart - Function to start hover timer for a slot.
 * @returns returns.hoverEnd - Function to end hover and start close timer.
 * @returns returns.setTheaterPreviewIds - Setter for theater preview IDs.
 * @returns returns.setIsTheaterOpen - Setter for theater open state.
 * @returns returns.setTheaterSlotId - Setter for primary theater slot ID.
 * @returns returns.setTheaterCloseTimeout - Setter for theater close timeout.
 */
export function useTheaterController(params: UseTheaterControllerParams): UseTheaterControllerResult {
    const { slots, locationSlotIds, dragControllerRef, config, randomFn } = params;
    const { hoverOpenMs: hoverOpenDelay, hoverCloseMs: hoverCloseDelay, maxPreviewCount } = ensureTheaterTimers(config);
    const diagnostics = useMemo(() => createSandboxDiagnostics('TheaterController', 'theater'), []);

    const [isTheaterOpen, setIsTheaterOpen] = useState(false);
    const [theaterSlotId, setTheaterSlotId] = useState<string | null>(null);
    const [theaterPreviewIds, setTheaterPreviewIds] = useState<string[]>([]);
    const [theaterCloseTimeout, setTheaterCloseTimeout] = useState<SandboxTimeout | null>(null);

    const theaterOpenTimerRef = useRef<SandboxTimeout | null>(null);

    const selectTheaterPreviewIds = useCallback(
        (primarySlotId?: string | null): string[] => {
            const theaterConfig = (config as IdleVillageUiExtensions).ui?.theater;
            const excludedSlots = theaterConfig?.excludedSlots ?? ['day-night-cycle'];
            
            const playableSlots = slots.filter((slot) => !excludedSlots.includes(slot.slotId));
            if (playableSlots.length === 0) return [];

            const resolvedPrimary = resolvePrimarySlot(playableSlots, primarySlotId, config);
            const selectedSlots = prioritizePreviewSlots({
                playableSlots,
                primarySlot: resolvedPrimary,
                maxPreviewCount,
                randomFn,
                config,
            });

            const ids = selectedSlots.map((slot) => slot.slotId);
            diagnostics.debug('select-previews', {
                primarySlotId: primarySlotId ?? null,
                resolvedPrimary: resolvedPrimary?.slotId ?? null,
                previewIds: ids,
                excludedSlots,
            });
            return ids;
        },
        [slots, maxPreviewCount, randomFn, config, diagnostics],
    );

    const openTheaterWithSlotIds = useCallback(
        (slotIds: string[]) => {
            const theaterConfig = (config as IdleVillageUiExtensions).ui?.theater;
            const excludedSlots = theaterConfig?.excludedSlots ?? ['day-night-cycle'];
            
            const previewSlots = slotIds
                .map((id) => slots.find((slot) => slot.slotId === id) ?? null)
                .filter((slot): slot is ActivitySlotData => slot !== null && !excludedSlots.includes(slot.slotId));
            if (previewSlots.length === 0) return;

            setTheaterSlotId(previewSlots[0].slotId);
            setTheaterPreviewIds(previewSlots.map((slot) => slot.slotId));
            setIsTheaterOpen(true);
            diagnostics.debug('open', {
                slotIds,
                resolvedPreviewIds: previewSlots.map((slot) => slot.slotId),
                excludedSlots,
            });
        },
        [slots, config, diagnostics],
    );

    const openTheaterForSlot = useCallback(
        (slotId: string | null) => {
            const normalizedSlotId = slotId && slotId !== 'day-night-cycle' ? slotId : undefined;
            const previews = selectTheaterPreviewIds(normalizedSlotId);
            openTheaterWithSlotIds(previews);
        },
        [selectTheaterPreviewIds, openTheaterWithSlotIds],
    );

    const activeHoverSlotsRef = useRef<string[]>([]);
    const hoverEnterMap = useRef<Map<string, number>>(new Map());

    const scheduleHoverOpen = useCallback(
        (slotIds: string[]) => {
            if (theaterOpenTimerRef.current) {
                globalThis.clearTimeout(theaterOpenTimerRef.current);
            }
            theaterOpenTimerRef.current = globalThis.setTimeout(() => {
                openTheaterWithSlotIds(slotIds);
                theaterOpenTimerRef.current = null;
                diagnostics.debug('hover-open-fired', { slotIds });
            }, hoverOpenDelay);
            diagnostics.debug('schedule-hover-open', { slotIds, hoverOpenDelay });
        },
        [hoverOpenDelay, openTheaterWithSlotIds, diagnostics],
    );

    const closeTheater = useCallback(() => {
        if (theaterOpenTimerRef.current) {
            globalThis.clearTimeout(theaterOpenTimerRef.current);
            theaterOpenTimerRef.current = null;
        }
        if (theaterCloseTimeout) {
            globalThis.clearTimeout(theaterCloseTimeout);
            setTheaterCloseTimeout(null);
        }
        setTheaterPreviewIds([]);
        setIsTheaterOpen(false);
        setTheaterSlotId(null);
        diagnostics.debug('close', {
            reason: 'manual',
        });
    }, [theaterCloseTimeout, setTheaterPreviewIds, diagnostics]);

    const hoverStart = useCallback(
        (slotId: string) => {
            if (theaterCloseTimeout) {
                globalThis.clearTimeout(theaterCloseTimeout);
                setTheaterCloseTimeout(null);
            }
            if (theaterOpenTimerRef.current) {
                globalThis.clearTimeout(theaterOpenTimerRef.current);
                theaterOpenTimerRef.current = null;
            }
            if (isTheaterOpen) {
                return;
            }
            const previews = selectTheaterPreviewIds(slotId);
            scheduleHoverOpen(previews.length > 0 ? previews : [slotId]);
        },
        [isTheaterOpen, selectTheaterPreviewIds, scheduleHoverOpen, theaterCloseTimeout],
    );

    const hoverEnd = useCallback(() => {
        if (theaterOpenTimerRef.current) {
            globalThis.clearTimeout(theaterOpenTimerRef.current);
            theaterOpenTimerRef.current = null;
        }
        if (theaterCloseTimeout) {
            globalThis.clearTimeout(theaterCloseTimeout);
        }
        setTheaterCloseTimeout(
            globalThis.setTimeout(() => {
                setIsTheaterOpen(false);
                setTheaterSlotId(null);
                setTheaterCloseTimeout(null);
                diagnostics.debug('hover-close-fired', {});
            }, hoverCloseDelay),
        );
        diagnostics.debug('schedule-hover-close', { hoverCloseDelay });
    }, [hoverCloseDelay, theaterCloseTimeout, diagnostics]);

    const handleLocationInspect = useCallback(() => {
        if (locationSlotIds.length === 0) {
            openTheaterForSlot(null);
            return;
        }
        openTheaterWithSlotIds(locationSlotIds);
    }, [locationSlotIds, openTheaterForSlot, openTheaterWithSlotIds]);

    const handleLocationResidentDragEnter = useCallback(
        (residentId: string | null, slotId?: string) => {
            if (!residentId || locationSlotIds.length === 0) return;
            const targetSlots = slotId ? [slotId] : locationSlotIds;

            if (theaterCloseTimeout) {
                globalThis.clearTimeout(theaterCloseTimeout);
                setTheaterCloseTimeout(null);
            }

            activeHoverSlotsRef.current = targetSlots;

            if (slotId) {
                hoverEnterMap.current.set(slotId, Date.now());
            }

            if (theaterOpenTimerRef.current) {
                globalThis.clearTimeout(theaterOpenTimerRef.current);
                theaterOpenTimerRef.current = null;
            }

            if (isTheaterOpen) {
                return;
            }

            const slotsForPreview = selectTheaterPreviewIds(targetSlots[0]);
            scheduleHoverOpen(slotsForPreview.length > 0 ? slotsForPreview : targetSlots);
        },
        [isTheaterOpen, locationSlotIds, theaterCloseTimeout, scheduleHoverOpen, selectTheaterPreviewIds],
    );

    const handleLocationResidentDragLeave = useCallback(
        (slotId?: string) => {
            if (slotId) {
                hoverEnterMap.current.delete(slotId);
            }

            if (hoverEnterMap.current.size > 0) {
                const [nextSlotId] = hoverEnterMap.current.keys();
                activeHoverSlotsRef.current = [nextSlotId];
                if (!isTheaterOpen) {
                    scheduleHoverOpen(selectTheaterPreviewIds(nextSlotId));
                }
                return;
            }

            activeHoverSlotsRef.current = [];

            if (theaterOpenTimerRef.current) {
                globalThis.clearTimeout(theaterOpenTimerRef.current);
                theaterOpenTimerRef.current = null;
            }

            if (theaterCloseTimeout) {
                globalThis.clearTimeout(theaterCloseTimeout);
            }

            setTheaterCloseTimeout(
                globalThis.setTimeout(() => {
                    setIsTheaterOpen(false);
                    setTheaterSlotId(null);
                    setTheaterCloseTimeout(null);
                    diagnostics.debug('hover-close-fired', {});
                }, hoverCloseDelay),
            );
            diagnostics.debug('schedule-hover-close', { hoverCloseDelay });
        },
        [hoverCloseDelay, theaterCloseTimeout, selectTheaterPreviewIds, isTheaterOpen, scheduleHoverOpen, diagnostics],
    );

    const handleLocationResidentDrop = useCallback(
        (residentId: string, targetSlotId?: string) => {
            if (theaterOpenTimerRef.current) {
                globalThis.clearTimeout(theaterOpenTimerRef.current);
                theaterOpenTimerRef.current = null;
            }
            dragControllerRef.current?.handleLocationResidentDrop?.(residentId, targetSlotId);
            closeTheater();
        },
        [closeTheater, dragControllerRef],
    );

    useEffect(
        () => () => {
            if (theaterOpenTimerRef.current) {
                globalThis.clearTimeout(theaterOpenTimerRef.current);
                theaterOpenTimerRef.current = null;
            }
            if (theaterCloseTimeout) {
                globalThis.clearTimeout(theaterCloseTimeout);
            }
        },
        [theaterCloseTimeout],
    );

    return {
        theaterPreviewIds,
        isTheaterOpen,
        theaterSlotId,
        theaterCloseTimeout,
        selectTheaterPreviewIds,
        openTheater: openTheaterForSlot,
        handleLocationInspect,
        handleLocationResidentDragEnter,
        handleLocationResidentDragLeave,
        handleLocationResidentDrop,
        hoverStart,
        hoverEnd,
        setTheaterPreviewIds,
        setIsTheaterOpen,
        setTheaterSlotId,
        setTheaterCloseTimeout,
        closeTheater,
    };
}
