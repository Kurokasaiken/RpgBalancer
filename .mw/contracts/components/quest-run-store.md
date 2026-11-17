---
id: quest-run-store
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/questS1Lab/questRunStore.ts"
scope_files:
  - "src/ui/idleVillage/questS1Lab/questRunStore.ts"
fast_checks:
  - tests/unit/idleVillage/questRunStore.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-run-store.INV-1
    source: plan
    source_ref: PLAN-040
    statement: >-
      `publishQuestRun` scrive la run sotto il suo questId (la clear scrive `null`) e `markRewardShown`
      timbra il runId il cui report ricompensa ha dipinto — gli overlay si iscrivono esattamente alla
      run che proiettano.
    test_refs:
      - tests/unit/idleVillage/questRunStore.test.ts
---
# quest-run-store

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/questRunStore.ts`.

## Scope

- `src/ui/idleVillage/questS1Lab/questRunStore.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
