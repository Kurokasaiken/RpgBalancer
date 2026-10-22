---
id: skin-schemas
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/skinSchemas.ts
scope_files:
  - src/ui/idleVillage/skins/skinSchemas.ts
fast_checks:
  - tests/unit/idleVillage/SkinConfigRegistry.test.ts
  - tests/unit/idleVillage/useSkinPreferences.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: skin-schemas.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Gli schemi skin risolvono la config esplicita quando il preset esiste e il default altrimenti; validazione pillar
      rispettata.
    test_refs:
      - tests/unit/idleVillage/SkinConfigRegistry.test.ts
---

# skin-schemas

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/skinSchemas.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/skinSchemas.ts`.

## Scope

- `src/ui/idleVillage/skins/skinSchemas.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
