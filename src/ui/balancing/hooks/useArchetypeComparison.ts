/**
 * Archetype Comparison Hook
 * 
 * React hook for comparing archetypes side-by-side with matrix visualization.
 * Handles stat deltas, balance scores, and comparison metrics.
 * 
 * @since NP-134 – Config Balancer: Archetype Comparison Matrix
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useBalancerConfig } from './useBalancerConfig';
import { generateArchetypes } from '../../balancing/archetype/ArchetypeGenerator';
import type { ScenarioConfig } from '../../balancing/monteCarlo/ScenarioConfig';
import type {
  ComparisonConfig,
  ArchetypeComparisonResult,
  ComparisonMetric,
  SortDirection,
  DeltaThreshold,
} from '../../balancing/config/visualization/comparisonConfig';
import {
  DEFAULT_COMPARISON_CONFIG,
  createSafeComparisonConfig,
  calculateBalanceScore,
  formatMetricValue,
  getDeltaThreshold,
  getDeltaColor,
  getDeltaIcon,
  COMPARISON_METRICS,
} from '../../balancing/config/visualization/comparisonConfig';

/**
 * Archetype comparison hook return type
 */
export interface UseArchetypeComparisonReturn {
  /** Comparison results */
  results: ArchetypeComparisonResult[];
  /** Comparison configuration */
  config: ComparisonConfig;
  /** Update configuration */
  updateConfig: (updates: Partial<ComparisonConfig>) => void;
  /** Selected archetypes for comparison */
  selectedArchetypes: string[];
  /** Update selected archetypes */
  updateSelectedArchetypes: (archetypes: string[]) => void;
  /** Sort configuration */
  sortConfig: { metric: ComparisonMetric; direction: SortDirection };
  /** Update sort configuration */
  updateSortConfig: (sortConfig: { metric: ComparisonMetric; direction: SortDirection }) => void;
  /** Filter configuration */
  filterConfig: {
    searchQuery: string;
    outlierOnly: boolean;
    minBalanceScore: number;
    maxBalanceScore: number;
  };
  /** Update filter configuration */
  updateFilterConfig: (filterConfig: Partial<UseArchetypeComparisonReturn['filterConfig']>) => void;
  /** Calculate comparison between two archetypes */
  compareArchetypes: (archetype1: string, archetype2: string) => ArchetypeComparisonResult | null;
  /** Get archetype by ID */
  getArchetypeById: (id: string) => ArchetypeComparisonResult | null;
  /** Export comparison results */
  exportResults: () => string;
  /** Import configuration */
  importConfiguration: (config: string) => boolean;
  /** Reset comparison */
  resetComparison: () => void;
}

/**
 * Hook for archetype comparison functionality
 */
