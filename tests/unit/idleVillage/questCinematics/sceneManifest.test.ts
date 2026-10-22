/** sceneManifest tests — schema validation + on-disk asset gates (OB-2). */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AmbientFxSchema,
  SceneCinematicEntrySchema,
  SCENE_CINEMATICS,
  artIdFromSrc,
  cinematicEntryForSrc,
} from '@/ui/idleVillage/questS1Lab/render/sceneManifest';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { ATMOSPHERE_KITS } from '@/balancing/config/idleVillage/quests/questAtmosphereFx';
import { fogMaskForDepth } from '@/ui/idleVillage/questS1Lab/render/atmosphereOverlay';
import { DEFAULT_QUEST_THEATRE_FX } from '@/balancing/config/idleVillage/quests/questTheatreFx';

const PUBLIC = join(process.cwd(), 'public');

describe('manifest schema', () => {
  it('rejects a depth path outside /assets/depth/', () => {
    expect(
      SceneCinematicEntrySchema.safeParse({ depth: '/assets/scene-library/x.webp', depthWidth: 1, depthHeight: 1, imgAspect: 1 }).success,
    ).toBe(false);
  });
  it('rejects a non-webp depth file', () => {
    expect(
      SceneCinematicEntrySchema.safeParse({ depth: '/assets/depth/x.png', depthWidth: 1, depthHeight: 1, imgAspect: 1 }).success,
    ).toBe(false);
  });
  it('keeps the reserved fields for later slices', () => {
    const r = SceneCinematicEntrySchema.safeParse({
      depth: '/assets/depth/x.webp',
      depthWidth: 10,
      depthHeight: 5,
      imgAspect: 2,
      atmosphere: ['fog-low'],
      foregroundCutout: { src: '/assets/fg/x.png', depth: 0.2 },
      camera: 'push-in',
    });
    expect(r.success).toBe(true);
  });
});

describe('shipped manifest entries', () => {
  for (const [id, entry] of Object.entries(SCENE_CINEMATICS)) {
    it(`${id}: depth webp exists and is within the byte gate`, () => {
      const p = join(PUBLIC, entry.depth);
      expect(existsSync(p), entry.depth).toBe(true);
      const bytes = statSync(p).size;
      expect(bytes).toBeLessThanOrEqual(DEFAULT_QUEST_THEATRE_FX.depth.bake.maxBytes);
    });
    it(`${id}: the source scene art exists`, () => {
      const art = Object.values(NODE_ART).find((a) => artIdFromSrc(a.src) === id);
      expect(art, `NODE_ART contains ${id}`).toBeTruthy();
      expect(existsSync(join(PUBLIC, art!.src))).toBe(true);
    });
    it(`${id}: baked depth aspect matches the source aspect`, () => {
      expect(entry.depthWidth).toBeGreaterThanOrEqual(512);
      expect(entry.depthWidth / entry.depthHeight).toBeCloseTo(entry.imgAspect, 1);
    });
    it(`${id}: ambient anchors stay on the artwork`, () => {
      for (const fx of entry.ambient) {
        if ('at' in fx) {
          expect(fx.at[0], `${id} ${fx.type} x`).toBeGreaterThanOrEqual(0);
          expect(fx.at[0], `${id} ${fx.type} x`).toBeLessThanOrEqual(1);
          expect(fx.at[1], `${id} ${fx.type} y`).toBeGreaterThanOrEqual(0);
          expect(fx.at[1], `${id} ${fx.type} y`).toBeLessThanOrEqual(1);
        }
        if (fx.type === 'drift') {
          expect(fx.band[0]).toBeLessThan(fx.band[1]);
          expect(fx.band[1]).toBeLessThanOrEqual(1);
        }
      }
    });
  }
});

describe('ambient fx schema', () => {
  it('defaults counts and rejects bad color/anchor shapes', () => {
    expect(AmbientFxSchema.parse({ type: 'embers', at: [0.5, 0.5] }).count).toBe(5);
    expect(AmbientFxSchema.safeParse({ type: 'glow', at: [0.5, 0.5], r: 0.1, color: 'orange', a: 0.4 }).success).toBe(false);
    expect(AmbientFxSchema.safeParse({ type: 'smoke', at: [2, 0.5] }).success).toBe(true); // anchor range is a scene concern, schema only needs the tuple
    expect(AmbientFxSchema.safeParse({ type: 'nope' }).success).toBe(false);
  });
  it('shipped scenes carry authored ambient lists', () => {
    expect(SCENE_CINEMATICS['accampamento-raider'].ambient.some((f) => f.type === 'glow')).toBe(true);
    expect(SCENE_CINEMATICS['agguato-foresta'].ambient.some((f) => f.type === 'dust')).toBe(true);
  });
});

describe('atmosphere authoring — conservative scene ownership', () => {
  it('uses fog only on the forest path and keeps the rejected scenes clear', () => {
    /* Director ruling: "la nebbia deve essere in sentiero tracce, non in
     * foresta agguato" — pooled ground fog, not a suspended band. */
    expect(SCENE_CINEMATICS['sentiero-tracce'].atmosphere).toEqual(['fog-low']);
    expect(SCENE_CINEMATICS['agguato-foresta'].atmosphere).toEqual([]);
    expect(SCENE_CINEMATICS['fuga-goblin'].atmosphere).toEqual([]);
    expect(SCENE_CINEMATICS['carro-nascosto'].atmosphere).toEqual([]);
    expect(SCENE_CINEMATICS['accampamento-raider'].atmosphere).toEqual([]);
    expect(SCENE_CINEMATICS.saccheggio.atmosphere).toEqual([]);
    expect(SCENE_CINEMATICS['assalto-goblin'].atmosphere).toEqual([]);
    expect(SCENE_CINEMATICS.ritorno.atmosphere).toEqual([]);
  });

  it('every scene with a fog kit has its baked depth-pool mask on disk', () => {
    /* The pool mask is what makes fog lie ON the terrain (R-228); a scene
     *  authoring fog without a baked mask would render the old band. */
    for (const [id, entry] of Object.entries(SCENE_CINEMATICS)) {
      const hasFog = entry.atmosphere.some((k) => ATMOSPHERE_KITS[k]?.kind === 'fog');
      if (!hasFog) continue;
      const mask = fogMaskForDepth(entry.depth);
      expect(mask, `${id} derives a mask path`).toBeTruthy();
      expect(existsSync(join(PUBLIC, mask!)), `${id}: ${mask}`).toBe(true);
    }
  });
});

describe('cinematicEntryForSrc', () => {
  it('returns the entry for a manifest scene src', () => {
    const art = Object.values(NODE_ART).find((a) => artIdFromSrc(a.src) === 'agguato-foresta')!;
    expect(cinematicEntryForSrc(art.src)).toEqual(SCENE_CINEMATICS['agguato-foresta']);
  });
  it('returns null for scenes without depth (DOM path)', () => {
    const noDepth = Object.values(NODE_ART).find((a) => !SCENE_CINEMATICS[artIdFromSrc(a.src)]);
    if (noDepth) expect(cinematicEntryForSrc(noDepth.src)).toBeNull();
    expect(cinematicEntryForSrc(undefined)).toBeNull();
    expect(cinematicEntryForSrc('/assets/nope.jpg')).toBeNull();
  });
});

describe('artIdFromSrc', () => {
  it('strips path + extension', () => {
    expect(artIdFromSrc('/assets/scene-library/agguato-foresta.jpg')).toBe('agguato-foresta');
    expect(artIdFromSrc('x.png')).toBe('x');
  });
});
