/**
 * Drag/Drop Telemetry Stream for Idle Village Phase E
 * 
 * Provides comprehensive telemetry tracking for drag/drop operations including
 * start, apply, and block events with detailed payload structure. Integrates
 * with existing telemetry systems and provides real-time event streaming.
 * 
 * @module dragDropTelemetry
 * @since IV-PhaseE-drop-telemetry
 * @author Nexus-Telemetry
 */

import { useCallback, useRef, useEffect } from 'react';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Types of drag/drop events that can be tracked
 */
export type DragDropEventType = 
  | 'drag_start'
  | 'drag_end'
  | 'drop_start'
  | 'drop_apply'
  | 'drop_block'
  | 'drop_cancel'
  | 'validation_start'
  | 'validation_end'
  | 'feedback_shown'
  | 'feedback_clicked'
  | 'feedback_dismissed';

/**
 * Validation rule types that can trigger events
 */
export type ValidationRuleType = 
  | 'resident_existence'
  | 'availability_check'
  | 'fatigue_threshold'
  | 'scheduler_conflict'
  | 'stat_requirements'
  | 'crew_capacity'
  | 'slot_locked'
  | 'activity_incompatible'
  | 'time_constraints'
  | 'custom_rule';

/**
 * Payload structure for drag/drop telemetry events
 */
export interface DragDropTelemetryPayload {
  /** Type of event */
  eventType: DragDropEventType;
  /** Unique ID for tracking the drag/drop session */
  sessionId: string;
  /** Resident ID being dragged */
  residentId: string;
  /** Source location (slot ID or component) */
  sourceLocation?: string;
  /** Target location (slot ID or activity ID) */
  targetLocation?: string;
  /** Activity ID if dropping on activity */
  activityId?: string;
  /** Context of the operation */
  context: 'map_drag' | 'roster_drag' | 'theater_drag' | 'unknown';
  /** Timestamp of the event */
  timestamp: number;
  /** Duration since session start (ms) */
  sessionDuration?: number;
  /** Validation result if applicable */
  validationResult?: {
    /** Whether validation passed */
    isValid: boolean;
    /** Rule that triggered validation result */
    rule?: ValidationRuleType;
    /** Validation message */
    message?: string;
    /** Validation details */
    details?: {
      /** Missing stats for stat requirements */
      missingStats?: string[];
      /** Current fatigue level */
      fatigueLevel?: number;
      /** Fatigue threshold */
      fatigueThreshold?: number;
      /** Current crew size */
      crewSize?: number;
      /** Maximum crew capacity */
      crewCapacity?: number;
      /** Whether slot is locked */
      isSlotLocked?: boolean;
    };
  };
  /** Performance metrics */
  performance?: {
    /** Time to validate (ms) */
    validationTime?: number;
    /** Time to apply drop (ms) */
    applyTime?: number;
    /** Total operation time (ms) */
    totalTime?: number;
  };
  /** User interaction data */
  interaction?: {
    /** Mouse position at event */
    mousePosition?: { x: number; y: number };
    /** Drag distance (pixels) */
    dragDistance?: number;
    /** Number of hover targets */
    hoverTargets?: number;
    /** Time spent hovering (ms) */
    hoverDuration?: number;
  };
  /** System state */
  systemState?: {
    /** Current game time */
    gameTime?: number;
    /** Number of active activities */
    activeActivities?: number;
    /** Village population */
    population?: number;
    /** Available residents */
    availableResidents?: number;
  };
  /** Additional metadata */
  metadata?: {
    /** Event sequence number in session */
    sequenceNumber?: number;
    /** Previous event type */
    previousEvent?: DragDropEventType;
    /** User agent information */
    userAgent?: string;
    /** Screen resolution */
    screenResolution?: string;
    /** Custom tags for filtering */
    tags?: string[];
  };
}

/**
 * Configuration for drag/drop telemetry
 */
