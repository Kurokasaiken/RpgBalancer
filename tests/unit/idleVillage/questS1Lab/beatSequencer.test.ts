/**
 * beatSequencer — PLAN-025 T-008: committed deltas project into ordered
 * beats with stable ids, the cursor replays them under fake timers, the
 * ceiling compacts into a recap, and E1 (multi-death in one commit) steps
 * member by member instead of collapsing into a paragraph.
 */
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  createRun,
  matureReady,
  submitCommand,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import {
  beatMark,
  projectBeats,
  useBeatCursor,
  type BeatTiming,
  type QuestBeat,
} from '@/ui/idleVillage/questS1Lab/beatSequencer';

const TICKS = 100;
const PARTY = GOBLIN_PRESETS[0].id;
const MAX = 24;
const TIMING: BeatTiming = { sceneMs: 100, checkMs: 200, harmMs: 50, endMs: 100, recapMs: 100 };

const timedRun = (seed = 42) => createRun(PARTY, seed, 'goblin', undefined, { nodeTicks: TICKS, startTick: 0 });

const atChoice = (state: QuestRunState, nodeId: string, tick = 0) => {
  state.nodeId = nodeId;
  state.visitedNodes.push(nodeId);
  state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick };
};

const kinds = (beats: QuestBeat[]) => beats.map((b) => b.kind);

