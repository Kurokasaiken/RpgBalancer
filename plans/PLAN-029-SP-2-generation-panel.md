---
title: 'PLAN-029 SP-2 — Live generation panel'
status: active
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp2-generation-panel` — artifact r003
  converged 3/3 eligible (chatgpt ACCEPT, deepseek ACCEPT+C-1/C-2 binding gates,
  gemini ACCEPT; grok removed provider_dead — prompts landed but no generation)
artifact_sha256: df820cc5d8c0312c654800103d79fa6c931ec1fdbf0f49b0a3e367b584569855
depends_on: PLAN-029 SP-1 (GimmickRegistry, kitSchemas, canonicalize/stripUndefinedDeep)
---

# SP-2 — Live generation panel (artifact r003)

r003 absorbs: deepseek REVISE (B-1..B-4 + N-1..N-6 — inputHash dropped, kitHash
+ effectiveKit snapshot in provenance, supersededBy derived index, single-entry
union, tuningFormDescriptors exhaustiveness); chatgpt REVISE ×2 (O-1 store seam
→ serialization boundary; O-2 effectiveKit snapshot; O-3 honest LabCatalogEntry
audit; O-4 synchronous GenerationRequest; final: sessionEpoch vs clear()-during-
hash race); gemini ACCEPT on r001 already.

## 0. Scope

W2 of PLAN-029: gimmick/kit/tuning pickers inside "Generated catalog" →
canonical `generate()` → fresh `LabCandidate` shown through the same explorer
surfaces (DFS tree + node detail + GenRunPlayer). No persistence (SP-6), no
gates (SP-3), no seed picker (stays in GenRunPlayer).

## 1. `LabCandidate` entity model

`src/ui/idleVillage/questGenLab/candidate.ts`:

```ts
export interface CandidateProvenance {
  readonly gimmickId: GimmickId;
  readonly kitId: KitId;
  readonly kitHash: string;            // sha256(canonicalize(stripUndefinedDeep(effectiveKit)))
  readonly effectiveKit: JsonValue;    // immutable snapshot — survives registry edits
  readonly effectiveTuning: JsonValue; // post-merge canonical JSON
}
export interface LabCandidate {
  readonly id: string;                 // `cand-${scenarioHash.slice(0,8)}-${seq}`; seq in reducer state, reset by clear()
  readonly scenario: QuestScenario;
  readonly scenarioHash: string;       // sha256(canonicalize(stripUndefinedDeep(scenario)))
  readonly provenance: CandidateProvenance;
  readonly supersedes?: string;        // only stored lineage field
}
export type CandidateStatus =
  | { kind: 'valid' }
  | { kind: 'stale'; reason: 'inputs-diverged' }
  | { kind: 'superseded'; by: string };
