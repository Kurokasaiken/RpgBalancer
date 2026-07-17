/**
 * zonesV4.ts — modello zone della V4 (pure functions).
 *
 * Semantica (dalla review estetica):
 *  - NUCLEO centrale        → successo critico, area ∝ critSuccessPct
 *  - STELLA (interno)       → successo
 *  - BORDO STELLA (bronzo)  → near-miss/"Almost": banda ESTERNA alla stella,
 *                             spessore calibrato su nearMissPct
 *  - NEMICO (superficie)    → fallimento
 *  - BORDO NEMICO           → fallimento critico: banda che si allarga verso
 *                             L'INTERNO della forma del nemico, ∝ critPct
 *  - STRISCE diagonali α30% → ferita (cremisi) e morte (nera): parallele,
 *                             lontane dal centro e tra loro, ∝ woundPct/deathPct
 *
 * TUTTE le % sono calibrate sull'AREA DEL NEMICO (challenge − stella) per
 * bisezione numerica deterministica: proporzioni oneste, mai stime.
 */
import {
  type GeometrySnapshot,
  rChallengeAt,
  rStarAt,
} from '../destinyAstrolabeV3/geometry';
import type { Point } from '../destinyAstrolabeV3/zones';

export type ZoneV4 = 'nucleus' | 'star' | 'almost' | 'enemy' | 'crit';

export interface StripeSpec {
  /** normale unitaria della striscia (direzione ⟂ alla striscia) */
  nx: number;
  ny: number;
  /** distanza dal centro lungo la normale */
  offset: number;
  /** semi-spessore */
  halfWidth: number;
}

export interface ZonesV4 {
  snapshot: GeometrySnapshot;
  /** area del nemico (challenge − stella), unità normalizzate² */
  enemyArea: number;
  /** raggio del nucleo di successo critico */
  nucleusRadius: number;
  /** spessore banda near-miss (bronzo, esterna alla stella) */
  almostThickness: number;
  /** spessore banda fallimento critico (interna al bordo nemico) */
  critThickness: number;
  woundStripe: StripeSpec;
  deathStripe: StripeSpec;
}

const dist = (p: Point) => Math.hypot(p.x, p.y);
const angOf = (p: Point) => Math.atan2(p.y, p.x);

/* ── predicati base ── */
export const inChallengeV4 = (p: Point, z: ZonesV4): boolean =>
  dist(p) <= rChallengeAt(z.snapshot, angOf(p));

export const inStarV4 = (p: Point, z: ZonesV4): boolean =>
  dist(p) <= rStarAt(z.snapshot, angOf(p));

export const inNucleus = (p: Point, z: ZonesV4): boolean => dist(p) <= z.nucleusRadius;

/** Banda "Almost" (bronzo): fuori dalla stella, entro almostThickness. */
export const inAlmostBand = (p: Point, z: ZonesV4): boolean => {
  const rs = rStarAt(z.snapshot, angOf(p));
  const d = dist(p);
  return d > rs && d <= rs + z.almostThickness;
};

/** Banda crit (bordo nemico, verso l'interno). */
export const inCritBand = (p: Point, z: ZonesV4): boolean => {
  const edge = rChallengeAt(z.snapshot, angOf(p));
  const d = dist(p);
  return d <= edge && d > edge - z.critThickness;
};

const inStripe = (p: Point, s: StripeSpec): boolean =>
  Math.abs(p.x * s.nx + p.y * s.ny - s.offset) <= s.halfWidth;

export const inWoundStripe = (p: Point, z: ZonesV4): boolean =>
  z.woundStripe.halfWidth > 0 && inStripe(p, z.woundStripe) && inChallengeV4(p, z);

export const inDeathStripe = (p: Point, z: ZonesV4): boolean =>
  z.deathStripe.halfWidth > 0 && inStripe(p, z.deathStripe) && inChallengeV4(p, z);

/** Zona primaria esclusiva. Priorità: nucleus > almost > crit > star > enemy. */
export function classifyV4(p: Point, z: ZonesV4): ZoneV4 {
  if (inNucleus(p, z)) return 'nucleus';
  if (inAlmostBand(p, z)) return 'almost';
  if (inCritBand(p, z)) return 'crit';
  if (inStarV4(p, z)) return 'star';
  return 'enemy';
}

/* ── misura aree per bisezione (griglia deterministica) ── */
const GRID = 160;

function regionArea(z: GeometrySnapshot, predicate: (p: Point) => boolean): number {
  const cell = 2 / GRID;
  let count = 0;
  for (let i = 0; i < GRID; i += 1) {
    for (let j = 0; j < GRID; j += 1) {
      const p = { x: -1 + (i + 0.5) * cell, y: -1 + (j + 0.5) * cell };
      if (dist(p) <= 1 && dist(p) <= rChallengeAt(z, angOf(p)) && predicate(p)) count += 1;
    }
  }
  return count * cell * cell;
}

