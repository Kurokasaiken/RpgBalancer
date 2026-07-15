import { describe, it, expect } from 'vitest';
import {
  buildGeometry,
  type GeometryInput,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import {
  classify,
  createRng,
  inChallenge,
  inCrown,
  inNearMissBand,
  inStar,
  inVoid,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/zones';
import {
  pickLandingPoint,
  rollOutcome,
  simulateThrow,
  synthesizeTrajectory,
  type AstrolabeOutcome,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/simulation';

const input: GeometryInput = {
  stats: [
    { name: 'Atletica', stat: 80, difficulty: 50 },
    { name: 'Astuzia', stat: 65, difficulty: 50 },
    { name: 'Vigore', stat: 50, difficulty: 50 },
  ],
  difficulty: 50,
  critPct: 5,
  woundPct: 10,
  deathPct: 5,
};
const snap = buildGeometry(input);

const outcomeOf = (over: Partial<AstrolabeOutcome>): AstrolabeOutcome => ({
  roll: 40,
  success: true,
  nearMiss: false,
  crit: false,
  riskRoll: 99,
  wounded: false,
  dead: false,
  ...over,
});

describe('pickLandingPoint — il punto è la prova visiva dell’esito (D1/D2)', () => {
  it('successo pulito → dentro la stella, lontano dai confini', () => {
    const p = pickLandingPoint(outcomeOf({}), snap, createRng(1));
    expect(inStar(p, snap)).toBe(true);
    expect(inCrown(p, snap)).toBe(false);
    expect(inVoid(p, snap)).toBe(false);
  });

  it('successo + ferito → stella ∩ corona (acceptance F3)', () => {
    const p = pickLandingPoint(outcomeOf({ wounded: true }), snap, createRng(2));
    expect(inStar(p, snap)).toBe(true);
    expect(inCrown(p, snap)).toBe(true);
  });

  it('near-miss (roll soglia+2) → nearMissBand esterna alla stella', () => {
    const p = pickLandingPoint(
      outcomeOf({ roll: snap.tst + 2, success: false, nearMiss: true }),
      snap,
      createRng(3),
    );
    expect(inStar(p, snap)).toBe(false);
    expect(inNearMissBand(p, snap)).toBe(true);
  });

  it('morte → dentro una voragine', () => {
    const p = pickLandingPoint(
      outcomeOf({ success: false, dead: true, riskRoll: 1 }),
      snap,
      createRng(4),
    );
    expect(inVoid(p, snap)).toBe(true);
  });

  it('fallimento critico → banda rovina al bordo sfida', () => {
    const p = pickLandingPoint(
      outcomeOf({ roll: 99, success: false, crit: true }),
      snap,
      createRng(5),
    );
    expect(classify(p, snap)).toBe('crit');
  });
});

describe('rollOutcome — near-miss = banda naturale 5% (D7)', () => {
  it('near-miss solo per roll ∈ ]tst, tst+5], frequenza ≈5% ±1.5%', () => {
    const nearMissRolls: number[] = [];
    for (let seed = 0; seed < 4000; seed += 1) {
      const o = rollOutcome(snap, createRng(seed));
      if (o.nearMiss) nearMissRolls.push(o.roll);
    }
    nearMissRolls.forEach((r) => {
      expect(r).toBeGreaterThan(snap.tst);
      expect(r).toBeLessThanOrEqual(snap.tst + 5);
    });
    const rate = (nearMissRolls.length / 4000) * 100;
    expect(rate).toBeGreaterThan(5 - 1.5);
    expect(rate).toBeLessThan(5 + 1.5);
  });
});

describe('synthesizeTrajectory — messa in scena onesta', () => {
  const landing = pickLandingPoint(outcomeOf({}), snap, createRng(10));

  it('termina ESATTAMENTE sul landing point, sempre dentro la sfida', () => {
    const tr = synthesizeTrajectory(landing, snap, 123);
    const last = tr.points[tr.points.length - 1];
    expect(last.x).toBe(landing.x);
    expect(last.y).toBe(landing.y);
    tr.points.forEach((p) => expect(inChallenge({ x: p.x, y: p.y }, snap)).toBe(true));
  });

  it('durata nel range config (3.5–4.5s)', () => {
    const tr = synthesizeTrajectory(landing, snap, 123);
    expect(tr.durationMs).toBeGreaterThanOrEqual(3500);
    expect(tr.durationMs).toBeLessThanOrEqual(4500);
  });

  it('rimbalza sul perimetro (almeno bounceCountMin)', () => {
    const tr = synthesizeTrajectory(landing, snap, 123);
    expect(tr.bounceIndices.length).toBeGreaterThanOrEqual(2);
  });

  it('deterministico a parità di seed, mai identico con seed diversi', () => {
    const a = synthesizeTrajectory(landing, snap, 42);
    const b = synthesizeTrajectory(landing, snap, 42);
    const c = synthesizeTrajectory(landing, snap, 43);
    expect(a.points).toEqual(b.points);
    const differs = a.points.some((p, i) => p.x !== c.points[i]?.x || p.y !== c.points[i]?.y);
    expect(differs).toBe(true);
  });

  it('nessuna correzione visibile sull’ultimo frame (homing distribuito)', () => {
    const tr = synthesizeTrajectory(landing, snap, 7);
    const n = tr.points.length;
    const lastStep = Math.hypot(
      tr.points[n - 1].x - tr.points[n - 2].x,
      tr.points[n - 1].y - tr.points[n - 2].y,
    );
    const prevStep = Math.hypot(
      tr.points[n - 2].x - tr.points[n - 3].x,
      tr.points[n - 2].y - tr.points[n - 3].y,
    );
    expect(lastStep).toBeLessThan(Math.max(0.02, prevStep * 6 + 0.01));
  });
});

describe('simulateThrow — end to end', () => {
  it('la zona di atterraggio prova sempre l’esito', () => {
    for (let seed = 1; seed <= 120; seed += 1) {
      const { outcome, trajectory } = simulateThrow(snap, seed);
      const landed = trajectory.landing;
      expect(inStar(landed, snap)).toBe(outcome.success);
      if (outcome.dead) expect(inVoid(landed, snap)).toBe(true);
      if (outcome.wounded) expect(inCrown(landed, snap)).toBe(true);
      if (!outcome.success && outcome.nearMiss) expect(inNearMissBand(landed, snap)).toBe(true);
    }
  });

  it('spin mai identico con seed diversi (acceptance F3)', () => {
    const a = simulateThrow(snap, 1).trajectory.points;
    const b = simulateThrow(snap, 2).trajectory.points;
    expect(a).not.toEqual(b);
  });
});
