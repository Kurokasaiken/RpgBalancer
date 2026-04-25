import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WoodPOI from '@/ui/idleVillage/components/WoodPOI';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { MinimalGameState } from '@/engine/game/idleVillage/minimalSnapshotSerializer';
import { trackTelemetryEvent } from '@/shared/telemetry';

// Mock telemetry
vi.mock('@/shared/telemetry', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock Style Lab tokens
vi.mock('@/ui/styleLab/hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: () => ({
    poiStates: {
      idle: { bg: 'rgb(34, 197, 94)', border: 'rgb(22, 163, 74)' },
      running: { bg: 'rgb(59, 130, 246)', border: 'rgb(37, 99, 235)' },
      completed: { bg: 'rgb(251, 191, 36)', border: 'rgb(245, 158, 11)' },
    },
  }),
}));

// Mock MinimalActivityPOI
vi.mock('@/ui/idleVillage/components/minimal/MinimalActivityPOI', () => ({
  default: function MockMinimalActivityPOI({ onResidentAssign, assignedResident }: any) {
    return (
      <div data-testid="minimal-activity-poi">
        <div data-testid="assigned-resident">{assignedResident || 'none'}</div>
        <button 
          data-testid="assign-resident"
          onClick={() => onResidentAssign('test-resident-1')}
        >
          Assign Resident
        </button>
      </div>
    );
  },
}));

