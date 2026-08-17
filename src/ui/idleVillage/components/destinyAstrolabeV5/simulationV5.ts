/**
 * simulationV5.ts — messa in scena del D100, versione a tempo continuo.
 *
 * DETERMINISMO — vincolo duro. `rollOutcome` e `pickLandingPoint` sono
 * IMPORTATI da V3, non ricopiati: la sequenza esatta delle chiamate rng()
 * (roll → riskRoll → campionamento del landing) deve restare byte per byte
 * quella di V3. Inserire, togliere o riordinare una sola rng() prima di
 * riskRoll cambierebbe tutti gli esiti a parità di seed e invaliderebbe i test
 * deterministici esistenti. Importare invece di copiare rende la garanzia
 * strutturale invece che documentale.
 *
 * COSA CAMBIA rispetto a V3 — la causa vera del "sembra andare a scatti":
 *
 *  1. V3 campionava la traiettoria PER INDICE (`idx = floor(u * N)`). Con lo
 *     slow-mo che cambia il rate, l'indice salta: due frame consecutivi possono
 *     pescare lo stesso punto o saltarne tre. Qui la traiettoria porta un tempo
 *     proprio e si campiona PER TEMPO, con bisezione e interpolazione lineare.
 *     Il movimento diventa indipendente dal frame rate.
 *
 *  2. V3 aveva uno slow-mo a GRADINO (dentro/fuori una soglia di distanza).
 *     Qui è una rampa continua C1: si integra un profilo di velocità che
 *     decresce dolcemente, quindi non esiste un frame in cui la velocità salta.
 *
 *  3. V3 iniziava il warp verso il landing al 45% e la durata era casuale
 *     (3500-4500ms) più ~1340ms di slow-mo. Qui il warp parte al 25% — più
 *     presto, quindi più graduale — e la durata è una manopola sola.
 */
import { type GeometrySnapshot, rChallengeAt } from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import { type Point, createRng } from '@/ui/idleVillage/components/destinyAstrolabeV3/zones';
import {
  type AstrolabeOutcome,
  pickLandingPoint,
  rollOutcome,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/simulation';
import type { AstrolabeV5Config } from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';

/* Riesportati verbatim: sono il contratto di determinismo. */
export { rollOutcome, pickLandingPoint };
export type { AstrolabeOutcome };

export interface TrajectoryPointV5 {
  x: number;
  y: number;
  /** ms di TEMPO-TRAIETTORIA (non di orologio) dall'inizio dello spin. */
  t: number;
}

export interface TrajectoryV5 {
  points: TrajectoryPointV5[];
  /** Istanti (in tempo-traiettoria) dei rimbalzi, per suono e scintille. */
  bounceTimes: number[];
  /** Durata del tempo-traiettoria. */
  durationMs: number;
  landing: Point;
}

const smoothstep = (f: number) => f * f * (3 - 2 * f);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Traiettoria: fisica in avanti con rimbalzi veri sul perimetro sfida, poi
 * warp distribuito della coda verso il landing.
 *
 * Il warp parte a `warpStart` e si distribuisce su `warpSpan` con smoothstep:
 * non esiste un frame in cui la pallina "salta" verso il bersaglio.
 */
export function synthesizeTrajectoryV5(
  landing: Point,
  snap: GeometrySnapshot,
  seed: number,
  cfg: AstrolabeV5Config,
): TrajectoryV5 {
  const rng = createRng(seed);
  const durationMs = cfg.trajectoryMs;
  const dt = 1000 / cfg.physicsSampleHz;
  const steps = Math.max(2, Math.round(durationMs / dt));

  const baseAngle = Math.atan2(landing.y, landing.x);
  const angle = baseAngle + (rng() * 2 - 1) * Math.PI * 0.85;
  const speed = (2.2 + rng() * 0.8) / 1000;
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let x = 0;
  let y = 0;

  const raw: Point[] = [{ x, y }];
  const bounceSteps: number[] = [];
  const targetBounces =
    cfg.bounceCountMin + Math.floor(rng() * (cfg.bounceCountMax - cfg.bounceCountMin + 1));
  let bounces = 0;

  for (let i = 1; i <= steps; i += 1) {
    const p = i / steps;
    const friction = 1 - (0.0018 + 0.004 * p) * dt * 0.1;
    vx *= friction;
    vy *= friction;
    x += vx * dt;
    y += vy * dt;

    const d = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const edge = rChallengeAt(snap, a) - 0.02;
    if (d > edge) {
      const nx = x / d;
      const ny = y / d;
      const dot = vx * nx + vy * ny;
      vx -= 2 * dot * nx;
      vy -= 2 * dot * ny;
      const scatter = (rng() * 2 - 1) * 0.4 * (1 - p);
      const cs = Math.cos(scatter);
      const sn = Math.sin(scatter);
      const rvx = vx * cs - vy * sn;
      const rvy = vx * sn + vy * cs;
      vx = rvx * (0.88 + rng() * 0.08);
      vy = rvy * (0.88 + rng() * 0.08);
      x = nx * edge;
      y = ny * edge;
      bounces += 1;
      bounceSteps.push(i);
      if (bounces >= targetBounces) {
        vx *= 0.82;
        vy *= 0.82;
      }
    }
    raw.push({ x, y });
  }

  const last = raw[raw.length - 1];
  const errX = landing.x - last.x;
  const errY = landing.y - last.y;
  const wStart = cfg.warpStart;
  const wEnd = Math.min(1, cfg.warpStart + cfg.warpSpan);

  const points: TrajectoryPointV5[] = raw.map((pt, i) => {
    const u = i / (raw.length - 1);
    let w = 0;
    if (u > wStart) w = smoothstep(clamp01((u - wStart) / Math.max(1e-6, wEnd - wStart)));
    return { x: pt.x + errX * w, y: pt.y + errY * w, t: i * dt };
  });
  points[points.length - 1] = { x: landing.x, y: landing.y, t: durationMs };

  return {
    points,
    bounceTimes: bounceSteps.map((i) => i * dt),
    durationMs,
    landing,
  };
}

/**
 * Campiona la traiettoria a un istante di tempo-traiettoria.
 *
 * Bisezione + interpolazione lineare. È il rimpiazzo del campionamento per
 * indice di V3: il risultato non dipende più dal frame rate né dal numero di
 * punti, quindi il moto è liscio a 60 come a 120Hz.
 */
export function sampleTrajectoryAt(traj: TrajectoryV5, tMs: number): Point {
  const pts = traj.points;
  if (!pts.length) return { x: 0, y: 0 };
  if (tMs <= pts[0].t) return { x: pts[0].x, y: pts[0].y };
  const lastPt = pts[pts.length - 1];
  if (tMs >= lastPt.t) return { x: lastPt.x, y: lastPt.y };

  let lo = 0;
  let hi = pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].t <= tMs) lo = mid;
    else hi = mid;
  }
  const a = pts[lo];
  const b = pts[hi];
  const span = Math.max(1e-6, b.t - a.t);
  const f = (tMs - a.t) / span;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/**
 * Warp del tempo: orologio → tempo-traiettoria.
 *
 * Si integra un profilo di velocità che scende dolcemente da 1 a `slowMoScale`
 * sulla rampa finale, poi si normalizza. Il risultato è monotono e C1: non
 * esiste un frame in cui la velocità salta, che è esattamente ciò che in V3
 * produceva lo scatto.
 *
 * Ritorna una funzione u∈[0,1] (frazione di orologio) → v∈[0,1] (frazione di
 * tempo-traiettoria), con v(0)=0 e v(1)=1 garantiti.
 */
