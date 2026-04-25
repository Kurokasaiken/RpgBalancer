import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSandboxInteractionMode } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';

// Mock telemetry
vi.mock('@/ui/idleVillage/utils/workerPickerTelemetry', () => ({
  recordWorkerPickerEvent: vi.fn(),
}));

describe('useSandboxInteractionMode Hook Resilience', () => {
  it('handles null/undefined callbacks gracefully', () => {
    expect(() => {
      renderHook(() =>
        useSandboxInteractionMode({
          onPickerOpen: undefined,
          onPickerClose: undefined,
          onResidentAssign: undefined,
          enableDiagnostics: false,
        })
      );
    }).not.toThrow();
  });

  it('handles invalid mode override', () => {
    expect(() => {
      renderHook(() =>
        useSandboxInteractionMode({
          forceMode: 'invalid' as unknown as 'desktop',
          enableDiagnostics: false,
        })
      );
    }).not.toThrow();
  });

  it('handles rapid state changes', () => {
    const { result } = renderHook(() =>
      useSandboxInteractionMode({ enableDiagnostics: false })
    );

    expect(() => {
      act(() => {
        // Rapid open/close operations
        result.current.openPicker('slot-1', 'touch');
        result.current.closePicker('test');
        result.current.openPicker('slot-2', 'click');
        result.current.assignResident('slot-2', 'resident-1');
        result.current.closePicker('test');
      });
    }).not.toThrow();
  });

  it('handles null slot IDs in operations', () => {
    const { result } = renderHook(() =>
      useSandboxInteractionMode({ enableDiagnostics: false })
    );

    expect(() => {
      act(() => {
        result.current.openPicker(null, 'touch');
        result.current.assignResident(null, 'resident-1');
        result.current.closePicker('test');
      });
    }).not.toThrow();
  });

  it('handles empty resident IDs', () => {
    const { result } = renderHook(() =>
      useSandboxInteractionMode({ enableDiagnostics: false })
    );

    expect(() => {
      act(() => {
        result.current.openPicker('slot-1', 'touch');
        result.current.assignResident('slot-1', '');
        result.current.assignResident('slot-1', null as unknown as string);
      });
    }).not.toThrow();
  });

  it('maintains state consistency after errors', () => {
    const { result } = renderHook(() =>
      useSandboxInteractionMode({ enableDiagnostics: false })
    );

    act(() => {
      // Cause some operations
      result.current.openPicker('slot-1', 'touch');
    });
    expect(result.current.isPickerActive).toBe(true);

    act(() => {
      // Close picker
      result.current.closePicker('test');
    });
    expect(result.current.isPickerActive).toBe(false);

    // Verify state is still accessible
    expect(result.current.mode).toBeDefined();
    expect(result.current.ctaHighlightState).toBe('idle');
    expect(result.current.currentTapCount).toBe(0);
  });

  it('handles CTA highlight operations', () => {
    const { result } = renderHook(() =>
      useSandboxInteractionMode({ enableDiagnostics: false })
    );

    expect(() => {
      act(() => {
        result.current.highlightCta('success', 100);
        result.current.highlightCta('error', 0);
        result.current.highlightCta('idle', -1);
      });
    }).not.toThrow();
  });

  it('handles reset operations', () => {
    const { result } = renderHook(() =>
      useSandboxInteractionMode({ enableDiagnostics: false })
    );

    act(() => {
      result.current.openPicker('slot-1', 'touch');
      result.current.assignResident('slot-1', 'resident-1');
      result.current.highlightCta('success');
    });

    act(() => {
      result.current.resetInteractionState();
    });

    expect(result.current.currentTapCount).toBe(0);
    expect(result.current.ctaHighlightState).toBe('idle');
    expect(result.current.isPickerActive).toBe(true); // Picker stays open
  });
});
