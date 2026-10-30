import { Container, Graphics, Sprite, type Texture } from 'pixi.js';

/**
 * A localized snowstorm on the northern peaks (Director 2026-10-30: the old "storm clouds" were blobs that drifted
 * and flickered and made no sense). What a viewer reads in a mountain storm, from the references (banner clouds,
 * blown snow, intra-cloud lightning):
 *  - a dark, low cloud bank that SITS on the summit (attached, breathing slowly; it does not travel),
 *  - a faint whiteout haze under it (restricts the view a little, never hides the terrain),
 *  - snow streaking sideways in the wind in gusts (long thin streaks along one wind vector, gust-modulated),
 *  - snow blowing off the ridge like a flag (banner/spindrift),
 *  - lightning that lights the cloud from INSIDE (a violet-white glow in the cloud, double flash), with a small bolt.
 * Sprites + one Graphics for streaks + one for bolts: Canvas-safe, no filters, no per-frame allocation of textures.
 * Deterministic: seeded streams only.
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
  /** Painted cloud sprites of the pack (~420 px wide): the body of the bank. */
  cloudTex: Texture[];
  /** Soft round blob (mist_blob): haze and flash. */
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
 * Storm cells sit on the painted summits of the snowy north (picked on the mappa2 painting; the pipeline's
 * `orographic` anchors are ridge-weight points and do not land on peaks). `width` = footprint in world px.
 */
export const NORTH_PEAKS: (StormCell & { width: number })[] = [
  // snow-cap maxima measured on the painting (L>62, low chroma, blurred, local maxima)
  { id: 'peak_a', x: 1284, y: 142, radius: 40, width: 190 },
  { id: 'peak_b', x: 1115, y: 255, radius: 46, width: 215 },
  { id: 'peak_c', x: 1201, y: 178, radius: 36, width: 170 },
  { id: 'peak_d', x: 1084, y: 323, radius: 38, width: 185 },
  { id: 'peak_e', x: 1443, y: 92, radius: 38, width: 185 },
  { id: 'peak_f', x: 1424, y: 183, radius: 38, width: 180 },
  { id: 'peak_g', x: 1368, y: 240, radius: 34, width: 160 },
];

