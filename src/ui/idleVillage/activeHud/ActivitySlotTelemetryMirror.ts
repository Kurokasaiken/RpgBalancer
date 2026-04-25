/**
 * NP-102 ActivitySlot Telemetry Mirror
 * 
 * Config-first telemetry schema for ActivitySlot (Phase 12) synchronized with UI store.
 * Provides comprehensive telemetry tracking for slot states, resident assignments, and drop results.
 * 
 * @author Helix-Idle – Activity Telemetry
 * @since 2026-01-21
 */

import { z } from 'zod';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';

/**
 * Core ActivitySlot telemetry event types
 */
export const ACTIVITYSLOT_TELEMETRY_EVENTS = {
  SLOT_STATE_CHANGED: 'iv_activityslot_state_changed',
  RESIDENT_ASSIGNED: 'iv_activityslot_resident_assigned',
  RESIDENT_REMOVED: 'iv_activityslot_resident_removed',
  DROP_ATTEMPTED: 'iv_activityslot_drop_attempted',
  DROP_VALIDATED: 'iv_activityslot_drop_validated',
  DROP_FAILED: 'iv_activityslot_drop_failed',
  PROGRESS_UPDATED: 'iv_activityslot_progress_updated',
  ACTIVITY_COMPLETED: 'iv_activityslot_completed',
  BATCH_STATE_SYNC: 'iv_activityslot_batch_sync',
  MIRROR_ACTIVE: 'iv_activityslot_mirror_active',
} as const;

export type ActivitySlotTelemetryEventType = typeof ACTIVITYSLOT_TELEMETRY_EVENTS[keyof typeof ACTIVITYSLOT_TELEMETRY_EVENTS];

/**
 * Slot state enumeration for telemetry tracking
 */
export const SLOT_STATES = {
  EMPTY: 'empty',
  OCCUPIED: 'occupied',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  ERROR: 'error',
} as const;

export type SlotState = typeof SLOT_STATES[keyof typeof SLOT_STATES];

/**
 * Drop result enumeration for validation tracking
 */
export const DROP_RESULTS = {
  VALID: 'valid',
  INVALID_FATIGUE: 'invalid_fatigue',
  INVALID_INJURED: 'invalid_injured',
  INVALID_UNAVAILABLE: 'invalid_unavailable',
  INVALID_STATS: 'invalid_stats',
  INVALID_CAPACITY: 'invalid_capacity',
  ERROR: 'error',
} as const;

export type DropResult = typeof DROP_RESULTS[keyof typeof DROP_RESULTS];

/**
 * Resident information for telemetry
 */
export interface ResidentTelemetryInfo {
  /** Resident unique identifier */
  id: string;
  /** Resident display name */
  displayName: string;
  /** Current fatigue level */
  fatigue: number;
  /** Injury status */
  isInjured: boolean;
  /** Availability status */
  status: string;
  /** Primary stats for assignment validation */
  stats: Record<string, number>;
  /** Current activity if assigned */
  currentActivity?: string;
}

/**
 * Activity slot telemetry data structure
 */
export interface ActivitySlotTelemetryData {
  /** Unique slot identifier */
  slotId: string;
  /** Slot display label */
  slotLabel: string;
  /** Current slot state */
  state: SlotState;
  /** Activity definition if present */
  activity?: ActivityDefinition;
  /** Assigned resident information */
  resident?: ResidentTelemetryInfo;
  /** Progress information for active slots */
  progress?: {
    /** Progress fraction (0-1) */
    fraction: number;
    /** Elapsed seconds */
    elapsedSeconds: number;
    /** Total duration seconds */
    totalSeconds: number;
    /** Estimated completion timestamp */
    estimatedCompletion: number;
  };
  /** Drop validation result */
  dropResult?: DropResult;
  /** Validation failure reason */
  validationReason?: string;
  /** Timestamp of last state change */
  lastStateChanged: number;
  /** Total time in current state */
  timeInCurrentState: number;
}

/**
 * Batch telemetry data for multiple slots
 */
export interface ActivitySlotBatchTelemetryData {
  /** Batch operation identifier */
  batchId: string;
  /** Operation type */
  operation: 'state_sync' | 'bulk_assignment' | 'bulk_removal';
  /** Affected slot IDs */
  affectedSlots: string[];
  /** Slot telemetry snapshots */
  slotData: ActivitySlotTelemetryData[];
  /** Operation timestamp */
  timestamp: number;
  /** Operation duration in milliseconds */
  duration: number;
}

/**
 * Complete telemetry event payload
 */