describe('projectBeats — committed deltas become ordered beats', () => {
  it('a command to a timed node projects its scene beat', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    const mark = beatMark(run);
    submitCommand(run, 'gob-fermati', { tick: 0 });
    const beats = projectBeats(mark, run, { maxBeats: MAX });
    expect(kinds(beats)).toEqual(['scene']);
    expect(beats[0]).toMatchObject({ nodeId: 'gob-ritorno' });
  });

  it('maturation beats keep the log order — harms before the next scene', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    const mark = beatMark(run);
    matureReady(run, TICKS); // arrive at the ambush (scene, pending)
    matureReady(run, 2 * TICKS); // the toll lands, then the ambush choice
    const beats = projectBeats(mark, run, { maxBeats: MAX });
    expect(beats[0]).toMatchObject({ kind: 'scene', nodeId: 'gob-agguato' });
    const harmIdx = beats.findIndex((b) => b.kind === 'harm');
    const lastScene = beats.map((b, i) => (b.kind === 'scene' ? i : -1)).filter((i) => i >= 0).pop()!;
    expect(harmIdx).toBeGreaterThan(0);
    expect(harmIdx).toBeLessThan(lastScene); // damage lands BEFORE the next scene
    expect(beats[beats.length - 1]).toMatchObject({ kind: 'scene', nodeId: 'gob-agguato-scelta' });
  });

  // INV:beat-sequencer.INV-1
  it('a resolved check becomes a check beat carrying the authored verdict', () => {
    const run = timedRun();
    const mark = beatMark(run);
    submitCommand(run, 'gob-cerca-tracce', { tick: run.frontier.readyAt });
    const beats = projectBeats(mark, run, { maxBeats: MAX });
    const check = beats.find((b) => b.kind === 'check');
    expect(check).toBeDefined();
    expect(check!.id).toBe('chk-1');
  });

  /* R-241 B1 — «quando scelgo qualcosa l'immagine cambia e nn dovrebbe»:
   *  the `CHECK:` commit pushed the check node into `visitedNodes` WITHOUT a
   *  `NODE` log entry, so the positional zip in `projectBeats` bound the next
   *  `NODE` entry to the check node — the arrival scene beat then painted the
   *  check node's title/art (the image swapped to a wrong node). */
  // INV:quest-run.INV-2 — every `visitedNodes` push is echoed by a `NODE` log
  // entry, in order; the `CHECK:` route keeps the same invariant `arriveNode`
  // keeps everywhere else.
  it('every visited-node push is echoed by a NODE log entry — CHECK: path included', () => {
    const run = timedRun();
    const mark = beatMark(run);
    submitCommand(run, 'gob-cerca-tracce', { tick: run.frontier.readyAt });
    const newVisited = run.visitedNodes.slice(mark.visitedLen);
    const newNodeLogs = run.log.slice(mark.logLen).filter((e) => e.kind === 'NODE');
    expect(newVisited).toEqual(['gob-tracce-per', run.nodeId]);
    expect(newNodeLogs.length).toBe(newVisited.length);
  });

  // INV:beat-sequencer.INV-2 — a `check`-kind node owns a check beat, never a
  // scene beat; the arrival scene binds to ITS node, so the theatre image only
  // changes when that scene reaches the stage.
  it('binds the arrival scene beat to its own node — never to the check node', () => {
    const run = timedRun();
    const mark = beatMark(run);
    submitCommand(run, 'gob-cerca-tracce', { tick: run.frontier.readyAt });
    const beats = projectBeats(mark, run, { maxBeats: MAX });
    const sceneIds = beats.filter((b) => b.kind === 'scene').map((b) => (b as { nodeId: string }).nodeId);
    expect(sceneIds).not.toContain('gob-tracce-per');
    expect(sceneIds).toEqual([run.nodeId]);
    /* Ordering is presentation-meaningful: the astrolabe (check beat) and the
     * consequence harm play BEFORE the arrival scene cuts in. */
    expect(kinds(beats)).toEqual(['check', 'harm', 'scene']);
  });

  it('E1: each committed harm is its own beat — a multi-death steps member by member', () => {
    // Find a seed where the ambush hurts more than one member.
    for (let seed = 1; seed <= 60; seed += 1) {
      const run = timedRun(seed);
      atChoice(run, 'gob-esplora-extra');
      submitCommand(run, 'gob-fermati', { tick: 0 });
      matureReady(run, TICKS);
      const mark = beatMark(run);
      matureReady(run, 2 * TICKS);
      const beats = projectBeats(mark, run, { maxBeats: MAX });
      const harms = beats.filter((b) => b.kind === 'harm');
      if (harms.length >= 2) {
        const ids = new Set(harms.map((b) => b.id));
        expect(ids.size).toBe(harms.length); // one stable id per harm event
        return;
      }
    }
    throw new Error('no seed with a multi-harm ambush in 1..60');
  });

  it('a terminal commit projects the end beat with the outcome', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    run.flags.push('sterminio');
    run.objectiveDone = true;
    const mark = beatMark(run);
    submitCommand(run, 'gob-fermati', { tick: 0 });
    matureReady(run, TICKS);
    const beats = projectBeats(mark, run, { maxBeats: MAX });
    const end = beats.find((b) => b.kind === 'end');
    expect(end).toMatchObject({ outcome: 'reward' });
    expect(beats[beats.length - 1]!.kind).toBe('end');
  });

  it('is deterministic: same mark + same state → same beats', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    const mark = beatMark(run);
    submitCommand(run, 'gob-fermati', { tick: 0 });
    matureReady(run, TICKS);
    const a = projectBeats(mark, run, { maxBeats: MAX });
    const b = projectBeats(mark, run, { maxBeats: MAX });
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });

  it('over the ceiling, the skipped head compacts into a recap beat', () => {
    const run = timedRun(3);
    atChoice(run, 'gob-esplora-extra');
    const mark = beatMark(run);
    submitCommand(run, 'gob-fermati', { tick: 0 });
    matureReady(run, TICKS);
    matureReady(run, 2 * TICKS);
    const full = projectBeats(mark, run, { maxBeats: MAX });
    const capped = projectBeats(mark, run, { maxBeats: 1 });
    expect(capped[0]!.kind).toBe('recap');
    expect(capped.length).toBe(Math.min(full.length, 1) + (full.length > 1 ? 1 : 0));
    const recap = capped[0] as Extract<QuestBeat, { kind: 'recap' }>;
    expect(recap.scenes + recap.checks + recap.deaths + recap.wounds).toBeGreaterThan(0);
  });

  it('a mark at the latest state projects nothing', () => {
    const run = timedRun();
    const mark = beatMark(run);
    expect(projectBeats(mark, run, { maxBeats: MAX })).toEqual([]);
  });
});

