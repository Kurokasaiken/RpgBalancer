/**
 * Drag/Drop Telemetry Hook for Idle Village Phase E
 * 
 * Integrates with existing drop validation and feedback systems to provide
 * comprehensive telemetry tracking for all drag/drop operations. Provides
 * automatic event tracking, session management, and performance monitoring.
 * 
 * @module useDragDropTelemetry
 * @since IV-PhaseE-drop-telemetry
 * @author Nexus-Telemetry
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { useDragDropTelemetry, useDropValidationTelemetry } from '@/ui/idleVillage/utils/dragDropTelemetry';
import type { DragDropTelemetryPayload, ValidationRuleType } from '@/ui/idleVillage/utils/dragDropTelemetry';

/**
 * Parameters for the drag/drop telemetry hook
 */
export interface UseDragDropTelemetryParams {
  /** Whether telemetry is enabled */
  enabled?: boolean;
  /** Whether to track performance metrics */
  trackPerformance?: boolean;
  /** Whether to track user interactions */
  trackInteractions?: boolean;
  /** Whether to track system state */
  trackSystemState?: boolean;
  /** Context for the telemetry */
  context?: 'map_drag' | 'roster_drag' | 'theater_drag';
  /** Additional metadata to include */
  metadata?: Record<string, any>;
}

/**
 * Return value for the drag/drop telemetry hook
 */
export interface UseDragDropTelemetryReturn {
  /** Start tracking a drag operation */
  startDrag: (params: {
    resident: ResidentState;
    sourceLocation?: string;
    mousePosition?: { x: number; y: number };
  }) => string;
  
  /** End tracking a drag operation */
  endDrag: (params: {
    reason?: 'drop_applied' | 'drop_blocked' | 'drop_cancelled' | 'drag_abandoned';
    targetLocation?: string;
    activityId?: string;
  }) => void;
  
  /** Track a drop attempt */
  trackDropAttempt: (params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    mousePosition?: { x: number; y: number };
  }) => void;
  
  /** Track a successful drop application */
  trackDropApplied: (params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    applyTime?: number;
  }) => void;
  
  /** Track a blocked drop */
  trackDropBlocked: (params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    rule: ValidationRuleType;
    message: string;
    details?: any;
  }) => void;
  
  /** Track validation start */
  startValidation: (params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
  }) => number;
  
  /** Track validation end */
  endValidation: (params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    isValid: boolean;
    rule?: ValidationRuleType;
    message?: string;
    details?: any;
    startTime: number;
  }) => void;
  
  /** Update mouse position during drag */
  updateMousePosition: (position: { x: number; y: number }) => void;
  
  /** Track hover target */
  addHoverTarget: (targetId: string) => void;
  
  /** Remove hover target */
  removeHoverTarget: (targetId: string) => void;
  
  /** Get telemetry events */
  getEvents: (filter?: {
    sessionId?: string;
    eventType?: string;
    residentId?: string;
    since?: number;
  }) => DragDropTelemetryPayload[];
  
  /** Export telemetry data */
  exportData: () => {
    metadata: any;
    events: DragDropTelemetryPayload[];
  };
  
  /** Current session ID */
  currentSessionId?: string;
}

/**
 * Hook for comprehensive drag/drop telemetry tracking
 * 
 * @param params - Hook parameters
 * @returns Telemetry tracking utilities
 * 
 * @example
 * ```typescript
 * const {
 *   startDrag,
 *   endDrag,
 *   trackDropApplied,
 *   trackDropBlocked,
 *   startValidation,
 *   endValidation
 * } = useDragDropTelemetry({
 *   enabled: true,
 *   context: 'map_drag',
 *   trackPerformance: true
 * });
 * ```
 */
