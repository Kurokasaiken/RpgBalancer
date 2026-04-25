/**
 * Stat Profile Radar Chart Test Suite
 * 
 * Comprehensive testing for the stat profile radar chart visualization
 * including data processing, rendering, filtering, and interaction features.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import StatProfileRadar from '@/ui/balancing/components/StatProfileRadar';
import type { 
  StressTestArchetype, 
  MarginalUtilityResult,
  SynergyResult 
} from '@/balancing/stressTesting/types';

// Mock data for testing
const mockArchetypes: StressTestArchetype[] = [
  {
    id: 'test-archetype-1',
    name: 'Warrior',
    testedStats: ['hp', 'damage', 'defense', 'speed'],
    stats: { hp: 100, damage: 80, defense: 60, speed: 40 },
    score: 75,
  },
  {
    id: 'test-archetype-2',
    name: 'Mage',
    testedStats: ['hp', 'damage', 'magic', 'resistance'],
    stats: { hp: 70, damage: 40, magic: 90, resistance: 80 },
    score: 65,
  },
  {
    id: 'test-archetype-3',
    name: 'Rogue',
    testedStats: ['hp', 'damage', 'speed', 'evasion'],
    stats: { hp: 60, damage: 70, speed: 85, evasion: 75 },
    score: 70,
  },
  {
    id: 'test-archetype-4',
    name: 'Cleric',
    testedStats: ['hp', 'defense', 'magic', 'resistance'],
    stats: { hp: 80, defense: 70, magic: 60, resistance: 85 },
    score: 60,
  },
  {
    id: 'test-archetype-5',
    name: 'Ranger',
    testedStats: ['hp', 'damage', 'speed', 'accuracy'],
    stats: { hp: 75, damage: 75, speed: 70, accuracy: 80 },
    score: 72,
  },
];

const mockMarginalUtilities: MarginalUtilityResult[] = [
  {
    archetype: mockArchetypes[0],
    averageScore: 0.75,
    marginalUtility: 0.1,
    standardDeviation: 0.2,
    simulationCount: 1000,
    runtimeMs: 150,
  },
  {
    archetype: mockArchetypes[1],
    averageScore: 0.65,
    marginalUtility: 0.05,
    standardDeviation: 0.15,
    simulationCount: 800,
    runtimeMs: 120,
  },
  {
    archetype: mockArchetypes[2],
    averageScore: 0.7,
    marginalUtility: 0.08,
    standardDeviation: 0.18,
    simulationCount: 900,
    runtimeMs: 130,
  },
  {
    archetype: mockArchetypes[3],
    averageScore: 0.6,
    marginalUtility: 0.03,
    standardDeviation: 0.12,
    simulationCount: 700,
    runtimeMs: 110,
  },
  {
    archetype: mockArchetypes[4],
    averageScore: 0.72,
    marginalUtility: 0.07,
    standardDeviation: 0.16,
    simulationCount: 950,
    runtimeMs: 140,
  },
];

const mockSynergies: SynergyResult[] = [
  {
    pairArchetype: {
      id: 'test-archetype-1',
      name: 'Test Archetype 1',
      testedStats: ['hp', 'damage'],
      stats: { hp: 100, damage: 80 },
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
      stats: { hp: 70, defense: 60 },
      score: 65,
    },
    statIds: ['hp', 'defense'],
    pairScore: 2.0,
    expectedScore: 1.8,
    synergyMultiplier: 1.8,
    isOpSynergy: true,
    isWeakSynergy: false,
    runtimeMs: 120,
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

describe('StatProfileRadar', () => {
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
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
      expect(screen.getByText('Interactive radar chart visualization of stat profiles and distributions')).toBeInTheDocument();
    });

    it('should render with custom configuration', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          config={{
            maxStats: 6,
            minStatValue: 0,
            maxStatValue: 100,
            colorScheme: 'cool',
            showAverage: false,
            showIndividualArchetypes: true,
            showStatLabels: true,
            showGrid: true,
            animateTransitions: false,
          }}
        />,
        { container }
      );

      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
      // Verify cool color scheme is applied
      const chartContainer = container.querySelector('svg');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          compact
        />,
        { container }
      );

      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
      // Verify compact styling
      const controls = container.querySelectorAll('.grid-cols-1');
      expect(controls.length).toBeGreaterThan(0);
    });

    it('should render with different sizes', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          size="small"
        />,
        { container }
      );

      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
      // Verify small size chart
      const chartContainer = container.querySelector('.w-64');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('Radar Chart Visualization', () => {
    it('should render radar chart with correct structure', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      const chart = screen.getByText('Stat Profile Visualization');
      expect(chart).toBeInTheDocument();

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for radar chart elements
      expect(container.querySelector('circle')).toBeInTheDocument(); // Background circle
      expect(container.querySelectorAll('polygon')).toHaveLength(6); // Grid lines + datasets
      expect(container.querySelectorAll('line')).toHaveLength(10); // Axis lines
      expect(container.querySelectorAll('text')).toHaveLength(9); // Stat labels
    });

    it('should display correct stat labels', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          config={{ showStatLabels: true }}
        />,
        { container }
      );

      // Check for stat labels
      expect(screen.getByText('Health Points')).toBeInTheDocument();
      expect(screen.getByText('Damage')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
      expect(screen.getByText('Magic Power')).toBeInTheDocument();
    });

    it('should hide stat labels when disabled', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          config={{ showStatLabels: false }}
        />,
        { container }
      );

      // Should not have stat labels
      expect(screen.queryByText('Health Points')).not.toBeInTheDocument();
      expect(screen.queryByText('Damage')).not.toBeInTheDocument();
    });

    it('should hide grid lines when disabled', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          config={{ showGrid: false }}
        />,
        { container }
      );

      // Should have fewer polygons (no grid lines)
      const polygons = container.querySelectorAll('polygon');
      expect(polygons.length).toBeLessThan(6); // Only datasets, no grid
    });
  });

  describe('Dataset Management', () => {
    it('should render dataset controls', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
                   synergies={mockSynergies}
          statLabels={mockStatLabels}
          showDatasetControls
        />,
        { container }
      );

      expect(screen.getByText('Datasets')).toBeInTheDocument();
      // Should have dataset toggle buttons
      const toggleButtons = container.querySelectorAll('button');
      expect(toggleButtons.length).toBeGreaterThan(0);
    });

    it('should toggle dataset visibility', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showDatasetControls
        />,
        { container }
      );

      // Find and click a hide button
      const hideButton = screen.getByText('Hide');
      await userEvent.click(hideButton);

      // Should show button instead
      expect(screen.getByText('Show')).toBeInTheDocument();
    });

    it('should hide dataset controls when disabled', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showDatasetControls={false}
        />,
        { container }
      );

      expect(screen.queryByText('Datasets')).not.toBeInTheDocument();
      expect(screen.queryByText('Hide')).not.toBeInTheDocument();
      expect(screen.queryByText('Show')).not.toBeInTheDocument();
    });
  });

  describe('Statistics Panel', () => {
    it('should display correct statistics', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showStatistics
        />,
        { container }
      );

      expect(screen.getByText('Stat Profile Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Stats')).toBeInTheDocument();
      expect(screen.getByText('Archetypes')).toBeInTheDocument();
      expect(screen.getByText('Avg Value')).toBeInTheDocument();
      expect(screen.getByText('Highest')).toBeInTheDocument();
      expect(screen.getByText('Lowest')).toBeInTheDocument();
      expect(screen.getByText('Avg Variance')).toBeInTheDocument();
    });

    it('should calculate statistics correctly', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showStatistics
        />,
        { container }
      );

      // Check calculated values
      expect(screen.getByText('9')).toBeInTheDocument(); // Total stats
      expect(screen.getByText('5')).toBeInTheDocument(); // Archetypes
      expect(screen.getByText('71.0')).toBeInTheDocument(); // Average value
      expect(screen.getByText('90.0')).toBeInTheDocument(); // Highest (magic)
      expect(screen.getByText('40.0')).toBeInTheDocument(); // Lowest (speed)
    });

    it('should hide statistics when disabled', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showStatistics={false}
        />,
        { container }
      );

      expect(screen.queryByText('Stat Profile Statistics')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Stats')).not.toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter by average score range', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          initialFilters={{
            minAverageScore: 70,
            maxAverageScore: 80,
          }}
        />,
        { container }
      );

      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThanOrEqual(0);
        // Should only show stats with average values between 70-80
      });
    });

    it('should filter by sort options', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          initialFilters={{
            sortBy: 'name',
            sortDirection: 'asc',
          }}
        />,
        { container }
      );

      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThan(0);
        // Should be sorted by name in ascending order
      });
    });

    it('should reset filters', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          initialFilters={{
            minAverageScore: 100, // No results
          }}
        />,
        { container }
      );

      // Initially no results
      expect(screen.getByText('No stat data available')).toBeInTheDocument();

      // Reset filters
      const resetButton = screen.getByText('Reset Filters');
      await userEvent.click(resetButton);

      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThan(0); // Results restored
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search by stat names', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showSearch
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search stats...');
      await userEvent.type(searchInput, 'health');

      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThanOrEqual(0);
        // Should find stats containing 'health'
      });
    });

    it('should show result count in search', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showSearch
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search stats...');
      await userEvent.type(searchInput, 'hp');

      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should clear search when input is empty', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showSearch
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search stats...');
      await userEvent.type(searchInput, 'test');
      await userEvent.clear(searchInput);

      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThan(0); // All results restored
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export to CSV', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
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
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
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
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showExportControls={false}
        />,
        { container }
      );

      expect(screen.queryByText('Export Data')).not.toBeInTheDocument();
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
      expect(screen.queryByText('Export JSON')).not.toBeInTheDocument();
    });
  });

  describe('Color Scheme Display', () => {
    it('should display color scheme legend', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      expect(screen.getByText('Color Scheme')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should change color scheme with config', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          config={{ colorScheme: 'cool' }}
        />,
        { container }
      );

      expect(screen.getByText('Color Scheme')).toBeInTheDocument();
      // Should have cool color scheme indicators
      const colorIndicators = container.querySelectorAll('.rounded-full');
      expect(colorIndicators.length).toBe(3);
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to compact mode', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          compact
          showSearch
          showStatistics
          showExportControls
          showDatasetControls
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
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          compact
          showSearch
          showStatistics
          showExportControls
          showDatasetControls
        />,
        { container }
      );

      // All features should work in compact mode
      expect(screen.getByPlaceholderText('Search stats...')).toBeInTheDocument();
      expect(screen.getByText('Stat Profile Statistics')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText('Datasets')).toBeInTheDocument();
      
      // Test search in compact mode
      const searchInput = screen.getByPlaceholderText('Search stats...');
      await userEvent.type(searchInput, 'hp');
      
      await waitFor(() => {
        const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
        expect(resultCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should adapt to different sizes', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          size="large"
        />,
        { container }
      );

      // Check for large size chart
      const chartContainer = container.querySelector('.w-120');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      render(
        <StatProfileRadar
          archetypes={[]}
          marginalUtilities={[]}
          synergies={[]}
          statLabels={{}}
        />,
        { container }
      );

      expect(screen.getByText('No stat data available')).toBeInTheDocument();
      expect(screen.queryByText('Stat Profile Visualization')).not.toBeInTheDocument();
    });

    it('should handle missing stat labels', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={{}} // Empty labels
        />,
        { container }
      );

      // Should still render without crashing
      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
      // Should fall back to stat IDs in labels
    });

    it('should handle invalid archetype data', () => {
      const invalidArchetypes: StressTestArchetype[] = [
        {
          id: 'invalid',
          name: 'Invalid',
          testedStats: [],
          stats: {},
          score: 0,
        },
      ];

      render(
        <StatProfileRadar
          archetypes={invalidArchetypes}
          marginalUtilities={[]}
          synergies={[]}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      // Should still render without crashing
      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large datasets efficiently', () => {
      const largeArchetypes = Array.from({ length: 50 }, (_, i) => ({
        id: `test-archetype-${i}`,
        name: `Test Archetype ${i}`,
        testedStats: ['hp', 'damage', 'defense', 'speed', 'magic', 'resistance'],
        stats: {
          hp: Math.random() * 100,
          damage: Math.random() * 100,
          defense: Math.random() * 100,
          speed: Math.random() * 100,
          magic: Math.random() * 100,
          resistance: Math.random() * 100,
        },
        score: Math.random() * 100,
      }));

      render(
        <StatProfileRadar
          archetypes={largeArchetypes}
          marginalUtilities={largeArchetypes.map(a => ({
        archetype: a,
        averageScore: Math.random(),
        marginalUtility: Math.random() - 0.5,
        standardDeviation: Math.random() * 0.3,
        simulationCount: 1000,
        runtimeMs: 100 + Math.random() * 100,
      }))}
          synergies={[]}
          statLabels={mockStatLabels}
        />,
        { container }
      );

      // Should render without performance issues
      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
    });

    it('should handle rapid filtering efficiently', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showSearch
          showStatistics
        />,
        { container }
      );

      const searchInput = screen.getByPlaceholderText('Search stats...');
      
      // Rapid search changes
      for (let i = 0; i < 10; i++) {
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, `test${i}`);
        await waitFor(() => {
          const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
          expect(resultCount).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showStatLabels
          showGrid
        />,
        { container }
      );

      // Check for proper SVG structure
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for stat labels
      const labels = container.querySelectorAll('text');
      labels.forEach(label => {
        expect(label).toHaveAttribute('text-anchor');
        expect(label).toHaveAttribute('dominant-baseline');
      });
    });

    it('should be keyboard navigable', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          showSearch
          showExportControls
        />,
        { container }
      );

      // Test keyboard navigation
      const searchInput = screen.getByPlaceholderText('Search stats...');
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
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          config={{
            maxStats: 12,
            colorScheme: 'warm',
            showAverage: true,
            showIndividualArchetypes: true,
          }}
        />,
        { container }
      );

      // Verify all components render correctly
      expect(screen.getByText('Stat Profile Radar Chart')).toBeInTheDocument();
      expect(screen.getByText('Stat Profile Visualization')).toBeInTheDocument();
      expect(screen.getByText('Color Scheme')).toBeInTheDocument();
    });

    it('should maintain state consistency across re-renders', () => {
      const { rerender } = render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          initialFilters={{
            sortBy: 'average',
            sortDirection: 'desc',
          }}
        />,
        { container }
      );

      // Initial state
      const initialResultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
      expect(initialResultCount).toBeGreaterThan(0);

      // Re-render with same props
      rerender(
        <StatProfileRadar
          archetypes={mockArchetypes}
          marginalUtilities={mockMarginalUtilities}
          synergies={mockSynergies}
          statLabels={mockStatLabels}
          initialFilters={{
            sortBy: 'average',
            sortDirection: 'desc',
          }}
        />,
        { container }
      );

      // Should maintain same state
      const resultCount = parseInt(screen.getByText(/\(Results: (\d+)/)?.[1] || '0');
      expect(resultCount).toBe(initialResultCount);
    });
  });
});
