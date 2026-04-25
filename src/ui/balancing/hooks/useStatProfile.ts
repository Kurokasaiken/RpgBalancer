/**
 * React hook for managing stat profile radar chart data and interactions.
 * 
 * Provides data processing, visualization, and UI state management for
 * displaying stat profiles in radar chart format with comprehensive analysis.
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import type { 
  StressTestArchetype, 
  MarginalUtilityResult,
  SynergyResult 
} from '@/balancing/stressTesting/types';
import {
  STAT_VISUALIZATION_CONFIG,
  getVisualizationPalette,
  type StatVisualizationPalette,
} from '@/balancing/config/idleVillage/statVisualizationConfig';

/**
 * Configuration for radar chart display
 */
export interface StatProfileRadarConfig {
  /** Maximum number of stats to display */
  maxStats: number;
  /** Minimum stat value for scaling */
  minStatValue: number;
  /** Maximum stat value for scaling */
  maxStatValue: number;
  /** Whether to show average values */
  showAverage: boolean;
  /** Whether to show individual archetypes */
  showIndividualArchetypes: boolean;
  /** Whether to show stat labels */
  showStatLabels: boolean;
  /** Whether to show grid lines */
  showGrid: boolean;
  /** Whether to animate transitions */
  animateTransitions: boolean;
  /** Color scheme for the chart */
  colorScheme: 'default' | 'warm' | 'cool' | 'monochrome';
}

/**
 * Filter options for stat profile data
 */
export interface StatProfileFilterOptions {
  /** Minimum average score */
  minAverageScore: number;
  /** Maximum average score */
  maxAverageScore: number;
  /** Filter by stat types */
  statTypes: string[];
  /** Filter by archetype traits */
  archetypeTraits: string[];
  /** Sort order */
  sortBy: 'name' | 'average' | 'variance' | 'count';
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
}

/**
 * Processed stat data for radar chart rendering
 */
export interface ProcessedStatData {
  /** Stat identifier */
  statId: string;
  /** Stat display name */
  statName: string;
  /** Average value across all archetypes */
  averageValue: number;
  /** Maximum value */
  maxValue: number;
  /** Minimum value */
  minValue: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Number of archetypes with this stat */
  archetypeCount: number;
  /** Individual archetype values */
  individualValues: Array<{
    archetypeId: string;
    archetypeName: string;
    value: number;
    color: string;
  }>;
  /** Normalized value for radar chart (0-1) */
  normalizedValue: number;
  /** Whether stat is highlighted */
  isHighlighted: boolean;
}

/**
 * Radar chart axis configuration
 */
export interface RadarChartAxis {
  /** Axis label */
  label: string;
  /** Axis value (0-1 for radar chart) */
  value: number;
  /** Axis color */
  color: string;
  /** Whether axis is highlighted */
  isHighlighted: boolean;
}

/**
 * Radar chart dataset configuration
 */
export interface RadarChartDataset {
  /** Dataset label */
  label: string;
  /** Dataset data points */
  data: RadarChartAxis[];
  /** Dataset color */
  color: string;
  /** Dataset fill color */
  fillColor: string;
  /** Dataset border width */
  borderWidth: number;
  /** Dataset point size */
  pointSize: number;
  /** Whether dataset is visible */
  visible: boolean;
}

/**
 * Props for the useStatProfile hook
 */
export interface UseStatProfileProps {
  /** Stress test archetypes data */
  archetypes: StressTestArchetype[];
  /** Marginal utility results */
  marginalUtilities: MarginalUtilityResult[];
  /** Synergy results */
  synergies: SynergyResult[];
  /** Stat labels for display */
  statLabels: Record<string, string>;
  /** Radar chart configuration */
  config?: Partial<StatProfileRadarConfig>;
  /** Initial filter options */
  initialFilters?: Partial<StatProfileFilterOptions>;
}

/**
 * Return type for the useStatProfile hook
 */
export interface UseStatProfileResult {
  /** Processed stat data for radar chart */
  statData: ProcessedStatData[];
  /** Radar chart datasets */
  datasets: RadarChartDataset[];
  /** Current filter options */
  filters: StatProfileFilterOptions;
  /** Update filter options */
  updateFilters: (filters: Partial<StatProfileFilterOptions>) => void;
  /** Reset filters to defaults */
  resetFilters: () => void;
  /** Get statistics about the data */
  getStatistics: () => {
    totalStats: number;
    totalArchetypes: number;
    averageStatValue: number;
    highestStatValue: number;
    lowestStatValue: number;
    averageVariance: number;
  };
  /** Export data to CSV */
  exportToCSV: () => string;
  /** Export data to JSON */
  exportToJSON: () => string;
  /** Search stats by name */
  searchStats: (query: string) => ProcessedStatData[];
  /** Get color scheme */
  getColorScheme: () => string[];
  /** Toggle dataset visibility */
  toggleDataset: (datasetLabel: string) => void;
  /** Get dataset visibility */
  getDatasetVisibility: (datasetLabel: string) => boolean;
}

