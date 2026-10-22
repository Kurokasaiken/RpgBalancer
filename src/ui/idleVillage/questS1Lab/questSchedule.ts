/**
 * questSchedule — D-K/D-J time projection layer (PLAN-019-S2.4 T-0).
 *
 * Read-only projection over `QuestRunState`: it never mutates the run and
 * never reimplements scheduling. The ENGINE already owns the D-K node
 * schedule — `readyAt(node) = arrivalOnNode + nodeTicks` along the actual
 * traversed path, with matured chains pre-paying each other (`matureNode`
 * starts the next node at the previous `readyAt`). This layer only turns
 * that state into the two numbers the UI needs:
 *
 * - `elapsed` — ticks since launch on the caller clock (game tick on
 *   `/game`); keeps growing while the frontier waits for the player —
 *   the halo does NOT stop at decision points (D-J).
 * - `durationTicks` — the LIVE denominator: the offer's normative
 *   `estimatedDurationTicks` extended by `ticksPerNode` for every node
 *   visited beyond `expectedPathNodes` (Director 2026-10-09: an extra node
 *   adds its duration THE MOMENT it is reached — the halo denominator and
 *   the phase tiles adapt mid-run, not just in preview). `visitedNodes` is
 *   the engine's append-only path record, so the extension is
 *   deterministic and survives reload.
 *
 * Semantics this layer deliberately does NOT own: when a node matures, what
 * its effects are, which outcome an `end` node lands. Those stay in the
 * engine (I-3).
 */
