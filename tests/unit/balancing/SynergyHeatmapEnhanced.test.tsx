/**
 * Unit tests for Enhanced Synergy Heatmap component and hook
 * 
 * Tests for NP-038 – Balancer Archetype Synergy Heatmap UI
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import SynergyHeatmapEnhanced from '@/ui/balancing/components/SynergyHeatmapEnhanced';
import { useSynergyHeatmapEnhanced } from '@/ui/balancing/hooks/useSynergyHeatmapEnhanced';
import type { SynergyResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import type { MarginalUtilityResult } from '@/balancing/stressTesting/types';

// Mock the enhanced hook
vi.mock('@/ui/balancing/hooks/useSynergyHeatmapEnhanced');

// Mock data
const mockSynergies: SynergyResult[] = [
  {
    statIds: ['hp', 'damage'],
    synergyMultiplier: 1.25,
    expectedScore: 0.85,
    pairScore: 1.06,
    isOpSynergy: true,
    isWeakSynergy: false,
  },
  {
    statIds: ['hp', 'defense'],
    synergyMultiplier: 0.95,
    expectedScore: 0.78,
    pairScore: 0.74,
    isOpSynergy: false,
    isWeakSynergy: false,
  },
  {
    statIds: ['damage', 'speed'],
    synergyMultiplier: 0.75,
    expectedScore: 0.65,
    pairScore: 0.49,
    isOpSynergy: false,
    isWeakSynergy: true,
  },
];

const mockMarginalUtilities: MarginalUtilityResult[] = [
  {
    archetype: {
      id: 'hp_damage',
      name: 'HP Damage Build',
      testedStats: ['hp', 'damage'],
      baseWeights: { hp: 10, damage: 8 },
    },
    results: [
      { statId: 'hp', score: 0.85, averageScore: 0.82 },
      { statId: 'damage', score: 0.91, averageScore: 0.88 },
    ],
    averageScore: 0.85,
  },
];

const mockStatLabels = {
  hp: 'Health Points',
  damage: 'Attack Power',
  defense: 'Defense Rating',
  speed: 'Movement Speed',
};

const mockHookReturn = {
  heatmapData: [
    [
      {
        rowStatId: 'hp',
        colStatId: 'hp',
        synergy: {
          synergy: null as any,
          colorConfig: { bg: 'rgba(107, 114, 128, 0.4)', border: 'rgb(107, 114, 128)', text: 'white' },
          text: 'Health Points',
          tooltip: 'Health Points (self-comparison)',
          intensity: 0,
          rating: 'neutral' as const,
          isHighlighted: false,
        },
        position: { row: 0, col: 0 },
      },
      {
        rowStatId: 'hp',
        colStatId: 'damage',
        synergy: {
          synergy: mockSynergies[0],
          colorConfig: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)', text: 'white' },
          text: '1.25x',
          tooltip: 'Synergy: 1.25x\nExpected: 0.85\nRating: op\nStats: Health Points × Attack Power',
          intensity: 0.8,
          rating: 'op' as const,
          isHighlighted: true,
        },
        position: { row: 0, col: 1 },
      },
    ],
    [
      {
        rowStatId: 'damage',
        colStatId: 'hp',
        synergy: {
          synergy: mockSynergies[0],
          colorConfig: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)', text: 'white' },
          text: '1.25x',
          tooltip: 'Synergy: 1.25x\nExpected: 0.85\nRating: op\nStats: Health Points × Attack Power',
          intensity: 0.8,
          rating: 'op' as const,
          isHighlighted: true,
        },
        position: { row: 1, col: 0 },
      },
      {
        rowStatId: 'damage',
        colStatId: 'damage',
        synergy: {
          synergy: null as any,
          colorConfig: { bg: 'rgba(107, 114, 128, 0.4)', border: 'rgb(107, 114, 128)', text: 'white' },
          text: 'Attack Power',
          tooltip: 'Attack Power (self-comparison)',
          intensity: 0,
          rating: 'neutral' as const,
          isHighlighted: false,
        },
        position: { row: 1, col: 1 },
      },
    ],
  ],
  tableData: [
    {
      statPair: 'Health Points × Attack Power',
      stat1Id: 'hp',
      stat2Id: 'damage',
      synergy: {
        synergy: mockSynergies[0],
        colorConfig: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)', text: 'white' },
        text: '1.25x',
        tooltip: 'Synergy: 1.25x\nExpected: 0.85\nRating: op\nStats: Health Points × Attack Power',
        intensity: 0.8,
        rating: 'op' as const,
        isHighlighted: true,
      },
      marginalUtilities: [mockMarginalUtilities[0]],
      combinedScore: 0.85,
      rank: 1,
    },
  ],
  filters: {
    minMultiplier: 0,
    maxMultiplier: 10,
    rating: 'all' as const,
    archetypePairs: [],
    statPairs: [],
    sortBy: 'multiplier' as const,
    sortDirection: 'desc' as const,
    searchQuery: '',
  },
  updateFilters: vi.fn(),
  resetFilters: vi.fn(),
  getStatistics: vi.fn(() => ({
    totalSynergies: 3,
    opSynergies: 1,
    strongSynergies: 0,
    balancedSynergies: 1,
    weakSynergies: 1,
    underpoweredSynergies: 0,
    averageMultiplier: 0.98,
    highestMultiplier: 1.25,
    lowestMultiplier: 0.75,
    averageRuntime: 45,
    totalSampleSize: 1000,
  })),
  exportData: vi.fn((format: string) => {
    if (format === 'csv') return 'stat1,stat2,multiplier\nhp,damage,1.25';
    if (format === 'json') return '{"synergies": []}';
    return '';
  }),
  searchSynergies: vi.fn(),
  getColorScheme: vi.fn(() => ({
    op: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)', text: 'white' },
    strong: { bg: 'rgba(251, 146, 60, 0.8)', border: 'rgb(251, 146, 60)', text: 'white' },
    balanced: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)', text: 'white' },
    weak: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)', text: 'white' },
    underpowered: { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgb(147, 51, 234)', text: 'white' },
    neutral: { bg: 'rgba(107, 114, 128, 0.4)', border: 'rgb(107, 114, 128)', text: 'white' },
  })),
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
  trackInteraction: vi.fn(),
};

describe('SynergyHeatmapEnhanced Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSynergyHeatmapEnhanced as any).mockReturnValue(mockHookReturn);
  });

  it('renders the component with basic elements', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
    expect(screen.getByText('Interactive heatmap and table visualization of stat synergies')).toBeInTheDocument();
    expect(screen.getByText('Synergy Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Synergy Details')).toBeInTheDocument();
  });

  it('renders search bar when showSearch is true', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
        showSearch={true}
      />
    );

    expect(screen.getByPlaceholderText('Search synergies...')).toBeInTheDocument();
  });

  it('does not render search bar when showSearch is false', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
        showSearch={false}
      />
    );

    expect(screen.queryByPlaceholderText('Search synergies...')).not.toBeInTheDocument();
  });

  it('renders statistics panel when showStatistics is true', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
        showStatistics={true}
      />
    );

    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('renders export controls when showExportControls is true', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
        showExportControls={true}
      />
    );

    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });

  it('renders filters section', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Multiplier Range')).toBeInTheDocument();
    expect(screen.getByText('Synergy Rating')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('Reset Filters')).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search synergies...');
    fireEvent.change(searchInput, { target: { value: 'hp damage' } });

    await waitFor(() => {
      expect(mockHookReturn.searchSynergies).toHaveBeenCalledWith('hp damage');
    });
  });

  it('handles filter changes', async () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    // Test multiplier range
    const minInput = screen.getByPlaceholderText('Min');
    fireEvent.change(minInput, { target: { value: '1.0' } });

    await waitFor(() => {
      expect(mockHookReturn.updateFilters).toHaveBeenCalledWith({ minMultiplier: 1.0 });
    });

    // Test synergy rating
    const ratingSelect = screen.getByDisplayValue('All Ratings');
    fireEvent.change(ratingSelect, { target: { value: 'op' } });

    await waitFor(() => {
      expect(mockHookReturn.updateFilters).toHaveBeenCalledWith({ rating: 'op' });
    });
  });

  it('handles reset filters', async () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    const resetButton = screen.getByText('Reset Filters');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockHookReturn.resetFilters).toHaveBeenCalled();
    });
  });

  it('handles export CSV', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement and appendChild/removeChild
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as any;
    
    const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation();
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation();

    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    const exportCSVButton = screen.getByText('Export CSV');
    fireEvent.click(exportCSVButton);

    await waitFor(() => {
      expect(mockHookReturn.exportData).toHaveBeenCalledWith('csv');
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toContain('synergy-data-');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    // Cleanup mocks
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    mockCreateElement.mockRestore();
  });

  it('handles export JSON', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement and appendChild/removeChild
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as any;
    
    const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation();
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation();

    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    const exportJSONButton = screen.getByText('Export JSON');
    fireEvent.click(exportJSONButton);

    await waitFor(() => {
      expect(mockHookReturn.exportData).toHaveBeenCalledWith('json');
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toContain('synergy-data-');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    // Cleanup mocks
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    mockCreateElement.mockRestore();
  });

  it('renders compact mode correctly', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
        compact={true}
      />
    );

    // In compact mode, elements should have smaller padding and text
    const searchInput = screen.getByPlaceholderText('Search synergies...');
    expect(searchInput).toHaveClass('py-1', 'text-sm');
  });

  it('displays table data correctly', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    expect(screen.getByText('Health Points × Attack Power')).toBeInTheDocument();
    expect(screen.getByText('1.25x')).toBeInTheDocument();
  });

  it('displays heatmap cells correctly', () => {
    render(
      <SynergyHeatmapEnhanced
        synergies={mockSynergies}
        marginalUtilities={mockMarginalUtilities}
        statLabels={mockStatLabels}
      />
    );

    // Check for stat labels in headers
    expect(screen.getByText('Health Points')).toBeInTheDocument();
    expect(screen.getByText('Attack Power')).toBeInTheDocument();
  });
});

describe('useSynergyHeatmapEnhanced Hook', () => {
  it('should be importable', () => {
    expect(typeof useSynergyHeatmapEnhanced).toBe('function');
  });

  it('should have correct return types', () => {
    // This test ensures the hook exports the expected interface
    const hookModule = require('@/ui/balancing/hooks/useSynergyHeatmapEnhanced');
    expect(hookModule.useSynergyHeatmapEnhanced).toBeDefined();
    expect(hookModule.EnhancedSynergyFilterOptions).toBeDefined();
    expect(hookModule.ProcessedSynergyData).toBeDefined();
    expect(hookBoard.SynergyTableRow).toBeDefined();
  });
});
