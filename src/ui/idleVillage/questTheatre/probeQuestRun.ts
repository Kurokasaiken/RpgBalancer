/**
 * Probe: `questRun` (lab S1) → theatre read-model — DISPOSABLE (PLAN-021 T-002).
 *
 * Binary check on the authored quests (`cassa`, `rovine`): can the STRUCTURAL
 * fields (list A — nodeId, kind, text/options, party view, run state) be
 * populated by a pure function over the serialised run state? Fields of list B
 * (`awaitingPlayer`, `inAttesaDal`, `expectedFrontierVersion`) are absent from
 * the lab by construction — the fake adapter provides them and they are
 * recorded as S2 requirements, not as `questRun` obligations.
 */

import {
  availableOptions,
  nodesFor,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import type {
  TheatreNodeView,
  TheatrePartyMemberView,
  TheatreRunState,
  TheatreRunView,
} from './theatreContract';

/** Lab node kind → theatre kind (structural, lab-independent vocabulary). */
const KIND_MAP: Record<string, string> = {
  info: 'timed',
  harm: 'consequence',
  choice: 'choice',
  check: 'check',
  combat: 'check',
  end: 'reward',
};

/** Lab outcome → theatre run state. */
function runStateFor(state: QuestRunState): TheatreRunState {
  if (!state.ended) return 'running';
  if (state.outcome === 'reward' || state.outcome === 'survived') return 'success';
  if (state.outcome === 'fled') return 'fled';
  return 'wiped';
}

/**
 * Maps a `QuestRunState` to the theatre frontier.
 * @param state - A live or ended lab run.
 * @param resolvedNodeIds - The trail of visited nodes, in order. FINDING for
 *   S2: `questRun` does not serialise the visited-node path (the log carries
 *   prose only), so the caller must keep the trail — the canonical read-model
 *   must carry it or the runtime must rebuild it.
 * @returns A snapshot proving the structural fields are derivable.
 */
export function probeTheatreSnapshot(
  state: QuestRunState,
  resolvedNodeIds: string[] = [],
): TheatreRunView {
  const nodes = nodesFor(state);
  const current = nodes[state.nodeId];
  const options = availableOptions(state);

  const visited: TheatreNodeView[] = resolvedNodeIds.map((id) => {
    const node = nodes[id];
    return {
      nodeId: id,
      kind: KIND_MAP[node?.kind ?? ''] ?? node?.kind ?? 'unknown',
      state: 'resolved' as const,
      title: node?.title,
      resolvedSummary: node?.title,
    };
  });

  const currentView: TheatreNodeView = {
    nodeId: state.nodeId,
    kind: KIND_MAP[current?.kind ?? ''] ?? current?.kind ?? 'unknown',
    state: state.ended ? 'resolved' : 'awaitingPlayer',
    title: current?.title,
    text: current?.body,
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      preview: o.detail,
      disabled: o.disabled,
    })),
  };

  const party: TheatrePartyMemberView[] = state.party.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    state: m.dead ? 'dead' : m.wounded ? 'injured' : 'alive',
  }));

  return {
    contractVersion: 1,
    runId: state.questId,
    title: state.questId,
    runState: runStateFor(state),
    frontierVersion: state.rngCalls,
    nodes: [...visited, currentView],
    party,
    log: state.log.map((e, i) => ({ id: `${i}`, text: e.text })),
  };
}
