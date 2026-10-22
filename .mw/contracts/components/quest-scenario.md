---
id: quest-scenario
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/questS1Lab/questScenario.ts
scope_files:
  - src/ui/idleVillage/questS1Lab/questScenario.ts
fast_checks:
  - tests/unit/idleVillage/questOffer.test.ts
  - tests/unit/idleVillage/questPartyCalibration.test.ts
  - tests/unit/idleVillage/questPartyReal.test.ts
  - tests/unit/idleVillage/questS1Lab/questCertainty.test.ts
  - tests/unit/idleVillage/questS1Lab/questOutcomeSpec.test.ts
  - tests/unit/idleVillage/questS1Lab/questSimulation.test.ts
  - tests/unit/idleVillage/questS1Lab/questTradeoffSweep.test.ts
  - tests/unit/idleVillage/questS1Lab/repro.test.ts
  - tests/unit/idleVillage/questTheatreSequencer.test.ts
  - tests/unit/idleVillage/quests/floodVault.test.ts
  - tests/unit/idleVillage/quests/generatedCatalog.bench.test.ts
  - tests/unit/idleVillage/quests/imprintCompagno.test.ts
  - tests/unit/idleVillage/quests/imprintCompagnoMare.test.ts
  - tests/unit/idleVillage/quests/imprintCompagnoMiniera.test.ts
  - tests/unit/idleVillage/quests/imprintLocale.test.ts
  - tests/unit/idleVillage/quests/questGenLab.test.ts
  - tests/unit/idleVillage/quests/questTraits.test.ts
  - tests/unit/idleVillage/quests/raceToPass.test.ts
  - tests/unit/questS1Lab/questGoblin.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-scenario.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Lo scenario parser copre i POI authored (goblin/rovine): schema valido, slot ids ⊆ offer.slots, lifecycle
      repeatable/one-shot rispettato.
    test_refs:
      - tests/unit/idleVillage/questOffer.test.ts
  - id: R-239-stat-detail
    source: director-bug
    source_ref: R-239
    statement: >-
      copy engine-shorthand nel workflow quest: stat-label «Strength.» con punto, chip downtime «≈2.6d down», chrome
      quest selezionabile al drag
    test_refs:
      - tests/unit/idleVillage/questCopyLabels.test.tsx
---
# quest-scenario

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/questScenario.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/questScenario.ts`.

## Scope

- `src/ui/idleVillage/questS1Lab/questScenario.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
