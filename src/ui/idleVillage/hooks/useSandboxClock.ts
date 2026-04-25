import { useCallback, useMemo, useState, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { IdleVillageConfig, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import {
    createVillageStateFromConfig,
    type VillageState,
    type ResidentState,
    type VillageResources,
} from '@/engine/game/idleVillage/TimeEngine';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import { deriveCycleConfig, deriveCycleState } from '@/ui/idleVillage/map/ticker/cycleMath';
import { useActivityScheduler } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';

const enqueueMicrotask =
    typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (cb: () => void) => {
              Promise.resolve().then(cb);
          };

type VillageStateFactory = () => VillageState;

/**
 * Configuration object for {@link useSandboxClock}.
 */
export interface UseSandboxClockOptions {
    /**
     * Idle Village balancing configuration used to derive timings and create fresh states.
     */
    config: IdleVillageConfig;
    /**
     * Initial (or current) village state snapshot. Can be provided as a factory to always read
     * the latest reference without recreating callers' objects.
     */
    initialVillageState: VillageState | VillageStateFactory;
    /**
     * Reset helper sourced from {@link useVillageStateStore}. Needed to keep persistence
     * history in sync with manual resets triggered from the sandbox UI.
     */
    resetState: (factory: VillageStateFactory, description?: string) => VillageState | Promise<VillageState>;
    /**
     * Optional listener invoked whenever the scheduler publishes a full VillageState snapshot.
     */
    onStateUpdate: (updater: (prev: VillageState) => VillageState, message?: string) => Promise<void>;
    /**
     * Optional listener invoked whenever resource pools change.
     */
    onResourcesChange?: (resources: VillageResources, changes?: ResourceDeltaDefinition[]) => void;
}

/**
 * Structured clock/scheduler data consumed by the Idle Village sandbox UI.
 */
export interface SandboxClockState {
    /** Scheduler instance powering activities and global time tracking. */
    activityScheduler: ReturnType<typeof useActivityScheduler>;
    /** Whether the current phase is the day portion of the cycle. */
    isDayPhase: boolean;
    /** Localized phase label (e.g. 'Fase giorno'). */
    cyclePhaseLabel: string;
    /** Icon used by the halo card to represent the phase. */
    cyclePhaseIcon: string;
    /** Cycle progress from 0 to 1. */
    cycleProgressFraction: number;
    /** Elapsed seconds inside the current cycle. */
    cycleElapsedSeconds: number;
    /** Total seconds for a complete day/night cycle. */
    totalCycleSeconds: number;
    /** Number of fully completed cycles since start. */
    cycleDayCount: number;
    /** Visual variant used by the UI (solar for day, azure for night). */
    cycleVariant: VerbVisualVariant;
    /** Seconds represented by a single time unit in the config. */
    secondsPerTimeUnit: number;
    /** Configured day portion in time units. */
    dayTimeUnits: number;
    /** Configured night portion in time units. */
    nightTimeUnits: number;
    /** Whether the player marked the clock as running. */
    isCyclePlaying: boolean;
    /** Setter mirroring {@link isCyclePlaying}. */
    setIsCyclePlaying: Dispatch<SetStateAction<boolean>>;
    /** Subscribe to tick updates emitted while the clock is running. */
    subscribeClock: (subscriberId: string, handler: (deltaSeconds: number) => void) => void;
    /** Remove a previously registered tick subscriber. */
    unsubscribeClock: (subscriberId: string) => void;
    /**
     * Deterministic reset handler that rebuilds the village state using the Character Manager
     * dataset and synchronizes both the persistence store and the scheduler.
     */
    handleResetSandboxState: () => Promise<VillageState>;
    /** Schedule window-based timeout bound to the sandbox lifecycle. */
    scheduleTimeout: (callback: () => void, delayMs: number) => () => void;
}

/**
 * Centralized controller for the Idle Village sandbox clock. It derives the day/night cycle,
 * instantiates the shared activity scheduler, and exposes deterministic helpers so higher-level
 * contexts can focus on orchestration duties. Quick actions (work/rest boosts, harness panels, test
 * hooks) always talk to this hook so there is a single source of truth for ticking time units and
 * propagating scheduler updates to the UI.
 */
export function useSandboxClock({
    config,
    initialVillageState,
    resetState,
    onStateUpdate,
    onResourcesChange,
}: UseSandboxClockOptions): SandboxClockState {
    const resolvedVillageState =
        typeof initialVillageState === 'function'
            ? (initialVillageState as VillageStateFactory)()
            : initialVillageState;

    const cycleConfig = useMemo(() => deriveCycleConfig(config), [config]);

    const cycleState = useMemo(
        () => deriveCycleState(cycleConfig, resolvedVillageState.currentTime),
        [cycleConfig, resolvedVillageState.currentTime],
    );

    const { secondsPerTimeUnit, dayTimeUnits, nightTimeUnits, totalCycleSeconds } = cycleConfig;

    const cycleVariant: VerbVisualVariant = cycleState.isDayPhase ? 'solar' : 'azure';

    const cycleTimeUnitsRef = useRef(resolvedVillageState.currentTime);
    const [cycleRuntime, setCycleRuntime] = useState(() => ({
        isDayPhase: cycleState.isDayPhase,
        phaseLabel: cycleState.phaseLabel,
        phaseIcon: cycleState.phaseIcon,
        progressFraction: cycleState.progressFraction,
        elapsedSeconds: cycleState.elapsedSeconds,
    }));

    const syncCycleRuntimeToUnits = useCallback(
        (nextUnits: number) => {
            cycleTimeUnitsRef.current = nextUnits;
            const derived = deriveCycleState(cycleConfig, nextUnits);
            setCycleRuntime({
                isDayPhase: derived.isDayPhase,
                phaseLabel: derived.phaseLabel,
                phaseIcon: derived.phaseIcon,
                progressFraction: derived.progressFraction,
                elapsedSeconds: derived.elapsedSeconds,
            });
        },
        [cycleConfig],
    );

    const [isCyclePlaying, setIsCyclePlaying] = useState(false);
    const subscribersRef = useRef<Map<string, (deltaSeconds: number) => void>>(new Map());
    const frameRequestRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const timeoutHandlesRef = useRef<Set<number>>(new Set());

    useEffect(() => () => {
        if (typeof window === 'undefined') {
            return;
        }
        timeoutHandlesRef.current.forEach((handle) => window.clearTimeout(handle));
        timeoutHandlesRef.current.clear();
    }, []);

    const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
        if (typeof window === 'undefined') {
            callback();
            return () => undefined;
        }
        const normalizedDelay = Number.isFinite(delayMs) && delayMs > 0 ? delayMs : 0;
        const timeoutId = window.setTimeout(() => {
            timeoutHandlesRef.current.delete(timeoutId);
            callback();
        }, normalizedDelay);
        timeoutHandlesRef.current.add(timeoutId);
        return () => {
            window.clearTimeout(timeoutId);
            timeoutHandlesRef.current.delete(timeoutId);
        };
    }, []);

    /**
     * Converts elapsed seconds into config time-units so the derived cycle state stays in sync
     * with scheduler ticks and quick actions that jump the timeline forward.
     */
    const advanceCycleRuntime = useCallback(
        (deltaSeconds: number) => {
            if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
                return;
            }
            const deltaUnits = deltaSeconds / secondsPerTimeUnit;
            if (!Number.isFinite(deltaUnits) || deltaUnits <= 0) {
                return;
            }
            const nextUnits = cycleTimeUnitsRef.current + deltaUnits;
            syncCycleRuntimeToUnits(nextUnits);
        },
        [secondsPerTimeUnit, syncCycleRuntimeToUnits],
    );

    /**
     * Shared activity scheduler instance used by every sandbox subsystem (roster, quick actions,
     * ActionDetailHarness). Keeping a single instance guarantees that helper actions such as
     * `handleQuickWorkShift`, `handleQuickRest`, or `advanceTimeUnits` test hooks cannot desync the
     * UI from the underlying VillageState.
     */
    const activityScheduler = useActivityScheduler({
        config,
        initialVillageState: resolvedVillageState,
        isDayPhase: cycleRuntime.isDayPhase,
        onStateUpdate: (state) => {
            syncCycleRuntimeToUnits(state.currentTime);
            onStateUpdate?.(() => state, 'from sandbox');
        },
        onResourcesChange: (resources, changes) => {
            onResourcesChange?.(resources, changes);
        },
        villageState: resolvedVillageState,
        updateState: onStateUpdate,
    });

    /**
     * Deterministic reset helper invoked by the sandbox UI and test harness. It reloads the
     * Character Manager dataset, rebuilds the VillageState, notifies persistence, and re-aligns the
     * scheduler + local cycle cache so drag/drop, quick actions, and timeline controls continue to
     * share the same clock.
     */
    const handleResetSandboxState = useCallback(async () => {
        const latestResidents: ResidentState[] = loadResidentsFromCharacterManager({ config });
        const seededState = createVillageStateFromConfig({ config, initialResidents: latestResidents });
        const nextState = await resetState(() => seededState, 'VillageSandbox manual reset');
        activityScheduler.resetScheduler(nextState);
        syncCycleRuntimeToUnits(nextState.currentTime ?? 0);
        return nextState;
    }, [activityScheduler, config, resetState, syncCycleRuntimeToUnits]);

    const unsubscribeClock = useCallback((subscriberId: string) => {
        subscribersRef.current.delete(subscriberId);
    }, []);

    const subscribeClock = useCallback((subscriberId: string, handler: (deltaSeconds: number) => void) => {
        subscribersRef.current.set(subscriberId, handler);
    }, []);

    const notifySubscribers = useCallback(
        (deltaSeconds: number) => {
            subscribersRef.current.forEach((handler) => {
                handler(deltaSeconds);
            });
        },
        [],
    );

    const stopLoop = useCallback(() => {
        if (frameRequestRef.current !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(frameRequestRef.current);
            frameRequestRef.current = null;
        }
        lastTimestampRef.current = null;
    }, []);

    useEffect(() => {
        if (!isCyclePlaying) {
            stopLoop();
            return;
        }

        if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
            return () => undefined;
        }

        const step = (timestamp: number) => {
            if (lastTimestampRef.current === null) {
                lastTimestampRef.current = timestamp;
            }
            const deltaSeconds = Math.max(0, (timestamp - lastTimestampRef.current) / 1000);
            lastTimestampRef.current = timestamp;
            if (deltaSeconds > 0) {
                advanceCycleRuntime(deltaSeconds);
                notifySubscribers(deltaSeconds);
            }
            frameRequestRef.current = window.requestAnimationFrame(step);
        };

        frameRequestRef.current = window.requestAnimationFrame(step);

        return () => {
            stopLoop();
        };
    }, [advanceCycleRuntime, isCyclePlaying, notifySubscribers, stopLoop]);

    useEffect(() => {
        if (cycleTimeUnitsRef.current === resolvedVillageState.currentTime) {
            return;
        }
        enqueueMicrotask(() => {
            syncCycleRuntimeToUnits(resolvedVillageState.currentTime);
        });
    }, [resolvedVillageState.currentTime, syncCycleRuntimeToUnits]);

    const cycleDayCount = Math.floor(resolvedVillageState.currentTime / cycleConfig.totalCycleUnits);

    return {
        activityScheduler,
        isDayPhase: cycleRuntime.isDayPhase,
        cyclePhaseLabel: cycleRuntime.phaseLabel,
        cyclePhaseIcon: cycleRuntime.phaseIcon,
        cycleProgressFraction: cycleRuntime.progressFraction,
        cycleElapsedSeconds: cycleRuntime.elapsedSeconds,
        totalCycleSeconds,
        cycleDayCount,
        cycleVariant,
        secondsPerTimeUnit,
        dayTimeUnits,
        nightTimeUnits,
        isCyclePlaying,
        setIsCyclePlaying,
        subscribeClock,
        unsubscribeClock,
        handleResetSandboxState,
        scheduleTimeout,
    };
}
