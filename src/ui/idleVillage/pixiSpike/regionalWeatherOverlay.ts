import { Container, Sprite, Texture } from 'pixi.js';
import { NORTH_PEAKS, createMountainStorm } from './mountainStorm';
import { createFeederRiver } from './feederRiver';
import {
  Mappa2RegionalWeatherSchema,
  regionalWeatherConfigRef,
  type Mappa2RegionalWeather,
  type WeatherAnchor,
} from '@/ui/idleVillage/config/mappa2RegionalWeatherConfig';

/**
 * PLAN-098 v1: regional atmospheric accents (mist + embers) for `/mappa2-lab`.
 * Self-contained mount: fetch leaf contract, load textures, build the
 * `regional-weather` box (z=4: above base/canopy, below REGION_RING_Z=5),
 * register a tick, expose `__regionalWeatherDebug`. Sprite/Graphics only —
 * Canvas-safe by construction (no Mesh/Filter/shader).
 *
 * Determinism: FNV-1a(anchor.id) -> mulberry32, never Math.random.
 * Drift clamped: anchor.radius + driftMax <= anchor.reach (asserted by
 * the leaf schema); particle centres stay inside the anchor radius.
 */

export const REGIONAL_WEATHER_Z = 4;

const fnv1a = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};


interface Slot {
  anchor: WeatherAnchor;
  sp: Sprite;
  ph: number; // phase 0..1
  baseScale: number;
  wanderA: number; // seeded wander params
  wanderB: number;
}

interface RegionalWeatherRuntime {
  box: Container;
  tick: (t: number) => void;
}

export interface RegionalWeatherMountDeps {
  pack: { packRoot: string };
  world: Container;
  canvasW: number;
  canvasH: number;
  load: (url: string) => Promise<Texture>;
  fetchJson: <T>(url: string) => Promise<T>;
  ticks: { push: (fn: (t: number) => void) => void };
  reducedMotion: boolean;
  packAssetUrl: (root: string, file: string) => string;
  disposed: () => boolean;
}

const PARTICLE_BUDGET = 60;

