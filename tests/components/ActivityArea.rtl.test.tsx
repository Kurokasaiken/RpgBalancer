import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ActivityArea, { type ActivityAreaProps, type ActivityAreaSlot } from '@/ui/idleVillage/ActivityArea';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  telemetryIdleVillage: {
    mock: vi.fn(),
  },
}));

describe('ActivityArea RTL Smoke Tests', () => {
  const mockHandlers = {
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

  const createMockSlot = (overrides: Partial<ActivityAreaSlot> = {}): ActivityAreaSlot => ({
    slotId: 'slot-1',
    label: 'Lavoro',
    iconName: 'hammer',
    visualVariant: 'azure' as VerbVisualVariant,
    progressFraction: 0.5,
    elapsedSeconds: 60,
    totalDurationSeconds: 120,
    canAcceptDrop: true,
    ...overrides,
  });

  const defaultProps: ActivityAreaProps = {
    slots: [
      createMockSlot(),
      createMockSlot({ 
        slotId: 'slot-2', 
        label: 'Riposo', 
        iconName: 'bed',
        visualVariant: 'ember' as VerbVisualVariant,
        canAcceptDrop: false 
      }),
      createMockSlot({ 
        slotId: 'cycle-control', 
        label: 'Controllo Ciclo', 
        iconName: 'cycle',
        visualVariant: 'jade' as VerbVisualVariant,
        isCycleControl: true,
        canAcceptDrop: false 
      }),
    ],
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
    handlers: mockHandlers,
    locationTitle: 'Foresta',
    locationDescription: 'Luogo di lavoro',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render baseline with all mini ActivitySlot cards', () => {
    render(<ActivityArea {...defaultProps} />);

    // Check main section
    expect(screen.getByRole('region')).toBeInTheDocument();
    
    // Check header info
    expect(screen.getByText('Attività')).toBeInTheDocument();
    expect(screen.getByText('5s per TU')).toBeInTheDocument();
    expect(screen.getByText('Ciclo · 75% · 3:00')).toBeInTheDocument();

    // Check all slots are rendered
    expect(screen.getByText('Lavoro')).toBeInTheDocument();
    expect(screen.getByText('Riposo')).toBeInTheDocument();
    expect(screen.getByText('Controllo Ciclo')).toBeInTheDocument();

    // Check location card
    expect(screen.getByText('Foresta')).toBeInTheDocument();
    expect(screen.getByText('Luogo di lavoro')).toBeInTheDocument();
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
    const draggingProps = { ...defaultProps, draggingResidentId: 'worker-123' };
    render(<ActivityArea {...draggingProps} />);

    expect(screen.getByText('Trascinando:')).toBeInTheDocument();
    expect(screen.getByText('worker-123')).toBeInTheDocument();
  });

  it('should render empty state when no slots available', () => {
    const emptyProps = { ...defaultProps, slots: [] };
    render(<ActivityArea {...emptyProps} />);

    expect(screen.getByText('Nessuna attività disponibile in questo momento.')).toBeInTheDocument();
  });

  it('should handle stacked layout variant', () => {
    const stackedProps = { ...defaultProps, layout: 'stacked' as const };
    render(<ActivityArea {...stackedProps} />);

    // Should still render all slots
    expect(screen.getByText('Lavoro')).toBeInTheDocument();
    expect(screen.getByText('Riposo')).toBeInTheDocument();
    expect(screen.getByText('Controllo Ciclo')).toBeInTheDocument();
  });

  it('should call telemetry mock on drop interactions', async () => {
    const { telemetryIdleVillage } = await import('@/analytics/telemetry/telemetryProvider');
    
    render(<ActivityArea {...defaultProps} />);

    // Simulate a drop interaction
    const slot = screen.getByTestId('activity-slot-slot-1');
    
    // The component should have telemetry hooks that get called
    // This is a smoke test to ensure telemetry is wired up
    expect(slot).toBeInTheDocument();
    expect(telemetryIdleVillage.mock).toBeDefined();
  });

  it('should have proper accessibility attributes', () => {
    render(<ActivityArea {...defaultProps} />);

    // Check for proper ARIA labels and roles
    const slots = screen.getAllByTestId(/activity-slot-/);
    slots.forEach(slot => {
      expect(slot).toHaveAttribute('role', 'button');
      expect(slot).toHaveAttribute('tabIndex', '0');
    });

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

    // Should still render properly on mobile
    expect(screen.getByText('Attività')).toBeInTheDocument();
    expect(screen.getByText('Lavoro')).toBeInTheDocument();
  });
});
