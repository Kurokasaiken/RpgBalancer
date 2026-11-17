---
id: drag-sensors
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/interaction/dragSensors.ts"
scope_files:
  - "src/ui/idleVillage/interaction/dragSensors.ts"
fast_checks:
  - tests/unit/idleVillage/dragSensors.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: drag-sensors.INV-1
    source: plan
    source_ref: PLAN-043
    statement: >-
      `useIdleVillageDragSensors` arma esattamente tre sensori (pointer hold-or-move, touch, keyboard)
      da una sola config: un click rapido resta un click, tenere o muovere avvia il drag, e la tastiera
      mantiene la parità completa.
    test_refs:
      - tests/unit/idleVillage/dragSensors.test.ts
---
# drag-sensors

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/interaction/dragSensors.ts`.

## Scope

- `src/ui/idleVillage/interaction/dragSensors.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
