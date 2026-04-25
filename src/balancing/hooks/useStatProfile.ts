/**
 * useStatProfile Hook
 * 
 * Hook for managing stat profile data and radar chart visualization.
 * Provides data transformation, filtering, and telemetry integration
 * for stat profile radar charts in the stress testing system.
 * 
 * @module useStatProfile
 * @since 2026-01-14
 * @author Lyra-Visuals
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import type { StressTestArchetype, MarginalUtilityResult } from '@/balancing/stressTesting/types';
import { useBalancerConfig } from './useBalancerConfig';
import { trackStressTestEvent } from '@/analytics/stressTesting';

/**
 * Stat profile data point for radar visualization
 */
export interface StatProfileData {
  /** Stat identifier */
  statId: string;
  /** Stat display name */
  displayName: string;
  /** Current value */
  value: number;
  /** Normalized value (0-1) */
  normalizedValue: number;
  /** Performance tier */
  tier: 'excellent' | 'good' | 'average' | 'poor';
  /** Marginal utility if available */
  marginalUtility?: number;
  /** Synergy multiplier if available */
  synergyMultiplier?: number;
}

/**
 * Radar chart configuration
 */
export interface RadarChartConfig {
  /** Maximum value for scaling */
  maxValue: number;
  /** Number of grid levels */
  gridLevels: number;
  /** Color scheme */
  colors: {
    excellent: string;
    good: string;
    average: string;
    poor: string;
    grid: string;
    axis: string;
    label: string;
  };
  /** Animation settings */
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  /** Visual settings */
  visual: {
    strokeWidth: number;
    pointRadius: number;
    fontSize: number;
    fontFamily: string;
  };
}

/**
 * Hook options
 */
export interface UseStatProfileOptions {
  /** Custom radar configuration */
  radarConfig?: Partial<RadarChartConfig>;
  /** Enable telemetry tracking */
  enableTelemetry?: boolean;
  /** Auto-tune scale based on data */
  enableAutoTune?: boolean;
  /** Filter stats by minimum value */
  minStatValue?: number;
  /** Maximum number of stats to display */
  maxStats?: number;
}

/**
 * Hook return value
 */
export interface UseStatProfileReturn {
  /** Processed stat profile data */
  statProfiles: StatProfileData[];
  /** Radar chart configuration */
  radarConfig: RadarChartConfig;
  /** Selected stat for detailed view */
  selectedStat: StatProfileData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Select a stat for detailed view */
  selectStat: (statId: string) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Export data as JSON */
  exportData: () => string;
  /** Refresh data */
  refresh: () => void;
}

/**
 * Default radar configuration
 */
const DEFAULT_RADAR_CONFIG: RadarChartConfig = {
  maxValue: 100,
  gridLevels: 5,
  colors: {
    excellent: '#10b981', // emerald-500
    good: '#3b82f6',    // blue-500
    average: '#f59e0b', // amber-500
    poor: '#ef4444',    // red-500
    grid: '#374151',    // gray-600
    axis: '#6b7280',    // gray-500
    label: '#d1d5db',   // gray-300
  },
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out',
  },
  visual: {
    strokeWidth: 2,
    pointRadius: 4,
    fontSize: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
};

/**
 * Hook for managing stat profile data and radar visualization
 */
