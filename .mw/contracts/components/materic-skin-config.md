---
id: materic-skin-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/wanderlust-surface/matericSkinConfig.ts
scope_files:
  - src/ui/wanderlust-surface/matericSkinConfig.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: materic-skin-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: MATERIC_SKIN_CONFIG ripassa il proprio schema Zod in round-trip (parse stabile della config built-in).
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# materic-skin-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/wanderlust-surface/matericSkinConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/wanderlust-surface/matericSkinConfig.ts`.

## Scope

- `src/ui/wanderlust-surface/matericSkinConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
