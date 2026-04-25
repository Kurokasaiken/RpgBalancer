/**
 * Idle Village Activity Slots Analytics Module
 * 
 * Central analytics system for activity slot telemetry events including drag operations,
 * assignments, failures, and performance metrics. Provides unified event handling
 * with config-first design and comprehensive KPI tracking.
 * 
 * @since NP-016
 */

import { z } from 'zod';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const _diagnostics = createHeadlessDiagnostics('idleVillageActivitySlots', 'analytics');

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
  /** Resident assignment failed */
  | 'assign_failure'
  /** Validation check performed */
  | 'validation_check'
  /** Performance metric collected */
  | 'performance_metric'
  /** Fatigue state changed */
  | 'fatigue_change'
  /** Slot state changed */
  | 'slot_state_change';

/**
 * User context for telemetry events
 */
export interface ActivitySlotContext {
  /** Current session identifier */
  sessionId: string;
  /** User identifier (if available) */
  userId?: string;
  /** Current game phase */
  gamePhase: string;
  /** Current time unit */
  currentTimeUnit: number;
  /** Village state snapshot */
  villageState: {
    totalResidents: number;
    activeResidents: number;
    totalSlots: number;
    occupiedSlots: number;
  };
  /** Device/browser information */
  deviceInfo?: {
    userAgent: string;
    viewport: { width: number; height: number };
    isMobile: boolean;
  };
}

/**
 * Payload for drag start events
 */
export interface DragStartPayload {
  /** Resident being dragged */
  resident: ResidentState;
  /** Source slot/location */
  sourceSlotId?: string;
  /** Drag start coordinates */
  startPosition: { x: number; y: number };
  /** Drag operation type */
  dragType: 'resident_to_slot' | 'slot_to_slot' | 'resident_unassigned';
}

/**
 * Payload for drag complete events
 */
export interface DragCompletePayload {
  /** Resident that was dragged */
  resident: ResidentState;
  /** Target slot where resident was dropped */
  targetSlotId: string;
  /** Drop coordinates */
  dropPosition: { x: number; y: number };
  /** Total drag duration in ms */
  dragDuration: number;
  /** Whether the drop was successful */
  wasSuccessful: boolean;
  /** Validation result */
  validationResult?: DropValidationResult;
}

/**
 * Payload for drag cancel events
 */
export interface DragCancelPayload {
  /** Resident that was being dragged */
  resident: ResidentState;
  /** Reason for cancellation */
  reason: 'user_cancel' | 'invalid_target' | 'timeout' | 'system_error';
  /** Drag duration before cancellation */
  dragDuration: number;
  /** Last known position */
  lastPosition: { x: number; y: number };
}

/**
 * Payload for resident assignment events
 */
export interface ResidentAssignPayload {
  /** Assigned resident */
  resident: ResidentState;
  /** Previous slot (if any) */
  previousSlotId?: string;
  /** Assignment reason */
  assignmentReason: 'drag_drop' | 'auto_assign' | 'system_assign';
  /** Assignment duration in ms */
  assignmentDuration: number;
}

/**
 * Payload for assignment failure events
 */
export interface AssignFailurePayload {
  /** Resident that failed to assign */
  resident: ResidentState;
  /** Failure reason */
  failureReason: string;
  /** Validation rule that failed */
  validationRule?: string;
  /** Target slot */
  targetSlotId: string;
  /** Attempt timestamp */
  attemptTimestamp: number;
}

/**
 * Payload for validation check events
 */
export interface ValidationCheckPayload {
  /** Resident being validated */
  resident: ResidentState;
  /** Target slot */
  targetSlotId: string;
  /** Validation result */
  validationResult: DropValidationResult;
  /** Validation duration in ms */
  validationDuration: number;
  /** Validation context */
  validationContext: {
    isDragOperation: boolean;
    isAutoAssignment: boolean;
    forcedAssignment: boolean;
  };
}

