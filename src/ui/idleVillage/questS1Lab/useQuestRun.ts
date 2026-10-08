/**
 * questS1Lab/useQuestRun — drives one authored quest run outside the lab
 * (R-106: the running-quest window on /game). Same engine as the lab
 * (`createRun` / `applyChoice`), plus the per-phase record the window's
 * phase tiles read. No astrolabe cinematic here: the window is the compact
 * view, the verdict lands as text.
 */

import { useCallback, useMemo, useState } from 'react';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
// `useHealing` is an engine action, not a React hook: aliased so the hooks lint rule reads it right.
import { applyChoice, availableOptions, createRun, drinkPotion, nodesFor, useHealing as applyHealing, type QuestId, type QuestRunState } from './questRun';
import { emptyPhase, recordAction, snapshotRun, type PhaseRecord } from './questPhaseRecord';

const BAG_FLAGS: ReadonlySet<string> = new Set(QUEST_STASH.items.map((item) => item.flag));

export interface QuestRunApi {
  run: QuestRunState | null;
  /** Phases in the order they were entered; the last one is the current phase. */
  phases: PhaseRecord[];
  start: (presetId: string, loadout?: string[]) => void;
  /** `useConsumable`: whether an armed bag item may boost the resolving check —
   *  the player's call, never a silent default (R-106 playtest). */
  choose: (optionId: string, opts?: { useConsumable?: boolean }) => void;
  /** Bag actions usable at a decision: the healing kit and the potion. */
  useHealing: () => void;
  drinkPotion: () => void;
  clear: () => void;
}

const beatOf = (run: QuestRunState) => nodesFor(run)[run.nodeId]?.beat ?? 0;

export function useQuestRun(questId: QuestId): QuestRunApi {
  const [run, setRun] = useState<QuestRunState | null>(null);
  const [phases, setPhases] = useState<PhaseRecord[]>([]);

  const start = useCallback(
    (presetId: string, loadout?: string[]) => {
      const fresh = createRun(presetId, (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0, questId, loadout);
      setRun(fresh);
      setPhases([emptyPhase(beatOf(fresh))]);
    },
    [questId],
  );

  /** Applies one player action and folds its effects into the current phase. */
  const act = useCallback(
    (apply: (state: QuestRunState) => QuestRunState, label: string | undefined) => {
      if (!run || run.ended) return;
      // The engine mutates the run in place: snapshot first, and call it outside a
      // state updater so StrictMode's double-invoked updaters can't apply it twice.
      const before = snapshotRun(run);
      const next = apply(run);
      const nextBeat = beatOf(next);
      setPhases((current) => {
        const list = current.length ? [...current] : [emptyPhase(beatOf(next))];
        list[list.length - 1] = recordAction(list[list.length - 1], before, next, label, BAG_FLAGS);
        if (!next.ended && nextBeat !== list[list.length - 1].beat) list.push(emptyPhase(nextBeat));
        return list;
      });
      setRun({ ...next });
    },
    [run],
  );

  const choose = useCallback(
    (optionId: string, opts?: { useConsumable?: boolean }) => {
      if (!run) return;
      const label = availableOptions(run).find((o) => o.id === optionId)?.label;
      act((state) => applyChoice(state, optionId, opts), label);
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

  const clear = useCallback(() => {
    setRun(null);
    setPhases([]);
  }, []);

  return useMemo(
    () => ({ run, phases, start, choose, useHealing: heal, drinkPotion: potion, clear }),
    [run, phases, start, choose, heal, potion, clear],
  );
}
