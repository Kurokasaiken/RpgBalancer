---
id: skin-schema
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/types/SkinSchema.ts
scope_files:
  - src/ui/idleVillage/skins/types/SkinSchema.ts
fast_checks:
  - tests/unit/idleVillage/hooks/useSkinSystem.test.ts
  - tests/unit/idleVillage/skins/SkinManager.test.ts
  - tests/unit/idleVillage/skins/SkinSchema.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: skin-schema.INV-1
    source: plan
    source_ref: PLAN-054
    statement: Lo schema skin valida preset IDs, pillars, motion levels; creazione config preset e override pillar conformi.
    test_refs:
      - tests/unit/idleVillage/skins/SkinSchema.test.ts
---

# skin-schema

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/types/SkinSchema.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/types/SkinSchema.ts`.

## Scope

- `src/ui/idleVillage/skins/types/SkinSchema.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
