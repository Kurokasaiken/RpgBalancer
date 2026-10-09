/**
 * questCertainty — planning-time information model (PLAN-019-S3 T-1).
 *
 * Two pieces:
 *
 * - `exploreScenarioGraph` / `certainChecks` — which `check` nodes are
 *   *certain*: every path from the start node to any terminal passes through
 *   them (dominance on the reachable node graph). The graph is extracted by
 *   driving the REAL engine — `applyChoice` on cloned states — so legacy
 *   authored routing (`applyNodeOutcome` switch), flag/info-gated options,
 *   `verdictTable` branches and the wake/objective hijacks all contribute the
 *   edges data alone cannot declare. Verdict coverage is EXACT: check options
 *   are expanded once per die value through the `forceDie` seam (1..100 —
 *   `verdictFromRoll` guarantees every band exists for any success bound), so
 *   no reachable verdict→route branch can be missed by sampling.
 *
 *   Conservative direction: a missing edge can only erase a certainty claim,
 *   never create a false one — the planner then shows the check's primary
 *   stat + authored hint instead of a percentage (S3 rule: niente numeri
 *   dove manca il modello).
 *
 * - `planningReveals` — the ratified `revealAtPlanning` mechanic (D-S3-3):
 *   an authored slot with `{stat, threshold}` reveals extra `revealHint`s
 *   when the assigned member meets the threshold.
 *
 * Terminals: `ended` states (wipe/flee/reward/survived all count — a run can
 * end without ever facing a check, which correctly defeats certainty) and
 * `end`-kind nodes.
 */

import {
  applyChoice,
  availableOptions,
  createRun,
  nodesFor,
} from './questRun';
import type {
  QuestId,
  QuestRunState,
  ScenarioInstance,
} from './questRun';
import type { LabMember, LabStat, QuestNode } from './questScenario';
import { QUEST_PLANNER_INFO } from '@/balancing/config/idleVillage/quests/questPlannerInfo';

/* ------------------------------------------------------------------ */
/* Probe input / output                                               */
/* ------------------------------------------------------------------ */

export interface CertaintyProbeInput {
  questId: QuestId;
  /** Frozen offer instance; absent = authored base scenario. */
  scenarioInstance?: ScenarioInstance;
  /**
   * Party the probe runs as — verdict coverage is party-agnostic (every die
   * is forced), but HP and traits still shape which states are reachable:
   * deaths open wipe terminals and trait gates open trait options. The
   * default is a durable neutral member, sized so the exploration survives
   * the lethal gauntlets and still records wipe branches.
   */
  party?: LabMember[];
  seed?: number;
  /** Hard caps — on exhaustion the report is `truncated` and no check is
   *  claimed certain (unexplored paths might dodge it). */
  maxStates?: number;
}

export interface CertainCheck {
  nodeId: string;
  title: string;
  /** Primary stat channel the check rolls — always known at planning. */
  stats: LabStat[];
  /** Beat of the authored node, for ordering in the preview. */
  beat?: number;
}

export interface CertaintyReport {
  certain: CertainCheck[];
  /** True when the state cap was hit — `certain` is then empty by contract. */
  truncated: boolean;
  statesExplored: number;
  edgesExplored: number;
}

/** Synthetic probe member — mid stats (irrelevant: all dies are forced),
 *  high HP so the exploration reaches deep branches before wiping. */
const PROBE_MEMBER: LabMember = {
  id: 'certainty-probe',
  name: 'Sonda',
  role: 'leader',
  stats: { perc: 50, int: 50, str: 50, con: 50, agi: 50, cha: 50 },
  hp: 10_000,
};

/* ------------------------------------------------------------------ */
/* State abstraction — same lesson as the S2.1 explorer: keep only what */
/* gates options or steers routing.                                    */
/* ------------------------------------------------------------------ */

const GOLD_BUCKET = 50;

