/**
 * Idle Village Activity Slot Telemetry Mapper
 * 
 * Unified telemetry system for activity slot events including drag operations,
 * assignments, failures, and state changes. Provides structured event mapping
 * with config-first design and comprehensive analytics support.
 * 
 * @since NP-016
 */

import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Base telemetry event structure for all activity slot operations
 */
export interface ActivitySlotTelemetryEvent {
  /** Unique event identifier */
  id: string;
  /** Event timestamp (Unix ms) */
  timestamp: number;
  /** Event type */
  type: ActivitySlotEventType;
  /** Slot identifier */
  slotId: string;
  /** Activity definition */
  activity: ActivityDefinition;
  /** Session identifier for correlation */
  sessionId: string;
  /** User context */
  context: ActivitySlotContext;
  /** Event-specific payload */
  payload: ActivitySlotEventPayload;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Event types for activity slot telemetry
 */
export type ActivitySlotEventType = 
  /** Drag operation started */
  | 'drag_start'
  /** Drag operation completed (successful drop) */
  | 'drag_complete'
  /** Drag operation cancelled/aborted */
  | 'drag_cancel'
  /** Resident assigned to slot */
  | 'resident_assign'
  /** Resident removed from slot */
  | 'resident_remove'
  /** Assignment failed (validation rejected) */
  | 'assign_failure'
  /** Slot state changed */
  | 'slot_state_change'
  /** Slot capacity reached */
  | 'capacity_warning'
  /** Slot locked/unlocked */
  | 'slot_lock_change'
  /** Batch operation started */
  | 'batch_start'
  /** Batch operation completed */
  | 'batch_complete'
  /** Validation check performed */
  | 'validation_check'
  /** Performance metric recorded */
  | 'performance_metric';

/**
 * Context information for telemetry events
 */
export interface ActivitySlotContext {
  /** User interaction context */
  interactionType: 'drag_drop' | 'click_assign' | 'auto_assign' | 'batch_operation' | 'system';
  /** UI location where event occurred */
  location: 'main_map' | 'theater_view' | 'activity_panel' | 'modal_dialog' | 'unknown';
  /** Device/input method */
  inputMethod: 'mouse' | 'touch' | 'keyboard' | 'unknown';
  /** Whether this is a repeat operation */
  isRepeatOperation: boolean;
  /** Operation sequence number */
  sequenceNumber: number;
}

/**
 * Event payloads for different activity slot event types
 */
export type ActivitySlotEventPayload = 
  | DragStartPayload
  | DragCompletePayload
  | DragCancelPayload
  | ResidentAssignPayload
  | ResidentRemovePayload
  | AssignFailurePayload
  | SlotStateChangePayload
  | CapacityWarningPayload
  | SlotLockChangePayload
  | BatchStartPayload
  | BatchCompletePayload
  | ValidationCheckPayload
  | PerformanceMetricPayload;

/**
 * Payload for drag start events
 */
export interface DragStartPayload {
  /** Resident being dragged */
  resident: ResidentState;
  /** Source location */
  sourceLocation: {
    type: 'activity_slot' | 'resident_list' | 'unassigned_pool';
    slotId?: string;
    locationId?: string;
  };
  /** Initial drag position */
  startPosition: { x: number; y: number };
  /** Drag preview state */
  previewState: 'created' | 'failed' | 'pending';
}

/**
 * Payload for drag complete events
 */
export interface DragCompletePayload {
  /** Resident that was dragged */
  resident: ResidentState;
  /** Target slot information */
  targetSlot: {
    slotId: string;
    previousOccupants: number;
    newOccupants: number;
    wasEmpty: boolean;
  };
  /** Validation result */
  validationResult: DropValidationResult;
  /** Operation duration */
  operationDuration: number;
  /** Success metrics */
  successMetrics: {
    wasSuccessful: boolean;
    failureReason?: string;
    retryCount?: number;
  };
}

/**
 * Payload for drag cancel events
 */
export interface DragCancelPayload {
  /** Resident that was being dragged */
  resident: ResidentState;
  /** Cancel reason */
  cancelReason: 'user_abort' | 'validation_failure' | 'timeout' | 'system_interrupt';
  /** Cancel position */
  cancelPosition: { x: number; y: number };
  /** Drag duration before cancel */
  dragDuration: number;
  /** Target slot if applicable */
  targetSlotId?: string;
}

/**
 * Payload for resident assign events
 */
export interface ResidentAssignPayload {
  /** Assigned resident */
  resident: ResidentState;
  /** Assignment method */
  assignmentMethod: 'drag_drop' | 'click_assign' | 'auto_assign' | 'batch_operation';
  /** Slot state before assignment */
  previousSlotState: {
    occupants: number;
    residentIds: string[];
    wasLocked: boolean;
  };
  /** Slot state after assignment */
  newSlotState: {
    occupants: number;
    residentIds: string[];
    isLocked: boolean;
  };
  /** Assignment metrics */
  assignmentMetrics: {
    processingTime: number;
    validationTime: number;
    uiUpdateTime: number;
  };
}

/**
 * Payload for resident remove events
 */
export interface ResidentRemovePayload {
  /** Removed resident */
  resident: ResidentState;
  /** Removal method */
  removalMethod: 'drag_out' | 'click_remove' | 'auto_remove' | 'batch_operation';
  /** Reason for removal */
  removalReason: 'user_action' | 'fatigue' | 'activity_complete' | 'system_reassign';
  /** Slot state after removal */
  newSlotState: {
    occupants: number;
    residentIds: string[];
    isLocked: boolean;
  };
  /** Removal metrics */
  removalMetrics: {
    processingTime: number;
    cleanupTime: number;
  };
}

/**
 * Payload for assign failure events
 */
export interface AssignFailurePayload {
  /** Resident that failed to assign */
  resident: ResidentState;
  /** Failure reason */
  failureReason: string;
  /** Validation rule that failed */
  failedRule?: string;
  /** Target slot information */
  targetSlot: {
    slotId: string;
    currentOccupants: number;
    maxOccupants: number;
    isLocked: boolean;
  };
  /** Failure context */
  failureContext: {
    validationTime: number;
    errorMessage?: string;
    suggestedAction?: string;
    isRetryable: boolean;
  };
}

/**
 * Payload for slot state change events
 */
export interface SlotStateChangePayload {
  /** Previous state */
  previousState: {
    occupants: number;
    isLocked: boolean;
    activityStatus: 'idle' | 'active' | 'completed' | 'paused';
  };
  /** New state */
  newState: {
    occupants: number;
    isLocked: boolean;
    activityStatus: 'idle' | 'active' | 'completed' | 'paused';
  };
  /** Change trigger */
  trigger: 'resident_assign' | 'resident_remove' | 'activity_complete' | 'system' | 'user_action';
  /** State transition metrics */
  transitionMetrics: {
    transitionTime: number;
    wasImmediate: boolean;
    hadSideEffects: boolean;
  };
}

/**
 * Payload for capacity warning events
 */
export interface CapacityWarningPayload {
  /** Current capacity usage */
  currentUsage: {
    occupants: number;
    maxOccupants: number;
    utilizationPercentage: number;
  };
  /** Warning level */
  warningLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Warning context */
  context: {
    triggeredBy: 'resident_assign' | 'batch_operation' | 'system_check';
    remainingSlots: number;
    suggestedActions: string[];
  };
}

/**
 * Payload for slot lock change events
 */
export interface SlotLockChangePayload {
  /** Previous lock state */
  previousLockState: boolean;
  /** New lock state */
  newLockState: boolean;
  /** Lock change reason */
  reason: 'activity_complete' | 'user_action' | 'system_lock' | 'emergency' | 'maintenance';
  /** Lock change context */
  context: {
    triggeredBy: string;
    affectedResidents: string[];
    duration?: number; // For temporary locks
    autoUnlock?: boolean;
  };
}

/**
 * Payload for batch start events
 */
export interface BatchStartPayload {
  /** Batch operation type */
  operationType: 'bulk_assign' | 'bulk_remove' | 'bulk_reassign' | 'bulk_validate';
  /** Batch size */
  batchSize: number;
  /** Target slots */
  targetSlots: string[];
  /** Target residents */
  targetResidents: string[];
  /** Batch configuration */
  batchConfig: {
    validationMode: 'strict' | 'lenient' | 'skip';
    failureMode: 'stop_on_first' | 'continue_on_error' | 'collect_all';
    progressReporting: boolean;
  };
}

/**
 * Payload for batch complete events
 */
export interface BatchCompletePayload {
  /** Batch operation results */
  results: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    skippedOperations: number;
  };
  /** Batch performance metrics */
  performanceMetrics: {
    totalDuration: number;
    averageOperationTime: number;
    fastestOperation: number;
    slowestOperation: number;
    throughput: number; // operations per second
  };
  /** Batch errors */
  errors: Array<{
    operationIndex: number;
    errorType: string;
    errorMessage: string;
    residentId?: string;
    slotId?: string;
  }>;
}

