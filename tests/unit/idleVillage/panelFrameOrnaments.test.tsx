import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PanelFrameOrnaments } from '@/ui/idleVillage/skins/primitives/PanelFrameOrnaments';

/* Contract coverage for .mw/contracts/components/panel-frame-ornaments.md —
 * the two baptized frame grammars: R-353 mockup-cut sets and the R-357
 * 'cornici' 9-slice (fixed corners + repeating edge tiles under them). */

// INV:panel-frame-ornaments.INV-1
describe('panel-frame-ornaments.INV-1 — 9-slice cornici grammar', () => {
  it('cornici variant paints 4 corners + 4 edges and NO emblem', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 200, height: 120 }}>
        <PanelFrameOrnaments variant="cornici" />
      </div>,
    );
    const frame = container.querySelector('[data-panel-frame="ornate"]');
    expect(frame).toBeTruthy();
    expect(frame).toHaveAttribute('data-frame-variant', 'cornici');
    const imgs = [...frame!.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '');
    // 4 fixed corners + emblem only on stash; edges are background tiles (divs), not imgs.
    expect(imgs).toHaveLength(4);
    expect(imgs.some((s) => s.includes('emblem-chest'))).toBe(false);
  });

  it('corniciStash paints the chest emblem on the top wire', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 200, height: 120 }}>
        <PanelFrameOrnaments variant="corniciStash" />
      </div>,
    );
    const frame = container.querySelector('[data-panel-frame="ornate"]');
    const imgs = [...frame!.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '');
    expect(imgs).toHaveLength(5);
    expect(imgs.filter((s) => s.includes('emblem-chest'))).toHaveLength(1);
  });

  it('legacy stash variant paints the R-353 mockup-cut corners', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 200, height: 120 }}>
        <PanelFrameOrnaments variant="stash" />
      </div>,
    );
    const frame = container.querySelector('[data-panel-frame="ornate"]');
    expect(frame).toHaveAttribute('data-frame-variant', 'stash');
    const imgs = [...frame!.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '');
    expect(imgs.some((s) => s.includes('corner-mockup'))).toBe(true);
    expect(imgs.some((s) => s.includes('emblem-chest'))).toBe(false);
  });
});