export function useStatProfile(
  archetypes: StressTestArchetype[],
  marginalUtilities: MarginalUtilityResult[] = [],
  options: UseStatProfileOptions = {}
): UseStatProfileReturn {
  const {
    radarConfig: customRadarConfig,
    enableTelemetry = true,
    enableAutoTune = true,
    minStatValue = 0,
    maxStats = 12,
  } = options;

  const { config: balancerConfig } = useBalancerConfig();
  const [selectedStatId, setSelectedStatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Merge radar configuration
  const radarConfig = useMemo(() => {
    const merged = { ...DEFAULT_RADAR_CONFIG };
    if (customRadarConfig) {
      Object.assign(merged, customRadarConfig);
      if (customRadarConfig.colors) {
        Object.assign(merged.colors, customRadarConfig.colors);
      }
      if (customRadarConfig.animations) {
        Object.assign(merged.animations, customRadarConfig.animations);
      }
      if (customRadarConfig.visual) {
        Object.assign(merged.visual, customRadarConfig.visual);
      }
    }
    return merged;
  }, [customRadarConfig]);

  // Process stat profile data
  const statProfiles = useMemo(() => {
    if (!archetypes.length || !balancerConfig) return [];

    // Collect all stats from archetypes
    const allStats = new Map<string, {
      totalValue: number;
      count: number;
      marginalUtility?: number;
      synergyMultiplier?: number;
    }>();

    archetypes.forEach(archetype => {
      if (!archetype.stats || typeof archetype.stats !== 'object') return;
      
      Object.entries(archetype.stats).forEach(([statId, value]) => {
        if (typeof value !== 'number' || value < minStatValue) return;

        const existing = allStats.get(statId) || {
          totalValue: 0,
          count: 0,
        };

        existing.totalValue += value;
        existing.count += 1;

        // Add marginal utility data if available
        const marginalUtility = marginalUtilities.find(mu => 
          mu.archetype.testedStats.includes(statId)
        );
        if (marginalUtility) {
          existing.marginalUtility = marginalUtility.averageScore;
          existing.synergyMultiplier = marginalUtility.marginalUtility;
        }

        allStats.set(statId, existing);
      });
    });

    // Convert to profile data and sort by value
    const profiles: StatProfileData[] = Array.from(allStats.entries())
      .map(([statId, data]) => {
        const avgValue = data.totalValue / data.count;
        const statDef = balancerConfig.stats.find(s => s.id === statId);
        
        // Determine performance tier
        let tier: StatProfileData['tier'] = 'average';
        if (data.synergyMultiplier) {
          if (data.synergyMultiplier >= 1.15) tier = 'excellent';
          else if (data.synergyMultiplier >= 1.05) tier = 'good';
          else if (data.synergyMultiplier < 0.95) tier = 'poor';
        }

        return {
          statId,
          displayName: statDef?.name || statId,
          value: avgValue,
          normalizedValue: avgValue / radarConfig.maxValue,
          tier,
          marginalUtility: data.marginalUtility,
          synergyMultiplier: data.synergyMultiplier,
        };
      })
      .filter(profile => profile.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, maxStats);

    // Auto-tune max value if enabled
    if (enableAutoTune && profiles.length > 0) {
      const maxValue = Math.max(...profiles.map(p => p.value));
      const tunedMaxValue = Math.ceil(maxValue * 1.2 / 10) * 10; // Round up to nearest 10
      radarConfig.maxValue = Math.max(tunedMaxValue, 10);
      
      // Re-normalize with tuned max value
      profiles.forEach(profile => {
        profile.normalizedValue = profile.value / radarConfig.maxValue;
      });
    }

    return profiles;
  }, [archetypes, balancerConfig, marginalUtilities, minStatValue, maxStats, enableAutoTune, radarConfig]);

  // Find selected stat
  const selectedStat = useMemo(() => {
    if (!selectedStatId) return null;
    return statProfiles.find(profile => profile.statId === selectedStatId) || null;
  }, [selectedStatId, statProfiles]);

  // Select stat handler
  const selectStat = useCallback((statId: string) => {
    setSelectedStatId(statId);
    
    if (enableTelemetry) {
      const stat = statProfiles.find(p => p.statId === statId);
      if (stat) {
        trackStressTestEvent('stat_profile_selected', {
          statId,
          displayName: stat.displayName,
          value: stat.value,
          tier: stat.tier,
          marginalUtility: stat.marginalUtility,
          synergyMultiplier: stat.synergyMultiplier,
          timestamp: Date.now(),
        });
      }
    }
  }, [statProfiles, enableTelemetry]);

  // Clear selection handler
  const clearSelection = useCallback(() => {
    setSelectedStatId(null);
  }, []);

  // Export data handler
  const exportData = useCallback(() => {
    const exportData = {
      timestamp: Date.now(),
      radarConfig,
      statProfiles,
      selectedStat: selectedStat ? {
        statId: selectedStat.statId,
        displayName: selectedStat.displayName,
        value: selectedStat.value,
        tier: selectedStat.tier,
      } : null,
    };

    if (enableTelemetry) {
      trackStressTestEvent('stat_profile_exported', {
        profileCount: statProfiles.length,
        hasSelection: !!selectedStat,
        maxValue: radarConfig.maxValue,
      });
    }

    return JSON.stringify(exportData, null, 2);
  }, [radarConfig, statProfiles, selectedStat, enableTelemetry]);

  // Refresh handler
  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // Simulate async refresh
    setTimeout(() => {
      setIsLoading(false);
      
      if (enableTelemetry) {
        trackStressTestEvent('stat_profile_refreshed', {
          profileCount: statProfiles.length,
          maxStats,
        });
      }
    }, 100);
  }, [statProfiles.length, maxStats, enableTelemetry]);

  // Track profile view
  useEffect(() => {
    if (statProfiles.length > 0 && enableTelemetry) {
      trackStressTestEvent('stat_profile_viewed', {
        profileCount: statProfiles.length,
        maxValue: radarConfig.maxValue,
        hasSelection: !!selectedStat,
        autoTuneEnabled: enableAutoTune,
      });
    }
  }, [statProfiles.length, radarConfig.maxValue, selectedStat, enableAutoTune, enableTelemetry]);

  return {
    statProfiles,
    radarConfig,
    selectedStat,
    isLoading,
    error,
    selectStat,
    clearSelection,
    exportData,
    refresh,
  };
}
