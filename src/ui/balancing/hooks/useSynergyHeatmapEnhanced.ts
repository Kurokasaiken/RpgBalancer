/**
 * Enhanced React hook for managing synergy heatmap data and interactions.
 * 
 * Created for NP-038 with advanced filtering, export capabilities,
 * telemetry integration, and config-first design following RPG Balancer philosophy.
 */

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import type { 
  SynergyResult, 
  MarginalUtilityResult 
} from '@/balancing/stressTesting/types';
import type {
  SynergyHeatmapConfig,
  SynergyFilterOptions,
  SynergyRating,
  ExportFormat,
} from '@/ui/balancing/config/synergyHeatmapConfig';
import { 
  DEFAULT_SYNERGY_HEATMAP_CONFIG,
  getSynergyRating,
  getColorScheme 
} from '@/ui/balancing/config/synergyHeatmapConfig';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('SynergyHeatmapEnhanced', 'balancing');

/**
 * Enhanced filter options for synergy data
 */
export interface EnhancedSynergyFilterOptions extends SynergyFilterOptions {
  /** Filter by sample size */
  minSampleSize?: number;
  /** Filter by runtime performance */
  maxRuntimeMs?: number;
  /** Show only statistically significant results */
  statisticallySignificantOnly?: boolean;
}

/**
 * Processed synergy data for UI rendering
 */
