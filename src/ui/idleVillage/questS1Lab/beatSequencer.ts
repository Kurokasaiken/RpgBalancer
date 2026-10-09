/**
 * PLAN-025 T-008 — BeatSequencer for the quest window.
 *
 * The engine commits one whole action at once (`submitCommand` /
 * `matureReady` catch-up): a single commit can carry several *moments* —
 * a scene arrival, a resolved check, each wound/death, the run's end.
 * This module projects that committed delta into an ordered **beat queue**
 * with stable ids, so the window presents one moment at a time (E1: three
 * deaths in one click become three beats, not one paragraph) instead of
 * jumping straight to the final frontier.
 *
 * Ordering is taken from the run **log**, which is the engine's own ordered
 * commit record (NODE → scene, CHECK → resolution, WOUND/DEATH/HARM → one
 * harm beat each, QUEST_END → end). This keeps beats honest: the sequencer
 * never invents nodes or outcomes, it only paces what already committed.
 *
 * Two pure halves + a thin timed cursor hook, mirroring the
 * `presentationTimeline` pattern (PLAN-023). All durations and the queue
 * ceiling come from `gameFrameConfig.questWindow.beats` — nothing hardcoded.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nodesFor, type HarmEvent, type QuestOutcome, type QuestRunState, type ResolvedCheck } from './questRun';

/* ------------------------------------------------------------------ */
/* Beat model                                                          */
/* ------------------------------------------------------------------ */

/** A scene arrival committed by the engine — the theatre shows the node's
 *  authored body while the frontier matures, so during replay this beat is
 *  the "cut" between moments. */
export interface SceneBeat {
  id: string;
  kind: 'scene';
  nodeId: string;
  title: string;
  body?: string;
}

/** A resolved check / combat turn — verdict + authored flavor + consequence. */
export interface CheckBeat {
  id: string;
  kind: 'check';
  check: ResolvedCheck;
}

/** ONE applied harm — the multi-death case steps member by member. */
export interface HarmBeat {
  id: string;
  kind: 'harm';
  harm: HarmEvent;
  memberName: string;
  line: string;
}

/** Terminal beat — run outcome reached. */
export interface EndBeat {
  id: string;
  kind: 'end';
  outcome: QuestOutcome;
  text: string;
}

/** Compaction beat: the queue overflowed its ceiling — skipped beats are
 *  summarized ("while you were away") instead of replayed one by one. */
export interface RecapBeat {
  id: string;
  kind: 'recap';
  scenes: number;
  checks: number;
  deaths: number;
  wounds: number;
}

export type QuestBeat = SceneBeat | CheckBeat | HarmBeat | EndBeat | RecapBeat;

/* ------------------------------------------------------------------ */
/* Commit mark + projection                                            */
/* ------------------------------------------------------------------ */

/** Opaque position in the run's commit history — captured BEFORE a mutation
 *  so `projectBeats` can diff (mark → committed state). Scalars only: the
 *  engine mutates in place, so this must be read pre-mutation. */
export interface BeatMark {
  logLen: number;
  visitedLen: number;
  checkSeq: number;
  harmSeq: number;
  ended: boolean;
}

/** Capture the mark for the current (pre-mutation or freshly loaded) run. */
export const beatMark = (run: QuestRunState): BeatMark => ({
  logLen: run.log.length,
  visitedLen: run.visitedNodes.length,
  checkSeq: run.checkSeq,
  harmSeq: run.harmSeq,
  ended: run.ended,
});

const checkSeqOf = (check: ResolvedCheck): number =>
  Number.parseInt(check.id.replace(/^chk-/, ''), 10) || 0;

/** All harm events committed after `mark.harmSeq`, in seq order — the union
 *  of harms inside newly queued checks and ambient (node-level) harms. */
function newHarms(after: QuestRunState, mark: BeatMark): HarmEvent[] {
  const fromChecks = after.checkQueue
    .filter((c) => checkSeqOf(c) > mark.checkSeq)
    .flatMap((c) => c.harms);
  const ambient = after.recentHarms.filter((h) => h.seq > mark.harmSeq);
  return [...fromChecks, ...ambient]
    .filter((h) => h.seq > mark.harmSeq)
    .sort((a, b) => a.seq - b.seq);
}

/**
 * Project the committed delta (mark → after) into ordered beats, walking the
 * run log from `mark.logLen`. Structural kinds map to beats; narrative-only
 * kinds (INFO, LOOT, CHOICE, INTERCEPT, DEATH_SAVE…) are folded into the
 * beat that owns them by the renderer, not emitted separately.
 *
 * `maxBeats` is the queue ceiling: when the delta overflows it, the skipped
 * head is compacted into a single `recap` beat (reopen-compact contract —
 * "vai al bivio" lands on the committed frontier after the tail plays).
 */
