/**
 * useExtractionSequence — single source of truth for the press-and-hold
 * extraction choreography. Certified reference behavior: the /slot page.
 *
 * Sequence (all timings shared by every slot surface):
 *   hold      : progress 0 → 1 in HOLD_MS (drives SlotV12Renderer: teeth
 *               retract first, then the bezel counter-rotates)
 *   bezelWait : wait BEZEL_WAIT_MS for the bezel animation to complete
 *   overshoot : progress 1.2 (spring flare), hold OVERSHOOT_HOLD_MS
 *   extracted : progress 1.0 + onExtracted() — remove the occupant here and
 *               start the return flight; call reset() when it lands
 *   cancel()  : released early → progress eases back to 0
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export const EXTRACTION_SEQUENCE_TIMING = {
  /** Press-and-hold duration driving the bezel/teeth animation. */
  holdMs: 560,
  /** Wait for the bezel CSS transition to complete before the spring flare. */
  bezelWaitMs: 560,
  /** How long the 1.2 overshoot flare is held before extraction. */
  overshootHoldMs: 300,
  /** Close animation duration when the hold is released early. */
  cancelMs: 300,
} as const;

export interface UseExtractionSequenceOptions {
  /** The occupant must be removed here (and any return flight started). */
  onExtracted: () => void;
  /** Fired at the spring overshoot (e.g. medal spring, detach sound). */
  onOvershoot?: () => void;
}

export interface ExtractionSequenceApi {
  isExtracting: boolean;
  /** 0..1 hold progress, 1.2 during the overshoot flare. */
  progress: number;
  /** Begin the sequence (pointer-down or programmatic trigger). */
  start: () => void;
  /** Abort an in-progress hold (pointer released early): eases back to 0. */
  cancel: () => void;
  /** Return to idle (call when the post-extraction flight completes). */
  reset: () => void;
}

export function useExtractionSequence({ onExtracted, onOvershoot }: UseExtractionSequenceOptions): ExtractionSequenceApi {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgressState] = useState(0);
  const progressRef = useRef(0);
  const setProgress = useCallback((value: number) => {
    progressRef.current = value;
    setProgressState(value);
  }, []);
  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const onExtractedRef = useRef(onExtracted);
  const onOvershootRef = useRef(onOvershoot);

  useEffect(() => {
    onExtractedRef.current = onExtracted;
    onOvershootRef.current = onOvershoot;
  }, [onExtracted, onOvershoot]);

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Visual animation timing, deliberately outside any game-time provider
    // eslint-disable-next-line no-restricted-globals
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const schedule = useCallback((cb: () => void, delay: number) => {
    // eslint-disable-next-line no-restricted-globals
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      cb();
    }, delay);
    timeoutsRef.current.push(id);
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setIsExtracting(false);
    setProgress(0);
  }, [clearTimers, setProgress]);

  const start = useCallback(() => {
    clearTimers();
    setIsExtracting(true);
    setProgress(0);

    const startTime = Date.now();
    rafRef.current = requestAnimationFrame(function animate() {
      const p = Math.min((Date.now() - startTime) / EXTRACTION_SEQUENCE_TIMING.holdMs, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      rafRef.current = null;
      schedule(() => {
        setProgress(1.2); // spring overshoot flare
        onOvershootRef.current?.();
        schedule(() => {
          setProgress(1.0);
          onExtractedRef.current();
        }, EXTRACTION_SEQUENCE_TIMING.overshootHoldMs);
      }, EXTRACTION_SEQUENCE_TIMING.bezelWaitMs);
    });
  }, [clearTimers, schedule, setProgress]);

  const cancel = useCallback(() => {
    // Only cancels an in-progress hold; once extracted, reset() is the way back
    const from = progressRef.current;
    if (from <= 0 || from >= 1) return;
    clearTimers();
    const startTime = Date.now();
    const animateClose = () => {
      const t = Math.min((Date.now() - startTime) / EXTRACTION_SEQUENCE_TIMING.cancelMs, 1);
      setProgress(from * (1 - t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animateClose);
      } else {
        rafRef.current = null;
        setIsExtracting(false);
        setProgress(0);
      }
    };
    rafRef.current = requestAnimationFrame(animateClose);
  }, [clearTimers, setProgress]);

  return { isExtracting, progress, start, cancel, reset };
}
