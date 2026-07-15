/**
 * simulation.ts — messa in scena onesta del D100 (piano §2.3, D1).
 *
 * Pipeline per lancio:
 *  1. rollOutcome: D100 + tiri ferita/morte → esito completo pre-calcolato.
 *  2. pickLandingPoint: punto DENTRO l'intersezione di zone coerente con
 *     l'esito (rejection sampling seedato; near-miss → il più vicino possibile
 *     al bordo stella senza attraversarlo).
 *  3. synthesizeTrajectory: fisica in avanti (rimbalzi con normali vere sul
 *     perimetro sfida + attrito) e correzione distribuita su tutta la coda
 *     della traiettoria verso il landing point — mai snap sull'ultimo frame.
 *
 * Tutto in spazio normalizzato (raggio arena = 1, centro 0,0), deterministico
 * a parità di seed.
 */
import {
  astrolabeV3Config,
  type AstrolabeV3Config,
} from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';
import { type GeometrySnapshot, rChallengeAt, rStarAt } from './geometry';
import {
  type Point,
  createRng,
  inCrown,
  inCrit,
  inNearMissBand,
  inStar,
  inVoid,
  samplePointInChallenge,
} from './zones';

export interface AstrolabeOutcome {
  roll: number; // D100
  success: boolean;
  nearMiss: boolean; // fallimento con roll ∈ ]tst, tst+nearMissPct] (D7)
  crit: boolean; // fallimento critico
  riskRoll: number;
  wounded: boolean;
  dead: boolean;
}

export function rollOutcome(
  snap: GeometrySnapshot,
  rng: () => number,
  config: AstrolabeV3Config = astrolabeV3Config,
): AstrolabeOutcome {
  const roll = 1 + Math.floor(rng() * 100);
  const success = roll <= snap.tst;
  const nearMiss = !success && roll <= snap.tst + config.nearMissPct;
  const crit = !success && roll > 100 - snap.input.critPct;
  const riskRoll = 1 + Math.floor(rng() * 100);
  const dead = riskRoll <= snap.input.deathPct;
  const wounded = !dead && riskRoll <= snap.input.deathPct + snap.input.woundPct;
  return { roll, success, nearMiss, crit, riskRoll, wounded, dead };
}

/**
 * Sceglie il punto di atterraggio coerente con l'esito completo.
 * Il punto è SEMPRE la prova visiva dell'esito (D2).
 */
export function pickLandingPoint(
  outcome: AstrolabeOutcome,
  snap: GeometrySnapshot,
  rng: () => number,
): Point {
  const wantStar = outcome.success;
  const predicate = (p: Point): boolean => {
    if (inStar(p, snap) !== wantStar) return false;
    if (outcome.dead && !inVoid(p, snap)) return false;
    if (!outcome.dead && inVoid(p, snap)) return false;
    if (outcome.wounded && !inCrown(p, snap)) return false;
    if (!outcome.wounded && !outcome.dead && inCrown(p, snap)) return false;
    if (!outcome.success) {
      if (outcome.crit !== inCrit(p, snap)) return false;
      if (outcome.nearMiss !== inNearMissBand(p, snap)) return false;
    }
    return true;
  };

  /* raccogli candidati; per near-miss ed esiti puliti si punteggia la distanza
     dal bordo stella (vicino per il dramma, lontano per la chiarezza) */
  const candidates: Point[] = [];
  for (let i = 0; i < 12000 && candidates.length < 60; i += 1) {
    const p = samplePointInChallenge(snap, rng);
    if (predicate(p)) candidates.push(p);
  }
  if (!candidates.length) {
    // fallback progressivo: rilassa i vincoli secondari mantenendo la verità
    // primaria successo/fallimento (mai mentire sull'esito del check)
    for (let i = 0; i < 12000 && candidates.length < 20; i += 1) {
      const p = samplePointInChallenge(snap, rng);
      if (inStar(p, snap) === wantStar) candidates.push(p);
    }
  }
  if (!candidates.length) return { x: 0, y: 0 };

  const edgeDist = (p: Point) =>
    Math.abs(Math.hypot(p.x, p.y) - rStarAt(snap, Math.atan2(p.y, p.x)));

  if (outcome.nearMiss) {
    // il più vicino possibile al bordo senza attraversarlo (già garantito dal predicato)
    return candidates.reduce((best, p) => (edgeDist(p) < edgeDist(best) ? p : best));
  }
  if (outcome.success && !outcome.wounded && !outcome.dead) {
    // esito pulito: lontano dai confini per evitare ambiguità
    return candidates.reduce((best, p) => (edgeDist(p) > edgeDist(best) ? p : best));
  }
  return candidates[Math.floor(rng() * candidates.length)];
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  /** ms dall'inizio dello spin */
  t: number;
}

