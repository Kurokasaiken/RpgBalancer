/**
 * questJourneyEngine.test.ts — PLAN-053 T-003 acceptance battery (§11).
 *
 * Drives a journey-enabled run end-to-end on a synthetic `gen` scenario
 * instance: andata beats (waiting choice + pending info/check), an
 * emergent svolgimento, and ritorno beats (waiting combat + pending info)
 * over the reversed route. Legacy `fasi === null` behaviour is frozen by
 * `questJourneyCharacterization.test.ts` — this file asserts the new
 * lifecycle only: watermark, drain-at-T, park accounting, phase split
 * (outcome vs settlement), typed terminals, encumbered loot.
 *
 * Timing map (total = travelDays × ticksPerDay = 120 ticks):
 *   andata pins: mercante .30→t1036 | ferry .60→t1072 | ford .95→t1114 | end t1120
 *   ritorno pins: ambush .50→+60 | road .80→+96 | end +120
 */
import { describe, expect, it } from 'vitest';
import {
  attachQuestJourney,
  advanceJourneyRun,
  createRun,
  matureReady,
  resolveJourneyRunDecision,
  scenarioInstanceById,
  submitCommand,
  ENGINE_SCHEMA_VERSION,
  type QuestRunState,
  type ScenarioInstance,
} from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabMember, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  faseAt,
  travelTicksConsumed,
  type JourneyJournal,
} from '@/ui/idleVillage/quests/questJourney';
import {
  runPhaseStatus,
  settleIfArrived,
  type JourneyBeatPlan,
} from '@/ui/idleVillage/quests/questJourneyEngine';
import type { QuestJourneyLaunchSpec } from '@/ui/idleVillage/quests/questJourneyEngine';

/* ------------------------------------------------------------------ */
/* Fixture                                                             */
/* ------------------------------------------------------------------ */

const TICKS_PER_DAY = 60;
const TRAVEL_DAYS = 2;
const TOTAL = TICKS_PER_DAY * TRAVEL_DAYS; // 120
const NODE_TICKS = 10;
const LAUNCH = 1000;
const SEED = 42;

const PARTY: LabMember[] = [
  { id: 'r1', name: 'A', role: 'leader', hp: 80, stats: { str: 70, con: 60, agi: 40, perc: 40, int: 30, cha: 30 } },
  { id: 'r2', name: 'B', role: 'member', hp: 60, stats: { str: 55, con: 50, agi: 45, perc: 40, int: 35, cha: 30 } },
];

/** Lethal variant: every counterattack deletes a member — deterministic
 *  wipe path for the ritorno-ambush and andata-ambush cases. */
const lethalAmbush = (nodeId: string, next: string): QuestNode => ({
  id: nodeId,
  kind: 'combat',
  title: 'Ambush',
  body: 'Shapes in the treeline — they were waiting.',
  combat: {
    turns: 5,
    enemies: 99,
    attackStats: ['str'],
    killPerWin: 0,
    killPerBigwin: 0,
    hitDamage: 9999,
    escalateProfile: false,
    nextCleared: next,
    nextSurvivors: next,
  },
});

