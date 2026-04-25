import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import VillageSandbox from '../VillageSandbox';
import { useVillageSandbox } from '@/ui/idleVillage/hooks/useVillageSandbox';

vi.mock('@/ui/idleVillage/hooks/useVillageSandbox', () => ({
  useVillageSandbox: vi.fn(),
}));

vi.mock('@/ui/idleVillage/components/ResidentRosterPanel', () => ({
  ResidentRosterPanel: () => <div data-testid="resident-roster-panel">Roster</div>,
}));

vi.mock('@/ui/idleVillage/components/TheaterOverlay', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="theater-overlay">Overlay</div> : null),
}));

vi.mock('@/ui/idleVillage/components/DragContext', () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-provider">{children}</div>,
}));

vi.mock('@/ui/idleVillage/components/DragContextStore', () => ({
  useDragContext: () => ({
    activeId: null,
    setActiveId: vi.fn(),
  }),
}));

const originalIntersectionObserver = globalThis.IntersectionObserver;
const originalResizeObserver = globalThis.ResizeObserver;

class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

class ResizeObserverMock {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords(): ResizeObserverEntry[] {
    return [];
  }
}

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

const baseVerb: VerbSummary = {
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

const mockUseVillageSandbox = vi.mocked(useVillageSandbox);

const buildContext = (overrides: Partial<ReturnType<typeof useVillageSandbox>> = {}) =>
  ({
    residents: [],
    assignmentFeedback: null,
    handleResidentSelect: vi.fn(),
    isDayPhase: true,
    cycleProgressFraction: 0,
    cycleElapsedSeconds: 0,
    secondsPerTimeUnit: 60,
    locationSlots: [baseSlot],
    openTheaterForSlot: vi.fn(),
    isTheaterOpen: true,
    theaterPrimarySlot: baseSlot,
    theaterVerbs: [baseVerb],
    handleCloseTheater: vi.fn(),
    handleLocationResidentDrop: vi.fn(),
    handleWorkerDrop: vi.fn(),
    slotDropStates: {},
    locationDropState: 'idle',
    managedActivities: [],
    demoPanelHandlers: null,
    resetState: vi.fn(),
    config: {
      resources: {
        gold: { label: 'Gold', icon: '🪙', colorClass: 'text-amber-200' },
        food: { label: 'Food', icon: '🍞', colorClass: 'text-emerald-200' },
        population: { label: 'Pop', icon: '👥', colorClass: 'text-cyan-200' },
      },
      activities: { [baseSlot.slotId]: baseSlot.activity },
    },
    villageState: {
      resources: { gold: 100, food: 50, population: 10 },
      residents: {},
    },
    activeSlots: [],
    getVillageSummaries: () => [],
    getTradeRoutes: () => [],
    getMigrationQueue: () => [],
    getLastTradeResult: () => null,
    createTradeRoute: vi.fn(),
    executeTradeRoute: vi.fn(),
    processMigrationTick: vi.fn(),
    handleResetSandboxState: vi.fn(),
    seedTradeRoutes: vi.fn(),
    seedMigrationQueue: vi.fn(),
    activityAreaHandlers: {
      onWorkerDrop: vi.fn(),
      onInspect: vi.fn(),
      onToggleCycle: vi.fn(),
      onLocationInspect: vi.fn(),
      onLocationDragEnter: vi.fn(),
      onLocationDragLeave: vi.fn(),
      onLocationDrop: vi.fn(),
      onSlotResidentDragEnter: vi.fn(),
      onSlotResidentDragLeave: vi.fn(),
    },
    activityAreaSlots: [],
    activityScheduler: {
      advanceTimeUnitsDebug: vi.fn(),
      canAssignResident: vi.fn(),
      startActivity: vi.fn(),
    },
    ...overrides,
  }) as ReturnType<typeof useVillageSandbox>;

describe('VillageSandbox skeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVillageSandbox.mockReturnValue(buildContext());
  });

  beforeAll(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: IntersectionObserverMock,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: ResizeObserverMock,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: originalIntersectionObserver,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: originalResizeObserver,
    });
  });

  it('renders the TheaterOverlay when context provides a primary slot', () => {
    render(<VillageSandbox />);
    expect(screen.getByTestId('theater-overlay')).toBeInTheDocument();
  });

  it('invokes openTheaterForSlot when clicking the Open Theater button', () => {
    const openTheaterForSlot = vi.fn();
    mockUseVillageSandbox.mockReturnValue(
      buildContext({
        isTheaterOpen: false,
        openTheaterForSlot,
      }),
    );

    render(<VillageSandbox />);
    const openButton = screen.getByRole('button', { name: /open theater/i });
    fireEvent.click(openButton);
    expect(openTheaterForSlot).toHaveBeenCalledWith('job-harvest');
  });
});
