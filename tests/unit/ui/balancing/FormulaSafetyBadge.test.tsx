/**
 * RTL tests for FormulaSafetyBadge component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormulaSafetyBadge } from '../../../../src/ui/balancing/components/FormulaSafetyBadge';
import type { FormulaSafetyReport, FormulaWarning } from '../../../../src/balancing/config/FormulaEngine';

describe('FormulaSafetyBadge', () => {
  const mockSafetyReport: FormulaSafetyReport = {
    hasCycles: false,
    complexity: 'low',
    estimatedOperations: 2,
    divisionRisk: false,
    rangeIssues: []
  };

  const mockWarnings: FormulaWarning[] = [
    {
      type: 'complexity',
      message: 'High complexity detected',
      severity: 'warning'
    }
  ];

  it('should render nothing when safety is undefined', () => {
    const { container } = render(
      <FormulaSafetyBadge 
        safety={undefined} 
        warnings={mockWarnings}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render safety indicators for safe formula', () => {
    render(
      <FormulaSafetyBadge 
        safety={mockSafetyReport} 
        warnings={[]}
      />
    );
    
    // Should show safety indicator (green for low complexity)
    const safetyIndicator = screen.getByTitle('Safety: safe');
    expect(safetyIndicator).toBeInTheDocument();
    expect(safetyIndicator).toHaveClass('bg-emerald-500');
    
    // Should show complexity indicator (green for low)
    const complexityIndicator = screen.getByTitle('Complexity: low (2 ops)');
    expect(complexityIndicator).toBeInTheDocument();
    expect(complexityIndicator).toHaveClass('bg-emerald-500');
  });

  it('should render warning indicators for medium complexity', () => {
    const mediumComplexity: FormulaSafetyReport = {
      ...mockSafetyReport,
      complexity: 'medium',
      estimatedOperations: 5
    };
    
    render(
      <FormulaSafetyBadge 
        safety={mediumComplexity} 
        warnings={[]}
      />
    );
    
    const complexityIndicator = screen.getByTitle('Complexity: medium (5 ops)');
    expect(complexityIndicator).toHaveClass('bg-amber-500');
  });

  it('should render error indicators for high complexity', () => {
    const highComplexity: FormulaSafetyReport = {
      ...mockSafetyReport,
      complexity: 'high',
      estimatedOperations: 10
    };
    
    render(
      <FormulaSafetyBadge 
        safety={highComplexity} 
        warnings={[]}
      />
    );
    
    const complexityIndicator = screen.getByTitle('Complexity: high (10 ops)');
    expect(complexityIndicator).toHaveClass('bg-red-500');
  });

  it('should show division risk indicator', () => {
    const withDivisionRisk: FormulaSafetyReport = {
      ...mockSafetyReport,
      divisionRisk: true
    };
    
    render(
      <FormulaSafetyBadge 
        safety={withDivisionRisk} 
        warnings={[]}
      />
    );
    
    const divisionIndicator = screen.getByTitle('Division risk detected');
    expect(divisionIndicator).toBeInTheDocument();
    expect(divisionIndicator).toHaveClass('bg-orange-500');
  });

  it('should show cycle detection indicator', () => {
    const withCycles: FormulaSafetyReport = {
      ...mockSafetyReport,
      hasCycles: true
    };
    
    render(
      <FormulaSafetyBadge 
        safety={withCycles} 
        warnings={[]}
    />
    );
    
    // Overall safety should be error due to cycles
    const safetyIndicator = screen.getByTitle('Safety: error');
    expect(safetyIndicator).toHaveClass('bg-red-500');
  });

  it('should display issue counts when warnings are present', () => {
    const warningsWithCounts: FormulaWarning[] = [
      { type: 'range', message: 'Division by zero risk', severity: 'error' },
      { type: 'complexity', message: 'High complexity', severity: 'warning' },
      { type: 'performance', message: 'Exponentiation detected', severity: 'info' }
    ];
    
    render(
      <FormulaSafetyBadge 
        safety={mockSafetyReport} 
        warnings={warningsWithCounts}
      />
    );
    
    expect(screen.getByText('1E')).toBeInTheDocument(); // 1 error
    expect(screen.getByText('1W')).toBeInTheDocument(); // 1 warning
    expect(screen.getByText('1I')).toBeInTheDocument(); // 1 info
  });

  it('should show detailed breakdown when showDetails is true', () => {
    const withIssues: FormulaSafetyReport = {
      hasCycles: true,
      complexity: 'high',
      estimatedOperations: 8,
      divisionRisk: true,
      rangeIssues: [
        {
          stat: 'defense',
          issue: 'zero_division',
          message: 'Division by zero possible when defense = 0'
        },
        {
          stat: 'hp',
          issue: 'overflow_risk',
          message: 'Potential overflow with hp^2 operation'
        }
      ]
    };
    
    render(
      <FormulaSafetyBadge 
        safety={withIssues} 
        warnings={[]}
        showDetails={true}
      />
    );
    
    expect(screen.getByText('Complexity: high')).toBeInTheDocument();
    expect(screen.getByText('Operations: 8')).toBeInTheDocument();
    expect(screen.getByText('⚠ Circular dependency')).toBeInTheDocument();
    expect(screen.getByText('⚠ Division risk')).toBeInTheDocument();
    expect(screen.getByText('⚠ Division by zero possible when defense = 0')).toBeInTheDocument();
    expect(screen.getByText('⚠ Potential overflow with hp^2 operation')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FormulaSafetyBadge 
        safety={mockSafetyReport} 
        warnings={[]}
        className="custom-class"
      />
    );
    
    const badgeContainer = container.firstChild as HTMLElement;
    expect(badgeContainer).toHaveClass('custom-class');
  });

  it('should handle range issues with different severity levels', () => {
    const withRangeIssues: FormulaSafetyReport = {
      ...mockSafetyReport,
      rangeIssues: [
        {
          stat: 'defense',
          issue: 'zero_division',
          message: 'Division by zero possible'
        },
        {
          stat: 'hp',
          issue: 'negative_input',
          message: 'Negative input risk'
        },
        {
          stat: 'damage',
          issue: 'overflow_risk',
          message: 'Overflow risk'
        }
      ]
    };
    
    render(
      <FormulaSafetyBadge 
        safety={withRangeIssues} 
        warnings={[]}
        showDetails={true}
      />
    );
    
    // Zero division should be red (error)
    const zeroDivisionWarning = screen.getByText('⚠ Division by zero possible');
    expect(zeroDivisionWarning).toHaveClass('text-red-400');
    
    // Other issues should be amber (warning)
    const negativeInputWarning = screen.getByText('⚠ Negative input risk');
    expect(negativeInputWarning).toHaveClass('text-amber-400');
    
    const overflowWarning = screen.getByText('⚠ Overflow risk');
    expect(overflowWarning).toHaveClass('text-amber-400');
  });

  it('should determine overall safety correctly', () => {
    // Test error level (cycles or zero division)
    const errorLevel: FormulaSafetyReport = {
      hasCycles: true,
      complexity: 'low',
      estimatedOperations: 2,
      divisionRisk: false,
      rangeIssues: []
    };
    
    const { rerender } = render(
      <FormulaSafetyBadge 
        safety={errorLevel} 
        warnings={[]}
      />
    );
    
    expect(screen.getByTitle('Safety: error')).toHaveClass('bg-red-500');
    
    // Test warning level (high complexity or division risk)
    const warningLevel: FormulaSafetyReport = {
      hasCycles: false,
      complexity: 'high',
      estimatedOperations: 10,
      divisionRisk: false,
      rangeIssues: []
    };
    
    rerender(
      <FormulaSafetyBadge 
        safety={warningLevel} 
        warnings={[]}
      />
    );
    
    expect(screen.getByTitle('Safety: warning')).toHaveClass('bg-amber-500');
    
    // Test safe level
    rerender(
      <FormulaSafetyBadge 
        safety={mockSafetyReport} 
        warnings={[]}
      />
    );
    
    expect(screen.getByTitle('Safety: safe')).toHaveClass('bg-emerald-500');
  });
});
