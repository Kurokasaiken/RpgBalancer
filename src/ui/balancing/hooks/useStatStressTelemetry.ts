/**
 * Stat Stress Telemetry Hook - NP-035
 * 
 * React hook for aggregating and managing stat stress testing telemetry data
 * with filtering, sorting, and real-time updates.
 * 
 * @since 2026-01-24
 * @author Helios-Balancer
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_STAT_STRESS_TELEMETRY_CONFIG, type StatStressTelemetryConfig } from '../config/statStressTelemetryConfig';

/**
 * Stress test archetype result
 */
export interface StressTestArchetype {
  id: string;
  name: string;
  type: 'single' | 'pair';
  stats: Record<string, number>;
  winRate: number;
  avgDamage: number;
  avgSurvival: number;
  simulations: number;
}

/**
 * Marginal utility result
 */
export interface MarginalUtilityResult {
  stat: string;
  singleStatWinRate: number;
  expectedScore: number;
  pairs: Array<{
    stat2: string;
    pairWinRate: number;
    synergyMultiplier: number;
    isSynergy: boolean;
    isAntisynergy: boolean;
  }>;
}

/**
 * Aggregated telemetry data
 */
export interface AggregatedTelemetryData {
  archetypes: StressTestArchetype[];
  marginalUtility: MarginalUtilityResult[];
  stats: string[];
  summary: {
    totalArchetypes: number;
    singleStatArchetypes: number;
    pairArchetypes: number;
    avgWinRate: number;
    synergies: number;
    antisynergies: number;
  };
}

/**
 * Filter state
 */
export interface FilterState {
  stats: string[];
  archetypeType: 'all' | 'single' | 'pair';
  winRateRange: [number, number];
  showSynergies: boolean;
  showAntisynergies: boolean;
  search: string;
}

/**
 * Hook options
 */
