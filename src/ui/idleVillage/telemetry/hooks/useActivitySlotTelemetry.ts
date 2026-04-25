/**
 * React Hook for Activity Slot Telemetry Collection
 * 
 * Provides a convenient React hook interface for collecting activity slot
 * telemetry events with automatic context tracking and performance monitoring.
 * Integrates with the ActivitySlotTelemetryMapper for unified event handling.
 * 
 * @since NP-016
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import type {
  ActivitySlotTelemetryConfig,
  ActivitySlotContext,
  ActivitySlotTelemetryEvent,
  DragStartPayload,
  DragCompletePayload,
  DragCancelPayload,
  ResidentAssignPayload,
  AssignFailurePayload,
  ValidationCheckPayload,
  PerformanceMetricPayload,
} from '../activitySlotTelemetryMapper';
import { 
  ActivitySlotTelemetryMapper, 
  getActivitySlotTelemetryMapper,
  resetActivitySlotTelemetryMapper 
} from '../activitySlotTelemetryMapper';

/**
 * Hook configuration options
 */
export interface UseActivitySlotTelemetryParams {
  /** Custom telemetry configuration */
  config?: Partial<ActivitySlotTelemetryConfig>;
  /** Whether to enable automatic performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Default context information for events */
  defaultContext?: Partial<ActivitySlotContext>;
  /** Whether to create a new mapper instance or use global */
  useGlobalMapper?: boolean;
}

/**
 * Hook return value
 */
export interface UseActivitySlotTelemetryReturn {
  /** Telemetry mapper instance */
  mapper: ActivitySlotTelemetryMapper;
  
  /** Records a drag start event */
  recordDragStart: (
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    sourceLocation: DragStartPayload['sourceLocation'],
    startPosition: { x: number; y: number },
    context?: Partial<ActivitySlotContext>
  ) => void;
  
  /** Records a drag complete event */
  recordDragComplete: (
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    targetSlot: DragCompletePayload['targetSlot'],
    validationResult: DropValidationResult,
    context?: Partial<ActivitySlotContext>
  ) => void;
  
  /** Records a drag cancel event */
  recordDragCancel: (
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    cancelReason: DragCancelPayload['cancelReason'],
    cancelPosition: { x: number; y: number },
    context?: Partial<ActivitySlotContext>
  ) => void;
  
  /** Records a resident assign event */
  recordResidentAssign: (
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    assignmentMethod: ResidentAssignPayload['assignmentMethod'],
    previousSlotState: ResidentAssignPayload['previousSlotState'],
    newSlotState: ResidentAssignPayload['newSlotState'],
    context?: Partial<ActivitySlotContext>
  ) => void;
  
  /** Records an assign failure event */
  recordAssignFailure: (
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    failureReason: string,
    failedRule: string | undefined,
    targetSlot: AssignFailurePayload['targetSlot'],
    failureContext: AssignFailurePayload['failureContext'],
    context?: Partial<ActivitySlotContext>
  ) => void;
  
  /** Records a validation check event */
  recordValidationCheck: (
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    validationContext: ValidationCheckPayload['validationContext'],
    validationResult: DropValidationResult,
    context?: Partial<ActivitySlotContext>
  ) => void;
  
  /** Records a performance metric event */
  recordPerformanceMetric: (
    slotId: string,
    activity: ActivityDefinition,
    metricType: PerformanceMetricPayload['metricType'],
    value: number,
    unit: PerformanceMetricPayload['unit'],
    context: PerformanceMetricPayload['context'],
    contextOverride?: Partial<ActivitySlotContext>
  ) => void;
  
  /** Gets all collected events */
  getEvents: () => ActivitySlotTelemetryEvent[];
  
  /** Gets events filtered by type */
  getEventsByType: (type: ActivitySlotTelemetryEvent['type']) => ActivitySlotTelemetryEvent[];
  
  /** Gets events filtered by slot ID */
  getEventsBySlot: (slotId: string) => ActivitySlotTelemetryEvent[];
  
  /** Gets events filtered by time range */
  getEventsByTimeRange: (startTime: number, endTime: number) => ActivitySlotTelemetryEvent[];
  
  /** Clears all collected events */
  clearEvents: () => void;
  
  /** Exports events as JSON */
  exportEvents: () => string;
  
  /** Generates event summary */
  generateEventSummary: () => Record<string, unknown>;
  
  /** Updates telemetry configuration */
  updateConfig: (newConfig: Partial<ActivitySlotTelemetryConfig>) => void;
  
