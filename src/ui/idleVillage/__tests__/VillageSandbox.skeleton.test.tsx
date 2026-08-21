import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ResidentState, VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ResidentRosterPanelProps } from '@/ui/idleVillage/components/ResidentRosterPanel';
import type { TheaterOverlayProps } from '@/ui/idleVillage/components/TheaterOverlay';
import type { ActivityAreaSlot, ActivityAreaHandlers, ActivityAreaProps } from '@/ui/idleVillage/ActivityArea';
// COMMENTED: import type { ResidentSlotRackProps } from '@/ui/idleVillage/slots/ResidentSlotRack';
import type { AncillarySlotEntry } from '@/ui/idleVillage/components/AncillaryPanels';
import type { LocationCardProps } from '@/ui/idleVillage/components/LocationCard';
import type { DetailPanelStackProps } from '@/ui/idleVillage/components/DetailPanelStack';

import VillageSandbox from '../VillageSandbox';
import { useVillageSandbox } from '@/ui/idleVillage/hooks/useVillageSandbox';
import type { UseVillageSandboxReturn } from '@/ui/idleVillage/hooks/useVillageSandbox';

const mockTheaterOverlay = vi.fn((props) => {
  if (!props.isOpen) {
    return null;
  }
  return (
    <div data-testid="theater-overlay">
      <button type="button" onClick={props.onClose}>
        Close overlay
      </button>
      <button
        type="button"
        onClick={() => {
          props.onResidentDrop?.('resident-alpha');
        }}
      >
        Drop resident
      </button>
    </div>
  );
});

vi.mock('@/ui/idleVillage/hooks/useVillageSandbox', () => ({
  useVillageSandbox: vi.fn(),
}));

const mockResidentRosterPanel = vi.fn(
  ({ residents }: ResidentRosterPanelProps) => (
    <section data-testid="resident-roster-panel-mock">{residents.length} residents</section>
  ),
);

vi.mock('@/ui/idleVillage/components/ResidentRosterPanel', () => ({
  __esModule: true,
  default: (props: ResidentRosterPanelProps) => mockResidentRosterPanel(props),
  ResidentRosterPanel: (props: ResidentRosterPanelProps) => mockResidentRosterPanel(props),
}));

vi.mock('@/ui/idleVillage/components/TheaterOverlay', () => ({
  __esModule: true,
  default: (props: TheaterOverlayProps) => mockTheaterOverlay(props),
  TheaterOverlay: (props: TheaterOverlayProps) => mockTheaterOverlay(props),
}));

const mockResidentSlotRack = vi.fn((props: ResidentSlotRackProps) => (
  <div data-testid="resident-slot-rack-mock" data-props={JSON.stringify(props)}>
    ResidentSlotRack
  </div>
));

vi.mock('@/ui/idleVillage/slots/ResidentSlotRack', () => ({
  __esModule: true,
  default: (props: ResidentSlotRackProps) => mockResidentSlotRack(props),
}));

// ActivitySlotCard component removed - mock removed

const mockLocationCard = vi.fn((props: LocationCardProps) => (
  <div data-testid="location-card-mock" data-props={JSON.stringify(props)}>
    LocationCard
  </div>
));

vi.mock('@/ui/idleVillage/components/LocationCard', () => ({
  __esModule: true,
  default: (props: LocationCardProps) => mockLocationCard(props),
}));

const mockDetailPanelStack = vi.fn((props: DetailPanelStackProps) => (
  props.detailContexts.length > 0 ? (
    <div data-testid="detail-panel-stack-mock" data-props={JSON.stringify(props)}>
      DetailPanelStack
    </div>
  ) : null
));

vi.mock('@/ui/idleVillage/components/DetailPanelStack', () => ({
  __esModule: true,
  default: (props: DetailPanelStackProps) => mockDetailPanelStack(props),
  DetailPanelStack: (props: DetailPanelStackProps) => mockDetailPanelStack(props),
}));

const mockActivityArea = vi.fn((props: ActivityAreaProps) => (
  <section data-testid="activity-area-mock" data-props={JSON.stringify(props)}>
    <span>{props.locationTitle}</span>
  </section>
));