import type { QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { nodesFor, type QuestRunState } from './questRun';

/** Ticks elapsed since launch on the caller's clock. `nowTick` is the same
 *  clock `submitCommand`/`matureReady` receive (game tick on `/game`).
 *  Legacy runs without `launchedAtTick` fall back to the current frontier's
 *  `startedAt` — elapsed under-reports on those runs only (declared). */
export function questElapsedTicks(state: QuestRunState, nowTick: number): number {
  const start = state.launchedAtTick ?? state.frontier.startedAt;
  return Math.max(0, Math.floor(nowTick - start));
}

/**
 * Live duration denominator (D-K «durata viva»): the normative estimate
 * until the actual path outgrows it, then `timedVisitedNodes × ticksPerNode`.
 * Every timed node entered beyond the authored expectation adds its
 * `ticksPerNode` at the moment it is reached — `immediate: true` zero-wait
 * nodes (e.g. `gob-bottino`, R-231) do not add march ticks.
 */
export function questDurationTicks(state: QuestRunState, poi: QuestPoi): number {
  /* The RUN's own pace (`state.nodeTicks`, set at launch — loadout items can
   *  modify it, PLAN-019-S3 T-3) scales both terms: a mounted expedition
   *  matures faster AND gets a shorter estimate. Legacy clock-less runs
   *  (nodeTicks 0) keep the authored POI pace. */
  const nodeTicks = state.nodeTicks || poi.ticksPerNode;
  const paceFactor = nodeTicks / poi.ticksPerNode;
  const nodes = nodesFor(state);
  const timedVisited = state.visitedNodes.filter((id) => {
    const n = nodes[id];
    return !(n?.kind === 'choice' && n.immediate);
  }).length;
  return Math.max(poi.estimatedDurationTicks * paceFactor, timedVisited * nodeTicks);
}

/**
 * Ticks still to play, for the quest bar's stretching scale (PLAN-067 T-B3): the nodes the
 * authored path expects (`estimatedDurationTicks / ticksPerNode`) minus the timed nodes already
 * visited, at the run's own pace; always at least one node (the run is not over until it lands).
 */
export function questRemainingTicks(state: QuestRunState, poi: QuestPoi): number {
  const nodeTicks = state.nodeTicks || poi.ticksPerNode;
  const nodes = nodesFor(state);
  const timedVisited = state.visitedNodes.filter((id) => {
    const n = nodes[id];
    return !(n?.kind === 'choice' && n.immediate);
  }).length;
  const expected = Math.max(1, Math.round(poi.estimatedDurationTicks / Math.max(1, poi.ticksPerNode)));
  return nodeTicks * Math.max(1, expected - timedVisited);
}

/** Declared halo states (critica r1): `filling` while elapsed < duration;
 *  `pieno-in-attesa` when the bar is full but the run has not landed on an
 *  `end` node yet — a full halo is NOT a concluded quest; `concluso` only
 *  when the engine resolved an outcome. */
export type QuestHaloStatus = 'filling' | 'pieno-in-attesa' | 'concluso';

export interface QuestHaloProgress {
  /** Elapsed ticks on the caller clock — grows through waiting frontiers. */
  elapsedTicks: number;
  /** Live denominator — may grow mid-run on extra nodes (D-K). */
  durationTicks: number;
  /** `elapsed / duration` clamped to [0,1] — the halo fill. */
  fraction: number;
  status: QuestHaloStatus;
}

/**
 * The POI halo projection (D-J): pure elapsed/duration, never gated by the
 * frontier status. A run past its estimate sits at `pieno-in-attesa` —
 * the outcome appears only when an `end` node resolves (`concluso`), never
 * because time ran out.
 */
export function questHaloProgress(state: QuestRunState, poi: QuestPoi, nowTick: number): QuestHaloProgress {
  const elapsedTicks = questElapsedTicks(state, nowTick);
  const durationTicks = questDurationTicks(state, poi);
  const fraction = Math.min(1, elapsedTicks / Math.max(1, durationTicks));
  const status: QuestHaloStatus = state.ended ? 'concluso' : fraction >= 1 ? 'pieno-in-attesa' : 'filling';
  return { elapsedTicks, durationTicks, fraction, status };
}

/**
 * Phase-tile contract for `QuestRunWindow` (D-K «le tile si adattano»):
 * the bottom strip renders one tile per BEAT the path has traversed plus
 * the frontier's own — the beat index is authored per node, so a revisited
 * node folds into its existing tile while a genuinely new node (new beat)
 * makes a new tile appear. Returns the distinct beat ids in path order —
 * the count that adapts when an extra node is reached.
 */
export function phaseTileBeats(state: QuestRunState, nodeBeat: (nodeId: string) => number): number[] {
  const seen = new Set<number>();
  const beats: number[] = [];
  for (const id of state.visitedNodes) {
    const b = nodeBeat(id);
    if (!seen.has(b)) {
      seen.add(b);
      beats.push(b);
    }
  }
  return beats;
}

export interface TimeBarCheckpoint {
  /** Beat index in `beats`. */
  beat: number;
  /** Localized phase name from `beats[beat]`. */
  label: string;
  /** Position along the [0, 1] TimeBar track. */
  fraction: number;
  /** True once the party has passed this phase or the run has ended. */
  reached: boolean;
  /** True while this phase is the active frontier. */
  current: boolean;
}

/**
 * Phase checkpoints along the `TimeBar` (R-231 #4):
 * - Excludes hidden zero-wait `immediate: true` beats (e.g. Beat 1 `Loot` /
 *   `gob-bottino`) when unvisited so they never create phantom segments;
 * - Places stationary checkpoints across the visible timed phases so each
 *   phase's threshold is clearly marked on the duration bar.
 */
export function questPhaseCheckpoints(
  state: QuestRunState,
  beats: readonly string[],
  currentBeat: number,
  progress: number,
): TimeBarCheckpoint[] {
  const nodes = nodesFor(state);
  const visitedBeats = new Set<number>();
  for (const id of state.visitedNodes) {
    const b = nodes[id]?.beat;
    if (typeof b === 'number') visitedBeats.add(b);
  }
  const immediateOnlyBeats = new Set<number>();
  const timedBeats = new Set<number>();
  for (const n of Object.values(nodes)) {
    if (typeof n.beat !== 'number') continue;
    if (n.kind === 'choice' && n.immediate) immediateOnlyBeats.add(n.beat);
    else if (n.kind !== 'end') timedBeats.add(n.beat);
  }
  const visibleBeats: number[] = [];
  for (let b = 0; b < beats.length; b += 1) {
    const isImmediateOnly = immediateOnlyBeats.has(b) && !timedBeats.has(b);
    if (isImmediateOnly && !visitedBeats.has(b)) continue;
    visibleBeats.push(b);
  }
  /* R-253 #4: a beat index authored BEYOND `beats.length` (a phase added to
   *  the journey that the label list never covered) still earns its
   *  checkpoint the moment the path reaches it — the bar adapts its marker
   *  count to the REAL phase set, mirroring `questDurationTicks`' live
   *  denominator. Unvisited out-of-range beats stay phantom-free: they are
   *  unreachable branch content until the engine walks them. */
  for (const b of visitedBeats) {
    if (b >= beats.length && !visibleBeats.includes(b)) visibleBeats.push(b);
  }
  visibleBeats.sort((a, b) => a - b);
  const total = Math.max(1, visibleBeats.length);
  return visibleBeats.map((b, idx) => {
    const fraction = (idx + 1) / total;
    const reached = state.ended ? state.outcome === 'reward' || state.outcome === 'survived' || progress >= fraction : b < currentBeat || progress >= fraction;
    const current = !state.ended && b === currentBeat;
    return {
      beat: b,
      label: beats[b] ?? `Phase ${b + 1}`,
      fraction,
      reached,
      current,
    };
  });
}
