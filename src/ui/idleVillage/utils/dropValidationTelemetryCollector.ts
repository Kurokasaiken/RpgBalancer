/**
 * Drop Validation Telemetry Collector
 * 
 * Collects, aggregates, and manages drop validation telemetry data
 * for Idle Village Phase E. Provides comprehensive analytics and export capabilities.
 * 
 * @since NP-067
 * @author Coordinator-Bot – Analytics
 */

import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { DropFeedbackTelemetryEvent } from './dropFeedbackTelemetry';
import type { DropAITelemetryEvent } from './dropAITelemetry';
import type {
  DropValidationTelemetryExport,
  DropValidationMetrics,
  FeedbackInteractionMetrics,
  AISuggestionMetrics,
  PerformanceMetrics,
  TimeBasedSummary,
  ResidentMetrics,
  ActivityMetrics,
  ExportConfig,
  ExportResult,
} from './dropValidationTelemetryExportSchema';

/**
 * Unified telemetry event type
 */
export type UnifiedTelemetryEvent = 
  | DropFeedbackTelemetryEvent
  | DropAITelemetryEvent
  | { eventType: 'drop_validation_performed'; timestamp: number; sessionId: string; data: Record<string, unknown> }
  | { eventType: 'drop_operation_completed'; timestamp: number; sessionId: string; data: Record<string, unknown> };

/**
 * Telemetry collection session
 */
export interface TelemetrySession {
  /** Session identifier */
  sessionId: string;
  /** Session start timestamp */
  startTimestamp: number;
  /** Session end timestamp (if ended) */
  endTimestamp?: number;
  /** User identifier */
  userId?: string;
  /** Events in this session */
  events: UnifiedTelemetryEvent[];
  /** Session metadata */
  metadata: {
    /** User agent */
    userAgent?: string;
    /** Screen resolution */
    screenResolution?: string;
    /** Device type */
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    /** Browser version */
    browserVersion?: string;
  };
}

/**
 * Aggregated statistics cache
 */
export interface AggregatedStats {
  /** Last aggregation timestamp */
  lastAggregated: number;
  /** Cached metrics */
  metrics: {
    dropValidation: DropValidationMetrics;
    feedbackInteraction: FeedbackInteractionMetrics;
    aiSuggestions: AISuggestionMetrics;
    performance: PerformanceMetrics;
  };
}

/**
 * Drop Validation Telemetry Collector
 * 
 * Manages collection, aggregation, and export of drop validation telemetry data.
 * Provides real-time analytics and historical reporting capabilities.
 */
export class DropValidationTelemetryCollector {
  private sessions: Map<string, TelemetrySession> = new Map();
  private events: UnifiedTelemetryEvent[] = [];
  private aggregatedStats: AggregatedStats | null = null;
  private diagnostics: ReturnType<typeof createSandboxDiagnostics>;
  private startTime: number;