export function projectBeats(
  mark: BeatMark,
  after: QuestRunState,
  opts: { maxBeats: number },
): QuestBeat[] {
  const beats: QuestBeat[] = [];
  const nodes = after.visitedNodes.slice(mark.visitedLen);
  const checks = after.checkQueue.filter((c) => checkSeqOf(c) > mark.checkSeq);
  const harms = newHarms(after, mark);
  let vi = 0;
  let ci = 0;
  let hi = 0;

  for (const entry of after.log.slice(mark.logLen)) {
    switch (entry.kind) {
      case 'NODE': {
        const nodeId = nodes[vi];
        if (nodeId !== undefined) {
          const node = nodesFor(after)[nodeId];
          beats.push({
            id: `scene-${mark.visitedLen + vi}`,
            kind: 'scene',
            nodeId,
            title: node?.title ?? entry.text,
            body: node?.body,
          });
          vi += 1;
        }
        break;
      }
      case 'CHECK': {
        const check = checks[ci];
        if (check) {
          beats.push({ id: check.id, kind: 'check', check });
          ci += 1;
        }
        break;
      }
      case 'WOUND':
      case 'DEATH':
      case 'HARM': {
        const harm = harms[hi];
        if (harm) {
          beats.push({
            id: `harm-${harm.seq}`,
            kind: 'harm',
            harm,
            memberName: memberNameOf(after, harm.memberId),
            line: entry.text,
          });
          hi += 1;
        }
        break;
      }
      case 'QUEST_END': {
        if (!mark.ended) {
          beats.push({ id: 'end', kind: 'end', outcome: after.outcome, text: entry.text });
        }
        break;
      }
      default:
        break;
    }
  }

  /* Left-overs: structural diffs not echoed in the log (e.g. harms applied
   * without a WOUND/DEATH line) still must present — append them in order so
   * no committed event silently vanishes. */
  for (; ci < checks.length; ci += 1) {
    const check = checks[ci];
    if (check) beats.push({ id: check.id, kind: 'check', check });
  }
  for (; hi < harms.length; hi += 1) {
    const harm = harms[hi];
    if (harm) {
      beats.push({
        id: `harm-${harm.seq}`,
        kind: 'harm',
        harm,
        memberName: memberNameOf(after, harm.memberId),
        line: '',
      });
    }
  }

  if (beats.length <= opts.maxBeats) return beats;
  /* Ceiling exceeded: keep the tail (most recent, closest to the live
   * frontier) and compact the skipped head into one recap beat. */
  const skipped = beats.slice(0, beats.length - opts.maxBeats);
  const recap: RecapBeat = {
    id: 'recap',
    kind: 'recap',
    scenes: skipped.filter((b) => b.kind === 'scene').length,
    checks: skipped.filter((b) => b.kind === 'check').length,
    deaths: skipped.filter((b) => b.kind === 'harm' && b.harm.kind === 'death').length,
    wounds: skipped.filter((b) => b.kind === 'harm' && b.harm.kind !== 'death').length,
  };
  return [recap, ...beats.slice(beats.length - opts.maxBeats)];
}

const memberNameOf = (run: QuestRunState, memberId: string): string =>
  run.party.find((m) => m.id === memberId)?.name ?? memberId;

/* ------------------------------------------------------------------ */
/* Timed cursor — presentation side                                    */
/* ------------------------------------------------------------------ */

export interface BeatTiming {
  sceneMs: number;
  checkMs: number;
  harmMs: number;
  endMs: number;
  recapMs: number;
}

const beatMs = (beat: QuestBeat, t: BeatTiming): number =>
  beat.kind === 'scene'
    ? t.sceneMs
    : beat.kind === 'check'
      ? t.checkMs
      : beat.kind === 'harm'
        ? t.harmMs
        : beat.kind === 'end'
          ? t.endMs
          : t.recapMs;

export interface BeatCursor {
  /** The beat currently on stage — null once the queue is drained. */
  current: QuestBeat | null;
  /** Beats still queued after the current one. */
  remaining: number;
  /** Skip to the next beat (click-through / progressive skip). */
  skip: () => void;
  /** "Vai al bivio": drain the queue and land on the committed frontier. */
  flush: () => void;
}

/**
 * Timed cursor over the committed beat queue. The queue is append-only and
 * owned by `useQuestRun` (it lives across window mounts); the cursor is
 * per-window and starts at 0 — a remount replays the pending tail, which is
 * exactly the reopen-compact contract once `projectBeats` has capped it.
 *
 * - Auto-advance: each beat schedules the next after `beatMs` (fake-timer
 *   friendly: pure setTimeout).
 * - Click-through: `skip()` advances immediately; `flush()` drains to the
 *   frontier — the window wires click-anywhere → skip.
 * - Reduced motion: with `reducedMotion` the queue drains instantly — the
 *   player lands on the frontier; the beats still exist in the record.
 * - Background-tab/unmount safety: flushing is the caller's responsibility
 *   through `flush()`; the cursor never mutates committed state.
 */
export function useBeatCursor(
  beats: QuestBeat[],
  timing: BeatTiming,
  opts: { reducedMotion?: boolean } = {},
): BeatCursor {
  const [cursor, setCursor] = useState(0);
  const lenRef = useRef(beats.length);

  /* The queue is append-only while a mount lives; if it is cleared or a new
   * run starts (length shrinks), reset the cursor. A *grown* tail keeps the
   * cursor where it is — mid-beat beats appended behind it just queue up. */
  useEffect(() => {
    if (beats.length < lenRef.current || beats.length === 0) setCursor(beats.length);
    lenRef.current = beats.length;
  }, [beats.length]);

  useEffect(() => {
    if (opts.reducedMotion) setCursor(beats.length);
  }, [opts.reducedMotion, beats.length]);

  const drained = cursor >= beats.length;
  const current = drained ? null : (beats[cursor] ?? null);

  const skip = useCallback(() => setCursor((c) => Math.min(c + 1, beats.length)), [beats.length]);
  const flush = useCallback(() => setCursor(beats.length), [beats.length]);

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => setCursor((c) => c + 1), beatMs(current, timing));
    return () => clearTimeout(id);
  }, [current, timing]);

  return useMemo(
    () => ({ current, remaining: Math.max(0, beats.length - cursor - (current ? 1 : 0)), skip, flush }),
    [current, beats.length, cursor, skip, flush],
  );
}