vi.mock('@/ui/idleVillage/ActivityArea', () => ({
  __esModule: true,
  default: (props: ActivityAreaProps) => mockActivityArea(props),
}));

const mockSetActiveId = vi.fn();

vi.mock('@/ui/idleVillage/components/DragContext', () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-provider">{children}</div>,
}));

vi.mock('@/ui/idleVillage/components/DragContextStore', () => ({
  useDragContext: () => ({
    activeId: null,
    setActiveId: mockSetActiveId,
  }),
}));

const mockUseVillageSandbox = vi.mocked(useVillageSandbox);

const demoResidents: ResidentState[] = [
  {
    id: 'resident-alpha',
    displayName: 'Atria',
    status: 'available',
    fatigue: 10,
    currentHp: 90,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    portraitUrl: 'alpha.png',
    statSnapshot: { hp: 100 },
    statTags: ['forager'],
  },
  {
    id: 'resident-beta',
    displayName: 'Bram',
    status: 'available',
    fatigue: 5,
    currentHp: 80,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    portraitUrl: 'beta.png',
    statSnapshot: { hp: 90 },
    statTags: ['scout'],
  },
] as ResidentState[];

const baseSlot: ActivitySlotData = {
  slotId: 'job-harvest',
  label: 'Harvest',
  iconName: '🌾',
  assignedWorkerId: null,
  activity: {
    id: 'job-harvest',
    label: 'Harvest',
    tags: ['job'],
    slotTags: ['village_job'],
    resolutionEngineId: 'job',
  },
  mapSlotLabel: 'Fields',
  visualVariant: 'jade',
};

type SandboxVerbSummary = UseVillageSandboxReturn['theaterVerbs'][number];

type MockSandboxContext = Pick<
  UseVillageSandboxReturn,
  | 'residents'
  | 'assignmentFeedback'
  | 'handleResidentSelect'
  | 'isDayPhase'
  | 'cycleProgressFraction'
  | 'cycleElapsedSeconds'
  | 'secondsPerTimeUnit'
  | 'locationSlots'
  | 'openTheaterForSlot'
  | 'isTheaterOpen'
  | 'theaterPrimarySlot'
  | 'theaterVerbs'
  | 'handleCloseTheater'
  | 'handleLocationResidentDrop'
  | 'handleWorkerDrop'
  | 'slotDropStates'
  | 'locationDropState'
  | 'activityAreaSlots'
  | 'activityAreaHandlers'
  | 'managedActivities'
  | 'slotAssignments'
  | 'residentSlotRackSlots'
  | 'assignResidentToSlot'
  | 'clearResidentSlot'
  | 'getResidentSlotProgress'
  | 'demoPanelHandlers'
  | 'resetState'
  | 'config'
  | 'activityScheduler'
  | 'villageState'
  | 'activeSlots'
  | 'getVillageSummaries'
  | 'getTradeRoutes'
  | 'getMigrationQueue'
  | 'getLastTradeResult'
  | 'createTradeRoute'
  | 'executeTradeRoute'
  | 'processMigrationTick'
  | 'detailContexts'
  | 'resourceItems'
  | 'headerResources'
>;

const baseVerb: SandboxVerbSummary = {
  key: 'verb-harvest',
  source: 'system',
  activityId: 'job-harvest',
  slotId: 'job-harvest',
  label: 'Harvest',
  kindLabel: 'Job',
  isQuest: false,
  isJob: true,
  icon: '🌾',
  visualVariant: 'jade',
  progressStyle: 'border',
  progressFraction: 0,
  elapsedSeconds: 0,
  totalDurationSeconds: 60,
  remainingSeconds: 60,
  injuryPercentage: 5,
  deathPercentage: 0,
  assignedCount: 0,
  totalSlots: 1,
  rewardLabel: 'Grain',
  tone: 'job',
  deadlineLabel: null,
  assigneeNames: [],
  autoState: null,
};

const demoVillageResources = {
  gold: 120,
  food: 75,
  population: 38,
};