function buildNodes(lethal: boolean): Record<string, QuestNode> {
  return {
    'j-mercante': {
      id: 'j-mercante',
      kind: 'choice',
      title: 'A cart on the road',
      body: 'A merchant waves from the roadside.',
      options: [
        { id: 'trade', label: 'Trade', detail: '', next: 'j-ferry' },
        { id: 'pass', label: 'Pass on', detail: '', next: 'j-ferry' },
      ],
    },
    'j-ferry': { id: 'j-ferry', kind: 'info', title: 'The ferry', body: 'The river crossing.' },
    'j-ford': {
      id: 'j-ford',
      kind: 'check',
      title: 'The ford',
      body: 'Cold water over loose stone.',
      stats: ['con'],
      upfrontDamage: { amount: 4 },
      verdictTable: { else: { goto: 'j-ford-done' } },
    },
    'j-ford-done': { id: 'j-ford-done', kind: 'info', title: 'Across', body: 'Soaked but standing.' },
    'j-poi': {
      id: 'j-poi',
      kind: 'choice',
      title: 'The site',
      body: 'The place you came for.',
      options: [
        { id: 'take', label: 'Take the relic', detail: '', next: 'CHECK:j-grab' },
        { id: 'leave', label: 'Leave it', detail: '', next: 'j-end' },
      ],
    },
    'j-grab': {
      id: 'j-grab',
      kind: 'check',
      title: 'The relic',
      body: 'Heavy, cold, wanted.',
      stats: ['str'],
      verdictTable: { else: { setObjective: 'done', takeLoot: ['relic'], goto: 'j-end' } },
    },
    'j-end': { id: 'j-end', kind: 'end', title: 'Done', body: 'It is done here.' },
    'j-ambush': lethal
      ? lethalAmbush('j-ambush', 'j-road')
      : {
          id: 'j-ambush',
          kind: 'combat',
          title: 'Ambush',
          body: 'Shapes in the treeline.',
          combat: {
            turns: 2,
            enemies: 1,
            attackStats: ['str'],
            killPerWin: 1,
            killPerBigwin: 1,
            hitDamage: 3,
            escalateProfile: false,
            nextCleared: 'j-road',
            nextSurvivors: 'j-road',
          },
        },
    'j-road': { id: 'j-road', kind: 'info', title: 'The last mile', body: 'The village in sight.' },
  };
}

const FASE_PLANS = (lethal: boolean) => ({
  andata: [
    { nodeId: 'j-mercante', pin: 0.3, kind: 'waiting', durationTicks: 0 },
    { nodeId: 'j-ferry', pin: 0.6, kind: 'pending', durationTicks: NODE_TICKS },
    { nodeId: 'j-ford', pin: 0.95, kind: 'pending', durationTicks: 20 },
  ] as JourneyBeatPlan[],
  ritorno: [
    { nodeId: 'j-ambush', pin: 0.5, kind: 'waiting', durationTicks: 0 },
    { nodeId: 'j-road', pin: 0.8, kind: 'pending', durationTicks: NODE_TICKS },
  ] as JourneyBeatPlan[],
});

let instanceSeq = 0;

/** Fresh run + attached journey — a new ScenarioInstance per call (the
 *  registry is process-level and idempotent by id). */
function launch(lethal = false, opts?: { plans?: ReturnType<typeof FASE_PLANS> }): QuestRunState {
  const instance: ScenarioInstance = {
    instanceId: `qsi-journey-test-${(instanceSeq += 1)}`,
    questId: 'gen',
    scenarioHash: 'journey-test-v1',
    nodes: buildNodes(lethal),
    startNode: 'j-poi',
  };
  const spec: QuestJourneyLaunchSpec = {
    travelDays: TRAVEL_DAYS,
    ticksPerDay: TICKS_PER_DAY,
    origin: { x: 0, y: 0 },
    destination: { x: 100, y: 0 },
    fasePlans: opts?.plans ?? FASE_PLANS(lethal),
    svolgimentoEntryNodeId: 'j-poi',
    runSeed: SEED,
    engineSchemaVersion: ENGINE_SCHEMA_VERSION,
    scenarioHash: instance.scenarioHash,
    launchedAtTick: LAUNCH,
  };
  return createRun({
    party: { members: PARTY },
    seed: SEED,
    questId: 'gen',
    scenarioInstance: instance,
    clock: { nodeTicks: NODE_TICKS, startTick: LAUNCH },
    journey: spec, // the CreateRunInput launch seam — attachQuestJourney runs inside
  });
}

/** One driver tick — the same pair `syncClock` applies: journey scheduler
 *  then frontier maturation. */
function tick(run: QuestRunState, t: number): void {
  advanceJourneyRun(run, t);
  matureReady(run, t);
}

function journal(run: QuestRunState): JourneyJournal {
  return run.journey!.journal;
}

/** Drive svolgimento: resolve the POI choice (the option chains into a
 *  check, whose verdictTable routes to the end node — all in the same
 *  submitCommand call). Caller passes t ≥ frontier.readyAt. */
