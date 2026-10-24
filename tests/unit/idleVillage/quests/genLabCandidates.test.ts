/**
 * PLAN-029 SP-2 — unit tests for the live generation panel foundation:
 * candidate status/lineage (T-1), serialization seam (T-2), hashing (T-3),
 * explorer-entry builder (T-4).
 */

import { describe, expect, it } from 'vitest';
import {
  buildSupersededIndex,
  computeStatus,
  lineageOk,
  type LabCandidate,
} from '@/ui/idleVillage/questGenLab/candidate';
import {
  hydrateCandidates,
  LabCandidateSchema,
  serializeCandidates,
} from '@/ui/idleVillage/questGenLab/candidateSerialization';
import { candidateToExplorerEntry } from '@/ui/idleVillage/questGenLab/labModel';
import { computeKitHash, computeScenarioHash } from '@/ui/idleVillage/questGenLab/hash';
import { generateRaceScenario, RACE_DEFAULT_TUNING } from '@/balancing/config/idleVillage/quests/generation/raceGimmick';
import { PASSO_MONTANO_KIT } from '@/balancing/config/idleVillage/quests/generation/kits';
import type { JsonValue } from '@/balancing/config/idleVillage/quests/generation/canonicalize';

const scenario = generateRaceScenario(PASSO_MONTANO_KIT);

function cand(
  id: string,
  opts: Partial<LabCandidate> & { supersedes?: string } = {},
): LabCandidate {
  return {
    id,
    scenario,
    scenarioHash: `sha256-${id}`,
    provenance: {
      gimmickId: 'race',
      kitId: 'passo-montano',
      kitHash: 'sha256-kit',
      effectiveKit: { id: 'passo-montano' } as JsonValue,
      effectiveTuning: { goal: 6, twistChance: 50, twistRearmChance: 60 } as JsonValue,
    },
    ...opts,
  };
}

const sameInputs = {
  gimmickId: 'race' as const,
  kitId: 'passo-montano',
  kitHash: 'sha256-kit',
  effectiveTuning: { goal: 6, twistChance: 50, twistRearmChance: 60 } as JsonValue,
};

describe('computeStatus', () => {
  it('valid when inputs match provenance', () => {
    expect(computeStatus(cand('c1'), sameInputs)).toEqual({ kind: 'valid' });
  });

  it('stale on input divergence, un-marks on revert', () => {
    const c = cand('c1');
    const diverged = { ...sameInputs, effectiveTuning: { goal: 7 } as JsonValue };
    expect(computeStatus(c, diverged).kind).toBe('stale');
    expect(computeStatus(c, sameInputs).kind).toBe('valid');
  });

  it('superseded takes display precedence over stale', () => {
    const diverged = { ...sameInputs, kitHash: 'sha256-other' };
    expect(computeStatus(cand('c1'), diverged, 'c2')).toEqual({
      kind: 'superseded',
      by: 'c2',
    });
  });
});

describe('buildSupersededIndex', () => {
  it('maps superseded id → superseding id', () => {
    const list = [cand('a'), cand('b', { supersedes: 'a' }), cand('c', { supersedes: 'b' })];
    const idx = buildSupersededIndex(list);
    expect(idx.get('a')).toBe('b');
    expect(idx.get('b')).toBe('c');
    expect(idx.has('c')).toBe(false);
  });

  it('ignores links pointing outside the list', () => {
    expect(buildSupersededIndex([cand('a', { supersedes: 'ghost' })]).size).toBe(0);
  });
});

describe('lineageOk', () => {
  it('rejects missing target, self-link, and cycles', () => {
    const list = [cand('a'), cand('b', { supersedes: 'a' })];
    expect(lineageOk(list, cand('c', { supersedes: 'b' }))).toBe(true);
    expect(lineageOk(list, cand('c', { supersedes: 'ghost' }))).toBe(false);
    expect(lineageOk(list, cand('c', { supersedes: 'c' }))).toBe(false);
    expect(lineageOk(list, cand('a', { supersedes: 'b' }))).toBe(false); // b→a→b cycle
  });
});

describe('hashing (T-3)', () => {
  it('deterministic and key-order invariant', async () => {
    const h1 = await computeKitHash({ a: 1, b: { c: 2, d: 3 } });
    const h2 = await computeKitHash({ b: { d: 3, c: 2 }, a: 1 });
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^sha256-[0-9a-f]{64}$/);
  });

  it('scenario hash differs across different kits', async () => {
    const other = generateRaceScenario(PASSO_MONTANO_KIT, { goal: 7 });
    expect(await computeScenarioHash(scenario as never)).not.toBe(
      await computeScenarioHash(other as never),
    );
  });
});

describe('serialization seam (T-2)', () => {
  it('round-trips a candidate list', () => {
    const list = [cand('a'), cand('b', { supersedes: 'a' })];
    const hydrated = hydrateCandidates(serializeCandidates(list));
    expect(hydrated).toHaveLength(2);
    expect(hydrated![1]!.supersedes).toBe('a');
    expect(hydrated![0]!.scenario.id).toBe(scenario.id);
  });

  it('hydrate rejects malformed payloads all-or-nothing', () => {
    expect(hydrateCandidates([{ id: 'x' }])).toBeNull();
    expect(hydrateCandidates('garbage')).toBeNull();
    expect(hydrateCandidates(null)).toBeNull();
  });

  it('LabCandidateSchema validates a real candidate', () => {
    expect(LabCandidateSchema.safeParse(cand('a')).success).toBe(true);
  });
});

describe('candidateToExplorerEntry (T-4)', () => {
  it('derives explorer fields from the scenario, ids from provenance', () => {
    const e = candidateToExplorerEntry(cand('c1'));
    expect(e.kind).toBe('candidate');
    expect(e.entry.gimmickId).toBe('race');
    expect(e.entry.kitId).toBe('passo-montano');
    expect(e.entry.stats.nodes).toBeGreaterThan(0);
    expect(e.entry.mechanicsUsed).toContain('vars');
    expect(e.candidate?.id).toBe('c1');
  });
});
