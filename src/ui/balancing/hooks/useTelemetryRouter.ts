/**
 * Phase 10 Telemetry Router Hook - NP-057
 * 
 * React hook for emitting Phase 10 telemetry events with proper typing
 * and automatic routing through the Phase10TelemetryRouter.
 * 
 * @since 2026-01-20
 * @author Vector-Balancer
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { 
  Phase10TelemetryRouter, 
  type Phase10Event,
  type FormulaSafetyEvent,
  type UndoRedoEvent,
  type StressTestingEvent,
  initializeDefaultCollectors 
} from '../../../balancing/telemetry/Phase10TelemetryRouter';

/**
 * Hook configuration options
 */
export interface UseTelemetryRouterOptions {
  enableAutoInit?: boolean;
  sessionId?: string;
  enableConsoleLogging?: boolean;
  enablePersistence?: boolean;
  enableTelemetry?: boolean;
}

/**
 * Hook return value
 */
export interface UseTelemetryRouterReturn {
  // Event emission functions
  emitFormulaSafetyEvent: (event: Omit<FormulaSafetyEvent, 'timestamp' | 'sessionId'>) => Promise<void>;
  emitUndoRedoEvent: (event: Omit<UndoRedoEvent, 'timestamp' | 'sessionId'>) => Promise<void>;
  emitStressTestingEvent: (event: Omit<StressTestingEvent, 'timestamp' | 'sessionId'>) => Promise<void>;
  
  // Generic event emission
  emitEvent: (event: Omit<Phase10Event, 'timestamp' | 'sessionId'>) => Promise<void>;
  
  // Router status
  isInitialized: boolean;
  statistics: ReturnType<typeof Phase10TelemetryRouter.getStatistics>;
  healthStatus: ReturnType<typeof Phase10TelemetryRouter.getHealthStatus>;
  
  // Session management
  sessionId: string;
  generateNewSessionId: () => string;
  
  // Router control
  configure: (config: Parameters<typeof Phase10TelemetryRouter.configure>[0]) => void;
  shutdown: () => void;
  clearQueue: () => number;
}

/**
 * Helper function to generate session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * React hook for Phase 10 telemetry routing
 */