/**
 * Payload for validation check events
 */
export interface ValidationCheckPayload {
  /** Resident being validated */
  resident: ResidentState;
  /** Validation context */
  validationContext: {
    checkType: 'pre_assign' | 'post_assign' | 'periodic' | 'user_triggered';
    validationRules: string[];
    strictMode: boolean;
  };
  /** Validation result */
  validationResult: DropValidationResult;
  /** Validation metrics */
  validationMetrics: {
    validationTime: number;
    rulesChecked: number;
    rulesPassed: number;
    rulesFailed: number;
  };
}

/**
 * Payload for performance metric events
 */
export interface PerformanceMetricPayload {
  /** Metric type */
  metricType: 'render_time' | 'validation_time' | 'animation_time' | 'memory_usage' | 'cpu_usage';
  /** Metric value */
  value: number;
  /** Metric unit */
  unit: 'ms' | 'bytes' | 'percentage' | 'count';
  /** Performance context */
  context: {
    operation: string;
    component: string;
    userInteraction: boolean;
    systemLoad: 'low' | 'medium' | 'high';
  };
  /** Performance thresholds */
  thresholds: {
    warning: number;
    critical: number;
    optimal: number;
  };
}

/**
 * Telemetry event mapper configuration
 */
export interface ActivitySlotTelemetryConfig {
  /** Whether to enable telemetry collection */
  enabled: boolean;
  /** Event types to collect */
  eventTypes: ActivitySlotEventType[];
  /** Sampling rate for events (0.0 to 1.0) */
  samplingRate: number;
  /** Maximum events to retain in memory */
  maxEventsInMemory: number;
  /** Whether to persist events to storage */
  persistToStorage: boolean;
  /** Storage key for persistence */
  storageKey: string;
  /** Whether to include detailed payloads */
  includeDetailedPayloads: boolean;
  /** Performance thresholds */
  performanceThresholds: {
    validationTime: { warning: number; critical: number };
    renderTime: { warning: number; critical: number };
    memoryUsage: { warning: number; critical: number };
  };
}

