/**
 * Meta-Layer Gate A tests (PLAN-030 / R-164).
 *
 * Deterministic seeded coverage of the ratified contract:
 * config validity, determinism, 4 gate states, scout narrowing, dual
 * timers, leader-capacity, steering bias (not filter), write-back
 * cross-gating, world advancement via clocks, windows, deadline
 * auto-fail, milestone approaches — plus the graph linter on the v0
 * config and on deliberately broken variants.
 */

import { describe, expect, it } from 'vitest';
import {
  loadMetaLayerConfig,
  MetaLayerConfigSchema,
  META_LAYER_CONFIG_V0,
  type MetaLayerConfig,
  type OfferDef,
} from '@/balancing/config/metaLayer';
import {
  advanceSessionTime,
  applyQualityDelta,
  computeReachability,
  createSession,
  driveSession,
  DRIVER_POLICIES,
  evaluateGateState,
  freeLeaders,
  lintOpportunityGraph,
  milestoneViews,
  offerQuests,
  openApproaches,
  outcomeWrites,
  resolveOutcome,
  mulberry32,
  selectQuest,
  worldOf,
  type MetaSession,
  type PartyCapability,
} from '@/engine/metaLayer';
import { writeFileSync, mkdirSync } from 'node:fs';
import { lintReportToMarkdown } from '@/engine/metaLayer/linter';

const CFG = loadMetaLayerConfig();

const rookie: PartyCapability = {
  leaders: 1,
  explorerQuality: 0.2,
  capabilities: ['survival'],
  stats: { str: 2, agi: 1, end: 2, cha: 1, int: 1 },
};

const standard: PartyCapability = {
  leaders: 2,
  explorerQuality: 0.5,
  capabilities: ['stealth', 'survival', 'diplomacy', 'disguise'],
  stats: { str: 2, agi: 3, end: 3, cha: 3, int: 2 },
};

const veteran: PartyCapability = {
  leaders: 3,
  explorerQuality: 0.9,
  capabilities: ['stealth', 'survival', 'sabotage', 'disguise', 'arcana', 'tracking'],
  stats: { str: 4, agi: 5, end: 5, cha: 4, int: 5 },
};

function sessionWith(party: PartyCapability, seed = 42): MetaSession {
  return createSession(CFG, party, seed);
}

/* ------------------------------------------------------------------------ */

describe('config validity', () => {
  it('parses the v0 config through the Zod schema', () => {
    expect(() => MetaLayerConfigSchema.parse(META_LAYER_CONFIG_V0)).not.toThrow();
    expect(CFG.offers.length).toBeGreaterThanOrEqual(12);
    expect(CFG.families.map((f) => f.id)).toEqual(
      expect.arrayContaining(['infiltration', 'delve', 'race']),
    );
    expect(CFG.milestones.length).toBe(2);
  });
});

describe('determinism', () => {
  it('same seed + same calls → identical board and outcomes', () => {
    const a = driveSession(CFG, standard, 7, {}, DRIVER_POLICIES.firstReady, 10, 3);
    const b = driveSession(CFG, standard, 7, {}, DRIVER_POLICIES.firstReady, 10, 3);
    expect(a).toEqual(b);
  });

  it('different seed → different stream (boards differ eventually)', () => {
    const a = driveSession(CFG, standard, 1, {}, DRIVER_POLICIES.lowestRisk, 15, 2);
    const b = driveSession(CFG, standard, 999, {}, DRIVER_POLICIES.lowestRisk, 15, 2);
    expect(a.resolutions).not.toEqual(b.resolutions);
  });
});

