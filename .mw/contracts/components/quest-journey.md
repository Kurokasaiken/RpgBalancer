---
id: quest-journey
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/quests/questJourney.ts
scope_files:
  - src/ui/idleVillage/quests/questJourney.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-journey.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Un POI legacy senza fasi resta journey-free (sentinel null, nessun default iniettato); travelDays intero >=1 e pin
      in [0,1] senza clamp.
    test_refs:
      - tests/unit/idleVillage/questJourney.test.ts
  - id: R-253-pin-band
    source: director-bug
    source_ref: R-253
    statement: >-
      Eventi di viaggio pinnati a inizio/fine fase (gob-ritorno 0.2): devono aprirsi nel 25-75% della fase. Fix: banda
      PIN_BAND nel validator + gob-ritorno 0.2->0.4
    test_refs:
      - tests/unit/idleVillage/questJourneyAuthoring.test.ts
---
# quest-journey

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/quests/questJourney.ts`.

## Scope

- `src/ui/idleVillage/quests/questJourney.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
