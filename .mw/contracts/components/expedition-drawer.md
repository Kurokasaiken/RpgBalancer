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
    source_ref: PLAN-119; amended R-374 OB-7 γ + ruling Director 2026-11-22 (chip › rimossa)
    statement: >-
      Con una quest selezionata la superficie drawer esiste in UNA sola forma: la colonna firmata
      `HudRealCassettoV2` docked flush-right. NESSUN fold: il collapse chip sul bordo sinistro della
      colonna e il chip ripiegato sul bordo destro sono rimossi (Director 2026-11-22: «c'è una specie
      di freccia › — eliminala», sigillo di OB-7 γ «il cassetto resta chiuso senza tab»).
      La forma di riposo senza quest è ASSENTE (R-351): chiusura solo via adapter (Esc / click mappa →
      `onClose`), mai una terza forma docked.
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
    source_ref: PLAN-119; amended R-374 OB-7 γ (nessun fold ⇒ nessuna occupazione chip)
    statement: >-
      Occupazione onesta in `useGameLayoutInsets.insets.right`: espanso la colonna pubblica la propria
      larghezza misurata (hud-real-cassetto.INV-4); smontaggio o `visible=false` → 0. Non esiste una
      forma ripiegata, quindi nessun `chipWidthPx` viene mai pubblicato.
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
    source_ref: PLAN-119; amended R-374 OB-7 γ + ruling Director 2026-11-22
    statement: >-
      Il fold NON ESISTE PIÙ: nessuna forma ripiegata, nessun chip. `useExpeditionDrawer` resta nel
      repo come store vestigiale per compat (test/steering esterno) ma il drawer non lo legge —
      montato ⇒ sempre espanso; lo stato sessione (slot, bag, estimate) non viene mai toccato.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionDrawer.test.tsx
---
# expedition-drawer

Primitiva drawer expedition di /game (R-339/PLAN-119 T2, artifact-r004):
wrapper docked del `HudRealCassettoV2` firmato — UNA sola forma (colonna
espansa; nessun fold/chip, ruling Director 2026-11-22 che sigilla OB-7 γ)
con i sei blocchi nominati del mockup marcati `data-block` nell'art
column. Occupazione pubblicata in `useGameLayoutInsets.insets.right`. Montato da
`HudRealCassettoDetail` su /game (via `wrapDetail`) e da
`HudRealCassettoHost` nel lab `/hud-compose?comp=cassetto`.