export interface ProcessedSynergyData {
  /** Original synergy result */
  synergy: SynergyResult;
  /** Display color configuration */
  colorConfig: ReturnType<typeof getColorScheme>[keyof ReturnType<typeof getColorScheme>];
  /** Display text */
  text: string;
  /** Tooltip content */
  tooltip: string;
  /** Intensity value for color scaling */
  intensity: number;
  /** Synergy rating */
  rating: SynergyRating;
  /** Whether synergy is highlighted */
  isHighlighted: boolean;
  /** Cell position */
  position?: { row: number; col: number };
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
  marginalUtilities: [MarginalUtilityResult?, MarginalUtilityResult?];
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
 * Export data structure
 */
export interface SynergyExportData {
  /** Export metadata */
  metadata: {
    exportedAt: string;
    totalSynergies: number;
    filteredSynergies: number;
    config: SynergyHeatmapConfig;
    filters: EnhancedSynergyFilterOptions;
    statistics: ReturnType<typeof useSynergyHeatmapEnhanced>['getStatistics'];
  };
  /** Synergy data */
  synergies: SynergyTableRow[];
  /** Raw synergy results */
  rawSynergies: SynergyResult[];
  /** Matrix representation */
  matrix: Record<string, Record<string, number | null>>;
}

/**
 * Props for the enhanced useSynergyHeatmap hook
 */
export interface UseSynergyHeatmapEnhancedProps {
  /** Synergy results from stress testing */
  synergies: SynergyResult[];
  /** Marginal utility results */
  marginalUtilities?: MarginalUtilityResult[];
  /** Stat labels for display */
  statLabels: Record<string, string>;
  /** Heatmap configuration */
  config?: Partial<SynergyHeatmapConfig>;
}

/**
 * Return type for the enhanced useSynergyHeatmap hook
 */
export interface UseSynergyHeatmapEnhancedResult {
  /** Processed synergy data for heatmap */
  heatmapData: HeatmapCell[][];
  /** Processed table data */
  tableData: SynergyTableRow[];
  /** Current filter options */
  filters: EnhancedSynergyFilterOptions;
  /** Update filter options */
  updateFilters: (filters: Partial<EnhancedSynergyFilterOptions>) => void;
  /** Reset filters to defaults */
  resetFilters: () => void;
  /** Get statistics about the data */
  getStatistics: () => {
    totalSynergies: number;
    opSynergies: number;
    strongSynergies: number;
    balancedSynergies: number;
    weakSynergies: number;
    underpoweredSynergies: number;
    averageMultiplier: number;
    highestMultiplier: number;
    lowestMultiplier: number;
    averageRuntime: number;
    totalSampleSize: number;
  };
  /** Export data to different formats */
  exportData: (format: ExportFormat) => string;
  /** Search synergies by stat pair */
  searchSynergies: (query: string) => SynergyTableRow[];
  /** Get color scheme for UI */
  getColorScheme: () => ReturnType<typeof getColorScheme>;
  /** Get current configuration */
  getConfig: () => SynergyHeatmapConfig;
  /** Update configuration */
  updateConfig: (config: Partial<SynergyHeatmapConfig>) => void;
  /** Telemetry events */
  trackInteraction: (type: 'cell_click' | 'cell_hover' | 'filter_change' | 'export', data?: any) => void;
}

/**
 * Default enhanced filter options
 */
const DEFAULT_ENHANCED_FILTERS: EnhancedSynergyFilterOptions = {
  minMultiplier: 0,
  maxMultiplier: 10,
  rating: 'all',
  archetypePairs: [],
  statPairs: [],
  sortBy: 'multiplier',
  sortDirection: 'desc',
  searchQuery: '',
  minSampleSize: 0,
  maxRuntimeMs: 1000,
  statisticallySignificantOnly: false,
};

/**
 * Enhanced React hook for managing synergy heatmap data and interactions
 */
export function useSynergyHeatmapEnhanced({
  synergies,
  marginalUtilities = [],
  statLabels,
  config = {},
}: UseSynergyHeatmapEnhancedProps): UseSynergyHeatmapEnhancedResult {
  // Merge configuration with defaults
  const [heatmapConfig, setHeatmapConfig] = useState<SynergyHeatmapConfig>(() => ({
    ...DEFAULT_SYNERGY_HEATMAP_CONFIG,
    ...config,
  }));

  // State management
  const [filters, setFilters] = useState<EnhancedSynergyFilterOptions>(DEFAULT_ENHANCED_FILTERS);
  
  // Refs for data processing
  const processedDataRef = useRef<{
    heatmapData: HeatmapCell[][];
    tableData: SynergyTableRow[];
    statIds: string[];
  } | null>(null);

  // Telemetry tracking
  const trackInteraction = useCallback((
    type: 'cell_click' | 'cell_hover' | 'filter_change' | 'export',
    data?: any
  ) => {
    diagnostics.info(`Synergy heatmap interaction: ${type}`, data);
    
    // Emit telemetry event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('synergy_heatmap_interaction', {
          detail: {
            type,
            timestamp: Date.now(),
            data,
            config: heatmapConfig,
            filters,
          },
        }),
      );
    }
  }, [heatmapConfig, filters]);

  /**
   * Process a single synergy for UI display
   */
  const processSynergyForUI = useCallback((
    synergy: SynergyResult | null,
    config: SynergyHeatmapConfig
  ): ProcessedSynergyData => {
    if (!synergy) {
      const neutralColor = getColorScheme(config.colorScheme).neutral;
      return {
        synergy: null as any,
        colorConfig: neutralColor,
        text: '—',
        tooltip: 'No synergy data available',
        intensity: 0,
        rating: 'neutral',
        isHighlighted: false,
      };
    }

    const { thresholds } = config;
    const { synergyMultiplier, expectedScore } = synergy;
    const rating = getSynergyRating(synergyMultiplier, thresholds);
    const colorScheme = getColorScheme(config.colorScheme);
    const colorConfig = colorScheme[rating];

    // Calculate intensity for color scaling
    const range = thresholds.opThreshold - thresholds.underpoweredThreshold;
    const intensity = Math.min(
      1,
      Math.max(
        0,
        (synergyMultiplier - thresholds.underpoweredThreshold) / range
      )
    );

    const isHighlighted = rating === 'op' || rating === 'underpowered';

    return {
      synergy,
      colorConfig,
      text: `${synergyMultiplier.toFixed(2)}x`,
      tooltip: `Synergy: ${synergyMultiplier.toFixed(2)}x\n` +
               `Expected: ${expectedScore.toFixed(2)}\n` +
               `Rating: ${rating}\n` +
               `Stats: ${synergy.statIds.map(id => statLabels[id] || id).join(' × ')}` +
               `\nRuntime: ${(synergy as any).runtimeMs || 'N/A'}ms`,
      intensity,
      rating,
      isHighlighted,
    };
  }, [statLabels]);

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
          const neutralColor = getColorScheme(heatmapConfig.colorScheme).neutral;
          row.push({
            rowStatId,
            colStatId,
            synergy: {
              synergy: null as any,
              colorConfig: neutralColor,
              text: statLabels[rowStatId] || rowStatId,
              tooltip: `${statLabels[rowStatId] || rowStatId} (self-comparison)`,
              intensity: 0,
              rating: 'neutral',
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
      const key = synergy.statIds.sort().join('_');
      const mu = marginalUtilityMap.get(key);

      const tableRow: SynergyTableRow = {
        statPair: `${statLabels[stat1Id] || stat1Id} × ${statLabels[stat2Id] || stat2Id}`,
        stat1Id,
        stat2Id,
        synergy: processedSynergy,
        marginalUtilities: [mu, mu].filter(Boolean) as [MarginalUtilityResult, MarginalUtilityResult],
        combinedScore: mu?.averageScore || 0,
        rank: index + 1,
      };

      tableData.push(tableRow);
    });

    return { heatmapData, tableData, statIds };
  }, [heatmapConfig, processSynergyForUI, statLabels]);

  /**
   * Filter and sort table data
   */
  const filterAndSortData = useCallback((
    data: SynergyTableRow[],
    filterOptions: EnhancedSynergyFilterOptions
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

    if (filterOptions.rating !== 'all') {
      filtered = filtered.filter(row => 
        row.synergy.rating === filterOptions.rating
      );
    }

    if (filterOptions.minSampleSize && filterOptions.minSampleSize > 0) {
      filtered = filtered.filter(row => 
        (row.synergy.synergy as any)?.sampleSize >= filterOptions.minSampleSize
      );
    }

    if (filterOptions.maxRuntimeMs && filterOptions.maxRuntimeMs > 0) {
      filtered = filtered.filter(row => 
        ((row.synergy.synergy as any)?.runtimeMs || 0) <= filterOptions.maxRuntimeMs
      );
    }

    if (filterOptions.statPairs.length > 0) {
      filtered = filtered.filter(row => 
        filterOptions.statPairs.some(([stat1, stat2]) =>
          (row.stat1Id === stat1 && row.stat2Id === stat2) ||
          (row.stat1Id === stat2 && row.stat2Id === stat1)
        )
      );
    }

    if (filterOptions.searchQuery.trim()) {
      const query = filterOptions.searchQuery.toLowerCase();
      filtered = filtered.filter(row => 
        row.statPair.toLowerCase().includes(query) ||
        row.stat1Id.toLowerCase().includes(query) ||
        row.stat2Id.toLowerCase().includes(query)
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
    
    // Update ref in effect to avoid render-time ref updates
    setTimeout(() => {
      processedDataRef.current = processed;
    }, 0);
    
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
  const updateFilters = useCallback((newFilters: Partial<EnhancedSynergyFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    trackInteraction('filter_change', newFilters);
  }, [trackInteraction]);

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_ENHANCED_FILTERS);
    trackInteraction('filter_change', DEFAULT_ENHANCED_FILTERS);
  }, [trackInteraction]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<SynergyHeatmapConfig>) => {
    setHeatmapConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Get statistics about the data
   */
  const getStatistics = useCallback(() => {
    const validSynergies = synergies.filter(s => s.synergyMultiplier > 0);
    
    const ratingCounts = {
      op: 0,
      strong: 0,
      balanced: 0,
      weak: 0,
      underpowered: 0,
    };

    validSynergies.forEach(synergy => {
      const rating = getSynergyRating(synergy.synergyMultiplier, heatmapConfig.thresholds);
      ratingCounts[rating as keyof typeof ratingCounts]++;
    });
    
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

    const runtimes = validSynergies.map(s => (s as any).runtimeMs || 0);
    const averageRuntime = runtimes.length > 0 
      ? runtimes.reduce((sum, r) => sum + r, 0) / runtimes.length 
      : 0;

    const totalSampleSize = validSynergies.reduce((sum, s) => 
      sum + ((s as any).sampleSize || 0), 0
    );

    return {
      totalSynergies: validSynergies.length,
      opSynergies: ratingCounts.op,
      strongSynergies: ratingCounts.strong,
      balancedSynergies: ratingCounts.balanced,
      weakSynergies: ratingCounts.weak,
      underpoweredSynergies: ratingCounts.underpowered,
      averageMultiplier,
      highestMultiplier,
      lowestMultiplier,
      averageRuntime,
      totalSampleSize,
    };
  }, [synergies, heatmapConfig.thresholds]);

  /**
   * Export data to different formats
   */
  const exportData = useCallback((format: ExportFormat): string => {
    const exportData: SynergyExportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalSynergies: processedData.tableData.length,
        filteredSynergies: filteredTableData.length,
        config: heatmapConfig,
        filters,
        statistics: getStatistics(),
      },
      synergies: filteredTableData,
      rawSynergies: synergies,
      matrix: Object.fromEntries(
        processedData.statIds.map(stat1 => [
          stat1,
          Object.fromEntries(
            processedData.statIds.map(stat2 => [
              stat2,
              processedData.heatmapData[processedData.statIds.indexOf(stat1)]?.[
                processedData.statIds.indexOf(stat2)
              ]?.synergy.synergy?.synergyMultiplier ?? null
            ])
          )
        ])
      ),
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, heatmapConfig.export.jsonIndent);
      
      case 'csv': {
        const headers = [
          'Stat Pair',
          'Multiplier',
          'Rating',
          'Expected Score',
          'Stat 1',
          'Stat 2',
          'Combined Score',
          'Runtime (ms)',
          'Sample Size',
        ];

        const rows = filteredTableData.map(row => [
          row.statPair,
          row.synergy.synergy?.synergyMultiplier?.toFixed(4) || 'N/A',
          row.synergy.rating,
          row.synergy.synergy?.expectedScore?.toFixed(4) || 'N/A',
          statLabels[row.stat1Id] || row.stat1Id,
          statLabels[row.stat2Id] || row.stat2Id,
          row.combinedScore.toFixed(4),
          (row.synergy.synergy as any)?.runtimeMs || 'N/A',
          (row.synergy.synergy as any)?.sampleSize || 'N/A',
        ]);

        return [headers.join(heatmapConfig.export.csvDelimiter), 
                ...rows.map(row => row.join(heatmapConfig.export.csvDelimiter))].join('\n');
      }
      
      case 'markdown': {
        let markdown = `# Synergy Heatmap Export\n\n`;
        markdown += `**Generated:** ${new Date(exportData.metadata.exportedAt).toLocaleString()}\n`;
        markdown += `**Total Synergies:** ${exportData.metadata.totalSynergies}\n`;
        markdown += `**Filtered Synergies:** ${exportData.metadata.filteredSynergies}\n\n`;
        
        markdown += `## Statistics\n\n`;
        const stats = getStatistics();
        markdown += `- Average Multiplier: ${stats.averageMultiplier.toFixed(4)}x\n`;
        markdown += `- Highest Multiplier: ${stats.highestMultiplier.toFixed(4)}x\n`;
        markdown += `- Lowest Multiplier: ${stats.lowestMultiplier.toFixed(4)}x\n`;
        markdown += `- OP Synergies: ${stats.opSynergies}\n`;
        markdown += `- Strong Synergies: ${stats.strongSynergies}\n`;
        markdown += `- Balanced Synergies: ${stats.balancedSynergies}\n`;
        markdown += `- Weak Synergies: ${stats.weakSynergies}\n`;
        markdown += `- Underpowered Synergies: ${stats.underpoweredSynergies}\n\n`;
        
        markdown += `## Top Synergies\n\n`;
        markdown += `| Stat Pair | Multiplier | Rating | Expected Score |\n`;
        markdown += `|-----------|------------|--------|----------------|\n`;
        
        filteredTableData.slice(0, 20).forEach(row => {
          markdown += `| ${row.statPair} | ${row.synergy.text} | ${row.synergy.rating} | ${row.synergy.synergy?.expectedScore?.toFixed(4) || 'N/A'} |\n`;
        });
        
        return markdown;
      }
      
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }, [filteredTableData, processedData, synergies, heatmapConfig, filters, getStatistics, statLabels]);

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
  const getColorSchemeForUI = useCallback(() => {
    return getColorScheme(heatmapConfig.colorScheme);
  }, [heatmapConfig.colorScheme]);

  return {
    heatmapData: processedData.heatmapData,
    tableData: filteredTableData,
    filters,
    updateFilters,
    resetFilters,
    getStatistics,
    exportData,
    searchSynergies,
    getColorScheme: getColorSchemeForUI,
    getConfig: () => heatmapConfig,
    updateConfig,
    trackInteraction,
  };
}