  /** Gets current configuration */
  getConfig: () => ActivitySlotTelemetryConfig;
  
  /** Gets current session ID */
  getSessionId: () => string;
}

/**
 * Performance monitoring state
 */
interface PerformanceState {
  dragStartTime: number;
  validationStartTime: number;
  renderStartTime: number;
  operationCounters: Record<string, number>;
}

/**
 * Hook for activity slot telemetry collection
 */
export function useActivitySlotTelemetry(
  params: UseActivitySlotTelemetryParams = {}
): UseActivitySlotTelemetryReturn {
  const { 
    config, 
    enablePerformanceMonitoring = true,
    defaultContext = {},
    useGlobalMapper = true 
  } = params;

  // Create or get mapper instance
  // TODO(style-lab-flexibility): extend mapper config to receive interactionPhysics.audioProfile
  // so telemetry events can log which mass/damping preset triggered the bloom overshoot.
  const mapper = useMemo(() => {
    if (useGlobalMapper) {
      return getActivitySlotTelemetryMapper(config);
    }
    return new ActivitySlotTelemetryMapper(config);
  }, [config, useGlobalMapper]);

  // Performance monitoring state
  const performanceState = useRef<PerformanceState>({
    dragStartTime: 0,
    validationStartTime: 0,
    renderStartTime: 0,
    operationCounters: {},
  });

  // Merge default context with provided context
  const mergeContext = useCallback((context?: Partial<ActivitySlotContext>): ActivitySlotContext => {
    return {
      interactionType: 'drag_drop',
      location: 'main_map',
      inputMethod: 'mouse',
      isRepeatOperation: false,
      sequenceNumber: 0, // Will be set by mapper
      ...defaultContext,
      ...context,
    };
  }, [defaultContext]);

  // Performance monitoring utilities
  const startPerformanceTimer = useCallback((operation: string): number => {
    if (!enablePerformanceMonitoring) return 0;
    performanceState.current.operationCounters[operation] = 
      (performanceState.current.operationCounters[operation] || 0) + 1;
    return performance.now();
  }, [enablePerformanceMonitoring]);

  const endPerformanceTimer = useCallback((
    operation: string, 
    startTime: number,
    slotId: string,
    activity: ActivityDefinition
  ): number => {
    if (!enablePerformanceMonitoring || startTime === 0) return 0;
    const duration = performance.now() - startTime;
    
    // Record performance metric
    mapper.recordPerformanceMetric(
      slotId,
      activity,
      operation as PerformanceMetricPayload['metricType'],
      duration,
      'ms',
      {
        operation,
        component: 'activity_slot',
        userInteraction: true,
        systemLoad: 'low', // Could be determined by actual system load
      },
      mergeContext({ interactionType: 'system' })
    );
    
    return duration;
  }, [enablePerformanceMonitoring, mapper, mergeContext]);

  // Event recording functions with performance monitoring
  const recordDragStart = useCallback((
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    sourceLocation: DragStartPayload['sourceLocation'],
    startPosition: { x: number; y: number },
    context?: Partial<ActivitySlotContext>
  ) => {
    const startTime = startPerformanceTimer('drag_operation');
    performanceState.current.dragStartTime = startTime;
    
    mapper.recordDragStart(
      slotId,
      activity,
      resident,
      sourceLocation,
      startPosition,
      mergeContext(context)
    );
  }, [mapper, mergeContext, startPerformanceTimer]);

  const recordDragComplete = useCallback((
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    targetSlot: DragCompletePayload['targetSlot'],
    validationResult: DropValidationResult,
    context?: Partial<ActivitySlotContext>
  ) => {
    const dragStartTime = performanceState.current.dragStartTime;
    const operationDuration = dragStartTime > 0 
      ? performance.now() - dragStartTime 
      : 0;
    
    mapper.recordDragComplete(
      slotId,
      activity,
      resident,
      targetSlot,
      validationResult,
      operationDuration,
      mergeContext(context)
    );
    
    // Reset drag timer
    performanceState.current.dragStartTime = 0;
  }, [mapper, mergeContext]);

  const recordDragCancel = useCallback((
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    cancelReason: DragCancelPayload['cancelReason'],
    cancelPosition: { x: number; y: number },
    context?: Partial<ActivitySlotContext>
  ) => {
    const dragStartTime = performanceState.current.dragStartTime;
    const dragDuration = dragStartTime > 0 
      ? performance.now() - dragStartTime 
      : 0;
    
    mapper.recordDragCancel(
      slotId,
      activity,
      resident,
      cancelReason,
      cancelPosition,
      dragDuration,
      mergeContext(context)
    );
    
    // Reset drag timer
    performanceState.current.dragStartTime = 0;
  }, [mapper, mergeContext]);

  const recordResidentAssign = useCallback((
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    assignmentMethod: ResidentAssignPayload['assignmentMethod'],
    previousSlotState: ResidentAssignPayload['previousSlotState'],
    newSlotState: ResidentAssignPayload['newSlotState'],
    context?: Partial<ActivitySlotContext>
  ) => {
    const startTime = startPerformanceTimer('assignment_operation');
    
    const assignmentMetrics = {
      processingTime: 0, // Will be calculated below
      validationTime: 0,
      uiUpdateTime: 0,
    };
    
    mapper.recordResidentAssign(
      slotId,
      activity,
      resident,
      assignmentMethod,
      previousSlotState,
      newSlotState,
      assignmentMetrics,
      mergeContext(context)
    );
    
    // Record assignment performance
    endPerformanceTimer('assignment_operation', startTime, slotId, activity);
  }, [mapper, mergeContext, startPerformanceTimer, endPerformanceTimer]);

  const recordAssignFailure = useCallback((
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    failureReason: string,
    failedRule: string | undefined,
    targetSlot: AssignFailurePayload['targetSlot'],
    failureContext: AssignFailurePayload['failureContext'],
    context?: Partial<ActivitySlotContext>
  ) => {
    mapper.recordAssignFailure(
      slotId,
      activity,
      resident,
      failureReason,
      failedRule,
      targetSlot,
      failureContext,
      mergeContext(context)
    );
  }, [mapper, mergeContext]);

  const recordValidationCheck = useCallback((
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    validationContext: ValidationCheckPayload['validationContext'],
    validationResult: DropValidationResult,
    context?: Partial<ActivitySlotContext>
  ) => {
    const startTime = startPerformanceTimer('validation_time');
    
    const validationMetrics = {
      validationTime: 0, // Will be calculated below
      rulesChecked: 1, // Could be determined from validationContext
      rulesPassed: validationResult.isValid ? 1 : 0,
      rulesFailed: validationResult.isValid ? 0 : 1,
    };
    
    mapper.recordValidationCheck(
      slotId,
      activity,
      resident,
      validationContext,
      validationResult,
      validationMetrics,
      mergeContext(context)
    );
    
    // Record validation performance
    endPerformanceTimer('validation_time', startTime, slotId, activity);
  }, [mapper, mergeContext, startPerformanceTimer, endPerformanceTimer]);

  const recordPerformanceMetric = useCallback((
    slotId: string,
    activity: ActivityDefinition,
    metricType: PerformanceMetricPayload['metricType'],
    value: number,
    unit: PerformanceMetricPayload['unit'],
    context: PerformanceMetricPayload['context'],
    contextOverride?: Partial<ActivitySlotContext>
  ) => {
    mapper.recordPerformanceMetric(
      slotId,
      activity,
      metricType,
      value,
      unit,
      context,
      contextOverride
    );
  }, [mapper]);

  // Utility functions
  const getEvents = useCallback(() => mapper.getEvents(), [mapper]);
  const getEventsByType = useCallback((type: ActivitySlotTelemetryEvent['type']) => 
    mapper.getEventsByType(type), [mapper]);
  const getEventsBySlot = useCallback((slotId: string) => 
    mapper.getEventsBySlot(slotId), [mapper]);
  const getEventsByTimeRange = useCallback((startTime: number, endTime: number) => 
    mapper.getEventsByTimeRange(startTime, endTime), [mapper]);
  const clearEvents = useCallback(() => mapper.clearEvents(), [mapper]);
  const exportEvents = useCallback(() => mapper.exportEvents(), [mapper]);
  const generateEventSummary = useCallback(() => mapper.generateEventSummary(), [mapper]);
  const updateConfig = useCallback((newConfig: Partial<ActivitySlotTelemetryConfig>) => 
    mapper.updateConfig(newConfig), [mapper]);
  const getConfig = useCallback(() => mapper.getConfig(), [mapper]);
  const getSessionId = useCallback(() => mapper.getSessionId(), [mapper]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!useGlobalMapper) {
        // Clean up local mapper instance
        mapper.clearEvents();
      }
    };
  }, [mapper, useGlobalMapper]);

  return {
    mapper,
    recordDragStart,
    recordDragComplete,
    recordDragCancel,
    recordResidentAssign,
    recordAssignFailure,
    recordValidationCheck,
    recordPerformanceMetric,
    getEvents,
    getEventsByType,
    getEventsBySlot,
    getEventsByTimeRange,
    clearEvents,
    exportEvents,
    generateEventSummary,
    updateConfig,
    getConfig,
    getSessionId,
  };
}

