---
id: activity-slot-data
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/types/ActivitySlotData.ts
scope_files:
  - src/ui/idleVillage/types/ActivitySlotData.ts
fast_checks:
  - tests/unit/idleVillage/ActivitySlotTelemetryMirror.test.tsx
  - tests/unit/idleVillage/TheaterViewSync.test.tsx
  - tests/unit/idleVillage/useActiveHUDTelemetry.test.tsx
  - tests/unit/idleVillage/useTheaterController.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: activity-slot-data.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il modello ActivitySlotData costruisce la telemetria completa di uno slot da residente + parametri
      (id/verb/occupant) — shape consumata dai consumer HUD.
    test_refs:
      - tests/unit/idleVillage/ActivitySlotTelemetryMirror.test.tsx
---

# activity-slot-data

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/types/ActivitySlotData.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/types/ActivitySlotData.ts`.

## Scope

- `src/ui/idleVillage/types/ActivitySlotData.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
