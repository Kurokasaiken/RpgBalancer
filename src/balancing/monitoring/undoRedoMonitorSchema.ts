/**
 * Undo/Redo Persistence Monitor Schema
 * 
 * Zod schemas for undo/redo integrity monitoring and validation.
 * 
 * @since 2026-01-19
 * @author Sentinel-Balancer – Persistence Monitor
 */

import { z } from 'zod';

/**
 * Integrity check severity levels
 */
export const IntegritySeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Types of integrity issues that can be detected
 */
export const IntegrityIssueTypeSchema = z.enum([
  'checksum_mismatch',
  'data_corruption',
  'structure_invalid',
  'history_depth_exceeded',
  'timestamp_invalid',
  'serialization_error',
  'storage_failure',
  'version_mismatch',
]);

/**
 * Individual integrity issue detected during monitoring
 */
export const IntegrityIssueSchema = z.object({
  /** Unique identifier for the issue */
  id: z.string(),
  /** Type of integrity issue */
  type: IntegrityIssueTypeSchema,
  /** Severity level */
  severity: IntegritySeveritySchema,
  /** Human-readable description */
  description: z.string(),
  /** Technical details */
  details: z.record(z.unknown()),
  /** Timestamp when issue was detected */
  detectedAt: z.number(),
  /** Whether issue has been resolved */
  resolved: z.boolean().default(false),
  /** Resolution details if resolved */
  resolution: z.string().optional(),
});

/**
 * Undo/Redo operation metrics
 */
export const UndoRedoMetricsSchema = z.object({
  /** Total number of undo operations performed */
  undoCount: z.number().min(0),
  /** Total number of redo operations performed */
  redoCount: z.number().min(0),
  /** Average time per undo operation (ms) */
  avgUndoTime: z.number().min(0),
  /** Average time per redo operation (ms) */
  avgRedoTime: z.number().min(0),
  /** Current history depth */
  historyDepth: z.number().min(0),
  /** Maximum history depth reached */
  maxHistoryDepth: z.number().min(0),
  /** Total data size in bytes */
  totalDataSize: z.number().min(0),
  /** Number of integrity issues detected */
  integrityIssues: z.number().min(0),
});

/**
 * Undo/Redo integrity check result
 */
export const UndoRedoIntegrityResultSchema = z.object({
  /** Whether integrity check passed */
  passed: z.boolean(),
  /** Timestamp of the check */
  timestamp: z.number(),
  /** Check duration in milliseconds */
  duration: z.number().min(0),
  /** Current configuration checksum */
  currentChecksum: z.string(),
  /** History snapshots analyzed */
  snapshotsAnalyzed: z.number().min(0),
  /** Issues found during check */
  issues: z.array(IntegrityIssueSchema),
  /** Metrics collected */
  metrics: UndoRedoMetricsSchema,
  /** Recommendations for fixing issues */
  recommendations: z.array(z.string()),
});

/**
 * Undo/Redo persistence monitor configuration
 */
export const UndoRedoMonitorConfigSchema = z.object({
  /** Maximum allowed history depth */
  maxHistoryDepth: z.number().min(1).max(100).default(10),
  /** Checksum algorithm to use */
  checksumAlgorithm: z.enum(['sha256', 'md5', 'simple']).default('simple'),
  /** Integrity check interval in milliseconds (0 = disabled) */
  integrityCheckInterval: z.number().min(0).default(0),
  /** Enable automatic corruption recovery */
  enableAutoRecovery: z.boolean().default(false),
  /** Maximum data size before warning (bytes) */
  maxDataSizeWarning: z.number().min(1024).default(1024 * 1024), // 1MB
  /** Enable performance monitoring */
  enablePerformanceMonitoring: z.boolean().default(true),
  /** Threshold for slow operations (ms) */
  slowOperationThreshold: z.number().min(100).default(1000),
});

/**
 * Undo/Redo operation event
 */
export const UndoRedoOperationSchema = z.object({
  /** Operation type */
  type: z.enum(['undo', 'redo', 'save', 'restore']),
  /** Operation timestamp */
  timestamp: z.number(),
  /** Operation duration in milliseconds */
  duration: z.number().min(0),
  /** Whether operation succeeded */
  success: z.boolean(),
  /** Error message if failed */
  error: z.string().optional(),
  /** Data checksum before operation */
  beforeChecksum: z.string().optional(),
  /** Data checksum after operation */
  afterChecksum: z.string().optional(),
  /** History depth before operation */
  historyDepthBefore: z.number().min(0),
  /** History depth after operation */
  historyDepthAfter: z.number().min(0),
  /** Additional metadata */
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Undo/Redo persistence monitor state
 */
export const UndoRedoMonitorStateSchema = z.object({
  /** Current configuration */
  isMonitoring: z.boolean(),
  /** Last integrity check result */
  lastIntegrityCheck: UndoRedoIntegrityResultSchema.optional(),
  /** Operation history */
  operationHistory: z.array(UndoRedoOperationSchema),
  /** Current metrics */
  metrics: UndoRedoMetricsSchema,
  /** Monitor configuration */
  config: UndoRedoMonitorConfigSchema,
  /** Monitor start timestamp */
  startedAt: z.number().optional(),
});

// Type exports
export type IntegritySeverity = z.infer<typeof IntegritySeveritySchema>;
export type IntegrityIssueType = z.infer<typeof IntegrityIssueTypeSchema>;
export type IntegrityIssue = z.infer<typeof IntegrityIssueSchema>;
export type UndoRedoMetrics = z.infer<typeof UndoRedoMetricsSchema>;
export type UndoRedoIntegrityResult = z.infer<typeof UndoRedoIntegrityResultSchema>;
export type UndoRedoMonitorConfig = z.infer<typeof UndoRedoMonitorConfigSchema>;
export type UndoRedoOperation = z.infer<typeof UndoRedoOperationSchema>;
export type UndoRedoMonitorState = z.infer<typeof UndoRedoMonitorStateSchema>;

/**
 * Default monitor configuration
 */
export const DEFAULT_UNDO_REDO_MONITOR_CONFIG: UndoRedoMonitorConfig = {
  maxHistoryDepth: 10,
  checksumAlgorithm: 'simple',
  integrityCheckInterval: 0,
  enableAutoRecovery: false,
  maxDataSizeWarning: 1024 * 1024,
  enablePerformanceMonitoring: true,
  slowOperationThreshold: 1000,
};
