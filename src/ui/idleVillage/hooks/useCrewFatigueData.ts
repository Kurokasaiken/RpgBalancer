/**
 * Idle Village Crew Fatigue Data Hook - NP-011
 * 
 * Simplified hook for crew fatigue dashboard with basic functionality.
 * Follows config-first design and uses PersistenceService for preferences.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { useCallback, useEffect, useState } from 'react';
import type { VillageTimeUnit } from '@/engine/game/idleVillage/TimeEngine';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type {
  FatigueDashboardConfig,
  FatigueLevel,
} from '../config/fatigueDashboardConfig';
import {
  DEFAULT_FATIGUE_DASHBOARD_CONFIG,
  getFatigueLevel,
  validateFatigueDashboardConfig,
} from '../config/fatigueDashboardConfig';

const diagnostics = createSandboxDiagnostics('useCrewFatigueData', 'hook');

/**
 * Crew member fatigue data
 */
export interface CrewFatigueData {
  /** Crew member ID */
  crewId: string;
  /** Crew member name */
  crewName: string;
  /** Current fatigue level */
  currentFatigue: number;
  /** Current fatigue level category */
  fatigueLevel: FatigueLevel;
  /** Trend direction */
  trend: 'increasing' | 'decreasing' | 'stable';
  /** Alert status */
  hasAlert: boolean;
  /** Last known activity */
  lastActivity?: string;
}

/**
 * Dashboard summary statistics
 */
export interface FatigueDashboardSummary {
  /** Total crew members */
  totalCrew: number;
  /** Crew members by fatigue level */
  crewByLevel: Record<FatigueLevel, number>;
  /** Average fatigue across all crew */
  averageFatigue: number;
  /** Number of crew needing rest */
  needingRest: number;
  /** Overall crew readiness percentage */
  readinessPercentage: number;
}

/**
 * Hook configuration options
 */
export interface UseCrewFatigueDataOptions {
  /** Custom dashboard configuration */
  config?: Partial<FatigueDashboardConfig>;
  /** Village state for fatigue calculations */
  villageState: {
    residents: Record<string, ResidentState>;
    currentTime: VillageTimeUnit;
  };
}

/**
 * Hook return value
 */
export interface UseCrewFatigueDataReturn {
  /** Current configuration */
  config: FatigueDashboardConfig;
  /** Crew fatigue data */
  crewData: Record<string, CrewFatigueData>;
  /** Dashboard summary */
  summary: FatigueDashboardSummary;
  /** Whether data is loading */
  isLoading: boolean;
  /** Last update timestamp */
  lastUpdate: number;
  /** Update configuration */
  updateConfig: (config: Partial<FatigueDashboardConfig>) => void;
  /** Export dashboard data */
  exportData: () => string;
  /** Refresh data */
  refreshData: () => void;
}

/**
 * Storage key for dashboard preferences
 */
const STORAGE_KEY = 'idle-village-fatigue-dashboard-preferences';

/**
 * Main crew fatigue data hook
 */
