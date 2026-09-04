import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Breathing oscillator for world-surface layers.
 *
 * Produces a smooth sine-wave offset that pauses/resumes on user interaction.
 * Pause uses smooth easing (200ms) to avoid jarring stops.
 */
export const useBreather = (
  frequency: number = 0.06,    // Hz (e.g., 0.06 = 16.7s per cycle)
  magnitude: number = 1,       // screen px amplitude
  phase: number = 0,           // phase offset in radians [0, 2π]
) => {
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const rafRef = useRef<number>();
  const startTimeRef = useRef(performance.now());
  const pauseStartRef = useRef<number | null>(null);
  const pausedOffsetRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      if (!isPaused) {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const value = Math.sin(elapsed * Math.PI * 2 * frequency + phase);
        const newOffset = magnitude * value;
        setOffset(newOffset);
        pausedOffsetRef.current = newOffset;
      } else if (pauseStartRef.current !== null) {
        // Smooth easing during pause: reduce offset to 0 over 200ms
        const pausedElapsed = (performance.now() - pauseStartRef.current) / 200;
        const easeOut = 1 - Math.pow(1 - Math.min(pausedElapsed, 1), 3);
        const easedOffset = pausedOffsetRef.current * (1 - easeOut);
        setOffset(easedOffset);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frequency, magnitude, phase, isPaused]);

  const pause = useCallback((p: boolean) => {
    if (p && !isPaused) {
      pauseStartRef.current = performance.now();
      setIsPaused(true);
    } else if (!p && isPaused) {
      pauseStartRef.current = null;
      setIsPaused(false);
    }
  }, [isPaused]);

  return { offset, pause };
};
