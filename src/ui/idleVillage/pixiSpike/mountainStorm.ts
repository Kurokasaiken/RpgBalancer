import { Container, Graphics, Sprite, type Texture } from 'pixi.js';

/**
 * Storm CROWNS on the snowy peaks (Director 2026-10-30, visual-fork B''
 * frozen baseline `.mw/runs/20261030-peak-clouds-fork/preview/b-corona.png`
 * sha256 543481d3e772397c): the old cumulus cut-outs read as dark pasted
 * stickers and the giro-1 blob variants were rejected. What the ruling
 * approves, per grey snowy summit:
 *  - a RING of soft puffs (mist_blob sprites, not the painted cumulus sheets)
 *    wrapping the summit — light crown on top, slate belly underneath,
 *    a hole in the middle so the painted tip emerges;
 *  - a soft shadow the crown throws on the slope down-wind (same cell factory,
 *    same lifecycle — never a parallel simulation, T-07);
 *  - rain streaks under the south rim, ridge banner + intra-cloud lightning
 *    (unchanged machinery, re-anchored to the crown).
 * Sprites + one Graphics for streaks + one for bolts: Canvas-safe, no filters,
 * no per-frame allocation of textures. Deterministic: seeded streams only.
 */

export interface StormCell {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface MountainStormDeps {
  cells: StormCell[];
  wsx: number;
  wsy: number;
  /** Soft round blob (mist_blob): puffs, haze, shadow, flash. */
  blobTex: Texture;
  reducedMotion: boolean;
}

export interface MountainStorm {
  root: Container;
  tick: (simT: number, intensity: number, opacity: number, frozen: boolean) => void;
}

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

/**
 * Every grey snowy summit of the northern massif (Director 2026-10-30:
 * «ogni cima innevata, quelle grigie»). Detected on the mappa2 painting by a
 * snow score (bright + desaturated + non-cyan, local maxima ≥55 px apart) and
 * pruned by eye — bright red-rock walls, waterfall foam and meadows were
 * rejected. `width` = crown footprint in world px.
 */
export const SNOW_PEAKS: (StormCell & { width: number })[] = [
  { id: 'peak_1115_269', x: 1115, y: 269, radius: 40, width: 190 },
  { id: 'peak_1423_182', x: 1423, y: 182, radius: 38, width: 180 },
  { id: 'peak_1441_97', x: 1441, y: 97, radius: 42, width: 195 },
  { id: 'peak_1286_145', x: 1286, y: 145, radius: 40, width: 185 },
  { id: 'peak_1581_158', x: 1581, y: 158, radius: 32, width: 150 },
  { id: 'peak_1320_217', x: 1320, y: 217, radius: 36, width: 170 },
  { id: 'peak_1053_365', x: 1053, y: 365, radius: 30, width: 140 },
  { id: 'peak_1221_286', x: 1221, y: 286, radius: 34, width: 150 },
  { id: 'peak_1681_195', x: 1681, y: 195, radius: 30, width: 140 },
  { id: 'peak_1507_135', x: 1507, y: 135, radius: 34, width: 160 },
  { id: 'peak_1107_349', x: 1107, y: 349, radius: 34, width: 160 },
  { id: 'peak_1265_226', x: 1265, y: 226, radius: 30, width: 140 },
  { id: 'peak_1347_129', x: 1347, y: 129, radius: 34, width: 160 },
  { id: 'peak_1044_299', x: 1044, y: 299, radius: 32, width: 145 },
  { id: 'peak_1201_180', x: 1201, y: 180, radius: 34, width: 155 },
];

/** Wind blows from the north-west to the south-east (the painting is lit from the top-left). */
export const WIND = { x: 0.9, y: 0.43 } as const;
/** World-px footprint of a cell for an anchor radius: peak-sized, never a 300 px blob. */
export const cellWidth = (radius: number): number => Math.min(Math.max(radius * 2.6, 84), 140);
export const STREAKS_PER_CELL = 40;
/** Max streaks actually drawn per cell: the baseline reads sparse rain, not scratches. */
export const LIVE_STREAKS_PER_CELL = 9;
export const BOLT_MAX_LENGTH_PX = 36;

/** Crown geometry (fractions of cell width, from the frozen preview). */
export const CROWN = {
  /** Ring radii as fractions of cell width. */
  rx: 0.62,
  ry: 0.34,
  /** Ring band: puff centres sit at 0.5..1.0 of the ring radius (hole for the tip). */
  inner: 0.5,
  /** Puff width as a fraction of cell width. */
  thick: 0.22,
  /** Crown centre sits this many radii below the measured snow max. */
  cyOff: 0.5,
} as const;
export const CROWN_PUFFS_PER_CELL = 22;
export const CROWN_BELLY_PUFFS = 7;
export const CROWN_TINT_TOP = 0xe2eaf3;
export const CROWN_TINT_BELLY = 0x3a4456;
export const CROWN_BELLY_TINT_TOP = 0x3d4759;
export const CROWN_BELLY_TINT = 0x232b38;
export const CROWN_SHADOW_TINT = 0x1c2531;
/** Total sprites the storm layer may own (crowns + haze + shadow + glow per cell). */
export const MAX_STORM_SPRITES = 512;

const lerpHex = (a: number, b: number, t: number): number => {
  const t1 = Math.min(1, Math.max(0, t));
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t1);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t1);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t1);
  return (r << 16) | (g << 8) | bl;
};

