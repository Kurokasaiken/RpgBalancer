---
id: wanderlust-material-context
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/wanderlust-surface/WanderlustMaterialContext.tsx
scope_files:
  - src/ui/wanderlust-surface/WanderlustMaterialContext.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: wanderlust-material-context.INV-1
    source: plan
    source_ref: PLAN-054
    statement: WanderlustMaterialContext di default è 'bronze' senza provider.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# wanderlust-material-context

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/wanderlust-surface/WanderlustMaterialContext.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/wanderlust-surface/WanderlustMaterialContext.tsx`.

## Scope

- `src/ui/wanderlust-surface/WanderlustMaterialContext.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
