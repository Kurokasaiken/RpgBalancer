---
id: activity-log-panel-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/activityLogPanelConfig.ts
scope_files:
  - src/ui/idleVillage/config/activityLogPanelConfig.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: activity-log-panel-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      MinimalActivityEntrySchema valida le entry canoniche (severity enum info/success/warning/error, message sempre
      presente, messageKey opzionale) e respinge severity fuori enum.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# activity-log-panel-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/activityLogPanelConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/activityLogPanelConfig.ts`.

## Scope

- `src/ui/idleVillage/config/activityLogPanelConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
