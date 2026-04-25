/**
 * Quest Timeline Data Hook
 * 
 * Hook for aggregating and managing quest decision data from telemetry
 * for timeline heatmap visualization. Integrates with PersistenceService
 * for configuration and caching.
 * 
 * @since NP-032 – Idle Village Quest Timeline Heatmap
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { z } from 'zod';
import {
  QuestTimelineConfig,
  QuestTimelineConfigSchema,
  DEFAULT_QUEST_TIMELINE_CONFIG,
  QUEST_TIMELINE_CONFIG_KEY,
  QuestDecision,
  QuestOutcome,
  QuestRiskLevel,
  calculateRiskLevel,
  formatTurnLabel,
} from '@/ui/idleVillage/config/questTimelineConfig';

/**
 * Quest timeline telemetry event types
 */
export type QuestTimelineTelemetryEvent = 
  | 'quest_timeline_heatmap_viewed'
  | 'quest_timeline_data_loaded'
  | 'quest_timeline_exported'
  | 'quest_timeline_config_updated';

/**
 * Quest timeline telemetry payload
 */
export interface QuestTimelineTelemetryPayload {
  eventType: QuestTimelineTelemetryEvent;
  data: {
    decisionCount: number;
    turnRange: { min: number; max: number };
    riskDistribution: Record<QuestRiskLevel, number>;
    outcomeDistribution: Record<QuestOutcome, number>;
    configSource: 'default' | 'saved' | 'custom';
    performance?: {
      loadTime: number;
      renderTime: number;
    };
  };
}

/**
 * Aggregated timeline data for heatmap rendering
 */
export interface TimelineData {
  /** Array of quest decisions */
  decisions: QuestDecision[];
  /** Decisions grouped by turn columns */
  decisionsByColumn: Map<number, QuestDecision[]>;
  /** Risk level distribution */
  riskDistribution: Record<QuestRiskLevel, number>;
  /** Outcome distribution */
  outcomeDistribution: Record<QuestOutcome, number>;
  /** Statistics about the data */
  stats: {
    totalDecisions: number;
    turnRange: { min: number; max: number };
    questCount: number;
    averageDecisionsPerTurn: number;
    riskiestTurn: number;
    successRate: number;
  };
}

/**
 * Hook options
 */
export interface UseQuestTimelineDataOptions {
  /** Initial configuration override */
  initialConfig?: Partial<QuestTimelineConfig>;
  /** Whether to enable auto-refresh */
  enableAutoRefresh?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether to emit telemetry events */
  enableTelemetry?: boolean;
}

/**
 * Quest timeline data hook
 * 
 * Provides aggregated quest decision data from telemetry sources
 * with configuration management and performance optimization.
 */
