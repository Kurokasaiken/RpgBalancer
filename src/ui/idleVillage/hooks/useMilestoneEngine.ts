/**
 * useMilestoneEngine — fires one event per quest milestone, exactly once.
 *
 * The caller owns the clock and passes `elapsedMs`; this hook only decides
 * when a threshold has been crossed. Every milestone fires at most once per
 * run, and crossing several at once (high clock speed, tab regaining focus)
 * fires them in ascending order rather than dropping the intermediates.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Payload describing a crossed milestone. */
export interface MilestoneEvent {
  /** Zero-based index into the milestone thresholds. */
  milestoneIndex: number;
  /** The threshold that was crossed, in milliseconds. */
  thresholdMs: number;
  /** Elapsed time when the crossing was observed, in milliseconds. */
  elapsedMs: number;
}

export interface UseMilestoneEngineOptions {
  /** Elapsed quest time in milliseconds. */
  elapsedMs: number;
  /** Ascending milestone thresholds in milliseconds. */
  milestones: readonly number[];
  /** Whether the quest is running; turning this off resets the engine. */
  active: boolean;
  /** Called once for each crossed milestone, in ascending order. */
  onMilestone: (event: MilestoneEvent) => void;
}

export interface UseMilestoneEngineResult {
  /** How many milestones have fired in the current run. */
  firedCount: number;
  /** Clears the fired set so the same thresholds can fire again. */
  reset: () => void;
}

/**
 * Watches elapsed time and emits milestone events.
 * @param options - Clock input, thresholds and the milestone callback
 * @returns The number of milestones fired so far plus an explicit reset
 */
export function useMilestoneEngine({
  elapsedMs,
  milestones,
  active,
  onMilestone,
}: UseMilestoneEngineOptions): UseMilestoneEngineResult {
  const firedRef = useRef<Set<number>>(new Set());
  const [firedCount, setFiredCount] = useState(0);

  const reset = useCallback(() => {
    firedRef.current = new Set();
    setFiredCount(0);
  }, []);

  useEffect(() => {
    if (!active) {
      if (firedRef.current.size > 0) reset();
      return;
    }

    const crossed: MilestoneEvent[] = [];
    milestones.forEach((thresholdMs, milestoneIndex) => {
      if (elapsedMs >= thresholdMs && !firedRef.current.has(milestoneIndex)) {
        firedRef.current.add(milestoneIndex);
        crossed.push({ milestoneIndex, thresholdMs, elapsedMs });
      }
    });

    if (crossed.length === 0) return;

    crossed.sort((a, b) => a.milestoneIndex - b.milestoneIndex);
    crossed.forEach((event) => onMilestone(event));
    setFiredCount(firedRef.current.size);
    // `onMilestone` is a dependency rather than a ref: a fresh closure each
    // render re-runs this effect, but the fired set makes it a no-op, so the
    // callback stays current without ever firing a milestone twice.
  }, [elapsedMs, milestones, active, reset, onMilestone]);

  return { firedCount, reset };
}

export default useMilestoneEngine;
