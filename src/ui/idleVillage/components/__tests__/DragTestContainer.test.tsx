<<<<<<< Updated upstream
import { overrideDragConfig, resetDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
=======
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
>>>>>>> Stashed changes
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import DragTestContainer from '@/ui/idleVillage/components/DragTestContainer';
import { getDragConfig, overrideDragConfig, resetDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const formatResidentLabelSpy = vi.fn((resident: ResidentState) => `formatted-${resident.displayName ?? resident.id}`);

vi.mock('@/ui/idleVillage/residentName', () => ({
  formatResidentLabel: (resident: ResidentState) => formatResidentLabelSpy(resident),
}));

// Mock diagnostics
const mockDiagnostics = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => mockDiagnostics),
}));

// PgCard capture + helper
const capturedPgProps: Array<Record<string, unknown>> = [];

vi.mock('@/ui/idleVillage/components/PgCard', () => ({
  default: ({
    workerId,
    label,
<<<<<<< Updated upstream
    hp,
    fatigue,
    maxHp,
    disabled,
=======
    subtitle,
    hp,
    fatigue,
    maxHp,
    isDragging,
>>>>>>> Stashed changes
    statusLabel,
    onDragStart,
    onDragEnd,
    onSelect,
<<<<<<< Updated upstream
    onDragStateChange,
    compatibilityState,
    'data-testid': _testId,
    ...props
  }: {
    workerId: string;
    label: string;
    hp: number;
    fatigue: number;
    maxHp: number;
    disabled: boolean;
    statusLabel: string;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onSelect: () => void;
    onDragStateChange?: (residentId: string, isDragging: boolean) => void;
    compatibilityState: Record<string, unknown>;
    'data-testid': string;
    [key: string]: unknown;
  }) => {
    capturedPgProps.push({ workerId, label, hp, fatigue, maxHp, disabled, statusLabel, ...props });

=======
    disabled,
    'data-testid': testId,
  }: any) => {
>>>>>>> Stashed changes
    const handleDragStart = (e: React.DragEvent) => {
      if (!e.dataTransfer) {
        e.dataTransfer = { setData: vi.fn() } as unknown as DataTransfer;
      }
      onDragStateChange?.(workerId, true);
      onDragStart?.(e);
    };

    const handleDragEnd = () => {
      onDragStateChange?.(workerId, false);
      onDragEnd?.();
    };
<<<<<<< Updated upstream

    const dropState = props['data-drag-state'] || 'idle';

=======
    
>>>>>>> Stashed changes
    return (
      <div
        data-testid={`pg-card-${workerId}`}
        data-worker-id={workerId}
        data-drag-state={dropState}
        data-compatibility={compatibilityState}
        aria-disabled={disabled}
        draggable={!disabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
<<<<<<< Updated upstream
        onClick={() => onSelect?.()}
        className={disabled ? 'cursor-not-allowed opacity-35' : 'cursor-grab'}
      >
        <span>{label}</span>
        <span>HP: {hp}/{maxHp}</span>
        <span>Fatigue: {fatigue}%</span>
        <span>Status: {statusLabel}</span>
        {compatibilityState && <span>Compatibility: {JSON.stringify(compatibilityState)}</span>}
=======
        onClick={() => onSelect?.(workerId)}
      >
        {label}
>>>>>>> Stashed changes
      </div>
    );
  },
}));

