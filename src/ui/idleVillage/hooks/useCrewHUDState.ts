/**
 * Crew HUD State Hook - NP-017
 * 
 * Aggregates crew scheduler state and provides alerts and metrics for HUD display.
 * Integrates with crew scheduler controllers and provides real-time state updates.
 * Follows config-first design with PersistenceService for preferences.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { useCallback, useEffect, useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { CrewSchedulerController } from '../controllers/CrewSchedulerController';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type {
  CrewHUDConfig,
  CrewStatusLevel,
  CrewAlertLevel,
} from '../config/hudCrewConfig';
import {
  DEFAULT_CREW_HUD_CONFIG,
  createCrewHUDConfig,
  getCrewStatusLevel,
  getCrewAlertLevel,
} from '../config/hudCrewConfig';

const diagnostics = createSandboxDiagnostics('useCrewHUDState', 'hook');

/**
 * Crew member state for HUD display
 */
export interface CrewHUDEntry {
  /** Crew member ID */
  crewId: string;
  /** Crew member display name */
  crewName: string;
  /** Current status level */
  status: CrewStatusLevel;
  /** Current fatigue level (0-1) */
  fatigue: number;
  /** Alert level based on metrics */
  alertLevel: CrewAlertLevel;
  /** Current activity if working */
  currentActivity?: string;
  /** Queue position if queued */
  queuePosition?: number;
  /** Priority score if queued */
  priorityScore?: number;
  /** Response time in seconds */
  responseTime?: number;
  /** Last update timestamp */
  lastUpdate: number;
  /** Whether crew is paused */
  isPaused: boolean;
  /** Avatar URL if available */
  avatarUrl?: string;
}

/**
 * Crew HUD metrics and statistics
 */
export interface CrewHUDMetrics {
  /** Total crew members */
  totalCrew: number;
  /** Crew members by status */
  crewByStatus: Record<CrewStatusLevel, number>;
  /** Crew members by alert level */
  crewByAlert: Record<CrewAlertLevel, number>;
  /** Average fatigue across all crew */
  averageFatigue: number;
  /** Number of crew needing attention */
  needingAttention: number;
  /** Queue size */
  queueSize: number;
  /** Average response time */
  averageResponseTime: number;
  /** Overall crew readiness percentage */
  readinessPercentage: number;
}

/**
 * Crew HUD state return value
 */
export interface UseCrewHUDStateReturn {
  /** Current configuration */
  config: CrewHUDConfig;
  /** Crew entries for HUD display */
  crewEntries: CrewHUDEntry[];
  /** HUD metrics */
  metrics: CrewHUDMetrics;
  /** Whether data is loading */
  isLoading: boolean;
  /** Last update timestamp */
  lastUpdate: number;
  /** Update configuration */
  updateConfig: (config: Partial<CrewHUDConfig>) => void;
  /** Pause/resume crew member */
  toggleCrewPause: (crewId: string) => void;
  /** Adjust crew priority */
  adjustCrewPriority: (crewId: string, priority: number) => void;
  /** Refresh data */
  refreshData: () => void;
  /** Export HUD data */
  exportData: () => string;
}

/**
 * Hook configuration options
 */
export interface UseCrewHUDStateOptions {
  /** Custom configuration */
  config?: Partial<CrewHUDConfig>;
  /** Crew scheduler controller */
  crewController?: CrewSchedulerController;
  /** Village state for crew data */
  villageState: {
    residents: Record<string, ResidentState>;
    currentTime: number;
  };
  /** Enable real-time updates */
  enableRealTime?: boolean;
  /** Update interval in milliseconds (unused until SchedulerService integration) */
  _updateInterval?: number;
}

/**
 * Storage key for HUD preferences
 */
const STORAGE_KEY = 'idle-village-crew-hud-preferences';

/**
 * Main crew HUD state hook
 */
