---
id: use-drag-outcome
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/interaction/useDragOutcome.ts"
scope_files:
  - "src/ui/idleVillage/interaction/useDragOutcome.ts"
fast_checks:
  - tests/unit/idleVillage/slotFlightTarget.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-drag-outcome.INV-1
    source: plan
    source_ref: PLAN-043
    statement: >-
      Il target di volo è il rect del componente Slot (`slot-button-<slotId>`), non la cella rack con
      caption/footer — `getSlotComponentElement` torna `null` quando lo slot non è montato.
    test_refs:
      - tests/unit/idleVillage/slotFlightTarget.test.ts
---
# use-drag-outcome

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/interaction/useDragOutcome.ts`.

## Scope

- `src/ui/idleVillage/interaction/useDragOutcome.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
