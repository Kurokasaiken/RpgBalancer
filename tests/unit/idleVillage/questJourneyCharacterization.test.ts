/**
 * PLAN-053 T-002 — characterization suite: golden snapshots of the legacy
 * (`fasi === null`) run surface, captured BEFORE any journey-engine change.
 *
 * Contract (plan §8): the suite runs on every commit; a diff here is a
 * behavioural change on non-journey runs and must fail loudly. Goldens may
 * be regenerated only with an explicit list of changed expectations in the
 * PR — never silently (`vitest -u` requires the same PR note).
 *
 * What is frozen, per scripted run:
 * - the frontier journal — every engine commit (tick, nodeId, kind,
 *   frontier status, readyAt) in path order;
 * - the poiView slice the map marker consumes — questStatus, quantized halo
 *   fraction, halo status, decisionWaiting — plus `mapQuestPoiView` output
 *   (the medallion contract);
 * - the full terminal run record (journal/settlement fields included) and
 *   the settlement marker sequence + derived plan;
 * - the persisted-run byte surface: a mid-run legacy record serialized,
 *   revived and re-projected — old-version saves must project identically
 *   (D-6: no mid-flight migration).
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
import { questHaloProgress } from '@/ui/idleVillage/questS1Lab/questSchedule';
import { QUEST_HALO_STEPS, questPoiById, type QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { mapQuestPoiView, type MapQuestPoiView } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import {
  settleRun,
  type SettlementMarker,
  type SettlementPlan,
} from '@/ui/idleVillage/quests/questSettlement';
import { GOBLIN_PRESETS, ROVINE_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const NODE_TICKS = 10;
const START_TICK = 100;
const SEED = 42;

/* ------------------------------------------------------------------ */
/* poiView — the serializable slice of useQuestExpeditionSession        */
/* ------------------------------------------------------------------ */

type QuestStatus = 'available' | 'in_progress' | 'completed' | 'failed';

/**
 * Mirrors the `poiView` derivation of `useQuestExpeditionSession`
 * (useQuestExpeditionSession.tsx §halo/poiView): same questStatus mapping,
 * same QUEST_HALO_STEPS quantisation, same decisionWaiting flag, same
 * marker view via `mapQuestPoiView`. Kept inline so the golden freezes the
 * CONTRACT, not the hook's React plumbing.
 */
function poiViewSlice(
  run: QuestRunState | null,
  poi: QuestPoi,
  nowTick: number,
): {
  questStatus: QuestStatus;
  haloFraction: number;
  haloStatus: string | null;
  decisionWaiting: boolean;
  marker: MapQuestPoiView;
} {
  const halo = run ? questHaloProgress(run, poi, nowTick) : null;
  const haloFraction = Math.round((halo?.fraction ?? 0) * QUEST_HALO_STEPS) / QUEST_HALO_STEPS;
  const questStatus: QuestStatus = !run
    ? 'available'
    : run.ended
      ? run.outcome === 'reward' || run.outcome === 'survived'
        ? 'completed'
        : 'failed'
      : 'in_progress';
  return {
    questStatus,
    haloFraction,
    haloStatus: halo?.status ?? null,
    decisionWaiting: Boolean(run && !run.ended && run.frontier.status === 'waiting'),
    marker: mapQuestPoiView(questStatus, haloFraction, undefined, poi.tier ?? 'normal'),
  };
}

/* ------------------------------------------------------------------ */
/* Scripted drive — one trace per run                                   */
/* ------------------------------------------------------------------ */

interface JournalEntry {
  tick: number;
  nodeId: string;
  kind: string | undefined;
  frontierStatus: string;
  readyAt: number;
}

interface Trace {
  journal: JournalEntry[];
  views: { tick: number; view: ReturnType<typeof poiViewSlice> }[];
  terminal: QuestRunState;
}

/**
 * Drives the run with the same clock discipline as the D-K schedule suite:
 * pending frontiers mature exactly at `readyAt`, waiting frontiers resolve
 * at `max(tick, readyAt)` with `pick` choosing the option. Records the
 * frontier journal AND the poiView slice at every commit tick — the two
 * surfaces T-003 must not disturb on `fasi === null` runs.
 */
function traceRun(
  questId: QuestId,
  presetId: string,
  poi: QuestPoi,
  pick: (state: QuestRunState, options: ReturnType<typeof availableOptions>) => string,
  maxSteps = 400,
): Trace {
  const state = createRun(presetId, SEED, questId, undefined, { nodeTicks: NODE_TICKS, startTick: START_TICK });
  const journal: JournalEntry[] = [];
  const views: Trace['views'] = [];
  let tick = state.launchedAtTick ?? START_TICK;
  const record = (t: number) => {
    journal.push({
      tick: t,
      nodeId: state.nodeId,
      kind: nodesFor(state)[state.nodeId]?.kind,
      frontierStatus: state.frontier.status,
      readyAt: state.frontier.readyAt,
    });
    views.push({ tick: t, view: poiViewSlice(state, poi, t) });
  };
  record(tick);
  for (let i = 0; i < maxSteps && !state.ended; i += 1) {
    const f = state.frontier;
    if (f.status === 'pending') {
      tick = f.readyAt;
      matureReady(state, tick);
    } else {
      const options = availableOptions(state).filter((o) => !o.disabled);
      if (options.length === 0) break;
      tick = Math.max(tick, f.readyAt);
      submitCommand(state, pick(state, options), { tick });
    }
    record(tick);
  }
  return { journal, views, terminal: state };
}

