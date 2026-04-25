/**
 * Idle Village Interaction Mode Analytics
 * 
 * Analytics module for interaction mode diagnostics, KPI tracking,
 * and telemetry events for UX audit capabilities.
 * 
 * @since NP-063 – Idle Village Interaction Mode Diagnostics
 */

import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type {
  InteractionMode,
  InteractionSource,
  InteractionModeKPI,
  InteractionModeEvent,
  InteractionModeConfig,
} from '@/ui/idleVillage/config/interactionModeConfig';
import {
  DEFAULT_INTERACTION_MODE_CONFIG,
  isValidInteractionModeConfig,
  isValidInteractionModeEvent,
  calculateKPIFromEvents,
  filterInteractionEvents,
  exportEventsToJSON,
  exportEventsToCSV,
  exportEventsToMarkdown,
} from '@/ui/idleVillage/config/interactionModeConfig';

/**
 * Interaction mode telemetry event types
 */
export interface InteractionModeTelemetryEvent {
  /** Event type identifier */
  eventType: 'interaction_mode_changed' | 'interaction_mode_exported';
  /** Event timestamp */
  timestamp: number;
  /** Event data payload */
  data: {
    /** Current interaction mode */
    mode: InteractionMode;
    /** Previous mode (for change events) */
    previousMode?: InteractionMode;
    /** Interaction source */
    source: InteractionSource;
    /** Session ID */
    sessionId: string;
    /** Event context */
    context: {
      /** User agent */
      userAgent?: string;
      /** Screen dimensions */
      screenDimensions?: { width: number; height: number };
      /** Target element */
      target?: string;
      /** Error message (if applicable) */
      error?: string;
    };
    /** Export metadata (for export events) */
    exportMetadata?: {
      format: 'json' | 'csv' | 'markdown';
      recordCount: number;
      filename: string;
    };
  };
}

/**
 * Interaction mode analytics data
 */
export interface InteractionModeAnalytics {
  /** Current KPI metrics */
  currentKPI: InteractionModeKPI;
  /** Historical KPI trends */
  kpiTrends: {
    hourly: Record<number, InteractionModeKPI>;
    daily: Record<string, InteractionModeKPI>;
  };
  /** Recent events */
  recentEvents: InteractionModeEvent[];
  /** Session summary */
  sessionSummary: {
    sessionId: string;
    startTime: number;
    endTime?: number;
    totalEvents: number;
    modeSwitches: number;
    errors: number;
    dominantMode: InteractionMode;
  };
  /** Export history */
  exportHistory: Array<{
    timestamp: number;
    format: 'json' | 'csv' | 'markdown';
    recordCount: number;
    filename: string;
  }>;
}

/**
 * Hook for interaction mode analytics
 */
