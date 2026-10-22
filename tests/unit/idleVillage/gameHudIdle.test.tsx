import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, type RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameFrame } from '@/ui/idleVillage/components/gameFrame/GameFrame';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key }),
}));

const config = {
  ...DEFAULT_GAME_FRAME_CONFIG,
  hudHide: { ...DEFAULT_GAME_FRAME_CONFIG.hudHide, idleHideMs: 50 },
};

const renderFrame = (props?: Partial<Parameters<typeof GameFrame>[0]>): RenderResult =>
  render(
    <GameFrame
      title="T"
      navItems={[]}
      activeNavId="map"
      whenWhereSlot={<div />}
      resourcesSlot={<div />}
      config={config}
      {...props}
    >
      <div />
    </GameFrame>,
  );

const hudHidden = (container: HTMLElement) => container.querySelector('[data-hud-hidden]') !== null;

describe('GameFrame idle hide', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // INV:CTR-game-003.INV-1
  // INV:CTR-game-003.INV-2
  it('hides the chrome after idleHideMs of stillness and wakes on any input', () => {
    const { container } = renderFrame();
    expect(hudHidden(container)).toBe(false);
    act(() => void vi.advanceTimersByTime(60));
    expect(hudHidden(container)).toBe(true);
    // Any input calls the auto-hidden chrome back.
    act(() => void fireEvent.pointerMove(window));
    expect(hudHidden(container)).toBe(false);
  });

  it('re-arms the idle clock on activity and does not hide mid-interaction', () => {
    const { container } = renderFrame();
    act(() => void vi.advanceTimersByTime(30));
    act(() => void fireEvent.pointerMove(window));
    act(() => void vi.advanceTimersByTime(30));
    expect(hudHidden(container)).toBe(false);
    act(() => void vi.advanceTimersByTime(30));
    expect(hudHidden(container)).toBe(true);
  });

  // INV:CTR-game-003.INV-3
  it('a hand-hidden HUD ignores input and waits for its toggle', () => {
    const { container } = renderFrame();
    act(() => void fireEvent.keyDown(window, { key: 'h' }));
    expect(hudHidden(container)).toBe(true);
    act(() => void fireEvent.pointerMove(window));
    act(() => void fireEvent.keyDown(window, { key: 'x' }));
    expect(hudHidden(container)).toBe(true);
    act(() => void fireEvent.keyDown(window, { key: 'h' }));
    expect(hudHidden(container)).toBe(false);
  });

  // INV:CTR-game-003.INV-4
  // INV:game-frame-game-frame.INV-1
  it('comes back when the game bumps hudWakeSignal, even over a manual hide', () => {
    const { container, rerender } = renderFrame();
    act(() => void fireEvent.keyDown(window, { key: 'h' }));
    expect(hudHidden(container)).toBe(true);
    rerender(
      <GameFrame
        title="T"
        navItems={[]}
        activeNavId="map"
        whenWhereSlot={<div />}
        resourcesSlot={<div />}
        config={config}
        hudWakeSignal={1}
      >
        <div />
      </GameFrame>,
    );
    expect(hudHidden(container)).toBe(false);
  });

  // INV:CTR-game-003.INV-5
  it('reports every visibility change through onHudHiddenChange, with its cause', () => {
    const onHudHiddenChange = vi.fn();
    const { container } = renderFrame({ onHudHiddenChange });
    act(() => void fireEvent.keyDown(window, { key: 'h' }));
    expect(onHudHiddenChange).toHaveBeenLastCalledWith(true, 'manual');
    act(() => void fireEvent.keyDown(window, { key: 'h' }));
    expect(onHudHiddenChange).toHaveBeenLastCalledWith(false, 'manual');
    expect(hudHidden(container)).toBe(false);
  });

  it('reports cause idle when the stillness timer hides the chrome', () => {
    const onHudHiddenChange = vi.fn();
    const { container } = renderFrame({ idleHideMs: 50, onHudHiddenChange });
    act(() => vi.advanceTimersByTime(60));
    expect(onHudHiddenChange).toHaveBeenLastCalledWith(true, 'idle');
    act(() => void fireEvent.pointerMove(window));
    expect(onHudHiddenChange).toHaveBeenLastCalledWith(false, 'manual');
    expect(hudHidden(container)).toBe(false);
  });

  // INV:CTR-game-003.INV-6
  it('idleHideMs <= 0 disables auto-hide; prefers-reduced-motion zeroes the slide', () => {
    const still = renderFrame({
      config: { ...config, hudHide: { ...config.hudHide, idleHideMs: 0 } },
    });
    act(() => void vi.advanceTimersByTime(5_000));
    expect(hudHidden(still.container)).toBe(false);
    still.unmount();

    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
    try {
      const { container } = renderFrame();
      const slidesZero = [...container.querySelectorAll<HTMLElement>('*')].some((el) =>
        el.style.transition.includes('transform 0ms'),
      );
      expect(slidesZero).toBe(true);
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});
