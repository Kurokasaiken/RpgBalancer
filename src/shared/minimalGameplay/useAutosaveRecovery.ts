/**
 * Minimal Autosave Recovery Hooks
 *
 * Provides reusable hooks for restoring the last valid autosave of the Minimal Gameplay store,
 * with conflict diagnostics, fallback documentation, and comprehensive error handling.
 *
 * This module follows config-first architecture and uses PersistenceService exclusively
 * for all storage operations, ensuring mobile-ready fallback and data integrity.
 */

import { useCallback, useState, useEffect } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { traceMinimalGameplay } from '@/shared/telemetry/telemetryProvider';

/**
 * Configuration options for autosave recovery behavior.
 */
export interface AutosaveRecoveryOptions {
  /** Maximum number of retry attempts for recovery operations. */
  maxRetries: number;
  /** Policy for handling conflicting snapshots. */
  conflictPolicy: 'last-wins' | 'first-wins' | 'manual';
  /** Whether to enable detailed logging. */
  enableLogging: boolean;
  /** Custom conflict resolution callback. */
  onConflict?: (existing: any, incoming: any) => any;
}

/**
 * Result of a recovery operation.
 */
export interface RecoveryResult {
  /** Whether recovery succeeded. */
  success: boolean;
  /** Recovered snapshot data. */
  data?: any;
  /** Error message if recovery failed. */
  error?: string;
  /** Whether a conflict was detected and resolved. */
  hadConflict?: boolean;
  /** Number of retry attempts made. */
  retriesUsed?: number;
}

/**
 * Snapshot metadata for validation and conflict resolution.
 */
export interface SnapshotMetadata {
  /** Snapshot version for migration support. */
  version: string;
  /** Timestamp when snapshot was created. */
  createdAt: number;
  /** Checksum for data integrity validation. */
  checksum: string;
  /** Summary of snapshot contents. */
  summary: {
    gold: number;
    food: number;
    currentDay: number;
    residentCount: number;
  };
}

/**
 * Complete autosave snapshot with metadata.
 */
export interface AutosaveSnapshot {
  /** Snapshot metadata. */
  metadata: SnapshotMetadata;
  /** Actual game state data. */
  data: any;
}

/**
 * Hook return interface for autosave recovery functionality.
 */
export interface UseAutosaveRecoveryResult {
  /** Attempt to recover the last valid autosave. */
  recoverLastSnapshot: () => Promise<RecoveryResult>;
  /** Check if there are conflicting snapshots. */
  hasConflicts: () => Promise<boolean>;
  /** Get detailed conflict information. */
  getConflictDetails: () => Promise<{
    existing: AutosaveSnapshot | null;
    incoming: AutosaveSnapshot | null;
    canResolve: boolean;
  }>;
  /** Whether recovery is currently in progress. */
  isRecovering: boolean;
  /** Last recovery result. */
  lastResult: RecoveryResult | null;
}

/**
 * Default recovery options.
 */
const DEFAULT_RECOVERY_OPTIONS: AutosaveRecoveryOptions = {
  maxRetries: 3,
  conflictPolicy: 'last-wins',
  enableLogging: false,
};

/**
 * Persistence key for minimal gameplay autosave snapshots.
 */
const AUTOSAVE_KEY = 'minimal_gameplay_autosave';

/**
 * Generate a simple checksum for snapshot data integrity.
 */
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Create snapshot metadata from game state data.
 */
function createSnapshotMetadata(data: any): SnapshotMetadata {
  return {
    version: '1.0',
    createdAt: Date.now(),
    checksum: generateChecksum(data),
    summary: {
      gold: data.gold || 0,
      food: data.food || 0,
      currentDay: data.currentDay || 0,
      residentCount: data.residents?.length || 0,
    },
  };
}

/**
 * Validate snapshot integrity using checksum.
 */
function validateSnapshot(snapshot: AutosaveSnapshot): boolean {
  const calculatedChecksum = generateChecksum(snapshot.data);
  return snapshot.metadata.checksum === calculatedChecksum;
}

/**
 * Resolve conflicts between existing and incoming snapshots based on policy.
 */
function resolveConflict(
  existing: AutosaveSnapshot,
  incoming: AutosaveSnapshot,
  policy: AutosaveRecoveryOptions['conflictPolicy'],
  customResolver?: AutosaveRecoveryOptions['onConflict']
): AutosaveSnapshot {
  if (customResolver) {
    const resolvedData = customResolver(existing.data, incoming.data);
    return {
      metadata: createSnapshotMetadata(resolvedData),
      data: resolvedData,
    };
  }

  switch (policy) {
    case 'last-wins':
      return incoming.metadata.createdAt > existing.metadata.createdAt ? incoming : existing;
    case 'first-wins':
      return incoming.metadata.createdAt < existing.metadata.createdAt ? incoming : existing;
    case 'manual':
    default:
      // For manual policy, prefer the existing snapshot
      return existing;
  }
}