export function useInteractionModeAnalytics(config?: Partial<InteractionModeConfig>) {
  const analyticsConfig = isValidInteractionModeConfig(config) 
    ? config 
    : DEFAULT_INTERACTION_MODE_CONFIG;

  const storageKey = 'idle_village_interaction_mode_analytics';
  const eventsStorageKey = 'idle_village_interaction_mode_events';
  
  /**
   * Load analytics data from storage
   */
  async function loadAnalytics(): Promise<InteractionModeAnalytics> {
    try {
      const stored = await loadData(storageKey);
      if (stored) {
        return stored as InteractionModeAnalytics;
      }
    } catch (error) {
      console.warn('Failed to load interaction mode analytics:', error);
    }
    
    // Return default analytics
    return createDefaultAnalytics();
  }

  /**
   * Save analytics data to storage
   */
  async function saveAnalytics(analytics: InteractionModeAnalytics): Promise<void> {
    try {
      await saveData(storageKey, analytics);
    } catch (error) {
      console.error('Failed to save interaction mode analytics:', error);
    }
  }

  /**
   * Load events from storage
   */
  async function loadEvents(): Promise<InteractionModeEvent[]> {
    try {
      const stored = await loadData(eventsStorageKey);
      if (stored && Array.isArray(stored)) {
        return stored.filter(isValidInteractionModeEvent);
      }
    } catch (error) {
      console.warn('Failed to load interaction mode events:', error);
    }
    
    return [];
  }

  /**
   * Save events to storage
   */
  async function saveEvents(events: InteractionModeEvent[]): Promise<void> {
    try {
      // Apply retention policy
      const cutoffTime = Date.now() - analyticsConfig.telemetry.retentionMs;
      const filteredEvents = events.filter(event => event.timestamp > cutoffTime);
      
      // Apply max events limit
      const limitedEvents = filteredEvents.slice(-analyticsConfig.telemetry.maxEventsPerSession);
      
      await saveData(eventsStorageKey, limitedEvents);
    } catch (error) {
      console.error('Failed to save interaction mode events:', error);
    }
  }

  /**
   * Create default analytics structure
   */
  function createDefaultAnalytics(): InteractionModeAnalytics {
    return {
      currentKPI: {
        switchRate: 0,
        tapCount: { desktop: 0, mobile: 0 },
        errorCount: { desktop: 0, mobile: 0 },
        averageSessionDuration: { desktop: 0, mobile: 0 },
        modePreference: { desktop: 50, mobile: 50 },
        satisfactionScore: 4.0,
        taskCompletionRate: { desktop: 0.85, mobile: 0.78 },
      },
      kpiTrends: {
        hourly: {},
        daily: {},
      },
      recentEvents: [],
      sessionSummary: {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        totalEvents: 0,
        modeSwitches: 0,
        errors: 0,
        dominantMode: 'desktop',
      },
      exportHistory: [],
    };
  }

  /**
   * Generate session ID
   */
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record interaction mode event
   */
  async function recordEvent(event: Omit<InteractionModeEvent, 'timestamp'>): Promise<void> {
    const fullEvent: InteractionModeEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Validate event
    if (!isValidInteractionModeEvent(fullEvent)) {
      console.warn('Invalid interaction mode event:', event);
      return;
    }

    // Load existing events
    const events = await loadEvents();
    
    // Add new event
    events.push(fullEvent);
    
    // Save events
    await saveEvents(events);

    // Update analytics
    await updateAnalytics();

    // Emit telemetry event
    if (analyticsConfig.telemetry.enabled) {
      emitTelemetryEvent(fullEvent);
    }
  }

  /**
   * Record mode switch
   */
  async function recordModeSwitch(
    fromMode: InteractionMode,
    toMode: InteractionMode,
    source: InteractionSource
  ): Promise<void> {
    await recordEvent({
      type: 'mode_switch',
      mode: toMode,
      source,
      data: {
        previousMode: fromMode,
        target: 'mode_switch',
      },
    });
  }

  /**
   * Record interaction
   */
  async function recordInteraction(
    mode: InteractionMode,
    source: InteractionSource,
    target?: string,
    coordinates?: { x: number; y: number }
  ): Promise<void> {
    await recordEvent({
      type: 'interaction',
      mode,
      source,
      data: {
        target,
        coordinates,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        screenDimensions: typeof window !== 'undefined' 
          ? { width: window.innerWidth, height: window.innerHeight }
          : undefined,
      },
    });
  }

  /**
   * Record error
   */
  async function recordError(
    mode: InteractionMode,
    source: InteractionSource,
    error: string,
    target?: string
  ): Promise<void> {
    await recordEvent({
      type: 'error',
      mode,
      source,
      data: {
        error,
        target,
      },
    });
  }

  /**
   * Start session
   */
  async function startSession(mode: InteractionMode): Promise<void> {
    await recordEvent({
      type: 'session_start',
      mode,
      source: null,
      data: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        screenDimensions: typeof window !== 'undefined' 
          ? { width: window.innerWidth, height: window.innerHeight }
          : undefined,
      },
    });
  }

  /**
   * End session
   */
  async function endSession(mode: InteractionMode): Promise<void> {
    const analytics = await loadAnalytics();
    const sessionDuration = Date.now() - analytics.sessionSummary.startTime;

    await recordEvent({
      type: 'session_end',
      mode,
      source: null,
      data: {
        duration: sessionDuration,
      },
    });
  }

  /**
   * Update analytics calculations
   */
  async function updateAnalytics(): Promise<void> {
    const events = await loadEvents();
    const analytics = await loadAnalytics();

    // Calculate current KPI
    analytics.currentKPI = calculateKPIFromEvents(events);

    // Update recent events (keep last 100)
    analytics.recentEvents = events.slice(-100);

    // Update session summary
    analytics.sessionSummary.totalEvents = events.length;
    analytics.sessionSummary.modeSwitches = events.filter(e => e.type === 'mode_switch').length;
    analytics.sessionSummary.errors = events.filter(e => e.type === 'error').length;

    // Determine dominant mode
    const modeCounts = events.reduce((acc, event) => {
      acc[event.mode] = (acc[event.mode] || 0) + 1;
      return acc;
    }, {} as Record<InteractionMode, number>);

    analytics.sessionSummary.dominantMode = 
      modeCounts.desktop > modeCounts.mobile ? 'desktop' : 'mobile';

    // Save updated analytics
    await saveAnalytics(analytics);
  }

  /**
   * Get filtered events
   */
  async function getFilteredEvents(filters: {
    dateRange?: number;
    modes?: InteractionMode[];
    sources?: InteractionSource[];
    eventTypes?: InteractionModeEvent['type'][];
  }): Promise<InteractionModeEvent[]> {
    const events = await loadEvents();
    return filterInteractionEvents(events, filters);
  }

  /**
   * Export events
   */
  async function exportEvents(
    format: 'json' | 'csv' | 'markdown',
    filters?: {
      dateRange?: number;
      modes?: InteractionMode[];
      sources?: InteractionSource[];
      eventTypes?: InteractionModeEvent['type'][];
    }
  ): Promise<string> {
    const events = await getFilteredEvents(filters || {});
    
    let exportData: string;
    let filename: string;

    switch (format) {
      case 'json':
        exportData = exportEventsToJSON(events);
        filename = `interaction-mode-events-${Date.now()}.json`;
        break;
      case 'csv':
        exportData = exportEventsToCSV(events);
        filename = `interaction-mode-events-${Date.now()}.csv`;
        break;
      case 'markdown':
        exportData = exportEventsToMarkdown(events);
        filename = `interaction-mode-events-${Date.now()}.md`;
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Record export event
    await recordEvent({
      type: 'interaction',
      mode: 'desktop', // Default mode for export events
      source: null,
      data: {
        target: 'export',
      },
    });

    // Update export history
    const analytics = await loadAnalytics();
    analytics.exportHistory.push({
      timestamp: Date.now(),
      format,
      recordCount: events.length,
      filename,
    });
    
    // Keep only last 50 exports
    analytics.exportHistory = analytics.exportHistory.slice(-50);
    await saveAnalytics(analytics);

    return exportData;
  }

  /**
   * Emit telemetry event
   */
  function emitTelemetryEvent(event: InteractionModeEvent): void {
    if (!analyticsConfig.telemetry.enabled) return;

    const telemetryEvent: InteractionModeTelemetryEvent = {
      eventType: event.type === 'mode_switch' ? 'interaction_mode_changed' : 'interaction_mode_exported',
      timestamp: event.timestamp,
      data: {
        mode: event.mode,
        previousMode: event.data.previousMode,
        source: event.source,
        sessionId: generateSessionId(),
        context: {
          userAgent: event.data.userAgent,
          screenDimensions: event.data.screenDimensions,
          target: event.data.target,
          error: event.data.error,
        },
      },
    };

    // Emit to global analytics system
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', telemetryEvent.eventType, {
        event_category: 'idle_village',
        event_label: telemetryEvent.data.mode,
        value: 1,
        custom_parameters: telemetryEvent.data,
      });
    }

    // Emit to local analytics system
    console.debug('Interaction Mode Telemetry:', telemetryEvent);
  }

  /**
   * Get current analytics
   */
  async function getCurrentAnalytics(): Promise<InteractionModeAnalytics> {
    return await loadAnalytics();
  }

  /**
   * Reset analytics
   */
  async function resetAnalytics(): Promise<void> {
    const defaultAnalytics = createDefaultAnalytics();
    await saveAnalytics(defaultAnalytics);
    
    // Clear events
    await saveEvents([]);
  }

  return {
    recordEvent,
    recordModeSwitch,
    recordInteraction,
    recordError,
    startSession,
    endSession,
    updateAnalytics,
    getFilteredEvents,
    exportEvents,
    getCurrentAnalytics,
    resetAnalytics,
    loadAnalytics,
    saveAnalytics,
  };
}

