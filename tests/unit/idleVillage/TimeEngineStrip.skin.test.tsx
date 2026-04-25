import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { TimeEngineStrip } from '../../../src/ui/idleVillage/components/minimal/TimeEngineStrip';
import { trackTelemetryEvent } from '../../../src/analytics/telemetry/telemetryProvider';
import type { ActiveHUDState } from '../../../src/ui/idleVillage/hooks/useActiveHUDState';
import type { ClockWidgetProps } from '../../../src/ui/idleVillage/components/minimal/ClockWidget';

// Mock the telemetry provider
vi.mock('../../../src/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock the skin config
vi.mock('../../../src/ui/idleVillage/skins/timeEngineSkinConfig', () => ({
  createTimeEngineSkinConfig: vi.fn((presetId: string, pillar: string) => ({
    skinPresetId: presetId,
    pillar,
    componentTheme: presetId === 'minimal_frontier' ? 'minimalFrontier.time.raycast' : `${presetId}.time.${pillar}`,
    clockStyle: {
      displayMode: 'digital' as const,
      faceToken: 'colors.clock.face',
      handsToken: 'colors.clock.hands',
      numbersToken: 'colors.clock.numbers',
    },
    accentGlow: {
      glowToken: 'effects.glow.accent',
      intensity: 0.5,
      radius: 8,
      animationToken: 'animations.glow.pulse',
    },
    progressBar: {
      fillToken: 'colors.progress.fill',
      backgroundToken: 'colors.progress.background',
      borderToken: 'colors.progress.border',
      height: 4,
    },
    typography: {
      timeFont: 'typography.time.display',
      labelFont: 'typography.label.primary',
      captionFont: 'typography.caption.secondary',
    },
    animations: {
      tickAnimation: 'animations.clock.tick',
      transitionAnimation: 'animations.transition.smooth',
      pulseAnimation: 'animations.pulse.subtle',
    },
  })),
}));

// Mock the ActiveHUD component
vi.mock('../../../src/ui/idleVillage/components/ActiveHUD', () => ({
  default: ({ hudState }: any) => (
    <section data-testid="active-hud">
      <div data-testid="hud-activities">{hudState?.activities?.length || 0}</div>
    </section>
  ),
}));

// Mock the ClockWidget component
vi.mock('../../../src/ui/idleVillage/components/minimal/ClockWidget', () => ({
  ClockWidget: ({ currentDay, speedMultiplier }: any) => (
    <div data-testid="clock-widget">
      <div data-testid="current-day">{currentDay}</div>
      <div data-testid="speed-multiplier">{speedMultiplier}</div>
    </div>
  ),
}));

// Mock the ActionCard component
vi.mock('../../../src/ui/idleVillage/map/actionCards/ActionCard', () => ({
  ActionCard: ({ label, progressFraction }: any) => (
    <div data-testid="action-card">
      <div data-testid="card-label">{label}</div>
      <div data-testid="card-progress">{progressFraction}</div>
    </div>
  ),
}));

describe('TimeEngineStrip Skin', () => {
  const mockHUDState: ActiveHUDState = {
    activities: [
      {
        key: 'test-activity',
        activityType: 'job',
        label: 'Test Activity',
        icon: 'test-icon',
        residentId: 'resident-1',
        residentName: 'Test Resident',
        progress: 0.5,
        remainingSeconds: 300,
        status: 'running',
        visualVariant: 'azure',
        scheduledId: 'scheduled-1',
        activityId: 'activity-1',
      },
    ],
    counts: { jobs: 1, quests: 0, maintenance: 0, total: 1 },
    hasActiveActivities: true,
    persistence: {
      preferences: {
        collapsed: false,
        maxVisible: 4,
        sortBy: 'remaining-time',
        showTypeBadges: true,
        compactMode: false,
      },
      uiState: {
        selectedTypeFilter: 'all',
        telemetryPanelOpen: false,
        position: 'top',
      },
      metadata: {
        lastSaved: Date.now(),
        version: '1.0.0',
      },
    },
  };

  const defaultProps = {
    phaseIcon: <div data-testid="phase-icon">☀️</div>,
    isPlaying: true,
    progressFraction: 0.75,
    totalSeconds: 1000,
    onToggle: vi.fn(),
    clockProps: {
      currentDay: 5,
      speedMultiplier: 1,
      onSpeedChange: vi.fn(),
      isPaused: false,
      defaultSpeedMultiplier: 1,
      maxSpeedMultiplier: 5,
      tickIntervalMs: 1000,
      onTogglePause: vi.fn(),
      variant: 'solar',
    } as unknown as ClockWidgetProps,
    hudState: mockHUDState,
    villageState: {
      currentTime: 500,
      resources: { food: 100, wood: 50 },
      residents: {},
      activities: {},
      eventLog: [],
      questOffers: {},
    },
    secondsPerTimeUnit: 60,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default skin preset', () => {
    render(<TimeEngineStrip {...defaultProps} />);
    
    expect(screen.getByTestId('time-engine-strip-full')).toBeInTheDocument();
    expect(screen.getByTestId('action-card')).toBeInTheDocument();
    expect(screen.getByTestId('active-hud')).toBeInTheDocument();
    expect(screen.getByTestId('clock-widget')).toBeInTheDocument();
  });

  it('applies correct data attributes for skin and pillar', () => {
    render(
      <TimeEngineStrip
        {...defaultProps}
        skinPresetId="wanderlust"
        pillar="wilderness"
      />
    );

    const wrapper = screen.getByTestId('time-engine-strip-full');
    expect(wrapper).toHaveAttribute('data-skin-preset', 'wanderlust');
    expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'wilderness');
    expect(wrapper).toHaveAttribute('data-component-theme', 'wanderlust.time.wilderness');
  });

  it('applies CSS variables from skin config', () => {
    render(<TimeEngineStrip {...defaultProps} />);

    const wrapper = screen.getByTestId('time-engine-strip-full');
    const style = wrapper.getAttribute('style');
    
    expect(style).toContain('--time-clock-face: var(colors.clock.face)');
    expect(style).toContain('--time-clock-hands: var(colors.clock.hands)');
    expect(style).toContain('--time-clock-numbers: var(colors.clock.numbers)');
    expect(style).toContain('--time-glow-color: var(effects.glow.accent)');
    expect(style).toContain('--time-glow-intensity: 0.5');
    expect(style).toContain('--time-glow-radius: 8px');
    expect(style).toContain('--time-progress-fill: var(colors.progress.fill)');
    expect(style).toContain('--time-progress-background: var(colors.progress.background)');
    expect(style).toContain('--time-progress-border: var(colors.progress.border)');
    expect(style).toContain('--time-progress-height: 4px');
    expect(style).toContain('--time-font-display: var(typography.time.display)');
    expect(style).toContain('--time-font-label: var(typography.label.primary)');
    expect(style).toContain('--time-font-caption: var(typography.caption.secondary)');
    expect(style).toContain('--time-animation-tick: var(animations.clock.tick)');
    expect(style).toContain('--time-animation-transition: var(animations.transition.smooth)');
    expect(style).toContain('--time-animation-pulse: var(animations.pulse.subtle)');
  });

  it('emits telemetry event on mount', () => {
    render(<TimeEngineStrip {...defaultProps} />);

    expect(trackTelemetryEvent).toHaveBeenCalledWith('time_engine_skin_rendered', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimalFrontier.time.raycast',
      clockStyle: 'digital',
      hasAccentGlow: true,
      isCompact: false,
      showClockDetails: false,
      maxVisibleActivities: 4,
      resourceCount: 0,
      activeActivities: 1,
    });
  });

  it('renders compact mode with skin attributes', () => {
    render(
      <TimeEngineStrip
        {...defaultProps}
        compact={true}
        skinPresetId="wanderlust"
        pillar="empire"
      />
    );

    expect(screen.getByTestId('time-engine-strip-compact')).toBeInTheDocument();
    const wrapper = screen.getByTestId('time-engine-strip-compact');
    expect(wrapper).toHaveAttribute('data-skin-preset', 'wanderlust');
    expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'empire');
    expect(wrapper).toHaveAttribute('data-component-theme', 'wanderlust.time.empire');
  });

  it('applies custom skin config overrides', () => {
    const customSkinConfig = {
      clockStyle: {
        displayMode: 'analog' as const,
        faceToken: 'colors.clock.analog-face',
        handsToken: 'colors.clock.gold-hands',
        numbersToken: 'colors.clock.roman-numerals',
      },
      accentGlow: {
        glowToken: 'effects.glow.strong',
        intensity: 0.8,
        radius: 12,
        animationToken: 'animations.glow.strong-pulse',
      },
    };

    render(
      <TimeEngineStrip
        {...defaultProps}
        skinConfig={customSkinConfig}
      />
    );

    const wrapper = screen.getByTestId('time-engine-strip-full');
    const style = wrapper.getAttribute('style');
    
    expect(style).toContain('--time-clock-face: var(colors.clock.analog-face)');
    expect(style).toContain('--time-clock-hands: var(colors.clock.gold-hands)');
    expect(style).toContain('--time-clock-numbers: var(colors.clock.roman-numerals)');
    expect(style).toContain('--time-glow-color: var(effects.glow.strong)');
    expect(style).toContain('--time-glow-intensity: 0.8');
    expect(style).toContain('--time-glow-radius: 12px');
  });

  it('handles different pillar values', () => {
    const pillars = ['frontier', 'wilderness', 'empire'] as const;
    
    pillars.forEach(pillar => {
      const { unmount } = render(
        <TimeEngineStrip
          {...defaultProps}
          pillar={pillar}
        />
      );

      expect(trackTelemetryEvent).toHaveBeenCalledWith('time_engine_skin_rendered', {
        skinPresetId: 'minimal_frontier',
        pillar,
        componentTheme: 'minimalFrontier.time.raycast',
        clockStyle: 'digital',
        hasAccentGlow: true,
        isCompact: false,
        showClockDetails: false,
        maxVisibleActivities: 4,
        resourceCount: 0,
        activeActivities: 1,
      });

      unmount();
    });
  });

  it('handles empty HUD state', () => {
    const emptyHUDState: ActiveHUDState = {
      activities: [],
      counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
      hasActiveActivities: false,
      persistence: {
        preferences: {
          collapsed: false,
          maxVisible: 4,
          sortBy: 'remaining-time',
          showTypeBadges: true,
          compactMode: false,
        },
        uiState: {
          selectedTypeFilter: 'all',
          telemetryPanelOpen: false,
          position: 'top',
        },
        metadata: {
          lastSaved: Date.now(),
          version: '1.0.0',
        },
      },
    };

    render(
      <TimeEngineStrip
        {...defaultProps}
        hudState={emptyHUDState}
      />
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('time_engine_skin_rendered', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimalFrontier.time.raycast',
      clockStyle: 'digital',
      hasAccentGlow: true,
      isCompact: false,
      showClockDetails: false,
      maxVisibleActivities: 4,
      resourceCount: 0,
      activeActivities: 0,
    });
  });

  it('handles resource summaries', () => {
    const resourceSummaries = [
      { id: 'food', label: 'Food', icon: '🍞' },
      { id: 'wood', label: 'Wood', icon: '🪵' },
    ];

    render(
      <TimeEngineStrip
        {...defaultProps}
        resourceSummaries={resourceSummaries}
      />
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('time_engine_skin_rendered', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimalFrontier.time.raycast',
      clockStyle: 'digital',
      hasAccentGlow: true,
      isCompact: false,
      showClockDetails: false,
      maxVisibleActivities: 4,
      resourceCount: 2,
      activeActivities: 1,
    });
  });
});
