---
id: quest-lab-presets
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/questS1Lab/questLabPresets.ts
scope_files:
  - src/ui/idleVillage/questS1Lab/questLabPresets.ts
fast_checks:
  - tests/unit/idleVillage/combatStrip.test.tsx
  - tests/unit/idleVillage/questBag.test.tsx
  - tests/unit/idleVillage/questCheckOptions.test.tsx
  - tests/unit/idleVillage/questJourneyCharacterization.test.ts
  - tests/unit/idleVillage/questOutcomeToast.test.tsx
  - tests/unit/idleVillage/questPartyReal.test.ts
  - tests/unit/idleVillage/questPhaseRecord.test.ts
  - tests/unit/idleVillage/questRewardPopup.test.tsx
  - tests/unit/idleVillage/questRunWindow.test.tsx
  - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
  - tests/unit/idleVillage/questS1Lab/questExpedition.test.ts
  - tests/unit/idleVillage/questS1Lab/questFrontier.test.ts
  - tests/unit/idleVillage/questS1Lab/questOverlayIdentity.test.ts
  - tests/unit/idleVillage/questS1Lab/questSchedule.test.ts
  - tests/unit/idleVillage/questS1Lab/questSimAsync.test.ts
  - tests/unit/idleVillage/questS1Lab/questTerminalMatrix.test.ts
  - tests/unit/idleVillage/questScenarioConfig.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-lab-presets.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      I lab presets alimentano la bisaccia canonica: il filtro/identità/ordine degli item combaciano col catalogo
      authored per tutti i kind.
    test_refs:
      - tests/unit/idleVillage/questBag.test.tsx
---

# quest-lab-presets

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/questLabPresets.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/questLabPresets.ts`.

## Scope

- `src/ui/idleVillage/questS1Lab/questLabPresets.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
