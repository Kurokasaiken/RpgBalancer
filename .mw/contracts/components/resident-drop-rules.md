---
id: resident-drop-rules
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/residentDropRules.ts
scope_files:
  - src/ui/idleVillage/config/residentDropRules.ts
fast_checks:
  - tests/unit/idleVillage/activitySlotTelemetry.test.tsx
  - tests/unit/idleVillage/dragDropStressTest.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: resident-drop-rules.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Le regole di drop dei residenti validano la configurazione dello stress-test: conteggi operazioni, worker
      paralleli, delay e timeout vincolati.
    test_refs:
      - tests/unit/idleVillage/dragDropStressTest.test.ts
---

# resident-drop-rules

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/residentDropRules.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/residentDropRules.ts`.

## Scope

- `src/ui/idleVillage/config/residentDropRules.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
