/**
 * PLAN-039 / R-204 replay benchmark — B2 contract test.
 *
 * Seeded into the worktree before the executor runs. The executor must add
 * two new offers to `src/balancing/config/metaLayer/content.ts` so this test
 * passes. Scoring is done independently by the benchmark driver (the
 * executor's own claim is never trusted).
 */

import { describe, expect, it } from 'vitest';
import { loadMetaLayerConfig } from '@/balancing/config/metaLayer';
import { lintOpportunityGraph } from '@/engine/metaLayer/linter';

describe('PLAN-039 B2 — benchmark metaLayer offers', () => {
  const cfg = loadMetaLayerConfig();
  const byId = new Map(cfg.offers.map((o) => [o.id, o]));

  it('infil-toll-audit exists with the authored contract', () => {
    const offer = byId.get('infil-toll-audit');
    expect(offer, 'offer infil-toll-audit missing').toBeDefined();
    expect(offer!.family).toBe('infiltration');
    expect(offer!.tier).toBe(2);
    expect(offer!.provides).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'intel:toll-ledgers', delta: 1 })]),
    );
    expect(offer!.requires).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'capability', key: 'diplomacy' }),
      ]),
    );
  });

  it('race-market-leak exists and also provides intel:toll-ledgers (convergent intel)', () => {
    const offer = byId.get('race-market-leak');
    expect(offer, 'offer race-market-leak missing').toBeDefined();
    expect(offer!.family).toBe('race');
    expect(offer!.provides).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'intel:toll-ledgers', delta: 1 })]),
    );
  });

  it('linter stays clean: no errors and no unreachable offers', () => {
    const report = lintOpportunityGraph(cfg);
    expect(report.errors).toEqual([]);
    expect(report.stats.reachableOffers).toBe(cfg.offers.length);
  });
});
