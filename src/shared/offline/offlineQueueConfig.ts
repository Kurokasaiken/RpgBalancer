/**
 * Offline Queue Configuration
 * 
 * Config-first configuration for offline queue system.
 * Defines retry logic, exponential backoff, and conflict resolution.
 * 
 * @since NP-207 – Offline Queue System
 */

import { z } from 'zod';

/**
 * Queue action status
 */
export type QueueActionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'server-wins' | 'client-wins' | 'merge' | 'manual';

/**
 * Queue action
 */
export interface QueueAction {
  /** Unique identifier */
  id: string;
  /** Action type */
  type: string;
  /** Action payload */
  payload: unknown;
  /** Current status */
  status: QueueActionStatus;
  /** Retry count */
  retryCount: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last attempt timestamp */
  lastAttemptAt?: number;
  /** Next retry timestamp */
  nextRetryAt?: number;
  /** Error message if failed */
  error?: string;
  /** Conflict data if applicable */
  conflictData?: unknown;
}

/**
 * Offline queue configuration
 */
export interface OfflineQueueConfig {
  /** Enable offline queue */
  enabled: boolean;
  /** IndexedDB database name */
  dbName: string;
  /** IndexedDB store name */
  storeName: string;
  /** Maximum queue size */
  maxQueueSize: number;
  /** Retry configuration */
  retry: {
    /** Maximum retry attempts */
    maxRetries: number;
    /** Initial retry delay in milliseconds */
    initialDelayMs: number;
    /** Maximum retry delay in milliseconds */
    maxDelayMs: number;
    /** Exponential backoff multiplier */
    backoffMultiplier: number;
    /** Enable exponential backoff */
    useExponentialBackoff: boolean;
  };
  /** Conflict resolution */
  conflict: {
    /** Default conflict resolution strategy */
    defaultStrategy: ConflictStrategy;
    /** Enable automatic conflict resolution */
    autoResolve: boolean;
    /** Conflict detection timeout in milliseconds */
    detectionTimeoutMs: number;
  };
  /** Sync configuration */
  sync: {
    /** Enable automatic sync on reconnect */
    autoSyncOnReconnect: boolean;
    /** Sync interval in milliseconds */
    syncIntervalMs: number;
    /** Batch size for sync operations */
    batchSize: number;
  };
  /** Telemetry */
  telemetry: {
    /** Enable telemetry */
    enabled: boolean;
    /** Track queue metrics */
    trackMetrics: boolean;
  };
}

/**
 * Zod schemas
 */
export const QueueActionSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.unknown(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'conflict']),
  retryCount: z.number().min(0),
  createdAt: z.number(),
  lastAttemptAt: z.number().optional(),
  nextRetryAt: z.number().optional(),
  error: z.string().optional(),
  conflictData: z.unknown().optional(),
});

export const OfflineQueueConfigSchema = z.object({
  enabled: z.boolean().default(true),
  dbName: z.string().default('offline-queue-db'),
  storeName: z.string().default('actions'),
  maxQueueSize: z.number().min(10).max(10000).default(1000),
  retry: z.object({
    maxRetries: z.number().min(0).max(10).default(3),
    initialDelayMs: z.number().min(100).max(60000).default(1000),
    maxDelayMs: z.number().min(1000).max(300000).default(60000),
    backoffMultiplier: z.number().min(1).max(10).default(2),
    useExponentialBackoff: z.boolean().default(true),
  }),
  conflict: z.object({
    defaultStrategy: z.enum(['server-wins', 'client-wins', 'merge', 'manual']).default('server-wins'),
    autoResolve: z.boolean().default(true),
    detectionTimeoutMs: z.number().min(1000).max(60000).default(5000),
  }),
  sync: z.object({
    autoSyncOnReconnect: z.boolean().default(true),
    syncIntervalMs: z.number().min(1000).max(300000).default(30000),
    batchSize: z.number().min(1).max(100).default(10),
  }),
  telemetry: z.object({
    enabled: z.boolean().default(true),
    trackMetrics: z.boolean().default(true),
  }),
});

/**
 * Default configuration
 */
export const DEFAULT_OFFLINE_QUEUE_CONFIG: OfflineQueueConfig = {
  enabled: true,
  dbName: 'offline-queue-db',
  storeName: 'actions',
  maxQueueSize: 1000,
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    useExponentialBackoff: true,
  },
  conflict: {
    defaultStrategy: 'server-wins',
    autoResolve: true,
    detectionTimeoutMs: 5000,
  },
  sync: {
    autoSyncOnReconnect: true,
    syncIntervalMs: 30000,
    batchSize: 10,
  },
  telemetry: {
    enabled: true,
    trackMetrics: true,
  },
};
