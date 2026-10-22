---
id: drag-test-container.module
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/components/DragTestContainer.module.css
scope_files:
  - src/ui/idleVillage/components/DragTestContainer.module.css
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: drag-test-container.module.INV-1
    source: plan
    source_ref: PLAN-054
    statement: Il CSS module DragTestContainer espone la classe scrollArea usata dal lab (classe presente, non vuota).
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# drag-test-container.module

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/DragTestContainer.module.css`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/DragTestContainer.module.css`.

## Scope

- `src/ui/idleVillage/components/DragTestContainer.module.css`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
