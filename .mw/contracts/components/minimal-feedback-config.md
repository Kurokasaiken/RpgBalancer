---
id: minimal-feedback-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/minimalFeedbackConfig.ts
scope_files:
  - src/ui/idleVillage/config/minimalFeedbackConfig.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: minimal-feedback-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: I getter minimalFeedbackConfig espongono le sezioni config (ui, slotGlow, sensoryFeedback) popolate.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# minimal-feedback-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/minimalFeedbackConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/minimalFeedbackConfig.ts`.

## Scope

- `src/ui/idleVillage/config/minimalFeedbackConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