/**
 * Default telemetry configuration
 */
export const DEFAULT_ACTIVITY_SLOT_TELEMETRY_CONFIG: ActivitySlotTelemetryConfig = {
  enabled: true,
  eventTypes: [
    'drag_start',
    'drag_complete', 
    'drag_cancel',
    'resident_assign',
    'resident_remove',
    'assign_failure',
    'slot_state_change',
    'capacity_warning',
    'validation_check',
    'performance_metric',
  ],
  samplingRate: 1.0, // Collect all events
  maxEventsInMemory: 1000,
  persistToStorage: false,
  storageKey: 'idle-village-activity-slot-telemetry',
  includeDetailedPayloads: true,
  performanceThresholds: {
    validationTime: { warning: 50, critical: 100 }, // ms
    renderTime: { warning: 16, critical: 33 }, // ms (60fps/30fps)
    memoryUsage: { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 }, // bytes
  },
};

/**
 * Activity slot telemetry mapper class
 */
export class ActivitySlotTelemetryMapper {
  private config: ActivitySlotTelemetryConfig;
  private diagnostics: ReturnType<typeof createSandboxDiagnostics>;
  private eventBuffer: ActivitySlotTelemetryEvent[] = [];
  private sessionId: string;
  private sequenceCounter: number = 0;

