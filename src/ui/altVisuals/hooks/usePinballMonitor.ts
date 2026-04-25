import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_PINBALL_MONITOR_CONFIG,
  resolvePinballMonitorConfig,
} from '@/ui/altVisuals/config/pinballMonitorConfig';
import type { PinballMonitorConfig } from '@/ui/altVisuals/config/pinballMonitorConfig';

/**
 * Snapshot of the Alt Visuals pinball runtime.
 * Exposed by the animation bridge so the monitor can inspect state without
 * accessing internal refs directly.
 */
export interface PinballAnimationSummary {
  sceneId: string;
  /** Timestamp (ms) of the last ball launch. */
  lastBallLaunchTs: number;
  /** Timestamp (ms) of the most recent ball stop event. */
  lastBallStopTs?: number;
  /** Timestamp (ms) of last pillar impact (enemy or player). */
  lastPillarImpactTs?: number;
  /** Ball runtime flags. */
  ballActive: boolean;
  ballStopped: boolean;
  /** Pillar progress counters. */
  enemyPillarsLanded: number;
  playerPillarsLanded: number;
  totalPillars: number;
  /** Optional metadata forwarded to telemetry (e.g., success chance). */
  telemetryContext?: Record<string, unknown>;
}

export interface PinballAnimationBridge {
  getSummary: () => PinballAnimationSummary | null;
  relaunchBall?: () => void;
  relaunchScene?: () => void;
  autoLaunchBall?: () => void;
}

export type PinballWatchdogReason =
  | 'ball_stuck'
  | 'pillar_stall'
  | 'auto_launch'
  | 'manual_scan'
  | 'manual_relaunch'
  | 'bridge_missing';

export type PinballWatchdogAction = 'none' | 'relaunch_ball' | 'relaunch_scene';

export interface PinballWatchdogEvent {
  timestamp: number;
  severity: 'info' | 'warn' | 'error';
  origin: 'auto' | 'manual';
  reason: PinballWatchdogReason;
  action: PinballWatchdogAction;
  summary?: PinballAnimationSummary | null;
  diagnostics?: PinballMonitorFlags;
  metadata?: Record<string, unknown>;
}

export interface PinballMonitorFlags {
  bridgeReady: boolean;
  ballStuck: boolean;
  pillarStalled: boolean;
  awaitingAutoLaunch: boolean;
}

export interface PinballMonitorDerivedMetrics {
  ballRuntimeMs?: number;
  timeSinceImpactMs?: number;
  flags: PinballMonitorFlags;
}

export interface PinballMonitorState {
  status: MonitorStatus;
  lastSummary: PinballAnimationSummary | null;
  lastScan: number | null;
  lastRecovery?: PinballRecoveryRecord;
  events: PinballWatchdogEvent[];
  lastEvent?: PinballWatchdogEvent;
  derived: PinballMonitorDerivedMetrics | null;
  error?: string;
}

export type MonitorStatus = 'idle' | 'waiting_bridge' | 'monitoring' | 'recovering' | 'error';

export interface PinballRecoveryRecord {
  timestamp: number;
  reason: PinballWatchdogReason;
  action: PinballWatchdogAction;
}

export interface PinballMonitorOptions {
  config?: Partial<PinballMonitorConfig>;
  resolveBridge?: () => PinballAnimationBridge | null;
  onTelemetryEvent?: (event: PinballWatchdogEvent) => void;
  enableCliDiagnostics?: boolean;
}

export interface UsePinballMonitorResult {
  status: MonitorStatus;
  summary: PinballAnimationSummary | null;
  derived: PinballMonitorDerivedMetrics | null;
  events: PinballWatchdogEvent[];
  lastEvent?: PinballWatchdogEvent;
  lastScan: number | null;
  lastRecovery?: PinballRecoveryRecord;
  config: PinballMonitorConfig;
  scanNow: () => void;
  forceBallRelaunch: (reason?: PinballWatchdogReason) => void;
  forceSceneRelaunch: (reason?: PinballWatchdogReason) => void;
}

declare global {
  interface Window {
    __ALT_VISUALS_PINBALL__?: PinballAnimationBridge | null;
    __ALT_VISUALS_PINBALL_MONITOR__?: {
      getLatestState: () => PinballMonitorState;
      forceScan: () => void;
      config: PinballMonitorConfig;
    };
  }
}

const RECOVERY_COOLDOWN_MS = 1500;

const defaultResolveBridge = (): PinballAnimationBridge | null => {
  if (typeof window === 'undefined') return null;
  const bridge = window.__ALT_VISUALS_PINBALL__;
  if (!bridge || typeof bridge.getSummary !== 'function') return null;
  return bridge;
};

