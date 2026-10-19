/**
 * PLAN-053 T-001 — pure journey model: fasi schema additivity, route
 * geometry (monotonicity + reversal symmetry), clock arithmetic
 * (parked vs consumed), faseAt projection, seeded beat RNG.
 */
import { describe, expect, it } from 'vitest';
import { QuestPoiSchema, QUEST_POIS } from '@/balancing/config/idleVillage/quests/questPois';
import {
  beatDraw,
  beatSeed,
  buildJourneyPolyline,
  faseAt,
  journeyFasiOf,
  pointAt,
  reversedRoute,
  totalTravelTicks,
  travelTicksConsumed,
  type JourneyBeatEntry,
  type JourneyJournal,
} from '@/ui/idleVillage/quests/questJourney';

const BASE_POI = {
  id: 'poi-test',
  x: 100,
  y: 200,
  sizePx: 55,
  questId: 'goblin' as const,
  estimatedDurationTicks: 50,
  ticksPerNode: 10,
  expectedPathNodes: 5,
  slots: { required: ['s1'], optional: [] },
};

const journal = (over: Partial<JourneyJournal> = {}): JourneyJournal => ({
  currentFase: 'andata',
  faseStartedAtTick: 0,
  processedUpToTick: 0,
  accumulatedParkedTicks: 0,
  parkedNodeId: null,
  beats: [],
  ...over,
});

const SNAPSHOT = { travelDays: 2, ticksPerDay: 5, route: buildJourneyPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }), pins: {} };

/* ------------------------------------------------------------------ */
/* Schema: strictly additive `fasi`                                    */
/* ------------------------------------------------------------------ */

describe('QuestPoiSchema.fasi (additive journey contract)', () => {
  it('parses a legacy POI without fasi → journeyFasiOf is null (legacy sentinel)', () => {
    const poi = QuestPoiSchema.parse(BASE_POI);
    expect(poi.fasi).toBeUndefined();
    expect(journeyFasiOf(poi)).toBeNull();
  });

  it('keeps every shipped POI journey-free at T-001 (no default injected — T-004 re-authors)', () => {
    // Tripwire: T-001 must stay strictly additive. When T-004 authors
    // `fasi` on the real POIs this expectation is updated in the same PR.
    expect(QUEST_POIS.every((p) => p.fasi === undefined)).toBe(true);
  });

  it('accepts travelDays integer >= 1 and carries waypoints + pins', () => {
    const poi = QuestPoiSchema.parse({
      ...BASE_POI,
      fasi: {
        travelDays: 3,
        waypoints: [{ x: 150, y: 250 }],
        pins: { 'n-mercante': 0.4, 'n-agguato': 1 },
      },
    });
    expect(journeyFasiOf(poi)?.travelDays).toBe(3);
    expect(totalTravelTicks(poi.fasi!, 5)).toBe(15);
  });

  it.each([0, -1, 1.5, 2.7])('rejects travelDays %s (must be int >= 1)', (bad) => {
    expect(() => QuestPoiSchema.parse({ ...BASE_POI, fasi: { travelDays: bad } })).toThrow();
  });

  it.each([-0.01, 1.01, 2])('rejects pin %s (must be in [0,1] — never clamped)', (bad) => {
    expect(() =>
      QuestPoiSchema.parse({ ...BASE_POI, fasi: { travelDays: 1, pins: { 'n-x': bad } } }),
    ).toThrow();
  });

  it('accepts boundary pins 0 and 1', () => {
    const poi = QuestPoiSchema.parse({
      ...BASE_POI,
      fasi: { travelDays: 1, pins: { 'n-start': 0, 'n-end': 1 } },
    });
    expect(poi.fasi?.pins).toEqual({ 'n-start': 0, 'n-end': 1 });
  });
});

/* ------------------------------------------------------------------ */
/* Route geometry                                                      */
/* ------------------------------------------------------------------ */

describe('buildJourneyPolyline / pointAt', () => {
  const route = buildJourneyPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }, [{ x: 5, y: 5 }]);

  it('computes cumulative arc lengths and total length', () => {
    const leg = Math.hypot(5, 5);
    expect(route.cumulativeLengths).toEqual([0, leg, 2 * leg]);
    expect(route.totalLength).toBeCloseTo(2 * leg);
  });

  it('interpolates endpoints and the waypoint exactly', () => {
    expect(pointAt(route, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAt(route, 0.5)).toEqual({ x: 5, y: 5 });
    expect(pointAt(route, 1)).toEqual({ x: 10, y: 0 });
  });

  it('is monotone: sampled arc position never regresses with progress', () => {
    const from = { x: 0, y: 0 };
    let prev = 0;
    for (const t of [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]) {
      const p = pointAt(route, t);
      const d = Math.hypot(p.x - from.x, p.y - from.y);
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
  });

  it('clamps progress to [0,1]', () => {
    expect(pointAt(route, -0.5)).toEqual(pointAt(route, 0));
    expect(pointAt(route, 1.5)).toEqual(pointAt(route, 1));
  });

  it('satisfies reversal symmetry: ritorno(t) = andata(1 − t)', () => {
    const back = reversedRoute(route);
    for (const t of [0, 0.13, 0.37, 0.5, 0.82, 1]) {
      const fwd = pointAt(route, 1 - t);
      const rev = pointAt(back, t);
      expect(rev.x).toBeCloseTo(fwd.x, 10);
      expect(rev.y).toBeCloseTo(fwd.y, 10);
    }
  });

  it.each([
    ['consecutive duplicate waypoints', [{ x: 5, y: 5 }, { x: 5, y: 5 }]],
    ['waypoint coincident with origin', [{ x: 0, y: 0 }]],
    ['waypoint coincident with destination', [{ x: 10, y: 0 }]],
  ])('rejects degenerate route: %s', (_label, wps) => {
    expect(() => buildJourneyPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }, wps)).toThrow(/degenerate/);
  });

  it('rejects a route whose endpoints coincide', () => {
    expect(() => buildJourneyPolyline({ x: 3, y: 3 }, { x: 3, y: 3 })).toThrow(/degenerate/);
  });
});

