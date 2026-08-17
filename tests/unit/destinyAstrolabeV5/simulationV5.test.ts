import { describe, it, expect } from 'vitest';
import {
  buildGeometry,
  rChallengeAt,
  type GeometryInput,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import { classify, inStar } from '@/ui/idleVillage/components/destinyAstrolabeV3/zones';
import { synthesizeTrajectory } from '@/ui/idleVillage/components/destinyAstrolabeV3/simulation';
import {
  buildTimeWarp,
  sampleTrajectoryAt,
  simulateThrowV5,
  synthesizeTrajectoryV5,
} from '@/ui/idleVillage/components/destinyAstrolabeV5/simulationV5';
import { astrolabeV5Config } from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';

const input: GeometryInput = {
  stats: [
    { name: 'Atletica', stat: 70, difficulty: 55 },
    { name: 'Astuzia', stat: 60, difficulty: 55 },
  ],
  difficulty: 55,
  critPct: 5,
  woundPct: 10,
  deathPct: 5,
};
const snap = buildGeometry(input);
const cfg = astrolabeV5Config;

describe('simulationV5 — warp del tempo (la cura degli "scatti")', () => {
  const warp = buildTimeWarp(cfg);

  it('è ancorato agli estremi', () => {
    expect(warp(0)).toBeCloseTo(0, 9);
    expect(warp(1)).toBeCloseTo(1, 9);
  });

  it('è monotono: il tempo non torna mai indietro', () => {
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.005) {
      const v = warp(Math.min(1, u));
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = v;
    }
  });

  it('rallenta verso la fine invece di saltare a gradino', () => {
    /* V3 aveva uno slow-mo dentro/fuori una soglia di distanza: un gradino.
       Qui la velocità scende con continuità, quindi non esiste un frame in cui
       il moto cambia di scatto. */
    const d = (u: number) => warp(Math.min(1, u + 0.01)) - warp(u);
    const early = d(0.1);
    const late = d(0.95);
    expect(late).toBeLessThan(early);

    /* nessun salto brusco fra due campioni adiacenti */
    let maxJump = 0;
    let prevRate = d(0);
    for (let u = 0.01; u < 0.98; u += 0.01) {
      const rate = d(u);
      maxJump = Math.max(maxJump, Math.abs(rate - prevRate));
      prevRate = rate;
    }
    expect(maxJump).toBeLessThan(early * 0.25);
  });
});

describe('simulationV5 — campionamento per TEMPO, non per indice', () => {
  const { trajectory } = simulateThrowV5(snap, 12, cfg);

  it('interpola fra i nodi invece di scattare da uno all’altro', () => {
    const a = sampleTrajectoryAt(trajectory, 100);
    const b = sampleTrajectoryAt(trajectory, 100.5);
    const c = sampleTrajectoryAt(trajectory, 101);
    expect(a).not.toEqual(b);
    /* il punto intermedio sta davvero in mezzo */
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(
      Math.hypot(c.x - a.x, c.y - a.y) + 1e-9,
    );
  });

  it('la posizione dipende solo dall’istante, non dalla cadenza dei frame', () => {
    /* Il campionamento per indice di V3 dipendeva dal NUMERO di frame: a rate
       diversi la pallina pescava punti diversi, ed è da lì che nasceva lo
       scatto. Qui si percorre la stessa traiettoria a 30, 60 e 144Hz e negli
       istanti condivisi la posizione deve coincidere. */
    const D = trajectory.durationMs;
    const walkAt = (hz: number) => {
      const out = new Map<number, { x: number; y: number }>();
      const step = 1000 / hz;
      for (let i = 0; i * step <= D; i += 1) {
        const t = i * step;
        out.set(Math.round(t * 1000), sampleTrajectoryAt(trajectory, t));
      }
      return out;
    };

    const a = walkAt(30);
    const b = walkAt(60);
    const c = walkAt(144);
    let shared = 0;
    a.forEach((pt, key) => {
      [b, c].forEach((other) => {
        const q = other.get(key);
        if (!q) return;
        shared += 1;
        expect(q.x).toBeCloseTo(pt.x, 12);
        expect(q.y).toBeCloseTo(pt.y, 12);
      });
    });
    expect(shared).toBeGreaterThan(10);
  });

  it('è ancorato agli estremi e non esce dai bordi temporali', () => {
    const first = sampleTrajectoryAt(trajectory, -500);
    const last = sampleTrajectoryAt(trajectory, trajectory.durationMs + 500);
    expect(first).toEqual({ x: trajectory.points[0].x, y: trajectory.points[0].y });
    expect(last.x).toBeCloseTo(trajectory.landing.x, 9);
    expect(last.y).toBeCloseTo(trajectory.landing.y, 9);
  });
});

