/**
 * questRunAdapter — the real-runtime producer for the theatre read-model
 * (PLAN-025 T-006). Projects a `QuestRunState` (engine v2, v27 frontier)
 * into a `TheatreRunView` and translates `TheatreIntent`s into engine
 * commands. Pure, per-run: no React, no clocks of its own, no graph
 * speculation — the snapshot contains only what the run already committed.
 *
 * Invariants enforced here (quest_theatre_spec.md):
 * - resolved nodes come from `run.visitedNodes` (traversal history), never
 *   from the graph's future;
 * - a `pending` frontier exposes no options and rejects decisions;
 * - intents carry `expectedFrontierVersion`: stale and duplicate
 *   commandIds are rejected without touching the run.
 */

import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import {
  availableOptions,
  drinkPotion,
  matureReady,
  nodesFor,
  previewOption,
  submitCommand,
  useHealing,
  type QuestRunState,
} from '../questS1Lab/questRun';
import type {
  TheatreAdapter,
  TheatreBagItem,
  TheatreCommandResult,
  TheatreIntent,
  TheatreNodeView,
  TheatreRunState,
  TheatreRunView,
} from './theatreContract';

export const THEATRE_CONTRACT_VERSION = 2;

/** Engine node kind → theatre stage kind (spec §Stage→kind→forma). */
const THEATRE_KIND: Record<string, string> = {
  info: 'timed',
  harm: 'timed',
  choice: 'choice',
  check: 'check',
  combat: 'combat',
  end: 'timed',
};

/** Engine outcome → theatre run state ('running' passes through). */
const THEATRE_RUN_STATE: Record<QuestRunState['outcome'], TheatreRunState> = {
  running: 'running',
  reward: 'success',
  survived: 'survived',
  fled: 'fled',
  wipe: 'wiped',
};

/** Stash flag → catalog item, for the bag projection. */
const STASH_BY_FLAG = new Map(QUEST_STASH.items.map((item) => [item.flag, item]));

/** Snapshot context supplied by the caller (clock source lives outside). */
export interface QuestRunAdapterContext {
  /** The caller's current tick — copied into the snapshot verbatim. */
  tick?: number;
}

const reject = (reason: 'stale' | 'duplicate' | 'other', message?: string): TheatreCommandResult => ({
  status: 'rejected',
  reason,
  ...(message ? { message } : {}),
});

/** One node as the theatre sees it: committed shape only. */
function nodeView(run: QuestRunState, nodeId: string, state: TheatreNodeView['state']): TheatreNodeView {
  const node = nodesFor(run)[nodeId];
  const view: TheatreNodeView = {
    nodeId,
    kind: THEATRE_KIND[node?.kind ?? ''] ?? 'unsupported',
    state,
    title: node?.title ?? nodeId,
    text: node?.body,
    resolvedSummary: node?.title,
  };
  if (state === 'pending') {
    view.pending = { startedAt: run.frontier.startedAt, readyAt: run.frontier.readyAt };
    return view;
  }
  if (state !== 'awaitingPlayer') return view;
  // Awaiting player: options exactly as the engine filters them, each with
  // its runtime-provided check preview when the option rolls one.
  view.options = availableOptions(run).map((option) => {
    const pv = previewOption(run, option.id, { useConsumable: false });
    return {
      id: option.id,
      label: option.label,
      preview: option.detail,
      disabled: option.disabled,
      ...(pv ? { checkPreview: { probabilityPct: pv.successPct, note: pv.checkTitle } } : {}),
    };
  });
  return view;
}

/**
 * Project the run into a theatre snapshot. Deterministic: same state →
 * same view. Resolved nodes come from `visitedNodes` (append-only history,
 * revisits included); the frontier node is the last one, marked
 * 'awaitingPlayer' | 'pending' | 'resolved' (run ended).
 */
