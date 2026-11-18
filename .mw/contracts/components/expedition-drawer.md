---
id: expedition-drawer
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/ExpeditionDrawer.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/ExpeditionDrawer.tsx
fast_checks:
  - tests/unit/idleVillage/r339ExpeditionDrawer.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: expedition-drawer.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      Con una quest selezionata la superficie drawer esiste in due sole forme: la colonna firmata
      `HudRealCassetto` docked flush-right (espansa) oppure il chip sottile docked sullo stesso bordo
      destro (ripiegata). Il fold chip siede sul bordo sinistro vivo della colonna — offset
      `min(aspect × 100vh, drawer.widthMaxPx)`, la stessa regola di larghezza della colonna.
      La forma di riposo senza quest est ABSENTE (R-351 : l'ancien `ExpeditionEdgeTab` a été
      supprimé — aucune surface expedition ne monte sans quest sélectionnée), non un modo du drawer.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionDrawer.test.tsx
  - id: expedition-drawer.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      L'interno del drawer è partizionato nei sei blocchi nominati del mockup via wrapper
      `display:contents` marcati `data-block`: `quest-banner`, `party-slots`, `bag-slots`,
      `journey-strip`, `risk-rewards`, `launch-cta` — markup in `HudRealCassetto.tsx` (file owned dal
      contratto `hud-real-cassetto`), delta di layout nullo.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionDrawer.test.tsx
  - id: expedition-drawer.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      Occupazione onesta in `useGameLayoutInsets.insets.right`: ripiegato il chip pubblica
      `drawer.chipWidthPx`; espanso la colonna continua a pubblicare la propria larghezza misurata
      (hud-real-cassetto.INV-4) senza essere clobberata; smontaggio o `visible=false` → 0.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionDrawer.test.tsx
  - id: expedition-drawer.INV-4
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il blocco `risk-rewards` riserva la cella costo (`cassetto-cost-slot`) tra rischio e ricompense
      per la preview food-cost: senza `quest.costPreview` resta il segnaposto flaggato
      (`data-placeholder` = cost-preview, `aria-hidden`); con la preview (T3-S2) mostra caption
      localizzata + icona + qty — in entrambe le forme `pointer-events: none`, mai interattiva,
      nessuna superficie dipinta sull'arte firmata.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionDrawer.test.tsx
      - tests/unit/idleVillage/r339BagAssign.test.tsx
  - id: expedition-drawer.INV-5
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il fold è solo visivo: collassare non chiude mai il detail né tocca lo stato della sessione
      (slot, bag, estimate restano); `useExpeditionDrawer.expanded` persiste tra remount e switch
      di quest come intenzione dell'utente (mirror del contratto rail, D2 "state preserved").
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionDrawer.test.tsx
---
# expedition-drawer

Primitiva drawer expedition di /game (R-339/PLAN-119 T2, artifact-r004):
wrapper docked del `HudRealCassetto` firmato con il contratto di piega a
chip (mirror della rail T5) e i sei blocchi nominati del mockup marcati
`data-block` nell'art column. Stato fold in `useExpeditionDrawer` (Zustand);
occupazione pubblicata in `useGameLayoutInsets.insets.right`. Montato da
`HudRealCassettoDetail` su /game (via `wrapDetail`) e da
`HudRealCassettoHost` nel lab `/hud-compose?comp=cassetto`.
