---
id: gameplay-store
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/store/gameplayStore.ts"
scope_files:
  - "src/ui/idleVillage/store/gameplayStore.ts"
  - "src/ui/idleVillage/types/gameplayTypes.ts"
  - "src/ui/idleVillage/types/jobTypes.ts"
fast_checks:
  - tests/unit/idleVillage/gameplayStore.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: gameplay-store.INV-1
    source: plan
    source_ref: PLAN-076
    statement: >-
      Lo store gameplay persiste sotto l'unica chiave `minimal-gameplay-state` e `getGameplaySnapshot`
      riflette lo stato vivo (giorno, oro) nella forma persistita; `resetAll` ripristina il mondo
      iniziale.
    test_refs:
      - tests/unit/idleVillage/gameplayStore.test.ts
---
# gameplay-store

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/store/gameplayStore.ts`.

## Scope

- `src/ui/idleVillage/store/gameplayStore.ts`
- `src/ui/idleVillage/types/gameplayTypes.ts`
- `src/ui/idleVillage/types/jobTypes.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
