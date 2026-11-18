---
id: CTR-game-011
kind: integration
components:
  - game-entry
  - game-menu-confirm
  - game-menu-dialog
  - load-game-panel
  - settings-panel
  - title-screen
  - menu-flow
  - use-game-menu-flow
external_dependencies: []
fast_checks:
  - tests/unit/idleVillage/loadGamePanel.test.tsx
  - tests/unit/idleVillage/menuFlow.test.ts
  - tests/unit/idleVillage/menuScreens.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: game-menu-screens.INV-1
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Carica elenca i quattro slot (auto e tre manuali) con il loro stato; uno slot vuoto o danneggiato non si può
      caricare
    test_refs:
      - tests/unit/idleVillage/loadGamePanel.test.tsx
  - id: game-menu-screens.INV-2
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Caricare sopra una partita con progresso non salvato chiede conferma prima di sostituirla; annullare non cambia
      nulla
    test_refs:
      - tests/unit/idleVillage/loadGamePanel.test.tsx
  - id: game-menu-screens.INV-3
    source: director-bug
    source_ref: PLAN-076
    statement: Eliminare un salvataggio chiede conferma
    test_refs:
      - tests/unit/idleVillage/loadGamePanel.test.tsx
  - id: game-menu-screens.INV-4
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      «Esci al titolo» esce subito se non c'è nulla da perdere e chiede solo quando il gioco è andato avanti dall'ultimo
      salvataggio
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: game-menu-screens.INV-5
    source: director-bug
    source_ref: PLAN-076
    statement: «Continua» riprende lo slot valido più recente; slot danneggiati o vuoti non si scelgono mai
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: game-menu-screens.INV-6
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Il titolo compare dopo un'uscita (una volta), nell'app desktop e su richiesta; una visita normale nel browser va
      dritta al gioco
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: game-menu-screens.INV-7
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Del gioco non è montato nulla dietro il titolo; «Continua» ripristina il salvataggio più recente e poi monta il
      gioco
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: game-menu-screens.INV-8
    source: director-bug
    source_ref: PLAN-076
    statement: «Nuova partita» sopra un progresso chiede prima; azzera il mondo e lo slot automatico e tiene i salvataggi manuali
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: game-menu-screens.INV-9
    source: director-bug
    source_ref: PLAN-076
    statement: «Esci dal gioco» esiste solo nell'app desktop
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: game-menu-screens.INV-10
    source: director-bug
    source_ref: PLAN-076
    statement: Le impostazioni agiscono subito; la musica non ha riga finché /game non ha musica
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: game-menu-screens.INV-11
    source: director-bug
    source_ref: PLAN-076
    statement: Uscire senza nulla da perdere esce subito; con progresso non salvato chiede, e ogni risposta fa ciò che dice
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: game-menu-screens.INV-12
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Ogni chiave di testo usata dalle schermate del menu è una stringa in en e it-IT e il namespace del menu non ha
      chiavi duplicate (un duplicato trasforma in silenzio un'etichetta in un oggetto e manda in crash la pagina)
    test_refs:
      - tests/unit/idleVillage/menuI18n.test.ts
  - id: game-menu-screens.INV-13
    source: director-bug
    source_ref: R-322
    statement: >-
      Dalla schermata del titolo i pannelli Impostazioni, Carica e conferma Nuova partita si aprono SOTTO il titolo
      (dialoghi su zLayers.questCheck 30, titolo su boot 40) e restano invisibili
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: game-menu-screens.INV-14
    source: director-spec
    source_ref: R-322
    statement: >-
      Impostazioni ha la Qualità grafica (Automatica, Alta, Media, Bassa; PLAN-115 D4, «Sì, nelle impostazioni»): la
      scelta vale subito, si salva con le altre impostazioni e /game carica la mappa con il profilo corrispondente
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
      - tests/unit/idleVillage/mappa2Tiers.test.ts
---

# CTR-game-011 — game menu screens (integration)

Contratto-ombrello per le schermate del menu di gioco (PLAN-076, DN-7): Carica partita, Impostazioni,
conferme di uscita/Nuova partita, schermata titolo. Fork scelti: LOAD-1 A, SET-1 A, QUIT-1 B, TITLE-1 A
(card in `.mw/runs/plan076-fork/`).

Migrazione 2026-11-18 (PLAN-126 OB-6 debt, Director-approved): ex `game-menu-screens` era un contratto
`component` che claimava 8 file già posseduti dalle unità dedicate della partizione PLAN-054 → violazioni
STRICT_FILES a 2 owner. Convertito in `kind: integration` sulle unità componenti; invarianti preservati
verbatim con gli id storici `game-menu-screens.INV-*` (i marker `// INV:` nei test restano validi).
