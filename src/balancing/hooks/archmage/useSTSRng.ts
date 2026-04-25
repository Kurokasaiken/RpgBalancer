/**
 * STS RNG Determinism Hook
 * 
 * Provides deterministic RNG for STS simulator with seed override support,
 * sequence tracking, and reproducibility verification.
 * 
 * @module useSTSRng
 * @since 2026-01-11
 * @author Helios-RNG
 */

import { useRef, useCallback, useMemo, useState } from 'react';
import { createSeededRng } from '../../utils/archmage/seededRng';

/**
 * RNG call tracking entry
 */
export interface RngCallEntry {
  /** Call index */
  index: number;
  /** Generated value */
  value: number;
  /** Timestamp */
  timestamp: number;
  /** Optional context (e.g., "card_draw", "damage_roll") */
  context?: string;
}

/**
 * RNG sequence snapshot for replay
 */
export interface RngSequenceSnapshot {
  /** Seed used */
  seed: number;
  /** All RNG calls */
  calls: RngCallEntry[];
  /** Total calls made */
  totalCalls: number;
  /** Sequence start time */
  startTime: number;
  /** Sequence end time */
  endTime: number;
}

/**
 * Options for useSTSRng hook
 */
export interface UseSTSRngOptions {
  /** Initial seed (defaults to Date.now()) */
  initialSeed?: number;
  /** Whether to track RNG calls for replay */
  enableTracking?: boolean;
  /** Maximum tracked calls (default: 10000) */
  maxTrackedCalls?: number;
  /** Enable debug logging */
  enableDebug?: boolean;
}

/**
 * Result from useSTSRng hook
 */
export interface UseSTSRngResult {
  /** Current seed */
  seed: number;
  /** RNG function */
  rng: () => number;
  /** RNG function with context */
  rngWithContext: (context: string) => number;
  /** Reset RNG with new seed */
  resetWithSeed: (newSeed: number) => void;
  /** Get current sequence snapshot */
  getSequenceSnapshot: () => RngSequenceSnapshot;
  /** Verify sequence matches expected values */
  verifySequence: (expected: number[]) => boolean;
  /** Clear tracking history */
  clearTracking: () => void;
  /** Get call count */
  getCallCount: () => number;
}

/**
 * Hook for deterministic RNG with tracking and replay support
 * 
 * @param options - Configuration options
 * @returns RNG utilities and tracking functions
 * 
 * @example
 * ```typescript
 * const { rng, rngWithContext, getSequenceSnapshot } = useSTSRng({
 *   initialSeed: 12345,
 *   enableTracking: true,
 * });
 * 
 * const damage = Math.floor(rngWithContext('damage_roll') * 10);
 * const snapshot = getSequenceSnapshot();
 * ```
 */
