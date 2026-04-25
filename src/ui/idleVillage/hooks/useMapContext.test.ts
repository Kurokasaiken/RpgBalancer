import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { DragContext } from '@/ui/idleVillage/components/DragContextStore';
import { useMapContext } from './useMapContext';
import { useVillageSandbox } from './useVillageSandbox';
import { useActivityScheduler } from './useActivityScheduler';
import { useVillageShellContext } from './useVillageShellContext';
import type { UseVillageShellContextReturn } from './useVillageShellContext';
import type { UseVillageStateStoreReturn } from './useAsyncVillageStateStore';
import type { ThemeSwitcherApi } from '@/hooks/useThemeSwitcher';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DEFAULT_THEME_ID, themePresetMap } from '@/data/themePresets';
import type { ResidentState, VillageState } from '@/engine/game/idleVillage/TimeEngine';

type ActivitySchedulerReturn = ReturnType<typeof useActivityScheduler>;

const createVillageStateMock = (overrides?: Partial<VillageState>): VillageState => ({
    currentTime: 0,
    resources: { food: 10, gold: 100 },
    residents: {},
    activities: {},
    eventLog: [],
    questOffers: {},
    ...overrides,
});

const createSchedulerMock = (overrides?: Partial<ActivitySchedulerReturn>): ActivitySchedulerReturn => {
    const baseState = overrides?.villageState ?? createVillageStateMock();
    const base: ActivitySchedulerReturn = {
        villageState: baseState,
        updateVillageState: vi.fn(),
        scheduledActivities: overrides?.scheduledActivities ?? new Map(),
        globalTime: overrides?.globalTime ?? 0,
        isRunning: overrides?.isRunning ?? false,
        startActivity: overrides?.startActivity ?? vi.fn(),
        cancelActivity: overrides?.cancelActivity ?? vi.fn(),
        getActivityState: overrides?.getActivityState ?? vi.fn(),
        canAssignResident: overrides?.canAssignResident ?? vi.fn(),
        pauseTimer: overrides?.pauseTimer ?? vi.fn(),
        resumeTimer: overrides?.resumeTimer ?? vi.fn(),
        resetScheduler: overrides?.resetScheduler ?? vi.fn(),
        advanceTimeUnitsDebug: overrides?.advanceTimeUnitsDebug ?? vi.fn(),
        advanceTimeSeconds: overrides?.advanceTimeSeconds ?? vi.fn(),
        drainTelemetryEvents: overrides?.drainTelemetryEvents ?? vi.fn(() => []),
        getSchedulerTelemetry: overrides?.getSchedulerTelemetry ?? vi.fn(() => ({ events: [] })),
        getAssignmentDiagnostics: overrides?.getAssignmentDiagnostics ?? vi.fn(() => null),
    };
    return base;
};

const createConfigMock = (overrides?: Partial<IdleVillageConfig>): IdleVillageConfig => ({
    ...DEFAULT_IDLE_VILLAGE_CONFIG,
    ...overrides,
    globalRules: {
        ...DEFAULT_IDLE_VILLAGE_CONFIG.globalRules,
        secondsPerTimeUnit: 1,
        dayLengthInTimeUnits: 5,
        dayNightCycle: { dayTimeUnits: 5, nightTimeUnits: 5 },
        startingResources: { food: 10, gold: 100 },
        maxFatigueBeforeExhausted: 100,
        fatigueRecoveryPerDay: 50,
        startingResidentFatigue: 0,
    },
    activities: overrides?.activities ?? {},
    resources: overrides?.resources ?? {},
    mapSlots: overrides?.mapSlots ?? {},
});

const createThemeMock = (): ThemeSwitcherApi => ({
    activePreset: themePresetMap[DEFAULT_THEME_ID],
    activePresetId: DEFAULT_THEME_ID,
    presets: [],
    isRandomized: false,
    setPreset: vi.fn(),
    randomizeTheme: vi.fn(),
    resetRandomization: vi.fn(),
});

const createVillageStateStoreMock = (
    overrides?: Partial<UseVillageStateStoreReturn>,
): UseVillageStateStoreReturn => ({
    state: createVillageStateMock(),
    history: [],
    isLoading: false,
    error: null,
    saveState: vi.fn(async () => {}),
    updateState: vi.fn(async () => {}),
    undo: vi.fn(async () => null),
    canUndo: false,
    exportState: vi.fn(async () => ''),
    importState: vi.fn(async () => {}),
    resetState: vi.fn(async () => createVillageStateMock()),
    clearState: vi.fn(async () => {}),
    ...overrides,
});

const createShellContextMock = (
    overrides?: Partial<UseVillageShellContextReturn>,
): UseVillageShellContextReturn => ({
    theme: createThemeMock(),
    config: createConfigMock(),
    villageStateStore: createVillageStateStoreMock(),
    shellPresetOptions: [],
    activeShellPresetId: 'default-shell-preset',
    setShellPresetId: vi.fn(),
    ...overrides,
});

const mockLoadResidentsFromCharacterManager = vi.hoisted(() =>
    vi.fn<() => ResidentState[]>(() => []),
);

vi.mock('@/engine/game/idleVillage/characterImport', () => ({
    loadResidentsFromCharacterManager: mockLoadResidentsFromCharacterManager,
}));

vi.mock('@/ui/idleVillage/residentName', () => ({
    formatResidentLabel: vi.fn((resident: ResidentState) => resident.displayName || 'Unknown'),
}));

const mockUseVillageShellContext = vi.fn<typeof useVillageShellContext>(() => createShellContextMock());

const setShellContextMock = (overrides?: Partial<UseVillageShellContextReturn>) => {
    mockUseVillageShellContext.mockReturnValue(createShellContextMock(overrides));
};