const demoVillageState = {
  residents: demoResidents.reduce<Record<string, ResidentState>>((acc, resident) => {
    acc[resident.id] = resident;
    return acc;
  }, {}),
  resources: demoVillageResources,
} as unknown as VillageState;

const demoActivityAreaSlots: (ActivityAreaSlot & { assignedWorkerId: string | null; activity: ActivityDefinition })[] = [
  {
    slotId: 'day-night-cycle',
    label: 'Cycle Control',
    iconName: '🌓',
    visualVariant: 'solar',
    progressFraction: 0.5,
    elapsedSeconds: 120,
    totalDurationSeconds: 240,
    canAcceptDrop: false,
    isCycleControl: true,
    assignedWorkerId: null,
    activity: { id: 'cycle', label: 'Cycle', tags: [], slotTags: [], resolutionEngineId: 'none' } as { id: string; label: string; tags: string[]; slotTags: string[]; resolutionEngineId: string },
  },
  {
    slotId: baseSlot.slotId,
    label: baseSlot.label,
    iconName: baseSlot.iconName,
    visualVariant: baseSlot.visualVariant,
    mapSlotLabel: baseSlot.mapSlotLabel,
    progressFraction: 0.25,
    elapsedSeconds: 30,
    totalDurationSeconds: 120,
    assignedWorkerId: null,
    activity: baseSlot.activity,
    canAcceptDrop: true,
  },
];

const demoActiveSlots: AncillarySlotEntry[] = [
  {
    slot: baseSlot,
    state: {
      progress: 0.4,
      elapsed: 24,
      duration: 120,
    } as unknown as AncillarySlotEntry['state'],
  },
];

const demoConfig: IdleVillageConfig = {
  ...DEFAULT_IDLE_VILLAGE_CONFIG,
  activities: {},
  questTypes: {},
  mapSlots: {},
  resources: {
    gold: { id: 'gold', label: 'Gold', icon: '🪙', colorClass: 'text-amber-200' },
    food: { id: 'food', label: 'Food', icon: '🥖', colorClass: 'text-emerald-200' },
    population: { id: 'population', label: 'Population', icon: '👥', colorClass: 'text-slate-200' },
  },
};

type VillageSummaries = ReturnType<UseVillageSandboxReturn['getVillageSummaries']>;

const demoVillageSummaries = [
  {
    id: 'village-alpha',
    name: 'Alpha',
    currentResources: demoVillageResources,
    population: 30,
    activeActivities: 2,
    status: 'stable',
  },
] as unknown as VillageSummaries;

