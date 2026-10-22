---
id: slot-rack-skin-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/slotRackSkinConfig.ts
scope_files:
  - src/ui/idleVillage/skins/slotRackSkinConfig.ts
fast_checks:
  - tests/unit/testRosterPage/TestRosterPage.integration.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: slot-rack-skin-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La skin slot-rack si monta nella pagina lab: chrome Style Lab e container layout roster presenti con i rack
      residente.
    test_refs:
      - tests/unit/testRosterPage/TestRosterPage.integration.test.tsx
---

# slot-rack-skin-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/slotRackSkinConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/slotRackSkinConfig.ts`.

## Scope

- `src/ui/idleVillage/skins/slotRackSkinConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
