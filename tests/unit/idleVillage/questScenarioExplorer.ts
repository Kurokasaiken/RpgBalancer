/**
 * questScenarioExplorer — test-side graph exploration helpers for
 * PLAN-019-S2.1 T-4.
 *
 * Two enumerations:
 *
 * - `declaredReachable` — PURE DATA DFS over the declared edges
 *   (`option.next`, `node.next`, `combat.nextCleared/nextSurvivors`,
 *   `CHECK:<id>`) carrying flag/info state: a `requiresFlag` edge is
 *   traversable only if the flag is produced upstream (an option `sets` on a
 *   statically-reachable path) or is engine-produced
 *   (`ENGINE_PRODUCED_FLAGS`). Check nodes are SINKS here: post-verdict
 *   routing lives in `questRun.applyNodeOutcome` (per-node switch, I-3), so
 *   no declared edge leaves them. This produces the statically-admissible
 *   (node, option) list.
 *
 * - `exploreScenario` — engine-driven BFS: the real `applyChoice` expands
 *   each state's enabled options under a sweep of `rngCalls` offsets, so the
 *   engine's own post-verdict routing contributes the edges data cannot
 *   declare. Deterministic (fixed seed, fixed sweep), bounded, and records
 *   for every covered (node, option) a witness: the ordered list of
 *   `{ optionId, rngCalls }` commands that realized it.
 *
 * - `replayTrace` — replays a witness on a fresh run: each recorded step
 *   sets `state.rngCalls` to the exact stream position used during
 *   exploration, making the trace deterministic end-to-end.
 */