export function useTelemetryRouter(options: UseTelemetryRouterOptions = {}): UseTelemetryRouterReturn {
  const {
    enableAutoInit = true,
    sessionId: providedSessionId,
    enableConsoleLogging = true,
    enablePersistence = true,
    enableTelemetry = true,
  } = options;

  const isInitializedRef = useRef(false);
  const sessionIdRef = useRef<string>(providedSessionId || '');
  
  // State for values that need to be accessed during render
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState(providedSessionId || '');

  // Initialize router on mount
  useEffect(() => {
    if (enableAutoInit && !isInitializedRef.current) {
      // Configure router
      Phase10TelemetryRouter.configure({
        enableConsoleLogging,
        enablePersistence,
        enableTelemetry,
        maxQueueSize: 1000,
        fallbackTimeout: 5000,
        retryAttempts: 3,
      });

      // Initialize default collectors
      initializeDefaultCollectors();

      // Generate session ID if not provided
      if (!sessionIdRef.current) {
        const newSessionId = generateSessionId();
        sessionIdRef.current = newSessionId;
      }

      isInitializedRef.current = true;

      if (enableConsoleLogging) {
        console.log('[useTelemetryRouter] Initialized with session:', sessionIdRef.current);
      }
    }

    return () => {
      // Cleanup on unmount
      if (isInitializedRef.current) {
        Phase10TelemetryRouter.shutdown();
        isInitializedRef.current = false;
      }
    };
  }, [enableAutoInit, enableConsoleLogging, enablePersistence, enableTelemetry]);

  // Update state when ref values change
  useEffect(() => {
    // This effect will run when the component re-renders
    // but we only update state if the ref values have changed
    if (sessionIdRef.current && sessionIdRef.current !== sessionId) {
      setSessionId(sessionIdRef.current);
    }
    if (isInitializedRef.current && !isInitialized) {
      setIsInitialized(true);
    }
  }, [sessionId, isInitialized]);

  /**
   * Generate a new session ID
   */
  const generateNewSessionId = useCallback((): string => {
    const newSessionId = generateSessionId();
    sessionIdRef.current = newSessionId;
    setSessionId(newSessionId);
    return newSessionId;
  }, []);

  /**
   * Emit formula safety event
   */
  const emitFormulaSafetyEvent = useCallback(async (
    event: Omit<FormulaSafetyEvent, 'timestamp' | 'sessionId'>
  ): Promise<void> => {
    if (!isInitializedRef.current) {
      if (enableConsoleLogging) {
        console.warn('[useTelemetryRouter] Router not initialized, skipping formula safety event');
      }
      return;
    }

    const fullEvent: FormulaSafetyEvent = {
      ...event,
      eventType: 'formula_safety',
      timestamp: new Date().toISOString(),
      sessionId: sessionIdRef.current,
    };

    await Phase10TelemetryRouter.routeEventAsync(fullEvent);
  }, [enableConsoleLogging]);

  /**
   * Emit undo/redo event
   */
  const emitUndoRedoEvent = useCallback(async (
    event: Omit<UndoRedoEvent, 'timestamp' | 'sessionId'>
  ): Promise<void> => {
    if (!isInitializedRef.current) {
      if (enableConsoleLogging) {
        console.warn('[useTelemetryRouter] Router not initialized, skipping undo/redo event');
      }
      return;
    }

    const fullEvent: UndoRedoEvent = {
      ...event,
      eventType: 'undo_redo',
      timestamp: new Date().toISOString(),
      sessionId: sessionIdRef.current,
    };

    await Phase10TelemetryRouter.routeEventAsync(fullEvent);
  }, [enableConsoleLogging]);

  /**
   * Emit stress testing event
   */
  const emitStressTestingEvent = useCallback(async (
    event: Omit<StressTestingEvent, 'timestamp' | 'sessionId'>
  ): Promise<void> => {
    if (!isInitializedRef.current) {
      if (enableConsoleLogging) {
        console.warn('[useTelemetryRouter] Router not initialized, skipping stress testing event');
      }
      return;
    }

    const fullEvent: StressTestingEvent = {
      ...event,
      eventType: 'stress_testing',
      timestamp: new Date().toISOString(),
      sessionId: sessionIdRef.current,
    };

    await Phase10TelemetryRouter.routeEventAsync(fullEvent);
  }, [enableConsoleLogging]);

  /**
   * Emit generic Phase 10 event
   */
  const emitEvent = useCallback(async (
    event: Omit<Phase10Event, 'timestamp' | 'sessionId'>
  ): Promise<void> => {
    if (!isInitializedRef.current) {
      if (enableConsoleLogging) {
        console.warn('[useTelemetryRouter] Router not initialized, skipping event');
      }
      return;
    }

    const fullEvent: Phase10Event = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: sessionIdRef.current,
    };

    await Phase10TelemetryRouter.routeEventAsync(fullEvent);
  }, [enableConsoleLogging]);

  /**
   * Configure router
   */
  const configure = useCallback((
    config: Parameters<typeof Phase10TelemetryRouter.configure>[0]
  ): void => {
    Phase10TelemetryRouter.configure(config);
  }, []);

  /**
   * Shutdown router
   */
  const shutdown = useCallback((): void => {
    Phase10TelemetryRouter.shutdown();
    isInitializedRef.current = false;
  }, []);

  /**
   * Clear event queue
   */
  const clearQueue = useCallback((): number => {
    return Phase10TelemetryRouter.clearQueue();
  }, []);

  /**
   * Get router statistics
   */
  const statistics = useCallback(() => {
    return Phase10TelemetryRouter.getStatistics();
  }, []);

  /**
   * Get router health status
   */
  const healthStatus = useCallback(() => {
    return Phase10TelemetryRouter.getHealthStatus();
  }, []);

  return {
    // Event emission functions
    emitFormulaSafetyEvent,
    emitUndoRedoEvent,
    emitStressTestingEvent,
    emitEvent,
    
    // Router status
    isInitialized: isInitialized,
    statistics: statistics(),
    healthStatus: healthStatus(),
    
    // Session management
    sessionId: sessionId,
    generateNewSessionId: generateNewSessionId,
    
    // Router control
    configure,
    shutdown,
    clearQueue,
  };
}

/**
 * Hook for formula safety telemetry
 */
export function useFormulaSafetyTelemetry(options: UseTelemetryRouterOptions = {}) {
  const { emitFormulaSafetyEvent } = useTelemetryRouter(options);
  
  return {
    emitFormulaSafetyEvent,
  };
}

/**
 * Hook for undo/redo telemetry
 */
export function useUndoRedoTelemetry(options: UseTelemetryRouterOptions = {}) {
  const { emitUndoRedoEvent } = useTelemetryRouter(options);
  
  return {
    emitUndoRedoEvent,
  };
}

/**
 * Hook for stress testing telemetry
 */
export function useStressTestingTelemetry(options: UseTelemetryRouterOptions = {}) {
  const { emitStressTestingEvent } = useTelemetryRouter(options);
  
  return {
    emitStressTestingEvent,
  };
}

/**
 * Hook for combined Phase 10 telemetry
 */
export function usePhase10Telemetry(options: UseTelemetryRouterOptions = {}) {
  const {
    emitFormulaSafetyEvent,
    emitUndoRedoEvent,
    emitStressTestingEvent,
    emitEvent,
    ...rest
  } = useTelemetryRouter(options);
  
  return {
    emitFormulaSafetyEvent,
    emitUndoRedoEvent,
    emitStressTestingEvent,
    emitEvent,
    ...rest,
  };
}

/**
 * Default export
 */
export default useTelemetryRouter;