export function useArchetypeComparison(
  initialConfig: Partial<ComparisonConfig> = {},
  initialArchetypes: string[] = []
): UseArchetypeComparisonReturn {
  const { config: balancerConfig } = useBalancerConfig();
  
  // State management
  const [config, setConfig] = useState<ComparisonConfig>(() =>
    createSafeComparisonConfig(initialConfig)
  );
  
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>(initialArchetypes);
  const [sortConfig, setSortConfig] = useState({
    metric: config.defaultSort.metric,
    direction: config.defaultSort.direction,
  });
  
  const [filterConfig, setFilterConfig] = useState({
    searchQuery: '',
    outlierOnly: false,
    minBalanceScore: 0,
    maxBalanceScore: 1,
  });

  /**
   * Generate archetype data from configuration
   */
  const generateArchetypeData = useCallback((
    archetypeIds: string[],
    scenarioConfig?: Partial<ScenarioConfig>
  ): ArchetypeComparisonResult[] => {
    const results: ArchetypeComparisonResult[] = [];
    
    for (const archetypeId of archetypeIds) {
      // Generate archetype configuration
      const archetypeConfig = {
        id: archetypeId,
        name: `Archetype ${archetypeId}`,
        stats: {},
        budget: 100,
        ...scenarioConfig,
      };
      
      // Calculate stats based on balancer configuration
      const stats: Record<string, number> = {};
      balancerConfig.stats.forEach(stat => {
        stats[stat.id] = stat.weight * 10; // Base value from weight
      });
      
      // Calculate metrics
      const metrics: Record<string, number> = {};
      config.metrics.forEach(metric => {
        switch (metric.id) {
          case 'balance-score':
            metrics[metric.id] = calculateBalanceScore(stats, config);
            break;
          case 'total-stats':
            metrics[metric.id] = Object.values(stats).reduce((sum, val) => sum + val, 0);
            break;
          case 'core-stats':
            metrics[metric.id] = balancerConfig.stats
              .filter(stat => stat.isCore)
              .reduce((sum, stat) => sum + (stats[stat.id] || 0), 0);
            break;
          case 'derived-stats':
            metrics[metric.id] = balancerConfig.stats
              .filter(stat => stat.isDerived)
              .reduce((sum, stat) => sum + (stats[stat.id] || 0), 0);
            break;
          case 'penalty-stats':
            metrics[metric.id] = balancerConfig.stats
              .filter(stat => stat.isPenalty)
              .reduce((sum, stat) => sum + (stats[stat.id] || 0), 0);
            break;
          case 'budget-efficiency':
            const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0);
            metrics[metric.id] = archetypeConfig.budget > 0 ? totalStats / archetypeConfig.budget : 0;
            break;
          case 'synergy-score':
            metrics[metric.id] = Math.min(Object.keys(stats).length / 10, 1); // Simple synergy calculation
            break;
          case 'power-level':
            const maxPossibleStats = balancerConfig.stats.length * 10;
            metrics[metric.id] = Math.min(Object.values(stats).reduce((sum, val) => sum + val, 0) / maxPossibleStats, 1) * 10;
            break;
        }
      });
      
      // Calculate deltas (for now, use 0 as baseline)
      const deltas: Record<string, number> = {};
      Object.keys(metrics).forEach(key => {
        deltas[key] = 0; // No baseline comparison for single archetype
      });
      
      // Calculate balance score and power level
      const balanceScore = calculateBalanceScore(stats, config);
      const powerLevel = metrics['power-level'] || 0;
      
      // Detect outliers (metrics significantly different from mean)
      const outliers: string[] = [];
      Object.entries(metrics).forEach(([metricId, value]) => {
        const meanValue = 0.5; // Simplified - would calculate from all archetypes
        const delta = Math.abs(value - meanValue);
        if (delta > 0.3) {
          outliers.push(metricId);
        }
      });
      
      results.push({
        archetypeId,
        archetypeName: archetypeConfig.name,
        metrics,
        deltas,
        balanceScore,
        powerLevel,
        rank: 0, // Will be calculated after sorting
        percentile: 0, // Will be calculated after sorting
        outliers,
      });
    }
    
    return results;
  }, [balancerConfig, config]);

  /**
   * Calculate comparison results for selected archetypes
   */
  const comparisonResults = useMemo(() => {
    if (selectedArchetypes.length === 0) return [];
    
    const results = generateArchetypeData(selectedArchetypes);
    
    // Calculate ranks and percentiles
    const sortedByBalance = [...results].sort((a, b) => b.balanceScore - a.balanceScore);
    sortedByBalance.forEach((result, index) => {
      result.rank = index + 1;
      result.percentile = ((results.length - index) / results.length) * 100;
    });
    
    return results;
  }, [selectedArchetypes, balancerConfig, config]);

  /**
   * Filter and sort results
   */
  const filteredResults = useMemo(() => {
    let filtered = [...comparisonResults];
    
    // Apply search filter
    if (filterConfig.searchQuery) {
      const query = filterConfig.searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.archetypeId.toLowerCase().includes(query) ||
        result.archetypeName.toLowerCase().includes(query)
      );
    }
    
    // Apply outlier filter
    if (filterConfig.outlierOnly) {
      filtered = filtered.filter(result => result.outliers.length > 0);
    }
    
    // Apply balance score range filter
    filtered = filtered.filter(result =>
      result.balanceScore >= filterConfig.minBalanceScore &&
      result.balanceScore <= filterConfig.maxBalanceScore
    );
    
    // Apply sorting
    const metricConfig = config.metrics.find(m => m.id === sortConfig.metric);
    if (metricConfig) {
      filtered.sort((a, b) => {
        const aValue = a.metrics[sortConfig.metric] || 0;
        const bValue = b.metrics[sortConfig.metric] || 0;
        
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
    
    return filtered;
  }, [comparisonResults, filterConfig, sortConfig, config]);

  /**
   * Update configuration with validation
   */
  const updateConfig = useCallback((updates: Partial<ComparisonConfig>) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig, ...updates };
      return createSafeComparisonConfig(newConfig);
    });
  }, []);

  /**
   * Update selected archetypes
   */
  const updateSelectedArchetypes = useCallback((archetypes: string[]) => {
    const limitedArchetypes = archetypes.slice(0, config.maxArchetypes);
    setSelectedArchetypes(limitedArchetypes);
  }, [config.maxArchetypes]);

  /**
   * Update sort configuration
   */
  const updateSortConfig = useCallback((newSortConfig: { metric: ComparisonMetric; direction: SortDirection }) => {
    setSortConfig(newSortConfig);
  }, []);

  /**
   * Update filter configuration
   */
  const updateFilterConfig = useCallback((newFilterConfig: Partial<UseArchetypeComparisonReturn['filterConfig']>) => {
    setFilterConfig(prevConfig => ({ ...prevConfig, ...newFilterConfig }));
  }, []);

  /**
   * Compare two specific archetypes
   */
  const compareArchetypes = useCallback((
    archetype1: string,
    archetype2: string
  ): ArchetypeComparisonResult | null => {
    const results = generateArchetypeData([archetype1, archetype2]);
    
    if (results.length === 2) {
      // Calculate deltas between the two archetypes
      const [result1, result2] = results;
      const deltas: Record<string, number> = {};
      
      Object.keys(result1.metrics).forEach(key => {
        const value1 = result1.metrics[key] || 0;
        const value2 = result2.metrics[key] || 0;
        deltas[key] = value2 - value1;
      });
      
      return {
        ...result1,
        deltas,
      };
    }
    
    return null;
  }, [balancerConfig, config]);

  /**
   * Get archetype by ID
   */
  const getArchetypeById = useCallback((id: string): ArchetypeComparisonResult | null => {
    return comparisonResults.find(result => result.archetypeId === id) || null;
  }, [comparisonResults]);

  /**
   * Export comparison results
   */
  const exportResults = useCallback((): string => {
    const exportData = {
      config,
      selectedArchetypes,
      results: filteredResults,
      timestamp: Date.now(),
      version: '1.0.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [config, selectedArchetypes, filteredResults]);

  /**
   * Import configuration
   */
  const importConfiguration = useCallback((configString: string): boolean => {
    try {
      const importedData = JSON.parse(configString);
      
      if (importedData.config) {
        updateConfig(importedData.config);
      }
      
      if (importedData.selectedArchetypes) {
        updateSelectedArchetypes(importedData.selectedArchetypes);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }, [updateConfig, updateSelectedArchetypes]);

  /**
   * Reset comparison to default state
   */
  const resetComparison = useCallback((): void => {
    setConfig(createSafeComparisonConfig({}));
    setSelectedArchetypes([]);
    setSortConfig({
      metric: config.defaultSort.metric,
      direction: config.defaultSort.direction,
    });
    setFilterConfig({
      searchQuery: '',
      outlierOnly: false,
      minBalanceScore: 0,
      maxBalanceScore: 1,
    });
  }, [config]);

  /**
   * Generate archetype options from balancer config
   */
  const archetypeOptions = useMemo(() => {
    // Generate sample archetypes based on balancer configuration
    const maxArchetypes = Math.min(config.maxArchetypes, 20);
    const options: string[] = [];
    
    for (let i = 1; i <= maxArchetypes; i++) {
      options.push(`archetype-${i}`);
    }
    
    return options;
  }, [config.maxArchetypes]);

  /**
   * Get statistics for comparison results
   */
  const statistics = useMemo(() => {
    if (filteredResults.length === 0) {
      return {
        totalArchetypes: 0,
        averageBalanceScore: 0,
        highestScore: 0,
        lowestScore: 0,
        outlierCount: 0,
        metricAverages: {} as Record<string, number>,
      };
    }
    
    const balanceScores = filteredResults.map(r => r.balanceScore);
    const outlierCount = filteredResults.filter(r => r.outliers.length > 0).length;
    
    const metricAverages: Record<string, number> = {};
    config.metrics.forEach(metric => {
      const values = filteredResults.map(r => r.metrics[metric.id] || 0);
      metricAverages[metric.id] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    return {
      totalArchetypes: filteredResults.length,
      averageBalanceScore: balanceScores.length > 0 ? balanceScores.reduce((sum, val) => sum + val, 0) / balanceScores.length : 0,
      highestScore: Math.max(...balanceScores),
      lowestScore: Math.min(...balanceScores),
      outlierCount,
      metricAverages,
    };
  }, [filteredResults, config]);

  return {
    results: filteredResults,
    config,
    updateConfig,
    selectedArchetypes,
    updateSelectedArchetypes,
    sortConfig,
    updateSortConfig,
    filterConfig,
    updateFilterConfig,
    compareArchetypes,
    getArchetypeById,
    exportResults,
    importConfiguration,
    resetComparison,
    archetypeOptions,
    statistics,
  };
}

/**
 * Helper hook for delta calculations
 */
export function useArchetypeDelta(
  archetype1: ArchetypeComparisonResult,
  archetype2: ArchetypeComparisonResult
) {
  const deltas = useMemo(() => {
    const deltaMap: Record<string, number> = {};
    
    Object.keys(archetype1.metrics).forEach(key => {
      const value1 = archetype1.metrics[key] || 0;
      const value2 = archetype2.metrics[key] || 0;
      deltaMap[key] = value2 - value1;
    });
    
    return deltaMap;
  }, [archetype1, archetype2]);

  const deltaSummary = useMemo(() => {
    const entries = Object.entries(deltas);
    const positiveDeltas = entries.filter(([_, value]) => value > 0).length;
    const negativeDeltas = entries.filter(([_, value]) => value < 0).length;
    const significantDeltas = entries.filter(([_, value]) => Math.abs(value) > 0.1).length;
    
    return {
      totalDeltas: entries.length,
      positiveDeltas,
      negativeDeltas,
      significantDeltas,
      averageDelta: entries.length > 0 ? entries.reduce((sum, [_, value]) => sum + value, 0) / entries.length : 0,
    };
  }, [deltas]);

  return { deltas, deltaSummary };
}

/**
 * Helper hook for comparison metrics
 */
export function useComparisonMetrics() {
  const { config: balancerConfig } = useBalancerConfig();
  
  const availableMetrics = useMemo(() => {
    return COMPARISON_METRICS.map(metricId => ({
      id: metricId,
      ...config.metrics.find(m => m.id === metricId),
    }));
  }, [config.metrics]);

  const getMetricById = useCallback((id: string) => {
    return availableMetrics.find(metric => metric.id === id);
  }, [availableMetrics]);

  return { availableMetrics, getMetricById };
}
