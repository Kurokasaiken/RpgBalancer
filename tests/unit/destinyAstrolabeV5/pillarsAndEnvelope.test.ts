import { describe, it, expect } from 'vitest';
import {
  AXES,
  buildGeometry,
  rStarAt,
  tipAngle,
  type GeometryInput,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import {
  buildPillars,
  crossSegment,
  lightDir,
  pillarTierFor,
  pointOnShaft,
  readableDelta,
  sortPillarsByDepth,
} from '@/ui/idleVillage/components/destinyAstrolabeV5/pillars';
import {
  astrolabeV5Config,
  resolveAstrolabeV5Config,
} from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';

const input: GeometryInput = {
  stats: [
    { name: 'Atletica', stat: 80, difficulty: 50 },
    { name: 'Astuzia', stat: 65, difficulty: 50 },
    { name: 'Vigore', stat: 35, difficulty: 50 },
  ],
  difficulty: 50,
  critPct: 5,
  woundPct: 10,
  deathPct: 5,
};
const snap = buildGeometry(input);
const cfg = astrolabeV5Config;
const pillars = buildPillars(snap, cfg);

describe('pillars — una sola camera per tutta la scena', () => {
  it('la punta si sposta radialmente VERSO L’ESTERNO, mai verso il centro', () => {
    /* Il bug di V3: `dirX = -cos(a)` inclinava i pilastri verso il centro,
       facendoli convergere a teepee. In una vista dall'alto il punto di fuga
       delle verticali è il nadir, quindi devono divergere. */
    pillars.forEach((p) => {
      expect(Math.hypot(p.tip.x, p.tip.y)).toBeGreaterThan(p.baseR);
      /* e lo spostamento è collineare col raggio, non obliquo */
      const cross = p.tip.x * Math.sin(p.angle) - p.tip.y * Math.cos(p.angle);
      expect(Math.abs(cross)).toBeLessThan(1e-9);
    });
  });

  it('tutti e cinque condividono lo stesso rapporto prospettico', () => {
    /* V3 spostava la punta di −h in Y schermo, uguale per tutti: due pilastri
       identici finivano con altezza apparente diversa del 167%. */
    const expected = cfg.pillarHeightR / (cfg.cameraHeightR - cfg.pillarHeightR);
    pillars.forEach((p) => {
      const ratio = (Math.hypot(p.tip.x, p.tip.y) - p.baseR) / p.baseR;
      expect(ratio).toBeCloseTo(expected, 9);
    });
  });

  it('i monoliti più lontani dal centro si sdraiano di più', () => {
    const sorted = [...pillars].sort((a, b) => a.baseR - b.baseR);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = Math.hypot(sorted[i - 1].tip.x, sorted[i - 1].tip.y) - sorted[i - 1].baseR;
      const cur = Math.hypot(sorted[i].tip.x, sorted[i].tip.y) - sorted[i].baseR;
      expect(cur).toBeGreaterThanOrEqual(prev - 1e-12);
    }
  });
});

describe('pillars — la luce è quella della scena, non una regola costante', () => {
  it('il lato illuminato cambia lungo il giro', () => {
    /* V3 metteva oro sempre sullo spigolo sinistro e azure sempre sul destro,
       per tutti e cinque: corretto per 1 pilastro su 5. */
    const leftBrighter = pillars.filter((p) => p.shadeLeft > p.shadeRight).length;
    expect(leftBrighter).toBeGreaterThan(0);
    expect(leftBrighter).toBeLessThan(AXES);
  });

  it('le facce hanno volume reale, non 8 unità RGB di differenza', () => {
    const maxDelta = Math.max(...pillars.map((p) => Math.abs(p.shadeLeft - p.shadeRight)));
    expect(maxDelta).toBeGreaterThan(0.25);
  });

  it('le ombre ventagliano invece di essere parallele e identiche', () => {
    const dirs = pillars.map((p) => {
      const a = p.shadow[0];
      const c = p.shadow[2];
      return Math.atan2(c.y - a.y, c.x - a.x);
    });
    const spread = Math.max(...dirs) - Math.min(...dirs);
    expect(spread).toBeGreaterThan(0.05);
  });

  it("l'ombra è più lunga della base (altrimenti è un piedistallo)", () => {
    pillars.forEach((p) => {
      const a = p.shadow[0];
      const c = p.shadow[2];
      expect(Math.hypot(c.x - a.x, c.y - a.y)).toBeGreaterThan(p.halfWidth * 2);
    });
  });

  it('la prospettiva atmosferica smorza i monoliti opposti alla luce', () => {
    const L = lightDir(cfg);
    const toward = pillars.reduce((best, p) =>
      Math.cos(p.angle) * L.x + Math.sin(p.angle) * L.y >
      Math.cos(best.angle) * L.x + Math.sin(best.angle) * L.y
        ? p
        : best,
    );
    const away = pillars.reduce((best, p) => (p.atmo > best.atmo ? p : best));
    expect(away.atmo).toBeGreaterThan(toward.atmo);
  });
});

describe('pillars — profondità', () => {
  it('ordina back-to-front invece di seguire l’indice', () => {
    /* V3 disegnava in ordine 0..4, quindi l'asse 4 copriva sempre l'asse 3
       indipendentemente dalla posizione sullo schermo. */
    const sorted = sortPillarsByDepth(pillars);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i].depth).toBeGreaterThanOrEqual(sorted[i - 1].depth);
    }
  });
});