vi.mock('./useVillageShellContext', () => ({
    useVillageShellContext: (...args: Parameters<typeof useVillageShellContext>) =>
        mockUseVillageShellContext(...args),
}));

vi.mock('./useActivityScheduler', () => ({
    useActivityScheduler: vi.fn(() => createSchedulerMock()),
}));

const mockUseSandboxResetController = vi.fn(() => ({
    detailPanelSlotIds: [],
    setDetailPanelSlotIds: vi.fn(),
    openDetailPanel: vi.fn(),
    closeDetailPanel: vi.fn(),
    handleSlotResidentDragEnter: vi.fn(),
    handleSlotResidentDragLeave: vi.fn(),
    handleResetSandboxState: vi.fn(async () => {}),
    handleResetResidents: vi.fn(async () => {}),
}));

vi.mock('./useSandboxResetController', () => ({
    useSandboxResetController: (...args: Parameters<typeof mockUseSandboxResetController>) =>
        mockUseSandboxResetController(...args),
}));

describe('useMapContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadResidentsFromCharacterManager.mockReturnValue([]);
        setShellContextMock();
    });

    function renderWithDragProvider<T>(callback: () => T) {
        const dragValue = { activeId: null as string | null, setActiveId: vi.fn<(id: string | null) => void>() };
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(DragContext.Provider, { value: dragValue, children });
        const utils = renderHook(callback, { wrapper });
        return { ...utils, dragValue };
    }

    it('should initialize with correct cycleDayCount', async () => {
        const { result } = renderWithDragProvider(() => useMapContext());

        await waitFor(() => {
            expect(result.current.cycleDayCount).toBe(0);
        });
    });

    it('should calculate cycleDayCount correctly', async () => {
        const stateStore = createVillageStateStoreMock({
            state: createVillageStateMock({ currentTime: 10 }),
        });
        setShellContextMock({ villageStateStore: stateStore });

        const { result } = renderWithDragProvider(() => useVillageSandbox());

        await waitFor(() => {
            expect(result.current.cycleDayCount).toBe(1);
        }); // 10 / 10 = 1
    });

    it('should increment cycleDayCount on cycle completion', async () => {
        // Start with currentTime = 0
        const mockScheduler = createSchedulerMock({
            villageState: createVillageStateMock({ currentTime: 0 }),
        });

        vi.mocked(useActivityScheduler).mockReturnValue(mockScheduler);
        const initialStateStore = createVillageStateStoreMock({
            state: createVillageStateMock({ currentTime: 0 }),
        });
        setShellContextMock({ villageStateStore: initialStateStore });

        const { result, rerender } = renderWithDragProvider(() => useMapContext());

        expect(result.current.cycleDayCount).toBe(0);

        // Advance time to complete one cycle (10 units)
        act(() => {
            const updatedStateStore = createVillageStateStoreMock({
                state: createVillageStateMock({ currentTime: 10 }),
            });
            setShellContextMock({ villageStateStore: updatedStateStore });
        });

        rerender();

        await waitFor(() => {
            expect(result.current.cycleDayCount).toBe(1);
        });
    });

    it('should provide correct resource values', async () => {
        const { result } = renderWithDragProvider(() => useVillageSandbox());

        await waitFor(() => {
            expect(result.current.villageState.resources?.food).toBe(10);
            expect(result.current.villageState.resources?.gold).toBe(100);
        });
    });

    it('should expose the same portrait ids as the Character Manager dataset', async () => {
        const testResidents: ResidentState[] = [
            {
                id: 'char-1',
                displayName: 'Hero One',
                status: 'available',
                fatigue: 0,
                currentHp: 100,
                maxHp: 100,
                isHero: false,
                isInjured: false,
                survivalCount: 0,
                survivalScore: 0,
                portraitUrl: 'portrait-a.png',
                statSnapshot: {},
                statTags: [],
            },
            {
                id: 'char-2',
                displayName: 'Hero Two',
                status: 'available',
                fatigue: 0,
                currentHp: 95,
                maxHp: 95,
                isHero: false,
                isInjured: false,
                survivalCount: 0,
                survivalScore: 0,
                portraitUrl: 'portrait-b.png',
                statSnapshot: {},
                statTags: [],
            },
        ];

        mockLoadResidentsFromCharacterManager.mockReturnValue(testResidents);
        const residentMap = Object.fromEntries(testResidents.map((resident) => [resident.id, resident])) as Record<
            string,
            ResidentState
        >;
        mockUseVillageShellContext.mockReturnValue(
            createShellContextMock({
                villageStateStore: createVillageStateStoreMock({
                    state: createVillageStateMock({
                        residents: residentMap,
                    }),
                }),
            }),
        );

        const { result } = renderWithDragProvider(() => useVillageSandbox());

        await waitFor(() => {
            expect(result.current.villageState.residents).toEqual(residentMap);
        });

        await waitFor(() => {
            const mapRosterPortraits = result.current.residents
                .map((resident: ResidentState) => resident.portraitUrl)
                .sort();
            const characterManagerPortraits = testResidents.map((resident: ResidentState) => resident.portraitUrl).sort();

            expect(mapRosterPortraits).toEqual(characterManagerPortraits);
        });
    });

    it('toggles the scheduler play/pause state when invoking toggleCyclePlaying', async () => {
        const { result } = renderWithDragProvider(() => useMapContext());

        await waitFor(() => {
            expect(result.current.activityScheduler).toBeTruthy();
        });

        act(() => {
            result.current.toggleCyclePlaying();
        });

        expect(result.current.activityScheduler.resumeTimer).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.toggleCyclePlaying();
        });

        expect(result.current.activityScheduler.pauseTimer).toHaveBeenCalledTimes(1);
    });
});
