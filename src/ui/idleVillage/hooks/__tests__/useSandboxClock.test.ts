import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSandboxClock } from '../useSandboxClock';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { VillageState, ResidentState, VillageResources } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

const schedulerInstances = vi.hoisted(() => [] as SchedulerStub[]);
const mockLoadResidents = vi.hoisted(() => vi.fn<() => ResidentState[]>(() => []));

type SchedulerStub = ReturnType<typeof createSchedulerStub>;

const createSchedulerStub = (params: {
    initialVillageState: VillageState;
    onStateUpdate?: (state: VillageState) => void;
    onResourcesChange?: (resources: VillageResources) => void;
}) => ({
    villageState: params.initialVillageState,
    scheduledActivities: new Map(),
    globalTime: 0,
    isRunning: false,
    startActivity: vi.fn(),
    cancelActivity: vi.fn(),
    getActivityState: vi.fn(),
    canAssignResident: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    resetScheduler: vi.fn(),
    advanceTimeUnitsDebug: vi.fn(),
    advanceTimeSeconds: vi.fn(),
    drainTelemetryEvents: vi.fn(() => []),
    getSchedulerTelemetry: vi.fn(() => ({ events: [] })),
    getAssignmentDiagnostics: vi.fn(() => null),
    emitStateUpdate: (state: VillageState) => {
        params.onStateUpdate?.(state);
    },
    emitResourceChange: (resources: VillageResources) => {
        params.onResourcesChange?.(resources);
    },
    lastAdvanceSeconds: 0,
    advanceTimeBySeconds(deltaSeconds: number) {
        this.lastAdvanceSeconds = deltaSeconds;
        params.onStateUpdate?.({ ...this.villageState, currentTime: (this.villageState.currentTime ?? 0) + deltaSeconds });
    },
});

vi.mock('../useActivityScheduler', () => {
    return {
        useActivityScheduler: vi.fn(
            (args: {
                initialVillageState: VillageState;
                onStateUpdate?: (state: VillageState) => void;
                onResourcesChange?: (resources: VillageResources, changes?: unknown) => void;
            }) => {
                const scheduler = createSchedulerStub({
                    initialVillageState: args.initialVillageState,
                    onStateUpdate: args.onStateUpdate,
                    onResourcesChange: args.onResourcesChange,
                });
                schedulerInstances.push(scheduler);
                return scheduler;
            },
        ),
    };
});

vi.mock('@/engine/game/idleVillage/characterImport', () => ({
    loadResidentsFromCharacterManager: mockLoadResidents,
}));

const createVillageStateMock = (overrides?: Partial<VillageState>): VillageState => ({
    currentTime: 0,
    resources: {},
    residents: {},
    activities: {},
    eventLog: [],
    questOffers: {},
    ...overrides,
});

const cloneConfig = (): IdleVillageConfig => structuredClone(DEFAULT_IDLE_VILLAGE_CONFIG);