describe('useBeatCursor — timed replay (fake timers)', () => {
  it('auto-advances each beat after its configured duration', () => {
    vi.useFakeTimers();
    try {
      const beats: QuestBeat[] = [
        { id: 's1', kind: 'scene', nodeId: 'n1', title: 'Uno' },
        { id: 's2', kind: 'scene', nodeId: 'n2', title: 'Due' },
      ];
      const { result } = renderHook(() => useBeatCursor(beats, TIMING));
      expect(result.current.current?.id).toBe('s1');
      act(() => vi.advanceTimersByTime(TIMING.sceneMs));
      expect(result.current.current?.id).toBe('s2');
      act(() => vi.advanceTimersByTime(TIMING.sceneMs));
      expect(result.current.current).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('skip moves to the next beat immediately; flush lands on the frontier', () => {
    vi.useFakeTimers();
    try {
      const beats: QuestBeat[] = [
        { id: 'a', kind: 'scene', nodeId: 'a', title: 'A' },
        { id: 'b', kind: 'scene', nodeId: 'b', title: 'B' },
        { id: 'c', kind: 'scene', nodeId: 'c', title: 'C' },
      ];
      const { result } = renderHook(() => useBeatCursor(beats, TIMING));
      act(() => result.current.skip());
      expect(result.current.current?.id).toBe('b');
      expect(result.current.remaining).toBe(1);
      act(() => result.current.flush());
      expect(result.current.current).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reduced motion drains instantly — no beat ever occupies the stage', () => {
    const beats: QuestBeat[] = [{ id: 'a', kind: 'scene', nodeId: 'a', title: 'A' }];
    const { result } = renderHook(() => useBeatCursor(beats, TIMING, { reducedMotion: true }));
    expect(result.current.current).toBeNull();
  });

  /* R-242 — «quando chiudo e riapro l'immagine al centro si comporta in
   *  modo strano»: the queue owner (`useQuestRun`, lives across mounts)
   *  holds the cursor; a window remount must resume at the HELD beat, not
   *  replay beats the player already watched (scene/cue/geometry flap). */
  // INV:beat-sequencer.INV-3 — with a shared cursorRef a remount resumes at
  // the held beat; only the pending tail replays.
  it('a shared cursorRef makes a remount resume at the held beat — no replay of consumed beats', () => {
    vi.useFakeTimers();
    try {
      const beats: QuestBeat[] = [
        { id: 'a', kind: 'scene', nodeId: 'a', title: 'A' },
        { id: 'b', kind: 'scene', nodeId: 'b', title: 'B' },
        { id: 'c', kind: 'scene', nodeId: 'c', title: 'C' },
      ];
      const cursorRef = { current: 0 };
      const first = renderHook(() => useBeatCursor(beats, TIMING, { cursorRef }));
      act(() => first.result.current.skip()); // 'a' presented, 'b' on stage
      expect(first.result.current.current?.id).toBe('b');
      first.unmount(); // the window closed
      const second = renderHook(() => useBeatCursor(beats, TIMING, { cursorRef }));
      expect(second.result.current.current?.id).toBe('b');
      expect(second.result.current.remaining).toBe(1); // 'c' only — 'a' is not re-counted
    } finally {
      vi.useRealTimers();
    }
  });

  it('writes every advance through to cursorRef (skip, flush, auto-advance)', () => {
    vi.useFakeTimers();
    try {
      const beats: QuestBeat[] = [
        { id: 'a', kind: 'scene', nodeId: 'a', title: 'A' },
        { id: 'b', kind: 'scene', nodeId: 'b', title: 'B' },
      ];
      const cursorRef = { current: 0 };
      const { result } = renderHook(() => useBeatCursor(beats, TIMING, { cursorRef }));
      act(() => result.current.skip());
      expect(cursorRef.current).toBe(1);
      act(() => vi.advanceTimersByTime(TIMING.sceneMs));
      expect(cursorRef.current).toBe(2); // drained — reopen lands on the frontier
    } finally {
      vi.useRealTimers();
    }
  });
});
