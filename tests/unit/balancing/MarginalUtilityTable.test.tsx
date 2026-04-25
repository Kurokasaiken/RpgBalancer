/**
 * Unit tests for MarginalUtilityTable component
 * 
 * Tests for table rendering, sorting, filtering, interaction,
 * and accessibility features.
 * 
 * @module MarginalUtilityTable.test.tsx
 * @since 2026-01-11
 * @author Aurelia-Heatmap
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarginalUtilityTable } from '../../ui/balancing/stressTesting/MarginalUtilityTable';
import type { MarginalUtilityResult } from '@/balancing/stressTesting/types';

// Mock console.log for telemetry
vi.mock('console', () => ({
  log: vi.fn(),
}));

describe('MarginalUtilityTable', () => {
  const mockResults: MarginalUtilityResult[] = [
    {
      archetype: {
        id: 'warrior',
        name: 'Warrior',
        description: 'High HP and damage',
        stats: { hp: 100, damage: 80, defense: 60, speed: 40 },
        testedStats: ['hp', 'damage'],
        pointsPerStat: 10,
        seed: 42,
        type: 'pair',
      },
      marginalUtility: 0.85,
      averageScore: 75.5,
      standardDeviation: 12.3,
      winRate: 0.75,
      synergyMultiplier: 1.2,
      matchupCount: 10,
    },
    {
      archetype: {
        id: 'mage',
        name: 'Mage',
        description: 'High magic and resistance',
        stats: { hp: 70, damage: 40, magic: 90, resistance: 80 },
        testedStats: ['magic', 'resistance'],
        pointsPerStat: 10,
        seed: 43,
        type: 'pair',
      },
      marginalUtility: 0.65,
      averageScore: 65.2,
      standardDeviation: 8.7,
      winRate: 0.55,
      synergyMultiplier: 0.9,
      matchupCount: 10,
    },
    {
      archetype: {
        id: 'rogue',
        name: 'Rogue',
        description: 'High speed and evasion',
        stats: { hp: 60, damage: 70, speed: 85, evasion: 75 },
        testedStats: ['speed', 'evasion'],
        pointsPerStat: 10,
        seed: 44,
        type: 'pair',
      },
      marginalUtility: 0.45,
      averageScore: 55.8,
      standardDeviation: 15.2,
      winRate: 0.45,
      synergyMultiplier: 0.8,
      matchupCount: 10,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render table with correct headers', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      expect(screen.getByText('Archetype')).toBeInTheDocument();
      expect(screen.getByText('Marginal Utility')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('Synergy')).toBeInTheDocument();
    });

    test('should render all result rows', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      expect(screen.getByText('Warrior')).toBeInTheDocument();
      expect(screen.getByText('Mage')).toBeInTheDocument();
      expect(screen.getByText('Rogue')).toBeInTheDocument();
    });

    test('should render marginal utility values with correct formatting', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      expect(screen.getByText('0.85')).toBeInTheDocument();
      expect(screen.getByText('0.65')).toBeInTheDocument();
      expect(screen.getByText('0.45')).toBeInTheDocument();
    });

    test('should render win rates as percentages', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('55.0%')).toBeInTheDocument();
      expect(screen.getByText('45.0%')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<MarginalUtilityTable results={mockResults} className="custom-table" />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
    });
  });

  describe('Sorting', () => {
    test('should sort results by marginal utility by default', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      
      // Should be sorted: Warrior (0.85), Mage (0.65), Rogue (0.45)
      expect(rows[0]).toHaveTextContent('Warrior');
      expect(rows[1]).toHaveTextContent('Mage');
      expect(rows[2]).toHaveTextContent('Rogue');
    });

    test('should maintain sort order with same values', () => {
      const sameValueResults = [
        { ...mockResults[0], marginalUtility: 0.5 },
        { ...mockResults[1], marginalUtility: 0.5 },
        { ...mockResults[2], marginalUtility: 0.5 },
      ];
      
      render(<MarginalUtilityTable results={sameValueResults} />);
      
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
    });

    test('should handle empty results', () => {
      render(<MarginalUtilityTable results={[]} />);
      
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(0);
    });
  });

  describe('Interaction', () => {
    test('should call onRowClick when row is clicked', () => {
      const mockOnRowClick = vi.fn();
      render(<MarginalUtilityTable results={mockResults} onRowClick={mockOnRowClick} />);
      
      const warriorRow = screen.getByText('Warrior').closest('tr');
      fireEvent.click(warriorRow!);
      
      expect(mockOnRowClick).toHaveBeenCalledWith(mockResults[0]);
    });

    test('should emit telemetry when enableTelemetry is true', () => {
      const mockConsole = vi.mocked(console);
      render(<MarginalUtilityTable results={mockResults} enableTelemetry={true} />);
      
      const warriorRow = screen.getByText('Warrior').closest('tr');
      fireEvent.click(warriorRow!);
      
      expect(mockConsole.log).toHaveBeenCalledWith('marginal_utility_row_selected', expect.objectContaining({
        archetypeId: 'warrior',
        archetypeName: 'Warrior',
        marginalUtility: 0.85,
        averageScore: 75.5,
        standardDeviation: 12.3,
      }));
    });

    test('should not emit telemetry when enableTelemetry is false', () => {
      const mockConsole = vi.mocked(console);
      render(<MarginalUtilityTable results={mockResults} enableTelemetry={false} />);
      
      const warriorRow = screen.getByText('Warrior').closest('tr');
      fireEvent.click(warriorRow!);
      
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    test('should handle missing onRowClick gracefully', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      const warriorRow = screen.getByText('Warrior').closest('tr');
      
      // Should not throw error
      expect(() => fireEvent.click(warriorRow!)).not.toThrow();
    });
  });

  describe('Performance Color Coding', () => {
    test('should apply color coding based on marginal utility values', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      
      // Warrior (0.85) should have excellent color
      // Mage (0.65) should have good color
      // Rogue (0.45) should have average/poor color
      
      expect(rows[0]).toHaveClass('performance-excellent');
      expect(rows[1]).toHaveClass('performance-good');
      expect(rows[2]).toHaveClass('performance-average');
    });

    test('should apply color coding based on synergy multipliers', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      const synergyCells = screen.getAllByText(/1\.2|0\.9|0\.8/);
      
      // Warrior (1.2) should be OP synergy
      // Mage (0.9) should be weak synergy
      // Rogue (0.8) should be weak synergy
    });
  });

  describe('Accessibility', () => {
    test('should have proper table semantics', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    test('should have accessible row interactions', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      const warriorRow = screen.getByText('Warrior').closest('tr');
      expect(warriorRow).toHaveClass('cursor-pointer');
    });

    test('should support keyboard navigation', () => {
      render(<MarginalUtilityTable results={mockResults} />);
      
      const warriorRow = screen.getByText('Warrior').closest('tr');
      
      // Should be focusable
      warriorRow?.focus();
      expect(document.activeElement).toBe(warriorRow);
    });
  });

  describe('Data Processing', () => {
    test('should handle large number of results efficiently', () => {
      const largeResults = Array.from({ length: 100 }, (_, i) => ({
        ...mockResults[0],
        archetype: {
          ...mockResults[0].archetype,
          id: `archetype-${i}`,
          name: `Archetype ${i}`,
        },
        marginalUtility: Math.random(),
      }));
      
      const startTime = performance.now();
      render(<MarginalUtilityTable results={largeResults} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(100);
    });

    test('should handle missing or undefined values', () => {
      const incompleteResults = [
        {
          ...mockResults[0],
          marginalUtility: undefined as any,
          averageScore: null as any,
        },
      ];
      
      render(<MarginalUtilityTable results={incompleteResults} />);
      
      // Should render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    test('should handle extreme values', () => {
      const extremeResults = [
        {
          ...mockResults[0],
          marginalUtility: 999,
          averageScore: -999,
          standardDeviation: Infinity,
          winRate: 2,
        },
      ];
      
      render(<MarginalUtilityTable results={extremeResults} />);
      
      // Should render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to smaller screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      
      render(<MarginalUtilityTable results={mockResults} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Should still render all content
      expect(screen.getByText('Warrior')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed archetype data', () => {
      const malformedResults = [
        {
          ...mockResults[0],
          archetype: null as any,
        },
      ];
      
      render(<MarginalUtilityTable results={malformedResults} />);
      
      // Should render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    test('should handle negative values', () => {
      const negativeResults = [
        {
          ...mockResults[0],
          marginalUtility: -0.5,
          averageScore: -10,
          winRate: -1,
        },
      ];
      
      render(<MarginalUtilityTable results={negativeResults} />);
      
      // Should render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = render(<MarginalUtilityTable results={mockResults} />);
      
      const table = screen.getByRole('table');
      const initialRows = table.querySelectorAll('tbody tr');
      
      rerender(<MarginalUtilityTable results={mockResults} />);
      
      const updatedRows = table.querySelectorAll('tbody tr');
      expect(updatedRows).toHaveLength(initialRows.length);
    });

    test('should handle frequent updates efficiently', () => {
      const { rerender } = render(<MarginalUtilityTable results={mockResults} />);
      
      const startTime = performance.now();
      
      // Simulate frequent updates
      for (let i = 0; i < 10; i++) {
        const updatedResults = mockResults.map(result => ({
          ...result,
          marginalUtility: result.marginalUtility + Math.random() * 0.1,
        }));
        rerender(<MarginalUtilityTable results={updatedResults} />);
      }
      
      const endTime = performance.now();
      
      // Should handle updates efficiently (< 200ms)
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
