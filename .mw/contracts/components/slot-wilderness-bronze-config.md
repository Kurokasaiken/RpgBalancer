---
id: slot-wilderness-bronze-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts
scope_files:
  - src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: slot-wilderness-bronze-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: slotWildernessBronzeConfig espone skin data con id stabile 'slot-wilderness-bronze' e version presente.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# slot-wilderness-bronze-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts`.

## Scope

- `src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
