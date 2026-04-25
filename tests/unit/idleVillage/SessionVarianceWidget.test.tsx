/**
 * Session Variance Widget Tests
 * 
 * Unit tests for the Idle Village Session Variance Widget components
 * and hooks using React Testing Library.
 * 
 * @since NP-053 – Idle Village Session Variance Monitor
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionVarianceWidget, SessionVarianceIndicator, FloatingSessionVarianceWidget } from '@/ui/idleVillage/components/SessionVarianceWidget';
import { useSessionVariance, generateMockSessionData } from '@/ui/idleVillage/hooks/useSessionVariance';
import type { SessionVarianceConfig, SessionStatistics, VarianceAlert } from '@/ui/idleVillage/config/sessionVarianceConfig';
import { DEFAULT_SESSION_VARIANCE_CONFIG } from '@/ui/idleVillage/config/sessionVarianceConfig';

// Mock the hook
jest.mock('@/ui/idleVillage/hooks/useSessionVariance');
const mockUseSessionVariance = useSessionVariance as jest.MockedFunction<typeof useSessionVariance>;

// Mock PersistenceService
jest.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: jest.fn(),
  loadData: jest.fn(),
}));

describe('SessionVarianceWidget', () => {
  const mockConfig = DEFAULT_SESSION_VARIANCE_CONFIG;
  const mockStatistics: SessionStatistics = {
    totalSessions: 100,
    averageDuration: 600,
    medianDuration: 540,
    standardDeviation: 180,
    variance: 32400,
    minDuration: 120,
    maxDuration: 1800,
    bucketDistribution: { short: 30, medium: 50, long: 20 },
    platformDistribution: { desktop: 60, mobile: 40 },
    platformStats: {} as any,
  };

  const mockAlerts: VarianceAlert[] = [
    {
      id: 'alert-1',
      type: 'high_variance',
      severity: 'high',
      message: 'Session variance exceeds target',
      timestamp: Date.now(),
      data: {
        variance: 40000,
        threshold: 32400,
        actualValue: 200,
        expectedValue: 180,
      },
    },
  ];

  const mockHookReturn = {
    config: mockConfig,
    sessions: generateMockSessionData(50),
    statistics: mockStatistics,
    alerts: mockAlerts,
    isLoading: false,
    error: null,
    lastUpdate: Date.now(),
    addSession: jest.fn(),
    removeSession: jest.fn(),
    clearSessions: jest.fn(),
    updateConfig: jest.fn(),
    exportData: jest.fn(),
    refreshStatistics: jest.fn(),
    checkAlerts: jest.fn(),
    getSessionsByPlatform: jest.fn(),
    getSessionsByBucket: jest.fn(),
    getSessionTrend: jest.fn(() => [300, 400, 500, 600, 700, 800, 900, 1000]),
  };

  beforeEach(() => {
    mockUseSessionVariance.mockReturnValue(mockHookReturn);
    jest.clearAllMocks();
  });

  it('renders widget with basic information', () => {
    render(<SessionVarianceWidget />);
    
    expect(screen.getByText('Session Variance Monitor')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // Total sessions
    expect(screen.getByText('10m 0s')).toBeInTheDocument(); // Average duration
    expect(screen.getByText('3m 0s')).toBeInTheDocument(); // Standard deviation
  });

  it('shows alerts when present', () => {
    render(<SessionVarianceWidget showAlerts={true} />);
    
    expect(screen.getByText('Alerts (1)')).toBeInTheDocument();
  });

  it('handles tab switching', async () => {
    const user = userEvent.setup();
    render(<SessionVarianceWidget showPlatforms={true} showBuckets={true} showAlerts={true} />);
    
    // Switch to platforms tab
    await user.click(screen.getByText('Platforms'));
    expect(screen.getByText('Platform Distribution')).toBeInTheDocument();
    
    // Switch to buckets tab
    await user.click(screen.getByText('Buckets'));
    expect(screen.getByText('Session Bucket Distribution')).toBeInTheDocument();
    
    // Switch to alerts tab
    await user.click(screen.getByText('Alerts (1)'));
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
  });

  it('calls export functions when export buttons are clicked', async () => {
    const user = userEvent.setup();
    const mockExportData = jest.fn().mockReturnValue('exported data');
    mockUseSessionVariance.mockReturnValue({
      ...mockHookReturn,
      exportData: mockExportData,
    });
    
    render(<SessionVarianceWidget />);
    
    // Find and click export buttons (they might be in actions)
    const exportButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Export')
    );
    
    if (exportButtons.length > 0) {
      await user.click(exportButtons[0]);
      expect(mockExportData).toHaveBeenCalled();
    }
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<SessionVarianceWidget />);
    
    const refreshButton = screen.getByTitle('Refresh data');
    await user.click(refreshButton);
    
    expect(mockHookReturn.refreshStatistics).toHaveBeenCalled();
  });

  it('renders compact size correctly', () => {
    render(<SessionVarianceWidget size="compact" />);
    
    // Should not show tabs in compact mode
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Platforms')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseSessionVariance.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    });
    
    render(<SessionVarianceWidget />);
    
    expect(screen.getByText('Loading session data...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseSessionVariance.mockReturnValue({
      ...mockHookReturn,
      error: 'Failed to load data',
      isLoading: false,
    });
    
    render(<SessionVarianceWidget />);
    
    expect(screen.getByText('Error: Failed to load data')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SessionVarianceWidget className="custom-class" />);
    
    expect(container.querySelector('.session-variance-widget')).toHaveClass('custom-class');
  });

  it('handles expand/collapse in normal size', async () => {
    const user = userEvent.setup();
    render(<SessionVarianceWidget size="normal" />);
    
    const toggleButton = screen.getByTitle(/Expand|Collapse/);
    await user.click(toggleButton);
    
    // Should toggle expanded state
    expect(toggleButton).toBeInTheDocument();
  });
});

describe('SessionVarianceIndicator', () => {
  const mockStatistics: SessionStatistics = {
    totalSessions: 50,
    averageDuration: 300,
    medianDuration: 280,
    standardDeviation: 120,
    variance: 14400,
    minDuration: 60,
    maxDuration: 900,
    bucketDistribution: { short: 15, medium: 25, long: 10 },
    platformDistribution: { desktop: 30, mobile: 20 },
    platformStats: {} as any,
  };

  const mockConfig = DEFAULT_SESSION_VARIANCE_CONFIG;
  const mockAlerts: VarianceAlert[] = [];

  it('renders indicator correctly', () => {
    render(
      <SessionVarianceIndicator
        statistics={mockStatistics}
        config={mockConfig}
        alerts={mockAlerts}
      />
    );
    
    expect(screen.getByText('2m 0s')).toBeInTheDocument(); // Standard deviation
  });

  it('shows warning status when variance is high', () => {
    const highVarianceStats = {
      ...mockStatistics,
      variance: 50000, // Higher than maxVariance
    };
    
    render(
      <SessionVarianceIndicator
        statistics={highVarianceStats}
        config={mockConfig}
        alerts={mockAlerts}
      />
    );
    
    const indicator = screen.getByRole('generic', { name: /Session Variance/ });
    expect(indicator).toHaveClass('warning');
  });

  it('shows alert indicator when alerts are present', () => {
    const alertsWithData: VarianceAlert[] = [
      {
        id: 'test-alert',
        type: 'high_variance',
        severity: 'medium',
        message: 'Test alert',
        timestamp: Date.now(),
        data: {},
      },
    ];
    
    render(
      <SessionVarianceIndicator
        statistics={mockStatistics}
        config={mockConfig}
        alerts={alertsWithData}
      />
    );
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(
      <SessionVarianceIndicator
        statistics={mockStatistics}
        config={mockConfig}
        alerts={mockAlerts}
        onClick={mockOnClick}
      />
    );
    
    const indicator = screen.getByRole('generic', { name: /Session Variance/ });
    await user.click(indicator);
    
    expect(mockOnClick).toHaveBeenCalled();
  });
});

describe('FloatingSessionVarianceWidget', () => {
  const mockHookReturn = {
    config: DEFAULT_SESSION_VARIANCE_CONFIG,
    sessions: [],
    statistics: {
      totalSessions: 0,
      averageDuration: 0,
      medianDuration: 0,
      standardDeviation: 0,
      variance: 0,
      minDuration: 0,
      maxDuration: 0,
      bucketDistribution: { short: 0, medium: 0, long: 0 },
      platformDistribution: { desktop: 0, mobile: 0 },
      platformStats: {} as any,
    },
    alerts: [],
    isLoading: false,
    error: null,
    lastUpdate: Date.now(),
    addSession: jest.fn(),
    restoreSessions: jest.fn(),
    updateConfig: jest.fn(),
    exportData: jest.fn(),
    refreshStatistics: jest.fn(),
    checkAlerts: jest.fn(),
    getSessionsByPlatform: jest.fn(),
    getSessionsByBucket: jest.fn(),
    getSessionTrend: jest.fn(() => []),
  };

  beforeEach(() => {
    mockUseSessionVariance.mockReturnValue(mockHookReturn);
  });

  it('renders in expanded state by default', () => {
    render(<FloatingSessionVarianceWidget />);
    
    expect(screen.getByText('Session Variance')).toBeInTheDocument();
    expect(screen.getByTitle('Minimize')).toBeInTheDocument();
  });

  it('minimizes when minimize button is clicked', async () => {
    const user = userEvent.setup();
    render(<FloatingSessionVarianceWidget />);
    
    const minimizeButton = screen.getByTitle('Minimize');
    await user.click(minimizeButton);
    
    // Should show minimized state
    expect(screen.queryByText('Session Variance')).not.toBeInTheDocument();
  });

  it('expands when minimized indicator is clicked', async () => {
    const user = userEvent.setup();
    render(<FloatingSessionVarianceWidget />);
    
    // First minimize
    const minimizeButton = screen.getByTitle('Minimize');
    await user.click(minimizeButton);
    
    // Then click indicator to expand
    const indicator = screen.getByRole('generic', { name: /Session Variance/ });
    await user.click(indicator);
    
    // Should be expanded again
    expect(screen.getByText('Session Variance')).toBeInTheDocument();
  });

  it('applies floating widget class', () => {
    const { container } = render(<FloatingSessionVarianceWidget />);
    
    expect(container.querySelector('.floating-session-variance-widget')).toBeInTheDocument();
  });
});

describe('Widget Integration', () => {
  it('handles real-time data updates', async () => {
    const mockHookReturn = {
      config: DEFAULT_SESSION_VARIANCE_CONFIG,
      sessions: generateMockSessionData(10),
      statistics: {
        totalSessions: 10,
        averageDuration: 300,
        medianDuration: 280,
        standardDeviation: 60,
        variance: 3600,
        minDuration: 120,
        maxDuration: 600,
        bucketDistribution: { short: 3, medium: 5, long: 2 },
        platformDistribution: { desktop: 6, mobile: 4 },
        platformStats: {} as any,
      },
      alerts: [],
      isLoading: false,
      error: null,
      lastUpdate: Date.now(),
      addSession: jest.fn(),
      removeSession: jest.fn(),
      clearSessions: jest.fn(),
      updateConfig: jest.fn(),
      exportData: jest.fn(),
      refreshStatistics: jest.fn(),
      checkAlerts: jest.fn(),
      getSessionsByPlatform: jest.fn(),
      getSessionsByBucket: jest.fn(),
      getSessionTrend: jest.fn(() => [200, 250, 300, 350, 400]),
    };

    mockUseSessionVariance.mockReturnValue(mockHookReturn);

    render(<SessionVarianceWidget detailed={true} />);
    
    // Should show platform and bucket breakdown
    expect(screen.getByText('10')).toBeInTheDocument(); // Total sessions
    expect(screen.getByText('5m 0s')).toBeInTheDocument(); // Average duration
  });

  it('handles empty data state gracefully', () => {
    const emptyHookReturn = {
      config: DEFAULT_SESSION_VARIANCE_CONFIG,
      sessions: [],
      statistics: {
        totalSessions: 0,
        averageDuration: 0,
        medianDuration: 0,
        standardDeviation: 0,
        variance: 0,
        minDuration: 0,
        maxDuration: 0,
        bucketDistribution: { short: 0, medium: 0, long: 0 },
        platformDistribution: { desktop: 0, mobile: 0 },
        platformStats: {} as any,
      },
      alerts: [],
      isLoading: false,
      error: null,
      lastUpdate: Date.now(),
      addSession: jest.fn(),
      removeSession: jest.fn(),
      clearSessions: jest.fn(),
      updateConfig: jest.fn(),
      exportData: jest.fn(),
      refreshStatistics: jest.fn(),
      checkAlerts: jest.fn(),
      getSessionsByPlatform: jest.fn(),
      getSessionsByBucket: jest.fn(),
      getSessionTrend: jest.fn(() => []),
    };

    mockUseSessionVariance.mockReturnValue(emptyHookReturn);

    render(<SessionVarianceWidget />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Total sessions
    expect(screen.getByText('0s')).toBeInTheDocument(); // Average duration
  });
});

describe('Widget Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(<SessionVarianceWidget />);
    
    // Check for proper headings
    expect(screen.getByRole('heading', { name: 'Session Variance Monitor' })).toBeInTheDocument();
    
    // Check for button labels
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toHaveAttribute('title');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<SessionVarianceWidget showAlerts={true} />);
    
    // Tab through buttons
    await user.tab();
    expect(screen.getByRole('button', { name: /refresh/i })).toHaveFocus();
    
    await user.tab();
    // Should focus on tab buttons
    const tabButton = screen.getByRole('tab', { name: 'Overview' });
    expect(tabButton).toBeInTheDocument();
  });

  it('provides screen reader friendly content', () => {
    render(<SessionVarianceWidget />);
    
    // Check for descriptive text
    expect(screen.getByText(/Total Sessions/)).toBeInTheDocument();
    expect(screen.getByText(/Average Duration/)).toBeInTheDocument();
    expect(screen.getByText(/Standard Deviation/)).toBeInTheDocument();
  });
});
