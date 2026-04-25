/**
 * Physics Lab Telemetry Module
 *
 * Provides Zod schemas and logging helpers for Physics Lab events.
 * Integrates with TelemetryProvider and includes TODO(PL-EVD) hook
 * for future evidence automation integration.
 */

import { z } from 'zod';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

/**
 * Physics Lab telemetry event types.
 */
export const PhysicsLabEventTypeSchema = z.enum([
  'physics_lab_loaded',
  'physics_lab_adjusted',
  'physics_lab_preset_applied',
  'physics_lab_export_attempt',
  'physics_lab_export_blocked',
  'physics_lab_slider_change',
]);

export type PhysicsLabEventType = z.infer<typeof PhysicsLabEventTypeSchema>;

/**
 * Base payload for all Physics Lab telemetry events.
 */
export const PhysicsLabBasePayloadSchema = z.object({
  /** Current preset ID */
  presetId: z.string(),
  /** Session identifier for grouping events */
  sessionId: z.string(),
  /** Timestamp of the event */
  timestamp: z.number(),
  /** User interaction context */
  context: z.enum(['canvas', 'sidebar', 'hud', 'unknown']),
  /** Optional metadata for future extensions */
  metadata: z.record(z.unknown()).optional(),
});

export type PhysicsLabBasePayload = z.infer<typeof PhysicsLabBasePayloadSchema>;

/**
 * Payload for physics_lab_adjusted events.
 */
export const PhysicsLabAdjustedPayloadSchema = PhysicsLabBasePayloadSchema.extend({
  /** Type of adjustment made */
  adjustmentType: z.enum(['slider', 'toggle', 'preset_change']),
  /** Field that was adjusted */
  field: z.string(),
  /** Previous value */
  previousValue: z.unknown(),
  /** New value */
  newValue: z.unknown(),
});

export type PhysicsLabAdjustedPayload = z.infer<typeof PhysicsLabAdjustedPayloadSchema>;

/**
 * Payload for physics_lab_preset_applied events.
 */
export const PhysicsLabPresetAppliedPayloadSchema = PhysicsLabBasePayloadSchema.extend({
  /** Previous preset ID */
  previousPresetId: z.string(),
  /** Whether the preset was reset to default */
  isReset: z.boolean(),
});

export type PhysicsLabPresetAppliedPayload = z.infer<typeof PhysicsLabPresetAppliedPayloadSchema>;

/**
 * Payload for physics_lab_export_attempt events.
 */
export const PhysicsLabExportAttemptPayloadSchema = PhysicsLabBasePayloadSchema.extend({
  /** Export format */
  format: z.enum(['json', 'csv', 'markdown']),
  /** Export size in bytes */
  sizeBytes: z.number(),
  /** Whether export succeeded */
  success: z.boolean(),
  /** Error message if failed */
  error: z.string().optional(),
});

export type PhysicsLabExportAttemptPayload = z.infer<typeof PhysicsLabExportAttemptPayloadSchema>;

/**
 * Payload for physics_lab_export_blocked events.
 */
export const PhysicsLabExportBlockedPayloadSchema = PhysicsLabBasePayloadSchema.extend({
  /** Reason for blocking */
  reason: z.enum(['low_fps', 'high_cpu', 'concurrency_limit', 'unknown']),
  /** Current FPS value */
  currentFps: z.number(),
  /** Current CPU usage in milliseconds */
  currentCpuMs: z.number(),
  /** Audio concurrency count */
  audioConcurrency: z.number(),
  /** Haptic concurrency count */
  hapticConcurrency: z.number(),
  /** Duration of the performance issue in seconds */
  durationSeconds: z.number(),
});

export type PhysicsLabExportBlockedPayload = z.infer<typeof PhysicsLabExportBlockedPayloadSchema>;

/**
 * Payload for physics_lab_slider_change events (aggregated).
 */
export const PhysicsLabSliderChangePayloadSchema = PhysicsLabBasePayloadSchema.extend({
  /** Slider field name */
  field: z.string(),
  /** Slider value */
  value: z.number(),
  /** Number of changes in this batch */
  changeCount: z.number(),
  /** Time window for aggregation in milliseconds */
  windowMs: z.number(),
});

export type PhysicsLabSliderChangePayload = z.infer<typeof PhysicsLabSliderChangePayloadSchema>;

/**
 * Union type for all Physics Lab telemetry payloads.
 */
export type PhysicsLabTelemetryPayload =
  | PhysicsLabBasePayload
  | PhysicsLabAdjustedPayload
  | PhysicsLabPresetAppliedPayload
  | PhysicsLabExportAttemptPayload
  | PhysicsLabExportBlockedPayload
  | PhysicsLabSliderChangePayload;

/**
 * Schema registry for validating Physics Lab telemetry events.
 */
export const PhysicsLabTelemetrySchemas = {
  physics_lab_loaded: PhysicsLabBasePayloadSchema,
  physics_lab_adjusted: PhysicsLabAdjustedPayloadSchema,
  physics_lab_preset_applied: PhysicsLabPresetAppliedPayloadSchema,
  physics_lab_export_attempt: PhysicsLabExportAttemptPayloadSchema,
  physics_lab_export_blocked: PhysicsLabExportBlockedPayloadSchema,
  physics_lab_slider_change: PhysicsLabSliderChangePayloadSchema,
} as const;

/**
 * Generate a unique session ID for Physics Lab telemetry.
 */
export function generatePhysicsLabSessionId(): string {
  return `pl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log a Physics Lab telemetry event.
 *
 * Validates the payload using the appropriate Zod schema and forwards
 * it to the TelemetryProvider. Falls back to console logging if TelemetryProvider
 * is not available.
 *
 * @param eventType - The Physics Lab event type
 * @param payload - The event payload
 */
export function logPhysicsLabEvent(
  eventType: PhysicsLabEventType,
  payload: PhysicsLabTelemetryPayload
): void {
  try {
    // Validate payload against the appropriate schema
    const schema = PhysicsLabTelemetrySchemas[eventType];
    const validatedPayload = schema.parse(payload);

    // Forward to TelemetryProvider
    trackTelemetryEvent(eventType, validatedPayload);

    // TODO(PL-EVD): Hook into evidence automation pipeline
    // This will be integrated with the Guardian evidence system
    // to provide automated logging and session tracking.
  } catch (error) {
    console.warn('[PhysicsLabTelemetry] Failed to log event:', {
      eventType,
      error,
      payload,
    });
  }
}

/**
 * Helper to create base payload with common fields.
 */
export function createBasePayload(
  presetId: string,
  sessionId: string,
  context: PhysicsLabBasePayload['context'] = 'unknown',
  metadata: Record<string, unknown> = {}
): PhysicsLabBasePayload {
  return {
    presetId,
    sessionId,
    timestamp: Date.now(),
    context,
    metadata,
  };
}

/**
 * Helper to detect if TelemetryProvider is available.
 */
export function isTelemetryProviderAvailable(): boolean {
  return typeof window !== 'undefined' && 
         (window.telemetryBuffer || 
          typeof trackTelemetryEvent === 'function');
}
