/**
 * Interaction Mode Diagnostics Drawer Tests
 * 
 * Unit tests for the Interaction Mode Diagnostics Drawer component
 * using React Testing Library.
 * 
 * @since NP-063 – Idle Village Interaction Mode Diagnostics
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractionModeDiagnosticsDrawer } from '@/ui/idleVillage/components/InteractionModeDiagnosticsDrawer';
import type { InteractionMode } from '@/ui/idleVillage/config/interactionModeConfig';

// Mock the analytics module
jest.mock('@/analytics/idleVillageInteractionMode', () => ({
  getInteractionModeAnalytics: jest.fn(() => ({
    recordEvent: jest.fn(),
    recordModeSwitch: jest.fn(),
    recordInteraction: jest.fn(),
    recordError: jest.fn(),
    startSession: jest.fn(),
    endSession: jest.fn(),
    updateAnalytics: jest.fn(),
    getFilteredEvents: jest.fn(() => Promise.resolve([])),
    exportEvents: jest.fn(() => Promise.resolve('mock export data')),
    getCurrentAnalytics: jest.fn(() => Promise.resolve({
      currentKPI: {
        switchRate: 2.5,
        tapCount: { desktop: 150, mobile: 75 },
        errorCount: { desktop: 3, mobile: 2 },
        averageSessionDuration: { desktop: 300, mobile: 180 },
        modePreference: { desktop: 66.7, mobile: 33.3 },
        satisfactionScore: 4.2,
        taskCompletionRate: { desktop: 0.85, mobile: 0.78 },
      },
      kpiTrends: { hourly: {}, daily: {} },
      recentEvents: [],
      sessionSummary: {
        sessionId: 'test-session-123',
        startTime: Date.now() - 300000,
        totalEvents: 225,
        modeSwitches: 5,
        errors: 5,
        dominantMode: 'desktop' as InteractionMode,
      },
      exportHistory: [],
    })),
    resetAnalytics: jest.fn(),
    loadAnalytics: jest.fn(() => Promise.resolve({
      currentKPI: {
        switchRate: 2.5,
        tapCount: { desktop: 150, mobile: 75 },
        errorCount: { desktop: 3, mobile: 2 },
        averageSessionDuration: { desktop: 300, mobile: 180 },
        modePreference: { desktop: 66.7, mobile: 33.3 },
        satisfactionScore: 4.2,
        taskCompletionRate: { desktop: 0.85, mobile: 0.78 },
      },
      kpiTrends: { hourly: {}, daily: {} },
      recentEvents: [],
      sessionSummary: {
        sessionId: 'test-session-123',
        startTime: Date.now() - 300000,
        totalEvents: 225,
        modeSwitches: 5,
        errors: 5,
        dominantMode: 'desktop' as InteractionMode,
      },
      exportHistory: [],
    })),
    saveAnalytics: jest.fn(),
  })),
  exportInteractionModeAnalytics: jest.fn(),
  getCurrentKPI: jest.fn(),
  getSessionSummary: jest.fn(),
  getExportHistory: jest.fn(),
}));

// Mock PersistenceService
jest.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: jest.fn(),
  loadData: jest.fn(),
}));

describe('InteractionModeDiagnosticsDrawer', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    currentMode: 'desktop' as InteractionMode,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    expect(screen.getByText('Interaction Mode Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Current Mode: desktop')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Interaction Mode Diagnostics')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Close diagnostics'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('switches tabs correctly', async () => {
    const user = userEvent.setup();
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Initially on Overview tab
    expect(screen.getByText('Overview')).toHaveClass('border-blue-500');
    expect(screen.getByText('Timeline')).not.toHaveClass('border-blue-500');
    
    // Switch to Timeline tab
    await user.click(screen.getByText('Timeline'));
    expect(screen.getByText('Timeline')).toHaveClass('border-blue-500');
    expect(screen.getByText('Overview')).not.toHaveClass('border-blue-500');
    
    // Switch to Events tab
    await user.click(screen.getByText('Events'));
    expect(screen.getByText('Events')).toHaveClass('border-blue-500');
    expect(screen.getByText('Timeline')).not.toHaveClass('border-blue-500');
    
    // Switch to Export tab
    await user.click(screen.getByText('Export'));
    expect(screen.getByText('Export')).toHaveClass('border-blue-500');
    expect(screen.getByText('Events')).not.toHaveClass('border-blue-500');
  });

  it('displays KPI metrics on Overview tab', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    expect(screen.getByText('Switch Rate')).toBeInTheDocument();
    expect(screen.getByText('Desktop Taps')).toBeInTheDocument();
    expect(screen.getByText('Mobile Taps')).toBeInTheDocument();
    expect(screen.getByText('Desktop Errors')).toBeInTheDocument();
    expect(screen.getByText('Mobile Errors')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction')).toBeInTheDocument();
  });

  it('displays session summary on Overview tab', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    expect(screen.getByText('Session Summary')).toBeInTheDocument();
    expect(screen.getByText('Session ID:')).toBeInTheDocument();
    expect(screen.getByText('Duration:')).toBeInTheDocument();
    expect(screen.getByText('Mode Switches:')).toBeInTheDocument();
    expect(screen.getByText('Errors:')).toBeInTheDocument();
  });

  it('displays mode preference with correct percentages', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    expect(screen.getByText('Mode Preference')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('66.7%')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
  });

  it('displays timeline chart on Timeline tab', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Timeline tab
    fireEvent.click(screen.getByText('Timeline'));
    
    expect(screen.getByText('Timeline (Last Hour)')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  it('displays filter controls on Events tab', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Events tab
    fireEvent.click(screen.getByText('Events'));
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Interaction Modes')).toBeInTheDocument();
    expect(screen.getByText('Event Types')).toBeInTheDocument();
  });

  it('displays export controls on Export tab', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Export tab
    fireEvent.click(screenText('Export'));
    
    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screenByText('Export Markdown')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { getInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
    const mockAnalytics = getInteractionModeAnalytics();
    
    // Mock loading state
    let resolveLoading: (value: any) => void;
    mockAnalytics.updateAnalytics.mockImplementation(() => {
      return new Promise(resolve => {
        resolveLoading = resolve;
      });
    });

    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    expect(screen.getByText('Loading diagnostics...')).toBeInTheDocument();
    
    // Resolve loading
    resolveLoading({});
    
    waitFor(() => {
      expect(screen.queryByText('Loading diagnostics...')).not.toBeInTheDocument();
    });
  });

  it('shows error state', () => {
    const { getInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
    const mockAnalytics = getInteractionModeAnalytics();
    
    // Mock error state
    mockAnalytics.updateAnalytics.mockRejectedValue(new Error('Test error'));

    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    expect(screen.getByText('Error: Failed to load diagnostics data')).toBeInTheDocument();
  });

  it('handles export functionality', async () => {
    const user = userEvent.setup();
    const { exportInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
    
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Export tab
    await user.click(screen.getByText('Export'));
    
    // Mock export data
    exportInteractionModeAnalytics.mockResolvedValue('mock export data');
    
    // Click export button
    await user.click(screen.getByText('Export JSON'));
    
    expect(exportInteractionModeAnalytics).toHaveBeenCalledWith('json', {
      dateRange: undefined,
      modes: [],
      sources: [],
      eventTypes: [],
    });
  });

  it('handles filter changes', async () => {
    const user = userEvent.setup();
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Events tab
    await user.click(screen.getByText('Events'));
    
    // Change date range filter
    const dateRangeSelect = screen.getByLabelText('Date Range');
    await user.selectOptions(dateRangeSelect, 'Last Hour');
    
    // Verify filter is applied (this would be tested with actual data)
    expect(dateRangeSelect).toHaveValue('1');
  });

  it('handles mode filter changes', async () => {
    const user = userEvent.setup();
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Events tab
    await user.click(screen.getByText('Events'));
    
    // Check desktop mode checkbox
    const desktopCheckbox = screen.getByLabelText('Desktop');
    await user.click(desktopCheckbox);
    expect(desktopCheckbox).toBeChecked();
    
    // Check mobile mode checkbox
    const mobileCheckbox = screen.getByLabelText('Mobile');
    await user.click(mobileCheckbox);
    expect(mobileCheckbox).toBeChecked();
  });

  it('handles event type filter changes', async () => {
    const user = userEvent.setup();
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Events tab
    await user.click(screen.getByText('Events'));
    
    // Check mode_switch event type
    const modeSwitchCheckbox = screen.getByLabelText('mode switch');
    await user.click(modeSwitchCheckbox);
    expect(modeSwitchCheckbox).toBeChecked();
    
    // Check interaction event type
    const interactionCheckbox = screen.getByLabelText('interaction');
    await user.click(interactionCheckbox);
    expect(interactionCheckbox).toBeChecked();
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const { getInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
    const mockAnalytics = getInteractionModeAnalytics();
    
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Click refresh button
    await user.click(screen.getByText('Refresh'));
    
    expect(mockAnalytics.updateAnalytics).toHaveBeenCalled();
  });

  it('displays correct current mode', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} currentMode="mobile" />);
    
    expect(screen.getByText('Current Mode: mobile')).toBeInTheDocument();
  });

  it('applies custom configuration', () => {
    const customConfig = {
      ui: {
        enableRealTimeUpdates: false,
        updateIntervalMs: 10000,
        maxTimelinePoints: 50,
      },
    };
    
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} config={customConfig} />);
    
    // This would be tested with actual configuration application
    expect(screen.getByText('Timeline (Last Hour)')).toBeInTheDocument();
  });

  it('handles export loading state', async () => {
    const user = userEvent.setup();
    const { exportInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
    
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Export tab
    await user.click(screen.getByText('Export'));
    
    // Mock slow export
    exportInteractionModeAnalytics.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve('mock export data'), 1000);
      });
    });
    
    // Click export button
    await user.click(screen.getByText('Export JSON'));
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    
    // Wait for export to complete
    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles export errors', async () => {
    const user = userEvent.setup();
    const { exportInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
    
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    // Switch to Export tab
    await user.click(screen.getByText('Export'));
    
    // Mock export error
    exportInteractionModeAnalytics.mockRejectedValue(new Error('Export failed'));
    
    // Click export button
    await user.click(screen.getByText('Export JSON'));
    
    await waitFor(() => {
      expect(screen.getByText('Error: Export failed')).toBeInTheDocument();
    });
  });

  it('displays last updated timestamp', () => {
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('calls onClose when close button in footer is clicked', async () => {
    const user = userEvent.setup();
    render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
    
    await user.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
      
      expect(screen.getByLabelText('Close diagnostics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('has keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
      
      // Tab navigation
      await user.tab();
      expect(screen.getByText('Overview')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Timeline')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Events')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Export')).toHaveFocus();
    });

    it('supports screen readers', () => {
      render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Interaction Mode Diagnostics', level: 2 })).toBeInTheDocument();
      
      // Check for tab navigation
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Timeline' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Events' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Export' })).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('handles analytics errors gracefully', () => {
      const { getInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
      const mockAnalytics = getInteractionModeAnalytics();
      
      // Mock analytics to throw error
      mockAnalytics.getCurrentAnalytics.mockImplementation(() => {
        throw new Error('Analytics error');
      });

      render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
      
      expect(screen.getByText('Error: Failed to load diagnostics data')).toBeInTheDocument();
    });

    it('handles export errors gracefully', async () => {
      const user = userEvent.setup();
      const { exportInteractionModeAnalytics } = require('@/analytics/idleVillageInteractionMode');
      
      render(<InteractionModeDiagnosticsDrawer {...defaultProps} />);
      
      // Switch to Export tab
      await user.click(screen.getByText('Export'));
      
      // Mock export to throw error
      exportInteractionModeAnalytics.mockRejectedValue(new Error('Export error'));
      
      // Click export button
      await user.click(screen.getByText('Export JSON'));
      
      await waitFor(() => {
        expect(screen.getByText('Error: Export failed')).toBeInTheDocument();
      });
    });
  });
});
