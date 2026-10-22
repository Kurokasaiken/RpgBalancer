---
id: physics-defaults
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/styleLab/config/physicsDefaults.ts
scope_files:
  - src/ui/styleLab/config/physicsDefaults.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: physics-defaults.INV-1
    source: plan
    source_ref: PLAN-054
    statement: PHYSICS_DEFAULTS valida PhysicsConfigSchema; SLIDER_DEFS e SECTIONS popolati (UI fisica lab).
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# physics-defaults

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/styleLab/config/physicsDefaults.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/styleLab/config/physicsDefaults.ts`.

## Scope

- `src/ui/styleLab/config/physicsDefaults.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