export interface DragDropTelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Whether to log to console */
  logToConsole: boolean;
  /** Whether to send to external service */
  sendToService: boolean;
  /** Service endpoint URL */
  serviceEndpoint?: string;
  /** Batch size for sending events */
  batchSize: number;
  /** Flush interval (ms) */
  flushInterval: number;
  /** Maximum events to keep in memory */
  maxEventsInMemory: number;
  /** Whether to track performance metrics */
  trackPerformance: boolean;
  /** Whether to track user interactions */
  trackInteractions: boolean;
  /** Whether to track system state */
  trackSystemState: boolean;
}

/**
 * Default telemetry configuration
 */
export const DEFAULT_DRAG_DROP_TELEMETRY_CONFIG: DragDropTelemetryConfig = {
  enabled: true,
  logToConsole: false,
  sendToService: false,
  batchSize: 10,
  flushInterval: 5000,
  maxEventsInMemory: 100,
  trackPerformance: true,
  trackInteractions: true,
  trackSystemState: false,
} as const;

/**
 * Test configuration with verbose logging
 */
export const TEST_DRAG_DROP_TELEMETRY_CONFIG: DragDropTelemetryConfig = {
  ...DEFAULT_DRAG_DROP_TELEMETRY_CONFIG,
  logToConsole: true,
  sendToService: false,
  batchSize: 1,
  flushInterval: 1000,
  trackSystemState: true,
} as const;

/**
 * Telemetry session state
 */
interface TelemetrySession {
  /** Session ID */
  id: string;
  /** Start timestamp */
  startTime: number;
  /** Resident ID */
  residentId: string;
  /** Source location */
  sourceLocation?: string;
  /** Current event sequence */
  sequenceNumber: number;
  /** Last event timestamp */
  lastEventTime: number;
  /** Mouse start position */
  mouseStartPosition?: { x: number; y: number };
  /** Current mouse position */
  mouseCurrentPosition?: { x: number; y: number };
  /** Hover targets tracking */
  hoverTargets: Set<string>;
  /** Hover start time */
  hoverStartTime?: number;
}

/**
 * Hook for managing drag/drop telemetry
 * 
 * @param config - Telemetry configuration
 * @returns Telemetry utilities and state
 * 
 * @example
 * ```typescript
 * const {
 *   startSession,
 *   endSession,
 *   trackEvent,
 *   getEvents,
 *   flushEvents
 * } = useDragDropTelemetry({
 *   enabled: true,
 *   trackPerformance: true
 * });
 * ```
 */
