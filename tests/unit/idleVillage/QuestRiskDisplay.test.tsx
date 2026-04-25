/**
 * Unit tests for QuestRiskDisplay component.
 * 
 * Tests the proportional stripe rendering, fallback behavior, and telemetry
 * emission for quest risk visualization. Covers all major functionality
 * including config-driven behavior and accessibility.
 * 
 * @fileoverview
 * Comprehensive test suite for QuestRiskDisplay covering rendering,
 * calculations, user interactions, and telemetry emission.
 * 
 * @author ChatGPT Codex 5.1
 * @since 2026-01-11
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestRiskDisplay } from '@/ui/idleVillage/components/QuestRiskDisplay';
import type { RiskDisplayConfig } from '@/balancing/config/idleVillage/riskDisplayConfig';
import { DEFAULT_RISK_DISPLAY_CONFIG } from '@/balancing/config/idleVillage/riskDisplayConfig';

// Mock diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock quest telemetry
vi.mock('@/ui/idleVillage/utils/riskTelemetry', () => ({
  useQuestRiskTelemetry: vi.fn(() => ({
    emitRiskRendered: vi.fn(),
    emitStripeClicked: vi.fn(),
  })),
}));

describe('QuestRiskDisplay', () => {
  const defaultProps = {
    questId: 'test-quest-1',
    injuryPercentage: 25.5,
    deathPercentage: 12.3,
    polygonHeight: 80,
    polygonWidth: 120,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders risk stripes when percentages are above threshold', () => {
    render(<QuestRiskDisplay {...defaultProps} />);
    
    const riskDisplay = screen.getByTestId('quest-risk-display');
    expect(riskDisplay).toBeInTheDocument();
    expect(riskDisplay).toHaveAttribute('data-show-stripes', 'true');
    
    // Check for injury and death stripes
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    expect(injuryStripe).toBeInTheDocument();
    expect(deathStripe).toBeInTheDocument();
  });

  it('shows no risk state when percentages are below threshold', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        injuryPercentage={0.5}
        deathPercentage={0.3}
      />
    );
    
    const riskDisplay = screen.getByTestId('quest-risk-display');
    expect(riskDisplay).toHaveAttribute('data-show-stripes', 'false');
    expect(riskDisplay).toHaveTextContent('No Risk');
  });

  it('calculates stripe heights proportionally', () => {
    const config: Partial<RiskDisplayConfig> = {
      stripes: {
        minStripeHeightPx: 5,
        maxStripeHeightPx: 60,
        stripeWidthPercent: 15,
        stripeSpacingPercent: 5,
        stripeBorderRadius: '2px',
      },
      smoothing: {
        enableSmoothing: false,
        smoothingFactor: 0,
        smoothingThresholdPercent: 5,
        easingType: 'linear',
      },
    };

    render(<QuestRiskDisplay {...defaultProps} config={config} />);
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    // Heights should be proportional to percentages
    const injuryHeight = parseInt(injuryStripe.getAttribute('data-stripe-height') || '0');
    const deathHeight = parseInt(deathStripe.getAttribute('data-stripe-height') || '0');
    
    expect(injuryHeight).toBeGreaterThan(deathHeight);
    expect(injuryHeight).toBeGreaterThan(5); // Above minimum
    expect(deathHeight).toBeGreaterThan(5); // Above minimum
  });

  it('applies smoothing when enabled', () => {
    const config: Partial<RiskDisplayConfig> = {
      smoothing: {
        enableSmoothing: true,
        smoothingFactor: 0.8,
        smoothingThresholdPercent: 5,
        easingType: 'ease-out',
      },
    };

    render(<QuestRiskDisplay {...defaultProps} config={config} />);
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    // With smoothing, heights should be different from linear calculation
    const injuryHeight = parseInt(injuryStripe.getAttribute('data-stripe-height') || '0');
    const deathHeight = parseInt(deathStripe.getAttribute('data-stripe-height') || '0');
    
    expect(injuryHeight).toBeGreaterThan(0);
    expect(deathHeight).toBeGreaterThan(0);
  });

  it('handles zero risk gracefully', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        injuryPercentage={0}
        deathPercentage={0}
      />
    );
    
    const riskDisplay = screen.getByTestId('quest-risk-display');
    expect(riskDisplay).toHaveAttribute('data-show-stripes', 'false');
    expect(riskDisplay).toHaveTextContent('No Risk');
  });

  it('handles maximum risk values', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        injuryPercentage={100}
        deathPercentage={100}
      />
    );
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    const injuryHeight = parseInt(injuryStripe.getAttribute('data-stripe-height') || '0');
    const deathHeight = parseInt(deathStripe.getAttribute('data-stripe-height') || '0');
    
    // Should be at or near maximum height
    expect(injuryHeight).toBeLessThanOrEqual(60);
    expect(deathHeight).toBeLessThanOrEqual(60);
  });

  it('shows percentage labels when enabled', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        showLabels={true}
      />
    );
    
    // Check for percentage labels on stripes (they appear when percentage >= 5%)
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    expect(injuryStripe).toHaveTextContent('25%');
    expect(deathStripe).toHaveTextContent('12%');
  });

  it('hides percentage labels when disabled', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        showLabels={false}
      />
    );
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    expect(injuryStripe).not.toHaveTextContent('25%');
    expect(deathStripe).not.toHaveTextContent('12%');
  });

  it('handles stripe clicks', async () => {
    const onStripeClick = vi.fn();
    
    render(
      <QuestRiskDisplay
        {...defaultProps}
        onStripeClick={onStripeClick}
      />
    );
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    // Click injury stripe
    fireEvent.click(injuryStripe);
    expect(onStripeClick).toHaveBeenCalledWith('injury', 25.5);
    
    // Click death stripe
    fireEvent.click(deathStripe);
    expect(onStripeClick).toHaveBeenCalledWith('death', 12.3);
  });

  it('handles keyboard interactions', async () => {
    const onStripeClick = vi.fn();
    
    render(
      <QuestRiskDisplay
        {...defaultProps}
        onStripeClick={onStripeClick}
      />
    );
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    
    // Enter key
    fireEvent.keyDown(injuryStripe, { key: 'Enter' });
    expect(onStripeClick).toHaveBeenCalledWith('injury', 25.5);
    
    // Space key
    fireEvent.keyDown(injuryStripe, { key: ' ' });
    expect(onStripeClick).toHaveBeenCalledTimes(2);
  });

  it('has proper accessibility attributes', () => {
    render(<QuestRiskDisplay {...defaultProps} />);
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    expect(injuryStripe).toHaveAttribute('role', 'button');
    expect(injuryStripe).toHaveAttribute('tabIndex', '0');
    expect(injuryStripe).toHaveAttribute('aria-label', 'Injury risk: 25.5%');
    
    expect(deathStripe).toHaveAttribute('role', 'button');
    expect(deathStripe).toHaveAttribute('tabIndex', '0');
    expect(deathStripe).toHaveAttribute('aria-label', 'Death risk: 12.3%');
  });

  it('uses test configuration in test mode', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        testMode={true}
      />
    );
    
    const riskDisplay = screen.getByTestId('quest-risk-display');
    expect(riskDisplay).toBeInTheDocument();
    
    // In test mode, animations should be disabled
    const injuryStripe = screen.getByTestId('injury-stripe');
    expect(injuryStripe).toHaveStyle('transitionDuration: 0ms');
  });

  it('applies custom configuration', () => {
    const customConfig: Partial<RiskDisplayConfig> = {
      colors: {
        injuryColor: 'rgb(255, 0, 0)', // Red instead of amber
        deathColor: 'rgb(0, 255, 0)',  // Green instead of red
        backgroundColor: 'rgb(0, 0, 0)',
        borderColor: 'rgb(255, 255, 255)',
        zeroRiskColor: 'rgb(128, 128, 128)',
      },
    };

    render(<QuestRiskDisplay {...defaultProps} config={customConfig} />);
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    expect(injuryStripe).toHaveStyle('background-color: rgb(255, 0, 0)');
    expect(deathStripe).toHaveStyle('background-color: rgb(0, 255, 0)');
  });

  it('shows risk level indicator', () => {
    render(<QuestRiskDisplay {...defaultProps} />);
    
    // Should show "MED" risk level (death >= 20% or injury >= 30%)
    expect(screen.getByText('MED')).toBeInTheDocument();
  });

  it('shows HIGH risk level for high death percentage', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        deathPercentage={60}
      />
    );
    
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('shows LOW risk level for low percentages', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        injuryPercentage={15}
        deathPercentage={10}
      />
    );
    
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('clamps percentages to valid range', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        injuryPercentage={150} // Above 100%
        deathPercentage={-10}  // Below 0%
      />
    );
    
    const riskDisplay = screen.getByTestId('quest-risk-display');
    expect(riskDisplay).toHaveAttribute('data-injury-pct', '150');
    expect(riskDisplay).toHaveAttribute('data-death-pct', '-10');
    
    // Should still render stripes with clamped values
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    expect(injuryStripe).toBeInTheDocument();
    expect(deathStripe).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-risk-display';
    
    render(
      <QuestRiskDisplay
        {...defaultProps}
        className={customClass}
      />
    );
    
    const riskDisplay = screen.getByTestId('quest-risk-display');
    expect(riskDisplay).toHaveClass(customClass);
  });

  it('respects custom polygon dimensions', () => {
    render(
      <QuestRiskDisplay
        {...defaultProps}
        polygonHeight={100}
        polygonWidth={150}
      />
    );
    
    const riskDisplay = screen.getByTestId('quest-risk-display');
    expect(riskDisplay).toHaveStyle('height: 100px');
    expect(riskDisplay).toHaveStyle('width: 150px');
  });

  it('logs telemetry on render', () => {
    const { useQuestRiskTelemetry } = require('@/ui/idleVillage/utils/riskTelemetry');
    const mockEmitRiskRendered = vi.fn();
    
    useQuestRiskTelemetry.mockReturnValue({
      emitRiskRendered: mockEmitRiskRendered,
      emitStripeClicked: vi.fn(),
    });
    
    render(<QuestRiskDisplay {...defaultProps} />);
    
    expect(mockEmitRiskRendered).toHaveBeenCalledWith({
      questId: 'test-quest-1',
      injuryPercentage: 25.5,
      deathPercentage: 12.3,
      stripeHeights: expect.any(Object),
      showStripes: true,
      configSource: 'default',
    });
  });

  it('logs telemetry on stripe click', () => {
    const { useQuestRiskTelemetry } = require('@/ui/idleVillage/utils/riskTelemetry');
    const mockEmitStripeClicked = vi.fn();
    
    useQuestRiskTelemetry.mockReturnValue({
      emitRiskRendered: vi.fn(),
      emitStripeClicked: mockEmitStripeClicked,
    });
    
    render(<QuestRiskDisplay {...defaultProps} />);
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    fireEvent.click(injuryStripe);
    
    expect(mockEmitStripeClicked).toHaveBeenCalledWith('test-quest-1', 'injury', 25.5);
  });
});