```

- `supersededBy` derived via `buildSupersededIndex(candidates)` (one O(n) memoized
  scan); `computeStatus(candidate, currentInputs, supersededBy?)`.
- Lineage invariants: `add` rejects missing target / self-link / cycle.
- STALE = input divergence: deepEqual of canonicalized {gimmickId, kitId,
  kitHash, effectiveTuning} vs current picker inputs. Reverting pickers un-marks.
  SUPERSEDED is structural, takes display precedence; axes stay independent.
- Failed generation: no row, no mutation, no fabricated link.
- `sessionEpoch` (reducer counter, bumped by clear()) captured into the
  GenerationRequest at submit; `add` commits only if epochs match — a pending
  hash resolving after clear() is dropped (chatgpt's residual race fix).

## 2. State home + SP-6 seam

Page-level `useReducer` in `QuestGenerationLabPage` (subtree-local state per
project rule — NOT Zustand). React-facing hook `useCandidates()` →
`{candidates, add, clear, hydrate}`.

**SP-6 seam = serialization boundary, not a live store interface**
(chatgpt O-1 fix):

```ts
// candidateSerialization.ts
export const LabCandidateSchema: z.ZodType<LabCandidate>;
export function serializeCandidates(cs: readonly LabCandidate[]): JsonValue;
export function hydrateCandidates(raw: unknown): LabCandidate[] | null;
```

SP-6 wires `PersistenceService.saveData/loadData` to these; components never
see it.

## 3. Explorer integration

```ts
export interface LabExplorerEntry {
  kind: 'baked' | 'candidate';
  entry: LabCatalogEntry;          // single source for explorer fields — no duplicated payload
  candidate?: LabCandidate;        // iff kind==='candidate' (badge/status only)
}
```

- Candidate `entry` built by the same scenario-driven derivations
  (stats/twists/traitsUsed/mechanicsUsed). `gimmickId`/`kitId` from `provenance`,
  never from `scenario.id`. `gen-<g>-<kit>` parser stays baked-only.
- `ScenarioExplorer` takes `entries` as prop; `selId` accepts `gen-*`/`cand-*`.
  DFS tree, node detail, GenRunPlayer consume `entry` unchanged.
- Candidates render newest-first ABOVE baked; provenance chip + status chip
  (SUPERSEDED precedence over STALE in single-badge UI).

## 4. Generation panel

Mount: inside "Generated catalog", gated by Author mode. i18n
`questGenLab.generate.*`; labUi primitives; slate/amber chrome.

- Gimmick ChipRow ← `GIMMICK_REGISTRY` (2 rows).
- Kit ChipRow ← explicit `kitsByGimmick` compatibility table in lab config
  (kit→gimmick NOT assumed on kit type; exhaustively type-checked).
- Tuning form ← `questGenLab/tuningFormDescriptors.ts` — `{key, labelKey, min,
  max, step}` per gimmick with `satisfies Record<keyof InferredTuning,
  FieldDescriptor>` (schema field w/o descriptor = compile error). Both tunings
  verified all-numeric.
- Generate disabled only when incomplete (no gimmick/kit); invalid tuning keeps
  it enabled so the error surface is reachable.
- Synchronous capture: `GenerationRequest {gimmickId, kitId, effectiveKit,
  effectiveTuning, supersedesCandidateId?, sessionEpoch}` — nothing re-reads
  form state after the first await.
- Pipeline: `kitSchema.safeParse` + `tuningSchema.safeParse` →
  `gimmick.generate(...)` → `computeScenarioHash` → build candidate from the
  request → `add`. Pending generate disables duplicate submits.
- Error surfaces (i18n, distinct): `tuning-schema`/`kit-schema` (issue paths),
  `generator-throw` (generic + collapsible dev details), `hash-failure` (retry;
  no row). Epoch check suppresses the error surface too after clear().

## 5. Hashing

`computeScenarioHash` = `stripUndefinedDeep → canonicalize → UTF-8 →
crypto.subtle.digest('SHA-256')` → 64 lowercase hex. Async accepted; no crypto
dep; uses exactly SP-1's primitives. `kitHash` same pipeline over effectiveKit
(see gate C-1).

## 6. Tasks T-1…T-7

| T | Task | Files | Tests |
|---|------|-------|-------|
| T-1 | types + computeStatus + buildSupersededIndex | `candidate.ts` | stale↔valid on divergence/revert, superseded precedence, lineage rejections |
| T-2 | useCandidates reducer + schema + serialize/hydrate | `candidateStore.ts`, `candidateSerialization.ts` | append order, seq reset, hydrate rejects, **clear()-during-pending-hash drops late result** |
| T-3 | computeScenarioHash + computeKitHash | `hash.ts` | determinism, key-order invariance, typed rejection on crypto failure |
| T-4 | LabExplorerEntry + builder + explorer prop refactor | `labModel.ts`, `ScenarioExplorer.tsx` | baked identical; selId both kinds; candidate-vs-baked same scenario → identical GenRunPlayer render |
| T-5 | GenerationPanel + descriptors + kitsByGimmick | `GenerationPanel.tsx`, `tuningFormDescriptors.ts`, lab config | kit filtering, invalid-input surface reachable, generator-throw, hash-failure retry, no-row-on-failure, dup-submit disabled, clear-during-hash suppresses error surface |
| T-6 | page wiring + merged entries | `QuestGenerationLabPage.tsx` | generate appends newest-first, superseded badge, baked untouched |
| T-7 | i18n it/en + pseudo | locale files | zero hardcoded strings |

## 7. Acceptance

Registry drives pickers; candidates newest-first above baked; identical
DFS/detail/play for candidates; distinct STALE/SUPERSEDED; regen appends +
backlinks; failed generation mutates nothing; `LabCandidateSchema` is the SP-6
contract; i18n-only strings; safeguards pass (lint scope, test scope,
build:check, kanban:lint).

## 8. Implementation-entry gates (binding)

- **C-1**: before T-3, pick kitHash source (SP-1 registry field vs SP-2
  `computeKitHash(effectiveKit)`); record choice in `candidate.ts` comment; no
  dead branch.
- **C-2**: before T-4, audit `LabCatalogEntry` field-by-field vs what a
  candidate honestly supplies from `{scenario, provenance}`; baked-only fields
  named, made optional, covered by a T-4 test. No silent optionalization.
- Epoch also gates the hash-failure error surface (T-5 test).

## 9. Non-goals

SP-1 internals; SP-3 gates; SP-4 MC UI; SP-5 drawers; SP-6 persistence/export;
runSeed/party (player); parallel engine; new page/silo.