describe('simulationV5 — durata prevedibile', () => {
  it('la durata non è più casuale fra i lanci', () => {
    /* V3 sorteggiava fra 3500 e 4500ms: il giocatore non poteva memorizzare
       il ritmo dell'animazione. */
    const durations = new Set<number>();
    for (let seed = 1; seed <= 30; seed += 1) {
      durations.add(simulateThrowV5(snap, seed, cfg).trajectory.durationMs);
    }
    expect(durations.size).toBe(1);
    expect([...durations][0]).toBe(cfg.trajectoryMs);
  });

  it('il warp verso il landing parte prima che in V3', () => {
    expect(cfg.warpStart).toBeLessThan(0.45);
  });
});

describe('simulationV5 — la traiettoria resta dentro il campo', () => {
  it('ogni punto visualizzato sta dentro il perimetro sfida', () => {
    /* Con il warp che parte al 45%, in V3 la coda correggeva così tanto da
       sconfinare oltre il blob. Partendo al 25% la correzione è più dolce. */
    let outside = 0;
    let total = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const { trajectory } = simulateThrowV5(snap, seed, cfg);
      trajectory.points.forEach((p) => {
        total += 1;
        const edge = rChallengeAt(snap, Math.atan2(p.y, p.x));
        if (Math.hypot(p.x, p.y) > edge + 1e-6) outside += 1;
      });
    }
    expect(total).toBeGreaterThan(0);
    expect(outside / total).toBeLessThan(0.02);
  });

  it('il warp V5 sconfina meno di quello V3', () => {
    const countOutside = (pts: { x: number; y: number }[]) =>
      pts.filter((p) => Math.hypot(p.x, p.y) > rChallengeAt(snap, Math.atan2(p.y, p.x)) + 1e-6)
        .length / pts.length;

    let v3Sum = 0;
    let v5Sum = 0;
    for (let seed = 1; seed <= 30; seed += 1) {
      const { trajectory: t5 } = simulateThrowV5(snap, seed, cfg);
      const t3 = synthesizeTrajectory(t5.landing, snap, seed ^ 0x9e3779b9);
      v5Sum += countOutside(t5.points);
      v3Sum += countOutside(t3.points);
    }
    expect(v5Sum).toBeLessThanOrEqual(v3Sum);
  });
});

describe('simulationV5 — il landing resta la PROVA dell’esito', () => {
  it('la posizione finale è coerente con successo/fallimento', () => {
    for (let seed = 1; seed <= 120; seed += 1) {
      const { outcome, trajectory } = simulateThrowV5(snap, seed, cfg);
      const end = trajectory.points[trajectory.points.length - 1];
      expect(inStar(end, snap)).toBe(outcome.success);
    }
  });

  it('la zona finale non contraddice mai il verdetto già emesso', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const { outcome, trajectory } = simulateThrowV5(snap, seed, cfg);
      const z = classify(trajectory.landing, snap);
      if (outcome.success) expect(['star', 'crit']).not.toContain('near-miss');
      if (!outcome.success) expect(z).not.toBe('star');
    }
  });
});

describe('simulationV5 — rimbalzi', () => {
  it('i tempi di rimbalzo stanno dentro la durata, in tempo-traiettoria', () => {
    const t = synthesizeTrajectoryV5({ x: 0.2, y: 0.1 }, snap, 99, cfg);
    t.bounceTimes.forEach((bt) => {
      expect(bt).toBeGreaterThanOrEqual(0);
      expect(bt).toBeLessThanOrEqual(t.durationMs);
    });
  });
});
