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
  - tests/unit/idleVillage/stashDnd.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: PLAN-073-stash-dual-mode
    source: plan
    source_ref: PLAN-073
    statement: >-
      Il pannello ha due modi: read-only iff `activeStashOwner` è null o ledger non ready (righe = listitem, nessun
      button/draggable/mutazione); interattivo iff un planner è bound (righe = button + draggable `stash-item:*`,
      click → primo slot libero del planner bound, shelf = dropzone `stash-dropzone` per i `bag-item:*`).
    test_refs:
      - tests/unit/idleVillage/villageStash.test.tsx
      - tests/unit/idleVillage/stashDnd.test.ts
  - id: PLAN-073-stash-global-ledger
    source: plan
    source_ref: PLAN-073
    statement: >-
      La disponibilità è derivata dal ledger globale `useVillageStashStore` (qty config − bags − committed);
      una riga con remaining 0 sparisce e riappare al release; nessuna mutazione prima di `hydration === 'ready'`
      e nessuna scrittura su persistenza degradata.
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
---
# village-stash-panel

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Pannello scorta del villaggio — leftWing, coppia autorizzata con roster. PLAN-073 lo promuove da mock read-only a
superficie dual-mode: con un quest-planner bound (`useVillageStashStore.activeStashOwner`) le righe sono
button+draggable (`stash-item:{itemId}`), il click assegna al primo slot libero e la shelf è dropzone per i
`bag-item:{poi}:{slot}` trascinati indietro; senza binding resta la lista read-only di sempre, con disponibilità
reale derivata dal ledger globale (qty config − bags − committed). Hydration non ready ⇒ read-only con hint.

## Scope

- `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `village-stash` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep (mock) — allineare plating a Roster.
- PLAN-073 (R-240, artifact-r003 5/5 ACCEPT): da mock read-only a dual-mode ledger-driven. Ruling Director: pool globale condiviso, draft persistente con release-all per-owner (D-2), auto-bind con un solo planner aperto (D-1).

<!-- /plan054:generated -->
