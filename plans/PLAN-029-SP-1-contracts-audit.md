---
title: 'PLAN-029 SP-1 — Contracts audit + GimmickRegistry'
status: candidate
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp1-contracts` — artifact r003
  converged 4/4 (chatgpt T-020, deepseek T-021, gemini T-022, grok T-023)
---

# SP-1 — Contracts audit + GimmickRegistry (artifact r003)

r003 absorbs acceptance-round objections: chatgpt OBJECT (engineVersion in
generation envelope), deepseek OBJECT ×2 (localized claim sourcing — now
VERIFIED with citations; undefined strip — now `stripUndefinedDeep` owned by
SP-1), plus 3 hygiene notes (ledger Source check, T-2→T-5 edge, T-7 fallback
owner). Prior absorption notes below.

r002 absorbed round-2 critiques: chatgpt REVISE (5), deepseek REVISE (4+notes), gemini REVISE (1 — rejected with evidence), grok CONCEDE (5 non-fatal folds).

## 0. Scope & failure modes (unchanged)

SP-1 freezes contracts; adds no capability. Prevents seam drift, diagnostic
laundering, receipt rot. All new modules co-locate in
`src/balancing/config/idleVillage/quests/generation/`.

## 1. Contracts-audit doc

Location: `context/QUEST_GEN_LAB_CONTRACTS.md`. Committed artifact; Director
ratification is the hard ordering gate (T-2) — no registry code before it.

Outline (revised):
1. Purpose, scope, authority, non-goals.
2. **Evidence ledger — a literal table in the doc** (deepseek note): every claim
   labelled VERIFIED / PROPOSED / RATIFIED / OPEN with source path + symbol.
   Untested contracts are never "verified".
3. Generator contracts: both signatures verbatim, purity/sync, **merge
   semantics named explicitly** — `mergedTuning = {...DEFAULT_TUNING, ...partial}`
   is part of the generator contract, covered by `generatorVersion` (deepseek-3).
4. Input schemas & type ownership.
5. Engine & persistence surface (audit-only notes for
   ScenarioInstance/LabMember/PartyPreset/createRun).
6. Diagnostic pipeline & applicability: **separate inventory table of
   diagnostic gates** (applicability criteria, execution owner, status
   semantics) — DISTINCT from the superRefine table (chatgpt-3, deepseek-1).
   NOT_RUN/NOT_APPLICABLE is a distinct status.
7. superRefine coverage map: hard-gate table only. **Source-of-truth rule**
   (grok fold): derived once from the committed schema; any schema change
   requires a new audit revision. The claim "trait checks are hard" enters the
   ledger as PROPOSED → RATIFIED at T-2, not asserted (deepseek-1).
8. Baked-5 provenance table + **per-kit schema-parse verification result**
   (each baked kit — incl. narrated Localized wrappers — checked against its
   row's schema variant; failures documented, §T-4 contingency).
9. Canonical serialization spec (normative, §4) + golden vectors (§5).
10. Registry contract (§2).
11. Receipt shapes + hash-envelope specs (§5) + version-field ownership
    (owner, update rule, compatibility meaning per field — chatgpt-4).
12. Task sequence T-1…T-7 + acceptance + exclusions.

## 2. GimmickRegistry

File: `generation/gimmickRegistry.ts`. Same discriminated-union shape as r001,
with revisions:

```ts
// DiagnosticGateId is NOT pinned here: it is an OPEN deliverable of T-1/T-2,
// exported as a const tuple from generation/diagnosticGates.ts — the single
// module both the audit doc §6 table and the registry import (deepseek-1).
// The r001 guess ('hookCoverage'|'vocabCoherence'|'mcDiagnostic') is withdrawn.
export type DiagnosticGateId = typeof DIAGNOSTIC_GATE_IDS[number]; // T-1/T-2 derives the tuple
```

- `generate` = identity reference to canonical generator; no wrapper/dispatch.
- `declaredOptOuts: readonly DiagnosticGateId[]` — opt-out means
  NOT_RUN/NOT_APPLICABLE, never suppressed-PASS. **v1 rows ship with `[]`**
  unless the audit supplies concrete evidence a diagnostic is genuinely
  inapplicable (chatgpt-3).
- Hard gates are absent from the union by construction — tested: a row cannot
  name schema/graph gates; unknown ids fail; opt-out → explicit NOT_RUN status.
- Row `generate` params typed via the schema-inferred kit/tuning types so an
  interface change breaks compilation (seam alarm). Comment in file:
  "z.infer types are the compile-time alarm + authoring boundary; the
  generator's own param types remain the runtime contract" (grok fold, kept).

## 3. Kit/tuning Zod schemas

File: `generation/kitSchemas.ts`.

- **Zod = authoring-boundary source of truth**; `RaceDomainKit` et al. become
  `z.infer` aliases. (grok's claim that the Director mandated "interfaces =
  source of truth" is a misattribution — no such instruction exists; both
  chatgpt and deepseek independently chose z.infer.)
- **Type-compat proof is more than an assertion** (chatgpt-1): add
  bidirectional compile-time compat checks (`AssertCompatible<
  z.infer<Schema>, ExistingInterface>` both directions where meaningful) AND
  runtime fixtures: all 5 baked kits + valid/invalid boundary cases.
  Distinguish input vs parsed-output types if schemas transform.
- **`kitSchema.safeParse()` is the mandatory authoring-boundary check**
  (chatgpt-2): exhaustive copy + strict leaves at INPUT; malformed copy is
  rejected before `generate` is called — test proves it. Output validation is
  a separate hard gate, never a substitute.
- `copy`: exhaustive `z.object` (every node key required, unknown rejected)
  built from a shared node-key const tuple + compile-time union-equality
  check. **gemini's "partial copy" objection is rejected with evidence:**
  `RaceDomainKit.copy: Record<RaceNodeKey, RaceNodeCopy>` and
  `FloodDomainKit.copy: Record<FloodNodeKey, FloodNodeCopy>` are exhaustive
  TS contracts TODAY; all 5 baked kits were verified complete (race kits: 14/14
  keys; flood kits: 16/16 keys). Partial copy would loosen a contract the code
  already enforces.
- Copy leaf = real `RaceNodeCopy`/`FloodNodeCopy` incl. optional fields
  (`transit?`, `failHint?`, `verdictFlavor?`, `outcomeLog?`, `option?`,
  `options?`) — derived by audit, `.strict()`.
- **Localized kit variants — VERIFIED, with citations** (deepseek-1):
  `narrated/race-miniera.kit.ts` declares `MINIERA_RACE_KIT:
  LocalizedRaceDomainKit = {en, it}` (exported at file line ~292) and
  `narrated/raceMiniera.ts` calls `generateRaceScenario(MINIERA_RACE_KIT.it,
  tuning)`. `narrated/flood-mare.kit.ts` declares `MARE_FLOOD_KIT:
  FloodDomainKit` (flat). kitSchemas must therefore model both the flat kit
  and the `{en, it}` localized wrapper (existing `localeParityIssues`
  contract noted). T-1 re-verifies each baked kit's declared shape and
  records it in the §8 table — the schema variant per kit is a T-1-verified
  fact, not a T-4 assumption.
- Tuning: full schema (for `defaultTuning`) + partial input schema (drawers).
  Numeric bounds from generator assumptions/defaults — recorded, not guessed
  (probability fields are integer percents in current defaults; audit records
  whether fractions are legal).
- No cross-field superRefine on kit schemas — structural only.

## 4. canonicalize()

File: `generation/canonicalize.ts`. In-house, no dep.

`canonicalize(value: JsonValue): string` — string out, hashing is SP-6.

Normative rules (revised):
- Keys sorted by UTF-16 code-unit order. NOT localeCompare.
- Arrays preserve order. Strings: JSON escaping, no Unicode normalization.
- Numbers: JSON semantics; `-0`→`0`; NaN/±Infinity **throw**.
- **Reject (throw)** undefined, functions, symbols, bigint, cycles (with
  path), non-plain objects.
- **`stripUndefinedDeep(value): JsonValue` ships in the same module, owned +
  tested by SP-1** (deepseek-2 fix option a — the "strict Zod kills
  undefined" claim was wrong: `{transit: undefined}` passes strict parse,
  and `{...DEFAULT, ...partial}` spreads explicit-undefined keys). Rules:
  own enumerable keys only, recursive, array holes throw, symbols/functions
  throw (not stripped). Contract: receipt writers call
  `canonicalize(stripUndefinedDeep(x))` — canonicalize alone stays strict.
  Test vectors: `canonicalize(stripUndefinedDeep({a:undefined,b:1})) ===
  '{"b":1}'`; mergedTuning built from `{twistChance: undefined}` hashes
  stably. Audit §3 also records the spread-undefined caveat as a generator-
  contract note (drawers should not emit undefined-valued keys).
- `canonicalizationVersion: 1` exported; semantic changes bump it.

Tests (~12, r001 list) + **golden canonical strings for every pinned
hash-envelope** (chatgpt-5).

## 5. Receipt shapes (revised — deduplicated hashes, pinned envelopes)

```ts
type GenerationReceipt = {
  receiptVersion: 1; canonicalizationVersion: 1;
  gimmickId: 'race' | 'flood-vault';
  generatorVersion: string; schemaVersion: string; engineVersion: string;
  kit: JsonValue;                 // effective parsed input
  tuning: JsonValue;              // effective MERGED tuning (merge rule = generator contract)
  generationInputHash: string;    // sha256 over canonical(GenerationInputEnvelope)
  scenarioHash: string;           // sha256 over canonical(scenario) — binds validation reports
};

