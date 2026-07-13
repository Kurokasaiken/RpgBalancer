/**
 * QuestTelemetryPanel Test Suite
 * 
 * Comprehensive RTL tests for QuestTelemetryPanel component including
 * heatmap rendering, decision feed integration, and telemetry events.
 * 
 * @fileoverview QuestTelemetryPanel RTL tests
 * @module idleVillage/QuestTelemetryPanel.test
 * @since 2026-01-12
 * @author Cascade
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import { QuestTelemetryPanel } from '@/ui/idleVillage/components/QuestTelemetryPanel';
import { DEFAULT_QUEST_TELEMETRY_CONFIG } from '@/balancing/config/idleVillage/questTelemetryConfig';
import type { QuestTelemetryEntry } from '@/ui/idleVillage/hooks/useQuestTelemetry';

// Mock sub-components
vi.mock('@/ui/idleVillage/components/QuestRiskDisplay', () => ({
  default: ({ injuryPercentage, deathPercentage, onStripeClick }: any) => (
    <div data-testid="quest-risk-display">
      <div data-testid="injury-percentage">{injuryPercentage}%</div>
      <div data-testid="death-percentage">{deathPercentage}%</div>
      <button onClick={() => onStripeClick?.('injury', injuryPercentage)}>
        Injury Stripe
      </button>
      <button onClick={() => onStripeClick?.('death', deathPercentage)}>
        Death Stripe
      </button>
    </div>
  ),
}));

vi.mock('@/ui/idleVillage/components/QuestHeatmap', () => ({
  default: ({ matrix, onCellClick, testMode }: any) => (
    <div data-testid="quest-heatmap" data-test-mode={testMode}>
      <div data-testid="matrix-size">{matrix.length}x{matrix[0]?.length || 0}</div>
      <button onClick={() => onCellClick?.({ row: 0, column: 0, value: 25 })}>
        Cell Click
      </button>
    </div>
  ),
}));

vi.mock('@/ui/idleVillage/components/QuestDecisionFeed', () => ({
  default: ({ telemetry, onDecisionClick, compact, config }: any) => {
    const decisions = telemetry?.branchDecisions ?? [];
    const maxItems = config?.maxItems ?? decisions.length;
    const visibleDecisions = decisions.slice(0, maxItems);
    return (
      <div data-testid="quest-decision-feed" data-compact={compact}>
        <div data-testid="decision-count">{visibleDecisions.length}</div>
        <button onClick={() => onDecisionClick?.(visibleDecisions[0], {})}>
          Decision Click
        </button>
      </div>
    );
  },
}));

const mockIdleVillageConfig = {
  config: {
    questTypes: {
      'combat': { id: 'combat', label: 'Combat', colorClass: 'bg-red-500', priority: 0 },
      'exploration': { id: 'exploration', label: 'Exploration', colorClass: 'bg-blue-500', priority: 1 },
    },
  },
};

// Mock config store
vi.mock('@/balancing/config/idleVillage/IdleVillageConfigStore', () => ({
  useIdleVillageConfigStore: (selector?: (state: any) => any) => (selector ? selector(mockIdleVillageConfig) : mockIdleVillageConfig),
}));

describe('QuestTelemetryPanel', () => {
  const mockTelemetry: AggregatedTelemetry = {
    totalQuests: 10,
    successRate: 0.8,
    averageDuration: 1500,
    totalBranches: 25,
    averageChoiceTime: 3000,
    heroicMoments: 3,
    branchDecisions: [
      { phaseId: 'phase-1', choiceId: 'choice-1', outcome: { type: 'success', nextPhaseId: 'phase-2' }, timestamp: Date.now() },
      { phaseId: 'phase-2', choiceId: 'choice-2', outcome: { type: 'success', nextPhaseId: 'phase-3' }, timestamp: Date.now() },
      { phaseId: 'phase-3', choiceId: 'choice-3', outcome: { type: 'failure', nextPhaseId: 'phase-4' }, timestamp: Date.now() },
      { phaseId: 'phase-4', choiceId: 'choice-4', outcome: { type: 'success', nextPhaseId: 'phase-5' }, timestamp: Date.now() },
      { phaseId: 'phase-5', choiceId: 'choice-5', outcome: { type: 'success', nextPhaseId: 'phase-6' }, timestamp: Date.now() },
    ],
    recentQuests: [
      {
        questId: 'quest-1',
        result: {
          questId: 'quest-1',
          success: true,
          completedPhases: 3,
          totalPhases: 3,
          durationSeconds: 120,
          branchDecisions: [],
          finalEffects: [],
          telemetryData: {
            totalBranchesTaken: 2,
            averageChoiceTime: 1500,
            heroicMoments: 1,
            failurePoints: [],
            successPath: ['phase-1', 'phase-2'],
            playerChoices: ['choice-1'],
          },
        },
        timestamp: Date.now(),
        sessionId: 'session-1',
      },
      {
        questId: 'quest-2',
        result: {
          questId: 'quest-2',
          success: false,
          completedPhases: 2,
          totalPhases: 3,
          durationSeconds: 90,
          branchDecisions: [],
          finalEffects: [],
          telemetryData: {
            totalBranchesTaken: 1,
            averageChoiceTime: 2000,
            heroicMoments: 0,
            failurePoints: ['phase-3'],
            successPath: ['phase-1'],
            playerChoices: ['choice-2'],
          },
        },
        timestamp: Date.now() - 1000,
        sessionId: 'session-1',
      },
    ],
    questTypeBreakdown: {
      combat: 6,
      exploration: 4,
    },
  };

  const defaultProps = {
    telemetry: mockTelemetry,
    showHeatmap: true,
    showRecentDecisions: true,
    showRiskDisplay: true,
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quest telemetry panel with basic information', () => {
    render(<QuestTelemetryPanel {...defaultProps} />);
    
    expect(screen.getByText('Quest Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByTestId('quest-risk-display')).toBeInTheDocument();
  });

  it('displays performance metrics correctly', () => {
    render(<QuestTelemetryPanel {...defaultProps} />);
    
    expect(screen.getByText('10')).toBeInTheDocument(); // totalQuests
    expect(screen.getByText('80%')).toBeInTheDocument(); // successRate
    expect(screen.getByText('3')).toBeInTheDocument(); // heroicMoments
  });

  it('shows heatmap when enabled', () => {
    render(<QuestTelemetryPanel {...defaultProps} showHeatmap={true} />);
    
    expect(screen.getByTestId('quest-heatmap')).toBeInTheDocument();
    expect(screen.getByText('Quest Risk Heatmap')).toBeInTheDocument();
  });

  it('hides heatmap when disabled', () => {
    render(<QuestTelemetryPanel {...defaultProps} showHeatmap={false} />);
    
    expect(screen.queryByTestId('quest-heatmap')).not.toBeInTheDocument();
    expect(screen.queryByText('Quest Risk Heatmap')).not.toBeInTheDocument();
  });

  it('shows decision feed when enabled', () => {
    render(<QuestTelemetryPanel {...defaultProps} showRecentDecisions={true} />);
    
    expect(screen.getByTestId('quest-decision-feed')).toBeInTheDocument();
    expect(screen.getByTestId('decision-count')).toHaveTextContent('5'); // max decisions
  });

  it('hides decision feed when disabled', () => {
    render(<QuestTelemetryPanel {...defaultProps} showRecentDecisions={false} />);
    
    expect(screen.queryByTestId('quest-decision-feed')).not.toBeInTheDocument();
  });

  it('shows risk display when enabled', () => {
    render(<QuestTelemetryPanel {...defaultProps} showRiskDisplay={true} />);
    
    expect(screen.getByTestId('quest-risk-display')).toBeInTheDocument();
    expect(screen.getByTestId('injury-percentage')).toBeInTheDocument();
    expect(screen.getByTestId('death-percentage')).toBeInTheDocument();
  });

  it('hides risk display when disabled', () => {
    render(<QuestTelemetryPanel {...defaultProps} showRiskDisplay={false} />);
    
    expect(screen.queryByTestId('quest-risk-display')).not.toBeInTheDocument();
  });

  it('handles risk stripe clicks', async () => {
    const onRiskStripeClick = vi.fn();
    render(<QuestTelemetryPanel {...defaultProps} onRiskStripeClick={onRiskStripeClick} />);
    
    const injuryButton = screen.getByText('Injury Stripe');
    fireEvent.click(injuryButton);
    
    await waitFor(() => {
      expect(onRiskStripeClick).toHaveBeenCalledWith('injury', expect.any(Number));
    });
  });

  it('handles heatmap cell clicks', async () => {
    render(<QuestTelemetryPanel {...defaultProps} />);
    
    const cellButton = screen.getByText('Cell Click');
    fireEvent.click(cellButton);
    
    // Should not throw error - click handler is optional
    expect(cellButton).toBeInTheDocument();
  });

  it('handles decision feed clicks', async () => {
    render(<QuestTelemetryPanel {...defaultProps} />);
    
    const decisionButton = screen.getByText('Decision Click');
    fireEvent.click(decisionButton);
    
    // Should not throw error - click handler is optional
    expect(decisionButton).toBeInTheDocument();
  });

  it('applies compact mode correctly', () => {
    render(<QuestTelemetryPanel {...defaultProps} compact={true} />);
    
    expect(screen.getByTestId('quest-heatmap')).toHaveAttribute('data-test-mode', 'true');
    expect(screen.getByTestId('quest-decision-feed')).toHaveAttribute('data-compact', 'true');
  });

  it('displays loading state', () => {
    render(<QuestTelemetryPanel {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Loading telemetry...')).toBeInTheDocument();
    expect(screen.queryByTestId('quest-risk-display')).not.toBeInTheDocument();
  });

  it('displays error state', () => {
    render(<QuestTelemetryPanel {...defaultProps} error="Network error" />);
    
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.queryByTestId('quest-risk-display')).not.toBeInTheDocument();
  });

  it('handles clear button click', async () => {
    const onClear = vi.fn();
    render(<QuestTelemetryPanel {...defaultProps} onClear={onClear} />);
    
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(onClear).toHaveBeenCalled();
    });
  });

  it('displays footer statistics', () => {
    render(<QuestTelemetryPanel {...defaultProps} />);
    
    expect(screen.getByText('25 total branches')).toBeInTheDocument();
    expect(screen.getByText('3s avg choice time')).toBeInTheDocument();
  });

  it('transforms telemetry data correctly', () => {
    render(<QuestTelemetryPanel {...defaultProps} />);
    
    // Verify that the transformed data is passed to components
    expect(screen.getByTestId('quest-heatmap')).toBeInTheDocument();
    expect(screen.getByTestId('quest-decision-feed')).toBeInTheDocument();
  });

  it('handles empty telemetry gracefully', () => {
    const emptyTelemetry: AggregatedTelemetry = {
      totalQuests: 0,
      successRate: 0,
      averageDuration: 0,
      totalBranches: 0,
      averageChoiceTime: 0,
      heroicMoments: 0,
      branchDecisions: [],
      recentQuests: [],
      questTypeBreakdown: {},
    };
    
    render(<QuestTelemetryPanel {...defaultProps} telemetry={emptyTelemetry} />);
    
    expect(screen.getAllByText('0')).toHaveLength(3); // totalQuests + heroicMoments + decision-count
    expect(screen.getAllByText('0%')).toHaveLength(3); // successRate + risk display percentages
    expect(screen.getByTestId('quest-risk-display')).toBeInTheDocument();
  });

  it('shows legacy quest types when heatmap is disabled', () => {
    render(<QuestTelemetryPanel {...defaultProps} showHeatmap={false} />);
    
    expect(screen.getByText('Quest Types')).toBeInTheDocument();
    expect(screen.getByTitle(/6 quests/)).toBeInTheDocument(); // combat quests
    expect(screen.getByTitle(/4 quests/)).toBeInTheDocument(); // exploration quests
  });

  it('applies custom className', () => {
    const customClass = 'custom-telemetry-panel';
    render(<QuestTelemetryPanel {...defaultProps} className={customClass} />);
    
    const panel = screen.getByText('Quest Telemetry').closest('div')?.parentElement;
    expect(panel).toHaveClass(customClass);
  });

  describe('Telemetry Integration', () => {
    it('should emit telemetry events when heatmap is rendered', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      render(<QuestTelemetryPanel {...defaultProps} showHeatmap={true} />);
      
      fireEvent.click(screen.getByText('Cell Click'));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[QuestTelemetryPanel] Heatmap cell selected:',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('should emit telemetry events when decision is selected', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      render(<QuestTelemetryPanel {...defaultProps} showRecentDecisions={true} />);
      
      fireEvent.click(screen.getByText('Decision Click'));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[QuestTelemetryPanel] Decision selected:',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<QuestTelemetryPanel {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: 'Quest Telemetry' })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<QuestTelemetryPanel {...defaultProps} />);
      
      const clearButton = screen.getByText('Clear');
      clearButton.focus();
      expect(document.activeElement).toBe(clearButton);
    });
  });

  describe('Data Transformation', () => {
    it('calculates risk percentages correctly', () => {
      render(<QuestTelemetryPanel {...defaultProps} />);
      
      const injuryPercentage = screen.getByTestId('injury-percentage');
      const deathPercentage = screen.getByTestId('death-percentage');
      
      // Based on the mock data, should calculate combined risk
      expect(injuryPercentage).toBeInTheDocument();
      expect(deathPercentage).toBeInTheDocument();
    });

    it('generates correct matrix size', () => {
      render(<QuestTelemetryPanel {...defaultProps} />);
      
      const matrixSize = screen.getByTestId('matrix-size');
      const expectedSize = `${DEFAULT_QUEST_TELEMETRY_CONFIG.heatmap.grid.rows}x${DEFAULT_QUEST_TELEMETRY_CONFIG.heatmap.grid.columns}`;
      expect(matrixSize).toHaveTextContent(expectedSize);
    });

    it('limits decision feed to max decisions', () => {
      render(<QuestTelemetryPanel {...defaultProps} />);
      
      const decisionCount = screen.getByTestId('decision-count');
      expect(decisionCount).toHaveTextContent('5'); // max decisions from config
    });
  });

  describe('Error Handling', () => {
    it('handles missing telemetry gracefully', () => {
      // @ts-expect-error Testing missing telemetry
      render(<QuestTelemetryPanel {...defaultProps} telemetry={null} />);
      
      expect(screen.queryByText('Quest Telemetry')).not.toBeInTheDocument();
    });

    it('handles malformed telemetry data', () => {
      const malformedTelemetry = {
        ...mockTelemetry,
        recentQuests: [
          {
            ...mockTelemetry.recentQuests[0],
            result: {
              ...mockTelemetry.recentQuests[0].result,
              telemetryData: undefined,
            },
          },
        ],
      } as any;
      
      render(<QuestTelemetryPanel {...defaultProps} telemetry={malformedTelemetry} />);
      
      // Should still render without crashing
      expect(screen.getByText('Quest Telemetry')).toBeInTheDocument();
    });
  });
});