/** Wind blows from the north-west to the south-east (the painting is lit from the top-left). */
export const WIND = { x: 0.9, y: 0.43 } as const;
/** World-px size of a cell's footprint for an anchor radius: peak-sized, never a 300 px blob. */
export const cellWidth = (radius: number): number => Math.min(Math.max(radius * 2.6, 84), 140);
export const STREAKS_PER_CELL = 40;
export const BOLT_MAX_LENGTH_PX = 36;

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
  const { cells, wsx, wsy, cloudTex, blobTex, reducedMotion } = deps;
  const root = new Container();
  root.label = 'mountain-storm';

  interface CellRt {
    cell: StormCell;
    w: number;
    cx: number;
    cy: number;
    haze: Sprite;
    bank: { sp: Sprite; ox: number; oy: number; ph: number; base: number; tint: number }[];
    glow: Sprite;
    streaks: { u: number; v: number; sp: number; len: number; bright: boolean }[];
    gustPhase: number;
    strike: Strike;
    rnd: () => number;
  }
  const rts: CellRt[] = cells.map((cell) => {
    const rnd = mulberry32(fnv1a(`storm#${cell.id}`));
    const w = (cell as { width?: number }).width ?? cellWidth(cell.radius);
    const haze = new Sprite(blobTex);
    haze.anchor.set(0.5);
    haze.tint = 0xdbe5f1;
    const bank = [0, 1, 2].map((i) => {
      const sp = new Sprite(cloudTex[(i + Math.floor(rnd() * 2)) % cloudTex.length]);
      sp.anchor.set(0.5);
      const tint = [0x434b5a, 0x5f6a80, 0x838ea4][i];
      sp.tint = tint;
      return { sp, ox: (rnd() - 0.5) * w * 0.3, oy: -w * (0.03 + 0.06 * i), ph: rnd() * 6.283, base: (w * (1.05 - 0.12 * i)) / 420, tint };
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
      cx: cell.x * wsx,
      cy: cell.y * wsy,
      haze,
      bank,
      glow,
      streaks,
      gustPhase: rnd() * 6.283,
      strike: { next: 500 + rnd() * 700, phase: 0, shape: 0, t0: 0, pts: [] },
      rnd,
    };
  });
  // draw order: haze (back) -> snow -> bank -> glow -> bolt
  const snow = new Graphics();
  const bolt = new Graphics();
  for (const r of rts) root.addChild(r.haze);
  root.addChild(snow);
  for (const r of rts) for (const b of r.bank) root.addChild(b.sp);
  for (const r of rts) root.addChild(r.glow);
  root.addChild(bolt);

  const draw = (simT: number, intensity: number, opacity: number, animate: boolean) => {
    snow.clear();
    const brights: [number, number, number, number][] = [];
    const dims: [number, number, number, number][] = [];
    for (const r of rts) {
      const g = animate ? gust(simT, r.gustPhase) : 0.9;
      const gk = Math.max(0, Math.min(1, (g - 0.5) / 0.7)); // 0..1 how hard it blows now
      // haze + bank: attached to the summit, breathing slowly; a gust thickens them a little
      r.haze.position.set(r.cx, r.cy + r.w * 0.05 * wsy);
      r.haze.scale.set((r.w * 1.5 * wsx) / 256, (r.w * 0.75 * wsy) / 256);
      r.haze.alpha = Math.min(0.5, opacity * intensity * (0.22 + 0.16 * gk));
      for (const b of r.bank) {
        const breathe = animate ? Math.sin(simT * 0.006 + b.ph) : 0;
        b.sp.position.set(r.cx + (b.ox + breathe * 3) * wsx, r.cy + (b.oy + breathe * 1.2) * wsy);
        b.sp.scale.set(b.base * (1 + 0.04 * breathe) * wsx, b.base * 0.9 * (1 + 0.04 * breathe) * wsy);
        b.sp.alpha = Math.min(0.95, opacity * 1.7 * intensity * (0.7 + 0.3 * gk));
      }
      // snow: born UNDER the cloud (its base), carried one way by the wind (down-wind and falling), faded at both ends.
      // Never travels back, never starts outside the cloud footprint.
      const live = Math.round(STREAKS_PER_CELL * Math.min(1, 0.45 + 0.7 * intensity));
      const baseY = r.cy / wsy + r.w * 0.03;
      for (let i = 0; i < live; i += 1) {
        const s = r.streaks[i];
        const p = animate ? streakProgress(s.u, simT, 1, s.sp) : s.u;
        const x0 = r.cx / wsx + (s.v - 0.5) * r.w * 0.6;
        const run = r.w * 0.2 * s.sp;
        const x = x0 + p * run * WIND.x;
        const y = baseY + p * run * (WIND.y * 0.55 + 0.45);
        const env = Math.min(1, p / 0.12) * (1 - Math.max(0, (p - 0.3) / 0.7));
        const a = Math.min(0.85, opacity * 1.6 * env * (0.5 + 0.5 * gk) * intensity);
        (s.bright ? brights : dims).push([x * wsx, y * wsy, s.len, a]);
      }
      // snow banner off the ridge: a few steady trailing strokes (no swaying)
      for (let k = 0; k < 4; k += 1) {
        const x0 = r.cx / wsx + (k - 1.5) * 3;
        const y0 = r.cy / wsy + r.w * 0.04 + k * 1.4;
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
        // the bolt is drawn once per strike (not re-rolled each tick) from the cloud base
        st.pts = boltPath(r.rnd, r.cx + (r.rnd() - 0.5) * r.w * 0.4 * wsx, r.cy + r.w * 0.02 * wsy, wsx, wsy);
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
      // the cloud is lit from inside: a violet-white glow inside the bank, and the bank tints toward white
      r.glow.position.set(r.cx, r.cy - r.w * 0.12 * wsy);
      r.glow.scale.set((r.w * 1.0 * wsx) / 256, (r.w * 0.45 * wsy) / 256);
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