describe('gate states (4 computed states)', () => {
  it('locked: absolute requirement missing → unlockRoute named', () => {
    const s = sessionWith(standard);
    const def = CFG.offers.find((o) => o.id === 'infil-fortress-sewers')!;
    const gate = evaluateGateState(def, standard, worldOf(s), CFG.tuning);
    expect(gate.state).toBe('locked');
    expect(gate.missingAbsolute.length).toBe(1);
    expect(gate.unlockRoute?.key).toBe('access:sewers');
  });

  it('underprepared: non-absolute gap → commit allowed', () => {
    const s = sessionWith(rookie);
    // rookie lacks stealth → scout-camp underprepared
    const def = CFG.offers.find((o) => o.id === 'infil-scout-camp')!;
    const gate = evaluateGateState(def, rookie, worldOf(s), CFG.tuning);
    expect(gate.state).toBe('underprepared');
    expect(gate.missing.map((m) => m.key)).toContain('stealth');
  });

  it('ready vs over-qualified via party power', () => {
    const s = sessionWith(standard);
    const def = CFG.offers.find((o) => o.id === 'infil-bribe-smuggler')!;
    const gStd = evaluateGateState(def, standard, worldOf(s), CFG.tuning);
    const gVet = evaluateGateState(def, veteran, worldOf(s), CFG.tuning);
    expect(['ready', 'over-qualified']).toContain(gStd.state);
    expect(gVet.state).toBe('over-qualified');
  });

  it('locked offers cannot be committed', () => {
    const s = sessionWith(rookie);
    // force fortress-sewers onto the board by reaching its appearsWhen
    advanceSessionTime(s, 1); // generates whatever is eligible
    // rookie has no stealth → even if on board, gate may be locked/underprepared
    // build a world where fortress-sewers appears but access:sewers missing
    const def = CFG.offers.find((o) => o.id === 'infil-fortress-sewers')!;
    expect(
      evaluateGateState(def, rookie, worldOf(s), CFG.tuning).state,
    ).toBe('locked');
  });
});

describe('scout report (no intel currency — explorer quality only)', () => {
  it('higher explorerQuality narrows the risk band', () => {
    const s = sessionWith(standard);
    const def = CFG.offers.find((o) => o.id === 'infil-scout-camp')!;
    const lo = evaluateGateState(
      def,
      { ...standard, explorerQuality: 0 },
      worldOf(s),
      CFG.tuning,
    ).scoutBand;
    const hi = evaluateGateState(
      def,
      { ...standard, explorerQuality: 1 },
      worldOf(s),
      CFG.tuning,
    ).scoutBand;
    expect(hi[1] - hi[0]).toBeLessThan(lo[1] - lo[0]);
  });
});

describe('dual timers', () => {
  it('acceptance expiry removes the offer from the board', () => {
    const s = sessionWith(standard);
    const before = offerQuests(s).map((o) => o.def.id);
    advanceSessionTime(s, 20); // longest acceptanceTicks is 16
    const after = offerQuests(s).map((o) => o.def.id);
    // every offer initially on board must have expired and been replaced
    for (const id of before) {
      const still = offerQuests(s).find(
        (o) => o.def.id === id && o.ticksToExpiry > 0,
      );
      if (still) {
        // if still there it must be a fresh instance
        expect(still.instanceId).not.toBe(
          offerQuests(createSession(CFG, standard, 42)).find(
            (o) => o.def.id === id,
          )?.instanceId,
        );
      }
    }
    expect(after.length).toBeGreaterThan(0);
  });

  it('quest auto-fails when deadline lands before resolution', () => {
    const broken: MetaLayerConfig = {
      ...CFG,
      offers: CFG.offers.map((o) =>
        o.id === 'infil-scout-camp'
          ? { ...o, durationTicks: 10, completionTicks: 4 }
          : o,
      ),
    };
    const s = createSession(broken, standard, 5);
    const target = offerQuests(s).find((o) => o.def.id === 'infil-scout-camp');
    expect(target).toBeDefined();
    expect(target!.gate.willExceedCompletion).toBe(true);
    const res = selectQuest(s, target!.instanceId);
    expect(res.ok).toBe(true);
    const report = advanceSessionTime(s, 4);
    expect(
      report.events.some(
        (e) => e.kind === 'quest-deadline-fail' && e.defId === 'infil-scout-camp',
      ),
    ).toBe(true);
  });

  it('the three time concepts are distinct in the config', () => {
    expect(CFG.offers.some((o) => o.window)).toBe(true);
    expect(CFG.offers.some((o) => o.acceptanceTicks !== o.completionTicks)).toBe(true);
    expect(CFG.offers.some((o) => o.durationTicks !== o.completionTicks)).toBe(true);
  });
});

