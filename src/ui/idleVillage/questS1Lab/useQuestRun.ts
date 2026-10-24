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
  flee,
  matureReady,
  nodesFor,
  normalizeRunOverlayIdentity,
  registerScenarioInstance,
  scenarioInstanceById,
  advanceJourneyRun,
  resolveJourneyRunDecision,
  submitCommand,
  useHealing as applyHealing,
  type CreateRunInput,
  type QuestId,
  type QuestRunState,
  type ScenarioInstance,
} from './questRun';
import { emptyPhase, recordAction, snapshotRun, type PhaseRecord } from './questPhaseRecord';
import type { SettlementMarker } from '@/ui/idleVillage/quests/questSettlement';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { beatMark, projectBeats, type BeatMark, type QuestBeat } from './beatSequencer';
import { publishQuestRun } from './questRunStore';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

const BAG_FLAGS: ReadonlySet<string> = new Set(QUEST_STASH.items.map((item) => item.flag));

/** Persisted envelope: schema-stamped, run + phase records + the frozen
 *  ScenarioInstance the run executes (S2.3 — the save never re-reads the
 *  current config; a payload without it is a legacy authored-map run,
 *  declared migration). */
interface QuestRunSave {
  engineSchemaVersion: number;
  run: QuestRunState;
  phases: PhaseRecord[];
  scenarioInstance?: ScenarioInstance;
}

export interface QuestRunApi {
  run: QuestRunState | null;
  /** Phases in the order they were entered; the last one is the current phase. */
  phases: PhaseRecord[];
  /** `seed`: fixed seed for reproducible runs (playtests, bug reports).
   *  `nodeTicks`/`startTick`: the caller's clock — omitted = instant maturation. */
  start: (
    presetOrInput: string | CreateRunInput,
    opts?: { loadout?: string[]; seed?: number; nodeTicks?: number; startTick?: number },
  ) => void;
  /** `useConsumable`: whether an armed bag item may boost the resolving check —
   *  the player's call, never a silent default (R-106 playtest). R-196: the
   *  window instead passes the per-item `armedFlags` it manages. */
  choose: (optionId: string, opts?: { useConsumable?: boolean }) => void;
  /** R-196: the bag flags the player illuminated in the belt. Check items boost
   *  the next check's preview and are consumed on its commit; action items fire
   *  on the next valid check/combat commit via `stepArmedActionItems`. */
  armedFlags: ReadonlySet<string>;
  /** Arm or disarm a held bag flag (toggle; no-op on flags not in `run.flags`
   *  and on passive items like the guardian banner). */
  toggleArmedFlag: (flag: string) => void;
  /** PLAN-084: push a discovery flag from a scene reveal (idempotent). */
  revealFlag: (flag: string) => void;
  /** Advance the committed frontier: matured timed nodes resolve, the run
   *  stops at the first node needing the player (v27 catch-up). */
  syncClock: (tick: number) => void;
  /** R-199: the player's «abandon quest» — routes through the engine's
   *  existing `flee` (outcome `fled`, secured loot kept, objective lost),
   *  not a second retreat model. Live-run only; no-op once ended. */
  abandon: () => void;
  /** Bag actions usable at a decision: the healing kit and the potion. */
  useHealing: () => void;
  drinkPotion: () => void;
  clear: () => void;
  /** Committed-but-unpresented moments since the last window seen state
   *  (PLAN-025 T-008). Append-only per commit; the window's beat cursor
   *  replays them one at a time and the queue resets on start/clear. */
  beats: QuestBeat[];
  /** R-242: presentation position inside `beats`, held by the queue's owner
   *  so a window remount (close→reopen) resumes at the held beat instead of
   *  replaying consumed beats. Reset alongside `beats` on start/clear. */
  beatCursorRef: { current: number };
  /** Settlement journal transitions (S2.5): stamps `settling`/`settled` on
   *  the run record and persists — bypasses `act` (no engine mutation, no
   *  beats; the frontier is terminal). No-op unless the run has ended. */
  applySettlement: (marker: SettlementMarker) => void;
  /** PLAN-040 T-005: raises `run.dismissedUpTo` to `checkSeq` and persists —
   *  the outcome toast's durable dismissal. Idempotent, never lowers the
   *  mark, works on ended runs too (same bypass class as applySettlement). */
  dismissOutcome: (checkSeq: number) => void;
}

