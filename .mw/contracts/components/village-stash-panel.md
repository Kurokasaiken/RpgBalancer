---
id: village-stash-panel
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx
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
- R-251 bis (Director ruling 2026-10-21): l'invariante geometrica vive nell'**header espanso** — la title row usa `paddingInline: '12px 8px'` (placca 10 + riga 12/8 = il content box 22/18 della striscia): il collapse cambia il glifo del toggle, mai la geometria (misurato dx=0/dy=0 su chest/toggle/close). `controlButton` su tutte le pill icona.

<!-- /plan054:generated -->
