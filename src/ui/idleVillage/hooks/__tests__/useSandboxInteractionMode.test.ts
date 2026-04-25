import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSandboxInteractionMode } from '../useSandboxInteractionMode';

type MediaListener = (event: MediaQueryListEvent) => void;

const matchMediaListeners = new Set<MediaListener>();
let pointerIsCoarse = false;

class MockMutationObserver {
  private readonly callback: MutationCallback;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe() {}

  disconnect() {}

  /** Helper that allows tests to simulate attribute changes. */
  trigger() {
    this.callback([], this as unknown as MutationObserver);
  }
}

describe('useSandboxInteractionMode', () => {
  beforeEach(() => {
    matchMediaListeners.clear();
    pointerIsCoarse = false;
    document.documentElement.removeAttribute('data-sandbox-interaction-mode');
    document.documentElement.removeAttribute('data-sandbox-interaction-override');
    vi.restoreAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        get matches() {
          return pointerIsCoarse;
        },
        addEventListener: (_eventName: string, listener: MediaListener) => {
          matchMediaListeners.add(listener);
        },
        removeEventListener: (_eventName: string, listener: MediaListener) => {
          matchMediaListeners.delete(listener);
        },
      })),
    });

    vi.stubGlobal('MutationObserver', MockMutationObserver as unknown as typeof MutationObserver);
  });

  it('keeps drag mode on desktop and forwards clicks to the focus handler', () => {
    const slotFocusSpy = vi.fn();
    const { result } = renderHook(() =>
      useSandboxInteractionMode({
        isMobile: false,
        handleResidentSelect: vi.fn(),
        onDesktopSlotFocus: slotFocusSpy,
      }),
    );

    expect(result.current.interactionMode).toBe('drag');
    expect(document.documentElement.getAttribute('data-sandbox-interaction-mode')).toBe('drag');

    act(() => {
      result.current.handleSlotClick('slot-alpha');
    });

    expect(slotFocusSpy).toHaveBeenCalledWith('slot-alpha');
    expect(result.current.pickerState.slotId).toBeNull();
  });

  it('opens the picker and clears it after resident selection on mobile', () => {
    const pickerSpy = vi.fn();
    const residentSelectSpy = vi.fn();
    const { result } = renderHook(() =>
      useSandboxInteractionMode({
        isMobile: true,
        handleResidentSelect: residentSelectSpy,
        onPickerOpen: pickerSpy,
      }),
    );

    expect(result.current.interactionMode).toBe('tap');

    act(() => {
      result.current.handleSlotClick('slot-1');
    });

    expect(pickerSpy).toHaveBeenCalledWith('slot-1', 'click');
    expect(result.current.pickerState.slotId).toBe('slot-1');

    act(() => {
      result.current.handleResidentSelect('resident-7');
    });

    expect(residentSelectSpy).toHaveBeenCalledWith('resident-7');
    expect(result.current.pickerState.slotId).toBeNull();
  });
});
