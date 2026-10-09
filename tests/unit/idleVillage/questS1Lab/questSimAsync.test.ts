/**
 * PLAN-019-S2.4 T-2 — `simulateQuestAsync` parity contract (r2 compute
 * budget): the chunked variant must produce bit-identical aggregates to the
 * synchronous `simulateQuest` — same seeds, same order, same rounding —
 * plus abort semantics (a superseded forecast never lands).
 */
import { describe, expect, it } from 'vitest';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import {
  defaultStrategy,
  simulateQuest,
  simulateQuestAsync,
} from '@/ui/idleVillage/questS1Lab/questSimulation';

const PRESET = GOBLIN_PRESETS[0].id;

describe('simulateQuestAsync — chunked parity', () => {
  it.each([37, 100, 250])('chunkRuns=%i → identical aggregates to sync', async (chunkRuns) => {
    const run = createRun(PRESET, 4242, 'goblin');
    const strategy = defaultStrategy(run);
    const sync = simulateQuest(run, strategy, { runs: 300, seed: 99 });
    const async_ = await simulateQuestAsync(run, strategy, { runs: 300, seed: 99, chunkRuns });
    expect(async_).toEqual(sync);
  });

  it('aborted mid-run → rejects, never resolves partial aggregates', async () => {
    const run = createRun(PRESET, 7, 'goblin');
    const signal = new AbortController();
    const promise = simulateQuestAsync(run, defaultStrategy(run), {
      runs: 2000,
      seed: 1,
      chunkRuns: 100,
      signal: signal.signal,
    });
    // Let the first chunk land, then abort — the next boundary must throw.
    window.setTimeout(() => signal.abort(), 30);
    await expect(promise).rejects.toThrow();
  });

  it('a second POI (rovine) keeps parity too — the accumulator is scenario-agnostic', async () => {
    const run = createRun('rv-eroe', 5, 'rovine');
    const strategy = defaultStrategy(run);
    const sync = simulateQuest(run, strategy, { runs: 150, seed: 21 });
    const async_ = await simulateQuestAsync(run, strategy, { runs: 150, seed: 21, chunkRuns: 50 });
    expect(async_).toEqual(sync);
  });
});
