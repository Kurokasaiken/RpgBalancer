import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { parseMappa2Fauna, type Mappa2StormoConfig } from '../../../src/ui/idleVillage/config/mappa2FaunaConfig';
import { AmbientDirector, DEFAULT_AMBIENT_DIRECTOR_CONFIG, type AmbientDirectorConfig, type TakeoffZone } from '../../../src/ui/idleVillage/pixiSpike/ambient/ambientDirector';
import { StormoAdapter } from '../../../src/ui/idleVillage/pixiSpike/ambient/ambientStormo';
import { Texture } from 'pixi.js';

/**
 * PLAN-108 (R-306): the stormo flock family on /mappa2-lab. Regression guards:
 * contract leaf parses and anchors sit on the authored biomes; the flight
 * polyline stays in canvas and clears the village zone; the AmbientDirector
 * emits deterministic stormo admissions with per-family ordinals (shoal log
 * byte-identical); the adapter lifecycle is seed-pure; reduced-motion and the
 * kill switch leave the sky empty; the shipped cadence stays a rare event.
 */
const BASE = resolve(__dirname, '../../../public/assets/world/mappa2/base');
const faunaRaw = JSON.parse(readFileSync(resolve(BASE, 'fauna.json'), 'utf-8'));
const fauna = parseMappa2Fauna(faunaRaw);
const CFG: Mappa2StormoConfig = fauna.stormo;

const zones: TakeoffZone[] = fauna.takeoffs.map((t) => ({
  id: t.id, biome: t.biome, cx: t.x, cy: t.y, heading: t.heading, weight: t.weight,
}));

const testCfg = (over: Partial<Mappa2StormoConfig> = {}): Mappa2StormoConfig => ({ ...CFG, ...over });

const directorCfg = (stormoOn: boolean): AmbientDirectorConfig => ({
  ...DEFAULT_AMBIENT_DIRECTOR_CONFIG,
  intensity: 1,
  families: {
    shoal: { ...DEFAULT_AMBIENT_DIRECTOR_CONFIG.families.shoal },
    stormo: { ...DEFAULT_AMBIENT_DIRECTOR_CONFIG.families.stormo, enabled: stormoOn, ...CFG },
  },
});

