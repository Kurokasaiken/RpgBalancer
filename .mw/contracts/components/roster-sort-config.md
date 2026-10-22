---
id: roster-sort-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/rosterSortConfig.ts
scope_files:
  - src/ui/idleVillage/config/rosterSortConfig.ts
fast_checks:
  - tests/unit/idleVillage/DragRosterSlotRack.test.ts
  - tests/unit/idleVillage/Roster.unit.test.ts
  - tests/unit/idleVillage/rosterSortConfig.test.ts
  - tests/unit/idleVillage/rosterSortIcon.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: roster-sort-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La sort config del roster: default name-asc, varianti name-desc/hp-desc/fatigue-asc, usa displayName per
      l'ordinamento alfabetico.
    test_refs:
      - tests/unit/idleVillage/rosterSortConfig.test.ts
---

# roster-sort-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/rosterSortConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/rosterSortConfig.ts`.

## Scope

- `src/ui/idleVillage/config/rosterSortConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