  constructor(config: Partial<ActivitySlotTelemetryConfig> = {}) {
    this.config = { ...DEFAULT_ACTIVITY_SLOT_TELEMETRY_CONFIG, ...config };
    this.diagnostics = createSandboxDiagnostics('activity-slot-telemetry', 'validators');
    this.sessionId = this.generateSessionId();
    
    // Initialize event buffer
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      this.loadEventsFromStorage();
    }
  }

  /**
   * Generates a unique session identifier
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique event identifier
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets the next sequence number for events
   */
  private getNextSequenceNumber(): number {
    return ++this.sequenceCounter;
  }

  /**
   * Determines if an event should be sampled based on configuration
   */
  private shouldSampleEvent(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  /**
   * Creates a base telemetry event
   */
  private createBaseEvent(
    type: ActivitySlotEventType,
    slotId: string,
    activity: ActivityDefinition,
    context: ActivitySlotContext,
    payload: ActivitySlotEventPayload,
    metadata?: Record<string, unknown>
  ): ActivitySlotTelemetryEvent {
    return {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      slotId,
      activity,
      sessionId: this.sessionId,
      context,
      payload,
      metadata,
    };
  }

  /**
   * Adds an event to the telemetry buffer
   */
  private addEvent(event: ActivitySlotTelemetryEvent): void {
    if (!this.config.enabled) {
      return;
    }

    if (!this.shouldSampleEvent()) {
      return;
    }

    // Apply payload filtering if configured
    if (!this.config.includeDetailedPayloads) {
      event.payload = this.stripPayloadDetails(event.payload);
    }

    this.eventBuffer.push(event);

    // Maintain buffer size limit
    if (this.eventBuffer.length > this.config.maxEventsInMemory) {
      this.eventBuffer.shift();
    }

    // Persist to storage if configured
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      this.saveEventsToStorage();
    }

    // Log to diagnostics
    this.diagnostics.info('activity_slot_telemetry_event', {
      eventType: event.type,
      slotId: event.slotId,
      sessionId: event.sessionId,
      sequenceNumber: event.context.sequenceNumber,
    }, ['telemetry', 'activity_slot']);
  }

  /**
   * Strips detailed information from payloads for privacy/storage optimization
   */
  private stripPayloadDetails(payload: ActivitySlotEventPayload): ActivitySlotEventPayload {
    // Create a simplified version of the payload
    const stripped = { ...payload };

    // Remove sensitive or large data fields
    if ('resident' in stripped) {
      (stripped as any).resident = {
        id: stripped.resident.id,
        displayName: stripped.resident.displayName,
        // Remove detailed stats and other sensitive data
      };
    }

    return stripped;
  }

  /**
   * Loads events from browser storage
   */
  private loadEventsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.eventBuffer = data.events || [];
        this.sessionId = data.sessionId || this.sessionId;
        this.sequenceCounter = data.sequenceCounter || 0;
      }
    } catch (error) {
      this.diagnostics.warn('failed_to_load_telemetry_from_storage', { error: String(error) });
    }
  }

  /**
   * Saves events to browser storage
   */
  private saveEventsToStorage(): void {
    try {
      const data = {
        sessionId: this.sessionId,
        sequenceCounter: this.sequenceCounter,
        events: this.eventBuffer,
        lastSaved: Date.now(),
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      this.diagnostics.warn('failed_to_save_telemetry_to_storage', { error: String(error) });
    }
  }

  /**
   * Records a drag start event
   */
  public recordDragStart(
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    sourceLocation: DragStartPayload['sourceLocation'],
    startPosition: { x: number; y: number },
    context: Partial<ActivitySlotContext> = {}
  ): void {
    const fullContext: ActivitySlotContext = {
      interactionType: 'drag_drop',
      location: 'main_map',
      inputMethod: 'mouse',
      isRepeatOperation: false,
      sequenceNumber: this.getNextSequenceNumber(),
      ...context,
    };

    const payload: DragStartPayload = {
      resident,
      sourceLocation,
      startPosition,
      previewState: 'created',
    };

    const event = this.createBaseEvent('drag_start', slotId, activity, fullContext, payload);
    this.addEvent(event);
  }

  /**
   * Records a drag complete event
   */
  public recordDragComplete(
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    targetSlot: DragCompletePayload['targetSlot'],
    validationResult: DropValidationResult,
    operationDuration: number,
    context: Partial<ActivitySlotContext> = {}
  ): void {
    const fullContext: ActivitySlotContext = {
      interactionType: 'drag_drop',
      location: 'main_map',
      inputMethod: 'mouse',
      isRepeatOperation: false,
      sequenceNumber: this.getNextSequenceNumber(),
      ...context,
    };

    const payload: DragCompletePayload = {
      resident,
      targetSlot,
      validationResult,
      operationDuration,
      successMetrics: {
        wasSuccessful: validationResult.isValid,
        failureReason: validationResult.failedRule ? validationResult.message : undefined,
      },
    };

    const event = this.createBaseEvent('drag_complete', slotId, activity, fullContext, payload);
    this.addEvent(event);
  }

  /**
   * Records a drag cancel event
   */
  public recordDragCancel(
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    cancelReason: DragCancelPayload['cancelReason'],
    cancelPosition: { x: number; y: number },
    dragDuration: number,
    context: Partial<ActivitySlotContext> = {}
  ): void {
    const fullContext: ActivitySlotContext = {
      interactionType: 'drag_drop',
      location: 'main_map',
      inputMethod: 'mouse',
      isRepeatOperation: false,
      sequenceNumber: this.getNextSequenceNumber(),
      ...context,
    };

    const payload: DragCancelPayload = {
      resident,
      cancelReason,
      cancelPosition,
      dragDuration,
    };

    const event = this.createBaseEvent('drag_cancel', slotId, activity, fullContext, payload);
    this.addEvent(event);
  }

  /**
   * Records a resident assign event
   */
  public recordResidentAssign(
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    assignmentMethod: ResidentAssignPayload['assignmentMethod'],
    previousSlotState: ResidentAssignPayload['previousSlotState'],
    newSlotState: ResidentAssignPayload['newSlotState'],
    assignmentMetrics: ResidentAssignPayload['assignmentMetrics'],
    context: Partial<ActivitySlotContext> = {}
  ): void {
    const fullContext: ActivitySlotContext = {
      interactionType: assignmentMethod === 'drag_drop' ? 'drag_drop' : 'click_assign',
      location: 'main_map',
      inputMethod: assignmentMethod === 'drag_drop' ? 'mouse' : 'unknown',
      isRepeatOperation: false,
      sequenceNumber: this.getNextSequenceNumber(),
      ...context,
    };

    const payload: ResidentAssignPayload = {
      resident,
      assignmentMethod,
      previousSlotState,
      newSlotState,
      assignmentMetrics,
    };

    const event = this.createBaseEvent('resident_assign', slotId, activity, fullContext, payload);
    this.addEvent(event);
  }

  /**
   * Records an assign failure event
   */
  public recordAssignFailure(
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    failureReason: string,
    failedRule: string | undefined,
    targetSlot: AssignFailurePayload['targetSlot'],
    failureContext: AssignFailurePayload['failureContext'],
    context: Partial<ActivitySlotContext> = {}
  ): void {
    const fullContext: ActivitySlotContext = {
      interactionType: 'drag_drop',
      location: 'main_map',
      inputMethod: 'mouse',
      isRepeatOperation: false,
      sequenceNumber: this.getNextSequenceNumber(),
      ...context,
    };

    const payload: AssignFailurePayload = {
      resident,
      failureReason,
      failedRule,
      targetSlot,
      failureContext,
    };

    const event = this.createBaseEvent('assign_failure', slotId, activity, fullContext, payload);
    this.addEvent(event);
  }

  /**
   * Records a validation check event
   */
  public recordValidationCheck(
    slotId: string,
    activity: ActivityDefinition,
    resident: ResidentState,
    validationContext: ValidationCheckPayload['validationContext'],
    validationResult: DropValidationResult,
    validationMetrics: ValidationCheckPayload['validationMetrics'],
    context: Partial<ActivitySlotContext> = {}
  ): void {
    const fullContext: ActivitySlotContext = {
      interactionType: 'system',
      location: 'main_map',
      inputMethod: 'unknown',
      isRepeatOperation: false,
      sequenceNumber: this.getNextSequenceNumber(),
      ...context,
    };

    const payload: ValidationCheckPayload = {
      resident,
      validationContext,
      validationResult,
      validationMetrics,
    };

    const event = this.createBaseEvent('validation_check', slotId, activity, fullContext, payload);
    this.addEvent(event);
  }

  /**
   * Records a performance metric event
   */
  public recordPerformanceMetric(
    slotId: string,
    activity: ActivityDefinition,
    metricType: PerformanceMetricPayload['metricType'],
    value: number,
    unit: PerformanceMetricPayload['unit'],
    context: PerformanceMetricPayload['context'],
    contextOverride?: Partial<ActivitySlotContext>
  ): void {
    const fullContext: ActivitySlotContext = {
      interactionType: 'system',
      location: 'main_map',
      inputMethod: 'unknown',
      isRepeatOperation: false,
      sequenceNumber: this.getNextSequenceNumber(),
      ...contextOverride,
    };

    const payload: PerformanceMetricPayload = {
      metricType,
      value,
      unit,
      context,
      thresholds: this.config.performanceThresholds[metricType] || {
        warning: value * 1.5,
        critical: value * 2,
        optimal: value * 0.8,
      },
    };

    const event = this.createBaseEvent('performance_metric', slotId, activity, fullContext, payload);
    this.addEvent(event);
  }

  /**
   * Gets all collected events
   */
  public getEvents(): ActivitySlotTelemetryEvent[] {
    return [...this.eventBuffer];
  }

  /**
   * Gets events filtered by type
   */
  public getEventsByType(type: ActivitySlotEventType): ActivitySlotTelemetryEvent[] {
    return this.eventBuffer.filter(event => event.type === type);
  }

  /**
   * Gets events filtered by slot ID
   */
  public getEventsBySlot(slotId: string): ActivitySlotTelemetryEvent[] {
    return this.eventBuffer.filter(event => event.slotId === slotId);
  }

  /**
   * Gets events filtered by time range
   */
  public getEventsByTimeRange(startTime: number, endTime: number): ActivitySlotTelemetryEvent[] {
    return this.eventBuffer.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Gets events filtered by session ID
   */
  public getEventsBySession(sessionId: string): ActivitySlotTelemetryEvent[] {
    return this.eventBuffer.filter(event => event.sessionId === sessionId);
  }

  /**
   * Clears all collected events
   */
  public clearEvents(): void {
    this.eventBuffer = [];
    this.sequenceCounter = 0;
    this.sessionId = this.generateSessionId();
    
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }

    this.diagnostics.info('activity_slot_telemetry_cleared', { 
      newSessionId: this.sessionId 
    }, ['telemetry', 'activity_slot']);
  }

  /**
   * Exports events as JSON
   */
  public exportEvents(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      config: this.config,
      events: this.eventBuffer,
      summary: this.generateEventSummary(),
    }, null, 2);
  }

  /**
   * Generates a summary of collected events
   */
  public generateEventSummary(): Record<string, unknown> {
    const summary = {
      totalEvents: this.eventBuffer.length,
      sessionDuration: this.eventBuffer.length > 0 
        ? this.eventBuffer[this.eventBuffer.length - 1].timestamp - this.eventBuffer[0].timestamp
        : 0,
      eventsByType: {} as Record<string, number>,
      eventsBySlot: {} as Record<string, number>,
      averageEventsPerMinute: 0,
      performanceMetrics: {
        averageValidationTime: 0,
        averageRenderTime: 0,
        slowestOperation: 0,
        fastestOperation: Infinity,
      },
    };

    // Count events by type
    this.eventBuffer.forEach(event => {
      summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;
      summary.eventsBySlot[event.slotId] = (summary.eventsBySlot[event.slotId] || 0) + 1;

      // Extract performance metrics
      if (event.type === 'performance_metric') {
        const payload = event.payload as PerformanceMetricPayload;
        if (payload.metricType === 'validation_time') {
          summary.performanceMetrics.averageValidationTime += payload.value;
        } else if (payload.metricType === 'render_time') {
          summary.performanceMetrics.averageRenderTime += payload.value;
        }
        summary.performanceMetrics.slowestOperation = Math.max(
          summary.performanceMetrics.slowestOperation, 
          payload.value
        );
        summary.performanceMetrics.fastestOperation = Math.min(
          summary.performanceMetrics.fastestOperation, 
          payload.value
        );
      }
    });

    // Calculate averages
    const performanceEvents = this.eventBuffer.filter(e => e.type === 'performance_metric');
    if (performanceEvents.length > 0) {
      summary.performanceMetrics.averageValidationTime /= performanceEvents.length;
      summary.performanceMetrics.averageRenderTime /= performanceEvents.length;
    }

    // Calculate events per minute
    if (summary.sessionDuration > 0) {
      summary.averageEventsPerMinute = (summary.totalEvents / summary.sessionDuration) * 60000;
    }

    return summary;
  }

  /**
   * Updates the telemetry configuration
   */
  public updateConfig(newConfig: Partial<ActivitySlotTelemetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.diagnostics.info('activity_slot_telemetry_config_updated', { 
      config: this.config 
    }, ['telemetry', 'activity_slot']);
  }

  /**
   * Gets the current configuration
   */
  public getConfig(): ActivitySlotTelemetryConfig {
    return { ...this.config };
  }

  /**
   * Gets the current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * Global telemetry mapper instance
 */
let globalTelemetryMapper: ActivitySlotTelemetryMapper | null = null;

/**
 * Gets or creates the global telemetry mapper instance
 */
export function getActivitySlotTelemetryMapper(
  config?: Partial<ActivitySlotTelemetryConfig>
): ActivitySlotTelemetryMapper {
  if (!globalTelemetryMapper) {
    globalTelemetryMapper = new ActivitySlotTelemetryMapper(config);
  }
  return globalTelemetryMapper;
}

/**
 * Resets the global telemetry mapper instance
 */
export function resetActivitySlotTelemetryMapper(): void {
  globalTelemetryMapper = null;
}