/**
 * Hook for automatic drag operation telemetry
 * 
 * This hook provides a simplified interface for recording complete drag operations
 * with automatic timing and context tracking.
 */
export interface UseDragTelemetryParams {
  slotId: string;
  activity: ActivityDefinition;
  onDragStart?: (resident: ResidentState, sourceLocation: DragStartPayload['sourceLocation']) => void;
  onDragComplete?: (resident: ResidentState, targetSlot: DragCompletePayload['targetSlot'], validationResult: DropValidationResult) => void;
  onDragCancel?: (resident: ResidentState, cancelReason: DragCancelPayload['cancelReason']) => void;
  context?: Partial<ActivitySlotContext>;
}

export function useDragTelemetry(params: UseDragTelemetryParams): {
  handleDragStart: (resident: ResidentState, sourceLocation: DragStartPayload['sourceLocation'], position: { x: number; y: number }) => void;
  handleDragComplete: (resident: ResidentState, targetSlot: DragCompletePayload['targetSlot'], validationResult: DropValidationResult) => void;
  handleDragCancel: (resident: ResidentState, cancelReason: DragCancelPayload['cancelReason'], position: { x: number; y: number }) => void;
} {
  const { slotId, activity, onDragStart, onDragComplete, onDragCancel, context } = params;
  const telemetry = useActivitySlotTelemetry();

  const handleDragStart = useCallback((
    resident: ResidentState,
    sourceLocation: DragStartPayload['sourceLocation'],
    position: { x: number; y: number }
  ) => {
    telemetry.recordDragStart(slotId, activity, resident, sourceLocation, position, context);
    onDragStart?.(resident, sourceLocation);
  }, [telemetry, slotId, activity, context, onDragStart]);

  const handleDragComplete = useCallback((
    resident: ResidentState,
    targetSlot: DragCompletePayload['targetSlot'],
    validationResult: DropValidationResult
  ) => {
    telemetry.recordDragComplete(slotId, activity, resident, targetSlot, validationResult, context);
    onDragComplete?.(resident, targetSlot, validationResult);
  }, [telemetry, slotId, activity, context, onDragComplete]);

  const handleDragCancel = useCallback((
    resident: ResidentState,
    cancelReason: DragCancelPayload['cancelReason'],
    position: { x: number; y: number }
  ) => {
    telemetry.recordDragCancel(slotId, activity, resident, cancelReason, position, context);
    onDragCancel?.(resident, cancelReason);
  }, [telemetry, slotId, activity, context, onDragCancel]);

  return {
    handleDragStart,
    handleDragComplete,
    handleDragCancel,
  };
}

