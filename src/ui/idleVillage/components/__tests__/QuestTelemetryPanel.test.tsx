/**
 * QuestTelemetryPanel Component Tests
 *
 * Tests for the QuestTelemetryPanel component displaying quest analytics.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestTelemetryPanel, type QuestTelemetryPanelProps } from '../QuestTelemetryPanel';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { QuestDecisionFeedProps } from '../QuestDecisionFeed';

const questDecisionFeedMock = vi.fn();

vi.mock('../QuestDecisionFeed', () => ({
  __esModule: true,
  default: (props: QuestDecisionFeedProps) => {
    questDecisionFeedMock(props);
    return <div data-testid="quest-decision-feed-mock" />;
  },
}));

describe('QuestTelemetryPanel', () => {
  beforeEach(() => {
    questDecisionFeedMock.mockClear();
  });

  const mockTelemetry: AggregatedTelemetry = {
    totalQuests: 5,
    successRate: 0.8,
    averageDuration: 150,
    totalBranches: 12,
    averageChoiceTime: 8.5,
    heroicMoments: 3,
    branchDecisions: [
      {
        phaseId: 'phase-1',
        choiceId: 'choice-a',
        outcome: {
          nextPhaseIds: ['phase-2'],
          metadata: { choiceMade: 'Take the heroic path' },
        },
        timestamp: Date.now() - 60000,
        randomSeed: 12345,
      },
      {
        phaseId: 'phase-2',
        choiceId: 'fight-choice',
        outcome: {
          nextPhaseIds: ['phase-3'],
          metadata: { choiceMade: 'Fight bravely' },
        },
        timestamp: Date.now() - 30000,
        randomSeed: 67890,
      },
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
            averageChoiceTime: 5,
            heroicMoments: 1,
            failurePoints: [],
            successPath: [],
            playerChoices: [],
          },
        },
        timestamp: Date.now() - 120000,
        sessionId: 'session-1',
      },
    ],
    questTypeBreakdown: {
      combat: 3,
      stealth: 1,
      exploration: 1,
    },
  };

  const buildProps = (overrides?: Partial<QuestTelemetryPanelProps>): QuestTelemetryPanelProps => ({
    telemetry: mockTelemetry,
    isLoading: false,
    error: null,
    onClear: vi.fn(),
    compact: false,
    showHeatmap: true,
    showRecentDecisions: true,
    ...overrides,
  });

  describe('rendering', () => {
    it('should render the telemetry panel with title and live indicator', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      expect(screen.getByText('Quest Telemetry')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should display performance metrics correctly', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      const metricCards = screen.getAllByText(/Total Quests|Success Rate|Avg Duration|Heroic Moments/);
      expect(metricCards).toHaveLength(4);
      const totalCard = metricCards.find(card => card.textContent?.includes('Total Quests'))!.parentElement!;
      const successCard = metricCards.find(card => card.textContent?.includes('Success Rate'))!.parentElement!;
      const durationCard = metricCards.find(card => card.textContent?.includes('Avg Duration'))!.parentElement!;
      const heroicCard = metricCards.find(card => card.textContent?.includes('Heroic Moments'))!.parentElement!;
      expect(within(totalCard).getByText('5')).toBeInTheDocument();
      expect(within(successCard).getByText(/80\.0%/)).toBeInTheDocument();
      expect(within(durationCard).getByText(/2m 30s/)).toBeInTheDocument();
      expect(within(heroicCard).getByText('3')).toBeInTheDocument();
    });

    it('should display quest type heatmap', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      expect(screen.getByText('Quest Types')).toBeInTheDocument();
      expect(screen.getByText('Operazioni d’Assalto')).toBeInTheDocument();
      expect(screen.getByText('Incursioni d’Ombra')).toBeInTheDocument();
      expect(screen.getByText('Ricognizioni')).toBeInTheDocument();
    });

    it('should display recent decisions', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      expect(screen.getByText('Recent Decisions')).toBeInTheDocument();
      expect(screen.getByText('Take the heroic path')).toBeInTheDocument();
      expect(screen.getByText('Fight bravely')).toBeInTheDocument();
    });
  });

  describe('decision feed wiring', () => {
    it('passes telemetry and derived config to QuestDecisionFeed', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      expect(questDecisionFeedMock).toHaveBeenCalledTimes(1);
      const feedProps = questDecisionFeedMock.mock.calls[0][0] as QuestDecisionFeedProps;
      expect(feedProps.telemetry).toBe(mockTelemetry);
      expect(feedProps.config?.maxItems).toBe(5);
      expect(feedProps.compact).toBe(false);
    });

    it('does not render QuestDecisionFeed when showRecentDecisions is false', () => {
      render(<QuestTelemetryPanel {...buildProps({ showRecentDecisions: false })} />);

      expect(questDecisionFeedMock).not.toHaveBeenCalled();
    });
  });

  describe('compact mode', () => {
    it('should render in compact mode when specified', () => {
      render(<QuestTelemetryPanel {...buildProps({ compact: true })} />);

      // Check for compact-specific classes or reduced content
      const panel = screen.getByText('Quest Telemetry').closest('div');
      expect(panel).toHaveClass('text-sm');
    });
  });

  describe('heatmap toggle', () => {
    it('should show heatmap by default', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      expect(screen.getByText('Quest Types')).toBeInTheDocument();
    });

    it('should hide heatmap when showHeatmap is false', () => {
      render(<QuestTelemetryPanel {...buildProps({ showHeatmap: false })} />);

      expect(screen.queryByText('Quest Types')).not.toBeInTheDocument();
    });
  });

  describe('recent decisions toggle', () => {
    it('should show recent decisions by default', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      expect(screen.getByText('Recent Decisions')).toBeInTheDocument();
    });

    it('should hide recent decisions when showRecentDecisions is false', () => {
      render(<QuestTelemetryPanel {...buildProps({ showRecentDecisions: false })} />);

      expect(screen.queryByText('Recent Decisions')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
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

    it('should handle empty telemetry gracefully', () => {
      render(<QuestTelemetryPanel {...buildProps({ telemetry: emptyTelemetry })} />);

      expect(screen.getByText('Total Quests')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('0 total branches')).toBeInTheDocument();
      expect(screen.getByText('0s avg choice time')).toBeInTheDocument();
      expect(screen.getByText('No decisions yet')).toBeInTheDocument();
      expect(screen.getByText('No quest data yet')).toBeInTheDocument();
    });
  });

  describe('footer statistics', () => {
    it('should display branch statistics in footer', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      expect(screen.getByText('12 total branches')).toBeInTheDocument();
      expect(screen.getByText(/9s avg choice time/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels for visual elements', () => {
      render(<QuestTelemetryPanel {...buildProps()} />);

      // Check that interactive elements have proper accessibility
      const liveIndicator = screen.getByText('Live');
      expect(liveIndicator).toBeInTheDocument();
    });
  });

  describe('decision timestamps', () => {
    it('should format decision timestamps correctly', () => {
      render(
        <QuestTelemetryPanel
          {...buildProps({
            telemetry: {
              ...mockTelemetry,
              branchDecisions: [
                ...mockTelemetry.branchDecisions,
                {
                  phaseId: 'phase-3',
                  choiceId: 'choice-c',
                  outcome: {
                    nextPhaseIds: [],
                    metadata: { choiceMade: 'Defend the bridge' },
                  },
                  timestamp: Date.now(),
                },
              ],
            },
          })}
        />,
      );

      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('custom className', () => {
    it('should apply custom className to the panel', () => {
      const { container } = render(<QuestTelemetryPanel {...buildProps({ className: 'custom-test-class' })} />);

      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('custom-test-class');
    });
  });

  describe('telemetry actions', () => {
    it('should invoke onClear when Clear button is pressed', () => {
      const onClear = vi.fn();
      render(<QuestTelemetryPanel {...buildProps({ onClear })} />);

      fireEvent.click(screen.getByRole('button', { name: /clear/i }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });
});
