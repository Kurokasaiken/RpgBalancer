/**
 * Offline Queue Configuration
 * 
 * Config-first offline operation queue with automatic sync and conflict resolution.
 * Supports multiple conflict resolution strategies and sync policies.
 */

export interface OfflineQueueConfig {
  // Queue behavior
  maxQueueSize: number;
  retryAttempts: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  maxRetryDelayMs: number;

  // Sync policies
  syncIntervalMs: number;
  syncOnConnect: boolean;
  syncOnAppFocus: boolean;
  batchSyncSize: number;
  syncTimeoutMs: number;

  // Conflict resolution strategies
  conflictResolution: 'last-write-wins' | 'merge' | 'manual' | 'timestamp';
  conflictDetection: 'version' | 'hash' | 'timestamp' | 'custom';
  mergeStrategy: 'shallow' | 'deep' | 'custom';

  // Storage configuration
  storageKey: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;

  // Operation types and priorities
  operationPriorities: Record<string, number>;
  criticalOperations: string[];

  // Network detection
  networkCheckIntervalMs: number;
  connectionTimeoutMs: number;
  minBandwidthKbps: number;

  // Telemetry and monitoring
  enableTelemetry: boolean;
  telemetryBatchSize: number;
  telemetryFlushIntervalMs: number;

  // UI feedback
  showSyncStatus: boolean;
  showConflictDialog: boolean;
  autoResolveConflicts: boolean;
}

export interface QueuedOperation {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  priority: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';
  error?: string;
  metadata?: {
    userId?: string;
    sessionId?: string;
    version?: number;
    hash?: string;
    [key: string]: any;
  };
}

export interface ConflictResolution {
  operationId: string;
  conflictType: 'version' | 'data' | 'timestamp' | 'custom';
  localData: any;
  remoteData: any;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  resolvedData?: any;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
  pendingOperations: number;
  failedOperations: number;
  lastSyncTime: number;
  nextSyncTime: number;
  conflicts: ConflictResolution[];
}

export interface OfflineQueueMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageSyncTime: number;
  conflictRate: number;
  retryRate: number;
  queueSize: number;
  lastOperationTime: number;
}

export const DEFAULT_OFFLINE_QUEUE_CONFIG: OfflineQueueConfig = {
  // Queue behavior
  maxQueueSize: 1000,
  retryAttempts: 3,
  retryDelayMs: 1000,
  exponentialBackoff: true,
  maxRetryDelayMs: 30000,

  // Sync policies
  syncIntervalMs: 30000, // 30 seconds
  syncOnConnect: true,
  syncOnAppFocus: true,
  batchSyncSize: 10,
  syncTimeoutMs: 10000,

  // Conflict resolution
  conflictResolution: 'last-write-wins',
  conflictDetection: 'timestamp',
  mergeStrategy: 'shallow',

  // Storage configuration
  storageKey: 'offline_queue',
  compressionEnabled: true,
  encryptionEnabled: false,

  // Operation priorities (higher = more important)
  operationPriorities: {
    'user_action': 10,
    'critical_save': 9,
    'data_sync': 5,
    'analytics': 3,
    'background_task': 1,
  },
  criticalOperations: [
    'user_action',
    'critical_save',
    'emergency_sync'
  ],

  // Network detection
  networkCheckIntervalMs: 5000,
  connectionTimeoutMs: 3000,
  minBandwidthKbps: 100,

  // Telemetry and monitoring
  enableTelemetry: true,
  telemetryBatchSize: 50,
  telemetryFlushIntervalMs: 60000, // 1 minute

  // UI feedback
  showSyncStatus: true,
  showConflictDialog: true,
  autoResolveConflicts: false,
};

// Operation type definitions
export const OPERATION_TYPES = {
  USER_ACTION: 'user_action',
  CRITICAL_SAVE: 'critical_save',
  DATA_SYNC: 'data_sync',
  ANALYTICS: 'analytics',
  BACKGROUND_TASK: 'background_task',
  EMERGENCY_SYNC: 'emergency_sync',
} as const;

// Conflict resolution strategies
export const CONFLICT_RESOLUTION_STRATEGIES = {
  LAST_WRITE_WINS: 'last-write-wins',
  MERGE: 'merge',
  MANUAL: 'manual',
  TIMESTAMP: 'timestamp',
} as const;

