/**
 * SynergyHeatmap Accessibility Tests
 * 
 * WCAG 2.1 AA compliance tests for SynergyHeatmap component.
 * Tests screen reader support, keyboard navigation, and color contrast.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SynergyHeatmap } from '@/ui/balancing/stressTesting/SynergyHeatmap';
import type { SynergyResult } from '@/balancing/stressTesting/types';

// Mock data for testing
const mockStatLabels = {
  hp: 'Health Points',
  damage: 'Attack Damage',
  speed: 'Movement Speed',
  defense: 'Defense Rating'
};

const mockSynergies: SynergyResult[] = [
  {
    statIds: ['hp', 'damage'],
    synergyMultiplier: 1.25,
    pairScore: 0.75,
    expectedScore: 0.60,
    isOpSynergy: true,
    isWeakSynergy: false
  },
  {
    statIds: ['speed', 'defense'],
    synergyMultiplier: 0.85,
    pairScore: 0.45,
    expectedScore: 0.53,
    isOpSynergy: false,
    isWeakSynergy: true
  },
  {
    statIds: ['hp', 'defense'],
    synergyMultiplier: 1.05,
    pairScore: 0.65,
    expectedScore: 0.62,
    isOpSynergy: false,
    isWeakSynergy: false
  }
];

describe('SynergyHeatmap Accessibility', () => {
  const mockOnCellClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('has proper ARIA labels and roles', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
        onCellClick={mockOnCellClick}
      />
    );

    // Check main region has proper role and label
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Stat Synergy Heatmap');

    // Check table has proper accessibility attributes
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Stat synergy matrix');
    expect(table).toHaveAttribute('aria-describedby', 'synergy-heatmap-description');

    // Check caption exists for screen readers
    const caption = document.getElementById('synergy-heatmap-description');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveClass('sr-only');
  });

  test('legend has proper accessibility markup', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
      />
    );

    // Check legend has proper role
    const legend = screen.getByRole('list');
    expect(legend).toHaveAttribute('aria-label', 'Synergy strength legend');

    // Check legend items are properly marked
    const legendItems = screen.getAllByRole('listitem');
    expect(legendItems).toHaveLength(3);

    // Check color indicators are hidden from screen readers
    const colorIndicators = document.querySelectorAll('[aria-hidden="true"]');
    expect(colorIndicators.length).toBeGreaterThan(0);
  });

  test('table headers have proper scope attributes', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
      />
    );

    // Check all table headers have scope="col"
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });

    // Check first header is "Stat Pair"
    expect(headers[0]).toHaveTextContent('Stat Pair');
  });

  test('interactive cells have proper ARIA attributes', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
        onCellClick={mockOnCellClick}
      />
    );

    // Find clickable cells (synergy cells)
    const clickableCells = document.querySelectorAll('td[role="button"]');
    expect(clickableCells.length).toBeGreaterThan(0);

    // Check first clickable cell has proper attributes
    const firstCell = clickableCells[0];
    expect(firstCell).toHaveAttribute('tabindex', '0');
    expect(firstCell).toHaveAttribute('aria-label');
    expect(firstCell).toHaveAttribute('role', 'button');

    // Check ARIA label contains meaningful information
    const ariaLabel = firstCell.getAttribute('aria-label');
    expect(ariaLabel).toContain('overpowered synergy');
    expect(ariaLabel).toContain('1.25x multiplier');
  });

  test('non-interactive cells have correct tabindex', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
        onCellClick={mockOnCellClick}
      />
    );

    // Find diagonal cells (same stat pairs) - should not be interactive
    const diagonalCells = document.querySelectorAll('td[role="cell"]');
    diagonalCells.forEach(cell => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  });

  test('keyboard navigation works correctly', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
        onCellClick={mockOnCellClick}
      />
    );

    // Find first clickable cell
    const firstCell = document.querySelector('td[role="button"]');
    expect(firstCell).toBeInTheDocument();

    // Test Enter key
    fireEvent.keyDown(firstCell!, { key: 'Enter' });
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);

    // Reset mock
    mockOnCellClick.mockClear();

    // Test Space key
    fireEvent.keyDown(firstCell!, { key: ' ' });
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
  });

  test('focus management works correctly', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
        onCellClick={mockOnCellClick}
      />
    );

    // Find clickable cell
    const clickableCell = document.querySelector('td[role="button"]');
    expect(clickableCell).toBeInTheDocument();

    // Test focus styles are applied
    fireEvent.focus(clickableCell!);
    expect(clickableCell).toHaveClass('focus:ring-2');
    expect(clickableCell).toHaveClass('focus:ring-amber-400');
  });

  test('screen reader announcements work', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
      />
    );

    // Check summary statistics have live region
    const summary = screen.getByRole('status');
    expect(summary).toHaveAttribute('aria-live', 'polite');

    // Check summary contains expected information
    expect(summary).toHaveTextContent('Total synergies analyzed: 3');
    expect(summary).toHaveTextContent('OP synergies: 1');
    expect(summary).toHaveTextContent('Weak synergies: 1');
  });

  test('color contrast compliance', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
      />
    );

    // Check OP synergy cells have proper color classes
    const opCells = document.querySelectorAll('.bg-emerald-600');
    expect(opCells.length).toBeGreaterThan(0);

    // Check weak synergy cells have proper color classes
    const weakCells = document.querySelectorAll('.bg-rose-600');
    expect(weakCells.length).toBeGreaterThan(0);

    // Check neutral cells have proper color classes
    const neutralCells = document.querySelectorAll('.bg-amber-600');
    expect(neutralCells.length).toBeGreaterThan(0);

    // These classes should provide sufficient contrast per WCAG guidelines
    // (Actual contrast testing would require a contrast checker library)
  });

  test('descriptive content for screen readers', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
        onCellClick={mockOnCellClick}
      />
    );

    // Check for hidden descriptive content
    const descriptions = document.querySelectorAll('.sr-only');
    expect(descriptions.length).toBeGreaterThan(0);

    // Check synergy descriptions contain meaningful information
    const synergyDescriptions = Array.from(descriptions).filter(el => 
      el.id?.startsWith('synergy-')
    );
    
    expect(synergyDescriptions.length).toBeGreaterThan(0);
    synergyDescriptions.forEach(desc => {
      expect(desc.textContent).toContain('synergy');
      expect(desc.textContent).toContain('multiplier');
    });
  });

  test('mouse and keyboard parity', () => {
    render(
      <SynergyHeatmap
        synergies={mockSynergies}
        statLabels={mockStatLabels}
        onCellClick={mockOnCellClick}
      />
    );

    const clickableCell = document.querySelector('td[role="button"]');
    expect(clickableCell).toBeInTheDocument();

    // Test mouse click
    fireEvent.click(clickableCell!);
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);

    // Reset mock
    mockOnCellClick.mockClear();

    // Test keyboard activation
    fireEvent.keyDown(clickableCell!, { key: 'Enter' });
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
  });

  test('handles empty data gracefully', () => {
    render(
      <SynergyHeatmap
        synergies={[]}
        statLabels={mockStatLabels}
      />
    );

    // Should still render with proper accessibility
    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Summary should show zero synergies
    const summary = screen.getByRole('status');
    expect(summary).toHaveTextContent('Total synergies analyzed: 0');
  });
});
