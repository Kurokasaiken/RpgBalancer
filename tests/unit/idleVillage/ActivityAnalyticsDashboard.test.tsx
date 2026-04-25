/**
 * Integration test for Activity Analytics Dashboard component.
 * Tests rendering, metrics display, and user interactions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActivityAnalyticsDashboard } from '../../../src/ui/idleVillage/analytics/ActivityAnalyticsDashboard';
import { DEFAULT_ANALYTICS_DASHBOARD_CONFIG } from '../../../src/ui/idleVillage/analytics/activityTelemetryConfig';

// Mock the useActivityAnalytics hook
vi.mock('../../../src/ui/idleVillage/analytics/useActivityAnalytics', () => ({
  useActivityAnalytics: () => ({
    metrics: {
      eventsByType: {
        jobStarted: 5,
        jobCompleted: 4,
        questAccepted: 2,
        questCompleted: 1,
      },
      completionRates: {
        job: 0.8,
        quest: 0.5,
        maintenance: 0,
      },
      averageCompletionTimes: {
        job: 120,
        quest: 300,
        maintenance: 0,
      },
      failureRates: {
        job: 0.2,
        quest: 0.5,
        maintenance: 0,
      },
      residentPerformance: {
        'resident-1': {
          totalActivities: 6,
          completionRate: 0.83,
          averageCompletionTime: 150,
          preferredActivities: ['job', 'quest'],
        },
      },
      hourlyActivityPattern: new Array(24).fill(0).map((_, i) => 
        i >= 8 && i <= 17 ? Math.floor(Math.random() * 5) + 1 : 0
      ),
      riskMetrics: {
        highRiskActivities: 2,
        averageRiskScore: 0.3,
        riskByActivityType: {
          job: 0.2,
          quest: 0.4,
          maintenance: 0.1,
        },
      },
      fatigueMetrics: {
        fatigueRelatedFailures: 1,
        averageFatigueOnFailure: 0.7,
        fatigueImpactByActivityType: {
          job: 0.3,
          quest: 0.5,
          maintenance: 0.2,
        },
      },
    },
    isLoading: false,
    error: null,
    storeStats: {
      eventCount: 12,
      lastEventTimestamp: Date.now() - 1000,
      sessionId: 'test-session-123',
      cacheAge: 500,
      retentionAge: 604800000,
    },
    recordEvent: vi.fn(),
    refreshMetrics: vi.fn(),
    clearAllData: vi.fn(),
    getEventsByActivityType: vi.fn(),
    getEventsByTimeRange: vi.fn(),
    getEventsByResident: vi.fn(),
    checkThresholds: vi.fn(() => ({
      isAboveThresholds: false,
      violations: [],
    })),
  }),
}));

describe('ActivityAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard header', () => {
    render(<ActivityAnalyticsDashboard />);
    
    expect(screen.getByText('Activity Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time insights for Idle Village activities')).toBeInTheDocument();
  });

  it('should display metrics cards', () => {
    render(<ActivityAnalyticsDashboard />);
    
    // Check for key metrics
    expect(screen.getByText('Total Activities')).toBeInTheDocument();
    expect(screen.getByText('Job Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Quest Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Maintenance Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Job Time')).toBeInTheDocument();
    expect(screen.getByText('High Risk Activities')).toBeInTheDocument();
    expect(screen.getByText('Fatigue Failures')).toBeInTheDocument();
    expect(screen.getByText('Active Residents')).toBeInTheDocument();
  });

  it('should display metric values correctly', () => {
    render(<ActivityAnalyticsDashboard />);
    
    // Check specific values from mock data
    expect(screen.getByText('12')).toBeInTheDocument(); // Total activities
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // Job completion rate
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // Quest completion rate
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Maintenance rate
    expect(screen.getByText('120s')).toBeInTheDocument(); // Avg job time
    expect(screen.getByText('2')).toBeInTheDocument(); // High risk activities
    expect(screen.getByText('1')).toBeInTheDocument(); // Fatigue failures
    expect(screen.getByText('1')).toBeInTheDocument(); // Active residents
  });

  it('should display activity pattern chart', () => {
    render(<ActivityAnalyticsDashboard />);
    
    expect(screen.getByText('Hourly Activity Pattern')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
    expect(screen.getByText('24:00')).toBeInTheDocument();
  });

  it('should display resident performance section', () => {
    render(<ActivityAnalyticsDashboard />);
    
    expect(screen.getByText('Top Residents by Performance')).toBeInTheDocument();
    expect(screen.getByText(/resident-1/)).toBeInTheDocument();
    expect(screen.getByText('83.3%')).toBeInTheDocument(); // Resident completion rate
  });

  it('should display risk assessment section', () => {
    render(<ActivityAnalyticsDashboard />);
    
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('job')).toBeInTheDocument();
    expect(screen.getByText('quest')).toBeInTheDocument();
    expect(screen.getByText('maintenance')).toBeInTheDocument();
  });

  it('should show session statistics in header', () => {
    render(<ActivityAnalyticsDashboard />);
    
    expect(screen.getByText(/test-session/)).toBeInTheDocument();
    expect(screen.getByText('Events: 12')).toBeInTheDocument();
    expect(screen.getByText(/Cache: \d+s/)).toBeInTheDocument();
  });

  it('should apply custom configuration', () => {
    const customConfig = {
      ...DEFAULT_ANALYTICS_DASHBOARD_CONFIG,
      layout: {
        ...DEFAULT_ANALYTICS_DASHBOARD_CONFIG.layout,
        maxCardsPerRow: 2,
      },
    };

    render(<ActivityAnalyticsDashboard config={customConfig} />);
    
    // Should still render with custom config
    expect(screen.getByText('Activity Analytics Dashboard')).toBeInTheDocument();
  });

  it('should hide header when showHeader is false', () => {
    render(<ActivityAnalyticsDashboard showHeader={false} />);
    
    expect(screen.queryByText('Activity Analytics Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Real-time insights for Idle Village activities')).not.toBeInTheDocument();
  });

  it('should show loading state', async () => {
    // Override mock to show loading state
    const { useActivityAnalytics } = await import('../../../src/ui/idleVillage/analytics/useActivityAnalytics');
    vi.mocked(useActivityAnalytics).mockReturnValue({
      metrics: null,
      isLoading: true,
      error: null,
      storeStats: null,
      recordEvent: vi.fn(),
      refreshMetrics: vi.fn(),
      clearAllData: vi.fn(),
      getEventsByActivityType: vi.fn(),
      getEventsByTimeRange: vi.fn(),
      getEventsByResident: vi.fn(),
      checkThresholds: vi.fn(() => ({
        isAboveThresholds: false,
        violations: [],
      })),
    });

    render(<ActivityAnalyticsDashboard />);
    
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    // Override mock to show error state
    const { useActivityAnalytics } = await import('../../../src/ui/idleVillage/analytics/useActivityAnalytics');
    vi.mocked(useActivityAnalytics).mockReturnValue({
      metrics: null,
      isLoading: false,
      error: 'Test error message',
      storeStats: null,
      recordEvent: vi.fn(),
      refreshMetrics: vi.fn(),
      clearAllData: vi.fn(),
      getEventsByActivityType: vi.fn(),
      getEventsByTimeRange: vi.fn(),
      getEventsByResident: vi.fn(),
      checkThresholds: vi.fn(() => ({
        isAboveThresholds: false,
        violations: [],
      })),
    });

    render(<ActivityAnalyticsDashboard />);
    
    expect(screen.getByText('Error loading analytics: Test error message')).toBeInTheDocument();
  });

  it('should display threshold alerts when violations exist', async () => {
    // Override mock to show threshold violations
    const { useActivityAnalytics } = await import('../../../src/ui/idleVillage/analytics/useActivityAnalytics');
    vi.mocked(useActivityAnalytics).mockReturnValue({
      metrics: {
        eventsByType: {},
        completionRates: { job: 0.5, quest: 0, maintenance: 0 },
        averageCompletionTimes: { job: 0, quest: 0, maintenance: 0 },
        failureRates: { job: 0.5, quest: 0, maintenance: 0 },
        residentPerformance: {},
        hourlyActivityPattern: new Array(24).fill(0),
        riskMetrics: {
          highRiskActivities: 5,
          averageRiskScore: 0.8,
          riskByActivityType: { job: 0.8, quest: 0, maintenance: 0 },
        },
        fatigueMetrics: {
          fatigueRelatedFailures: 3,
          averageFatigueOnFailure: 0.9,
          fatigueImpactByActivityType: { job: 0.8, quest: 0, maintenance: 0 },
        },
      },
      isLoading: false,
      error: null,
      storeStats: null,
      recordEvent: vi.fn(),
      refreshMetrics: vi.fn(),
      clearAllData: vi.fn(),
      getEventsByActivityType: vi.fn(),
      getEventsByTimeRange: vi.fn(),
      getEventsByResident: vi.fn(),
      checkThresholds: vi.fn(() => ({
        isAboveThresholds: true,
        violations: [
          {
            metric: 'completionRate_job',
            value: 0.5,
            threshold: 0.8,
            severity: 'error' as const,
          },
          {
            metric: 'averageRiskScore',
            value: 0.8,
            threshold: 0.7,
            severity: 'warning' as const,
          },
        ],
      })),
    });

    render(<ActivityAnalyticsDashboard showThresholds={true} />);
    
    expect(screen.getByText('⚠️ Threshold Alerts (2)')).toBeInTheDocument();
    expect(screen.getByText('completionRate_job')).toBeInTheDocument();
    expect(screen.getByText('averageRiskScore')).toBeInTheDocument();
  });
});