export interface CrownPuff {
  /** Offset from the crown centre, world px (unscaled). */
  dx: number;
  dy: number;
  /** Puff sprite width, world px. */
  size: number;
  tint: number;
  alpha: number;
}

export interface CrownSpec {
  /** Crown centre, world px (unscaled). */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  puffs: CrownPuff[];
  /** The shadow the crown throws on the slope (T-07: born here, not later). */
  shadow: { dx: number; dy: number; w: number; h: number; alpha: number };
}

/**
 * Layout of one crown: a donut of soft puffs around the summit.
 * North/upper puffs take CROWN_TINT_TOP, south/lower ones CROWN_TINT_BELLY,
 * plus a denser slate belly pass on the south rim. Pure — no Pixi deps.
 */
export function crownSpec(cell: StormCell & { width?: number }, seed: number): CrownSpec {
  const rnd = mulberry32(seed);
  const w = cell.width ?? cellWidth(cell.radius);
  const cx = cell.x;
  const cy = cell.y + cell.radius * CROWN.cyOff;
  const rx = w * CROWN.rx;
  const ry = w * CROWN.ry;
  const thick = w * CROWN.thick;
  const puffs: CrownPuff[] = [];
  for (let i = 0; i < CROWN_PUFFS_PER_CELL; i += 1) {
    const a = rnd() * Math.PI * 2;
    const rr = CROWN.inner + (1 - CROWN.inner) * rnd();
    const dx = Math.cos(a) * rx * rr;
    const dy = Math.sin(a) * ry * rr;
    const t = (Math.sin(a) * rr + 1) / 2; // 0 top rim → 1 bottom rim
    puffs.push({
      dx,
      dy,
      size: thick * (0.7 + 0.6 * rnd()),
      tint: lerpHex(CROWN_TINT_TOP, CROWN_TINT_BELLY, t),
      alpha: 0.68 * (0.75 + 0.25 * rnd()),
    });
  }
  // Slate belly pass on the south rim (the storm's dark underside).
  for (let i = 0; i < CROWN_BELLY_PUFFS; i += 1) {
    const a = Math.PI / 2 + (rnd() - 0.5) * 1.9; // around +Y (south/down on the map)
    const rr = 0.75 + 0.25 * rnd();
    puffs.push({
      dx: Math.cos(a) * rx * rr,
      dy: Math.sin(a) * ry * rr + ry * 0.45,
      size: thick * (0.65 + 0.4 * rnd()),
      tint: lerpHex(CROWN_BELLY_TINT_TOP, CROWN_BELLY_TINT, rnd()),
      alpha: 0.5 * (0.8 + 0.2 * rnd()),
    });
  }
  return {
    cx,
    cy,
    rx,
    ry,
    puffs,
    // the crown's own shadow on the slope, cast down-wind of the summit light
    shadow: { dx: w * 0.16, dy: w * 0.55 + cell.radius * CROWN.cyOff, w: rx * 2.4, h: w * 0.2, alpha: 0.2 },
  };
}

