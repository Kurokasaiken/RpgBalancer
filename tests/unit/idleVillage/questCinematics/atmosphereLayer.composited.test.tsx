/**
 * R-241 jank (atmosphere-layer): the per-frame rAF loop writes ONLY
 * composited properties (`transform`/`opacity`) on veils and sprites.
 *
 * Director (2026-10-21): «tutta l'animazione dello skill check sembra
 * scattosa». Live profiling showed the atmosphere layer was the top DOM
 * mutator (2443 writes in ~10s): width/height/mask-* per frame → layout +
 * paint every rAF, stalling the astrolabe frames (p95 gaps 66–116ms).
 *
 * The DOM-mount assertions here FAIL on the layout-write implementation:
 * before the fix the veil elements carried px width/height/mask-position
 * written every frame.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ATMOSPHERE_KITS } from '@/balancing/config/idleVillage/quests/questAtmosphereFx';
import { AtmosphereLayer } from '@/ui/idleVillage/questS1Lab/render/AtmosphereLayer';
import { DEFAULT_QUEST_THEATRE_FX } from '@/balancing/config/idleVillage/quests/questTheatreFx';

const CFG = DEFAULT_QUEST_THEATRE_FX.depth;
const SHOT = DEFAULT_QUEST_THEATRE_FX.camera.shots.hold;

/**
 * Run one rAF tick against the mounted layer. jsdom reports zero client
 * rects, so host dims are stubbed — the draw loop bails on `w<=0`.
 */
const tickOnce = (rafSpy: ReturnType<typeof vi.spyOn>) => {
  const cb = rafSpy.mock.calls.at(-1)?.[0];
  expect(cb).toBeTypeOf('function');
  cb?.(0);
};

describe('AtmosphereLayer — composited-only per-frame writes (R-241 jank)', () => {
  // INV:R-241-atmosphere-composited — veils/sprites receive transform+opacity
  // per frame; width/height/mask-position (layout+paint) are never written
  // in the rAF loop.
  it('writes transform/opacity on veils, never width/height/maskPosition', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const wSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
    const hSpy = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540);
    try {
      const { container } = render(
        <AtmosphereLayer ids={['fog-low']} reducedMotion={false} shot={SHOT} cfg={CFG} imgAspect={2.357} viewAspect={2.4} />,
      );
      tickOnce(rafSpy);
      const veil = container.querySelector('[data-fog-veil="0"]') as HTMLElement;
      expect(veil).toBeTruthy();
      /* Composited writes present… */
      expect(veil.style.transform).toContain('translate');
      expect(veil.style.transform).toContain('scale');
      expect(veil.style.opacity).not.toBe('');
      /* …and no layout/paint writes: the veil stays host-sized (100%), its
         mask-position is never touched (scroll rides in translateX). */
      expect(veil.style.width).toBe('100%');
      expect(veil.style.height).toBe('100%');
      expect(veil.style.maskPosition).toBe('');
    } finally {
      rafSpy.mockRestore();
      wSpy.mockRestore();
      hSpy.mockRestore();
    }
  });

  // INV:R-241-atmosphere-composited — sprites ride on transform only: the
  // img keeps its natural raster size, never a px width write per frame.
  it('sprites animate via transform only — no per-frame px width', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const wSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
    const hSpy = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540);
    try {
      const { container } = render(
        <AtmosphereLayer ids={['cloud-shadow']} reducedMotion={false} shot={SHOT} cfg={CFG} imgAspect={2.357} viewAspect={2.4} />,
      );
      tickOnce(rafSpy);
      const img = container.querySelector('img') as HTMLElement;
      expect(img).toBeTruthy();
      expect(img.style.transform).toContain('translate');
      expect(img.style.transform).toContain('scale');
      expect(img.style.width).toBe('');
      expect(img.style.height).toBe('');
    } finally {
      rafSpy.mockRestore();
      wSpy.mockRestore();
      hSpy.mockRestore();
    }
  });
});
