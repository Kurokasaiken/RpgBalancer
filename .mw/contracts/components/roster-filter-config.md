---
id: roster-filter-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/rosterFilterConfig.ts
scope_files:
  - src/ui/idleVillage/config/rosterFilterConfig.ts
fast_checks:
  - tests/unit/idleVillage/RosterStatFilter.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: roster-filter-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il context filtro del roster inizializza con criteri vuoti, espone add/remove/clear e lancia errore se usato fuori
      provider.
    test_refs:
      - tests/unit/idleVillage/RosterStatFilter.test.tsx
---

# roster-filter-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/rosterFilterConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/rosterFilterConfig.ts`.

## Scope

- `src/ui/idleVillage/config/rosterFilterConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
