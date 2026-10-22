---
id: hud-band
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/primitives/hudBand.ts
scope_files:
  - src/ui/idleVillage/skins/primitives/hudBand.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-band.INV-1
    source: plan
    source_ref: PLAN-054
    statement: 'hudBand: default 3.5px, set/get condiviso reattivo (hook useHudBandPx).'
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# hud-band

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/primitives/hudBand.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/primitives/hudBand.ts`.

## Scope

- `src/ui/idleVillage/skins/primitives/hudBand.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