export interface UseStatStressTelemetryOptions {
  config?: StatStressTelemetryConfig;
  autoRefresh?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Hook return type
 */
export interface UseStatStressTelemetryReturn {
  data: AggregatedTelemetryData | null;
  filteredData: AggregatedTelemetryData | null;
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  config: StatStressTelemetryConfig;
}

/**
 * Default filter state
 */
const DEFAULT_FILTERS: FilterState = {
  stats: [],
  archetypeType: 'all',
  winRateRange: [0, 100],
  showSynergies: false,
  showAntisynergies: false,
  search: '',
};

/**
 * Generate mock stress test data
 */
function generateMockStressTestData(): AggregatedTelemetryData {
  const stats = ['HP', 'Damage', 'Defense', 'Speed', 'Crit'];
  const archetypes: StressTestArchetype[] = [];
  const marginalUtility: MarginalUtilityResult[] = [];

  // Generate single-stat archetypes
  stats.forEach((stat, _index) => {
    const winRate = 45 + Math.random() * 20;
    archetypes.push({
      id: `single-${stat}`,
      name: `+25 ${stat}`,
      type: 'single',
      stats: { [stat]: 25 },
      winRate,
      avgDamage: 100 + Math.random() * 50,
      avgSurvival: 50 + Math.random() * 30,
      simulations: 10000,
    });
  });

  // Generate pair archetypes
  for (let i = 0; i < stats.length; i++) {
    for (let j = i + 1; j < stats.length; j++) {
      const stat1 = stats[i];
      const stat2 = stats[j];
      const baseWinRate = (archetypes[i].winRate + archetypes[j].winRate) / 2;
      const synergyFactor = 0.9 + Math.random() * 0.3; // 0.9 to 1.2
      const winRate = baseWinRate * synergyFactor;

      archetypes.push({
        id: `pair-${stat1}-${stat2}`,
        name: `+25 ${stat1} + ${stat2}`,
        type: 'pair',
        stats: { [stat1]: 25, [stat2]: 25 },
        winRate,
        avgDamage: 120 + Math.random() * 60,
        avgSurvival: 60 + Math.random() * 40,
        simulations: 10000,
      });
    }
  }

  // Generate marginal utility results
  stats.forEach((stat, index) => {
    const singleStatWinRate = archetypes[index].winRate;
    const pairs = stats
      .filter(s => s !== stat)
      .map(stat2 => {
        const pairArchetype = archetypes.find(
          a => a.type === 'pair' && 
          a.stats[stat] && a.stats[stat2]
        );
        const pairWinRate = pairArchetype?.winRate || 50;
        const otherSingleWinRate = archetypes.find(a => a.name === `+25 ${stat2}`)?.winRate || 50;
        const expectedScore = (singleStatWinRate + otherSingleWinRate) / 2;
        const synergyMultiplier = pairWinRate / expectedScore;

        return {
          stat2,
          pairWinRate,
          synergyMultiplier,
          isSynergy: synergyMultiplier >= 1.15,
          isAntisynergy: synergyMultiplier <= 0.95,
        };
      });

    marginalUtility.push({
      stat,
      singleStatWinRate,
      expectedScore: singleStatWinRate,
      pairs,
    });
  });

  const summary = {
    totalArchetypes: archetypes.length,
    singleStatArchetypes: archetypes.filter(a => a.type === 'single').length,
    pairArchetypes: archetypes.filter(a => a.type === 'pair').length,
    avgWinRate: archetypes.reduce((sum, a) => sum + a.winRate, 0) / archetypes.length,
    synergies: marginalUtility.reduce((sum, mu) => sum + mu.pairs.filter(p => p.isSynergy).length, 0),
    antisynergies: marginalUtility.reduce((sum, mu) => sum + mu.pairs.filter(p => p.isAntisynergy).length, 0),
  };

  return {
    archetypes,
    marginalUtility,
    stats,
    summary,
  };
}

/**
 * Filter archetypes based on filter state
 */
function filterArchetypes(
  data: AggregatedTelemetryData,
  filters: FilterState
): AggregatedTelemetryData {
  let filteredArchetypes = [...data.archetypes];

  // Filter by archetype type
  if (filters.archetypeType !== 'all') {
    filteredArchetypes = filteredArchetypes.filter(a => a.type === filters.archetypeType);
  }

  // Filter by stats
  if (filters.stats.length > 0) {
    filteredArchetypes = filteredArchetypes.filter(a =>
      filters.stats.some(stat => a.stats[stat] !== undefined)
    );
  }

  // Filter by win rate range
  filteredArchetypes = filteredArchetypes.filter(
    a => a.winRate >= filters.winRateRange[0] && a.winRate <= filters.winRateRange[1]
  );

  // Filter by search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredArchetypes = filteredArchetypes.filter(a =>
      a.name.toLowerCase().includes(searchLower)
    );
  }

  // Filter marginal utility
  let filteredMarginalUtility = [...data.marginalUtility];

  if (filters.showSynergies) {
    filteredMarginalUtility = filteredMarginalUtility.map(mu => ({
      ...mu,
      pairs: mu.pairs.filter(p => p.isSynergy),
    }));
  }

  if (filters.showAntisynergies) {
    filteredMarginalUtility = filteredMarginalUtility.map(mu => ({
      ...mu,
      pairs: mu.pairs.filter(p => p.isAntisynergy),
    }));
  }

  // Recalculate summary
  const summary = {
    totalArchetypes: filteredArchetypes.length,
    singleStatArchetypes: filteredArchetypes.filter(a => a.type === 'single').length,
    pairArchetypes: filteredArchetypes.filter(a => a.type === 'pair').length,
    avgWinRate: filteredArchetypes.length > 0
      ? filteredArchetypes.reduce((sum, a) => sum + a.winRate, 0) / filteredArchetypes.length
      : 0,
    synergies: filteredMarginalUtility.reduce((sum, mu) => sum + mu.pairs.filter(p => p.isSynergy).length, 0),
    antisynergies: filteredMarginalUtility.reduce((sum, mu) => sum + mu.pairs.filter(p => p.isAntisynergy).length, 0),
  };

  return {
    archetypes: filteredArchetypes,
    marginalUtility: filteredMarginalUtility,
    stats: data.stats,
    summary,
  };
}

/**
 * Use stat stress telemetry hook
 */
export function useStatStressTelemetry(
  options: UseStatStressTelemetryOptions = {}
): UseStatStressTelemetryReturn {
  const {
    config = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG,
    autoRefresh = false,
    onError,
  } = options;

  const [data, setData] = useState<AggregatedTelemetryData | null>(null);
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load data
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate async latency to keep loading state realistic until fetch resolves
      const latency = Math.max(0, config.dataLoadLatencyMs ?? 0);
      if (latency > 0) {
        await new Promise(resolve => setTimeout(resolve, latency));
      }

      // In real implementation, this would fetch from StressTestArchetypeGenerator
      // For now, use mock data
      const mockData = generateMockStressTestData();
      setData(mockData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load data');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [config.dataLoadLatencyMs, onError]);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Set filters with debouncing
   */
  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  /**
   * Filtered data
   */
  const filteredData = useMemo(() => {
    if (!data) return null;
    return filterArchetypes(data, filters);
  }, [data, filters]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh || !config.autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, config.refreshRate);

    return () => clearInterval(interval);
  }, [autoRefresh, config.autoRefresh, config.refreshRate, refresh]);

  return {
    data,
    filteredData,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    error,
    refresh,
    config,
  };
}
