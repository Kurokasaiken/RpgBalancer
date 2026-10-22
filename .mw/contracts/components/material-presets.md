---
id: material-presets
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/wanderlust-surface/materialPresets.ts
scope_files:
  - src/ui/wanderlust-surface/materialPresets.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: material-presets.INV-1
    source: plan
    source_ref: PLAN-054
    statement: 'BRONZE_THEME (default) è completo: id ''bronze'', label, gradienti ordinati e fill di base popolati.'
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# material-presets

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/wanderlust-surface/materialPresets.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/wanderlust-surface/materialPresets.ts`.

## Scope

- `src/ui/wanderlust-surface/materialPresets.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
