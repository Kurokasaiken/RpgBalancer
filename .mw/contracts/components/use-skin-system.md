---
id: use-skin-system
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/hooks/useSkinSystem.ts
scope_files:
  - src/ui/idleVillage/hooks/useSkinSystem.ts
fast_checks:
  - tests/unit/frozen/KitShell.test.tsx
  - tests/unit/idleVillage/TS002SkinSlot.test.tsx
  - tests/unit/idleVillage/TS003SkinReplacementAPI.test.ts
  - tests/unit/idleVillage/hooks/useSkinSystem.test.ts
  - tests/unit/idleVillage/skins/SkinTestHarness.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-skin-system.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      useSkinSystem espone lo stato corrente e gli action setter (setPreset/setPillar/setMotionLevel/resetState) con
      lookup preset per id.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# use-skin-system

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/hooks/useSkinSystem.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/hooks/useSkinSystem.ts`.

## Scope

- `src/ui/idleVillage/hooks/useSkinSystem.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
