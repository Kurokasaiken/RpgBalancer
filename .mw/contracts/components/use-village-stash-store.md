---
id: use-village-stash-store
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/store/useVillageStashStore.ts"
scope_files:
  - "src/ui/idleVillage/store/useVillageStashStore.ts"
fast_checks:
  - tests/unit/idleVillage/villageStashLedger.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-village-stash-store.INV-1
    source: plan
    source_ref: PLAN-073
    statement: >-
      `assign` riempie il PRIMO slot libero della bag, non la coda — un release in mezzo viene
      riempito prima di appendere.
    test_refs:
      - tests/unit/idleVillage/villageStashLedger.test.ts
---
# use-village-stash-store

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/store/useVillageStashStore.ts`.

## Scope

- `src/ui/idleVillage/store/useVillageStashStore.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