/** Peak-sized lightning polyline (world px: ~22-34 long, <=3.5 px sideways per segment). */
export function boltPath(rnd: () => number, x0: number, y0: number, wsx = 1, wsy = 1): [number, number][] {
  const len = (22 + rnd() * 12) * wsy;
  const segs = 5 + Math.floor(rnd() * 2);
  const pts: [number, number][] = [[x0, y0]];
  for (let i = 1; i <= segs; i += 1) {
    const [px, py] = pts[i - 1];
    pts.push([px + (rnd() - 0.5) * 7 * wsx, py + (len / segs) * (0.8 + rnd() * 0.4)]);
  }
  return pts;
}

/** Gust factor 0.55..1.25: slow swell + two faster incommensurate ripples, per-cell phase. */
export function gust(simT: number, phase: number): number {
  return 0.9 + 0.22 * Math.sin(simT * 0.012 + phase) + 0.1 * Math.sin(simT * 0.037 + phase * 2.3) + 0.04 * Math.sin(simT * 0.045 + phase * 5.1);
}

/** Position (0..1 across, wrapped) of streak `s` along the wind at time `simT`. */
export function streakProgress(seed: number, simT: number, gustFactor: number, speed: number): number {
  const p = seed + simT * speed * 0.0016 * gustFactor;
  return p - Math.floor(p);
}

interface Strike {
  next: number; // sim time of the next strike
  phase: number; // 0 = idle, else ticks left in the current flash pattern
  shape: number; // pattern id
  t0: number;
  pts: [number, number][];
}