<<<<<<< Updated upstream
// Mock resident data
const mockResidents: ResidentState[] = [
  {
    id: 'resident-1',
    displayName: 'Test Resident 1',
    currentHp: 100,
    maxHp: 100,
    fatigue: 0,
    status: 'available' as const,
    isInjured: false,
    portraitUrl: '',
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
  {
    id: 'resident-2',
    displayName: 'Test Resident 2',
    currentHp: 50,
    maxHp: 100,
    fatigue: 80,
    status: 'exhausted' as const,
    isInjured: false,
    portraitUrl: '',
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
  {
    id: 'resident-3',
    displayName: 'Test Resident 3',
    currentHp: 0,
    maxHp: 100,
    fatigue: 0,
    status: 'dead' as const,
    isInjured: false,
    portraitUrl: '',
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
];

describe('DragTestContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDragConfig();
    vi.useFakeTimers();
    capturedPgProps.length = 0;
    formatResidentLabelSpy.mockClear();
  });

  const defaultProps: DragTestContainerProps = {
    residents: mockResidents,
    isDayPhase: true,
    lockedResidentIds: ['resident-2'],
    lockedStatusLabel: 'Assigned',
  };

  it('should load config and log on mount', () => {
    render(<DragTestContainer {...defaultProps} />);

    expect(mockDiagnostics.info).toHaveBeenCalledWith('config_loaded', {
      minHpThreshold: 1,
      maxFatigueThreshold: 100,
      virtualizationThreshold: 30,
    });
  });

  it('should expose accessible attributes for counters and states', () => {
    render(<DragTestContainer {...defaultProps} />);

    const container = screen.getByTestId('drag-test-container');
    // Default config filters: hp < 1 or fatigue > 100
    // mockResidents: 1: hp 100, fat 0 (pass); 2: hp 50, fat 80 (pass); 3: hp 0, fat 0 (fail)
    // So filtered count should be 2
    expect(container).toHaveAttribute('data-filtered-count', '2');
    expect(container).toHaveAttribute('data-total-count', '3');
    expect(container).toHaveAttribute('data-locked-count', '1');
    expect(container).toHaveAttribute('data-day-phase', 'true');
    expect(container).toHaveAttribute('data-virtualization-enabled', 'false');

    const dropzone = screen.getByTestId('resident-dropzone');
    expect(dropzone).toHaveAttribute('data-resident-count', '2');
  });

  it('should log drag start with rich payload', () => {
    const onDragStart = vi.fn();
    render(<DragTestContainer {...defaultProps} onDragStart={onDragStart} />);

    const residentCard = screen.getByTestId('pg-card-resident-1');
    fireEvent.dragStart(residentCard);

    expect(mockDiagnostics.info).toHaveBeenCalledWith(
      'drag_start',
      expect.objectContaining({
        residentId: 'resident-1',
        timestamp: expect.any(Number),
        location: 'DragTestContainer',
        payload: expect.objectContaining({
          residentId: 'resident-1',
          source: 'roster',
        }),
      }),
      expect.arrayContaining(['drag', 'start'])
    );
    expect(onDragStart).toHaveBeenCalledWith('resident-1');
  });

  it('should log drag end with actual duration', () => {
    const onDragEnd = vi.fn();
    render(<DragTestContainer {...defaultProps} onDragEnd={onDragEnd} />);

    const residentCard = screen.getByTestId('pg-card-resident-1');
    fireEvent.dragStart(residentCard);
    // Simulate some time passing
    vi.advanceTimersByTime(150);
    fireEvent.dragEnd(residentCard);

    expect(mockDiagnostics.info).toHaveBeenCalledWith(
      'drag_end',
=======
// Mock drag config for testing
const mockDragConfig = {
  visual: {
    validDropColor: 'rgba(34, 197, 94, 0.1)',
    invalidDropColor: 'rgba(239, 68, 68, 0.1)',
    lockedDropColor: 'rgba(107, 114, 128, 0.1)',
    activeDragBorderColor: 'rgba(251, 191, 36, 0.5)',
    draggedOpacity: 0.7,
    bloomScale: 1.05,
  },
  timing: {
    feedbackDelayMs: 100,
    dragTimeoutMs: 10000,
    dropStateDebounceMs: 50,
    transitionDurationMs: 200,
  },
  thresholds: {
    minHpThreshold: 1,
    maxFatigueThreshold: 100,
    minDragDistance: 5,
    virtualizationThreshold: 30,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset drag config before each test
  resetDragConfig();
  // Override with mock config for deterministic testing
  overrideDragConfig(mockDragConfig);
});

describe('DragTestContainer', () => {
  const mockResidents: ResidentState[] = [
    {
      id: 'resident-1',
      name: 'Test Resident 1',
      currentHp: 10,
      maxHp: 10,
      fatigue: 20,
      status: 'available',
      isInjured: false,
      portraitUrl: '',
    },
    {
      id: 'resident-2',
      name: 'Test Resident 2',
      currentHp: 5,
      maxHp: 10,
      fatigue: 80,
      status: 'available',
      isInjured: false,
      portraitUrl: '',
    },
  ];

  it('renders successfully with residents', () => {
    render(
      <DragTestContainer
        residents={mockResidents}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
      />
    );
    
    expect(screen.getByTestId('drag-test-container')).toBeInTheDocument();
    expect(screen.getByTestId('resident-count')).toHaveTextContent('2/2');
  });

  it('logs drag start events with diagnostics', () => {
    const onDragStart = vi.fn();
    
    render(
      <DragTestContainer
        residents={mockResidents}
        onDragStart={onDragStart}
        onDragEnd={vi.fn()}
      />
    );
    
    const residentCard = screen.getByTestId('pg-card-resident-1');
    fireEvent.dragStart(residentCard);
    
    expect(mockDiagnostics.info).toHaveBeenCalledWith(
      'drag_start',
>>>>>>> Stashed changes
      expect.objectContaining({
        residentId: 'resident-1',
        timestamp: expect.any(Number),
        location: 'DragTestContainer',
        payload: expect.objectContaining({
          residentId: 'resident-1',
<<<<<<< Updated upstream
          dragDuration: expect.any(Number),
        }),
      }),
      expect.arrayContaining(['drag', 'end'])
    );
    expect(onDragEnd).toHaveBeenCalledWith('resident-1');
  });

  it('should log drop state changes with rich payload', () => {
    render(<DragTestContainer {...defaultProps} />);

    expect(mockDiagnostics.debug).toHaveBeenCalledWith(
      'drop_state',
      expect.objectContaining({
        payload: expect.objectContaining({
          residentId: 'resident-1',
          dropState: 'valid',
        }),
      }),
      expect.arrayContaining(['drag', 'state'])
    );
  });

  it('should log filter changes with rich payload', () => {
    render(<DragTestContainer {...defaultProps} />);

    const statusFilter = screen.getByLabelText('Filtra residenti per status');
    fireEvent.change(statusFilter, { target: { value: 'exhausted' } });

    expect(mockDiagnostics.info).toHaveBeenCalledWith(
      'filter_changed',
      expect.objectContaining({
        payload: expect.objectContaining({
          filterType: 'status',
          newStatus: 'exhausted',
        }),
      }),
      expect.arrayContaining(['filter', 'change'])
    );
  });

  it('should log roster collapse toggling', () => {
    render(<DragTestContainer {...defaultProps} />);

    const toggleButton = screen.getByLabelText('Nascondi roster');
    fireEvent.click(toggleButton);

    expect(mockDiagnostics.debug).toHaveBeenCalledWith(
      'roster_collapsed_toggled',
      expect.objectContaining({
        payload: expect.objectContaining({
          isCollapsed: true,
        }),
      }),
      expect.arrayContaining(['ui', 'toggle'])
    );
  });

  it('should apply Phase E validation thresholds for HP and Fatigue', () => {
    overrideDragConfig({
      thresholds: {
        minHpThreshold: 60,
        maxFatigueThreshold: 50,
        minDragDistance: 5,
        virtualizationThreshold: 30,
      }
    });

    render(<DragTestContainer {...defaultProps} />);

    const container = screen.getByTestId('drag-test-container');
    // Only resident-1 (HP 100, Fatigue 0) should pass.
    expect(container).toHaveAttribute('data-filtered-count', '1');
    
    expect(screen.getByTestId('pg-card-resident-1')).toBeInTheDocument();
    expect(screen.queryByTestId('pg-card-resident-2')).not.toBeInTheDocument();
  });

  it('should disable dragging and show disabled state during night phase', () => {
    render(<DragTestContainer {...defaultProps} isDayPhase={false} />);

    const residentCard = screen.getByTestId('pg-card-resident-1');
    expect(residentCard).toHaveAttribute('data-drag-state', 'disabled');
    expect(residentCard).toHaveAttribute('aria-disabled', 'true');
    expect(residentCard).toHaveAttribute('draggable', 'false');
  });

  it('should show locked status for assigned residents', () => {
    render(<DragTestContainer {...defaultProps} />);

    const lockedCard = screen.getByTestId('pg-card-resident-2');
    expect(lockedCard).toHaveAttribute('data-drag-state', 'locked');
    expect(within(lockedCard).getByText('Status: Assigned')).toBeInTheDocument();
  });

  it('should handle valid compatibility state', () => {
    const mockCompatibility = vi.fn().mockReturnValue({ state: 'valid', slotLabel: 'Gym' });
    render(
      <DragTestContainer 
        {...defaultProps} 
        getResidentCompatibility={mockCompatibility}
      />
    );

    const residentCard = screen.getByTestId('pg-card-resident-1');
    expect(residentCard).toHaveAttribute('data-compatibility', 'valid');
  });

  it('should handle invalid compatibility state', () => {
    const mockCompatibility = vi.fn().mockReturnValue({ state: 'invalid', slotLabel: 'Locked' });
    render(
      <DragTestContainer 
        {...defaultProps} 
        getResidentCompatibility={mockCompatibility}
      />
    );

    const residentCard = screen.getByTestId('pg-card-resident-1');
    expect(residentCard).toHaveAttribute('data-compatibility', 'invalid');
    expect(residentCard).toHaveAttribute('data-drag-state', 'invalid');
  });

  it('exposes vertical PgCard layout when cardVariant="vertical"', () => {
    render(<DragTestContainer {...defaultProps} cardVariant="vertical" />);

    expect(capturedPgProps.some((props) => props.workerId === 'resident-1' && props.horizontal === false)).toBe(true);
  });

  it('resets drag state via onDragStateChange to avoid ghost cards', () => {
    const stateChange = vi.fn();
    render(
      <DragTestContainer
        {...defaultProps}
        onDragStateChange={stateChange}
      />,
    );

    const residentCard = screen.getByTestId('pg-card-resident-1');
    fireEvent.dragStart(residentCard);
    fireEvent.dragEnd(residentCard);

    expect(stateChange).toHaveBeenNthCalledWith(1, 'resident-1', true);
    expect(stateChange).toHaveBeenLastCalledWith('resident-1', false);
  });

  it('filters heroes when status filter is set to heroes', () => {
    const heroResidents: ResidentState[] = [
      { ...mockResidents[0], id: 'hero-1', displayName: 'Hero', isHero: true },
      { ...mockResidents[1], id: 'resident-regular', isHero: false, status: 'available' },
    ];

    render(<DragTestContainer {...defaultProps} residents={heroResidents} />);

    const statusFilter = screen.getByLabelText('Filtra residenti per status');
    fireEvent.change(statusFilter, { target: { value: 'heroes' } });

    expect(screen.getByTestId('pg-card-hero-1')).toBeInTheDocument();
    expect(screen.queryByTestId('pg-card-resident-regular')).not.toBeInTheDocument();
  });

  it('supports quick filter buttons for heroes', () => {
    const heroResidents: ResidentState[] = [
      { ...mockResidents[0], id: 'hero-quick', displayName: 'Hero Quick', isHero: true },
      { ...mockResidents[1], id: 'resident-plain', isHero: false, status: 'available' },
    ];

    render(<DragTestContainer {...defaultProps} residents={heroResidents} />);

    const heroButton = screen.getByRole('button', { name: /Eroi/i });
    fireEvent.click(heroButton);

    expect(heroButton).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('pg-card-hero-quick')).toBeInTheDocument();
    expect(screen.queryByTestId('pg-card-resident-plain')).not.toBeInTheDocument();
  });

  it('shows blocked overlay for exhausted residents', () => {
    const blockedResidents: ResidentState[] = [
      { ...mockResidents[0], id: 'blocked', status: 'exhausted', currentHp: 10, maxHp: 100 },
    ];

    render(<DragTestContainer {...defaultProps} residents={blockedResidents} />);

    expect(screen.getByText(/Recupero necessario/i)).toBeVisible();
  });

  it('renders hero flash indicator when resident becomes hero', () => {
    const heroResident: ResidentState = { ...mockResidents[0], id: 'hero-spark', isHero: true };

    render(<DragTestContainer {...defaultProps} residents={[heroResident]} />);

    const heroCardWrapper = screen.getByTestId('pg-card-hero-spark').parentElement;
    expect(heroCardWrapper?.dataset.hero).toBe('true');
    expect(heroCardWrapper?.querySelector('.animate-ping')).toBeTruthy();
  });

  it('renders formatted resident labels (no raw fallback)', () => {
    render(<DragTestContainer {...defaultProps} />);

    const residentCard = screen.getByTestId('pg-card-resident-1');
    expect(residentCard).toHaveTextContent('formatted-Test Resident 1');
    expect(formatResidentLabelSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'resident-1' }));
=======
          source: 'roster',
        }),
      }),
      ['drag']
    );
  });

  it('logs drag end events with diagnostics', () => {
    const onDragEnd = vi.fn();
    
    render(
      <DragTestContainer
        residents={mockResidents}
        onDragStart={vi.fn()}
        onDragEnd={onDragEnd}
      />
    );
    
    const residentCard = screen.getByTestId('pg-card-resident-1');
    fireEvent.dragEnd(residentCard);
    
    expect(mockDiagnostics.info).toHaveBeenCalledWith(
      'drag_end',
      expect.objectContaining({
        residentId: 'resident-1',
        timestamp: expect.any(Number),
        location: 'DragTestContainer',
      }),
      ['drag']
    );
  });

  it('uses config thresholds for resident interaction', () => {
    render(
      <DragTestContainer
        residents={mockResidents}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        isDayPhase={true}
      />
    );
    
    const residentCard1 = screen.getByTestId('pg-card-resident-1');
    const residentCard2 = screen.getByTestId('pg-card-resident-2');
    
    // Resident 1 has HP 10 (> minHpThreshold 1) and fatigue 20 (< maxFatigueThreshold 100)
    expect(residentCard1).not.toHaveAttribute('aria-disabled', 'true');
    
    // Resident 2 has HP 5 (> minHpThreshold 1) but fatigue 80 (< maxFatigueThreshold 100)
    // Should still be interactive based on config
    expect(residentCard2).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables dragging during night phase', () => {
    render(
      <DragTestContainer
        residents={mockResidents}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        isDayPhase={false}
      />
    );
    
    const residentCard = screen.getByTestId('pg-card-resident-1');
    expect(residentCard).toHaveAttribute('aria-disabled', 'true');
  });

  it('logs filter changes', () => {
    render(
      <DragTestContainer
        residents={mockResidents}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
      />
    );
    
    const statusFilter = screen.getByDisplayValue('All');
    fireEvent.change(statusFilter, { target: { value: 'available' } });
    
    expect(mockDiagnostics.info).toHaveBeenCalledWith(
      'filter_changed',
      expect.objectContaining({
        filterType: 'status',
        newStatus: 'available',
      })
    );
  });

  it('logs virtualization state changes', () => {
    const manyResidents = Array.from({ length: 35 }, (_, i) => ({
      id: `resident-${i}`,
      name: `Resident ${i}`,
      currentHp: 10,
      maxHp: 10,
      fatigue: 20,
      status: 'available' as const,
      isInjured: false,
      portraitUrl: '',
    }));
    
    render(
      <DragTestContainer
        residents={manyResidents}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
      />
    );
    
    expect(mockDiagnostics.debug).toHaveBeenCalledWith(
      'virtualization_state',
      expect.objectContaining({
        shouldVirtualize: true,
        residentCount: 35,
        threshold: 30,
      })
    );
>>>>>>> Stashed changes
  });
});
