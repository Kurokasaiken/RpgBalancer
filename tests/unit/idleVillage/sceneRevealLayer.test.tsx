import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { SceneRevealLayer } from '@/ui/idleVillage/questS1Lab/render/SceneRevealLayer';
import type { SceneCinematicEntry } from '@/ui/idleVillage/questS1Lab/render/sceneManifest';

/* Contract coverage for .mw/contracts/components/scene-reveal-layer.md —
 * PLAN-084 hidden-affordance overlay: single-fire latch, click/timed triggers,
 * fade / cutout-slide / panel-slide modes. */

type Reveal = NonNullable<SceneCinematicEntry['reveal']>;
const baseReveal = (over: Partial<Reveal>): Reveal =>
  ({ region: [0.1, 0.1, 0.3, 0.3], trigger: 'click', afterSeconds: 5, burst: [], ...over } as Reveal);

const renderLayer = (reveal: Reveal, revealed = false, onReveal = vi.fn()) => {
  const utils = render(
    <SceneRevealLayer reveal={reveal} src="/plate.webp" revealed={revealed} onReveal={onReveal} />,
  );
  return { ...utils, onReveal };
};

afterEach(() => vi.useRealTimers());

// INV:scene-reveal-layer.INV-1
describe('scene-reveal-layer.INV-1 — onReveal fires at most once per contract', () => {
  it('click trigger: repeated clicks fire onReveal exactly once', () => {
    const { getByTestId, onReveal } = renderLayer(baseReveal({ trigger: 'click' }));
    const region = getByTestId('scene-reveal-region');
    fireEvent.click(region);
    fireEvent.click(region);
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('timed trigger: fires once after afterSeconds, never again', () => {
    vi.useFakeTimers();
    const { onReveal } = renderLayer(baseReveal({ trigger: 'timed', afterSeconds: 2 }));
    act(() => vi.advanceTimersByTime(1999));
    expect(onReveal).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2));
    expect(onReveal).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(onReveal).toHaveBeenCalledTimes(1);
  });
});

// INV:scene-reveal-layer.INV-2
describe('scene-reveal-layer.INV-2 — reveal modes paint their own visual', () => {
  it('panel-slide mounts the full foreground panel (over the scene, pre-reveal)', () => {
    const { getByTestId } = renderLayer(
      baseReveal({ trigger: 'click', revealMode: 'panel-slide', panelSrc: '/panel.webp' } as Partial<Reveal>),
    );
    expect(getByTestId('scene-reveal-panel').getAttribute('src')).toBe('/panel.webp');
  });

  it('fade mode mounts no panel; revealed plate appears only when revealed', () => {
    const { queryByTestId, rerender, onReveal } = renderLayer(
      baseReveal({ trigger: 'click', revealMode: 'fade', revealSrc: '/revealed.webp' } as Partial<Reveal>),
    );
    expect(queryByTestId('scene-reveal-panel')).toBeNull();
    expect(queryByTestId('scene-revealed-plate')).toBeNull();
    rerender(
      <SceneRevealLayer
        reveal={baseReveal({ trigger: 'click', revealMode: 'fade', revealSrc: '/revealed.webp' } as Partial<Reveal>)}
        src="/plate.webp"
        revealed
        onReveal={onReveal}
      />,
    );
    expect(queryByTestId('scene-revealed-plate')?.getAttribute('src')).toBe('/revealed.webp');
  });
});