function playSvolgimento(run: QuestRunState, t: number, optionId = 'take'): number {
  submitCommand(run, optionId, { tick: t });
  matureReady(run, t);
  return t;
}

/* ------------------------------------------------------------------ */
/* Travel clock + park                                                 */
/* ------------------------------------------------------------------ */

describe('journey advance — clock, pins, park', () => {
  it('route fills with time; faseAt reports andata progress', () => {
    const run = launch(false, {
      plans: {
        andata: [{ nodeId: 'j-ferry', pin: 0.6, kind: 'pending', durationTicks: NODE_TICKS }],
        ritorno: [],
      },
    });
    advanceJourneyRun(run, LAUNCH + 60);
    const v = faseAt(run.journey!.snapshot, journal(run));
    expect(v.fase).toBe('andata');
    expect(v.routeProgress).toBeCloseTo(0.5, 5);
    expect(v.faseProgress).toBeCloseTo(0.5, 5);
    expect(v.parked).toBe(false);
    expect(run.ended).toBe(false);
  });

  it('a waiting pin parks the marker; time passes, route does not', () => {
    const run = launch();
    advanceJourneyRun(run, LAUNCH + 36); // mercante pin (.3 × 120)
    const j = journal(run);
    expect(j.parkedNodeId).toBe('j-mercante');
    expect(j.parkedAtTick).toBe(LAUNCH + 36);
    expect(run.frontier.status).toBe('waiting');
    expect(run.nodeId).toBe('j-mercante');
    const v = faseAt(run.journey!.snapshot, j);
    expect(v.parked).toBe(true);
    expect(v.pendingDecision).toBe(true);
    expect(v.routeProgress).toBeCloseTo(0.3, 5);

    // Parked time is clock time: elapsed grows, route stays at the pin.
    advanceJourneyRun(run, LAUNCH + 60);
    expect(travelTicksConsumed(j)).toBe(36);
    expect(j.accumulatedParkedTicks).toBe(24);
    expect(journal(run).parkedNodeId).toBe('j-mercante');
    expect(faseAt(run.journey!.snapshot, j).routeProgress).toBeCloseTo(0.3, 5);
  });

  it('resolving the parked beat unparks; a pinned `next` DEFERS to its crossing', () => {
    const run = launch();
    advanceJourneyRun(run, LAUNCH + 36); // park — frontier readyAt = +46
    advanceJourneyRun(run, LAUNCH + 60); // parked 24 ticks
    resolveJourneyRunDecision(run, 'pass', LAUNCH + 60);

    const j = journal(run);
    expect(j.parkedNodeId).toBeNull();
    expect(j.accumulatedParkedTicks).toBe(24);
    expect(j.processedUpToTick).toBe(LAUNCH + 60);
    // option.next → 'j-ferry' is pinned at .6 — not reached yet: deferred.
    const ferry = j.beats.find((b) => b.nodeId === 'j-ferry')!;
    expect(ferry.openedAtTick).toBeNull();
    expect(run.frontier.readyAt).toBe(Number.MAX_SAFE_INTEGER); // travel sentinel

    // consumed froze at 36 during the park; .6 (72 travel ticks) crosses at
    // 1000 + 24 parked + 72 = 1096.
    advanceJourneyRun(run, LAUNCH + 96);
    expect(journal(run).beats.find((b) => b.nodeId === 'j-ferry')!.openedAtTick).toBe(LAUNCH + 96);
  });

  it('a pending beat opens at its pin and matures on ITS clock — marker passes', () => {
    const run = launch();
    advanceJourneyRun(run, LAUNCH + 36); // mercante park
    resolveJourneyRunDecision(run, 'pass', LAUNCH + 50); // parked 14 ticks
    // consumed froze at 36 during park → .6 (72) crosses at 1000+14+72 = 1086.
    advanceJourneyRun(run, LAUNCH + 90); // consumed 76 — ferry open, maturing
    const j = journal(run);
    const ferry = j.beats.find((b) => b.nodeId === 'j-ferry')!;
    expect(ferry.openedAtTick).toBe(LAUNCH + 86);
    expect(ferry.resolvedAtTick).toBe(ferry.openedAtTick! + NODE_TICKS);
    expect(j.parkedNodeId).toBeNull(); // pending beats never park
    expect(travelTicksConsumed(j)).toBeGreaterThan(72); // marker passed the pin
    expect(ferry.appliedAtTick ?? null).toBeNull(); // not yet mature
    advanceJourneyRun(run, LAUNCH + 96); // scheduled maturation
    expect(j.beats.find((b) => b.nodeId === 'j-ferry')!.appliedAtTick).toBe(LAUNCH + 96);
  });
});