export function useSTSRng(options: UseSTSRngOptions = {}): UseSTSRngResult {
  const {
    initialSeed,
    enableTracking = false,
    maxTrackedCalls = 10000,
    enableDebug = false,
  } = options;

  // Initialize seed once
  const [defaultSeed] = useState(() => initialSeed ?? Date.now());
  const actualSeed = initialSeed ?? defaultSeed;

  // Store current seed
  const seedRef = useRef(actualSeed);
  
  // Store RNG function
  const rngFnRef = useRef(createSeededRng(actualSeed));
  
  // Store tracking data (lazy initialization for startTime)
  const trackingRef = useRef<{
    calls: RngCallEntry[];
    startTime: number;
    callCount: number;
  } | null>(null);
  
  if (!trackingRef.current) {
    trackingRef.current = {
      calls: [],
      startTime: performance.now(),
      callCount: 0,
    };
  }

  // Reset RNG with new seed
  const resetWithSeed = useCallback((newSeed: number) => {
    seedRef.current = newSeed;
    rngFnRef.current = createSeededRng(newSeed);
    
    if (enableTracking) {
      trackingRef.current = {
        calls: [],
        startTime: Date.now(),
        callCount: 0,
      };
    }

    if (enableDebug) {
      console.log('[useSTSRng] Reset with seed:', newSeed);
    }
  }, [enableTracking, enableDebug]);

  // RNG function with optional tracking
  const rng = useCallback(() => {
    const value = rngFnRef.current();
    
    if (enableTracking) {
      const tracking = trackingRef.current;
      
      if (tracking.calls.length < maxTrackedCalls) {
        tracking.calls.push({
          index: tracking.callCount,
          value,
          timestamp: Date.now(),
        });
      }
      
      tracking.callCount++;
    }

    return value;
  }, [enableTracking, maxTrackedCalls]);

  // RNG function with context
  const rngWithContext = useCallback((context: string) => {
    const value = rngFnRef.current();
    
    if (enableTracking) {
      const tracking = trackingRef.current;
      
      if (tracking.calls.length < maxTrackedCalls) {
        tracking.calls.push({
          index: tracking.callCount,
          value,
          timestamp: Date.now(),
          context,
        });
      }
      
      tracking.callCount++;

      if (enableDebug) {
        console.log(`[useSTSRng] ${context}:`, value.toFixed(6));
      }
    }

    return value;
  }, [enableTracking, maxTrackedCalls, enableDebug]);

  // Get sequence snapshot
  const getSequenceSnapshot = useCallback((): RngSequenceSnapshot => {
    const tracking = trackingRef.current;
    
    return {
      seed: seedRef.current,
      calls: [...tracking.calls],
      totalCalls: tracking.callCount,
      startTime: tracking.startTime,
      endTime: Date.now(),
    };
  }, []);

  // Verify sequence matches expected values
  const verifySequence = useCallback((expected: number[]): boolean => {
    const tracking = trackingRef.current;
    
    if (expected.length > tracking.calls.length) {
      if (enableDebug) {
        console.warn('[useSTSRng] Not enough calls to verify:', {
          expected: expected.length,
          actual: tracking.calls.length,
        });
      }
      return false;
    }

    for (let i = 0; i < expected.length; i++) {
      if (Math.abs(tracking.calls[i].value - expected[i]) > 1e-10) {
        if (enableDebug) {
          console.warn('[useSTSRng] Sequence mismatch at index', i, {
            expected: expected[i],
            actual: tracking.calls[i].value,
          });
        }
        return false;
      }
    }

    return true;
  }, [enableDebug]);

  // Clear tracking history
  const clearTracking = useCallback(() => {
    trackingRef.current = {
      calls: [],
      startTime: Date.now(),
      callCount: 0,
    };

    if (enableDebug) {
      console.log('[useSTSRng] Tracking cleared');
    }
  }, [enableDebug]);

  // Get call count
  const getCallCount = useCallback(() => {
    return trackingRef.current.callCount;
  }, []);

  return useMemo(() => ({
    seed: seedRef.current,
    rng,
    rngWithContext,
    resetWithSeed,
    getSequenceSnapshot,
    verifySequence,
    clearTracking,
    getCallCount,
  }), [rng, rngWithContext, resetWithSeed, getSequenceSnapshot, verifySequence, clearTracking, getCallCount]);
}

/**
 * Replay an RNG sequence from a snapshot
 * 
 * @param snapshot - Sequence snapshot to replay
 * @returns Array of regenerated values
 * 
 * @example
 * ```typescript
 * const snapshot = getSequenceSnapshot();
 * const replayed = replayRngSequence(snapshot);
 * console.log('Match:', replayed.every((v, i) => v === snapshot.calls[i].value));
 * ```
 */
export function replayRngSequence(snapshot: RngSequenceSnapshot): number[] {
  const rng = createSeededRng(snapshot.seed);
  const values: number[] = [];
  
  for (let i = 0; i < snapshot.totalCalls; i++) {
    values.push(rng());
  }
  
  return values;
}

/**
 * Compare two RNG sequences for equality
 * 
 * @param seq1 - First sequence snapshot
 * @param seq2 - Second sequence snapshot
 * @returns Comparison result with details
 */
export function compareRngSequences(
  seq1: RngSequenceSnapshot,
  seq2: RngSequenceSnapshot
): {
  seedsMatch: boolean;
  lengthsMatch: boolean;
  valuesMatch: boolean;
  firstMismatchIndex: number | null;
  maxDifference: number;
} {
  const seedsMatch = seq1.seed === seq2.seed;
  const lengthsMatch = seq1.totalCalls === seq2.totalCalls;
  
  let firstMismatchIndex: number | null = null;
  let maxDifference = 0;
  let valuesMatch = true;
  
  const minLength = Math.min(seq1.calls.length, seq2.calls.length);
  
  for (let i = 0; i < minLength; i++) {
    const diff = Math.abs(seq1.calls[i].value - seq2.calls[i].value);
    maxDifference = Math.max(maxDifference, diff);
    
    if (diff > 1e-10) {
      valuesMatch = false;
      if (firstMismatchIndex === null) {
        firstMismatchIndex = i;
      }
    }
  }
  
  return {
    seedsMatch,
    lengthsMatch,
    valuesMatch,
    firstMismatchIndex,
    maxDifference,
  };
}