export interface ActivitySlotTelemetryEvent {
  /** Event type identifier */
  eventType: ActivitySlotTelemetryEventType;
  /** Event timestamp */
  timestamp: number;
  /** Session identifier for tracking */
  sessionId: string;
  /** Slot-specific telemetry data */
  data: ActivitySlotTelemetryData;
  /** Optional batch data for bulk operations */
  batchData?: ActivitySlotBatchTelemetryData;
  /** Additional event metadata */
  metadata?: {
    /** Source component that triggered the event */
    source: string;
    /** User interaction context */
    context?: 'drag_drop' | 'manual_assignment' | 'auto_assignment' | 'system_update';
    /** Performance metrics */
    performance?: {
      /** Processing time in milliseconds */
      processingTime: number;
      /** Memory usage estimate */
      memoryUsage?: number;
    };
    /** Error information if applicable */
    error?: {
      code: string;
      message: string;
      stack?: string;
    };
  };
}

/**
 * Zod schema for ActivitySlot telemetry data validation
 */
export const ActivitySlotTelemetryDataSchema = z.object({
  slotId: z.string(),
  slotLabel: z.string(),
  state: z.enum(Object.values(SLOT_STATES) as [SlotState, ...SlotState[]]),
  activity: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    durationFormula: z.union([z.string(), z.number()]),
    statRequirement: z.record(z.number()).optional(),
  }).optional(),
  resident: z.object({
    id: z.string(),
    displayName: z.string(),
    fatigue: z.number(),
    isInjured: z.boolean(),
    status: z.string(),
    stats: z.record(z.number()),
    currentActivity: z.string().optional(),
  }).optional(),
  progress: z.object({
    fraction: z.number().min(0).max(1),
    elapsedSeconds: z.number().min(0),
    totalSeconds: z.number().min(0),
    estimatedCompletion: z.number(),
  }).optional(),
  dropResult: z.enum(Object.values(DROP_RESULTS) as [DropResult, ...DropResult[]]).optional(),
  validationReason: z.string().optional(),
  lastStateChanged: z.number(),
  timeInCurrentState: z.number().min(0),
});

/**
 * Zod schema for batch telemetry data
 */
export const ActivitySlotBatchTelemetryDataSchema = z.object({
  batchId: z.string(),
  operation: z.enum(['state_sync', 'bulk_assignment', 'bulk_removal'] as const),
  affectedSlots: z.array(z.string()),
  slotData: z.array(ActivitySlotTelemetryDataSchema),
  timestamp: z.number(),
  duration: z.number().min(0),
});

/**
 * Zod schema for complete telemetry event
 */
export const ActivitySlotTelemetryEventSchema = z.object({
  eventType: z.enum(Object.values(ACTIVITYSLOT_TELEMETRY_EVENTS) as [ActivitySlotTelemetryEventType, ...ActivitySlotTelemetryEventType[]]),
  timestamp: z.number(),
  sessionId: z.string(),
  data: ActivitySlotTelemetryDataSchema,
  batchData: ActivitySlotBatchTelemetryDataSchema.optional(),
  metadata: z.object({
    source: z.string(),
    context: z.enum(['drag_drop', 'manual_assignment', 'auto_assignment', 'system_update'] as const).optional(),
    performance: z.object({
      processingTime: z.number().min(0),
      memoryUsage: z.number().optional(),
    }).optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    }).optional(),
  }).optional(),
});

/**
 * Telemetry mirror configuration
 */
export interface ActivitySlotTelemetryConfig {
  /** Enable/disable telemetry collection */
  enabled: boolean;
  /** Sampling rate for events (1.0 = all events, 0.1 = 10% of events) */
  sampleRate: number;
  /** Maximum events to retain in memory */
  maxEvents: number;
  /** Export configuration */
  export: {
    /** Enable JSON export */
    json: boolean;
    /** Enable CSV export */
    csv: boolean;
    /** Auto-export interval in milliseconds (0 = disabled) */
    autoExportInterval: number;
  };
  /** Performance monitoring */
  performance: {
    /** Track processing times */
    trackProcessingTime: boolean;
    /** Memory usage monitoring */
    trackMemoryUsage: boolean;
  };
}

/**
 * Default telemetry configuration
 */
export const DEFAULT_ACTIVITYSLOT_TELEMETRY_CONFIG: ActivitySlotTelemetryConfig = {
  enabled: true,
  sampleRate: 1.0,
  maxEvents: 1000,
  export: {
    json: true,
    csv: true,
    autoExportInterval: 0, // Disabled by default
  },
  performance: {
    trackProcessingTime: true,
    trackMemoryUsage: false, // Disabled for performance
  },
};

