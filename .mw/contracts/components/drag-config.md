---
id: drag-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/config/dragConfig.ts
scope_files:
  - src/ui/idleVillage/config/dragConfig.ts
fast_checks:
  - tests/unit/idleVillage/magneticCollision.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: drag-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La collisione magnetica onora il raggio da dragConfig: oltre il raggio nessuna attrazione, dentro il rettangolo
      distanza zero.
    test_refs:
      - tests/unit/idleVillage/magneticCollision.test.ts
---

# drag-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/config/dragConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/config/dragConfig.ts`.

## Scope

- `src/ui/idleVillage/config/dragConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
