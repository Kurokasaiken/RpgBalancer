/**
 * questJourneyAuthored.test.ts — PLAN-053 T-004 authored-content E2E.
 *
 * Drives the REAL goblin scenario + the REAL authored `fasi` config
 * (`QUEST_POIS` → `resolveQuestJourneyLaunchSpec`) through the full
 * journey lifecycle: andata leg fills while the frontier is the road,
 * the svolgimento engine takes over at `gob-esplora`, the first
 * ritorno-attributed node is the phase boundary (verdict frozen, journal
 * switches leg), the return beats open on their pins over the reversed
 * route, and arrival settles the frozen verdict. `forceDie` pins every
 * roll — this test is about routing/phase semantics, not combat odds.
 */
import { describe, expect, it } from 'vitest';
import { QUEST_POIS } from '@/balancing/config/idleVillage/quests/questPois';
import { scenarioForQuest, createScenarioInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import {
  createRun,
  matureReady,
  resolveJourneyRunDecision,
  submitCommand,
  advanceJourneyRun,
  ENGINE_SCHEMA_VERSION,
  type QuestRunState,
  type ScenarioInstance,
} from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import { resolveQuestJourneyLaunchSpec } from '@/ui/idleVillage/quests/questJourneyAuthoring';
import { runPhaseStatus, settleIfArrived } from '@/ui/idleVillage/quests/questJourneyEngine';
import { journeyFasiOf, faseAt } from '@/ui/idleVillage/quests/questJourney';

const TICKS_PER_DAY = 5;
const LAUNCH = 1_000;
const SEED = 7;

/* A strong, padded party — the journey semantics under test, not the odds. */
const PARTY: LabMember[] = [
  { id: 'm1', name: 'Lead', role: 'leader', hp: 200, stats: { str: 90, con: 90, agi: 80, perc: 90, int: 80, cha: 50 } },
  { id: 'm2', name: 'Two', role: 'member', hp: 200, stats: { str: 90, con: 90, agi: 80, perc: 80, int: 70, cha: 50 } },
];

const POI = QUEST_POIS.find((p) => p.id === 'poi-goblin')!;
const NODE_TICKS = POI.ticksPerNode;
const TRAVEL_TICKS = journeyFasiOf(POI)!.travelDays * TICKS_PER_DAY;

let instanceSeq = 0;

/** Fresh authored instance (unique id per launch — the registry is global). */
function authoredInstance(): ScenarioInstance {
  const scenario = scenarioForQuest(POI.questId)!;
  const inst = createScenarioInstance(scenario, { dangerScale: 1, rewardScale: 1 });
  return { ...inst, instanceId: `qsi-authored-e2e-${(instanceSeq += 1)}` };
}

/** Resolve + launch the way `useQuestExpeditionSession.send` does. */
function launchAuthored(): QuestRunState {
  const instance = authoredInstance();
  const journey = resolveQuestJourneyLaunchSpec({
    poi: POI,
    nodes: instance.nodes,
    startNode: instance.startNode,
    origin: { x: 2120, y: 1414 },
    ticksPerDay: TICKS_PER_DAY,
    nodeTicks: NODE_TICKS,
    runSeed: SEED,
    engineSchemaVersion: ENGINE_SCHEMA_VERSION,
    scenarioHash: instance.scenarioHash,
    launchedAtTick: LAUNCH,
  });
  expect(journey).not.toBeNull();
  return createRun({
    party: { members: PARTY },
    seed: SEED,
    questId: POI.questId,
    scenarioInstance: instance,
    clock: { nodeTicks: NODE_TICKS, startTick: LAUNCH },
    journey: journey!,
  });
}

/** One driver tick — the `syncClock` pair (journey scheduler, then mature). */
function tick(run: QuestRunState, t: number): void {
  advanceJourneyRun(run, t);
  matureReady(run, t);
}

/** Player input routing — mirrors `useQuestRun.choose`. */
function choose(run: QuestRunState, optionId: string, t: number, forceDie = 95): void {
  if (run.journey?.journal.parkedNodeId) {
    resolveJourneyRunDecision(run, optionId, t, { forceDie });
  } else {
    submitCommand(run, optionId, { tick: t, forceDie });
  }
}

/** Walk until the frontier is interactive (waiting AND ready) or the run
 *  ends — bounded. Returns the tick at which input is legal. */
function driveToWaitingOrEnd(run: QuestRunState, from: number, span = 400): number {
  for (let t = from; t <= from + span; t += 1) {
    tick(run, t);
    if (run.ended) return t;
    /* A parked chain node is still not committable until its own readyAt
     * (the march slot) — wait for it like a normal waiting frontier. */
    if (run.journey?.journal.parkedNodeId && run.frontier.readyAt <= t) return t;
    if (run.frontier.status === 'waiting' && run.frontier.readyAt <= t) return t;
  }
  throw new Error(`driveToWaitingOrEnd stalled at ${JSON.stringify({ node: run.nodeId, frontier: run.frontier, fase: run.journey?.journal.currentFase })}`);
}

describe('authored journey — poi-goblin end to end', () => {
  it('andata → svolgimento (gob-esplora) → boundary → ritorno chain → settled', () => {
    const run = launchAuthored();
    const journal = () => run.journey!.journal;

    /* --- andata: the road is the frontier, the marker walks ------------ */
    tick(run, LAUNCH + TRAVEL_TICKS - 1);
    expect(journal().currentFase).toBe('andata');
    expect(faseAt(run.journey!.snapshot, journal()).routeProgress).toBeLessThan(1);
    tick(run, LAUNCH + TRAVEL_TICKS);
    expect(journal().currentFase).toBe('svolgimento');
    expect(run.nodeId).toBe('gob-esplora'); // the authored svolgimento entry
    expect(run.frontier.status).toBe('waiting');
    let now = LAUNCH + TRAVEL_TICKS;

    /* --- svolgimento: plain engine, clock by nodeTicks ------------------ */
    // F1 ground check → accampamento.
    now = driveToWaitingOrEnd(run, now + 1);
    choose(run, 'gob-cerca-tracce', now);
    now = driveToWaitingOrEnd(run, now + 1);
    expect(run.nodeId).toBe('gob-accampamento');
    // F3 assault → F4 combat (waiting; 5 turns pinned by forceDie).
    choose(run, 'gob-via-assalto', now);
    now = driveToWaitingOrEnd(run, now + 1);
    expect(run.nodeId).toBe('gob-combattimento');
    for (let i = 0; i < 5 && !run.ended; i += 1) {
      submitCommand(run, 'fight-turn', { tick: (now += NODE_TICKS), forceDie: 95 });
    }
    // Cleared → esplora-extra; survivors → incalzare → let them flee.
    now = driveToWaitingOrEnd(run, now + 1);
    if (run.nodeId === 'gob-incalzare') {
      choose(run, 'gob-lascia-fuggire', now);
      now = driveToWaitingOrEnd(run, now + 1);
    }
    expect(run.nodeId).toBe('gob-esplora-extra');

    /* --- boundary: the first ritorno node freezes the verdict ---------- */
    choose(run, 'gob-fermati', now); // option.next = 'gob-ritorno' (fase ritorno)
    expect(run.ended).toBe(false);
    expect(journal().currentFase).toBe('ritorno');
    expect(run.terminalKind).toBe('contentCompleteAtPoi');
    expect(run.verdictAtPoi).toBeDefined();
    expect(run.frontier.readyAt).toBe(Number.MAX_SAFE_INTEGER); // road sentinel
    expect(settleIfArrived(run)).toBeNull();

    /* --- ritorno: pins fire on the reversed route ----------------------- */
    // 'gob-ritorno' pinned at .2 → opens as a pending beat mid-leg.
    now = driveToWaitingOrEnd(run, now + 1);
    // The ambush chain lands the party on the encircled choice (inherited pin).
    expect(journal().parkedNodeId).toBe('gob-agguato-scelta');
    expect(faseAt(run.journey!.snapshot, journal()).parked).toBe(true);
    // Stand and fight → the last combat, then 'gob-fine' (pin 1.0).
    choose(run, 'gob-ultima-mischia', now);
    now = driveToWaitingOrEnd(run, now + 1);
    expect(run.nodeId).toBe('gob-ultimo-scontro');
    expect(journal().parkedNodeId).toBe('gob-ultimo-scontro');
    for (let i = 0; i < 6 && !run.ended && journal().parkedNodeId; i += 1) {
      now = Math.max(journal().processedUpToTick, run.frontier.readyAt, journal().parkedAtTick! + NODE_TICKS);
      resolveJourneyRunDecision(run, 'fight-turn', now, { forceDie: 95 });
    }

    /* --- arrival: fill 100% + beats drained → settled once -------------- */
    for (let t = now + 1; t <= now + 400 && !run.ended; t += 1) tick(run, t);
    expect(run.ended).toBe(true);
    expect(run.terminalKind).toBe('returnWithSurvivors');
    expect(run.lastFase).toBe('ritorno');
    expect(run.settledAtTick).not.toBeNull();
    expect(run.outcome).toBe(run.verdictAtPoi); // the frozen verdict lands
    expect(settleIfArrived(run)).toEqual({ atTick: run.settledAtTick });
    expect(runPhaseStatus(run).status).toBe('settled');
    // The whole return chain was walked, not skipped.
    for (const id of ['gob-ritorno', 'gob-agguato', 'gob-agguato-scelta', 'gob-ultimo-scontro', 'gob-fine']) {
      expect(run.visitedNodes).toContain(id);
    }
  });

  it('legacy POIs keep the pre-journey lifecycle (no sentinel, no journal)', () => {
    const legacyPoi = { ...POI } as typeof POI;
    delete (legacyPoi as Partial<typeof POI>).fasi;
    const instance = authoredInstance();
    const run = createRun({
      party: { members: PARTY },
      seed: SEED,
      questId: POI.questId,
      scenarioInstance: instance,
      clock: { nodeTicks: NODE_TICKS, startTick: LAUNCH },
    });
    expect(run.journey).toBeUndefined();
    expect(run.nodeId).toBe('gob-esplora'); // scenario start, no andata leg
    expect(run.frontier.status).toBe('waiting');
  });
});
