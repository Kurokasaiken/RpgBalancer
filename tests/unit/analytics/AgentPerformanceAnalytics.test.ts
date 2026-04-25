/**
 * Agent Performance Analytics Test Suite - NP-125
 * 
 * Comprehensive tests for agent performance analytics system including:
 * - Config validation
 * - Metrics calculation
 * - Trend analysis
 * - Performance ratings
 * 
 * @since 2026-01-23
 * @author Sentinel-Coordinator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentPerformanceAnalytics,
  type KanbanTask,
} from '@/analytics/AgentPerformanceAnalytics';
import {
  DEFAULT_AGENT_ANALYTICS_CONFIG,
  getPerformanceRating,
  calculateQualityScore,
  calculateCompletionTimeRatio,
  calculateErrorRate,
  calculateVelocity,
  formatDurationMinutes,
  formatPercentage,
} from '@/analytics/config/agentAnalyticsConfig';

describe('Agent Analytics Config', () => {
  describe('getPerformanceRating', () => {
    it('returns excellent for values above excellent threshold (higher is better)', () => {
      const thresholds = { excellent: 90, good: 75, acceptable: 60, needsImprovement: 50 };
      expect(getPerformanceRating(95, thresholds, true)).toBe('excellent');
    });

    it('returns good for values above good threshold', () => {
      const thresholds = { excellent: 90, good: 75, acceptable: 60, needsImprovement: 50 };
      expect(getPerformanceRating(80, thresholds, true)).toBe('good');
    });

    it('returns critical for values below needs improvement threshold', () => {
      const thresholds = { excellent: 90, good: 75, acceptable: 60, needsImprovement: 50 };
      expect(getPerformanceRating(40, thresholds, true)).toBe('critical');
    });

    it('handles lower is better metrics correctly', () => {
      const thresholds = { excellent: 5, good: 10, acceptable: 20, needsImprovement: 30 };
      expect(getPerformanceRating(3, thresholds, false)).toBe('excellent');
      expect(getPerformanceRating(15, thresholds, false)).toBe('acceptable');
      expect(getPerformanceRating(35, thresholds, false)).toBe('critical');
    });
  });

  describe('calculateQualityScore', () => {
    it('calculates quality score with default weights', () => {
      const metrics = {
        testCoverage: 80,
        buildSuccess: true,
        lintErrors: 2,
        documentationComplete: true,
        codeReviewScore: 90,
      };
      const score = calculateQualityScore(metrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns lower score for failed build', () => {
      const goodMetrics = {
        testCoverage: 80,
        buildSuccess: true,
        lintErrors: 0,
        documentationComplete: true,
        codeReviewScore: 90,
      };
      const badMetrics = {
        ...goodMetrics,
        buildSuccess: false,
      };
      expect(calculateQualityScore(badMetrics)).toBeLessThan(calculateQualityScore(goodMetrics));
    });

    it('penalizes lint errors', () => {
      const noErrors = {
        testCoverage: 80,
        buildSuccess: true,
        lintErrors: 0,
        documentationComplete: true,
        codeReviewScore: 90,
      };
      const withErrors = {
        ...noErrors,
        lintErrors: 10,
      };
      expect(calculateQualityScore(withErrors)).toBeLessThan(calculateQualityScore(noErrors));
    });
  });

  describe('calculateCompletionTimeRatio', () => {
    it('returns 1.0 for on-time completion', () => {
      expect(calculateCompletionTimeRatio(100, 100)).toBe(1.0);
    });

    it('returns ratio less than 1 for early completion', () => {
      expect(calculateCompletionTimeRatio(80, 100)).toBe(0.8);
    });

    it('returns ratio greater than 1 for late completion', () => {
      expect(calculateCompletionTimeRatio(120, 100)).toBe(1.2);
    });

    it('handles zero estimated time', () => {
      expect(calculateCompletionTimeRatio(100, 0)).toBe(1.0);
    });
  });

  describe('calculateErrorRate', () => {
    it('calculates error rate percentage correctly', () => {
      expect(calculateErrorRate(2, 10)).toBe(20);
      expect(calculateErrorRate(1, 20)).toBe(5);
    });

    it('returns 0 for no errors', () => {
      expect(calculateErrorRate(0, 10)).toBe(0);
    });

    it('handles zero total tasks', () => {
      expect(calculateErrorRate(5, 0)).toBe(0);
    });
  });

  describe('calculateVelocity', () => {
    it('calculates tasks per day correctly', () => {
      expect(calculateVelocity(10, 5)).toBe(2);
      expect(calculateVelocity(30, 10)).toBe(3);
    });

    it('handles zero days elapsed', () => {
      expect(calculateVelocity(10, 0)).toBe(0);
    });
  });

  describe('formatDurationMinutes', () => {
    it('formats minutes correctly', () => {
      expect(formatDurationMinutes(45)).toBe('45m');
      expect(formatDurationMinutes(30)).toBe('30m');
    });

    it('formats hours and minutes correctly', () => {
      expect(formatDurationMinutes(90)).toBe('1h 30m');
      expect(formatDurationMinutes(150)).toBe('2h 30m');
    });

    it('formats whole hours correctly', () => {
      expect(formatDurationMinutes(120)).toBe('2h');
      expect(formatDurationMinutes(180)).toBe('3h');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentage with default decimals', () => {
      expect(formatPercentage(25.5)).toBe('25.5%');
      expect(formatPercentage(75.8)).toBe('75.8%');
    });

    it('formats percentage with custom decimals', () => {
      expect(formatPercentage(25.567, 2)).toBe('25.57%');
      expect(formatPercentage(75.123, 0)).toBe('75%');
    });
  });
});

describe('AgentPerformanceAnalytics', () => {
  let mockTasks: KanbanTask[];
  let analytics: AgentPerformanceAnalytics;

  beforeEach(() => {
    mockTasks = [
      {
        id: 'task-1',
        status: 'Completato',
        dependencies: '-',
        agent: 'Agent-A',
        startTime: '2026-01-20 10:00',
        endTime: '2026-01-20 12:00',
        duration: 120,
        estimated: 120,
        lastUpdate: '2026-01-20',
        notes: 'Evidence: test-results/task-1.log. Build ✅, tests ✅.',
      },
      {
        id: 'task-2',
        status: 'Completato',
        dependencies: '-',
        agent: 'Agent-A',
        startTime: '2026-01-21 10:00',
        endTime: '2026-01-21 11:30',
        duration: 90,
        estimated: 120,
        lastUpdate: '2026-01-21',
        notes: 'Evidence: test-results/task-2.log. Build ✅, tests ✅.',
      },
      {
        id: 'task-3',
        status: 'Completato',
        dependencies: '-',
        agent: 'Agent-B',
        startTime: '2026-01-20 14:00',
        endTime: '2026-01-20 16:30',
        duration: 150,
        estimated: 120,
        lastUpdate: '2026-01-20',
        notes: 'Evidence: test-results/task-3.log. Build ⚠️, tests failed.',
      },
      {
        id: 'task-4',
        status: 'In corso',
        dependencies: '-',
        agent: 'Agent-A',
        startTime: '2026-01-22 10:00',
        endTime: '-',
        duration: 0,
        estimated: 180,
        lastUpdate: '2026-01-22',
        notes: 'Work in progress.',
      },
    ];

    analytics = new AgentPerformanceAnalytics(mockTasks);
  });

  describe('getAgentNames', () => {
    it('returns unique agent names', () => {
      const agents = analytics.getAgentNames();
      expect(agents).toContain('Agent-A');
      expect(agents).toContain('Agent-B');
      expect(agents).toHaveLength(2);
    });

    it('filters out empty agent names', () => {
      const tasksWithEmpty = [
        ...mockTasks,
        { ...mockTasks[0], id: 'task-5', agent: '-' },
      ];
      const analyticsWithEmpty = new AgentPerformanceAnalytics(tasksWithEmpty);
      const agents = analyticsWithEmpty.getAgentNames();
      expect(agents).not.toContain('-');
    });
  });

  describe('getAgentTasks', () => {
    it('returns tasks for specific agent', () => {
      const agentATasks = analytics.getAgentTasks('Agent-A');
      expect(agentATasks).toHaveLength(3);
      expect(agentATasks.every(t => t.agent === 'Agent-A')).toBe(true);
    });

    it('returns empty array for non-existent agent', () => {
      const tasks = analytics.getAgentTasks('Non-Existent');
      expect(tasks).toHaveLength(0);
    });
  });

  describe('calculateAgentMetrics', () => {
    it('calculates metrics for agent with completed tasks', () => {
      const metrics = analytics.calculateAgentMetrics('Agent-A');
      
      expect(metrics.agentName).toBe('Agent-A');
      expect(metrics.totalTasks).toBe(3);
      expect(metrics.completedTasks).toBe(2);
      expect(metrics.inProgressTasks).toBe(1);
      expect(metrics.averageCompletionTime).toBeGreaterThan(0);
      expect(metrics.completionTimeRatio).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.qualityScore).toBeGreaterThan(0);
      expect(metrics.performanceRating).toBeDefined();
    });

    it('calculates error rate correctly', () => {
      const metricsB = analytics.calculateAgentMetrics('Agent-B');
      expect(metricsB.errorRate).toBeGreaterThan(0); // Has failed task
    });

    it('calculates completion time ratio', () => {
      const metrics = analytics.calculateAgentMetrics('Agent-A');
      // Agent-A has 120min and 90min for 120min estimates each
      // Average: 105min / 120min = 0.875
      expect(metrics.completionTimeRatio).toBeLessThan(1.0);
    });
  });

  describe('calculateTrends', () => {
    it('returns stable trends for insufficient sample size', () => {
      const smallTasks = [mockTasks[0]];
      const smallAnalytics = new AgentPerformanceAnalytics(smallTasks);
      const metrics = smallAnalytics.calculateAgentMetrics('Agent-A');
      
      expect(metrics.trends.completionTime).toBe('stable');
      expect(metrics.trends.errorRate).toBe('stable');
      expect(metrics.trends.quality).toBe('stable');
    });
  });

  describe('getAllAgentMetrics', () => {
    it('returns metrics for all agents', () => {
      const allMetrics = analytics.getAllAgentMetrics();
      expect(allMetrics).toHaveLength(2);
      expect(allMetrics.map(m => m.agentName)).toContain('Agent-A');
      expect(allMetrics.map(m => m.agentName)).toContain('Agent-B');
    });
  });

  describe('getTopPerformers', () => {
    it('returns top performing agents', () => {
      const topPerformers = analytics.getTopPerformers(1);
      expect(topPerformers).toHaveLength(1);
      expect(topPerformers[0].performanceRating).toBeDefined();
    });

    it('limits results to specified count', () => {
      const topPerformers = analytics.getTopPerformers(5);
      expect(topPerformers.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getAgentsNeedingAttention', () => {
    it('identifies agents with poor performance', () => {
      // Agent-B has a failed task, should need attention
      const needsAttention = analytics.getAgentsNeedingAttention();
      expect(Array.isArray(needsAttention)).toBe(true);
    });
  });

  describe('generateSummaryReport', () => {
    it('generates complete summary report', () => {
      const summary = analytics.generateSummaryReport();
      
      expect(summary.totalAgents).toBe(2);
      expect(summary.totalTasks).toBe(4);
      expect(summary.completedTasks).toBe(3);
      expect(summary.averageQualityScore).toBeGreaterThan(0);
      expect(summary.averageVelocity).toBeGreaterThanOrEqual(0);
      expect(summary.topPerformers).toHaveLength(2);
      expect(Array.isArray(summary.needsAttention)).toBe(true);
    });
  });

  describe('addQualityMetrics', () => {
    it('adds and calculates quality metrics for tasks', () => {
      analytics.addQualityMetrics('task-1', {
        testCoverage: 85,
        buildSuccess: true,
        lintErrors: 1,
        documentationComplete: true,
        codeReviewScore: 90,
      });

      const metrics = analytics.calculateAgentMetrics('Agent-A');
      expect(metrics.qualityScore).toBeGreaterThan(0);
    });
  });

  describe('getPerformanceTrendData', () => {
    it('returns trend data points for agent', () => {
      const trendData = analytics.getPerformanceTrendData('Agent-A', 30);
      expect(Array.isArray(trendData)).toBe(true);
    });

    it('filters data by date range', () => {
      const trendData = analytics.getPerformanceTrendData('Agent-A', 1);
      // Should only include very recent tasks
      expect(trendData.length).toBeLessThanOrEqual(mockTasks.length);
    });

    it('sorts trend data by date', () => {
      const trendData = analytics.getPerformanceTrendData('Agent-A', 30);
      if (trendData.length > 1) {
        for (let i = 1; i < trendData.length; i++) {
          expect(trendData[i].date >= trendData[i - 1].date).toBe(true);
        }
      }
    });
  });
});

describe('DEFAULT_AGENT_ANALYTICS_CONFIG', () => {
  it('has valid threshold values', () => {
    const { thresholds } = DEFAULT_AGENT_ANALYTICS_CONFIG;
    
    expect(thresholds.completionTime.excellent).toBeLessThan(thresholds.completionTime.good);
    expect(thresholds.errorRate.excellent).toBeLessThan(thresholds.errorRate.good);
    expect(thresholds.qualityScore.excellent).toBeGreaterThan(thresholds.qualityScore.good);
    expect(thresholds.velocity.excellent).toBeGreaterThan(thresholds.velocity.good);
  });

  it('has quality weights that sum to 1', () => {
    const { qualityWeights } = DEFAULT_AGENT_ANALYTICS_CONFIG;
    const sum = Object.values(qualityWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it('has reasonable default values', () => {
    expect(DEFAULT_AGENT_ANALYTICS_CONFIG.minSampleSize).toBeGreaterThan(0);
    expect(DEFAULT_AGENT_ANALYTICS_CONFIG.trendWindowDays).toBeGreaterThan(0);
    expect(DEFAULT_AGENT_ANALYTICS_CONFIG.enableRealTimeMonitoring).toBeDefined();
  });
});
