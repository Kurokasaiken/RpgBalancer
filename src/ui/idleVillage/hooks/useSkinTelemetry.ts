/**
 * useSkinTelemetry Hook
 * 
 * Hook for tracking skin-related telemetry events.
 * Provides automatic event tracking for skin operations and component interactions.
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';

// Define types locally to avoid import issues
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface SkinTelemetryEvents {
  preset_changed: { presetId: SkinPresetId; previousPreset: SkinPresetId };
  pillar_changed: { pillar: StyleLabPillar; previousPillar: StyleLabPillar };
  motion_level_changed: { motionLevel: MotionLevel; previousMotionLevel: MotionLevel };
  component_registered: { componentId: string; binding: any };
  component_unregistered: { componentId: string; reason: string };
  error: { error: string; context?: any };
}

import { useSkinSystem } from './useSkinSystem';

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseSkinTelemetryOptions {
  /**
   * Component ID for tracking component-specific events
   */
  componentId?: string;
  
  /**
   * Component type for categorization
   */
  componentType?: string;
  
  /**
   * Whether to track preset changes automatically
   * @default true
   */
  trackPresetChanges?: boolean;
  
  /**
   * Whether to track pillar changes automatically
   * @default true
   */
  trackPillarChanges?: boolean;
  
  /**
   * Whether to track motion level changes automatically
   * @default true
   */
  trackMotionChanges?: boolean;
  
  /**
   * Whether to track component registration/unregistration
   * @default true
   */
  trackComponentEvents?: boolean;
  
  /**
   * Whether to track performance metrics
   * @default false
   */
  trackPerformance?: boolean;
  
  /**
   * Custom metadata to include with all events
   */
  globalMetadata?: Record<string, any>;
  
  /**
   * Event filter function
   */
  eventFilter?: (eventType: keyof SkinTelemetryEvents, payload: any) => boolean;
  
  /**
   * Custom event handler
   */
  onEvent?: (eventType: keyof SkinTelemetryEvents, payload: any) => void;
}

export interface UseSkinTelemetryReturn {
  // Manual event tracking
  trackEvent: <T extends keyof SkinTelemetryEvents>(
    eventType: T,
    payload?: Omit<SkinTelemetryEvents[T], keyof SkinTelemetryPayload>
  ) => void;
  
  // Convenience methods
  trackPresetChange: (
    presetId: SkinPresetId,
    previousPreset?: SkinPresetId,
    reason?: 'user' | 'system' | 'auto'
  ) => void;
  trackPillarChange: (
    pillar: StyleLabPillar,
    previousPillar?: StyleLabPillar,
    reason?: 'user' | 'system' | 'auto'
  ) => void;
  trackMotionChange: (
    motionLevel: MotionLevel,
    previousMotionLevel?: MotionLevel,
    reason?: 'user' | 'system' | 'auto'
  ) => void;
  trackComponentInteraction: (
    interactionType: string,
    metadata?: Record<string, any>
  ) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (operation: string, duration: number, metadata?: Record<string, any>) => void;
  
  // Utilities
  getSessionId: () => string;
  createEventPayload: <T extends keyof SkinTelemetryEvents>(
    eventType: T,
    additionalPayload?: Omit<SkinTelemetryEvents[T], keyof SkinTelemetryPayload>
  ) => SkinTelemetryEvents[T];
  
