/**
 * QuestRiskDisplay Component Tests
 *
 * Comprehensive test suite for the Quest Risk Display component with polygon stripes.
 * Tests rendering, interactions, telemetry, and accessibility features.
 *
 * @since IV-QuestRisk-stripes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestRiskDisplay from '@/ui/idleVillage/components/QuestRiskDisplay';
import {
  DEFAULT_RISK_DISPLAY_CONFIG,
  calculateStripeLength,
  shouldShowRiskStripes,
  calculateRiskLevel,
  generatePolygonPoints,
} from '@/balancing/config/idleVillage/riskDisplayConfig';

// Mock diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    log: vi.fn(),
  })),
}));

describe('QuestRiskDisplay Component', () => {
  let mockOnStripeClick: ReturnType<typeof vi.fn>;
  let mockOnTelemetry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnStripeClick = vi.fn();
    mockOnTelemetry = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render polygon with stripes for high risk', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-1"
          injuryPercentage={75}
          deathPercentage={45}
          onStripeClick={mockOnStripeClick}
          onTelemetry={mockOnTelemetry}
        />
      );

      // Should render SVG
      const svg = screen.getByTestId('quest-risk-display');
      expect(svg).toBeTruthy();
      expect(svg.tagName).toBe('svg');

      // Should show risk level indicator
      expect(screen.getByText('HIGH')).toBeTruthy();

      // Should render stripes
      expect(screen.getByTestId('injury-stripe')).toBeTruthy();
      expect(screen.getByTestId('death-stripe')).toBeTruthy();
    });

    it('should render "No Risk" for zero risk', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-2"
          injuryPercentage={0}
          deathPercentage={0}
          onStripeClick={mockOnStripeClick}
        />
      );

      expect(screen.getByText('No Risk')).toBeTruthy();
      expect(screen.queryByTestId('injury-stripe')).toBeFalsy();
      expect(screen.queryByTestId('death-stripe')).toBeFalsy();
    });

    it('should render polygon background correctly', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-3"
          injuryPercentage={30}
          deathPercentage={15}
        />
      );

      const polygon = screen.getByTestId('quest-risk-display').querySelector('polygon');
      expect(polygon).toBeTruthy();
      expect(polygon?.getAttribute('fill')).toBe(DEFAULT_RISK_DISPLAY_CONFIG.colors.backgroundColor);
    });
  });

  describe('Risk Level Calculation', () => {
    it('should display LOW for low risk', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-low"
          injuryPercentage={5}
          deathPercentage={3}
        />
      );

      expect(screen.getByText('LOW')).toBeTruthy();
    });

    it('should display MED for medium risk', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-med"
          injuryPercentage={20}
          deathPercentage={15}
        />
      );

      expect(screen.getByText('MED')).toBeTruthy();
    });

    it('should display HIGH for high risk', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-high"
          injuryPercentage={60}
          deathPercentage={40}
        />
      );

      expect(screen.getByText('HIGH')).toBeTruthy();
    });
  });

  describe('Stripe Interactions', () => {
    it('should call onStripeClick when injury stripe is clicked', async () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-click"
          injuryPercentage={50}
          deathPercentage={25}
          onStripeClick={mockOnStripeClick}
        />
      );

      const injuryStripe = screen.getByTestId('injury-stripe');
      fireEvent.click(injuryStripe);

      expect(mockOnStripeClick).toHaveBeenCalledWith('injury', 50);
    });

    it('should call onStripeClick when death stripe is clicked', async () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-click"
          injuryPercentage={50}
          deathPercentage={25}
          onStripeClick={mockOnStripeClick}
        />
      );

      const deathStripe = screen.getByTestId('death-stripe');
      fireEvent.click(deathStripe);

      expect(mockOnStripeClick).toHaveBeenCalledWith('death', 25);
    });

    it('should emit telemetry events on stripe clicks', async () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-telemetry"
          injuryPercentage={50}
          deathPercentage={25}
          onStripeClick={mockOnStripeClick}
          onTelemetry={mockOnTelemetry}
        />
      );

      const injuryStripe = screen.getByTestId('injury-stripe');
      fireEvent.click(injuryStripe);

      expect(mockOnTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quest_risk_stripe_click',
          questId: 'test-quest-telemetry',
          data: expect.objectContaining({
            stripeType: 'injury',
            percentage: 50,
            riskLevel: 'HIGH',
          }),
        })
      );
    });
  });

  describe('Configuration', () => {
    it('should use test config when testMode is true', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-testmode"
          injuryPercentage={30}
          deathPercentage={15}
          testMode={true}
        />
      );

      // Test mode should disable animations
      const svg = screen.getByTestId('quest-risk-display');
      expect(svg.style.transition).toBe('');
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        ...DEFAULT_RISK_DISPLAY_CONFIG,
        colors: {
          ...DEFAULT_RISK_DISPLAY_CONFIG.colors,
          injuryColor: 'rgb(255, 0, 0)', // Red instead of amber
        },
      };

      render(
        <QuestRiskDisplay
          questId="test-quest-custom"
          injuryPercentage={50}
          deathPercentage={25}
          config={customConfig}
        />
      );

      // Custom config should be applied
      const injuryStripe = screen.getByTestId('injury-stripe');
      expect(injuryStripe.getAttribute('fill')).toBe('rgb(255, 0, 0)');
    });
  });

  describe('Percentage Labels', () => {
    it('should show percentage labels for high values', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-labels"
          injuryPercentage={80}
          deathPercentage={60}
        />
      );

      expect(screen.getByText('80%')).toBeTruthy();
      expect(screen.getByText('60%')).toBeTruthy();
    });

    it('should hide percentage labels for low values', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-no-labels"
          injuryPercentage={2}
          deathPercentage={1}
        />
      );

      expect(screen.queryByText('2%')).toBeFalsy();
      expect(screen.queryByText('1%')).toBeFalsy();
    });
  });

  describe('Data Attributes', () => {
    it('should set correct data attributes', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-data"
          injuryPercentage={45}
          deathPercentage={30}
          data-testid="custom-test-id"
        />
      );

      const container = screen.getByTestId('custom-test-id');
      expect(container.getAttribute('data-quest-id')).toBe('test-quest-data');
      expect(container.getAttribute('data-injury-pct')).toBe('45');
      expect(container.getAttribute('data-death-pct')).toBe('30');
      expect(container.getAttribute('data-risk-level')).toBe('HIGH');
      expect(container.getAttribute('data-show-stripes')).toBe('true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-a11y"
          injuryPercentage={50}
          deathPercentage={25}
        />
      );

      // SVG should be accessible
      const svg = screen.getByTestId('quest-risk-display');
      expect(svg.getAttribute('role')).toBeFalsy(); // SVG doesn't need role by default

      // Stripes should be focusable and have proper labels
      const injuryStripe = screen.getByTestId('injury-stripe');
      expect(injuryStripe.getAttribute('data-stripe-type')).toBe('injury');
      expect(injuryStripe.getAttribute('data-stripe-percentage')).toBe('50');
    });
  });

  describe('Animation and Hover Effects', () => {
    it('should apply hover effects when enabled', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-hover"
          injuryPercentage={50}
          deathPercentage={25}
        />
      );

      const injuryStripe = screen.getByTestId('injury-stripe');
      expect(injuryStripe.className).toContain('hover:opacity-80');
      expect(injuryStripe.className).toContain('hover:scale-105');
    });

    it('should disable animations in test mode', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-no-animation"
          injuryPercentage={50}
          deathPercentage={25}
          testMode={true}
        />
      );

      const svg = screen.getByTestId('quest-risk-display');
      expect(svg.style.transition).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero percentages', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-zero"
          injuryPercentage={0}
          deathPercentage={0}
        />
      );

      expect(screen.getByText('No Risk')).toBeTruthy();
      expect(screen.queryByTestId('injury-stripe')).toBeFalsy();
      expect(screen.queryByTestId('death-stripe')).toBeFalsy();
    });

    it('should handle maximum percentages', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-max"
          injuryPercentage={100}
          deathPercentage={100}
        />
      );

      expect(screen.getByText('HIGH')).toBeTruthy();
      // Stripes should be at maximum length
    });

    it('should handle negative percentages (clamp to 0)', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-negative"
          injuryPercentage={-10}
          deathPercentage={-5}
        />
      );

      expect(screen.getByText('No Risk')).toBeTruthy();
    });

    it('should handle very small but valid percentages', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-small"
          injuryPercentage={0.5}
          deathPercentage={0.3}
        />
      );

      // Should show stripes for minimal risk when configured to do so
      // (depending on minRiskThreshold setting)
      expect(screen.getByText('LOW')).toBeTruthy();
    });
  });

  describe('Telemetry Integration', () => {
    it('should emit render telemetry event', async () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-render-telemetry"
          injuryPercentage={50}
          deathPercentage={25}
          onTelemetry={mockOnTelemetry}
        />
      );

      await waitFor(() => {
        expect(mockOnTelemetry).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'quest_risk_render',
            questId: 'test-quest-render-telemetry',
            data: expect.objectContaining({
              injuryPercentage: 50,
              deathPercentage: 25,
              riskLevel: 'HIGH',
              stripesVisible: true,
            }),
          })
        );
      });
    });

    it('should not emit telemetry when disabled', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-no-telemetry"
          injuryPercentage={50}
          deathPercentage={25}
          testMode={true}
          onTelemetry={mockOnTelemetry}
        />
      );

      expect(mockOnTelemetry).not.toHaveBeenCalled();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(
        <QuestRiskDisplay
          questId="test-quest-custom-class"
          injuryPercentage={30}
          deathPercentage={15}
          className="custom-risk-class"
        />
      );

      const container = screen.getByTestId('quest-risk-display').parentElement;
      expect(container?.className).toContain('custom-risk-class');
    });
  });
});