export function buildTimeWarp(cfg: AstrolabeV5Config, samples = 256): (u: number) => number {
  const a = cfg.slowMoRampStart;
  const span = Math.max(1e-6, cfg.slowMoRampSpan);
  const floorRate = cfg.slowMoScale;

  const rateAt = (u: number): number => {
    if (u <= a) return 1;
    const f = clamp01((u - a) / span);
    return 1 - (1 - floorRate) * smoothstep(f);
  };

  /* tabella cumulativa: costruita una volta, poi solo lookup + lerp */
  const cum = new Float64Array(samples + 1);
  let acc = 0;
  for (let i = 1; i <= samples; i += 1) {
    const u0 = (i - 1) / samples;
    const u1 = i / samples;
    acc += ((rateAt(u0) + rateAt(u1)) / 2) * (u1 - u0);
    cum[i] = acc;
  }
  const total = acc || 1;
  for (let i = 0; i <= samples; i += 1) cum[i] /= total;

  return (u: number): number => {
    const t = clamp01(u);
    const idx = t * samples;
    const i0 = Math.floor(idx);
    if (i0 >= samples) return 1;
    const f = idx - i0;
    return cum[i0] + (cum[i0 + 1] - cum[i0]) * f;
  };
}

/**
 * Orchestrazione completa di un lancio.
 *
 * L'ordine delle chiamate rng() è identico a V3: `rollOutcome` consuma roll e
 * riskRoll, poi `pickLandingPoint` consuma i campionamenti. La traiettoria usa
 * uno stream separato (seed ^ 0x9e3779b9), come in V3.
 */
export function simulateThrowV5(
  snap: GeometrySnapshot,
  seed: number,
  cfg: AstrolabeV5Config,
): { outcome: AstrolabeOutcome; trajectory: TrajectoryV5 } {
  const rng = createRng(seed);
  const outcome = rollOutcome(snap, rng, cfg);
  const landing = pickLandingPoint(outcome, snap, rng);
  const trajectory = synthesizeTrajectoryV5(landing, snap, seed ^ 0x9e3779b9, cfg);
  return { outcome, trajectory };
}
