---
id: village-stash-view-model
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts"
fast_checks:
  - tests/unit/idleVillage/villageStash.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: village-stash-view-model.INV-1
    source: plan
    source_ref: PLAN-073
    statement: >-
      Il conteggio mostrato deriva da `sum(qty)` delle righe config e ogni riga risolve `descKey` e
      `nameKey` dalla config canonica (i18n keys, mai stringhe inline).
    test_refs:
      - tests/unit/idleVillage/villageStash.test.tsx
---
# village-stash-view-model

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
