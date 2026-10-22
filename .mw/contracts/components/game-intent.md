---
id: game-intent
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/intent/GameIntent.ts
scope_files:
  - src/ui/idleVillage/intent/GameIntent.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: game-intent.INV-1
    source: plan
    source_ref: PLAN-054
    statement: IntentBridge inoltra gli intent allo store handler registrato; senza handler warna senza lanciare.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# game-intent

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/intent/GameIntent.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/intent/GameIntent.ts`.

## Scope

- `src/ui/idleVillage/intent/GameIntent.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
