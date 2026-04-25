/**
 * Spell Lifecycle Configuration – NP-099
 * 
 * Config-first schema for Archmage spell lifecycle telemetry.
 * 
 * @since NP-099
 */

import { z } from 'zod';

/**
 * Lifecycle event type schema.
 */
export const LifecycleEventTypeSchema = z.enum([
  'spawn',
  'buff',
  'resolve',
  'decay',
]);
export type LifecycleEventType = z.infer<typeof LifecycleEventTypeSchema>;

/**
 * Spell lifecycle event schema.
 */
export const SpellLifecycleEventSchema = z.object({
  /** Event ID */
  id: z.string(),
  /** Event type */
  type: LifecycleEventTypeSchema,
  /** Spell ID */
  spellId: z.string(),
  /** Spell name */
  spellName: z.string(),
  /** Timestamp */
  timestamp: z.number().int().positive(),
  /** Duration (ms) */
  duration: z.number().nonnegative().optional(),
  /** Mana cost */
  manaCost: z.number().int().nonnegative().optional(),
  /** Target creature ID */
  targetCreatureId: z.string().optional(),
  /** Buff magnitude */
  buffMagnitude: z.number().optional(),
  /** Resolve success */
  resolveSuccess: z.boolean().optional(),
  /** Metadata */
  metadata: z.record(z.unknown()).optional(),
});
export type SpellLifecycleEvent = z.infer<typeof SpellLifecycleEventSchema>;

/**
 * Telemetry config schema.
 */
export const TelemetryConfigSchema = z.object({
  /** Enable telemetry */
  enabled: z.boolean().default(true),
  /** Max events in memory */
  maxEventsInMemory: z.number().int().positive().default(1000),
  /** Export format */
  exportFormat: z.enum(['json', 'csv']).default('json'),
  /** Export path */
  exportPath: z.string().default('test-results'),
  /** Version */
  version: z.string().default('1.0.0'),
  /** Target latency (ms) */
  targetLatency: z.number().positive().default(25),
});
export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>;

/**
 * Default telemetry configuration.
 */
export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  enabled: true,
  maxEventsInMemory: 1000,
  exportFormat: 'json',
  exportPath: 'test-results',
  version: '1.0.0',
  targetLatency: 25,
};

/**
 * Lifecycle metrics schema.
 */
export const LifecycleMetricsSchema = z.object({
  /** Total events */
  totalEvents: z.number().int().nonnegative(),
  /** Events by type */
  eventsByType: z.record(z.number().int().nonnegative()),
  /** Average latency (ms) */
  avgLatency: z.number().nonnegative(),
  /** Max latency (ms) */
  maxLatency: z.number().nonnegative(),
  /** Success rate */
  successRate: z.number().min(0).max(1),
});
export type LifecycleMetrics = z.infer<typeof LifecycleMetricsSchema>;
