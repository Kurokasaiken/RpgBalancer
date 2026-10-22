---
id: skin-manager
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/SkinManager.ts
scope_files:
  - src/ui/idleVillage/skins/SkinManager.ts
fast_checks:
  - tests/unit/idleVillage/skins/SkinManager.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: skin-manager.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      SkinManager: dispatch aggiorna lo stato, notifica i listener, unsubscribe corretto, registrazione/lookup preset
      funzionanti.
    test_refs:
      - tests/unit/idleVillage/skins/SkinManager.test.ts
---

# skin-manager

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/SkinManager.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/SkinManager.ts`.

## Scope

- `src/ui/idleVillage/skins/SkinManager.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