async function biomePixels() {
  const { data, info } = await sharp(resolve(BASE, 'biome_ids.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { px: data, w: info.width };
}

// INV:pixi-world-map.INV-3
describe('mappa2 stormo contract (PLAN-108)', () => {
  it('fauna.json parses strict and every takeoff sits inside the canvas on its authored biome', async () => {
    const [w, h] = fauna.canvas;
    const biomes = await biomePixels();
    for (const t of fauna.takeoffs) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThan(w);
      expect(t.y).toBeLessThan(h);
      const idx = biomes.px[(Math.round(t.y) * biomes.w + Math.round(t.x)) * 4];
      expect(idx, `${t.id} biome`).toBe(t.biomeIndex);
    }
    expect(fauna.takeoffs.length).toBeGreaterThanOrEqual(2);
  });

  it('every takeoff flight polyline stays >=80% in canvas and clears the village rect', () => {
    const [w, h] = fauna.canvas;
    const maxTravel = CFG.speedPxS[1] * CFG.lifeSec[1];
    for (const t of fauna.takeoffs) {
      let inside = 0;
      const STEPS = 20;
      for (let i = 0; i <= STEPS; i += 1) {
        const d = (maxTravel * i) / STEPS;
        const x = t.x + t.heading[0] * d;
        const y = t.y + t.heading[1] * d;
        if (x >= 0 && x < w && y >= 0 && y < h) inside += 1;
        for (const ex of fauna.exclusions) {
          const inRect = x >= ex.x && x <= ex.x + ex.w && y >= ex.y && y <= ex.y + ex.h;
          expect(inRect, `${t.id} crosses ${ex.id}`).toBe(false);
        }
      }
      expect(inside / (STEPS + 1), `${t.id} trajectory`).toBeGreaterThanOrEqual(0.8);
    }
  });

  // INV:pixi-world-map.INV-5
  it('atlas on disk matches the declared pin: sha256 and frames*cellPx geometry', async () => {
    const buf = readFileSync(resolve(BASE, fauna.atlas.file));
    expect(createHash('sha256').update(buf).digest('hex')).toBe(fauna.atlas.sha256);
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(fauna.atlas.cellPx * fauna.atlas.frames);
    expect(meta.height).toBe(fauna.atlas.cellPx);
  });

  it('emits deterministic stormo admissions and keeps the shoal spawnlog byte-identical', () => {
    const shoalZones = [{ id: 's1', biome: 'open_sea', cx: 100, cy: 100, heading: [1, 0] as [number, number], maxTravelPx: 96, tintRow: 'deepTeal', weight: 1 }];
    const run = (withStormo: boolean) => {
      const d = new AmbientDirector({ shoal: shoalZones, stormo: withStormo ? zones : [] }, () => directorCfg(withStormo));
      for (let i = 0; i < 3000; i += 1) d.tick(100, () => 0, false);
      return d.log;
    };
    const a = run(true);
    const b = run(true);
    expect(a).toEqual(b); // same seed+ticks → identical spawnlog
    const noStormo = run(false);
    const shoalOnly = (log: typeof a) => log.filter((r) => r.family === 'shoal');
    expect(shoalOnly(a)).toEqual(shoalOnly(noStormo)); // stormo never renumbers shoal ordinals
    const stormoSpawns = a.filter((r) => r.family === 'stormo' && r.outcome === 'spawned');
    expect(stormoSpawns.length).toBeGreaterThan(0);
    expect(zones.map((z) => z.id)).toContain(stormoSpawns[0].zoneId);
  });

  it('respects the per-family cooldown (rare event, not continuous noise)', () => {
    const d = new AmbientDirector({ shoal: [], stormo: zones }, () => directorCfg(true));
    for (let i = 0; i < 36_000; i += 1) d.tick(100, () => 0, false); // 1h sim
    const spawns = d.log.filter((r) => r.family === 'stormo' && r.outcome === 'spawned');
    expect(spawns.length).toBeGreaterThan(0);
    for (let i = 1; i < spawns.length; i += 1) {
      const gapTicks = spawns[i].simT - spawns[i - 1].simT;
      expect(gapTicks * 0.1).toBeGreaterThanOrEqual(CFG.cooldownSec);
    }
    // band: probability 0.2/slot(20s) over 180 slots → expected ~36, hard cap by cooldown (40/h)
    expect(spawns.length).toBeLessThanOrEqual(40);
    expect(spawns.length).toBeLessThanOrEqual(Math.ceil(3600 / CFG.slotSec)); // ≤180 admissions
  });

  it('adapter lifecycle: flock rises along the heading, flaps, then despawns — pure from seed', () => {
    const frames = [Texture.EMPTY, Texture.EMPTY, Texture.EMPTY, Texture.EMPTY];
    const mk = () => new StormoAdapter(zones, frames, () => testCfg(), 1);
    const adm = { family: 'stormo' as const, zoneId: zones[0].id, biome: zones[0].biome, tick: 1, seed: 4242 };
    const a1 = mk();
    expect(a1.spawn(adm, 0)).toBe(true);
    expect(a1.activeCount()).toBe(1);
    const a2 = mk();
    a2.spawn(adm, 0);
    const p1 = a1.container.children[0].position;
    const p2 = a2.container.children[0].position;
    expect(p1.x).toBe(p2.x); // replay identical
    a1.update(5, false);
    const moved = a1.container.children[0].position;
    expect(moved.x).not.toBe(zones[0].cx); // travelled along heading
    a1.update(CFG.lifeSec[1] + 1, false);
    expect(a1.activeCount()).toBe(0);
  });

  it('kill switch and reduced-motion leave the sky empty; rejected spawns log suppressed', () => {
    const frames = [Texture.EMPTY];
    const off = new StormoAdapter(zones, frames, () => testCfg({ enabled: false }), 1);
    const adm = { family: 'stormo' as const, zoneId: zones[0].id, biome: zones[0].biome, tick: 1, seed: 7 };
    expect(off.spawn(adm, 0)).toBe(false);
    const on = new StormoAdapter(zones, frames, () => testCfg(), 1);
    on.spawn(adm, 0);
    on.update(0.5, true); // reduced-motion → instant hide
    expect(on.activeCount()).toBe(0);
    const d = new AmbientDirector({ shoal: [], stormo: zones }, () => directorCfg(true));
    d.noteSuppressed(adm, 'pool_full');
    expect(d.log.at(-1)?.outcome).toBe('suppressed');
    // triggerStormo on two fresh directors produces the identical admission (reproducible witnesses)
    const d1 = new AmbientDirector({ shoal: [], stormo: zones }, () => directorCfg(true));
    const d2 = new AmbientDirector({ shoal: [], stormo: zones }, () => directorCfg(true));
    expect(d1.triggerStormo(zones[0].id)?.seed).toBe(d2.triggerStormo(zones[0].id)?.seed);
  });
});