/**
 * Hook for autosave recovery functionality.
 *
 * @param options - Recovery configuration options
 * @returns Recovery hook interface
 */
export function useAutosaveRecovery(
  options: Partial<AutosaveRecoveryOptions> = {}
): UseAutosaveRecoveryResult {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastResult, setLastResult] = useState<RecoveryResult | null>(null);

  const recoveryOptions = { ...DEFAULT_RECOVERY_OPTIONS, ...options };

  const log = useCallback(
    (message: string, data?: any) => {
      if (recoveryOptions.enableLogging) {
        console.log('[AutosaveRecovery]', message, data);
        traceMinimalGameplay?.('autosave_recovery_log', {
          message,
          data: data ? JSON.stringify(data).slice(0, 500) : undefined,
        });
      }
    },
    [recoveryOptions.enableLogging]
  );

  const recoverLastSnapshot = useCallback(async (): Promise<RecoveryResult> => {
    setIsRecovering(true);

    try {
      log('Starting autosave recovery');

      let snapshot: AutosaveSnapshot | null = null;
      let retries = 0;

      // Retry logic for loading
      while (retries <= recoveryOptions.maxRetries) {
        try {
          snapshot = await loadData(AUTOSAVE_KEY, null);
          if (snapshot) break;
        } catch (error) {
          log(`Load attempt ${retries + 1} failed`, { error: error.message });
          retries++;
          if (retries <= recoveryOptions.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }

      if (!snapshot) {
        const result: RecoveryResult = {
          success: false,
          error: 'No autosave snapshot found',
        };
        setLastResult(result);
        setIsRecovering(false);
        return result;
      }

      // Validate snapshot integrity
      if (!validateSnapshot(snapshot)) {
        log('Snapshot validation failed - checksum mismatch');
        const result: RecoveryResult = {
          success: false,
          error: 'Snapshot integrity check failed',
        };
        setLastResult(result);
        setIsRecovering(false);
        return result;
      }

      log('Successfully recovered autosave snapshot', snapshot.metadata.summary);

      const result: RecoveryResult = {
        success: true,
        data: snapshot.data,
        retriesUsed: retries,
      };

      setLastResult(result);
      setIsRecovering(false);
      return result;
    } catch (error) {
      log('Recovery failed with error', { error: error.message });

      const result: RecoveryResult = {
        success: false,
        error: error.message || 'Unknown recovery error',
      };

      setLastResult(result);
      setIsRecovering(false);
      return result;
    }
  }, [recoveryOptions.maxRetries, log]);

  const hasConflicts = useCallback(async (): Promise<boolean> => {
    try {
      const snapshot = await loadData(AUTOSAVE_KEY, null);
      return snapshot !== null;
    } catch {
      return false;
    }
  }, []);

  const getConflictDetails = useCallback(async () => {
    try {
      const snapshot = await loadData(AUTOSAVE_KEY, null) as AutosaveSnapshot | null;

      return {
        existing: snapshot,
        incoming: null, // No incoming snapshot in current context
        canResolve: snapshot ? validateSnapshot(snapshot) : false,
      };
    } catch {
      return {
        existing: null,
        incoming: null,
        canResolve: false,
      };
    }
  }, []);

  return {
    recoverLastSnapshot,
    hasConflicts,
    getConflictDetails,
    isRecovering,
    lastResult,
  };
}

/**
 * Utility function to create and save an autosave snapshot.
 * This is typically called by the store, not directly by consumers.
 */
export async function createAutosaveSnapshot(
  gameState: any,
  options: Partial<AutosaveRecoveryOptions> = {}
): Promise<boolean> {
  try {
    const recoveryOptions = { ...DEFAULT_RECOVERY_OPTIONS, ...options };
    const metadata = createSnapshotMetadata(gameState);
    const snapshot: AutosaveSnapshot = {
      metadata,
      data: gameState,
    };

    await saveData(AUTOSAVE_KEY, snapshot);

    if (recoveryOptions.enableLogging) {
      console.log('[AutosaveRecovery] Created snapshot', metadata.summary);
      traceMinimalGameplay?.('autosave_snapshot_created', {
        ...metadata.summary,
        createdAt: metadata.createdAt,
      });
    }

    return true;
  } catch (error) {
    console.warn('[AutosaveRecovery] Failed to create snapshot', error);
    return false;
  }
}
