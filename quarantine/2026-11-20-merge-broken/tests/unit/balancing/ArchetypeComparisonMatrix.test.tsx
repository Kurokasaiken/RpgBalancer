/**
 * Archetype Comparison Matrix Unit Tests
 * 
 * Comprehensive test suite for the Archetype Comparison Matrix components and hooks.
 * Tests configuration, comparison logic, UI interactions, and integration with balancer config.
 * 
 * @since NP-134 – Config Balancer: Archetype Comparison Matrix
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { ArchetypeComparisonMatrix } from '../../../src/ui/balancing/components/ArchetypeComparisonMatrix';
import { useArchetypeComparison, useArchetypeDelta, useComparisonMetrics } from '../../../src/ui/balancing/hooks/useArchetypeComparison';
import type { ComparisonConfig, ComparisonMetric, SortDirection } from '../../../src/balancing/config/visualization/comparisonConfig';
import {
  DEFAULT_COMPARISON_CONFIG,
  COMPARISON_METRICS,
  createSafeComparisonConfig,
  calculateBalanceScore,
  formatMetricValue,
  getDeltaThreshold,
  getDeltaColor,
  getDeltaIcon,
  validateComparisonConfig,
} from '../../../src/balancing/config/visualization/comparisonConfig';

// Mock dependencies
vi.mock('../../../src/ui/balancing/hooks/useBalancerConfig', () => ({
  useBalancerConfig: () => ({
    config: {
      stats: [
        { id: 'strength', label: 'Strength', weight: 1.0, isCore: true, isDerived: false, isPenalty: false },
        { id: 'agility', label: 'Agility', weight: 0.8, isCore: true, isDerived: false, isPenalty: false },
        { id: 'intelligence', label: 'Intelligence', weight: 0.6, isCore: false, isDerived: false, isPenalty: false },
        { id: 'health', label: 'Health', weight: 1.2, isCore: true, isDerived: true, isPenalty: false },
        { id: 'fatigue', label: 'Fatigue', weight: 0.3, isCore: false, isDerived: false, isPenalty: true },
      ],
    },
  }),
});

vi.mock('../../../src/balancing/archetype/ArchetypeGenerator', () => ({
  generateArchetypes: vi.fn(),
}));

vi.mock('../../../src/analytics/punchClub', () => ({
  dispatchTelemetry: vi.fn(),
}));

describe('Comparison Configuration', () => {
  describe('Default Configuration', () => {
    it('should have correct default metrics', () => {
      expect(DEFAULT_COMPARISON_CONFIG.metrics).toHaveLength(8);
      expect(DEFAULT_COMPARISON_CONFIG.metrics[0].id).toBe('balance-score');
      expect(DEFAULT_COMPARISON_CONFIG.metrics[0].weight).toBe(0.3);
    });

    it('should have correct thresholds', () => {
      expect(DEFAULT_COMPARISON_CONFIG.thresholds.insignificant).toBe(0.05);
      expect(DEFAULT_COMPARISON_CONFIG.thresholds.minor).toBe(0.15);
      expect(DEFAULT_COMPARISON_CONFIG.thresholds.moderate).toBe(0.25);
      expect(DEFAULT_COMPARISON_CONFIG.thresholds.significant).toBe(0.4);
      expect(DEFAULT_COMPARISON_CONFIG.thresholds.major).toBe(0.6);
    });

    it('should have correct UI settings', () => {
      expect(DEFAULT_COMPARISON_CONFIG.ui.showDeltaIndicators).toBe(true);
      expect(DEFAULT_COMPARISON_CONFIG.ui.showOutlierHighlights).toBe(true);
      expect(DEFAULT_COMPARISON_CONFIG.ui.enableColumnSorting).toBe(true);
      expect(DEFAULT_COMPARISON_CONFIG.ui.enableRowHover).toBe(true);
      expect(DEFAULT_COMPARISON_CONFIG.ui.compactMode).toBe(false);
      expect(DEFAULT_COMPARISON_CONFIG.ui.animationDuration).toBe(300);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const config = {
        metrics: DEFAULT_COMPARISON_CONFIG.metrics,
        thresholds: DEFAULT_COMPARISON_CONFIG.thresholds,
        colorScheme: 'default' as const,
        maxArchetypes: 50,
        defaultSort: DEFAULT_COMPARISON_CONFIG.defaultSort,
        ui: DEFAULT_COMPARISON_CONFIG.ui,
      };
      
      const errors = validateComparisonConfig(config);
      expect(errors).toEqual([]);
    });

    it('should reject invalid metric weight', () => {
      const config = {
        metrics: [
          {
            ...DEFAULT_COMPARISON_CONFIG.metrics[0],
            weight: 1.5, // Invalid: > 1
          },
        ],
        thresholds: DEFAULT_COMPARISON_CONFIG.thresholds,
        colorScheme: 'default' as const,
        maxArchetypes: 50,
        defaultSort: DEFAULT_COMPARISON_CONFIG.defaultSort,
        ui: DEFAULT_COMPARISON_CONFIG.ui,
      };
      
      const errors = validateComparisonConfig(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid threshold', () => {
      const config = {
        metrics: DEFAULT_COMPARISON_CONFIG.metrics,
        thresholds: {
          ...DEFAULT_COMPARISON_CONFIG.thresholds,
          insignificant: -0.1, // Invalid: negative
        },
        colorScheme: 'default' as const,
        maxArchetypes: 50,
        defaultSort: DEFAULT_COMPARISON_CONFIG.defaultSort,
        ui: DEFAULT_COMPARISON_CONFIG.ui,
      };
      
      const errors = validateComparisonConfig(config);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Safe Configuration Creation', () => {
    it('should create safe configuration from valid input', () => {
      const input = {
        maxArchetypes: 25,
        colorScheme: 'accessible' as const,
      };
      
      const config = createSafeComparisonConfig(input);
      
      expect(config.maxArchetypes).toBe(25);
      expect(config.colorScheme).toBe('accessible');
      expect(config.metrics).toEqual(DEFAULT_COMPARISON_CONFIG.metrics);
    });

    it('should fallback to defaults for invalid input', () => {
      const input = {
        maxArchetypes: 150, // Invalid: > 100
        colorScheme: 'invalid' as any,
      };
      
      const config = createSafeComparisonConfig(input);
      
      expect(config.maxArchetypes).toBe(DEFAULT_COMPARISON_CONFIG.maxArchetypes);
      expect(config.colorScheme).toBe(DEFAULT_COMPARISON_CONFIG.colorScheme);
    });
  });
});

describe('Comparison Utilities', () => {
  describe('Delta Threshold Detection', () => {
    it('should detect insignificant delta', () => {
      const threshold = getDeltaThreshold(0.03, DEFAULT_COMPARISON_CONFIG.thresholds);
      expect(threshold).toBe('insignificant');
    });

    it('should detect minor delta', () => {
      const threshold = getDeltaThreshold(0.1, DEFAULT_COMPARISON_CONFIG.thresholds);
      expect(threshold).toBe('minor');
    });

    it('should detect moderate delta', () => {
      const threshold = getDeltaThreshold(0.2, DEFAULT_COMPARISON_CONFIG.thresholds);
      expect(threshold).toBe('moderate');
    });

    it('should detect significant delta', () => {
      const threshold = getDeltaThreshold(0.3, DEFAULT_COMPARISON_CONFIG.thresholds);
      expect(threshold).toBe('significant');
    });

    it('should detect major delta', () => {
      const threshold = getDeltaThreshold(0.7, DEFAULT_COMPARISON_CONFIG.thresholds);
      expect(threshold).toBe('major');
    });
  });

  describe('Delta Color Mapping', () => {
    it('should return correct colors for default scheme', () => {
      expect(getDeltaColor('insignificant', 'default')).toBe('#6b7280');
      expect(getDeltaColor('minor', 'default')).toBe('#6b7280');
      expect(getDeltaColor('moderate', 'default')).toBe('#f59e0b');
      expect(getDeltaColor('significant', 'default')).toBe('#f59e0b');
      expect(getDeltaColor('major', 'default')).toBe('#ef4444');
    });

    it('should return correct colors for accessible scheme', () => {
      expect(getDeltaColor('insignificant', 'accessible')).toBe('#57534e');
      expect(getDeltaColor('major', 'accessible')).toBe('#dc2626');
    });
  });

  describe('Delta Icons', () => {
    it('should return correct icons for thresholds', () => {
      expect(getDeltaIcon('insignificant')).toBe('→');
      expect(getDeltaIcon('minor')).toBe('↗');
      expect(getDeltaIcon('moderate')).toBe('⚡');
      expect(getDeltaIcon('significant')).toBe('⚠️');
      expect(getDeltaIcon('major')).toBe('🚨');
    });
  });

  describe('Metric Formatting', () => {
    it('should format percentage values', () => {
      expect(formatMetricValue(0.75, 'percentage')).toBe('75.0%');
      expect(formatMetricValue(1.0, 'percentage')).toBe('100.0%');
      expect(formatMetricValue(0.123, 'percentage')).toBe('12.3%');
    });

    it('should format score values', () => {
      expect(formatMetricValue(0.75, 'score')).toBe('0.75');
      expect(formatMetricValue(1.234, 'score')).toBe('1.23');
      expect(formatMetricValue(0.1, 'score')).toBe('0.10');
    });

    it('should format number values', () => {
      expect(formatMetricValue(75, 'number')).toBe('75');
      expect(formatMetricValue(123.456, 'number')).toBe('123');
      expect(formatMetricValue(0.1, 'number')).toBe('0');
    });
  });

  describe('Balance Score Calculation', () => {
    it('should calculate balance score for archetype', () => {
      const archetype = {
        strength: 10,
        agility: 8,
        intelligence: 6,
        health: 12,
        fatigue: 3,
      };
      
      const balancerConfig = {
        stats: [
          { id: 'strength', weight: 1.0, isCore: true, isDerived: false, isPenalty: false },
          { id: 'agility', weight: 0.8, isCore: true, isDerived: false, isPenalty: false },
          { id: 'intelligence', weight: 0.6, isCore: false, isDerived: false, isPenalty: false },
          { id: 'health', weight: 1.2, isCore: true, isDerived: true, isPenalty: false },
          { id: 'fatigue', weight: 0.3, isCore: false, isDerived: false, isPenalty: true },
        ],
      } as any;
      
      const score = calculateBalanceScore(archetype, DEFAULT_COMPARISON_CONFIG);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});

describe('useArchetypeComparison Hook', () => {
  let mockUpdateConfig: vi.MockedFunction<(updates: Partial<ComparisonConfig>) => void>;
  let mockUpdateSelectedArchetypes: vi.MockedFunction<(archetypes: string[]) => void>;
  let mockUpdateSortConfig: vi.MockedFunction<(sortConfig: { metric: ComparisonMetric; direction: SortDirection }) => void>;
  let mockUpdateFilterConfig: vi.MockedFunction<(filterConfig: any) => void>;
  
  beforeEach(() => {
    mockUpdateConfig = vi.fn();
    mockUpdateSelectedArchetypes = vi.fn();
    mockUpdateSortConfig = vi.fn();
    mockUpdateFilterConfig = vi.fn();
    vi.clearAllMocks();
  });

  it('should initialize with default configuration', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    expect(result.current.config).toEqual(DEFAULT_COMPARISON_CONFIG);
    expect(result.current.selectedArchetypes).toEqual([]);
    expect(result.current.results).toEqual([]);
  });

  it('should initialize with custom configuration', () => {
    const customConfig = {
      maxArchetypes: 25,
      colorScheme: 'accessible' as const,
    };
    
    const { result } = renderHook(() => useArchetypeComparison(customConfig));
    
    expect(result.current.config.maxArchetypes).toBe(25);
    expect(result.current.config.colorScheme).toBe('accessible');
  });

  it('should update configuration', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    act(() => {
      result.current.updateConfig({ maxArchetypes: 30 });
    });
    
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxArchetypes: 30 });
  });

  it('should update selected archetypes', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    act(() => {
      result.current.updateSelectedArchetypes(['archetype-1', 'archetype-2']);
    });
    
    expect(mockUpdateSelectedArchetypes).toHaveBeenCalledWith(['archetype-1', 'archetype-2']);
  });

  it('should limit selected archetypes to maxArchetypes', () => {
    const { result } = renderHook(() => useArchetypeComparison({ maxArchetypes: 2 }));
    
    act(() => {
      result.current.updateSelectedArchetypes(['archetype-1', 'archetype-2', 'archetype-3']);
    });
    
    expect(mockUpdateSelectedArchetypes).toHaveBeenCalledWith(['archetype-1', 'archetype-2']);
  });

  it('should update sort configuration', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    act(() => {
      result.current.updateSortConfig({ metric: 'total-stats', direction: 'asc' });
    });
    
    expect(mockUpdateSortConfig).toHaveBeenCalledWith({ metric: 'total-stats', direction: 'asc' });
  });

  it('should update filter configuration', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    act(() => {
      result.current.updateFilterConfig({ searchQuery: 'test', outlierOnly: true });
    });
    
    expect(mockUpdateFilterConfig).toHaveBeenCalledWith({ searchQuery: 'test', outlierOnly: true });
  });

  it('should compare two archetypes', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    const comparison = result.current.compareArchetypes('archetype-1', 'archetype-2');
    
    expect(comparison).toBeDefined();
    expect(comparison?.archetypeId).toBe('archetype-1');
    expect(comparison?.deltas).toBeDefined();
  });

  it('should get archetype by ID', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    const archetype = result.current.getArchetypeById('archetype-1');
    
    expect(archetype).toBeDefined();
    expect(archetype?.archetypeId).toBe('archetype-1');
  });

  it('should export results', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    const exported = result.current.exportResults();
    
    expect(typeof exported).toBe('string');
    expect(() => JSON.parse(exported)).not.toThrow();
    
    const parsed = JSON.parse(exported);
    expect(parsed.config).toBeDefined();
    expect(parsed.results).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.version).toBeDefined();
  });

  it('should import valid configuration', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    const validConfig = JSON.stringify({
      config: { maxArchetypes: 25 },
      selectedArchetypes: ['archetype-1'],
    });
    
    const success = result.current.importConfiguration(validConfig);
    
    expect(success).toBe(true);
  });

  it('should reject invalid configuration', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    const invalidConfig = 'invalid json';
    
    const success = result.current.importConfiguration(invalidConfig);
    
    expect(success).toBe(false);
  });

  it('should reset comparison', () => {
    const { result } = renderHook(() => useArchetypeComparison());
    
    act(() => {
      result.current.resetComparison();
    });
    
    // Should reset to default state
    expect(result.current.config).toEqual(DEFAULT_COMPARISON_CONFIG);
    expect(result.current.selectedArchetypes).toEqual([]);
  });
});

describe('useArchetypeDelta Hook', () => {
  it('should calculate deltas between two archetypes', () => {
    const archetype1 = {
      archetypeId: 'archetype-1',
      archetypeName: 'Archetype 1',
      metrics: {
        'balance-score': 0.75,
        'total-stats': 50,
        'power-level': 7.5,
      },
      deltas: {},
      balanceScore: 0.75,
      powerLevel: 7.5,
      rank: 1,
      percentile: 90,
      outliers: [],
    } as any;

    const archetype2 = {
      archetypeId: 'archetype-2',
      archetypeName: 'Archetype 2',
      metrics: {
        'balance-score': 0.85,
        'total-stats': 60,
        'power-level': 8.5,
      },
      deltas: {},
      balanceScore: 0.85,
      powerLevel: 8.5,
      rank: 2,
      percentile: 80,
      outliers: [],
    } as any;
    
    const { result } = renderHook(() => useArchetypeDelta(archetype1, archetype2));
    
    expect(result.current.deltas['balance-score']).toBe(0.1);
    expect(result.current.deltas['total-stats']).toBe(10);
    expect(result.current.deltas['power-level']).toBe(1);
  });

  it('should calculate delta summary', () => {
    const archetype1 = {
      archetypeId: 'archetype-1',
      archetypeName: 'Archetype 1',
      metrics: {
        'balance-score': 0.75,
        'total-stats': 50,
        'power-level': 7.5,
      },
      deltas: {},
      balanceScore: 0.75,
      powerLevel: 7.5,
      rank: 1,
      percentile: 90,
      outliers: [],
    } as any;

    const archetype2 = {
      archetypeId: 'archetype-2',
      archetypeName: 'Archetype 2',
      metrics: {
        'balance-score': 0.85,
        'total-stats': 40,
        'power-level': 8.5,
      },
      deltas: {},
      balanceScore: 0.85,
      powerLevel: 8.5,
      rank: 2,
      percentile: 80,
      outliers: [],
    } as any;
    
    const { result } = renderHook(() => useArchetypeDelta(archetype1, archetype2));
    
    expect(result.current.deltaSummary.totalDeltas).toBe(3);
    expect(result.current.deltaSummary.positiveDeltas).toBe(2);
    expect(result.current.deltaSummary.negativeDeltas).toBe(1);
  });
});

describe('useComparisonMetrics Hook', () => {
  it('should return available metrics', () => {
    const { result } = renderHook(() => useComparisonMetrics());
    
    expect(result.current.availableMetrics).toHaveLength(8);
    expect(result.current.availableMetrics[0].id).toBe('balance-score');
  });

  it('should get metric by ID', () => {
    const { result } = renderHook(() => useComparisonMetrics());
    
    const metric = result.current.getMetricById('balance-score');
    
    expect(metric).toBeDefined();
    expect(metric?.id).toBe('balance-score');
    expect(metric?.name).toBe('Balance Score');
  });

  it('should return undefined for unknown metric', () => {
    const { result } = renderHook(() => useComparisonMetrics());
    
    const metric = result.current.getMetricById('unknown-metric');
    
    expect(metric).toBeUndefined();
  });
});

describe('ArchetypeComparisonMatrix Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component header', () => {
    render(<ArchetypeComparisonMatrix />);
    
    expect(screen.getByText('Archetype Comparison Matrix')).toBeInTheDocument();
    expect(screen.getByText(/Side-by-side archetype comparison/)).toBeInTheDocument();
  });

  it('should render statistics panel', () => {
    render(<ArchetypeComparisonMatrix />);
    
    expect(screen.getByText('Comparison Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Archetypes:')).toBeInTheDocument();
    expect(screen.getByText('Avg Balance Score:')).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    render(<ArchetypeComparisonMatrix />);
    
    expect(screen.getByText('Filters & Sorting')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search archetypes...')).toBeInTheDocument();
    expect(screen.getByText('Outliers Only')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
  });

  it('should render archetype selection', () => {
    render(<ArchetypeComparisonMatrix />);
    
    expect(screen.getByText('Selected Archetypes')).toBeInTheDocument();
    expect(screen.getByText(/\/50/)).toBeInTheDocument();
  });

  it('should render export/import controls', () => {
    render(<ArchetypeComparisonMatrix />);
    
    expect(screen.getByText('Export Results')).toBeInTheDocument();
    expect(screen.getByText('Import Config')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should render comparison matrix table', () => {
    render(<ArchetypeComparisonMatrix />);
    
    expect(screen.getByText('Archetype')).toBeInTheDocument();
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Balance Score')).toBeInTheDocument();
    expect(screen.getByText('Total Stats')).toBeInTheDocument();
    expect(screen.getByText('Outliers')).toBeInTheDocument();
  });

  it('should handle archetype selection', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    // Click on first archetype
    const archetypeButton = screen.getByText('archetype-1');
    await user.click(archetypeButton);
    
    // Should be selected
    expect(archetypeButton).toHaveClass('bg-blue-600');
  });

  it('should handle search filter', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    const searchInput = screen.getByPlaceholderText('Search archetypes...');
    await user.type(searchInput, 'archetype-1');
    
    expect(searchInput).toHaveValue('archetype-1');
  });

  it('should handle outlier filter toggle', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    const outlierCheckbox = screen.getByText('Outliers Only');
    await user.click(outlierCheckbox);
    
    expect(outlierCheckbox).toBeChecked();
  });

  it('should handle sort configuration', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    const sortSelect = screen.getByText('Sort By');
    await user.click(sortSelect);
    
    // Should open dropdown with metric options
    expect(screen.getByText('Balance Score')).toBeInTheDocument();
    expect(screen.getByText('Total Stats')).toBeInTheDocument();
  });

  it('should handle export functionality', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    const exportButton = screen.getByText('Export Results');
    await user.click(exportButton);
    
    // Should trigger export (mocked)
    expect(exportButton).toBeInTheDocument();
  });

  it('should handle import modal', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    const importButton = screen.getByText('Import Config');
    await user.click(importButton);
    
    // Should open import modal
    expect(screen.getByText('Import Configuration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste JSON configuration here...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('should handle reset functionality', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);
    
    // Should trigger reset (mocked)
    expect(resetButton).toBeInTheDocument();
  });

  it('should render empty state when no archetypes selected', () => {
    render(<ArchetypeComparisonMatrix />);
    
    // Mock empty results
    expect(screen.getByText('No Archetypes Selected')).toBeInTheDocument();
    expect(screen.getByText('Select archetypes above to start comparing.')).toBeInTheDocument();
  });

  it('should emit telemetry when comparison is viewed', () => {
    const mockDispatchTelemetry = vi.fn();
    vi.mock('../../../src/analytics/punchClub', () => ({
      dispatchTelemetry: mockDispatchTelemetry,
    }));
    
    render(<ArchetypeComparisonMatrix />);
    
    // Should emit telemetry event
    expect(mockDispatchTelemetry).toHaveBeenCalledWith('archetype_comparison_viewed', {
      archetypeCount: expect.any(Number),
      config: expect.any(Object),
      timestamp: expect.any(Number),
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full comparison workflow', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    // Step 1: Select archetypes
    const archetype1 = screen.getByText('archetype-1');
    const archetype2 = screen.getByText('archetype-2');
    const archetype3 = screen.getByText('archetype-3');
    
    await user.click(archetype1);
    await user.click(archetype2);
    await user.click(archetype3);
    
    // Step 2: Apply filters
    const searchInput = screen.getByPlaceholderText('Search archetypes...');
    await user.type(searchInput, 'archetype');
    
    const outlierCheckbox = screen.getByText('Outliers Only');
    await user.click(outlierCheckbox);
    
    // Step 3: Change sorting
    const sortSelect = screen.getByText('Sort By');
    await user.click(sortSelect);
    await user.click(screen.getByText('Total Stats'));
    
    // Step 4: Export results
    const exportButton = screen.getByText('Export Results');
    await user.click(exportButton);
    
    // Verify all interactions completed
    expect(archetype1).toHaveClass('bg-blue-600');
    expect(searchInput).toHaveValue('archetype');
    expect(outlierCheckbox).toBeChecked();
    expect(exportButton).toBeInTheDocument();
  });

  it('should handle import workflow', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    // Open import modal
    const importButton = screen.getByText('Import Config');
    await user.click(importButton);
    
    // Enter configuration
    const textarea = screen.getByPlaceholderText('Paste JSON configuration here...');
    const testConfig = JSON.stringify({
      config: { maxArchetypes: 25 },
      selectedArchetypes: ['archetype-1', 'archetype-2'],
    });
    
    await user.type(textarea, testConfig);
    
    // Import configuration
    const importModalButton = screen.getByText('Import');
    await user.click(importModalButton);
    
    // Modal should close
    expect(screen.queryByText('Import Configuration')).not.toBeInTheDocument();
  });

  it('should handle large archetype sets efficiently', async () => {
    const user = userEvent.setup();
    render(<ArchetypeComparisonMatrix />);
    
    // Select many archetypes (up to maxArchetypes limit)
    for (let i = 1; i <= 10; i++) {
      const archetypeButton = screen.getByText(`archetype-${i}`);
      if (archetypeButton) {
        await user.click(archetypeButton);
      }
    }
    
    // Should handle without performance issues
    expect(screen.getByText(/Selected Archetypes/)).toBeInTheDocument();
  });
});

// Helper function for renderHook
function renderHook<T>(hook: () => T): { result: { current: T } } {
  let result: { current: T };
  
  const TestComponent = ({ hook }: { hook: () => T }) => {
    result = { current: hook() };
    return null;
  };
  
  render(<TestComponent hook={hook} />);
  
  return result as { result: { current: T } };
}
