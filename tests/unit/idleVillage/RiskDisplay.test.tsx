/**
 * Unit tests for RiskDisplay component.
 * Tests stripe proportions, accessibility, tooltip content, and risk levels.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskDisplay } from '@/ui/idleVillage/components/RiskDisplay';
import type { RiskMetrics } from '@/ui/idleVillage/utils/riskMetrics';

describe('RiskDisplay', () => {
  const lowRisk: RiskMetrics = { injuryPct: 5, deathPct: 2 };
  const mediumRisk: RiskMetrics = { injuryPct: 25, deathPct: 15 };
  const highRisk: RiskMetrics = { injuryPct: 60, deathPct: 35 };
  const criticalRisk: RiskMetrics = { injuryPct: 85, deathPct: 60 };
  const noRisk: RiskMetrics = { injuryPct: 0, deathPct: 0 };

  it('renders risk display with correct attributes', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} />);
    
    const display = screen.getByTestId('risk-display');
    expect(display).toBeInTheDocument();
    expect(display).toHaveAttribute('role', 'img');
    expect(display).toHaveAttribute('data-risk-level', 'medium');
    expect(display).toHaveAttribute('data-injury-risk', '25');
    expect(display).toHaveAttribute('data-death-risk', '15');
  });

  it('displays injury and death stripes with correct proportions', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} />);
    
    const injuryStripe = screen.getByTestId('injury-stripe');
    const deathStripe = screen.getByTestId('death-stripe');
    
    expect(injuryStripe).toBeInTheDocument();
    expect(deathStripe).toBeInTheDocument();
    
    // Check that styles are applied (CSS variables)
    expect(injuryStripe).toHaveStyle({
      height: 'var(--injury-height)',
      backgroundColor: 'var(--injury-color)',
    });
    
    expect(deathStripe).toHaveStyle({
      height: 'var(--death-height)',
      backgroundColor: 'var(--death-color)',
    });
  });

  it('shows low risk fallback when no risk present', () => {
    render(<RiskDisplay riskMetrics={noRisk} />);
    
    const fallback = screen.getByTestId('low-risk-fallback');
    expect(fallback).toBeInTheDocument();
    
    const lowRiskText = screen.getByText('Low Risk');
    expect(lowRiskText).toBeInTheDocument();
  });

  it('applies correct risk level classes', () => {
    const { rerender } = render(<RiskDisplay riskMetrics={lowRisk} />);
    
    let display = screen.getByTestId('risk-display');
    expect(display.className).toContain('risk-low');
    expect(display.className).not.toContain('elevated');
    
    rerender(<RiskDisplay riskMetrics={highRisk} />);
    display = screen.getByTestId('risk-display');
    expect(display.className).toContain('risk-high');
    expect(display.className).toContain('elevated');
    
    rerender(<RiskDisplay riskMetrics={criticalRisk} />);
    display = screen.getByTestId('risk-display');
    expect(display.className).toContain('risk-critical');
    expect(display.className).toContain('elevated');
  });

  it('renders compact mode correctly', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} compact />);
    
    const display = screen.getByTestId('risk-display');
    expect(display.className).toContain('compact');
  });

  it('displays tooltip with correct content', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} showTooltip />);
    
    const tooltip = screen.getByText('Risk Assessment');
    expect(tooltip).toBeInTheDocument();
    
    expect(screen.getByText('Injury:')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Death:')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('shows warnings when total risk exceeds 100%', () => {
    const excessiveRisk: RiskMetrics = { injuryPct: 80, deathPct: 40 };
    render(<RiskDisplay riskMetrics={excessiveRisk} />);
    
    const warning = screen.getByText(/Total risk.*exceeds 100%/);
    expect(warning).toBeInTheDocument();
  });

  it('uses custom aria label when provided', () => {
    const customLabel = 'Custom risk description';
    render(<RiskDisplay riskMetrics={mediumRisk} ariaLabel={customLabel} />);
    
    const display = screen.getByTestId('risk-display');
    expect(display).toHaveAttribute('aria-label', customLabel);
  });

  it('applies custom CSS classes', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} className="custom-class" />);
    
    const display = screen.getByTestId('risk-display');
    expect(display).toHaveClass('custom-class');
  });

  it('uses custom test ID when provided', () => {
    const customTestId = 'custom-risk-display';
    render(<RiskDisplay riskMetrics={mediumRisk} testId={customTestId} />);
    
    const display = screen.getByTestId(customTestId);
    expect(display).toBeInTheDocument();
  });

  it('displays risk indicator on hover', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} />);
    
    const indicator = screen.getByTestId('risk-indicator');
    expect(indicator).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('hides tooltip when showTooltip is false', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} showTooltip={false} />);
    
    // Tooltip container should not be present
    expect(screen.queryByText('Risk Assessment')).not.toBeInTheDocument();
  });

  it('handles edge case of maximum risk values', () => {
    const maxRisk: RiskMetrics = { injuryPct: 100, deathPct: 100 };
    render(<RiskDisplay riskMetrics={maxRisk} />);
    
    const display = screen.getByTestId('risk-display');
    expect(display).toHaveAttribute('data-risk-level', 'critical');
    expect(display.className).toContain('risk-critical');
    expect(display.className).toContain('elevated');
  });

  it('applies custom profile ID correctly', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} profileId="highRisk" />);
    
    const display = screen.getByTestId('risk-display');
    expect(display).toBeInTheDocument();
    // Profile affects thresholds and colors, verified through risk level
    // highRisk profile has stricter thresholds, so mediumRisk (25/15) is still medium
    expect(display).toHaveAttribute('data-risk-level', 'medium');
  });

  it('maintains accessibility with proper ARIA attributes', () => {
    render(<RiskDisplay riskMetrics={mediumRisk} showTooltip={false} />);
    
    const display = screen.getByTestId('risk-display');
    expect(display).toHaveAttribute('role', 'img');
    expect(display).toHaveAttribute('aria-label');
    expect(display).toHaveAttribute('title'); // For tooltip fallback
  });

  it('handles zero values correctly', () => {
    const zeroInjury: RiskMetrics = { injuryPct: 0, deathPct: 20 };
    render(<RiskDisplay riskMetrics={zeroInjury} />);
    
    const display = screen.getByTestId('risk-display');
    expect(display).toBeInTheDocument();
    expect(display).toHaveAttribute('data-injury-risk', '0');
    expect(display).toHaveAttribute('data-death-risk', '20');
  });

  it('handles decimal values correctly', () => {
    const decimalRisk: RiskMetrics = { injuryPct: 12.5, deathPct: 7.3 };
    render(<RiskDisplay riskMetrics={decimalRisk} />);
    
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('7.3%')).toBeInTheDocument();
    expect(screen.getByText('19.8%')).toBeInTheDocument(); // Total
  });
});
