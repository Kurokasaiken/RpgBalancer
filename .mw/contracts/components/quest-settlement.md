---
id: quest-settlement
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/quests/questSettlement.ts
scope_files:
  - src/ui/idleVillage/quests/questSettlement.ts
fast_checks:
  - tests/unit/idleVillage/questJourneyCharacterization.test.ts
  - tests/unit/idleVillage/questOutcomeToast.test.tsx
  - tests/unit/idleVillage/questS1Lab/questOverlayIdentity.test.ts
  - tests/unit/idleVillage/quests/questSettlement.test.ts
  - tests/unit/idleVillage/quests/residentXpAndSwap.test.ts
  - tests/unit/idleVillage/quests/residentXpPersistence.test.ts
  - tests/unit/idleVillage/residentConsequences.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-settlement.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il settlement applica una sola volta: reward con gold/xp ed effetti per fato, wipe perde tutto, fuga conserva il
      bottino in mano, nessun reward con leader morto.
    test_refs:
      - tests/unit/idleVillage/quests/questSettlement.test.ts
  - id: quest-settlement.INV-2
    source: plan
    source_ref: R-260
    statement: >-
      Il journal è splittato: `beginSettlement` persiste `settling` (piano congelato + bit "report mostrato") senza
      mutare l'aggregato; `commitSettlement` applica gli effetti e persiste `settled` — su run `settling` usa il piano
      congelato, su run senza marker begin implicito, su `settled` è no-op. `settlementResourceDelta` deriva il grant
      gold/xp dal piano congelato.
    test_refs:
      - tests/unit/idleVillage/quests/questSettlement.test.ts
---

# quest-settlement

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/quests/questSettlement.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/quests/questSettlement.ts`.

## Scope

- `src/ui/idleVillage/quests/questSettlement.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
