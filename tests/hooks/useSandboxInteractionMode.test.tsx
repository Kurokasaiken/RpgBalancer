import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSandboxInteractionMode } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';

// Mock the telemetry functions
vi.mock('@/ui/idleVillage/utils/workerPickerTelemetry', () => ({
  recordWorkerPickerEvent: vi.fn(),
}));

describe('useSandboxInteractionMode', () => {
  const mockOnPickerOpen = vi.fn();
  const mockOnPickerClose = vi.fn();
  const mockOnResidentAssign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window for mobile detection
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'test', maxTouchPoints: 0 },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mode Detection', () => {
    it('detects desktop mode by default', () => {
      // Mock desktop environment
      Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 0, configurable: true });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        configurable: true,
      });
      // Remove ontouchstart if it exists
      delete (window as Window & { ontouchstart?: unknown }).ontouchstart;

      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      expect(result.current.mode).toBe('desktop');
    });

    it('detects mobile mode with touch capability', () => {
      Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 1 });

      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      expect(result.current.mode).toBe('mobile');
    });

    it('detects mobile mode with mobile user agent', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      expect(result.current.mode).toBe('mobile');
    });

    it('respects forceMode override', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ forceMode: 'mobile', enableDiagnostics: true })
      );

      expect(result.current.mode).toBe('mobile');
    });
  });

  describe('Picker State Management', () => {
    it('starts with picker inactive', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      expect(result.current.isPickerActive).toBe(false);
      expect(result.current.ctaHighlightState).toBe('idle');
      expect(result.current.currentTapCount).toBe(0);
    });

    it('opens picker and calls callbacks', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({
          onPickerOpen: mockOnPickerOpen,
          enableDiagnostics: true,
        })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
      });

      expect(result.current.isPickerActive).toBe(true);
      expect(mockOnPickerOpen).toHaveBeenCalledWith('slot-1', 'touch');
    });

    it('closes picker and calls callbacks', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({
          onPickerClose: mockOnPickerClose,
          enableDiagnostics: true,
        })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.closePicker('user_close');
      });

      expect(result.current.isPickerActive).toBe(false);
      expect(mockOnPickerClose).toHaveBeenCalledWith('slot-1', 'user_close');
    });

    it('resets tap count and CTA state when closing picker', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', 'resident-1');
        result.current.closePicker('user_close');
      });

      expect(result.current.currentTapCount).toBe(0);
      expect(result.current.ctaHighlightState).toBe('idle');
    });
  });

  describe('Mind Studios KPI: Tap Count ≤3', () => {
    it('tracks tap count per assignment', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({
          onResidentAssign: mockOnResidentAssign,
          enableDiagnostics: true,
        })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', 'resident-1');
      });

      expect(result.current.currentTapCount).toBe(1);
      expect(mockOnResidentAssign).toHaveBeenCalledWith('slot-1', 'resident-1', 1);
    });

    it('resets tap count after assignment', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', 'resident-1');
        result.current.assignResident('slot-1', 'resident-2');
      });

      expect(result.current.currentTapCount).toBe(2);
    });

    it('warns when tap count exceeds KPI threshold', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        // Assign 4 times to exceed threshold
        for (let i = 0; i < 4; i++) {
          result.current.assignResident('slot-1', `resident-${i}`);
        }
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tap count exceeded KPI threshold'),
        expect.objectContaining({
          slotId: 'slot-1',
          tapCount: 4,
          threshold: 3,
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('enforces max taps per assignment constant', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      expect(result.current.maxTapsPerAssignment).toBe(3);
    });
  });

  describe('CTA Highlight for Mobile Affordance', () => {
    it('highlights CTA on mobile assignment success', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ forceMode: 'mobile', enableDiagnostics: true })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', 'resident-1');
      });

      expect(result.current.ctaHighlightState).toBe('success');
    });

    it('does not highlight CTA on desktop mode', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ forceMode: 'desktop', enableDiagnostics: true })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', 'resident-1');
      });

      expect(result.current.ctaHighlightState).toBe('idle');
    });

    it('allows manual CTA highlighting', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      act(() => {
        result.current.highlightCta('highlight', 500);
      });

      expect(result.current.ctaHighlightState).toBe('highlight');
    });

    it('resets CTA highlight after timeout', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      act(() => {
        result.current.highlightCta('highlight', 100);
      });

      expect(result.current.ctaHighlightState).toBe('highlight');

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.ctaHighlightState).toBe('idle');

      vi.useRealTimers();
    });
  });

  describe('State Reset', () => {
    it('resets all interaction state', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', 'resident-1');
        result.current.highlightCta('error');
        result.current.resetInteractionState();
      });

      expect(result.current.currentTapCount).toBe(0);
      expect(result.current.ctaHighlightState).toBe('idle');
      expect(result.current.isPickerActive).toBe(true); // Picker stays open
    });
  });

  describe('Picker Open/Close Consistency', () => {
    it('maintains consistent state during open/close cycles', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({
          onPickerOpen: mockOnPickerOpen,
          onPickerClose: mockOnPickerClose,
          enableDiagnostics: true,
        })
      );

      // Open picker
      act(() => {
        result.current.openPicker('slot-1', 'touch');
      });
      expect(result.current.isPickerActive).toBe(true);

      // Close picker
      act(() => {
        result.current.closePicker('user_close');
      });
      expect(result.current.isPickerActive).toBe(false);

      // Reopen picker
      act(() => {
        result.current.openPicker('slot-2', 'click');
      });
      expect(result.current.isPickerActive).toBe(true);

      expect(mockOnPickerOpen).toHaveBeenCalledTimes(2);
      expect(mockOnPickerClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple rapid assignments', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({
          onResidentAssign: mockOnResidentAssign,
          enableDiagnostics: true,
        })
      );

      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', 'resident-1');
        result.current.assignResident('slot-1', 'resident-2');
        result.current.assignResident('slot-1', 'resident-3');
      });

      expect(result.current.currentTapCount).toBe(3);
      expect(mockOnResidentAssign).toHaveBeenCalledTimes(3);
    });

    it('handles picker operations without callbacks', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      expect(() => {
        act(() => {
          result.current.openPicker('slot-1', 'touch');
          result.current.assignResident('slot-1', 'resident-1');
          result.current.closePicker('test');
        });
      }).not.toThrow();

      expect(result.current.isPickerActive).toBe(false);
    });

    it('handles null slot IDs', () => {
      const { result } = renderHook(() =>
        useSandboxInteractionMode({ enableDiagnostics: true })
      );

      act(() => {
        result.current.openPicker(null, 'touch');
        result.current.assignResident(null, 'resident-1');
        result.current.closePicker('test');
      });

      expect(result.current.isPickerActive).toBe(false);
    });
  });
});