/* ------------------------------------------------------------------ */
/* Watermark + drain                                                   */
/* ------------------------------------------------------------------ */

describe('watermark + drain semantics', () => {
  it('t1 < processedUpToTick throws; t1 == processedUpToTick is a no-op', () => {
    const run = launch();
    advanceJourneyRun(run, LAUNCH + 50);
    expect(() => advanceJourneyRun(run, LAUNCH + 49)).toThrow(/watermark/);
    expect(() => advanceJourneyRun(run, LAUNCH + 50)).not.toThrow();
  });

  it('one big jump ≡ tick-by-tick (journal + run byte-identical)', () => {
    const a = launch();
    const b = launch();
    const target = LAUNCH + 90;
    advanceJourneyRun(a, target); // parks at the mercante inside the jump
    for (let t = LAUNCH + 1; t <= target; t += 1) advanceJourneyRun(b, t);
    expect(JSON.stringify(journal(a))).toBe(JSON.stringify(journal(b)));
    expect(journal(a).parkedNodeId).toBe(journal(b).parkedNodeId);
    expect(a.visitedNodes).toEqual(b.visitedNodes);
  });

  it('a single jump crosses two pending pins AND the fase boundary', () => {
    const run = launch(false, {
      plans: {
        andata: [
          { nodeId: 'j-ferry', pin: 0.4, kind: 'pending', durationTicks: 5 },
          { nodeId: 'j-ford', pin: 0.7, kind: 'pending', durationTicks: 5 },
        ],
        ritorno: [],
      },
    });
    // One jump over both pins (consumed: .4→48@1048, .7→84@1084) but still
    // inside andata — assert both beats opened AND applied mid-jump.
    advanceJourneyRun(run, LAUNCH + 90);
    const j = journal(run);
    for (const id of ['j-ferry', 'j-ford']) {
      const b = j.beats.find((x) => x.nodeId === id)!;
      expect(b.openedAtTick).not.toBeNull();
      expect(b.appliedAtTick).not.toBeNull();
    }
    // The jump continues past the boundary in a second call — the journal
    // keeps only the CURRENT fase's beats, so assert the transition itself.
    advanceJourneyRun(run, LAUNCH + TOTAL + 50);
    expect(journal(run).currentFase).toBe('svolgimento');
    expect(run.nodeId).toBe('j-poi');
    expect(run.frontier.status).toBe('waiting');
  });

  it('drain-at-T: a pending opened with duration 0 resolves in the same tick', () => {
    const run = launch(false, {
      plans: {
        andata: [{ nodeId: 'j-ferry', pin: 0.5, kind: 'pending', durationTicks: 0 }],
        ritorno: [],
      },
    });
    advanceJourneyRun(run, LAUNCH + 100);
    const b = journal(run).beats[0];
    expect(b.openedAtTick).toBe(LAUNCH + 60);
    expect(b.appliedAtTick).toBe(LAUNCH + 60); // same-tick drain
  });

  it('a pin at 1.0 resolves before svolgimento opens', () => {
    const run = launch(false, {
      plans: {
        andata: [{ nodeId: 'j-ferry', pin: 1.0, kind: 'pending', durationTicks: 5 }],
        ritorno: [],
      },
    });
    advanceJourneyRun(run, LAUNCH + TOTAL + 3);
    expect(journal(run).currentFase).toBe('andata'); // beat open, maturing
    advanceJourneyRun(run, LAUNCH + TOTAL + 5);
    expect(journal(run).currentFase).toBe('svolgimento');
  });

  it('endpointResolving: fill 100% while a pending beat is still maturing', () => {
    const run = launch(false, {
      plans: {
        andata: [{ nodeId: 'j-ferry', pin: 0.9, kind: 'pending', durationTicks: 30 }],
        ritorno: [],
      },
    });
    advanceJourneyRun(run, LAUNCH + TOTAL);
    const v = faseAt(run.journey!.snapshot, journal(run));
    expect(v.routeProgress).toBe(1);
    expect(v.endpointResolving).toBe(true);
    expect(v.parked).toBe(false);
    expect(v.pendingDecision).toBe(false);
    expect(journal(run).currentFase).toBe('andata'); // NOT yet svolgimento
    advanceJourneyRun(run, LAUNCH + TOTAL + 20);
    expect(journal(run).currentFase).toBe('svolgimento');
  });
});

