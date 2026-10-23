/**
 * AmbientLayer — the quest theater's "life after the shot lands"
 * (PLAN-046 ambient slice).
 *
 * Renders the per-scene `ambient` FX list from `sceneManifest` on a single
 * 2D canvas. Two coordinate regimes:
 *   - `dust` lives in the air in front of the lens — view-space, cheap;
 *   - `glow`/`smoke`/`embers`/`drift` are authored on the artwork in
 *     image-fraction coordinates and mapped through `shaderUniforms` each
 *     frame — they ride the same camera window as the parallax layer, so
 *     a fire's glow stays glued to the fire while the camera pans.
 *
 * Every particle is a PURE function of the shared camera clock (seeded) —
 * frozen `t=` captures are deterministic and nothing accumulates.
 * Reduced motion renders nothing at all (codex/gemini consensus).
 */

import React, { useEffect, useRef } from 'react';
import { documentClock, type CameraClock } from './cameraEval';
import { cameraAt, shaderUniforms, THEATER_ANCHOR } from './depthTransform';
import { composeTrauma, traumaAt } from './trauma';
import type { AmbientFx } from './sceneManifest';
import type { CameraShot, QuestDepthFx } from '@/balancing/config/idleVillage/quests/questTheatreFx';

export interface AmbientLayerProps {
  clock?: CameraClock;
  reducedMotion: boolean;
  /** Per-scene seed so each artwork gets its own particle layout. */
  seed?: number;
  effects?: AmbientFx[];
  /** Anchoring inputs — when present, FX authored on the artwork follow
   *  the camera window. Without them `at`/`band` are read as view-fractions. */
  shot?: CameraShot;
  shotEpoch?: number;
  /** PLAN-050 §4 — trauma channel (same epoch/strength as DepthScene):
   *  emitters ride the uniform bg-share wobble and stay glued to the art. */
  traumaEpoch?: number | null;
  traumaStrength?: number;
  cfg?: QuestDepthFx;
  imgAspect?: number;
  viewAspect?: number;
}

/** Deterministic PRNG (mulberry32). */
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hexRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

/** Seeded per-particle parameter sets, built once per effect list. */
export interface Puffs { ph: number; x0: number; y0: number; r: number; rate: number; wob: number }
/** Deterministic per-particle params — exported for the renderer tests. */
export const seeded = (seed: number, n: number): Puffs[] => {
  const rand = rng(seed);
  return Array.from({ length: n }, () => ({
    ph: rand(),
    x0: rand(),
    y0: rand(),
    r: rand(),
    rate: 0.6 + rand() * 0.8,
    wob: rand() * Math.PI * 2,
  }));
};

/** img-fraction → canvas px mapping (same window math as the art layer). */
export interface AmbientView {
  toX: (ix: number) => number;
  toY: (iy: number) => number;
  /** img-fraction of height → px length. */
  lenY: (iy: number) => number;
}

