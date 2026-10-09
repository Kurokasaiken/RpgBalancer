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
import type { QuestRunState } from './questRun';

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
 * until the actual path outgrows it, then `visitedNodes × ticksPerNode`.
 * Every node entered beyond the authored expectation adds its
 * `ticksPerNode` at the moment it is reached — check/choice/combat nodes
 * count too (the Director's rule is per *node reached*, not per timed
 * beat: the party is out there spending real time either way).
 */
export function questDurationTicks(state: QuestRunState, poi: QuestPoi): number {
  return Math.max(poi.estimatedDurationTicks, state.visitedNodes.length * poi.ticksPerNode);
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
