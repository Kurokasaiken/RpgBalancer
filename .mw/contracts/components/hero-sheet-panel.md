---
id: hero-sheet-panel
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-fam-roster
    source: director-bug
    source_ref: R-234
    statement: >-
      Teaser sheets speak the Roster family: display + serif only, no cyan/green/red as meaning, no zero rows on the
      hero sheet, readable disabled BUY (FAM-1 = A)
    test_refs:
      - tests/unit/idleVillage/famRoster.test.ts
---
# hero-sheet-panel

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Overlay zone-esente: scheda PG rail-adjacent alla card sotto il puntatore.

## Scope

- `src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `hero-sheet` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — solo coerenza visiva; overlay contract WS-2 intoccato.

<!-- /plan054:generated -->
