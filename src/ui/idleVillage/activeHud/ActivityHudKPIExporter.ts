/**
 * NP-087 – Idle Village Activity HUD KPI Exporter Schema
 * 
 * Schema definitions and types for Activity HUD KPI export functionality
 * with filters, metrics, and export formats.
 * 
 * @since 2026-01-21
 * @author Atlas-Idle – HUD Analytics
 */

import { z } from 'zod';

// === Core KPI Types ===

/**
 * Activity status enumeration.
 */
export const ActivityStatusSchema = z.enum([
  'idle',
  'active',
  'paused',
  'completed',
  'failed',
  'cancelled'
]);

export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;

/**
 * Activity type enumeration.
 */
export const ActivityTypeSchema = z.enum([
  'job',
  'quest',
  'maintenance',
  'exploration',
  'social',
  'training'
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

/**
 * Individual activity KPI metrics.
 */
export const ActivityKPISchema = z.object({
  /** Activity unique identifier */
  id: z.string(),
  /** Activity display name */
  name: z.string(),
  /** Activity type */
  type: ActivityTypeSchema,
  /** Current status */
  status: ActivityStatusSchema,
  /** Location identifier */
  locationId: z.string(),
  /** Location display name */
  locationName: z.string(),
  /** Assigned resident IDs */
  assignedResidents: z.string().array(),
  /** Assigned resident names */
  assignedResidentNames: z.string().array(),
  /** Progress percentage (0-100) */
  progress: z.number().min(0).max(100),
  /** Estimated remaining time in minutes */
  estimatedTimeRemainingMin: z.number().min(0),
  /** Actual elapsed time in minutes */
  elapsedTimeMin: z.number().min(0),
  /** Success rate percentage (0-100) */
  successRate: z.number().min(0).max(100),
  /** Drop success rate percentage (0-100) */
  dropSuccessRate: z.number().min(0).max(100),
  /** Total drops collected */
  totalDrops: z.number().min(0),
  /** Successful drops */
  successfulDrops: z.number().min(0),
  /** Failed drops */
  failedDrops: z.number().min(0),
  /** Activity priority (1-10) */
  priority: z.number().min(1).max(10),
  /** Activity tags */
  tags: z.string().array(),
  /** Start timestamp */
  startedAt: z.number(),
  /** Last updated timestamp */
  lastUpdated: z.number(),
  /** Completion timestamp (null if not completed) */
  completedAt: z.number().nullable(),
  /** Performance score (0-100) */
  performanceScore: z.number().min(0).max(100),
  /** Efficiency score (0-100) */
  efficiencyScore: z.number().min(0).max(100),
});

export type ActivityKPI = z.infer<typeof ActivityKPISchema>;

/**
 * Resident activity summary.
 */
export const ResidentActivitySummarySchema = z.object({
  /** Resident unique identifier */
  id: z.string(),
  /** Resident display name */
  name: z.string(),
  /** Current activity ID (null if idle) */
  currentActivityId: z.string().nullable(),
  /** Current activity name (null if idle) */
  currentActivityName: z.string().nullable(),
  /** Total activities completed */
  totalCompleted: z.number().min(0),
  /** Total activities failed */
  totalFailed: z.number().min(0),
  /** Average success rate */
  averageSuccessRate: z.number().min(0).max(100),
  /** Average completion time in minutes */
  averageCompletionTimeMin: z.number().min(0),
  /** Current fatigue percentage (0-100) */
  currentFatigue: z.number().min(0).max(100),
  /** Current happiness percentage (0-100) */
  currentHappiness: z.number().min(0).max(100),
  /** Skills being utilized */
  activeSkills: z.string().array(),
  /** Performance trend (improving/stable/declining) */
  performanceTrend: z.enum(['improving', 'stable', 'declining']),
});

export type ResidentActivitySummary = z.infer<typeof ResidentActivitySummarySchema>;

/**
 * Location activity summary.
 */
export const LocationActivitySummarySchema = z.object({
  /** Location unique identifier */
  id: z.string(),
  /** Location display name */
  name: z.string(),
  /** Location type */
  type: z.enum(['village', 'forest', 'mine', 'farm', 'workshop', 'temple']),
  /** Total activities at location */
  totalActivities: z.number().min(0),
  /** Active activities count */
  activeActivities: z.number().min(0),
  /** Average activity success rate */
  averageSuccessRate: z.number().min(0).max(100),
  /** Location utilization percentage (0-100) */
  utilizationRate: z.number().min(0).max(100),
  /** Most common activity type */
  dominantActivityType: ActivityTypeSchema,
  /** Location efficiency score (0-100) */
  efficiencyScore: z.number().min(0).max(100),
});

export type LocationActivitySummary = z.infer<typeof LocationActivitySummarySchema>;

// === Export Schema ===

/**
 * Complete Activity HUD KPI export data.
 */
export const ActivityHUDKPIExportSchema = z.object({
  /** Export metadata */
  exportMetadata: z.object({
    /** Export timestamp */
    exportedAt: z.number(),
    /** Export version */
    version: z.string(),
    /** Export source (manual/scheduled/triggered) */
    source: z.string(),
    /** Export format (json/csv) */
    format: z.string(),
    /** Total records exported */
    totalRecords: z.number().min(0),
  }),
  /** Global KPI summary */
  summary: z.object({
    /** Total active activities */
    totalActiveActivities: z.number().min(0),
    /** Total completed activities */
    totalCompletedActivities: z.number().min(0),
    /** Overall success rate */
    overallSuccessRate: z.number().min(0).max(100),
    /** Overall drop success rate */
    overallDropSuccessRate: z.number().min(0).max(100),
    /** Average activity duration in minutes */
    averageActivityDurationMin: z.number().min(0),
    /** Total residents active */
    totalActiveResidents: z.number().min(0),
    /** Total locations utilized */
    totalUtilizedLocations: z.number().min(0),
    /** Global efficiency score (0-100) */
    globalEfficiencyScore: z.number().min(0).max(100),
  }),
  /** Individual activity KPIs */
  activities: ActivityKPISchema.array(),
  /** Resident activity summaries */
  residentSummaries: ResidentActivitySummarySchema.array(),
  /** Location activity summaries */
  locationSummaries: LocationActivitySummarySchema.array(),
});

export type ActivityHUDKPIExport = z.infer<typeof ActivityHUDKPIExportSchema>;

// === Filter Types ===

/**
 * Export filter configuration.
 */
export const ActivityHUDKPIFilterSchema = z.object({
  /** Activity type filter */
  activityTypes: ActivityTypeSchema.array().optional(),
  /** Activity status filter */
  activityStatuses: ActivityStatusSchema.array().optional(),
  /** Location ID filter */
  locationIds: z.string().array().optional(),
  /** Resident ID filter */
  residentIds: z.string().array().optional(),
  /** Progress range filter */
  progressRange: z.object({
    min: z.number().min(0).max(100).optional(),
    max: z.number().min(0).max(100).optional(),
  }).optional(),
  /** Success rate range filter */
  successRateRange: z.object({
    min: z.number().min(0).max(100).optional(),
    max: z.number().min(0).max(100).optional(),
  }).optional(),
  /** Priority range filter */
  priorityRange: z.object({
    min: z.number().min(1).max(10).optional(),
    max: z.number().min(1).max(10).optional(),
  }).optional(),
  /** Time range filter */
  timeRange: z.object({
    startedAfter: z.number().optional(),
    startedBefore: z.number().optional(),
    completedAfter: z.number().optional(),
    completedBefore: z.number().optional(),
  }).optional(),
  /** Tag filter */
  tags: z.string().array().optional(),
  /** Performance score range filter */
  performanceScoreRange: z.object({
    min: z.number().min(0).max(100).optional(),
    max: z.number().min(0).max(100).optional(),
  }).optional(),
});

export type ActivityHUDKPIFilter = z.infer<typeof ActivityHUDKPIFilterSchema>;

// === Export Options ===

/**
 * Export configuration options.
 */
export const ActivityHUDKPIExportOptionsSchema = z.object({
  /** Export format */
  format: z.enum(['json', 'csv']),
  /** Include metadata */
  includeMetadata: z.boolean().default(true),
  /** Include resident summaries */
  includeResidentSummaries: z.boolean().default(true),
  /** Include location summaries */
  includeLocationSummaries: z.boolean().default(true),
  /** Sort by field */
  sortBy: z.enum(['name', 'progress', 'successRate', 'priority', 'startedAt', 'elapsedTimeMin']).default('name'),
  /** Sort order */
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  /** Limit number of records */
  limit: z.number().min(1).max(10000).optional(),
  /** Offset for pagination */
  offset: z.number().min(0).default(0),
  /** Include inactive activities */
  includeInactive: z.boolean().default(false),
  /** Include completed activities */
  includeCompleted: z.boolean().default(true),
  /** Include failed activities */
  includeFailed: z.boolean().default(true),
});

export type ActivityHUDKPIExportOptions = z.infer<typeof ActivityHUDKPIExportOptionsSchema>;

// === Telemetry Schema ===

/**
 * Telemetry event for Activity HUD export.
 */
export const ActivityHUDExportedTelemetrySchema = z.object({
  /** Event type */
  eventType: z.literal('iv_activity_hud_exported'),
  /** Event timestamp */
  timestamp: z.number(),
  /** Export metadata */
  exportMetadata: z.object({
    /** Export format */
    format: z.string(),
    /** Total records exported */
    totalRecords: z.number(),
    /** Export duration in milliseconds */
    exportDurationMs: z.number(),
    /** File size in bytes */
    fileSizeBytes: z.number(),
    /** Applied filters */
    appliedFilters: ActivityHUDKPIFilterSchema.optional(),
    /** Export options */
    exportOptions: ActivityHUDKPIExportOptionsSchema,
  }),
  /** KPI summary */
  kpiSummary: z.object({
    /** Total active activities */
    totalActiveActivities: z.number(),
    /** Overall success rate */
    overallSuccessRate: z.number(),
    /** Global efficiency score */
    globalEfficiencyScore: z.number(),
    /** Total residents active */
    totalActiveResidents: z.number(),
    /** Total locations utilized */
    totalUtilizedLocations: z.number(),
  }),
  /** Performance metrics */
  performanceMetrics: z.object({
    /** Data collection time in milliseconds */
    dataCollectionTimeMs: z.number(),
    /** Processing time in milliseconds */
    processingTimeMs: z.number(),
    /** Export time in milliseconds */
    exportTimeMs: z.number(),
    /** Memory usage in MB */
    memoryUsageMB: z.number(),
  }),
});

export type ActivityHUDExportedTelemetry = z.infer<typeof ActivityHUDExportedTelemetrySchema>;

// === Validation Functions ===

/**
 * Validates Activity KPI data.
 */
export function validateActivityKPI(data: unknown): ActivityKPI {
  return ActivityKPISchema.parse(data);
}

/**
 * Validates complete KPI export data.
 */
export function validateActivityHUDKPIExport(data: unknown): ActivityHUDKPIExport {
  return ActivityHUDKPIExportSchema.parse(data);
}

/**
 * Validates export filter configuration.
 */
export function validateActivityHUDKPIFilter(data: unknown): ActivityHUDKPIFilter {
  return ActivityHUDKPIFilterSchema.parse(data);
}

/**
 * Validates export options.
 */
export function validateActivityHUDKPIExportOptions(data: unknown): ActivityHUDKPIExportOptions {
  return ActivityHUDKPIExportOptionsSchema.parse(data);
}

/**
 * Validates telemetry event data.
 */
export function validateActivityHUDExportedTelemetry(data: unknown): ActivityHUDExportedTelemetry {
  return ActivityHUDExportedTelemetrySchema.parse(data);
}

// === Utility Functions ===

/**
 * Creates a default Activity KPI object.
 */
export function createDefaultActivityKPI(overrides: Partial<ActivityKPI> = {}): ActivityKPI {
  const now = Date.now();
  
  return {
    id: `activity-${now}`,
    name: 'New Activity',
    type: 'job',
    status: 'idle',
    locationId: 'location-unknown',
    locationName: 'Unknown Location',
    assignedResidents: [],
    assignedResidentNames: [],
    progress: 0,
    estimatedTimeRemainingMin: 0,
    elapsedTimeMin: 0,
    successRate: 0,
    dropSuccessRate: 0,
    totalDrops: 0,
    successfulDrops: 0,
    failedDrops: 0,
    priority: 5,
    tags: [],
    startedAt: now,
    lastUpdated: now,
    completedAt: null,
    performanceScore: 0,
    efficiencyScore: 0,
    ...overrides,
  };
}

/**
 * Creates a default export filter.
 */
export function createDefaultActivityHUDKPIFilter(): ActivityHUDKPIFilter {
  return {};
}

/**
 * Creates default export options.
 */
export function createDefaultActivityHUDKPIExportOptions(): ActivityHUDKPIExportOptions {
  return {
    format: 'json',
    includeMetadata: true,
    includeResidentSummaries: true,
    includeLocationSummaries: true,
    sortBy: 'name',
    sortOrder: 'asc',
    includeInactive: false,
    includeCompleted: true,
    includeFailed: true,
  };
}

/**
 * Creates telemetry event data for export.
 */
export function createActivityHUDExportedTelemetry(
  exportData: ActivityHUDKPIExport,
  exportDurationMs: number,
  fileSizeBytes: number,
  appliedFilters?: ActivityHUDKPIFilter,
  exportOptions?: ActivityHUDKPIExportOptions,
  performanceMetrics?: Partial<ActivityHUDExportedTelemetry['performanceMetrics']>
): ActivityHUDExportedTelemetry {
  return {
    eventType: 'iv_activity_hud_exported',
    timestamp: Date.now(),
    exportMetadata: {
      format: exportData.exportMetadata.format,
      totalRecords: exportData.exportMetadata.totalRecords,
      exportDurationMs,
      fileSizeBytes,
      appliedFilters,
      exportOptions: exportOptions || createDefaultActivityHUDKPIExportOptions(),
    },
    kpiSummary: {
      totalActiveActivities: exportData.summary.totalActiveActivities,
      overallSuccessRate: exportData.summary.overallSuccessRate,
      globalEfficiencyScore: exportData.summary.globalEfficiencyScore,
      totalActiveResidents: exportData.summary.totalActiveResidents,
      totalUtilizedLocations: exportData.summary.totalUtilizedLocations,
    },
    performanceMetrics: {
      dataCollectionTimeMs: 0,
      processingTimeMs: 0,
      exportTimeMs: exportDurationMs,
      memoryUsageMB: 0,
      ...performanceMetrics,
    },
  };
}