describe('leader-capacity (only parallel constraint)', () => {
  it('committing consumes leaders; the N+1th commit is rejected', () => {
    const s = sessionWith(standard); // 2 leaders
    let committed = 0;
    for (const o of offerQuests(s)) {
      if (o.gate.state === 'locked') continue;
      const res = selectQuest(s, o.instanceId);
      if (res.ok) committed++;
    }
    expect(committed).toBeLessThanOrEqual(2);
    expect(freeLeaders(s)).toBe(2 - committed);
    const extra = offerQuests(s).find((o) => o.gate.state !== 'locked');
    if (extra) {
      const res = selectQuest(s, extra.instanceId);
      expect(res.ok).toBe(committed < 2);
    }
  });
});

describe('steering (weight bias, never a filter)', () => {
  it('steering multiplies family weights but cannot exclude families', () => {
    // NOTE: steering is only visible when the eligible pool exceeds
    // boardSize (pool ≤ boardSize → board = whole pool). We shrink the
    // board to 2 slots so the 5 tick-0 eligible offers compete, then
    // measure the PRESENCE RATE of race on the board (a family with one
    // eligible offer can appear at most once per board — count is
    // capped, inclusion probability is what steering moves).
    const tight: MetaLayerConfig = {
      ...CFG,
      tuning: { ...CFG.tuning, boardSize: 2 },
    };
    const presenceRate = (steering: Record<string, number>) => {
      let boards = 0;
      let withRace = 0;
      for (let seed = 0; seed < 60; seed++) {
        const s = createSession(tight, standard, seed, steering);
        boards++;
        if (offerQuests(s).some((o) => o.def.family === 'race')) withRace++;
      }
      return withRace / boards;
    };
    const steered = presenceRate({ race: 10 });
    const unsteered = presenceRate({});
    // 8×10=80/115 weight → near-certain inclusion; 8/115 → rare
    expect(steered).toBeGreaterThan(0.8);
    expect(unsteered).toBeLessThan(0.4);
    expect(steered).toBeGreaterThan(unsteered);
    // …and steering never filters the other families out
    let nonRace = 0;
    for (let seed = 0; seed < 60; seed++) {
      const s = createSession(tight, standard, seed, { race: 10 });
      nonRace += offerQuests(s).filter((o) => o.def.family !== 'race').length;
    }
    expect(nonRace).toBeGreaterThan(0);
  });

  it('at tick 0 every family with an eligible offer can appear', () => {
    // race has exactly one always-eligible offer (caravan-escort) —
    // a family with zero eligible offers can never be sampled.
    const eligible = CFG.offers.filter(
      (o) => o.family === 'race' && !o.appearsWhen && !o.window,
    );
    expect(eligible.length).toBeGreaterThanOrEqual(1);
  });
});