/** First enabled option, unless the script names a specific one per node. */
const scripted =
  (script: Record<string, string>) =>
  (state: QuestRunState, options: ReturnType<typeof availableOptions>): string => {
    const want = script[state.nodeId];
    const hit = options.find((o) => o.id === want);
    return (hit ?? options[0]).id;
  };

/**
 * Settles a terminal run with in-memory deps, returning everything the
 * journal recorded: the persisted marker sequence (settling → settled),
 * each applied plan, and the final marker. Deterministic — `nowTick` is
 * pinned to the scripted clock.
 */
async function settleTrace(
  run: QuestRunState,
  nowTick: number,
): Promise<{ persisted: SettlementMarker[]; applied: SettlementPlan[]; marker: SettlementMarker; settlement: QuestRunState['settlement'] }> {
  const persisted: SettlementMarker[] = [];
  const applied: SettlementPlan[] = [];
  const marker = await settleRun(run, {
    persistRun: (m) => {
      persisted.push(m);
    },
    applyToStore: (plan) => {
      applied.push(plan);
    },
    nowTick: () => nowTick,
    questTitle: 'Characterization quest',
  });
  run.settlement = marker;
  return { persisted, applied, marker, settlement: run.settlement };
}

/* ------------------------------------------------------------------ */
/* Golden snapshots                                                     */
/* ------------------------------------------------------------------ */

describe('PLAN-053 T-002 — legacy run characterization (fasi === null)', () => {
  const goblin = questPoiById('poi-goblin')!;
  const rovine = questPoiById('poi-rovine')!;

  it('every shipped POI is still journey-free — the frozen surface IS the legacy one', () => {
    expect(goblin.fasi).toBeUndefined();
    expect(rovine.fasi).toBeUndefined();
  });

  it('goblin — complete path: journal, poiView timeline, terminal record, settlement', async () => {
    /* Stop at the extra loot node, stand and fight at the ambush. */
    const trace = traceRun('goblin', GOBLIN_PRESETS[0].id, goblin, scripted({ 'gob-esplora-extra': 'gob-fermati', 'gob-agguato-scelta': 'gob-ultima-mischia' }));
    expect(trace.terminal.ended).toBe(true);
    const settled = await settleTrace(trace.terminal, START_TICK + 10_000);
    expect({ journal: trace.journal, views: trace.views, terminal: trace.terminal, settled }).toMatchSnapshot();
  });

  it('goblin — abandon the trophy at the ambush: second outcome class frozen', async () => {
    const trace = traceRun('goblin', GOBLIN_PRESETS[0].id, goblin, scripted({ 'gob-esplora-extra': 'gob-fermati', 'gob-agguato-scelta': 'gob-molla-trofeo' }));
    expect(trace.terminal.ended).toBe(true);
    const settled = await settleTrace(trace.terminal, START_TICK + 10_000);
    expect({ journal: trace.journal, views: trace.views, terminal: trace.terminal, settled }).toMatchSnapshot();
  });

  it('rovine — deep path: journal, poiView timeline, terminal record, settlement', async () => {
    const trace = traceRun('rovine', ROVINE_PRESETS[0].id, rovine, scripted({ 'rv-checkpoint': 'rv-continua' }));
    expect(trace.terminal.ended).toBe(true);
    const settled = await settleTrace(trace.terminal, START_TICK + 10_000);
    expect({ journal: trace.journal, views: trace.views, terminal: trace.terminal, settled }).toMatchSnapshot();
  });

  it('persisted old-version run: serialize → revive → poiView byte-identical (D-6)', () => {
    /* A legacy record has no journey fields — the serialized surface is the
     * contract. Revive via plain JSON (the PersistenceService payload) and
     * verify the projection is unchanged byte for byte. */
    const state = createRun(GOBLIN_PRESETS[0].id, SEED, 'goblin', undefined, { nodeTicks: NODE_TICKS, startTick: START_TICK });
    const revived = JSON.parse(JSON.stringify(state)) as QuestRunState;
    const before = poiViewSlice(revived, goblin, START_TICK + 37);
    /* Re-project on the live state at the same tick — must be identical. */
    const after = poiViewSlice(state, goblin, START_TICK + 37);
    expect(before).toStrictEqual(after);
    expect({ persistedRecord: revived, view: before }).toMatchSnapshot();
  });
});
