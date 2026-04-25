/**
 * React hook for managing synergy heatmap data and interactions.
 * 
 * Enhanced for NP-038 with advanced filtering, export capabilities,
 * and config-first design following RPG Balancer philosophy.
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import type { 
  StressTestArchetype, 
  SynergyResult, 
  MarginalUtilityResult 
} from '@/balancing/stressTesting/types';
import type { 
  StressTestProgress 
} from './useStressTesting';
import type {
  SynergyHeatmapConfig,
  SynergyFilterOptions,
} from '@/ui/balancing/config/synergyHeatmapConfig';
import { DEFAULT_SYNERGY_HEATMAP_CONFIG } from '@/ui/balancing/config/synergyHeatmapConfig';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('SynergyHeatmapHook', 'balancing');

/**
 * Configuration for synergy heatmap display
 */
export interface SynergyHeatmapConfig {
  /** Minimum synergy multiplier to display */
  minSynergyThreshold: number;
  /** Maximum synergy multiplier for color scaling */
  maxSynergyThreshold: number;
  /** Whether to show OP synergies in distinct color */
  highlightOpSynergies: boolean;
  /** Whether to show weak synergies in distinct color */
  highlightWeakSynergies: boolean;
  /** Whether to show tooltips with detailed information */
  showTooltips: boolean;
  /** Color scheme for the heatmap */
  colorScheme: 'warm' | 'cool' | 'monochrome';
}

/**
 * Filter options for synergy data
 */
export interface SynergyFilterOptions {
  /** Minimum synergy multiplier */
  minMultiplier: number;
  /** Maximum synergy multiplier */
  maxMultiplier: number;
  /** Filter by synergy type */
  synergyType: 'all' | 'op' | 'weak' | 'normal';
  /** Filter by stat pairs */
  statPairs: Array<[string, string]>;
  /** Sort order */
  sortBy: 'multiplier' | 'score' | 'stat1' | 'stat2';
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
}

/**
 * Processed synergy data for UI rendering
 */
export interface ProcessedSynergyData {
  /** Original synergy result */
  synergy: SynergyResult;
  /** Display color */
  color: string;
  /** Display text */
  text: string;
  /** Tooltip content */
  tooltip: string;
  /** Intensity value for color scaling */
  intensity: number;
  /** Whether synergy is highlighted */
  isHighlighted: boolean;
}

/**
 * Table row data for synergy table
 */
export interface SynergyTableRow {
  /** Stat pair identifier */
  statPair: string;
  /** First stat ID */
  stat1Id: string;
  /** Second stat ID */
  stat2Id: string;
  /** Processed synergy data */
  synergy: ProcessedSynergyData;
  /** Marginal utility results */
  marginalUtilities: [MarginalUtilityResult, MarginalUtilityResult];
  /** Combined score */
  combinedScore: number;
  /** Rank in sorted order */
  rank: number;
}

/**
 * Heatmap cell data
 */
export interface HeatmapCell {
  /** Row stat ID */
  rowStatId: string;
  /** Column stat ID */
  colStatId: string;
  /** Processed synergy data */
  synergy: ProcessedSynergyData;
  /** Cell position */
  position: { row: number; col: number };
}

/**
 * Props for the useSynergyHeatmap hook
 */
export interface UseSynergyHeatmapProps {
  /** Synergy results from stress testing */
  synergies: SynergyResult[];
  /** Marginal utility results */
  marginalUtilities: MarginalUtilityResult[];
  /** Stress test archetypes for context */
  archetypes: StressTestArchetype[];
  /** Stat labels for display */
  statLabels: Record<string, string>;
  /** Heatmap configuration */
  config?: Partial<SynergyHeatmapConfig>;
  /** Current stress test progress */
  progress?: StressTestProgress;
}

/**
 * Return type for the useSynergyHeatmap hook
 */
export interface UseSynergyHeatmapResult {
  /** Processed synergy data for heatmap */
  heatmapData: HeatmapCell[][];
  /** Processed table data */
  tableData: SynergyTableRow[];
  /** Current filter options */
  filters: SynergyFilterOptions;
  /** Update filter options */
  updateFilters: (filters: Partial<SynergyFilterOptions>) => void;
  /** Reset filters to defaults */
  resetFilters: () => void;
  /** Get statistics about the data */
  getStatistics: () => {
    totalSynergies: number;
    opSynergies: number;
    weakSynergies: number;
    averageMultiplier: number;
    highestMultiplier: number;
    lowestMultiplier: number;
  };
  /** Export data to CSV */
  exportToCSV: () => string;
  /** Export data to JSON */
  exportToJSON: () => string;
  /** Search synergies by stat pair */
  searchSynergies: (query: string) => SynergyTableRow[];
  /** Get color scheme */
  getColorScheme: () => string[];
}

/**
 * Default configuration for synergy heatmap
 */