/**
 * Payload for performance metric events
 */
export interface PerformanceMetricPayload {
  /** Metric name */
  metricName: string;
  /** Metric value */
  value: number;
  /** Metric unit */
  unit: 'ms' | 'fps' | 'bytes' | 'count' | 'percentage';
  /** Metric category */
  category: 'render' | 'interaction' | 'validation' | 'persistence' | 'network';
  /** Threshold for performance alerts */
  threshold?: number;
  /** Whether metric exceeds threshold */
  isAlert: boolean;
}

/**
 * Payload for fatigue change events
 */
export interface FatigueChangePayload {
  /** Affected resident */
  resident: ResidentState;
  /** Previous fatigue level */
  previousFatigue: number;
  /** New fatigue level */
  newFatigue: number;
  /** Fatigue change reason */
  changeReason: 'activity_completion' | 'assignment' | 'rest' | 'injury' | 'system_adjustment';
  /** Fatigue threshold crossed (if any) */
  thresholdCrossed?: {
    threshold: number;
    crossed: 'above' | 'below';
  };
}

/**
 * Payload for slot state change events
 */
export interface SlotStateChangePayload {
  /** Previous state */
  previousState: {
    isOccupied: boolean;
    assignedResidentId?: string;
    isActive: boolean;
    progress: number;
  };
  /** New state */
  newState: {
    isOccupied: boolean;
    assignedResidentId?: string;
    isActive: boolean;
    progress: number;
  };
  /** Change reason */
  changeReason: 'assignment' | 'completion' | 'cancellation' | 'phase_change' | 'system_update';
  /** Change duration in ms */
  changeDuration: number;
}

/**
 * Union type for all event payloads
 */
export type ActivitySlotEventPayload = 
  | DragStartPayload
  | DragCompletePayload
  | DragCancelPayload
  | ResidentAssignPayload
  | AssignFailurePayload
  | ValidationCheckPayload
  | PerformanceMetricPayload
  | FatigueChangePayload
  | SlotStateChangePayload;

/**
 * Zod schemas for validation
 */
export const ActivitySlotContextSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  gamePhase: z.string(),
  currentTimeUnit: z.number(),
  villageState: z.object({
    totalResidents: z.number(),
    activeResidents: z.number(),
    totalSlots: z.number(),
    occupiedSlots: z.number(),
  }),
  deviceInfo: z.object({
    userAgent: z.string(),
    viewport: z.object({ width: z.number(), height: z.number() }),
    isMobile: z.boolean(),
  }).optional(),
});

export const DragStartPayloadSchema = z.object({
  resident: z.any(), // ResidentState - complex object
  sourceSlotId: z.string().optional(),
  startPosition: z.object({ x: z.number(), y: z.number() }),
  dragType: z.enum(['resident_to_slot', 'slot_to_slot', 'resident_unassigned']),
});

export const DragCompletePayloadSchema = z.object({
  resident: z.any(),
  targetSlotId: z.string(),
  dropPosition: z.object({ x: z.number(), y: z.number() }),
  dragDuration: z.number(),
  wasSuccessful: z.boolean(),
  validationResult: z.any().optional(),
});

export const DragCancelPayloadSchema = z.object({
  resident: z.any(),
  reason: z.enum(['user_cancel', 'invalid_target', 'timeout', 'system_error']),
  dragDuration: z.number(),
  lastPosition: z.object({ x: z.number(), y: z.number() }),
});

export const ResidentAssignPayloadSchema = z.object({
  resident: z.any(),
  previousSlotId: z.string().optional(),
  assignmentReason: z.enum(['drag_drop', 'auto_assign', 'system_assign']),
  assignmentDuration: z.number(),
});

export const AssignFailurePayloadSchema = z.object({
  resident: z.any(),
  failureReason: z.string(),
  validationRule: z.string().optional(),
  targetSlotId: z.string(),
  attemptTimestamp: z.number(),
});

