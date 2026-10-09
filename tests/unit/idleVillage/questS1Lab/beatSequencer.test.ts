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
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questScenarioGoblin';
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

  it('a resolved check becomes a check beat carrying the authored verdict', () => {
    const run = timedRun();
    submitCommand(run, 'gob-partenza', { tick: 0 });
    const mark = beatMark(run);
    submitCommand(run, 'gob-cerca-tracce', { tick: 10 });
    const beats = projectBeats(mark, run, { maxBeats: MAX });
    const check = beats.find((b) => b.kind === 'check');
    expect(check).toBeDefined();
    expect(check!.id).toBe('chk-1');
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
});
