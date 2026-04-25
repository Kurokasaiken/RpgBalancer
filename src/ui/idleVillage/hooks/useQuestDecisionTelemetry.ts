/**
 * Idle Village Quest Decision Telemetry Hooks
 * 
 * React hooks for quest decision telemetry with real-time feed,
 * event tracking, and fallback mechanisms.
 * 
 * @module useQuestDecisionTelemetry
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import {
  getQuestDecisionTelemetryPipeline,
  type QuestDecisionTelemetryEvent,
  type QuestDecisionTelemetryPipelineConfig,
  type QuestDecisionTelemetryFeedConfig,
  type QuestDecisionMetrics,
  type QuestDecisionContext,
  type QuestDecisionFactors,
  type QuestDecisionOutcome,
  type QuestDecisionType,
  type DecisionSource,
  type DecisionConfidence,
  type QuestCategory,
  type QuestDifficulty,
  DEFAULT_QUEST_DECISION_TELEMETRY_FEED_CONFIG,
  createQuestDecisionEventId,
  calculateDecisionConfidence,
} from '@/balancing/config/idleVillage/questDecisionTelemetryConfig';

const diagnostics = createSandboxDiagnostics('QuestDecisionTelemetryHooks', 'telemetry');

/**
 * Hook return value
 */
export interface UseQuestDecisionTelemetryReturn {
  // Event tracking
  trackDecision: (decision: QuestDecisionTelemetryEvent) => Promise<void>;
  trackDecisionSimple: (params: SimpleDecisionParams) => Promise<void>;
  
  // Feed data
  events: QuestDecisionTelemetryEvent[];
  metrics: QuestDecisionMetrics;
  filteredEvents: QuestDecisionTelemetryEvent[];
  
  // Feed state
  isLoading: boolean;
  error: string | null;
  status: string;
  
  // Configuration
  updateFeedConfig: (config: Partial<QuestDecisionTelemetryFeedConfig>) => void;
  updatePipelineConfig: (config: Partial<QuestDecisionTelemetryPipelineConfig>) => void;
  
  // Utilities
  clearEvents: () => void;
  refreshFeed: () => Promise<void>;
  exportEvents: (format: 'json' | 'csv') => string;
}

/**
 * Simple decision parameters
 */
export interface SimpleDecisionParams {
  questId: string;
  questName: string;
  questCategory: QuestCategory;
  questDifficulty: QuestDifficulty;
  decisionType: QuestDecisionType;
  source: DecisionSource;
  playerLevel: number;
  playerExperience: number;
  processingTime: number;
  justification?: string;
}

/**
 * Real-time feed hook
 */
