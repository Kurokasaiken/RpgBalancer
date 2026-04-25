/**
 * Crew Scheduler Telemetry Integration - NP-017
 * 
 * Telemetry system for crew scheduler HUD interactions and events.
 * Provides event tracking, performance monitoring, and analytics
 * for crew management operations.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type CrewSchedulerHUDConfig,
  type CrewCardConfig,
  CrewTelemetryEventType,
  CrewStatusLevel,
  CrewQuickControlType,
} from '../config/crewSchedulerHUDConfig';

const diagnostics = createSandboxDiagnostics('CrewSchedulerTelemetry', 'telemetry');

/**
 * Crew telemetry event payload
 */
export interface CrewTelemetryEvent {
  /** Event type identifier */
  type: CrewTelemetryEventType;
  /** Timestamp when event occurred */
  timestamp: number;
  /** Crew member ID (if applicable) */
  crewId?: string;
  /** Event-specific data */
  data: Record<string, unknown>;
  /** Session identifier */
  sessionId: string;
  /** User identifier (if available) */
  userId?: string;
  /** Performance metrics */
  performance?: {
    duration?: number; // Event duration in milliseconds
    memoryUsage?: number; // Memory usage in MB
    cpuUsage?: number; // CPU usage percentage
  };
  /** Context information */
  context: {
    hudVisible: boolean;
    displayMode: string;
    totalCrewCount: number;
    activeCrewCount: number;
  };
}

/**
 * Telemetry aggregation metrics
 */
export interface CrewTelemetryMetrics {
  /** Total events tracked */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<CrewTelemetryEventType, number>;
  /** Average response time for quick controls */
  averageControlResponseTime: number;
  /** Most used quick controls */
  mostUsedControls: Array<{
    type: CrewQuickControlType;
    count: number;
  }>;
  /** Crew status distribution */
  crewStatusDistribution: Record<CrewStatusLevel, number>;
  /** Peak usage times */
  peakUsageTimes: Array<{
    hour: number;
    eventCount: number;
  }>;
  /** Error rate */
  errorRate: number;
  /** Session duration */
  sessionDuration: number;
}

/**
 * Telemetry storage interface
 */
export interface CrewTelemetryStorage {
  /** Store event */
  store(event: CrewTelemetryEvent): Promise<void>;
  /** Retrieve events by time range */
  retrieve(startTime: number, endTime: number): Promise<CrewTelemetryEvent[]>;
  /** Clear old events */
  clear(olderThan: number): Promise<void>;
  /** Get metrics */
  getMetrics(timeRange?: { start: number; end: number }): Promise<CrewTelemetryMetrics>;
}

/**
 * In-memory telemetry storage implementation
 */
export class InMemoryCrewTelemetryStorage implements CrewTelemetryStorage {
  private events: CrewTelemetryEvent[] = [];
  private maxEvents: number = 10000;

  constructor(maxEvents: number = 10000) {
    this.maxEvents = maxEvents;
  }

  async store(event: CrewTelemetryEvent): Promise<void> {
    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    diagnostics.log('Telemetry event stored', { type: event.type, crewId: event.crewId });
  }

  async retrieve(startTime: number, endTime: number): Promise<CrewTelemetryEvent[]> {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  async clear(olderThan: number): Promise<void> {
    const originalLength = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= olderThan);
    diagnostics.log('Old telemetry events cleared', { 
      cleared: originalLength - this.events.length,
      remaining: this.events.length
    });
  }

  async getMetrics(timeRange?: { start: number; end: number }): Promise<CrewTelemetryMetrics> {
    const events = timeRange ? 
      await this.retrieve(timeRange.start, timeRange.end) : 
      this.events;

    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<CrewTelemetryEventType, number>);

    const controlEvents = events.filter(event => 
      event.type === CrewTelemetryEventType.HUD_INTERACTION &&
      event.data.controlType
    );

    const controlUsage = controlEvents.reduce((acc, event) => {
      const controlType = event.data.controlType as CrewQuickControlType;
      acc[controlType] = (acc[controlType] || 0) + 1;
      return acc;
    }, {} as Record<CrewQuickControlType, number>);

