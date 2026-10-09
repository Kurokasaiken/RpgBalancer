/**
 * questS1Lab/useQuestRun — drives one authored quest run outside the lab
 * (R-106: the running-quest window on /game; PLAN-025 T-004/T-005: the v27
 * frontier is live here). Same engine as the lab (`createRun` /
 * `submitCommand` / `matureReady`), plus the per-phase record the window's
 * phase tiles read. No astrolabe cinematic here: the window is the compact
 * view, the verdict lands as text.
 *
 * Frontier contract: `choose` resolves ONE command and stops at the next
 * frontier; `syncClock(tick)` matures pending timed nodes — the caller passes
 * the game tick, so a paused game pauses the quest and a late open catches up
 * deterministically. Runs persist via PersistenceService (schema-stamped).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { loadData, saveData, clearData } from '@/shared/persistence/PersistenceService';
// `useHealing` is an engine action, not a React hook: aliased so the hooks lint rule reads it right.
import {
  availableOptions,
  createRun,
  drinkPotion,
  ENGINE_SCHEMA_VERSION,
  matureReady,
  nodesFor,
  submitCommand,
  useHealing as applyHealing,
  type QuestId,
  type QuestRunState,
} from './questRun';
import { emptyPhase, recordAction, snapshotRun, type PhaseRecord } from './questPhaseRecord';
import { beatMark, projectBeats, type BeatMark, type QuestBeat } from './beatSequencer';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { createQuestRunAdapter } from '@/ui/idleVillage/questTheatre/questRunAdapter';
import type { TheatreAdapter } from '@/ui/idleVillage/questTheatre/theatreContract';

const BAG_FLAGS: ReadonlySet<string> = new Set(QUEST_STASH.items.map((item) => item.flag));

/** Persisted envelope: schema-stamped, run + phase records only. */
interface QuestRunSave {
  engineSchemaVersion: number;
  run: QuestRunState;
  phases: PhaseRecord[];
}

export interface QuestRunApi {
  run: QuestRunState | null;
  /** Phases in the order they were entered; the last one is the current phase. */
  phases: PhaseRecord[];
  /** `seed`: fixed seed for reproducible runs (playtests, bug reports).
   *  `nodeTicks`/`startTick`: the caller's clock — omitted = instant maturation. */
  start: (presetId: string, opts?: { loadout?: string[]; seed?: number; nodeTicks?: number; startTick?: number }) => void;
  /** `useConsumable`: whether an armed bag item may boost the resolving check —
   *  the player's call, never a silent default (R-106 playtest). */
  choose: (optionId: string, opts?: { useConsumable?: boolean }) => void;
  /** Advance the committed frontier: matured timed nodes resolve, the run
   *  stops at the first node needing the player (v27 catch-up). */
  syncClock: (tick: number) => void;
  /** Bag actions usable at a decision: the healing kit and the potion. */
  useHealing: () => void;
  drinkPotion: () => void;
  clear: () => void;
  /** Theatre read-model over this run (PLAN-025 T-006/T-007): the same engine
   *  truth, projected for theatre-shaped consumers. Stable instance — its
   *  commandId dedupe survives re-renders. */
  adapter: TheatreAdapter;
  /** Committed-but-unpresented moments since the last window seen state
   *  (PLAN-025 T-008). Append-only per commit; the window's beat cursor
   *  replays them one at a time and the queue resets on start/clear. */
  beats: QuestBeat[];
}

const beatOf = (run: QuestRunState) => nodesFor(run)[run.nodeId]?.beat ?? 0;