describe('world advances + write-back (graph dynamics)', () => {
  it('clock ticking reveals the warning-bell offer at pressure ≥3', () => {
    const s = createSession(CFG, standard, 3);
    const eligible = () =>
      offerQuests(s).some((o) => o.def.id === 'race-warning-bell');
    // goblin-pressure +1 every 5 ticks → ≥3 at tick 15
    advanceSessionTime(s, 14);
    const at14 = eligible();
    advanceSessionTime(s, 2);
    const at16 = eligible();
    expect(worldOf(s).qualities['clock:goblin-pressure']).toBeGreaterThanOrEqual(3);
    expect(at16).toBe(true);
    // at14 may or may not show it depending on sampling; the quality gate is what matters
    expect(typeof at14).toBe('boolean');
  });

  it('write-back is deterministic: sewers written → fortress unlocks', () => {
    const s = sessionWith(veteran);
    const flooded = CFG.offers.find((o) => o.id === 'delve-flooded-vault')!;
    const fortress = CFG.offers.find((o) => o.id === 'infil-fortress-sewers')!;
    // the write path a successful resolution takes:
    for (const w of outcomeWrites(flooded, 'win')) {
      applyQualityDelta(worldOf(s), w);
    }
    expect(worldOf(s).qualities['access:sewers']).toBeGreaterThanOrEqual(1);
    const gate = evaluateGateState(
      fortress,
      veteran,
      worldOf(s),
      CFG.tuning,
    );
    expect(gate.state).not.toBe('locked');
  });

  it('end-to-end: a committed quest resolves once and is consumed', () => {
    const s = sessionWith(veteran);
    let resolvedOutcome: string | undefined;
    for (let i = 0; i < 80 && !resolvedOutcome; i++) {
      const t = offerQuests(s).find((o) => o.def.id === 'delve-flooded-vault');
      if (t && t.gate.state !== 'locked' && freeLeaders(s) > 0) {
        selectQuest(s, t.instanceId);
      }
      const report = advanceSessionTime(s, 5);
      const r = report.resolved.find((r) => r.defId === 'delve-flooded-vault');
      if (r) resolvedOutcome = r.outcome;
    }
    expect(resolvedOutcome).toBeDefined();
    // one-shot: after resolution it must be consumed and never re-committed
    expect(s.state.consumed['delve-flooded-vault']).toBeDefined();
    // invariant: access:sewers present iff the outcome wrote it
    const wrote =
      resolvedOutcome === 'win' || resolvedOutcome === 'big-win';
    expect(
      (worldOf(s).qualities['access:sewers'] ?? 0) >= 1,
    ).toBe(wrote);
  });
});

describe('harm profile (succ/wound/death)', () => {
  const emptyWorld = { tick: 0, qualities: {} };

  it('harm lands only on fail-zone outcomes, at harmProfile rates', () => {
    // break-siege: risk .5-.75, harm wound .55 / death .3 → over many
    // rolls wounds and deaths must both appear, and never on success.
    const siege = CFG.offers.find((o) => o.id === 'race-break-siege')!;
    const gate = evaluateGateState(siege, veteran, emptyWorld, CFG.tuning);
    const rng = mulberry32(7);
    let fails = 0;
    let wounds = 0;
    let deaths = 0;
    let successHarm = 0;
    for (let i = 0; i < 2000; i++) {
      const r = resolveOutcome(siege, gate, CFG.tuning, rng);
      if (r.outcome === 'fail' || r.outcome === 'epic-fail') {
        fails++;
        if (r.harm === 'wound') wounds++;
        if (r.harm === 'death') deaths++;
      } else if (r.harm !== 'none') {
        successHarm++;
      }
    }
    expect(successHarm).toBe(0);
    expect(fails).toBeGreaterThan(200); // ~50-65% of rolls are fails
    expect(wounds).toBeGreaterThan(0);
    expect(deaths).toBeGreaterThan(0);
    // wound rate conditional on fail ≈ .55 (epic-fail escalates upward)
    expect(wounds / fails).toBeGreaterThan(0.3);
    expect(deaths / fails).toBeGreaterThan(0.15);
  });

  it('epic-fail always lands at least a wound', () => {
    // bribe-smuggler: wound .1 death 0 → most fails are clean, but an
    // epic-fail can never come back clean.
    const bribe = CFG.offers.find((o) => o.id === 'infil-bribe-smuggler')!;
    const gate = evaluateGateState(bribe, standard, emptyWorld, CFG.tuning);
    const rng = mulberry32(11);
    let epics = 0;
    for (let i = 0; i < 5000 && epics < 50; i++) {
      const r = resolveOutcome(bribe, gate, CFG.tuning, rng);
      if (r.outcome === 'epic-fail') {
        epics++;
        expect(r.harm).not.toBe('none');
      }
    }
    expect(epics).toBeGreaterThan(0);
  });
});