    const mostUsedControls = Object.entries(controlUsage)
      .map(([type, count]) => ({ type: type as CrewQuickControlType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const crewStatusDistribution = events
      .filter(event => event.type === CrewTelemetryEventType.CREW_STATUS_CHANGE && event.data.newStatus)
      .reduce((acc, event) => {
        const status = event.data.newStatus as CrewStatusLevel;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<CrewStatusLevel, number>);

    const hourlyUsage = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakUsageTimes = Object.entries(hourlyUsage)
      .map(([hour, count]) => ({ hour: Number(hour), eventCount: count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 3);

    const responseTimes = events
      .filter(event => event.performance?.duration)
      .map(event => event.performance!.duration!);

    const averageControlResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    const errorEvents = events.filter(event => event.data.error);
    const errorRate = events.length > 0 ? errorEvents.length / events.length : 0;

    const sessionDuration = events.length > 0 ?
      Math.max(...events.map(e => e.timestamp)) - Math.min(...events.map(e => e.timestamp)) : 0;

    return {
      totalEvents: events.length,
      eventsByType,
      averageControlResponseTime,
      mostUsedControls,
      crewStatusDistribution,
      peakUsageTimes,
      errorRate,
      sessionDuration,
    };
  }
}

/**
 * Crew telemetry manager
 */
export class CrewTelemetryManager {
  private storage: CrewTelemetryStorage;
  private config: CrewSchedulerHUDConfig['telemetry'];
  private sessionId: string;
  private startTime: number;
  private eventBuffer: CrewTelemetryEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(
    config: CrewSchedulerHUDConfig['telemetry'],
    storage?: CrewTelemetryStorage
  ) {
    this.config = config;
    this.storage = storage || new InMemoryCrewTelemetryStorage();
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();

    if (config.enabled) {
      this.startBatchTimer();
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `crew-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start batch transmission timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      this.flushBatch();
    }, this.config.transmissionInterval);
  }

  /**
   * Flush event batch to storage
   */
  private async flushBatch(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const batch = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      for (const event of batch) {
        await this.storage.store(event);
      }
      diagnostics.log('Telemetry batch flushed', { batchSize: batch.length });
    } catch (error) {
      diagnostics.error('Failed to flush telemetry batch', { error, batchSize: batch.length });
    }
  }

  /**
   * Track a crew telemetry event
   */
  async trackEvent(
    type: CrewTelemetryEventType,
    crewId?: string,
    data: Record<string, unknown> = {},
    performance?: CrewTelemetryEvent['performance']
  ): Promise<void> {
    if (!this.config.enabled) return;

    // Apply sampling
    if (Math.random() > this.config.samplingRate) return;

    const event: CrewTelemetryEvent = {
      type,
      timestamp: Date.now(),
      crewId,
      data: this.config.privacy.anonymizeNames ? 
        { ...data, crewName: undefined } : 
        data,
      sessionId: this.sessionId,
      performance,
      context: {
        hudVisible: true, // This would be determined from actual HUD state
        displayMode: 'detailed', // This would be determined from actual HUD state
        totalCrewCount: 0, // This would be determined from actual crew state
        activeCrewCount: 0, // This would be determined from actual crew state
      },
    };

    this.eventBuffer.push(event);

    // Flush immediately if batch size reached
    if (this.eventBuffer.length >= this.config.batchSize) {
      await this.flushBatch();
    }
  }

  /**
   * Track crew status change
   */
  async trackCrewStatusChange(
    crewId: string,
    oldStatus: CrewStatusLevel,
    newStatus: CrewStatusLevel,
    reason?: string
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.CREW_STATUS_CHANGE,
      crewId,
      {
        oldStatus,
        newStatus,
        reason,
      }
    );
  }

  /**
   * Track assignment request
   */
  async trackAssignmentRequest(
    crewId: string,
    activityId: string,
    priority: number
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.ASSIGNMENT_REQUEST,
      crewId,
      {
        activityId,
        priority,
      }
    );
  }

  /**
   * Track assignment completion
   */
  async trackAssignmentCompletion(
    crewId: string,
    activityId: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.ASSIGNMENT_COMPLETE,
      crewId,
      {
        activityId,
        duration,
        success,
      }
    );
  }

  /**
   * Track priority adjustment
   */
  async trackPriorityAdjustment(
    crewId: string,
    oldPriority: number,
    newPriority: number,
    reason: string
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.PRIORITY_ADJUSTMENT,
      crewId,
      {
        oldPriority,
        newPriority,
        reason,
      }
    );
  }

  /**
   * Track fatigue warning
   */
  async trackFatigueWarning(
    crewId: string,
    fatigueLevel: number,
    threshold: number
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.FATIGUE_WARNING,
      crewId,
      {
        fatigueLevel,
        threshold,
      }
    );
  }

  /**
   * Track specialization change
   */
  async trackSpecializationChange(
    crewId: string,
    oldSpecializations: string[],
    newSpecializations: string[]
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.SPECIALIZATION_CHANGE,
      crewId,
      {
        oldSpecializations,
        newSpecializations,
      }
    );
  }

  /**
   * Track emergency recall
   */
  async trackEmergencyRecall(
    crewId: string,
    reason: string,
    affectedActivities: string[]
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.EMERGENCY_RECALL,
      crewId,
      {
        reason,
        affectedActivities,
      }
    );
  }

  /**
   * Track HUD interaction
   */
  async trackHUDInteraction(
    interactionType: string,
    crewId?: string,
    controlType?: CrewQuickControlType,
    duration?: number
  ): Promise<void> {
    await this.trackEvent(
      CrewTelemetryEventType.HUD_INTERACTION,
      crewId,
      {
        interactionType,
        controlType,
      },
      duration ? { duration } : undefined
    );
  }

  /**
   * Get telemetry metrics
   */
  async getMetrics(timeRange?: { start: number; end: number }): Promise<CrewTelemetryMetrics> {
    return await this.storage.getMetrics(timeRange);
  }

  /**
   * Export telemetry data
   */
  async exportData(
    format: 'json' | 'csv',
    timeRange?: { start: number; end: number }
  ): Promise<string> {
    const events = timeRange ? 
      await this.storage.retrieve(timeRange.start, timeRange.end) : 
      await this.storage.retrieve(0, Date.now());

    if (format === 'json') {
      return JSON.stringify({
        sessionId: this.sessionId,
        startTime: this.startTime,
        endTime: Date.now(),
        events,
        metrics: await this.getMetrics(timeRange),
      }, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'type', 'crewId', 'data', 'performance'];
      const rows = events.map(event => [
        event.timestamp,
        event.type,
        event.crewId || '',
        JSON.stringify(event.data),
        JSON.stringify(event.performance || {}),
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  }

  /**
   * Cleanup old data
   */
  async cleanup(): Promise<void> {
    const cutoffTime = Date.now() - (this.config.privacy.maxHistoryRetention * 60 * 60 * 1000);
    await this.storage.clear(cutoffTime);
  }

  /**
   * Shutdown telemetry manager
   */
  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    await this.flushBatch();
    await this.cleanup();
    
    diagnostics.log('Crew telemetry manager shutdown', { sessionId: this.sessionId });
  }
}

/**
 * Hook for using crew telemetry
 */
export function useCrewTelemetry(config: CrewSchedulerHUDConfig['telemetry']) {
  const telemetryManager = useMemo(() => new CrewTelemetryManager(config), [config]);

  const trackEvent = useCallback(
    (type: CrewTelemetryEventType, crewId?: string, data?: Record<string, unknown>) => {
      return telemetryManager.trackEvent(type, crewId, data);
    },
    [telemetryManager]
  );

  const trackCrewStatusChange = useCallback(
    (crewId: string, oldStatus: CrewStatusLevel, newStatus: CrewStatusLevel, reason?: string) => {
      return telemetryManager.trackCrewStatusChange(crewId, oldStatus, newStatus, reason);
    },
    [telemetryManager]
  );

  const trackHUDInteraction = useCallback(
    (interactionType: string, crewId?: string, controlType?: CrewQuickControlType, duration?: number) => {
      return telemetryManager.trackHUDInteraction(interactionType, crewId, controlType, duration);
    },
    [telemetryManager]
  );

  const getMetrics = useCallback(
    (timeRange?: { start: number; end: number }) => {
      return telemetryManager.getMetrics(timeRange);
    },
    [telemetryManager]
  );

  const exportData = useCallback(
    (format: 'json' | 'csv', timeRange?: { start: number; end: number }) => {
      return telemetryManager.exportData(format, timeRange);
    },
    [telemetryManager]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      telemetryManager.shutdown();
    };
  }, [telemetryManager]);

  return {
    trackEvent,
    trackCrewStatusChange,
    trackHUDInteraction,
    getMetrics,
    exportData,
    telemetryManager,
  };
}

// React import for the hook
import React from 'react';
