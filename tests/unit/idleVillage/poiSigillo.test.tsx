import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PoiMatericV3_5 from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import type { PoiState, PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';
import { BASE_SKIN_CSS_VARS } from '@/ui/idleVillage/skins/skinCssVariables';
import { poiSizePx } from '@/ui/idleVillage/components/gameFrame/poiSigillo';

const IVORY = BASE_SKIN_CSS_VARS['--skin-poi-halo-deadline'];
const VERDIGRIS = BASE_SKIN_CSS_VARS['--skin-poi-halo-work'];
const VERMILION = BASE_SKIN_CSS_VARS['--skin-poi-urgent'];

function mount(props: { type?: PoiType; state?: PoiState; progress?: number; dir?: 'clockwise' | 'counterclockwise'; sigillo?: boolean; pulse?: boolean }) {
  const { container } = render(
    <PoiMatericV3_5
      sigillo={props.sigillo ?? true}
      pulse={props.pulse}
      type={props.type ?? 'quest'}
      state={props.state ?? 'assigned'}
      progress={props.progress ?? 0}
      timerDirection={props.dir ?? 'clockwise'}
      size={55}
    />,
  );
  return container;
}

/** Rail arcs of the seal (arc radius >= 40 around the medallion); the engraved letters use tiny arcs (r <= 3) and may keep round caps. */
const railArcs = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('.poiv3_5__seal-halo path, .poiv3_5__seal-core path')).filter((p) => {
    const m = /\sA\s([\d.]+)\s/.exec(p.getAttribute('d') ?? '');
    return m != null && parseFloat(m[1]) >= 40;
  });

describe('PoiMatericV3_5 sigillo — halo (T-02: progress 0, 25%, 100%)', () => {
  it('draws nothing of the halo at progress 0 — no dot at twelve', () => {
    const c = mount({ progress: 0 });
    expect(c.querySelector('.poiv3_5__seal-halo')).toBeNull();
    expect(c.querySelector('.poiv3_5__seal-core')).toBeNull();
    expect(c.querySelector('.poiv3_5__track')).toBeNull();
  });

  it.each([0.25, 1])('draws the halo at progress %s with butt caps on every rail arc', (progress) => {
    const c = mount({ progress });
    expect(c.querySelector('.poiv3_5__seal-halo')).not.toBeNull();
    const arcs = railArcs(c);
    expect(arcs.length).toBeGreaterThan(0);
    for (const arc of arcs) expect(arc.getAttribute('stroke-linecap')).not.toBe('round');
  });
});

describe('PoiMatericV3_5 sigillo — silhouette = family', () => {
  it.each<[PoiType, string]>([
    ['quest', 'A43 43'], // round with a tail: circle arc + tail
    ['job', 'H67'], // tile
    ['event', 'L86 43'], // diamond
  ])('draws the %s silhouette with the double border', (type, marker) => {
    const c = mount({ type });
    expect(c.querySelector('[data-silhouette]')?.getAttribute('data-silhouette')).toBe(type);
    const [outer, inner] = Array.from(c.querySelectorAll('[data-testid="sigillo-border"] path'));
    expect(outer.getAttribute('d')).toContain(marker);
    expect(outer.getAttribute('stroke')).toBe(BASE_SKIN_CSS_VARS['--skin-poi-border-outer']);
    expect(outer.getAttribute('stroke-width')).toBe('2');
    expect(outer.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    expect(inner.getAttribute('stroke')).toBe(BASE_SKIN_CSS_VARS['--skin-poi-border-inner']);
    expect(inner.getAttribute('stroke-width')).toBe('1.5');
    expect(c.querySelector('[data-testid="sigillo-plate"]')).not.toBeNull();
  });

  it('takes no gem and no glass sheet, and leaves the other pages untouched when the prop is off', () => {
    const on = mount({});
    expect(on.querySelector('.poiv3_5__gem')).toBeNull();
    expect(on.querySelector('.poiv3_5__glass')).toBeNull();
    const off = mount({ sigillo: false });
    expect(off.querySelector('.poiv3_5__gem')).not.toBeNull();
    expect(off.querySelector('[data-testid="sigillo-border"]')).toBeNull();
    expect(off.querySelector('[data-silhouette]')).toBeNull();
  });
});

describe('PoiMatericV3_5 sigillo — halo tone (vermilion = urgency only)', () => {
  const toneOf = (c: HTMLElement) => c.querySelector('.poiv3_5__seal-halo path')?.getAttribute('stroke');

  it('uses ivory while a deadline drains, verdigris while work fills, vermilion only when expiring', () => {
    expect(toneOf(mount({ progress: 0.5, dir: 'counterclockwise' }))).toBe(IVORY);
    expect(toneOf(mount({ progress: 0.5, dir: 'clockwise' }))).toBe(VERDIGRIS);
    expect(toneOf(mount({ progress: 0.5, state: 'expiring', dir: 'counterclockwise' }))).toBe(VERMILION);
  });

  it('never paints a non-expiring halo vermilion', () => {
    for (const dir of ['clockwise', 'counterclockwise'] as const) {
      expect(toneOf(mount({ progress: 0.7, dir }))).not.toBe(VERMILION);
    }
  });

  it('pulses only when asked (a finished run awaiting the player)', () => {
    expect(mount({ progress: 1, pulse: true }).querySelector('.poiv3_5--pulse')).not.toBeNull();
    expect(mount({ progress: 1 }).querySelector('.poiv3_5--pulse')).toBeNull();
  });
});

describe('poiSizePx — S/M/L (threat magnitude, main quest = L)', () => {
  it('maps the 55 px base to 44 / 55 / 69, the --skin-poi-size-* tokens', () => {
    expect(poiSizePx(55, 'S')).toBe(44);
    expect(poiSizePx(55, 'M')).toBe(55);
    expect(poiSizePx(55, 'L')).toBe(69);
    expect(`${poiSizePx(55, 'S')}px`).toBe(BASE_SKIN_CSS_VARS['--skin-poi-size-s']);
    expect(`${poiSizePx(55, 'L')}px`).toBe(BASE_SKIN_CSS_VARS['--skin-poi-size-l']);
  });
});