describe('WoodPOI', () => {
  const mockResidents: ResidentState[] = [
    {
      id: 'resident-1',
      name: 'Test Resident',
      level: 1,
      stats: { strength: 5, endurance: 5, agility: 5, intelligence: 5, perception: 5 },
      currentHp: 100,
      maxHp: 100,
      fatigue: 0,
      isInjured: false,
      isWorking: false,
      isHero: false,
      survivalCount: 0,
      survivalScore: 0,
      status: 'available' as any,
    },
  ];

  const mockGameState: MinimalGameState = {
    activeActivities: [],
    currentDay: 1,
    currentTime: 12.0,
    gold: 10,
    food: 8,
    maxFood: 20,
    residents: mockResidents,
    isPaused: false,
    speedMultiplier: 1,
    tickIntervalMs: 1000,
  };

  const defaultProps = {
    poiId: 'wood-poi-1',
    state: 'idle' as const,
    progress: 0,
    onResidentAssign: vi.fn(),
    residents: mockResidents,
    gameState: mockGameState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Wood POI in idle state', () => {
    render(
      <DndContext>
        <WoodPOI {...defaultProps} />
      </DndContext>
    );

    expect(screen.getByTestId('minimal-activity-poi')).toBeInTheDocument();
    expect(screen.getByTestId('assigned-resident')).toHaveTextContent('none');
  });

  it('shows running state with progress', () => {
    const runningGameState = {
      ...mockGameState,
      activeActivities: [
        {
          activityId: 'job_wood_gathering_stable',
          residentId: 'resident-1',
          ticksRemaining: 2,
          startTime: Date.now(),
        },
      ],
    };

    render(
      <DndContext>
        <WoodPOI 
          {...defaultProps} 
          state="running" 
          progress={0.5}
          gameState={runningGameState}
        />
      </DndContext>
    );

    // Check that progress halo is rendered
    const poiContainer = screen.getByTestId('minimal-activity-poi').parentElement;
    expect(poiContainer).toBeInTheDocument();
  });

  it('shows completed state with collect indicator', () => {
    render(
      <DndContext>
        <WoodPOI {...defaultProps} state="completed" />
      </DndContext>
    );

    // Check for collect indicator
    const collectIndicator = document.querySelector('.absolute.-top-2.-right-2');
    expect(collectIndicator).toBeInTheDocument();
    expect(collectIndicator).toHaveTextContent('!');
  });

  it('calls onClick when clicked in idle state', () => {
    const mockOnClick = vi.fn();
    
    render(
      <DndContext>
        <WoodPOI {...defaultProps} onClick={mockOnClick} />
      </DndContext>
    );

    const poiContainer = screen.getByTestId('minimal-activity-poi').parentElement;
    fireEvent.click(poiContainer!);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onCollect when clicked in completed state', () => {
    const mockOnClick = vi.fn();
    const mockOnCollect = vi.fn();
    
    render(
      <DndContext>
        <WoodPOI 
          {...defaultProps} 
          state="completed" 
          onClick={mockOnClick}
          onCollect={mockOnCollect}
        />
      </DndContext>
    );

    const poiContainer = screen.getByTestId('minimal-activity-poi').parentElement;
    fireEvent.click(poiContainer!);

    expect(mockOnCollect).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('forwards resident assignment to MinimalActivityPOI', () => {
    const mockOnResidentAssign = vi.fn();
    
    render(
      <DndContext>
        <WoodPOI {...defaultProps} onResidentAssign={mockOnResidentAssign} />
      </DndContext>
    );

    const assignButton = screen.getByTestId('assign-resident');
    fireEvent.click(assignButton);

    expect(mockOnResidentAssign).toHaveBeenCalledWith('test-resident-1');
  });

  it('shows assigned resident', () => {
    render(
      <DndContext>
        <WoodPOI {...defaultProps} assignedResident="resident-1" />
      </DndContext>
    );

    expect(screen.getByTestId('assigned-resident')).toHaveTextContent('resident-1');
  });

  it('emits telemetry events on render', () => {
    render(
      <DndContext>
        <WoodPOI {...defaultProps} />
      </DndContext>
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('wood_poi_rendered', {
      poiId: 'wood-poi-1',
      state: 'idle',
      progress: 0,
      assignedResident: undefined,
      isHovered: false,
      timestamp: expect.any(Number),
    });
  });

  it('emits telemetry on click', async () => {
    const mockOnClick = vi.fn();
    
    render(
      <DndContext>
        <WoodPOI {...defaultProps} onClick={mockOnClick} />
      </DndContext>
    );

    const poiContainer = screen.getByTestId('minimal-activity-poi').parentElement;
    fireEvent.click(poiContainer!);

    await waitFor(() => {
      expect(trackTelemetryEvent).toHaveBeenCalledWith('wood_poi_clicked', {
        poiId: 'wood-poi-1',
        state: 'idle',
        assignedResident: undefined,
        progress: 0,
        timestamp: expect.any(Number),
      });
    });
  });

  it('emits telemetry on resident assignment', () => {
    const mockOnResidentAssign = vi.fn();
    
    render(
      <DndContext>
        <WoodPOI {...defaultProps} onResidentAssign={mockOnResidentAssign} />
      </DndContext>
    );

    const assignButton = screen.getByTestId('assign-resident');
    fireEvent.click(assignButton);

    expect(trackTelemetryEvent).toHaveBeenCalledWith('wood_poi_resident_assigned', {
      poiId: 'wood-poi-1',
      residentId: 'test-resident-1',
      previousState: 'idle',
      timestamp: expect.any(Number),
    });
  });

  it('shows hover tooltip on hover', () => {
    render(
      <DndContext>
        <WoodPOI {...defaultProps} />
      </DndContext>
    );

    const poiContainer = screen.getByTestId('minimal-activity-poi').parentElement;
    fireEvent.mouseEnter(poiContainer!);

    const tooltip = document.querySelector('.absolute.-bottom-6');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Click to assign');
  });

  it('shows collect tooltip on completed state hover', () => {
    render(
      <DndContext>
        <WoodPOI {...defaultProps} state="completed" />
      </DndContext>
    );

    const poiContainer = screen.getByTestId('minimal-activity-poi').parentElement;
    fireEvent.mouseEnter(poiContainer!);

    const tooltip = document.querySelector('.absolute.-bottom-6');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Click to collect');
  });

  it('shows working tooltip on running state hover', () => {
    const runningGameState = {
      ...mockGameState,
      activeActivities: [
        {
          activityId: 'job_wood_gathering_stable',
          residentId: 'resident-1',
          ticksRemaining: 2,
          startTime: Date.now(),
        },
      ],
    };

    render(
      <DndContext>
        <WoodPOI 
          {...defaultProps} 
          state="running"
          gameState={runningGameState}
        />
      </DndContext>
    );

    const poiContainer = screen.getByTestId('minimal-activity-poi').parentElement;
    fireEvent.mouseEnter(poiContainer!);

    const tooltip = document.querySelector('.absolute.-bottom-6');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Working...');
  });
});
