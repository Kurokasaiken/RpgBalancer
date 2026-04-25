import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceDashboard } from '../PerformanceDashboard';
import type { PerformanceDashboardProps } from '../types';

// Mock the usePerformanceData hook
vi.mock('../hooks/usePerformanceData', () => ({
  usePerformanceData: vi.fn(),
  formatDuration: vi.fn((minutes) => `${minutes}m`),
  formatPercentage: vi.fn((value) => `${value.toFixed(1)}%`),
  getPerformanceColor: vi.fn(() => 'text-blue-400'),
}));

import { usePerformanceData } from '../hooks/usePerformanceData';

const mockUsePerformanceData = usePerformanceData as ReturnType<typeof vi.fn>;

describe('PerformanceDashboard', () => {
  const defaultProps: PerformanceDashboardProps = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUsePerformanceData.mockReturnValue({
      data: null,
      metrics: null,
      filteredEntries: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
    // Should show skeleton loaders
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('should show error state', () => {
    mockUsePerformanceData.mockReturnValue({
      data: null,
      metrics: null,
      filteredEntries: [],
      loading: false,
      error: 'Failed to load data',
      refetch: vi.fn(),
    });

    render(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should show no data state', () => {
    mockUsePerformanceData.mockReturnValue({
      data: null,
      metrics: null,
      filteredEntries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText('No time tracking data found for the selected filters.')).toBeInTheDocument();
  });

  it('should render dashboard with metrics', () => {
    const mockMetrics = {
      totalTasks: 10,
      completedTasks: 8,
      completionRate: 80,
      totalTrackedMinutes: 300,
      averageDuration: 37.5,
      agentMetrics: {
        'Agent1': {
          agent: 'Agent1',
          totalTasks: 5,
          completedTasks: 4,
          totalMinutes: 150,
          averageDuration: 37.5,
          completionRate: 80,
          categories: { 'development': 100, 'testing': 50 }
        }
      },
      categoryMetrics: {
        'development': {
          category: 'development',
          totalTasks: 5,
          completedTasks: 4,
          totalMinutes: 200,
          averageDuration: 50,
          completionRate: 80,
          agents: { 'Agent1': 150, 'Agent2': 50 }
        }
      },
      timeTrends: [
        {
          date: '2026-01-07',
          totalMinutes: 120,
          completedTasks: 3,
          activeAgents: 2
        }
      ]
    };

    mockUsePerformanceData.mockReturnValue({
      data: {
        entries: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: '2026-01-08T00:00:00.000Z',
          totalTasks: 10,
          totalCompletedTasks: 8,
          totalTrackedMinutes: 300
        }
      },
      metrics: mockMetrics,
      filteredEntries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PerformanceDashboard {...defaultProps} />);
    
    // Check header
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Time tracking metrics and performance insights')).toBeInTheDocument();
    
    // Check overview cards
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    
    // Check sections
    expect(screen.getByText('Time Trends')).toBeInTheDocument();
    expect(screen.getByText('Category Distribution')).toBeInTheDocument();
    expect(screen.getByText('Agent Performance')).toBeInTheDocument();
    
    // Check export buttons
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });

  it('should hide export buttons when showExport is false', () => {
    mockUsePerformanceData.mockReturnValue({
      data: {
        entries: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: '2026-01-08T00:00:00.000Z',
          totalTasks: 0,
          totalCompletedTasks: 0,
          totalTrackedMinutes: 0
        }
      },
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        totalTrackedMinutes: 0,
        averageDuration: 0,
        agentMetrics: {},
        categoryMetrics: {},
        timeTrends: []
      },
      filteredEntries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PerformanceDashboard {...defaultProps} showExport={false} />);
    
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    expect(screen.queryByText('Export JSON')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUsePerformanceData.mockReturnValue({
      data: {
        entries: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: '2026-01-08T00:00:00.000Z',
          totalTasks: 0,
          totalCompletedTasks: 0,
          totalTrackedMinutes: 0
        }
      },
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        totalTrackedMinutes: 0,
        averageDuration: 0,
        agentMetrics: {},
        categoryMetrics: {},
        timeTrends: []
      },
      filteredEntries: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PerformanceDashboard {...defaultProps} className="custom-class" />);
    
    const container = document.querySelector('.observatory-page');
    expect(container).toHaveClass('custom-class');
  });
});
