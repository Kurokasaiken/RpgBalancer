---
id: drop-feedback-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/dropFeedbackConfig.ts
scope_files:
  - src/ui/idleVillage/config/dropFeedbackConfig.ts
fast_checks:
  - tests/unit/idleVillage/useDropFeedback.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: drop-feedback-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il feedback di drop deriva dai token di dropFeedbackConfig: tipi distinti producono feedback visivi distinti,
      overlay e tooltip rispettano gli stili configurati.
    test_refs:
      - tests/unit/idleVillage/useDropFeedback.test.tsx
---

# drop-feedback-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/dropFeedbackConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/dropFeedbackConfig.ts`.

## Scope

- `src/ui/idleVillage/config/dropFeedbackConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
