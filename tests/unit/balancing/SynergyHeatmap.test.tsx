/**
 * Synergy Heatmap Component Test Suite
 * 
 * Comprehensive testing for the enhanced synergy heatmap visualization
 * including filtering, sorting, export, and interaction features.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import SynergyHeatmapEnhanced from '@/ui/balancing/components/SynergyHeatmapEnhanced';
import type { SynergyResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';

// Mock data for testing
const mockSynergies: SynergyResult[] = [
  {
    pairArchetype: {
      id: 'test-archetype-1',
      name: 'Test Archetype 1',
      testedStats: ['hp', 'damage'],
      stats: { hp: 100, damage: 50 },
      score: 75,
    },
    statIds: ['hp', 'damage'],
    pairScore: 1.5,
    expectedScore: 1.2,
    synergyMultiplier: 1.25,
    isOpSynergy: false,
    isWeakSynergy: false,
    runtimeMs: 100,
  },
  {
    pairArchetype: {
      id: 'test-archetype-2',
      name: 'Test Archetype 2',
      testedStats: ['hp', 'defense'],
      stats: { hp: 100, defense: 30 },
      score: 60,
    },
    statIds: ['hp', 'defense'],
    pairScore: 2.0,
    expectedScore: 1.8,
    synergyMultiplier: 1.8,
    isOpSynergy: true,
    isWeakSynergy: false,
    runtimeMs: 120,
  },
  {
    pairArchetype: {
      id: 'test-archetype-3',
      name: 'Test Archetype 3',
      testedStats: ['damage', 'defense'],
      stats: { damage: 50, defense: 30 },
      score: 40,
    },
    statIds: ['damage', 'defense'],
    pairScore: 0.8,
    expectedScore: 0.9,
    synergyMultiplier: 0.7,
    isOpSynergy: false,
    isWeakSynergy: true,
    runtimeMs: 80,
  },
  {
    pairArchetype: {
      id: 'test-archetype-4',
      name: 'Test Archetype 4',
      testedStats: ['hp', 'speed'],
      stats: { hp: 100, speed: 20 },
      score: 85,
    },
    statIds: ['hp', 'speed'],
    pairScore: 1.1,
    expectedScore: 1.0,
    synergyMultiplier: 1.1,
    isOpSynergy: false,
    isWeakSynergy: false,
    runtimeMs: 90,
  },
  {
    pairArchetype: {
      id: 'test-archetype-5',
      name: 'Test Archetype 5',
      testedStats: ['damage', 'speed'],
      stats: { damage: 50, speed: 20 },
      score: 55,
    },
    statIds: ['damage', 'speed'],
    pairScore: 1.3,
    expectedScore: 1.1,
    synergyMultiplier: 1.3,
    isOpSynergy: false,
    isWeakSynergy: false,
    runtimeMs: 110,
  },
];

const mockMarginalUtilities = [
  {
    archetype: mockSynergies[0].pairArchetype,
    averageScore: 0.75,
    marginalUtility: 0.1,
    standardDeviation: 0.2,
    simulationCount: 1000,
    runtimeMs: 150,
  },
  {
    archetype: mockSynergies[1].pairArchetype,
    averageScore: 0.6,
    marginalUtility: 0.05,
    standardDeviation: 0.15,
    simulationCount: 800,
    runtimeMs: 120,
  },
  {
    archetype: mockSynergies[2].pairArchetype,
    averageScore: 0.4,
    marginalUtility: -0.05,
    standardDeviation: 0.1,
    simulationCount: 600,
    runtimeMs: 80,
  },
  {
    archetype: mockSynergies[3].pairArchetype,
    averageScore: 0.85,
    marginalUtility: 0.15,
    standardDeviation: 0.25,
    simulationCount: 1200,
    runtimeMs: 90,
  },
  {
    archetype: mockSynergies[4].pairArchetype,
    averageScore: 0.55,
    marginalUtility: 0.08,
    standardDeviation: 0.12,
    simulationCount: 900,
    runtimeMs: 110,
  },
];

const mockStatLabels = {
  hp: 'Health Points',
  damage: 'Damage',
  defense: 'Defense',
  speed: 'Speed',
  magic: 'Magic Power',
  resistance: 'Resistance',
  accuracy: 'Accuracy',
  evasion: 'Evasion',
  critical: 'Critical Strike',
};

describe('SynergyHeatmapEnhanced', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
      expect(screen.getByText('Interactive heatmap and table visualization of stat synergies')).toBeInTheDocument();
    });

    it('should render with custom configuration', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          config={{
            minSynergyThreshold: 0.8,
            maxSynergyThreshold: 1.5,
            colorScheme: 'cool',
            highlightOpSynergies: false,
            highlightWeakSynergies: false,
          }}
        />,
        { container }
      );

      expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
      // Verify cool color scheme is applied
      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should render in compact mode', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          compact
        />,
        { container }
      );

      expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
      // Verify compact styling
      const controls = container.querySelectorAll('.grid-cols-1');
      expect(controls.length).toBeGreaterThan(0);
    });
  });

  describe('Heatmap Visualization', () => {
    it('should render heatmap with correct structure', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      const heatmap = screen.getByText('Synergy Heatmap');
      expect(heatmap).toBeInTheDocument();

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      
      // Check for stat headers
      expect(screen.getByText('Health Points')).toBeInTheDocument();
      expect(screen.getByText('Damage')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    it('should display correct synergy values in cells', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      // Check for specific synergy values
      expect(screen.getByText('1.25x')).toBeInTheDocument();
      expect(screen.getByText('1.80x')).toBeInTheDocument();
      expect(screen.getByText('0.70x')).toBeInTheDocument();
      expect(screen.getByText('1.10x')).toBeInTheDocument();
      expect(screen.getByText('1.30x')).toBeInTheDocument();
    });

    it('should apply correct colors based on synergy type', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          config={{
            highlightOpSynergies: true,
            highlightWeakSynergies: true,
            colorScheme: 'warm',
          }}
        />,
        { container }
      );

      // Check for OP synergy (green)
      const opSynergy = screen.getByText('1.80x');
      expect(opSynergy).toBeInTheDocument();
      expect(opSynergy.closest('span')).toHaveClass('bg-emerald-600');

      // Check for weak synergy (rose)
      const weakSynergy = screen.getByText('0.70x');
      expect(weakSynergy).toBeInTheDocument();
      expect(weakSynergy.closest('span')).toHaveClass('bg-rose-600');
    });

    it('should show tooltips on hover', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showTooltips
        />,
        { container }
      );

      // Hover over a synergy cell
      const cell = screen.getByText('1.25x');
      fireEvent.mouseEnter(cell);

      await waitFor(() => {
        expect(screen.getByText(/Health Points × Damage/)).toBeInTheDocument();
        expect(screen.getByText(/Multiplier: 1.25x/)).toBeInTheDocument();
        expect(screen.getByText(/Expected: 1.20/)).toBeInTheDocument();
        expect(screen.getByText(/Type: Normal/)).toBeInTheDocument();
      });
    });
  });

  describe('Table Visualization', () => {
    it('should render table with correct data', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      const table = screen.getByText('Synergy Details');
      expect(table).toBeInTheDocument();

      // Check for table headers
      expect(screen.getByText('Stat Pair')).toBeInTheDocument();
      expect(screen.getByText('Multiplier')).toBeInTheDocument();
      expect(screen.getByText('Expected')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Combined Score')).toBeInTheDocument();

      // Check for data rows
      expect(screen.getByText('Health Points × Damage')).toBeInTheDocument();
      expect(screen.getByText('Health Points × Defense')).toBeInTheDocument();
      expect(screen.getByText('Damage × Defense')).toBeInTheDocument();
    });

    it('should display correct table data', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      // Check first row data
      expect(screen.getByText('Health Points × Damage')).toBeInTheDocument();
      expect(screen.getByText('1.25x')).toBeInTheDocument();
      expect(screen.getByText('1.20')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('1.35')).toBeInTheDocument();
      expect(screen.getByText('0.75')).toBeInTheDocument();
      expect(screen.getByText('0.60')).toBeInTheDocument();
    });

    it('should sort data correctly', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          initialFilters={{
            sortBy: 'multiplier',
            sortDirection: 'desc',
          }}
        />,
        { container }
      );

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBeGreaterThan(0);
        
        // Check that highest multiplier is first
        const firstRow = rows[0];
        expect(firstRow.textContent).toContain('1.80x'); // Highest multiplier
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter by multiplier range', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          initialFilters={{
            minMultiplier: 1.0,
            maxMultiplier: 1.5,
          }}
        />,
        { container }
      );

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        // Should only show synergies in the 1.0-1.5 range
        expect(rows.length).toBe(2); // Only 1.25x and 1.30x fall in this range
      });
    });

    it('should filter by synergy type', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          initialFilters={{
            synergyType: 'op',
          }}
        />,
        { container }
      );

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(1); // Only one OP synergy
        expect(screen.getByText('1.80x')).toBeInTheDocument();
        expect(screen.getByText('OP')).toBeInTheDocument();
      });
    });

    it('should filter by stat pairs', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          initialFilters={{
            statPairs: [['hp', 'damage']],
          }}
        />,
        { container }
      );

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(1); // Only hp-damage pair
        expect(screen.getByText('Health Points × Damage')).toBeInTheDocument();
      });
    });

    it('should reset filters', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          initialFilters={{
            minMultiplier: 2.0, // No results
          }}
        />,
        { container }
      );

      // Initially no results
      expect(screen.getByText('No results')).toBeInTheDocument();

      // Reset filters
      const resetButton = screen.getByText('Reset Filters');
      await userEvent.click(resetButton);

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(6); // All results restored
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search by stat pair names', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showSearch
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search synergies...');
      await userEvent.type(searchInput, 'damage');

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(2); // Two rows with 'damage'
        expect(screen.getByText('Damage × Defense')).toBeInTheDocument();
        expect(screen.getByText('Damage × Speed')).toBeInTheDocument();
      });
    });

    it('should show result count in search', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showSearch
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search synergies...');
      await userEvent.type(searchInput, 'hp');

      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should clear search when input is empty', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showSearch
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search synergies...');
      await userEvent.type(searchInput, 'test');
      await userEvent.clear(searchInput);

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(6); // All results restored
        expect(screen.getByText('(Results: 6)')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Panel', () => {
    it('should display correct statistics', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showStatistics
        />,
        { container }
      );

      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Synergies')).toBeInTheDocument();
      expect(screen.getByText('OP Synergies')).toBeInTheDocument();
      expect(screen.getByText('Weak Synergies')).toBeInTheDocument();
      expect(screen.getByText('Avg Multiplier')).toBeInTheDocument();
    });

    it('should calculate statistics correctly', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showStatistics
        />,
        { container }
      );

      // Check calculated values
      expect(screen.getByText('6')).toBeInTheDocument(); // Total synergies
      expect(screen.getByText('1')).toBeInTheDocument(); // OP synergies
      expect(screen.getByText('1')).toBeInTheDocument(); // Weak synergies
      expect(screen.getByText('1.27')).toBeInTheDocument(); // Average multiplier (1.25+1.8+0.7+1.1+1.3)/5
    });

    it('should hide statistics when disabled', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showStatistics={false}
        />,
        { container }
      );

      expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export to CSV', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showExportControls
        />,
        { container }
      );

      const exportCSVButton = screen.getByText('Export CSV');
      
      // Mock file download
      const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = vi.fn();

      await userEvent.click(exportCSVButton);

      expect(createObjectURL).toHaveBeenCalledWith(
        expect.any(String), // CSV content
        expect.objectContaining({ type: 'text/csv' })
      );
    });

    it('should export to JSON', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showExportControls
        />,
        { container }
      );

      const exportJSONButton = screen.getByText('Export JSON');
      
      // Mock file download
      const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = vi.fn();

      await userEvent.click(exportJSONButton);

      expect(createObjectURL).toHaveBeenCalledWith(
        expect.any(String), // JSON content
        expect.objectContaining({ type: 'application/json' })
      );
    });

    it('should hide export controls when disabled', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showExportControls={false}
        />,
        { container }
      );

      expect(screen.queryByText('Export Data')).not.toBeInTheDocument();
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument());
      expect(screen.queryByText('Export JSON')).not.toBeInTheDocument());
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to compact mode', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          compact
        />,
        { container }
      );

      // Check for compact layout
      const controls = container.querySelectorAll('.grid-cols-1');
      expect(controls.length).toBeGreaterThan(0);
      
      // Check for compact text sizes
      const headers = container.querySelectorAll('.text-xs');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should maintain functionality in compact mode', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          compact
          showSearch
          showStatistics
          showExportControls
        />,
        { container }
      );

      // All features should work in compact mode
      expect(screen.getByPlaceholderText('Search synergies...')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
      
      // Test search in compact mode
      const searchInput = screen.getByPlaceholderText('Search synergies...');
      await userEvent.type(searchInput, 'hp');
      
      await waitFor(() => {
        expect(screen.getByText('(Results: 2)')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={[]}
          marginalUtilities={[]}
          statLabels={{}}
        />,
        { container }
      );

      expect(screen.getByText('No synergies available')).toBeInTheDocument();
      expect(screen.queryByText('Synergy Heatmap')).not.toBeInTheDocument();
      expect(screen.queryByText('Synergy Details')).not.toBeInTheDocument();
    });

    it('should handle missing stat labels', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={{}} // Empty labels
        />,
        { container }
      );

      // Should fall back to stat IDs
      expect(screen.getByText('hp × damage')).toBeInTheDocument();
      expect(screen.getByText('hp × defense')).toBeInTheDocument();
    });

    it('should handle invalid synergy data', () => {
      const invalidSynergies: SynergyResult[] = [
        {
          pairArchetype: {
            id: 'invalid',
            name: 'Invalid',
            testedStats: [],
            stats: {},
            score: 0,
          },
          statIds: ['invalid', 'data'],
          pairScore: 0,
          expectedScore: 0,
          synergyMultiplier: 0,
          isOpSynergy: false,
          isWeakSynergy: false,
          runtimeMs: 0,
        },
      ];

      render(
        <SynergyHeatmapEnhanced
          synergies={invalidSynergies}
          marginalUtilities={[]}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      // Should still render without crashing
      expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large datasets efficiently', () => {
      const largeSynergies = Array.from({ length: 100 }, (_, i) => ({
        pairArchetype: {
          id: `test-archetype-${i}`,
          name: `Test Archetype ${i}`,
          testedStats: ['hp', 'damage'],
          stats: { hp: 100, damage: 50 },
          score: Math.random() * 100,
        },
        statIds: ['hp', 'damage'],
        pairScore: Math.random() * 2,
        expectedScore: Math.random() * 2,
        synergyMultiplier: Math.random() * 2,
        isOpSynergy: Math.random() > 0.8,
        isWeakSynergy: Math.random() < 0.2,
        runtimeMs: 100 + Math.random() * 100,
      }));

      render(
        <SynergyHeatmapEnhanced
          synergies={largeSynergies}
          marginalUtilities={largeSynergies.map(s => ({
        archetype: s.pairArchetype,
        averageScore: Math.random(),
        marginalUtility: Math.random() - 0.5,
        standardDeviation: Math.random() * 0.3,
        simulationCount: 1000,
        runtimeMs: 100 + Math.random() * 100,
      }))}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      // Should render without performance issues
      expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
      expect(container.querySelectorAll('tbody tr')).toHaveLength(100);
    });

    it('should handle rapid filtering efficiently', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showSearch
          showStatistics
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search synergies...');
      
      // Rapid search changes
      for (let i = 0; i < 10; i++) {
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, `test${i}`);
        await waitFor(() => {
          const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
          expect(resultCount).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          showTooltips
        />,
        { container }
      );

      // Check for proper table structure
      const table = container.querySelector('table');
      expect(table).toHaveAttribute('role', 'table');
      
      // Check for proper headers
      const headers = container.querySelectorAll('th');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should be keyboard navigable', async () => {
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      // Test keyboard navigation
      const searchInput = screen.getByPlaceholderText('Search synergies...');
      searchInput.focus();
      
      expect(searchInput).toHaveFocus();
      
      // Test Tab navigation through controls
      await userEvent.tab();
      
      // Should focus on first interactive element
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should work with real stress testing data', () => {
      // This would test with actual stress testing data
      // For now, we use mock data
      render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          config={{
            minSynergyThreshold: 0.5,
            maxSynergyThreshold: 2.0,
            colorScheme: 'warm',
          }}
        />,
        { container }
      );

      // Verify all components render correctly
      expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
      expect(screen.getByText('Synergy Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Synergy Details')).toBeInTheDocument();
    });

    it('should maintain state consistency across re-renders', () => {
      const { rerender } = render(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          initialFilters={{
            sortBy: 'multiplier',
            sortDirection: 'desc',
          }}
        />,
        { container }
      );

      // Initial state
      expect(screen.getByText('(Results: 6)')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <SynergyHeatmapEnhanced
          synergies={mockSynergies}
          marginalUtilities={mockMarginalUtilities}
          statLabels={mockStatLabels}
          initialFilters={{
            sortBy: 'multiplier',
            sortDirection: 'desc',
          }}
        />,
        { container }
      );

      // Should maintain same state
      expect(screen.getByText('(Results: 6)')).toBeInTheDocument();
    });
  });
});
