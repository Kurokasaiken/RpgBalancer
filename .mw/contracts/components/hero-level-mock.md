---
id: hero-level-mock
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/rosterV2/heroLevelMock.ts"
scope_files:
  - "src/ui/idleVillage/rosterV2/heroLevelMock.ts"
fast_checks:
  - tests/unit/idleVillage/heroLevelMock.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hero-level-mock.INV-1
    source: plan
    source_ref: PLAN-067
    statement: >-
      Ogni `bumpMockLevel` alza di esattamente uno il boost in memoria del resident e
      `resetMockLevelsForTest` azzera tutto — solo memoria, nessuna persistenza (il sistema reale è di
      PROGRESSION.md).
    test_refs:
      - tests/unit/idleVillage/heroLevelMock.test.ts
---
# hero-level-mock

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/rosterV2/heroLevelMock.ts`.

## Scope

- `src/ui/idleVillage/rosterV2/heroLevelMock.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