/**
 * Create interaction mode analytics instance
 */
export function getInteractionModeAnalytics(config?: Partial<InteractionModeConfig>) {
  return useInteractionModeAnalytics(config);
}

/**
 * Export analytics data for external consumption
 */
export async function exportInteractionModeAnalytics(
  format: 'json' | 'csv' | 'markdown' = 'json',
  filters?: {
    dateRange?: number;
    modes?: InteractionMode[];
    sources?: InteractionSource[];
    eventTypes?: InteractionModeEvent['type'][];
  }
): Promise<string> {
  const analytics = getInteractionModeAnalytics();
  return await analytics.exportEvents(format, filters);
}

/**
 * Get current KPI metrics
 */
export async function getCurrentKPI(): Promise<InteractionModeKPI> {
  const analytics = getInteractionModeAnalytics();
  const analyticsData = await analytics.getCurrentAnalytics();
  return analyticsData.currentKPI;
}

/**
 * Get session summary
 */
export async function getSessionSummary() {
  const analytics = getInteractionModeAnalytics();
  const analyticsData = await analytics.getCurrentAnalytics();
  return analyticsData.sessionSummary;
}

/**
 * Get export history
 */
export async function getExportHistory() {
  const analytics = getInteractionModeAnalytics();
  const analyticsData = await analytics.getCurrentAnalytics();
  return analyticsData.exportHistory;
}
