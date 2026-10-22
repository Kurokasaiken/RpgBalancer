---
id: use-drag-preview-instrumentation
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/hooks/useDragPreviewInstrumentation.ts
scope_files:
  - src/ui/idleVillage/hooks/useDragPreviewInstrumentation.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-drag-preview-instrumentation.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      L'hook di strumentazione drag-preview raccoglie metriche quando abilitato e persiste il toggle via
      PersistenceService.
    test_refs:
      - tests/unit/idleVillage/useDragPreviewInstrumentation.test.tsx
---

# use-drag-preview-instrumentation

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/hooks/useDragPreviewInstrumentation.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/hooks/useDragPreviewInstrumentation.ts`.

## Scope

- `src/ui/idleVillage/hooks/useDragPreviewInstrumentation.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