/* ------------------------------------------------------------------ */
/* Lifecycle split — outcome vs settlement                            */
/* ------------------------------------------------------------------ */

describe('journey lifecycle — outcome/settlement split', () => {
  it('svolgimento end freezes the verdict and opens ritorno — run NOT ended', () => {
    const run = launch();
    // Reach the POI: park, resolve (past the frontier's readyAt), fill.
    advanceJourneyRun(run, LAUNCH + 36);
    resolveJourneyRunDecision(run, 'pass', LAUNCH + 60); // parked 24
    // Route end at 1000+24+120=1144; ford (.95 → consumed 114) opens at
    // 1138, matures +20 → boundary when all beats resolve.
    advanceJourneyRun(run, LAUNCH + 160);
    expect(journal(run).currentFase).toBe('svolgimento');
    expect(run.nodeId).toBe('j-poi');

    const tSvolEnd = LAUNCH + 160 + NODE_TICKS; // j-poi frontier readyAt
    playSvolgimento(run, tSvolEnd, 'take');

    // The verdict is frozen but the run is NOT over — the party walks home.
    expect(run.ended).toBe(false);
    expect(run.outcome).toBe('running');
    expect(run.verdictAtPoi).toBe('reward');
    expect(run.terminalKind).toBe('contentCompleteAtPoi');
    expect(run.outcomeResolvedAtTick).toBe(tSvolEnd);
    expect(run.settledAtTick ?? null).toBeNull();
    expect(journal(run).currentFase).toBe('ritorno');
    expect(runPhaseStatus(run)).toEqual({ status: 'returning', lastFase: 'ritorno' });
    expect(settleIfArrived(run)).toBeNull(); // still on the road
    expect(run.loot).toContain('relic'); // encumbered manifest travels
  });

  it('full E2E: andata → svolgimento → ritorno → arrival → settled once', () => {
    const run = launch();
    advanceJourneyRun(run, LAUNCH + 36);
    resolveJourneyRunDecision(run, 'pass', LAUNCH + 60); // parked 24
    advanceJourneyRun(run, LAUNCH + 160); // boundary → svolgimento entry
    const tSvol = LAUNCH + 160 + NODE_TICKS;
    playSvolgimento(run, tSvol, 'take');

    // Ritorno: the ambush combat parks the marker at .5 of the reversed route.
    advanceJourneyRun(run, tSvol + TOTAL); // parks mid-jump, watermark at t1
    expect(journal(run).parkedNodeId).toBe('j-ambush');
    // Fight until the frontier leaves the ambush node (combat resolves).
    // Turns must land at/after both the watermark and the frontier's
    // readyAt — the parked stretch already advanced the watermark.
    let t = Math.max(journal(run).processedUpToTick, journal(run).parkedAtTick! + NODE_TICKS);
    for (let i = 0; i < 10 && journal(run).parkedNodeId !== null; i += 1) {
      resolveJourneyRunDecision(run, 'fight-turn', t);
      t += 1;
    }
    expect(journal(run).parkedNodeId).toBeNull();
    advanceJourneyRun(run, tSvol + TOTAL + 200); // everything drains

    expect(run.ended).toBe(true);
    expect(run.outcome).toBe('reward'); // the frozen POI verdict lands
    expect(run.terminalKind).toBe('returnWithSurvivors');
    expect(run.lastFase).toBe('ritorno');
    expect(run.settledAtTick).not.toBeNull();
    expect(run.settledAtTick!).toBeGreaterThanOrEqual(tSvol + TOTAL);
    expect(run.loot).toContain('relic'); // encumbered → secured on arrival
    expect(runPhaseStatus(run).status).toBe('settled');
    // The settlement decision fires exactly at the arrival tick, and
    // repeated reads stay identical (idempotent — the journal key is the
    // persisted settlement marker upstream).
    expect(settleIfArrived(run)).toEqual({ atTick: run.settledAtTick });
    expect(settleIfArrived(run)).toEqual({ atTick: run.settledAtTick });
  });

  it('wipe in ritorno: verdict overridden, loot lost, settled in place, no XP', () => {
    const run = launch(true); // lethal ambush
    advanceJourneyRun(run, LAUNCH + 36);
    resolveJourneyRunDecision(run, 'pass', LAUNCH + 60);
    advanceJourneyRun(run, LAUNCH + 160);
    const tSvol = LAUNCH + 160 + NODE_TICKS;
    playSvolgimento(run, tSvol, 'take');
    expect(run.verdictAtPoi).toBe('reward');
    expect(run.loot).toContain('relic');

    advanceJourneyRun(run, tSvol + 60); // lethal ambush parks
    expect(journal(run).parkedNodeId).toBe('j-ambush');
    let t = Math.max(journal(run).processedUpToTick, journal(run).parkedAtTick! + NODE_TICKS);
    for (let i = 0; i < 10 && !run.ended; i += 1) {
      resolveJourneyRunDecision(run, 'fight-turn', t);
      t += 1;
    }
    expect(run.ended).toBe(true);
    expect(run.outcome).toBe('wipe');
    expect(run.terminalKind).toBe('wiped');
    expect(run.lastFase).toBe('ritorno');
    expect(run.loot).toEqual([]); // encumbered manifest dies with the party
    expect(run.settledAtTick).toBe(run.outcomeResolvedAtTick); // settle in place
    expect(settleIfArrived(run)).not.toBeNull();
    // PINNED Director-decision-due default: success at POI then wipe in
    // ritorno awards NO XP. The ruling PR updates this test in the same
    // commit as the semantics change.
    expect(run.xp).toBe(0);
    expect(runPhaseStatus(run)).toEqual({ status: 'wiped', lastFase: 'ritorno' });
  });

  it('wipe in andata is terminal immediately', () => {
    const run = launch(true, {
      plans: {
        andata: [{ nodeId: 'j-ambush', pin: 0.5, kind: 'waiting', durationTicks: 0 }],
        ritorno: [],
      },
    });
    advanceJourneyRun(run, LAUNCH + 60);
    expect(journal(run).parkedNodeId).toBe('j-ambush');
    let t = Math.max(journal(run).processedUpToTick, journal(run).parkedAtTick! + NODE_TICKS);
    for (let i = 0; i < 10 && !run.ended; i += 1) {
      resolveJourneyRunDecision(run, 'fight-turn', t);
      t += 1;
    }
    expect(run.ended).toBe(true);
    expect(run.outcome).toBe('wipe');
    expect(run.lastFase).toBe('andata');
    expect(runPhaseStatus(run).status).toBe('wiped');
  });

  it('wipe in svolgimento is terminal at the POI — no ritorno ever opens', () => {
    // The svolgimento check chains into a lethal combat: the party dies at
    // the site, the verdict never freezes, no return leg exists.
    const run = launch(false, { plans: { andata: [], ritorno: [] } });
    const inst = scenarioInstanceById(run.scenarioInstanceId!)!;
    inst.nodes['j-laststand'] = lethalAmbush('j-laststand', 'j-end');
    inst.nodes['j-grab'].verdictTable = { else: { goto: 'j-laststand' } };

    advanceJourneyRun(run, LAUNCH + TOTAL);
    const t = LAUNCH + TOTAL + NODE_TICKS;
    submitCommand(run, 'take', { tick: t }); // check → goto lethal combat
    expect(run.frontier.status).toBe('waiting');
    expect(run.nodeId).toBe('j-laststand');

    let fight = t + NODE_TICKS;
    for (let i = 0; i < 10 && !run.ended; i += 1) {
      submitCommand(run, 'fight-turn', { tick: fight });
      fight += 1;
    }
    expect(run.ended).toBe(true);
    expect(run.outcome).toBe('wipe');
    expect(run.terminalKind).toBe('wiped');
    expect(run.lastFase).toBe('svolgimento');
    expect(run.settledAtTick).toBe(run.outcomeResolvedAtTick);
    expect(run.journey!.journal.currentFase).toBe('svolgimento'); // never left
    expect(runPhaseStatus(run).status).toBe('wiped');
  });

  it('a return that costs a member still banks the verdict — dead stay dead', () => {
    // Deterministic single death in ritorno: a check beat whose authored
    // upfront toll exceeds one member's HP.
    const run = launch(false, {
      plans: {
        andata: [],
        ritorno: [
          { nodeId: 'j-ford', pin: 0.5, kind: 'pending', durationTicks: 5 },
        ],
      },
    });
    // Beef the ford toll up to a guaranteed kill via a rebuilt node map.
    const inst = scenarioInstanceById(run.scenarioInstanceId!)!;
    inst.nodes['j-ford'].upfrontDamage = { amount: 9999 };
    // svolgimento → verdict frozen.
    advanceJourneyRun(run, LAUNCH + TOTAL);
    const tSvol = LAUNCH + TOTAL + NODE_TICKS;
    playSvolgimento(run, tSvol, 'take');
    expect(run.verdictAtPoi).toBe('reward');
    // ritorno: the ford toll lands at its pin +5 ticks.
    advanceJourneyRun(run, tSvol + TOTAL + 10);
    expect(run.ended).toBe(true);
    expect(run.outcome).toBe('reward');
    expect(run.party.some((m) => m.dead)).toBe(true);
    expect(run.party.some((m) => !m.dead)).toBe(true);
    expect(run.loot).toContain('relic');
    expect(runPhaseStatus(run).status).toBe('settled');
  });
});