export function createMountainStorm(deps: MountainStormDeps): MountainStorm {
  const { cells, wsx, wsy, blobTex, reducedMotion } = deps;
  const root = new Container();
  root.label = 'mountain-storm';

  interface CellRt {
    cell: StormCell;
    w: number;
    cx: number;
    cy: number;
    haze: Sprite;
    shadow: Sprite;
    crown: { sp: Sprite; dx: number; dy: number; size: number; tint: number; base: number; ph: number }[];
    glow: Sprite;
    streaks: { u: number; v: number; sp: number; len: number; bright: boolean }[];
    gustPhase: number;
    strike: Strike;
    rnd: () => number;
  }
  const rts: CellRt[] = cells.map((cell) => {
    const rnd = mulberry32(fnv1a(`storm#${cell.id}`));
    const spec = crownSpec(cell, fnv1a(`crown#${cell.id}`));
    const cx = spec.cx * wsx;
    const cy = spec.cy * wsy;
    const w = spec.rx / CROWN.rx;
    const haze = new Sprite(blobTex);
    haze.anchor.set(0.5);
    haze.tint = 0xdbe5f1;
    const shadow = new Sprite(blobTex);
    shadow.anchor.set(0.5);
    shadow.tint = CROWN_SHADOW_TINT;
    shadow.position.set(cx + spec.shadow.dx * wsx, cy + spec.shadow.dy * wsy);
    shadow.scale.set((spec.shadow.w * wsx) / 256, (spec.shadow.h * wsy) / 256);
    shadow.alpha = spec.shadow.alpha;
    const crown = spec.puffs.map((p) => {
      const sp = new Sprite(blobTex);
      sp.anchor.set(0.5);
      sp.tint = p.tint;
      return { sp, dx: p.dx, dy: p.dy, size: p.size, tint: p.tint, base: p.alpha, ph: rnd() * 6.283 };
    });
    const glow = new Sprite(blobTex);
    glow.anchor.set(0.5);
    glow.tint = 0xd2d4ff; // violet-white, not pure blue (references: flashes read better slightly purple)
    glow.blendMode = 'add';
    glow.alpha = 0;
    const streaks = Array.from({ length: STREAKS_PER_CELL }, (_, i) => ({
      u: rnd(),
      v: rnd(),
      sp: 0.75 + rnd() * 0.6,
      len: 4 + rnd() * 5,
      bright: i % 3 === 0,
    }));
    return {
      cell,
      w,
      cx,
      cy,
      haze,
      shadow,
      crown,
      glow,
      streaks,
      gustPhase: rnd() * 6.283,
      strike: { next: 500 + rnd() * 700, phase: 0, shape: 0, t0: 0, pts: [] },
      rnd,
    };
  });
  // draw order: shadow+haze (ground) -> snow -> crown -> belly glow -> bolt
  const snow = new Graphics();
  const bolt = new Graphics();
  for (const r of rts) { root.addChild(r.shadow); root.addChild(r.haze); }
  root.addChild(snow);
  for (const r of rts) for (const p of r.crown) root.addChild(p.sp);
  for (const r of rts) root.addChild(r.glow);
  root.addChild(bolt);

  const draw = (simT: number, intensity: number, opacity: number, animate: boolean) => {
    snow.clear();
    const brights: [number, number, number, number][] = [];
    const dims: [number, number, number, number][] = [];
    for (const r of rts) {
      const g = animate ? gust(simT, r.gustPhase) : 0.9;
      const gk = Math.max(0, Math.min(1, (g - 0.5) / 0.7)); // 0..1 how hard it blows now
      // haze + shadow: pinned to the cell (the crown's own products, T-07)
      r.haze.position.set(r.cx, r.cy + r.w * 0.1 * wsy);
      r.haze.scale.set((r.w * 1.5 * wsx) / 256, (r.w * 0.7 * wsy) / 256);
      r.haze.alpha = Math.min(0.4, opacity * intensity * (0.16 + 0.12 * gk));
      r.shadow.alpha = Math.min(0.3, opacity * intensity * 0.5 * (0.8 + 0.2 * gk));
      // crown: each puff breathes on its own seeded phase — attached, never travelling
      const live = Math.round(r.crown.length * Math.min(1, 0.3 + 0.7 * intensity));
      for (let i = 0; i < live; i += 1) {
        const p = r.crown[i];
        const breathe = animate ? Math.sin(simT * 0.006 + p.ph) : 0;
        p.sp.position.set(r.cx + (p.dx + breathe * 2) * wsx, r.cy + (p.dy + breathe * 1.2) * wsy);
        const s = (p.size * (1 + 0.05 * breathe)) / 256;
        p.sp.scale.set(s * wsx, s * 0.55 * wsy);
        p.sp.alpha = Math.min(0.95, p.base * opacity * 1.7 * intensity * (0.7 + 0.3 * gk));
      }
      for (let i = live; i < r.crown.length; i += 1) r.crown[i].sp.alpha = 0;
      // snow: born under the crown's south rim, carried down-wind, faded at both ends.
      const liveStreaks = Math.round(LIVE_STREAKS_PER_CELL * Math.min(1, 0.45 + 0.7 * intensity));
      const baseY = r.cy / wsy + r.w * CROWN.ry * 0.9;
      for (let i = 0; i < liveStreaks; i += 1) {
        const s = r.streaks[i];
        const p = animate ? streakProgress(s.u, simT, 1, s.sp) : s.u;
        const x0 = r.cx / wsx + (s.v - 0.5) * r.w * 0.5;
        const run = r.w * 0.2 * s.sp;
        const x = x0 + p * run * WIND.x;
        const y = baseY + p * run * (WIND.y * 0.55 + 0.45);
        const env = Math.min(1, p / 0.12) * (1 - Math.max(0, (p - 0.3) / 0.7));
        const a = Math.min(0.85, opacity * 1.6 * env * (0.5 + 0.5 * gk) * intensity);
        (s.bright ? brights : dims).push([x * wsx, y * wsy, s.len, a]);
      }
      // snow banner off the crown's lee side (SE): a few steady trailing strokes
      for (let k = 0; k < 4; k += 1) {
        const x0 = r.cx / wsx + r.w * CROWN.rx * 0.5 + (k - 1.5) * 3;
        const y0 = r.cy / wsy - r.w * CROWN.ry * 0.3 + k * 1.4;
        const L = (14 + k * 4) * (0.8 + 0.3 * gk);
        const a = Math.min(0.5, opacity * 1.1 * intensity * (0.35 + 0.4 * gk));
        snow.moveTo(x0 * wsx, y0 * wsy);
        snow.lineTo((x0 + L * WIND.x) * wsx, (y0 + L * (WIND.y * 0.55 + 0.45)) * wsy);
        snow.stroke({ width: (2.0 - k * 0.35) * wsx, color: 0xf2f7ff, alpha: a * 0.55 });
      }
    }
    const strokeAll = (list: [number, number, number, number][], width: number, color: number, k: number) => {
      for (const [x, y, len, a] of list) {
        snow.moveTo(x, y);
        snow.lineTo(x - len * WIND.x * wsx, y - len * (WIND.y * 0.55 + 0.45) * wsy);
        snow.stroke({ width: width * wsx, color, alpha: Math.min(1, a * k) });
      }
    };
    strokeAll(dims, 0.8, 0xe6eefa, 0.7);
    strokeAll(brights, 1.1, 0xffffff, 0.85);
  };

  const lightning = (simT: number, intensity: number, frozen: boolean) => {
    bolt.clear();
    for (const r of rts) r.glow.alpha = 0;
    if (reducedMotion || intensity < 0.05) return;
    for (const r of rts) {
      const st = r.strike;
      if (!frozen && st.phase === 0 && simT >= st.next) {
        st.phase = 1;
        st.t0 = simT;
        st.shape = r.rnd() < 0.6 ? 1 : 0; // 1 = double flash
        // the bolt is drawn once per strike (not re-rolled each tick) from the crown's south rim
        st.pts = boltPath(r.rnd, r.cx + (r.rnd() - 0.5) * r.w * 0.4 * wsx, r.cy + r.w * CROWN.ry * 0.8 * wsy, wsx, wsy);
        st.next = simT + 520 + r.rnd() * 1100;
      }
      if (st.phase === 0) continue;
      const dt = simT - st.t0;
      // pattern (sim ticks): flash 0-8, dark 8-13, flash2 13-21 (double only), then done
      let lit = 0;
      let showBolt = false;
      if (dt < 8) { lit = 1 - dt / 8; showBolt = dt < 6; }
      else if (st.shape === 1 && dt >= 13 && dt < 21) { lit = 0.7 * (1 - (dt - 13) / 8); showBolt = false; }
      else if (dt >= (st.shape === 1 ? 21 : 8)) { st.phase = 0; continue; }
      // the cloud is lit from inside: a violet-white glow inside the crown
      r.glow.position.set(r.cx, r.cy - r.w * CROWN.ry * 0.5 * wsy);
      r.glow.scale.set((r.w * CROWN.rx * wsx) / 256, (r.w * CROWN.ry * wsy) / 256);
      r.glow.alpha = Math.min(0.75, lit * 0.75 * Math.min(1, intensity * 1.2));
      if (showBolt) {
        const pts = st.pts;
        const poly = () => { bolt.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) bolt.lineTo(q[0], q[1]); };
        poly(); bolt.stroke({ width: 3.0 * wsx, color: 0xb9b8ff, alpha: 0.26 * lit });
        poly(); bolt.stroke({ width: 1.0 * wsx, color: 0xf6f4ff, alpha: 0.95 * lit });
      }
    }
  };

  return {
    root,
    tick: (simT, intensity, opacity, frozen) => {
      root.visible = intensity > 0.01;
      if (!root.visible) return;
      draw(simT, intensity, opacity, !reducedMotion);
      lightning(simT, intensity, frozen);
    },
  };
}
