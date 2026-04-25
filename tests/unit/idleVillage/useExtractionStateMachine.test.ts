/**
 * useExtractionStateMachine Unit Tests
 * 
 * Tests state machine transitions, timing, and cleanup behavior.
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
      expect(result.current.state.isPgTokenVisible).toBe(true);
      expect(result.current.state.isMedalFadingOut).toBe(false);
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
      expect(result.current.state.isPgTokenVisible).toBe(true);
      
      // Complete extraction progress (560ms)
      act(() => {
        vi.advanceTimersByTime(560);
      });
      
      expect(result.current.state.phase).toBe('bezelAnimating');
      expect(result.current.state.extractionProgress).toBe(1);
      expect(result.current.state.isMedalFadingOut).toBe(true);
      
      // Complete bezel animation (560ms more)
      act(() => {
        vi.advanceTimersByTime(560);
      });
      
      expect(result.current.state.phase).toBe('springBack');
      expect(result.current.state.isPgTokenVisible).toBe(false);
      expect(result.current.state.extractionProgress).toBe(1.2);
      expect(result.current.state.isBezelAnimationDone).toBe(true);
      
      // Complete spring animation (600ms)
      act(() => {
        vi.advanceTimersByTime(600);
      });
      
      expect(result.current.state.phase).toBe('clearing');
      expect(result.current.state.extractionProgress).toBe(1);
      
      // Complete cleanup (200ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isPgTokenVisible).toBe(true);
      expect(result.current.state.isMedalFadingOut).toBe(false);
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
    it('returns to idle when cancelled during extracting', () => {
      const { result } = renderHook(() => useExtractionStateMachine());
      
      act(() => {
        result.current.startExtraction();
      });
      
      // Cancel during extraction
      act(() => {
        result.current.cancelExtraction();
      });
      
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isPgTokenVisible).toBe(true);
    });

    it('returns to idle when cancelled during bezel animation', () => {
      const { result } = renderHook(() => useExtractionStateMachine());
      
      act(() => {
        result.current.startExtraction();
        vi.advanceTimersByTime(560); // Reach bezelAnimating
      });
      
      expect(result.current.state.phase).toBe('bezelAnimating');
      
      // Cancel during bezel animation
      act(() => {
        result.current.cancelExtraction();
      });
      
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isPgTokenVisible).toBe(true);
    });

    it('returns to idle when cancelled during spring back', () => {
      const { result } = renderHook(() => useExtractionStateMachine());
      
      act(() => {
        result.current.startExtraction();
        vi.advanceTimersByTime(1120); // Reach springBack (560 + 560)
      });
      
      expect(result.current.state.phase).toBe('springBack');
      
      // Cancel during spring back
      act(() => {
        result.current.cancelExtraction();
      });
      
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.extractionProgress).toBe(0);
      expect(result.current.state.isPgTokenVisible).toBe(true);
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
      const { unmount } = renderHook(() => useExtractionStateMachine());
      
      // Start extraction to create timers
      act(() => {
        vi.advanceTimersByTime(560); // Create bezel timer
      });
      
      // Unmount should clean up
      unmount();
      
      // No timers should remain (vi would warn if not cleaned up)
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('force phase (testing)', () => {
    it('forces specific phase with correct state values', () => {
      const { result } = renderHook(() => useExtractionStateMachine());
      
      // Force each phase and verify state
      const phases: ExtractionPhase[] = ['idle', 'extracting', 'bezelAnimating', 'springBack', 'clearing'];
      
      phases.forEach(phase => {
        act(() => {
          result.current._forcePhase(phase);
        });
        
        expect(result.current.state.phase).toBe(phase);
        
        // Verify phase-specific values
        switch (phase) {
          case 'idle':
            expect(result.current.state.extractionProgress).toBe(0);
            expect(result.current.state.isPgTokenVisible).toBe(true);
            break;
          case 'extracting':
            expect(result.current.state.extractionProgress).toBe(0.5);
            expect(result.current.state.isPgTokenVisible).toBe(true);
            break;
          case 'bezelAnimating':
            expect(result.current.state.extractionProgress).toBe(1);
            expect(result.current.state.isMedalFadingOut).toBe(true);
            break;
          case 'springBack':
            expect(result.current.state.extractionProgress).toBe(1.2);
            expect(result.current.state.isPgTokenVisible).toBe(false);
            expect(result.current.state.isBezelAnimationDone).toBe(true);
            break;
          case 'clearing':
            expect(result.current.state.extractionProgress).toBe(1);
            expect(result.current.state.isPgTokenVisible).toBe(false);
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
      
      // Should stay in extracting for custom duration
      act(() => {
        vi.advanceTimersByTime(500); // Less than custom bezel duration
      });
      
      expect(result.current.state.phase).toBe('extracting');
      
      // Should transition to bezelAnimating at custom time
      act(() => {
        vi.advanceTimersByTime(500); // Total 1000ms
      });
      
      expect(result.current.state.phase).toBe('bezelAnimating');
      
      // Should transition to springBack after custom bezel duration
      act(() => {
        vi.advanceTimersByTime(1000); // Total 2000ms
      });
      
      expect(result.current.state.phase).toBe('springBack');
      
      // Should transition to clearing after custom spring duration
      act(() => {
        vi.advanceTimersByTime(800); // Total 2800ms
      });
      
      expect(result.current.state.phase).toBe('clearing');
      
      // Should return to idle after custom cleanup delay
      act(() => {
        vi.advanceTimersByTime(300); // Total 3100ms
      });
      
      expect(result.current.state.phase).toBe('idle');
    });
  });
});