/**
 * Hook for validation telemetry with automatic performance tracking
 */
export interface UseValidationTelemetryParams {
  slotId: string;
  activity: ActivityDefinition;
  enableDetailedTracking?: boolean;
  context?: Partial<ActivitySlotContext>;
}

export function useValidationTelemetry(params: UseValidationTelemetryParams): {
  recordValidation: (
    resident: ResidentState,
    validationResult: DropValidationResult,
    validationContext?: ValidationCheckPayload['validationContext']
  ) => void;
} {
  const { slotId, activity, enableDetailedTracking = true, context } = params;
  const telemetry = useActivitySlotTelemetry();

  const recordValidation = useCallback((
    resident: ResidentState,
    validationResult: DropValidationResult,
    validationContext?: ValidationCheckPayload['validationContext']
  ) => {
    const defaultValidationContext: ValidationCheckPayload['validationContext'] = {
      checkType: 'pre_assign',
      validationRules: ['availability', 'fatigue', 'capacity', 'stats'],
      strictMode: false,
      ...validationContext,
    };

    telemetry.recordValidationCheck(
      slotId,
      activity,
      resident,
      defaultValidationContext,
      validationResult,
      context
    );
  }, [telemetry, slotId, activity, context]);

  return {
    recordValidation,
  };
}

/**
 * Hook for performance monitoring of activity slots
 */
