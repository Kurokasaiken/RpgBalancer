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
interface Puffs { ph: number; x0: number; y0: number; r: number; rate: number; wob: number }
const seeded = (seed: number, n: number): Puffs[] => {
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

    const soft = (x: number, y: number, r: number, rgb: [number, number, number], a: number) => {
      if (a <= 0.001 || r <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(rgb, a));
      g.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

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
      const toX = (ix: number) => (0.5 + (ix - cx) / (2 * hx)) * w;
      const toY = (iy: number) => (0.5 + (iy - cy) / (2 * hy)) * h;
      /** img-fraction of height → view px. */
      const lenY = (iy: number) => (iy * h) / (2 * hy);

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
             *  alpha follows the life bell (born thin, dies thin). */
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
        }
      }
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
