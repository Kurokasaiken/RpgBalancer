---
id: roster-stash-rail
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/RosterStashRail.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/RosterStashRail.tsx
fast_checks:
  - tests/unit/idleVillage/r339RosterStashRail.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: roster-stash-rail.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      La colonna è docked a `left: 0` (mai overlay né flottante) e pubblica la propria occupazione reale in
      `useGameLayoutInsets.insets.left`: `rail.widthPx` espansa, `rail.chipWidthPx` ripiegata, 0 quando
      nascosta o smontata — la matematica della mappa libera la sottrae sempre.
    test_refs:
      - tests/unit/idleVillage/r339RosterStashRail.test.tsx
  - id: roster-stash-rail.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il contenuto è guidato da tab segmentati Roster|Stash: il tab Roster mostra una riga per membro con
      ritratto, nome, badge livello, etichetta di stato e le barre dichiarate in `rail.bars` (metrica,
      labelKey e token di fill dalla config — mai hardcoded); il tab Stash mostra i chip compatti delle
      statistiche membro seguiti dalle righe ledger (icona + nome + UNA riga effetto ellissata) lette da
      `villageStashViewModel`, con click→assign identico al magazzino quando `activeStashOwner` è bound.
    test_refs:
      - tests/unit/idleVillage/r339RosterStashRail.test.tsx
  - id: roster-stash-rail.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      La colonna è persistente e montata espansa di default (D2): l'unica forma ripiegata è il collapse
      chip sul bordo sinistro, e il tab selezionato sopravvive alla piega — `open(tab)` la riporta espansa
      sulla tab richiesta (destinazione del tap su seat party vuoto del cassetto, ex INV-3 cassetto).
    test_refs:
      - tests/unit/idleVillage/r339RosterStashRail.test.tsx
  - id: roster-stash-rail.INV-4
    source: plan
    source_ref: PLAN-119
    statement: >-
      Sotto `rail.mutualExclusionBelowPx` una sola superficie laterale è espansa: il drawer aperto
      (`insets.right > 0`) ripiega la rail marcando il fold come mutex-owned e lo ripristina quando il
      drawer cede; un collapse utente non auto-ripristina. In direzione opposta, l'espansione esplicita
      della rail chiude il detail del drawer (effetto pagina, `game-mappa2`).
    test_refs:
      - tests/unit/idleVillage/r339RosterStashRail.test.tsx
  - id: roster-stash-rail.INV-5
    source: plan
    source_ref: PLAN-119
    statement: >-
      L'altezza massima della colonna termina sopra il bounding box del medaglione bottom-left (D8): il
      bordo inferiore è `rail.bottomInsetPx` dalla config — token esplicito, mai un valore hardcoded nel
      componente — e il margine superiore è `rail.marginPx`.
    test_refs:
      - tests/unit/idleVillage/r339RosterStashRail.test.tsx
---
# roster-stash-rail

Colonna sinistra docked Roster|Stash di /game (R-339/PLAN-119 T5, artifact-r004
D1/D2/D8): persistente di default, tab segmentati, occupancy pubblicata nel
ledger `useGameLayoutInsets`, mutual exclusion con il drawer destro sotto 1100px.
Primitivi riusati: `HudPlaque`, `EngravedIcon`, `StashItemTile`,
`villageStashViewModel`, `zanaraRosterState`, `heroLevelView`,
`getResidentPortraitUrl` — nessuna superficie duplicata.
