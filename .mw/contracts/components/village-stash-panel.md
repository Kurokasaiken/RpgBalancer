---
id: village-stash-panel
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx
  - src/ui/idleVillage/components/gameFrame/expeditionBagAssign.ts
fast_checks:
  - tests/unit/idleVillage/villageStash.test.tsx
  - tests/unit/idleVillage/villageStashLedger.test.ts
  - tests/unit/idleVillage/villageStash.itemFace.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: PLAN-073-stash-dual-mode
    source: plan
    source_ref: PLAN-073
    statement: >-
      Il pannello ha due modi: read-only iff `activeStashOwner` è null o ledger non ready (righe = listitem, nessun
      button/mutazione); interattivo iff un planner è bound (righe = button, click → primo slot libero del planner
      bound). R-246 (Director 2026-10-21): superficie click-only — nessun drag in/out dello scaffale.
    test_refs:
      - tests/unit/idleVillage/villageStash.test.tsx
  - id: PLAN-073-stash-global-ledger
    source: plan
    source_ref: PLAN-073
    statement: >-
      La disponibilità è derivata dal ledger globale `useVillageStashStore` (qty config − bags − committed); una riga
      con remaining 0 sparisce e riappare al release; nessuna mutazione prima di `hydration === 'ready'` e nessuna
      scrittura su persistenza degradata.
    test_refs:
      - tests/unit/idleVillage/villageStashLedger.test.ts
      - tests/unit/idleVillage/villageStash.test.tsx
  - id: R-234-stash-capacity-one-source
    source: director-bug
    source_ref: R-234
    statement: >-
      La capienza dello stash ha una sola fonte: il livello del Magazzino (tier effectValue), come nel tooltip
      dell'edificio (DN-1, PLAN-067 T-A7)
    test_refs:
      - tests/unit/idleVillage/villageStash.capacity.test.ts
  - id: R-234-stash-inside-zone
    source: director-bug
    source_ref: R-234
    statement: >-
      Lo stash non supera l'altezza della zona del solver: la lista scorre dentro, titolo e piè della capienza restano a
      schermo (1280×800, PLAN-067 T-A7)
    test_refs:
      - tests/unit/idleVillage/villageStash.capacity.test.ts
  - id: village-stash-panel.INV-1
    source: director-bug
    source_ref: R-270
    statement: >-
      Stash-uniformity (R-270): la riga shelf usa la stessa item-face del planner — StashItemTile lacquer +
      StashQtyBadge angolare xN e tooltip condiviso da stashItemFace
    test_refs: 
      - tests/unit/idleVillage/villageStash.itemFace.test.tsx
  - id: village-stash-panel.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      T3-S2 (artifact-r004 D7): in modo bound ogni riga dichiara la propria eleggibilità PRIMA del click —
      `data-assign-state` = eligible | packed | bagFull, derivato via `bagAssignEligibility` sulla bag
      sparsa `bags[activeStashOwner]` (stessa logica dei reject del ledger, mai una seconda autorità:
      il click passa sempre a `store.assign`, i reject annunciano via lastEvent). Bag piena ⇒ hint
      localizzato `stash-bag-full-hint` (`gameFrame.stash.bagFullHint`) mantenuto screen-reader-only
      (R-391: nessuna scritta visibile nel footer); read-only ⇒ nessun marker.
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
  - id: village-stash-panel.INV-3
    source: plan
    source_ref: R-353
    statement: >-
      R-353 mockup + emendamento R-391/PLAN-136 (Director 2026-11-26): la shelf è una GRIGLIA 5×3
      di socket quadrati `square-socket-events-v1` nella stessa materia del controllo round Events;
      ogni `listitem` porta icona + badge ×N + nome/descrizione sr-only. I filtri kind NON stanno più
      sotto la griglia: siedono nella title row immediatamente a sinistra del close, come
      `button[data-ctl=round]` sul socket canonico `round-socket-events-v1` (`stash-filter-{id}`,
      `aria-pressed`, gruppo `stash-filters`). Ogni filtro filtra davvero lo scaffale; è view-only,
      mai una mutation. Il contatore «N / M», gli helper visivi e ogni scritta nel footer sono ritirati;
      contatore riservati/hint restano solo sr-only quando semanticamente necessari.
    test_refs:
      - tests/unit/idleVillage/r353StashGrid.test.tsx
  - id: village-stash-panel.INV-4
    source: plan
    source_ref: R-353
    statement: >-
      Nessuna card di dettaglio fissa (ritirata 2026-11-26, Director): ogni item si descrive col tooltip
      condiviso su hover/focus (nome, effetto, covers, stock). Il click assegna SOLO in modo bound, sulla
      cella stessa (`stash-item-{id}`, stessa autorità `store.assign`, reject via lastEvent); in read-only
      il click non fa nulla e non ci sono bottoni. Regola globale: `.windsurf/rules/50-interaction-patterns.md`.
    test_refs:
      - tests/unit/idleVillage/r353StashGrid.test.tsx
  - id: village-stash-panel.INV-5
    source: plan
    source_ref: R-353
    statement: >-
      Backing pieno dello stash (catena R-353 → D-20261125-clean-frame → R-391/PLAN-136): la plaque
      monta `stash-frame-no-grid.webp`, derivato deterministico pulito da `stash-frame-clean.webp`
      senza pozzetti, track scroll o contenuto vivo dipinto. Il backing resta decoro aria-hidden;
      alcove, controlli, scroll track/thumb e testi sono DOM vivo. Geometria 5×3, close/filtri in
      testata e track laterale condizionale sono contratto runtime, non pixel cotti nel backing.
    test_refs:
      - tests/unit/idleVillage/r353StashGrid.test.tsx
  - id: expedition-bag-assign.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      `bagAssignEligibility(bag, itemId, bagSlots)` specchia i reject del ledger (`alreadyInBag` /
      `bagFull`) sulla bag SPARSA del planner bound: posizioni fisse, i buchi contano come liberi,
      una bag assente vale `bagSlots` slot liberi. È una derivazione di sola lettura — la mutazione
      resta di `useVillageStashStore.assign`, mai duplicata.
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
  - id: expedition-bag-assign.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      `expeditionFoodCost(partySize, totalDays, perResidentPerDay)` = ceil(party × days × rate) —
      la stessa tariffa `globalRules.foodConsumptionPerResidentPerDay` che il TimeEngine addebita
      per tick diurno a ogni residente vivo (i membri away continuano a consumare dal pool
      condiviso). Preview display-only: non introduce un nuovo addebito; input non finiti o
      negativi collassano a 0.
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx

