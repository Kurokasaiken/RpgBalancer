import { Container, Graphics, Sprite, Texture } from 'pixi.js';
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
  const glintTex = await load(packAssetUrl(pack.packRoot, 'fx/weather/snow_glint.webp'));

  const box = new Container();
  box.label = 'regional-weather';
  box.zIndex = REGIONAL_WEATHER_Z;

  const slots: Slot[] = [];
  const bolt = new Graphics(); // lightning: jagged polyline, redrawn per strike
  box.addChild(bolt);
  const flash = new Sprite(mistTex);
  flash.anchor.set(0.5);
  flash.tint = 0xf0f6ff;
  flash.visible = false;
  box.addChild(flash);
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
      const ySquash = type === 'mist' ? 0.45 : type === 'orographic' ? 0.6 : 1;
      sp.scale.set(baseScale * wsx, baseScale * ySquash * wsy);
      if (type === 'volcano') sp.tint = 0xb8a894;
      if (type === 'orographic') sp.tint = 0xe4eaf2;
      box.addChild(sp);
      slots.push({ anchor, sp, ph: rnd(), baseScale, wanderA: rnd() * Math.PI * 2, wanderB: 0.5 + rnd() });
    }
  };
  // mist blob: world-width ~8x anchor radius (floor 110px) over a 256px texture
  mkSlots('mist', data.caps.mist, mistTex, (r) => Math.max(r * 8, 110) / 256);
  // orographic bank: big squashed storm-white blobs riding the massif tops
  mkSlots('orographic', data.caps.orographic, mistTex, (r) => Math.max(r * 2.6, 150) / 256);
  mkSlots('glint', data.caps.glints, glintTex, () => 0.9);
  // Volcano (Director 2026-10-29, peak «cima 1»): the painting has no volcano, so everything is runtime —
  // a pulsing crater glow, a few lava veins running down the slope, and a smoke plume that rises from the
  // crater, shears with the wind and cools from lit orange to ash grey. Sprites + one Graphics, Canvas-safe.
  const vent = data.anchors.find((a) => a.type === 'volcano');
  const plume: { sp: Sprite; ph: number; wob: number }[] = [];
  const glowHalo = new Sprite(emberTex);
  const glowCore = new Sprite(emberTex);
  const veins = new Graphics();
  if (vent) {
    const N = Math.max(0, Math.min(data.caps.volcano, PARTICLE_BUDGET));
    for (let i = 0; i < N; i += 1) {
      const rnd = mulberry32(fnv1a(`${vent.id}#plume${i}`));
      const sp = new Sprite(mistTex);
      sp.anchor.set(0.5);
      sp.visible = false;
      box.addChild(sp);
      plume.push({ sp, ph: i / N, wob: rnd() * Math.PI * 2 });
    }
    const vx = vent.x * wsx;
    const vy = vent.y * wsy;
    const paths: [number, number][][] = [
      [[-3, 5], [-12, 22], [-10, 40], [-24, 58]],
      [[4, 6], [15, 22], [12, 38], [28, 54]],
      [[0, 8], [3, 30], [-5, 50]],
    ];
    for (const pth of paths) {
      veins.moveTo(vx + pth[0][0] * wsx, vy + pth[0][1] * wsy);
      for (const q of pth.slice(1)) veins.lineTo(vx + q[0] * wsx, vy + q[1] * wsy);
    }
    veins.stroke({ width: 7 * wsx, color: 0xff3a10, alpha: 0.28 });
    for (const pth of paths) {
      veins.moveTo(vx + pth[0][0] * wsx, vy + pth[0][1] * wsy);
      for (const q of pth.slice(1)) veins.lineTo(vx + q[0] * wsx, vy + q[1] * wsy);
    }
    veins.stroke({ width: 2.4 * wsx, color: 0xff8a2a, alpha: 0.95 });
    box.addChild(veins);
    for (const [g, k, tint] of [[glowHalo, 5.5, 0xff3a10], [glowCore, 1.7, 0xffc060]] as const) {
      g.anchor.set(0.5);
      g.scale.set((vent.radius * k * wsx) / 8, (vent.radius * k * wsy) / 8);
      g.position.set(vx, vy);
      g.tint = tint;
      box.addChild(g);
    }
  }
  if (disposed()) return null;
  world.addChild(box);

  let simT = 0;
  let frozen = false;
  const boltRnd = mulberry32(fnv1a(`bolt#${data.seed}`));
  let boltNext = 400 + boltRnd() * 500; // first strike ~7-15 sim-seconds in
  let boltTtl = 0;
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
      glint: reducedMotion ? 0 : Math.round(cfg.glints * capOf('glint')),
      ember: 0,
      dust: 0,
    };
    // lightning: deterministic strikes between orographic slots — bolt +
    // flash wash, a few sim-ticks of life, next strike drawn from the stream.
    const bankLive = (visCount.orographic ?? 0) > 0 && !reducedMotion;
    boltTtl = Math.max(0, boltTtl - speed);
    if (bankLive && !frozen && simT >= boltNext) {
      const oro = slots.filter((q) => q.anchor.type === 'orographic' && q.sp.visible);
      if (oro.length > 1) {
        const src = oro[Math.floor(boltRnd() * oro.length)];
        const x0 = src.sp.x + (boltRnd() - 0.5) * 60;
        const y0 = src.sp.y + src.sp.height * 0.3;
        bolt.clear();
        bolt.setStrokeStyle({ width: 2.2, color: 0xf4faff, alpha: 0.9 });
        let bx = x0, by = y0;
        const segs = 5 + Math.floor(boltRnd() * 3);
        bolt.moveTo(bx, by);
        for (let i = 0; i < segs; i += 1) {
          bx += (boltRnd() - 0.5) * 34;
          by += 90 / segs + boltRnd() * 22;
          bolt.lineTo(bx, by);
        }
        bolt.stroke();
        if (boltRnd() < 0.5) { // one fork
          bolt.moveTo(x0, y0 + 30);
          bolt.lineTo(x0 + (boltRnd() - 0.5) * 70, y0 + 60 + boltRnd() * 30);
          bolt.stroke();
        }
        bolt.alpha = 0.95;
        boltTtl = 16 + boltRnd() * 14;
        boltNext = simT + 360 + boltRnd() * 780;
        flash.position.set(bx, by - 60);
        flash.scale.set(1.6, 1.0);
        flash.alpha = 0.85;
        flash.visible = true;
      } else {
        boltNext = simT + 200;
      }
    }
    if (boltTtl <= 0) { bolt.alpha = 0; bolt.clear(); flash.visible = false; }
    else { bolt.alpha = Math.min(0.95, boltTtl / 18); flash.alpha = Math.min(0.85, boltTtl / 22); }
    // volcano: glow pulse, lava veins, rising plume
    if (vent) {
      const live = (visCount.volcano ?? 0) > 0;
      const k = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(simT * 0.03 + 1.3);
      const k2 = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(simT * 0.07);
      glowHalo.visible = glowCore.visible = veins.visible = live;
      glowHalo.alpha = cfg.opacity * (0.45 + 0.4 * k);
      glowCore.alpha = Math.min(1, cfg.opacity * (0.9 + 0.5 * k2));
      veins.alpha = Math.min(1, 0.55 + 0.45 * k);
      const n = Math.min(plume.length, visCount.volcano ?? 0);
      for (let i = 0; i < plume.length; i += 1) {
        const q = plume[i];
        q.sp.visible = i < n;
        if (i >= n) continue;
        const p = reducedMotion ? q.ph : (simT * 0.0012 + q.ph) % 1;
        const h = p * 230; // world px above the crater
        const x = vent.x + h * 0.42 + Math.sin(p * 5 + q.wob) * 9 * p;
        const y = vent.y - h * 0.9;
        q.sp.position.set(x * wsx, y * wsy);
        const size = (30 + 135 * Math.sqrt(p)) / 256;
        q.sp.scale.set(size * wsx, size * 0.85 * wsy);
        const fadeIn = Math.min(1, p / 0.07);
        const fadeOut = p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5;
        q.sp.alpha = Math.min(0.85, cfg.opacity * 1.5 * fadeIn * fadeOut);
        // lit orange at the crater -> dark smoke -> pale ash high up
        const t1 = Math.min(1, p / 0.2);
        const t2 = Math.max(0, (p - 0.2) / 0.8);
        const r = Math.round(0xff + (0x46 - 0xff) * t1 + (0xa4 - 0x46) * t2);
        const gch = Math.round(0x7a + (0x3a - 0x7a) * t1 + (0x9e - 0x3a) * t2);
        const bch = Math.round(0x30 + (0x36 - 0x30) * t1 + (0x98 - 0x36) * t2);
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
        // reduced motion: pinned phase -> static low-alpha mist (OB-7 contract)
        const p = reducedMotion ? s.ph : (simT * 0.012 * s.wanderB + s.ph) % 1;
        const ang = s.wanderA + p * Math.PI * 2;
        const rr = a.radius * (0.3 + 0.6 * Math.abs(Math.sin(p * Math.PI)));
        s.sp.position.set((a.x + Math.cos(ang) * rr) * wsx, (a.y + Math.sin(ang) * rr * 0.55) * wsy);
        const breathe = 0.25 + 0.45 * Math.sin(p * Math.PI * 2 + s.ph * 6.28);
        s.sp.alpha = cfg.opacity * (reducedMotion ? 0.6 : Math.max(0.15, breathe));
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
      counts: () => slots.reduce<Record<string, number>>((m, s) => {
        m[s.anchor.type] = (m[s.anchor.type] ?? 0) + 1;
        return m;
      }, {}),
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