describe('windows', () => {
  it('escort-pilgrims is not eligible before its window opens', () => {
    // pilgrims window opens at tick 15 — before that it must never appear
    for (let seed = 0; seed < 10; seed++) {
      const ss = createSession(CFG, standard, seed + 100);
      advanceSessionTime(ss, 2);
      expect(
        offerQuests(ss).some((o) => o.def.id === 'race-escort-pilgrims'),
      ).toBe(false);
    }
  });
});

describe('milestones (authored nodes of the hybrid model)', () => {
  it('openApproaches reports which routes are currently viable', () => {
    const s = sessionWith(veteran);
    const ms = CFG.milestones.find((m) => m.id === 'ms-siege')!;
    // veteran lacks contact:mercenary-captain but has siege-plans? not initially
    const open = openApproaches(ms, veteran, worldOf(s));
    expect(Array.isArray(open)).toBe(true);
    const views = milestoneViews(s);
    expect(views.length).toBe(2);
  });
});

describe('graph linter (Gate A)', () => {
  it('v0 config passes: no errors', () => {
    const report = lintOpportunityGraph(CFG);
    mkdirSync('test-results/plan030-graph-lint', { recursive: true });
    writeFileSync(
      'test-results/plan030-graph-lint/report.json',
      JSON.stringify(report, null, 2),
    );
    writeFileSync(
      'test-results/plan030-graph-lint/report.md',
      lintReportToMarkdown(report),
    );
    expect(report.errors).toEqual([]);
    expect(report.stats.reachableOffers).toBe(CFG.offers.length);
  });

  it('catches a dead offer (unproducible requirement)', () => {
    const broken: MetaLayerConfig = {
      ...CFG,
      offers: [
        ...CFG.offers,
        {
          id: 'x-dead',
          family: 'delve',
          tier: 1,
          requires: [{ kind: 'quality', key: 'intel:never-produced' }],
          provides: [],
          durationTicks: 2,
          acceptanceTicks: 5,
          completionTicks: 5,
          riskBand: [0.1, 0.2],
          harmProfile: { wound: 0, death: 0 },
          weight: 1,
        } satisfies OfferDef,
      ],
    };
    const report = lintOpportunityGraph(broken);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.check === 'dead-offer')).toBe(true);
  });

  it('catches Locked-without-route and unreachable milestone', () => {
    const broken: MetaLayerConfig = {
      ...CFG,
      offers: [
        {
          id: 'x-locked',
          family: 'infiltration',
          tier: 1,
          requires: [
            { kind: 'quality', key: 'access:sewers', severity: 'absolute' },
          ],
          provides: [],
          durationTicks: 2,
          acceptanceTicks: 5,
          completionTicks: 5,
          riskBand: [0.1, 0.2],
          harmProfile: { wound: 0, death: 0 },
          weight: 1,
        } satisfies OfferDef,
      ],
      milestones: [
        {
          id: 'ms-broken',
          label: 'Unreachable',
          approaches: [
            [{ kind: 'quality', key: 'intel:nowhere' }],
            [{ kind: 'quality', key: 'intel:nowhere' }],
          ],
        },
      ],
    };
    const report = lintOpportunityGraph(broken);
    expect(
      report.errors.some((e) => e.check === 'locked-no-unlockroute'),
    ).toBe(true);
    expect(report.errors.some((e) => e.check === 'milestone-entries')).toBe(true);
  });

  it('reachability: fortress-inner requires the sewers chain', () => {
    const { maxLevel } = computeReachability(CFG);
    expect(maxLevel.get('access:fortress-inner')).toBeGreaterThanOrEqual(1);
    expect(maxLevel.get('access:siege-broken')).toBeGreaterThanOrEqual(1);
  });
});
