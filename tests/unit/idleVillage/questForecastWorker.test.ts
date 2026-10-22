/**
 * R-265 — off-thread Monte Carlo forecast regression test.
 *
 * Contract of `simulateQuestOffThread` (via `estimateForPartyAsync`):
 *  - no `Worker` (jsdom/odd embedders) → chunked main-thread fallback,
 *    bit-identical to the sync `estimateForParty` for the same seed;
 *  - a posted request carries the WHOLE deterministic payload the worker
 *    needs (state, strategy, runs, seed, registered instance, content
 *    locale) and resolves with the worker's `sim`;
 *  - `abort` rejects with AbortError and terminates the worker — a stale
 *    estimate can never land after a newer assignment;
 *  - `onerror` falls back to the main-thread sim instead of failing.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  estimateForParty,
  estimateForPartyAsync,
  resolveQuestOffer,
} from '@/ui/idleVillage/questS1Lab/questOffer';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestForecastWorkerRequest } from '@/ui/idleVillage/questS1Lab/questForecast.worker';

const PARTY: LabMember[] = [
  { id: 'r1', name: 'A', role: 'leader', hp: 80, stats: { str: 60, con: 55, agi: 40, perc: 35, int: 30, cha: 30 } },
  { id: 'r2', name: 'B', role: 'member', hp: 60, stats: { str: 55, con: 50, agi: 45, perc: 40, int: 35, cha: 30 } },
];

const resolvedOffer = () =>
  resolveQuestOffer(questPoiById('poi-goblin')!, { signals: { daysPlayed: 8 }, bandSim: { runs: 100 } }).resolvedOffer;

const REAL_WORKER = globalThis.Worker;

afterEach(() => {
  vi.unstubAllGlobals();
  if (REAL_WORKER) vi.stubGlobal('Worker', REAL_WORKER);
});

describe('estimateForPartyAsync — worker contract (R-265)', () => {
  it('no Worker → main-thread fallback, bit-identical to sync estimate', async () => {
    vi.stubGlobal('Worker', undefined);
    const offer = resolvedOffer();
    const sync = estimateForParty(offer, PARTY, { runs: 120, seed: 42 });
    const async = await estimateForPartyAsync(offer, PARTY, { runs: 120, seed: 42 });
    if (sync === 'incomplete' || async === 'incomplete') throw new Error('party completa non stimata');
    expect(async.nSim).toBe(sync.nSim);
    expect(async.bands).toEqual(sync.bands);
    expect(async.sim).toEqual(sync.sim);
  });

  it('posts state + strategy + runs + seed + instance + locale to the worker', async () => {
    const posted: QuestForecastWorkerRequest[] = [];
    const fakeSim = { outcomePct: { reward: 1 }, anyDeathPct: 0 };
    class FakeWorker {
      onmessage: ((e: { data: unknown }) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      postMessage(msg: QuestForecastWorkerRequest) {
        posted.push(msg);
        queueMicrotask(() => this.onmessage?.({ data: { sim: fakeSim, workMs: 3 } }));
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FakeWorker);
    const timings: { workMs: number; yieldMs: number }[] = [];
    const result = await estimateForPartyAsync(resolvedOffer(), PARTY, {
      runs: 200,
      seed: 7,
      onChunkTiming: (t) => timings.push(t),
    });
    expect(posted).toHaveLength(1);
    const req = posted[0];
    expect(req.runs).toBe(200);
    expect(req.seed).toBe(7);
    expect(req.state).toBeTruthy();
    expect(req.strategy).toBeTruthy();
    expect(req.instance?.instanceId).toBe(resolvedOffer().instanceId);
    expect(typeof req.locale).toBe('string');
    expect(result).not.toBe('incomplete');
    if (result === 'incomplete') return;
    expect(result.sim).toEqual(fakeSim);
    expect(timings).toHaveLength(1);
    expect(timings[0].workMs).toBe(3);
  });

  it('abort → AbortError + worker terminated, stale estimate never resolves', async () => {
    let terminated = false;
    class HangingWorker {
      onmessage: ((e: { data: unknown }) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      postMessage() {}
      terminate() { terminated = true; }
    }
    vi.stubGlobal('Worker', HangingWorker);
    const signal = new AbortController();
    const pending = estimateForPartyAsync(resolvedOffer(), PARTY, { runs: 400, signal: signal.signal });
    const rejection = expect(pending).rejects.toThrowError(/abort/i);
    signal.abort();
    await rejection;
    expect(terminated).toBe(true);
  });

  it('worker error → main-thread fallback resolves instead of rejecting', async () => {
    class DeadWorker {
      onmessage: ((e: { data: unknown }) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      postMessage() {
        queueMicrotask(() => this.onerror?.(new Error('boot failed')));
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', DeadWorker);
    const offer = resolvedOffer();
    const result = await estimateForPartyAsync(offer, PARTY, { runs: 120, seed: 42 });
    const sync = estimateForParty(offer, PARTY, { runs: 120, seed: 42 });
    if (result === 'incomplete' || sync === 'incomplete') throw new Error('party completa non stimata');
    expect(result.sim).toEqual(sync.sim);
  });
});