describe('pillars — semantica: i due canali dello stesso dato non divergono', () => {
  it('statNorm coincide con la lunghezza normalizzata del petalo', () => {
    const span = snap.config.maxRadius - snap.config.coreRadius;
    pillars.forEach((p, i) => {
      const petal = (snap.axisTip[i] - snap.config.coreRadius) / span;
      expect(p.statNorm).toBeCloseTo(petal, 9);
    });
  });

  it('la punta del petalo cresce con la stat, come il livello d’oro', () => {
    const strongest = pillars.reduce((b, p) => (p.statValue > b.statValue ? p : b));
    const weakest = pillars.reduce((b, p) => (p.statValue < b.statValue ? p : b));
    expect(strongest.statNorm).toBeGreaterThan(weakest.statNorm);
    expect(rStarAt(snap, tipAngle(strongest.index))).toBeGreaterThan(
      rStarAt(snap, tipAngle(weakest.index)),
    );
  });

  it('lo scarto ha il segno giusto: cresta se supera, morso se non arriva', () => {
    const strong = pillars.find((p) => p.statValue === 80)!;
    const weak = pillars.find((p) => p.statValue === 35)!;
    expect(strong.delta).toBeGreaterThan(0);
    expect(weak.delta).toBeLessThan(0);
  });

  it('con difficoltà per-asse disattivata gli architravi formano un anello di livello', () => {
    const norms = new Set(pillars.map((p) => p.difficultyNorm.toFixed(9)));
    expect(norms.size).toBe(1);
  });

  it('con difficoltà per-asse attiva gli architravi si differenziano', () => {
    const perAxis = resolveAstrolabeV5Config({ perAxisDifficultyEnabled: true });
    const varied = buildGeometry({
      ...input,
      stats: [
        { name: 'A', stat: 70, difficulty: 30 },
        { name: 'B', stat: 70, difficulty: 60 },
        { name: 'C', stat: 70, difficulty: 90 },
      ],
    });
    const ps = buildPillars(varied, perAxis);
    const norms = new Set(ps.map((p) => p.difficultyNorm.toFixed(6)));
    expect(norms.size).toBeGreaterThan(1);
  });
});

describe('pillars — leggibilità a dimensione ridotta (test del 25%)', () => {
  it('i tier scendono con la larghezza del board', () => {
    expect(pillarTierFor(600)).toBe('full');
    expect(pillarTierFor(380)).toBe('compact');
    expect(pillarTierFor(260)).toBe('tight');
    expect(pillarTierFor(200)).toBe('glyph');
  });

  it('lo scarto diventa SEGNO invece che magnitudine quando è sotto-pixel', () => {
    /* La primitiva grafica non cambia mai — sempre una barra con una soglia.
       Cambia solo il dettaglio: è questo che fa passare il test del 25%. */
    const tiny = buildGeometry({
      ...input,
      stats: [{ name: 'X', stat: 51, difficulty: 50 }],
    });
    const p = buildPillars(tiny, cfg)[0];
    const rPx = 90; // board molto piccolo
    const d = readableDelta(p, cfg, rPx);
    expect(Math.sign(d)).toBe(Math.sign(p.delta));
    expect(Math.abs(d)).toBeGreaterThanOrEqual(cfg.minDeltaPx / rPx - 1e-9);
  });

  it('scarto nullo resta nullo', () => {
    const even = buildGeometry({
      ...input,
      stats: [{ name: 'X', stat: 50, difficulty: 50 }],
    });
    const p = buildPillars(even, cfg)[0];
    if (p.delta === 0) expect(readableDelta(p, cfg, 100)).toBe(0);
  });
});

describe('pillars — inviluppo', () => {
  it('il corpo dei monoliti sta dentro envelopeR', () => {
    pillars.forEach((p) => {
      [...p.footprint, ...p.shaft, ...p.pyramidion].forEach((pt) => {
        expect(Math.hypot(pt.x, pt.y)).toBeLessThanOrEqual(cfg.envelopeR);
      });
    });
  });

  it("l'anello delle etichette sta dentro l'inviluppo", () => {
    expect(cfg.labelRingR).toBeLessThanOrEqual(cfg.envelopeR);
  });

  it('V5 occupa meno spazio della ghiera bronzea di V3', () => {
    /* V3: ghiera fino a R*1.13 con arenaRadiusFraction 0.44 → 0.497 del lato.
       V5: inviluppo R*1.34 con arenaRadiusFraction 0.36 → 0.483 del lato. */
    const v3 = 1.13 * 0.44;
    const v5 = cfg.envelopeR * cfg.arenaRadiusFraction;
    expect(v5).toBeLessThan(v3);
  });
});

describe('pillars — geometria del fusto', () => {
  it('pointOnShaft usa la stessa camera del corpo', () => {
    pillars.forEach((p) => {
      const base = pointOnShaft(p, cfg, 0);
      const tip = pointOnShaft(p, cfg, 1);
      expect(Math.hypot(base.x, base.y)).toBeCloseTo(p.baseR, 9);
      expect(Math.hypot(tip.x, tip.y)).toBeCloseTo(Math.hypot(p.tip.x, p.tip.y), 9);
    });
  });

  it('il fusto si rastrema verso la punta', () => {
    pillars.forEach((p) => {
      const low = crossSegment(p, cfg, 0);
      const high = crossSegment(p, cfg, 1);
      const wLow = Math.hypot(low[1].x - low[0].x, low[1].y - low[0].y);
      const wHigh = Math.hypot(high[1].x - high[0].x, high[1].y - high[0].y);
      expect(wHigh).toBeLessThan(wLow);
    });
  });
});
