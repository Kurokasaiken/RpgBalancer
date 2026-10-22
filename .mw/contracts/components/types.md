---
id: types
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/slots/types.ts
scope_files:
  - src/ui/idleVillage/slots/types.ts
fast_checks:
  - tests/unit/idleVillage/MinimalDragPage.unit.test.tsx
  - tests/unit/idleVillage/ResidentSlotRack.drag-feedback.test.tsx
  - tests/unit/idleVillage/ResidentSlotRack.medal.test.tsx
  - tests/unit/idleVillage/ResidentSlotRack.skin.integration.test.tsx
  - tests/unit/idleVillage/ResidentSlotRack.unit.test.tsx
  - tests/unit/idleVillage/useQuestAssignmentPreview.test.ts
e2e_checks:
  - tests/integration/roster-slotRack.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/slots/types.ts
invariants:
  - id: types.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      I tipi slot del rack: ogni slot renderizzato porta l'id attributo corretto e lo stato empty/occupied/ready
      corrisponde al modello.
    test_refs:
      - tests/unit/idleVillage/ResidentSlotRack.unit.test.tsx
---

# types

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/slots/types.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/slots/types.ts`.

## Scope

- `src/ui/idleVillage/slots/types.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
