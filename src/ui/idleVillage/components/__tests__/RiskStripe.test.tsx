import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { calculateRiskStripes } from '../../utils/riskMetrics';
import RiskStripe from '../RiskStripe';

describe('RiskStripe', () => {
  it('renders injury and death stripes with correct heights and colors', () => {
    const riskData = calculateRiskStripes({ injuryPct: 20, deathPct: 10 });
    const { container } = render(<RiskStripe riskData={riskData} />);
    expect(container.firstChild).toHaveAttribute('aria-label', 'Injury risk: 20%, Death risk: 10%');
    expect(container.firstChild).toHaveStyle({ width: '8px', height: '100%' });
    // Check stripes
    const stripes = container.querySelectorAll('div > div');
    expect(stripes).toHaveLength(2);
    expect(stripes[0]).toHaveStyle({ height: '20%', backgroundColor: 'var(--risk-injury, #fbbf24)' });
    expect(stripes[1]).toHaveStyle({ height: '10%', backgroundColor: 'var(--risk-death, #dc2626)' });
  });

  it('handles warnings in title', () => {
    const riskData = calculateRiskStripes({ injuryPct: 60, deathPct: 50 }); // >100%
    render(<RiskStripe riskData={riskData} />);
    expect(screen.getByRole('img')).toHaveAttribute('title', 'Total risk 110% exceeds 100%');
  });

  it('disables animation when animate=false', () => {
    const riskData = calculateRiskStripes({ injuryPct: 15, deathPct: 5 });
    const { container } = render(<RiskStripe riskData={riskData} animate={false} />);
    const stripes = container.querySelectorAll('div > div');
    expect(stripes[0]).toHaveStyle({ transition: 'none' });
  });

  it('matches snapshot', () => {
    const riskData = calculateRiskStripes({ injuryPct: 25, deathPct: 5 });
    const { container } = render(<RiskStripe riskData={riskData} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
