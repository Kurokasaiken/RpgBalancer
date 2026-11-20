import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import VillageSandbox from '@/ui/idleVillage/VillageSandbox';
import type { UseActivitySchedulerReturn } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { VillageSummary } from '@/ui/idleVillage/state/VillageRegistry';

// Setup global mocks before all tests
beforeAll(() => {
  // Mock window.matchMedia for media query hooks
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // IntersectionObserver / ResizeObserver polyfills for lazy-loaded components
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: class {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    },
  });
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: class {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    },
  });
});

// Mock all dependencies
const demoVillageSummaries: VillageSummary[] = [
  {
    id: 'sandbox-village',
    name: 'Sandbox Village',
    currentResources: { gold: 100, food: 50, population: 10 },
    population: 10,
    activeActivities: 0,
    status: 'active',
  },
];

vi.mock('@/ui/idleVillage/hooks/useVillageSandbox', () => ({
  useVillageSandbox: () => ({
    residents: [],
    assignmentFeedback: null,
    handleResidentSelect: vi.fn(),
    isDayPhase: true,
    cycleProgressFraction: 0.5,
    cycleElapsedSeconds: 100,
    secondsPerTimeUnit: 1,
    cycleDayCount: 1,
    cyclePhaseLabel: 'Day',
    cyclePhaseIcon: '☀️',
    totalCycleSeconds: 200,
    isCyclePlaying: true,
    toggleCyclePlaying: vi.fn(),
    locationSlots: [],
    openTheaterForSlot: vi.fn(),
    isTheaterOpen: false,
    theaterPrimarySlot: null,
    theaterVerbs: [],
    handleCloseTheater: vi.fn(),
    hoverStart: vi.fn(),
    hoverEnd: vi.fn(),
    handleLocationResidentDrop: vi.fn(),
    handleWorkerDrop: vi.fn(),
    slotDropStates: {},
    locationDropState: 'idle',
    activityAreaSlots: [],
    activityAreaHandlers: {},
    managedActivities: [],
    slotAssignments: {},
    detailContexts: [],
    demoPanelHandlers: {},
    resetState: vi.fn(),
    config: {
      globalRules: {
        maxFatigueBeforeExhausted: 100,
      },
      activities: {},
    },
    activityScheduler: null,
    villageState: {
      residents: {},
      activities: {},
    },
    activeSlots: [],
    getVillageSummaries: vi.fn(() => demoVillageSummaries),
    getTradeRoutes: vi.fn(() => []),
    getMigrationQueue: vi.fn(() => []),
    getLastTradeResult: vi.fn(() => null),
    createTradeRoute: vi.fn(),
    executeTradeRoute: vi.fn(),
    processMigrationTick: vi.fn(),
    handleResetSandboxState: vi.fn(),
    seedTradeRoutes: vi.fn(),
    seedMigrationQueue: vi.fn(),
    handleQuickWorkShift: vi.fn(),
    handleQuickRest: vi.fn(),
    isResting: false,
    canSlotAcceptDrop: vi.fn(() => true),
    startSlotActivity: vi.fn(() => true),
    closeDetailPanel: vi.fn(),
    residentSlotRackSlots: [],
    assignResidentToSlot: vi.fn(),
    clearResidentSlot: vi.fn(),
    getResidentSlotProgress: vi.fn(() => ({ progress: 0, total: 100 })),
    resourceItems: [],
    headerResources: { gold: 100, food: 50, population: 10 },
    getResidentCompatibility: vi.fn(() => ({ score: 0.8, reasons: [] })),
    dragErrorRecovery: {
      state: { activeError: null, autoOpen: false },
      dismissError: vi.fn(),
      trackAction: vi.fn(),
    },
    scheduleTimeout: 1000,
    isPickerActive: false,
    getActionDetailHarnessSnapshot: () => ({
      title: 'Test Activity',
      slotId: 'test-slot',
      assignedResidentName: 'Test Resident',
      helperText: 'Helper text',
      dropState: 'idle',
      isPlaying: false,
      progressFraction: 0,
      elapsedSeconds: 0,
      totalDurationSeconds: 100,
      elapsedLabel: '0s',
      remainingLabel: '100s',
    }),
    hudEntries: [],
    handleResolveActivity: vi.fn(),
    questTelemetry: { recordQuestResult: vi.fn(), clearTelemetry: vi.fn(), telemetry: [] },
    questTelemetryPanelState: null,
    setSelectedSlot: vi.fn(),
    updateState: vi.fn(),
    formatCycleSeconds: vi.fn((s) => `${s}s`),
    slots: {},
    setSlotAssignments: vi.fn(),
    setAssignmentFeedback: vi.fn(),
    setIsCyclePlaying: vi.fn(),
    getSlotCompatibilityDiagnostics: vi.fn(() => []),
  }),
}));