/**
 * Default configuration for stat profile radar chart
 */
const DEFAULT_CONFIG: StatProfileRadarConfig = {
  maxStats: 12,
  minStatValue: 0,
  maxStatValue: 100,
  showAverage: true,
  showIndividualArchetypes: true,
  showStatLabels: true,
  showGrid: true,
  animateTransitions: true,
  colorScheme: 'default',
};

/**
 * Default filter options
 */
const DEFAULT_FILTERS: StatProfileFilterOptions = {
  minAverageScore: 0,
  maxAverageScore: 100,
  statTypes: [],
  archetypeTraits: [],
  sortBy: 'average',
  sortDirection: 'desc',
};

/**
 * React hook for managing stat profile radar chart data and interactions
 */
export function useStatProfile({
  archetypes,
  marginalUtilities,
  synergies,
  statLabels,
  config = {},
  initialFilters,
}: UseStatProfileProps): UseStatProfileResult {
  // Merge configuration with defaults
  const radarConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  const visualizationPalette = useMemo<StatVisualizationPalette>(() => (
    getVisualizationPalette(radarConfig.colorScheme)
  ), [radarConfig.colorScheme]);

  // State management
  const [filters, setFilters] = useState<StatProfileFilterOptions>(DEFAULT_FILTERS);
  const [datasetVisibility, setDatasetVisibility] = useState<Record<string, boolean>>({});
  
  // Refs for data processing
  const processedDataRef = useRef<{
    statData: ProcessedStatData[];
    datasets: RadarChartDataset[];
    statIds: string[];
  } | null>(null);

  /**
   * Get color for a specific value
   */
  const hexToRgba = useCallback((hexColor: string, alpha: number): string => {
    const safeHex = hexColor.replace('#', '');
    const expanded = safeHex.length === 3
      ? safeHex.split('').map(char => char + char).join('')
      : safeHex;
    const bigint = Number.parseInt(expanded, 16);

    if (Number.isNaN(bigint)) {
      return `rgba(255, 255, 255, ${alpha})`;
    }

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const getColorForValue = useCallback((
    value: number,
    colorScheme: string,
    alpha: number = 1
  ): string => {
    const palette = getVisualizationPalette(colorScheme as keyof typeof STAT_VISUALIZATION_CONFIG.palettes);
    if (value < 33) return hexToRgba(palette.valueLow, alpha);
    if (value < 66) return hexToRgba(palette.valueMid, alpha);
    return hexToRgba(palette.valueHigh, alpha);
  }, [hexToRgba]);

  /**
   * Get color for an archetype
   */
  const getArchetypeColor = useCallback((
    archetypeId: string,
    index: number = 0
  ): string => {
    const palette = visualizationPalette.datasetColors;
    const color = palette[index % palette.length] || palette[0];
    return hexToRgba(color, 1);
  }, [hexToRgba, visualizationPalette.datasetColors]);

  /**
   * Process stat data for radar chart visualization
   */
  const processStatData = useCallback((
    archetypeData: StressTestArchetype[],
    marginalData: MarginalUtilityResult[],
    synergyData: SynergyResult[],
    statIds: string[]
  ) => {
    // Create stat aggregation map
    const statMap = new Map<string, {
      values: number[];
      archetypeIds: string[];
      archetypeNames: string[];
    }>();

    // Aggregate stat values from archetypes
    archetypeData.forEach(archetype => {
      Object.entries(archetype.stats).forEach(([statId, value]) => {
        if (!statMap.has(statId)) {
          statMap.set(statId, {
            values: [],
            archetypeIds: [],
            archetypeNames: [],
          });
        }
        
        const statData = statMap.get(statId)!;
        statData.values.push(value);
        statData.archetypeIds.push(archetype.id);
        statData.archetypeNames.push(archetype.name);
      });
    });

    // Process each stat
    const processedStats: ProcessedStatData[] = [];
    
    statMap.forEach((data, statId) => {
      const values = data.values;
      const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const variance = values.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);

      // Create individual archetype values
      const individualValues = data.archetypeIds.map((archetypeId, index) => ({
        archetypeId,
        archetypeName: data.archetypeNames[index],
        value: values[index],
        color: getArchetypeColor(archetypeId),
      }));

      // Normalize value for radar chart (0-1)
      const normalizedValue = Math.min(
        1,
        Math.max(
          0,
          (averageValue - radarConfig.minStatValue) / 
          (radarConfig.maxStatValue - radarConfig.minStatValue)
        )
      );

      const processedStat: ProcessedStatData = {
        statId,
        statName: statLabels[statId] || statId,
        averageValue,
        maxValue,
        minValue,
        standardDeviation,
        archetypeCount: values.length,
        individualValues,
        normalizedValue,
        isHighlighted: false, // Will be updated based on filters
      };

      processedStats.push(processedStat);
    });

    // Sort and limit stats
    processedStats.sort((a, b) => b.averageValue - a.averageValue);
    const limitedStats = processedStats.slice(0, radarConfig.maxStats);

    // Create radar chart datasets
    const datasets: RadarChartDataset[] = [];
    
    // Average dataset
    if (radarConfig.showAverage) {
      datasets.push({
        label: 'Average',
        data: limitedStats.map(stat => ({
          label: stat.statName,
          value: stat.normalizedValue,
          color: getColorForValue(stat.averageValue, radarConfig.colorScheme),
          isHighlighted: stat.isHighlighted,
        })),
        color: getColorForValue(50, radarConfig.colorScheme),
        fillColor: getColorForValue(50, radarConfig.colorScheme, 0.25),
        borderWidth: 2,
        pointSize: 4,
        visible: datasetVisibility['Average'] !== false,
      });
    }

    // Individual archetype datasets
    if (radarConfig.showIndividualArchetypes) {
      // Group archetypes by similar stats and create representative datasets
      const archetypeGroups = new Map<string, StressTestArchetype[]>();
      
      archetypeData.forEach(archetype => {
        const key = archetype.name.split(' ')[0]; // Use first word as group
        if (!archetypeGroups.has(key)) {
          archetypeGroups.set(key, []);
        }
        archetypeGroups.get(key)!.push(archetype);
      });

      // Create dataset for each archetype group
      Array.from(archetypeGroups.keys()).slice(0, 5).forEach((groupKey, index) => {
        const groupArchetypes = archetypeGroups.get(groupKey)!;
        const representativeArchetype = groupArchetypes[0];
        
        datasets.push({
          label: representativeArchetype.name,
          data: limitedStats.map(stat => {
            const statValue = representativeArchetype.stats[stat.statId] || 0;
            const normalizedValue = Math.min(
              1,
              Math.max(
                0,
                (statValue - radarConfig.minStatValue) / 
                (radarConfig.maxStatValue - radarConfig.minStatValue)
              )
            );
            
            return {
              label: stat.statName,
              value: normalizedValue,
              color: getArchetypeColor(representativeArchetype.id, index),
              isHighlighted: stat.isHighlighted,
            };
          }),
          color: getArchetypeColor(representativeArchetype.id, index),
          fillColor: hexToRgba(visualizationPalette.datasetColors[index % visualizationPalette.datasetColors.length], 0.2),
          borderWidth: 2,
          pointSize: 3,
          visible: datasetVisibility[representativeArchetype.name] !== false,
        });
      });
    }

    return { statData: limitedStats, datasets, statIds };
  }, [statLabels, radarConfig, datasetVisibility, getArchetypeColor, getColorForValue, hexToRgba, visualizationPalette.datasetColors]);

  /**
   * Filter and sort stat data
   */
  const filterAndSortData = useCallback((
    data: ProcessedStatData[],
    filterOptions: StatProfileFilterOptions
  ): ProcessedStatData[] => {
    let filtered = [...data];

    // Apply filters
    if (filterOptions.minAverageScore > 0 || filterOptions.maxAverageScore < 100) {
      filtered = filtered.filter(stat => 
        stat.averageValue >= filterOptions.minAverageScore &&
        stat.averageValue <= filterOptions.maxAverageScore
      );
    }

    if (filterOptions.statTypes.length > 0) {
      filtered = filtered.filter(stat => 
        filterOptions.statTypes.some(type => stat.statId.includes(type))
      );
    }

    if (filterOptions.archetypeTraits.length > 0) {
      filtered = filtered.filter(stat => 
        stat.individualValues.some(value => 
          filterOptions.archetypeTraits.some(trait => 
            value.archetypeName.toLowerCase().includes(trait.toLowerCase())
          )
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filterOptions.sortBy) {
        case 'name':
          comparison = a.statName.localeCompare(b.statName);
          break;
        case 'average':
          comparison = b.averageValue - a.averageValue;
          break;
        case 'variance':
          comparison = b.standardDeviation - a.standardDeviation;
          break;
        case 'count':
          comparison = b.archetypeCount - a.archetypeCount;
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
    
    archetypes.forEach(archetype => {
      Object.keys(archetype.stats).forEach(statId => statIds.add(statId));
    });

    return Array.from(statIds).sort();
  }, [archetypes]);

  /**
   * Process all data
   */
  const processedData = useMemo(() => {
    const statIds = getStatIds();
    const processed = processStatData(archetypes, marginalUtilities, synergies, statIds);
    
    return processed;
  }, [archetypes, marginalUtilities, synergies, getStatIds, processStatData]);

  // Update ref when processed data changes
  useEffect(() => {
    processedDataRef.current = processedData;
  }, [processedData]);

  /**
   * Get filtered and sorted stat data
   */
  const filteredStatData = useMemo(() => {
    if (!processedData.statData) return [];
    return filterAndSortData(processedData.statData, filters);
  }, [processedData.statData, filters, filterAndSortData]);

  /**
   * Update filter options
   */
  const updateFilters = useCallback((newFilters: Partial<StatProfileFilterOptions>) => {
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
    const validStats = filteredStatData.filter(stat => stat.averageValue > 0);
    
    const averageStatValue = validStats.length > 0 
      ? validStats.reduce((sum, stat) => sum + stat.averageValue, 0) / validStats.length 
      : 0;
    
    const highestStatValue = validStats.length > 0 
      ? Math.max(...validStats.map(stat => stat.averageValue))
      : 0;
    
    const lowestStatValue = validStats.length > 0 
      ? Math.min(...validStats.map(stat => stat.averageValue))
      : 0;
    
    const averageVariance = validStats.length > 0
      ? validStats.reduce((sum, stat) => sum + stat.standardDeviation, 0) / validStats.length
      : 0;

    return {
      totalStats: validStats.length,
      totalArchetypes: archetypes.length,
      averageStatValue,
      highestStatValue,
      lowestStatValue,
      averageVariance,
    };
  }, [filteredStatData, archetypes]);

  /**
   * Export data to CSV format
   */
  const exportToCSV = useCallback((): string => {
    const headers = [
      'Stat Name',
      'Average Value',
      'Max Value',
      'Min Value',
      'Standard Deviation',
      'Archetype Count',
    ];

    const rows = filteredStatData.map(stat => [
      stat.statName,
      stat.averageValue.toFixed(2),
      stat.maxValue.toFixed(2),
      stat.minValue.toFixed(2),
      stat.standardDeviation.toFixed(2),
      stat.archetypeCount.toString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }, [filteredStatData]);

  /**
   * Export data to JSON format
   */
  const exportToJSON = useCallback((): string => {
    return JSON.stringify({
      metadata: {
        exportedAt: new Date().toISOString(),
        totalStats: filteredStatData.length,
        totalArchetypes: archetypes.length,
        statLabels,
        config: radarConfig,
        filters,
      },
      statData: filteredStatData,
      datasets: processedData.datasets,
      statistics: getStatistics(),
    }, null, 2);
  }, [filteredStatData, archetypes, statLabels, filters, processedData.datasets, getStatistics, radarConfig]);

  /**
   * Search stats by name
   */
  const searchStats = useCallback((query: string): ProcessedStatData[] => {
    if (!query.trim()) return filteredStatData;
    
    const lowerQuery = query.toLowerCase();
    return filteredStatData.filter(stat => 
      stat.statName.toLowerCase().includes(lowerQuery) ||
      stat.statId.toLowerCase().includes(lowerQuery)
    );
  }, [filteredStatData]);

  /**
   * Get color scheme for UI
   */
  const getColorScheme = useCallback((): string[] => {
    return [
      hexToRgba(visualizationPalette.valueLow, 1),
      hexToRgba(visualizationPalette.valueMid, 1),
      hexToRgba(visualizationPalette.valueHigh, 1),
    ];
  }, [hexToRgba, visualizationPalette]);

  /**
   * Toggle dataset visibility
   */
  const toggleDataset = useCallback((datasetLabel: string) => {
    setDatasetVisibility(prev => ({
      ...prev,
      [datasetLabel]: !prev[datasetLabel],
    }));
  }, []);

  /**
   * Get dataset visibility
   */
  const getDatasetVisibility = useCallback((datasetLabel: string): boolean => {
    return datasetVisibility[datasetLabel] !== false;
  }, [datasetVisibility]);

  // Apply initial filters
  React.useEffect(() => {
    if (initialFilters) {
      updateFilters(initialFilters);
    }
  }, [initialFilters, updateFilters]);

  return {
    statData: filteredStatData,
    datasets: processedData.datasets,
    filters,
    updateFilters,
    resetFilters,
    getStatistics,
    exportToCSV,
    exportToJSON,
    searchStats,
    getColorScheme,
    toggleDataset,
    getDatasetVisibility,
  };
}
