---
id: game-menu-screens
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/menu/LoadGamePanel.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/menu/LoadGamePanel.tsx
  - src/ui/idleVillage/components/gameFrame/menu/GameMenuDialog.tsx
  - src/ui/idleVillage/components/gameFrame/menu/SettingsPanel.tsx
  - src/ui/idleVillage/components/gameFrame/menu/GameMenuConfirm.tsx
  - src/ui/idleVillage/components/gameFrame/menu/TitleScreen.tsx
  - src/ui/idleVillage/components/gameFrame/menu/GameEntry.tsx
  - src/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow.tsx
  - src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts
fast_checks:
  - tests/unit/idleVillage/loadGamePanel.test.tsx
  - tests/unit/idleVillage/menuFlow.test.ts
  - tests/unit/idleVillage/menuScreens.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: INV-1
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Carica elenca i quattro slot (auto e tre manuali) con il loro stato; uno slot vuoto o danneggiato non si può
      caricare
    test_refs:
      - tests/unit/idleVillage/loadGamePanel.test.tsx
  - id: INV-2
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Caricare sopra una partita con progresso non salvato chiede conferma prima di sostituirla; annullare non cambia
      nulla
    test_refs:
      - tests/unit/idleVillage/loadGamePanel.test.tsx
  - id: INV-3
    source: director-bug
    source_ref: PLAN-076
    statement: Eliminare un salvataggio chiede conferma
    test_refs:
      - tests/unit/idleVillage/loadGamePanel.test.tsx
  - id: INV-4
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      «Esci al titolo» esce subito se non c'è nulla da perdere e chiede solo quando il gioco è andato avanti dall'ultimo
      salvataggio
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: INV-5
    source: director-bug
    source_ref: PLAN-076
    statement: «Continua» riprende lo slot valido più recente; slot danneggiati o vuoti non si scelgono mai
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: INV-6
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Il titolo compare dopo un'uscita (una volta), nell'app desktop e su richiesta; una visita normale nel browser va
      dritta al gioco
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: INV-7
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Del gioco non è montato nulla dietro il titolo; «Continua» ripristina il salvataggio più recente e poi monta il
      gioco
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: INV-8
    source: director-bug
    source_ref: PLAN-076
    statement: «Nuova partita» sopra un progresso chiede prima; azzera il mondo e lo slot automatico e tiene i salvataggi manuali
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: INV-9
    source: director-bug
    source_ref: PLAN-076
    statement: «Esci dal gioco» esiste solo nell'app desktop
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: INV-10
    source: director-bug
    source_ref: PLAN-076
    statement: Le impostazioni agiscono subito; la musica non ha riga finché /game non ha musica
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: INV-11
    source: director-bug
    source_ref: PLAN-076
    statement: Uscire senza nulla da perdere esce subito; con progresso non salvato chiede, e ogni risposta fa ciò che dice
    test_refs:
      - tests/unit/idleVillage/menuScreens.test.tsx
  - id: INV-12
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Ogni chiave di testo usata dalle schermate del menu è una stringa in en e it-IT e il namespace del menu non ha
      chiavi duplicate (un duplicato trasforma in silenzio un'etichetta in un oggetto e manda in crash la pagina)
    test_refs:
      - tests/unit/idleVillage/menuI18n.test.ts
---
# game-menu-screens

Schermate del menu di gioco (PLAN-076, DN-7): Carica partita, Impostazioni, conferme di uscita/Nuova partita, schermata titolo. Fork scelti: LOAD-1 A, SET-1 A, QUIT-1 B, TITLE-1 A (card in `.mw/runs/plan076-fork/`).

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Superfici che il giocatore apre dal menu di gioco o dal titolo; pillole neutre (BTN-1 aperto), mai viola, mai placca CTA.

## Scope

- `src/ui/idleVillage/components/gameFrame/menu/LoadGamePanel.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/GameMenuDialog.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/SettingsPanel.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/GameMenuConfirm.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/TitleScreen.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/GameEntry.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts`
- `src/ui/idleVillage/components/gameFrame/menu/SettingsPanel.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/GameMenuConfirm.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/TitleScreen.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/GameEntry.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts`

<!-- /plan054:generated -->
