import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState, useMemo } from 'react';
import type { ResidentState, VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ActivityAreaSlot } from '@/ui/idleVillage/ActivityArea';
import { VillageSandboxContent } from './VillageSandbox';
import { DragContext } from '@/ui/idleVillage/components/DragContextStore';

const mockActivityScheduler = {
  advanceTimeUnitsDebug: vi.fn(),
  pauseTimer: vi.fn(),
  resumeTimer: vi.fn(),
  resetScheduler: vi.fn(),
};

const baseActivity: ActivityDefinition = {
  id: 'job_city_rats',
  label: 'Clear Rats',
  description: 'Remove rats from the city.',
  tags: ['job'],
  slotTags: ['village'],
  resolutionEngineId: 'job',
};

const mockConfig = {
  resources: {
    gold: { id: 'gold', label: 'Gold', icon: '🪙', colorClass: 'text-amber-200' },
    food: { id: 'food', label: 'Food', icon: '🍖', colorClass: 'text-emerald-200' },
    population: { id: 'population', label: 'Population', icon: '👥', colorClass: 'text-blue-200' },
  },
};

const sampleTradeRoutes = [
  { id: 'route-1', originId: 'village-1', destinationId: 'village-2', status: 'idle' as const },
];

const noop = () => undefined;

const createResidents = (): Record<string, ResidentState> => ({
  'resident-1': {
    id: 'resident-1',
    displayName: 'Ari',
    status: 'available',
    fatigue: 40,
    currentHp: 100,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    statSnapshot: {},
    statTags: [],
  },
  'resident-2': {
    id: 'resident-2',
    displayName: 'Bryn',
    status: 'available',
    fatigue: 60,
    currentHp: 100,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    statSnapshot: {},
    statTags: [],
  },
});

const buildInitialVillageState = (): VillageState => ({
  currentTime: 0,
  resources: { gold: 100, food: 40, population: 2 },
  residents: createResidents(),
  activities: {},
  eventLog: [],
  questOffers: {},
});

