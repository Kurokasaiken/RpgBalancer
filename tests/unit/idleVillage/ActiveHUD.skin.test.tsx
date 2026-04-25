import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ActiveHUD from '../../../src/ui/idleVillage/components/ActiveHUD';
import { trackTelemetryEvent } from '../../../src/analytics/telemetry/telemetryProvider';
import type { ActiveHUDState } from '../../../src/ui/idleVillage/hooks/useActiveHUDState';
import { DEFAULT_HUD_PERSISTENCE_STATE } from '../../../src/ui/idleVillage/utils/hudPersistence';

// Mock the telemetry provider
vi.mock('../../../src/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock the skin config
vi.mock('../../../src/ui/idleVillage/skins/activeHUDSkinConfig', () => ({
  createActiveHUDSkinConfig: vi.fn((presetId: string, pillar: string) => ({
    skinPresetId: presetId,
    pillar,
    componentTheme: presetId === 'minimal_frontier' ? 'minimalFrontier.hud.line' : `${presetId}.hud.${pillar}`,
    valueChangeConfig: {
      animationType: 'pulse',
      duration: 300,
      easing: 'ease-out',
      positiveColorToken: 'colors.value.positive',
      negativeColorToken: 'colors.value.negative',
    },
    colors: {
      backgroundToken: 'colors.hud.background',
      borderToken: 'colors.hud.border',
      textToken: 'colors.hud.text',
      accentToken: 'colors.hud.accent',
      successToken: 'colors.status.success',
      warningToken: 'colors.status.warning',
      errorToken: 'colors.status.error',
    },
    typography: {
      titleFont: 'typography.hud.title',
      labelFont: 'typography.hud.label',
      valueFont: 'typography.hud.value',
      captionFont: 'typography.hud.caption',
    },
    spacing: {
      containerPadding: 'spacing.hud.container',
      itemSpacing: 'spacing.hud.item',
      sectionSpacing: 'spacing.hud.section',
    },
    effects: {
      glowToken: 'effects.hud.glow',
      shadowToken: 'effects.shadow.soft',
      blurToken: 'effects.blur.subtle',
    },
  })),
}));

// Mock the activity telemetry hooks
vi.mock('../../../src/ui/idleVillage/hooks/useActivityTelemetry', () => ({
  useActivityTelemetry: vi.fn(),
}));

vi.mock('../../../src/ui/idleVillage/hooks/useActiveHUDTelemetry', () => ({
  useActiveHUDTelemetry: vi.fn(),
}));

vi.mock('../../../src/ui/idleVillage/hooks/useActivityAnalytics', () => ({
  useActivityAnalytics: vi.fn(() => ({
    metrics: { efficiency: 0.85, throughput: 2.3 },
    isCollecting: true,
  })),
}));

vi.mock('../../../src/ui/idleVillage/hooks/useActiveHUDHaptics', () => ({
  useActiveHUDHaptics: vi.fn(() => ({
    triggerHaptic: vi.fn(),
    isHapticsAvailable: true,
  })),
}));

describe('ActiveHUD Skin', () => {
  const mockHUDState: ActiveHUDState = {
    activities: [
      {
        key: 'test-activity-1',
        activityType: 'job',
        label: 'Test Job',
        icon: 'job-icon',
        residentId: 'resident-1',
        residentName: 'Test Resident',
        progress: 0.5,
        remainingSeconds: 300,
        status: 'running',
        visualVariant: 'azure',
        scheduledId: 'scheduled-1',
        activityId: 'activity-1',
      },
      {
        key: 'test-activity-2',
        activityType: 'quest',
        label: 'Test Quest',
        icon: 'quest-icon',
        residentId: 'resident-2',
        residentName: 'Another Resident',
        progress: 0.75,
        remainingSeconds: 150,
        status: 'running',
        visualVariant: 'ember',
        scheduledId: 'scheduled-2',
        activityId: 'activity-2',
      },
    ],
    counts: { jobs: 1, quests: 1, maintenance: 0, total: 2 },
    hasActiveActivities: true,
    persistence: DEFAULT_HUD_PERSISTENCE_STATE,
  };

  const defaultProps = {
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
    enableTelemetry: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default skin preset', () => {
    render(<ActiveHUD {...defaultProps} />);
    
    expect(screen.getByTestId('active-hud')).toBeInTheDocument();
    expect(screen.getByText('Active Activities')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('applies correct data attributes for skin and pillar', () => {
    render(
      <ActiveHUD
        {...defaultProps}
        skinPresetId="wanderlust"
        pillar="wilderness"
      />
    );

    const wrapper = screen.getByTestId('active-hud');
    expect(wrapper).toHaveAttribute('data-skin-preset', 'wanderlust');
    expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'wilderness');
    expect(wrapper).toHaveAttribute('data-component-theme', 'wanderlust.hud.wilderness');
  });

  it('applies CSS variables from skin config', () => {
    render(<ActiveHUD {...defaultProps} />);

    const wrapper = screen.getByTestId('active-hud');
    const style = wrapper.getAttribute('style');
    
    expect(style).toContain('--hud-background: var(colors.hud.background)');
    expect(style).toContain('--hud-border: var(colors.hud.border)');
    expect(style).toContain('--hud-text: var(colors.hud.text)');
    expect(style).toContain('--hud-accent: var(colors.hud.accent)');
    expect(style).toContain('--hud-success: var(colors.status.success)');
    expect(style).toContain('--hud-warning: var(colors.status.warning)');
    expect(style).toContain('--hud-error: var(colors.status.error)');
    expect(style).toContain('--hud-title-font: var(typography.hud.title)');
    expect(style).toContain('--hud-label-font: var(typography.hud.label)');
    expect(style).toContain('--hud-value-font: var(typography.hud.value)');
    expect(style).toContain('--hud-caption-font: var(typography.hud.caption)');
    expect(style).toContain('--hud-container-padding: var(spacing.hud.container)');
    expect(style).toContain('--hud-item-spacing: var(spacing.hud.item)');
    expect(style).toContain('--hud-section-spacing: var(spacing.hud.section)');
    expect(style).toContain('--hud-glow: var(effects.hud.glow)');
    expect(style).toContain('--hud-shadow: var(effects.shadow.soft)');
    expect(style).toContain('--hud-blur: var(effects.blur.subtle)');
  });

  it('emits telemetry event on mount', () => {
    render(<ActiveHUD {...defaultProps} />);

    expect(trackTelemetryEvent).toHaveBeenCalledWith('active_hud_value_change', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimalFrontier.hud.line',
      valueChangeAnimation: 'pulse',
      variant: 'default',
      maxVisible: undefined,
      activeCount: 2,
      hasCrewHUD: false,
    });
  });

  it('renders compact variant with skin attributes', () => {
    render(
      <ActiveHUD
        {...defaultProps}
        variant="compact"
        skinPresetId="wanderlust"
        pillar="empire"
      />
    );

    expect(screen.getByText('Mission Log')).toBeInTheDocument();
    const wrapper = screen.getByTestId('active-hud');
    expect(wrapper).toHaveAttribute('data-skin-preset', 'wanderlust');
    expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'empire');
    expect(wrapper).toHaveAttribute('data-component-theme', 'wanderlust.hud.empire');
  });

  it('applies custom skin config overrides', () => {
    const customSkinConfig = {
      valueChangeConfig: {
        animationType: 'slide' as const,
        duration: 500,
        easing: 'ease-in-out',
        positiveColorToken: 'colors.value.bright-positive',
        negativeColorToken: 'colors.value.bright-negative',
      },
      colors: {
        backgroundToken: 'colors.hud.dark-background',
        borderToken: 'colors.hud.bright-border',
        textToken: 'colors.hud.bright-text',
        accentToken: 'colors.hud.bright-accent',
        successToken: 'colors.status.bright-success',
        warningToken: 'colors.status.bright-warning',
        errorToken: 'colors.status.bright-error',
      },
    };

    render(
      <ActiveHUD
        {...defaultProps}
        skinConfig={customSkinConfig}
      />
    );

    const wrapper = screen.getByTestId('active-hud');
    const style = wrapper.getAttribute('style');
    
    expect(style).toContain('--hud-background: var(colors.hud.dark-background)');
    expect(style).toContain('--hud-border: var(colors.hud.bright-border)');
    expect(style).toContain('--hud-text: var(colors.hud.bright-text)');
    expect(style).toContain('--hud-accent: var(colors.hud.bright-accent)');
  });

  it('handles empty HUD state with skin attributes', () => {
    const emptyHUDState: ActiveHUDState = {
      activities: [],
      counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
      hasActiveActivities: false,
      persistence: DEFAULT_HUD_PERSISTENCE_STATE,
    };

    render(
      <ActiveHUD
        {...defaultProps}
        hudState={emptyHUDState}
        skinPresetId="wanderlust"
        pillar="wilderness"
      />
    );

    expect(screen.getByText('Nessuna attività in corso')).toBeInTheDocument();
    const wrapper = screen.getByTestId('active-hud');
    expect(wrapper).toHaveAttribute('data-skin-preset', 'wanderlust');
    expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'wilderness');
    expect(wrapper).toHaveAttribute('data-component-theme', 'wanderlust.hud.wilderness');
  });

  it('handles different pillar values', () => {
    const pillars = ['frontier', 'wilderness', 'empire'] as const;
    
    pillars.forEach(pillar => {
      const { unmount } = render(
        <ActiveHUD
          {...defaultProps}
          pillar={pillar}
        />
      );

      expect(trackTelemetryEvent).toHaveBeenCalledWith('active_hud_value_change', {
        skinPresetId: 'minimal_frontier',
        pillar,
        componentTheme: 'minimalFrontier.hud.line',
        valueChangeAnimation: 'pulse',
        variant: 'default',
        maxVisible: undefined,
        activeCount: 2,
        hasCrewHUD: false,
      });

      unmount();
    });
  });

  it('handles maxVisible prop', () => {
    render(
      <ActiveHUD
        {...defaultProps}
        maxVisible={1}
      />
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('active_hud_value_change', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimalFrontier.hud.line',
      valueChangeAnimation: 'pulse',
      variant: 'default',
      maxVisible: 1,
      activeCount: 2,
      hasCrewHUD: false,
    });
  });

  it('handles crew HUD state', () => {
    const mockCrewHUDState = {
      crewMembers: [],
      crewCapacity: 5,
      crewEfficiency: 0.8,
      crewEntries: [],
    };

    render(
      <ActiveHUD
        {...defaultProps}
        crewHUDState={mockCrewHUDState as any}
      />
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('active_hud_value_change', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimalFrontier.hud.line',
      valueChangeAnimation: 'pulse',
      variant: 'default',
      maxVisible: undefined,
      activeCount: 2,
      hasCrewHUD: true,
    });
  });

  it('respects motion level tokens', () => {
    const customSkinConfig = {
      valueChangeConfig: {
        animationType: 'none' as const,
        duration: 0,
        easing: 'linear',
        positiveColorToken: 'colors.value.positive',
        negativeColorToken: 'colors.value.negative',
      },
    };

    render(
      <ActiveHUD
        {...defaultProps}
        skinConfig={customSkinConfig}
      />
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('active_hud_value_change', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimalFrontier.hud.line',
      valueChangeAnimation: 'none',
      variant: 'default',
      maxVisible: undefined,
      activeCount: 2,
      hasCrewHUD: false,
    });
  });
});
