/**
 * Atmosphere overlay kit tests (PLAN-050 T-013 / PLAN-046 §6):
 *  - kit registry schema + on-disk asset gate;
 *  - manifest `atmosphere` ids must resolve to the registry;
 *  - `overlayFrame` camera coherence: parallax 0 = view-fixed, parallax 1
 *    rides the artwork window; drift is deterministic and wraps;
 *  - DOM mount: one sprite per enabled kit, blend/alpha applied;
 *    reduced-motion and empty lists mount nothing.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ATMOSPHERE_KITS,
  AtmosphereSpriteKitSchema,
  type AtmosphereSpriteKit,
} from '@/balancing/config/idleVillage/quests/questAtmosphereFx';
import { AtmosphereLayer } from '@/ui/idleVillage/questS1Lab/render/AtmosphereLayer';
import { fogVeilFrame, overlayFrame } from '@/ui/idleVillage/questS1Lab/render/atmosphereOverlay';
import {
  SceneCinematicEntrySchema,
  SCENE_CINEMATICS,
} from '@/ui/idleVillage/questS1Lab/render/sceneManifest';
import { cameraAt } from '@/ui/idleVillage/questS1Lab/render/depthTransform';
import { DEFAULT_QUEST_THEATRE_FX } from '@/balancing/config/idleVillage/quests/questTheatreFx';

const PUBLIC = join(process.cwd(), 'public');
const CFG = DEFAULT_QUEST_THEATRE_FX.depth;
const SHOT = DEFAULT_QUEST_THEATRE_FX.camera.shots.hold; // durMs 0 — settled frame

describe('kit registry — schema + assets', () => {
  it('rejects sprite assets outside /assets/atmosphere/ and bad blends', () => {
    expect(
      AtmosphereSpriteKitSchema.safeParse({
        kind: 'sprite',
        asset: '/assets/scene-library/x.webp',
        widthPx: 10,
        heightPx: 5,
        width: 0.5,
        band: [0.1, 0.4],
        speed: 0.01,
        parallax: 1,
        alpha: 0.5,
        anchorLeft: -0.5,
        travel: 2,
      }).success,
    ).toBe(false);
    expect(
      AtmosphereSpriteKitSchema.safeParse({
        kind: 'sprite',
        asset: '/assets/atmosphere/clouds/cloud_03.webp',
        widthPx: 10,
        heightPx: 5,
        width: 0.5,
        band: [0.1, 0.4],
        speed: 0.01,
        parallax: 1,
        alpha: 0.5,
        anchorLeft: -0.5,
        travel: 2,
        blend: 'hue',
      }).success,
    ).toBe(false);
  });

  it('fog kits use a baked noise texture — veils are masked matter, not gradients', () => {
    const fog = ATMOSPHERE_KITS['fog-low'];
    expect(fog.kind).toBe('fog');
    expect('asset' in fog).toBe(false);
    expect('gradientCore' in fog).toBe(false);
    expect(fog.layers).toBeGreaterThanOrEqual(2);
    expect(existsSync(join(PUBLIC, fog.texture)), `fog texture ${fog.texture}`).toBe(true);
  });

  it('every kit asset exists on disk under public/', () => {
    for (const [id, kit] of Object.entries(ATMOSPHERE_KITS)) {
      if (kit.kind === 'sprite') {
        expect(existsSync(join(PUBLIC, kit.asset)), `${id}: ${kit.asset}`).toBe(true);
      } else {
        expect(existsSync(join(PUBLIC, kit.texture)), `${id}: ${kit.texture}`).toBe(true);
      }
    }
  });

  it('kit bands are ordered inside [0,1] and sprite dims are positive', () => {
    for (const [id, kit] of Object.entries(ATMOSPHERE_KITS)) {
      expect(kit.band[0], id).toBeLessThan(kit.band[1]);
      if (kit.kind === 'sprite') {
        expect(kit.widthPx).toBeGreaterThan(0);
        expect(kit.heightPx).toBeGreaterThan(0);
      }
    }
  });
});

describe('manifest atmosphere ids resolve to the registry', () => {
  it('an unknown kit id fails schema validation', () => {
    const r = SceneCinematicEntrySchema.safeParse({
      depth: '/assets/depth/x.webp',
      depthWidth: 10,
      depthHeight: 5,
      imgAspect: 2,
      atmosphere: ['not-a-kit'],
    });
    expect(r.success).toBe(false);
  });

  it('every shipped atmosphere id is a known kit', () => {
    for (const [id, entry] of Object.entries(SCENE_CINEMATICS)) {
      for (const kitId of entry.atmosphere) {
        expect(ATMOSPHERE_KITS[kitId], `${id}: ${kitId}`).toBeTruthy();
      }
    }
  });
});

const spriteKit = (id: string): AtmosphereSpriteKit => {
  const kit = ATMOSPHERE_KITS[id];
  if (!kit || kit.kind !== 'sprite') throw new Error(`${id} is not a sprite kit`);
  return kit;
};

describe('overlayFrame — camera coherence (sprites)', () => {
  const mid = cameraAt(SHOT, 0); // landed state
  const moved = cameraAt(DEFAULT_QUEST_THEATRE_FX.camera.shots['pan-lateral'], 3000);

  it('parallax 0 ignores the camera; parallax 1 moves with the window', () => {
    const fixed = { ...spriteKit('cloud-sky'), parallax: 0 };
    const glued = { ...spriteKit('cloud-sky'), parallax: 1 };
    const a = overlayFrame(fixed, mid, CFG, 2.357, 2.4, 10);
    const b = overlayFrame(fixed, moved, CFG, 2.357, 2.4, 10);
    expect(a).toEqual(b); // view-fixed: camera-invariant

    const c = overlayFrame(glued, mid, CFG, 2.357, 2.4, 10);
    const d = overlayFrame(glued, moved, CFG, 2.357, 2.4, 10);
    expect(d.left).not.toBeCloseTo(c.left, 6); // rides the artwork
  });

  it('drift advances with time and wraps over `travel`', () => {
    const kit = spriteKit('cloud-sky');
    const f0 = overlayFrame(kit, mid, CFG, 2.357, 2.4, 0);
    const f1 = overlayFrame(kit, mid, CFG, 2.357, 2.4, 5);
    expect(f1.left).toBeGreaterThan(f0.left); // speed > 0 → moves right
    const wrapped = overlayFrame(kit, mid, CFG, 2.357, 2.4, kit.travel / kit.speed + 1);
    expect(wrapped.left).toBeCloseTo(overlayFrame(kit, mid, CFG, 2.357, 2.4, 1).left, 5);
  });

  it('frozen time is deterministic — same t, same frame', () => {
    const kit = spriteKit('cloud-shadow');
    const a = overlayFrame(kit, mid, CFG, 2.357, 2.4, 42);
    const b = overlayFrame(kit, mid, CFG, 2.357, 2.4, 42);
    expect(a).toEqual(b);
  });
});

describe('fogVeilFrame — fog kit semantics (OB-8 pass 3/4)', () => {
  const mid = cameraAt(SHOT, 0);
  const fog = ATMOSPHERE_KITS['fog-low'];
  if (fog.kind !== 'fog') throw new Error('fog-low must be a fog kit');

  it('the mask scrolls in DIFFERENT directions/speeds per veil — moving matter, no object contour', () => {
    const viewFixed = { ...fog, parallax: 0 };
    const v0a = fogVeilFrame(viewFixed, 0, mid, CFG, 2.357, 2.4, 0);
    const v0b = fogVeilFrame(viewFixed, 0, mid, CFG, 2.357, 2.4, 0.5);
    const v1a = fogVeilFrame(viewFixed, 1, mid, CFG, 2.357, 2.4, 0);
    const v1b = fogVeilFrame(viewFixed, 1, mid, CFG, 2.357, 2.4, 0.5);
    /* The veil RECT is static horizontally — the animation is inside it. */
    expect(v0b.left).toBe(v0a.left);
    expect(v1b.left).toBe(v1a.left);
    /* Scroll wraps at 1 tile; circular delta over the tile period. */
    const circularDelta = (from: number, to: number) => ((to - from + 1.5) % 1) - 0.5;
    expect(circularDelta(v0a.scroll, v0b.scroll)).toBeGreaterThan(0);
    expect(circularDelta(v1a.scroll, v1b.scroll)).toBeLessThan(0);
    expect(v0a.scroll).not.toBeCloseTo(v1a.scroll, 3); // distinct phases
  });

  it('veils spread across the band and cover the artwork horizontally', () => {
    for (let i = 0; i < fog.layers; i += 1) {
      const f = fogVeilFrame(fog, i, mid, CFG, 2.357, 2.4, 12);
      /* The strip is anchored with overscan — it always covers the frame
       *  edge to edge so no ellipse contour can ever appear (R-228). */
      expect(f.left, `veil ${i} left`).toBeLessThan(0.05);
      expect(f.left + f.width, `veil ${i} right`).toBeGreaterThan(0.95);
      expect(f.top, `veil ${i} top`).toBeGreaterThan(0.2);
      expect(f.top + f.height, `veil ${i} bottom`).toBeLessThan(1.25);
      expect(f.alpha).toBeGreaterThan(0);
      expect(f.alpha).toBeLessThanOrEqual(fog.alpha);
      expect(f.scroll).toBeGreaterThanOrEqual(0);
      expect(f.scroll).toBeLessThan(1);
    }
  });

  it('alpha breathes over time — thickens and thins', () => {
    const early = fogVeilFrame(fog, 0, mid, CFG, 2.357, 2.4, 0).alpha;
    const later = fogVeilFrame(fog, 0, mid, CFG, 2.357, 2.4, fog.breathSec / 4).alpha;
    expect(early).not.toBeCloseTo(later, 3);
  });

  it('deterministic — same t, same veil', () => {
    const a = fogVeilFrame(fog, 2, mid, CFG, 2.357, 2.4, 42);
    const b = fogVeilFrame(fog, 2, mid, CFG, 2.357, 2.4, 42);
    expect(a).toEqual(b);
  });
});