type RunReceipt = {
  receiptVersion: 1; canonicalizationVersion: 1;
  generatorVersion: string; schemaVersion: string; engineVersion: string;
  scenarioHash: string;           // same name+value as GenerationReceipt.scenarioHash
  party: JsonValue;               // projection pinned after createRun audit; OPEN if unresolved
  runSeed: number;
  runInputHash: string;           // sha256 over canonical(RunInputEnvelope)
};
```

- **Dropped `kitHash`/`tuningHash`** (deepseek-3): `generationInputHash`
  already covers the same envelope; the leaf hashes added divergence risk
  (merge rule not version-tracked) with no named consumer. Merge semantics are
  recorded in audit §3 under `generatorVersion` coverage.
- **Exact versioned envelope structures are pinned in the doc** (chatgpt-5):
  `GenerationInputEnvelope = {v:1, gimmickId, kit, tuning, generatorVersion,
  schemaVersion, engineVersion}` and `RunInputEnvelope = {v:1, scenarioHash,
  party, runSeed, engineVersion}` — each with golden canonical-string test
  vectors in T-3. (chatgpt: engineVersion is IN the generation envelope —
  if engine semantics affect interpretation, the input identity must cover
  it; cheaper than proving it can't.)
  Hash inputs are always the effective parsed values supplied to the
  generator, never the raw pre-merge input.
- `scenarioHash` is one name used in both receipts (was `outputScenarioHash` —
  unified, deepseek note).
- No timestamps inside hash-covered fields.
- Version-field ownership (chatgpt-4): audit §11 records owner module, update
  rule ("bumps when X changes"), and compatibility meaning per field. If no
  reliable source exists for one, the field is OPEN and SP-6 receipt
  implementation is blocked on it — non-empty-string tests alone are
  insufficient.

## 6. Task breakdown (revised)

| T | Task | Files | Tests | Gate |
|---|---|---|---|---|
| T-1 | Audit + draft doc (incl. ledger table, diagnostic-gate inventory, superRefine hard-gate map, baked-5 parse pre-check) | `context/QUEST_GEN_LAB_CONTRACTS.md` | — | every claim sourced/OPEN — **mechanical check: no ledger row may lack a Source column** (review-checked) |
| T-2 | Director ratification → `DIAGNOSTIC_GATE_IDS` tuple derived | doc + `generation/diagnosticGates.ts` | — | **hard: no code before** |
| T-3 | canonicalize + tests + golden envelope vectors | `generation/canonicalize.ts` | ~15 unit | green incl. goldens |
| T-4 | kit/tuning Zod schemas + `z.infer` aliases + bidirectional compat checks | `generation/kitSchemas.ts` | accept/reject fixtures: **all 5 baked kits pass parse against the schema variant T-1 verified for them** + boundary cases + malformed-copy-rejected-before-generate | baked-5 green |
| T-5 | GimmickRegistry — **depends on T-2 output** (`DIAGNOSTIC_GATE_IDS` tuple must exist as a file before compile) | `generation/gimmickRegistry.ts` | generate identity-equal; rows produce valid scenarios; opt-out semantics: hard-gate opt-out impossible, unknown id fails, opt-out → NOT_RUN | — |
| T-6 | Receipt/envelope shapes + version-field ownership pinned in doc §11 | doc | — | fields final or OPEN |
| T-7 | Export version constants IF audit found reliable owners | owning modules | constants non-empty + update rule documented | else OPEN — **named unblocker: Director decision at SP-6 entry** (SP-1 closes with the field documented OPEN; SP-6 cannot start receipt computation until resolved) |

**T-4 contingency** (deepseek-4): schemas are derived FROM the real interfaces
+kits, not imposed on them. If a narrated kit fails parse for a
schema-conformance-only reason, the fix is a documented schema relaxation in
audit §8 — kit literals are generated artifacts and stay untouched (§exclusions
holds).

NOT owned: receipt computation (SP-6), report hashing/STALE (SP-5/6),
progress callbacks, per-kit opt-outs, changes to generators/schema/baked-5, UI.

## 7. Rejected/deferred divergences (updated)

- grok localeCompare, type-to-schema inversion, `string[]` opt-outs, embedded
  baked5/simResults in receipts, invented paths — rejected (r001).
- grok "Director said interfaces=source of truth" — misattribution, rejected.
- gemini `z.any()` copy, partial-copy claim — rejected with code evidence.
- deepseek "undefined in plain literals" — resolved by parse-before-hash rule.
- gemini timestamp in receipts — outside hashed envelope only.
