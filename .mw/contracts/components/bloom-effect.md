---
id: bloom-effect
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/interaction/bloomEffect.ts
scope_files:
  - src/ui/idleVillage/interaction/bloomEffect.ts
fast_checks:
  - tests/unit/idleVillage/bloomBrass.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: bloom-effect.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il bloom engine di default resta quello condiviso (POI/demo invariati); i look alternativi sostituiscono solo
      token colore esistenti.
    test_refs:
      - tests/unit/idleVillage/bloomBrass.test.ts
---

# bloom-effect

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/interaction/bloomEffect.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/interaction/bloomEffect.ts`.

## Scope

- `src/ui/idleVillage/interaction/bloomEffect.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
