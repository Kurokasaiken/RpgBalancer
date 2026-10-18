/**
 * useExtractionStateMachine Unit Tests
 *
 * Tests state machine transitions, timing, and cleanup behavior.
 * Contract: idle → extracting → bezelAnimating → completing → springBack
 *           → clearing → idle (cancel: → springBack → clearing → idle).
 */
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useExtractionStateMachine, type ExtractionPhase } from '@/ui/idleVillage/hooks/useExtractionStateMachine';

describe('useExtractionStateMachine', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts in idle phase with correct defaults', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isBezelAnimationDone).toBe(false);
      expect(result.current.state.isMedalFadingOut).toBe(false);
      expect(result.current.state.isSloggingOut).toBe(false);
    });

    it('accepts custom timing options', () => {
      const customOptions = {
        bezelDuration: 1000,
        springDuration: 800,
        cleanupDelay: 300,
      };

      const { result } = renderHook(() => useExtractionStateMachine(customOptions));

      // Should still start in idle phase
      expect(result.current.state.phase).toBe('idle');
    });
  });

  describe('state transitions', () => {
    it('transitions through all phases correctly', async () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      // Start extraction
      act(() => {
        result.current.startExtraction();
      });

      expect(result.current.state.phase).toBe('extracting');
      expect(result.current.state.isMedalFadingOut).toBe(false);

      // Extraction hold completes (560ms rAF progress → 1) → bezelAnimating
      act(() => {
        vi.advanceTimersByTime(560);
      });

      expect(result.current.state.phase).toBe('bezelAnimating');
      expect(result.current.state.extractionProgress).toBe(1);
      expect(result.current.state.isMedalFadingOut).toBe(true);

      // Bezel animation completes (560ms more) → completing (the pop)
      act(() => {
        vi.advanceTimersByTime(560);
      });

      expect(result.current.state.phase).toBe('completing');
      expect(result.current.state.extractionProgress).toBe(1.12);
      expect(result.current.state.isBezelAnimationDone).toBe(true);

      // Pop (280ms) → springBack
      act(() => {
        vi.advanceTimersByTime(280);
      });

      expect(result.current.state.phase).toBe('springBack');
      expect(result.current.state.extractionProgress).toBe(1);

      // Spring flight (600ms) → clearing
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.state.phase).toBe('clearing');
      expect(result.current.state.extractionProgress).toBe(0);

      // Cleanup (200ms) → idle
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isMedalFadingOut).toBe(false);
      expect(result.current.state.isBezelAnimationDone).toBe(false);
    });

    it('updates extraction progress during extracting phase', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      act(() => {
        result.current.startExtraction();
      });

      // Advance time to check progress
      act(() => {
        vi.advanceTimersByTime(280); // Halfway through extraction
      });

      expect(result.current.state.phase).toBe('extracting');
      expect(result.current.state.extractionProgress).toBeCloseTo(0.5, 1);
    });
  });

  describe('cancel extraction', () => {
    /* Current contract: cancel does NOT snap to idle — the bezel springs back
     * elastically: <any active phase> → springBack → clearing → idle. */
    it('springs back to idle when cancelled during extracting', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      act(() => {
        result.current.startExtraction();
      });

      // Cancel during extraction → elastic spring-back, not a hard reset
      act(() => {
        result.current.cancelExtraction();
      });

      expect(result.current.state.phase).toBe('springBack');

      // Spring decay (600ms + rAF frame slack) → clearing, then cleanup (200ms) → idle
      act(() => {
        vi.advanceTimersByTime(640);
      });
      expect(result.current.state.phase).toBe('clearing');
      expect(result.current.state.extractionProgress).toBe(0);

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isSloggingOut).toBe(false);
    });

    it('springs back to idle when cancelled during bezel animation', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      act(() => {
        result.current.startExtraction();
        vi.advanceTimersByTime(560); // Reach bezelAnimating
      });

      expect(result.current.state.phase).toBe('bezelAnimating');
      expect(result.current.state.extractionProgress).toBe(1);

      // Cancel during bezel animation → springBack decaying from progress 1
      act(() => {
        result.current.cancelExtraction();
      });

      expect(result.current.state.phase).toBe('springBack');

      act(() => {
        vi.advanceTimersByTime(900); // spring 600 + frame slack + cleanup 200
      });
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
    });

    it('springs back to idle when cancelled during completing/spring back', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      act(() => {
        result.current.startExtraction();
        vi.advanceTimersByTime(1120); // Reach completing (560 + 560)
      });

      expect(result.current.state.phase).toBe('completing');

      // Cancel mid-sequence → springBack → clearing → idle
      act(() => {
        result.current.cancelExtraction();
      });

      expect(result.current.state.phase).toBe('springBack');

      act(() => {
        vi.advanceTimersByTime(900);
      });
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
    });

    it('is a no-op when idle', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      act(() => {
        result.current.cancelExtraction();
      });

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
    });
  });

  describe('slog animation', () => {
    it('moves to slogAnimating then returns to idle after spring duration', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      act(() => {
        result.current.startSlog();
      });

      expect(result.current.state.phase).toBe('slogAnimating');
      expect(result.current.state.extractionProgress).toBe(1.2);
      expect(result.current.state.isSloggingOut).toBe(true);
      expect(result.current.state.isBezelAnimationDone).toBe(true);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isSloggingOut).toBe(false);
    });
  });

  describe('multiple extractions', () => {
    it('cancels previous extraction when starting new one', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      // Start first extraction
      act(() => {
        result.current.startExtraction();
      });

      expect(result.current.state.phase).toBe('extracting');

      // Start second extraction (should cancel first)
      act(() => {
        result.current.startExtraction();
      });

      expect(result.current.state.phase).toBe('extracting');
      expect(result.current.state.extractionProgress).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { result, unmount } = renderHook(() => useExtractionStateMachine());

      // Start extraction to create timers
      act(() => {
        result.current.startExtraction();
      });

      expect(vi.getTimerCount()).toBeGreaterThan(0);

      // Unmount should clean up
      unmount();

      // No timers should remain (vi would warn if not cleaned up)
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('force phase (testing)', () => {
    it('forces specific phase with correct state values', () => {
      const { result } = renderHook(() => useExtractionStateMachine());

      const phases: ExtractionPhase[] = [
        'idle',
        'extracting',
        'bezelAnimating',
        'completing',
        'springBack',
        'clearing',
      ];

      phases.forEach(phase => {
        act(() => {
          result.current._forcePhase(phase);
        });

        expect(result.current.state.phase).toBe(phase);

        // Verify phase-specific values (current contract)
        switch (phase) {
          case 'idle':
            expect(result.current.state.extractionProgress).toBe(0);
            expect(result.current.state.isMedalFadingOut).toBe(false);
            break;
          case 'extracting':
            expect(result.current.state.extractionProgress).toBe(0);
            expect(result.current.state.isMedalFadingOut).toBe(false);
            break;
          case 'bezelAnimating':
            expect(result.current.state.extractionProgress).toBe(1);
            expect(result.current.state.isMedalFadingOut).toBe(true);
            break;
          case 'completing':
            expect(result.current.state.extractionProgress).toBe(1.12);
            expect(result.current.state.isBezelAnimationDone).toBe(true);
            break;
          case 'springBack':
            expect(result.current.state.extractionProgress).toBe(1);
            break;
          case 'clearing':
            expect(result.current.state.extractionProgress).toBe(0);
            break;
        }
      });
    });
  });

  describe('custom timing', () => {
    it('uses custom timing values', async () => {
      const customOptions = {
        bezelDuration: 1000,
        springDuration: 800,
        cleanupDelay: 300,
      };

      const { result } = renderHook(() => useExtractionStateMachine(customOptions));

      act(() => {
        result.current.startExtraction();
      });

      // Should stay in extracting for the custom bezel duration
      act(() => {
        vi.advanceTimersByTime(500); // Less than custom bezel duration
      });

      expect(result.current.state.phase).toBe('extracting');

      // Should transition to bezelAnimating at custom time
      act(() => {
        vi.advanceTimersByTime(500); // Total 1000ms
      });

      expect(result.current.state.phase).toBe('bezelAnimating');

      // Should transition to completing after a second custom bezel duration
      act(() => {
        vi.advanceTimersByTime(1000); // Total 2000ms
      });

      expect(result.current.state.phase).toBe('completing');
      expect(result.current.state.extractionProgress).toBe(1.12);

      // Pop duration is fixed (280ms), then springBack
      act(() => {
        vi.advanceTimersByTime(280);
      });

      expect(result.current.state.phase).toBe('springBack');

      // Should transition to clearing after custom spring duration
      act(() => {
        vi.advanceTimersByTime(800);
      });

      expect(result.current.state.phase).toBe('clearing');

      // Should return to idle after custom cleanup delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.state.phase).toBe('idle');
    });
  });
});
