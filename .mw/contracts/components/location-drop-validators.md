---
id: location-drop-validators
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/map/validators/locationDropValidators.ts
scope_files:
  - src/ui/idleVillage/map/validators/locationDropValidators.ts
fast_checks:
  - tests/unit/idleVillage/LocationDeck.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: location-drop-validators.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      I validatori di drop sulle location: una location locked mostra lo stato locked e non accetta il drop; lo styling
      riflette il dropState.
    test_refs:
      - tests/unit/idleVillage/LocationDeck.test.tsx
---

# location-drop-validators

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/map/validators/locationDropValidators.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/map/validators/locationDropValidators.ts`.

## Scope

- `src/ui/idleVillage/map/validators/locationDropValidators.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
