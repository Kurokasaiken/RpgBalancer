/**
 * QuestDecisionFeed RTL Tests
 * 
 * React Testing Library tests for the QuestDecisionFeed component
 * covering filtering, sorting, analytics, and decision interactions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestDecisionFeed } from '@/ui/idleVillage/components/QuestDecisionFeed';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { BranchDecision } from '@/engine/quest/types';

// Mock the IdleVillageConfigStore
vi.mock('@/balancing/config/idleVillage/IdleVillageConfigStore', () => ({
  useIdleVillageConfigStore: vi.fn(() => ({
    config: {
      questTypes: {
        'combat': {
          id: 'combat',
          label: 'Combat Quest',
          priority: 1,
          matchers: [{ includes: ['combat', 'battle', 'fight'] }],
        },
        'exploration': {
          id: 'exploration',
          label: 'Exploration Quest',
          priority: 2,
          matchers: [{ includes: ['explore', 'scout', 'search'] }],
        },
      },
    },
  })),
}));

// Mock CSS modules
vi.mock('@/ui/idleVillage/components/QuestDecisionFeed.module.css', () => ({
  decisionFeed: 'decision-feed',
  decisionItem: 'decision-item',
  analytics: 'analytics',
  controls: 'controls',
  filter: 'filter',
  sort: 'sort',
}));

describe('QuestDecisionFeed', () => {
  const mockOnDecisionClick = vi.fn();
  const mockOnConfigChange = vi.fn();

  const createMockBranchDecision = (
    phaseId: string,
    success: boolean,
    choiceMade: string,
    choiceTime: number = 3.5,
    isHeroic: boolean = false
  ): BranchDecision => ({
    phaseId,
    timestamp: Date.now() - Math.random() * 10000,
    outcome: {
      success,
      description: `Outcome for ${choiceMade}`,
      metadata: {
        choiceMade,
        lastChoiceTime: choiceTime,
        isHeroicMoment: isHeroic,
        questId: phaseId.includes('combat') ? 'combat_quest_1' : 'exploration_quest_1',
      },
    },
  });

  const createMockTelemetry = (): AggregatedTelemetry => ({
    totalQuests: 50,
    successRate: 0.75,
    averageDuration: 120,
    totalBranches: 125,
    averageChoiceTime: 3.5,
    heroicMoments: 8,
    branchDecisions: [
      createMockBranchDecision('combat_phase_1', true, 'Attack', 2.1),
      createMockBranchDecision('combat_phase_2', false, 'Defend', 8.7),
      createMockBranchDecision('exploration_phase_1', true, 'Scout Ahead', 1.5),
      createMockBranchDecision('exploration_phase_2', true, 'Search Carefully', 12.3),
      createMockBranchDecision('combat_phase_3', true, 'Use Special Attack', 4.2, true),
      createMockBranchDecision('exploration_phase_3', false, 'Rush Forward', 0.8),
    ],
    recentQuests: [],
    questTypeBreakdown: {
      'combat': 25,
      'exploration': 25,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders empty state when no decisions available', () => {
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

      render(<QuestDecisionFeed telemetry={emptyTelemetry} />);
      
      expect(screen.getByText(/No decision data available/)).toBeInTheDocument();
    });

    it('renders decision feed with telemetry data', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      expect(screen.getByText('Quest Decision Feed')).toBeInTheDocument();
      expect(screen.getByText('6 decisions')).toBeInTheDocument();
      expect(screen.getByText('125 total branches')).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} compact={true} />);
      
      const container = screen.getByText('Quest Decision Feed').closest('div');
      expect(container).toHaveClass('p-3');
    });

    it('hides analytics when showAnalytics is false', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} showAnalytics={false} />);
      
      expect(screen.queryByText('Decision Analytics')).not.toBeInTheDocument();
    });

    it('hides controls when showControls is false', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} showControls={false} />);
      
      expect(screen.queryByDisplayValue('All')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Timestamp')).not.toBeInTheDocument();
    });
  });

  describe('Decision Items', () => {
    it('renders decision items with correct information', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      // Check for decision choices
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Defend')).toBeInTheDocument();
      expect(screen.getByText('Scout Ahead')).toBeInTheDocument();
      expect(screen.getByText('Search Carefully')).toBeInTheDocument();
      expect(screen.getByText('Use Special Attack')).toBeInTheDocument();
      expect(screen.getByText('Rush Forward')).toBeInTheDocument();
    });

    it('displays success indicators correctly', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      // Check for success/failure indicators
      const decisions = screen.getAllByRole('generic');
      const successfulDecisions = decisions.filter(el => 
        el.textContent?.includes('Attack') || 
        el.textContent?.includes('Scout Ahead') ||
        el.textContent?.includes('Search Carefully') ||
        el.textContent?.includes('Use Special Attack')
      );
      const failedDecisions = decisions.filter(el => 
        el.textContent?.includes('Defend') || 
        el.textContent?.includes('Rush Forward')
      );
      
      expect(successfulDecisions.length).toBe(4);
      expect(failedDecisions.length).toBe(2);
    });

    it('displays phase information', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      expect(screen.getByText('Phase: combat_phase_1')).toBeInTheDocument();
      expect(screen.getByText('Phase: exploration_phase_1')).toBeInTheDocument();
    });

    it('displays choice times when enabled', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} config={{ showChoiceTimes: true }} />);
      
      expect(screen.getByText('Choice time: 2.1s')).toBeInTheDocument();
      expect(screen.getByText('Choice time: 8.7s')).toBeInTheDocument();
    });

    it('highlights heroic decisions', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} config={{ highlightHeroic: true }} />);
      
      expect(screen.getByText('Heroic')).toBeInTheDocument();
    });

    it('shows quick and slow decision badges', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      expect(screen.getByText('Quick')).toBeInTheDocument(); // 0.8s and 1.5s
      expect(screen.getByText('Slow')).toBeInTheDocument(); // 8.7s and 12.3s
    });

    it('handles decision item clicks', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          onDecisionClick={mockOnDecisionClick}
        />
      );
      
      const attackDecision = screen.getByText('Attack').closest('div');
      await user.click(attackDecision!);
      
      expect(mockOnDecisionClick).toHaveBeenCalledWith(
        expect.objectContaining({ phaseId: 'combat_phase_1' }),
        expect.objectContaining({
          isHeroic: false,
          isQuick: true,
          isSlow: false,
          choiceTime: 2.1,
        })
      );
    });
  });

  describe('Analytics Section', () => {
    it('renders analytics dashboard', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} showAnalytics={true} />);
      
      expect(screen.getByText('Decision Analytics')).toBeInTheDocument();
      
      // Key metrics
      expect(screen.getByText('6')).toBeInTheDocument(); // Total Decisions
      expect(screen.getByText('75.0%')).toBeInTheDocument(); // Success Rate
      expect(screen.getByText('3.5s')).toBeInTheDocument(); // Avg Choice Time
      expect(screen.getByText('1')).toBeInTheDocument(); // Heroic Moments (from branch decisions)
    });

    it('displays most common choices', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} showAnalytics={true} />);
      
      expect(screen.getByText('Most Common Choices')).toBeInTheDocument();
      expect(screen.getByText(/Attack/)).toBeInTheDocument();
      expect(screen.getByText(/Scout Ahead/)).toBeInTheDocument();
    });

    it('shows decision speed analysis', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} showAnalytics={true} />);
      
      expect(screen.getByText('Decision Speed Analysis')).toBeInTheDocument();
      expect(screen.getByText('Quick decisions (<2s)')).toBeInTheDocument();
      expect(screen.getByText('Slow decisions (>10s)')).toBeInTheDocument();
    });

    it('calculates metrics correctly', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} showAnalytics={true} />);
      
      // Quick decisions: < 2s (Attack: 2.1s is not quick, but Scout Ahead: 1.5s and Rush Forward: 0.8s)
      expect(screen.getByText('2')).toBeInTheDocument(); // Quick decisions
      // Slow decisions: > 10s (Search Carefully: 12.3s)
      expect(screen.getByText('1')).toBeInTheDocument(); // Slow decisions
    });
  });

  describe('Filtering Functionality', () => {
    it('filters decisions by type', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      const filterSelect = screen.getByDisplayValue('All');
      await user.selectOptions(filterSelect, 'successful');
      
      expect(screen.getByText('Filter: successful')).toBeInTheDocument();
      // Should only show successful decisions
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Scout Ahead')).toBeInTheDocument();
      expect(screen.queryByText('Defend')).not.toBeInTheDocument();
    });

    it('filters quick decisions', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      const filterSelect = screen.getByDisplayValue('All');
      await user.selectOptions(filterSelect, 'quick');
      
      // Should only show quick decisions (< 2s)
      expect(screen.getByText('Scout Ahead')).toBeInTheDocument(); // 1.5s
      expect(screen.getByText('Rush Forward')).toBeInTheDocument(); // 0.8s
      expect(screen.queryByText('Attack')).not.toBeInTheDocument(); // 2.1s
    });

    it('filters slow decisions', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      const filterSelect = screen.getByDisplayValue('All');
      await user.selectOptions(filterSelect, 'slow');
      
      // Should only show slow decisions (> 10s)
      expect(screen.getByText('Search Carefully')).toBeInTheDocument(); // 12.3s
      expect(screen.queryByText('Attack')).not.toBeInTheDocument(); // 2.1s
    });

    it('filters heroic decisions', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      const filterSelect = screen.getByDisplayValue('All');
      await user.selectOptions(filterSelect, 'heroic');
      
      // Should only show heroic decisions
      expect(screen.getByText('Use Special Attack')).toBeInTheDocument();
      expect(screen.queryByText('Attack')).not.toBeInTheDocument();
    });

    it('filters recent decisions', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      const filterSelect = screen.getByDisplayValue('All');
      await user.selectOptions(filterSelect, 'recent');
      
      // Should show only first 10 decisions (we have 6, so all should show)
      expect(screen.getByText('6 decisions')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts decisions by timestamp', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      const sortSelect = screen.getByDisplayValue('Timestamp');
      await user.selectOptions(sortSelect, 'choice-time');
      
      expect(screen.getByText('Sort: choice-time')).toBeInTheDocument();
    });

    it('sorts decisions by choice time', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      const sortSelect = screen.getByDisplayValue('Timestamp');
      await user.selectOptions(sortSelect, 'choice-time');
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'choice-time' })
      );
    });
  });

  describe('Search Functionality', () => {
    it('searches decisions by choice text', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
          config={{ enableSearch: true }}
        />
      );
      
      const searchInput = screen.getByPlaceholderText('Search decisions...');
      await user.type(searchInput, 'Attack');
      
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.queryByText('Defend')).not.toBeInTheDocument();
    });

    it('searches decisions by phase ID', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
          config={{ enableSearch: true }}
        />
      );
      
      const searchInput = screen.getByPlaceholderText('Search decisions...');
      await user.type(searchInput, 'combat');
      
      // Should show combat decisions
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Defend')).toBeInTheDocument();
      expect(screen.queryByText('Scout Ahead')).not.toBeInTheDocument();
    });
  });

  describe('Configuration Options', () => {
    it('toggles timestamp display', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
          onConfigChange={mockOnConfigChange}
        />
      );
      
      const timestampsCheckbox = screen.getByLabelText('Timestamps');
      await user.click(timestampsCheckbox);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ showTimestamps: false })
      );
    });

    it('toggles quest type display', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
          onConfigChange={mockOnConfigChange}
        />
      );
      
      const questTypesCheckbox = screen.getByLabelText('Quest Types');
      await user.click(questTypesCheckbox);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ showQuestTypes: false })
      );
    });

    it('toggles choice time display', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
          onConfigChange={mockOnConfigChange}
        />
      );
      
      const choiceTimesCheckbox = screen.getByLabelText('Choice Times');
      await user.click(choiceTimesCheckbox);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ showChoiceTimes: false })
      );
    });

    it('toggles heroic highlighting', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
          onConfigChange={mockOnConfigChange}
        />
      );
      
      const heroicCheckbox = screen.getByLabelText('Highlight Heroic');
      await user.click(heroicCheckbox);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ highlightHeroic: false })
      );
    });

    it('applies custom configuration', () => {
      const telemetry = createMockTelemetry();
      const customConfig = {
        maxItems: 3,
        showTimestamps: false,
        showQuestTypes: false,
        highlightHeroic: false,
      };
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          config={customConfig}
        />
      );
      
      // Should limit to 3 items
      expect(screen.getAllByText(/Phase:/).length).toBeLessThanOrEqual(3);
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      const mainHeading = screen.getByRole('heading', { name: 'Quest Decision Feed' });
      expect(mainHeading).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestDecisionFeed 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      // Tab to search input
      await user.tab();
      expect(screen.getByPlaceholderText('Search decisions...')).toHaveFocus();
      
      // Tab to filter select
      await user.tab();
      expect(screen.getByDisplayValue('All')).toHaveFocus();
    });

    it('provides semantic HTML structure', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { name: 'Quest Decision Feed' })).toBeInTheDocument();
      
      if (screen.queryByText('Decision Analytics')) {
        expect(screen.getByRole('heading', { name: 'Decision Analytics' })).toBeInTheDocument();
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large decision sets efficiently', () => {
      const largeTelemetry: AggregatedTelemetry = {
        ...createMockTelemetry(),
        branchDecisions: Array.from({ length: 100 }, (_, i) => 
          createMockBranchDecision(`phase_${i}`, i % 2 === 0, `Choice ${i}`)
        ),
      };
      
      const startTime = performance.now();
      render(<QuestDecisionFeed telemetry={largeTelemetry} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (< 200ms for 100 items)
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('handles decisions with missing metadata', () => {
      const telemetryWithMissingMetadata: AggregatedTelemetry = {
        ...createMockTelemetry(),
        branchDecisions: [
          {
            phaseId: 'test_phase',
            timestamp: Date.now(),
            outcome: {
              success: true,
              description: 'Test outcome',
              metadata: {}, // Empty metadata
            },
          },
        ],
      };
      
      render(<QuestDecisionFeed telemetry={telemetryWithMissingMetadata} />);
      
      expect(screen.getByText('Unknown Choice')).toBeInTheDocument();
    });

    it('handles zero choice times gracefully', () => {
      const telemetryWithZeroTimes: AggregatedTelemetry = {
        ...createMockTelemetry(),
        branchDecisions: [
          createMockBranchDecision('test_phase', true, 'Test Choice', 0),
        ],
      };
      
      render(<QuestDecisionFeed telemetry={telemetryWithZeroTimes} />);
      
      expect(screen.getByText('Test Choice')).toBeInTheDocument();
      // Should not show choice time badge
      expect(screen.queryByText(/Choice time:/)).not.toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('applies correct CSS classes for successful decisions', () => {
      const telemetry = createMockTelemetry();
      const { container } = render(<QuestDecisionFeed telemetry={telemetry} />);
      
      const successfulDecision = screen.getByText('Attack').closest('div');
      expect(successfulDecision).toHaveClass('bg-green-900/20');
      expect(successfulDecision).toHaveClass('border-green-700/40');
    });

    it('applies correct CSS classes for failed decisions', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      const failedDecision = screen.getByText('Defend').closest('div');
      expect(failedDecision).toHaveClass('bg-red-900/20');
      expect(failedDecision).toHaveClass('border-red-700/40');
    });

    it('displays live indicator', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      const liveIndicator = screen.getByText('Live');
      expect(liveIndicator).toBeInTheDocument();
      
      const pulseDot = liveIndicator.previousElementSibling;
      expect(pulseDot).toHaveClass('animate-pulse');
    });

    it('shows correct footer information', () => {
      const telemetry = createMockTelemetry();
      render(<QuestDecisionFeed telemetry={telemetry} />);
      
      expect(screen.getByText('125 total branches')).toBeInTheDocument();
      expect(screen.getByText('Filter: all')).toBeInTheDocument();
      expect(screen.getByText('Sort: timestamp')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid telemetry data gracefully', () => {
      const invalidTelemetry = {
        totalQuests: -1,
        successRate: NaN,
        averageDuration: Infinity,
        totalBranches: null,
        averageChoiceTime: undefined,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: [],
        questTypeBreakdown: {},
      } as any;
      
      render(<QuestDecisionFeed telemetry={invalidTelemetry} />);
      
      expect(screen.getByText(/No decision data available/)).toBeInTheDocument();
    });

    it('handles missing callbacks gracefully', () => {
      const telemetry = createMockTelemetry();
      
      expect(() => {
        render(<QuestDecisionFeed telemetry={telemetry} />);
      }).not.toThrow();
    });

    it('handles malformed branch decisions', () => {
      const telemetryWithMalformedDecisions: AggregatedTelemetry = {
        ...createMockTelemetry(),
        branchDecisions: [
          {
            phaseId: 'test_phase',
            timestamp: Date.now(),
            outcome: {
              success: true,
              description: 'Test',
              metadata: null, // null metadata
            },
          } as any,
        ],
      };
      
      render(<QuestDecisionFeed telemetry={telemetryWithMalformedDecisions} />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
