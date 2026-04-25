/**
 * Hook for recording STS simulation runs and telemetry
 * 
 * Handles logging, telemetry collection, and run persistence for the STS simulator.
 * Integrates with the existing Punch Club analytics pipeline.
 */

import { useCallback } from 'react';
import { reportSTSCombatMetrics } from '@/analytics/telemetry/telemetryProvider';
import { saveData } from '@/shared/persistence/PersistenceService';
import { STSTelemetryConfig } from '@/balancing/config/archmage/telemetryConfig';

export interface STSTurnLog {
  turnNumber: number;
  phase: 'player' | 'enemy';
  actions: Array<{
    type: string;
    details: string;
    manaSpent?: Record<string, number>;
    outcome?: string;
  }>;
  playerState: {
    hp: number;
    resonance: Record<string, number>;
    inspiration: number;
    handSize: number;
  };
  enemyState: {
    hp: number;
    intent?: string;
    block?: number;
  };
  timestamp: number;
}

export interface STSRunSummary {
  runId: string;
  deckId: string;
  enemyId: string;
  seed: number;
  startTime: number;
  endTime?: number;
  totalTurns: number;
  result: 'victory' | 'defeat' | 'timeout';
  finalPlayerHp: number;
  finalEnemyHp: number;
  agencyMetrics: {
    totalTurns: number;
    actionTurns: number;
    noActionTurns: number;
    agencyRate: number;
  };
  manaMetrics: {
    totalManaSpent: Record<string, number>;
    averageManaPerTurn: Record<string, number>;
    manaEfficiency: number;
  };
  pacingMetrics: {
    averageTurnLength: number;
    earlyGameTurns: number;
    midGameTurns: number;
    lateGameTurns: number;
  };
}

export interface STSTelemetryEvent {
  type:
    | 'sts_run_start'
    | 'sts_turn_tick'
    | 'sts_agency_gap'
    | 'sts_pacing_band'
    | 'sts_resource_balance'
    | 'sts_run_complete';
  timestamp: number;
  runId: string;
  deckId: string;
  enemyId: string;
  seed: number;
  data: Record<string, unknown>;
}

/**
 * Internal state tracked throughout a simulator run.
 */
interface ResourceSnapshot {
  turnNumber: number;
  resonanceTotal: number;
  inspiration: number;
}

export interface STSRunRecorderState {
  runId: string;
  deckId: string;
  enemyId: string;
  seed: number;
  startTime: number;
  turnLogs: STSTurnLog[];
  agency: {
    totalPlayerTurns: number;
    actionTurns: number;
    noActionTurns: number;
    consecutiveNoAction: number;
  };
  manaTracking: {
    totalManaSpent: Record<string, number>;
  };
  resourceBalance: {
    snapshots: ResourceSnapshot[];
  };
}

/**
 * Emits a telemetry event to the Punch Club diagnostics pipeline.
 */
const emitTelemetryEvent = (
  runState: Pick<STSRunRecorderState, 'runId' | 'deckId' | 'enemyId' | 'seed'>,
  type: STSTelemetryEvent['type'],
  data: Record<string, unknown>,
) => {
  reportSTSCombatMetrics({
    type,
    timestamp: Date.now(),
    runId: runState.runId,
    deckId: runState.deckId,
    enemyId: runState.enemyId,
    seed: runState.seed,
    data,
  });
};

const sumManaSpent = (actions: STSTurnLog['actions']): Record<string, number> => {
  return actions.reduce<Record<string, number>>((acc, action) => {
    if (!action.manaSpent) {
      return acc;
    }
    Object.entries(action.manaSpent).forEach(([type, amount]) => {
      if (typeof amount === 'number') {
        acc[type] = (acc[type] ?? 0) + amount;
      }
    });
    return acc;
  }, {});
};

const mergeManaTotals = (
  totals: Record<string, number>,
  delta: Record<string, number>,
): Record<string, number> => {
  const nextTotals = { ...totals };
  Object.entries(delta).forEach(([type, amount]) => {
    nextTotals[type] = (nextTotals[type] ?? 0) + amount;
  });
  return nextTotals;
};

