---
id: drag-context-store
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/components/DragContextStore.ts
scope_files:
  - src/ui/idleVillage/components/DragContextStore.ts
fast_checks:
  - tests/unit/frozen/KitShell.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: drag-context-store.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il DragContextStore entra nella chain provider via KitShell: standalone monta l'intera catena, nested riusa il
      provider esterno senza duplicare DndContext.
    test_refs:
      - tests/unit/frozen/KitShell.test.tsx
---

# drag-context-store

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/DragContextStore.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/DragContextStore.ts`.

## Scope

- `src/ui/idleVillage/components/DragContextStore.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
