---
id: expedition-bottom-sheet
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/ExpeditionBottomSheet.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/ExpeditionBottomSheet.tsx
  - src/ui/idleVillage/store/useExpeditionSheet.ts
fast_checks:
  - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: expedition-bottom-sheet.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il bottom-sheet expedition è non-modale (AC9): nessuno scrim, nessun focus trap, mai
      `role="dialog"`/`aria-modal`. Il wrapper copre il viewport con `pointer-events: none`
      e solo il box dello sheet prende input (`pointer-events: auto`) — la mappa resta
      interattiva ovunque fuori dallo sheet.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
  - id: expedition-bottom-sheet.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      Lo sheet ha tre detent dai token `cassettoLayoutConfig.bottomSheet` (D5): `peek`
      (`peekPx` + `env(safe-area-inset-bottom)` — la riga CTA visibile), `half`
      (`halfFraction` vh), `full` (`fullFraction` vh). Il detent vive in `useExpeditionSheet`
      (Zustand) e persiste tra remount come intenzione utente; il chevron della strip
      toggla peek ⇄ expanded come affordance non-drag.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
  - id: expedition-bottom-sheet.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il drag esiste SOLO sulla strip handle+header (`touch-action: none`, ≥44px):
      pointerdown sulla strip traccia il gesto (live height clampata peek↔full) e il
      rilascio snap al detent più vicino. Il body scrolla e non dragga mai; i figli
      interattivi della strip (CONFIRM, chevron) non iniziano un drag.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
  - id: expedition-bottom-sheet.INV-4
    source: plan
    source_ref: PLAN-119
    statement: >-
      Stessa superficie planner del cassetto, stessi sei blocchi nominati `data-block`
      (`quest-banner`, `party-slots`, `bag-slots`, `journey-strip`, `risk-rewards`,
      `launch-cta`) e stessi testid (`cassetto-confirm`, `cassetto-confirm-reason`,
      `cassetto-journey-total`, `cassetto-cost-slot`, `bag-slot-*`, `loadout-item-*`):
      `launch-cta` (reason inline + CONFIRM con `--skin-cassetto-cta-*` da `cta.vars`)
      siede nella strip sempre visibile, gli altri blocchi nel body scrollabile. La cella
      costo mantiene il contratto segnaposto flaggato; rack `ResidentSlotRack` reale.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
  - id: expedition-bottom-sheet.INV-5
    source: plan
    source_ref: PLAN-119
    statement: >-
      Occupazione onesta: l'altezza misurata dello sheet pubblica
      `useGameLayoutInsets.insets.bottom` (fallback al token del detent quando la misura
      non è disponibile); `insets.right` resta sempre 0 in questa banda (la superficie
      laterale non esiste); smontaggio o `visible=false` → 0.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
  - id: expedition-bottom-sheet.INV-6
    source: plan
    source_ref: PLAN-119
    statement: >-
      Touch targets e testo da AC10: strip handle, CONFIRM e chevron ≥`handlePx` (44);
      slot party/bag a `slotPx`; testo utente ≥`minTextPx` (16) in tutto lo sheet.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
  - id: expedition-bottom-sheet.INV-7
    source: plan
    source_ref: PLAN-119
    statement: >-
      Mutua esclusione delle superfici laterali ≤`bottomSheet.maxWidthPx` (1100,
      boundary incluso — verificato a 1024 e 1100, AC10): `ExpeditionDrawer` in quella
      banda monta lo sheet via `useExpeditionSheetMode` e la colonna firmata + entrambi
      i chip non montano mai, anche con il drawer ripiegato; la pagina esclude
      `ExpeditionEdgeTab` sulla stessa soglia (`win.w > maxWidthPx`). Sopra 1100 il
      drawer mantiene la colonna.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionSheet.test.tsx
---
# expedition-bottom-sheet

Forma mobile/narrow della superficie expedition (R-339/PLAN-119 T8,
artifact-r004 D5): bottom-sheet non-modale con detent peek/half/full,
drag solo dalla strip handle 44px, safe-area su peek, mutua esclusione
delle superfici laterali ≤1100px. Stessi sei blocchi nominati e testid
del cassetto; il CONFIRM riusa i token `--skin-cassetto-cta-*` dichiarati
in `cta.vars`. Montato da `ExpeditionDrawer` quando `useExpeditionSheetMode`
(matchMedia `max-width: 1100px`) è attivo — stesso wiring su /game (via
`HudRealCassettoDetail`/`wrapDetail`) e nel lab `/hud-compose?comp=cassetto`.
Nota scope: la parte "stash = terzo tab" di D5 è superata dal ruling
Director 2026-11-15 (roster e stash restano superfici sempre separate) —
lo sheet non ospita tab roster/stash.
