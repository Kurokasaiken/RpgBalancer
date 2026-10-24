---
id: village-registry
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-registry-rows-own-geometry
    source: director-bug
    source_ref: R-234
    statement: >-
      Dentro lo scope data-hud-controls le righe e le testate del registro hanno la propria geometria: niente altezza
      fissa da pillola, niente line-height 1, niente maiuscolo forzato (T-03, PLAN-067 T-A10)
    test_refs:
      - tests/unit/idleVillage/villageRegistry.scopeLeak.test.tsx
  - id: village-registry.INV-1
    source: director-bug
    source_ref: R-270
    statement: >-
      Riga registry 'Palisade — Defense · Built · On the map' a cavallo del fold scroll di 14.4px (Sentinel
      fold-straddle, S3, run 0829)
    test_refs: 
      - tests/unit/idleVillage/villageRegistry.foldCap.test.tsx
  - id: village-registry.INV-2
    source: director-bug
    source_ref: R-270
    statement: >-
      Section headers 380x24px sotto il minimo 32px (LIST_BUTTON_RESET height:auto + contenuto 24px; Sentinel
      small-target S3)
    test_refs: 
      - tests/unit/idleVillage/villageRegistry.headerMinHeight.test.tsx
---
# village-registry

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Drawer catalogo edifici + drill-in card (PLAN-042).

## Scope

- `src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `village-registry` (batch B3-village, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — fix font; stato — implemented — tutti i font <12px → 12px.

<!-- /plan054:generated -->
