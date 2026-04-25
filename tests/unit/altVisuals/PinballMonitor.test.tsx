import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PinballAnimationBridge, PinballAnimationSummary } from '@/ui/altVisuals/hooks/usePinballMonitor';
import { usePinballMonitor } from '@/ui/altVisuals/hooks/usePinballMonitor';

describe('usePinballMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const buildSummary = (overrides: Partial<PinballAnimationSummary> = {}): PinballAnimationSummary => {
    const now = Date.now();
    return {
      sceneId: 'alt-visuals-v6',
      lastBallLaunchTs: now - 100,
      lastBallStopTs: now - 50,
      lastPillarImpactTs: now - 50,
      enemyPillarsLanded: 5,
      playerPillarsLanded: 5,
      totalPillars: 5,
      ballActive: true,
      ballStopped: false,
      telemetryContext: { successChance: 62 },
      ...overrides,
    };
  };

  const runInitialTimers = () => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
  };

  it('transitions to waiting_bridge when bridge is missing', () => {
    const resolveBridge = vi.fn<() => PinballAnimationBridge | null>(() => null);
    const { result } = renderHook(() =>
      usePinballMonitor({
        resolveBridge,
        config: {
          pollingIntervalMs: 50,
        },
      }),
    );

    runInitialTimers();

    expect(result.current.status).toBe('waiting_bridge');
    expect(result.current.summary).toBeNull();
    expect(resolveBridge).toHaveBeenCalled();
  });

  it('relaunches ball when runtime exceeds threshold', () => {
    const relaunchBall = vi.fn();
    const summary = buildSummary({
      lastBallLaunchTs: Date.now() - 2000,
      ballActive: true,
    });
    const bridge: PinballAnimationBridge = {
      getSummary: () => summary,
      relaunchBall,
    };

    const { result } = renderHook(() =>
      usePinballMonitor({
        resolveBridge: () => bridge,
        config: {
          pollingIntervalMs: 50,
          ballStuckThresholdMs: 500,
        },
      }),
    );

    runInitialTimers();

    expect(relaunchBall).toHaveBeenCalled();
    expect(result.current.lastRecovery?.reason).toBe('ball_stuck');
    expect(result.current.events.at(-1)?.reason).toBe('ball_stuck');
  });

  it('exposes manual controls for scan and relaunch', () => {
    const relaunchScene = vi.fn();
    const summary = buildSummary({
      ballActive: false,
    });
    const bridge: PinballAnimationBridge = {
      getSummary: () => summary,
      relaunchScene,
    };

    const telemetrySpy = vi.fn();

    const { result } = renderHook(() =>
      usePinballMonitor({
        resolveBridge: () => bridge,
        onTelemetryEvent: telemetrySpy,
        config: {
          pollingIntervalMs: 1000,
        },
      }),
    );

    act(() => {
      result.current.scanNow();
    });

    expect(result.current.status).toBe('monitoring');

    act(() => {
      result.current.forceSceneRelaunch();
    });

    expect(relaunchScene).toHaveBeenCalled();
    expect(telemetrySpy).toHaveBeenCalledWith(expect.objectContaining({ reason: 'manual_relaunch' }));
  });
});
