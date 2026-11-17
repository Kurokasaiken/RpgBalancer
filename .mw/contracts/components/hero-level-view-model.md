---
id: hero-level-view-model
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/rosterV2/heroLevelViewModel.ts"
scope_files:
  - "src/ui/idleVillage/rosterV2/heroLevelViewModel.ts"
fast_checks:
  - tests/unit/idleVillage/heroLevelUp.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hero-level-view-model.INV-1
    source: plan
    source_ref: PLAN-032
    statement: >-
      `heroLevelView` risolve il livello solo per un hero che ha un livello configurato (base + boost
      mock); un non-hero elencato in `levels` o un hero senza livello configurato → `null`.
    test_refs:
      - tests/unit/idleVillage/heroLevelUp.test.tsx
---
# hero-level-view-model

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/rosterV2/heroLevelViewModel.ts`.

## Scope

- `src/ui/idleVillage/rosterV2/heroLevelViewModel.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