const createMockContext = (overrides: Partial<MockSandboxContext> = {}): MockSandboxContext => {
  const defaultActivityAreaHandlers: ActivityAreaHandlers = {
    onWorkerDrop: vi.fn(),
    onInspect: vi.fn(),
    onToggleCycle: vi.fn(),
    onLocationInspect: vi.fn(),
    onLocationDragEnter: vi.fn(),
    onLocationDragLeave: vi.fn(),
    onLocationDrop: vi.fn(),
    onSlotResidentDragEnter: vi.fn(),
    onSlotResidentDragLeave: vi.fn(),
  };

  const defaultContext: MockSandboxContext = {
    residents: demoResidents,
    assignmentFeedback: 'Demo alert',
    handleResidentSelect: vi.fn(),
    isDayPhase: true,
    cycleProgressFraction: 0.5,
    cycleElapsedSeconds: 120,
    secondsPerTimeUnit: 60,
    locationSlots: [baseSlot],
    openTheaterForSlot: vi.fn(),
    isTheaterOpen: false,
    theaterPrimarySlot: baseSlot,
    theaterVerbs: [baseVerb],
    handleCloseTheater: vi.fn(),
    handleLocationResidentDrop: vi.fn(),
    handleWorkerDrop: vi.fn(),
    slotDropStates: { [baseSlot.slotId]: 'idle' },
    locationDropState: 'idle',
    activityAreaSlots: demoActivityAreaSlots,
    activityAreaHandlers: defaultActivityAreaHandlers,
    managedActivities: [
      {
        id: baseSlot.slotId,
        label: baseSlot.label,
        tags: ['job'],
        slotTags: [],
        resolutionEngineId: 'job',
      },
    ] as unknown as UseVillageSandboxReturn['managedActivities'],
    slotAssignments: { [baseSlot.slotId]: null },
    residentSlotRackSlots: [
      {
        id: `${baseSlot.slotId}-slot-0`,
        index: 0,
        label: 'Slot 1',
        assignedResidentId: null,
        dropState: 'idle',
        isPlaceholder: false,
      },
    ] as unknown as UseVillageSandboxReturn['residentSlotRackSlots'],
    assignResidentToSlot: vi.fn(),
    clearResidentSlot: vi.fn(),
    getResidentSlotProgress: vi.fn(),
    demoPanelHandlers: {
      setRequirement: vi.fn(),
      onSlotDrop: vi.fn(),
      onSlotClear: vi.fn(),
      onRemoveAll: vi.fn(),
      onStart: vi.fn(),
    },
    resetState: vi.fn().mockResolvedValue(undefined),
    config: demoConfig,
    activityScheduler: {
      advanceTimeUnitsDebug: vi.fn(),
    } as unknown as UseVillageSandboxReturn['activityScheduler'],
    villageState: demoVillageState,
    activeSlots: demoActiveSlots,
    getVillageSummaries: vi.fn(() => demoVillageSummaries),
    getTradeRoutes: vi.fn(() => []),
    getMigrationQueue: vi.fn(() => []),
    getLastTradeResult: vi.fn(() => null),
    createTradeRoute: vi.fn(),
    executeTradeRoute: vi.fn(),
    processMigrationTick: vi.fn(() => []),
    detailContexts: [],
    resourceItems: [
      {
        id: 'gold',
        label: 'Gold',
        icon: '🪙',
        value: demoVillageResources.gold,
        accentClass: 'text-amber-200',
      },
      {
        id: 'food',
        label: 'Food',
        icon: '🥖',
        value: demoVillageResources.food,
        accentClass: 'text-emerald-200',
      },
      {
        id: 'population',
        label: 'Population',
        icon: '👥',
        value: demoVillageResources.population,
        accentClass: 'text-slate-200',
      },
    ] as unknown as UseVillageSandboxReturn['resourceItems'],
    headerResources: {
      gold: demoVillageResources.gold,
      food: demoVillageResources.food,
      population: demoVillageResources.population,
    },
  };

  return {
    ...defaultContext,
    ...overrides,
    activityAreaHandlers: overrides.activityAreaHandlers ?? defaultActivityAreaHandlers,
  };
};

const setMockContext = (overrides?: Partial<MockSandboxContext>) => {
  const context = createMockContext(overrides);
  mockUseVillageSandbox.mockReturnValue(context as UseVillageSandboxReturn);
  return context;
};

const renderSandbox = (overrides?: Partial<MockSandboxContext>) => {
  const context = setMockContext(overrides);
  return { ...render(<VillageSandbox />), context };
};

const renderSandboxWithAct = async (overrides?: Partial<MockSandboxContext>) => {
  let result: ReturnType<typeof renderSandbox>;
  await act(async () => {
    result = renderSandbox(overrides);
  });
  return result!;
};

