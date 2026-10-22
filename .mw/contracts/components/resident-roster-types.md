---
id: resident-roster-types
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/components/ResidentRosterTypes.ts
scope_files:
  - src/ui/idleVillage/components/ResidentRosterTypes.ts
fast_checks:
  - tests/unit/idleVillage/PgCard.interactions.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: resident-roster-types.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La PgCard del roster onora il modello di interazione: pickup cue + drag start all'onDragStart, nessun drag quando
      disabled, drop_invalid cue in returning.
    test_refs:
      - tests/unit/idleVillage/PgCard.interactions.test.tsx
---

# resident-roster-types

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/ResidentRosterTypes.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/ResidentRosterTypes.ts`.

## Scope

- `src/ui/idleVillage/components/ResidentRosterTypes.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
