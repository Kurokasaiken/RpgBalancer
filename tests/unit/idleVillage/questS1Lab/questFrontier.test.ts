/**
 * questFrontier — v27 temporal frontier (PLAN-025 T-004).
 *
 * The committed frontier is the single gameplay truth: 'waiting' nodes need a
 * player command, 'pending' nodes mature only on the caller's tick. Reference
 * scenario A→B→CHOICE: gob-ritorno (info, pending) → gob-agguato (harm,
 * pending) → gob-agguato-scelta (choice, waiting).
 */
import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  availableOptions,
  createRun,
  ENGINE_SCHEMA_VERSION,
  matureReady,
  maturableNodeCount,
  nodeDurationTicks,
  submitCommand,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const TICKS = 100;
const PARTY = GOBLIN_PRESETS[0].id;

/** Fresh timed run: every maturable node takes 100 caller ticks. */
const timedRun = () => createRun(PARTY, 42, 'goblin', undefined, { nodeTicks: TICKS, startTick: 0 });

/** Teleport helper: park the run on a choice node as a waiting frontier. */
const atChoice = (state: QuestRunState, nodeId: string, tick = 0) => {
  state.nodeId = nodeId;
  state.visitedNodes.push(nodeId);
  state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick };
};

describe('quest frontier (v27)', () => {
  it('starts waiting at the first choice, stamped with schema + tick config', () => {
    const run = timedRun();
    expect(run.frontier).toEqual({ status: 'waiting', startedAt: 0, readyAt: 0 });
    expect(run.engineSchemaVersion).toBe(ENGINE_SCHEMA_VERSION);
    expect(run.nodeTicks).toBe(TICKS);
    expect(maturableNodeCount('goblin')).toBeGreaterThan(0);
    expect(nodeDurationTicks('goblin', 2 * 480)).toBeGreaterThan(0);
  });

  it('a command resolves ONLY the current node and stops at the next frontier', () => {
    const run = timedRun();
    submitCommand(run, 'gob-partenza', { tick: 0 });
    expect(run.nodeId).toBe('gob-esplora');
    expect(run.frontier.status).toBe('waiting');
    // The frontier bumped once — one committed advance.
    expect(run.frontierVersion).toBe(1);
  });

  it('a CHECK: outcome resolves inline as consequence, then stops at the decision', () => {
    const run = timedRun();
    submitCommand(run, 'gob-partenza', { tick: 0 });
    submitCommand(run, 'gob-cerca-tracce', { tick: 10 });
    expect(run.checkQueue).toHaveLength(1);
    // The check is a consequence, not a frontier: the run stops at the choice
    // the verdict routed to (gob-accampamento or gob-bottino-scelta).
    expect(['gob-accampamento', 'gob-bottino-scelta']).toContain(run.nodeId);
    expect(run.frontier.status).toBe('waiting');
  });

  it('pending frontiers reject commands and hide options', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    expect(run.nodeId).toBe('gob-ritorno');
    expect(run.frontier.status).toBe('pending');
    expect(run.frontier.readyAt).toBe(TICKS);
    expect(availableOptions(run)).toEqual([]);
    const v = run.frontierVersion;
    submitCommand(run, 'gob-fermati', { tick: 50 });
    expect(run.frontierVersion).toBe(v);
    expect(run.nodeId).toBe('gob-ritorno');
  });

  it('the F7 relief reads as a frontier state — its body is lastEvent while pending', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    // The relief beat exists now: before, the ambush overwrote it in the same click.
    expect(run.lastEvent).toContain('fischiettare');
    expect(run.party.every((m) => m.hp === m.maxHp)).toBe(true);
  });

  it('matures pending nodes only when their readyAt passes — ambush damage lands at maturation', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    matureReady(run, TICKS - 1);
    expect(run.nodeId).toBe('gob-ritorno');
    matureReady(run, TICKS);
    // Matured: arrived at the ambush — pending again, scene showing, no damage yet.
    expect(run.nodeId).toBe('gob-agguato');
    expect(run.frontier.status).toBe('pending');
    expect(run.party.every((m) => m.hp === m.maxHp)).toBe(true);
    matureReady(run, 2 * TICKS - 1);
    expect(run.nodeId).toBe('gob-agguato');
    matureReady(run, 2 * TICKS);
    // The ambush toll lands, then the run stops at the ambush choice.
    expect(run.party.some((m) => m.hp < m.maxHp)).toBe(true);
    expect(run.nodeId).toBe('gob-agguato-scelta');
    expect(run.frontier.status).toBe('waiting');
    expect(availableOptions(run).length).toBeGreaterThan(0);
  });

  it('catch-up is deterministic: a late tick processes matured phases in sequence and stops at the bivio', () => {
    const stepwise = timedRun();
    atChoice(stepwise, 'gob-esplora-extra');
    submitCommand(stepwise, 'gob-fermati', { tick: 0 });
    matureReady(stepwise, TICKS);
    matureReady(stepwise, 2 * TICKS);

    const late = timedRun();
    atChoice(late, 'gob-esplora-extra');
    submitCommand(late, 'gob-fermati', { tick: 0 });
    matureReady(late, 10 * TICKS); // opened the window much later

    expect(late.nodeId).toBe(stepwise.nodeId);
    expect(late.frontier.status).toBe('waiting');
    expect(late.party.map((m) => m.hp)).toEqual(stepwise.party.map((m) => m.hp));
    expect(late.rngCalls).toBe(stepwise.rngCalls);
  });

  it('a clean extermination routes the matured info node to the end, skipping the ambush', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    run.flags.push('sterminio');
    run.objectiveDone = true;
    submitCommand(run, 'gob-fermati', { tick: 0 });
    matureReady(run, TICKS);
    expect(run.ended).toBe(true);
    expect(run.outcome).toBe('reward');
  });

  it('legacy parity: applyChoice === submitCommand + instant catch-up, same seed', () => {
    const play = (legacy: boolean): QuestRunState => {
      const run = createRun(PARTY, 7, 'goblin');
      const steps = ['gob-partenza', 'gob-cerca-tracce', 'gob-via-assalto', 'fight-turn', 'fight-turn', 'fight-turn', 'fight-turn', 'fight-turn'];
      for (const opt of steps) {
        if (run.ended) break;
        if (legacy) applyChoice(run, opt);
        else {
          submitCommand(run, opt, { tick: 0 });
          matureReady(run, Number.MAX_SAFE_INTEGER);
        }
      }
      return run;
    };
    const a = play(true);
    const b = play(false);
    expect(b.nodeId).toBe(a.nodeId);
    expect(b.rngCalls).toBe(a.rngCalls);
    expect(b.party.map((m) => [m.hp, m.dead, m.wounded])).toEqual(a.party.map((m) => [m.hp, m.dead, m.wounded]));
    expect(b.flags).toEqual(a.flags);
    expect(b.ended).toBe(a.ended);
    expect(b.log.map((l) => l.text)).toEqual(a.log.map((l) => l.text));
  });
});