export function useCrewFatigueData({
  config: customConfig,
  villageState,
}: UseCrewFatigueDataOptions): UseCrewFatigueDataReturn {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());
  const [crewData, setCrewData] = useState<Record<string, CrewFatigueData>>({});

  // Configuration management
  const [config, setConfig] = useState<FatigueDashboardConfig>(() => {
    const merged = { ...DEFAULT_FATIGUE_DASHBOARD_CONFIG, ...customConfig };
    return validateFatigueDashboardConfig(merged);
  });

  /**
   * Load saved preferences from PersistenceService
   */
  const loadPreferences = useCallback(async () => {
    try {
      const saved = await loadData(STORAGE_KEY, DEFAULT_FATIGUE_DASHBOARD_CONFIG);
      if (saved && typeof saved === 'object') {
        const validated = validateFatigueDashboardConfig(saved);
        setConfig(validated);
        diagnostics.info('Loaded saved preferences', { config: validated });
      }
    } catch (error) {
      diagnostics.warn('Failed to load preferences', { error });
    }
  }, []);

  /**
   * Save preferences to PersistenceService
   */
  const savePreferences = useCallback(async (newConfig: FatigueDashboardConfig) => {
    try {
      await saveData(STORAGE_KEY, newConfig);
      diagnostics.info('Saved preferences', { config: newConfig });
    } catch (error) {
      diagnostics.warn('Failed to save preferences', { error });
    }
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<FatigueDashboardConfig>) => {
    const merged = { ...config, ...newConfig };
    const validated = validateFatigueDashboardConfig(merged);
    setConfig(validated);
    savePreferences(validated);
  }, [config, savePreferences]);

  /**
   * Generate fatigue data for a crew member
   */
  const generateCrewFatigueData = useCallback((
    residentId: string,
    resident: ResidentState
  ): CrewFatigueData => {
    const currentFatigue = resident.fatigue || 0;
    const fatigueLevel = getFatigueLevel(currentFatigue, config.thresholds);

    // Simple trend calculation (would use history in full implementation)
    const trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

    // Alert status based on thresholds
    const hasAlert = currentFatigue >= config.thresholds.warningThreshold;

    return {
      crewId: residentId,
      crewName: resident.displayName || residentId,
      currentFatigue,
      fatigueLevel,
      trend,
      hasAlert,
      lastActivity: undefined, // Would track current activity in full implementation
    };
  }, [config.thresholds]);

  /**
   * Calculate dashboard summary
   */
  const calculateSummary = useCallback((): FatigueDashboardSummary => {
    const crewValues = Object.values(crewData);
    const totalCrew = crewValues.length;

    if (totalCrew === 0) {
      return {
        totalCrew: 0,
        crewByLevel: {
          rested: 0,
          normal: 0,
          tired: 0,
          exhausted: 0,
          critical: 0,
        },
        averageFatigue: 0,
        needingRest: 0,
        readinessPercentage: 0,
      };
    }

    const crewByLevel = crewValues.reduce((acc, crew) => {
      acc[crew.fatigueLevel] = (acc[crew.fatigueLevel] || 0) + 1;
      return acc;
    }, {} as Record<FatigueLevel, number>);

    const averageFatigue = crewValues.reduce((sum, crew) => sum + crew.currentFatigue, 0) / totalCrew;
    const needingRest = crewValues.filter(crew => crew.currentFatigue >= config.thresholds.warningThreshold).length;
    const readinessPercentage = ((totalCrew - needingRest) / totalCrew) * 100;

    return {
      totalCrew,
      crewByLevel,
      averageFatigue,
      needingRest,
      readinessPercentage,
    };
  }, [crewData, config.thresholds.warningThreshold]);

  /**
   * Refresh all crew data
   */
  const refreshData = useCallback(() => {
    setIsLoading(true);
    
    const newCrewData: Record<string, CrewFatigueData> = {};

    Object.entries(villageState.residents).forEach(([residentId, resident]) => {
      const crewData = generateCrewFatigueData(residentId, resident);
      newCrewData[residentId] = crewData;
    });

    setCrewData(newCrewData);
    setLastUpdate(Date.now());
    setIsLoading(false);

    diagnostics.info('Refreshed crew fatigue data', {
      crewCount: Object.keys(newCrewData).length,
    });

    // Emit telemetry event
    if (config.telemetry.enabled && config.telemetry.events.dashboardViewed) {
      diagnostics.info('Telemetry: idle_fatigue_dashboard_viewed', {
        crewCount: Object.keys(newCrewData).length,
        readinessPercentage: calculateSummary().readinessPercentage,
      });
    }
  }, [villageState.residents, generateCrewFatigueData, config.telemetry, calculateSummary]);

  /**
   * Export dashboard data
   */
  const exportData = useCallback((): string => {
    const exportData = {
      timestamp: Date.now(),
      config,
      crewData,
      summary: calculateSummary(),
      metadata: {
        version: '1.0.0',
        exportedBy: 'NP-011 Crew Fatigue Dashboard',
      },
    };

    return JSON.stringify(exportData, null, 2);
  }, [config, crewData, calculateSummary]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await loadPreferences();
      refreshData();
    };
    initialize();
  }, [loadPreferences, refreshData]);

  const summary = calculateSummary();

  return {
    config,
    crewData,
    summary,
    isLoading,
    lastUpdate,
    updateConfig,
    exportData,
    refreshData,
  };
}

export default useCrewFatigueData;
