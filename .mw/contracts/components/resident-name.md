---
id: resident-name
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/residentName.ts
scope_files:
  - src/ui/idleVillage/residentName.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: resident-name.INV-1
    source: plan
    source_ref: PLAN-054
    statement: 'formatResidentLabel: displayName vince su tutto; id founder-* e id generici sono resi title-case.'
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# resident-name

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/residentName.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/residentName.ts`.

## Scope

- `src/ui/idleVillage/residentName.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