export function useCrewHUDState({
  config: customConfig,
  crewController,
  villageState,
  enableRealTime = true,
  _updateInterval = 5000,
}: UseCrewHUDStateOptions): UseCrewHUDStateReturn {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());
  const [crewEntries, setCrewEntries] = useState<CrewHUDEntry[]>([]);
  const [pausedCrew, setPausedCrew] = useState<Set<string>>(new Set());

  // Configuration management
  const [config, setConfig] = useState<CrewHUDConfig>(() => {
    const merged = { ...DEFAULT_CREW_HUD_CONFIG, ...customConfig };
    return createCrewHUDConfig(merged);
  });

  /**
   * Load saved preferences from PersistenceService
   */
  const loadPreferences = useCallback(async () => {
    try {
      const saved = await loadData(STORAGE_KEY, DEFAULT_CREW_HUD_CONFIG);
      if (saved && typeof saved === 'object') {
        const validated = createCrewHUDConfig(saved);
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
  const savePreferences = useCallback(async (newConfig: CrewHUDConfig) => {
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
  const updateConfig = useCallback((newConfig: Partial<CrewHUDConfig>) => {
    const merged = { ...config, ...newConfig };
    const validated = createCrewHUDConfig(merged);
    setConfig(validated);
    savePreferences(validated);
  }, [config, savePreferences]);

  /**
   * Generate crew entry from resident state
   */
  const generateCrewEntry = useCallback((
    residentId: string,
    resident: ResidentState,
    queueData?: {
      position: number;
      priorityScore: number;
      responseTime: number;
    }
  ): CrewHUDEntry => {
    const status = getCrewStatusLevel(resident);
    const alertLevel = getCrewAlertLevel({
      fatigue: resident.fatigue,
      queueSize: queueData ? 1 : 0,
      responseTime: queueData?.responseTime,
    });

    return {
      crewId: residentId,
      crewName: resident.displayName || residentId,
      status,
      fatigue: resident.fatigue,
      alertLevel,
      currentActivity: undefined, // Would be populated from scheduler state
      queuePosition: queueData?.position,
      priorityScore: queueData?.priorityScore,
      responseTime: queueData?.responseTime,
      lastUpdate: Date.now(),
      isPaused: pausedCrew.has(residentId),
      avatarUrl: resident.portraitUrl,
    };
  }, [pausedCrew]);

  /**
   * Calculate HUD metrics
   */
  const calculateMetrics = useCallback((): CrewHUDMetrics => {
    const totalCrew = crewEntries.length;
    
    if (totalCrew === 0) {
      return {
        totalCrew: 0,
        crewByStatus: {
          available: 0,
          working: 0,
          resting: 0,
          injured: 0,
          exhausted: 0,
        },
        crewByAlert: {
          none: 0,
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        averageFatigue: 0,
        needingAttention: 0,
        queueSize: 0,
        averageResponseTime: 0,
        readinessPercentage: 0,
      };
    }

    const crewByStatus = crewEntries.reduce((acc, crew) => {
      acc[crew.status] = (acc[crew.status] || 0) + 1;
      return acc;
    }, {} as Record<CrewStatusLevel, number>);

    const crewByAlert = crewEntries.reduce((acc, crew) => {
      acc[crew.alertLevel] = (acc[crew.alertLevel] || 0) + 1;
      return acc;
    }, {} as Record<CrewAlertLevel, number>);

    const averageFatigue = crewEntries.reduce((sum, crew) => sum + crew.fatigue, 0) / totalCrew;
    const needingAttention = crewEntries.filter(crew => 
      crew.alertLevel === 'high' || crew.alertLevel === 'critical'
    ).length;
    
    const queueSize = crewController?.getQueueStats().total || 0;
    const averageResponseTime = crewEntries.reduce((sum, crew) => 
      sum + (crew.responseTime || 0), 0
    ) / totalCrew;
    
    const readyCrew = crewEntries.filter(crew => 
      crew.status === 'available' && crew.fatigue < config.thresholds.fatigueTired
    ).length;
    const readinessPercentage = totalCrew > 0 ? (readyCrew / totalCrew) * 100 : 0;

    return {
      totalCrew,
      crewByStatus,
      crewByAlert,
      averageFatigue,
      needingAttention,
      queueSize,
      averageResponseTime,
      readinessPercentage,
    };
  }, [crewEntries, crewController, config.thresholds.fatigueTired]);

  /**
   * Refresh all crew data
   */
  const refreshData = useCallback(() => {
    setIsLoading(true);
    
    const newCrewEntries: CrewHUDEntry[] = [];
    const queue = crewController?.getQueue() || [];

    Object.entries(villageState.residents).forEach(([residentId, resident]) => {
      // Find queue data for this resident
      const queueEntry = queue.find(entry => entry.residentId === residentId);
      const queueData = queueEntry ? {
        position: queue.indexOf(queueEntry) + 1,
        priorityScore: queueEntry.priorityScore,
        responseTime: Date.now() - queueEntry.timestamp,
      } : undefined;

      const crewEntry = generateCrewEntry(residentId, resident, queueData);
      newCrewEntries.push(crewEntry);
    });

    // Sort by alert level and priority
    newCrewEntries.sort((a, b) => {
      const alertOrder = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
      const aAlertOrder = alertOrder[a.alertLevel];
      const bAlertOrder = alertOrder[b.alertLevel];
      
      if (aAlertOrder !== bAlertOrder) {
        return bAlertOrder - aAlertOrder;
      }
      
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });

    // Limit to max visible cards
    const limitedEntries = newCrewEntries.slice(0, config.layout.maxVisibleCards);

    setCrewEntries(limitedEntries);
    setLastUpdate(Date.now());
    setIsLoading(false);

    diagnostics.info('Refreshed crew HUD data', {
      crewCount: limitedEntries.length,
      queueSize: queue.length,
    });

    // Emit telemetry event
    if (config.enableTelemetry) {
      diagnostics.info('Telemetry: crew_hud_data_refreshed', {
        crewCount: limitedEntries.length,
        metrics: calculateMetrics(),
      });
    }
  }, [villageState.residents, crewController, generateCrewEntry, config, calculateMetrics]);

  /**
   * Toggle crew pause state
   */
  const toggleCrewPause = useCallback((crewId: string) => {
    setPausedCrew(prev => {
      const newSet = new Set(prev);
      if (newSet.has(crewId)) {
        newSet.delete(crewId);
      } else {
        newSet.add(crewId);
      }
      return newSet;
    });

    diagnostics.info('Toggled crew pause', { crewId });

    // Emit telemetry event
    if (config.enableTelemetry) {
      diagnostics.info('Telemetry: crew_hud_pause_toggled', {
        crewId,
        isPaused: !pausedCrew.has(crewId),
      });
    }
  }, [pausedCrew, config.enableTelemetry]);

  /**
   * Adjust crew priority
   */
  const adjustCrewPriority = useCallback((crewId: string, priority: number) => {
    if (!crewController) {
      diagnostics.warn('No crew controller available for priority adjustment');
      return;
    }

    // Find and update the crew member's priority in the queue
    const queue = crewController.getQueue();
    const queueEntry = queue.find(entry => entry.residentId === crewId);
    
    if (queueEntry) {
      // This would need to be implemented in the crew scheduler
      diagnostics.info('Adjusted crew priority', { crewId, priority });
      
      if (config.enableTelemetry) {
        diagnostics.info('Telemetry: crew_hud_priority_adjusted', {
          crewId,
          oldPriority: queueEntry.priorityScore,
          newPriority: priority,
        });
      }
    }
  }, [crewController, config.enableTelemetry]);

  /**
   * Export HUD data
   */
  const exportData = useCallback((): string => {
    const exportData = {
      timestamp: Date.now(),
      config,
      crewEntries,
      metrics: calculateMetrics(),
      pausedCrew: Array.from(pausedCrew),
      metadata: {
        version: '1.0.0',
        exportedBy: 'NP-017 Crew HUD State',
      },
    };

    return JSON.stringify(exportData, null, 2);
  }, [config, crewEntries, calculateMetrics, pausedCrew]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await loadPreferences();
      refreshData();
    };
    initialize();
  }, [loadPreferences, refreshData]);

  // Real-time updates disabled - requires SchedulerService or useSandboxClock integration
  // TODO: Implement with proper sandbox timer utilities when available
  useEffect(() => {
    if (!enableRealTime) {
      return;
    }

    diagnostics.warn('Real-time updates disabled - requires SchedulerService integration');
  }, [enableRealTime]);

  const metrics = calculateMetrics();

  return {
    config,
    crewEntries,
    metrics,
    isLoading,
    lastUpdate,
    updateConfig,
    toggleCrewPause,
    adjustCrewPriority,
    refreshData,
    exportData,
  };
}

export default useCrewHUDState;
