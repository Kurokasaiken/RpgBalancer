---
id: quest-run
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/questS1Lab/questRun.ts
scope_files:
  - src/ui/idleVillage/questS1Lab/questRun.ts
fast_checks:
  - tests/unit/idleVillage/cinemaFx.test.tsx
  - tests/unit/idleVillage/combatStrip.test.tsx
  - tests/unit/idleVillage/questBag.test.tsx
  - tests/unit/idleVillage/questCheckOptions.test.tsx
  - tests/unit/idleVillage/questJourneyCharacterization.test.ts
  - tests/unit/idleVillage/questOffer.test.ts
  - tests/unit/idleVillage/questOutcomeToast.test.tsx
  - tests/unit/idleVillage/questPartyCalibration.test.ts
  - tests/unit/idleVillage/questPartyReal.test.ts
  - tests/unit/idleVillage/questPhaseRecord.test.ts
  - tests/unit/idleVillage/questRewardPopup.test.tsx
  - tests/unit/idleVillage/questRunWindow.test.tsx
  - tests/unit/idleVillage/questS1Lab/armedConsumables.test.ts
  - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
  - tests/unit/idleVillage/questS1Lab/questCertainty.test.ts
  - tests/unit/idleVillage/questS1Lab/questEligibility.test.ts
  - tests/unit/idleVillage/questS1Lab/questExpedition.test.ts
  - tests/unit/idleVillage/questS1Lab/questFrontier.test.ts
  - tests/unit/idleVillage/questS1Lab/questOutcomeSpec.test.ts
  - tests/unit/idleVillage/questS1Lab/questOverlayIdentity.test.ts
  - tests/unit/idleVillage/questS1Lab/questRun.test.ts
  - tests/unit/idleVillage/questS1Lab/questSchedule.test.ts
  - tests/unit/idleVillage/questS1Lab/questSimAsync.test.ts
  - tests/unit/idleVillage/questS1Lab/questSimulation.test.ts
  - tests/unit/idleVillage/questS1Lab/questTerminalMatrix.test.ts
  - tests/unit/idleVillage/questS1Lab/questTradeoffSweep.test.ts
  - tests/unit/idleVillage/questS1Lab/repro.test.ts
  - tests/unit/idleVillage/questScenarioConfig.test.ts
  - tests/unit/idleVillage/questTheatreSequencer.test.ts
  - tests/unit/idleVillage/quests/floodVault.test.ts
  - tests/unit/idleVillage/quests/generatedCatalog.bench.test.ts
  - tests/unit/idleVillage/quests/imprintCompagno.test.ts
  - tests/unit/idleVillage/quests/imprintCompagnoMare.test.ts
  - tests/unit/idleVillage/quests/imprintCompagnoMiniera.test.ts
  - tests/unit/idleVillage/quests/imprintLocale.test.ts
  - tests/unit/idleVillage/quests/questEpilogue.test.ts
  - tests/unit/idleVillage/quests/questGenLab.test.ts
  - tests/unit/idleVillage/quests/questSettlement.test.ts
  - tests/unit/idleVillage/quests/raceToPass.test.ts
  - tests/unit/idleVillage/quests/residentXpAndSwap.test.ts
  - tests/unit/questS1Lab/presentationTimeline.test.ts
  - tests/unit/questS1Lab/questGoblin.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-run.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il motore quest-run è deterministico: stesso preset + seed → stesso run; reward richiede obiettivo E leader vivo;
      wipe perde tutto.
    test_refs:
      - tests/unit/idleVillage/questS1Lab/questRun.test.ts
  - id: quest-run.INV-2
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B1a: il percorso CHECK:<id> spingeva il check node in visitedNodes senza log NODE — invariante visita↔NODE
      violata
    test_refs: 
      - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
---
# quest-run

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/questRun.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/questRun.ts`.

## Scope

- `src/ui/idleVillage/questS1Lab/questRun.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