function abstractKey(state: QuestRunState, nodes: Record<string, QuestNode>): string {
  const inCombat = nodes[state.nodeId]?.kind === 'combat';
  return JSON.stringify({
    n: state.nodeId,
    f: [...state.flags].sort(),
    i: [...state.info].sort(),
    g: Math.min(Math.floor(state.gold / GOLD_BUCKET), 10),
    a: state.alarm ? 1 : 0,
    o: state.objectiveDone ? 1 : 0,
    st: state.frontier.status,
    v: Object.entries(state.vars ?? {}).sort(([a], [b]) => (a < b ? -1 : 1)),
    ...(inCombat ? { ct: state.combatTurn, gl: state.goblinLeft } : {}),
    p: state.party.map((m) => (m.dead ? 'd' : m.wounded ? 'w' : 'k')).join('|'),
  });
}

/* ------------------------------------------------------------------ */
/* Graph extraction                                                    */
/* ------------------------------------------------------------------ */

const TERMINAL = '∎end';

export interface ScenarioGraph {
  /** Directed edges over node ids; `∎end` marks every terminal reach. */
  edges: Map<string, Set<string>>;
  /** Node map the run executed on (frozen instance or authored base). */
  nodes: Record<string, QuestNode>;
  startNodeId: string;
  truncated: boolean;
  statesExplored: number;
  edgesExplored: number;
}

/**
 * BFS over engine states. For every offered command the state is expanded:
 * check options once per forced die (exact verdict coverage), every other
 * command over a small `rngCalls` sweep (covers rollFlag arms, harm and
 * combat outcome variance). Node-level edges come from the `visitedNodes`
 * delta of each clone — consecutive arrivals included, so auto-matured
 * info/harm chains contribute their real ordering.
 */
export function exploreScenarioGraph(input: CertaintyProbeInput): ScenarioGraph {
  const cfg = QUEST_PLANNER_INFO.certainty;
  const seed = input.seed ?? cfg.probeSeed;
  const maxStates = input.maxStates ?? cfg.maxStates;
  const rngSweep = cfg.rngSweepPerCommand;
  const dieMax = cfg.dieSweepMax;

  const run = createRun({
    party: { members: input.party ?? [PROBE_MEMBER] },
    seed,
    questId: input.questId,
    scenarioInstance: input.scenarioInstance,
  });
  const nodes = nodesFor(run);

  const edges = new Map<string, Set<string>>();
  const addEdge = (from: string, to: string) => {
    let set = edges.get(from);
    if (!set) edges.set(from, (set = new Set()));
    set.add(to);
  };

  const visited = new Set<string>([abstractKey(run, nodes)]);
  const queue: QuestRunState[] = [run];
  let truncated = false;
  let edgesExplored = 0;

  const absorb = (source: QuestRunState, clone: QuestRunState, arrivalsFrom: number) => {
    const arrivals = clone.visitedNodes.slice(arrivalsFrom);
    let prev = source.nodeId;
    for (const n of arrivals) {
      addEdge(prev, n);
      edgesExplored += 1;
      prev = n;
    }
    if (clone.ended) {
      addEdge(prev, TERMINAL);
      edgesExplored += 1;
      return;
    }
    const key = abstractKey(clone, nodes);
    if (!visited.has(key)) {
      visited.add(key);
      queue.push(clone);
    }
  };

  while (queue.length) {
    if (visited.size > maxStates) {
      truncated = true;
      break;
    }
    const state = queue.shift()!;
    if (state.ended) continue;
    const node = nodes[state.nodeId];
    if (!node) continue;
    const offered = availableOptions(state);
    for (const opt of offered) {
      const authored = node.options?.find((o) => o.id === opt.id);
      const isCheck = authored?.next?.startsWith('CHECK:');
      if (isCheck) {
        // Exact verdict coverage: every die is a reachable outcome for the
        // real bands (bigwin/epicfail are absolute tails). One clone per die.
        for (let die = 1; die <= dieMax; die += 1) {
          const clone = structuredClone(state);
          clone.rngCalls = die * 131; // spread the post-verdict harm stream
          const mark = clone.visitedNodes.length;
          applyChoice(clone, opt.id, { forceDie: die });
          absorb(state, clone, mark);
        }
      } else {
        for (let k = 0; k < rngSweep; k += 1) {
          const clone = structuredClone(state);
          clone.rngCalls = 977 + k;
          const mark = clone.visitedNodes.length;
          applyChoice(clone, opt.id);
          absorb(state, clone, mark);
        }
      }
    }
  }

  return {
    edges,
    nodes,
    startNodeId: run.nodeId,
    truncated,
    statesExplored: visited.size,
    edgesExplored,
  };
}

