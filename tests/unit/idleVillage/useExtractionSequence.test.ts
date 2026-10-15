/**
 * useExtractionSequence — regression tests for the cancel contract.
 *
 * Bug R-195/PLAN-036: `cancel()` at `progress === 0` returned early WITHOUT
 * clearing the rAF hold scheduled by `start()`. A slot-token drag that armed
 * before the first animation frame (main-thread busy) called `cancel()` into
 * that window — the sequence then ran to `onExtracted` ~1.4s later and the
 * rack cleared the source slot mid/rejected-drag.
 */

import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import {
  useExtractionSequence,
  EXTRACTION_SEQUENCE_TIMING,
} from '@/ui/idleVillage/interaction/useExtractionSequence';

const TOTAL_MS =
  EXTRACTION_SEQUENCE_TIMING.holdMs +
  EXTRACTION_SEQUENCE_TIMING.bezelWaitMs +
  EXTRACTION_SEQUENCE_TIMING.overshootHoldMs +
  50;

describe('useExtractionSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancel at progress 0 stops the scheduled hold — onExtracted never fires', () => {
    const onExtracted = vi.fn();
    const { result } = renderHook(() => useExtractionSequence({ onExtracted }));

    act(() => {
      result.current.start();
    });
    /* The drag activates before the first rAF tick: progress is still 0. */
    expect(result.current.progress).toBe(0);
    act(() => {
      result.current.cancel();
    });

    act(() => {
      vi.advanceTimersByTime(TOTAL_MS);
    });
    expect(onExtracted).not.toHaveBeenCalled();
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('cancel mid-hold still eases back and never extracts', () => {
    const onExtracted = vi.fn();
    const { result } = renderHook(() => useExtractionSequence({ onExtracted }));

    act(() => {
      result.current.start();
    });
    /* Let the hold tick (rAF driven by fake timers). */
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.progress).toBeGreaterThan(0);
    expect(result.current.progress).toBeLessThan(1);

    act(() => {
      result.current.cancel();
    });
    act(() => {
      vi.advanceTimersByTime(TOTAL_MS);
    });
    expect(onExtracted).not.toHaveBeenCalled();
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('hold completed (progress 1) stays committed — late cancel does not abort', () => {
    const onExtracted = vi.fn();
    const { result } = renderHook(() => useExtractionSequence({ onExtracted }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(EXTRACTION_SEQUENCE_TIMING.holdMs + 50);
    });
    expect(result.current.progress).toBe(1);

    act(() => {
      result.current.cancel();
    });
    act(() => {
      vi.advanceTimersByTime(TOTAL_MS);
    });
    expect(onExtracted).toHaveBeenCalledTimes(1);
  });
});
