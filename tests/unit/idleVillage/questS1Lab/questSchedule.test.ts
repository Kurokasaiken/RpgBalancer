/**
 * PLAN-019-S2.4 T-0 — D-K spike: prova eseguibile che il gating nodi a
 * schedule («readyAt = arrivo sul percorso effettivo + nodeDuration») e la
 * durata viva dell'halo vivono come LAYER sopra `matureReady`, senza toccare
 * il motore (I-3).
 *
 * (a) Firma del layer: `questSchedule.ts` — read-only su QuestRunState;
 *     il clock è del caller (game tick su /game); lo stato persistito delle
 *     finestre resta `state.frontier` del motore; catch-up/reload =
 *     `matureReady` invariato; il denominatore è `visitedNodes` (append-only)
 *     × `ticksPerNode` vs `estimatedDurationTicks` normativo.
 * (b) Parità: le finestre osservate su goblin+rovine coincidono con la
 *     semantica dichiarata — ogni pending ha `readyAt = startedAt + nodeTicks`
 *     e le catene maturate ripartono dal `readyAt` precedente (pre-pagamento).
 *     NESSUNA deroga I-3 necessaria: il motore non è stato toccato in
 *     semantica — `launchedAtTick` è un campo additivo di sola proiezione.
 */
import { describe, expect, it } from 'vitest';
import {
  availableOptions,
  createRun,
  matureReady,
  nodesFor,
  submitCommand,
  type QuestId,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { questDurationTicks, questElapsedTicks, questHaloProgress, phaseTileBeats } from '@/ui/idleVillage/questS1Lab/questSchedule';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';
import { GOBLIN_PRESETS, ROVINE_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const NODE_TICKS = 10;
const START_TICK = 100;

interface FrontierObservation {
  nodeId: string;
  kind: string | undefined;
  startedAt: number;
  readyAt: number;
}

/** Drive the run one engine step at a time on a caller-controlled clock,
 *  recording every pending frontier the engine commits. `pick` chooses the
 *  option at 'waiting' frontiers; pending frontiers mature exactly at their
 *  `readyAt` so the schedule is observable window by window. */
function driveWithSchedule(
  state: QuestRunState,
  pick: (state: QuestRunState, options: ReturnType<typeof availableOptions>) => string,
  maxSteps = 400,
): { observations: FrontierObservation[]; ticks: number[] } {
  const observations: FrontierObservation[] = [];
  const ticks: number[] = [];
  let tick = state.launchedAtTick ?? 0;
  let lastCommittedAt = tick;
  for (let i = 0; i < maxSteps && !state.ended; i += 1) {
    const f = state.frontier;
    if (f.status === 'pending') {
      observations.push({ nodeId: state.nodeId, kind: nodesFor(state)[state.nodeId]?.kind, startedAt: f.startedAt, readyAt: f.readyAt });
      // The window must be «arrival + nodeTicks» along the actual path: the
      // arrival is either the command tick or the previous matured readyAt.
      expect(f.startedAt).toBe(lastCommittedAt);
      expect(f.readyAt - f.startedAt).toBe(NODE_TICKS);
      tick = f.readyAt;
      lastCommittedAt = f.readyAt; // matured chains pre-pay: next node starts HERE
      ticks.push(tick);
      matureReady(state, tick);
    } else {
      const options = availableOptions(state).filter((o) => !o.disabled);
      if (options.length === 0) break;
      submitCommand(state, pick(state, options), { tick });
      lastCommittedAt = tick;
    }
  }
  return { observations, ticks };
}

/** Default completing policy: first enabled option, except at F6 where the
 *  caller's strategy decides (loop vs stop). */
const greedy =
  (strategy: Record<string, string> = {}) =>
  (state: QuestRunState, options: ReturnType<typeof availableOptions>): string => {
    const want = strategy[state.nodeId];
    const hit = options.find((o) => o.id === want);
    return (hit ?? options[0]).id;
  };

function startRun(questId: QuestId, presetId: string): QuestRunState {
  return createRun(presetId, 42, questId, undefined, { nodeTicks: NODE_TICKS, startTick: START_TICK });
}

describe('D-K schedule — layer above matureReady, engine untouched', () => {
  it('goblin: every pending window is «arrival + nodeTicks» on the real path, chains pre-pay', () => {
    const state = startRun('goblin', GOBLIN_PRESETS[0].id);
    const { observations } = driveWithSchedule(state, greedy({ 'gob-esplora-extra': 'gob-fermati' }));
    // The goblin path commits at least the return/ambush timed beats.
    expect(observations.length).toBeGreaterThanOrEqual(1);
    for (const obs of observations) {
      expect(obs.readyAt - obs.startedAt).toBe(NODE_TICKS);
      expect(['info', 'harm']).toContain(obs.kind);
    }
    // Chained pending nodes start at the previous readyAt, not at look time.
    for (let i = 1; i < observations.length; i += 1) {
      expect(observations[i].startedAt).toBe(observations[i - 1].readyAt);
    }
  });

  it('rovine: same schedule contract on the second scenario', () => {
    const state = startRun('rovine', ROVINE_PRESETS[0].id);
    // Force the deep path: 'rv-continua' at the checkpoint crosses the only
    // timed beat (rv-attrito, harm). Greedy elsewhere.
    const { observations } = driveWithSchedule(state, greedy({ 'rv-checkpoint': 'rv-continua' }));
    expect(observations.length).toBeGreaterThanOrEqual(1);
    expect(observations.some((o) => o.nodeId === 'rv-attrito')).toBe(true);
    for (const obs of observations) {
      expect(obs.readyAt - obs.startedAt).toBe(NODE_TICKS);
    }
  });

  it('halo keeps filling while the frontier WAITS for the player (D-J)', () => {
    const poi = questPoiById('poi-goblin')!;
    const state = startRun('goblin', GOBLIN_PRESETS[0].id);
    // Start node is a choice → waiting. Elapsed must still advance.
    expect(state.frontier.status).toBe('waiting');
    const early = questHaloProgress(state, poi, START_TICK + 30);
    const late = questHaloProgress(state, poi, START_TICK + 200);
    expect(late.elapsedTicks).toBeGreaterThan(early.elapsedTicks);
    expect(late.fraction).toBeGreaterThan(early.fraction);
    expect(late.status).toBe('filling');
  });

  it('long absence never resolves a decision — matureReady stops at the first waiting frontier', () => {
    const state = startRun('goblin', GOBLIN_PRESETS[0].id);
    const nodeBefore = state.nodeId;
    const steps = driveWithSchedule(state, greedy({ 'gob-esplora-extra': 'gob-fermati' }));
    expect(nodeBefore).toBe('gob-inizio');
    // Replay: at any waiting frontier, a huge tick does not advance the run.
    const again = startRun('goblin', GOBLIN_PRESETS[0].id);
    matureReady(again, START_TICK + 1_000_000);
    expect(again.nodeId).toBe('gob-inizio');
    expect(again.frontier.status).toBe('waiting');
    expect(steps.observations.length).toBeGreaterThanOrEqual(1);
  });

  it('extra node extends the duration THE MOMENT it is reached (F6 loop) and adds a phase beat', () => {
    const poi = questPoiById('poi-goblin')!;
    // High-HP synthetic party (object form): the F6 tolls must not end the
    // run before the path outgrows the authored estimate.
    const member = (id: string, role: 'leader' | 'member' | 'bodyguard') => ({
      id,
      name: id,
      role,
      hp: 900,
      stats: { str: 80, con: 80, agi: 80, perc: 80, int: 80, cha: 80 },
    });
    const state = createRun({
      party: { members: [member('t-lead', 'leader'), member('t-m1', 'member'), member('t-m2', 'member'), member('t-bg', 'bodyguard')] },
      seed: 42,
      questId: 'goblin',
      clock: { nodeTicks: NODE_TICKS, startTick: START_TICK },
    });
    const nodes = nodesFor(state);
    const beatOf = (id: string) => nodes[id]?.beat ?? 0;
    const baseDuration = questDurationTicks(state, poi);
    expect(baseDuration).toBe(poi.estimatedDurationTicks);

    let extendedAt: number | null = null;
    let guard = 0;
    while (!state.ended && guard++ < 60) {
      if (state.frontier.status === 'pending') {
        matureReady(state, state.frontier.readyAt);
        continue;
      }
      const options = availableOptions(state).filter((o) => !o.disabled);
      if (options.length === 0) break;
      // Push the F6 loot loop until the path exceeds the authored estimate.
      const pick =
        state.nodeId === 'gob-esplora-extra' && state.visitedNodes.length <= poi.expectedPathNodes
          ? 'gob-fruga'
          : options.find((o) => o.id === 'gob-fermati')?.id ?? options[0].id;
      const beatsBefore = phaseTileBeats(state, beatOf).length;
      submitCommand(state, pick, { tick: state.launchedAtTick! + guard * 5 });
      if (extendedAt === null && state.visitedNodes.length > poi.expectedPathNodes) {
        extendedAt = state.visitedNodes.length;
        // Denominator grows exactly by the extra nodes' nodeDurations.
        expect(questDurationTicks(state, poi)).toBe(state.visitedNodes.length * poi.ticksPerNode);
        expect(questDurationTicks(state, poi)).toBeGreaterThan(poi.estimatedDurationTicks);
      }
      // Tiles never shrink; a new beat appears when the path reaches it.
      expect(phaseTileBeats(state, beatOf).length).toBeGreaterThanOrEqual(beatsBefore);
    }
    expect(extendedAt, 'the F6 loop must push the path beyond expectedPathNodes').not.toBeNull();
    // Keep looping once more: every further node adds its nodeDuration.
    const beforeExtra = questDurationTicks(state, poi);
    if (!state.ended && state.nodeId === 'gob-esplora-extra') {
      submitCommand(state, 'gob-fruga', { tick: state.launchedAtTick! + guard * 5 });
      expect(questDurationTicks(state, poi)).toBeGreaterThanOrEqual(beforeExtra + poi.ticksPerNode);
    }
  });

  it('halo states: pieno-in-attesa ≠ concluso — outcome only when the engine ends the run', () => {
    const poi = questPoiById('poi-goblin')!;
    const state = startRun('goblin', GOBLIN_PRESETS[0].id);
    // Waiting frontier far past the normative duration: full but NOT concluded.
    const over = questHaloProgress(state, poi, START_TICK + poi.estimatedDurationTicks + 500);
    expect(over.fraction).toBe(1);
    expect(over.status).toBe('pieno-in-attesa');
    // Drive to the end; only then the halo is 'concluso'.
    driveWithSchedule(state, greedy({ 'gob-esplora-extra': 'gob-fermati' }));
    if (state.ended) {
      expect(questHaloProgress(state, poi, START_TICK + 1_000_000).status).toBe('concluso');
    }
  });
});