const DEFAULT_CONFIG: SynergyHeatmapConfig = {
  minSynergyThreshold: 0.5,
  maxSynergyThreshold: 2.0,
  highlightOpSynergies: true,
  highlightWeakSynergies: true,
  showTooltips: true,
  colorScheme: 'warm',
};

/**
 * Default filter options
 */
const DEFAULT_FILTERS: SynergyFilterOptions = {
  minMultiplier: 0,
  maxMultiplier: 10,
  synergyType: 'all',
  statPairs: [],
  sortBy: 'multiplier',
  sortDirection: 'desc',
};

/**
 * React hook for managing synergy heatmap data and interactions
 */
export function useSynergyHeatmap({
  synergies,
  marginalUtilities,
  archetypes,
  statLabels,
  config = {},
  progress,
}: UseSynergyHeatmapProps): UseSynergyHeatmapResult {
  // Merge configuration with defaults
  const heatmapConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  // State management
  const [filters, setFilters] = useState<SynergyFilterOptions>(DEFAULT_FILTERS);
  
  // Refs for data processing
  const processedDataRef = useRef<{
    heatmapData: HeatmapCell[][];
    tableData: SynergyTableRow[];
    statIds: string[];
  } | null>(null);

  /**
   * Process synergy data for UI rendering
   */
  const processSynergyData = useCallback((
    synergyResults: SynergyResult[],
    marginalResults: MarginalUtilityResult[],
    statIds: string[]
  ) => {
    const synergyMap = new Map<string, SynergyResult>();
    const marginalUtilityMap = new Map<string, MarginalUtilityResult>();

    // Create lookup maps
    synergyResults.forEach(synergy => {
      const key = synergy.statIds.sort().join('_');
      synergyMap.set(key, synergy);
    });

    marginalResults.forEach(mu => {
      const key = mu.archetype.testedStats.sort().join('_');
      marginalUtilityMap.set(key, mu);
    });

    // Process heatmap data
    const heatmapData: HeatmapCell[][] = [];
    const tableData: SynergyTableRow[] = [];

    // Generate heatmap matrix
    statIds.forEach((rowStatId, rowIndex) => {
      const row: HeatmapCell[] = [];
      statIds.forEach((colStatId, colIndex) => {
        if (rowStatId === colStatId) {
          // Diagonal cell - show stat name
          row.push({
            rowStatId,
            colStatId,
            synergy: {
              synergy: null as any,
              color: 'bg-slate-800',
              text: statLabels[rowStatId] || rowStatId,
              tooltip: `${statLabels[rowStatId] || rowStatId} (self-comparison)`,
              intensity: 0,
              isHighlighted: false,
            },
            position: { row: rowIndex, col: colIndex },
          });
        } else {
          // Off-diagonal cell - show synergy
          const key = [rowStatId, colStatId].sort().join('_');
          const synergy = synergyMap.get(key);
          const processedSynergy = processSynergyForUI(synergy, heatmapConfig);
          
          row.push({
            rowStatId,
            colStatId,
            synergy: processedSynergy,
            position: { row: rowIndex, col: colIndex },
          });
        }
      });
      heatmapData.push(row);
    });

    // Generate table data
    synergyResults.forEach((synergy, index) => {
      const [stat1Id, stat2Id] = synergy.statIds;
      const processedSynergy = processSynergyForUI(synergy, heatmapConfig);
      
      // Get marginal utilities for both archetypes
      const key1 = synergy.statIds.sort().join('_');
      const key2 = synergy.statIds.sort().join('_');
      const mu1 = marginalUtilityMap.get(key1);
      const mu2 = marginalUtilityMap.get(key2);

      const tableRow: SynergyTableRow = {
        statPair: `${statLabels[stat1Id] || stat1Id} × ${statLabels[stat2Id] || stat2Id}`,
        stat1Id,
        stat2Id,
        synergy: processedSynergy,
        marginalUtilities: [mu1, mu2].filter(Boolean) as [MarginalUtilityResult, MarginalUtilityResult],
        combinedScore: (mu1?.averageScore || 0) + (mu2?.averageScore || 0),
        rank: index + 1,
      };

      tableData.push(tableRow);
    });

    return { heatmapData, tableData, statIds };
  }, [heatmapConfig]);

  /**
   * Process a single synergy for UI display
   */
  const processSynergyForUI = useCallback((
    synergy: SynergyResult | null,
    config: SynergyHeatmapConfig
  ): ProcessedSynergyData => {
    if (!synergy) {
      return {
        synergy: null as any,
        color: 'bg-slate-800',
        text: '—',
        tooltip: 'No synergy data available',
        intensity: 0,
        isHighlighted: false,
      };
    }

    const { colorScheme, highlightOpSynergies, highlightWeakSynergies } = config;
    const { synergyMultiplier, isOpSynergy, isWeakSynergy, expectedScore } = synergy;

    // Calculate intensity for color scaling
    const intensity = Math.min(
      1,
      Math.max(
        0,
        (synergyMultiplier - config.minSynergyThreshold) / 
        (config.maxSynergyThreshold - config.minSynergyThreshold)
      )
    );

    // Determine color based on scheme and synergy type
    let color = 'bg-slate-600'; // Default color
    
    if (colorScheme === 'warm') {
      if (isOpSynergy && highlightOpSynergies) {
        color = 'bg-emerald-600';
      } else if (isWeakSynergy && highlightWeakSynergies) {
        color = 'bg-rose-600';
      } else {
        color = `bg-amber-${Math.round(intensity * 600)}`;
      }
    } else if (colorScheme === 'cool') {
      if (isOpSynergy && highlightOpSynergies) {
        color = 'bg-blue-600';
      } else if (isWeakSynergy && highlightWeakSynergies) {
        color = 'bg-purple-600';
      } else {
        color = `bg-cyan-${Math.round(intensity * 600)}`;
      }
    } else {
      // Monochrome
      const grayValue = Math.round(intensity * 400 + 200);
      color = `bg-gray-${grayValue}`;
    }

    const isHighlighted = (isOpSynergy && highlightOpSynergies) || 
                         (isWeakSynergy && highlightWeakSynergies);

    return {
      synergy,
      color,
      text: `${synergyMultiplier.toFixed(2)}x`,
      tooltip: `Synergy: ${synergyMultiplier.toFixed(2)}x\n` +
               `Expected: ${expectedScore.toFixed(2)}\n` +
               `Type: ${isOpSynergy ? 'OP' : isWeakSynergy ? 'Weak' : 'Normal'}\n` +
               `Stats: ${synergy.statIds.map(id => statLabels[id] || id).join(' × ')}`,
      intensity,
      isHighlighted,
    };
  }, []);

  /**
   * Filter and sort table data
   */
  const filterAndSortData = useCallback((
    data: SynergyTableRow[],
    filterOptions: SynergyFilterOptions
  ): SynergyTableRow[] => {
    let filtered = [...data];

    // Apply filters
    if (filterOptions.minMultiplier > 0 || filterOptions.maxMultiplier < 10) {
      filtered = filtered.filter(row => 
        row.synergy.synergy?.synergyMultiplier &&
        row.synergy.synergy.synergyMultiplier >= filterOptions.minMultiplier &&
        row.synergy.synergy.synergyMultiplier <= filterOptions.maxMultiplier
      );
    }

    if (filterOptions.synergyType !== 'all') {
      filtered = filtered.filter(row => {
        const synergy = row.synergy.synergy;
        if (!synergy) return false;
        
        switch (filterOptions.synergyType) {
          case 'op':
            return synergy.isOpSynergy;
          case 'weak':
            return synergy.isWeakSynergy;
          case 'normal':
            return !synergy.isOpSynergy && !synergy.isWeakSynergy;
          default:
            return true;
        }
      });
    }

    if (filterOptions.statPairs.length > 0) {
      filtered = filtered.filter(row => 
        filterOptions.statPairs.some(([stat1, stat2]) =>
          (row.stat1Id === stat1 && row.stat2Id === stat2) ||
          (row.stat1Id === stat2 && row.stat2Id === stat1)
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filterOptions.sortBy) {
        case 'multiplier':
          comparison = (b.synergy.synergy?.synergyMultiplier || 0) - 
                     (a.synergy.synergy?.synergyMultiplier || 0);
          break;
        case 'score':
          comparison = b.combinedScore - a.combinedScore;
          break;
        case 'stat1':
          comparison = a.stat1Id.localeCompare(b.stat1Id);
          break;
        case 'stat2':
          comparison = a.stat2Id.localeCompare(b.stat2Id);
          break;
      }

      return filterOptions.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, []);

  /**
   * Get all stat IDs from data
   */
  const getStatIds = useCallback(() => {
    const statIds = new Set<string>();
    
    synergies.forEach(synergy => {
      synergy.statIds.forEach(statId => statIds.add(statId));
    });

    marginalUtilities.forEach(mu => {
      mu.archetype.testedStats.forEach(statId => statIds.add(statId));
    });

    return Array.from(statIds).sort();
  }, [synergies, marginalUtilities]);

  /**
   * Process all data
   */
  const processedData = useMemo(() => {
    const statIds = getStatIds();
    const processed = processSynergyData(synergies, marginalUtilities, statIds);
    
    processedDataRef.current = processed;
    return processed;
  }, [synergies, marginalUtilities, getStatIds, processSynergyData]);

  /**
   * Get filtered and sorted table data
   */
  const filteredTableData = useMemo(() => {
    if (!processedData.tableData) return [];
    return filterAndSortData(processedData.tableData, filters);
  }, [processedData.tableData, filters, filterAndSortData]);

  /**
   * Update filter options
   */
  const updateFilters = useCallback((newFilters: Partial<SynergyFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Get statistics about the data
   */
  const getStatistics = useCallback(() => {
    const validSynergies = synergies.filter(s => s.synergyMultiplier > 0);
    
    const opSynergies = validSynergies.filter(s => s.isOpSynergy);
    const weakSynergies = validSynergies.filter(s => s.isWeakSynergy);
    
    const multipliers = validSynergies.map(s => s.synergyMultiplier);
    const averageMultiplier = multipliers.length > 0 
      ? multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length 
      : 0;
    
    const highestMultiplier = multipliers.length > 0 
      ? Math.max(...multipliers) 
      : 0;
    
    const lowestMultiplier = multipliers.length > 0 
      ? Math.min(...multipliers) 
      : 0;

    return {
      totalSynergies: validSynergies.length,
      opSynergies: opSynergies.length,
      weakSynergies: weakSynergies.length,
      averageMultiplier,
      highestMultiplier,
      lowestMultiplier,
    };
  }, [synergies]);

  /**
   * Export data to CSV format
   */
  const exportToCSV = useCallback((): string => {
    const headers = [
      'Stat Pair',
      'Multiplier',
      'Expected Score',
      'Type',
      'Stat 1',
      'Stat 2',
      'Combined Score',
      'MU1 Score',
      'MU2 Score',
    ];

    const rows = filteredTableData.map(row => [
      row.statPair,
      row.synergy.synergy?.synergyMultiplier?.toFixed(2) || 'N/A',
      row.synergy.synergy?.expectedScore?.toFixed(2) || 'N/A',
      row.synergy.synergy?.isOpSynergy ? 'OP' : 
      row.synergy.synergy?.isWeakSynergy ? 'Weak' : 'Normal',
      statLabels[row.stat1Id] || row.stat1Id,
      statLabels[row.stat2Id] || row.stat2Id,
      row.combinedScore.toFixed(2),
      row.marginalUtilities[0]?.averageScore?.toFixed(2) || 'N/A',
      row.marginalUtilities[1]?.averageScore?.toFixed(2) || 'N/A',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }, [filteredTableData, statLabels]);

  /**
   * Export data to JSON format
   */
  const exportToJSON = useCallback((): string => {
    return JSON.stringify({
      metadata: {
        exportedAt: new Date().toISOString(),
        totalSynergies: filteredTableData.length,
        statLabels,
        config: heatmapConfig,
        filters,
      },
      data: filteredTableData.map(row => ({
        ...row,
        synergy: {
          ...row.synergy.synergy,
          color: row.synergy.color,
          text: row.synergy.text,
          tooltip: row.synergy.tooltip,
          intensity: row.synergy.intensity,
          isHighlighted: row.synergy.isHighlighted,
        },
      })),
    }, null, 2);
  }, [filteredTableData, statLabels, heatmapConfig, filters]);

  /**
   * Search synergies by stat pair
   */
  const searchSynergies = useCallback((query: string): SynergyTableRow[] => {
    if (!query.trim()) return filteredTableData;
    
    const lowerQuery = query.toLowerCase();
    return filteredTableData.filter(row => 
      row.statPair.toLowerCase().includes(lowerQuery) ||
      row.stat1Id.toLowerCase().includes(lowerQuery) ||
      row.stat2Id.toLowerCase().includes(lowerQuery) ||
      (statLabels[row.stat1Id] || row.stat1Id).toLowerCase().includes(lowerQuery) ||
      (statLabels[row.stat2Id] || row.stat2Id).toLowerCase().includes(lowerQuery)
    );
  }, [filteredTableData, statLabels]);

  /**
   * Get color scheme for UI
   */
  const getColorScheme = useCallback((): string[] => {
    const { colorScheme } = heatmapConfig;
    
    switch (colorScheme) {
      case 'warm':
        return ['bg-slate-800', 'bg-amber-200', 'bg-amber-400', 'bg-amber-600', 'bg-emerald-600', 'bg-rose-600'];
      case 'cool':
        return ['bg-slate-800', 'bg-cyan-200', 'bg-cyan-400', 'bg-cyan-600', 'bg-blue-600', 'bg-purple-600'];
      case 'monochrome':
        return ['bg-slate-800', 'bg-gray-300', 'bg-gray-500', 'bg-gray-700', 'bg-gray-900'];
      default:
        return ['bg-slate-800'];
    }
  }, [heatmapConfig]);

  return {
    heatmapData: processedData.heatmapData,
    tableData: filteredTableData,
    filters,
    updateFilters,
    resetFilters,
    getStatistics,
    exportToCSV,
    exportToJSON,
    searchSynergies,
    getColorScheme,
  };
}
