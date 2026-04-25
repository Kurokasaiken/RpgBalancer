/**
 * STS Run Persistence Hook
 *
 * Provides save/load/resume functionality for STS simulator runs.
 * Serializes simulator state, logs, telemetry, and configuration for
 * persistent storage and restoration.
 */

import { useCallback, useState, useEffect } from 'react';
import { usePersistenceService } from '../../shared/hooks/usePersistenceService';
import { createSTSRunStore, type STSRunStore, type STSRunSnapshot, type STSRunListEntry } from '../../persistence/STSRunStore';
import type { STSSimulatorState } from './stsSimulatorState';
import type { STSRunRecorderState } from './useSTSRunRecorder';
import type { IntentTimeline } from './intentTimelineGenerator';
import type { STSCombatLogger } from './STSCombatLogger';

/**
 * Hook return type for STS run persistence
 */
export interface UseSTSRunPersistenceReturn {
  /** Save current run state */
  saveRun: (name?: string, description?: string) => Promise<void>;

  /** Load and resume a saved run */
  loadRun: (runId: string) => Promise<STSRunSnapshot | null>;

  /** List all saved runs */
  listRuns: () => Promise<STSRunListEntry[]>;

  /** Delete a saved run */
  deleteRun: (runId: string) => Promise<void>;

  /** Export current run as JSON */
  exportRun: () => string;

  /** Check if run exists */
  runExists: (runId: string) => Promise<boolean>;

  /** Current save operation status */
  isSaving: boolean;

  /** Last save error (if any) */
  lastSaveError: string | null;

  /** Last save timestamp */
  lastSavedAt: number | null;
}

/**
 * Hook parameters for STS run persistence
 */
export interface UseSTSRunPersistenceOptions {
  /** Current simulator state */
  simulatorState: STSSimulatorState;

  /** Current run recorder state */
  recorderState: STSRunRecorderState | null;

  /** Current intent timeline */
  intentTimeline: IntentTimeline | null;

  /** Combat logger instance */
  combatLogger: STSCombatLogger;

  /** Current configuration */
  config: {
    deckId: string;
    enemyId: string;
    seed: number;
  };

  /** Telemetry events (optional) */
  telemetryEvents?: Array<{
    timestamp: number;
    eventType: string;
    data: any;
  }>;
}

/**
 * STS Run Persistence Hook
 *
 * @param options - Hook configuration with current state
 * @returns Persistence interface for save/load operations
 */
