import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';
import { defaultMagicCircleHaloConfig } from '@/ui/idleVillage/skins/magicCircleHaloSkinConfig';

// The halo only needs the active preset id; the real hook loads preferences
// asynchronously, which is irrelevant to the visual contract under test.
vi.mock('@/ui/idleVillage/hooks/useSkinPreferences', () => ({
  useSkinPreferences: () => ({ presetId: 'base' }),
}));

const glyphs = (container: HTMLElement): NodeListOf<Element> =>
  container.querySelectorAll('g[data-mc-glyph]');

const { glyphCount, radiusRatio, size } = defaultMagicCircleHaloConfig;

describe('MagicCircleHalo — the circle does not exist before it is written', () => {
  it('renders no characters at all at progress 0', () => {
    const { container } = render(<MagicCircleHalo progress={0} />);
    expect(glyphs(container)).toHaveLength(0);
  });

  it('draws no ring, track or guide path behind the inscription', () => {
    const { container } = render(<MagicCircleHalo progress={0.5} />);
    // The only <circle> the component may emit is the completion burst, and
    // that exists solely once the inscription has closed.
    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('mounts the halo layer even when empty, so nothing reflows on the first character', () => {
    const { getByTestId } = render(<MagicCircleHalo progress={0} />);
    expect(getByTestId('magic-circle-halo')).toBeTruthy();
  });
});

describe('MagicCircleHalo — the inscription only ever grows', () => {
  it('writes more characters as progress advances', () => {
    const { container, rerender } = render(<MagicCircleHalo progress={0.25} />);
    const quarter = glyphs(container).length;

    rerender(<MagicCircleHalo progress={0.5} />);
    const half = glyphs(container).length;

    rerender(<MagicCircleHalo progress={0.75} />);
    const threeQuarters = glyphs(container).length;

    expect(quarter).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(quarter);
    expect(threeQuarters).toBeGreaterThan(half);
  });

  it('writes one character per slice of the circle', () => {
    const { container } = render(<MagicCircleHalo progress={0.5} />);
    expect(glyphs(container)).toHaveLength(glyphCount / 2);
  });

  it('clamps out-of-range progress instead of over- or under-writing', () => {
    const { container, rerender } = render(<MagicCircleHalo progress={-1} />);
    expect(glyphs(container)).toHaveLength(0);

    rerender(<MagicCircleHalo progress={4} />);
    expect(glyphs(container)).toHaveLength(glyphCount);
  });

  it('survives a non-finite progress value', () => {
    const { container } = render(<MagicCircleHalo progress={Number.NaN} />);
    expect(glyphs(container)).toHaveLength(0);
  });

  it('keeps each character identity stable so it never re-materialises', () => {
    const { container, rerender } = render(<MagicCircleHalo progress={0.25} />);
    const firstBefore = glyphs(container)[0].getAttribute('transform');

    rerender(<MagicCircleHalo progress={0.75} />);
    const firstAfter = glyphs(container)[0].getAttribute('transform');

    expect(firstAfter).toBe(firstBefore);
  });
});

describe('MagicCircleHalo — geometry', () => {
  it('starts writing at 12 o\'clock, upright', () => {
    // isComplete removes the formation wobble, so the placement is exact.
    const { container } = render(<MagicCircleHalo progress={1} isComplete />);
    const first = glyphs(container)[0].getAttribute('transform') ?? '';

    const centre = size / 2;
    const radius = centre * radiusRatio;
    expect(first).toContain(`translate(${centre.toFixed(2)} ${(centre - radius).toFixed(2)})`);
    expect(first).toContain('rotate(0.00)');
  });

  it('advances clockwise: the second character sits to the right of the first', () => {
    const { container } = render(<MagicCircleHalo progress={1} isComplete />);
    const xOf = (index: number): number =>
      Number(
        /translate\(([-\d.]+) /.exec(glyphs(container)[index].getAttribute('transform') ?? '')?.[1],
      );

    expect(xOf(1)).toBeGreaterThan(xOf(0));
  });

  it('closes the circle: the last character returns near the start', () => {
    const { container } = render(<MagicCircleHalo progress={1} isComplete />);
    const all = glyphs(container);
    const xOf = (el: Element): number =>
      Number(/translate\(([-\d.]+) /.exec(el.getAttribute('transform') ?? '')?.[1]);

    expect(all).toHaveLength(glyphCount);
    // One step short of a full turn, so just left of 12 o'clock.
    expect(xOf(all[glyphCount - 1])).toBeLessThan(size / 2);
    expect(Math.abs(xOf(all[glyphCount - 1]) - size / 2)).toBeLessThan(size / 4);
  });

  it('draws characters as stroked paths, not filled shapes or font glyphs', () => {
    const { container } = render(<MagicCircleHalo progress={1} isComplete />);
    const path = container.querySelector('g[data-mc-glyph] path')!;
    expect(path.getAttribute('fill')).toBe('none');
    expect(path.getAttribute('stroke')).toBeTruthy();
    expect(container.querySelectorAll('text')).toHaveLength(0);
  });
});

describe('MagicCircleHalo — completion', () => {
  it('shows every character and locks in with an energy burst', () => {
    const { container, getByTestId } = render(<MagicCircleHalo progress={1} isComplete />);
    expect(glyphs(container)).toHaveLength(glyphCount);
    expect(getByTestId('magic-circle-halo').dataset.complete).toBe('true');
    expect(container.querySelector('circle[data-mc-burst]')).toBeTruthy();
  });

  it('reports completion state through a data attribute for the POI to read', () => {
    const { getByTestId, rerender } = render(<MagicCircleHalo progress={0.5} />);
    expect(getByTestId('magic-circle-halo').dataset.complete).toBe('false');

    rerender(<MagicCircleHalo progress={1} isComplete />);
    expect(getByTestId('magic-circle-halo').dataset.complete).toBe('true');
  });

  it('completes the inscription even if progress lags slightly behind', () => {
    const { container } = render(<MagicCircleHalo progress={0.98} isComplete />);
    expect(glyphs(container)).toHaveLength(glyphCount);
  });

  it('honours a custom size', () => {
    const { getByTestId } = render(<MagicCircleHalo progress={0} size={120} />);
    expect(getByTestId('magic-circle-halo').style.width).toBe('120px');
  });

  it('never intercepts pointer events aimed at the POI underneath', () => {
    const { getByTestId } = render(<MagicCircleHalo progress={0.5} />);
    expect(getByTestId('magic-circle-halo').style.pointerEvents).toBe('none');
  });
});