export function useQuestRun(questId: QuestId): QuestRunApi {
  const [run, setRun] = useState<QuestRunState | null>(null);
  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  /** Committed beats still unseen by the window (PLAN-025 T-008). */
  const [beats, setBeats] = useState<QuestBeat[]>([]);
  /** Position in the run's commit history the last projection consumed. */
  const markRef = useRef<BeatMark | null>(null);
  /** Last tick the caller synced — commands resolve at this tick. */
  const tickRef = useRef(0);
  const saveKey = `idleVillage.questRun.${questId}`;

  const persist = useCallback(
    (nextRun: QuestRunState | null, nextPhases: PhaseRecord[]) => {
      if (!nextRun) {
        void clearData(saveKey);
        return;
      }
      const payload: QuestRunSave = { engineSchemaVersion: ENGINE_SCHEMA_VERSION, run: nextRun, phases: nextPhases };
      void saveData(saveKey, payload);
    },
    [saveKey],
  );

  // Reload: restore the committed frontier — same schema only, never
  // reinterpreted; the caller's first syncClock performs the catch-up.
  useEffect(() => {
    void loadData<QuestRunSave | null>(saveKey, null).then((payload) => {
      if (payload?.engineSchemaVersion !== ENGINE_SCHEMA_VERSION || !payload.run) return;
      setRun(payload.run);
      setPhases(payload.phases.length ? payload.phases : [emptyPhase(beatOf(payload.run))]);
      tickRef.current = payload.run.frontier.startedAt;
      /* The restored frontier is "already presented" — the beat queue starts
       *  empty; the first syncClock re-marks and projects only new commits. */
      markRef.current = beatMark(payload.run);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveKey]);

  const start = useCallback(
    (presetId: string, opts?: { loadout?: string[]; seed?: number; nodeTicks?: number; startTick?: number }) => {
      const fresh = createRun(
        presetId,
        opts?.seed ?? ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0),
        questId,
        opts?.loadout,
        { nodeTicks: opts?.nodeTicks, startTick: opts?.startTick },
      );
      if (opts?.startTick != null) tickRef.current = opts.startTick;
      const first = [emptyPhase(beatOf(fresh))];
      setRun(fresh);
      setPhases(first);
      setBeats([]);
      markRef.current = beatMark(fresh);
      persist(fresh, first);
    },
    [questId, persist],
  );

  /** Applies one mutation and folds its effects into the current phase. */
  const act = useCallback(
    (apply: (state: QuestRunState) => QuestRunState, label: string | undefined) => {
      if (!run || run.ended) return;
      // The engine mutates the run in place: snapshot first, and call it outside a
      // state updater so StrictMode's double-invoked updaters can't apply it twice.
      const before = snapshotRun(run);
      const mark = markRef.current ?? beatMark(run);
      const next = apply(run);
      markRef.current = beatMark(next);
      const projected = projectBeats(mark, next, {
        maxBeats: DEFAULT_GAME_FRAME_CONFIG.questWindow.beats.maxQueue,
      });
      if (projected.length) setBeats((q) => [...q, ...projected]);
      const nextBeat = beatOf(next);
      let nextPhases: PhaseRecord[] = phases;
      setPhases((current) => {
        const list = current.length ? [...current] : [emptyPhase(beatOf(next))];
        list[list.length - 1] = recordAction(list[list.length - 1], before, next, label, BAG_FLAGS);
        if (!next.ended && nextBeat !== list[list.length - 1].beat) list.push(emptyPhase(nextBeat));
        nextPhases = list;
        return list;
      });
      const shown = { ...next };
      setRun(shown);
      persist(next, nextPhases);
    },
    [run, phases, persist],
  );

  const choose = useCallback(
    (optionId: string, opts?: { useConsumable?: boolean }) => {
      if (!run) return;
      const label = availableOptions(run).find((o) => o.id === optionId)?.label;
      act((state) => submitCommand(state, optionId, { useConsumable: opts?.useConsumable, tick: tickRef.current }), label);
    },
    [run, act],
  );

  const syncClock = useCallback(
    (tick: number) => {
      tickRef.current = tick;
      // Nothing to do unless a timed frontier has actually matured.
      if (!run || run.ended || run.frontier.status !== 'pending' || tick < run.frontier.readyAt) return;
      act((state) => matureReady(state, tick), undefined);
    },
    [run, act],
  );

  // Bag actions resolve no check: clear the per-action queues so the window doesn't
  // replay the previous verdict, and let the item's own log line be "what happened".
  const bagAction = useCallback(
    (apply: (state: QuestRunState) => QuestRunState) =>
      act((state) => {
        const next = apply({ ...state, checkQueue: [], recentHarms: [] });
        next.lastEvent = next.log[next.log.length - 1]?.text ?? next.lastEvent;
        return next;
      }, undefined),
    [act],
  );
  const heal = useCallback(() => bagAction(applyHealing), [bagAction]);
  const potion = useCallback(() => bagAction((state) => drinkPotion(state, 'hasPozione')), [bagAction]);

  // Theatre adapter (PLAN-025 T-007): stable across renders so its commandId
  // dedupe set never resets; reads the latest run/tick through refs, and every
  // engine mutation goes through `act` so phases and persistence stay honest.
  const runRef = useRef<QuestRunState | null>(null);
  runRef.current = run;
  const actRef = useRef(act);
  actRef.current = act;
  const adapter = useMemo<TheatreAdapter>(
    () =>
      createQuestRunAdapter(() => runRef.current, {
        getTick: () => tickRef.current,
        onMutate: (apply) => actRef.current(apply, undefined),
      }),
    [],
  );

  const clear = useCallback(() => {
    setRun(null);
    setPhases([]);
    setBeats([]);
    markRef.current = null;
    persist(null, []);
  }, [persist]);

  return useMemo(
    () => ({ run, phases, start, choose, syncClock, useHealing: heal, drinkPotion: potion, clear, adapter, beats }),
    [run, phases, start, choose, syncClock, heal, potion, clear, adapter, beats],
  );
}
