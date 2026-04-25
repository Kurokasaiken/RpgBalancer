/**
 * NP-029 – Idle Village Quest Narrative Hooks Refactor
 * 
 * Hook for narrative telemetry tracking and analytics.
 * Provides comprehensive telemetry collection for narrative
 * events, metrics, and performance monitoring.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTelemetryConfig } from '../../../balancing/config/narrative/narrativeConfig';

export interface NarrativeTelemetryEvent {
  id: string;
  name: string;
  timestamp: number;
  properties: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
}

export interface NarrativeTelemetryMetric {
  name: string;
  value: number;
  timestamp: number;
  unit?: string;
  tags?: Record<string, string>;
}

export interface NarrativeTelemetryOptions {
  enabled?: boolean;
  sessionId?: string;
  userId?: string;
  batchSize?: number;
  flushInterval?: number;
  maxEvents?: number;
  enablePersistence?: boolean;
}

export function useNarrativeTelemetry(options: NarrativeTelemetryOptions = {}) {
  const {
    enabled = true,
    sessionId = `session_${Date.now()}`,
    userId = 'anonymous',
    batchSize = 10,
    flushInterval = 5000, // 5 seconds
    maxEvents = 1000,
    enablePersistence = true,
  } = options;

  const [events, setEvents] = useState<NarrativeTelemetryEvent[]>([]);
  const [metrics, setMetrics] = useState<NarrativeTelemetryMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastFlush, setLastFlush] = useState<number>(Date.now());

  // Load persisted data on mount
  useEffect(() => {
    if (enablePersistence) {
      try {
        const storedEvents = localStorage.getItem('narrative_telemetry_events');
        const storedMetrics = localStorage.getItem('narrative_telemetry_metrics');
        
        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents);
          setEvents(parsedEvents.slice(-maxEvents)); // Keep only recent events
        }
        
        if (storedMetrics) {
          const parsedMetrics = JSON.parse(storedMetrics);
          setMetrics(parsedMetrics.slice(-maxEvents)); // Keep only recent metrics
        }
      } catch (error) {
        console.warn('Failed to load persisted telemetry data:', error);
      }
    }
    
    setIsConnected(true);
  }, [enablePersistence, maxEvents]);

  // Persist data when it changes
  useEffect(() => {
    if (enablePersistence && events.length > 0) {
      try {
        localStorage.setItem('narrative_telemetry_events', JSON.stringify(events));
      } catch (error) {
        console.warn('Failed to persist telemetry events:', error);
      }
    }
  }, [events, enablePersistence]);

  useEffect(() => {
    if (enablePersistence && metrics.length > 0) {
      try {
        localStorage.setItem('narrative_telemetry_metrics', JSON.stringify(metrics));
      } catch (error) {
        console.warn('Failed to persist telemetry metrics:', error);
      }
    }
  }, [metrics, enablePersistence]);

  // Auto-flush interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      flush();
    }, flushInterval);

    return () => clearInterval(interval);
  }, [enabled, flushInterval]);

  /**
   * Track a telemetry event
   */
  const trackEvent = useCallback((
    name: string,
    properties: Record<string, unknown> = {},
    timestamp: number = Date.now()
  ) => {
    if (!enabled) return;

    const event: NarrativeTelemetryEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp,
      properties,
      sessionId,
      userId,
    };

    setEvents(prev => {
      const updated = [...prev, event];
      return updated.slice(-maxEvents); // Keep only recent events
    });

    // Auto-flush if batch size reached
    if (events.length >= batchSize - 1) {
      setTimeout(() => flush(), 0);
    }
  }, [enabled, sessionId, userId, events.length, batchSize, maxEvents]);

  /**
   * Track a telemetry metric
   */
  const trackMetric = useCallback((
    name: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>,
    timestamp: number = Date.now()
  ) => {
    if (!enabled) return;

    const metric: NarrativeTelemetryMetric = {
      name,
      value,
      timestamp,
      unit,
      tags,
    };

    setMetrics(prev => {
      const updated = [...prev, metric];
      return updated.slice(-maxEvents); // Keep only recent metrics
    });
  }, [enabled, maxEvents]);

  /**
   * Track narrative generation event
   */
  const trackNarrativeGeneration = useCallback((
    hookId: string,
    templateId: string,
    context: Record<string, unknown>,
    generationTime: number
  ) => {
    trackEvent('narrative_generated', {
      hookId,
      templateId,
      context,
      generationTime,
    });

    trackMetric('narrative_generation_time', generationTime, 'ms', {
      hookId,
      templateId,
    });
  }, [trackEvent, trackMetric]);

  /**
   * Track template selection event
   */
  const trackTemplateSelection = useCallback((
    hookId: string,
    templateId: string,
    selectedFrom: number,
    conditionsMatched: string[]
  ) => {
    trackEvent('template_selected', {
      hookId,
      templateId,
      selectedFrom,
      conditionsMatched,
    });

    trackMetric('template_selection_pool_size', selectedFrom, 'count', {
      hookId,
      templateId,
    });
  }, [trackEvent, trackMetric]);

  /**
   * Track hook trigger event
   */
  const trackHookTrigger = useCallback((
    hookId: string,
    context: Record<string, unknown>,
    conditionsEvaluated: number,
    conditionsMatched: number
  ) => {
    trackEvent('hook_triggered', {
      hookId,
      context,
      conditionsEvaluated,
      conditionsMatched,
    });

    trackMetric('hook_condition_match_rate', 
      conditionsEvaluated > 0 ? (conditionsMatched / conditionsEvaluated) * 100 : 0,
      'percent',
      { hookId }
    );
  }, [trackEvent, trackMetric]);

  /**
   * Track variable substitution event
   */
  const trackVariableSubstitution = useCallback((
    templateId: string,
    variables: Record<string, unknown>,
    missingVariables: string[],
    substitutionTime: number
  ) => {
    trackEvent('variable_substituted', {
      templateId,
      variables,
      missingVariables,
      substitutionTime,
    });

    trackMetric('variable_substitution_time', substitutionTime, 'ms', {
      templateId,
    });

    if (missingVariables.length > 0) {
      trackMetric('missing_variables_count', missingVariables.length, 'count', {
        templateId,
      });
    }
  }, [trackEvent, trackMetric]);

  /**
   * Track engagement metrics
   */
  const trackEngagement = useCallback((
    narrativeId: string,
    engagementScore: number,
    timeSpent: number,
    interactions: number
  ) => {
    trackEvent('narrative_engagement', {
      narrativeId,
      engagementScore,
      timeSpent,
      interactions,
    });

    trackMetric('engagement_score', engagementScore, 'score', {
      narrativeId,
    });

    trackMetric('time_spent_on_narrative', timeSpent, 'ms', {
      narrativeId,
    });

    trackMetric('narrative_interactions', interactions, 'count', {
      narrativeId,
    });
  }, [trackEvent, trackMetric]);

  /**
   * Track completion metrics
   */
  const trackCompletion = useCallback((
    questId: string,
    narrativeId: string,
    completed: boolean,
    completionTime: number,
    difficulty: string
  ) => {
    trackEvent('narrative_completion', {
      questId,
      narrativeId,
      completed,
      completionTime,
      difficulty,
    });

    trackMetric('completion_time', completionTime, 'ms', {
      questId,
      difficulty,
    });

    trackMetric('completion_rate', completed ? 100 : 0, 'percent', {
      questId,
      difficulty,
    });
  }, [trackEvent, trackMetric]);

  /**
   * Track error events
   */
  const trackError = useCallback((
    errorType: string,
    errorMessage: string,
    context: Record<string, unknown> = {},
    stack?: string
  ) => {
    trackEvent('narrative_error', {
      errorType,
      errorMessage,
      context,
      stack,
    });

    trackMetric('error_count', 1, 'count', {
      errorType,
    });
  }, [trackEvent, trackMetric]);

  /**
   * Flush telemetry data to backend/storage
   */
  const flush = useCallback(async () => {
    if (!enabled || events.length === 0) return;

    try {
      const telemetryConfig = getTelemetryConfig();
      
      // In a real implementation, this would send data to a telemetry backend
      console.log('Flushing telemetry data:', {
        events: events.length,
        metrics: metrics.length,
        config: telemetryConfig,
      });

      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 100));

      setLastFlush(Date.now());
      
      // Clear flushed events (in a real implementation, you'd wait for confirmation)
      setEvents([]);
      setMetrics([]);

    } catch (error) {
      console.error('Failed to flush telemetry data:', error);
      trackError('flush_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [enabled, events, metrics, trackError]);

  /**
   * Clear all telemetry data
   */
  const clear = useCallback(() => {
    setEvents([]);
    setMetrics([]);
    
    if (enablePersistence) {
      localStorage.removeItem('narrative_telemetry_events');
      localStorage.removeItem('narrative_telemetry_metrics');
    }
  }, [enablePersistence]);

  /**
   * Get telemetry statistics
   */
  const getStats = useCallback(() => {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);

    const recentEvents = events.filter(e => e.timestamp > hourAgo);
    const recentMetrics = metrics.filter(m => m.timestamp > hourAgo);

    const dailyEvents = events.filter(e => e.timestamp > dayAgo);
    const dailyMetrics = metrics.filter(m => m.timestamp > dayAgo);

    const eventTypes = new Map<string, number>();
    events.forEach(event => {
      eventTypes.set(event.name, (eventTypes.get(event.name) || 0) + 1);
    });

    const metricNames = new Map<string, { count: number; sum: number; avg: number }>();
    metrics.forEach(metric => {
      const existing = metricNames.get(metric.name) || { count: 0, sum: 0, avg: 0 };
      existing.count++;
      existing.sum += metric.value;
      existing.avg = existing.sum / existing.count;
      metricNames.set(metric.name, existing);
    });

    return {
      events: {
        total: events.length,
        recent: recentEvents.length,
        daily: dailyEvents.length,
        types: Object.fromEntries(eventTypes),
      },
      metrics: {
        total: metrics.length,
        recent: recentMetrics.length,
        daily: dailyMetrics.length,
        names: Object.fromEntries(
          Array.from(metricNames.entries()).map(([name, stats]) => [
            name,
            { count: stats.count, sum: stats.sum, avg: stats.avg }
          ])
        ),
      },
      session: {
        id: sessionId,
        userId,
        startTime: events.length > 0 ? Math.min(...events.map(e => e.timestamp)) : now,
        lastActivity: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : now,
        lastFlush,
      },
    };
  }, [events, metrics, sessionId, userId, lastFlush]);

  /**
   * Export telemetry data
   */
  const exportData = useCallback(() => {
    return {
      events,
      metrics,
      stats: getStats(),
      exportedAt: Date.now(),
      config: getTelemetryConfig(),
    };
  }, [events, metrics, getStats]);

  /**
   * Import telemetry data (for testing/migration)
   */
  const importData = useCallback((data: { events?: NarrativeTelemetryEvent[]; metrics?: NarrativeTelemetryMetric[] }) => {
    if (data.events) {
      setEvents(prev => [...prev, ...data.events].slice(-maxEvents));
    }
    
    if (data.metrics) {
      setMetrics(prev => [...prev, ...data.metrics].slice(-maxEvents));
    }
  }, [maxEvents]);

  // Memoized computed values
  const recentEvents = useMemo(() => 
    events.filter(e => e.timestamp > Date.now() - (60 * 60 * 1000)),
    [events]
  );

  const recentMetrics = useMemo(() => 
    metrics.filter(m => m.timestamp > Date.now() - (60 * 60 * 1000)),
    [metrics]
  );

  const topEvents = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(event => {
      counts.set(event.name, (counts.get(event.name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [events]);

  const topMetrics = useMemo(() => {
    const averages = new Map<string, { sum: number; count: number }>();
    metrics.forEach(metric => {
      const existing = averages.get(metric.name) || { sum: 0, count: 0 };
      existing.sum += metric.value;
      existing.count++;
      averages.set(metric.name, existing);
    });
    return Array.from(averages.entries())
      .map(([name, stats]) => ({ name, avg: stats.sum / stats.count, count: stats.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [metrics]);

  return {
    // State
    events,
    metrics,
    isConnected,
    lastFlush,
    
    // Computed values
    recentEvents,
    recentMetrics,
    topEvents,
    topMetrics,
    
    // Core methods
    trackEvent,
    trackMetric,
    flush,
    clear,
    
    // Specialized tracking methods
    trackNarrativeGeneration,
    trackTemplateSelection,
    trackHookTrigger,
    trackVariableSubstitution,
    trackEngagement,
    trackCompletion,
    trackError,
    
    // Utility methods
    getStats,
    exportData,
    importData,
    
    // Configuration
    options,
  };
}