export const useDragDropTelemetry = (config: Partial<DragDropTelemetryConfig> = {}) => {
  const fullConfig = { ...DEFAULT_DRAG_DROP_TELEMETRY_CONFIG, ...config };
  const diagnostics = createSandboxDiagnostics('drag-drop-telemetry');
  
  // Session management
  const currentSession = useRef<TelemetrySession | null>(null);
  const eventHistory = useRef<DragDropTelemetryPayload[]>([]);
  const flushTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `drag_drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Start a new telemetry session
  const startSession = useCallback((params: {
    residentId: string;
    sourceLocation?: string;
    mousePosition?: { x: number; y: number };
  }) => {
    const sessionId = generateSessionId();
    const now = Date.now();
    
    currentSession.current = {
      id: sessionId,
      startTime: now,
      residentId: params.residentId,
      sourceLocation: params.sourceLocation,
      sequenceNumber: 0,
      lastEventTime: now,
      mouseStartPosition: params.mousePosition,
      mouseCurrentPosition: params.mousePosition,
      hoverTargets: new Set(),
    };
    
    // Track drag start event
    trackEvent({
      eventType: 'drag_start',
      sessionId,
      residentId: params.residentId,
      sourceLocation: params.sourceLocation,
      context: 'unknown', // Will be updated by caller
      timestamp: now,
      interaction: {
        mousePosition: params.mousePosition,
      },
      metadata: {
        sequenceNumber: 0,
      },
    });
    
    if (fullConfig.logToConsole) {
      console.log(`[DragDropTelemetry] Started session ${sessionId} for resident ${params.residentId}`);
    }
  }, [generateSessionId, fullConfig.logToConsole]);
  
  // End current telemetry session
  const endSession = useCallback((reason?: string) => {
    if (!currentSession.current) return;
    
    const now = Date.now();
    const session = currentSession.current;
    
    // Track drag end event
    trackEvent({
      eventType: 'drag_end',
      sessionId: session.id,
      residentId: session.residentId,
      sourceLocation: session.sourceLocation,
      context: 'unknown',
      timestamp: now,
      sessionDuration: now - session.startTime,
      interaction: {
        mousePosition: session.mouseCurrentPosition,
        dragDistance: session.mouseStartPosition && session.mouseCurrentPosition
          ? Math.sqrt(
              Math.pow(session.mouseCurrentPosition.x - session.mouseStartPosition.x, 2) +
              Math.pow(session.mouseCurrentPosition.y - session.mouseStartPosition.y, 2)
            )
          : undefined,
        hoverTargets: session.hoverTargets.size,
        hoverDuration: session.hoverStartTime ? now - session.hoverStartTime : undefined,
      },
      metadata: {
        sequenceNumber: session.sequenceNumber + 1,
        tags: reason ? [`end_reason:${reason}`] : undefined,
      },
    });
    
    if (fullConfig.logToConsole) {
      console.log(`[DragDropTelemetry] Ended session ${session.id}${reason ? ` (${reason})` : ''}`);
    }
    
    currentSession.current = null;
  }, [fullConfig.logToConsole]);
  
  // Track a telemetry event
  const trackEvent = useCallback((event: Omit<DragDropTelemetryPayload, 'sessionDuration' | 'sequenceNumber'>) => {
    if (!fullConfig.enabled) return;
    
    const now = Date.now();
    const session = currentSession.current;
    
    // Enrich event with session data
    const enrichedEvent: DragDropTelemetryPayload = {
      ...event,
      timestamp: event.timestamp || now,
      sessionDuration: session ? now - session.startTime : undefined,
      metadata: {
        sequenceNumber: session ? session.sequenceNumber + 1 : 0,
        previousEvent: session ? undefined : undefined, // Would need tracking
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        screenResolution: typeof window !== 'undefined' 
          ? `${window.screen.width}x${window.screen.height}` 
          : undefined,
        ...event.metadata,
      },
    };
    
    // Add performance metrics if enabled
    if (fullConfig.trackPerformance && session) {
      enrichedEvent.performance = {
        ...enrichedEvent.performance,
        totalTime: now - session.startTime,
      };
    }
    
    // Add to history
    eventHistory.current.push(enrichedEvent);
    
    // Limit history size
    if (eventHistory.current.length > fullConfig.maxEventsInMemory) {
      eventHistory.current = eventHistory.current.slice(-fullConfig.maxEventsInMemory);
    }
    
    // Update session
    if (session) {
      session.sequenceNumber++;
      session.lastEventTime = now;
    }
    
    // Log to console if enabled
    if (fullConfig.logToConsole) {
      console.log(`[DragDropTelemetry] ${event.eventType}:`, enrichedEvent);
    }
    
    // Send to service if enabled
    if (fullConfig.sendToService && fullConfig.serviceEndpoint) {
      // Would implement actual service call here
      diagnostics.track('telemetry_event_sent', { eventType: event.eventType });
    }
  }, [fullConfig, diagnostics]);
  
  // Update mouse position
  const updateMousePosition = useCallback((position: { x: number; y: number }) => {
    if (currentSession.current) {
      currentSession.current.mouseCurrentPosition = position;
    }
  }, []);
  
  // Add hover target
  const addHoverTarget = useCallback((targetId: string) => {
    if (currentSession.current) {
      currentSession.current.hoverTargets.add(targetId);
      if (currentSession.current.hoverTargets.size === 1) {
        currentSession.current.hoverStartTime = Date.now();
      }
    }
  }, []);
  
  // Remove hover target
  const removeHoverTarget = useCallback((targetId: string) => {
    if (currentSession.current) {
      currentSession.current.hoverTargets.delete(targetId);
      if (currentSession.current.hoverTargets.size === 0) {
        currentSession.current.hoverStartTime = undefined;
      }
    }
  }, []);
  
  // Get event history
  const getEvents = useCallback((filter?: {
    sessionId?: string;
    eventType?: DragDropEventType;
    residentId?: string;
    since?: number;
  }) => {
    let events = [...eventHistory.current];
    
    if (filter) {
      if (filter.sessionId) {
        events = events.filter(e => e.sessionId === filter.sessionId);
      }
      if (filter.eventType) {
        events = events.filter(e => e.eventType === filter.eventType);
      }
      if (filter.residentId) {
        events = events.filter(e => e.residentId === filter.residentId);
      }
      if (filter.since) {
        events = events.filter(e => e.timestamp >= filter.since);
      }
    }
    
    return events;
  }, []);
  
  // Flush events to service
  const flushEvents = useCallback(() => {
    if (!fullConfig.sendToService || !fullConfig.serviceEndpoint) return;
    
    const eventsToSend = eventHistory.current.slice(-fullConfig.batchSize);
    
    if (eventsToSend.length > 0) {
      // Would implement actual service call here
      diagnostics.track('telemetry_flush', { eventCount: eventsToSend.length });
      
      if (fullConfig.logToConsole) {
        console.log(`[DragDropTelemetry] Flushed ${eventsToSend.length} events`);
      }
    }
  }, [fullConfig, diagnostics]);
  
  // Set up flush timer
  useEffect(() => {
    if (fullConfig.sendToService && fullConfig.flushInterval > 0) {
      flushTimer.current = setInterval(flushEvents, fullConfig.flushInterval);
      
      return () => {
        if (flushTimer.current) {
          clearInterval(flushTimer.current);
          flushTimer.current = null;
        }
      };
    }
  }, [fullConfig.sendToService, fullConfig.flushInterval, flushEvents]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession('component_unmount');
    };
  }, [endSession]);
  
  return {
    // Session management
    startSession,
    endSession,
    currentSession: currentSession.current,
    
    // Event tracking
    trackEvent,
    updateMousePosition,
    addHoverTarget,
    removeHoverTarget,
    
    // Data access
    getEvents,
    flushEvents,
    
    // Configuration
    config: fullConfig,
  };
};

/**
 * Convenience hook for tracking drop validation events
 * 
 * @param telemetry - Telemetry hook instance
 * @returns Validation tracking utilities
 */
export const useDropValidationTelemetry = (telemetry: ReturnType<typeof useDragDropTelemetry>) => {
  const startValidation = useCallback((params: {
    residentId: string;
    targetLocation: string;
    activityId?: string;
  }) => {
    const startTime = performance.now();
    
    telemetry.trackEvent({
      eventType: 'validation_start',
      sessionId: telemetry.currentSession?.id || '',
      residentId: params.residentId,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
      context: 'map_drag',
      timestamp: Date.now(),
    });
    
    return startTime;
  }, [telemetry]);
  
  const endValidation = useCallback((params: {
    residentId: string;
    targetLocation: string;
    activityId?: string;
    validationResult: {
      isValid: boolean;
      rule?: ValidationRuleType;
      message?: string;
      details?: any;
    };
    startTime: number;
  }) => {
    const endTime = performance.now();
    const validationTime = endTime - params.startTime;
    
    telemetry.trackEvent({
      eventType: 'validation_end',
      sessionId: telemetry.currentSession?.id || '',
      residentId: params.residentId,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
      context: 'map_drag',
      timestamp: Date.now(),
      validationResult: params.validationResult,
      performance: {
        validationTime,
      },
    });
    
    return validationTime;
  }, [telemetry]);
  
  return {
    startValidation,
    endValidation,
  };
};

/**
 * Export utilities for telemetry data
 */
export const exportDragDropTelemetry = (events: DragDropTelemetryPayload[]) => {
  return {
    metadata: {
      exportTime: Date.now(),
      eventCount: events.length,
      timeRange: {
        start: Math.min(...events.map(e => e.timestamp)),
        end: Math.max(...events.map(e => e.timestamp)),
      },
      sessions: [...new Set(events.map(e => e.sessionId))],
      residents: [...new Set(events.map(e => e.residentId))],
      eventTypes: [...new Set(events.map(e => e.eventType))],
    },
    events,
  };
};