/** Mounts the overlay; no-op unless the pack ships `weather-anchors.json`. */
export async function mountRegionalWeather(deps: RegionalWeatherMountDeps): Promise<RegionalWeatherRuntime | null> {
  const { pack, world, canvasW, canvasH, load, fetchJson, ticks, reducedMotion, packAssetUrl, disposed } = deps;
  const raw = await fetchJson<unknown>(packAssetUrl(pack.packRoot, 'weather-anchors.json')).catch(() => null);
  const parsed = raw ? Mappa2RegionalWeatherSchema.safeParse(raw) : null;
  if (raw && !parsed?.success) {
    throw new Error(`weather-anchors.json failed Mappa2RegionalWeatherSchema: ${parsed?.error.issues[0]?.message ?? 'unknown'}`);
  }
  const data: Mappa2RegionalWeather | null = parsed?.success ? parsed.data : null;
  if (!data || disposed()) return null;

  const wsx = canvasW / data.canvas.width;
  const wsy = canvasH / data.canvas.height;
  const mistTex = await load(packAssetUrl(pack.packRoot, 'fx/weather/mist_blob.webp'));
  const emberTex = await load(packAssetUrl(pack.packRoot, 'fx/weather/ember.webp'));

  const box = new Container();
  box.label = 'regional-weather';
  box.zIndex = REGIONAL_WEATHER_Z;

  const slots: Slot[] = [];
  // Valley mist = low, wide banks made of the map's own painted cloud sprites (Director 2026-10-30: soft blobs
  // "did not look like clouds"), thin and pale, hugging the water.
  const mistClouds = await Promise.all(['02', '04'].map((n) => load(packAssetUrl(pack.packRoot, `fx/clouds/mappa2_cloud_${n}.webp`))));
  const mkSlots = (type: WeatherAnchor['type'], cap: number, tex: Texture, scaleFor: (r: number) => number) => {
    const anchors = data.anchors.filter((a) => a.type === type);
    if (cap <= 0 || anchors.length === 0) return;
    // slot count = min(cap, anchors budget share); distribute ∝ weight (soft)
    const n = Math.min(cap, PARTICLE_BUDGET);
    for (let i = 0; i < n; i += 1) {
      const anchor = anchors[i % anchors.length];
      const rnd = mulberry32(fnv1a(`${anchor.id}#${i}`));
      const sp = new Sprite(tex);
      sp.anchor.set(0.5);
      const baseScale = scaleFor(anchor.radius) * (0.8 + rnd() * 0.4);
      // mist hugs the water: flattened ellipse; smoke stays round + tinted
      const ySquash = type === 'mist' ? 0.45 : 1;
      sp.scale.set(baseScale * wsx, baseScale * ySquash * wsy);
      if (type === 'volcano') sp.tint = 0xb8a894;
      if (type === 'mist') { sp.texture = mistClouds[i % mistClouds.length]; sp.tint = 0xe6f1ef; }
      box.addChild(sp);
      slots.push({ anchor, sp, ph: rnd(), baseScale, wanderA: rnd() * Math.PI * 2, wanderB: 0.5 + rnd() });
    }
  };
  // mist blob: world-width ~8x anchor radius (floor 110px) over a 256px texture
  mkSlots('mist', data.caps.mist, mistTex, (r) => Math.max(r * 3.2, 90) / 440);
  // orographic bank: big squashed storm-white blobs riding the massif tops
  // Localized snowstorm on the northern peaks (Director 2026-10-30; see mountainStorm.ts): cloud bank attached to the
  // summit, whiteout haze, wind-streaked snow, ridge banner and intra-cloud lightning. Replaces the old drifting
  // "storm clouds" blobs. The cells are the orographic anchors of the alpine north (the red massif has no snow).
  const stormCells = data.anchors.some((a) => a.type === 'orographic') ? NORTH_PEAKS : [];
  const storm = stormCells.length
    ? createMountainStorm({
        cells: stormCells,
        wsx,
        wsy,
        cloudTex: await Promise.all(['03', '06'].map((n) => load(packAssetUrl(pack.packRoot, `fx/clouds/mappa2_cloud_${n}.webp`)))),
        blobTex: mistTex,
        reducedMotion,
      })
    : null;
  if (storm) box.addChild(storm.root);
  // snow-melt streams -> small fall -> alpine lake (feederRiver.ts)
  const feeder = createFeederRiver(wsx, wsy);
  box.addChild(feeder.g);
  // snow glints removed (Director 2026-10-30: they twinkled off the snow and flickered)
  // Volcano (Director 2026-10-29, peak «cima 1»). Ruling 2026-10-30: a volcano is a HOLE WITH LAVA IN IT (no lava
  // running down the slope, no glow floating on the painted tip) and the smoke must be in the map's own style.
  // So the crater is baked into a painted patch (`scripts/build-mappa2-volcano-crater.py`: pointed tip removed, basalt
  // rim, dark pit, lava pool, placed 1:1 over the painting) plus a lava sprite pulsed additively; the smoke is a column of
  // painted lobed puffs (`smoke_*.webp`, shaded like the map's clouds), tinted dark at the vent and paler higher up.
  const vent = data.anchors.find((a) => a.type === 'volcano');
  const plume: { sp: Sprite; ph: number; wob: number; drift: number; rot: number }[] = [];
  const craterSp = new Sprite(Texture.EMPTY);
  const lavaSp = new Sprite(Texture.EMPTY);
  const haloSp = new Sprite(Texture.EMPTY);
  if (vent) {
    const [craterTex, lavaTex] = await Promise.all([
      load(packAssetUrl(pack.packRoot, 'fx/volcano/crater.webp')),
      load(packAssetUrl(pack.packRoot, 'fx/volcano/lava.webp')),
    ]);
    const smokeTex = await Promise.all(
      [1, 2, 3, 4].map((n) => load(packAssetUrl(pack.packRoot, `fx/volcano/smoke_${n}.webp`))),
    );
    const N = Math.max(0, Math.min(data.caps.volcano, PARTICLE_BUDGET));
    for (let i = 0; i < N; i += 1) {
      const rnd = mulberry32(fnv1a(`${vent.id}#plume${i}`));
      const sp = new Sprite(smokeTex[i % smokeTex.length]);
      sp.anchor.set(0.5);
      sp.visible = false;
      box.addChild(sp);
      plume.push({ sp, ph: i / N, wob: rnd() * Math.PI * 2, drift: 0.7 + rnd() * 0.6, rot: (rnd() - 0.5) * 0.9 });
    }
    // patch = 80x62 world px with its top-left at (vent.x-40, vent.y-34) (see the bake script)
    const px = (vent.x - 40) * wsx;
    const py = (vent.y - 34) * wsy;
    for (const sp of [craterSp, lavaSp]) {
      sp.position.set(px, py);
      sp.width = 80 * wsx;
      sp.height = 62 * wsy;
    }
    craterSp.texture = craterTex;
    lavaSp.texture = lavaTex;
    lavaSp.blendMode = 'add';
    // a small heat spill on the rim, not a floating blob
    const hc = document.createElement('canvas');
    hc.width = 64;
    hc.height = 32;
    const hx = hc.getContext('2d');
    if (hx) {
      hx.translate(32, 16);
      hx.scale(1, 0.5);
      const g = hx.createRadialGradient(0, 0, 4, 0, 0, 32);
      g.addColorStop(0, 'rgba(255,110,30,0.5)');
      g.addColorStop(1, 'rgba(200,40,10,0)');
      hx.fillStyle = g;
      hx.fillRect(-32, -32, 64, 64);
    }
    haloSp.texture = Texture.from(hc);
    haloSp.anchor.set(0.5);
    haloSp.blendMode = 'add';
    haloSp.width = 34 * wsx;
    haloSp.height = 14 * wsy;
    haloSp.position.set(vent.x * wsx + 0.5, (vent.y + 6.5 + 12 - 2.5) * wsy);
    box.addChild(craterSp);
    box.addChild(lavaSp);
    box.addChild(haloSp);
  }
  if (disposed()) return null;
  world.addChild(box);

  let simT = 0;
  let frozen = false;
  const capOf = (type: string) => ({ mist: data.caps.mist, volcano: data.caps.volcano, orographic: data.caps.orographic, glint: data.caps.glints } as Record<string, number>)[type] ?? 0;

  const tick = (t: number) => {
    const cfg = regionalWeatherConfigRef.current;
    box.visible = cfg.enabled;
    if (!cfg.enabled) return;
    const speed = reducedMotion ? 0 : cfg.speed;
    if (!frozen) simT += speed;
    const visCount: Record<string, number> = {
      mist: Math.round(cfg.mist * capOf('mist')),
      volcano: Math.round((cfg.volcano ?? cfg.embers) * capOf('volcano')),
      orographic: Math.round((cfg.orographic ?? 1) * capOf('orographic')),
      glint: 0,
      ember: 0,
      dust: 0,
    };
    feeder.tick(simT, cfg.river ?? 1, cfg.opacity, reducedMotion);
    storm?.tick(simT, reducedMotion ? 0.7 : (visCount.orographic ?? 0) / Math.max(1, capOf('orographic')), cfg.opacity, frozen);
    // volcano: pulsing lava in the crater + rising smoke
    if (vent) {
      const live = (visCount.volcano ?? 0) > 0;
      // irregular flicker: slow breathing + two faster incommensurate flutters (never a clean sine)
      const fl = reducedMotion ? 0.6 : Math.max(0, Math.min(1, 0.55 + 0.22 * Math.sin(simT * 0.045 + 1.3) + 0.14 * Math.sin(simT * 0.07 + 0.4) + 0.09 * Math.sin(simT * 0.16 + 2.1)));
      craterSp.visible = lavaSp.visible = haloSp.visible = live;
      lavaSp.alpha = 0.35 + 0.65 * fl;
      haloSp.alpha = Math.min(1, cfg.opacity * (0.35 + 0.75 * fl));
      const n = Math.min(plume.length, visCount.volcano ?? 0);
      for (let i = 0; i < plume.length; i += 1) {
        const q = plume[i];
        q.sp.visible = i < n;
        if (i >= n) continue;
        const p = reducedMotion ? q.ph : (simT * 0.0009 * q.drift + q.ph) % 1;
        const h = p * 175; // world px above the crater: a short column, not a trail across the plain
        // narrow at the vent, leaning with the wind, billowing a little more with height
        const x = vent.x + 0.5 + h * 0.3 + Math.sin(p * 3.6 + q.wob) * (1.5 + 7 * p);
        const y = vent.y + 6 - h * 0.95;
        q.sp.position.set(x * wsx, y * wsy);
        // puff textures are 160 px with ~80 px of body: scale to the wanted body size (11 -> 56 world px)
        const size = (11 + 45 * Math.pow(p, 0.75)) / 80;
        q.sp.scale.set(size * wsx, size * wsy);
        q.sp.rotation = q.rot + p * 0.6;
        const fadeIn = Math.min(1, p / 0.06);
        const fadeOut = p < 0.45 ? 1 : 1 - (p - 0.45) / 0.55;
        q.sp.alpha = Math.min(0.88, cfg.opacity * 1.9 * fadeIn * fadeOut);
        // dark underlit smoke at the vent, greying out as it rises
        const t1 = Math.min(1, p / 0.14);
        const t2 = Math.max(0, (p - 0.14) / 0.86);
        const r = Math.round(0x9a + (0x66 - 0x9a) * t1 + (0xc4 - 0x66) * t2);
        const gch = Math.round(0x66 + (0x5c - 0x66) * t1 + (0xc0 - 0x5c) * t2);
        const bch = Math.round(0x52 + (0x58 - 0x52) * t1 + (0xba - 0x58) * t2);
        q.sp.tint = (r << 16) | (gch << 8) | bch;
      }
    }
    const seen: Record<string, number> = {};
    for (const s of slots) {
      const idx = (seen[s.anchor.type] = (seen[s.anchor.type] ?? 0) + 1);
      const vis = idx <= (visCount[s.anchor.type] ?? 0);
      s.sp.visible = vis;
      if (!vis) continue;
      const a = s.anchor;
      if (a.type === 'mist') {
        // reduced motion: pinned phase -> static low-alpha mist (OB-7 contract).
        // simT counts FRAMES (60/s): the old rates made the mist pulse every 1-3 s, which read as flicker. A bank now
        // takes ~40-100 s to drift and swell, and its alpha follows a smooth sin^2 swell with no floor/jump.
        const p = reducedMotion ? s.ph : (simT * 0.00028 * s.wanderB + s.ph) % 1;
        const ang = s.wanderA + p * Math.PI * 2;
        const rr = a.radius * (0.3 + 0.6 * Math.abs(Math.sin(p * Math.PI)));
        s.sp.position.set((a.x + Math.cos(ang) * rr) * wsx, (a.y + Math.sin(ang) * rr * 0.55) * wsy);
        const swell = Math.sin(p * Math.PI * 2 + s.ph * 6.28);
        s.sp.alpha = cfg.opacity * (reducedMotion ? 0.35 : 0.12 + 0.28 * swell * swell);
      } else {
        // ember: rise + lateral wander inside anchor radius, flicker alpha
        const p = (simT * 0.05 * s.wanderB + s.ph) % 1;
        const rise = a.radius * (0.4 + p * 1.1);
        const lat = Math.sin(p * 12.6 + s.wanderA) * a.radius * 0.35;
        const clamped = Math.min(rise, Math.max(0, a.reach - a.radius));
        s.sp.position.set((a.x + lat) * wsx, (a.y - clamped) * wsy);
        const flick = 0.7 + 0.3 * Math.sin(p * 40 + s.ph * 6.28);
        s.sp.alpha = cfg.opacity * flick * (p > 0.85 ? (1 - p) / 0.15 : 1);
      }
    }
  };
  ticks.push(tick);

  Object.assign(window as object, {
    __regionalWeatherDebug: {
      order: () => world.children.map((c) => ({ label: c.label, zIndex: c.zIndex })),
      // storm cells and volcano puffs are not slot sprites (mountainStorm.ts / the volcano plume): report them too
      counts: () => ({
        ...slots.reduce<Record<string, number>>((m, s) => {
          m[s.anchor.type] = (m[s.anchor.type] ?? 0) + 1;
          return m;
        }, {}),
        orographic: stormCells.length,
        volcano: plume.length,
      }),
      positions: () => slots.map((s) => ({ id: s.anchor.id, type: s.anchor.type, x: s.sp.x, y: s.sp.y, visible: s.sp.visible, alpha: s.sp.alpha })),
      freeze: () => { frozen = true; },
      setTime: (ms: number) => { simT = ms / 16.7; },
      set: (patch: Partial<typeof regionalWeatherConfigRef.current>) => {
        Object.assign(regionalWeatherConfigRef.current, patch);
      },
      box,
    },
  });
  return { box, tick };
}
