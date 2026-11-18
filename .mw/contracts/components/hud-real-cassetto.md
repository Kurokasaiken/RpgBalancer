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
      Anche con `quest.costPreview` fornito non viene dipinta nessuna cost cell
      (`cassetto-cost-slot`/`cassetto-cost-value`) — il costo vive nel flusso supplies del
      planner (R-357 rebuild, D-1; statement amendato: il vecchio T3-S2 con cost cell dedicata
      è superato). I bag-slot frames specchiano il ledger sparso `bags[poi.id]` (posizioni
      fisse — mai re-index denso di `selectedItemIds`).
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
      - tests/unit/idleVillage/r337CassettoBagSlots.test.tsx
  - id: cassetto-no-resources-band
    source: plan
    source_ref: PLAN-125
    statement: >-
      Il cassetto rebuilt non renderizza nessuna banda risorse né arte di colonna baked
      (`data-cassetto-resources`, `data-cassetto-res=`, `column-1440|column-1280`,
      `cassettoColumnGeometry` assenti dal markup — R-357 D-1, supersedes R-335).
    test_refs:
      - tests/unit/idleVillage/r335CassettoResources.test.ts
  - id: cassetto-no-cost-cell
    source: plan
    source_ref: PLAN-125
    statement: >-
      Anche quando `quest.costPreview` è fornito, nessuna cost cell o valore è dipinto nel
      cassetto (`cassetto-cost-slot`/`cassetto-cost-value` assenti dal DOM).
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
  - id: cassetto-art-no-stray-rules
    source: plan
    source_ref: PLAN-125
    statement: >-
      Nessuna righetta luminosa verticale dentro il pozzetto risk/rewards del cassetto
      rebuilt (R-357).
    test_refs:
      - tests/unit/idleVillage/r357CassettoFrame.test.ts
  - id: cassetto-captions-min-size
    source: plan
    source_ref: PLAN-125
    statement: >-
      Le captions del cassetto rebuilt rispettano la dimensione minima leggibile (R-357 2i/2h).
    test_refs:
      - tests/unit/idleVillage/r357CassettoLabels.test.tsx
  - id: cassetto-risk-pending-muted
    source: plan
    source_ref: PLAN-125
    statement: >-
      Le voci di rischio in pending nel cassetto sono rese in tono muted, mai accentuato
      (R-357 2h).
    test_refs:
      - tests/unit/idleVillage/r357CassettoLabels.test.tsx
  - id: cassetto-no-block-titles
    source: plan
    source_ref: PLAN-125
    statement: >-
      I titoli di blocco PARTY SLOTS / SUPPLIES / JOURNEY / RISK & REWARDS non sono scritti
      nel cassetto rebuilt — lo spazio va agli slot (R-357).
    test_refs:
      - tests/unit/idleVillage/r357CassettoLabels.test.tsx
  - id: cassetto-close
    source: plan
    source_ref: PLAN-125
    statement: >-
      Esc e il bottone × chiudono il planner cassetto (R-357).
    test_refs:
      - tests/unit/idleVillage/r357CassettoLabels.test.tsx
  - id: cassetto-supplies-scroll
    source: plan
    source_ref: PLAN-125
    statement: >-
      Le supplies del cassetto sono centrate e scorrono lateralmente quando non entrano
      (R-357).
    test_refs:
      - tests/unit/idleVillage/r357CassettoLabels.test.tsx
  - id: cassetto-slide-lateral
    source: plan
    source_ref: PLAN-125
    statement: >-
      Il drawer entra con la keyframe `cassettoSlideIn` per `drawer.slideMs` ed esce con
      `cassettoSlideOut`, foldando solo dopo la fine dello slide (R-357).
    test_refs:
      - tests/unit/idleVillage/r357DrawerSlide.test.tsx
  - id: hud-real-cassetto.INV-6
    source: director-bug
    source_ref: R-359
    statement: R-359 medallion drag regressions on /game
    test_refs:
      - tests/unit/idleVillage/hudRealCassettoSlotSwap.test.tsx
---