const getActionsTakenCount = (actions: STSTurnLog['actions']): number => {
  return actions.filter((action) => action.type !== 'no_action').length;
};

const getBandFromTurns = (totalTurns: number): 'early' | 'mid' | 'late' => {
  if (totalTurns <= STSTelemetryConfig.pacing.earlyTurnCap) return 'early';
  if (totalTurns <= STSTelemetryConfig.pacing.midTurnCap) return 'mid';
  return 'late';
};

const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => {
      const delta = value - mean;
      return sum + delta * delta;
    }, 0) / values.length;
  return variance;
};

/**
 * Hook for managing STS run recording and telemetry
 */
export function useSTSRunRecorder() {
  const generateRunId = useCallback(() => {
    return `sts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const startRun = useCallback(
    (deckId: string, enemyId: string, seed: number): STSRunRecorderState => {
      const runId = generateRunId();
      const startTime = Date.now();

      const runState: STSRunRecorderState = {
        runId,
        deckId,
        enemyId,
        seed,
        startTime,
        turnLogs: [],
        agency: {
          totalPlayerTurns: 0,
          actionTurns: 0,
          noActionTurns: 0,
          consecutiveNoAction: 0,
        },
        manaTracking: {
          totalManaSpent: {},
        },
        resourceBalance: {
          snapshots: [],
        },
      };

      emitTelemetryEvent(runState, 'sts_run_start', {
        deckId,
        enemyId,
        seed,
        startTime,
      });

      return runState;
    },
    [generateRunId],
  );

  const appendTurnLog = useCallback(
    (runState: STSRunRecorderState, turnLog: Omit<STSTurnLog, 'timestamp'>): STSRunRecorderState => {
      const timestampedLog: STSTurnLog = {
        ...turnLog,
        timestamp: Date.now(),
      };

      const manaSpentThisTurn = sumManaSpent(turnLog.actions);
      const updatedManaTotals = mergeManaTotals(runState.manaTracking.totalManaSpent, manaSpentThisTurn);

      let updatedAgency = runState.agency;
      if (turnLog.phase === 'player') {
        const actionCount = getActionsTakenCount(turnLog.actions);
        const actionTaken = actionCount > 0;
        const consecutiveNoAction = actionTaken ? 0 : runState.agency.consecutiveNoAction + 1;

        updatedAgency = {
          totalPlayerTurns: runState.agency.totalPlayerTurns + 1,
          actionTurns: runState.agency.actionTurns + (actionTaken ? 1 : 0),
          noActionTurns: runState.agency.noActionTurns + (actionTaken ? 0 : 1),
          consecutiveNoAction,
        };

        if (consecutiveNoAction >= STSTelemetryConfig.agency.idleTurnThreshold) {
          emitTelemetryEvent(runState, 'sts_agency_gap', {
            turnNumber: turnLog.turnNumber,
            consecutiveNoAction,
          });
        }
      }

      emitTelemetryEvent(runState, 'sts_turn_tick', {
        turnNumber: turnLog.turnNumber,
        phase: turnLog.phase,
        actions: turnLog.actions.map((action) => action.type),
        actionCount: turnLog.actions.length,
        manaSpent: manaSpentThisTurn,
        fallbackUsed: turnLog.actions.some((action) => action.type === 'fallback_ritual'),
        enemyIntent: turnLog.enemyState.intent,
      });

      const resonanceTotal = Object.values(turnLog.playerState.resonance).reduce((sum, value) => sum + value, 0);
      const inspiration = turnLog.playerState.inspiration;
      const nextSnapshots = [
        ...runState.resourceBalance.snapshots,
        { turnNumber: turnLog.turnNumber, resonanceTotal, inspiration },
      ].slice(-STSTelemetryConfig.resourceBalance.windowSize);

      const diffs = nextSnapshots.map((snapshot) => snapshot.resonanceTotal - snapshot.inspiration);
      const variance = calculateVariance(diffs);
      const varianceAlert =
        variance >= STSTelemetryConfig.resourceBalance.varianceAlertThreshold && nextSnapshots.length > 1;

      const trackedResonance = STSTelemetryConfig.resourceBalance.trackedManaTypes.reduce<Record<string, number>>(
        (acc, type) => {
          acc[type] = turnLog.playerState.resonance[type] ?? 0;
          return acc;
        },
        {},
      );

      emitTelemetryEvent(runState, 'sts_resource_balance', {
        turnNumber: turnLog.turnNumber,
        resonanceTotal,
        inspiration,
        variance,
        varianceAlert,
        trackedResonance,
      });

      return {
        ...runState,
        turnLogs: [...runState.turnLogs, timestampedLog],
        agency: updatedAgency,
        manaTracking: {
          totalManaSpent: updatedManaTotals,
        },
        resourceBalance: {
          snapshots: nextSnapshots,
        },
      };
    },
    [],
  );

  const finalizeRun = useCallback(
    (
      runState: STSRunRecorderState,
      result: 'victory' | 'defeat' | 'timeout',
      deckId: string,
      enemyId: string,
      seed: number,
    ) => {
      const endTime = Date.now();
      const totalTurns = runState.turnLogs.length;

      const pacingMetrics = {
        averageTurnLength: totalTurns > 0 ? (endTime - runState.startTime) / totalTurns : 0,
        earlyGameTurns: runState.turnLogs.filter(
          (log) => log.turnNumber <= STSTelemetryConfig.pacing.earlyTurnCap,
        ).length,
        midGameTurns: runState.turnLogs.filter(
          (log) =>
            log.turnNumber > STSTelemetryConfig.pacing.earlyTurnCap &&
            log.turnNumber <= STSTelemetryConfig.pacing.midTurnCap,
        ).length,
        lateGameTurns: runState.turnLogs.filter(
          (log) => log.turnNumber > STSTelemetryConfig.pacing.midTurnCap,
        ).length,
      };

      const summary: STSRunSummary = {
        runId: runState.runId,
        deckId,
        enemyId,
        seed,
        startTime: runState.startTime,
        endTime,
        totalTurns,
        result,
        finalPlayerHp: runState.turnLogs[runState.turnLogs.length - 1]?.playerState.hp ?? 0,
        finalEnemyHp: runState.turnLogs[runState.turnLogs.length - 1]?.enemyState.hp ?? 0,
        agencyMetrics: {
          totalTurns: runState.agency.totalPlayerTurns,
          actionTurns: runState.agency.actionTurns,
          noActionTurns: runState.agency.noActionTurns,
          agencyRate:
            runState.agency.totalPlayerTurns > 0
              ? runState.agency.actionTurns / runState.agency.totalPlayerTurns
              : 0,
        },
        manaMetrics: {
          totalManaSpent: runState.manaTracking.totalManaSpent,
          averageManaPerTurn:
            runState.agency.totalPlayerTurns > 0
              ? Object.fromEntries(
                  Object.entries(runState.manaTracking.totalManaSpent).map(([type, total]) => [
                    type,
                    total / runState.agency.totalPlayerTurns,
                  ]),
                )
              : {},
          manaEfficiency:
            totalTurns > 0
              ? Object.values(runState.manaTracking.totalManaSpent).reduce((sum, val) => sum + val, 0) / totalTurns
              : 0,
        },
        pacingMetrics,
      };

      emitTelemetryEvent(runState, 'sts_pacing_band', {
        totalTurns,
        pacingBand: getBandFromTurns(totalTurns),
      });

      emitTelemetryEvent(runState, 'sts_run_complete', {
        result,
        totalTurns,
        finalPlayerHp: summary.finalPlayerHp,
        finalEnemyHp: summary.finalEnemyHp,
      });

      void saveData(`sts_runs/${runState.runId}`, {
        summary,
        turnLogs: runState.turnLogs,
      });

      return summary;
    },
    [],
  );

  const exportRunData = useCallback((runState: STSRunRecorderState) => {
    return {
      runId: runState.runId,
      deckId: runState.deckId,
      enemyId: runState.enemyId,
      seed: runState.seed,
      turnLogs: runState.turnLogs,
      exportedAt: Date.now(),
    };
  }, []);

  return {
    // Run lifecycle
    startRun,
    appendTurnLog,
    finalizeRun,
    
    // Data export
    exportRunData,
    
    // Utilities
    generateRunId
  };
}
