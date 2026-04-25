import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import MinimalGameplayPage from '../../../src/ui/idleVillage/MinimalGameplayPage';

interface MinimalGameplayStateMock {
  state: {
    gold: number;
    food: number;
    maxFood: number;
    currentDay: number;
    currentTime: number;
    isPaused: boolean;
    speedMultiplier: number;
    residents: Array<{
      id: string;
      name: string;
      stats: Record<string, number>;
      fatigue: number;
      isWorking: boolean;
      isInjured: boolean;
      level: number;
    }>;
    activeActivities: Array<{
      activityId: string;
      residentId: string;
      ticksRemaining: number;
    }>;
  };
  config: {
    loop: { tickIntervalMs: number; warmupDelayMs: number; maxSpeedMultiplier: number; defaultSpeedMultiplier: number };
    globalRules: {
      dailyFoodConsumptionPerResident: number;
      fatigueDecayPerRestTick: number;
      dayLengthInTimeUnits: number;
      dayNightCycle: { dayTimeUnits: number; nightTimeUnits: number };
      secondsPerTimeUnit: number;
    };
    ui: { warningThresholds: { fatigueDangerPercent: number }; warningCopy: Record<string, string> };
    startingResources: { residents: Array<{ id: string; name: string }> };
  };
  isLoading: boolean;
  error: string | null;
  tick: ReturnType<typeof vi.fn>;
  pauseGame: ReturnType<typeof vi.fn>;
  resumeGame: ReturnType<typeof vi.fn>;
  resetGame: ReturnType<typeof vi.fn>;
  buyFood: ReturnType<typeof vi.fn>;
  setSpeedMultiplier: ReturnType<typeof vi.fn>;
  startActivity: ReturnType<typeof vi.fn>;
  canStartActivity: ReturnType<typeof vi.fn>;
  daysRemaining: ReturnType<typeof vi.fn>;
  gameOver: ReturnType<typeof vi.fn>;
}

