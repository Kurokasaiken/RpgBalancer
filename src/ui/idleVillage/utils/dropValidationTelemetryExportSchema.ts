/**
 * Drop Validation Telemetry Export Schema
 * 
 * Zod schemas for exporting Idle Village drop validation telemetry data.
 * Defines the structure for aggregated telemetry reports and export formats.
 * 
 * @since NP-067
 * @author Coordinator-Bot – Analytics
 */

import { z } from 'zod';

/**
 * Drop feedback telemetry event types
 */
export const DropFeedbackEventType = z.enum([
  'drop_feedback_shown',
  'drop_feedback_clicked',
  'drop_feedback_dismissed',
  'drop_validation_performed',
  'drop_operation_completed',
  'drop_suggestion_generated',
  'drop_suggestion_accepted',
  'drop_suggestion_rejected',
]);

/**
 * Validation rule types
 */
export const ValidationRuleType = z.enum([
  'stat_requirement_allOf',
  'stat_requirement_anyOf',
  'stat_requirement_noneOf',
  'fatigue_threshold',
  'crew_capacity',
  'resident_availability',
  'slot_locked',
  'scheduler_rejection',
  'custom_rule',
]);

/**
 * Feedback severity levels
 */
export const FeedbackSeverity = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Drop feedback type
 */
export const DropFeedbackType = z.enum(['valid', 'invalid', 'warning', 'blocked']);

/**
 * Individual drop feedback telemetry event
 */
export const DropFeedbackTelemetryEvent = z.object({
  /** Event type identifier */
  eventType: DropFeedbackEventType,
  /** Timestamp when event occurred */
  timestamp: z.number(),
  /** Unique session identifier */
  sessionId: z.string(),
  /** User identifier (if available) */
  userId: z.string().optional(),
  /** Village context at time of event */
  villageContext: z.object({
    /** Number of residents in village */
    residentCount: z.number(),
    /** Number of activities available */
    activityCount: z.number(),
    /** Current number of assignments */
    currentAssignments: z.number(),
    /** Current village day */
    day: z.number(),
    /** Whether village is in crisis mode */
    crisisMode: z.boolean(),
  }),
  /** Event-specific data */
  data: z.record(z.unknown()),
});

/**
 * Aggregated drop validation metrics
 */
export const DropValidationMetrics = z.object({
  /** Total number of drop operations */
  totalDrops: z.number(),
  /** Number of successful drops */
  successfulDrops: z.number(),
  /** Number of failed drops */
  failedDrops: z.number(),
  /** Success rate as percentage */
  successRate: z.number(),
  /** Average time per drop operation (ms) */
  averageDropTime: z.number(),
  /** Most common validation failure */
  mostCommonFailure: z.string().optional(),
  /** Validation failure breakdown */
  validationFailures: z.record(z.number()),
});

/**
 * Feedback interaction metrics
 */
export const FeedbackInteractionMetrics = z.object({
  /** Total feedback events shown */
  totalFeedbackShown: z.number(),
  /** Number of feedback interactions (clicks/dismissals) */
  totalInteractions: z.number(),
  /** Interaction rate as percentage */
  interactionRate: z.number(),
  /** Average time to interact (ms) */
  averageTimeToInteract: z.number(),
  /** Feedback type breakdown */
  feedbackTypeBreakdown: z.record(z.number()),
});

/**
 * AI suggestion metrics
 */
export const AISuggestionMetrics = z.object({
  /** Total suggestions generated */
  totalSuggestions: z.number(),
  /** Number of suggestions accepted */
  acceptedSuggestions: z.number(),
  /** Number of suggestions rejected */
  rejectedSuggestions: z.number(),
  /** Acceptance rate as percentage */
  acceptanceRate: z.number(),
  /** Average suggestion confidence */
  averageConfidence: z.number(),
  /** Suggestion accuracy metrics */
  accuracy: z.object({
    /** Success prediction accuracy */
    successPredictionRate: z.number(),
    /** Overall prediction accuracy */
    overallAccuracyRate: z.number(),
  }),
});

/**
 * Performance metrics
 */
export const PerformanceMetrics = z.object({
  /** Average validation time (ms) */
  averageValidationTime: z.number(),
  /** Average suggestion generation time (ms) */
  averageSuggestionTime: z.number(),
  /** Memory usage (bytes) */
  memoryUsage: z.number(),
  /** Cache hit rate as percentage */
  cacheHitRate: z.number(),
  /** Error rate as percentage */
  errorRate: z.number(),
});

/**
 * Time-based telemetry summary
 */
export const TimeBasedSummary = z.object({
  /** Start timestamp of period */
  startTimestamp: z.number(),
  /** End timestamp of period */
  endTimestamp: z.number(),
  /** Duration in milliseconds */
  duration: z.number(),
  /** Number of events in period */
  eventCount: z.number(),
  /** Events per second */
  eventsPerSecond: z.number(),
});

/**
 * Resident-specific metrics
 */
export const ResidentMetrics = z.object({
  /** Resident ID */
  residentId: z.string(),
  /** Number of drops involving this resident */
  dropCount: z.number(),
  /** Success rate for this resident */
  successRate: z.number(),
  /** Most common activities dropped on */
  mostCommonActivities: z.array(z.string()),
  /** Average fatigue level during drops */
  averageFatigueLevel: z.number(),
});

