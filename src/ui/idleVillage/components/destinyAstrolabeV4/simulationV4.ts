/**
 * simulationV4.ts — esito pre-rollato e landing point per il modello zone V4.
 * La traiettoria riusa synthesizeTrajectory della V3 (fisica identica).
 */
import {
  astrolabeV3Config,
  type AstrolabeV3Config,
} from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';
import type { GeometrySnapshot } from '../destinyAstrolabeV3/geometry';
import { createRng, samplePointInChallenge, type Point } from '../destinyAstrolabeV3/zones';
import { synthesizeTrajectory, type Trajectory } from '../destinyAstrolabeV3/simulation';
import {
  buildZonesV4,
  classifyV4,
  inAlmostBand,
  inCritBand,
  inDeathStripe,
  inNucleus,
  inStarV4,
  inWoundStripe,
  type ZonesV4,
  type ZoneV4,
} from './zonesV4';

export interface AstrolabeOutcomeV4 {
  roll: number;
  success: boolean;
  /** roll ≤ critSuccessPct → nucleo (trionfo) */
  critSuccess: boolean;
  /** fallimento entro nearMissPct dalla soglia → banda bronzo */
  almost: boolean;
  /** fallimento critico → banda interna al bordo nemico */
  critFail: boolean;
  riskRoll: number;
  wounded: boolean;
  dead: boolean;
}

export function rollOutcomeV4(
  snap: GeometrySnapshot,
  rng: () => number,
  config: AstrolabeV3Config = astrolabeV3Config,
): AstrolabeOutcomeV4 {
  const roll = 1 + Math.floor(rng() * 100);
  const success = roll <= snap.tst;
  const critSuccess = success && roll <= config.critSuccessPct;
  const almost = !success && roll <= snap.tst + config.nearMissPct;
  const critFail = !success && roll > 100 - snap.input.critPct;
  const riskRoll = 1 + Math.floor(rng() * 100);
  /* il trionfo non conosce sangue: rischio solo su esiti non critici */
  const dead = !critSuccess && riskRoll <= snap.input.deathPct;
  const wounded = !critSuccess && !dead && riskRoll <= snap.input.deathPct + snap.input.woundPct;
  return { roll, success, critSuccess, almost, critFail, riskRoll, wounded, dead };
}

/**
 * Landing point coerente con l'esito completo (il punto è la prova, D1/D2).
 * Fallback progressivi: prima la verità primaria (successo/fallimento e zona
 * critica), poi le strisce di rischio se l'intersezione esiste.
 */
export function pickLandingPointV4(
  outcome: AstrolabeOutcomeV4,
  zones: ZonesV4,
  rng: () => number,
): Point {
  const snap = zones.snapshot;
  const primary = (p: Point): boolean => {
    if (outcome.critSuccess) return inNucleus(p, zones);
    if (outcome.success) return classifyV4(p, zones) === 'star';
    if (outcome.almost) return inAlmostBand(p, zones);
    if (outcome.critFail) return inCritBand(p, zones) && !inAlmostBand(p, zones);
    return classifyV4(p, zones) === 'enemy';
  };
  const risk = (p: Point): boolean => {
    if (outcome.dead) return inDeathStripe(p, zones);
    if (outcome.wounded) return inWoundStripe(p, zones);
    return !inDeathStripe(p, zones) && !inWoundStripe(p, zones);
  };

  const candidates: Point[] = [];
  for (let i = 0; i < 14000 && candidates.length < 50; i += 1) {
    const p = samplePointInChallenge(snap, rng);
    if (primary(p) && risk(p)) candidates.push(p);
  }
  if (!candidates.length) {
    /* rilassa il vincolo striscia mantenendo la zona primaria */
    for (let i = 0; i < 14000 && candidates.length < 20; i += 1) {
      const p = samplePointInChallenge(snap, rng);
      if (primary(p)) candidates.push(p);
    }
  }
  if (!candidates.length) {
    /* ultima difesa: mai mentire su successo/fallimento */
    for (let i = 0; i < 14000 && candidates.length < 10; i += 1) {
      const p = samplePointInChallenge(snap, rng);
      if (inStarV4(p, zones) === outcome.success) candidates.push(p);
    }
  }
  if (!candidates.length) return { x: 0, y: 0 };
  return candidates[Math.floor(rng() * candidates.length)];
}

export interface ThrowV4 {
  outcome: AstrolabeOutcomeV4;
  trajectory: Trajectory;
  zone: ZoneV4;
  zones: ZonesV4;
}

export function simulateThrowV4(
  snap: GeometrySnapshot,
  seed: number,
  config: AstrolabeV3Config = astrolabeV3Config,
): ThrowV4 {
  const zones = buildZonesV4(snap, {
    critSuccessPct: config.critSuccessPct,
    nearMissPct: config.nearMissPct,
    critPct: snap.input.critPct,
    woundPct: snap.input.woundPct,
    deathPct: snap.input.deathPct,
    minVisualThickness: config.minVisualThickness,
  });
  const rng = createRng(seed);
  const outcome = rollOutcomeV4(snap, rng, config);
  const landing = pickLandingPointV4(outcome, zones, rng);
  const trajectory = synthesizeTrajectory(landing, snap, seed ^ 0x9e3779b9, config);
  return { outcome, trajectory, zone: classifyV4(landing, zones), zones };
}
