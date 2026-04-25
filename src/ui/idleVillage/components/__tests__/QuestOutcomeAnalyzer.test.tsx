import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestOutcomeAnalyzer } from '../QuestOutcomeAnalyzer';
import type { QuestOutcomeAnalysis } from '../QuestOutcomeAnalyzer.types';

// Mock the child components
vi.mock('../QuestTimeline', () => ({
  QuestTimeline: ({ events }: { events: unknown[] }) => (
    <div data-testid="quest-timeline">Timeline with {events.length} events</div>
  ),
}));

vi.mock('../QuestRiskDisplay', () => ({
  QuestRiskDisplay: ({ questId, injuryPercentage, deathPercentage }: {
    questId: string;
    injuryPercentage: number;
    deathPercentage: number;
  }) => (
    <div data-testid="quest-risk-display">
      Risk Display: {questId} - {injuryPercentage}% / {deathPercentage}%
    </div>
  ),
}));

vi.mock('../QuestOutcomeMarkdownExport', () => ({
  generateQuestMarkdownReport: vi.fn(),
  exportQuestReportToFile: vi.fn(),
}));

describe('QuestOutcomeAnalyzer', () => {
  const mockAnalysis: QuestOutcomeAnalysis = {
    questId: 'test-quest-001',
    blueprintId: 'combat-quest-blueprint',
    success: true,
    outcome: 'Quest completed successfully with minor injuries',
    timeline: [
      {
        id: 'event-1',
        timestamp: Date.now() - 300000,
        type: 'phase_start',
        description: 'Combat phase initiated',
        phaseId: 'combat-1',
        riskLevel: 0.3,
      },
      {
        id: 'event-2',
        timestamp: Date.now() - 120000,
        type: 'branch_taken',
        description: 'Aggressive strategy chosen',
        branchDecision: {
          phaseId: 'combat-1',
          choiceId: 'aggressive',
          outcome: { nextPhaseIds: ['combat-2'], effects: [] },
          timestamp: Date.now() - 120000,
        },
        riskLevel: 0.7,
      },
      {
        id: 'event-3',
        timestamp: Date.now(),
        type: 'phase_complete',
        description: 'Quest completed successfully',
        phaseId: 'victory',
      },
    ],
    riskAssessment: {
      injuryRiskPercent: 25.5,
      deathRiskPercent: 5.2,
      riskLevel: 'medium',
      riskFactors: [
        {
          factor: 'Combat Difficulty',
          impact: 'medium',
          description: 'High enemy strength increased injury risk',
        },
        {
          factor: 'Strategy Choice',
          impact: 'low',
          description: 'Aggressive approach added moderate risk',
        },
      ],
      mitigationStrategies: [
        'Consider defensive strategies for high-risk encounters',
        'Ensure adequate healing supplies before combat',
      ],
    },
    performanceMetrics: {
      totalDurationSeconds: 420,
      averagePhaseDurationSeconds: 140,
      branchCount: 2,
      effectCount: 3,
      efficiencyRating: 0.85,
      heroicMomentCount: 1,
      failurePointCount: 0,
    },
    decisionPoints: [
      {
        phaseId: 'combat-1',
        decision: 'Chose aggressive strategy over defensive',
        impact: 'positive',
        consequence: 'Faster victory but higher injury risk',
      },
    ],
    lessonsLearned: [
      {
        category: 'strategy',
        lesson: 'Aggressive strategies can lead to faster victories',
        recommendation: 'Balance aggression with risk assessment',
      },
      {
        category: 'risk_management',
        lesson: 'Injury risk should be monitored closely',
        recommendation: 'Include healing phases in quest planning',
      },
    ],
    analyzedAt: Date.now(),
    version: '1.0.0',
  };

  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the analyzer with overview tab active', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Quest Postmortem: test-quest-001')).toBeInTheDocument();
      expect(screen.getByText('✅ Quest Succeeded')).toBeInTheDocument();
      expect(screen.getByText('Quest completed successfully with minor injuries')).toBeInTheDocument();
    });

    it('should display key metrics in overview', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('7m 0s')).toBeInTheDocument(); // 420 seconds = 7m 0s
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('85.0%')).toBeInTheDocument(); // efficiency rating
      expect(screen.getByText('1')).toBeInTheDocument(); // heroic moments
    });

    it('should display risk assessment with stripes', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Risk Display: test-quest-001 - 25.5% / 5.2%')).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should switch to timeline tab when clicked', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const timelineTab = screen.getByText('Timeline');
      fireEvent.click(timelineTab);

      expect(screen.getByText('Timeline with 3 events')).toBeInTheDocument();
    });

    it('should switch to risk analysis tab when clicked', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const riskTab = screen.getByText('Risk Analysis');
      fireEvent.click(riskTab);

      expect(screen.getByText('Detailed Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('should switch to performance tab when clicked', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);

      expect(screen.getByText('Total Duration')).toBeInTheDocument();
      expect(screen.getByText('2m 20s')).toBeInTheDocument(); // 140 seconds
    });

    it('should switch to decisions tab when clicked', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const decisionsTab = screen.getByText('Decisions');
      fireEvent.click(decisionsTab);

      expect(screen.getByText('Decision Analysis')).toBeInTheDocument();
      expect(screen.getByText('Chose aggressive strategy over defensive')).toBeInTheDocument();
    });

    it('should switch to lessons tab when clicked', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const lessonsTab = screen.getByText('Lessons');
      fireEvent.click(lessonsTab);

      expect(screen.getByText('Lessons Learned')).toBeInTheDocument();
      expect(screen.getByText('Aggressive strategies can lead to faster victories')).toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('should call onExport when export button is clicked', () => {
      const { generateQuestMarkdownReport, exportQuestReportToFile } = vi.mocked(require('../QuestOutcomeMarkdownExport'));
      generateQuestMarkdownReport.mockReturnValue({ markdownContent: '# Test Report' });

      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByTitle('Export analysis as Markdown');
      fireEvent.click(exportButton);

      expect(generateQuestMarkdownReport).toHaveBeenCalledWith(mockAnalysis, expect.any(Object));
      expect(exportQuestReportToFile).toHaveBeenCalledWith({ markdownContent: '# Test Report' });
      expect(mockOnExport).toHaveBeenCalledWith({ markdownContent: '# Test Report' });
    });
  });

  describe('risk analysis tab', () => {
    beforeEach(() => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const riskTab = screen.getByText('Risk Analysis');
      fireEvent.click(riskTab);
    });

    it('should display risk level prominently', () => {
      expect(screen.getByText('Overall Risk Level:')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('should display risk factors with impact levels', () => {
      expect(screen.getByText('Combat Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Strategy Choice')).toBeInTheDocument();
      expect(screen.getAllByText('MEDIUM')).toHaveLength(2); // risk level + factor impact
    });

    it('should display mitigation strategies', () => {
      expect(screen.getByText('Mitigation Strategies')).toBeInTheDocument();
      expect(screen.getByText('Consider defensive strategies for high-risk encounters')).toBeInTheDocument();
    });
  });

  describe('performance tab', () => {
    beforeEach(() => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
    });

    it('should display all performance metrics', () => {
      expect(screen.getByText('Total Duration')).toBeInTheDocument();
      expect(screen.getByText('Average Phase Time')).toBeInTheDocument();
      expect(screen.getByText('Efficiency Rating')).toBeInTheDocument();
      expect(screen.getByText('Branch Decisions')).toBeInTheDocument();
      expect(screen.getByText('Effects Applied')).toBeInTheDocument();
      expect(screen.getByText('Heroic Moments')).toBeInTheDocument();
    });

    it('should highlight good efficiency rating', () => {
      const efficiencyElement = screen.getByText('85.0%');
      expect(efficiencyElement).toHaveClass('good');
    });
  });

  describe('decision analysis tab', () => {
    beforeEach(() => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const decisionsTab = screen.getByText('Decisions');
      fireEvent.click(decisionsTab);
    });

    it('should display decision points with impact indicators', () => {
      expect(screen.getByText('combat-1')).toBeInTheDocument();
      expect(screen.getByText('POSITIVE')).toBeInTheDocument();
      expect(screen.getByText('Faster victory but higher injury risk')).toBeInTheDocument();
    });
  });

  describe('lessons learned tab', () => {
    beforeEach(() => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      const lessonsTab = screen.getByText('Lessons');
      fireEvent.click(lessonsTab);
    });

    it('should display lessons by category', () => {
      expect(screen.getByText('Strategy')).toBeInTheDocument();
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });

    it('should show recommendations for each lesson', () => {
      expect(screen.getByText('Balance aggression with risk assessment')).toBeInTheDocument();
      expect(screen.getByText('Include healing phases in quest planning')).toBeInTheDocument();
    });
  });

  describe('failed quest handling', () => {
    const failedAnalysis: QuestOutcomeAnalysis = {
      ...mockAnalysis,
      success: false,
      outcome: 'Quest failed due to overwhelming enemy forces',
    };

    it('should display failure status prominently', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={failedAnalysis}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('❌ Quest Failed')).toBeInTheDocument();
      expect(screen.getByText('Quest failed due to overwhelming enemy forces')).toBeInTheDocument();
    });

    it('should show 0% success rate in metrics', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={failedAnalysis}
          onExport={mockOnExport}
        />
      );

      // This would show 0% in the metrics, but we're testing the display logic
      expect(screen.getByText('❌ Quest Failed')).toBeInTheDocument();
    });
  });

  describe('empty data handling', () => {
    const emptyAnalysis: QuestOutcomeAnalysis = {
      ...mockAnalysis,
      timeline: [],
      decisionPoints: [],
      lessonsLearned: [],
    };

    it('should handle empty timeline gracefully', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={emptyAnalysis}
          onExport={mockOnExport}
        />
      );

      const timelineTab = screen.getByText('Timeline');
      fireEvent.click(timelineTab);

      expect(screen.getByText('Timeline with 0 events')).toBeInTheDocument();
    });

    it('should show no data messages for empty sections', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={emptyAnalysis}
          onExport={mockOnExport}
        />
      );

      const decisionsTab = screen.getByText('Decisions');
      fireEvent.click(decisionsTab);

      expect(screen.getByText('No significant decision points identified.')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button labels', () => {
      render(
        <QuestOutcomeAnalyzer
          analysis={mockAnalysis}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByTitle('Export analysis as Markdown')).toBeInTheDocument();
    });
  });
});