const useMockVillageSandbox = () => {
  const [villageState, setVillageState] = useState<VillageState>(() => buildInitialVillageState());
  const [isResting, setIsResting] = useState(false);

  const residents = useMemo(() => Object.values(villageState.residents), [villageState.residents]);

  const activityAreaSlots = useMemo<ActivityAreaSlot[]>(
    () => [
      {
        slotId: 'job_city_rats',
        label: 'Clear Rats',
        iconName: '🐀',
        assignedWorkerName: residents[0]?.displayName ?? null,
        assignedWorkerAvatarUrl: null,
        visualVariant: 'azure',
        progressFraction: 0.2,
        elapsedSeconds: 30,
        totalDurationSeconds: 120,
        canAcceptDrop: true,
      },
    ],
    [residents],
  );

  const slotDropStates = { job_city_rats: 'idle' as const };

  const handleQuickWorkShift = () => {
    mockActivityScheduler.advanceTimeUnitsDebug(1);
    setVillageState((prev) => ({
      ...prev,
      resources: {
        ...prev.resources,
        gold: (prev.resources.gold ?? 0) - 5,
        food: (prev.resources.food ?? 0) - 1,
      },
    }));
  };

  const handleQuickRest = async () => {
    if (!isResting) {
      mockActivityScheduler.pauseTimer();
      setVillageState((prev) => ({
        ...prev,
        residents: Object.fromEntries(
          Object.entries(prev.residents).map(([id, resident]) => [
            id,
            {
              ...resident,
              fatigue: Math.max(0, resident.fatigue - 10),
            },
          ]),
        ),
      }));
    } else {
      mockActivityScheduler.resumeTimer();
    }
    setIsResting((prev) => !prev);
  };

  return {
    residents,
    assignmentFeedback: null,
    handleResidentSelect: noop,
    isDayPhase: true,
    cycleProgressFraction: 0.4,
    cycleElapsedSeconds: 240,
    secondsPerTimeUnit: 60,
    cycleDayCount: 1,
    cyclePhaseLabel: 'Fase giorno',
    cyclePhaseIcon: '☀️',
    totalCycleSeconds: 600,
    isCyclePlaying: true,
    toggleCyclePlaying: noop,
    locationSlots: [],
    openTheaterForSlot: noop,
    isTheaterOpen: false,
    theaterPrimarySlot: null,
    theaterVerbs: [],
    handleCloseTheater: noop,
    handleLocationResidentDrop: noop,
    handleWorkerDrop: noop,
    slotDropStates,
    locationDropState: 'idle',
    activityAreaSlots,
    activityAreaHandlers: undefined,
    managedActivities: [baseActivity],
    demoPanelHandlers: {
      onStart: noop,
      onRemoveAll: noop,
      onSlotDrop: noop,
      onSlotClear: noop,
      setRequirement: noop,
    },
    resetState: vi.fn(),
    config: mockConfig,
    activityScheduler: mockActivityScheduler,
    villageState,
    activeSlots: [],
    getVillageSummaries: () => [{ id: 'village-1' }],
    getTradeRoutes: () => sampleTradeRoutes,
    getMigrationQueue: () => [],
    getLastTradeResult: () => null,
    createTradeRoute: noop,
    executeTradeRoute: noop,
    processMigrationTick: noop,
    handleResetSandboxState: vi.fn(),
    seedTradeRoutes: noop,
    seedMigrationQueue: noop,
    handleQuickWorkShift,
    handleQuickRest,
    isResting,
    resourceItems: [
      { id: 'gold', label: 'Gold', icon: '🪙', value: villageState.resources.gold ?? 100, accentClass: 'text-amber-200' },
      { id: 'food', label: 'Food', icon: '🍖', value: villageState.resources.food ?? 40, accentClass: 'text-emerald-200' },
      { id: 'population', label: 'Population', icon: '👥', value: 2, accentClass: 'text-blue-200' },
    ],
    headerResources: { gold: villageState.resources.gold ?? 100, food: villageState.resources.food ?? 40, population: 2 },
  };
};

vi.mock('@/ui/idleVillage/hooks/useVillageSandbox', () => ({
  useVillageSandbox: () => useMockVillageSandbox(),
}));

const renderWithProviders = () => {
  const dragValue = { activeId: null as string | null, setActiveId: vi.fn<(id: string | null) => void>() };
  return render(
    <DragContext.Provider value={dragValue}>
      <VillageSandboxContent />
    </DragContext.Provider>,
  );
};

describe('VillageSandbox cycle controls', () => {
  beforeAll(() => {
    class NoopObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    vi.stubGlobal('IntersectionObserver', NoopObserver);
    vi.stubGlobal('ResizeObserver', NoopObserver);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking Work Shift consumes resources and advances scheduler time', async () => {
    renderWithProviders();

    expect(screen.getByTestId('summary-gold-value')).toHaveTextContent('100');
    fireEvent.click(screen.getByTestId('work-shift-button'));

    await waitFor(() => {
      expect(screen.getByTestId('summary-gold-value')).toHaveTextContent('95');
    });
    expect(mockActivityScheduler.advanceTimeUnitsDebug).toHaveBeenCalledWith(1);
  });

  it('toggling Rest recovers fatigue and pauses/resumes the scheduler', async () => {
    renderWithProviders();

    const restButton = screen.getByTestId('rest-button');
    const fatigueValue = screen.getByTestId('avg-fatigue-value');

    expect(fatigueValue).toHaveTextContent('50');

    fireEvent.click(restButton);

    await waitFor(() => {
      expect(fatigueValue).toHaveTextContent('40');
      expect(restButton).toHaveTextContent(/Resume Work/i);
    });
    expect(mockActivityScheduler.pauseTimer).toHaveBeenCalled();

    fireEvent.click(restButton);

    await waitFor(() => {
      expect(restButton).toHaveTextContent(/^Rest$/i);
    });
    expect(mockActivityScheduler.resumeTimer).toHaveBeenCalled();
  });
});
