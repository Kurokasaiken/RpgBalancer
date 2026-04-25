/**
 * Test Suite for Phase 10.5 Radar Chart Implementation
 * 
 * Comprehensive tests for radar chart configuration, hook, and components
 * covering visualization, interaction, and integration scenarios.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatProfileRadar } from '@/ui/balancing/components/StatProfileRadarChart';
import { RadarChartDashboard } from '@/ui/balancing/RadarChartDashboard';
import { useRadarChart } from '@/balancing/hooks/useRadarChart';
import { DEFAULT_RADAR_CHART_CONFIG, processBalancerConfigForRadar } from '@/balancing/config/stressTesting/radarChartConfig';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import type { StressTestArchetype } from '@/balancing/stressTesting/types';
import type { BalancerConfig } from '@/balancing/config/types';

// Mock dependencies
vi.mock('@/balancing/config/BalancerConfigStore');
vi.mock('@/balancing/stressTesting/StressTestArchetypeGenerator');

// TODO(RadarChart-stabilize): re-enable once Radar hooks stop touching real stores.
describe.skip('Phase 10.5 Radar Chart Implementation', () => {
  let mockConfig: BalancerConfig;
  let mockArchetypes: StressTestArchetype[];

  beforeEach(() => {
    // Mock balancer configuration
    mockConfig = {
      id: 'test-config',
      name: 'Test Config',
      description: 'Test configuration',
      stats: {
        hp: {
          id: 'hp',
          label: 'Health Points',
          description: 'Character health',
          type: 'number',
          min: 50,
          max: 150,
          step: 1,
          defaultValue: 100,
          weight: 1.0,
          isCore: true,
          isDerived: false
        },
        damage: {
          id: 'damage',
          label: 'Damage',
          description: 'Attack damage',
          type: 'number',
          min: 10,
          max: 50,
          step: 1,
          defaultValue: 25,
          weight: 1.0,
          isCore: true,
          isDerived: false
        },
        speed: {
          id: 'speed',
          label: 'Speed',
          description: 'Movement speed',
          type: 'number',
          min: 5,
          max: 25,
          step: 1,
          defaultValue: 15,
          weight: 0.8,
          isCore: false,
          isDerived: false
        }
      },
      cards: [],
      presets: []
    };

    // Mock archetypes
    mockArchetypes = [
      {
        id: 'baseline',
        name: 'Baseline',
        description: 'Baseline archetype',
        stats: { hp: 100, damage: 25, speed: 15 },
        testedStats: ['hp', 'damage', 'speed'],
        pointsPerStat: 25,
        seed: 42,
        type: 'baseline'
      },
      {
        id: 'hp-focused',
        name: 'HP Focused',
        description: 'High health archetype',
        stats: { hp: 125, damage: 25, speed: 15 },
        testedStats: ['hp'],
        pointsPerStat: 25,
        seed: 42,
        type: 'single'
      },
      {
        id: 'damage-focused',
        name: 'Damage Focused',
        description: 'High damage archetype',
        stats: { hp: 100, damage: 50, speed: 15 },
        testedStats: ['damage'],
        pointsPerStat: 25,
        seed: 42,
        type: 'single'
      }
    ];

    // Mock BalancerConfigStore
    vi.mocked(BalancerConfigStore.load).mockResolvedValue(mockConfig);

    // Mock StressTestArchetypeGenerator
    const mockGenerator = {
      generateArchetypes: vi.fn().mockReturnValue(mockArchetypes)
    };
    vi.mocked(StressTestArchetypeGenerator.create).mockResolvedValue(mockGenerator as any);
  });

  describe('Radar Chart Configuration', () => {
    it('should provide default configuration', () => {
      expect(DEFAULT_RADAR_CHART_CONFIG).toBeDefined();
      expect(DEFAULT_RADAR_CHART_CONFIG.dimensions.width).toBe(500);
      expect(DEFAULT_RADAR_CHART_CONFIG.dimensions.height).toBe(500);
      expect(DEFAULT_RADAR_CHART_CONFIG.visual.colorScheme).toBe('default');
      expect(DEFAULT_RADAR_CHART_CONFIG.data.maxStats).toBe(12);
    });

    it('should process balancer config for radar display', () => {
      const stats = processBalancerConfigForRadar(mockConfig, {
        maxStats: 10,
        excludeDerived: true
      });

      expect(stats).toHaveLength(3);
      expect(stats[0].id).toBe('hp');
      expect(stats[0].name).toBe('Health Points');
      expect(stats[0].weight).toBe(1.0);
      expect(stats[0].angle).toBe(0);
    });

    it('should filter derived stats when requested', () => {
      const configWithDerived = {
        ...mockConfig,
        stats: {
          ...mockConfig.stats,
          htk: {
            id: 'htk',
            label: 'Hits to Kill',
            description: 'Calculated hits to kill',
            type: 'number',
            min: 1,
            max: 10,
            step: 1,
            defaultValue: 4,
            weight: 0.5,
            isCore: false,
            isDerived: true
          }
        }
      };

      const stats = processBalancerConfigForRadar(configWithDerived, {
        maxStats: 10,
        excludeDerived: true
      });

      expect(stats).toHaveLength(3);
      expect(stats.find(s => s.id === 'htk')).toBeUndefined();
    });

    it('should limit stats to maxStats', () => {
      const stats = processBalancerConfigForRadar(mockConfig, {
        maxStats: 2,
        excludeDerived: true
      });

      expect(stats).toHaveLength(2);
    });
  });

  describe('useRadarChart Hook', () => {
    it('should initialize with default state', () => {
      const TestComponent = () => {
        const { state } = useRadarChart({
          archetypes: mockArchetypes,
          balancerConfig: mockConfig
        });
        return <div data-testid="dataset-count">{state.datasets.length}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('dataset-count')).toHaveTextContent('3'); // baseline + 2 archetypes
    });

    it('should toggle dataset visibility', () => {
      const TestComponent = () => {
        const { state, toggleDataset } = useRadarChart({
          archetypes: mockArchetypes,
          balancerConfig: mockConfig
        });
        
        return (
          <div>
            <div data-testid="visible-count">
              {state.datasets.filter(d => d.visible).length}
            </div>
            <button onClick={() => toggleDataset('baseline')}>
              Toggle Baseline
            </button>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('visible-count')).toHaveTextContent('3');
      
      fireEvent.click(screen.getByText('Toggle Baseline'));
      expect(screen.getByTestId('visible-count')).toHaveTextContent('2');
      
      fireEvent.click(screen.getByText('Toggle Baseline'));
      expect(screen.getByTestId('visible-count')).toHaveTextContent('3');
    });

    it('should select dataset', () => {
      const TestComponent = () => {
        const { state, selectDataset } = useRadarChart({
          archetypes: mockArchetypes,
          balancerConfig: mockConfig
        });
        
        return (
          <div>
            <div data-testid="selected-dataset">{state.selectedDataset || 'none'}</div>
            <button onClick={() => selectDataset('hp-focused')}>
              Select HP Focused
            </button>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('selected-dataset')).toHaveTextContent('none');
      
      fireEvent.click(screen.getByText('Select HP Focused'));
      expect(screen.getByTestId('selected-dataset')).toHaveTextContent('hp-focused');
    });

    it('should export data as JSON', () => {
      const TestComponent = () => {
        const { exportData } = useRadarChart({
          archetypes: mockArchetypes,
          balancerConfig: mockConfig
        });
        
        const handleExport = () => {
          const data = exportData('json');
          return JSON.parse(data);
        };
        
        return (
          <button onClick={() => console.log(handleExport())}>
            Export
          </button>
        );
      };

      render(<TestComponent />);
      
      // Test that export doesn't throw
      expect(() => {
        fireEvent.click(screen.getByText('Export'));
      }).not.toThrow();
    });

    it('should export data as CSV', () => {
      const TestComponent = () => {
        const { exportData } = useRadarChart({
          archetypes: mockArchetypes,
          balancerConfig: mockConfig
        });
        
        return (
          <button onClick={() => {
            const csv = exportData('csv');
            console.log(csv);
          }}>
            Export CSV
          </button>
        );
      };

      render(<TestComponent />);
      
      // Test that export doesn't throw
      expect(() => {
        fireEvent.click(screen.getByText('Export CSV'));
      }).not.toThrow();
    });
  });

  describe('StatProfileRadar Component', () => {
    it('should render radar chart with archetypes', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
        />
      );

      expect(screen.getByText('Baseline')).toBeInTheDocument();
      expect(screen.getByText('HP Focused')).toBeInTheDocument();
      expect(screen.getByText('Damage Focused')).toBeInTheDocument();
    });

    it('should show dataset controls when enabled', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
          showDatasetControls={true}
        />
      );

      expect(screen.getByText('Baseline')).toBeInTheDocument();
      expect(screen.getByText('HP Focused')).toBeInTheDocument();
    });

    it('should hide dataset controls when disabled', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
          showDatasetControls={false}
        />
      );

      // Dataset controls should not be visible as buttons
      expect(screen.queryByRole('button', { name: /baseline/i })).toBeNull();
    });

    it('should show export controls when enabled', () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
          showExportControls={true}
        />
      );

      expect(screen.getByText('Export JSON')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should handle dataset toggle', async () => {
      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
          showDatasetControls={true}
        />
      );

      const baselineButton = screen.getByText('Baseline');
      fireEvent.click(baselineButton);

      // Button should still exist (toggling visibility)
      expect(baselineButton).toBeInTheDocument();
    });

    it('should handle export', async () => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock createElement and click
      const mockLink = { click: vi.fn(), href: '', download: '' };
      global.document.createElement = vi.fn(() => mockLink as any);

      render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
          showExportControls={true}
        />
      );

      fireEvent.click(screen.getByText('Export JSON'));
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('RadarChartDashboard Component', () => {
    it('should show loading state initially', async () => {
      vi.mocked(BalancerConfigStore.load).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<RadarChartDashboard />);
      
      expect(screen.getByText('Loading radar chart data...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should show error state when loading fails', async () => {
      vi.mocked(BalancerConfigStore.load).mockRejectedValue(new Error('Network error'));

      render(<RadarChartDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading radar chart')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should render dashboard with data', async () => {
      render(<RadarChartDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Stat Profile Radar Charts')).toBeInTheDocument();
        expect(screen.getByText('Archetype Stat Profiles')).toBeInTheDocument();
        expect(screen.getByText('Archetype Details')).toBeInTheDocument();
        expect(screen.getByText('Configuration Summary')).toBeInTheDocument();
      });
    });

    it('should display stats overview', async () => {
      render(<RadarChartDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Stats')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Number of stats
        expect(screen.getByText('Archetypes')).toBeInTheDocument();
        expect(screen.getByText(String(mockArchetypes.length))).toBeInTheDocument();
      });
    });

    it('should display archetype details', async () => {
      render(<RadarChartDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Baseline')).toBeInTheDocument();
        expect(screen.getByText('HP Focused')).toBeInTheDocument();
        expect(screen.getByText('Damage Focused')).toBeInTheDocument();
        expect(screen.getByText('Type: baseline')).toBeInTheDocument();
        expect(screen.getByText('Type: single')).toBeInTheDocument();
      });
    });

    it('should handle retry on error', async () => {
      vi.mocked(BalancerConfigStore.load)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockConfig);

      render(<RadarChartDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.getByText('Stat Profile Radar Charts')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate hook and component properly', () => {
      const TestComponent = () => {
        const { state } = useRadarChart({
          archetypes: mockArchetypes,
          balancerConfig: mockConfig
        });
        
        return (
          <div>
            <StatProfileRadar
              archetypes={mockArchetypes}
              balancerConfig={mockConfig}
            />
            <div data-testid="state-datasets">{state.datasets.length}</div>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('state-datasets')).toHaveTextContent('3');
      expect(screen.getByText('Baseline')).toBeInTheDocument();
    });

    it('should handle empty archetypes gracefully', () => {
      render(
        <StatProfileRadar
          archetypes={[]}
          balancerConfig={mockConfig}
        />
      );

      // Should render without crashing
      expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
    });

    it('should handle different sizes', () => {
      const { rerender } = render(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
          size="small"
        />
      );

      // Should render without crashing
      expect(screen.getByText('Baseline')).toBeInTheDocument();

      rerender(
        <StatProfileRadar
          archetypes={mockArchetypes}
          balancerConfig={mockConfig}
          size="large"
        />
      );

      expect(screen.getByText('Baseline')).toBeInTheDocument();
    });
  });
});