const softDot = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: [number, number, number],
  a: number,
) => {
  if (a <= 0.001 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(rgb, a));
  g.addColorStop(1, rgba(rgb, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

/**
 * Draw one frame of the ambient FX list — a pure function of the clock
 * `t` (seconds): same inputs produce the same canvas op sequence, nothing
 * accumulates across frames. Exported so the runtime-invariant tests can
 * drive it with a mock 2d context (jsdom has no rasterizer).
 */
export function drawAmbientFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  view: AmbientView,
  fx: AmbientFx[],
  puffsFor: (key: string, n: number) => Puffs[],
): void {
  const { toX, toY, lenY } = view;
  const soft = (x: number, y: number, r: number, rgb: [number, number, number], a: number) =>
    softDot(ctx, x, y, r, rgb, a);

  for (let i = 0; i < fx.length; i++) {
    const f = fx[i];
    const key = `${i}:${f.type}`;

    if (f.type === 'dust') {
      const ps = puffsFor(key, f.count);
      for (const m of ps) {
        const x = (((m.x0 + 0.02 * Math.sin(t * 0.21 + m.wob) + (t * 0.004 * m.rate) % 1) % 1) + 1) % 1;
        const y = (((m.y0 + 0.01 * Math.sin(t * 0.13 + m.wob * 1.7)) % 1) + 1) % 1;
        const breathe = 0.55 + 0.45 * Math.sin(t * 0.35 + m.wob * 2.3);
        soft(x * w, y * h, (0.002 + m.r * 0.004) * h * 3, [255, 240, 210], (0.12 + m.r * 0.25) * breathe);
      }
      continue;
    }

    if (f.type === 'drift') {
      const ps = puffsFor(key, f.count);
      const rgb = hexRgb(f.color);
      for (const p of ps) {
        /* Blobs scroll the band; alpha fades at the wrap edges. */
        const span = 1.8;
        const x = ((p.x0 * span + f.speed * t) % span + span) % span - 0.4;
        const fade = Math.sin(Math.PI * Math.min(1, Math.max(0, (x + 0.4) / span)));
        const y = f.band[0] + p.y0 * (f.band[1] - f.band[0]);
        ctx.globalCompositeOperation = 'source-over';
        soft(toX(x), toY(y), lenY(0.08 + p.r * 0.14), rgb, f.a * fade);
      }
      continue;
    }

    if (f.type === 'smoke') {
      const ps = puffsFor(key, f.count);
      for (const p of ps) {
        /* Rise ~0.30 img-fraction over 9–16s, lean + sine wander,
         * alpha follows the life bell (born thin, dies thin). */
        const life = (t * 0.075 * p.rate + p.ph) % 1;
        const x = f.at[0] + f.lean * life + 0.02 * Math.sin(t * 0.4 + p.wob + life * 5);
        const y = f.at[1] - 0.3 * life;
        const a = 0.22 * Math.pow(Math.sin(Math.PI * life), 1.2);
        ctx.globalCompositeOperation = 'source-over';
        soft(toX(x), toY(y), lenY(0.03 + life * 0.11), [226, 222, 214], a);
      }
      continue;
    }

    if (f.type === 'glow') {
      /* Two incommensurate sines = organic fire flicker (no RNG per frame). */
      const wob =
        0.5 +
        0.5 * (0.6 * Math.sin(t * 7.3 + f.at[0] * 40) + 0.4 * Math.sin(t * 13.7 + f.at[1] * 60));
      const a = Math.min(1, Math.max(0, f.a * (1 - f.flicker * 0.5 + f.flicker * wob)));
      const r = lenY(f.r * (1 + 0.06 * wob));
      ctx.globalCompositeOperation = 'lighter';
      soft(toX(f.at[0]), toY(f.at[1]), r, hexRgb(f.color), a);
      ctx.globalCompositeOperation = 'source-over';
      continue;
    }

    if (f.type === 'embers') {
      const ps = puffsFor(key, f.count);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of ps) {
        /* Short hot lives: 2–4s rise, jitter grows with altitude. */
        const life = (t * 0.35 * p.rate + p.ph) % 1;
        const x = f.at[0] + (0.008 + 0.03 * life) * Math.sin(life * 12 + p.wob);
        const y = f.at[1] - 0.16 * life;
        const a = 0.85 * (1 - life) * (0.5 + 0.5 * Math.sin(t * 9 + p.wob * 3));
        soft(toX(x), toY(y), lenY(0.004 + p.r * 0.005), [255, 195, 107], a);
      }
      ctx.globalCompositeOperation = 'source-over';
      continue;
    }

    /* PLAN-052 showcase set (R-271) — the contract's "life" types. */

    if (f.type === 'glint') {
      /* A periodic flash on a single point — metal, wet stone, coin.
       * pow14 bell = dark most of the period, one sharp twinkle. */
      const p = puffsFor(key, 1)[0];
      const ph = (t / f.period + p.ph) % 1;
      const flash = Math.pow(Math.max(0, Math.sin(Math.PI * ph)), 14);
      const a = f.a * flash;
      if (a > 0.001) {
        const x = toX(f.at[0]);
        const y = toY(f.at[1]);
        const r = lenY(f.r);
        const rgb = hexRgb(f.color);
        ctx.globalCompositeOperation = 'lighter';
        soft(x, y, r * 3.2, rgb, a * 0.45);
        /* Cross flare — the tiny four-point star that reads as "shine". */
        ctx.strokeStyle = rgba(rgb, a);
        ctx.lineWidth = Math.max(1, r * 0.4);
        ctx.beginPath();
        ctx.moveTo(x - r * 2.4, y);
        ctx.lineTo(x + r * 2.4, y);
        ctx.moveTo(x, y - r * 2.4);
        ctx.lineTo(x, y + r * 2.4);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      continue;
    }

    if (f.type === 'fireflies') {
      /* Lit ~18% of each ~8s cycle — a wandering flash in the dark band. */
      const ps = puffsFor(key, f.count);
      const rgb = hexRgb(f.color);
      ctx.globalCompositeOperation = 'lighter';
      for (const m of ps) {
        const cyc = (t * 0.125 * m.rate + m.ph) % 1;
        const lit = cyc < 0.18 ? Math.sin((Math.PI * cyc) / 0.18) : 0;
        if (lit <= 0.01) continue;
        const wx = (m.x0 + 0.02 * Math.sin(t * 0.11 * m.rate + m.wob) + t * 0.003 * m.rate) % 1;
        const wy = (m.y0 + 0.012 * Math.sin(t * 0.17 * m.rate + m.wob * 1.3)) % 1;
        const x = f.xband[0] + (((wx % 1) + 1) % 1) * (f.xband[1] - f.xband[0]);
        const y = f.band[0] + (((wy % 1) + 1) % 1) * (f.band[1] - f.band[0]);
        soft(toX(x), toY(y), lenY(0.003 + m.r * 0.004), rgb, f.a * lit);
      }
      ctx.globalCompositeOperation = 'source-over';
      continue;
    }

    if (f.type === 'moths') {
      /* Erratic ellipse around the lamp — orbit in px so it stays round
       * at any aspect; flutter rides a faster sine on top. */
      const ps = puffsFor(key, f.count);
      const rgb = hexRgb(f.color);
      const cx = toX(f.at[0]);
      const cy = toY(f.at[1]);
      const R = lenY(f.r);
      ctx.globalCompositeOperation = 'lighter';
      for (const m of ps) {
        const ang = t * f.speed * (0.9 + m.rate * 0.7) + m.wob;
        const x = cx + R * 0.62 * Math.cos(ang) + R * 0.16 * Math.sin(t * 9 + m.wob * 3);
        const y = cy + R * 0.4 * Math.sin(ang * 1.31) + R * 0.11 * Math.sin(t * 13 + m.wob);
        const flick = 0.55 + 0.45 * Math.sin(t * 7 + m.wob * 2);
        soft(x, y, lenY(0.004 + m.r * 0.004), rgb, 0.45 * flick);
      }
      ctx.globalCompositeOperation = 'source-over';
      continue;
    }

    if (f.type === 'shaft') {
      /* Fan of breathing light rays — a gradient quad per ray, apex at
       * `from`, widening toward `to`. Screen blend (adds, never blows out
       * like 'lighter' on already-bright paint). */
      const fx0 = toX(f.from[0]);
      const fy0 = toY(f.from[1]);
      const fx1 = toX(f.to[0]);
      const fy1 = toY(f.to[1]);
      const dxp = fx1 - fx0;
      const dyp = fy1 - fy0;
      const len = Math.hypot(dxp, dyp) || 1;
      const nx = -dyp / len;
      const ny = dxp / len;
      const W = lenY(f.width);
      const hw = Math.max(1.5, W * (0.4 / f.count));
      const rgb = hexRgb(f.color);
      ctx.globalCompositeOperation = 'screen';
      for (let ri = 0; ri < f.count; ri++) {
        const s = f.count === 1 ? 0 : ri / (f.count - 1) - 0.5;
        const breath = 0.65 + 0.35 * Math.sin(t * 0.45 + ri * 1.37);
        const a = f.a * breath;
        if (a <= 0.002) continue;
        const bx = fx1 + nx * W * s;
        const by = fy1 + ny * W * s;
        const tx = fx0 + nx * W * s * 0.12;
        const ty = fy0 + ny * W * s * 0.12;
        const g = ctx.createLinearGradient(tx, ty, bx, by);
        g.addColorStop(0, rgba(rgb, a));
        g.addColorStop(1, rgba(rgb, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(tx - nx * hw * 0.35, ty - ny * hw * 0.35);
        ctx.lineTo(tx + nx * hw * 0.35, ty + ny * hw * 0.35);
        ctx.lineTo(bx + nx * hw, by + ny * hw);
        ctx.lineTo(bx - nx * hw, by - ny * hw);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

export const AmbientLayer: React.FC<AmbientLayerProps> = ({
  clock = documentClock,
  reducedMotion,
  seed = 1,
  effects = [{ type: 'dust', count: 14 }],
  shot,
  shotEpoch = 0,
  traumaEpoch = null,
  traumaStrength = 0,
  cfg,
  imgAspect = 1,
  viewAspect = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /* Pre-seeded particle params — index-stable per effect+particle. */
  const puffsRef = useRef<Map<string, Puffs[]>>(new Map());
  const live = useRef({ effects, shot, shotEpoch, traumaEpoch, traumaStrength, cfg, imgAspect, viewAspect, clock });
  /* Latest props for the rAF loop — assigned in an effect so the ref
   *  always mirrors the COMMITTED props (react-hooks/refs). */
  useEffect(() => {
    live.current = { effects, shot, shotEpoch, traumaEpoch, traumaStrength, cfg, imgAspect, viewAspect, clock };
  });
  /* PLAN-050 T-011 — an empty fx list means no temporal work: the loop
   *  simply doesn't start (same idle-stop invariant as the Pixi ticker). */
  const hasFx = effects.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (reducedMotion || !canvas || !hasFx) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();

    /* Seeded per-particle params — defined inside the effect so the hook's
     *  dependency list stays honest. */
    const puffsFor = (key: string, n: number): Puffs[] => {
      let p = puffsRef.current.get(key);
      if (!p || p.length !== n) {
        let h = seed * 977 + n * 17;
        for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
        p = seeded(h, n);
        puffsRef.current.set(key, p);
      }
      return p;
    };

    let raf = 0;
    const draw = () => {
      resize();
      const w = canvas.width;
      const h = canvas.height;
      const { effects: fx, shot: s, shotEpoch: epoch, traumaEpoch: tEp, traumaStrength: tSt, cfg: c, imgAspect: ia, viewAspect: va } =
        live.current;
      const t = live.current.clock() / 1000; // seconds
      ctx.clearRect(0, 0, w, h);

      /* img-fraction → view-px, through the same camera window as the
       *  artwork (identity when no camera props are supplied). */
      let cx = 0.5, cy = 0.5, hx = 0.5, hy = 0.5;
      if (s && c) {
        let state = cameraAt(s, live.current.clock() - epoch);
        if (tEp != null && tSt > 0) {
          state = composeTrauma(state, traumaAt(live.current.clock() - tEp, tSt, c.trauma), c.trauma);
        }
        const win = shaderUniforms(
          state,
          c,
          ia,
          va,
          THEATER_ANCHOR,
        );
        [cx, cy] = win.center;
        [hx, hy] = win.half;
      }
      const view: AmbientView = {
        toX: (ix: number) => (0.5 + (ix - cx) / (2 * hx)) * w,
        toY: (iy: number) => (0.5 + (iy - cy) / (2 * hy)) * h,
        /** img-fraction of height → view px. */
        lenY: (iy: number) => (iy * h) / (2 * hy),
      };
      drawAmbientFrame(ctx, w, h, t, view, fx, puffsFor);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, hasFx, seed]);

  if (reducedMotion) return null;
  return (
    <canvas
      ref={canvasRef}
      data-testid="ambient-layer"
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
};

/* Back-compat alias for the first slice's import sites. */
export const AmbientDust = AmbientLayer;
