/**
 * R-253 #4 — TimeBar checkpoints adapt to the REAL phase set.
 *
 * Director (2026-10-22): «la barra che si riempie non si adegua come numero
 * di fasi o come lunghezza se viene creato una nuova fase in +, deve farlo».
 * Root cause: `questPhaseCheckpoints` enumerated markers only over
 * `[0, beats.length)` — a node authored on a beat index the label list does
 * not cover (a NEW phase) produced no marker and no segment the moment the
 * path reached it. Fix: visited out-of-range beats earn their checkpoint
 * (the live denominator `questDurationTicks` already adapts on reach);
 * unvisited out-of-range beats stay phantom-free (unreachable branch).
 */
import { describe, expect, it } from 'vitest';
import {
  createRun,
  nodesFor,
  registerScenarioInstance,
  type QuestRunState,
  type ScenarioInstance,
} from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import { questPhaseCheckpoints } from '@/ui/idleVillage/questS1Lab/questSchedule';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';

const PRESET = GOBLIN_PRESETS[0].id;
const BEATS = GOBLIN_SCENARIO.beats;

/** Run whose instance carries an EXTRA node on a beat index beyond
 *  `beats.length` — the "new phase" the authoring never labelled. */
function runWithExtraBeat(): { run: QuestRunState; extraNodeId: string; extraBeat: number } {
  const extraBeat = BEATS.length; // first index the label list does not cover
  const extraNodeId = 'gob-fase-extra';
  const nodes: Record<string, QuestNode> = {
    ...GOBLIN_SCENARIO.nodes,
    [extraNodeId]: {
      id: extraNodeId,
      kind: 'info',
      title: 'Extra phase node',
      body: 'A phase authored beyond the label list.',
      beat: extraBeat,
      fase: 'ritorno',
      next: 'gob-fine',
    },
  };
  const instance: ScenarioInstance = {
    instanceId: 'qsi-r253-extra-beat',
    questId: 'goblin',
    scenarioHash: 'r253-test',
    nodes,
  };
  registerScenarioInstance(instance);
  const run = createRun(PRESET, 42, 'goblin');
  run.scenarioInstanceId = instance.instanceId;
  return { run, extraNodeId, extraBeat };
}

describe('questPhaseCheckpoints — adaptive phase set (R-253 #4)', () => {
  // INV:R-253-timebar-adaptive-phases — a phase authored beyond
  // `beats.length` earns its TimeBar checkpoint the moment the path
  // reaches it; the marker count adapts, the segment fractions
  // redistribute.
  it('a VISITED beat beyond beats.length earns a checkpoint', () => {
    const { run, extraNodeId, extraBeat } = runWithExtraBeat();
    expect(nodesFor(run)[extraNodeId]?.beat).toBe(extraBeat);

    const before = questPhaseCheckpoints(run, BEATS, 0, 0);
    const beforeCount = before.length;

    run.visitedNodes.push(extraNodeId);
    const after = questPhaseCheckpoints(run, BEATS, extraBeat, 0.5);

    expect(after.length).toBe(beforeCount + 1);
    const extra = after.find((c) => c.beat === extraBeat);
    expect(extra).toBeDefined();
    /* last marker, the active frontier, a graceful fallback label */
    expect(extra!.fraction).toBe(1);
    expect(extra!.current).toBe(true);
    expect(extra!.label).toBe(`Phase ${extraBeat + 1}`);
  });

  // INV:R-253-timebar-adaptive-phases — an out-of-range beat only
  // reachable on an UNWALKED branch stays phantom-free: the bar does not
  // reserve markers for phases the party never enters.
  it('an UNVISITED out-of-range beat creates no marker', () => {
    const { run, extraBeat } = runWithExtraBeat();
    const checkpoints = questPhaseCheckpoints(run, BEATS, 0, 0);
    expect(checkpoints.some((c) => c.beat === extraBeat)).toBe(false);
  });

  // INV:R-253-timebar-adaptive-phases — the fractions redistribute over
  // the enlarged phase set (markers stay strictly ordered and end at 1).
  it('marker fractions stay ordered and end at 1 after a phase appears', () => {
    const { run, extraNodeId } = runWithExtraBeat();
    run.visitedNodes.push(extraNodeId);
    const checkpoints = questPhaseCheckpoints(run, BEATS, 1, 0.4);
    const fractions = checkpoints.map((c) => c.fraction);
    for (let i = 1; i < fractions.length; i += 1) {
      expect(fractions[i]).toBeGreaterThan(fractions[i - 1]);
    }
    expect(fractions[fractions.length - 1]).toBe(1);
  });
});