import {
  applyChoice,
  availableOptions,
  createRun,
  QUESTS,
  type QuestId,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import {
  ENGINE_PRODUCED_FLAGS,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

/* ------------------------------------------------------------------ */
/* Deterministic policy RNG (independent of the engine seed stream).   */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hex — compact, stable trace digest. */
export function fnv1aHex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/* ------------------------------------------------------------------ */
/* Run driver — one run to its end with a policy callback.             */
/* ------------------------------------------------------------------ */

export interface PlayedRun {
  state: QuestRunState;
  /** Full deterministic signature of the run. */
  signature: string;
  optionsTaken: string[];
}

export function signatureOf(state: QuestRunState): string {
  return JSON.stringify({
    visited: state.visitedNodes,
    outcome: state.outcome,
    days: state.days,
    gold: state.gold,
    bottinoOro: state.bottinoOro,
    flags: [...state.flags].sort(),
    info: [...state.info].sort(),
    loot: [...state.loot].sort(),
    party: state.party.map((m) => `${m.id}:${m.hp}:${m.dead ? 1 : 0}:${m.wounded ? 1 : 0}`),
    xp: state.xp,
  });
}

/**
 * Full run, uniform-random policy over the *offered* (non-disabled) options.
 * `applyChoice` auto-matures timed beats, so each step is one player-visible
 * decision.
 */
export function playRun(questId: QuestId, presetId: string, seed: number): PlayedRun {
  const run = createRun(presetId, seed, questId);
  const policy = mulberry32(seed ^ 0x9e3779b9);
  const optionsTaken: string[] = [];
  for (let step = 0; step < 200 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (options.length === 0) break;
    const pick = options[Math.floor(policy() * options.length)];
    optionsTaken.push(pick.id);
    applyChoice(run, pick.id);
  }
  return { state: run, signature: signatureOf(run), optionsTaken };
}

/* ------------------------------------------------------------------ */
/* 1. Static enumeration — declared edges only (flag/info state).       */
/* ------------------------------------------------------------------ */

const CHECK_PREFIX = 'CHECK:';

/**
 * Declared-edge reachability with flag/info state. Check nodes are sinks:
 * their successors are engine-routed (`applyNodeOutcome`), not declared —
 * this enumeration deliberately covers only what the DATA declares.
 * Engine-produced flags are treated as attainable (the engine may set them
 * on routed branches); authored `sets` propagate along the DFS.
 */
export function declaredReachable(scenario: QuestScenario): {
  nodes: Set<string>;
  options: Set<string>; // 'nodeId/optionId'
  /** Nodes reachable only via engine routing (complement declared view). */
  beyondDeclared: Set<string>;
} {
  interface DfsState {
    node: string;
    flags: string;
    info: string;
    goldBucket: number;
  }
  const key = (s: DfsState) => `${s.node}|${s.flags}|${s.info}|${s.goldBucket}`;
  const norm = (arr: string[]) => [...new Set(arr)].sort().join(',');

  const options = new Set<string>();
  const nodes = new Set<string>();
  const seen = new Set<string>();
  const queue: { nodeId: string; flags: string[]; info: string[]; gold: number }[] = [
    { nodeId: scenario.startNode, flags: [], info: [], gold: 999 },
  ];
  const allProduced = new Set<string>(ENGINE_PRODUCED_FLAGS);
  for (const n of Object.values(scenario.nodes)) {
    for (const o of n.options ?? []) if (o.sets) allProduced.add(o.sets);
  }

  let guard = 0;
  while (queue.length && guard++ < 20000) {
    const cur = queue.shift()!;
    const st: DfsState = {
      node: cur.nodeId,
      flags: norm(cur.flags),
      info: norm(cur.info),
      goldBucket: cur.gold >= 50 ? 50 : cur.gold,
    };
    const k = key(st);
    if (seen.has(k)) continue;
    seen.add(k);
    nodes.add(cur.nodeId);
    const node = scenario.nodes[cur.nodeId];
    if (!node) continue;
    const push = (target: string | undefined, flags: string[], info: string[], gold: number) => {
      if (!target) return;
      if (target.startsWith(CHECK_PREFIX)) {
        nodes.add(target.slice(CHECK_PREFIX.length));
        return; // check node: sink — engine routes the verdict
      }
      queue.push({ nodeId: target, flags, info, gold });
    };
    for (const opt of node.options ?? []) {
      if (opt.requiresInfo && !cur.info.includes(opt.requiresInfo)) continue;
      if (opt.hiddenIfFlag && cur.flags.includes(opt.hiddenIfFlag)) continue;
      if (opt.requiresFlag && !cur.flags.includes(opt.requiresFlag) && !allProduced.has(opt.requiresFlag)) continue;
      if (opt.consumesFlag && !cur.flags.includes(opt.consumesFlag) && !allProduced.has(opt.consumesFlag)) continue;
      if (opt.costGold && cur.gold < opt.costGold) continue;
      options.add(`${cur.nodeId}/${opt.id}`);
      const flags = [...cur.flags];
      if (opt.sets) flags.push(opt.sets);
      if (opt.consumesFlag) {
        const idx = flags.indexOf(opt.consumesFlag);
        if (idx >= 0) flags.splice(idx, 1);
      }
      const info = opt.grantsInfo && !cur.info.includes(opt.grantsInfo) ? [...cur.info, opt.grantsInfo] : cur.info;
      const gold = cur.gold - (opt.costGold ?? 0) + (opt.grantsGold ?? 0);
      push(opt.next, flags, info, gold);
    }
    push(node.next, cur.flags, cur.info, cur.gold);
    push(node.combat?.nextCleared, cur.flags, cur.info, cur.gold);
    push(node.combat?.nextSurvivors, cur.flags, cur.info, cur.gold);
  }
  const allNodes = new Set(Object.keys(scenario.nodes));
  const beyondDeclared = new Set([...allNodes].filter((n) => !nodes.has(n)));
  return { nodes, options, beyondDeclared };
}

/* ------------------------------------------------------------------ */
/* 2. Engine-driven enumeration — full admissible coverage + witnesses. */
/* ------------------------------------------------------------------ */

export interface TraceStep {
  /** Option id applied at that step (or 'advance' / 'fight-turn'). */
  optionId: string;
  /** Absolute `rngCalls` position forced before `applyChoice`. */
  rngCalls: number;
}

export interface ExplorationResult {
  /** 'nodeId/optionId' pairs realized at least once. */
  covered: Set<string>;
  /** Witness trace per covered element (option steps from run start). */
  witnesses: Map<string, TraceStep[]>;
  /** Every node id entered at least once (incl. transient check nodes). */
  visitedNodes: Set<string>;
  /** Distinct engine states visited. */
  statesExplored: number;
  /** True if the state cap was hit (coverage may be incomplete). */
  truncated: boolean;
}

const EXPLORATION_SEED = 424242;
/** rngCalls offsets tried per (state, option) — covers the five verdict
 *  bands (epicfail/bigwin ≈ 5% each) deterministically. */
const SWEEP = 64;
const MAX_STATES = 20000;
/** Dedupe key = option-availability signature only. Fields that gate
 *  `availableOptions` (`flags`, `info`, `gold` via `costGold`, frontier
 *  status) stay; quantities that merely feed outcome granularity —
 *  days, combat/explore counters, exact hp, bottinoOro — are abstracted
 *  (measured: they drove >30k spurious states on both scenarios, the loot
 *  loop grows them unboundedly). Party is kept as a status signature
 *  (ok/wounded/dead) because wipes change routing. Combat sub-state
 *  (turn/enemies) is kept ONLY while inside a combat node: it is bounded
 *  there (turns × enemies) and it drives the nextCleared/nextSurvivors
 *  branch — dropping it merged all combat turns into one BFS state and
 *  the survivors branch was never expanded. */
const GOLD_BUCKET = 50;

function explorationKey(s: QuestRunState, scenario?: QuestScenario): string {
  const inCombat = scenario?.nodes[s.nodeId]?.kind === 'combat';
  return JSON.stringify({
    n: s.nodeId,
    f: [...s.flags].sort(),
    i: [...s.info].sort(),
    g: Math.min(Math.floor(s.gold / GOLD_BUCKET), 10),
    a: s.alarm ? 1 : 0,
    o: s.objectiveDone ? 1 : 0,
    st: s.frontier?.status,
    ...(inCombat ? { ct: s.combatTurn, gl: s.goblinLeft } : {}),
    p: s.party
      .map((m) => (m.dead ? 'd' : m.wounded ? 'w' : 'k'))
      .join('|'),
  });
}

/**
 * BFS over real engine states. For every enabled option of every visited
 * state, SWEEP clones are resolved at consecutive `rngCalls` offsets — the
 * engine's seeded RNG (`mulberry32(seed + rngCalls)`) then produces the
 * different verdicts/harm outcomes that branch the graph.
 */
export function exploreScenario(
  questId: QuestId,
  presetId: string,
  scenario?: QuestScenario,
): ExplorationResult {
  const scenario_ = scenario ?? (QUESTS[questId] as unknown as QuestScenario);
  const start = createRun(presetId, EXPLORATION_SEED, questId);
  const covered = new Set<string>();
  const witnesses = new Map<string, TraceStep[]>();
  const visitedNodes = new Set<string>(start.visitedNodes);
  const visited = new Set<string>([explorationKey(start, scenario_)]);
  const queue: { state: QuestRunState; path: TraceStep[] }[] = [{ state: start, path: [] }];
  let truncated = false;

  while (queue.length) {
    const { state, path } = queue.shift()!;
    if (visited.size > MAX_STATES) {
      truncated = true;
      break;
    }
    if (state.ended) continue;
    for (const opt of availableOptions(state).filter((o) => !o.disabled)) {
      const element = `${state.nodeId}/${opt.id}`;
      for (let k = 0; k < SWEEP; k += 1) {
        const clone = structuredClone(state);
        clone.rngCalls = k;
        applyChoice(clone, opt.id);
        clone.visitedNodes.forEach((n) => visitedNodes.add(n));
        if (!covered.has(element)) {
          covered.add(element);
          witnesses.set(element, [...path, { optionId: opt.id, rngCalls: k }]);
        }
        if (clone.ended) continue;
        const key = explorationKey(clone, scenario_);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ state: clone, path: [...path, { optionId: opt.id, rngCalls: k }] });
        }
      }
    }
  }
  return { covered, witnesses, visitedNodes, statesExplored: visited.size, truncated };
}

/**
 * Replay a witness trace on a fresh run — deterministic: each step forces
 * the recorded `rngCalls` position before `applyChoice`. Returns the final
 * state plus the options actually applied (a divergent replay shows up as a
 * missing step).
 */
export function replayTrace(
  questId: QuestId,
  presetId: string,
  steps: TraceStep[],
  seed = EXPLORATION_SEED,
): { state: QuestRunState; signature: string; applied: string[] } {
  const run = createRun(presetId, seed, questId);
  const applied: string[] = [];
  for (const step of steps) {
    if (run.ended) break;
    // Count the step when the command was actually offered at this frontier
    // (a divergent replay would find it missing — the test detects that).
    const offered = availableOptions(run).some((o) => o.id === step.optionId && !o.disabled);
    if (!offered) break;
    run.rngCalls = step.rngCalls;
    applyChoice(run, step.optionId);
    applied.push(step.optionId);
  }
  return { state: run, signature: signatureOf(run), applied };
}
