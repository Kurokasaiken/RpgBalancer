/**
 * PLAN-067 T-A11 (R-234) — chip text reads on its own chip. `HudChip` paints
 * the tone colour as text over a 12% wash of the same tone on the deep
 * lacquer: on the base skin the `danger` chip («WIPE — EVERYTHING IS LOST»)
 * measured 2.41:1 and `death` 2.57:1 — red on red (audit F5 §7). Every tone
 * must reach WCAG AA (4.5:1) on the base skin, resolved from the real tokens.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { HudChip, TONE, type Tone } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { BASE_SKIN_CSS_VARS } from '@/ui/idleVillage/skins/skinCssVariables';

type RGB = [number, number, number];
type RGBA = [number, number, number, number];
const VARS = BASE_SKIN_CSS_VARS as Record<string, string>;

const hex = (h: string): RGBA => {
  const s = h.replace('#', '');
  return [...[0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)), 1] as RGBA;
};
/** Resolves `var(--x)`, hex, `rgb[a]()` and `color-mix(in srgb, A p%, B)` over the base skin tokens. */
const resolve = (expr: string): RGBA => {
  const e = expr.trim();
  const v = /^var\((--[\w-]+)\)$/.exec(e);
  if (v) return resolve(VARS[v[1]]);
  if (e.startsWith('#')) return hex(e);
  const r = /^rgba?\(([^)]+)\)$/.exec(e);
  if (r) { const [a, b, c, al = '1'] = r[1].split(',').map((x) => x.trim()); return [Number(a), Number(b), Number(c), Number(al)]; }
  const m = /^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+?)(?:\s+(\d+(?:\.\d+)?)%)?\)$/.exec(e);
  if (m) {
    const a = resolve(m[1]);
    const b = resolve(m[3]);
    const p = Number(m[2]) / 100;
    return a.map((c, i) => c * p + b[i] * (1 - p)) as RGBA;
  }
  throw new Error(`unresolvable colour: ${e}`);
};
/** Text alpha composited over the (opaque) chip background. */
const over = (fg: RGBA, bg: RGBA): RGB => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])) as RGB;
const lum = ([r, g, b]: RGB) => {
  const f = (c: number) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: RGB, b: RGB) => { const [lo, hi] = [lum(a), lum(b)].sort((x, y) => x - y); return (hi + 0.05) / (lo + 0.05); };

describe('HudChip — text contrast on the base skin (R-234)', () => {
  it('covers every tone of the palette', () => {
    expect(Object.keys(TONE).sort()).toEqual(['accent', 'danger', 'death', 'label', 'muted', 'ok', 'secondary', 'text', 'warn']);
  });

  // INV:R-234-chip-text-contrast — every HudChip tone reaches 4.5:1 between its text and its
  // own chip background on the base skin (no red-on-red, no violet-on-violet).
  it.each(['label', 'text', 'secondary', 'muted', 'accent', 'ok', 'warn', 'danger', 'death'] as Tone[])('tone %s reaches 4.5:1', (tone) => {
    const { container } = render(<HudChip tone={tone}>x</HudChip>);
    const el = container.firstElementChild as HTMLElement;
    const bg = resolve(el.style.background);
    const ratio = contrast(over(resolve(el.style.color), bg), bg.slice(0, 3) as RGB);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