export function useQuestDecisionTelemetry(
  feedConfig: Partial<QuestDecisionTelemetryFeedConfig> = {},
  pipelineConfig: Partial<QuestDecisionTelemetryPipelineConfig> = {}
): UseQuestDecisionTelemetryReturn {
  // Configuration
  const fullFeedConfig = useMemo(() => ({
    ...DEFAULT_QUEST_DECISION_TELEMETRY_FEED_CONFIG,
    ...feedConfig,
  }), [feedConfig]);

  const fullPipelineConfig = useMemo(() => ({
    ...pipelineConfig,
  }), [pipelineConfig]);

  // State
  const [events, setEvents] = useState<QuestDecisionTelemetryEvent[]>([]);
  const [metrics, setMetrics] = useState<QuestDecisionMetrics>({
    totalDecisions: 0,
    decisionsByType: {} as Record<QuestDecisionType, number>,
    avgProcessingTime: 0,
    avgConfidence: 0,
    revertRate: 0,
    successRate: 0,
    completionRate: 0,
    abandonmentRate: 0,
    timeToDecision: 0,
    decisionFrequency: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');

  // Refs
  const pipelineRef = useRef(getQuestDecisionTelemetryPipeline(fullPipelineConfig));
  const feedTimerRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(Date.now());

  // Calculate filtered events
  const filteredEvents = useMemo(() => {
    if (!fullFeedConfig.filtering.enabled) return events;

    return events.filter(event => {
      // Type filtering
      if (fullFeedConfig.filtering.includeTypes.length > 0) {
        if (!fullFeedConfig.filtering.includeTypes.includes(event.outcome.decisionType)) {
          return false;
        }
      }
      if (fullFeedConfig.filtering.excludeTypes.length > 0) {
        if (fullFeedConfig.filtering.excludeTypes.includes(event.outcome.decisionType)) {
          return false;
        }
      }

      // Category filtering
      if (fullFeedConfig.filtering.includeCategories.length > 0) {
        if (!fullFeedConfig.filtering.includeCategories.includes(event.questCategory)) {
          return false;
        }
      }
      if (fullFeedConfig.filtering.excludeCategories.length > 0) {
        if (fullFeedConfig.filtering.excludeCategories.includes(event.questCategory)) {
          return false;
        }
      }

      // Confidence filtering
      const confidenceLevels = {
        very_low: 0,
        low: 0.2,
        medium: 0.4,
        high: 0.6,
        very_high: 0.8,
        certain: 1.0,
      };
      const minConfidenceValue = confidenceLevels[fullFeedConfig.filtering.minConfidence];
      const eventConfidenceValue = confidenceLevels[event.outcome.confidence];
      
      if (eventConfidenceValue < minConfidenceValue) {
        return false;
      }

      // Date range filtering
      if (fullFeedConfig.filtering.dateRange) {
        const eventTime = event.outcome.timestamp;
        if (eventTime < fullFeedConfig.filtering.dateRange.start ||
            eventTime > fullFeedConfig.filtering.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [events, fullFeedConfig.filtering]);

  // Track decision event
  const trackDecision = useCallback(async (decision: QuestDecisionTelemetryEvent) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pipelineRef.current.addEvent(decision);
      
      // Add to local events for real-time feed
      if (fullFeedConfig.realTime.enabled) {
        setEvents(prev => [...prev, decision]);
      }
      
      // Update metrics
      updateMetrics([...events, decision]);
      
      diagnostics.debug('Decision tracked successfully', { eventId: decision.eventId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      diagnostics.error('Failed to track decision', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [events, fullFeedConfig.realTime.enabled]);

  // Track simple decision
  const trackDecisionSimple = useCallback(async (params: SimpleDecisionParams) => {
    const now = Date.now();
    
    // Create context
    const context: QuestDecisionContext = {
      playerLevel: params.playerLevel,
      playerExperience: params.playerExperience,
      availableResources: {},
      activeQuestsCount: 0,
      completedQuestsCount: 0,
      failedQuestsCount: 0,
      gameTime: now,
      sessionDuration: 0,
      playerLocation: 'unknown',
      timeOfDay: 'afternoon',
      deviceType: 'desktop',
      networkQuality: 'good',
    };

    // Create factors
    const factors: QuestDecisionFactors = {
      timePressure: 0.5,
      resourcePressure: 0.5,
      riskTolerance: 0.5,
      rewardAttractiveness: 0.5,
      socialInfluence: 0.5,
      previousSuccessRate: 0.5,
      difficultyPreference: 0.5,
      timeAvailability: 0.5,
      motivationLevel: 0.5,
      fatigueLevel: 0.5,
    };

    // Create outcome
    const confidence = calculateDecisionConfidence(factors);
    const outcome: QuestDecisionOutcome = {
      timestamp: now,
      decisionType: params.decisionType,
      source: params.source,
      confidence,
      processingTime: params.processingTime,
      reverted: false,
      finalDecision: params.decisionType,
      justification: params.justification,
    };

    // Create full event
    const event: QuestDecisionTelemetryEvent = {
      eventId: createQuestDecisionEventId(),
      questId: params.questId,
      questName: params.questName,
      questCategory: params.questCategory,
      questDifficulty: params.questDifficulty,
      context,
      factors,
      outcome,
      questRequirements: {
        level: 1,
        resources: {},
        prerequisites: [],
      },
      questRewards: {
        experience: 0,
        resources: {},
        items: [],
        reputation: 0,
      },
      playerStateBefore: {
        health: 100,
        mana: 100,
        stamina: 100,
        inventory: {},
        skills: {},
      },
      playerStateAfter: {
        health: 100,
        mana: 100,
        stamina: 100,
        inventory: {},
        skills: {},
      },
      metadata: {
        sessionId: 'session-' + Date.now(),
        userId: 'user-' + Date.now(),
        version: '1.0.0',
        buildNumber: 'build-1',
        platform: 'web',
        timezone: 'UTC',
        language: 'en',
        region: 'US',
      },
    };

    await trackDecision(event);
  }, [trackDecision]);

  // Update metrics
  const updateMetrics = useCallback((eventList: QuestDecisionTelemetryEvent[]) => {
    const total = eventList.length;
    if (total === 0) {
      setMetrics({
        totalDecisions: 0,
        decisionsByType: {} as Record<QuestDecisionType, number>,
        avgProcessingTime: 0,
        avgConfidence: 0,
        revertRate: 0,
        successRate: 0,
        completionRate: 0,
        abandonmentRate: 0,
        timeToDecision: 0,
        decisionFrequency: 0,
      });
      return;
    }

    // Calculate decisions by type
    const decisionsByType = {} as Record<QuestDecisionType, number>;
    let totalProcessingTime = 0;
    let totalConfidence = 0;
    let revertedCount = 0;
    let successCount = 0;
    let completedCount = 0;
    let abandonedCount = 0;

    eventList.forEach(event => {
      const type = event.outcome.decisionType;
      decisionsByType[type] = (decisionsByType[type] || 0) + 1;
      
      totalProcessingTime += event.outcome.processingTime;
      
      const confidenceLevels = {
        very_low: 0,
        low: 0.2,
        medium: 0.4,
        high: 0.6,
        very_high: 0.8,
        certain: 1.0,
      };
      totalConfidence += confidenceLevels[event.outcome.confidence];
      
      if (event.outcome.reverted) revertedCount++;
      if (event.outcome.decisionType === 'quest_complete' || 
          event.outcome.decisionType === 'quest_accept') successCount++;
      if (event.outcome.decisionType === 'quest_complete') completedCount++;
      if (event.outcome.decisionType === 'quest_abandon' || 
          event.outcome.decisionType === 'quest_fail') abandonedCount++;
    });

    // Calculate time range for frequency
    const timestamps = eventList.map(e => e.outcome.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1; // Avoid division by zero
    const hours = timeRange / (1000 * 60 * 60);

    setMetrics({
      totalDecisions: total,
      decisionsByType,
      avgProcessingTime: totalProcessingTime / total,
      avgConfidence: totalConfidence / total,
      revertRate: revertedCount / total,
      successRate: successCount / total,
      completionRate: completedCount / total,
      abandonmentRate: abandonedCount / total,
      timeToDecision: totalProcessingTime / total,
      decisionFrequency: total / hours,
    });
  }, []);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
    updateMetrics([]);
    diagnostics.debug('Events cleared');
  }, [updateMetrics]);

  // Refresh feed
  const refreshFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load events from storage
      const pipeline = pipelineRef.current;
      const storageEvents = await pipeline['storage'].load(1000);
      
      setEvents(storageEvents);
      updateMetrics(storageEvents);
      lastUpdateRef.current = Date.now();
      
      diagnostics.debug('Feed refreshed', { eventCount: storageEvents.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      diagnostics.error('Failed to refresh feed', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [updateMetrics]);

  // Export events
  const exportEvents = useCallback((format: 'json' | 'csv'): string => {
    const dataToExport = filteredEvents;
    
    if (format === 'json') {
      return JSON.stringify(dataToExport, null, 2);
    }
    
    if (format === 'csv') {
      const headers = [
        'eventId',
        'questId',
        'questName',
        'questCategory',
        'questDifficulty',
        'decisionType',
        'source',
        'confidence',
        'processingTime',
        'reverted',
        'timestamp',
        'playerLevel',
        'playerExperience',
      ];
      
      const rows = dataToExport.map(event => [
        event.eventId,
        event.questId,
        event.questName,
        event.questCategory,
        event.questDifficulty,
        event.outcome.decisionType,
        event.outcome.source,
        event.outcome.confidence,
        event.outcome.processingTime,
        event.outcome.reverted,
        event.outcome.timestamp,
        event.context.playerLevel,
        event.context.playerExperience,
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return '';
  }, [filteredEvents]);

  // Update feed configuration
  const updateFeedConfig = useCallback((config: Partial<QuestDecisionTelemetryFeedConfig>) => {
    Object.assign(fullFeedConfig, config);
    diagnostics.debug('Feed configuration updated', { config });
  }, [fullFeedConfig]);

  // Update pipeline configuration
  const updatePipelineConfig = useCallback((config: Partial<QuestDecisionTelemetryPipelineConfig>) => {
    pipelineRef.current.updateConfig(config);
    diagnostics.debug('Pipeline configuration updated', { config });
  }, []);

  // Start real-time feed
  useEffect(() => {
    if (fullFeedConfig.realTime.enabled && fullFeedConfig.enabled) {
      feedTimerRef.current = setInterval(() => {
        refreshFeed();
      }, fullFeedConfig.realTime.updateInterval);
      
      // Initial load
      refreshFeed();
    }

    return () => {
      if (feedTimerRef.current) {
        clearInterval(feedTimerRef.current);
      }
    };
  }, [fullFeedConfig.realTime.enabled, fullFeedConfig.realTime.updateInterval, fullFeedConfig.enabled, refreshFeed]);

  // Update status
  useEffect(() => {
    const pipeline = pipelineRef.current;
    setStatus(pipeline.getStatus());
  }, []);

  return {
    // Event tracking
    trackDecision,
    trackDecisionSimple,
    
    // Feed data
    events,
    metrics,
    filteredEvents,
    
    // Feed state
    isLoading,
    error,
    status,
    
    // Configuration
    updateFeedConfig,
    updatePipelineConfig,
    
    // Utilities
    clearEvents,
    refreshFeed,
    exportEvents,
  };
}

/**
 * Hook for quest decision analytics
 */
export function useQuestDecisionAnalytics(
  events: QuestDecisionTelemetryEvent[]
) {
  const analytics = useMemo(() => {
    if (events.length === 0) {
      return {
        totalDecisions: 0,
        averageProcessingTime: 0,
        averageConfidence: 0,
        revertRate: 0,
        successRate: 0,
        completionRate: 0,
        abandonmentRate: 0,
        decisionsByCategory: {} as Record<QuestCategory, number>,
        decisionsByDifficulty: {} as Record<QuestDifficulty, number>,
        decisionsBySource: {} as Record<DecisionSource, number>,
        decisionsByConfidence: {} as Record<DecisionConfidence, number>,
        hourlyDistribution: {} as Record<string, number>,
        dailyDistribution: {} as Record<string, number>,
      };
    }

    const decisionsByCategory = {} as Record<QuestCategory, number>;
    const decisionsByDifficulty = {} as Record<QuestDifficulty, number>;
    const decisionsBySource = {} as Record<DecisionSource, number>;
    const decisionsByConfidence = {} as Record<DecisionConfidence, number>;
    const hourlyDistribution = {} as Record<string, number>;
    const dailyDistribution = {} as Record<string, number>;

    let totalProcessingTime = 0;
    let totalConfidence = 0;
    let revertedCount = 0;
    let successCount = 0;
    let completedCount = 0;
    let abandonedCount = 0;

    events.forEach(event => {
      // Category distribution
      const category = event.questCategory;
      decisionsByCategory[category] = (decisionsByCategory[category] || 0) + 1;

      // Difficulty distribution
      const difficulty = event.questDifficulty;
      decisionsByDifficulty[difficulty] = (decisionsByDifficulty[difficulty] || 0) + 1;

      // Source distribution
      const source = event.outcome.source;
      decisionsBySource[source] = (decisionsBySource[source] || 0) + 1;

      // Confidence distribution
      const confidence = event.outcome.confidence;
      decisionsByConfidence[confidence] = (decisionsByConfidence[confidence] || 0) + 1;

      // Time distribution
      const date = new Date(event.outcome.timestamp);
      const hour = date.getHours().toString();
      const day = date.toISOString().split('T')[0];
      
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;

      // Metrics
      totalProcessingTime += event.outcome.processingTime;
      
      const confidenceLevels = {
        very_low: 0,
        low: 0.2,
        medium: 0.4,
        high: 0.6,
        very_high: 0.8,
        certain: 1.0,
      };
      totalConfidence += confidenceLevels[event.outcome.confidence];
      
      if (event.outcome.reverted) revertedCount++;
      if (event.outcome.decisionType === 'quest_complete' || 
          event.outcome.decisionType === 'quest_accept') successCount++;
      if (event.outcome.decisionType === 'quest_complete') completedCount++;
      if (event.outcome.decisionType === 'quest_abandon' || 
          event.outcome.decisionType === 'quest_fail') abandonedCount++;
    });

    return {
      totalDecisions: events.length,
      averageProcessingTime: totalProcessingTime / events.length,
      averageConfidence: totalConfidence / events.length,
      revertRate: revertedCount / events.length,
      successRate: successCount / events.length,
      completionRate: completedCount / events.length,
      abandonmentRate: abandonedCount / events.length,
      decisionsByCategory,
      decisionsByDifficulty,
      decisionsBySource,
      decisionsByConfidence,
      hourlyDistribution,
      dailyDistribution,
    };
  }, [events]);

  return analytics;
}

/**
 * Hook for quest decision alerts
 */
export function useQuestDecisionAlerts(
  metrics: QuestDecisionMetrics,
  config: QuestDecisionTelemetryFeedConfig['alerting']
) {
  const [alerts, setAlerts] = useState<Array<{
    type: 'warning' | 'error';
    message: string;
    timestamp: number;
    metric: string;
    value: number;
    threshold: number;
  }>>([]);

  useEffect(() => {
    if (!config.enabled) return;

    const newAlerts: typeof alerts = [];

    // Check revert rate
    if (metrics.revertRate > config.thresholds.revertRate) {
      newAlerts.push({
        type: 'warning',
        message: `High revert rate detected: ${(metrics.revertRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        metric: 'revertRate',
        value: metrics.revertRate,
        threshold: config.thresholds.revertRate,
      });
    }

    // Check processing time
    if (metrics.avgProcessingTime > config.thresholds.processingTime) {
      newAlerts.push({
        type: 'warning',
        message: `Slow processing time detected: ${metrics.avgProcessingTime.toFixed(0)}ms`,
        timestamp: Date.now(),
        metric: 'processingTime',
        value: metrics.avgProcessingTime,
        threshold: config.thresholds.processingTime,
      });
    }

    // Check abandonment rate
    if (metrics.abandonmentRate > config.thresholds.abandonmentRate) {
      newAlerts.push({
        type: 'error',
        message: `High abandonment rate detected: ${(metrics.abandonmentRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        metric: 'abandonmentRate',
        value: metrics.abandonmentRate,
        threshold: config.thresholds.abandonmentRate,
      });
    }

    setAlerts(newAlerts);
  }, [metrics, config]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    clearAlerts,
    hasAlerts: alerts.length > 0,
  };
}