---
# village-stash-panel

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Pannello scorta del villaggio — leftWing, coppia autorizzata con roster. PLAN-073 lo promuove da mock read-only a
superficie dual-mode: con un quest-planner bound (`useVillageStashStore.activeStashOwner`) le righe sono
button e il click assegna al primo slot libero; senza binding resta la lista read-only di sempre, con disponibilità
reale derivata dal ledger globale (qty config − bags − committed). Hydration non ready ⇒ read-only con hint.
R-246 (Director 2026-10-21): click-only (drag&drop rimosso), header con icona `ico-chest` + pulsante minimise
(striscia `shape="hang"` con contatore `n/max`, restore `cmd-panels`), scrollbar bronzea via `data-hud-scroll`
in skinScope.css.

## Scope

- `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `village-stash` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep (mock) — allineare plating a Roster.
- PLAN-073 (R-240, artifact-r003 5/5 ACCEPT): da mock read-only a dual-mode ledger-driven. Ruling Director: pool globale condiviso, draft persistente con release-all per-owner (D-2), auto-bind con un solo planner aperto (D-1).
- R-246 (Director 2026-10-21): drag&drop rimosso — la superficie è click-only; refresh presentazione (icona header `ico-chest`, pulsante «riduci a striscia» con contatore `n/max`, scrollbar tematizzata bronzea `data-hud-scroll`).
- R-251 (Director 2026-10-21): striscia stabile — cluster `[restore][close]` negli stessi slot dell'header; guard 350ms sul restore (il secondo click di un doppio-click veloce non chiude-e-riapre); inset `10px 18px` (+4px handle) oltre la fascia `hang` (~6.5px dentro la silhouette).
- R-251 bis (Director ruling 2026-10-21): l'invariante geometrica vive nell'**header espanso** — la title row usa `paddingInline: '34px 8px'` (R-357: 34px libera la nocca ad acanto del frame corniciStash sul bordo alto; prima '12px 8px' per parità con la striscia 22/18). `controlButton` su tutte le pill icona.

- R-357 (PLAN-125, 2026-11-17): frame `corniciStash`, vero 9-slice (panel-frame3/: un unico frame completo generato AI affettato da `scripts/build-panel-frame3-9slice.py` — 4 angoli fissi + 4 bordi `background-repeat` seamless via overlap-blend; nocche ad acanto+gemma a sinistra, banda vite incisa cotta nel bordo alto `edge-top`), emblema-forziere sul bordo alto che sostituisce l'icona `ico-chest` nell'header espanso (resta nella striscia `hang`). Header: conteggio `gameFrame.stash.goodsCount` ("N of M goods") accanto al titolo. Chip categoria a smalto smeraldo con bordo champagne sull'attivo (ALL/CONSUMABLES — solo kind presenti in config). Detail card: una riga di effetto (label `questS1Lab.item.*` ora name-only; l'effetto resta in `descKey`), titolo senza a capo forzato, `data-testid="stash-goods-count"`. PACK: bottone inciso squadrato (radius 6, bordo brass, laccato) invece della pill web. Footer capacità `paddingInlineStart: 66` libera la coda dell'angolo bl.

- D-20261125 (Director ruling 2026-11-25, critique pass sul rebuild R-367): (1) il filtro kind NON sono le pillole dipinte del mockup né le pillole del roster — sono **ring sockets** nella famiglia del componente tempo/roster (`C1/ring.webp` + sede smalto + glifo inciso, halo ottone sull'attivo), gruppo centrato sulla striscia appiattita nel backing; (2) l'icona del medaglione è la normale icona painted che riempie il ring di alloro (Ø ≈ 19% panel width) — niente disco verde piatto: il backing è ripitturato (script riproducibile `scripts/hud-real/build-stash-backdrop.py`, sorgente pristine `stash-mockup-backdrop-src.webp`); (3) fix geometria griglia — il columnGap era moltiplicato ×5 e spingeva la 5ª colonna fuori scaffale, ora gap 21 backing px in cq + rowGap; (4) la faccia read-only riempie la cella come quella interattiva. INV-3 resta invariato nel contratto (radiogroup `stash-tab-*`, filtro view-only): cambia solo la forma visuale dei bottoni.

<!-- /plan054:generated -->

- D-20261125-clean-frame (Director ruling 2026-11-25, sera — «devi farti rigenerare le cose in modo pulito da gemini, non hai preso il protocollo?»): il backing NON è più l'estrazione erase-patchata del mockup — toppe procedurali bocciate (gate 3 MOCKUP-TO-PRODUCTION-PIPELINE: «se l'inpaint lascia giunte/ghost, rigenerare il frame vuoto invece di accumulare toppe»). Nuovo asset `stash-frame-clean.webp` (1147×833, aspect 1.377): rigenerazione Gemini pulita del frame firmato con TUTTO il contenuto vivo rimosso — pozzetti vuoti con rim ottone dipinti, sede smeraldo del medaglione vuota, pulsante lacca vuoto, striscia smalto liscia, zero testo/icone dipinti — scontornato con flood-fill alpha da navy #0a1622 (`scripts/hud-real/build-stash-frame-clean.py`, niente più mappa cucita nei bordi). Geometrie rimate misurate con griglia e riscritte nel componente; le celle NON ridisegnano più rim/smalto in CSS (erano loro la «cosa che copre») — `WellRim` rimosso, resta solo la piastrina cornice per l'highlight; badge ×N dentro il pozzetto. Test aggiornati: selector backdrop in r353StashGrid, numeri shrink-aspect in villageStash.capacity. Generazioni: `.mw/runs/stash-regen-20261125/` (3 immagini, budget 117/170).