/**
 * Export data structures
 */
export interface ActivitySlotTelemetryExport {
  /** Export metadata */
  metadata: {
    /** Export timestamp */
    timestamp: number;
    /** Session identifier */
    sessionId: string;
    /** Total events exported */
    totalEvents: number;
    /** Date range of events */
    dateRange: {
      start: number;
      end: number;
    };
    /** Export format version */
    version: string;
  };
  /** Telemetry events */
  events: ActivitySlotTelemetryEvent[];
  /** Aggregated statistics */
  statistics: {
    /** Total slot state changes */
    stateChanges: number;
    /** Total resident assignments */
    assignments: number;
    /** Total drop attempts */
    dropAttempts: number;
    /** Success rate for drops */
    dropSuccessRate: number;
    /** Most common slot states */
    commonStates: Record<SlotState, number>;
    /** Activity completion rate */
    completionRate: number;
    /** Average processing time */
    avgProcessingTime: number;
  };
}

/**
 * Type guards for telemetry data
 */
export function isValidActivitySlotTelemetryData(data: unknown): data is ActivitySlotTelemetryData {
  return ActivitySlotTelemetryDataSchema.safeParse(data).success;
}

export function isValidActivitySlotTelemetryEvent(event: unknown): event is ActivitySlotTelemetryEvent {
  return ActivitySlotTelemetryEventSchema.safeParse(event).success;
}

/**
 * Utility functions for telemetry data processing
 */
export class ActivitySlotTelemetryUtils {
  /**
   * Create resident telemetry info from resident state
   */
  static createResidentTelemetryInfo(resident: ResidentState): ResidentTelemetryInfo {
    return {
      id: resident.id,
      displayName: resident.displayName || resident.id,
      fatigue: resident.fatigue,
      isInjured: resident.isInjured,
      status: resident.status,
      stats: resident.stats || {},
      currentActivity: resident.currentActivity,
    };
  }

  /**
   * Create slot telemetry data from slot data and state
   */
  static createSlotTelemetryData(
    slotData: ActivitySlotData,
    state: SlotState,
    resident?: ResidentState,
    progress?: { fraction: number; elapsedSeconds: number; totalSeconds: number },
    dropResult?: DropResult,
    validationReason?: string,
  ): ActivitySlotTelemetryData {
    const now = Date.now();
    
    return {
      slotId: slotData.slotId,
      slotLabel: slotData.label,
      state,
      activity: slotData.activity,
      resident: resident ? this.createResidentTelemetryInfo(resident) : undefined,
      progress: progress ? {
        fraction: progress.fraction,
        elapsedSeconds: progress.elapsedSeconds,
        totalSeconds: progress.totalSeconds,
        estimatedCompletion: now + (progress.totalSeconds - progress.elapsedSeconds) * 1000,
      } : undefined,
      dropResult,
      validationReason,
      lastStateChanged: now,
      timeInCurrentState: 0,
    };
  }

  /**
   * Generate session identifier for telemetry tracking
   */
  static generateSessionId(): string {
    return `activityslot_session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Calculate drop success rate from events
   */
  static calculateDropSuccessRate(events: ActivitySlotTelemetryEvent[]): number {
    const dropEvents = events.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED || 
                                          e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_FAILED);
    if (dropEvents.length === 0) return 0;
    
    const successfulDrops = dropEvents.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED).length;
    return successfulDrops / dropEvents.length;
  }

  /**
   * Aggregate slot state statistics
   */
  static aggregateSlotStates(events: ActivitySlotTelemetryEvent[]): Record<SlotState, number> {
    const states = events.reduce((acc, event) => {
      const state = event.data.state;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<SlotState, number>);
    
    return states;
  }

  /**
   * Calculate activity completion rate
   */
  static calculateCompletionRate(events: ActivitySlotTelemetryEvent[]): number {
    const completedEvents = events.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.ACTIVITY_COMPLETED);
    const assignmentEvents = events.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.RESIDENT_ASSIGNED);
    
    if (assignmentEvents.length === 0) return 0;
    return completedEvents.length / assignmentEvents.length;
  }

  /**
   * Calculate average processing time
   */
  static calculateAverageProcessingTime(events: ActivitySlotTelemetryEvent[]): number {
    const eventsWithTiming = events.filter(e => e.metadata?.performance?.processingTime);
    if (eventsWithTiming.length === 0) return 0;
    
    const totalTime = eventsWithTiming.reduce((sum, e) => sum + (e.metadata?.performance?.processingTime || 0), 0);
    return totalTime / eventsWithTiming.length;
  }
}