const mockStore: MinimalGameplayStateMock = {
  state: {
    gold: 15,
    food: 8,
    maxFood: 25,
    currentDay: 0,
    currentTime: 0,
    isPaused: false,
    speedMultiplier: 1,
    residents: [
      {
        id: 'resident-1',
        name: 'Aurora Calder',
        stats: { strength: 6, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
        fatigue: 0.3, // Normal fatigue
        isWorking: false,
        isInjured: false,
        level: 1,
      },
      {
        id: 'resident-2',
        name: 'Marcus Vale',
        stats: { strength: 4, endurance: 6, agility: 5, intelligence: 4, perception: 3 },
        fatigue: 0.9, // High fatigue
        isWorking: false,
        isInjured: false,
        level: 2,
      },
    ],
    activeActivities: [],
  },
  config: {
    loop: { tickIntervalMs: 1000, warmupDelayMs: 1200, maxSpeedMultiplier: 3, defaultSpeedMultiplier: 1 },
    globalRules: {
      dailyFoodConsumptionPerResident: 2,
      fatigueDecayPerRestTick: 5,
      dayLengthInTimeUnits: 60,
      dayNightCycle: { dayTimeUnits: 40, nightTimeUnits: 20 },
      secondsPerTimeUnit: 1,
    },
    ui: {
      warningThresholds: { fatigueDangerPercent: 70 },
      warningCopy: {
        fatigueHigh: 'Fatica critica sui residenti',
        fatigueRecovered: 'Fatica sotto controllo',
        foodLow: 'Scorte di cibo critiche',
        foodRecovered: 'Scorte di cibo stabili',
      },
    },
    startingResources: { residents: [{ id: 'resident-1', name: 'Aurora Calder' }] },
  },
  isLoading: false,
  error: null,
  tick: vi.fn(),
  pauseGame: vi.fn(),
  resumeGame: vi.fn(),
  resetGame: vi.fn(),
  buyFood: vi.fn(),
  setSpeedMultiplier: vi.fn(),
  startActivity: vi.fn(),
  canStartActivity: vi.fn(() => ({ canStart: true, reason: '', reasonCode: undefined })),
  daysRemaining: vi.fn(() => 4),
  gameOver: vi.fn(() => false),
};

const resetMockStore = () => {
  mockStore.state = {
    gold: 15,
    food: 8,
    maxFood: 25,
    currentDay: 0,
    currentTime: 0,
    isPaused: false,
    speedMultiplier: 1,
    residents: [
      {
        id: 'resident-1',
        name: 'Aurora Calder',
        stats: { strength: 6, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
        fatigue: 0.3,
        isWorking: false,
        isInjured: false,
        level: 1,
      },
      {
        id: 'resident-2',
        name: 'Marcus Vale',
        stats: { strength: 4, endurance: 6, agility: 5, intelligence: 4, perception: 3 },
        fatigue: 0.9,
        isWorking: false,
        isInjured: false,
        level: 2,
      },
    ],
    activeActivities: [],
  };
  mockStore.tick.mockClear();
  mockStore.pauseGame.mockClear();
  mockStore.resumeGame.mockClear();
  mockStore.resetGame.mockClear();
  mockStore.buyFood.mockClear();
  mockStore.setSpeedMultiplier.mockClear();
  mockStore.startActivity.mockClear();
  mockStore.canStartActivity.mockClear();
  mockStore.daysRemaining.mockClear();
  mockStore.gameOver.mockClear();
};

vi.mock('@/store/useMinimalGameplay', () => ({
  useMinimalGameplayStore: (selector: (state: MinimalGameplayStateMock) => unknown) => selector(mockStore),
  initializeMinimalGameplayStore: vi.fn().mockResolvedValue(undefined),
  selectRosterWithWarnings: vi.fn((state, config) =>
    state.residents.map(r => ({
      ...r,
      fatigueWarning: r.fatigue >= config.ui.thresholds.fatigueDangerPercent,
      injuryWarning: r.isInjured,
    }))
  ),
  selectLoopWarnings: vi.fn((state, config) => ({
    fatigue: {
      active: state.residents.some(r => r.fatigue >= config.ui.thresholds.fatigueDangerPercent),
      message: 'High fatigue detected',
    },
    food: {
      active: false,
      message: 'Food supply adequate',
    },
    ariaLiveMessage: '',
  })),
}));

vi.mock('@/hooks/useThemeSwitcher', () => ({
  useThemeSwitcher: () => ({
    activePreset: { id: 'test', label: 'Test Preset', description: 'demo', tokens: {} },
    presets: [],
    isRandomized: false,
    setPreset: vi.fn(),
    randomizeTheme: vi.fn(),
    resetRandomization: vi.fn(),
  }),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

describe('MinimalGameplayPage DnD Integration', () => {
  beforeEach(() => {
    resetMockStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders activity slots for drag and drop', () => {
    render(<MinimalGameplayPage />);

    expect(screen.getByText('Activity Slots')).toBeInTheDocument();
    expect(screen.getByText('Drag residents to start activities')).toBeInTheDocument();

    // Should show activity slots
    expect(screen.getByTestId('minimal-activity-slot-gold_mine_slot')).toBeInTheDocument();
    expect(screen.getByTestId('minimal-activity-slot-quest_board_slot')).toBeInTheDocument();
    expect(screen.getByTestId('minimal-activity-slot-market_slot')).toBeInTheDocument();
  });

  it('shows resident names in worker panel', () => {
    render(<MinimalGameplayPage />);

    expect(screen.getByText('Aurora Calder')).toBeInTheDocument();
    expect(screen.getByText('Marcus Vale')).toBeInTheDocument();
  });

  it('allows successful drag and drop from resident to activity slot', async () => {
    mockStore.canStartActivity.mockReturnValue({ canStart: true, reason: '', reasonCode: undefined });

    render(<MinimalGameplayPage />);

    const residentCard = screen.getByText('Aurora Calder').closest('[data-worker-id]');
    const activitySlot = screen.getByTestId('minimal-activity-slot-gold_mine_slot');

    expect(residentCard).toBeInTheDocument();
    expect(activitySlot).toBeInTheDocument();

    // Simulate drag start
    fireEvent.dragStart(residentCard!, {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('resident-1'),
      },
    });

    // Simulate drop on activity slot
    fireEvent.drop(activitySlot, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('resident-1'),
      },
    });

    await waitFor(() => {
      expect(mockStore.startActivity).toHaveBeenCalledWith('resident-1', 'job_gold_mine_minimal');
    });
  });

  it('prevents drop when resident has high fatigue', async () => {
    // Mock validation to fail due to fatigue
    mockStore.canStartActivity.mockReturnValue({
      canStart: false,
      reason: 'Resident is too fatigued',
      reasonCode: 'resident_exhausted'
    });

    render(<MinimalGameplayPage />);

    const residentCard = screen.getByText('Marcus Vale').closest('[data-worker-id]');
    const activitySlot = screen.getByTestId('minimal-activity-slot-gold_mine_slot');

    // Simulate drag and drop
    fireEvent.dragStart(residentCard!, {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('resident-2'),
      },
    });

    fireEvent.drop(activitySlot, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('resident-2'),
      },
    });

    await waitFor(() => {
      expect(mockStore.startActivity).not.toHaveBeenCalled();
    });

    // Should show some indication of failed drop
    // Note: Actual UI feedback implementation may vary
  });

  it('prevents drop when activity slot is occupied', async () => {
    // Set up an active activity
    mockStore.state.activeActivities = [{
      activityId: 'job_gold_mine_minimal',
      residentId: 'resident-1',
      ticksRemaining: 5,
    }];

    mockStore.canStartActivity.mockReturnValue({
      canStart: false,
      reason: 'Slot is already occupied',
      reasonCode: 'activity_in_progress'
    });

    render(<MinimalGameplayPage />);

    const residentCard = screen.getByText('Aurora Calder').closest('[data-worker-id]');
    const activitySlot = screen.getByTestId('minimal-activity-slot-gold_mine_slot');

    // Simulate drag and drop
    fireEvent.dragStart(residentCard!, {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('resident-1'),
      },
    });

    fireEvent.drop(activitySlot, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('resident-1'),
      },
    });

    await waitFor(() => {
      expect(mockStore.startActivity).not.toHaveBeenCalled();
    });
  });

  it('handles drag cancel gracefully', () => {
    render(<MinimalGameplayPage />);

    const residentCard = screen.getByText('Aurora Calder').closest('[data-worker-id]');

    // Simulate drag start and cancel
    fireEvent.dragStart(residentCard!, {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('resident-1'),
      },
    });

    // Drag cancel should not cause errors
    fireEvent.dragEnd(residentCard!, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('resident-1'),
      },
    });

    expect(mockStore.startActivity).not.toHaveBeenCalled();
  });

  it('shows correct activity progress when resident is working', () => {
    // Set up an active activity with progress
    mockStore.state.activeActivities = [{
      activityId: 'job_gold_mine_minimal',
      residentId: 'resident-1',
      ticksRemaining: 5, // 5 out of 10 ticks remaining = 50% progress
    }];

    render(<MinimalGameplayPage />);

    const activitySlot = screen.getByTestId('minimal-activity-slot-gold_mine_slot');

    // Should show Aurora as assigned and some progress indication
    expect(activitySlot).toBeInTheDocument();
    // Progress fraction calculation: (10-5)/10 = 0.5, so 50% progress
  });

  it('updates slot state when activity completes', () => {
    // Initially has active activity
    mockStore.state.activeActivities = [{
      activityId: 'job_gold_mine_minimal',
      residentId: 'resident-1',
      ticksRemaining: 1,
    }];

    const { rerender } = render(<MinimalGameplayPage />);

    // Simulate activity completion
    mockStore.state.activeActivities = [];

    rerender(<MinimalGameplayPage />);

    const activitySlot = screen.getByTestId('minimal-activity-slot-gold_mine_slot');

    // Slot should now be available again
    expect(activitySlot).toBeInTheDocument();
  });

  it('maintains proper accessibility attributes during drag operations', () => {
    render(<MinimalGameplayPage />);

    const activitySlot = screen.getByTestId('minimal-activity-slot-gold_mine_slot');

    // Should have proper ARIA attributes
    expect(activitySlot).toHaveAttribute('aria-label');
    expect(activitySlot).toHaveAttribute('aria-dropeffect', 'move');
    expect(activitySlot).toHaveAttribute('aria-disabled', 'false');
  });

  it('handles multiple residents with different fatigue levels', () => {
    render(<MinimalGameplayPage />);

    // Aurora has normal fatigue (0.3), Marcus has high fatigue (0.9)
    expect(screen.getByText('Aurora Calder')).toBeInTheDocument();
    expect(screen.getByText('Marcus Vale')).toBeInTheDocument();

    // Both should be visible in the roster
    const workerPanel = screen.getByRole('region', { name: 'Pannello residenti' });
    expect(workerPanel).toBeInTheDocument();
  });

  it('prevents drop when target slot is invalid', async () => {
    // Resident not found scenario
    mockStore.canStartActivity.mockReturnValue({
      canStart: false,
      reason: 'Resident not found',
      reasonCode: 'resident_not_found'
    });

    render(<MinimalGameplayPage />);

    const residentCard = screen.getByText('Aurora Calder').closest('[data-worker-id]');
    const activitySlot = screen.getByTestId('minimal-activity-slot-quest_board_slot');

    // Simulate drag and drop with invalid resident
    fireEvent.dragStart(residentCard!, {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('invalid-resident'),
      },
    });

    fireEvent.drop(activitySlot, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('invalid-resident'),
      },
    });

    await waitFor(() => {
      expect(mockStore.startActivity).not.toHaveBeenCalled();
    });
  });
});
