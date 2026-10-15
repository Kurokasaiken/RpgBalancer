import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import sharp from 'sharp';
import { GameFrameDragCursor } from '@/ui/idleVillage/components/gameFrame/GameFrameDragCursor';

/**
 * PLAN-058 T5.1/T5.2 — the /game cursor set: the drawing (hotspots, sizes), the CSS that maps states to cursors
 * (hotspot literals equal the manifest; the order of the blocks is the precedence) and the dnd-kit bridge.
 */
const ROOT = resolve(__dirname, '../../..');
const CURSOR_DIR = 'public/assets/ui/cursors';
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

type Manifest = Record<string, { hotspot: [number, number]; sizes: number[] }>;
const manifest = JSON.parse(read(`${CURSOR_DIR}/game-cursors.json`)) as Manifest;
const css = read('src/ui/idleVillage/components/gameFrame/gameFrameCursors.css').replace(/\/\*[\s\S]*?\*\//g, '');
const SUFFIX: Record<number, string> = { 32: '', 48: '@1.5x', 64: '@2x' };

const POINTERS = ['point-default', 'point-interact', 'point-inspect', 'point-wait', 'point-disabled'];
const HANDS = ['hand-grab', 'hand-drag', 'hand-drop-yes', 'hand-drop-no', 'hand-pan'];

describe('game cursor drawing', () => {
  it('ships the five pointing gauntlets and the five grips, each at 32/48/64 px', () => {
    expect(Object.keys(manifest).sort()).toEqual([...POINTERS, ...HANDS].sort());
    for (const entry of Object.values(manifest)) expect(entry.sizes).toEqual([32, 48, 64]);
  });

  it('has real PNGs of the right size, opaque under the hotspot', async () => {
    for (const [name, { hotspot, sizes }] of Object.entries(manifest)) {
      for (const px of sizes) {
        const { data, info } = await sharp(resolve(ROOT, `${CURSOR_DIR}/game-${name}${SUFFIX[px]}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect([name, info.width, info.height]).toEqual([name, px, px]);
        const x = Math.round((hotspot[0] * px) / 32);
        const y = Math.round((hotspot[1] * px) / 32);
        expect([name, px, data[(y * px + x) * 4 + 3]]).not.toEqual([name, px, 0]);
      }
    }
  });

  it('puts every pointer hotspot on the same fingertip', () => {
    for (const name of POINTERS) expect(manifest[name].hotspot).toEqual(manifest['point-default'].hotspot);
  });
});

describe('gameFrameCursors.css', () => {
  it('declares every cursor with the hotspot of the manifest', () => {
    for (const [name, { hotspot }] of Object.entries(manifest)) {
      const line = css.match(new RegExp(`--game-cursor-${name}:([^;]+);`))?.[1];
      expect(line, name).toBeDefined();
      expect(line, name).toContain(`) ${hotspot[0]} ${hotspot[1]},`);
      for (const px of [32, 48, 64]) expect(line, name).toContain(`game-${name}${SUFFIX[px]}.png`);
    }
  });

  it('uses every cursor of the set in at least one rule', () => {
    for (const name of Object.keys(manifest)) expect(css, name).toContain(`var(--game-cursor-${name})`);
  });

  it('orders the blocks as the precedence: drag over hover, refused drop over accepted', () => {
    const at = (needle: string) => {
      const i = css.indexOf(needle);
      expect(i, needle).toBeGreaterThan(-1);
      return i;
    };
    const order = [
      at('button:not(:disabled)'), // interact
      at("[aria-roledescription='draggable']"), // grab
      at("[style*='cursor: help']"), // inspect
      at("button:disabled"), // disabled
      at("[aria-busy='true']"), // wait
      at("canvas[data-cursor='move']"), // pan
      at('html[data-game-drag] .game-frame,'), // drag
      at("[data-drop-state='valid']"), // drop yes
      at("[data-drop-state='invalid']"), // drop no
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('keeps !important on every state rule (HUD components set cursor inline)', () => {
    const declarations = css.match(/cursor:\s*var\(--game-cursor-[a-z-]+\)(?: !important)?;/g) ?? [];
    expect(declarations.length).toBeGreaterThan(8);
    // only the rest rule on the .game-frame root itself may go without it
    expect(declarations.filter((d) => !d.includes('!important'))).toHaveLength(1);
  });
});

const monitor = vi.hoisted(() => ({ handlers: {} as Record<string, () => void> }));
vi.mock('@dnd-kit/core', () => ({
  useDndMonitor: (handlers: Record<string, () => void>) => {
    monitor.handlers = handlers;
  },
}));

describe('GameFrameDragCursor', () => {
  beforeEach(() => document.documentElement.removeAttribute('data-game-drag'));

  it('flags the document from drag start until drop or cancel, and clears it on unmount', () => {
    const flag = () => document.documentElement.hasAttribute('data-game-drag');
    const view = render(createElement(GameFrameDragCursor));
    expect(flag()).toBe(false);
    monitor.handlers.onDragStart();
    expect(flag()).toBe(true);
    monitor.handlers.onDragEnd();
    expect(flag()).toBe(false);
    monitor.handlers.onDragStart();
    monitor.handlers.onDragCancel();
    expect(flag()).toBe(false);
    monitor.handlers.onDragStart();
    view.unmount();
    expect(flag()).toBe(false);
  });
});
