---
id: stat-icon-utils
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/shared/statIconUtils.ts
scope_files:
  - src/ui/shared/statIconUtils.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: stat-icon-utils.INV-1
    source: plan
    source_ref: PLAN-054
    statement: 'statIconUtils: glyph map canonica per le stat core (hp ❤, damage ⚔️) e icone lucide presenti.'
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# stat-icon-utils

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/shared/statIconUtils.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/shared/statIconUtils.ts`.

## Scope

- `src/ui/shared/statIconUtils.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