export function snapshotQuestRun(run: QuestRunState, ctx?: QuestRunAdapterContext): TheatreRunView {
  const nodes: TheatreNodeView[] = run.visitedNodes.map((nodeId, index) => {
    const isCurrent = index === run.visitedNodes.length - 1;
    const state: TheatreNodeView['state'] = !isCurrent || run.ended
      ? 'resolved'
      : run.frontier.status === 'pending'
        ? 'pending'
        : 'awaitingPlayer';
    return nodeView(run, nodeId, state);
  });

  const bag: TheatreBagItem[] = run.flags
    .map((flag) => STASH_BY_FLAG.get(flag))
    .filter((item): item is (typeof QUEST_STASH.items)[number] => !!item)
    .map((item) => ({ flag: item.flag, labelKey: item.labelKey }));

  const currentNode = nodesFor(run)[run.nodeId];
  const inCombat = !run.ended && currentNode?.kind === 'combat' && run.frontier.status === 'waiting';

  return {
    contractVersion: THEATRE_CONTRACT_VERSION,
    runId: `${run.questId}:${run.presetId}:${run.seed}`,
    title: currentNode?.title ?? run.questId,
    runState: THEATRE_RUN_STATE[run.outcome],
    frontierVersion: run.frontierVersion,
    nodes,
    party: run.party.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      state: member.dead ? 'dead' : member.wounded ? 'injured' : 'alive',
      hp: member.hp,
      maxHp: member.maxHp,
    })),
    log: run.log.map((entry, index) => ({ id: `log-${index}`, text: entry.text })),
    ...(ctx?.tick !== undefined ? { tick: ctx.tick } : {}),
    ...(bag.length ? { bag } : {}),
    ...(inCombat ? { combat: { turn: run.combatTurn, enemiesLeft: run.goblinLeft } } : {}),
  };
}

/**
 * Create the intent channel over a live run. `getRun` is a getter (not a
 * snapshot) so the adapter survives the caller replacing the run object;
 * `onMutate` lets the caller wrap each engine call (phase recording,
 * persistence) — the run is mutated in place either way.
 */
export function createQuestRunAdapter(
  getRun: () => QuestRunState | null,
  opts?: { getTick?: () => number; onMutate?: (apply: (run: QuestRunState) => QuestRunState) => void },
): TheatreAdapter & { getSnapshot: () => TheatreRunView } {
  const seenCommands = new Set<string>();
  const tickOf = () => opts?.getTick?.() ?? 0;

  const mutate = (apply: (run: QuestRunState) => QuestRunState): void => {
    const run = getRun();
    if (!run) return;
    if (opts?.onMutate) {
      opts.onMutate(apply);
    } else {
      apply(run);
    }
  };

  const guard = (intent: TheatreIntent): TheatreCommandResult | null => {
    const run = getRun();
    if (!run) return reject('other', 'nessuna run attiva');
    if (seenCommands.has(intent.commandId)) return reject('duplicate', 'comando già eseguito');
    if (intent.expectedFrontierVersion !== run.frontierVersion) return reject('stale', 'snapshot scaduto');
    if (intent.nodeId !== run.nodeId) return reject('stale', 'nodo non corrente');
    if (run.ended) return reject('other', 'run terminata');
    if (run.frontier.status === 'pending') return reject('other', 'frontiera in maturazione — attendere');
    return null;
  };

  return {
    getSnapshot: () => {
      const run = getRun();
      if (!run) {
        // Absent run → a minimal, honest empty view (theatre renders «no run»).
        return {
          contractVersion: THEATRE_CONTRACT_VERSION,
          runId: 'none',
          title: '',
          runState: 'running',
          frontierVersion: 0,
          nodes: [],
          party: [],
          log: [],
        };
      }
      return snapshotQuestRun(run, { tick: tickOf() });
    },
    dispatch: (intent) => {
      const rejected = guard(intent);
      if (rejected) return rejected;
      const run = getRun()!;
      switch (intent.kind) {
        case 'submitDecision': {
          const valid = availableOptions(run).some((o) => o.id === intent.optionId && !o.disabled);
          if (!valid) return reject('other', 'opzione non disponibile');
          seenCommands.add(intent.commandId);
          mutate((state) => submitCommand(state, intent.optionId, {
            tick: tickOf(),
            useConsumable: intent.useConsumable,
          }));
          return { status: 'accepted' };
        }
        case 'useItem': {
          const hasItem = run.flags.includes(intent.flag);
          if (!hasItem) return reject('other', 'oggetto non nella sacca');
          // Only instant items are usable at a frontier; check-modifier
          // consumables are armed, not spent here (they burn on resolution).
          if (intent.flag === 'hasPozione') {
            seenCommands.add(intent.commandId);
            mutate((state) => drinkPotion(state, 'hasPozione'));
            return { status: 'accepted' };
          }
          if (intent.flag === 'hasHealing') {
            seenCommands.add(intent.commandId);
            mutate((state) => useHealing(state));
            return { status: 'accepted' };
          }
          return reject('other', 'questo oggetto si usa armandolo prima di una prova');
        }
        // The goblin engine has no generic retreat/collect flow: retreat is an
        // authored option per node, rewards resolve at the end node. Honest
        // rejection — never a synthesized command.
        case 'retreat':
          return reject('other', 'ritiro non disponibile su questo nodo');
        case 'collectReward':
          return reject('other', 'nessuna ricompensa da raccogliere qui');
        default:
          return reject('other');
      }
    },
  };
}

// Re-exported for callers that need the catch-up primitive beside the adapter.
export { matureReady };
