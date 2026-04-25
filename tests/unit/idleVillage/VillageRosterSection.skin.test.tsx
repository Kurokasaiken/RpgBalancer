import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { VillageRosterSectionSkin } from '../../../src/ui/idleVillage/components/VillageRosterSectionSkin';
import { trackTelemetryEvent } from '../../../src/analytics/telemetry/telemetryProvider';
import type { ResidentState } from '../../../src/engine/game/idleVillage/TimeEngine';
import type { StyleLabPillar } from '../../../src/ui/styleLab/config/demoConfig';

// Mock the telemetry provider
vi.mock('../../../src/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock the base VillageRosterSection component
vi.mock('../../../src/ui/idleVillage/components/VillageRosterSection', () => ({
  VillageRosterSection: ({ residents, controls, ...props }: any) => (
    <section data-testid="village-roster-section" {...props}>
      {controls}
      <div data-testid="resident-count">{residents.length}</div>
    </section>
  ),
}));

// Mock the skin config
vi.mock('../../../src/ui/idleVillage/skins/rosterSkinConfig', () => ({
  createRosterSkinConfig: vi.fn((presetId: string, pillar: string) => ({
    skinPresetId: presetId,
    pillar,
    componentTheme: `${presetId}.roster.${pillar}`,
    frame: {
      borderToken: 'colors.border.default',
      backgroundToken: 'colors.background.primary',
      shadowToken: 'shadows.panel.soft',
      radiusToken: 'borderRadius.panel.default',
    },
    typography: {
      headingToken: 'typography.heading.panel',
      bodyToken: 'typography.body.primary',
      captionToken: 'typography.caption.secondary',
    },
    spacing: {
      containerPadding: 'spacing.panel.padding',
      sectionSpacing: 'spacing.panel.section',
      itemSpacing: 'spacing.panel.item',
    },
    effects: {
      glowToken: 'effects.glow.subtle',
      hoverToken: 'effects.hover.panel',
      focusToken: 'effects.focus.default',
    },
  })),
}));

describe('VillageRosterSectionSkin', () => {
  const mockResidents: ResidentState[] = [
    {
      id: 'resident-1',
      name: 'Test Resident',
      status: 'active',
      fatigue: 0,
      currentHp: 100,
      maxHp: 100,
      stats: { hp: 100, attack: 10, defense: 5 },
      position: { x: 0, y: 0 },
      isActive: true,
      assignmentId: undefined,
      locationId: 'test-location',
      isHero: false,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
    } as unknown as ResidentState,
  ];

  const defaultProps = {
    residents: mockResidents,
    componentId: 'test-roster',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default skin preset', () => {
    render(<VillageRosterSectionSkin {...defaultProps} />);
    
    expect(screen.getByTestId('village-roster-section-skin')).toBeInTheDocument();
    expect(screen.getByTestId('village-roster-section')).toBeInTheDocument();
    expect(screen.getByTestId('resident-count')).toHaveTextContent('1');
  });

  it('applies correct data attributes for skin and pillar', () => {
    render(
      <VillageRosterSectionSkin
        {...defaultProps}
        skinPresetId="wanderlust"
        pillar="wilderness"
      />
    );

    const wrapper = screen.getByTestId('village-roster-section-skin');
    expect(wrapper).toHaveAttribute('data-skin-preset', 'wanderlust');
    expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'wilderness');
    expect(wrapper).toHaveAttribute('data-component-theme', 'wanderlust.roster.wilderness');
  });

  it('applies CSS variables from skin config', () => {
    render(<VillageRosterSectionSkin {...defaultProps} />);

    const wrapper = screen.getByTestId('village-roster-section-skin');
    const style = wrapper.getAttribute('style');
    
    expect(style).toContain('--roster-border: var(colors.border.default)');
    expect(style).toContain('--roster-background: var(colors.background.primary)');
    expect(style).toContain('--roster-shadow: var(shadows.panel.soft)');
    expect(style).toContain('--roster-radius: var(borderRadius.panel.default)');
    expect(style).toContain('--roster-heading-font: var(typography.heading.panel)');
    expect(style).toContain('--roster-body-font: var(typography.body.primary)');
    expect(style).toContain('--roster-caption-font: var(typography.caption.secondary)');
    expect(style).toContain('--roster-container-padding: var(spacing.panel.padding)');
    expect(style).toContain('--roster-section-spacing: var(spacing.panel.section)');
    expect(style).toContain('--roster-item-spacing: var(spacing.panel.item)');
    expect(style).toContain('--roster-glow: var(effects.glow.subtle)');
    expect(style).toContain('--roster-hover: var(effects.hover.panel)');
    expect(style).toContain('--roster-focus: var(effects.focus.default)');
  });

  it('forwards all props to base component', () => {
    const mockOnDragStart = vi.fn();
    const mockOnResidentSelect = vi.fn();
    const controls = <div data-testid="custom-controls">Controls</div>;

    render(
      <VillageRosterSectionSkin
        {...defaultProps}
        onDragStart={mockOnDragStart}
        onResidentSelect={mockOnResidentSelect}
        controls={controls}
        isDayPhase={false}
        pgCardSkinId="test-skin"
        pillar="empire"
        context={{
          locationType: 'test',
          residentType: 'worker',
          scenarioType: 'combat',
        }}
      />
    );

    expect(screen.getByTestId('custom-controls')).toBeInTheDocument();
    expect(screen.getByTestId('village-roster-section')).toBeInTheDocument();
  });

  it('emits telemetry event on mount', () => {
    render(<VillageRosterSectionSkin {...defaultProps} />);

    expect(trackTelemetryEvent).toHaveBeenCalledWith('village_roster_skin_rendered', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimal_frontier.roster.frontier',
      residentCount: 1,
      componentId: 'test-roster',
      hasControls: false,
      hasAssignmentFeedback: false,
      isDayPhase: true,
      context: undefined,
    });
  });

  it('emits telemetry event with custom skin config', () => {
    const customSkinConfig = {
      frame: {
        borderToken: 'colors.border.accent',
        backgroundToken: 'colors.background.secondary',
        shadowToken: 'shadows.panel.strong',
        radiusToken: 'borderRadius.panel.large',
      },
    };

    render(
      <VillageRosterSectionSkin
        {...defaultProps}
        skinPresetId="wanderlust"
        pillar="wilderness"
        skinConfig={customSkinConfig}
      />
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('village_roster_skin_rendered', {
      skinPresetId: 'wanderlust',
      pillar: 'wilderness',
      componentTheme: 'wanderlust.roster.wilderness',
      residentCount: 1,
      componentId: 'test-roster',
      hasControls: false,
      hasAssignmentFeedback: false,
      isDayPhase: true,
      context: undefined,
    });
  });

  it('applies custom skin config overrides', () => {
    const customSkinConfig = {
      frame: {
        borderToken: 'colors.border.accent',
        backgroundToken: 'colors.background.secondary',
        shadowToken: 'shadows.panel.strong',
        radiusToken: 'borderRadius.panel.large',
      },
    };

    render(
      <VillageRosterSectionSkin
        {...defaultProps}
        skinConfig={customSkinConfig}
      />
    );

    const wrapper = screen.getByTestId('village-roster-section-skin');
    const style = wrapper.getAttribute('style');
    
    expect(style).toContain('--roster-border: var(colors.border.accent)');
    expect(style).toContain('--roster-background: var(colors.background.secondary)');
    expect(style).toContain('--roster-shadow: var(shadows.panel.strong)');
    expect(style).toContain('--roster-radius: var(borderRadius.panel.large)');
  });

  it('handles empty residents array', () => {
    render(<VillageRosterSectionSkin {...defaultProps} residents={[]} />);

    expect(trackTelemetryEvent).toHaveBeenCalledWith('village_roster_skin_rendered', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimal_frontier.roster.frontier',
      residentCount: 0,
      componentId: 'test-roster',
      hasControls: false,
      hasAssignmentFeedback: false,
      isDayPhase: true,
      context: undefined,
    });
  });

  it('handles assignment feedback', () => {
    render(
      <VillageRosterSectionSkin
        {...defaultProps}
        assignmentFeedback="Test feedback"
      />
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith('village_roster_skin_rendered', {
      skinPresetId: 'minimal_frontier',
      pillar: 'frontier',
      componentTheme: 'minimal_frontier.roster.frontier',
      residentCount: 1,
      componentId: 'test-roster',
      hasControls: false,
      hasAssignmentFeedback: true,
      isDayPhase: true,
      context: undefined,
    });
  });

  it('handles different pillar values', () => {
    const pillars: StyleLabPillar[] = ['frontier', 'wilderness', 'empire'];
    
    pillars.forEach(pillar => {
      const { unmount } = render(
        <VillageRosterSectionSkin
          {...defaultProps}
          pillar={pillar}
        />
      );

      expect(trackTelemetryEvent).toHaveBeenCalledWith('village_roster_skin_rendered', {
        skinPresetId: 'minimal_frontier',
        pillar,
        componentTheme: `minimal_frontier.roster.${pillar}`,
        residentCount: 1,
        componentId: 'test-roster',
        hasControls: false,
        hasAssignmentFeedback: false,
        isDayPhase: true,
        context: undefined,
      });

      unmount();
    });
  });
});
