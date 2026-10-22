---
id: drag-test-container-v2
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx
scope_files:
  - src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx
fast_checks:
  - tests/unit/idleVillage/rosterV2Controls.test.tsx
e2e_checks:
  - tests/e2e/idleVillage/gameFirstInteraction.spec.ts
e2e_trigger_globs: []
invariants:
  - id: drag-test-container-v2.INV-1
    source: director-bug
    source_ref: R-238
    statement: >-
      Ogni punto dell'area visibile dei pill filtro/sort hit-testa al `<select>` nativo (select trasparente esteso su
      tutta la label, valore replicato sotto): il gesto diretto apre il picker ovunque sul pill, non solo sul rettangolo
      nativo (R-238 Bug B)
    test_refs:
      - tests/e2e/idleVillage/gameFirstInteraction.spec.ts
  - id: drag-test-container-v2.INV-2
    source: director-bug
    source_ref: R-257
    statement: >-
      Roster filtrato: assign/remove cambia il set filtrato — con scrollbar classica la banda verticale ruba larghezza
      interna → banda orizzontale + reflow ('resize con le bande'). La lista deve pinnare la geometria: overflow-x
      hidden + scrollbar-gutter riservato, mai bande che appaiono/scompaiono.
    test_refs:
      - tests/unit/idleVillage/rosterV2Controls.test.tsx
---
# drag-test-container-v2

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx`.

## Scope

- `src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
