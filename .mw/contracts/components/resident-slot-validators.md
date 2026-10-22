---
id: resident-slot-validators
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/slots/residentSlotValidators.ts
scope_files:
  - src/ui/idleVillage/slots/residentSlotValidators.ts
fast_checks:
  - tests/unit/idleVillage/residentSlotValidators.test.ts
  - tests/unit/idleVillage/useResidentDropAdvisor.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: resident-slot-validators.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La validazione residente↔slot: requisiti stat soddisfatti accettano, residente mancante/non disponibile/troppo
      affaticato/requisiti non soddisfatti rifiutano; allOf/anyOf/noneOf compositi gestiti.
    test_refs:
      - tests/unit/idleVillage/residentSlotValidators.test.ts
---

# resident-slot-validators

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/slots/residentSlotValidators.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/slots/residentSlotValidators.ts`.

## Scope

- `src/ui/idleVillage/slots/residentSlotValidators.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