/* ------------------------------------------------------------------ */
/* Clock arithmetic + faseAt projection                                */
/* ------------------------------------------------------------------ */

describe('travelTicksConsumed / faseAt', () => {
  it('consumed = elapsed when nothing is parked', () => {
    const j = journal({ processedUpToTick: 7 });
    expect(travelTicksConsumed(j)).toBe(7);
  });

  it('parked ticks are excluded from consumed travel but not from faseProgress', () => {
    const j = journal({ processedUpToTick: 8, accumulatedParkedTicks: 3 });
    expect(travelTicksConsumed(j)).toBe(5);
    const view = faseAt(SNAPSHOT, j); // total = 2 days × 5 = 10
    expect(view.faseProgress).toBeCloseTo(0.8); // 8/10 — clock-pure, parked included
    expect(view.routeProgress).toBeCloseTo(0.5); // 5/10 — marker froze during park
  });

  it('clamps both progress channels at 1', () => {
    const view = faseAt(SNAPSHOT, journal({ processedUpToTick: 99 }));
    expect(view.faseProgress).toBe(1);
    expect(view.routeProgress).toBe(1);
  });

  it('svolgimento: faseProgress is null (engine-owned, emergent) and route full', () => {
    const view = faseAt(SNAPSHOT, journal({ currentFase: 'svolgimento', processedUpToTick: 30, faseStartedAtTick: 10 }));
    expect(view.faseProgress).toBeNull();
    expect(view.routeProgress).toBe(1);
    expect(view.faseElapsedTicks).toBe(20);
  });

  it('parked waiting frontier → parked + pendingDecision', () => {
    const waiting: JourneyBeatEntry = { nodeId: 'n-mercante', pin: 0.4, kind: 'waiting', openedAtTick: 4, resolvedAtTick: null };
    const view = faseAt(SNAPSHOT, journal({ parkedNodeId: 'n-mercante', beats: [waiting] }));
    expect(view.parked).toBe(true);
    expect(view.pendingDecision).toBe(true);
    expect(view.endpointResolving).toBe(false); // parked wins over endpointResolving
  });

  it('endpointResolving: route full + opened unresolved pending beat', () => {
    const pending: JourneyBeatEntry = { nodeId: 'n-evento', pin: 0.9, kind: 'pending', openedAtTick: 8, resolvedAtTick: null };
    const view = faseAt(SNAPSHOT, journal({ processedUpToTick: 10, beats: [pending] }));
    expect(view.routeProgress).toBe(1);
    expect(view.endpointResolving).toBe(true);
  });

  it('endpointResolving false when the opened beat is resolved or unopened', () => {
    const resolved: JourneyBeatEntry = { nodeId: 'n-a', pin: 0.9, kind: 'pending', openedAtTick: 8, resolvedAtTick: 12 };
    const unopened: JourneyBeatEntry = { nodeId: 'n-b', pin: 0.9, kind: 'pending', openedAtTick: null, resolvedAtTick: null };
    expect(faseAt(SNAPSHOT, journal({ processedUpToTick: 10, beats: [resolved] })).endpointResolving).toBe(false);
    expect(faseAt(SNAPSHOT, journal({ processedUpToTick: 10, beats: [unopened] })).endpointResolving).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Seeded beat RNG                                                     */
/* ------------------------------------------------------------------ */

describe('beatSeed / beatDraw', () => {
  it('is deterministic per (runSeed, nodeId, callIndex)', () => {
    const s = beatSeed(42, 'n-mercante');
    expect(beatDraw(s, 0)).toBe(beatDraw(s, 0));
    expect(beatDraw(s, 3)).toBe(beatDraw(s, 3));
    expect(beatDraw(s, 0)).not.toBe(beatDraw(s, 1));
  });

  it('forks per nodeId and per runSeed — the seed string is "${runSeed}:${nodeId}"', () => {
    expect(beatSeed(42, 'n-a')).not.toBe(beatSeed(42, 'n-b'));
    expect(beatSeed(1, 'n-a')).not.toBe(beatSeed(2, 'n-a'));
  });

  it('rejects a nodeId containing the seed separator', () => {
    expect(() => beatSeed(1, 'n:o')).toThrow(/separator/);
  });

  it('produces [0,1) draws', () => {
    const s = beatSeed(7, 'n-agguato');
    for (let i = 0; i < 50; i += 1) {
      const v = beatDraw(s, i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
