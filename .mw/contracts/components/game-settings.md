---
id: game-settings
kind: component
role: shared-kernel
tier: 2
root_file: src/ui/idleVillage/state/gameSettings.ts
scope_files:
  - src/ui/idleVillage/state/gameSettings.ts
  - src/ui/idleVillage/state/audioBus.ts
fast_checks:
  - tests/unit/idleVillage/gameSettings.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: INV-1
    source: director-bug
    source_ref: PLAN-076
    statement: I livelli audio restano tra 0 e 1; un valore senza senso torna al predefinito
    test_refs:
      - tests/unit/idleVillage/gameSettings.test.ts
  - id: INV-2
    source: director-bug
    source_ref: PLAN-076
    statement: Le impostazioni persistono e tornano dopo un ricaricamento; un record danneggiato torna ai predefiniti
    test_refs:
      - tests/unit/idleVillage/gameSettings.test.ts
  - id: INV-3
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      Ogni AudioContext creato dopo l'installazione passa da un bus master a principale×effetti, aggiornato dal vivo,
      senza creare un contesto in più
    test_refs:
      - tests/unit/idleVillage/gameSettings.test.ts
  - id: INV-4
    source: director-bug
    source_ref: PLAN-076
    statement: Il movimento ridotto è un attributo del documento a cui risponde il foglio di stile
    test_refs:
      - tests/unit/idleVillage/gameSettings.test.ts
---
# game-settings

Impostazioni del giocatore (PLAN-076 T-4): livelli audio principale/effetti/musica, movimento ridotto. Persistite con la lingua e la dimensione interfaccia già esistenti (che restano nei loro store).

<!-- plan054:notes -->

**Mappatura cue→canale (O-3).** Nessun suono di `/game` è musica: tutte le sorgenti (cue del teatro di quest, astrolabio, level-up, tonfo della card d'invasione, suoni slot/medaglie) sono *effetti*. Non esiste un contesto audio unico (ogni superficie ne crea uno); `installAudioBus()` rende `window.AudioContext` una sottoclasse il cui `destination` è un nodo gain master per contesto, così ogni sorgente passa dal bus senza toccare i suoi file. Bus = principale × effetti. Il canale `musica` è nel modello e nel salvataggio ma senza sorgenti: la sua barra non compare finché non ne esiste una.

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Stato delle impostazioni, persistenza, bus audio.

## Scope

- `src/ui/idleVillage/state/gameSettings.ts`
- `src/ui/idleVillage/state/audioBus.ts`

<!-- /plan054:generated -->