function calibrate(
  targetArea: number,
  areaFor: (w: number) => number,
  hi: number,
  minValue: number,
): number {
  if (targetArea <= 0) return 0;
  let lo = 0;
  let h = hi;
  for (let it = 0; it < 20; it += 1) {
    const mid = (lo + h) / 2;
    if (areaFor(mid) < targetArea) lo = mid;
    else h = mid;
  }
  return Math.max(minValue, (lo + h) / 2);
}

export interface ZonesV4Input {
  critSuccessPct: number;
  nearMissPct: number;
  critPct: number;
  woundPct: number;
  deathPct: number;
  minVisualThickness: number;
}

/** Angolo diagonale delle strisce (45°). */
const STRIPE_ANGLE = Math.PI / 4;
/** Offset dal centro: non centrali, non vicine (lati opposti). */
const STRIPE_OFFSET = 0.48;

export function buildZonesV4(snapshot: GeometrySnapshot, input: ZonesV4Input): ZonesV4 {
  const starArea = regionArea(snapshot, (p) => dist(p) <= rStarAt(snapshot, angOf(p)));
  const challengeArea = regionArea(snapshot, () => true);
  const enemyArea = Math.max(1e-6, challengeArea - starArea);

  const z: ZonesV4 = {
    snapshot,
    enemyArea,
    nucleusRadius: 0,
    almostThickness: 0,
    critThickness: 0,
    woundStripe: { nx: Math.cos(STRIPE_ANGLE), ny: Math.sin(STRIPE_ANGLE), offset: STRIPE_OFFSET, halfWidth: 0 },
    deathStripe: { nx: Math.cos(STRIPE_ANGLE), ny: Math.sin(STRIPE_ANGLE), offset: -STRIPE_OFFSET, halfWidth: 0 },
  };

  /* nucleo: disco pieno, area = critSuccessPct% × enemyArea (mai oltre metà stella) */
  const nucleusTarget = (input.critSuccessPct / 100) * enemyArea;
  const maxNucleus = Math.min(...snapshot.axisTip) * 0.55;
  z.nucleusRadius = Math.min(maxNucleus, Math.sqrt(nucleusTarget / Math.PI));
  if (input.critSuccessPct > 0) z.nucleusRadius = Math.max(z.nucleusRadius, input.minVisualThickness * 2);

  /* banda bronzo (almost): esterna alla stella, area = nearMissPct% × enemyArea */
  z.almostThickness = calibrate(
    (input.nearMissPct / 100) * enemyArea,
    (w) =>
      regionArea(snapshot, (p) => {
        const rs = rStarAt(snapshot, angOf(p));
        const d = dist(p);
        return d > rs && d <= rs + w;
      }),
    0.5,
    input.nearMissPct > 0 ? input.minVisualThickness : 0,
  );

  /* banda crit: interna al bordo nemico, area = critPct% × enemyArea */
  z.critThickness = calibrate(
    (input.critPct / 100) * enemyArea,
    (w) =>
      regionArea(snapshot, (p) => {
        const edge = rChallengeAt(snapshot, angOf(p));
        const d = dist(p);
        return d > edge - w;
      }),
    0.5,
    input.critPct > 0 ? input.minVisualThickness : 0,
  );

  /* strisce diagonali: larghezza t.c. area(striscia ∩ challenge) = pct% × enemyArea */
  const stripeArea = (spec: StripeSpec) => (w: number) =>
    regionArea(snapshot, (p) => Math.abs(p.x * spec.nx + p.y * spec.ny - spec.offset) <= w);
  z.woundStripe.halfWidth = calibrate(
    (input.woundPct / 100) * enemyArea,
    stripeArea(z.woundStripe),
    0.6,
    input.woundPct > 0 ? input.minVisualThickness / 2 : 0,
  );
  z.deathStripe.halfWidth = calibrate(
    (input.deathPct / 100) * enemyArea,
    stripeArea(z.deathStripe),
    0.6,
    input.deathPct > 0 ? input.minVisualThickness / 2 : 0,
  );

  return z;
}

/** Frazioni d'area per audit/test (deterministico, stessa griglia). */
export function zoneAreasV4(z: ZonesV4): Record<ZoneV4 | 'wound' | 'death', number> {
  const s = z.snapshot;
  const total = regionArea(s, () => true);
  const frac = (pred: (p: Point) => boolean) => regionArea(s, pred) / total;
  return {
    nucleus: frac((p) => inNucleus(p, z)),
    star: frac((p) => classifyV4(p, z) === 'star'),
    almost: frac((p) => inAlmostBand(p, z)),
    enemy: frac((p) => classifyV4(p, z) === 'enemy'),
    crit: frac((p) => inCritBand(p, z) && !inAlmostBand(p, z) && !inNucleus(p, z)),
    wound: frac((p) => inWoundStripe(p, z)),
    death: frac((p) => inDeathStripe(p, z)),
  };
}
