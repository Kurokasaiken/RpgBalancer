---
id: resolve-slot-requirements
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/drag/resolveSlotRequirements.ts
scope_files:
  - src/ui/idleVillage/drag/resolveSlotRequirements.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: resolve-slot-requirements.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      resolveSlotRequirements produce la mappa slot→requisiti rispettando slotFilter e fatigueLimit; resolveMaxCrewSize
      legge metadata.maxCrewSize poi activity.maxSlots.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# resolve-slot-requirements

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/drag/resolveSlotRequirements.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/drag/resolveSlotRequirements.ts`.

## Scope

- `src/ui/idleVillage/drag/resolveSlotRequirements.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
