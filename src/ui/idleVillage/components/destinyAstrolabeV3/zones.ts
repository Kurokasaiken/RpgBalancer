/**
 * zones.ts — classificazione punto→zona e audit aree (piano §2.2).
 * Pure functions: usate dalla simulazione (scelta landing point), dalla
 * resolution (zona da illuminare) e dai test Monte Carlo.
 */
import {
  type GeometrySnapshot,
  rChallengeAt,
  rStarAt,
  nearMissThicknessAt,
} from './geometry';

export type Zone = 'star' | 'near-miss' | 'crown' | 'void' | 'ruin' | 'crit';

export interface Point {
  x: number;
  y: number;
}

const dist = (p: Point) => Math.hypot(p.x, p.y);
const angOf = (p: Point) => Math.atan2(p.y, p.x);

/* Predicati indipendenti — un punto può appartenere a più zone (D2:
   le zone si intersecano; l'atterraggio prova l'esito completo). */
export const inChallenge = (p: Point, s: GeometrySnapshot): boolean =>
  dist(p) <= rChallengeAt(s, angOf(p));

export const inStar = (p: Point, s: GeometrySnapshot): boolean =>
  dist(p) <= rStarAt(s, angOf(p));

/** Corona ferita: banda centrata sul perimetro stella. */
export const inCrown = (p: Point, s: GeometrySnapshot): boolean => {
  const half = s.woundThickness / 2;
  return Math.abs(dist(p) - rStarAt(s, angOf(p))) <= half;
};

/** Voragini morte: dischi nelle valli, a cavallo del bordo stella. */
export const inVoid = (p: Point, s: GeometrySnapshot): boolean =>
  s.voidRadius > 0 &&
  s.voidCenters.some((c) => Math.hypot(p.x - c.x, p.y - c.y) <= s.voidRadius);

/** Banda rovina critica: anello interno al bordo sfida. */
export const inCrit = (p: Point, s: GeometrySnapshot): boolean => {
  const edge = rChallengeAt(s, angOf(p));
  const d = dist(p);
  return d <= edge && d > edge - s.critThickness;
};

/** Near-miss: fuori dalla stella ma entro la banda del 5% (D7). */
export const inNearMissBand = (p: Point, s: GeometrySnapshot): boolean => {
  const a = angOf(p);
  const rs = rStarAt(s, a);
  const d = dist(p);
  return d > rs && d <= rs + nearMissThicknessAt(s, a);
};

/**
 * Classificazione esclusiva (per display/audit). Priorità:
 * void > crit > crown > star > near-miss > ruin.
 */
export function classify(p: Point, s: GeometrySnapshot): Zone {
  if (inVoid(p, s)) return 'void';
  if (inCrit(p, s)) return 'crit';
  if (inCrown(p, s)) return 'crown';
  if (inStar(p, s)) return 'star';
  if (inNearMissBand(p, s)) return 'near-miss';
  return 'ruin';
}

/** RNG deterministico (mulberry32) — condiviso con simulation. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Punto uniforme dentro la sfida (rejection sampling). */
export function samplePointInChallenge(
  s: GeometrySnapshot,
  rng: () => number,
): Point {
  for (let i = 0; i < 10000; i += 1) {
    const p = { x: rng() * 2 - 1, y: rng() * 2 - 1 };
    if (dist(p) <= 1 && inChallenge(p, s)) return p;
  }
  return { x: 0, y: 0 };
}

/**
 * Campionamento Monte Carlo: frazione dell'area sfida per zona.
 * Usato in dev/test per verificare area visiva ≈ probabilità dichiarata.
 */
export function zoneAreas(
  s: GeometrySnapshot,
  sampleCount = 20000,
  seed = 42,
): Record<Zone, number> {
  const rng = createRng(seed);
  const counts: Record<Zone, number> = {
    star: 0,
    'near-miss': 0,
    crown: 0,
    void: 0,
    ruin: 0,
    crit: 0,
  };
  for (let i = 0; i < sampleCount; i += 1) {
    counts[classify(samplePointInChallenge(s, rng), s)] += 1;
  }
  (Object.keys(counts) as Zone[]).forEach((z) => {
    counts[z] /= sampleCount;
  });
  return counts;
}
