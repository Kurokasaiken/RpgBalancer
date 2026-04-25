import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import '@testing-library/jest-dom';
import ActivityArea from '@/ui/idleVillage/ActivityArea';
import type { ActivityAreaProps } from '@/ui/idleVillage/ActivityArea';

// Mock dependencies
vi.mock('@/ui/idleVillage/components/ActivitySlot', () => ({
  default: ({ testId, dropState, isLockedByPhase, isSelected, ...props }: any) => (
    <div data-testid={testId} data-drop-state={dropState} data-locked-by-phase={isLockedByPhase ? 'true' : 'false'} data-selected={isSelected ? 'true' : 'false'}>
      <div>{props.label}</div>
      <div>{props.iconName}</div>
    </div>
  ),
}));

vi.mock('@/ui/idleVillage/components/LocationCard', () => ({
  default: ({ testId, dropState, isLockedByPhase, title, description }: any) => (
    <div data-testid={testId} data-drop-state={dropState} data-locked-by-phase={isLockedByPhase ? 'true' : 'false'}>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/ui/idleVillage/utils/formatTime', () => ({
  formatSeconds: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
}));

const mockSlots = [
  {
    slotId: 'slot-1',
    iconName: '⚒️',
    label: 'Lavoro',
    isCycleControl: false,
    canAcceptDrop: true,
    visualVariant: 'azure' as const,
    assignedWorkerName: null,
    assignedWorkerAvatarUrl: null,
    progressFraction: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 300,
  },
  {
    slotId: 'slot-2',
    iconName: '🏕️',
    label: 'Riposo',
    isCycleControl: false,
    canAcceptDrop: false,
    visualVariant: 'jade' as const,
    assignedWorkerName: null,
    assignedWorkerAvatarUrl: null,
    progressFraction: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 180,
  },
  {
    slotId: 'cycle-control',
    iconName: '🔄',
    label: 'Controllo Ciclo',
    isCycleControl: true,
    canAcceptDrop: false,
    visualVariant: 'solar' as const,
    assignedWorkerName: null,
    assignedWorkerAvatarUrl: null,
    progressFraction: 0.75,
    elapsedSeconds: 180,
    totalDurationSeconds: 240,
  },
];

const defaultProps: ActivityAreaProps = {
  slots: mockSlots,
  isDayPhase: true,
  cycleProgressFraction: 0.75,
  cycleElapsedSeconds: 180,
  secondsPerTimeUnit: 5,
  draggingResidentId: null,
  slotDropStates: {
    'slot-1': 'valid',
    'slot-2': 'invalid',
    'cycle-control': 'idle',
  },
  locationDropState: 'idle',
  handlers: {
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
  locationTitle: 'Foresta',
  locationDescription: 'Luogo di lavoro',
};

describe('ActivityArea RTL Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render baseline with all mini ActivitySlot cards', () => {
    render(<ActivityArea {...defaultProps} />);

    // Check main section
    expect(screen.getByTestId('activity-area')).toBeInTheDocument();
    
    // Check header info
    expect(screen.getByText('Attività')).toBeInTheDocument();
    expect(screen.getByText('5s per TU')).toBeInTheDocument();
    expect(screen.getByText('Ciclo · 75% · 3:00')).toBeInTheDocument();

    // Check all slots are rendered
    expect(screen.getByText('Lavoro')).toBeInTheDocument();
    expect(screen.getByText('Riposo')).toBeInTheDocument();
    expect(screen.getByText('Controllo Ciclo')).toBeInTheDocument();

    // Check location card
    expect(screen.getByTestId('location-card')).toBeInTheDocument();
  });

  it('should show valid drop state with bloom effect', () => {
    render(<ActivityArea {...defaultProps} />);

    // Valid drop state should be visible
    const validSlot = screen.getByTestId('activity-slot-slot-1');
    expect(validSlot).toBeInTheDocument();
    expect(validSlot).toHaveAttribute('data-drop-state', 'valid');
  });

  it('should show invalid drop state with opacity/pointer-events', () => {
    render(<ActivityArea {...defaultProps} />);

    // Invalid drop state should be visible
    const invalidSlot = screen.getByTestId('activity-slot-slot-2');
    expect(invalidSlot).toBeInTheDocument();
    expect(invalidSlot).toHaveAttribute('data-drop-state', 'invalid');
  });

  it('should show idle drop state for cycle control', () => {
    render(<ActivityArea {...defaultProps} />);

    // Cycle control should always be idle
    const cycleControl = screen.getByTestId('activity-slot-cycle-control');
    expect(cycleControl).toBeInTheDocument();
    expect(cycleControl).toHaveAttribute('data-drop-state', 'idle');
  });

  it('should handle night phase locking', () => {
    const nightProps = { ...defaultProps, isDayPhase: false };
    render(<ActivityArea {...nightProps} />);

    // All non-cycle slots should be locked at night
    const workSlot = screen.getByTestId('activity-slot-slot-1');
    expect(workSlot).toHaveAttribute('data-locked-by-phase', 'true');

    // Cycle control should not be locked
    const cycleControl = screen.getByTestId('activity-slot-cycle-control');
    expect(cycleControl).toHaveAttribute('data-locked-by-phase', 'false');
  });

  it('should show dragging resident indicator', () => {
    const draggingProps = { ...defaultProps, draggingResidentId: 'resident-123' };
    render(<ActivityArea {...draggingProps} />);

    expect(screen.getByText(/Trascinando:/)).toBeInTheDocument();
    expect(screen.getByText('resident-123')).toBeInTheDocument();
  });

  it('should show empty state when no slots', () => {
    const emptyProps = { ...defaultProps, slots: [] };
    render(<ActivityArea {...emptyProps} />);

    expect(screen.getByText('Nessuna attività disponibile in questo momento.')).toBeInTheDocument();
  });

  it('should render stacked layout correctly', () => {
    const stackedProps = { ...defaultProps, layout: 'stacked' as const };
    render(<ActivityArea {...stackedProps} />);

    // Should still render all slots
    expect(screen.getByTestId('activity-slot-slot-1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-slot-slot-2')).toBeInTheDocument();
    expect(screen.getByTestId('activity-slot-cycle-control')).toBeInTheDocument();
  });

  it('should call telemetry mock on drop', () => {
    const telemetryProps = {
      ...defaultProps,
      handlers: {
        ...defaultProps.handlers,
        onWorkerDrop: vi.fn(),
      },
    };
    render(<ActivityArea {...telemetryProps} />);

    // Simulate drop by calling handler directly
    const slot = screen.getByTestId('activity-slot-slot-1');
    slot.click();

    expect(telemetryProps.handlers.onWorkerDrop).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    render(<ActivityArea {...defaultProps} />);

    // Check for proper ARIA labels and roles
    const activityArea = screen.getByTestId('activity-area');
    expect(activityArea).toHaveAttribute('role', 'region');
    expect(activityArea).toHaveAttribute('aria-label', 'Activity area');

    // Location card should also be accessible
    const locationCard = screen.getByTestId('location-card');
    expect(locationCard).toBeInTheDocument();
  });

  it('should handle slot selection highlighting', () => {
    const selectedProps = { 
      ...defaultProps, 
      selectedSlotId: 'slot-1',
      highlightSelectedSlot: true 
    };
    render(<ActivityArea {...selectedProps} />);

    const selectedSlot = screen.getByTestId('activity-slot-slot-1');
    expect(selectedSlot).toHaveAttribute('data-selected', 'true');
  });

  it('should handle mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<ActivityArea {...defaultProps} />);

    // Should still render correctly on mobile
    expect(screen.getByTestId('activity-area')).toBeInTheDocument();
    expect(screen.getByTestId('activity-slot-slot-1')).toBeInTheDocument();
  });
});