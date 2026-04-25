/**
 * Crew Scheduler HUD Card Tests - NP-017
 * 
 * React Testing Library tests for the Crew Scheduler HUD Card component.
 * Tests component rendering, status display, controls, and interactions.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrewSchedulerHUDCard } from '../../../src/ui/idleVillage/components/CrewSchedulerHUDCard';
import type { CrewHUDEntry, CrewHUDMetrics } from '../../../src/ui/idleVillage/hooks/useCrewHUDState';
import type { CrewHUDConfig } from '../../../src/ui/idleVillage/config/hudCrewConfig';
import { DEFAULT_CREW_HUD_CONFIG } from '../../../src/ui/idleVillage/config/hudCrewConfig';

// Mock the config
vi.mock('../../../src/ui/idleVillage/config/hudCrewConfig', () => ({
  CREW_STATUS_LEVELS: {
    AVAILABLE: 'available',
    WORKING: 'working',
    RESTING: 'resting',
    INJURED: 'injured',
    EXHAUSTED: 'exhausted',
  },
  CREW_ALERT_LEVELS: {
    NONE: 'none',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
  DEFAULT_CREW_HUD_CONFIG: {
    badges: {
      available: {
        backgroundColor: 'rgb(34, 197, 94)',
        textColor: 'rgb(255, 255, 255)',
        borderColor: 'rgb(22, 163, 74)',
        size: 16,
        showIcon: true,
        icon: '✓',
      },
      working: {
        backgroundColor: 'rgb(59, 130, 246)',
        textColor: 'rgb(255, 255, 255)',
        borderColor: 'rgb(37, 99, 235)',
        size: 16,
        showIcon: true,
        icon: '⚒',
      },
      resting: {
        backgroundColor: 'rgb(251, 191, 36)',
        textColor: 'rgb(0, 0, 0)',
        borderColor: 'rgb(245, 158, 11)',
        size: 16,
        showIcon: true,
        icon: '⏸',
      },
      injured: {
        backgroundColor: 'rgb(239, 68, 68)',
        textColor: 'rgb(255, 255, 255)',
        borderColor: 'rgb(220, 38, 38)',
        size: 16,
        showIcon: true,
        icon: '⚠',
      },
      exhausted: {
        backgroundColor: 'rgb(127, 29, 29)',
        textColor: 'rgb(255, 255, 255)',
        borderColor: 'rgb(153, 27, 27)',
        size: 16,
        showIcon: true,
        icon: '⚠',
      },
    },
    thresholds: {
      fatigueExhausted: 0.9,
      fatigueTired: 0.7,
      queueHighThreshold: 5,
      queueMediumThreshold: 3,
      urgentPriorityThreshold: 0.8,
      responseTimeThreshold: 30,
    },
    colors: {
      status: {
        available: 'rgb(34, 197, 94)',
        working: 'rgb(59, 130, 246)',
        resting: 'rgb(251, 191, 36)',
        injured: 'rgb(239, 68, 68)',
        exhausted: 'rgb(127, 29, 29)',
      },
      alerts: {
        none: 'rgb(156, 163, 175)',
        low: 'rgb(251, 191, 36)',
        medium: 'rgb(251, 146, 60)',
        high: 'rgb(239, 68, 68)',
        critical: 'rgb(127, 29, 29)',
      },
      progress: {
        fill: 'rgb(34, 197, 94)',
        background: 'rgb(31, 41, 55)',
        border: 'rgb(75, 85, 99)',
      },
      controls: {
        primary: 'rgb(59, 130, 246)',
        secondary: 'rgb(107, 114, 128)',
        disabled: 'rgb(75, 85, 99)',
        hover: 'rgb(37, 99, 235)',
      },
      text: {
        primary: 'rgb(243, 244, 246)',
        secondary: 'rgb(156, 163, 175)',
        muted: 'rgb(107, 114, 128)',
        inverse: 'rgb(17, 24, 39)',
      },
    },
    animation: {
      enabled: true,
      duration: 300,
      easing: 'ease-out',
      enableHover: true,
      enableAlertPulse: true,
      alertPulseInterval: 2000,
    },
    layout: {
      maxVisibleCards: 4,
      cardWidth: 280,
      cardHeight: 160,
      cardSpacing: 12,
      borderRadius: 8,
      padding: 16,
      compactMode: false,
      showAvatars: true,
      avatarSize: 40,
    },
    controls: {
      enablePause: true,
      enablePriority: true,
      enableQuickAssign: true,
      enableViewDetails: true,
      showTooltips: true,
      tooltipDelay: 800,
      controlSize: 24,
    },
    enableTelemetry: true,
    refreshRate: 5000,
    maxHistoryItems: 50,
  },
}));

describe('CrewSchedulerHUDCard', () => {
  const mockCrewEntry: CrewHUDEntry = {
    crewId: 'crew-1',
    crewName: 'Alice',
    status: 'available',
    fatigue: 0.2,
    alertLevel: 'none',
    currentActivity: 'forest-work',
    queuePosition: 1,
    priorityScore: 0.8,
    responseTime: 15000,
    lastUpdate: Date.now(),
    isPaused: false,
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockMetrics: CrewHUDMetrics = {
    totalCrew: 3,
    crewByStatus: {
      available: 1,
      working: 1,
      resting: 1,
      injured: 0,
      exhausted: 0,
    },
    crewByAlert: {
      none: 2,
      low: 1,
      medium: 0,
      high: 0,
      critical: 0,
    },
    averageFatigue: 0.3,
    needingAttention: 0,
    queueSize: 2,
    averageResponseTime: 12000,
    readinessPercentage: 66.7,
  };

  const mockOnPauseToggle = vi.fn();
  const mockOnPriorityAdjust = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders crew card with basic information', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('available')).toBeInTheDocument();
      expect(screen.getByText('forest-work')).toBeInTheDocument();
    });
  });

  it('displays fatigue progress bar', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fatigue')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });

  it('shows priority score when queued', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  it('displays queue position when queued', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Queue Position')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  it('displays response time', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('15s')).toBeInTheDocument();
    });
  });

  it('shows avatar when available', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      const avatar = screen.getByAltText('Alice');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  it('shows avatar placeholder when no avatar URL', async () => {
    const crewWithoutAvatar = { ...mockCrewEntry, avatarUrl: undefined };

    render(
      <CrewSchedulerHUDCard
        crewEntry={crewWithoutAvatar}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument(); // First letter of name
    });
  });

  it('displays alert indicator for high alert levels', async () => {
    const crewWithHighAlert = { ...mockCrewEntry, alertLevel: 'high' as const };

    render(
      <CrewSchedulerHUDCard
        crewEntry={crewWithHighAlert}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      const alertIndicator = screen.getByTitle('Alert: high');
      expect(alertIndicator).toBeInTheDocument();
      expect(alertIndicator).toHaveClass('animate-pulse');
    });
  });

  it('shows no alert indicator for none alert level', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      // Should not have any alert indicator
      expect(screen.queryByTitle(/Alert:/)).not.toBeInTheDocument();
    });
  });

  it('handles pause toggle button', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      const pauseButton = screen.getByTitle('Pause');
      expect(pauseButton).toBeInTheDocument();
      
      fireEvent.click(pauseButton);
      expect(mockOnPauseToggle).toHaveBeenCalledWith('crew-1');
    });
  });

  it('handles pause toggle when crew is paused', async () => {
    const pausedCrew = { ...mockCrewEntry, isPaused: true };

    render(
      <CrewSchedulerHUDCard
        crewEntry={pausedCrew}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      const resumeButton = screen.getByTitle('Resume');
      expect(resumeButton).toBeInTheDocument();
      
      fireEvent.click(resumeButton);
      expect(mockOnPauseToggle).toHaveBeenCalledWith('crew-1');
    });
  });

  it('handles priority adjustment buttons', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      const increaseButton = screen.getByTitle('Increase Priority');
      const decreaseButton = screen.getByTitle('Decrease Priority');
      
      expect(increaseButton).toBeInTheDocument();
      expect(decreaseButton).toBeInTheDocument();
      
      fireEvent.click(increaseButton);
      expect(mockOnPriorityAdjust).toHaveBeenCalledWith('crew-1', expect.closeTo(0.9, 2));
      
      fireEvent.click(decreaseButton);
      expect(mockOnPriorityAdjust).toHaveBeenCalledWith('crew-1', expect.closeTo(0.7, 2));
    });
  });

  it('applies compact styling when compact prop is true', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
        compact={true}
      />
    );

    await waitFor(() => {
      const card = screen.getByTestId('crew-crew-1');
      expect(card).toHaveStyle({ width: '100%' });
    });
  });

  it('applies custom CSS classes', async () => {
    const customClass = 'custom-crew-card';

    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
        className={customClass}
      />
    );

    await waitFor(() => {
      const card = screen.getByTestId('crew-crew-1');
      expect(card).toHaveClass(customClass);
    });
  });

  it('displays correct status badge for different statuses', async () => {
    const statuses: Array<CrewHUDEntry['status']> = ['available', 'working', 'resting', 'injured', 'exhausted'];

    for (const status of statuses) {
      const crewWithStatus = { ...mockCrewEntry, status };

      const { unmount } = render(
        <CrewSchedulerHUDCard
          crewEntry={crewWithStatus}
          config={DEFAULT_CREW_HUD_CONFIG}
          metrics={mockMetrics}
          onPauseToggle={mockOnPauseToggle}
          onPriorityAdjust={mockOnPriorityAdjust}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(status)).toBeInTheDocument(); // Status is displayed as-is, uppercase is via CSS
      });

      unmount();
    }
  });

  it('displays last update time', async () => {
    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Last updated')).toBeInTheDocument();
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}\s[AP]M/)).toBeInTheDocument(); // Time format H:MM:SS AM/PM
    });
  });

  it('handles crew without current activity', async () => {
    const crewWithoutActivity = { ...mockCrewEntry, currentActivity: undefined };

    render(
      <CrewSchedulerHUDCard
        crewEntry={crewWithoutActivity}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      // Should not show activity section
      expect(screen.queryByText('Activity')).not.toBeInTheDocument();
    });
  });

  it('handles crew without queue position', async () => {
    const crewWithoutQueue = { ...mockCrewEntry, queuePosition: undefined };

    render(
      <CrewSchedulerHUDCard
        crewEntry={crewWithoutQueue}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      // Should not show queue position section
      expect(screen.queryByText('Queue Position')).not.toBeInTheDocument();
    });
  });

  it('handles crew without response time', async () => {
    const crewWithoutResponseTime = { ...mockCrewEntry, responseTime: undefined };

    render(
      <CrewSchedulerHUDCard
        crewEntry={crewWithoutResponseTime}
        config={DEFAULT_CREW_HUD_CONFIG}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      // Should not show response time section
      expect(screen.queryByText('Response Time')).not.toBeInTheDocument();
    });
  });

  it('applies custom configuration', async () => {
    const customConfig: Partial<CrewHUDConfig> = {
      layout: {
        ...DEFAULT_CREW_HUD_CONFIG.layout,
        cardWidth: 320,
        cardHeight: 180,
        showAvatars: false,
      },
      controls: {
        ...DEFAULT_CREW_HUD_CONFIG.controls,
        enablePause: false,
        enablePriority: false,
      },
    };

    render(
      <CrewSchedulerHUDCard
        crewEntry={mockCrewEntry}
        config={{ ...DEFAULT_CREW_HUD_CONFIG, ...customConfig }}
        metrics={mockMetrics}
        onPauseToggle={mockOnPauseToggle}
        onPriorityAdjust={mockOnPriorityAdjust}
      />
    );

    await waitFor(() => {
      // Should not show controls
      expect(screen.queryByTitle('Pause')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Increase Priority')).not.toBeInTheDocument();
      
      // Should not show avatar
      expect(screen.queryByAltText('Alice')).not.toBeInTheDocument();
    });
  });
});