/* ------------------------------------------------------------------ */
/* Dominance — a check is certain iff removing it disconnects every     */
/* terminal from the start node.                                       */
/* ------------------------------------------------------------------ */

function reachesTerminalWithout(
  edges: Map<string, Set<string>>,
  start: string,
  terminalIds: Set<string>,
  blocked: string,
): boolean {
  const seen = new Set<string>([start]);
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    if (terminalIds.has(cur)) return true;
    for (const next of edges.get(cur) ?? []) {
      if (next === blocked || seen.has(next)) continue;
      seen.add(next);
      stack.push(next);
    }
  }
  return false;
}

/**
 * Checks certain on the frozen scenario — the only checks the planner may
 * price with a number (T-4 preview). Unknown/blocked exploration yields no
 * claims.
 */
export function certainChecks(input: CertaintyProbeInput): CertaintyReport {
  const graph = exploreScenarioGraph(input);
  const nodes = graph.nodes;
  const start = graph.startNodeId;

  const terminalIds = new Set<string>([TERMINAL]);
  const checkIds: string[] = [];
  for (const node of Object.values(nodes)) {
    if (node.kind === 'end') terminalIds.add(node.id);
    if (node.kind === 'check') checkIds.push(node.id);
  }

  const certain: CertainCheck[] = [];
  if (!graph.truncated) {
    for (const id of checkIds) {
      if (!(graph.edges.has(id) || [...graph.edges.values()].some((s) => s.has(id)))) continue;
      if (!reachesTerminalWithout(graph.edges, start, terminalIds, id)) {
        const node = nodes[id];
        certain.push({ nodeId: id, title: node.title, stats: node.stats ?? [], beat: node.beat });
      }
    }
  }

  return {
    certain: certain.sort((a, b) => (a.beat ?? 0) - (b.beat ?? 0)),
    truncated: graph.truncated,
    statesExplored: graph.statesExplored,
    edgesExplored: graph.edgesExplored,
  };
}

/* ------------------------------------------------------------------ */
/* revealAtPlanning (D-S3-3 ratificata 2026-10-09)                       */
/* ------------------------------------------------------------------ */

export interface RevealAtPlanningSpec {
  stat: LabStat;
  threshold: number;
  /** Node ids whose `revealHint` unlocks; absent = every authored one. */
  reveals?: string[];
}

/**
 * Whether assigning `member` to a slot carrying `revealAtPlanning` unlocks
 * planning intel — the explorer's stat meets the authored threshold.
 */
export function memberReveals(spec: RevealAtPlanningSpec | undefined, member: LabMember | undefined): boolean {
  if (!spec || !member) return false;
  return (member.stats[spec.stat] ?? 0) >= spec.threshold;
}

/**
 * Planning-visible node hints for a scenario: `previewHint` is always known
 * (authored danger hint, D-S3-3), `revealHint` only through an unlocked
 * `revealAtPlanning` slot. Returns per-node copy keys for the OUTCOME zone.
 */
export function planningHints(
  nodes: Record<string, QuestNode>,
  revealedNodeIds: ReadonlySet<string>,
): { nodeId: string; hint: string; revealed: boolean }[] {
  const out: { nodeId: string; hint: string; revealed: boolean }[] = [];
  for (const node of Object.values(nodes)) {
    if (node.previewHint) out.push({ nodeId: node.id, hint: node.previewHint, revealed: false });
    if (node.revealHint && revealedNodeIds.has(node.id)) {
      out.push({ nodeId: node.id, hint: node.revealHint, revealed: true });
    }
  }
  return out;
}
