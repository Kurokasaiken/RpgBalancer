---
id: skin-config-registry
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/skinConfigRegistry.ts
scope_files:
  - src/ui/idleVillage/skins/skinConfigRegistry.ts
fast_checks:
  - tests/unit/idleVillage/SkinConfigRegistry.test.ts
  - tests/unit/idleVillage/useSkinPreferences.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: skin-config-registry.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il registry delle skin: ogni preset valida lo schema SkinRegistry, preset sconosciuto → default, pillar supportati
      esposti e validati.
    test_refs:
      - tests/unit/idleVillage/SkinConfigRegistry.test.ts
---

# skin-config-registry

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/skinConfigRegistry.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/skinConfigRegistry.ts`.

## Scope

- `src/ui/idleVillage/skins/skinConfigRegistry.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