export interface Trajectory {
  points: TrajectoryPoint[];
  /** indici dei punti in cui la pallina rimbalza sul perimetro (per suono/sparks) */
  bounceIndices: number[];
  durationMs: number;
  landing: Point;
}

/**
 * Sintetizza la traiettoria: fisica in avanti con rimbalzi veri sul perimetro
 * sfida, poi warp distribuito della coda verso il landing point.
 * Anti-smascheramento: velocità/direzione iniziali randomizzate; la correzione
 * cresce con smoothstep dalla metà del percorso, mai sull'ultimo frame.
 */
export function synthesizeTrajectory(
  landing: Point,
  snap: GeometrySnapshot,
  seed: number,
  config: AstrolabeV3Config = astrolabeV3Config,
): Trajectory {
  const rng = createRng(seed);
  const durationMs =
    config.theSpinDurationMin +
    rng() * (config.theSpinDurationMax - config.theSpinDurationMin);
  const dt = 1000 / 120; // campionamento 120Hz
  const steps = Math.round(durationMs / dt);

  // lancio: direzione grossolanamente verso il landing con jitter ampio (caos credibile)
  const baseAngle = Math.atan2(landing.y, landing.x);
  const angle = baseAngle + (rng() * 2 - 1) * Math.PI * 0.85;
  let speed = (2.2 + rng() * 0.8) / 1000; // unità normalizzate per ms
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let x = 0;
  let y = 0;

  const raw: Point[] = [{ x, y }];
  const bounceIndices: number[] = [];
  const targetBounces =
    config.bounceCountMin +
    Math.floor(rng() * (config.bounceCountMax - config.bounceCountMin + 1));
  let bounces = 0;

  for (let i = 1; i <= steps; i += 1) {
    // attrito progressivo: alto all'inizio della "caccia", cresce nel verdetto
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
      // rimbalzo con normale radiale vera + scatter (mai riflessione speculare pulita)
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
      bounceIndices.push(i);
      // dopo i rimbalzi previsti, smorza di più per entrare nella spirale
      if (bounces >= targetBounces) {
        vx *= 0.82;
        vy *= 0.82;
      }
    }
    raw.push({ x, y });
  }

  // correzione distribuita: la coda converge al landing con rampa smoothstep
  // che parte al 45% del percorso (il homing non è mai visibile su un frame solo)
  const endErrX = landing.x - raw[raw.length - 1].x;
  const endErrY = landing.y - raw[raw.length - 1].y;
  const RAMP_START = 0.45;
  const points: TrajectoryPoint[] = raw.map((pt, i) => {
    const u = i / (raw.length - 1);
    const w =
      u <= RAMP_START ? 0 : (() => {
        const f = (u - RAMP_START) / (1 - RAMP_START);
        return f * f * (3 - 2 * f);
      })();
    return { x: pt.x + endErrX * w, y: pt.y + endErrY * w, t: i * dt };
  });
  points[points.length - 1] = { x: landing.x, y: landing.y, t: durationMs };

  return { points, bounceIndices, durationMs, landing };
}

/** Orchestrazione completa di un lancio (usata dall'engine e dai test). */
export function simulateThrow(
  snap: GeometrySnapshot,
  seed: number,
  config: AstrolabeV3Config = astrolabeV3Config,
): { outcome: AstrolabeOutcome; trajectory: Trajectory } {
  const rng = createRng(seed);
  const outcome = rollOutcome(snap, rng, config);
  const landing = pickLandingPoint(outcome, snap, rng);
  const trajectory = synthesizeTrajectory(landing, snap, seed ^ 0x9e3779b9, config);
  return { outcome, trajectory };
}
