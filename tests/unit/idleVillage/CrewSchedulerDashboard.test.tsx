import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CrewSchedulerDashboard from '@/ui/idleVillage/components/CrewSchedulerDashboard';
import { useCrewSchedulerAnalytics } from '@/ui/idleVillage/hooks/useCrewSchedulerAnalytics';
import type { CrewSchedulerAnalyticsConfig } from '@/ui/idleVillage/utils/crewSchedulerAnalyticsConfig';

// Mock the analytics hook
vi.mock('@/ui/idleVillage/hooks/useCrewSchedulerAnalytics');

const mockUseCrewSchedulerAnalytics = vi.mocked(useCrewSchedulerAnalytics);

describe('CrewSchedulerDashboard', () => {
  const mockMetrics = {
    queue: {
      total: 5,
      avgPriority: 1.2,
      maxSize: 10,
      avgFatigue: 0.3,
      avgStatMatch: 0.8,
      byActivity: {
        quest: 2,
        job: 2,
        maintenance: 1,
      },
    },
    throughput: {
      assigned: 3,
      rejected: 2,
      decisionsPerMinute: 2.5,
    },
    dropFeedback: {
      total: 4,
      invalid: 1,
      warning: 1,
      blocked: 1,
      failureRate: 0.5,
    },
  };

  const mockStatuses = {
    queue: 'warning' as const,
    fatigue: 'ok' as const,
    dropFailure: 'warning' as const,
    throughput: 'ok' as const,
  };

  const mockHistory = [
    {
      timestamp: Date.now() - 5000,
      type: 'queue_snapshot' as const,
      queueStats: mockMetrics.queue,
      avgFatigue: mockMetrics.queue.avgFatigue,
      avgStatMatch: mockMetrics.queue.avgStatMatch,
    },
    {
      timestamp: Date.now() - 3000,
      type: 'decision' as const,
      decision: {
        assigned: true,
        residentId: 'resident-1',
        activityId: 'quest-1',
        priorityScore: 1.5,
        reason: 'High priority',
      },
    },
    {
      timestamp: Date.now() - 1000,
      type: 'drop_feedback' as const,
      feedbackType: 'invalid',
    },
  ];

  const mockConfig: CrewSchedulerAnalyticsConfig = {
    palette: {
      healthy: '#22c55e',
      warning: '#eab308',
      critical: '#ef4444',
    },
    thresholds: {
      queueWarning: 3,
      queueCritical: 8,
      fatigueWarning: 0.4,
      fatigueCritical: 0.7,
      dropFailWarning: 0.3,
      dropFailCritical: 0.6,
      throughputTarget: 2.0,
    },
    layout: {
      maxHistoryPoints: 50,
      refreshIntervalMs: 1000,
      enableAsciiChrome: true,
      enableSparklines: true,
      showActivityBreakdown: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCrewSchedulerAnalytics.mockReturnValue({
      config: mockConfig,
      metrics: mockMetrics,
      statuses: mockStatuses,
      history: mockHistory,
    });
  });

  it('should render dashboard with header and metrics', () => {
    render(<CrewSchedulerDashboard />);

    expect(screen.getByText('Crew Scheduler Analytics')).toBeInTheDocument();
    expect(screen.getByText('Queue Status')).toBeInTheDocument();
    expect(screen.getByText('Avg Fatigue')).toBeInTheDocument();
    expect(screen.getByText('Throughput')).toBeInTheDocument();
    expect(screen.getByText('Drop Failures')).toBeInTheDocument();
  });

  it('should display correct metric values', () => {
    render(<CrewSchedulerDashboard />);

    // Queue status should show total count
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Avg fatigue should show percentage
    expect(screen.getByText('30%')).toBeInTheDocument();
    
    // Throughput should show assigned count and decisions per minute
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2.5/min')).toBeInTheDocument();
    
    // Drop failures should show percentage and total attempts
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('4 attempts')).toBeInTheDocument();
  });

  it('should show queue breakdown by activity', () => {
    render(<CrewSchedulerDashboard />);

    expect(screen.getByText('Queue Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Quest')).toBeInTheDocument();
    expect(screen.getByText('Job')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    
    // Check activity counts
    expect(screen.getByText('2')).toBeInTheDocument(); // Quest count
    expect(screen.getByText('2')).toBeInTheDocument(); // Job count  
    expect(screen.getByText('1')).toBeInTheDocument(); // Maintenance count
  });

  it('should display recent events timeline', () => {
    render(<CrewSchedulerDashboard />);

    expect(screen.getByText('Recent Events')).toBeInTheDocument();
    expect(screen.getByText('queue_snapshot')).toBeInTheDocument();
    expect(screen.getByText('decision')).toBeInTheDocument();
    expect(screen.getByText('drop_feedback')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });

  it('should handle metric click events', () => {
    const onMetricClick = vi.fn();
    render(<CrewSchedulerDashboard onMetricClick={onMetricClick} />);

    // Click on queue status metric
    const queueMetric = screen.getByText('Queue Status').closest('div');
    fireEvent.click(queueMetric!);

    expect(onMetricClick).toHaveBeenCalledWith('queue', 5);
  });

  it('should respect maxHistoryEvents prop', () => {
    render(<CrewSchedulerDashboard maxHistoryEvents={2} />);

    // Should only show 2 most recent events
    const events = screen.getAllByText(/decision|drop_feedback/);
    expect(events).toHaveLength(2);
  });

  it('should use config overrides when provided', () => {
    const customConfig: Partial<CrewSchedulerAnalyticsConfig> = {
      thresholds: {
        queueWarning: 2,
        queueCritical: 5,
        fatigueWarning: 0.2,
        fatigueCritical: 0.5,
        dropFailWarning: 0.1,
        dropFailCritical: 0.3,
        throughputTarget: 1.5,
      },
    };

    render(<CrewSchedulerDashboard config={customConfig} />);

    // The hook should be called with the config override
    expect(mockUseCrewSchedulerAnalytics).toHaveBeenCalledWith({
      config: customConfig,
      enableHistory: true,
      resetHistoryOnMount: false,
    });
  });

  it('should show empty state when no history events', () => {
    mockUseCrewSchedulerAnalytics.mockReturnValue({
      config: mockConfig,
      metrics: mockMetrics,
      statuses: mockStatuses,
      history: [],
    });

    render(<CrewSchedulerDashboard />);

    expect(screen.getByText('No recent events')).toBeInTheDocument();
  });

  it('should display performance indicators', () => {
    render(<CrewSchedulerDashboard />);

    expect(screen.getByText('Real-time: ENABLED')).toBeInTheDocument();
    expect(screen.getByText('History Events: 3')).toBeInTheDocument();
    expect(screen.getByText('Refresh Rate: 1000ms')).toBeInTheDocument();
  });

  it('should handle disabled real-time updates', () => {
    render(<CrewSchedulerDashboard enableRealTime={false} />);

    expect(screen.getByText('Real-time: DISABLED')).toBeInTheDocument();
  });

  it('should format timestamps correctly', () => {
    render(<CrewSchedulerDashboard />);

    // Check that timestamps are formatted (should contain time format)
    const timestamps = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('should show progress bars for metrics', () => {
    render(<CrewSchedulerDashboard />);

    // Should contain progress bar characters
    const progressBars = screen.getAllByText(/[█░]/);
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should display status indicators with correct colors', () => {
    render(<CrewSchedulerDashboard />);

    // Should contain status indicator characters
    const indicators = screen.getAllByText(/[●◐◉○]/);
    expect(indicators.length).toBeGreaterThan(0);
  });
});
