/**
 * useHudPanelDrag — PLAN-043 WS-3 / R-196: floating HUD panels drag from a
 * marked handle and apply the committed offset through `panelStyle`.
 * matchMedia is stubbed to the desktop path (no sheet mode).
 */
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHudPanelDrag } from '@/ui/idleVillage/components/gameFrame/useHudPanelDrag';

const desktopMatchMedia = () =>
  vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));

describe('useHudPanelDrag — committed offset + drag handle', () => {
  // INV:use-hud-panel-drag.INV-1 — the hook exposes a committed translate
  // applied through `panelStyle` and a marked drag handle
  // (`data-hud-drag-handle`); resetPosition zeroes the offset.
  it('starts undragged at translate(0,0) with a marked handle', () => {
    vi.stubGlobal('matchMedia', desktopMatchMedia());
    const { result } = renderHook(() => useHudPanelDrag());
    expect(result.current.dragging).toBe(false);
    expect(result.current.panelStyle.transform).toBe('translate(0px, 0px)');
    expect(result.current.handleProps['data-hud-drag-handle']).toBeDefined();
    act(() => result.current.resetPosition());
    expect(result.current.panelStyle.transform).toBe('translate(0px, 0px)');
    vi.unstubAllGlobals();
  });
});