  // Status
  isEnabled: boolean;
  eventCount: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSkinTelemetry(options: UseSkinTelemetryOptions = {}): UseSkinTelemetryReturn {
  const {
    componentId,
    componentType,
    trackPresetChanges = true,
    trackPillarChanges = true,
    trackMotionChanges = true,
    trackComponentEvents = true,
    trackPerformance = false,
    globalMetadata = {},
    eventFilter,
    onEvent,
  } = options;

  const { state, manager } = useSkinSystem();
  const eventCountRef = useRef(0);
  const previousStateRef = useRef(state);
  const sessionIdRef = useRef<string>('');

  // Generate session ID
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `skin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return sessionIdRef.current;
  }, []);

  // Check if telemetry is enabled
  const isEnabled = useMemo(() => {
    // Check if manager has telemetry enabled
    try {
      const managerState = manager.getState();
      return true; // Assume enabled if no errors
    } catch {
      return false;
    }
  }, [manager]);

  // Create base payload
  const createBasePayload = useCallback((): SkinTelemetryPayload => {
    return {
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      presetId: state.currentPreset,
      pillar: state.currentPillar,
      motionLevel: state.currentMotionLevel,
      componentId: componentId || 'system',
      componentType: componentType || 'unknown',
      action: 'unknown',
      category: 'skin',
      severity: 'info',
      metadata: globalMetadata,
    };
  }, [state, componentId, componentType, globalMetadata, getSessionId]);

  // Create full event payload
  const createEventPayload = useCallback(<T extends keyof SkinTelemetryEvents>(
    eventType: T,
    additionalPayload: Omit<SkinTelemetryEvents[T], keyof SkinTelemetryPayload> = {} as any
  ): SkinTelemetryEvents[T] => {
    const basePayload = createBasePayload();
    
    return {
      ...basePayload,
      action: eventType,
      category: getEventCategory(eventType),
      severity: getEventSeverity(eventType),
      ...additionalPayload,
    } as SkinTelemetryEvents[T];
  }, [createBasePayload]);

  // Get event category
  const getEventCategory = (eventType: keyof SkinTelemetryEvents): 'skin' | 'component' | 'system' => {
    if (eventType.startsWith('skin_')) return 'skin';
    if (eventType.includes('component')) return 'component';
    return 'system';
  };

  // Get event severity
  const getEventSeverity = (eventType: keyof SkinTelemetryEvents): 'info' | 'warning' | 'error' => {
    if (eventType.includes('error')) return 'error';
    if (eventType.includes('warning')) return 'warning';
    return 'info';
  };

  // Track event
  const trackEvent = useCallback(<T extends keyof SkinTelemetryEvents>(
    eventType: T,
    additionalPayload: Omit<SkinTelemetryEvents[T], keyof SkinTelemetryPayload> = {} as any
  ) => {
    if (!isEnabled) return;

    const payload = createEventPayload(eventType, additionalPayload);
    
    // Apply event filter
    if (eventFilter && !eventFilter(eventType, payload)) {
      return;
    }

    // Track event count
    eventCountRef.current++;

    // Send to manager's telemetry system
    manager.trackEvent(eventType, additionalPayload);

    // Call custom handler
    if (onEvent) {
      onEvent(eventType, payload);
    }
  }, [isEnabled, createEventPayload, eventFilter, onEvent, manager]);

  // Track preset change
  const trackPresetChange = useCallback((
    presetId: SkinPresetId,
    previousPreset?: SkinPresetId,
    reason: 'user' | 'system' | 'auto' = 'user'
  ) => {
    trackEvent('skin_preset_changed', {
      previousPreset: previousPreset || state.currentPreset,
      newPreset: presetId,
      changeReason: reason,
    });
  }, [trackEvent, state.currentPreset]);

  // Track pillar change
  const trackPillarChange = useCallback((
    pillar: StyleLabPillar,
    previousPillar?: StyleLabPillar,
    reason: 'user' | 'system' | 'auto' = 'user'
  ) => {
    trackEvent('skin_pillar_changed', {
      previousPillar: previousPillar || state.currentPillar,
      newPillar: pillar,
      changeReason: reason,
    });
  }, [trackEvent, state.currentPillar]);

  // Track motion change
  const trackMotionChange = useCallback((
    motionLevel: MotionLevel,
    previousMotionLevel?: MotionLevel,
    reason: 'user' | 'system' | 'auto' = 'user'
  ) => {
    trackEvent('skin_motion_changed', {
      previousMotionLevel: previousMotionLevel || state.currentMotionLevel,
      newMotionLevel: motionLevel,
      changeReason: reason,
    });
  }, [trackEvent, state.currentMotionLevel]);

  // Track component interaction
  const trackComponentInteraction = useCallback((
    interactionType: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!componentId) return;

    trackEvent('skin_component_interaction' as any, {
      interactionType,
      componentId,
      metadata,
    });
  }, [trackEvent, componentId]);

  // Track error
  const trackError = useCallback((error: Error, context: Record<string, any> = {}) => {
    trackEvent('skin_error', {
      error: error.message,
      stack: error.stack,
      context: {
        ...context,
        componentId,
        componentType,
      },
    });
  }, [trackEvent, componentId, componentType]);

  // Track performance
  const trackPerformanceCallback = useCallback((
    operation: string,
    duration: number,
    metadata: Record<string, any> = {}
  ) => {
    if (!trackPerformance) return;

    trackEvent('skin_performance', {
      operation,
      duration,
      memoryUsage: metadata.memoryUsage,
      componentCount: metadata.componentCount,
    });
  }, [trackEvent, trackPerformance]);

  // Auto-track state changes
  useEffect(() => {
    const prevState = previousStateRef.current;
    const currentState = state;

    // Track preset changes
    if (trackPresetChanges && prevState.currentPreset !== currentState.currentPreset) {
      trackPresetChange(currentState.currentPreset, prevState.currentPreset);
    }

    // Track pillar changes
    if (trackPillarChanges && prevState.currentPillar !== currentState.currentPillar) {
      trackPillarChange(currentState.currentPillar, prevState.currentPillar);
    }

    // Track motion level changes
    if (trackMotionChanges && prevState.currentMotionLevel !== currentState.currentMotionLevel) {
      trackMotionChange(currentState.currentMotionLevel, prevState.currentMotionLevel);
    }

    previousStateRef.current = currentState;
  }, [state, trackPresetChanges, trackPillarChanges, trackMotionChanges, trackPresetChange, trackPillarChange, trackMotionChange]);

  // Track component registration events
  useEffect(() => {
    if (!trackComponentEvents || !componentId) return;

    const currentComponents = Object.keys(currentState.activeBindings);
    const previousComponents = Object.keys(previousStateRef.current.activeBindings);

    // Track new registrations
    const newRegistrations = currentComponents.filter(id => !previousComponents.includes(id));
    newRegistrations.forEach(id => {
      if (id === componentId) {
        const binding = currentState.activeBindings[id];
        trackEvent('skin_component_registered', {
          componentId: id,
          binding,
        });
      }
    });

    // Track unregistrations
    const newUnregistrations = previousComponents.filter(id => !currentComponents.includes(id));
    newUnregistrations.forEach(id => {
      if (id === componentId) {
        trackEvent('skin_component_unregistered', {
          componentId: id,
          reason: 'user',
        });
      }
    });
  }, [state, trackComponentEvents, componentId, trackEvent]);

  return useMemo(() => {
    return {
      trackEvent,
      trackPresetChange,
      trackPillarChange,
      trackMotionChange,
      trackComponentInteraction,
      trackError,
      trackPerformance: trackPerformanceCallback,
      getSessionId,
      createEventPayload,
      isEnabled,
      eventCount: eventCountRef.current,
    };
  }, [
    trackEvent,
    trackPresetChange,
    trackPillarChange,
    trackMotionChange,
    trackComponentInteraction,
    trackError,
    trackPerformanceCallback,
    getSessionId,
    createEventPayload,
    isEnabled,
  ]);
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for component-specific telemetry
 */
export function useComponentSkinTelemetry(
  componentId: string,
  componentType: string,
  options: Omit<UseSkinTelemetryOptions, 'componentId' | 'componentType'> = {}
) {
  return useSkinTelemetry({
    ...options,
    componentId,
    componentType,
  });
}

/**
 * Hook for performance-focused telemetry
 */
export function useSkinPerformanceTelemetry(
  options: Omit<UseSkinTelemetryOptions, 'trackPerformance'> = {}
) {
  return useSkinTelemetry({
    ...options,
    trackPerformance: true,
  });
}

/**
 * Hook for error tracking telemetry
 */
export function useSkinErrorTelemetry(
  options: Omit<UseSkinTelemetryOptions, 'componentId'> = {}
) {
  const telemetry = useSkinTelemetry(options);
  
  // Enhanced error tracking
  const trackErrorWithStack = useCallback((error: Error, context?: Record<string, any>) => {
    telemetry.trackError(error, {
      ...context,
      stackTrace: error.stack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });
  }, [telemetry]);

  return {
    ...telemetry,
    trackError: trackErrorWithStack,
  };
}

/**
 * Hook for interaction tracking
 */
export function useSkinInteractionTelemetry(
  componentId: string,
  options: Omit<UseSkinTelemetryOptions, 'componentId'> = {}
) {
  const telemetry = useSkinTelemetry({
    ...options,
    componentId,
  });

  // Enhanced interaction tracking
  const trackClick = useCallback((elementId?: string, metadata?: Record<string, any>) => {
    telemetry.trackComponentInteraction('click', {
      elementId,
      ...metadata,
    });
  }, [telemetry]);

  const trackHover = useCallback((elementId?: string, duration?: number, metadata?: Record<string, any>) => {
    telemetry.trackComponentInteraction('hover', {
      elementId,
      duration,
      ...metadata,
    });
  }, [telemetry]);

  const trackFocus = useCallback((elementId?: string, metadata?: Record<string, any>) => {
    telemetry.trackComponentInteraction('focus', {
      elementId,
      ...metadata,
    });
  }, [telemetry]);

  const trackDrag = useCallback((dragType: 'start' | 'end', elementId?: string, metadata?: Record<string, any>) => {
    telemetry.trackComponentInteraction(`drag_${dragType}`, {
      elementId,
      ...metadata,
    });
  }, [telemetry]);

  return {
    ...telemetry,
    trackClick,
    trackHover,
    trackFocus,
    trackDrag,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a telemetry decorator for functions
 */
export function withSkinTelemetry<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string,
  telemetry: UseSkinTelemetryReturn
): T {
  return ((...args: any[]) => {
    const startTime = performance.now();
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            const duration = performance.now() - startTime;
            telemetry.trackPerformance(operationName, duration, { success: true });
            return value;
          })
          .catch((error: any) => {
            const duration = performance.now() - startTime;
            telemetry.trackError(error, { operation: operationName, duration });
            throw error;
          });
      }
      
      // Handle sync functions
      const duration = performance.now() - startTime;
      telemetry.trackPerformance(operationName, duration, { success: true });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      telemetry.trackError(error as Error, { operation: operationName, duration });
      throw error;
    }
  }) as T;
}

/**
 * Create a performance tracker
 */
export function createSkinPerformanceTracker(telemetry: UseSkinTelemetryReturn) {
  const operations = new Map<string, number>();

  return {
    start: (operationName: string) => {
      operations.set(operationName, performance.now());
    },
    
    end: (operationName: string, metadata?: Record<string, any>) => {
      const startTime = operations.get(operationName);
      if (startTime) {
        const duration = performance.now() - startTime;
        telemetry.trackPerformance(operationName, duration, metadata);
        operations.delete(operationName);
        return duration;
      }
      return 0;
    },
    
    measure: <T>(operationName: string, fn: () => T, metadata?: Record<string, any>): T => {
      const startTime = performance.now();
      try {
        const result = fn();
        const duration = performance.now() - startTime;
        telemetry.trackPerformance(operationName, duration, metadata);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        telemetry.trackError(error as Error, { operation: operationName, duration });
        throw error;
      }
    },
  };
}

/**
 * Hook for using the performance tracker
 */
export function useSkinPerformanceTracker() {
  const telemetry = useSkinPerformanceTelemetry();
  
  return useMemo(() => {
    return createSkinPerformanceTracker(telemetry);
  }, [telemetry]);
}