/* ------------------------------------------------------------------ */
/* Reload / revive determinism                                         */
/* ------------------------------------------------------------------ */

describe('hydration — journal round-trip', () => {
  it('reload while PARKED resumes identical', () => {
    const run = launch();
    advanceJourneyRun(run, LAUNCH + 36);
    advanceJourneyRun(run, LAUNCH + 50); // parked 14 ticks
    // The instance registry is process-level — the reload path re-registers
    // from the save payload; here the registration is already live.
    const ghost = JSON.parse(JSON.stringify(run)) as QuestRunState;
    advanceJourneyRun(run, LAUNCH + 70);
    advanceJourneyRun(ghost, LAUNCH + 70);
    expect(JSON.stringify(journal(ghost))).toBe(JSON.stringify(journal(run)));
  });

  it('reload in endpointResolving re-discovers the pending maturation', () => {
    const run = launch(false, {
      plans: {
        andata: [{ nodeId: 'j-ferry', pin: 0.9, kind: 'pending', durationTicks: 30 }],
        ritorno: [],
      },
    });
    advanceJourneyRun(run, LAUNCH + TOTAL);
    const ghost = JSON.parse(JSON.stringify(run)) as QuestRunState;
    advanceJourneyRun(ghost, LAUNCH + TOTAL + 20);
    expect(journal(ghost).currentFase).toBe('svolgimento');
  });
});

/* ------------------------------------------------------------------ */
/* Legacy runs — the fasi === null sentinel                            */
/* ------------------------------------------------------------------ */

describe('legacy runs (no journey attached)', () => {
  it('advance/status/settle are no-ops or legacy-shaped', () => {
    const run = createRun('fisico', SEED, 'goblin', undefined, { nodeTicks: NODE_TICKS, startTick: LAUNCH });
    expect(run.journey).toBeUndefined();
    expect(() => advanceJourneyRun(run, LAUNCH + 10)).not.toThrow(); // no-op
    expect(runPhaseStatus(run)).toEqual({ status: 'active', lastFase: null });
    expect(settleIfArrived(run)).toBeNull();
  });
});


