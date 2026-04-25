/**
 * Test suite for MarginalUtilityTable component
 * Tests rendering, data display, and assessment highlighting
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarginalUtilityTable, CompactMarginalUtilityTable } from '../MarginalUtilityTable';
import type { MarginalUtilityResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import type { StressTestArchetype } from '@/balancing/stressTesting/types';

// Mock data for testing
const mockArchetype: StressTestArchetype = {
  id: 'test_hp',
  name: 'HP +25',
  description: 'Test archetype',
  stats: { hp: 175 },
  testedStats: ['hp'],
  pointsPerStat: 25,
  seed: 42,
  type: 'single',
};

const mockResults: MarginalUtilityResult[] = [
  {
    archetype: mockArchetype,
    averageScore: 0.75,
    marginalUtility: 0.25,
    standardDeviation: 0,
    simulationCount: 10000,
  },
  {
    archetype: { ...mockArchetype, id: 'test_damage', name: 'Damage +25', stats: { damage: 125 }, testedStats: ['damage'] },
    averageScore: 0.45,
    marginalUtility: -0.15,
    standardDeviation: 0,
    simulationCount: 10000,
  },
  {
    archetype: { ...mockArchetype, id: 'test_txc', name: 'TxC +25', stats: { txc: 125 }, testedStats: ['txc'] },
    averageScore: 0.55,
    marginalUtility: 0.05,
    standardDeviation: 0,
    simulationCount: 10000,
  },
];

describe('MarginalUtilityTable', () => {
  it('should render table with results', () => {
    render(<MarginalUtilityTable results={mockResults} />);
    
    expect(screen.getByText('Marginal Utility Analysis')).toBeInTheDocument();
    expect(screen.getByText('3 stats analyzed')).toBeInTheDocument();
    expect(screen.getByText('HP +25')).toBeInTheDocument();
    expect(screen.getByText('Damage +25')).toBeInTheDocument();
    expect(screen.getByText('TxC +25')).toBeInTheDocument();
  });

  it('should display correct rankings', () => {
    render(<MarginalUtilityTable results={mockResults} />);
    
    // Results should be sorted by marginal utility (descending)
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    
    // HP should be #1 (highest marginal utility)
    const hpRow = screen.getByText('HP +25').closest('tr');
    expect(hpRow).toContainElement(screen.getByText('#1'));
    
    // Damage should be #3 (lowest marginal utility)
    const damageRow = screen.getByText('Damage +25').closest('tr');
    expect(damageRow).toContainElement(screen.getByText('#3'));
  });

  it('should display correct win rates and marginal utilities', () => {
    render(<MarginalUtilityTable results={mockResults} />);
    
    // Check win rates
    expect(screen.getByText('75.0%')).toBeInTheDocument(); // HP
    expect(screen.getByText('45.0%')).toBeInTheDocument(); // Damage
    expect(screen.getByText('55.0%')).toBeInTheDocument(); // TxC
    
    // Check marginal utilities with proper formatting
    expect(screen.getByText('+25.00%')).toBeInTheDocument(); // HP (positive)
    expect(screen.getByText('-15.00%')).toBeInTheDocument(); // Damage (negative)
    expect(screen.getByText('+5.00%')).toBeInTheDocument(); // TxC (positive)
  });

  it('should show correct assessments with colors', () => {
    render(<MarginalUtilityTable results={mockResults} />);
    
    // HP (75% win rate) should be 'strong'
    const hpAssessment = screen.getByText('STRONG');
    expect(hpAssessment).toBeInTheDocument();
    expect(hpAssessment).toHaveClass('text-amber-400');
    
    // Damage (45% win rate) should be 'weak'
    const damageAssessment = screen.getByText('WEAK');
    expect(damageAssessment).toBeInTheDocument();
    expect(damageAssessment).toHaveClass('text-blue-400');
    
    // TxC (55% win rate) should be 'balanced'
    const txcAssessment = screen.getByText('BALANCED');
    expect(txcAssessment).toBeInTheDocument();
    expect(txcAssessment).toHaveClass('text-green-400');
  });

  it('should show details when enabled', () => {
    render(<MarginalUtilityTable results={mockResults} showDetails={true} />);
    
    // Should show simulation count column but not runtime column
    expect(screen.getByText('Simulations')).toBeInTheDocument();
    expect(screen.queryByText('Runtime')).not.toBeInTheDocument();
    
    // Should show simulation counts
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('should hide details when disabled', () => {
    render(<MarginalUtilityTable results={mockResults} showDetails={false} />);
    
    // Should not show simulation count and runtime columns
    expect(screen.queryByText('Simulations')).not.toBeInTheDocument();
    expect(screen.queryByText('Runtime')).not.toBeInTheDocument();
    expect(screen.queryByText('10,000')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<MarginalUtilityTable results={[]} isLoading={true} />);
    
    // Should show skeleton loaders
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('should show empty state', () => {
    render(<MarginalUtilityTable results={[]} isLoading={false} />);
    
    expect(screen.getByText('No marginal utility results available')).toBeInTheDocument();
    expect(screen.getByText('Run stress testing to see results')).toBeInTheDocument();
  });

  it('should display correct summary statistics', () => {
    render(<MarginalUtilityTable results={mockResults} />);
    
    expect(screen.getByText('OP Stats')).toBeInTheDocument();
    expect(screen.getByText('Strong Stats')).toBeInTheDocument();
    expect(screen.getByText('Weak Stats')).toBeInTheDocument();
    expect(screen.getByText('Underpowered')).toBeInTheDocument();
    
    expect(screen.getByText('1')).toBeInTheDocument(); // OP count
    expect(screen.getByText('0')).toBeInTheDocument(); // Strong count
    expect(screen.getByText('1')).toBeInTheDocument(); // Weak count
    expect(screen.getByText('0')).toBeInTheDocument(); // Underpowered count
  });

  it('should use custom title', () => {
    render(<MarginalUtilityTable results={mockResults} title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.queryByText('Marginal Utility Analysis')).not.toBeInTheDocument();
  });

  it('should handle positive and negative marginal utilities with correct colors', () => {
    render(<MarginalUtilityTable results={mockResults} />);
    
    // Positive marginal utility should be green
    const positiveUtility = screen.getByText('+25.00%');
    expect(positiveUtility).toHaveClass('text-green-400');
    
    // Negative marginal utility should be red
    const negativeUtility = screen.getByText('-15.00%');
    expect(negativeUtility).toHaveClass('text-red-400');
  });

  it('should show tested stats in archetype details', () => {
    render(<MarginalUtilityTable results={mockResults} />);
    
    expect(screen.getByText('test_hp')).toBeInTheDocument();
    expect(screen.getByText('test_damage')).toBeInTheDocument();
    expect(screen.getByText('test_txc')).toBeInTheDocument();
  });
});

describe('CompactMarginalUtilityTable', () => {
  it('should render compact table with limited rows', () => {
    render(<CompactMarginalUtilityTable results={mockResults} maxRows={2} />);
    
    expect(screen.getByText('Top Stats')).toBeInTheDocument();
    
    // Should only show top 2 results
    expect(screen.getByText('HP +25')).toBeInTheDocument();
    expect(screen.getByText('TxC +25')).toBeInTheDocument();
    expect(screen.queryByText('Damage +25')).not.toBeInTheDocument();
  });

  it('should show correct rankings in compact view', () => {
    render(<CompactMarginalUtilityTable results={mockResults} />);
    
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('should show assessments in compact view', () => {
    render(<CompactMarginalUtilityTable results={mockResults} />);
    
    expect(screen.getByText('OP')).toBeInTheDocument();
    expect(screen.getAllByText('balanced')).toHaveLength(2); // Two balanced results
  });

  it('should show marginal utilities in compact view', () => {
    render(<CompactMarginalUtilityTable results={mockResults} />);
    
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
    expect(screen.getByText('+5.0%')).toBeInTheDocument();
    expect(screen.getByText('-15.0%')).toBeInTheDocument();
  });

  it('should not render with empty results', () => {
    const { container } = render(<CompactMarginalUtilityTable results={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should respect maxRows parameter', () => {
    render(<CompactMarginalUtilityTable results={mockResults} maxRows={1} />);
    
    expect(screen.getByText('HP +25')).toBeInTheDocument();
    expect(screen.queryByText('TxC +25')).not.toBeInTheDocument();
    expect(screen.queryByText('Damage +25')).not.toBeInTheDocument();
  });

  it('should default to 5 rows when maxRows not specified', () => {
    render(<CompactMarginalUtilityTable results={mockResults} />);
    
    // Should show all 3 results (less than default 5)
    expect(screen.getByText('HP +25')).toBeInTheDocument();
    expect(screen.getByText('TxC +25')).toBeInTheDocument();
    expect(screen.getByText('Damage +25')).toBeInTheDocument();
  });
});