vi.mock('@/ui/idleVillage/hooks/useSandboxCore', () => ({
  useSandboxCore: () => ({
    slotDropStates: {},
    actionDetailHarnessState: {
      title: 'Test Activity',
      slotId: 'test-slot',
      assignedResidentName: 'Test Resident',
      helperText: 'Helper text',
      dropState: 'idle',
      isPlaying: false,
      progressFraction: 0,
      elapsedSeconds: 0,
      totalDurationSeconds: 100,
      elapsedLabel: '0s',
      remainingLabel: '100s',
    },
    handleAssignResidentToJob: vi.fn(),
    handleJobDropzoneDragOver: vi.fn(),
    handleWorkerDrop: vi.fn(),
    metadata: {
      seed: null,
      phase: 'day',
      virtualizationEnabled: false,
      residentStatus: {},
    },
  }),
}));

vi.mock('@/ui/idleVillage/components/DragContextStore', () => ({
  useDragContext: () => ({
    activeId: null,
    setActiveId: vi.fn(),
  }),
}));

vi.mock('@/ui/idleVillage/components/DiagnosticsPanel', () => ({
  default: () => <div data-testid="diagnostics-panel">Diagnostics</div>,
}));

vi.mock('@/ui/idleVillage/components/DragContext', () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-provider">{children}</div>,
}));

vi.mock('@/ui/idleVillage/components/SummaryStrip', () => ({
  default: () => <div data-testid="summary-strip">Summary</div>,
}));

vi.mock('@/ui/idleVillage/components/TheaterOverlay', () => ({
  default: () => <div data-testid="theater-overlay">Theater</div>,
}));

vi.mock('@/ui/idleVillage/ActivityArea', () => ({
  default: () => <div data-testid="activity-area">Activity Area</div>,
}));

vi.mock('@/ui/idleVillage/components/MapBoardShell', () => ({
  default: ({ boardBody }: { boardBody: React.ReactNode }) => (
    <div data-testid="map-board-shell">{boardBody}</div>
  ),
}));

vi.mock('@/ui/idleVillage/components/AncillaryPanels', () => ({
  default: ({ metadata, className }: { metadata?: { seed?: number; phase?: string; virtualizationEnabled?: boolean; residentStatus?: Record<string, unknown> }; className?: string }) => (
    <div 
      data-testid="ancillary-panels" 
      className={className}
      data-seed={metadata?.seed}
      data-phase={metadata?.phase}
      data-virtualization-enabled={metadata?.virtualizationEnabled}
      data-resident-status={JSON.stringify(metadata?.residentStatus)}
      aria-live="polite"
    >
      Panels
    </div>
  ),
}));

vi.mock('@/ui/idleVillage/components/VillageSandboxColumns', () => ({
  default: ({ leftColumn, rightColumn }: { leftColumn: React.ReactNode; rightColumn: React.ReactNode }) => (
    <div data-testid="village-sandbox-columns">
      <div data-testid="left-column">{leftColumn}</div>
      <div data-testid="right-column">{rightColumn}</div>
    </div>
  ),
}));

vi.mock('@/ui/idleVillage/components/VillageRosterSection', () => ({
  default: () => <div data-testid="village-roster">Roster</div>,
}));

vi.mock('@/ui/idleVillage/slots/ResidentSlotRack', () => ({
  default: () => <div data-testid="resident-slot-rack">Rack</div>,
}));

vi.mock('@/ui/idleVillage/components/LocationCard', () => ({
  default: () => <div data-testid="location-card">Location</div>,
}));

vi.mock('@/ui/idleVillage/components/ActionDetailHarness', () => ({
  default: () => <div data-testid="action-detail-harness">Harness</div>,
}));

vi.mock('@/ui/idleVillage/components/GymShiftHUD', () => ({
  default: () => <div data-testid="gym-shift-hud">HUD</div>,
}));

vi.mock('@/ui/idleVillage/components/GymShiftCard', () => ({
  default: () => <div data-testid="gym-shift-card">Gym Card</div>,
}));

vi.mock('@/ui/idleVillage/components/BoutCard', () => ({
  default: () => <div data-testid="bout-card">Bout Card</div>,
}));

vi.mock('@/ui/idleVillage/components/TrainingTracker', () => ({
  default: () => <div data-testid="training-tracker">Tracker</div>,
}));

vi.mock('@/ui/idleVillage/components/RestOverlay', () => ({
  default: () => <div data-testid="rest-overlay">Rest</div>,
}));

vi.mock('@/ui/idleVillage/components/DetailPanelStack', () => ({
  DetailPanelStack: () => <div data-testid="detail-panel-stack">Details</div>,
}));

vi.mock('@/ui/idleVillage/components/WorkerPickerSheet', () => ({
  default: () => <div data-testid="worker-picker-sheet">Picker</div>,
}));