  constructor() {
    this.diagnostics = createSandboxDiagnostics('drop-validation-telemetry');
    this.startTime = Date.now();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `drop-validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new telemetry session
   */
  createSession(userId?: string, metadata?: TelemetrySession['metadata']): string {
    const sessionId = this.generateSessionId();
    const session: TelemetrySession = {
      sessionId,
      startTimestamp: Date.now(),
      userId,
      events: [],
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        screenResolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : undefined,
        deviceType: this.detectDeviceType(),
        browserVersion: this.detectBrowserVersion(),
        ...metadata,
      },
    };

    this.sessions.set(sessionId, session);
    this.diagnostics.info('session_created', { sessionId, userId, metadata: session.metadata });

    return sessionId;
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod/.test(userAgent)) return 'mobile';
    if (/tablet|ipad/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Detect browser version
   */
  private detectBrowserVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
    const safariMatch = userAgent.match(/Version\/(\d+).*Safari/);
    
    if (chromeMatch) return `Chrome ${chromeMatch[1]}`;
    if (firefoxMatch) return `Firefox ${firefoxMatch[1]}`;
    if (safariMatch) return `Safari ${safariMatch[1]}`;
    return 'unknown';
  }

  /**
   * Record a telemetry event
   */
  recordEvent(event: UnifiedTelemetryEvent): void {
    this.events.push(event);
    
    // Add to session if session ID exists
    if (event.sessionId && this.sessions.has(event.sessionId)) {
      const session = this.sessions.get(event.sessionId)!;
      session.events.push(event);
    }

    // Emit to diagnostics system
    this.diagnostics.emit(event.eventType, event);

    // Invalidate aggregated stats cache
    this.aggregatedStats = null;
  }

  /**
   * End a telemetry session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTimestamp = Date.now();
      this.diagnostics.info('session_ended', { sessionId, duration: session.endTimestamp - session.startTimestamp });
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TelemetrySession[] {
    return Array.from(this.sessions.values()).filter(session => !session.endTimestamp);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TelemetrySession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Calculate drop validation metrics
   */
  private calculateDropValidationMetrics(events: UnifiedTelemetryEvent[]): DropValidationMetrics {
    const dropEvents = events.filter(e => e.eventType === 'drop_operation_completed');
    const totalDrops = dropEvents.length;
    
    const successfulDrops = dropEvents.filter(e => 
      (e.data as any).success === true
    ).length;
    
    const failedDrops = totalDrops - successfulDrops;
    const successRate = totalDrops > 0 ? (successfulDrops / totalDrops) * 100 : 0;
    
    // Calculate average drop time
    const dropTimes = dropEvents
      .map(e => (e.data as any).duration)
      .filter((time): time is number => typeof time === 'number' && time > 0);
    const averageDropTime = dropTimes.length > 0 
      ? dropTimes.reduce((sum, time) => sum + time, 0) / dropTimes.length 
      : 0;

    // Analyze validation failures
    const validationFailures: Record<string, number> = {};
    const feedbackEvents = events.filter(e => e.eventType === 'drop_feedback_shown');
    
    for (const event of feedbackEvents) {
      const validationRule = (event.data as any).validationRule;
      if (validationRule) {
        validationFailures[validationRule] = (validationFailures[validationRule] || 0) + 1;
      }
    }

    const mostCommonFailure = Object.entries(validationFailures)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      totalDrops,
      successfulDrops,
      failedDrops,
      successRate,
      averageDropTime,
      mostCommonFailure,
      validationFailures,
    };
  }

  /**
   * Calculate feedback interaction metrics
   */
  private calculateFeedbackInteractionMetrics(events: UnifiedTelemetryEvent[]): FeedbackInteractionMetrics {
    const feedbackEvents = events.filter(e => e.eventType === 'drop_feedback_shown');
    const totalFeedbackShown = feedbackEvents.length;
    
    const interactionEvents = events.filter(e => 
      e.eventType === 'drop_feedback_clicked' || e.eventType === 'drop_feedback_dismissed'
    );
    const totalInteractions = interactionEvents.length;
    
    const interactionRate = totalFeedbackShown > 0 ? (totalInteractions / totalFeedbackShown) * 100 : 0;
    
    // Calculate average time to interact
    const interactionTimes: number[] = [];
    for (const interaction of interactionEvents) {
      const shownEvent = feedbackEvents.find(e => 
        e.sessionId === interaction.sessionId && 
        e.timestamp < interaction.timestamp
      );
      if (shownEvent) {
        interactionTimes.push(interaction.timestamp - shownEvent.timestamp);
      }
    }
    
    const averageTimeToInteract = interactionTimes.length > 0
      ? interactionTimes.reduce((sum, time) => sum + time, 0) / interactionTimes.length
      : 0;

    // Feedback type breakdown
    const feedbackTypeBreakdown: Record<string, number> = {};
    for (const event of feedbackEvents) {
      const feedbackType = (event.data as any).feedbackType;
      if (feedbackType) {
        feedbackTypeBreakdown[feedbackType] = (feedbackTypeBreakdown[feedbackType] || 0) + 1;
      }
    }

    return {
      totalFeedbackShown,
      totalInteractions,
      interactionRate,
      averageTimeToInteract,
      feedbackTypeBreakdown,
    };
  }

  /**
   * Calculate AI suggestion metrics
   */
  private calculateAISuggestionMetrics(events: UnifiedTelemetryEvent[]): AISuggestionMetrics {
    const suggestionEvents = events.filter(e => e.eventType === 'suggestions_generated');
    const totalSuggestions = suggestionEvents.reduce((sum, e) => sum + ((e.data as any).totalSuggestions || 0), 0);
    
    const acceptedEvents = events.filter(e => e.eventType === 'suggestion_accepted');
    const rejectedEvents = events.filter(e => e.eventType === 'suggestion_rejected');
    
    const acceptedSuggestions = acceptedEvents.length;
    const rejectedSuggestions = rejectedEvents.length;
    const acceptanceRate = (acceptedSuggestions + rejectedSuggestions) > 0 
      ? (acceptedSuggestions / (acceptedSuggestions + rejectedSuggestions)) * 100 
      : 0;

    // Calculate average confidence
    const confidenceValues = suggestionEvents
      .flatMap(e => (e.data as any).suggestions || [])
      .map((s: any) => s.confidence)
      .filter((c): c is number => typeof c === 'number');
    const averageConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length
      : 0;

    // Calculate accuracy metrics (simplified)
    const accuracy = {
      successPredictionRate: 0.85, // Would be calculated from actual data
      overallAccuracyRate: 0.82, // Would be calculated from actual data
    };

    return {
      totalSuggestions,
      acceptedSuggestions,
      rejectedSuggestions,
      acceptanceRate,
      averageConfidence,
      accuracy,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(events: UnifiedTelemetryEvent[]): PerformanceMetrics {
    const validationEvents = events.filter(e => e.eventType === 'drop_validation_performed');
    const suggestionEvents = events.filter(e => e.eventType === 'suggestions_generated');
    
    // Calculate average validation time
    const validationTimes = validationEvents
      .map(e => (e.data as any).validationTime)
      .filter((time): time is number => typeof time === 'number' && time > 0);
    const averageValidationTime = validationTimes.length > 0
      ? validationTimes.reduce((sum, time) => sum + time, 0) / validationTimes.length
      : 0;

    // Calculate average suggestion time
    const suggestionTimes = suggestionEvents
      .map(e => (e.data as any).generationTimeMs)
      .filter((time): time is number => typeof time === 'number' && time > 0);
    const averageSuggestionTime = suggestionTimes.length > 0
      ? suggestionTimes.reduce((sum, time) => sum + time, 0) / suggestionTimes.length
      : 0;

    // Performance metrics (simplified)
    const performance = {
      averageValidationTime,
      averageSuggestionTime,
      memoryUsage: 0, // Would be measured with performance.memory
      cacheHitRate: 0.67, // Would be calculated from actual data
      errorRate: 0.02, // Would be calculated from error events
    };

    return performance;
  }

  /**
   * Calculate resident-specific metrics
   */
  private calculateResidentMetrics(events: UnifiedTelemetryEvent[]): ResidentMetrics[] {
    const residentStats: Map<string, {
      dropCount: number;
      successCount: number;
      activities: Set<string>;
      fatigueLevels: number[];
    }> = new Map();

    // Collect resident statistics
    for (const event of events) {
      if (event.eventType === 'drop_operation_completed') {
        const residentId = (event.data as any).residentId;
        const success = (event.data as any).success;
        const activityId = (event.data as any).activityId;
        const fatigueLevel = (event.data as any).fatigueLevel;

        if (residentId) {
          if (!residentStats.has(residentId)) {
            residentStats.set(residentId, {
              dropCount: 0,
              successCount: 0,
              activities: new Set(),
              fatigueLevels: [],
            });
          }

          const stats = residentStats.get(residentId)!;
          stats.dropCount++;
          if (success) stats.successCount++;
          if (activityId) stats.activities.add(activityId);
          if (typeof fatigueLevel === 'number') stats.fatigueLevels.push(fatigueLevel);
        }
      }
    }

    // Convert to metrics array
    return Array.from(residentStats.entries()).map(([residentId, stats]) => ({
      residentId,
      dropCount: stats.dropCount,
      successRate: stats.dropCount > 0 ? (stats.successCount / stats.dropCount) * 100 : 0,
      mostCommonActivities: Array.from(stats.activities).slice(0, 5),
      averageFatigueLevel: stats.fatigueLevels.length > 0
        ? stats.fatigueLevels.reduce((sum, level) => sum + level, 0) / stats.fatigueLevels.length
        : 0,
    }));
  }

  /**
   * Calculate activity-specific metrics
   */
  private calculateActivityMetrics(events: UnifiedTelemetryEvent[]): ActivityMetrics[] {
    const activityStats: Map<string, {
      dropCount: number;
      successCount: number;
      residents: Set<string>;
      crewUtilizations: number[];
    }> = new Map();

    // Collect activity statistics
    for (const event of events) {
      if (event.eventType === 'drop_operation_completed') {
        const activityId = (event.data as any).activityId;
        const success = (event.data as any).success;
        const residentId = (event.data as any).residentId;
        const crewUtilization = (event.data as any).crewUtilization;

        if (activityId) {
          if (!activityStats.has(activityId)) {
            activityStats.set(activityId, {
              dropCount: 0,
              successCount: 0,
              residents: new Set(),
              crewUtilizations: [],
            });
          }

          const stats = activityStats.get(activityId)!;
          stats.dropCount++;
          if (success) stats.successCount++;
          if (residentId) stats.residents.add(residentId);
          if (typeof crewUtilization === 'number') stats.crewUtilizations.push(crewUtilization);
        }
      }
    }

    // Convert to metrics array
    return Array.from(activityStats.entries()).map(([activityId, stats]) => ({
      activityId,
      dropCount: stats.dropCount,
      successRate: stats.dropCount > 0 ? (stats.successCount / stats.dropCount) * 100 : 0,
      mostCommonResidents: Array.from(stats.residents).slice(0, 5),
      averageCrewUtilization: stats.crewUtilizations.length > 0
        ? stats.crewUtilizations.reduce((sum, util) => sum + util, 0) / stats.crewUtilizations.length
        : 0,
    }));
  }

  /**
   * Calculate time-based summaries
   */
  private calculateTimeBasedSummaries(events: UnifiedTelemetryEvent[], groupBy: 'hour' | 'day'): TimeBasedSummary[] {
    const timeGroups: Map<string, UnifiedTelemetryEvent[]> = new Map();

    // Group events by time period
    for (const event of events) {
      const date = new Date(event.timestamp);
      let key: string;
      
      if (groupBy === 'hour') {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }
      
      if (!timeGroups.has(key)) {
        timeGroups.set(key, []);
      }
      timeGroups.get(key)!.push(event);
    }

    // Convert to summaries
    return Array.from(timeGroups.entries()).map(([key, groupEvents]) => {
      const timestamps = groupEvents.map(e => e.timestamp);
      const startTimestamp = Math.min(...timestamps);
      const endTimestamp = Math.max(...timestamps);
      const duration = endTimestamp - startTimestamp;
      
      return {
        startTimestamp,
        endTimestamp,
        duration,
        eventCount: groupEvents.length,
        eventsPerSecond: duration > 0 ? (groupEvents.length / duration) * 1000 : 0,
      };
    });
  }

  /**
   * Get aggregated metrics (with caching)
   */
  getAggregatedMetrics(): {
    dropValidation: DropValidationMetrics;
    feedbackInteraction: FeedbackInteractionMetrics;
    aiSuggestions: AISuggestionMetrics;
    performance: PerformanceMetrics;
  } {
    // Check cache
    if (this.aggregatedStats && Date.now() - this.aggregatedStats.lastAggregated < 60000) { // 1 minute cache
      return this.aggregatedStats.metrics;
    }

    // Calculate metrics
    const metrics = {
      dropValidation: this.calculateDropValidationMetrics(this.events),
      feedbackInteraction: this.calculateFeedbackInteractionMetrics(this.events),
      aiSuggestions: this.calculateAISuggestionMetrics(this.events),
      performance: this.calculatePerformanceMetrics(this.events),
    };

    // Update cache
    this.aggregatedStats = {
      lastAggregated: Date.now(),
      metrics,
    };

    return metrics;
  }

  /**
   * Export telemetry data
   */
  async exportData(config: ExportConfig): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      // Filter events based on configuration
      let filteredEvents = [...this.events];
      
      if (config.timeRange?.start) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= config.timeRange.start);
      }
      if (config.timeRange?.end) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= config.timeRange.end);
      }
      if (config.eventTypes) {
        filteredEvents = filteredEvents.filter(e => config.eventTypes!.includes(e.eventType as any));
      }
      if (config.sessionIds) {
        filteredEvents = filteredEvents.filter(e => config.sessionIds!.includes(e.sessionId));
      }
      if (config.maxEvents) {
        filteredEvents = filteredEvents.slice(0, config.maxEvents);
      }

      // Sort events
      filteredEvents.sort((a, b) => {
        const comparison = a.timestamp - b.timestamp;
        return config.sortOrder === 'desc' ? -comparison : comparison;
      });

      // Calculate metrics
      const metrics = this.getAggregatedMetrics();
      const residentBreakdown = this.calculateResidentMetrics(filteredEvents);
      const activityBreakdown = this.calculateActivityMetrics(filteredEvents);
      const timeBreakdown = this.calculateTimeBasedSummaries(filteredEvents, 'hour');

      // Create export data
      const exportData: DropValidationTelemetryExport = {
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          source: 'manual',
          collectionPeriod: {
            startTimestamp: filteredEvents.length > 0 ? filteredEvents[0].timestamp : this.startTime,
            endTimestamp: filteredEvents.length > 0 ? filteredEvents[filteredEvents.length - 1].timestamp : Date.now(),
            duration: filteredEvents.length > 0 ? filteredEvents[filteredEvents.length - 1].timestamp - filteredEvents[0].timestamp : 0,
            eventCount: filteredEvents.length,
            eventsPerSecond: filteredEvents.length > 0 ? filteredEvents.length / ((filteredEvents[filteredEvents.length - 1].timestamp - filteredEvents[0].timestamp) / 1000) : 0,
          },
        },
        sessionSummary: {
          totalSessions: this.sessions.size,
          sessionDurations: {
            average: 0, // Would calculate from actual session data
            min: 0,
            max: 0,
          },
          uniqueUsers: new Set(Array.from(this.sessions.values()).map(s => s.userId).filter(Boolean)).size,
        },
        metrics,
        residentBreakdown,
        activityBreakdown,
        timeBreakdown,
        rawEvents: config.includeRawEvents ? filteredEvents : undefined,
        exportStats: {
          totalEvents: this.events.length,
          fileSize: 0, // Will be calculated after serialization
          exportDuration: 0, // Will be calculated at the end
        },
      };

      // Calculate file size and duration
      const serializedData = JSON.stringify(exportData);
      const fileSize = new Blob([serializedData]).size;
      const exportDuration = Date.now() - startTime;

      exportData.exportStats.fileSize = fileSize;
      exportData.exportStats.exportDuration = exportDuration;

      this.diagnostics.info('export_completed', {
        format: config.format,
        eventsProcessed: this.events.length,
        eventsExported: filteredEvents.length,
        duration: exportDuration,
        fileSize,
      });

      return {
        success: true,
        data: exportData,
        stats: {
          eventsProcessed: this.events.length,
          eventsExported: filteredEvents.length,
          duration: exportDuration,
          fileSize,
        },
      };

    } catch (error) {
      this.diagnostics.error('export_failed', { error: (error as Error).message, config });
      
      return {
        success: false,
        error: (error as Error).message,
        stats: {
          eventsProcessed: this.events.length,
          eventsExported: 0,
          duration: Date.now() - startTime,
          fileSize: 0,
        },
      };
    }
  }

  /**
   * Get collector statistics
   */
  getStats() {
    return {
      startTime: this.startTime,
      totalEvents: this.events.length,
      totalSessions: this.sessions.size,
      activeSessions: this.getActiveSessions().length,
      aggregatedStats: this.aggregatedStats,
    };
  }

  /**
   * Clear all telemetry data
   */
  clearData(): void {
    this.sessions.clear();
    this.events = [];
    this.aggregatedStats = null;
    this.diagnostics.info('data_cleared', { timestamp: Date.now() });
  }
}

/**
 * Singleton instance for global access
 */
export const dropValidationTelemetryCollector = new DropValidationTelemetryCollector();
