---
id: quest-availability
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/questAvailability.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/questAvailability.ts"
fast_checks:
  - tests/unit/idleVillage/questAvailability.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-availability.INV-1
    source: plan
    source_ref: PLAN-037
    statement: >-
      Un'opportunità si legge `expiring` nell'ultimo quarto della sua finestra (`EXPIRING_BELOW = 0.25`)
      e `expired` a zero; il progress drena linearmente coi tick di gioco.
    test_refs:
      - tests/unit/idleVillage/questAvailability.test.ts
---
# quest-availability

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/questAvailability.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/questAvailability.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
