import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatEfficiencyTable } from '../StatEfficiencyTable';
import type { StatEfficiency } from '../../../balancing/testing/RoundRobinRunner';

const mockEfficiencies: StatEfficiency[] = [
  {
    statId: 'hp',
    pointsPerStat: 25,
    efficiency: 0.65,
    wins: 4,
    losses: 1,
    draws: 0,
    rank: 1,
    assessment: 'strong',
  },
  {
    statId: 'attack',
    pointsPerStat: 25,
    efficiency: 0.55,
    wins: 3,
    losses: 2,
    draws: 0,
    rank: 2,
    assessment: 'balanced',
  },
  {
    statId: 'defense',
    pointsPerStat: 25,
    efficiency: 0.45,
    wins: 2,
    losses: 3,
    draws: 0,
    rank: 3,
    assessment: 'weak',
  },
];

describe('StatEfficiencyTable', () => {
  it('should render table with efficiency data', () => {
    render(<StatEfficiencyTable efficiencies={mockEfficiencies} />);

    expect(screen.getByText('Stat Efficiency Ranking (Tier +25)')).toBeInTheDocument();

    // Check headers
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Stat')).toBeInTheDocument();
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
    expect(screen.getByText('W/L')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();

    // Check data rows
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('hp')).toBeInTheDocument();
    expect(screen.getByText('65.0%')).toBeInTheDocument();
    expect(screen.getByText('4W / 1L')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();

    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('attack')).toBeInTheDocument();
    expect(screen.getByText('55.0%')).toBeInTheDocument();
    expect(screen.getByText('3W / 2L')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();

    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('defense')).toBeInTheDocument();
    expect(screen.getByText('45.0%')).toBeInTheDocument();
    expect(screen.getByText('2W / 3L')).toBeInTheDocument();
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('should sort efficiencies by rank', () => {
    const unsortedEfficiencies = [
      { ...mockEfficiencies[2], rank: 3 },
      { ...mockEfficiencies[0], rank: 1 },
      { ...mockEfficiencies[1], rank: 2 },
    ];

    render(<StatEfficiencyTable efficiencies={unsortedEfficiencies} />);

    const rows = screen.getAllByRole('row');
    // First data row should be rank 1
    expect(rows[1]).toHaveTextContent('#1');
    expect(rows[1]).toHaveTextContent('hp');
  });

  it('should display aggregated title when tier is null', () => {
    render(<StatEfficiencyTable efficiencies={mockEfficiencies} />);

    expect(screen.getByText('Stat Efficiency Ranking (Aggregated)')).toBeInTheDocument();
  });

  it('should render assessment colors correctly', () => {
    render(<StatEfficiencyTable efficiencies={mockEfficiencies} />);

    const strongCell = screen.getByText('Strong');
    const balancedCell = screen.getByText('Balanced');
    const weakCell = screen.getByText('Weak');

    expect(strongCell).toHaveClass('text-amber-400');
    expect(balancedCell).toHaveClass('text-green-400');
    expect(weakCell).toHaveClass('text-blue-400');
  });
});
