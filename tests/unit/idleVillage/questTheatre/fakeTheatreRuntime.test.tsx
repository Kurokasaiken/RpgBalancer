/**
 * Fake theatre runtime — contract tests (PLAN-021 T-002).
 *
 * Proves the read-model can be populated without the theatre synthesising
 * fields, and that the frontier contract holds: resolved + current only,
 * awaitingPlayer at decision nodes, stale-intent rejection.
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFakeTheatreRun } from '@/ui/idleVillage/questTheatre/fakeTheatreRuntime';
import {
  theatreBlockedFixture,
  theatreDemoFixture,
  theatreUnsupportedFixture,
} from '@/ui/idleVillage/questTheatre/fixtures';
import type { TheatreIntent } from '@/ui/idleVillage/questTheatre/theatreContract';

function decision(nodeId: string, frontierVersion: number, optionId = 'sneak'): TheatreIntent {
  return {
    kind: 'submitDecision',
    commandId: `cmd-${optionId}`,
    nodeId,
    expectedFrontierVersion: frontierVersion,
    optionId,
  };
}

describe('useFakeTheatreRun', () => {
  it('stops at the first decision node and exposes resolved + current only', () => {
    const { result } = renderHook(() => useFakeTheatreRun(theatreDemoFixture));

    act(() => {
      result.current.setAutoAdvance(false);
      result.current.advanceOnce(); // n-departure
      result.current.advanceOnce(); // n-river
    });

    const { nodes, runState, log } = result.current.snapshot;
    expect(runState).toBe('running');
    expect(nodes).toHaveLength(3); // 2 resolved + current, never beyond frontier
    expect(nodes[0].state).toBe('resolved');
    expect(nodes[1].state).toBe('resolved');
    expect(nodes[2].nodeId).toBe('n-approach');
    expect(nodes[2].state).toBe('awaitingPlayer');
    expect(log.length).toBeGreaterThanOrEqual(2);
  });

  it('accepts a decision and rejects a stale frontierVersion', () => {
    const { result } = renderHook(() => useFakeTheatreRun(theatreDemoFixture));

    act(() => {
      result.current.setAutoAdvance(false);
      result.current.advanceOnce();
      result.current.advanceOnce();
    });

    const stale = result.current.snapshot.frontierVersion;
    act(() => {
      expect(result.current.dispatch(decision('n-approach', stale))).toEqual({ status: 'accepted' });
    });
    // frontierVersion bumped → replaying the same intent is now stale
    act(() => {
      const r = result.current.dispatch(decision('n-approach', stale));
      expect(r.status).toBe('rejected');
      if (r.status === 'rejected') expect(r.reason).toBe('stale');
    });
    expect(result.current.snapshot.nodes.at(-1)?.nodeId).toBe('n-sneak-check');
  });

  it('retreat ends the run as fled without needing more input', () => {
    const { result } = renderHook(() => useFakeTheatreRun(theatreDemoFixture));
    act(() => {
      result.current.setAutoAdvance(false);
      result.current.advanceOnce();
      result.current.advanceOnce();
    });
    const v = result.current.snapshot.frontierVersion;
    act(() => {
      result.current.dispatch({ kind: 'retreat', commandId: 'r1', nodeId: 'n-approach', expectedFrontierVersion: v });
    });
    expect(result.current.snapshot.runState).toBe('fled');
    // a further intent on a terminal run is rejected
    const r = result.current.dispatch(decision('n-approach', result.current.snapshot.frontierVersion));
    expect(r.status).toBe('rejected');
  });

  it('marks unknown kinds as unsupported instead of failing silently', () => {
    const { result } = renderHook(() => useFakeTheatreRun(theatreUnsupportedFixture));
    expect(result.current.snapshot.nodes[0].state).toBe('unsupported');
    act(() => {
      result.current.advanceOnce();
    });
    // unsupported does not advance on its own
    expect(result.current.snapshot.nodes[0].state).toBe('unsupported');
    expect(result.current.snapshot.runState).toBe('running');
  });

  it('exposes the runtime-provided blockedReason on the frontier', () => {
    const { result } = renderHook(() => useFakeTheatreRun(theatreBlockedFixture));
    act(() => {
      result.current.setAutoAdvance(false);
      result.current.advanceOnce();
    });
    expect(result.current.snapshot.blockedReason).toContain('ponte');
    expect(result.current.snapshot.nodes.at(-1)?.state).toBe('awaitingPlayer');
  });
});

/**
 * T-002 probe (binary): the STRUCTURAL fields (list A) of the read-model must
 * be poppable from a serialised `questRun` state via a pure function, on both
 * authored quests. Temporal fields (list B) are absent by construction.
 */
describe('probeTheatreSnapshot — structural fields from questRun', () => {
  it.each(['cassa', 'rovine'] as const)(
    'populates list-A fields on the %s quest without theatre synthesis',
    async (questId) => {
      const { createRun, applyChoice, availableOptions, nodesFor } = await import(
        '@/ui/idleVillage/questS1Lab/questRun'
      );
      const { probeTheatreSnapshot } = await import(
        '@/ui/idleVillage/questTheatre/probeQuestRun'
      );

      let state = createRun('preset-standard', 7, questId);
      const trail: string[] = [];
      // walk a few player-visible steps, recording the visited-node trail
      // (questRun does not serialise it — recorded finding for S2)
      for (let i = 0; i < 3 && !state.ended; i += 1) {
        const opts = availableOptions(state);
        const pick = opts.find((o) => !o.disabled);
        if (!pick) break;
        trail.push(state.nodeId);
        state = applyChoice(state, pick.id);
      }

      const snapshot = probeTheatreSnapshot(state, trail);
      const nodes = nodesFor(state);

      expect(snapshot.contractVersion).toBe(1);
      expect(snapshot.party.length).toBeGreaterThan(0);
      expect(snapshot.party.every((m) => m.id && m.name && m.state)).toBe(true);
      expect(snapshot.nodes.at(-1)?.nodeId).toBe(state.nodeId);
      expect(snapshot.nodes.at(-1)?.title).toBe(nodes[state.nodeId]?.title);
      // every resolved node carries a kind + summary
      for (const node of snapshot.nodes.slice(0, -1)) {
        expect(node.state).toBe('resolved');
        expect(node.kind).toBeTruthy();
      }
      // choice nodes expose runtime options with labels
      if (nodes[state.nodeId]?.kind === 'choice') {
        expect(snapshot.nodes.at(-1)?.options?.length).toBeGreaterThan(0);
      }
    },
  );
});