const beatOf = (run: QuestRunState) => nodesFor(run)[run.nodeId]?.beat ?? 0;

export function useQuestRun(questId: QuestId): QuestRunApi {
  const [run, setRun] = useState<QuestRunState | null>(null);
  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  /** Committed beats still unseen by the window (PLAN-025 T-008). */
  const [beats, setBeats] = useState<QuestBeat[]>([]);
  /** R-196 per-item armed selection (`ReadonlySet<string>`): only flags still
   *  in `run.flags` stay armed — consumed items drop out on every commit. */
  const [armedFlags, setArmedFlags] = useState<ReadonlySet<string>>(() => new Set());
  /** Position in the run's commit history the last projection consumed. */
  const markRef = useRef<BeatMark | null>(null);
  /** R-242: presentation position inside `beats` — lives here (not in the
   *  window) so close→reopen resumes at the held beat instead of replaying
   *  beats the player already watched. */
  const beatCursorRef = useRef(0);
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
      const inst = nextRun.scenarioInstanceId ? scenarioInstanceById(nextRun.scenarioInstanceId) : undefined;
      if (inst) payload.scenarioInstance = inst;
      void saveData(saveKey, payload);
    },
    [saveKey],
  );

  // Reload: restore the committed frontier — same schema only, never
  // reinterpreted; the caller's first syncClock performs the catch-up.
  useEffect(() => {
    void loadData<QuestRunSave | null>(saveKey, null).then((payload) => {
      if (payload?.engineSchemaVersion !== ENGINE_SCHEMA_VERSION || !payload.run) return;
      /* Re-register the frozen instance BEFORE the run state lands —
       * `nodesFor` resolves it on the next read; no instance in the payload
       * = legacy authored-map run (declared migration). */
      if (payload.scenarioInstance) registerScenarioInstance(payload.scenarioInstance);
      /* PLAN-040 T-003a: backfill the overlay-identity fields (checkSeq /
       *  visitSeq / beatIndex / cursorVisitSeq / dismissedUpTo) on legacy
       *  saves — deterministic, never lowers the dismissed high-water mark. */
      normalizeRunOverlayIdentity(payload.run);
      setRun(payload.run);
      setPhases(payload.phases.length ? payload.phases : [emptyPhase(beatOf(payload.run))]);
      tickRef.current = payload.run.frontier.startedAt;
      /* The restored frontier is "already presented" — the beat queue starts
       *  empty; the first syncClock re-marks and projects only new commits. */
      markRef.current = beatMark(payload.run);
    });
  }, [saveKey]);

  /* PLAN-040 T-003a: publish every committed run state to the external
   *  store — the quest overlays are React siblings of the window (mounted in
   *  `#game-modal-root`) and subscribe to this instead of props. The null
   *  publish lives on UNMOUNT only: running it inside this effect's cleanup
   *  would blank the channel on every commit and remount held overlays. */
  useEffect(() => {
    publishQuestRun(questId, run);
  }, [questId, run]);
  useEffect(() => {
    return () => publishQuestRun(questId, null);
  }, [questId]);

  const start = useCallback(
    (
      presetOrInput: string | CreateRunInput,
      opts?: { loadout?: string[]; seed?: number; nodeTicks?: number; startTick?: number },
    ) => {
      const fresh =
        typeof presetOrInput === 'string'
          ? createRun(
              presetOrInput,
              opts?.seed ?? ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0),
              questId,
              opts?.loadout,
              { nodeTicks: opts?.nodeTicks, startTick: opts?.startTick },
            )
          : createRun({
              ...presetOrInput,
              questId: presetOrInput.questId ?? questId,
              seed: presetOrInput.seed ?? ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0),
              clock: presetOrInput.clock ?? { nodeTicks: opts?.nodeTicks, startTick: opts?.startTick },
            });
      /* The caller clock the launch was stamped on: string path reads
       * `opts.startTick`, object path `input.clock.startTick` — without this
       * the first `choose` before a `syncClock` would command at tick 0. */
      const startTick = typeof presetOrInput === 'string' ? opts?.startTick : presetOrInput.clock?.startTick;
      if (startTick != null) tickRef.current = startTick;
      const first = [emptyPhase(beatOf(fresh))];
      setRun(fresh);
      setPhases(first);
      setBeats([]);
      beatCursorRef.current = 0;
      /* R-196: the belt's armed selection starts from the config default —
       * `false` keeps the "nothing spent unasked" contract (R-106 playtest). */
      const held = new Set(fresh.flags);
      setArmedFlags(
        DEFAULT_GAME_FRAME_CONFIG.questWindow.consumablesArmedByDefault
          ? new Set(QUEST_STASH.items.filter((i) => i.kind === 'check' && held.has(i.flag)).map((i) => i.flag))
          : new Set(),
      );
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
      /* R-196: reconcile armed selection with the committed flags — consumed
       * items leave the belt AND the armed set in the same commit. */
      setArmedFlags((prev) => {
        const nextFlags = new Set(next.flags);
        if (![...prev].some((f) => !nextFlags.has(f))) return prev;
        return new Set([...prev].filter((f) => nextFlags.has(f)));
      });
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
      /* R-199: a frontier still inside its time slot is not committable —
       * bail BEFORE `act` so a rejected click can't leave a phantom choice
       * label in the phase record (the engine gate inside `submitCommand`
       * is the second line of defence for non-hook callers). */
      if (!run.ended && run.frontier.status === 'waiting' && tickRef.current < run.frontier.readyAt) return;
      const label = availableOptions(run).find((o) => o.id === optionId)?.label;
      /* R-196: pass the live armed set (re-read at call time — no stale
       * closure), filtered to flags the run still holds. A caller that passes
       * `useConsumable` explicitly (lab, Monte Carlo, legacy tests) keeps the
       * bag-level boolean semantics — the per-item set is the window's path. */
      const eff = new Set([...armedFlags].filter((f) => run.flags.includes(f)));
      /* PLAN-053: a parked journey beat resolves through the drain-at-T
       * path (park accounting + coincident-event drain), not a bare
       * `submitCommand` — outside a park the normal path applies. */
      const parked =
        run.journey !== undefined &&
        run.journey.journal.currentFase !== 'svolgimento' &&
        run.journey.journal.parkedNodeId !== null;
      /* The decision lands at the caller's tick, but never behind the
       * watermark — a click can arrive before this tick's syncClock ran. */
      const decisionTick = parked
        ? Math.max(tickRef.current, run.journey!.journal.processedUpToTick)
        : tickRef.current;
      act(
        (state) =>
          parked
            ? resolveJourneyRunDecision(state, optionId, decisionTick, {
                useConsumable: opts?.useConsumable,
                armedFlags: opts?.useConsumable === undefined ? eff : undefined,
              })
            : submitCommand(state, optionId, {
                useConsumable: opts?.useConsumable,
                tick: tickRef.current,
                armedFlags: opts?.useConsumable === undefined ? eff : undefined,
              }),
        label,
      );
    },
    [run, act, armedFlags],
  );

  /** R-196 belt toggle: arms or disarms one held check/action flag. Passive
   *  items (the guardian banner) and flags not in the bag are inert. */
  const toggleArmedFlag = useCallback(
    (flag: string) => {
      const item = QUEST_STASH.items.find((i) => i.flag === flag);
      if (!item || item.kind === 'passive' || !run?.flags.includes(flag)) return;
      setArmedFlags((prev) => {
        const next = new Set(prev);
        if (next.has(flag)) next.delete(flag);
        else next.add(flag);
        return next;
      });
    },
    [run],
  );

  /** PLAN-084: a scene reveal pushes a discovery flag into run.flags —
   *  inert unless a downstream node reads it (e.g. `revealedAmbush`). */
  const revealFlag = useCallback(
    (flag: string) => {
      if (!run || run.ended || run.flags.includes(flag)) return;
      const next = { ...run, flags: [...run.flags, flag] };
      setRun(next);
      persist(next, phasesRef.current);
    },
    [run, persist],
  );

  const syncClock = useCallback(
    (tick: number) => {
      tickRef.current = tick;
      if (!run || run.ended) return;
      /* PLAN-053: journey runs drive the discrete-event scheduler every
       * tick — pin crossings, park accounting, beat maturations, fase
       * boundaries — while the frontier clock still matures chained
       * pending nodes (inherited pins) and all of svolgimento. */
      if (run.journey) {
        /* Production clamp (artifact r011): a caller tick behind the
         * persisted watermark is a clock regression — skip with a
         * structured warning instead of the engine's dev-time throw. */
        if (tick < run.journey.journal.processedUpToTick) {
          console.warn('[questJourney] clock regression: syncClock tick behind processedUpToTick', {
            tick,
            processedUpToTick: run.journey.journal.processedUpToTick,
            fase: run.journey.journal.currentFase,
          });
          return;
        }
        act((state) => {
          advanceJourneyRun(state, tick);
          matureReady(state, tick);
          return state;
        }, undefined);
        return;
      }
      // Nothing to do unless a timed frontier has actually matured.
      if (run.frontier.status !== 'pending' || tick < run.frontier.readyAt) return;
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

  /* R-199: abandon is a real engine command (flee) — beats, phase records
   *  and persistence all follow the same commit path as a choice. */
  const abandon = useCallback(() => act((state) => flee(state, tickRef.current), undefined), [act]);

  // Theatre adapter (PLAN-025 T-007): stable across renders so its commandId
  // dedupe set never resets; reads the latest run/tick through refs, and every
  // engine mutation goes through `act` so phases and persistence stay honest.
  const runRef = useRef<QuestRunState | null>(null);
  runRef.current = run;
  const phasesRef = useRef<PhaseRecord[]>([]);
  phasesRef.current = phases;
  const actRef = useRef(act);
  actRef.current = act;

  /* Settlement journal (S2.5): the marker rides the run record — each
   * transition persists before the journal's next step, so a crash mid-
   * settlement replays from the last durable boundary. */
  const applySettlement = useCallback(
    (marker: SettlementMarker) => {
      const current = runRef.current;
      if (!current?.ended) return;
      /* R-260: the journal is monotone — `settling` only lands on an
       *  unmarked run (a late begin racing an already-committed collect
       *  must not unstitch `settled` and re-arm the one-expedition gate);
       *  `settled` always lands, so a replayed commit still converges. */
      if (marker.status === 'settling' && current.settlement) return;
      const next = { ...current, settlement: marker };
      setRun(next);
      persist(next, phasesRef.current);
    },
    [persist],
  );
  /* PLAN-040 T-005: the outcome toast's durable dismissal — raises the
   *  persisted high-water mark and republishes the run so the overlay
   *  controllers re-derive eligibility. Never lowers, no-ops on junk seqs. */
  const dismissOutcome = useCallback(
    (checkSeq: number) => {
      const current = runRef.current;
      if (!current || !Number.isInteger(checkSeq) || checkSeq <= (current.dismissedUpTo ?? 0)) return;
      const next = { ...current, dismissedUpTo: checkSeq };
      setRun(next);
      persist(next, phasesRef.current);
    },
    [persist],
  );
  const clear = useCallback(() => {
    /* Terminal transition (S2.5): clearing releases the bag reservation on
     * the run's own identity — same key the settlement journal uses. */
    const current = runRef.current;
    if (current) {
      /* PLAN-073: terminal transitions free the committed bag on the ledger —
       *  same run identity the settlement journal uses. */
      useVillageStashStore.getState().releaseCommit(runIdOf(current));
    }
    setRun(null);
    setPhases([]);
    setBeats([]);
    beatCursorRef.current = 0;
    setArmedFlags(new Set());
    markRef.current = null;
    persist(null, []);
  }, [persist]);

  return useMemo(
    () => ({
      run,
      phases,
      start,
      choose,
      armedFlags,
      toggleArmedFlag,
      revealFlag,
      syncClock,
      abandon,
      useHealing: heal,
      drinkPotion: potion,
      clear,
      beats,
      beatCursorRef,
      applySettlement,
      dismissOutcome,
    }),
    [run, phases, start, choose, armedFlags, toggleArmedFlag, revealFlag, syncClock, abandon, heal, potion, clear, beats, applySettlement, dismissOutcome],
  );
}
