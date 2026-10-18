/** sceneManifest tests — schema validation + on-disk asset gates (OB-2). */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SceneCinematicEntrySchema,
  SCENE_CINEMATICS,
  artIdFromSrc,
  cinematicEntryForSrc,
} from '@/ui/idleVillage/questS1Lab/render/sceneManifest';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
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
  }
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
