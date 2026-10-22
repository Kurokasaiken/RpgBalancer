---
id: use-skin-binding
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/hooks/useSkinBinding.ts
scope_files:
  - src/ui/idleVillage/hooks/useSkinBinding.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-skin-binding.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      useSkinBinding espone la superficie API completa: hook base più le varianti withPreset/withPillar/withMotion e
      useSimpleSkinBinding.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# use-skin-binding

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/hooks/useSkinBinding.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/hooks/useSkinBinding.ts`.

## Scope

- `src/ui/idleVillage/hooks/useSkinBinding.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
