---
id: renderer-stack-instrumentation
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/utils/rendererStackInstrumentation.ts
scope_files:
  - src/ui/idleVillage/utils/rendererStackInstrumentation.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: renderer-stack-instrumentation.INV-1
    source: plan
    source_ref: PLAN-054
    statement: 'rendererStackInstrumentation singleton: exportData produce stack serializzabile {page, timestamp, stackData[]}.'
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# renderer-stack-instrumentation

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/utils/rendererStackInstrumentation.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/utils/rendererStackInstrumentation.ts`.

## Scope

- `src/ui/idleVillage/utils/rendererStackInstrumentation.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
