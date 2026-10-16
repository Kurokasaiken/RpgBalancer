/**
 * questOverlayIdentity — PLAN-040 T-003a/T-005: the run's overlay-identity
 * contract (checkSeq / visitSeq / cursorVisitSeq / dismissedUpTo) is what the
 * external overlay + outcome toast reason over. These tests pin:
 * - `checkSeq` allocated atomically at resolution, strictly monotonic and
 *   unique across the whole run, deterministic per seed;
 * - `visitSeq` stamped in the same mutation as the resolution; a check is
 *   settled iff `visitSeq < cursorVisitSeq` (immune to graph loops);
 * - `dismissedUpTo` never lowers and hydrates as
 *   `max(persisted, highestSettled)`;
 * - legacy backfill (`normalizeRunOverlayIdentity`) validates and
 *   deterministically re-sequences malformed/duplicate data without
 *   inventing order;
 * - the event contract (`checkEventOf` / `isStaleCheckEvent`) rejects
 *   cross-run, malformed and already-dismissed events.
 */
import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  availableOptions,
  checkHistory,
  createRun,
  highestSettledCheckSeq,
  normalizeRunOverlayIdentity,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { checkEventOf, isStaleCheckEvent } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const PRESET = GOBLIN_PRESETS[0].id;

/** Plays greedy to the end — resolves every check the seed produces. */
const drivenRun = (seed: number, steps = 80): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  for (let i = 0; i < steps && !run.ended; i += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  return run;
};

describe('PLAN-040 T-003a — overlay identity on the engine', () => {
  it('checkSeq is strictly monotonic, unique and allocated from the persisted counter', () => {
    const run = drivenRun(42);
    const checks = checkHistory(run);
    expect(checks.length).toBeGreaterThan(0);
    const seqs = checks.map((c) => c.checkSeq);
    expect(new Set(seqs).size).toBe(seqs.length);
    for (const s of seqs) {
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThanOrEqual(run.checkSeq);
    }
    /* The allocator's high-water mark equals the max allocated seq. */
    expect(run.checkSeq).toBe(Math.max(...seqs));
  });

  it('same seed produces the same identity sequence (deterministic replay)', () => {
    const a = checkHistory(drivenRun(7)).map((c) => `${c.id}:${c.checkSeq}@${c.visitSeq}`);
    const b = checkHistory(drivenRun(7)).map((c) => `${c.id}:${c.checkSeq}@${c.visitSeq}`);
    expect(a).toEqual(b);
  });

  it('a check settles once the cursor visits past its node (visitSeq < cursorVisitSeq)', () => {
    const run = drivenRun(42);
    const checks = checkHistory(run);
    /* Every check's visitSeq is a real visit; the cursor at least reaches it. */
    for (const c of checks) expect(c.visitSeq).toBeGreaterThanOrEqual(1);
    /* Settled ones are exactly those whose visit precedes the cursor. */
    const settled = checks.filter((c) => c.visitSeq < run.cursorVisitSeq);
    expect(highestSettledCheckSeq(run)).toBe(settled.reduce((m, c) => Math.max(m, c.checkSeq), 0));
  });

  it('cursorVisitSeq counts one entry per visited node (start included)', () => {
    const run = drivenRun(42);
    expect(run.cursorVisitSeq).toBe(run.visitedNodes.length);
  });
});

describe('PLAN-040 T-003a — legacy backfill (normalizeRunOverlayIdentity)', () => {
  const legacyOf = (run: QuestRunState): QuestRunState => {
    const copy = JSON.parse(JSON.stringify(run)) as QuestRunState;
    delete (copy as unknown as Record<string, unknown>).cursorVisitSeq;
    delete (copy as unknown as Record<string, unknown>).dismissedUpTo;
    for (const c of checkHistory(copy)) {
      delete (c as unknown as Record<string, unknown>).checkSeq;
      delete (c as unknown as Record<string, unknown>).visitSeq;
      delete (c as unknown as Record<string, unknown>).beatIndex;
    }
    return copy;
  };

  it('backfills identity from chk-N ids and treats stripped visitSeq as settled history', () => {
    const run = normalizeRunOverlayIdentity(legacyOf(drivenRun(42)));
    const checks = checkHistory(run);
    expect(run.cursorVisitSeq).toBe(run.visitedNodes.length);
    const seqs = checks.map((c) => c.checkSeq);
    expect(seqs.every((s) => Number.isInteger(s) && s > 0)).toBe(true);
    expect(new Set(seqs).size).toBe(seqs.length);
    /* Unknown-provenance visits (0) are settled → absorbed by dismissedUpTo. */
    expect(run.dismissedUpTo).toBe(Math.max(0, highestSettledCheckSeq(run)));
    expect(run.dismissedUpTo).toBe(Math.max(...seqs));
  });

  it('duplicated checkSeq values are re-sequenced deterministically — order never inferred', () => {
    const run = normalizeRunOverlayIdentity(legacyOf(drivenRun(42)));
    const checks = checkHistory(run);
    /* Corrupt two records with the same seq. */
    checks[0].checkSeq = checks[1].checkSeq;
    const again = normalizeRunOverlayIdentity(run);
    const seqs = checkHistory(again).map((c) => c.checkSeq);
    expect(new Set(seqs).size).toBe(seqs.length);
    /* Re-sequenced in a seq space above the allocator's high mark — the
     * run counter is raised so no future check reuses them. */
    expect(Math.min(...seqs)).toBeGreaterThan(0);
    expect(again.checkSeq).toBeGreaterThanOrEqual(Math.max(...seqs));
  });

  it('a persisted dismissedUpTo is never lowered by hydration', () => {
    const run = legacyOf(drivenRun(42));
    run.dismissedUpTo = 999;
    normalizeRunOverlayIdentity(run);
    expect(run.dismissedUpTo).toBe(999);
  });
});

describe('PLAN-040 T-003a — the event contract', () => {
  it('checkEventOf carries runId, checkSeq, visitSeq, beatIndex, outcome', () => {
    const run = drivenRun(42);
    const check = checkHistory(run)[0];
    const evt = checkEventOf(run, check);
    expect(evt).toEqual({
      runId: runIdOf(run),
      checkSeq: check.checkSeq,
      visitSeq: check.visitSeq,
      beatIndex: check.beatIndex,
      outcome: check.verdict,
    });
  });

  it('isStaleCheckEvent rejects cross-run, malformed and dismissed events', () => {
    const run = drivenRun(42);
    const check = checkHistory(run)[0];
    const evt = checkEventOf(run, check)!;
    expect(isStaleCheckEvent(evt, run)).toBe(false);
    expect(isStaleCheckEvent(evt, null)).toBe(true);
    expect(isStaleCheckEvent({ ...evt, runId: 'other-run' }, run)).toBe(true);
    expect(isStaleCheckEvent({ ...evt, checkSeq: 0 }, run)).toBe(true);
    run.dismissedUpTo = check.checkSeq;
    expect(isStaleCheckEvent(evt, run)).toBe(true);
  });
});