export function useSTSRunPersistence(
  options: UseSTSRunPersistenceOptions
): UseSTSRunPersistenceReturn {
  const {
    simulatorState,
    recorderState,
    intentTimeline,
    combatLogger,
    config,
    telemetryEvents = [],
  } = options;

  // Persistence service and store
  const persistence = usePersistenceService();
  const [runStore] = useState<STSRunStore>(() => createSTSRunStore(persistence));

  // Operation state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  /**
   * Serialize combat logger entries
   */
  const serializeCombatLog = useCallback(() => {
    // Note: This assumes combatLogger has a method to get entries
    // In a real implementation, you'd need to expose this from STSCombatLogger
    return [
      {
        timestamp: Date.now(),
        level: 'info' as const,
        message: 'Combat log serialization placeholder',
        data: { entryCount: 'unknown' },
      },
    ];
  }, []);

  /**
   * Create run snapshot from current state
   */
  const createRunSnapshot = useCallback((
    name?: string,
    description?: string
  ): STSRunSnapshot => {
    const now = Date.now();

    return {
      runId: simulatorState.runId || `run-${now}`,

      metadata: {
        createdAt: recorderState?.startTime || now,
        lastSavedAt: now,
        version: '1.0.0',
        name,
        description,
      },

      config: {
        deckId: config.deckId,
        enemyId: config.enemyId,
        seed: config.seed,
      },

      simulatorState,

      recorderState: recorderState || {
        runId: simulatorState.runId || `run-${now}`,
        startTime: now,
        turnLogs: [],
        telemetryEvents: [],
        currentTurn: simulatorState.turnNumber,
      },

      intentTimeline,

      combatLogEntries: serializeCombatLog(),

      telemetryEvents,

      summary: simulatorState.result ? {
        runId: simulatorState.runId || `run-${now}`,
        startTime: recorderState?.startTime || now,
        endTime: now,
        duration: now - (recorderState?.startTime || now),
        deckId: config.deckId,
        enemyId: config.enemyId,
        seed: config.seed,
        result: simulatorState.result,
        totalTurns: simulatorState.turnNumber,
        finalPlayerHp: simulatorState.playerState.hp,
        finalEnemyHp: simulatorState.enemyState.hp,
        manaSpent: {}, // Would need to calculate from logs
        cardsPlayed: [], // Would need to extract from logs
        telemetryEvents,
      } : undefined,
    };
  }, [
    simulatorState,
    recorderState,
    intentTimeline,
    combatLogger,
    config,
    telemetryEvents,
    serializeCombatLog,
  ]);

  /**
   * Save current run state
   */
  const saveRun = useCallback(async (
    name?: string,
    description?: string
  ): Promise<void> => {
    if (!simulatorState.runId && !simulatorState.isRunning) {
      throw new Error('No active run to save');
    }

    setIsSaving(true);
    setLastSaveError(null);

    try {
      const snapshot = createRunSnapshot(name, description);
      await runStore.saveRun(snapshot);
      setLastSavedAt(Date.now());

      combatLogger.logSystem('Run saved successfully', [], {
        runId: snapshot.runId,
        name,
        turnNumber: simulatorState.turnNumber,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastSaveError(errorMessage);
      combatLogger.error('Failed to save run', { error: errorMessage });
      throw error;

    } finally {
      setIsSaving(false);
    }
  }, [
    simulatorState,
    createRunSnapshot,
    runStore,
    combatLogger,
  ]);

  /**
   * Load and return a saved run snapshot
   */
  const loadRun = useCallback(async (runId: string): Promise<STSRunSnapshot | null> => {
    try {
      const snapshot = await runStore.loadRun(runId);

      if (snapshot) {
        combatLogger.info('Run loaded successfully', {
          runId,
          name: snapshot.metadata.name,
          turnNumber: snapshot.simulatorState.turnNumber,
        });
      }

      return snapshot;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      combatLogger.error('Failed to load run', { runId, error: errorMessage });
      throw error;
    }
  }, [runStore, combatLogger]);

  /**
   * List all saved runs
   */
  const listRuns = useCallback(async (): Promise<STSRunListEntry[]> => {
    try {
      return await runStore.listRuns();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      combatLogger.error('Failed to list runs', { error: errorMessage });
      throw error;
    }
  }, [runStore, combatLogger]);

  /**
   * Delete a saved run
   */
  const deleteRun = useCallback(async (runId: string): Promise<void> => {
    try {
      await runStore.deleteRun(runId);
      combatLogger.info('Run deleted successfully', { runId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      combatLogger.error('Failed to delete run', { runId, error: errorMessage });
      throw error;
    }
  }, [runStore, combatLogger]);

  /**
   * Export current run as JSON string
   */
  const exportRun = useCallback((): string => {
    try {
      const snapshot = createRunSnapshot();
      return JSON.stringify(snapshot, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      combatLogger.error('Failed to export run', { error: errorMessage });
      throw error;
    }
  }, [createRunSnapshot, combatLogger]);

  /**
   * Check if a run exists
   */
  const runExists = useCallback(async (runId: string): Promise<boolean> => {
    try {
      return await runStore.runExists(runId);
    } catch (error) {
      combatLogger.error('Failed to check run existence', { runId, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }, [runStore, combatLogger]);

  return {
    saveRun,
    loadRun,
    listRuns,
    deleteRun,
    exportRun,
    runExists,
    isSaving,
    lastSaveError,
    lastSavedAt,
  };
}
