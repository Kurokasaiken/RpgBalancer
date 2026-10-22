---
id: use-activity-scheduler
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/hooks/useActivityScheduler.ts
scope_files:
  - src/ui/idleVillage/hooks/useActivityScheduler.ts
fast_checks:
  - tests/components/VillageSandbox.isolation.test.tsx
  - tests/unit/idleVillage/useActiveHUDTelemetry.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-activity-scheduler.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Lo scheduler attività emette hud_rendered con attività presenti, hud_empty_state senza, hud_overflow_shown oltre
      maxVisible, compatibile con legacy activeSlots.
    test_refs:
      - tests/unit/idleVillage/useActiveHUDTelemetry.test.tsx
---

# use-activity-scheduler

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/hooks/useActivityScheduler.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/hooks/useActivityScheduler.ts`.

## Scope

- `src/ui/idleVillage/hooks/useActivityScheduler.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
