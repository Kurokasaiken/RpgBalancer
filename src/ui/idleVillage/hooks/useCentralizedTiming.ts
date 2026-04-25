/**
 * Centralized Timing System
 * 
 * Single source of truth for all timing in the minimal gameplay.
 * Replaces multiple local timers with one authoritative clock.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { MinimalGameplayState } from '@/store/useMinimalGameplay';

interface UseCentralizedTimingProps {
  /** The gameplay state with timing controls */
  gameplayState: MinimalGameplayState;
  /** Optional callback for when timing updates */
  onTick?: (deltaMs: number) => void;
}

/**
 * Hook that manages a single, centralized timing system.
 * 
 * This ensures:
 * - Only one timing loop is ever running
 * - All components read from the same time source
 * - No exponential acceleration from multiple loops
 * - Proper cleanup on unmount
 */
export function useCentralizedTiming({ 
  gameplayState, 
  onTick 
}: UseCentralizedTimingProps) {
  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const startTiming = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start if not paused
    if (gameplayState.state.isPaused) {
      return;
    }

    // Integer tick model: Fixed 1-second intervals, speed multiplier affects ticks per second
    const speedMultiplier = Math.max(1, gameplayState.state.speedMultiplier || 1);
    const intervalMs = 1000; // Always 1 second intervals

    // Start the single timing loop
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      // Call the store's tick method with 1-second delta
      // The store will calculate integer ticks based on speed multiplier
      gameplayState.tick(1000, 'auto');

      // Optional callback for additional timing logic
      if (onTick) {
        onTick(1000);
      }
    }, intervalMs);

    console.log('[CentralizedTiming] Started integer timing loop', {
      intervalMs,
      speedMultiplier,
      ticksPerSecond: speedMultiplier,
    });
  }, [gameplayState, onTick]);

  const stopTiming = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[CentralizedTiming] Stopped timing loop');
    }
  }, []);

  // Centralized timing effect
  useEffect(() => {
    if (gameplayState.state.isPaused) {
      stopTiming();
    } else {
      startTiming();
    }

    // Cleanup on unmount
    return () => {
      stopTiming();
    };
  }, [gameplayState.state.isPaused, gameplayState.state.speedMultiplier, startTiming, stopTiming]);

  // Handle speed multiplier changes
  useEffect(() => {
    if (!gameplayState.state.isPaused) {
      // Restart timing with new speed
      startTiming();
    }
  }, [gameplayState.state.speedMultiplier, startTiming]);

  return {
    isRunning: intervalRef.current !== null,
    startTiming,
    stopTiming,
  };
}
