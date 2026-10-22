---
id: drag-preview-instrumentation-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/dragPreviewInstrumentationConfig.ts
scope_files:
  - src/ui/idleVillage/config/dragPreviewInstrumentationConfig.ts
fast_checks:
  - tests/unit/idleVillage/idleVillageDragInstrumentation.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: drag-preview-instrumentation-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La strumentazione drag-preview classifica le misure in ok/warning/error secondo le soglie config (budget
      creazione, frame budget, retention eventi).
    test_refs:
      - tests/unit/idleVillage/idleVillageDragInstrumentation.test.ts
---

# drag-preview-instrumentation-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/dragPreviewInstrumentationConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/dragPreviewInstrumentationConfig.ts`.

## Scope

- `src/ui/idleVillage/config/dragPreviewInstrumentationConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
