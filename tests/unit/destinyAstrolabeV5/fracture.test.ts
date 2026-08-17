import { describe, it, expect } from 'vitest';
import {
  buildGeometry,
  rChallengeAt,
  type GeometryInput,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import { inVoid } from '@/ui/idleVillage/components/destinyAstrolabeV3/zones';
import { simulateThrow } from '@/ui/idleVillage/components/destinyAstrolabeV3/simulation';
import type { AstrolabeOutcome } from '@/ui/idleVillage/components/destinyAstrolabeV3/simulation';
import { simulateThrowV5 } from '@/ui/idleVillage/components/destinyAstrolabeV5/simulationV5';
import {
  buildFracture,
  pickEpicenter,
  ribbonPolygon,
  shakeOffset,
} from '@/ui/idleVillage/components/destinyAstrolabeV5/fracture';
import { astrolabeV5Config } from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';

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
const cfg = astrolabeV5Config;

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

describe('fracture — non-interferenza RNG (invariante duro)', () => {
  it('V5 produce esito e landing IDENTICI a V3 per lo stesso seed', () => {
    /* Se questo test fallisce, la frattura (o qualunque altra aggiunta) ha
       consumato dallo stream che produce roll/riskRoll/landing, e tutti gli
       esiti a parità di seed sono cambiati. */
    for (let seed = 1; seed <= 200; seed += 1) {
      const v3 = simulateThrow(snap, seed);
      const v5 = simulateThrowV5(snap, seed, cfg);
      expect(v5.outcome).toEqual(v3.outcome);
      expect(v5.trajectory.landing).toEqual(v3.trajectory.landing);
    }
  });

  it('costruire la frattura non altera esiti successivi', () => {
    const before = simulateThrowV5(snap, 77, cfg);
    buildFracture(snap, outcomeOf({ dead: true, success: false }), before.trajectory.landing, 77, cfg);
    const after = simulateThrowV5(snap, 77, cfg);
    expect(after.outcome).toEqual(before.outcome);
    expect(after.trajectory.landing).toEqual(before.trajectory.landing);
  });
});

describe('fracture — determinismo', () => {
  it('stesso seed → frattura identica; seed diversi → fratture diverse', () => {
    const o = outcomeOf({ dead: true, success: false });
    const landing = { x: 0.1, y: 0.1 };
    const a = buildFracture(snap, o, landing, 42, cfg);
    const b = buildFracture(snap, o, landing, 42, cfg);
    expect(b).toEqual(a);

    const c = buildFracture(snap, o, landing, 43, cfg);
    const key = (m: typeof a) => JSON.stringify(m.branches.map((br) => br.nodes.length));
    expect(key(c)).not.toEqual(key(a));
  });
});

describe('fracture — antitesi ferita/morte', () => {
  it('nessuna frattura senza rischio', () => {
    const m = buildFracture(snap, outcomeOf({}), { x: 0, y: 0 }, 5, cfg);
    expect(m.kind).toBe('none');
    expect(m.branches).toHaveLength(0);
    expect(m.shakeAmp).toBe(0);
  });

  it('la morte scuote più della ferita e apre di più', () => {
    const landing = { x: 0.05, y: 0.05 };
    const w = buildFracture(snap, outcomeOf({ wounded: true, success: false }), landing, 9, cfg);
    const d = buildFracture(snap, outcomeOf({ dead: true, success: false }), landing, 9, cfg);
    expect(w.kind).toBe('wound');
    expect(d.kind).toBe('death');
    expect(d.shakeAmp).toBeGreaterThan(w.shakeAmp);
    expect(d.shakeTauMs).toBeGreaterThan(w.shakeTauMs);
    const maxW = Math.max(...w.branches.flatMap((b) => b.nodes.map((n) => n.w)));
    const maxD = Math.max(...d.branches.flatMap((b) => b.nodes.map((n) => n.w)));
    expect(maxD).toBeGreaterThan(maxW);
  });

  it('la frattura esiste anche sui SUCCESSI (i due dadi sono indipendenti)', () => {
    const m = buildFracture(
      snap,
      outcomeOf({ success: true, dead: true }),
      { x: 0.02, y: 0.02 },
      11,
      cfg,
    );
    expect(m.kind).toBe('death');
    expect(m.branches.length).toBeGreaterThan(0);
  });
});

describe('fracture — la crepa non insinua una causa', () => {
  it('una crepa NATA ALTROVE non raggiunge mai la pallina', () => {
    /* Se una crepa nata lontano arrivasse addosso al punto di atterraggio, il
       giocatore leggerebbe una causa dove c'è soltanto un secondo dado. */
    let checked = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const landing = { x: 0.3 * Math.cos(seed), y: 0.3 * Math.sin(seed) };
      const m = buildFracture(snap, outcomeOf({ dead: true, success: false }), landing, seed, cfg);
      if (m.epicenterIsLanding) continue;
      m.branches.forEach((b) =>
        b.nodes.forEach((n) => {
          const d = Math.hypot(n.x - landing.x, n.y - landing.y);
          expect(d).toBeGreaterThanOrEqual(cfg.landingExclusionR - 1e-9);
        }),
      );
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('quando il terreno cede SOTTO la pallina la crepa nasce lì (caso tautologico)', () => {
    /* Morte atterrata dentro una voragine: 'void' resta 'void'. Non c'è nulla
       da nascondere, quindi l'esclusione non si applica. */
    const v = snap.voidCenters[0];
    const m = buildFracture(snap, outcomeOf({ dead: true, success: false }), v, 7, cfg);
    expect(m.epicenterIsLanding).toBe(true);
    expect(m.epicenter).toEqual(v);
    expect(m.capSinks).toBe(true);
  });

  it("l'epicentro di ripiego viene spinto fuori dalla zona di esclusione", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const landing = { x: 0.25 * Math.cos(seed * 1.7), y: 0.25 * Math.sin(seed * 1.7) };
      const m = buildFracture(snap, outcomeOf({ dead: true, success: false }), landing, seed, cfg);
      if (m.epicenterIsLanding) continue;
      const d = Math.hypot(m.epicenter.x - landing.x, m.epicenter.y - landing.y);
      expect(d).toBeGreaterThanOrEqual(cfg.landingExclusionR - 1e-9);
    }
  });
});

describe('fracture — i tronchi terminano sul blob, non su un cerchio', () => {
  it('il nodo finale di ogni tronco sta sul perimetro sfida', () => {
    let checked = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const m = buildFracture(
        snap,
        outcomeOf({ dead: true, success: false }),
        { x: 0.05, y: -0.05 },
        seed,
        cfg,
      );
      m.branches
        .filter((b) => b.isTrunk)
        .forEach((b) => {
          const end = b.nodes[b.nodes.length - 1];
          const a = Math.atan2(end.y, end.x);
          expect(Math.hypot(end.x, end.y)).toBeCloseTo(rChallengeAt(snap, a), 6);
          checked += 1;
        });
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('fracture — epicentro onesto', () => {
  it('morte con landing dentro una voragine → epicentro = landing', () => {
    const v = snap.voidCenters[0];
    expect(inVoid(v, snap)).toBe(true);
    const { point, isLanding } = pickEpicenter('death', snap, v);
    expect(isLanding).toBe(true);
    expect(point).toEqual(v);
  });

  it('morte con landing fuori dalle voragini → ripiego dichiarato', () => {
    const far = { x: 0, y: 0 };
    const { isLanding } = pickEpicenter('death', snap, far);
    expect(isLanding).toBe(false);
  });

  it('la calotta sprofonda solo se la morte è atterrata in una voragine', () => {
    const inside = buildFracture(
      snap,
      outcomeOf({ dead: true, success: false }),
      snap.voidCenters[0],
      3,
      cfg,
    );
    const outside = buildFracture(
      snap,
      outcomeOf({ dead: true, success: false }),
      { x: 0, y: 0 },
      3,
      cfg,
    );
    expect(inside.capSinks).toBe(true);
    expect(outside.capSinks).toBe(false);
  });
});

describe('fracture — nastro e scossa', () => {
  it('il nastro si chiude a zero quando open = 0 (la ferita si risalda)', () => {
    const m = buildFracture(
      snap,
      outcomeOf({ wounded: true, success: false }),
      { x: 0.1, y: 0 },
      21,
      cfg,
    );
    const poly = ribbonPolygon(m.branches[0], 0);
    const half = poly.length / 2;
    for (let i = 0; i < half; i += 1) {
      const l = poly[i];
      const r = poly[poly.length - 1 - i];
      expect(Math.hypot(l.x - r.x, l.y - r.y)).toBeLessThan(1e-9);
    }
  });

  it('la scossa è continua nel tempo e decade a zero', () => {
    const amp = 0.02;
    const tau = 200;
    const a = shakeOffset(0, amp, tau, cfg);
    const b = shakeOffset(1000, amp, tau, cfg);
    expect(Math.hypot(a.x, a.y)).toBeLessThanOrEqual(amp * Math.SQRT2 + 1e-9);
    expect(Math.hypot(b.x, b.y)).toBeLessThan(amp * 0.01);

    /* indipendenza dal frame rate: campionare a 60 o a 120Hz dà lo stesso
       valore allo stesso istante — un offset random per frame no */
    for (let t = 0; t < 300; t += 7) {
      expect(shakeOffset(t, amp, tau, cfg)).toEqual(shakeOffset(t, amp, tau, cfg));
    }
  });

  it('rispetta il clamp duro di ampiezza', () => {
    const m = buildFracture(
      snap,
      outcomeOf({ dead: true, success: false }),
      { x: 0.1, y: 0 },
      4,
      cfg,
    );
    expect(m.shakeAmp).toBeLessThanOrEqual(cfg.shakeAmpMax);
  });
});

describe('fracture — budget', () => {
  it('non supera mai il tetto di nodi', () => {
    for (let seed = 1; seed <= 80; seed += 1) {
      const m = buildFracture(
        snap,
        outcomeOf({ dead: true, success: false }),
        { x: 0.02, y: 0.02 },
        seed,
        cfg,
      );
      expect(m.totalNodes).toBeLessThanOrEqual(cfg.fractureMaxNodes + 40);
    }
  });
});
