---
id: game-save
kind: component
role: shared-kernel
tier: 2
root_file: src/ui/idleVillage/state/gameSave.ts
scope_files:
  - src/ui/idleVillage/state/gameSave.ts
  - src/ui/idleVillage/state/gameSaveService.ts
  - src/ui/idleVillage/state/useGameAutosave.ts
fast_checks:
  - tests/unit/idleVillage/gameSave.test.ts
  - tests/unit/idleVillage/gameSaveService.test.ts
  - tests/unit/idleVillage/useGameAutosave.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: INV-1
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Il salvataggio contiene tutte le chiavi di progresso (gameplay, villaggio, invasione, POI, run di quest, bozze),
      non solo lo store gameplay
    test_refs:
      - tests/unit/idleVillage/gameSave.test.ts
  - id: INV-2
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Il ripristino rimette l'intero mondo e rimuove il progresso che il salvataggio non ha; le preferenze non si
      toccano
    test_refs:
      - tests/unit/idleVillage/gameSave.test.ts
  - id: INV-3
    source: director-bug
    source_ref: PLAN-076
    statement: Un salvataggio corrotto o di versione più nuova viene rifiutato senza scrivere nulla
    test_refs:
      - tests/unit/idleVillage/gameSave.test.ts
  - id: INV-4
    source: director-bug
    source_ref: PLAN-076
    statement: Una scrittura che fallisce a metà lascia intatto il mondo precedente (tutto o niente)
    test_refs:
      - tests/unit/idleVillage/gameSave.test.ts
  - id: INV-5
    source: director-bug
    source_ref: PLAN-076
    statement: Lo slot autosalvataggio è separato dai tre manuali; l'elenco distingue vuoto, valido, corrotto
    test_refs:
      - tests/unit/idleVillage/gameSave.test.ts
  - id: INV-6
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      «Salva ora» salva l'intera partita (run di quest, invasione, dispensa) dopo aver scritto lo stato vivo, non il
      solo store gameplay
    test_refs:
      - tests/unit/idleVillage/gameSaveService.test.ts
  - id: INV-7
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      «Salva ora» scrive nello slot in uso, altrimenti nel primo vuoto, altrimenti nel più vecchio; mai nello slot
      autosalvataggio
    test_refs:
      - tests/unit/idleVillage/gameSaveService.test.ts
  - id: INV-8
    source: director-bug
    source_ref: PLAN-076
    statement: Caricare uno slot ripristina il mondo salvato e diventa la base di confronto per il progresso non salvato
    test_refs:
      - tests/unit/idleVillage/gameSaveService.test.ts
  - id: INV-9
    source: director-bug
    source_ref: PLAN-076
    statement: L'autosalvataggio aggiorna solo lo slot auto, a intervallo, e solo se il clock è avanzato; mai uno slot manuale
    test_refs:
      - tests/unit/idleVillage/useGameAutosave.test.ts
---
# game-save

Pacchetto di salvataggio dell'intera partita (PLAN-076 T-1, DN-7). Root: `src/ui/idleVillage/state/gameSave.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Cattura e ripristina in modo atomico e versionato tutte le chiavi di progresso (`gameProgressKeys()` + bozze), in uno slot (`auto`, `slot-1..3`).

## Scope

- `src/ui/idleVillage/state/gameSave.ts`
- `src/ui/idleVillage/state/gameSaveService.ts`
- `src/ui/idleVillage/state/useGameAutosave.ts`

## Decision history

- PLAN-076 (Director 2026-10-22): 3 slot manuali + 1 autosalvataggio, rotazione singola.

<!-- /plan054:generated -->