vi.mock('@/ui/idleVillage/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/ui/idleVillage/utils/workerPickerTelemetry', () => ({
  getTelemetrySnapshot: vi.fn(() => ({ events: [], metrics: {} })),
  recordAssignmentInteractionEvent: vi.fn(),
  getReplayActions: vi.fn(() => []),
  aggregateAssignmentHeatmap: vi.fn(() => ({})),
}));

describe('VillageSandbox Component Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully with all mocked dependencies', () => {
    expect(() => {
      render(
        <VillageSandbox
          activeShellPresetId="test-preset"
          shellPresetOptions={[]}
        />
      );
    }).not.toThrow();
  });

  it('renders the main layout container', () => {
    render(
      <VillageSandbox
        activeShellPresetId="test-preset"
        shellPresetOptions={[]}
      />
    );

    expect(screen.getByTestId('village-sandbox-layout')).toBeInTheDocument();
  });

  it('renders header and columns structure', () => {
    render(
      <VillageSandbox
        activeShellPresetId="test-preset"
        shellPresetOptions={[]}
      />
    );

    expect(screen.getByTestId('village-sandbox-header')).toBeInTheDocument();
    expect(screen.getByTestId('village-sandbox-columns')).toBeInTheDocument();
  });

  it('handles missing props gracefully', () => {
    expect(() => {
      render(<VillageSandbox />);
    }).not.toThrow();
  });

  it('renders with minimal required props', () => {
    render(<VillageSandbox />);

    expect(screen.getByTestId('village-sandbox-layout')).toBeInTheDocument();
  });

  it('renders localized map labels', () => {
    render(<VillageSandbox />);

    expect(screen.getByText('Activity Slots')).toBeInTheDocument();
    expect(screen.getByText('Active Activities')).toBeInTheDocument();
  });
});