describe('AtmosphereLayer — DOM mount contract', () => {
  it('renders one sprite per sprite kit and `layers` veils inside a depth pool per fog kit', () => {
    const { container } = render(
      <AtmosphereLayer
        ids={['fog-low', 'cloud-shadow']}
        reducedMotion={false}
        shot={SHOT}
        cfg={CFG}
        imgAspect={2.357}
        viewAspect={2.4}
        fogMask="/assets/atmosphere/fog/mask-sentiero-tracce.png"
      />,
    );
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1); // cloud-shadow
    expect(imgs[0].src).toContain('cloud_02_shadow.webp');
    expect(imgs[0].style.mixBlendMode).toBe('multiply');
    expect(imgs[0].style.filter).toContain('brightness(0)');
    const veils = container.querySelectorAll('[data-fog-veil]');
    const fog = ATMOSPHERE_KITS['fog-low'];
    if (fog.kind !== 'fog') throw new Error('fog-low must be fog');
    expect(veils).toHaveLength(fog.layers);
    /* Veils live INSIDE the depth pool — fog exists only where the baked
     *  mask puts it on the terrain (R-228). */
    const pool = container.querySelector('[data-fog-pool]') as HTMLElement;
    expect(pool).toBeTruthy();
    expect(pool.style.maskImage).toContain('mask-sentiero-tracce.png');
    expect(pool.contains(veils[0])).toBe(true);
    const veil = veils[0] as HTMLElement;
    /* Masked tinted strip — no gradient, no SVG filter (R-228). */
    expect(veil.style.backgroundColor).toBeTruthy();
    expect(veil.style.maskImage).toContain('fog-noise-tile.png');
    expect(veil.style.maskRepeat).toBe('repeat-x');
    expect(veil.style.filter).toBe('');
    expect(container.querySelectorAll('svg')).toHaveLength(0);
    expect(fog.alpha).toBeGreaterThanOrEqual(0.2); // dense enough to attenuate detail, not just brighten
  });

  it('unknown and disabled kit ids are skipped', () => {
    const { container } = render(
      <AtmosphereLayer ids={['not-a-kit', 'fog-low']} reducedMotion={false} shot={SHOT} cfg={CFG} />,
    );
    /* fog-low is a fog kit → its veils mount (no img); the bogus id mounts nothing. */
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelectorAll('[data-fog-veil]')).toHaveLength(4);
  });

  it('mounts nothing under reduced-motion or an empty list', () => {
    const a = render(<AtmosphereLayer ids={['fog-low']} reducedMotion shot={SHOT} cfg={CFG} />);
    expect(a.container.querySelector('[data-testid="atmosphere-layer"]')).toBeNull();
    const b = render(<AtmosphereLayer ids={[]} reducedMotion={false} shot={SHOT} cfg={CFG} />);
    expect(b.container.querySelector('[data-testid="atmosphere-layer"]')).toBeNull();
  });

  it('schedules rAF while mounted — the drift is perpetual temporal work', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<AtmosphereLayer ids={['fog-low']} reducedMotion={false} shot={SHOT} cfg={CFG} />);
    await vi.waitFor(() => expect(rafSpy).toHaveBeenCalled());
    rafSpy.mockRestore();
  });
});