/**
 * Activity-specific metrics
 */
export const ActivityMetrics = z.object({
  /** Activity ID */
  activityId: z.string(),
  /** Number of drops on this activity */
  dropCount: z.number(),
  /** Success rate for this activity */
  successRate: z.number(),
  /** Most common residents dropped */
  mostCommonResidents: z.array(z.string()),
  /** Average crew utilization */
  averageCrewUtilization: z.number(),
});

/**
 * Complete drop validation telemetry export
 */
export const DropValidationTelemetryExport = z.object({
  /** Export metadata */
  metadata: z.object({
    /** Export timestamp */
    exportedAt: z.string(),
    /** Export format version */
    version: z.string(),
    /** Export source (manual, scheduled, etc.) */
    source: z.string(),
    /** Data collection period */
    collectionPeriod: TimeBasedSummary,
  }),
  
  /** Session summary */
  sessionSummary: z.object({
    /** Total sessions included */
    totalSessions: z.number(),
    /** Session duration statistics */
    sessionDurations: z.object({
      average: z.number(),
      min: z.number(),
      max: z.number(),
    }),
    /** Unique users */
    uniqueUsers: z.number(),
  }),
  
  /** Aggregated metrics */
  metrics: z.object({
    /** Drop validation metrics */
    dropValidation: DropValidationMetrics,
    /** Feedback interaction metrics */
    feedbackInteraction: FeedbackInteractionMetrics,
    /** AI suggestion metrics */
    aiSuggestions: AISuggestionMetrics,
    /** Performance metrics */
    performance: PerformanceMetrics,
  }),
  
  /** Resident-specific breakdown */
  residentBreakdown: z.array(ResidentMetrics),
  
  /** Activity-specific breakdown */
  activityBreakdown: z.array(ActivityMetrics),
  
  /** Time-based breakdown */
  timeBreakdown: z.array(TimeBasedSummary),
  
  /** Raw events (optional, for detailed analysis) */
  rawEvents: z.array(DropFeedbackTelemetryEvent).optional(),
  
  /** Export statistics */
  exportStats: z.object({
    /** Total events exported */
    totalEvents: z.number(),
    /** Export file size (bytes) */
    fileSize: z.number(),
    /** Export duration (ms) */
    exportDuration: z.number(),
  }),
});

/**
 * Export configuration options
 */
export const ExportConfig = z.object({
  /** Export format */
  format: z.enum(['json', 'markdown', 'csv']),
  /** Include raw events */
  includeRawEvents: z.boolean().default(false),
  /** Time range filter */
  timeRange: z.object({
    /** Start timestamp (optional) */
    start: z.number().optional(),
    /** End timestamp (optional) */
    end: z.number().optional(),
  }).optional(),
  /** Event type filter */
  eventTypes: z.array(DropFeedbackEventType).optional(),
  /** Session ID filter */
  sessionIds: z.array(z.string()).optional(),
  /** Maximum number of events to export */
  maxEvents: z.number().optional(),
  /** Sort order */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  /** Group by field */
  groupBy: z.enum(['session', 'resident', 'activity', 'hour', 'day']).optional(),
});

/**
 * Export result
 */
export const ExportResult = z.object({
  /** Success status */
  success: z.boolean(),
  /** Exported data */
  data: DropValidationTelemetryExport.optional(),
  /** Error message (if failed) */
  error: z.string().optional(),
  /** Export statistics */
  stats: z.object({
    /** Events processed */
    eventsProcessed: z.number(),
    /** Events exported */
    eventsExported: z.number(),
    /** Export duration (ms) */
    duration: z.number(),
    /** File size (bytes) */
    fileSize: z.number(),
  }),
});

/**
 * Type guards and utilities
 */

/**
 * Type guard for drop feedback telemetry event
 */
export function isDropFeedbackTelemetryEvent(obj: unknown): obj is DropFeedbackTelemetryEvent {
  return DropFeedbackTelemetryEvent.safeParse(obj).success;
}

/**
 * Type guard for export configuration
 */
export function isExportConfig(obj: unknown): obj is ExportConfig {
  return ExportConfig.safeParse(obj).success;
}

/**
 * Create a default export configuration
 */
export function createDefaultExportConfig(): ExportConfig {
  return {
    format: 'json',
    includeRawEvents: false,
    sortOrder: 'desc',
  };
}

/**
 * Validate export data structure
 */
export function validateExportData(data: unknown): {
  valid: boolean;
  error?: string;
} {
  const result = DropValidationTelemetryExport.safeParse(data);
  return {
    valid: result.success,
    error: result.success ? undefined : result.error?.message,
  };
}

/**
 * Export type definitions for external use
 */
export type DropFeedbackTelemetryEvent = z.infer<typeof DropFeedbackTelemetryEvent>;
export type DropValidationMetrics = z.infer<typeof DropValidationMetrics>;
export type FeedbackInteractionMetrics = z.infer<typeof FeedbackInteractionMetrics>;
export type AISuggestionMetrics = z.infer<typeof AISuggestionMetrics>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetrics>;
export type DropValidationTelemetryExport = z.infer<typeof DropValidationTelemetryExport>;
export type ExportConfig = z.infer<typeof ExportConfig>;
export type ExportResult = z.infer<typeof ExportResult>;