// Conflict detection methods
export const CONFLICT_DETECTION_METHODS = {
  VERSION: 'version',
  HASH: 'hash',
  TIMESTAMP: 'timestamp',
  CUSTOM: 'custom',
} as const;

// Merge strategies
export const MERGE_STRATEGIES = {
  SHALLOW: 'shallow',
  DEEP: 'deep',
  CUSTOM: 'custom',
} as const;

// Utility functions for configuration
export function validateOfflineQueueConfig(config: OfflineQueueConfig): boolean {
  // Validate numeric values
  if (config.maxQueueSize <= 0 || config.maxQueueSize > 10000) return false;
  if (config.retryAttempts < 0 || config.retryAttempts > 10) return false;
  if (config.retryDelayMs <= 0 || config.retryDelayMs > 60000) return false;
  if (config.syncIntervalMs <= 0 || config.syncIntervalMs > 300000) return false;
  if (config.batchSyncSize <= 0 || config.batchSyncSize > 100) return false;

  // Validate string values
  if (!Object.values(CONFLICT_RESOLUTION_STRATEGIES).includes(config.conflictResolution as any)) return false;
  if (!Object.values(CONFLICT_DETECTION_METHODS).includes(config.conflictDetection as any)) return false;
  if (!Object.values(MERGE_STRATEGIES).includes(config.mergeStrategy as any)) return false;

  // Validate arrays
  if (!Array.isArray(config.criticalOperations)) return false;
  if (!Object.keys(config.operationPriorities).length) return false;

  return true;
}

export function createOfflineQueueConfig(overrides: Partial<OfflineQueueConfig> = {}): OfflineQueueConfig {
  const config = { ...DEFAULT_OFFLINE_QUEUE_CONFIG, ...overrides };
  
  if (!validateOfflineQueueConfig(config)) {
    throw new Error('Invalid offline queue configuration');
  }

  return config;
}

// Priority management
export function getOperationPriority(operationType: string, config: OfflineQueueConfig): number {
  return config.operationPriorities[operationType] || 5; // Default medium priority
}

export function isCriticalOperation(operationType: string, config: OfflineQueueConfig): boolean {
  return config.criticalOperations.includes(operationType);
}

// Retry delay calculation
export function calculateRetryDelay(attempt: number, config: OfflineQueueConfig): number {
  if (!config.exponentialBackoff) {
    return config.retryDelayMs;
  }

  const delay = config.retryDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxRetryDelayMs);
}

// Conflict resolution helpers
export function detectConflict(localData: any, remoteData: any, method: string): boolean {
  switch (method) {
    case 'version':
      return localData.version !== remoteData.version;
    case 'hash':
      return localData.hash !== remoteData.hash;
    case 'timestamp':
      return Math.abs(localData.timestamp - remoteData.timestamp) > 1000; // 1 second threshold
    case 'custom':
      return localData.customHash !== remoteData.customHash;
    default:
      return false;
  }
}

export function resolveConflict(
  localData: any,
  remoteData: any,
  strategy: string,
  mergeStrategy: string = 'shallow'
): any {
  switch (strategy) {
    case 'last-write-wins':
      return localData.timestamp > remoteData.timestamp ? localData : remoteData;
    
    case 'timestamp':
      return localData.timestamp > remoteData.timestamp ? localData : remoteData;
    
    case 'merge':
      return mergeData(localData, remoteData, mergeStrategy);
    
    case 'manual':
      throw new Error('Manual conflict resolution required');
    
    default:
      return remoteData;
  }
}

function mergeData(local: any, remote: any, strategy: string): any {
  switch (strategy) {
    case 'shallow':
      return { ...remote, ...local };
    
    case 'deep':
      return deepMerge(remote, local);
    
    case 'custom':
      // Custom merge logic would be implemented here
      return { ...remote, ...local };
    
    default:
      return remote;
  }
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// Network status utilities
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function getNetworkStatus(): NetworkStatus {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  return {
    isOnline: navigator.onLine,
    connectionType: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
  };
}

export function isConnectionAdequate(status: NetworkStatus, config: OfflineQueueConfig): boolean {
  return status.isOnline && 
         status.downlink >= (config.minBandwidthKbps / 1000) &&
         status.rtt <= config.connectionTimeoutMs;
}