describe('useSandboxClock', () => {
    beforeEach(() => {
        schedulerInstances.length = 0;
        mockLoadResidents.mockReturnValue([]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('cycle math and resets', () => {
        it('computes cycleDayCount based on current time units', () => {
            const config = cloneConfig();
            const resetState = vi.fn((factory: () => VillageState) => factory());

            const { result, rerender } = renderHook(
                ({ state }) =>
                    useSandboxClock({
                        config,
                        initialVillageState: state,
                        resetState,
                        onStateUpdate: vi.fn(),
                    }),
                {
                    initialProps: { state: createVillageStateMock({ currentTime: 0 }) },
                },
            );

            expect(result.current.cycleDayCount).toBe(0);

            rerender({ state: createVillageStateMock({ currentTime: 10 }) });

            expect(result.current.cycleDayCount).toBe(1);
        });

        it('resets scheduler and village state deterministically', async () => {
            const config = cloneConfig();
            const resetState = vi.fn((factory: () => VillageState) => factory());

            const { result } = renderHook(() =>
                useSandboxClock({
                    config,
                    initialVillageState: createVillageStateMock(),
                    resetState,
                    onStateUpdate: vi.fn(),
                }),
            );

            const scheduler = schedulerInstances.at(-1);
            expect(scheduler).toBeDefined();

            let returnedState: VillageState | undefined;

            await act(async () => {
                returnedState = await result.current.handleResetSandboxState();
            });

            expect(resetState).toHaveBeenCalledTimes(1);
            expect(mockLoadResidents).toHaveBeenCalledTimes(1);
            expect(scheduler?.resetScheduler).toHaveBeenCalledWith(returnedState);
            expect(returnedState).toBeTruthy();
        });
    });

    describe('play/pause loop', () => {
        let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
        let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
        let frameCallback: FrameRequestCallback | null;

        beforeEach(() => {
            vi.useFakeTimers();
            frameCallback = null;
            originalRequestAnimationFrame = window.requestAnimationFrame;
            originalCancelAnimationFrame = window.cancelAnimationFrame;
            window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
                frameCallback = callback;
                return 1;
            });
            window.cancelAnimationFrame = vi.fn(() => {
                frameCallback = null;
            });
        });

        afterEach(() => {
            vi.useRealTimers();
            window.requestAnimationFrame = originalRequestAnimationFrame;
            window.cancelAnimationFrame = originalCancelAnimationFrame;
        });

        it('notifies subscribers while playing and stops after pausing', () => {
            const config = cloneConfig();
            const resetState = vi.fn((factory: () => VillageState) => factory());
            const { result } = renderHook(() =>
                useSandboxClock({
                    config,
                    initialVillageState: createVillageStateMock(),
                    resetState,
                    onStateUpdate: vi.fn(),
                }),
            );

            const subscriber = vi.fn();

            act(() => {
                result.current.subscribeClock('test', subscriber);
                result.current.setIsCyclePlaying(true);
            });

            expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
            expect(frameCallback).toBeTruthy();

            act(() => {
                frameCallback?.(0);
            });

            act(() => {
                frameCallback?.(1000);
            });

            expect(subscriber).toHaveBeenCalledWith(1);

            act(() => {
                result.current.setIsCyclePlaying(false);
            });

            act(() => {
                frameCallback?.(1600);
            });

            expect(subscriber).toHaveBeenCalledTimes(1);
            expect(window.cancelAnimationFrame).toHaveBeenCalled();
        });

        it('updates cycle runtime as animation frames advance', () => {
            const config = cloneConfig();
            const resetState = vi.fn((factory: () => VillageState) => factory());
            const { result } = renderHook(() =>
                useSandboxClock({
                    config,
                    initialVillageState: createVillageStateMock({ currentTime: 0 }),
                    resetState,
                    onStateUpdate: vi.fn(),
                }),
            );

            const initialElapsed = result.current.cycleElapsedSeconds;
            const initialProgress = result.current.cycleProgressFraction;

            act(() => {
                result.current.setIsCyclePlaying(true);
            });

            act(() => {
                frameCallback?.(0);
                frameCallback?.(1000);
            });

            expect(result.current.cycleElapsedSeconds).toBeGreaterThan(initialElapsed);
            expect(result.current.cycleProgressFraction).toBeGreaterThan(initialProgress);
        });
    });

    describe('advanceTimeUnits syncing', () => {
        it('updates cycle runtime when scheduler publishes a new state snapshot', () => {
            const config = cloneConfig();
            const resetState = vi.fn((factory: () => VillageState) => factory());
            const { result } = renderHook(() =>
                useSandboxClock({
                    config,
                    initialVillageState: createVillageStateMock({ currentTime: 0 }),
                    resetState,
                    onStateUpdate: vi.fn(),
                }),
            );

            const scheduler = schedulerInstances.at(-1);
            expect(scheduler).toBeDefined();

            const nextState = createVillageStateMock({ currentTime: 8 });

            act(() => {
                scheduler?.emitStateUpdate(nextState);
            });

            expect(result.current.cycleElapsedSeconds).toBeGreaterThan(0);
            expect(result.current.cycleProgressFraction).toBeGreaterThan(0);
        });

    });
});