export const ValidationCheckPayloadSchema = z.object({
  resident: z.any(),
  targetSlotId: z.string(),
  validationResult: z.any(),
  validationDuration: z.number(),
  validationContext: z.object({
    isDragOperation: z.boolean(),
    isAutoAssignment: z.boolean(),
    forcedAssignment: z.boolean(),
  }),
});

export const PerformanceMetricPayloadSchema = z.object({
  metricName: z.string(),
  value: z.number(),
  unit: z.enum(['ms', 'fps', 'bytes', 'count', 'percentage']),
  category: z.enum(['render', 'interaction', 'validation', 'persistence', 'network']),
  threshold: z.number().optional(),
  isAlert: z.boolean(),
});

export const FatigueChangePayloadSchema = z.object({
  resident: z.any(),
  previousFatigue: z.number(),
  newFatigue: z.number(),
  changeReason: z.enum(['activity_completion', 'assignment', 'rest', 'injury', 'system_adjustment']),
  thresholdCrossed: z.object({
    threshold: z.number(),
    crossed: z.enum(['above', 'below']),
  }).optional(),
});

export const SlotStateChangePayloadSchema = z.object({
  previousState: z.object({
    isOccupied: z.boolean(),
    assignedResidentId: z.string().optional(),
    isActive: z.boolean(),
    progress: z.number(),
  }),
  newState: z.object({
    isOccupied: z.boolean(),
    assignedResidentId: z.string().optional(),
    isActive: z.boolean(),
    progress: z.number(),
  }),
  changeReason: z.enum(['assignment', 'completion', 'cancellation', 'phase_change', 'system_update']),
  changeDuration: z.number(),
});

export const ActivitySlotTelemetryEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: z.enum([
    'drag_start',
    'drag_complete',
    'drag_cancel',
    'resident_assign',
    'assign_failure',
    'validation_check',
    'performance_metric',
    'fatigue_change',
    'slot_state_change',
  ]),
  slotId: z.string(),
  activity: z.any(), // ActivityDefinition - complex object
  sessionId: z.string(),
  context: ActivitySlotContextSchema,
  payload: z.any(), // Complex union type - runtime validation handled by specific event types
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Configuration for activity slot telemetry
 */
export interface ActivitySlotTelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Event types to track */
  trackedEventTypes: ActivitySlotEventType[];
  /** Sampling rate for events (0.0 to 1.0) */
  samplingRate: number;
  /** Maximum events to buffer before flush */
  maxBufferSize: number;
  /** Flush interval in ms */
  flushInterval: number;
  /** Performance thresholds */
  performanceThresholds: {
    dragDuration: number; // ms
    validationDuration: number; // ms
    renderTime: number; // ms
    interactionLatency: number; // ms
  };
  /** Whether to include verbose logging */
  verboseLogging: boolean;
}

/**
 * Default telemetry configuration
 */
export const DEFAULT_ACTIVITY_SLOT_TELEMETRY_CONFIG: ActivitySlotTelemetryConfig = {
  enabled: true,
  trackedEventTypes: [
    'drag_start',
    'drag_complete',
    'drag_cancel',
    'resident_assign',
    'assign_failure',
    'validation_check',
    'performance_metric',
    'fatigue_change',
    'slot_state_change',
  ],
  samplingRate: 1.0,
  maxBufferSize: 100,
  flushInterval: 5000,
  performanceThresholds: {
    dragDuration: 2000, // 2 seconds
    validationDuration: 100, // 100ms
    renderTime: 16, // 60fps
    interactionLatency: 100, // 100ms
  },
  verboseLogging: false,
};

/**
 * Type exports
 */
export type ActivitySlotTelemetryConfigType = z.infer<typeof ActivitySlotTelemetryEventSchema>;
export type ActivitySlotContextType = z.infer<typeof ActivitySlotContextSchema>;