export interface UsePerformanceTelemetryParams {
  slotId: string;
  activity: ActivityDefinition;
  metricsToTrack?: PerformanceMetricPayload['metricType'][];
  context?: Partial<ActivitySlotContext>;
}

export function usePerformanceTelemetry(params: UsePerformanceTelemetryParams): {
  recordMetric: (
    metricType: PerformanceMetricPayload['metricType'],
    value: number,
    unit: PerformanceMetricPayload['unit'],
    context?: PerformanceMetricPayload['context']
  ) => void;
  startTimer: (operation: string) => number;
  endTimer: (operation: string, startTime: number) => number;
} {
  const { slotId, activity, metricsToTrack = ['validation_time', 'render_time'], context } = params;
  const telemetry = useActivitySlotTelemetry();
  const timers = useRef<Record<string, number>>({});

  const recordMetric = useCallback((
    metricType: PerformanceMetricPayload['metricType'],
    value: number,
    unit: PerformanceMetricPayload['unit'],
    metricContext?: PerformanceMetricPayload['context']
  ) => {
    if (!metricsToTrack.includes(metricType)) return;
    
    telemetry.recordPerformanceMetric(
      slotId,
      activity,
      metricType,
      value,
      unit,
      metricContext || {
        operation: metricType,
        component: 'activity_slot',
        userInteraction: false,
        systemLoad: 'low',
      },
      context
    );
  }, [telemetry, slotId, activity, metricsToTrack, context]);

  const startTimer = useCallback((operation: string): number => {
    const startTime = performance.now();
    timers.current[operation] = startTime;
    return startTime;
  }, []);

  const endTimer = useCallback((operation: string, startTime: number): number => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    recordMetric(operation as PerformanceMetricPayload['metricType'], duration, 'ms', {
      operation,
      component: 'activity_slot',
      userInteraction: false,
      systemLoad: 'low',
    });
    
    delete timers.current[operation];
    return duration;
  }, [recordMetric]);

  return {
    recordMetric,
    startTimer,
    endTimer,
  };
}

/**
 * Hook for batch operation telemetry
 */
export interface UseBatchTelemetryParams {
  batchId?: string;
  operationType: 'bulk_assign' | 'bulk_remove' | 'bulk_reassign' | 'bulk_validate';
  context?: Partial<ActivitySlotContext>;
}

export function useBatchTelemetry(params: UseBatchTelemetryParams): {
  startBatch: (targetSlots: string[], targetResidents: string[]) => void;
  completeBatch: (results: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    skippedOperations: number;
  }) => void;
  recordBatchError: (operationIndex: number, error: Error, residentId?: string, slotId?: string) => void;
} {
  const { batchId, operationType, context } = params;
  const telemetry = useActivitySlotTelemetry();
  const batchState = useRef<{
    startTime: number;
    targetSlots: string[];
    targetResidents: string[];
    errors: Array<{
      operationIndex: number;
      errorType: string;
      errorMessage: string;
      residentId?: string;
      slotId?: string;
    }>;
  }>({
    startTime: 0,
    targetSlots: [],
    targetResidents: [],
    errors: [],
  });

  const startBatch = useCallback((targetSlots: string[], targetResidents: string[]) => {
    batchState.current = {
      startTime: Date.now(),
      targetSlots,
      targetResidents,
      errors: [],
    };

    // Record batch start event would be implemented in the mapper
    // For now, we'll track the start time for completion
  }, []);

  const completeBatch = useCallback((results: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    skippedOperations: number;
  }) => {
    const totalDuration = Date.now() - batchState.current.startTime;
    
    // Record batch complete event would be implemented in the mapper
    // For now, we'll record a performance metric
    telemetry.recordPerformanceMetric(
      'batch_operation',
      {} as ActivityDefinition, // Would need actual activity
      'batch_operation',
      totalDuration,
      'ms',
      {
        operation: operationType,
        component: 'activity_slot',
        userInteraction: true,
        systemLoad: 'low',
      },
      context
    );
  }, [telemetry, operationType, context]);

  const recordBatchError = useCallback((
    operationIndex: number,
    error: Error,
    residentId?: string,
    slotId?: string
  ) => {
    batchState.current.errors.push({
      operationIndex,
      errorType: error.constructor.name,
      errorMessage: error.message,
      residentId,
      slotId,
    });
  }, []);

  return {
    startBatch,
    completeBatch,
    recordBatchError,
  };
}

// Export the main hook as default
export default useActivitySlotTelemetry;
