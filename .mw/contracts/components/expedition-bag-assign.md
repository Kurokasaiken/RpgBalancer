---
id: expedition-bag-assign
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/expeditionBagAssign.ts
scope_files:
  - src/ui/idleVillage/components/gameFrame/expeditionBagAssign.ts
  # Consumers live in their own contracts — cross-references in prose only:
  # VillageStashPanel.tsx (village-stash-panel), HudRealCassetto*.tsx
  # (hud-real-cassetto). Keeping them out of scope_files avoids two-owner
  # partition drift (foreign `gameFrame/menu/*` drift already pending).
fast_checks:
  - tests/unit/idleVillage/r339BagAssign.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: expedition-bag-assign.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      `bagAssignEligibility(bag, itemId, bagSlots)` specchia i reject del ledger (`alreadyInBag` /
      `bagFull`) sulla bag SPARSA del planner bound: posizioni fisse, i buchi contano come liberi,
      una bag assente vale `bagSlots` slot liberi. È una derivazione di sola lettura — la mutazione
      resta di `useVillageStashStore.assign`, mai duplicata.
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
  - id: expedition-bag-assign.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      `expeditionFoodCost(partySize, totalDays, perResidentPerDay)` = ceil(party × days × rate) —
      la stessa tariffa `globalRules.foodConsumptionPerResidentPerDay` che il TimeEngine addebita
      per tick diurno a ogni residente vivo (i membri away continuano a consumare dal pool
      condiviso). Preview display-only: non introduce un nuovo addebito; input non finiti o
      negativi collassano a 0.
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
---
# expedition-bag-assign

Helper puri R-339/PLAN-119 T3-S2 (artifact-r004 D7 + S2 «consequence
preview»): eleggibilità di assegnazione alla sacca del planner bound e
costo cibo della spedizione. Letti dalla `VillageStashPanel` (marker
`data-assign-state` + hint bag-full) e dal cassetto (`cassetto-cost-slot`
via `quest.costPreview`); il lab `/hud-compose?comp=cassetto` usa la
stessa formula per il testimone. Nessuno stato UI, nessun side effect —
`useVillageStashStore` resta l'unica autorità di mutazione.