describe('VillageSandbox skeleton integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Roster lane', () => {
    it('passes residents and toggles drag context handlers', async () => {
      await renderSandboxWithAct();

      expect(mockResidentRosterPanel).toHaveBeenCalledTimes(1);
      const rosterProps = mockResidentRosterPanel.mock.calls[0][0];
      expect(rosterProps.residents).toEqual(demoResidents);
      expect(rosterProps.assignmentFeedback).toBe('Demo alert');

      rosterProps.onDragStart?.('resident-alpha');
      expect(mockSetActiveId).toHaveBeenLastCalledWith('resident-alpha');

      rosterProps.onDragEnd?.('resident-alpha');
      expect(mockSetActiveId).toHaveBeenLastCalledWith(null);
    });
  });

  describe('Board + HUD layout shell', () => {
    it('exposes layout test ids and wires board controls', async () => {
      const openTheaterForSlot = vi.fn();
      const handleCloseTheater = vi.fn();

      await renderSandboxWithAct({
        openTheaterForSlot,
        handleCloseTheater,
      });

      expect(screen.getByRole('main')).toHaveClass('observatory-page');
      expect(screen.getByRole('heading', { name: /village sandbox \(skeleton\)/i })).toBeInTheDocument();
      expect(screen.getByTestId('village-sandbox-columns')).toBeInTheDocument();
      expect(screen.getByTestId('village-sandbox-left-column')).toBeInTheDocument();
      expect(screen.getByTestId('village-sandbox-right-column')).toBeInTheDocument();

      const openButton = screen.getByRole('button', { name: /open theater/i });
      fireEvent.click(openButton);
      expect(openTheaterForSlot).toHaveBeenCalledWith(baseSlot.slotId);

      const closeButton = screen.getByRole('button', { name: /close theater/i });
      fireEvent.click(closeButton);
      expect(handleCloseTheater).toHaveBeenCalledTimes(1);
    });

    it('renders board body with ResidentSlotRack, ActivitySlotCard, and LocationCard', async () => {
      const { context } = await renderSandboxWithAct();

      expect(mockResidentSlotRack).toHaveBeenCalledTimes(1);
      // ActivitySlotCard component removed - assertion removed
      expect(mockLocationCard).toHaveBeenCalledTimes(1);

      // Verify ResidentSlotRack props
      const rackProps = mockResidentSlotRack.mock.calls[0][0];
      expect(rackProps.slots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: `${baseSlot.slotId}-slot-0` }),
        ]),
      );
      expect(rackProps.variant).toBe('board');
      expect(rackProps.overflow).toBe('scroll');
      expect(rackProps.getSlotProgress).toBeDefined();
      expect(rackProps.onSlotDrop).toBeDefined();
      expect(rackProps.onSlotClear).toBeDefined();
      expect(rackProps.onSlotInspect).toBeDefined();
      const rackSlotId = `${baseSlot.slotId}-slot-0`;
      rackProps.onSlotDrop?.(rackSlotId, 'resident-alpha');
      expect(context.assignResidentToSlot).toHaveBeenCalledWith(rackSlotId, 'resident-alpha');
      rackProps.onSlotDrop?.(rackSlotId, null);
      expect(context.clearResidentSlot).toHaveBeenCalledWith(rackSlotId);
      rackProps.onSlotInspect?.(rackSlotId);
      expect(context.activityAreaHandlers.onInspect).toHaveBeenCalledWith(rackSlotId);

      // ActivitySlotCard component removed - props verification removed

      // Verify LocationCard props
      const locationProps = mockLocationCard.mock.calls[0][0];
      expect(locationProps.title).toBe(baseSlot.label);
      expect(locationProps.onInspect).toBeDefined();
      expect(locationProps.onResidentDrop).toBeDefined();
      expect(locationProps.dropState).toBe('idle');
    });
  });

  describe('AncillaryPanels placeholder', () => {
    it('mirrors HUD payload counts for guardrail visibility', async () => {
      await renderSandboxWithAct();
      const placeholder = screen.getByTestId('ancillary-panels');
      expect(placeholder).toHaveAttribute('data-active-count', '1');
      expect(placeholder).toHaveAttribute('data-resource-count', '3');
      expect(placeholder).toHaveAttribute('data-trade-route-count', '0');
      expect(placeholder).toHaveAttribute('data-migration-count', '0');
      expect(placeholder).toHaveTextContent('Ancillary Panels');
    });

    it('handles missing trade APIs without crashing (regression guard)', async () => {
      const undefinedSummaries = vi.fn(() => undefined as unknown as VillageSummaries);
      const undefinedTradeRoutes = vi.fn(() => undefined as unknown as ReturnType<UseVillageSandboxReturn['getTradeRoutes']>);
      const undefinedMigrationQueue = vi.fn(() => undefined as unknown as ReturnType<UseVillageSandboxReturn['getMigrationQueue']>);
      const undefinedLastResult = vi.fn(() => undefined as unknown as ReturnType<UseVillageSandboxReturn['getLastTradeResult']>);

      await expect(
        renderSandboxWithAct({
          getVillageSummaries: undefinedSummaries as unknown as UseVillageSandboxReturn['getVillageSummaries'],
          getTradeRoutes: undefinedTradeRoutes as unknown as UseVillageSandboxReturn['getTradeRoutes'],
          getMigrationQueue: undefinedMigrationQueue as unknown as UseVillageSandboxReturn['getMigrationQueue'],
          getLastTradeResult: undefinedLastResult as unknown as UseVillageSandboxReturn['getLastTradeResult'],
        }),
      ).resolves.not.toThrow();

      const placeholder = screen.getByTestId('ancillary-panels');
      expect(placeholder).toHaveAttribute('data-trade-route-count', '0');
      expect(placeholder).toHaveAttribute('data-migration-count', '0');
      expect(undefinedTradeRoutes).toHaveBeenCalled();
      expect(undefinedMigrationQueue).toHaveBeenCalled();
    });
  });

  describe('Theater overlay wiring', () => {
    it('opens via board control and forwards drop callbacks', async () => {
      const openTheaterForSlot = vi.fn();
      const handleLocationResidentDrop = vi.fn();

      const { rerender } = await renderSandboxWithAct({
        isTheaterOpen: false,
        openTheaterForSlot,
        handleLocationResidentDrop,
      });
      expect(screen.queryByTestId('theater-overlay')).toBeNull();

      const openButton = screen.getByRole('button', { name: /open theater/i });
      fireEvent.click(openButton);
      expect(openTheaterForSlot).toHaveBeenCalledWith(baseSlot.slotId);

      setMockContext({
        isTheaterOpen: true,
        openTheaterForSlot,
        handleLocationResidentDrop,
      });
      await act(async () => {
        rerender(<VillageSandbox />);
      });

      const overlay = screen.getByTestId('theater-overlay');
      expect(overlay).toBeInTheDocument();
      const lastOverlayCall = mockTheaterOverlay.mock.calls.at(-1);
      const overlayProps = lastOverlayCall ? lastOverlayCall[0] : null;
      overlayProps?.onResidentDrop?.('resident-alpha');
      expect(handleLocationResidentDrop).toHaveBeenCalledWith('resident-alpha');
    });
  });

  describe('Detail panel stack', () => {
    it('renders DetailPanelStack when detailContexts are present', async () => {
      const detailContexts = [{
        slotId: baseSlot.slotId,
        slot: baseSlot,
        activity: baseSlot.activity,
        summary: null,
        residents: demoVillageState.residents,
        secondsPerTimeUnit: 60,
        schedulerBridge: null,
        onWorkerDrop: null,
        onStart: null,
        onClose: null,
        isTheaterOpen: false,
      }];

      await renderSandboxWithAct({
        detailContexts,
      });

      expect(mockDetailPanelStack).toHaveBeenCalledTimes(1);
      const stackProps = mockDetailPanelStack.mock.calls[0][0];
      expect(stackProps.detailContexts).toEqual(detailContexts);
      expect(stackProps.slotAssignments).toEqual({ [baseSlot.slotId]: null });
      expect(stackProps.residentsById).toEqual(demoVillageState.residents);
      expect(stackProps.secondsPerTimeUnit).toBe(60);
      expect(stackProps.draggingResidentId).toBeNull();
      expect(stackProps.schedulerBridge).toBeDefined();
      expect(stackProps.onWorkerDrop).toBeDefined();
      expect(stackProps.onStart).toBeDefined();
      expect(stackProps.onClose).toBeDefined();
      expect(stackProps.isTheaterOpen).toBe(false);
    });

    it('does not render DetailPanelStack when detailContexts are empty', async () => {
      await renderSandboxWithAct({
        detailContexts: [],
      });

      expect(mockDetailPanelStack).toHaveBeenCalledTimes(1);
      const stackProps = mockDetailPanelStack.mock.calls[0][0];
      expect(stackProps.detailContexts).toEqual([]);
    });
  });
});
