---
id: quest-journey-engine
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/quests/questJourneyEngine.ts"
scope_files:
  - "src/ui/idleVillage/quests/questJourneyEngine.ts"
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-journey-engine.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      L'engine journey è deterministico per (runSeed, nodeId, callIndex) e il seed
      ha la forma "<runSeed>:<nodeId>" — un nodeId col separatore è rifiutato.
    test_refs:
      - tests/unit/idleVillage/questJourney.test.ts
---
# quest-journey-engine

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/quests/questJourneyEngine.ts`.

## Scope

- `src/ui/idleVillage/quests/questJourneyEngine.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
