import { describe, it, expect } from 'vitest';
import {
  AXES,
  axisSkillMap,
  buildGeometry,
  expandSkillAxes,
  lerpGeometry,
  rChallengeAt,
  rStarAt,
  type GeometryInput,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import {
  classify,
  createRng,
  inStar,
  samplePointInChallenge,
  zoneAreas,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/zones';

const baseInput: GeometryInput = {
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

describe('geometry — logica 5 assi (D5, non negoziabile)', () => {
  it('distribuzione assi per numero skill', () => {
    expect(expandSkillAxes(1)).toEqual([5]);
    expect(expandSkillAxes(2)).toEqual([3, 2]);
    expect(expandSkillAxes(3)).toEqual([2, 2, 1]);
    expect(expandSkillAxes(4)).toEqual([2, 1, 1, 1]);
    expect(expandSkillAxes(5)).toEqual([1, 1, 1, 1, 1]);
  });

  it('axisSkillMap copre sempre 5 assi', () => {
    for (let n = 1; n <= 5; n += 1) {
      const map = axisSkillMap(n);
      expect(map).toHaveLength(AXES);
      map.forEach((s) => expect(s).toBeLessThan(n));
    }
  });

  it('stat diseguali → punte visibilmente diseguali', () => {
    const snap = buildGeometry(baseInput);
    expect(snap.axisTip[0]).toBeGreaterThan(snap.axisTip[4]);
  });

  it('la stella non eccede mai il perimetro sfida', () => {
    const snap = buildGeometry({ ...baseInput, difficulty: 90 });
    for (let i = 0; i < 360; i += 1) {
      const a = (i / 360) * Math.PI * 2;
      expect(rStarAt(snap, a)).toBeLessThan(rChallengeAt(snap, a));
    }
  });

  it('proporzionalità onesta: doppio critPct → banda circa doppia', () => {
    const s1 = buildGeometry({ ...baseInput, critPct: 10 });
    const s2 = buildGeometry({ ...baseInput, critPct: 20 });
    expect(s2.critThickness / s1.critThickness).toBeGreaterThan(1.8);
    expect(s2.critThickness / s1.critThickness).toBeLessThan(2.2);
  });

  it('clamp minimo di leggibilità su zone piccolissime', () => {
    const snap = buildGeometry({ ...baseInput, woundPct: 0.1, critPct: 0.1, deathPct: 0.1 });
    expect(snap.woundThickness).toBeGreaterThanOrEqual(snap.config.minVisualThickness);
    expect(snap.critThickness).toBeGreaterThanOrEqual(snap.config.minVisualThickness);
    expect(snap.voidRadius).toBeGreaterThanOrEqual(snap.config.minVoidRadius);
  });

  it('lerpGeometry interpola in modo monotòno', () => {
    const a = buildGeometry(baseInput);
    const b = buildGeometry({ ...baseInput, woundPct: 30 });
    const mid = lerpGeometry(a, b, 0.5);
    expect(mid.woundThickness).toBeGreaterThan(a.woundThickness);
    expect(mid.woundThickness).toBeLessThan(b.woundThickness);
    expect(lerpGeometry(a, b, 0).woundThickness).toBeCloseTo(a.woundThickness, 10);
    expect(lerpGeometry(a, b, 1).woundThickness).toBeCloseTo(b.woundThickness, 10);
  });
});

describe('zones — Monte Carlo area ≈ probabilità (acceptance F0)', () => {
  it('area corona ferita ≈ woundPct entro tolleranza', () => {
    const snap = buildGeometry({ ...baseInput, woundPct: 15, deathPct: 0, critPct: 0 });
    const areas = zoneAreas(snap, 40000);
    expect(areas.crown * 100).toBeGreaterThan(15 - 3);
    expect(areas.crown * 100).toBeLessThan(15 + 3);
  });

  it('area voragini ≈ deathPct entro tolleranza', () => {
    const snap = buildGeometry({ ...baseInput, deathPct: 12, woundPct: 0, critPct: 0 });
    const areas = zoneAreas(snap, 40000);
    expect(areas.void * 100).toBeGreaterThan(12 - 4);
    expect(areas.void * 100).toBeLessThan(12 + 4);
  });

  it('area banda crit ≈ critPct entro tolleranza', () => {
    const snap = buildGeometry({ ...baseInput, critPct: 10, woundPct: 0, deathPct: 0 });
    const areas = zoneAreas(snap, 40000);
    expect(areas.crit * 100).toBeGreaterThan(10 - 4);
    expect(areas.crit * 100).toBeLessThan(10 + 4);
  });

  it('classify è coerente con i predicati', () => {
    const snap = buildGeometry(baseInput);
    expect(classify({ x: 0, y: 0 }, snap)).toBe('star');
    const rng = createRng(7);
    for (let i = 0; i < 500; i += 1) {
      const p = samplePointInChallenge(snap, rng);
      const zone = classify(p, snap);
      if (zone === 'star') expect(inStar(p, snap)).toBe(true);
      if (zone === 'ruin' || zone === 'near-miss' || zone === 'crit') {
        expect(inStar(p, snap)).toBe(false);
      }
    }
  });

  it('zoneAreas è deterministico a parità di seed', () => {
    const snap = buildGeometry(baseInput);
    expect(zoneAreas(snap, 5000, 42)).toEqual(zoneAreas(snap, 5000, 42));
  });
});
