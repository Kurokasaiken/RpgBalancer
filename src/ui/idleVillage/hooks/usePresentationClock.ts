import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePresentationClockOptions {
  /** Tick interval in milliseconds. Default 500ms. */
  tickIntervalMs?: number;
  /** Initial tick value. Default 0. */
  initialTick?: number;
  /** Initial play state. Default false. */
  initialIsPlaying?: boolean;
}

export interface UsePresentationClockResult {
  /** Current simulation tick. Fixed timestep. */
  tick: number;
  /** Interpolation alpha between 0 and 1 for rendering smoothness. */
  interpolation: number;
  /** Whether the clock is running. */
  isPlaying: boolean;
  /** Start the clock. */
  play: () => void;
  /** Pause the clock. */
  pause: () => void;
  /** Advance by one tick. */
  step: () => void;
  /** Jump to a specific tick. */
  setTick: (tick: number) => void;
  /** Set play state directly. */
  setIsPlaying: (playing: boolean) => void;
}

/**
 * Minimal presentation clock: fixed timestep `tick` for determinism plus
 * `interpolation` (0..1) for smooth rendering via `requestAnimationFrame`.
 *
 * TimeEngine.ts does not expose a tick-by-tick bus, so this adapter is local
 * to the presentation layer. It is the single clock source for the Sandbox
 * Director and any other presentation consumers.
 */
export function usePresentationClock(options: UsePresentationClockOptions = {}): UsePresentationClockResult {
  const { tickIntervalMs = 500, initialTick = 0, initialIsPlaying = false } = options;

  const [tick, setTick] = useState(initialTick);
  const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
  const [interpolation, setInterpolation] = useState(0);

  const rafRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);

  const step = useCallback(() => {
    setTick((t) => t + 1);
    lastTickTimeRef.current = performance.now();
  }, []);

  const setTickStable = useCallback((nextTick: number) => {
    setTick(nextTick);
    lastTickTimeRef.current = performance.now();
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    if (!isPlaying || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTickTimeRef.current = performance.now();

    const loop = (now: number) => {
      const interval = Math.max(1, tickIntervalMs);
      const last = lastTickTimeRef.current ?? now;
      const elapsed = now - last;
      const ticksToAdvance = Math.floor(elapsed / interval);

      if (ticksToAdvance > 0) {
        setTick((t) => t + ticksToAdvance);
        lastTickTimeRef.current = last + ticksToAdvance * interval;
      }

      const sinceLastTick = now - (lastTickTimeRef.current ?? now);
      setInterpolation(Math.min(1, Math.max(0, sinceLastTick / interval)));

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, tickIntervalMs]);

  return {
    tick,
    interpolation,
    isPlaying,
    play,
    pause,
    step,
    setTick: setTickStable,
    setIsPlaying,
  };
}
