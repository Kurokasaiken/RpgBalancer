/**
 * candidate — the LabCandidate entity model (PLAN-029 SP-2 T-1).
 *
 * A candidate is a fresh scenario generated in-lab through the canonical
 * generator — never persisted here (SP-6 wires the serialization seam).
 *
 * Lineage + status semantics (contract §1):
 * - `supersedes` is the ONLY stored lineage field; `supersededBy` is a
 *   derived index (one O(n) scan), never stored.
 * - STALE = the current picker inputs diverge from the provenance that
 *   generated this candidate (reverting pickers un-marks it).
 * - SUPERSEDED is structural and takes display precedence; the two axes
 *   stay independent underneath.
 * - Failed generation produces no row, no mutation, no fabricated link.
 *
 * C-1 resolution: `kitHash` is computed by SP-2 (`computeKitHash` over
 * the effective kit snapshot) — no registry field carries a kit digest.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { JsonValue } from '@/balancing/config/idleVillage/quests/generation/canonicalize';
import { canonicalize, stripUndefinedDeep } from '@/balancing/config/idleVillage/quests/generation/canonicalize';
import type { GimmickId } from '@/balancing/config/idleVillage/quests/generation/gimmickRegistry';
import type { GimmickId as LabGimmickId } from './labModel';

/** How the candidate was produced — immutable input snapshot. */
export interface CandidateProvenance {
  readonly gimmickId: GimmickId;
  readonly kitId: string;
  /** sha256(canonicalize(stripUndefinedDeep(effectiveKit))). */
  readonly kitHash: string;
  /** The parsed kit as given to the generator — survives later edits. */
  readonly effectiveKit: JsonValue;
  /** Post-merge tuning (DEFAULT + partial), canonical JSON. */
  readonly effectiveTuning: JsonValue;
}

/** A generated scenario under lab inspection. */
export interface LabCandidate {
  /** `cand-<scenarioHash8>-<seq>` — seq lives in reducer state, reset by clear(). */
  readonly id: string;
  readonly scenario: QuestScenario;
  /** sha256(canonicalize(stripUndefinedDeep(scenario))). */
  readonly scenarioHash: string;
  readonly provenance: CandidateProvenance;
  /** Only stored lineage field — the candidate this one was regenerated from. */
  readonly supersedes?: string;
}

/** Status of a candidate on the two independent axes. */
export type CandidateStatus =
  | { kind: 'valid' }
  | { kind: 'stale'; reason: 'inputs-diverged' }
  | { kind: 'superseded'; by: string };

/**
 * Map a registry gimmick id to the lab's catalog-side gimmick id
 * (registry uses 'flood-vault'; catalog ids encode 'gen-flood-*').
 */
export function labGimmickIdOf(gimmickId: GimmickId): LabGimmickId {
  return gimmickId === 'flood-vault' ? 'flood' : gimmickId;
}

/**
 * Derived index: candidateId → the id of the candidate that supersedes
 * it. One O(n) memoizable scan; callers should memoize per list.
 * @param candidates the candidate list (any order).
 * @returns map from superseded id to superseding id.
 */
export function buildSupersededIndex(
  candidates: readonly LabCandidate[],
): ReadonlyMap<string, string> {
  const out = new Map<string, string>();
  const ids = new Set(candidates.map((c) => c.id));
  for (const c of candidates) {
    if (c.supersedes && ids.has(c.supersedes)) out.set(c.supersedes, c.id);
  }
  return out;
}

/**
 * Lineage guard for `add` — rejects missing target, self-link, and
 * cycles before a candidate carrying `supersedes` may be appended.
 * @param candidates existing list.
 * @param incoming candidate about to be added.
 */
export function lineageOk(
  candidates: readonly LabCandidate[],
  incoming: LabCandidate,
): boolean {
  if (!incoming.supersedes) return true;
  if (incoming.supersedes === incoming.id) return false;
  if (!candidates.some((c) => c.id === incoming.supersedes)) return false;
  // walk the chain: a cycle would revisit incoming.id
  let cur: string | undefined = incoming.supersedes;
  const seen = new Set<string>();
  while (cur) {
    if (cur === incoming.id) return false;
    if (seen.has(cur)) return false;
    seen.add(cur);
    cur = candidates.find((c) => c.id === cur)?.supersedes;
  }
  return true;
}

/** The picker inputs a candidate's staleness is judged against. */
export interface CurrentInputs {
  readonly gimmickId: GimmickId;
  readonly kitId: string;
  readonly kitHash: string;
  readonly effectiveTuning: JsonValue;
}

/**
 * Compute a candidate's display status. SUPERSEDED wins on the single
 * badge; otherwise divergence on {gimmickId, kitId, kitHash,
 * effectiveTuning} marks STALE (reverting the inputs un-marks it).
 */
export function computeStatus(
  candidate: LabCandidate,
  current: CurrentInputs,
  supersededBy?: string,
): CandidateStatus {
  if (supersededBy) return { kind: 'superseded', by: supersededBy };
  const p = candidate.provenance;
  const diverged =
    p.gimmickId !== current.gimmickId ||
    p.kitId !== current.kitId ||
    p.kitHash !== current.kitHash ||
    canonicalize(stripUndefinedDeep(p.effectiveTuning)) !==
      canonicalize(stripUndefinedDeep(current.effectiveTuning));
  return diverged ? { kind: 'stale', reason: 'inputs-diverged' } : { kind: 'valid' };
}