export function usePinballMonitor(options: PinballMonitorOptions = {}): UsePinballMonitorResult {
  const {
    config: configOverrides,
    resolveBridge: resolveBridgeOption,
    onTelemetryEvent,
    enableCliDiagnostics = false,
  } = options;

  const resolvedConfig = useMemo<PinballMonitorConfig>(
    () => resolvePinballMonitorConfig(configOverrides),
    [configOverrides],
  );

  const resolveBridgeRef = useRef(resolveBridgeOption ?? defaultResolveBridge);
  const telemetryHandlerRef = useRef(onTelemetryEvent ?? null);
  useEffect(() => {
    resolveBridgeRef.current = resolveBridgeOption ?? defaultResolveBridge;
  }, [resolveBridgeOption]);
  useEffect(() => {
    telemetryHandlerRef.current = onTelemetryEvent ?? null;
  }, [onTelemetryEvent]);

  const [state, setState] = useState<PinballMonitorState>(() => ({
    status: 'idle',
    lastSummary: null,
    lastScan: null,
    events: [],
    derived: {
      ballRuntimeMs: undefined,
      timeSinceImpactMs: undefined,
      flags: {
        bridgeReady: false,
        ballStuck: false,
        pillarStalled: false,
        awaitingAutoLaunch: false,
      },
    },
  }));

  const recoveryTimestampsRef = useRef<Record<PinballWatchdogReason, number>>({
    ball_stuck: 0,
    pillar_stall: 0,
    auto_launch: 0,
    manual_scan: 0,
    manual_relaunch: 0,
    bridge_missing: 0,
  });

  const pushEvent = useCallback(
    (event: PinballWatchdogEvent) => {
      setState((prev) => {
        const events = [...prev.events, event];
        while (events.length > resolvedConfig.maxEventHistory) {
          events.shift();
        }
        return {
          ...prev,
          events,
          lastEvent: event,
        };
      });
      telemetryHandlerRef.current?.(event);
      if (typeof window !== 'undefined') {
        const evt = new CustomEvent<PinballWatchdogEvent>(resolvedConfig.telemetryEventName, {
          detail: event,
        });
        window.dispatchEvent(evt);
      }
      if (resolvedConfig.diagnostics && typeof console !== 'undefined') {
        console.info('[PinballMonitor]', event.reason, event);
      }
    },
    [resolvedConfig.maxEventHistory, resolvedConfig.telemetryEventName, resolvedConfig.diagnostics],
  );

  const evaluateSummary = useCallback(
    (summary: PinballAnimationSummary, now: number): PinballMonitorDerivedMetrics => {
      const totalPillars = summary.totalPillars || 5;
      const enemyComplete = summary.enemyPillarsLanded >= totalPillars;
      const playerComplete = summary.playerPillarsLanded >= totalPillars;
      const lastImpactTs = summary.lastPillarImpactTs ?? summary.lastBallLaunchTs;
      const impactDelta = now - (lastImpactTs || now);
      const ballRuntime = now - summary.lastBallLaunchTs;

      const flags: PinballMonitorFlags = {
        bridgeReady: true,
        ballStuck: summary.ballActive && ballRuntime > resolvedConfig.ballStuckThresholdMs,
        awaitingAutoLaunch:
          !summary.ballActive &&
          enemyComplete &&
          playerComplete &&
          now - (summary.lastBallStopTs ?? summary.lastBallLaunchTs) > resolvedConfig.autoLaunchGraceMs,
        pillarStalled:
          !(enemyComplete && playerComplete) &&
          impactDelta > resolvedConfig.pillarStallThresholdMs,
      };

      return {
        ballRuntimeMs: ballRuntime,
        timeSinceImpactMs: impactDelta,
        flags,
      };
    },
    [
      resolvedConfig.ballStuckThresholdMs,
      resolvedConfig.autoLaunchGraceMs,
      resolvedConfig.pillarStallThresholdMs,
    ],
  );

  const attemptRecovery = useCallback(
    (
      reason: PinballWatchdogReason,
      summary: PinballAnimationSummary,
      derived: PinballMonitorDerivedMetrics,
      bridge: PinballAnimationBridge,
      origin: 'auto' | 'manual',
    ) => {
      const now = Date.now();
      const lastAttempt = recoveryTimestampsRef.current[reason];
      if (lastAttempt && now - lastAttempt < RECOVERY_COOLDOWN_MS) {
        return;
      }

      recoveryTimestampsRef.current[reason] = now;

      let action: PinballWatchdogAction = 'none';
      if (reason === 'pillar_stall') {
        if (bridge.relaunchScene) {
          bridge.relaunchScene();
          action = 'relaunch_scene';
        } else if (bridge.relaunchBall) {
          bridge.relaunchBall();
          action = 'relaunch_ball';
        }
      } else if (bridge.autoLaunchBall && reason === 'auto_launch') {
        bridge.autoLaunchBall();
        action = 'relaunch_ball';
      } else if (bridge.relaunchBall) {
        bridge.relaunchBall();
        action = 'relaunch_ball';
      }

      setState((prev) => ({
        ...prev,
        status: 'recovering',
        lastRecovery: {
          timestamp: now,
          reason,
          action,
        },
        lastSummary: summary,
        derived,
      }));

      pushEvent({
        timestamp: now,
        severity: action === 'none' ? 'warn' : 'info',
        origin,
        reason,
        action,
        summary,
        diagnostics: derived.flags,
      });
    },
    [pushEvent],
  );

  const runScan = useCallback(
    (origin: 'auto' | 'manual' = 'auto') => {
      const now = Date.now();
      const bridge = resolveBridgeRef.current();

      if (!bridge) {
        setState((prev) => ({
          ...prev,
          status: 'waiting_bridge',
          lastSummary: null,
          derived: {
            ballRuntimeMs: undefined,
            timeSinceImpactMs: undefined,
            flags: {
              bridgeReady: false,
              ballStuck: false,
              pillarStalled: false,
              awaitingAutoLaunch: false,
            },
          },
          lastScan: now,
        }));
        pushEvent({
          timestamp: now,
          severity: 'warn',
          origin,
          reason: 'bridge_missing',
          action: 'none',
          metadata: { error: 'Bridge is missing' },
        });
        return;
      }

      let summary: PinballAnimationSummary | null = null;
      try {
        summary = bridge.getSummary();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unable to read pinball summary.',
          lastScan: now,
        }));
        pushEvent({
          timestamp: now,
          severity: 'error',
          origin,
          reason: 'bridge_missing',
          action: 'none',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
        return;
      }

      if (!summary) {
        setState((prev) => ({
          ...prev,
          status: 'waiting_bridge',
          lastSummary: null,
          lastScan: now,
        }));
        return;
      }

      const derived = evaluateSummary(summary, now);

      if (derived.flags.ballStuck) {
        attemptRecovery('ball_stuck', summary, derived, bridge, origin);
      } else if (derived.flags.awaitingAutoLaunch) {
        attemptRecovery('auto_launch', summary, derived, bridge, origin);
      } else if (derived.flags.pillarStalled) {
        attemptRecovery('pillar_stall', summary, derived, bridge, origin);
      } else {
        setState((prev) => ({
          ...prev,
          status: 'monitoring',
          lastSummary: summary,
          derived,
          lastScan: now,
          error: undefined,
        }));
      }
    },
    [attemptRecovery, evaluateSummary, pushEvent],
  );

  const scanNow = useCallback(() => runScan('manual'), [runScan]);

  const forceBallRelaunch = useCallback(
    (reason: PinballWatchdogReason = 'manual_relaunch') => {
      const bridge = resolveBridgeRef.current();
      if (!bridge || !bridge.relaunchBall) return;
      bridge.relaunchBall();
      const now = Date.now();
      pushEvent({
        timestamp: now,
        severity: 'info',
        origin: 'manual',
        reason,
        action: 'relaunch_ball',
      });
      setState((prev) => ({
        ...prev,
        lastRecovery: {
          timestamp: now,
          reason,
          action: 'relaunch_ball',
        },
      }));
    },
    [pushEvent],
  );

  const forceSceneRelaunch = useCallback(
    (reason: PinballWatchdogReason = 'manual_relaunch') => {
      const bridge = resolveBridgeRef.current();
      if (!bridge || !bridge.relaunchScene) {
        forceBallRelaunch(reason);
        return;
      }
      bridge.relaunchScene();
      const now = Date.now();
      pushEvent({
        timestamp: now,
        severity: 'info',
        origin: 'manual',
        reason,
        action: 'relaunch_scene',
      });
      setState((prev) => ({
        ...prev,
        lastRecovery: {
          timestamp: now,
          reason,
          action: 'relaunch_scene',
        },
      }));
    },
    [forceBallRelaunch, pushEvent],
  );

  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      runScan('auto');
      timer = window.setTimeout(tick, resolvedConfig.pollingIntervalMs);
    };
    tick();
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [runScan, resolvedConfig.pollingIntervalMs]);

  useEffect(() => {
    if (!enableCliDiagnostics || typeof window === 'undefined') return;
    window.__ALT_VISUALS_PINBALL_MONITOR__ = {
      getLatestState: () => state,
      forceScan: scanNow,
      config: resolvedConfig,
    };
    return () => {
      if (window.__ALT_VISUALS_PINBALL_MONITOR__) {
        delete window.__ALT_VISUALS_PINBALL_MONITOR__;
      }
    };
  }, [enableCliDiagnostics, resolvedConfig, scanNow, state]);

  return {
    status: state.status,
    summary: state.lastSummary,
    derived: state.derived,
    events: state.events,
    lastEvent: state.lastEvent,
    lastScan: state.lastScan,
    lastRecovery: state.lastRecovery,
    config: resolvedConfig,
    scanNow,
    forceBallRelaunch,
    forceSceneRelaunch,
  };
}

export { DEFAULT_PINBALL_MONITOR_CONFIG };
