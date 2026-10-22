---
id: canonical-roster-bundle
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/roster/CanonicalRosterBundle.ts
scope_files:
  - src/ui/idleVillage/roster/CanonicalRosterBundle.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: canonical-roster-bundle.INV-1
    source: plan
    source_ref: PLAN-054
    statement: canonicalResidentData produce il roster canonico non vuoto, indicizzabile per id via createResidentsById.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# canonical-roster-bundle

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/roster/CanonicalRosterBundle.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/roster/CanonicalRosterBundle.ts`.

## Scope

- `src/ui/idleVillage/roster/CanonicalRosterBundle.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
