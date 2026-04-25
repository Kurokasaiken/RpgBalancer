/**
 * Tests for QuestTelemetryPanel component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import QuestTelemetryPanel from '../QuestTelemetryPanel';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';

// Mock the hook
vi.mock('@/ui/idleVillage/hooks/useQuestTelemetry', () => ({
  useQuestTelemetry: vi.fn(),
}));
vi.mock('@/balancing/config/idleVillage/IdleVillageConfigStore', () => {
  const questTypeState = {
    config: {
      questTypes: {
        combat: { id: 'combat', label: 'Combat', priority: 1, colorClass: 'bg-red-400' },
        stealth: { id: 'stealth', label: 'Stealth', priority: 2, colorClass: 'bg-emerald-400' },
        exploration: { id: 'exploration', label: 'Explore', priority: 3, colorClass: 'bg-sky-400' },
      },
    },
  };

  const useIdleVillageConfigStore = (selector?: (state: typeof questTypeState) => unknown) => {
    return selector ? selector(questTypeState) : questTypeState;
  };

  return { useIdleVillageConfigStore };
});
import { useQuestTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { QuestTelemetryHook } from '@/ui/idleVillage/hooks/useQuestTelemetry';

describe('QuestTelemetryPanel', () => {
  const mockTelemetry: AggregatedTelemetry = {
    totalQuests: 5,
    successRate: 0.8,
    averageDuration: 120,
    totalBranches: 12,
    averageChoiceTime: 5.5,
    heroicMoments: 3,
    branchDecisions: [
      {
        phaseId: 'phase-1',
        choiceId: 'choice-a',
        timestamp: Date.now() - 1000,
        outcome: {
          nextPhaseIds: ['phase-2'],
          metadata: {
            choiceMade: 'Attack the enemy',
            lastChoiceTime: 4.2,
            branchReason: 'test-success',
          },
        },
      },
      {
        phaseId: 'phase-2',
        choiceId: 'choice-b',
        timestamp: Date.now() - 2000,
        outcome: {
          nextPhaseIds: [],
          metadata: {
            choiceMade: 'Sneak past',
            lastChoiceTime: 6.8,
            branchReason: 'test-failure',
          },
        },
      },
    ],
    recentQuests: [],
    questTypeBreakdown: {
      combat: 3,
      stealth: 2,
    },
  };

  const mockHookReturn: QuestTelemetryHook = {
    telemetry: mockTelemetry,
    isLoading: false,
    error: null,
    clearTelemetry: vi.fn(),
    recordQuestResult: vi.fn(),
    getQuestTypeStats: vi.fn(),
  };

  const mockedUseQuestTelemetry = vi.mocked(useQuestTelemetry);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseQuestTelemetry.mockReturnValue(mockHookReturn);
  });

  it('should render the panel with telemetry data', () => {
    render(<QuestTelemetryPanel telemetry={mockTelemetry} />);

    expect(screen.getByText('Quest Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Total Quests
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // Success Rate
    expect(screen.getByText('2m 0s')).toBeInTheDocument(); // Avg Duration
    expect(screen.getByText('3')).toBeInTheDocument(); // Heroic Moments
  });

  it('should show loading state', () => {
    mockedUseQuestTelemetry.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    });

    render(<QuestTelemetryPanel telemetry={mockTelemetry} />);

    expect(screen.getByText('Loading telemetry...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockedUseQuestTelemetry.mockReturnValue({
      ...mockHookReturn,
      error: 'Test error message',
    });

    render(<QuestTelemetryPanel telemetry={mockTelemetry} />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render quest type heatmap', () => {
    render(<QuestTelemetryPanel telemetry={mockTelemetry} />);

    expect(screen.getByText('Quest Types')).toBeInTheDocument();
    expect(screen.getByText('Combat')).toBeInTheDocument();
    expect(screen.getByText('Stealth')).toBeInTheDocument();
  });

  it('should render recent decisions list', () => {
    render(<QuestTelemetryPanel telemetry={mockTelemetry} />);

    expect(screen.getByText('Recent Decisions')).toBeInTheDocument();
    expect(screen.getByText('Attack the enemy')).toBeInTheDocument();
    expect(screen.getByText('Sneak past')).toBeInTheDocument();
  });

  it('should call clearTelemetry when Clear button is clicked', () => {
    render(<QuestTelemetryPanel telemetry={mockTelemetry} />);

    const clearButton = screen.getByText('Clear');
    act(() => fireEvent.click(clearButton));

    expect(mockHookReturn.clearTelemetry).toHaveBeenCalled();
  });

  it('should hide heatmap when showHeatmap is false', () => {
    render(<QuestTelemetryPanel telemetry={mockTelemetry} showHeatmap={false} />);

    expect(screen.queryByText('Quest Types')).not.toBeInTheDocument();
  });

  it('should hide recent decisions when showRecentDecisions is false', () => {
    render(<QuestTelemetryPanel telemetry={mockTelemetry} showRecentDecisions={false} />);

    expect(screen.queryByText('Recent Decisions')).not.toBeInTheDocument();
  });

  it('should apply compact class when compact prop is true', () => {
    const { container } = render(<QuestTelemetryPanel telemetry={mockTelemetry} compact />);

    const panel = container.firstChild;
    expect(panel).toHaveClass('text-sm');
  });

  it('should show empty state for heatmap when no quest types', () => {
    mockedUseQuestTelemetry.mockReturnValue({
      ...mockHookReturn,
      telemetry: {
        ...mockTelemetry,
        questTypeBreakdown: {},
      },
    });

    render(<QuestTelemetryPanel telemetry={{
      ...mockTelemetry,
      questTypeBreakdown: {},
    }} />);

    expect(screen.getByText('No quest data yet')).toBeInTheDocument();
  });

  it('should show empty state for decisions when no decisions', () => {
    mockedUseQuestTelemetry.mockReturnValue({
      ...mockHookReturn,
      telemetry: {
        ...mockTelemetry,
        branchDecisions: [],
      },
    });

    render(<QuestTelemetryPanel telemetry={{
      ...mockTelemetry,
      branchDecisions: [],
    }} />);

    expect(screen.getByText('No decisions yet')).toBeInTheDocument();
  });

  it('should display footer statistics', () => {
    render(<QuestTelemetryPanel telemetry={mockTelemetry} />);

    expect(screen.getByText('12 total branches')).toBeInTheDocument();
    expect(screen.getByText('6s avg choice time')).toBeInTheDocument();
  });
});