export const useDragDropTelemetryTracking = (params: UseDragDropTelemetryParams = {}): UseDragDropTelemetryReturn => {
  const {
    enabled = true,
    trackPerformance = true,
    trackInteractions = true,
    trackSystemState = false,
    context = 'map_drag',
    metadata = {},
  } = params;
  
  // Base telemetry hook
  const telemetry = useDragDropTelemetry({
    enabled,
    trackPerformance,
    trackInteractions,
    trackSystemState,
  });
  
  // Validation telemetry hook
  const validationTelemetry = useDropValidationTelemetry(telemetry);
  
  // Performance tracking
  const performanceTimers = useRef<Map<string, number>>(new Map());
  
  // Memoize configuration
  const config = useMemo(() => ({
    enabled,
    trackPerformance,
    trackInteractions,
    trackSystemState,
    context,
    metadata,
  }), [enabled, trackPerformance, trackInteractions, trackSystemState, context, metadata]);
  
  // Start tracking a drag operation
  const startDrag = useCallback((params: {
    resident: ResidentState;
    sourceLocation?: string;
    mousePosition?: { x: number; y: number };
  }) => {
    if (!enabled) return '';
    
    const sessionId = telemetry.startSession({
      residentId: params.resident.id,
      sourceLocation: params.sourceLocation,
      mousePosition: params.mousePosition,
    });
    
    // Store performance start time
    if (trackPerformance) {
      performanceTimers.current.set(`drag_${sessionId}`, performance.now());
    }
    
    return sessionId;
  }, [enabled, telemetry, trackPerformance]);
  
  // End tracking a drag operation
  const endDrag = useCallback((params: {
    reason?: 'drop_applied' | 'drop_blocked' | 'drop_cancelled' | 'drag_abandoned';
    targetLocation?: string;
    activityId?: string;
  }) => {
    if (!enabled) return;
    
    const sessionId = telemetry.currentSession?.id;
    if (!sessionId) return;
    
    // Calculate performance metrics
    let applyTime;
    if (trackPerformance && performanceTimers.current.has(`drag_${sessionId}`)) {
      applyTime = performance.now() - performanceTimers.current.get(`drag_${sessionId}`!;
      performanceTimers.current.delete(`drag_${sessionId}`);
    }
    
    // Enrich with additional metadata
    telemetry.trackEvent({
      eventType: 'drag_end',
      sessionId,
      residentId: telemetry.currentSession.residentId,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
      context,
      timestamp: Date.now(),
      performance: applyTime ? { totalTime: applyTime } : undefined,
      metadata: {
        ...metadata,
        tags: params.reason ? [`end_reason:${params.reason}`] : undefined,
      },
    });
    
    telemetry.endSession(params.reason);
  }, [enabled, telemetry, trackPerformance, context, metadata]);
  
  // Track a drop attempt
  const trackDropAttempt = useCallback((params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    mousePosition?: { x: number; y: number };
  }) => {
    if (!enabled) return;
    
    const sessionId = telemetry.currentSession?.id;
    if (!sessionId) return;
    
    telemetry.trackEvent({
      eventType: 'drop_start',
      sessionId,
      residentId: params.resident.id,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
      context,
      timestamp: Date.now(),
      interaction: {
        mousePosition: params.mousePosition,
      },
      metadata,
    });
  }, [enabled, telemetry, context, metadata]);
  
  // Track a successful drop application
  const trackDropApplied = useCallback((params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    applyTime?: number;
  }) => {
    if (!enabled) return;
    
    const sessionId = telemetry.currentSession?.id;
    if (!sessionId) return;
    
    telemetry.trackEvent({
      eventType: 'drop_apply',
      sessionId,
      residentId: params.resident.id,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
      context,
      timestamp: Date.now(),
      performance: params.applyTime ? { applyTime: params.applyTime } : undefined,
      metadata: {
        ...metadata,
        tags: ['success'],
      },
    });
    
    endDrag({
      reason: 'drop_applied',
      targetLocation: params.targetLocation,
      activityId: params.activityId,
    });
  }, [enabled, telemetry, context, metadata, endDrag]);
  
  // Track a blocked drop
  const trackDropBlocked = useCallback((params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    rule: ValidationRuleType;
    message: string;
    details?: any;
  }) => {
    if (!enabled) return;
    
    const sessionId = telemetry.currentSession?.id;
    if (!sessionId) return;
    
    telemetry.trackEvent({
      eventType: 'drop_block',
      sessionId,
      residentId: params.resident.id,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
      context,
      timestamp: Date.now(),
      validationResult: {
        isValid: false,
        rule: params.rule,
        message: params.message,
        details: params.details,
      },
      metadata: {
        ...metadata,
        tags: ['blocked', `rule:${params.rule}`],
      },
    });
    
    endDrag({
      reason: 'drop_blocked',
      targetLocation: params.targetLocation,
      activityId: params.activityId,
    });
  }, [enabled, telemetry, context, metadata, endDrag]);
  
  // Track validation start
  const startValidation = useCallback((params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
  }) => {
    if (!enabled) return 0;
    
    return validationTelemetry.startValidation({
      residentId: params.resident.id,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
    });
  }, [enabled, validationTelemetry]);
  
  // Track validation end
  const endValidation = useCallback((params: {
    resident: ResidentState;
    targetLocation: string;
    activityId?: string;
    isValid: boolean;
    rule?: ValidationRuleType;
    message?: string;
    details?: any;
    startTime: number;
  }) => {
    if (!enabled) return;
    
    const validationTime = validationTelemetry.endValidation({
      residentId: params.resident.id,
      targetLocation: params.targetLocation,
      activityId: params.activityId,
      validationResult: {
        isValid: params.isValid,
        rule: params.rule,
        message: params.message,
        details: params.details,
      },
      startTime: params.startTime,
    });
    
    return validationTime;
  }, [enabled, validationTelemetry]);
  
  // Update mouse position
  const updateMousePosition = useCallback((position: { x: number; y: number }) => {
    if (!enabled) return;
    telemetry.updateMousePosition(position);
  }, [enabled, telemetry]);
  
  // Track hover target
  const addHoverTarget = useCallback((targetId: string) => {
    if (!enabled) return;
    telemetry.addHoverTarget(targetId);
  }, [enabled, telemetry]);
  
  // Remove hover target
  const removeHoverTarget = useCallback((targetId: string) => {
    if (!enabled) return;
    telemetry.removeHoverTarget(targetId);
  }, [enabled, telemetry]);
  
  // Get telemetry events
  const getEvents = useCallback((filter?: {
    sessionId?: string;
    eventType?: string;
    residentId?: string;
    since?: number;
  }) => {
    return telemetry.getEvents(filter);
  }, [telemetry]);
  
  // Export telemetry data
  const exportData = useCallback(() => {
    const events = getEvents();
    return {
      metadata: {
        exportTime: Date.now(),
        config,
        eventCount: events.length,
        context,
      },
      events,
    };
  }, [getEvents, config, context]);
  
  return {
    startDrag,
    endDrag,
    trackDropAttempt,
    trackDropApplied,
    trackDropBlocked,
    startValidation,
    endValidation,
    updateMousePosition,
    addHoverTarget,
    removeHoverTarget,
    getEvents,
    exportData,
    currentSessionId: telemetry.currentSession?.id,
  };
};
