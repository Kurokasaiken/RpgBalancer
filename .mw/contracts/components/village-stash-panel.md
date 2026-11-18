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
      localizzato `stash-bag-full-hint` (`gameFrame.stash.bagFullHint`); read-only ⇒ nessun marker.
    test_refs:
      - tests/unit/idleVillage/r339BagAssign.test.tsx
  - id: village-stash-panel.INV-3
    source: plan
    source_ref: R-353
    statement: >-
      R-353 mockup (mockup-stash-grid.jpg, ruling Director: restyle estetico, pannelli flottanti): la
      shelf è una GRIGLIA di celle tile — ogni `listitem` porta la StashItemTile condivisa (lacca +
      badge angolare ×N) e nome/descrizione come testo sr-only, stesso vocabolario su entrambe le
      modalità. Sopra la griglia un `radiogroup` di tab kind derivato dai `kind` presenti in config
      (`stash-tab-all`/`stash-tab-{kind}`, role=radio, filtro view-only: mai una mutation).
    test_refs:
      - tests/unit/idleVillage/r353StashGrid.test.tsx
  - id: village-stash-panel.INV-4
    source: plan
    source_ref: R-353
    statement: >-
      Detail card (`stash-detail`): preview dell'ultimo item hover/focus (sticky, fallback alla prima
      riga visibile) nel vocabolario tooltip condiviso (nome, effetto, covers, stock). L'affordance
      `stash-pack-detail` esiste SOLO in modo bound e passa per la stessa autorità `store.assign`
      delle celle (reject via lastEvent); in read-only la card è informativa senza bottoni extra.
    test_refs:
      - tests/unit/idleVillage/r353StashGrid.test.tsx
  - id: village-stash-panel.INV-5
    source: plan
    source_ref: R-353
    statement: >-
      Cornice ornata del mockup (ruling Director «anche la cornice del mockup x entrambi»): la
      plaque del pannello monta `PanelFrameOrnaments` (`data-panel-frame="ornate"`) — quattro
      angoli in filigrana ottone/smeraldo firmati (famiglia cassetto R-323) sopra il bordo +
      filetto interno. Puro decoro (aria-hidden, pointer-events none): non tocca header, tab,
      griglia, detail né alcun anchor di contratto.
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

<!-- /plan054:generated -->
