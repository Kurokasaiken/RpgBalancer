---
id: demo-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/styleLab/config/demoConfig.ts
scope_files:
  - src/ui/styleLab/config/demoConfig.ts
fast_checks:
  - tests/unit/idleVillage/ActionHalo.skin.test.tsx
  - tests/unit/idleVillage/ActivityCapsule.skin.test.tsx
  - tests/unit/idleVillage/VillageRosterSection.skin.test.tsx
  - tests/unit/styleLab/RosterDemo.test.tsx
  - tests/unit/styleLab/StyleLabDemo.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: demo-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: 'demoConfig alimenta il demo roster dello styleLab: la pagina renderizza i worker con stato e fatigue badge attesi.'
    test_refs:
      - tests/unit/styleLab/RosterDemo.test.tsx
---

# demo-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/styleLab/config/demoConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/styleLab/config/demoConfig.ts`.

## Scope

- `src/ui/styleLab/config/demoConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
