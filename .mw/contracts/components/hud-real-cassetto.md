---
id: hud-real-cassetto
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/hudReal/HudRealCassetto.tsx
scope_files:
  - src/ui/idleVillage/hudReal/HudRealCassetto.tsx
  - src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx
  - src/ui/idleVillage/store/useGameLayoutInsets.ts
fast_checks:
  - tests/unit/idleVillage/r337CassettoBagSlots.test.tsx
  - tests/unit/idleVillage/r339ExpeditionStates.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-real-cassetto.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      Ogni leg del journey mostra "N days" localizzato (ICU plural, mai la forma ambigua "Nd") e, quando
      `quest.totalDays` è fornito, la riga `cassetto-journey-total` mostra "Total: N days" dalla stessa config.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionStates.test.tsx
  - id: hud-real-cassetto.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      CONFIRM disabilitato mostra il motivo inline (`cassetto-confirm-reason`) nel band sopra la placca e
      `aria-describedby` lo collega al bottone; abilitato o senza motivo → nessun elemento reason.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionStates.test.tsx
  - id: hud-real-cassetto.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il tap su uno slot party VUOTO (unico evento che il rack emette su seat vuoto) è cablato a
      `onOpenRoster` → `panels.set('roster', true)` nella pagina; il Detail converte la prop.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionStates.test.tsx
  - id: hud-real-cassetto.INV-4
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il drawer pubblica la propria larghezza renderizzata in `useGameLayoutInsets.insets.right` al mount e
      la azzera allo smontaggio — fondazione per safeFit/pan-clamp. La larghezza è `aspect × viewportH`
      cappata a `CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPx` (clamp T1: sopra la soglia la colonna si accorcia,
      l'art non si distorce).
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionStates.test.tsx
  - id: hud-real-cassetto.INV-5
    source: plan
    source_ref: PLAN-119
    statement: >-
      T3-S2: `quest.costPreview` riempie `cassetto-cost-slot` con caption localizzata
      (`gameFrame.cassetto.cost`), icona `res-<icon>-64` e qty; `insufficient` applica il tono
      danger (`data-tone="danger"`). Il Detail la deriva da
      `expeditionFoodCost(partySize, totalDays, globalRules.foodConsumptionPerResidentPerDay)`
      confrontata alla food viva della readout; i bag-slot frames specchiano il ledger sparso
      `bags[poi.id]` (posizioni fisse — mai re-index denso di `selectedItemIds`).
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
      - tests/unit/idleVillage/r337CassettoBagSlots.test.tsx
---
