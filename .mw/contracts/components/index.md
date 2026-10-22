---
id: index
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/roster/index.ts
scope_files:
  - src/ui/idleVillage/roster/index.ts
fast_checks:
  - tests/unit/idleVillage/MinimalDragPage.unit.test.tsx
  - tests/unit/idleVillage/ResidentSlotRack.unit.test.tsx
  - tests/unit/idleVillage/VillageRosterSection.unit.test.tsx
e2e_checks:
  - tests/integration/roster-slotRack.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/roster/index.ts
invariants:
  - id: index.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il barrel roster/index.ts è la fonte unica dei componenti roster trusted: ResidentSlotRack e i componenti
      rack/slot sono consumabili dall'export condiviso e renderizzano gli slot correttamente.
    test_refs:
      - tests/unit/idleVillage/ResidentSlotRack.unit.test.tsx
---

# index

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/roster/index.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/roster/index.ts`.

## Scope

- `src/ui/idleVillage/roster/index.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
