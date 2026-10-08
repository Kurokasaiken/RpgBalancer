/**
 * Tests for the PLAN-023 presented-vs-committed pipeline — the pure reducer,
 * no React. The invariant under test: whatever the player does (watch, skip,
 * flush mid-beat), `settled` always means presented == committed.
 */
import { describe, expect, it } from 'vitest';
import {
  initialPresentedHp,
  isDrained,
  presentationReducer,
  type PresentationState,
} from '@/ui/idleVillage/questS1Lab/presentationTimeline';
import type { HarmEvent } from '@/ui/idleVillage/questS1Lab/questRun';

const harm = (seq: number, memberId: string, amount: number, before: number, kind: HarmEvent['kind'] = 'harm'): HarmEvent => ({
  seq,
  memberId,
  amount,
  kind,
  hpBefore: before,
  hpAfter: Math.max(0, before - amount),
});

/** Committed = post-resolution truth; presentation starts pre-harm and
 *  must drain to exactly this. */
const committed = { a: 60, b: 48, c: 90 };
const harms = [harm(1, 'c', 10, 100), harm(2, 'b', 12, 60, 'death')];

function fresh(): PresentationState {
  return presentationReducer(
    { key: 'idle', phase: 'settled', hp: {}, harmCursor: 0, killsShown: true },
    { type: 'init', key: 'chk-1', hp: initialPresentedHp(committed, harms), harms, kills: 0 },
  );
}

describe('presentationTimeline reducer', () => {
  it('init is idempotent under StrictMode double effects (same key = no-op)', () => {
    const s1 = fresh();
    const s2 = presentationReducer(s1, {
      type: 'init',
      key: 'chk-1',
      hp: { a: 1 },
      harms: [],
      kills: 0,
    });
    expect(s2).toBe(s1);
  });

  it('replays the full phase order and drains to committed hp', () => {
    let s = fresh();
    expect(s.phase).toBe('cinematic');
    expect(s.hp.c).toBe(100); // pre-harm snapshot — the drain must reach 90
    s = presentationReducer(s, { type: 'advance', harms, kills: 0 }); // → verdict
    s = presentationReducer(s, { type: 'advance', harms, kills: 0 }); // → harm
    s = presentationReducer(s, { type: 'advance', harms, kills: 0 }); // harm 1 presented
    expect(s.hp.c).toBe(90);
    s = presentationReducer(s, { type: 'advance', harms, kills: 0 }); // harm 2
    expect(s.hp.b).toBe(48);
    s = presentationReducer(s, { type: 'advance', harms, kills: 0 }); // → settle
    s = presentationReducer(s, { type: 'advance', harms, kills: 0 }); // → settled
    expect(s.phase).toBe('settled');
    expect(isDrained(s, committed)).toBe(true);
  });

  it('inserts the kills beat between verdict and harm', () => {
    let s = fresh();
    s = presentationReducer(s, { type: 'advance', harms, kills: 2 });
    expect(s.phase).toBe('verdict');
    s = presentationReducer(s, { type: 'advance', harms, kills: 2 });
    expect(s.phase).toBe('kills');
    s = presentationReducer(s, { type: 'advance', harms, kills: 2 });
    expect(s.phase).toBe('harm');
  });

  it('flush from any phase lands on committed (drain invariant)', () => {
    for (const steps of [0, 1, 2, 3]) {
      let s = fresh();
      for (let i = 0; i < steps; i += 1)
        s = presentationReducer(s, { type: 'advance', harms, kills: 0 });
      s = presentationReducer(s, { type: 'flush', harms });
      expect(s.phase).toBe('settled');
      expect(isDrained(s, committed)).toBe(true);
      expect(s.harmCursor).toBe(harms.length);
    }
  });

  it('settled is terminal — further advances are no-ops', () => {
    let s = fresh();
    s = presentationReducer(s, { type: 'flush', harms });
    const again = presentationReducer(s, { type: 'advance', harms, kills: 0 });
    expect(again).toBe(s);
  });
});