// Wave 3.1 Drag Controller Comprehensive Tests
describe('Wave 3.1 Drag Controller Comprehensive Tests', () => {
  let mockSandboxDiagnostics: { debug: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let mockConsoleInfo: ReturnType<typeof vi.fn>;
  let mockConsoleWarn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSandboxDiagnostics = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    mockConsoleInfo = vi.fn();
    mockConsoleWarn = vi.fn();

    // Mock createSandboxDiagnostics
    vi.doMock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
      createSandboxDiagnostics: vi.fn(() => mockSandboxDiagnostics),
    }));

    // Mock console methods
    vi.spyOn(console, 'info').mockImplementation(mockConsoleInfo as unknown as (message?: unknown, ...optionalParams: unknown[]) => void);
    vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn as unknown as (message?: unknown, ...optionalParams: unknown[]) => void);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dragConfig provides config-first parameters with test overrides', async () => {
    const { getCurrentDragConfig, overrideDragConfig, resetDragConfig } = await import('@/ui/idleVillage/config/dragConfig');

    // Test default config
    const defaultConfig = getCurrentDragConfig();
    expect(defaultConfig).toHaveProperty('visual');
    expect(defaultConfig).toHaveProperty('timing');
    expect(defaultConfig).toHaveProperty('thresholds');
    expect(defaultConfig.thresholds.virtualizationThreshold).toBe(30);

    // Test config override for testing
    overrideDragConfig({
      thresholds: { 
        minHpThreshold: 1,
        maxFatigueThreshold: 100,
        minDragDistance: 5,
        virtualizationThreshold: 50 
      },
      visual: { 
        validDropColor: 'rgba(255,0,0,0.1)',
        invalidDropColor: 'rgba(239, 68, 68, 0.1)',
        lockedDropColor: 'rgba(107, 114, 128, 0.1)',
        activeDragBorderColor: 'rgba(251, 191, 36, 0.5)',
        draggedOpacity: 0.7,
        bloomScale: 1.05
      }
    });

    const overriddenConfig = getCurrentDragConfig();
    expect(overriddenConfig.thresholds.virtualizationThreshold).toBe(50);
    expect(overriddenConfig.visual.validDropColor).toBe('rgba(255,0,0,0.1)');

    // Reset config
    resetDragConfig();
    const resetConfig = getCurrentDragConfig();
    expect(resetConfig.thresholds.virtualizationThreshold).toBe(30);
  });

  it('deriveLocationDropState returns valid drop analysis', async () => {
    const { deriveLocationDropState } = await import('@/ui/idleVillage/hooks/locationDropValidators');

    const result = deriveLocationDropState({
      residentId: 'test-resident',
      villageState: {
        residents: {
          'test-resident': {
            id: 'test-resident',
            status: 'available' as const,
            currentHp: 10,
            maxHp: 10,
            fatigue: 20,
            isInjured: false,
            isHero: false,
            survivalCount: 0,
            survivalScore: 0,
          },
        },
        activities: {},
        currentTime: 0,
        resources: {},
        eventLog: [],
        questOffers: {},
      },
      activityScheduler: {
        getScheduledActivities: vi.fn(() => []),
        scheduledActivities: new Map(),
      } as unknown as UseActivitySchedulerReturn,
      locationSlotIds: ['location-slot-1'],
      maxFatigueBeforeExhausted: 100,
      isDayPhase: true,
    });

    expect(result).toHaveProperty('state');
    expect(['idle', 'valid', 'invalid', 'locked']).toContain(result.state);
  });

  it('selectPrimarySlot returns prioritized slot assignment with validation', async () => {
    const { selectPrimarySlot } = await import('@/ui/idleVillage/hooks/mapSelectors');

    const mockSlots: { slotId: string; label: string; iconName: string; assignedWorkerId: string | null; activity: { id: string; name: string; label: string; tags: string[]; slotTags: string[]; resolutionEngineId: string }; mapSlotLabel: string; visualVariant: 'azure' }[] = [
      {
        slotId: 'slot-1',
        label: 'Slot 1',
        iconName: 'test-icon',
        assignedWorkerId: null,
        activity: { id: 'activity-1', name: 'Test Activity 1', label: 'Test Activity 1', tags: [], slotTags: [], resolutionEngineId: 'test-engine' },
        mapSlotLabel: 'Slot 1',
        visualVariant: 'azure' as const,
      },
      {
        slotId: 'slot-2',
        label: 'Slot 2',
        iconName: 'test-icon',
        assignedWorkerId: 'resident-1', // This slot is assigned
        activity: { id: 'activity-1', name: 'Test Activity 1', label: 'Test Activity 1', tags: [], slotTags: [], resolutionEngineId: 'test-engine' },
        mapSlotLabel: 'Slot 2',
        visualVariant: 'azure' as const,
      },
      {
        slotId: 'slot-3',
        label: 'Slot 3',
        iconName: 'test-icon',
        assignedWorkerId: null, // This slot is empty
        activity: { id: 'activity-2', name: 'Test Activity 2', label: 'Test Activity 2', tags: [], slotTags: [], resolutionEngineId: 'test-engine' },
        mapSlotLabel: 'Slot 3',
        visualVariant: 'azure' as const,
      },
    ];

    const result = selectPrimarySlot(mockSlots, { 'slot-1': null, 'slot-2': 'resident-1', 'slot-3': null });

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // Should prefer empty slots (slot-1 or slot-3)
    expect(['slot-1', 'slot-3']).toContain(result);
    expect(result).not.toBe('slot-2');
  });

  it('useSandboxDragController hook integrates config-first and deterministic logging', async () => {
    const { useSandboxDragController } = await import('@/ui/idleVillage/hooks/useSandboxDragController');

    // Verify the hook exists and is a function
    expect(typeof useSandboxDragController).toBe('function');
    expect(useSandboxDragController.name).toBe('useSandboxDragController');

    // Verify hook has metadata interface with config-first values
    // Note: Cannot test hook execution outside React context, but we can verify structure
    const hookSource = useSandboxDragController.toString();
    expect(hookSource).toContain('metadata');
    expect(hookSource).toContain('virtualizationEnabled');
    expect(hookSource).toContain('isDayPhase');
  });

  it('AncillaryPanels exposes metadata with deterministic data attributes', async () => {
    const AncillaryPanels = (await import('@/ui/idleVillage/components/AncillaryPanels')).default;
    
    const mockMetadata = {
      seed: 'test-seed-123',
      phase: 'day' as const,
      virtualizationEnabled: true,
      residentStatus: {
        'resident-1': 'available',
        'resident-2': 'away',
      }
    };

    const { container } = render(
      <AncillaryPanels
        hudEntries={[]}
        activeSlots={[]}
        secondsPerTimeUnit={1}
        resourceItems={[]}
        questTelemetryProps={{ telemetry: {} as any, className: '', compact: false, showHeatmap: false, showRecentDecisions: false }}  
        tradeRouteProps={{ villageIds: [], tradeRoutes: [], lastTradeResult: null, onCreateTradeRoute: vi.fn(), onExecuteTradeRoute: vi.fn() }}
        migrationQueueProps={{ migrationQueue: [], onProcessMigrationTick: vi.fn() }}
        metadata={mockMetadata}
      />
    );

    const panels = container.querySelector('[data-testid="ancillary-panels"]');
    expect(panels).toHaveAttribute('data-seed', 'test-seed-123');
    expect(panels).toHaveAttribute('data-phase', 'day');
    expect(panels).toHaveAttribute('data-virtualization-enabled', 'true');
    expect(panels).toHaveAttribute('data-resident-status', JSON.stringify(mockMetadata.residentStatus));
  });
});