export const useQuestTimelineData = ({
  initialConfig = {},
  enableAutoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  enableTelemetry = true,
}: UseQuestTimelineDataOptions = {}) => {
  const [config, setConfig] = useState<QuestTimelineConfig>(DEFAULT_QUEST_TIMELINE_CONFIG);
  const [data, setData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load configuration from storage on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await loadData<QuestTimelineConfig>(QUEST_TIMELINE_CONFIG_KEY);
        if (savedConfig) {
          const validated = QuestTimelineConfigSchema.parse(savedConfig);
          setConfig({ ...validated, ...initialConfig });
        } else {
          setConfig({ ...DEFAULT_QUEST_TIMELINE_CONFIG, ...initialConfig });
        }
      } catch (err) {
        console.warn('Failed to load quest timeline config:', err);
        setConfig({ ...DEFAULT_QUEST_TIMELINE_CONFIG, ...initialConfig });
      }
    };

    loadConfig();
  }, [initialConfig]);

  // Save configuration when it changes
  useEffect(() => {
    const saveConfig = async () => {
      try {
        await saveData(QUEST_TIMELINE_CONFIG_KEY, config);
      } catch (err) {
        console.warn('Failed to save quest timeline config:', err);
      }
    };

    saveConfig();
  }, [config]);

  /**
   * Emit telemetry events
   */
  const emitTelemetry = useCallback((
    eventType: QuestTimelineTelemetryEvent,
    additionalData: Partial<QuestTimelineTelemetryPayload['data']> = {}
  ) => {
    if (!enableTelemetry || !data) return;

    const payload: QuestTimelineTelemetryPayload = {
      eventType,
      data: {
        decisionCount: data.stats.totalDecisions,
        turnRange: data.stats.turnRange,
        riskDistribution: data.riskDistribution,
        outcomeDistribution: data.outcomeDistribution,
        configSource: config === DEFAULT_QUEST_TIMELINE_CONFIG ? 'default' : 'saved',
        ...additionalData,
      },
    };

    // Dispatch custom event for telemetry collection
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('questTimelineTelemetry', {
          detail: payload,
        })
      );
    }
  }, [enableTelemetry, data, config]);

  /**
   * Load quest decisions from telemetry sources
   */
  const loadQuestDecisions = useCallback(async (): Promise<QuestDecision[]> => {
    // This would integrate with the actual quest feed telemetry
    // For now, we'll simulate loading from existing telemetry systems
    
    try {
      // Load from quest feed telemetry or other sources
      const questFeedData = await loadData<QuestDecision[]>('idle_village_quest_decisions');
      
      if (questFeedData) {
        return questFeedData;
      }

      // Fallback: generate sample data for demonstration
      return generateSampleQuestDecisions();
    } catch (err) {
      console.warn('Failed to load quest decisions:', err);
      return generateSampleQuestDecisions();
    }
  }, []);

  /**
   * Generate sample quest decisions for demonstration
   */
  const generateSampleQuestDecisions = useCallback((): QuestDecision[] => {
    const decisions: QuestDecision[] = [];
    const quests = ['forest_explore', 'village_defense', 'trade_mission', 'rescue_operation', 'diplomatic_quest'];
    const residents = ['resident-1', 'resident-2', 'resident-3', 'resident-4', 'resident-5'];
    const outcomes: QuestOutcome[] = ['success', 'failure', 'partial_success', 'abandoned', 'pending'];
    
    for (let turn = 1; turn <= 50; turn++) {
      const numDecisions = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numDecisions; i++) {
        const riskValue = Math.random() * 100;
        const decision: QuestDecision = {
          id: `decision-${turn}-${i}`,
          questId: quests[Math.floor(Math.random() * quests.length)],
          turn,
          timestamp: Date.now() - (50 - turn) * 24 * 60 * 60 * 1000,
          decision: `Choice made in turn ${turn}`,
          outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
          riskLevel: calculateRiskLevel(riskValue, config),
          residentId: residents[Math.floor(Math.random() * residents.length)],
          metadata: {
            riskValue,
            duration: Math.floor(Math.random() * 1000) + 100,
          },
        };
        
        decisions.push(decision);
      }
    }
    
    return decisions;
  }, [config]);

  /**
   * Aggregate decisions into timeline data
   */
  const aggregateTimelineData = useCallback((decisions: QuestDecision[]): TimelineData => {
    if (decisions.length === 0) {
      return {
        decisions: [],
        decisionsByColumn: new Map(),
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        outcomeDistribution: { success: 0, failure: 0, partial_success: 0, abandoned: 0, pending: 0 },
        stats: {
          totalDecisions: 0,
          turnRange: { min: 0, max: 0 },
          questCount: 0,
          averageDecisionsPerTurn: 0,
          riskiestTurn: 0,
          successRate: 0,
        },
      };
    }

    // Group decisions by turn columns
    const decisionsByColumn = new Map<number, QuestDecision[]>();
    const turnNumbers = new Set<number>();
    const questIds = new Set<string>();
    
    // Initialize risk and outcome distributions
    const riskDistribution: Record<QuestRiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    
    const outcomeDistribution: Record<QuestOutcome, number> = {
      success: 0,
      failure: 0,
      partial_success: 0,
      abandoned: 0,
      pending: 0,
    };

    // Aggregate data
    decisions.forEach(decision => {
      const column = Math.floor(decision.turn / config.timeline.turnsPerColumn);
      
      if (!decisionsByColumn.has(column)) {
        decisionsByColumn.set(column, []);
      }
      
      decisionsByColumn.get(column)!.push(decision);
      turnNumbers.add(decision.turn);
      questIds.add(decision.questId);
      
      riskDistribution[decision.riskLevel]++;
      outcomeDistribution[decision.outcome]++;
    });

    // Calculate statistics
    const turnArray = Array.from(turnNumbers).sort((a, b) => a - b);
    const successfulDecisions = decisions.filter(d => d.outcome === 'success').length;
    
    // Find riskiest turn (turn with highest average risk)
    const riskByTurn = new Map<number, number>();
    decisions.forEach(decision => {
      const current = riskByTurn.get(decision.turn) || 0;
      const riskValue = (decision.metadata?.riskValue as number) || 0;
      riskByTurn.set(decision.turn, current + riskValue);
    });
    
    let riskiestTurn = 0;
    let maxRisk = 0;
    
    riskByTurn.forEach((risk, turn) => {
      const avgRisk = risk / decisions.filter(d => d.turn === turn).length;
      if (avgRisk > maxRisk) {
        maxRisk = avgRisk;
        riskiestTurn = turn;
      }
    });

    const stats = {
      totalDecisions: decisions.length,
      turnRange: {
        min: turnArray[0] || 0,
        max: turnArray[turnArray.length - 1] || 0,
      },
      questCount: questIds.size,
      averageDecisionsPerTurn: decisions.length / turnNumbers.size,
      riskiestTurn,
      successRate: decisions.length > 0 ? successfulDecisions / decisions.length : 0,
    };

    return {
      decisions,
      decisionsByColumn,
      riskDistribution,
      outcomeDistribution,
      stats,
    };
  }, [config.timeline.turnsPerColumn]);

  /**
   * Refresh timeline data
   */
  const refreshData = useCallback(async () => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const decisions = await loadQuestDecisions();
      const timelineData = aggregateTimelineData(decisions);
      
      setData(timelineData);
      
      const loadTime = performance.now() - startTime;
      
      emitTelemetry('quest_timeline_data_loaded', {
        performance: { loadTime },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quest timeline data');
      console.error('Failed to load quest timeline data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadQuestDecisions, aggregateTimelineData, emitTelemetry]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<QuestTimelineConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      try {
        const validated = QuestTimelineConfigSchema.parse(newConfig);
        emitTelemetry('quest_timeline_config_updated');
        return validated;
      } catch (err) {
        console.warn('Invalid config update:', err);
        return prev;
      }
    });
  }, [emitTelemetry]);

  /**
   * Export timeline data
   */
  const exportData = useCallback((format: 'json' | 'csv' = 'json') => {
    if (!data) return null;

    const exportData = {
      config,
      data,
      exportedAt: new Date().toISOString(),
      format,
    };

    emitTelemetry('quest_timeline_exported');

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'questId', 'turn', 'timestamp', 'decision', 'outcome', 'riskLevel', 'residentId'];
      const rows = data.decisions.map(decision => [
        decision.id,
        decision.questId,
        decision.turn,
        decision.timestamp,
        decision.decision,
        decision.outcome,
        decision.riskLevel,
        decision.residentId || '',
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return null;
  }, [data, config, emitTelemetry]);

  // Auto-refresh effect
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, refreshInterval]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Memoized formatted data for rendering
  const formattedData = useMemo(() => {
    if (!data) return null;

    return {
      ...data,
      columns: Array.from(data.decisionsByColumn.entries()).map(([column, decisions]) => ({
        column,
        decisions,
        turnLabel: formatTurnLabel(
          column * config.timeline.turnsPerColumn + 1,
          config.timeline.turnLabelFormat
        ),
        riskLevel: calculateRiskLevel(
          decisions.reduce((sum, d) => sum + ((d.metadata?.riskValue as number) || 0), 0) / decisions.length,
          config
        ),
      })),
    };
  }, [data, config]);

  return {
    // Data
    data: formattedData,
    isLoading,
    error,
    
    // Configuration
    config,
    updateConfig,
    
    // Actions
    refreshData,
    exportData,
    
    // Computed values
    hasData: data !== null && data.decisions.length > 0,
    decisionCount: data?.decisions.length || 0,
    
    // Telemetry
    emitTelemetry,
  };
};
