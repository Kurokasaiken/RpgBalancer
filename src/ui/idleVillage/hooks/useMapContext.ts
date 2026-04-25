import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSandboxDemoPanel } from './useSandboxDemoPanel';
import type {
    ActivityDefinition,
    IdleVillageConfig,
    ResourceDeltaDefinition,
} from '@/balancing/config/idleVillage/types';
import {
    createVillageStateFromConfig,
    type ResidentState,
    type VillageState,
    type VillageResources,
} from '@/engine/game/idleVillage/TimeEngine';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import { useSandboxClock, type UseSandboxClockOptions } from '@/ui/idleVillage/hooks/useSandboxClock';
import { useTheaterController } from './useTheaterController';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import { useTheaterViewModels } from './useTheaterViewModels';
import { useSandboxSlotModels } from './useSandboxSlotModels';
import { useVillageShellContext } from './useVillageShellContext';
import { useSandboxResetController } from './useSandboxResetController';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import { useSandboxDragController } from './useSandboxDragController';
import type { ResourcePanelItem } from '@/ui/idleVillage/components/ResourcePanel';
import { type ResidentSlotViewModel, type SlotProgressData } from '@/ui/idleVillage/slots/useResidentSlotController';
import { useQuestTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import { useSandboxCore } from './useSandboxCore';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '../utils/sandboxDiagnostics';
import type { ResidentCompatibilityInfo } from '@/ui/idleVillage/components/ResidentRosterTypes';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { selectActiveActivityHudData } from '@/ui/idleVillage/selectors/useHudSelectors';
import { useSandboxInteractionMode } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';
import { useDragErrorRecovery } from '@/ui/idleVillage/hooks/useDragErrorRecovery';
import type { ActivityAreaHandlers } from '@/ui/idleVillage/ActivityArea';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type {
    TradeRoute,
    TradeResult,
    MigrationRequest,
    VillageSummary,
} from '@/ui/idleVillage/state/VillageRegistry';

/**
 * Aggregate values surfaced by {@link SummaryStrip} so the header stays config-driven.
 */
interface ResourceSummary {
    gold: number;
    food: number;
    population: number;
}

/**
 * Coerces any persisted resource value into a finite number for UI math.
 */
const coerceResourceValue = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Normalizes raw {@link VillageResources} maps into numeric records.
 */
const normalizeResourceRecord = (resources: VillageResources | null | undefined): Record<string, number> => {
    if (!resources) {
        return {};
    }
    return Object.entries(resources).reduce<Record<string, number>>((acc, [resourceId, rawValue]) => {
        acc[resourceId] = coerceResourceValue(rawValue);
        return acc;
    }, {});
};

/**
 * Builds Observatory resource pills (with optional deltas) from the latest snapshots.
 */
const buildResourceItemsFromSnapshot = (
    definitions: IdleVillageConfig['resources'] | undefined,
    snapshot: Record<string, number>,
    previousSnapshot?: Record<string, number>,
): ResourcePanelItem[] => {
    const definitionEntries = Object.entries(definitions ?? {});
    const resourceIds =
        definitionEntries.length > 0 ? definitionEntries.map(([resourceId]) => resourceId) : Object.keys(snapshot);
    if (resourceIds.length === 0) {
        return [];
    }
    return resourceIds.map((resourceId) => {
        const definition = definitions?.[resourceId];
        const currentValue = snapshot[resourceId] ?? 0;
        const prevValue = previousSnapshot?.[resourceId];
        const delta = prevValue !== undefined ? currentValue - prevValue : 0;

        return {
            id: resourceId,
            label: definition?.label ?? resourceId,
            icon: definition?.icon,
            value: currentValue,
            delta: delta === 0 ? undefined : delta,
            accentClass: definition?.colorClass ?? 'text-amber-200',
        };
    });
};

/**
 * Summarizes the headline metrics rendered by {@link SummaryStrip}.
 */
const buildResourceSummary = (snapshot: Record<string, number>, population: number): ResourceSummary => ({
    gold: snapshot.gold ?? 0,
    food: snapshot.food ?? 0,
    population,
});

const PUNCH_CLUB_PRESET_ID = 'punch_club_light';

interface DetailContext {
    slotId: string;
    slot: ActivitySlotData;
    activity: ActivityDefinition;
    summary: VerbSummary | null;
}

/** Handler contract surfaced to the board rack for resident assignments. */
interface ResidentSlotRackHandlers {
    assignResidentToSlot: (slotId: string, residentId: string | null) => void;
    clearSlot: (slotId: string) => void;
    getSlotProgress: (slotId: string) => SlotProgressData | null;
}

/**
 * Comprehensive controller hook for the Idle Village Map / Sandbox view.
 */
export function useMapContext() {
    const isMobile = useIsMobile();
    const {
        config,
        villageStateStore,
        shellPresetOptions,
        activeShellPresetId,
        setShellPresetId,
        theme,
    } = useVillageShellContext();
    const diagnostics = useMemo(
        () => createSandboxDiagnostics<PickerDiagnosticsPayload>('useMapContext', 'picker'),
        [],
    );
    const { state: persistedVillageState, updateState, resetState } = villageStateStore;
    const dragErrorRecovery = useDragErrorRecovery();
    const handleClockStateUpdate = useCallback<UseSandboxClockOptions['onStateUpdate']>(
        async (updater, message) => {
            await updateState(updater, message);
        },
        [updateState],
    );

    const maxFatigueBeforeExhausted = config.globalRules?.maxFatigueBeforeExhausted;
    const { activeId: draggingResidentId, setActiveId } = useDragContext();
    const [previousResourceSnapshot, setPreviousResourceSnapshot] = useState<Record<string, number>>({
        gold: 0,
        food: 0,
    });
    const onResourcesChange = useCallback(
        (resources: VillageResources, _changes?: ResourceDeltaDefinition[]) => {
            const currentSnapshot = normalizeResourceRecord(resources);
            setPreviousResourceSnapshot(currentSnapshot);
        },
        [],
    );

    // Telemetry
    const questTelemetry = useQuestTelemetry();
    const handleTelemetryClear = useCallback(() => {
        void questTelemetry.clearTelemetry();
    }, [questTelemetry]);
    const questTelemetryPanelState = useMemo(
        () => ({
            telemetry: questTelemetry.telemetry,
            isLoading: questTelemetry.isLoading,
            error: questTelemetry.error,
            onClear: handleTelemetryClear,
        }),
        [
            questTelemetry.telemetry,
            questTelemetry.isLoading,
            questTelemetry.error,
            handleTelemetryClear,
        ],
    );

    // Village state management
    const {
        activityScheduler,
        isDayPhase,
        isCyclePlaying,
        setIsCyclePlaying,
        cyclePhaseLabel,
        cyclePhaseIcon,
        cycleProgressFraction,
        cycleElapsedSeconds,
        totalCycleSeconds,
        cycleDayCount,
        cycleVariant,
        secondsPerTimeUnit,
        subscribeClock: sandboxSubscribeClock,
        unsubscribeClock: sandboxUnsubscribeClock,
        handleResetSandboxState: clockReset,
        scheduleTimeout,
    } = useSandboxClock({
        config,
        initialVillageState: persistedVillageState,
        resetState,
        onResourcesChange,
        onStateUpdate: handleClockStateUpdate,
    });

    const villageState = useMemo(() => {
        const schedulerState = activityScheduler.villageState;
        const schedulerResidents = schedulerState?.residents ?? {};
        if (Object.keys(schedulerResidents).length > 0) {
            return schedulerState;
        }
        return persistedVillageState;
    }, [activityScheduler.villageState, persistedVillageState]);

    const toggleCyclePlaying = useCallback(() => {
        setIsCyclePlaying((prev) => {
            const next = !prev;
            if (next) {
                activityScheduler.resumeTimer();
            } else {
                activityScheduler.pauseTimer();
            }
            return next;
        });
    }, [activityScheduler, setIsCyclePlaying]);

    // Residents data
    const residents = useMemo(() => Object.values(villageState.residents), [villageState.residents]);
    const residentsById = useMemo(() => villageState.residents, [villageState.residents]);
    const residentCount = residents.length;

    const configKey = useMemo(() => `${activeShellPresetId}:${config.version}`, [activeShellPresetId, config.version]);
    const seedingCountersRef = useRef({ resetCalls: 0, reseedCalls: 0 });
    const hasSeeded = useRef(false);
    const seedGuardKeyRef = useRef<string | null>(null);
    const lastConfigIdRef = useRef<string | null>(null);
    const legacyFoundersLoggedRef = useRef(false);
    const syncMismatchLoggedRef = useRef(false);
    const reseedInFlightRef = useRef(false);

    const instrumentedResetState = useCallback(
        async (factory: () => VillageState, description: string, _source: string) => {
            seedingCountersRef.current.resetCalls += 1;
            diagnostics.info('resetState invoked', {
                source: _source,
                description,
                presetId: activeShellPresetId,
                configKey,
            });
            await resetState(factory, description);
        },
        [activeShellPresetId, configKey, diagnostics, resetState],
    );

    const reseedVillageStateFromDataset = useCallback(
        (latestResidents: ResidentState[], description: string): boolean => {
            if (!latestResidents.length) {
                diagnostics.warn('Roster reseed skipped due to empty dataset', { description, configKey });
                return false;
            }

            const currentKey = configKey;
            void (async () => {
                reseedInFlightRef.current = true;
                try {
                    await instrumentedResetState(
                        () => createVillageStateFromConfig({ config, initialResidents: latestResidents }),
                        description,
                        'reseedVillageStateFromDataset',
                    );
                    seedGuardKeyRef.current = currentKey;
                    hasSeeded.current = true;
                    seedingCountersRef.current.reseedCalls += 1;
                } catch (err) {
                    diagnostics.error('Roster reseed failed', { error: err });
                } finally {
                    reseedInFlightRef.current = false;
                }
            })();
            return true;
        },
        [config, configKey, diagnostics, instrumentedResetState],
    );

    const loadResidentsForActivePreset = useCallback((): ResidentState[] => {
        return loadResidentsFromCharacterManager({ config });
    }, [config]);

    const scheduleRosterSeed = useCallback(
        (reason: string, options?: { force?: boolean; dataset?: ResidentState[] }) => {
            const dataset = options?.dataset ?? loadResidentsForActivePreset();
            if (!dataset.length) {
                diagnostics.warn('Roster seed skipped due to empty dataset', { reason, configKey });
                return;
            }
            const shouldForce = Boolean(options?.force);
            if (!shouldForce && seedGuardKeyRef.current === configKey && hasSeeded.current) {
                return;
            }

            void reseedVillageStateFromDataset(dataset, `Roster seed: ${reason}`);
        },
        [configKey, loadResidentsForActivePreset, reseedVillageStateFromDataset, diagnostics],
    );

    // Initial seed management
    useEffect(() => {
        if (reseedInFlightRef.current) return;
        if (!config || !activeShellPresetId) return;

        const currentConfigId = `${activeShellPresetId}:${config.version}`;
        if (lastConfigIdRef.current === currentConfigId) return;

        lastConfigIdRef.current = currentConfigId;

        if (activeShellPresetId === PUNCH_CLUB_PRESET_ID) {
            scheduleRosterSeed('Punch Club preset activation', { force: true });
        } else {
            scheduleRosterSeed('Shell configuration change');
        }
    }, [config, activeShellPresetId, scheduleRosterSeed]);

    const maybeHandleLegacyFounderRoster = useCallback(() => {
        if (legacyFoundersLoggedRef.current) return;
        const hasLegacyFounders = residents.some(
            (resident) => !resident.displayName && resident.id?.startsWith('founder-'),
        );
        if (!hasLegacyFounders) return;
        legacyFoundersLoggedRef.current = true;
        const latestResidents = loadResidentsForActivePreset();
        void reseedVillageStateFromDataset(latestResidents, 'VillageSandbox resident refresh');
    }, [loadResidentsForActivePreset, reseedVillageStateFromDataset, residents]);

    const maybeHandleResidentSyncMismatch = useCallback(() => {
        if (residentCount === 0 || syncMismatchLoggedRef.current) return;
        const dataset = loadResidentsForActivePreset();
        if (dataset.length === 0) return;

        if (residentCount !== dataset.length) {
            syncMismatchLoggedRef.current = true;
            scheduleRosterSeed('Resident sync mismatch', { force: true, dataset });
        }
    }, [loadResidentsForActivePreset, residentCount, scheduleRosterSeed]);

    useEffect(() => {
        if (reseedInFlightRef.current) return;
        maybeHandleLegacyFounderRoster();
        maybeHandleResidentSyncMismatch();
    }, [maybeHandleLegacyFounderRoster, maybeHandleResidentSyncMismatch, residentCount]);

    // Derived slot data
    const {
        managedActivities,
        slots,
        locationSlots,
        locationSlotIds,
        slotAssignments,
        setSlotAssignments,
    } = useSandboxSlotModels({
        config,
        cyclePhaseLabel,
        cyclePhaseIcon,
        isCyclePlaying,
        totalCycleSeconds,
        cycleVariant,
        activityScheduler,
    });

    // Local UI State
    const [assignmentFeedback, setAssignmentFeedbackState] = useState<string | null>(null);
    const reportAssignmentFeedback = useCallback(
        (message: string | null, source = 'unknown') => {
            diagnostics.debug('Assignment feedback updated', { source, message });
            setAssignmentFeedbackState(message);
        },
        [diagnostics],
    );
    const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);

    // Computed resource data for UI
    const currentResourceSnapshot = useMemo(
        () => normalizeResourceRecord(villageState.resources),
        [villageState.resources],
    );
    const resourceItems = useMemo(
        () => buildResourceItemsFromSnapshot(config.resources, currentResourceSnapshot, previousResourceSnapshot),
        [config.resources, currentResourceSnapshot, previousResourceSnapshot],
    );
    const headerResources = useMemo(
        () => buildResourceSummary(currentResourceSnapshot, residentCount),
        [currentResourceSnapshot, residentCount],
    );

    // Drag management
    const dragController = useSandboxDragController({
        villageState,
        activityScheduler,
        secondsPerTimeUnit,
        slots,
        slotAssignments,
        setSlotAssignments,
        setAssignmentFeedback: reportAssignmentFeedback,
        setIsCyclePlaying,
        updateState,
        dragContext: { activeId: draggingResidentId, setActiveId },
        locationSlotIds,
        maxFatigueBeforeExhausted,
        isDayPhase,
    });

    // ActionDetailHarness
    const core = useSandboxCore({
        villageState,
        activityScheduler,
        secondsPerTimeUnit,
        slots,
        slotAssignments,
        setSlotAssignments,
        setAssignmentFeedback: reportAssignmentFeedback,
        setIsCyclePlaying,
        updateState,
        dragContext: { activeId: draggingResidentId, setActiveId },
        locationSlotIds,
        managedActivities,
        residentsById,
        config,
        formatCycleSeconds: (val) => `${Math.floor(val / 60)}:${String(val % 60).padStart(2, '0')}`,
        isDayPhase,
        onDragError: dragErrorRecovery.reportError,
    });

    const {
        actionDetailHarnessState,
        getActionDetailHarnessSnapshot,
        handleAssignResidentToJob,
        handleJobDropzoneDragOver,
        handleJobDropzoneDrop,
    } = core;

    // Reset logic
    const { handleResetResidents, openDetailPanel, closeDetailPanel } = useSandboxResetController({
        clockReset,
        managedActivities,
        setSlotAssignments,
        setSelectedResidentId,
        updateState,
        setAssignmentFeedback: reportAssignmentFeedback,
        closeTheater: handleCloseTheater,
    });

    // Theater management
    const dragControllerRef = useRef(dragController);
    useEffect(() => {
        dragControllerRef.current = dragController;
    }, [dragController]);

    const {
        isTheaterOpen,
        theaterSlotId,
        handleLocationInspect: baseHandleLocationInspect,
        closeTheater: handleCloseTheater,
        hoverStart,
        hoverEnd,
    } = useTheaterController({
        slots,
        locationSlotIds,
        dragControllerRef,
        config,
        randomFn: Math.random,
    });

    const theaterPrimarySlot = useMemo(() => 
        slots.find(s => s.slotId === theaterSlotId) || null
    , [slots, theaterSlotId]);

    const {
        theaterVerbs,
        theaterSlotCards,
        theaterJobCards,
    } = useTheaterViewModels({
        slots,
        theaterPreviewIds: theaterSlotId ? [theaterSlotId] : [],
        resolveWorkerName: (id) => id ? residentsById[id]?.displayName || id : null,
        activityScheduler,
        secondsPerTimeUnit,
        dragBridge: dragController,
        randomFn: Math.random,
    });

    const detailContexts = useMemo<DetailContext[]>(() => {
        return slots
            .filter(s => s.slotId !== 'day-night-cycle')
            .map((slot) => {
                const activity = slot.activity;
                if (!activity) return null;
                const summary = theaterVerbs.find((v) => v.slotId === slot.slotId || v.key === slot.slotId) ?? null;
                if (!summary) return null;
                const result: DetailContext = { slotId: slot.slotId, slot, activity, summary };
                return result;
            })
            .filter((ctx): ctx is DetailContext => ctx !== null);
    }, [slots, theaterVerbs]);

    // Demo Panel management
    const {
        demoPanelState,
        demoPanelHandlers,
    } = useSandboxDemoPanel({
        residentsById,
        updateVillageState: updateState,
        setAssignmentFeedback: (msg) => reportAssignmentFeedback(msg, 'demo-panel'),
        subscribeClock: sandboxSubscribeClock,
        unsubscribeClock: sandboxUnsubscribeClock,
    });

    // Board Slot Rack models
    const residentSlotRackSlots = useMemo<ResidentSlotViewModel[]>(() => {
        return slots
            .filter((s) => s.slotId !== 'day-night-cycle')
            .map((slot) => ({
                id: slot.slotId,
                index: 0,
                slotId: slot.slotId,
                label: slot.label,
                assignedResidentId: slot.assignedWorkerId,
                assignedResident: slot.assignedWorkerId ? residentsById[slot.assignedWorkerId] : undefined,
                requirement: slot.activity?.statRequirement,
                isRequired: false,
                isPlaceholder: false,
                dropState: dragController.slotDropStates[slot.slotId] ?? 'idle',
                portraitUrl: slot.assignedWorkerId ? getResidentPortraitUrl(residentsById[slot.assignedWorkerId]) : undefined,
            }));
    }, [slots, residentsById, dragController.slotDropStates]);

    const residentSlotRackHandlers: ResidentSlotRackHandlers = useMemo(
        () => ({
            assignResidentToSlot: (residentId, slotId) => dragController.handleWorkerDrop(slotId, residentId),
            clearSlot: (slotId) => dragController.handleWorkerDrop(slotId, null),
            getSlotProgress: (slotId) => {
                const slot = slots.find((s) => s.slotId === slotId);
                if (!slot?.assignedWorkerId) return null;
                const state = activityScheduler.getActivityState(slotId, slot.assignedWorkerId);
                if (!state) return null;
                return {
                    slotId,
                    residentId: slot.assignedWorkerId,
                    elapsedSeconds: state.elapsed,
                    totalSeconds: state.duration,
                    ratio: state.progress,
                    state,
                };
            },
        }),
        [dragController, slots, activityScheduler],
    );

    const getResidentCompatibility = useCallback(
        (residentId: string): ResidentCompatibilityInfo => {
            const resident = residentsById[residentId];
            if (!resident) {
                return {
                    state: 'invalid',
                };
            }

            const isExhausted = resident.fatigue >= (maxFatigueBeforeExhausted ?? 100);
            const isInjured = resident.isInjured;
            const isAvailable = resident.status === 'available';

            if (!isAvailable || isExhausted || isInjured) {
                return { state: 'invalid' };
            }

            const compatible = managedActivities.some((activity) => activityScheduler.canAssignResident(residentId, activity.id));

            return {
                state: compatible ? 'valid' : 'invalid',
            };
        },
        [managedActivities, activityScheduler, residentsById, maxFatigueBeforeExhausted],
    );

    const getResourceLabel = useCallback(
        (resourceId: string) => config.resources[resourceId]?.label ?? resourceId,
        [config.resources],
    );

    const hudData = selectActiveActivityHudData({
        activities: Object.values(villageState.activities),
        config,
        currentTime: villageState.currentTime,
        secondsPerTimeUnit,
        dayLength: config.globalRules.dayLengthInTimeUnits,
        residents: residentsById,
        getResourceLabel,
    });

    const interaction = useSandboxInteractionMode({
        isMobile,
        handleResidentSelect: (id) => setSelectedResidentId(id),
        onDesktopSlotFocus: (slotId) => diagnostics.debug('Slot focused (desktop)', { slotId }),
        enableDiagnostics: true,
        diagnosticsScope: 'useMapContext',
    });

    return {
        // Context & Config
        activePreset: theme.activePreset,
        presets: theme.presets,
        setPreset: theme.setPreset,
        randomizeTheme: theme.randomizeTheme,
        resetRandomization: theme.resetRandomization,
        isRandomized: theme.isRandomized,
        config,
        resetState,
        shellPresetOptions,
        activeShellPresetId,
        setShellPresetId,

        // UI State
        handleResetResidents,
        assignmentFeedback,
        setAssignmentFeedback: setAssignmentFeedbackState,
        isTheaterOpen,
        theaterPrimarySlot,
        handleLocationInspect: (_id?: string) => {
            baseHandleLocationInspect();
        },
        handleCloseTheater,
        openDetailPanel,
        closeDetailPanel,
        detailContexts,
        selectedResidentId,
        setSelectedResidentId,
        setSelectedSlot: (id: string | null) => diagnostics.debug('setSelectedSlot', { id }),

        // Clock & Time
        isDayPhase,
        isCyclePlaying,
        setIsCyclePlaying,
        toggleCyclePlaying,
        cyclePhaseLabel,
        cyclePhaseIcon,
        cycleProgressFraction,
        cycleElapsedSeconds,
        totalCycleSeconds,
        cycleDayCount,
        cycleVariant,
        secondsPerTimeUnit,
        handleResetSandboxState: clockReset,
        scheduleTimeout,
        handleQuickWorkShift: () => diagnostics.warn('Legacy handleQuickWorkShift called'),
        handleQuickRest: () => diagnostics.warn('Legacy handleQuickRest called'),
        isResting: false,

        // Residents & Roster
        residents,
        residentsById,
        residentCount,
        draggingResidentId,
        setActiveId,
        handleResidentSelect: (id: string) => setSelectedResidentId(id),

        // Resource Data
        resourceItems,
        headerResources,

        // Activity Data
        managedActivities,
        slots,
        activityAreaSlots: slots.filter(s => s.slotId !== 'day-night-cycle').map(slot => {
            const state = activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId || '');
            return {
                ...slot,
                progressFraction: state?.progress ?? 0,
                elapsedSeconds: state?.elapsed ?? 0,
                totalDurationSeconds: state?.duration ?? (Number(slot.activity?.durationFormula) || 0),
            };
        }),
        locationSlots,
        locationSlotIds,
        slotAssignments,
        setSlotAssignments,
        activeSlots: slots.filter(s => s.assignedWorkerId).map(slot => ({
            slot,
            state: activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId!)!
        })).filter(entry => entry.state),

        // Handlers
        handleWorkerDrop: dragController.handleWorkerDrop,
        handleDragOver: dragController.handleDragOver,
        handleLocationDragIntent: () => diagnostics.debug('Location drag intent'),
        handleLocationResidentDragEnter: (id: string | null) => dragController.handleDragOver(id ?? ''),
        handleLocationResidentDragLeave: () => diagnostics.debug('Location drag leave'),
        handleLocationResidentDrop: dragController.handleLocationResidentDrop,
        onResidentDrop: dragController.handleLocationResidentDrop,
        canSlotAcceptDrop: dragController.canSlotAcceptDrop,
        locationDropState: dragController.locationDropState,
        hoverStart,
        hoverEnd,
        openTheaterForSlot: (_id: string) => baseHandleLocationInspect(),
        handleResolveActivity: (id: string) => diagnostics.warn('Legacy handleResolveActivity called', { id }),

        // ActivityArea Integration
        activityAreaHandlers: {
            onWorkerDrop: dragController.handleWorkerDrop,
            onInspect: openDetailPanel,
            onToggleCycle: toggleCyclePlaying,
            onLocationInspect: () => baseHandleLocationInspect(),
            onLocationDragEnter: (id: string | null) => dragController.handleDragOver(id ?? ''),
            onLocationDragLeave: () => diagnostics.debug('Location drag leave'),
            onLocationDrop: dragController.handleLocationResidentDrop,
        } as ActivityAreaHandlers,

        // Models
        residentSlotRackSlots,
        residentSlotRackHandlers,
        activityScheduler,
        villageState,
        theaterVerbs,
        theaterSlotCards,
        theaterJobCards,
        theaterPrimarySlotData: theaterPrimarySlot,
        demoPanelState,
        demoPanelHandlers,
        assignResidentToSlot: residentSlotRackHandlers.assignResidentToSlot,
        clearResidentSlot: residentSlotRackHandlers.clearSlot,
        getResidentSlotProgress: residentSlotRackHandlers.getSlotProgress,
        getSlotCompatibilityDiagnostics: dragController.getSlotCompatibilityDiagnostics,
        startSlotActivity: dragController.startSlotActivity,
        slotDropStates: dragController.slotDropStates,

        // Interaction
        interaction,

        // ActionDetailHarness
        actionDetailHarnessState,
        getActionDetailHarnessSnapshot,
        handleAssignResidentToJob,
        handleJobDropzoneDragOver,
        handleJobDropzoneDrop,
        hudEntries: hudData.hudEntries,

        // Multi-village APIs
        selectVillage: () => { diagnostics.warn('Legacy selectVillage called'); },
        getVillageSummaries: (): VillageSummary[] => {
            diagnostics.warn('Legacy getVillageSummaries called');
            return [];
        },
        transferResource: () => { diagnostics.warn('Legacy transferResource called'); },
        getActiveVillageId: () => {
            diagnostics.warn('Legacy getActiveVillageId called');
            return '';
        },
        getGlobalResources: () => {
            diagnostics.warn('Legacy getGlobalResources called');
            return {};
        },
        addVillage: () => { diagnostics.warn('Legacy addVillage called'); },
        removeVillage: () => { diagnostics.warn('Legacy removeVillage called'); },
        createTradeRoute: (_route: TradeRoute) => {
            diagnostics.warn('Legacy createTradeRoute called');
            return false;
        },
        executeTradeRoute: (_routeId: string) => {
            diagnostics.warn('Legacy executeTradeRoute called');
            return false;
        },
        queueMigration: (_residentId: string, _fromVillageId: string, _toVillageId: string) => {
            diagnostics.warn('Legacy queueMigration called');
            return false;
        },
        processMigrationTick: (): MigrationRequest[] => {
            diagnostics.warn('Legacy processMigrationTick called');
            return [];
        },
        getTradeRoutes: (): TradeRoute[] => {
            diagnostics.warn('Legacy getTradeRoutes called');
            return [];
        },
        getMigrationQueue: (): MigrationRequest[] => {
            diagnostics.warn('Legacy getMigrationQueue called');
            return [];
        },
        getLastTradeResult: (): TradeResult | null => {
            diagnostics.warn('Legacy getLastTradeResult called');
            return null;
        },
        seedTradeRoutes: (_routes: TradeRoute[], _lastResult?: TradeResult) => {
            diagnostics.warn('Legacy seedTradeRoutes called');
        },
        seedMigrationQueue: (_requests: MigrationRequest[]) => {
            diagnostics.warn('Legacy seedMigrationQueue called');
        },
        getResidentCompatibility,
        questTelemetry,
        questTelemetryPanelState,
        draggingResidentIdInMap: draggingResidentId,
        setActiveIdInMap: setActiveId,
        updateState: (updater: (prev: VillageState) => VillageState, message: string) => updateState(updater, message),
        formatCycleSeconds: (val: number) => `${Math.floor(val / 60)}:${String(val % 60).padStart(2, '0')}`,

        // Drag Error Recovery
        dragErrorRecovery,
    };
}
